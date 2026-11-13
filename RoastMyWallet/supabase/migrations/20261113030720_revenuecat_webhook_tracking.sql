-- RevenueCat webhook bookkeeping.
-- The table already has RLS enabled and only exposes each user's own row for SELECT.
alter table public.user_subscriptions
  add column if not exists revenuecat_app_user_id text,
  add column if not exists product_id text,
  add column if not exists store text,
  add column if not exists entitlement_id text,
  add column if not exists last_event_id text,
  add column if not exists last_event_at timestamptz;
