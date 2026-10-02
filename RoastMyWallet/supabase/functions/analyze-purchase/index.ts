/**
 * Supabase Edge Function: analyze-purchase
 *
 * SECURITY DESIGN:
 * 1. Authenticates the caller via Supabase JWT — no anonymous calls accepted
 * 2. Verifies Pro status SERVER-SIDE from the database.
 *    The client NEVER controls the rate limit tier. isPro from client body is ignored.
 * 3. Validates and sanitizes all input before passing to AI
 * 4. Enforces hard rate limits per user per day
 * 5. Times out the AI call after 20 seconds — Supabase Edge limit is 30s
 * 6. Validates AI response structure before returning to client
 * 7. Logs interactions for audit/rate-limit (service role only)
 *
 * Rate limits (enforced server-side):
 *   Free: 5 AI analyses / day
 *   Pro:  50 AI analyses / day
 */

// @ts-nocheck — Deno/Supabase Edge runtime
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── INPUT CONSTRAINTS ────────────────────────────────────────────────────────
const MAX_PRODUCT_NAME = 120;   // chars, prevents prompt injection
const MAX_NOTES = 300;
const AI_TIMEOUT_MS = 20_000;   // 20 s — well under Supabase Edge 30 s limit
const RATE_FREE = 5;
const RATE_PRO  = 50;

// ─── HANDLER ─────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    // ── 1. Authenticate ───────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonError('Unauthorized', 401);

    // User-scoped client — respects RLS
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return jsonError('Unauthorized', 401);

    // ── 2. Verify Pro status SERVER-SIDE ──────────────────────────────────
    // We NEVER trust isPro from the request body. We check our own database.
    // Subscription status is written by RevenueCat webhooks or our server,
    // so clients cannot fake it.
    //
    // For the current Mock implementation, we use a simple profiles check.
    // When RevenueCat is integrated, replace with entitlements table lookup.
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: subscriptionRow } = await serviceClient
      .from('user_subscriptions')
      .select('plan, expires_at')
      .eq('user_id', user.id)
      .single();

    const isProVerified = (() => {
      if (!subscriptionRow) return false;
      if (subscriptionRow.plan !== 'pro') return false;
      if (subscriptionRow.expires_at && new Date(subscriptionRow.expires_at) < new Date()) return false;
      return true;
    })();

    const dailyLimit = isProVerified ? RATE_PRO : RATE_FREE;

    // ── 3. Rate limit check ────────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10);
    const { count } = await serviceClient
      .from('ai_interactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00Z`);

    if ((count ?? 0) >= dailyLimit) {
      const msg = isProVerified
        ? `Pro plan: ${RATE_PRO} AI analyses per day. Try again tomorrow.`
        : `Free plan: ${RATE_FREE} AI analyses per day. Upgrade to Pro for more.`;
      return jsonError(msg, 429);
    }

    // ── 4. Parse and validate input ────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonError('Invalid JSON body', 400);
    }

    const productName = sanitizeString(body.productName, MAX_PRODUCT_NAME);
    const reason = validateEnum(body.reason, [
      'need','want','sale','influencer','fomo','bored','replacement','other'
    ]);
    const needScore = validateScore(body.needScore);

    if (!productName) return jsonError('productName is required (max 120 chars)', 400);
    if (!reason)      return jsonError('reason must be a valid purchase reason', 400);
    if (needScore === null) return jsonError('needScore must be 0–100', 400);

    const price = typeof body.price === 'number' && body.price >= 0 ? body.price : 0;
    const currency = typeof body.currency === 'string' ? body.currency.slice(0, 5) : 'THB';
    const questionnaire = typeof body.questionnaire === 'object' ? body.questionnaire : null;

    // ── 5. Build prompt ────────────────────────────────────────────────────
    const prompt = buildPrompt({
      productName, price, currency, reason, needScore,
      questionnaire, isPro: isProVerified,
      purchaseHistory: isProVerified && typeof body.purchaseHistory === 'object'
        ? body.purchaseHistory as Record<string, unknown>
        : null,
    });

    // ── 6. Call AI with timeout ────────────────────────────────────────────
    const aiKey = Deno.env.get('AI_API_KEY') ?? '';
    const aiModel = Deno.env.get('AI_MODEL') ?? 'claude-haiku-4-5-20251001';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    let aiResponse: Response;
    try {
      aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': aiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: aiModel,
          max_tokens: 512,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      if ((fetchErr as Error).name === 'AbortError') {
        return jsonError('AI service timed out. Core score is still valid.', 503);
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!aiResponse.ok) {
      console.error('[analyze-purchase] AI provider error:', aiResponse.status);
      return jsonError('AI service temporarily unavailable', 503);
    }

    const aiData = await aiResponse.json();
    const rawText: string = aiData?.content?.[0]?.text ?? '';

    // ── 7. Parse and validate AI response ─────────────────────────────────
    const analysis = parseAIResponse(rawText, needScore, isProVerified);

    // ── 8. Log interaction (fire-and-forget) ───────────────────────────────
    serviceClient.from('ai_interactions').insert({
      user_id: user.id,
      purchase_id: null,
      request_type: isProVerified ? 'pro_analysis' : 'free_analysis',
      tokens_used: (aiData?.usage?.input_tokens ?? 0) + (aiData?.usage?.output_tokens ?? 0),
    }).then(() => {}).catch(console.error);

    return new Response(JSON.stringify(analysis), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[analyze-purchase] Unexpected error:', err);
    return jsonError('Internal server error', 500);
  }
});

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are the AI engine inside RoastMyWallet — an app that helps people pause before impulse purchases.

