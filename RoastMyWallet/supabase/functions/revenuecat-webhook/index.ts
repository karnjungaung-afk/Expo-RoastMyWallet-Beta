import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json' } });
function secureEqual(a: string, b: string) {
  let diff = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
Deno.serve(async req => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const provided = req.headers.get('authorization') ?? '';
  const expected = Deno.env.get('REVENUECAT_WEBHOOK_AUTHORIZATION') ?? '';
  if (!expected || !secureEqual(provided, expected)) return json({ error: 'Unauthorized' }, 401);
  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const event = payload?.event;
  if (!event?.id || !event?.type || !event?.app_user_id) return json({ error: 'Invalid event' }, 400);
  const userId = String(event.app_user_id);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) return json({ error: 'App User ID must be a Supabase user UUID' }, 400);

  const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const eventId = String(event.id);
  const { error: insertError } = await db.from('payment_webhook_events').insert({ provider: 'revenuecat', event_id: eventId, event_type: String(event.type) });
  if (insertError?.code === '23505') {
    const { data: prior } = await db.from('payment_webhook_events').select('processed_at').eq('provider', 'revenuecat').eq('event_id', eventId).maybeSingle();
    if (prior?.processed_at) return json({ received: true, duplicate: true });
    // Previous delivery failed mid-processing; retry it rather than acknowledging and losing the event.
  } else if (insertError) return json({ error: 'Could not record event' }, 500);

  try {
    const type = String(event.type);
    const entitlementIds = Array.isArray(event.entitlement_ids) ? event.entitlement_ids : [];
    const expirationMs = event.expiration_at_ms ? Number(event.expiration_at_ms) : null;
    const expiresAt = expirationMs && Number.isFinite(expirationMs) ? new Date(expirationMs).toISOString() : null;
    const explicitlyInactive = ['EXPIRATION', 'REFUND', 'REFUND_REVERSED', 'SUBSCRIPTION_PAUSED'].includes(type);
    const hasPro = entitlementIds.includes('pro');
    const active = hasPro && !explicitlyInactive && (!expiresAt || new Date(expiresAt).getTime() > Date.now());
    const providerSubscriptionId = event.transaction_id ? String(event.transaction_id) : (event.original_transaction_id ? String(event.original_transaction_id) : null);
    const status = active ? (type === 'BILLING_ISSUE' ? 'past_due' : 'active') : 'expired';
    const { error } = await db.from('user_subscriptions').upsert({
      user_id: userId, plan: active ? 'pro' : 'free', status, provider: 'revenuecat',
      provider_customer_id: String(event.original_app_user_id ?? userId),
      provider_subscription_id: providerSubscriptionId, expires_at: expiresAt, current_period_end: expiresAt,
      updated_from_event_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    if (error) throw error;
    await db.from('payment_webhook_events').update({ processed_at: new Date().toISOString() }).eq('provider', 'revenuecat').eq('event_id', eventId);
    return json({ received: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Processing failed';
    await db.from('payment_webhook_events').update({ processing_error: message }).eq('provider', 'revenuecat').eq('event_id', eventId);
    console.error('[revenuecat-webhook] processing failed', message);
    return json({ error: 'Event processing failed' }, 500);
  }
});
