-- Server-verified subscription state. Never allow client roles to write this table.
alter table public.user_subscriptions
  add column if not exists provider text,
  add column if not exists provider_customer_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists status text not null default 'free',
  add column if not exists current_period_end timestamptz,
  add column if not exists updated_from_event_at timestamptz;

alter table public.user_subscriptions drop constraint if exists user_subscriptions_provider_check;
alter table public.user_subscriptions add constraint user_subscriptions_provider_check check (provider is null or provider in ('stripe', 'revenuecat'));
alter table public.user_subscriptions drop constraint if exists user_subscriptions_status_check;
alter table public.user_subscriptions add constraint user_subscriptions_status_check check (status in ('free', 'active', 'trialing', 'past_due', 'canceled', 'expired', 'unknown'));
create unique index if not exists user_subscriptions_provider_subscription_uidx on public.user_subscriptions(provider, provider_subscription_id) where provider_subscription_id is not null;

create table if not exists public.payment_webhook_events (
  provider text not null check (provider in ('stripe', 'revenuecat')),
  event_id text not null,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,
  primary key (provider, event_id)
);
alter table public.payment_webhook_events enable row level security;
revoke all on public.payment_webhook_events from anon, authenticated;
grant all on public.payment_webhook_events to service_role;
alter table public.user_subscriptions enable row level security;
drop policy if exists "Users can read own subscription" on public.user_subscriptions;
create policy "Users can read own subscription" on public.user_subscriptions for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.user_subscriptions from anon, authenticated;
grant select on public.user_subscriptions to authenticated;
grant all on public.user_subscriptions to service_role;
