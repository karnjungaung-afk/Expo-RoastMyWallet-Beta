import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const enc = new TextEncoder();
const hex = (b: Uint8Array) => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
async function sign(secret: string, value: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(value))));
}
function equal(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function validSignature(raw: string, header: string, secret: string) {
  const parts = header.split(',').map(x => x.trim().split('='));
  const ts = parts.find(x => x[0] === 't')?.[1];
  const sigs = parts.filter(x => x[0] === 'v1').map(x => x[1]);
  if (!ts || !/^\d+$/.test(ts) || !sigs.length || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const expected = await sign(secret, ts + '.' + raw);
  return sigs.some(s => equal(s, expected));
}
const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json' } });
const mapStatus = (s: unknown): string => s === 'active' ? 'active' : s === 'trialing' ? 'trialing' : s === 'past_due' || s === 'unpaid' ? 'past_due' : s === 'canceled' ? 'canceled' : s === 'incomplete_expired' ? 'expired' : 'unknown';

Deno.serve(async req => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const signature = req.headers.get('stripe-signature');
  if (!secret || !signature) return json({ error: 'Webhook not configured' }, 503);
  const raw = await req.text();
  if (!(await validSignature(raw, signature, secret))) return json({ error: 'Invalid signature' }, 400);
  let event: any;
  try { event = JSON.parse(raw); } catch { return json({ error: 'Invalid payload' }, 400); }
  if (!event?.id || !event?.type || !event?.data?.object) return json({ error: 'Invalid event' }, 400);

  const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const { error: insertError } = await db.from('payment_webhook_events').insert({ provider: 'stripe', event_id: event.id, event_type: event.type });
  if (insertError?.code === '23505') return json({ received: true, duplicate: true });
  if (insertError) return json({ error: 'Could not record event' }, 500);

  try {
    const obj = event.data.object;
    let subscriptionId: string | null = null;
    let customerId: string | null = null;
    let userId: string | null = null;
    let subscription: any = null;

    if (event.type === 'checkout.session.completed') {
      userId = obj.metadata?.supabase_user_id ?? obj.client_reference_id ?? null;
      subscriptionId = typeof obj.subscription === 'string' ? obj.subscription : obj.subscription?.id ?? null;
      customerId = typeof obj.customer === 'string' ? obj.customer : obj.customer?.id ?? null;
      if (obj.mode !== 'subscription' || obj.payment_status !== 'paid' || !subscriptionId) {
        await markProcessed(db, event.id); return json({ received: true, granted: false });
      }
    } else if (event.type.startsWith('customer.subscription.')) {
      subscriptionId = obj.id ?? null;
      userId = obj.metadata?.supabase_user_id ?? null;
      customerId = typeof obj.customer === 'string' ? obj.customer : obj.customer?.id ?? null;
    } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      subscriptionId = typeof obj.subscription === 'string' ? obj.subscription : obj.subscription?.id ?? null;
    } else {
      await markProcessed(db, event.id); return json({ received: true, ignored: true });
    }

    if (subscriptionId) {
      const key = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
      const response = await fetch('https://api.stripe.com/v1/subscriptions/' + encodeURIComponent(subscriptionId), { headers: { Authorization: 'Bearer ' + key } });
      if (!response.ok) throw new Error('Could not verify subscription with Stripe');
      subscription = await response.json();
      userId = userId ?? subscription.metadata?.supabase_user_id ?? null;
      customerId = customerId ?? (typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? null);
    }

    if (userId && subscriptionId && subscription) {
      const status = mapStatus(subscription.status);
      const pro = status === 'active' || status === 'trialing';
      const expires = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;
      const { error } = await db.from('user_subscriptions').upsert({
        user_id: userId, plan: pro ? 'pro' : 'free', status, provider: 'stripe',
        provider_customer_id: customerId, provider_subscription_id: subscriptionId,
        expires_at: expires, current_period_end: expires,
        updated_from_event_at: new Date().toISOString(), updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      if (error) throw error;
    }
    await markProcessed(db, event.id);
    return json({ received: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Processing failed';
    await db.from('payment_webhook_events').update({ processing_error: message }).eq('provider', 'stripe').eq('event_id', event.id);
    console.error('[stripe-webhook] processing failed', message);
    return json({ error: 'Event processing failed' }, 500);
  }
});
async function markProcessed(db: any, id: string) {
  await db.from('payment_webhook_events').update({ processed_at: new Date().toISOString() }).eq('provider', 'stripe').eq('event_id', id);
}
