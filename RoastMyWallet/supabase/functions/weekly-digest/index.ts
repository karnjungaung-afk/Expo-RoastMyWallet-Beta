/**
 * weekly-digest — scheduled push notification digest
 *
 * Cron: '0 11 * * 0'  (Sunday 11:00 UTC = 18:00 ICT)
 * Set in Supabase: Dashboard → Edge Functions → Schedule
 *
 * Requirements before enabling:
 *   1. Create table: public.push_tokens(user_id uuid PK, token text, platform text)
 *      with RLS: users can INSERT/UPDATE/DELETE their own row; no SELECT for others.
 *   2. Store tokens from app: call upsert after Expo's getPushTokenAsync().
 *   3. Set SUPABASE_SERVICE_ROLE_KEY in Edge Function secrets.
 *
 * This function is a TEMPLATE — it will not deliver notifications until
 * push_tokens table and token registration are implemented in the app.
 * Clearly marked as such to prevent shipping broken notifications.
 */

// @ts-nocheck — Deno/Supabase Edge runtime
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100; // Expo's max per request

serve(async (_req) => {
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Get all users with notifications enabled AND a registered push token
  const { data: tokenRows, error: tokensErr } = await serviceClient
    .from('push_tokens')       // ← must be created — see header comment
    .select('user_id, token');

  if (tokensErr) {
    console.error('[weekly-digest] push_tokens query failed:', tokensErr.message);
    console.error('[weekly-digest] Have you created the push_tokens table? See function header.');
    return new Response('push_tokens table not ready', { status: 503 });
  }

  if (!tokenRows?.length) {
    return new Response(JSON.stringify({ sent: 0, reason: 'no_tokens' }), { status: 200 });
  }

  const notifications: object[] = [];

  for (const row of tokenRows) {
    const { user_id, token } = row;
    if (!token || typeof token !== 'string') continue;

    // 2. Get weekly stats for this user
    const { data: purchases } = await serviceClient
      .from('purchases')
      .select('price, status, impulse_risk')
      .eq('user_id', user_id)
      .gte('updated_at', oneWeekAgo);

    if (!purchases?.length) continue;

    const avoided = purchases.filter(
      (p: { status: string }) => p.status === 'avoided' || p.status === 'expired'
    );
    const bought = purchases.filter((p: { status: string }) => p.status === 'bought');
    const totalAvoided = avoided.reduce((s: number, p: { price: number }) => s + p.price, 0);

    // Only notify if there's something to report
    if (totalAvoided === 0 && bought.length === 0) continue;

    // 3. Fetch currency preference
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('currency')
      .eq('user_id', user_id)
      .single();

    const currencySymbol: Record<string, string> = {
      THB: '฿', USD: '$', EUR: '€', GBP: '£', JPY: '¥', SGD: 'S$', MYR: 'RM',
    };
    const symbol = currencySymbol[(profile?.currency as string) ?? 'THB'] ?? '฿';

    let body: string;
    if (totalAvoided > 0) {
      body = `This week you avoided ${symbol}${Math.round(totalAvoided).toLocaleString()} in impulse purchases.`;
    } else {
      body = `You made ${bought.length} purchase${bought.length > 1 ? 's' : ''} this week. Check your insights.`;
    }

    notifications.push({
      to: token,
      title: 'Your weekly summary',
      body,
      data: { type: 'weekly_summary' },
      sound: null,
      badge: 0,
      channelId: 'decisions',     // Android channel defined in NotificationService
    });
  }

  if (notifications.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: 'nothing_to_report' }), { status: 200 });
  }

  // 4. Send in batches of 100 (Expo API limit)
  let sent = 0;
  const batches = chunk(notifications, BATCH_SIZE);
  for (const batch of batches) {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(batch),
    });
    if (res.ok) sent += batch.length;
    else console.error('[weekly-digest] Expo push error:', await res.text());
  }

  return new Response(JSON.stringify({ sent }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
});

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