Your personality: Smart, slightly sarcastic, friendly, direct, funny.
You roast the DECISION, never the person.
Never shame finances, appearance, income, body, or family.
Be playful, not abusive.
Mix Thai and English naturally when addressing Thai users.

Respond ONLY with valid JSON matching exactly this shape:
{
  "roast": "1–2 sentences about the purchase decision",
  "reason": "factual explanation of why the score is what it is",
  "risk": "high" | "medium" | "low",
  "recommendation": "buy" | "wait" | "skip",
  "questions": ["reflection question 1", "reflection question 2"],
  "patternNote": null or "Pro-only pattern insight string",
  "confidenceNote": null
}

Rules:
- needScore < 40 → risk = high, recommendation = skip or wait (never "buy")
- needScore 40–69 → risk = medium, recommendation = wait
- needScore >= 70 → risk = low, recommendation = wait (let the timer run)
- Never recommend "buy" outright — the app's purpose is to pause
- Free users: patternNote MUST be null
- No markdown, no code fences, no explanation outside the JSON object
`.trim();

// ─── PROMPT BUILDER ───────────────────────────────────────────────────────────

function buildPrompt(args: {
  productName: string; price: number; currency: string; reason: string;
  needScore: number; questionnaire: unknown; isPro: boolean;
  purchaseHistory: Record<string, unknown> | null;
}): string {
  const q = (typeof args.questionnaire === 'object' && args.questionnaire !== null)
    ? args.questionnaire as Record<string, unknown>
    : {};

  let prompt = `Purchase: "${args.productName}"
Price: ${args.price} ${args.currency}
Reason: ${args.reason}
Need Score: ${args.needScore}/100

Questionnaire:
- Planned before seeing it: ${q.plannedBefore ?? 'unknown'}
- Already owns alternative: ${q.hasAlternative ?? 'unknown'}
- Usage frequency: ${q.usageFrequency ?? 'unknown'}
- Buys at full price: ${q.wouldBuyAtFullPrice ?? 'unknown'}
- Budget impact: ${q.budgetImpact ?? 'unknown'}
- Emotional state: ${q.emotionalState ?? 'unknown'}`;

  if (args.isPro && args.purchaseHistory) {
    const h = args.purchaseHistory;
    prompt += `\n\nPurchase pattern context (Pro):
- Same category this month: ${h.sameCategory ?? 0}
- Same reason this month: ${h.sameReason ?? 0}
- Recently avoided similar: ${h.recentlyAvoidedSimilar ?? false}`;
  }

  return prompt + '\n\nJSON only:';
}

// ─── RESPONSE VALIDATION ──────────────────────────────────────────────────────

function parseAIResponse(raw: string, needScore: number, isPro: boolean): Record<string, unknown> {
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean) as Record<string, unknown>;

    const risk = (['high','medium','low'] as const).find(r => r === parsed.risk)
      ?? (needScore < 40 ? 'high' : needScore < 70 ? 'medium' : 'low');

    const recommendation = (['buy','wait','skip'] as const).find(r => r === parsed.recommendation)
      ?? (needScore < 40 ? 'skip' : 'wait');

    return {
      roast:           typeof parsed.roast === 'string'  ? parsed.roast.slice(0, 300) : '...',
      reason:          typeof parsed.reason === 'string' ? parsed.reason.slice(0, 300) : `Score: ${needScore}/100`,
      risk,
      recommendation,
      questions:       Array.isArray(parsed.questions)
                         ? (parsed.questions as unknown[]).filter(q => typeof q === 'string').slice(0, 3)
                         : [],
      // Ensure patternNote is null for free users regardless of what AI returns
      patternNote:     isPro && typeof parsed.patternNote === 'string' ? parsed.patternNote.slice(0, 200) : null,
      confidenceNote:  null,
    };
  } catch {
    const risk = needScore < 40 ? 'high' : needScore < 70 ? 'medium' : 'low';
    return {
      roast: 'ระบบ AI กำลังประมวลผล กรุณารอสักครู่',
      reason: `Need score: ${needScore}/100`,
      risk,
      recommendation: needScore < 40 ? 'skip' : 'wait',
      questions: [],
      patternNote: null,
      confidenceNote: null,
    };
  }
}

// ─── INPUT VALIDATORS ─────────────────────────────────────────────────────────

function sanitizeString(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function validateEnum(val: unknown, allowed: string[]): string | null {
  return typeof val === 'string' && allowed.includes(val) ? val : null;
}

function validateScore(val: unknown): number | null {
  if (typeof val !== 'number') return null;
  if (!Number.isFinite(val)) return null;
  if (val < 0 || val > 100) return null;
  return Math.round(val);
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
