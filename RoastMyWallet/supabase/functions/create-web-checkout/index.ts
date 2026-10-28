import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const origin = Deno.env.get('PAYMENTS_ALLOWED_ORIGIN') ?? 'https://roastmywallet.app';
const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ error: 'Unauthorized' }, 401);
  const userClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: auth } } });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return json({ error: 'Unauthorized' }, 401);

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const monthly = Deno.env.get('STRIPE_PRICE_PRO_MONTHLY');
  const yearly = Deno.env.get('STRIPE_PRICE_PRO_YEARLY');
  const success = Deno.env.get('STRIPE_CHECKOUT_SUCCESS_URL');
  const cancel = Deno.env.get('STRIPE_CHECKOUT_CANCEL_URL');
  if (!stripeKey || !monthly || !yearly || !success || !cancel) return json({ error: 'Website payments are not configured yet' }, 503);

  let body: { plan?: unknown };
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  if (body.plan !== 'monthly' && body.plan !== 'yearly') return json({ error: 'plan must be monthly or yearly' }, 400);

  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('line_items[0][price]', body.plan === 'monthly' ? monthly : yearly);
  params.set('line_items[0][quantity]', '1');
  params.set('client_reference_id', user.id);
  params.set('metadata[supabase_user_id]', user.id);
  params.set('metadata[plan]', body.plan);
  params.set('subscription_data[metadata][supabase_user_id]', user.id);
  params.set('subscription_data[metadata][plan]', body.plan);
  params.set('success_url', success);
  params.set('cancel_url', cancel);
  if (user.email) params.set('customer_email', user.email);

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: 'Bearer ' + stripeKey, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result.url !== 'string') {
    console.error('[create-web-checkout] Stripe API error', response.status, result?.error?.type);
    return json({ error: 'Unable to create checkout session' }, 502);
  }
  return json({ url: result.url });
});
