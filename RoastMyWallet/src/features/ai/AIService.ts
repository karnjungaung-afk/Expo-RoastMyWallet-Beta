import { supabase } from '@/services/supabase';
import type { AIAnalysis, Purchase, PurchaseReason, ScoringQuestionnaire, ServiceResult } from '@/types';

// ─── AI SERVICE ───────────────────────────────────────────────────────────────
//
// IMPORTANT: AI calls are routed through Supabase Edge Functions.
// The mobile app NEVER directly calls OpenAI, Anthropic, or any AI provider.
// API keys live only on the server side.
//
// Architecture:
//   App → Supabase Edge Function → AI Provider → Structured Response
//
// If the Edge Function fails, fall back to deterministic scoring.

const EDGE_FUNCTION_URL = 'analyze-purchase';

interface AnalyzeRequest {
  productName: string;
  price: number;
  currency: string;
  reason: PurchaseReason;
  questionnaire: ScoringQuestionnaire | null;
  needScore: number;
  purchaseHistory?: PurchaseHistorySummary | null; // Pro only
  isPro: boolean;
}

interface PurchaseHistorySummary {
  sameCategory: number;
  sameReason: number;
  avgTimeBetweenSameCategory: number | null; // hours
  recentlyAvoidedSimilar: boolean;
}

// ─── MAIN ANALYZE FUNCTION ────────────────────────────────────────────────────

export async function analyzePurchase(
  purchase: Pick<Purchase, 'productName' | 'price' | 'currency' | 'reason' | 'questionnaire' | 'category'>,
  needScore: number,
  options: { isPro: boolean; purchaseHistory?: PurchaseHistorySummary | null } = { isPro: false }
): Promise<ServiceResult<AIAnalysis>> {
  try {
    const payload: AnalyzeRequest = {
      productName: purchase.productName,
      price: purchase.price,
      currency: purchase.currency,
      reason: purchase.reason,
      questionnaire: purchase.questionnaire,
      needScore,
      isPro: options.isPro,
      purchaseHistory: options.isPro ? (options.purchaseHistory ?? null) : null,
    };

    const { data, error } = await supabase.functions.invoke<AIAnalysis>(EDGE_FUNCTION_URL, {
      body: payload,
    });

    if (error) {
      console.error('[AIService] Edge function error:', error);
      return { data: fallbackAnalysis(needScore, purchase.reason), error: null };
    }

    if (!data) {
      return { data: fallbackAnalysis(needScore, purchase.reason), error: null };
    }

    // Validate the response shape
    const validated = validateAIResponse(data);
    return { data: validated, error: null };

  } catch (err) {
    console.error('[AIService] Unexpected error:', err);
    // Always fall back gracefully — AI is an enhancement, not a dependency
    return { data: fallbackAnalysis(needScore, purchase.reason), error: null };
  }
}

// ─── FALLBACK ANALYSIS ───────────────────────────────────────────────────────
// Used when AI is unavailable. The core product still works.

function fallbackAnalysis(needScore: number, reason: PurchaseReason): AIAnalysis {
  const risk = needScore >= 70 ? 'low' : needScore >= 40 ? 'medium' : 'high';

  const fallbackRoasts: Record<'high' | 'medium' | 'low', string[]> = {
    high: [
      'หยุดก่อน — ของชิ้นนี้จำเป็นจริง หรือแค่เห็นคำว่า SALE แล้วใจสั่น?',
      'ถ้าต้องใช้คำว่า "เดี๋ยวค่อยคิด" แปลว่ายังไม่ต้องซื้อ',
      'คะแนนความจำเป็นต่ำมาก ลองรอดูก่อนได้ไหม?',
    ],
    medium: [
      'ไม่ใช่เร่งด่วน แต่ก็ไม่ได้แย่ ลองรอ 24 ชั่วโมงแล้วค่อยตัดสินใจ',
      'ราคานี้โอเค แต่เหตุผลในการซื้อยังไม่แน่ใจ',
      'มีคำถามหลายข้อที่คุณควรตอบตัวเองก่อน',
    ],
    low: [
      'ดูเหมือนคุณคิดมาแล้ว ถ้ายังต้องการหลังรอ — ซื้อได้เลย',
      'คะแนนความจำเป็นดี รอเวลาที่กำหนดแล้วค่อยตัดสินใจ',
      'ไม่ได้ดูเป็น impulse purchase แต่ให้เวลาตัวเองคิดก่อน',
    ],
  };

  const roasts = fallbackRoasts[risk];
  const roast = roasts[Math.floor(Math.random() * roasts.length)];

  const recommendations: Record<'high' | 'medium' | 'low', 'skip' | 'wait' | 'buy'> = {
    high: 'skip',
    medium: 'wait',
    low: 'wait',
  };

  return {
    roast,
    reason: `Need score: ${needScore}/100. ${risk === 'high' ? 'High impulse risk detected.' : risk === 'medium' ? 'Moderate impulse risk.' : 'Looks like a considered purchase.'}`,
    risk,
    recommendation: recommendations[risk],
    questions: getDefaultQuestions(reason),
    patternNote: null,
    confidenceNote: null,
  };
}

// ─── DEFAULT REFLECTION QUESTIONS ────────────────────────────────────────────

function getDefaultQuestions(reason: PurchaseReason): string[] {
  const questions: Record<PurchaseReason, string[]> = {
    need: [
      'What specific problem does this solve right now?',
      'Have you managed without it until today?',
    ],
    want: [
      'Would you still want this in 30 days?',
      'What else could you do with this money?',
    ],
    sale: [
      'Would you buy this at full price?',
      'Is the discount the main reason you want it?',
    ],
    influencer: [
      'Would you have thought to buy this without seeing it promoted?',
      'Do you trust this recommendation or is it just exposure?',
    ],
    fomo: [
      'What exactly are you afraid of missing out on?',
      'Will this item still be available or useful later?',
    ],
    bored: [
      'What are you actually looking for right now?',
      'Is there a free or free alternative to this feeling?',
    ],
    replacement: [
      'Is the old one truly unusable, or just less appealing?',
      'Could repairing it be an option?',
    ],
    other: [
      'What\'s the real reason behind this purchase?',
      'Does this fit your current priorities?',
    ],
  };

  return questions[reason] ?? [];
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────

function validateAIResponse(data: unknown): AIAnalysis {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid AI response shape');
  }

  const d = data as Record<string, unknown>;

  return {
    roast: typeof d.roast === 'string' ? d.roast : '...',
    reason: typeof d.reason === 'string' ? d.reason : '...',
    risk: (['high', 'medium', 'low'] as const).includes(d.risk as any)
      ? (d.risk as AIAnalysis['risk'])
      : 'medium',
    recommendation: (['buy', 'wait', 'skip'] as const).includes(d.recommendation as any)
      ? (d.recommendation as AIAnalysis['recommendation'])
      : 'wait',
    questions: Array.isArray(d.questions) ? d.questions.filter(q => typeof q === 'string') : [],
    patternNote: typeof d.patternNote === 'string' ? d.patternNote : null,
    confidenceNote: typeof d.confidenceNote === 'string' ? d.confidenceNote : null,
  };
}

// ─── RATE LIMITING ────────────────────────────────────────────────────────────

const AI_LIMITS = {
  free: { requestsPerDay: 5, requestsPerPurchase: 1 },
  pro: { requestsPerDay: 50, requestsPerPurchase: 3 },
} as const;

export function getAILimits(isPro: boolean) {
  return isPro ? AI_LIMITS.pro : AI_LIMITS.free;
}
