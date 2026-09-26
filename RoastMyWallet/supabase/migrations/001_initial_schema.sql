-- ─────────────────────────────────────────────────────────────────────────────
-- PauseBuy Database Schema v1
-- ─────────────────────────────────────────────────────────────────────────────
-- Security model:
--   • RLS enabled on every user-data table
--   • Every table's SELECT/INSERT/UPDATE/DELETE are explicitly stated
--   • Users can never read another user's purchases, squad messages
--     outside their squad, or subscription data
--   • Service role (Edge Functions only) is used for ai_interactions inserts
--     and subscription verification
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ── Profiles ──────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  display_name          text not null default '',
  currency              text not null default 'THB',
  language              text not null default 'th',
  timezone              text not null default 'Asia/Bangkok',
  monthly_budget        numeric(12, 2),
  weekly_budget         numeric(12, 2),
  daily_budget          numeric(12, 2),
  theme                 text not null default 'cozy_minimal',
  ai_enabled            boolean not null default true,
  ai_personality        text not null default 'balanced'
                        check (ai_personality in ('balanced','strict','gentle','savage')),
  default_waiting_hours integer not null default 24 check (default_waiting_hours between 1 and 720),
  notifications_enabled boolean not null default true,
  squad_enabled         boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: own row select"  on public.profiles for select  using (auth.uid() = user_id);
create policy "profiles: own row insert"  on public.profiles for insert  with check (auth.uid() = user_id);
create policy "profiles: own row update"  on public.profiles for update  using (auth.uid() = user_id);
-- No delete policy — deleting profile is handled via delete account flow (cascade from auth.users)

-- ── User Subscriptions ────────────────────────────────────────────────────────
-- Written by RevenueCat webhook (service role) or manually for testing.
-- Clients read their own; never write.

create table if not exists public.user_subscriptions (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  plan        text not null default 'free' check (plan in ('free','pro','trial')),
  expires_at  timestamptz,
  updated_at  timestamptz not null default now()
);

alter table public.user_subscriptions enable row level security;

create policy "subscriptions: own row select" on public.user_subscriptions for select using (auth.uid() = user_id);
-- INSERT/UPDATE/DELETE: service role only (no policy = RLS denies all non-service-role writes)

-- ── Purchases ─────────────────────────────────────────────────────────────────

create table if not exists public.purchases (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  product_name        text not null check (length(product_name) between 1 and 200),
  price               numeric(12, 2) not null check (price >= 0),
  currency            text not null default 'THB' check (length(currency) <= 5),
  url                 text,
  image_url           text,
  platform            text not null default 'unknown',
  category            text not null default 'other',
  reason              text not null default 'other'
                      check (reason in ('need','want','sale','influencer','fomo','bored','replacement','other')),
  notes               text check (length(notes) <= 500),
  questionnaire       jsonb,
  need_score          integer check (need_score between 0 and 100),
  impulse_risk        text check (impulse_risk in ('high','medium','low')),
  ai_roast            text check (length(ai_roast) <= 400),
  ai_reason           text check (length(ai_reason) <= 400),
  ai_recommendation   text check (ai_recommendation in ('buy','wait','skip')),
  status              text not null default 'waiting'
                      check (status in ('waiting','bought','avoided','expired','reconsidering')),
  waiting_until       timestamptz,
  waiting_hours       integer not null default 24 check (waiting_hours between 1 and 720),
  decided_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists purchases_user_status_idx on public.purchases(user_id, status);
create index if not exists purchases_user_created_idx on public.purchases(user_id, created_at desc);
create index if not exists purchases_waiting_until_idx on public.purchases(waiting_until)
  where status = 'waiting';

alter table public.purchases enable row level security;

create policy "purchases: own row select" on public.purchases for select using (auth.uid() = user_id);
create policy "purchases: own row insert" on public.purchases for insert with check (auth.uid() = user_id);
create policy "purchases: own row update" on public.purchases for update using (auth.uid() = user_id);
create policy "purchases: own row delete" on public.purchases for delete using (auth.uid() = user_id);

-- ── Spending Limits ───────────────────────────────────────────────────────────

create table if not exists public.spending_limits (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  daily        numeric(12, 2) check (daily > 0),
  weekly       numeric(12, 2) check (weekly > 0),
  monthly      numeric(12, 2) check (monthly > 0),
  impulse_only boolean not null default false,
  updated_at   timestamptz not null default now()
);

alter table public.spending_limits enable row level security;

create policy "spending_limits: own row all" on public.spending_limits for all using (auth.uid() = user_id);

-- ── Squads ────────────────────────────────────────────────────────────────────

create table if not exists public.squads (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null check (length(name) between 2 and 40),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique check (length(invite_code) between 6 and 20),
  settings    jsonb not null default '{
    "alertOnSpendingLimit": true,
    "alertThreshold": 80,
    "autoRoastEnabled": false,
    "privacyLevel": "limits_only"
  }'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists squads_owner_idx        on public.squads(owner_id);
create index if not exists squads_invite_code_idx  on public.squads(invite_code);

alter table public.squads enable row level security;

-- Only squad members can see the squad
create policy "squads: members can select"
  on public.squads for select
  using (
    exists (
      select 1 from public.squad_members sm
      where sm.squad_id = squads.id and sm.user_id = auth.uid()
    )
  );

-- Anyone can create a squad (they become owner)
create policy "squads: authenticated can insert"
  on public.squads for insert
  with check (auth.uid() = owner_id);

-- Only owner can update settings / name
create policy "squads: owner can update"
  on public.squads for update
  using (auth.uid() = owner_id);

-- Only owner can delete the squad
create policy "squads: owner can delete"
  on public.squads for delete
  using (auth.uid() = owner_id);

-- ── Squad Members ─────────────────────────────────────────────────────────────

create table if not exists public.squad_members (
  squad_id            uuid not null references public.squads(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  role                text not null default 'member' check (role in ('owner','member')),
  can_roast           boolean not null default true,
  can_view_purchases  boolean not null default false,
  joined_at           timestamptz not null default now(),
  primary key (squad_id, user_id)
);

create index if not exists squad_members_user_idx on public.squad_members(user_id);

alter table public.squad_members enable row level security;

-- Members can see all members of squads they belong to
create policy "squad_members: members can select"
  on public.squad_members for select
  using (
    exists (
      select 1 from public.squad_members sm2
      where sm2.squad_id = squad_members.squad_id and sm2.user_id = auth.uid()
    )
  );

-- Only the squad owner can add members (or users joining via invite code,
-- handled in Edge Function with service role)
create policy "squad_members: owner can insert"
  on public.squad_members for insert
  with check (
    exists (
      select 1 from public.squads s
      where s.id = squad_members.squad_id and s.owner_id = auth.uid()
    )
    -- Self-join (invite code flow) is handled via Edge Function (service role)
  );

-- Owner can update member permissions; members can update their own row
create policy "squad_members: owner can update"
  on public.squad_members for update
  using (
    exists (
      select 1 from public.squads s
      where s.id = squad_members.squad_id and s.owner_id = auth.uid()
    )
  );

-- Users can leave a squad (delete their own row); owner can remove others
create policy "squad_members: can leave"
  on public.squad_members for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.squads s
      where s.id = squad_members.squad_id and s.owner_id = auth.uid()
    )
  );

-- ── Squad Messages ────────────────────────────────────────────────────────────

create table if not exists public.squad_messages (
  id          uuid primary key default uuid_generate_v4(),
  squad_id    uuid not null references public.squads(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  purchase_id uuid references public.purchases(id) on delete set null,
  content     text not null check (length(content) between 1 and 500),
  type        text not null default 'roast' check (type in ('roast','support','system')),
  created_at  timestamptz not null default now()
);

create index if not exists squad_messages_squad_created_idx on public.squad_messages(squad_id, created_at desc);
create index if not exists squad_messages_user_idx          on public.squad_messages(user_id);

alter table public.squad_messages enable row level security;

-- Members can read messages from squads they belong to
create policy "squad_messages: members can select"
  on public.squad_messages for select
  using (
    exists (
      select 1 from public.squad_members sm
      where sm.squad_id = squad_messages.squad_id and sm.user_id = auth.uid()
    )
  );

-- Members with can_roast=true can send messages
create policy "squad_messages: roasters can insert"
  on public.squad_messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.squad_members sm
      where sm.squad_id = squad_messages.squad_id
        and sm.user_id = auth.uid()
        and sm.can_roast = true
    )
  );

-- Users can delete their own messages; squad owner can delete any message
create policy "squad_messages: can delete own"
  on public.squad_messages for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.squads s
      where s.id = squad_messages.squad_id and s.owner_id = auth.uid()
    )
  );

-- ── AI Interactions ───────────────────────────────────────────────────────────
-- INSERT only via service role (Edge Function). RLS prevents client writes.
-- SELECT allowed so users can see their own usage count.

create table if not exists public.ai_interactions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  purchase_id   text,
  request_type  text not null check (request_type in ('free_analysis','pro_analysis')),
  tokens_used   integer not null default 0 check (tokens_used >= 0),
  created_at    timestamptz not null default now()
);

create index if not exists ai_interactions_user_date_idx on public.ai_interactions(user_id, created_at desc);

alter table public.ai_interactions enable row level security;

-- Users can read their own interaction count (for showing usage in UI)
create policy "ai_interactions: own select"
  on public.ai_interactions for select
  using (auth.uid() = user_id);
-- INSERT/UPDATE/DELETE: service role only (Edge Function uses SUPABASE_SERVICE_ROLE_KEY)

-- ── Helper Functions ──────────────────────────────────────────────────────────

-- Auto-expire purchases that have been waiting >72h past their waiting_until
create or replace function public.expire_old_purchases()
returns void
language sql security definer as $$
  update public.purchases
  set status = 'expired', updated_at = now()
  where status = 'waiting'
    and waiting_until is not null
    and waiting_until < now() - interval '72 hours';
$$;

-- Monthly stats for the insights screen
create or replace function public.get_monthly_stats(p_user_id uuid, p_month text)
returns table (
  total_purchases  bigint,
  bought_count     bigint,
  avoided_count    bigint,
  waiting_count    bigint,
  total_spent      numeric,
  total_avoided    numeric,
  impulse_rate     numeric,
  avg_waiting_hours numeric,
  top_category     text,
  top_reason       text
)
language sql security definer as $$
  with base as (
    select * from public.purchases
    where user_id = p_user_id and to_char(created_at, 'YYYY-MM') = p_month
  )
  select
    count(*)::bigint,
    count(*) filter (where status = 'bought')::bigint,
    count(*) filter (where status in ('avoided','expired'))::bigint,
    count(*) filter (where status = 'waiting')::bigint,
    coalesce(sum(price) filter (where status = 'bought'), 0),
    coalesce(sum(price) filter (where status in ('avoided','expired')), 0),
    case
      when count(*) filter (where status in ('bought','avoided')) = 0 then 0
      else round(
        100.0 * count(*) filter (where status = 'bought' and impulse_risk = 'high')
          / nullif(count(*) filter (where status in ('bought','avoided')), 0), 1)
    end,
    coalesce(avg(
      extract(epoch from (decided_at - created_at)) / 3600
    ) filter (where decided_at is not null), 0),
    (select category from base group by category order by count(*) desc limit 1),
    (select reason   from base group by reason   order by count(*) desc limit 1)
  from base;
$$;

-- ── updated_at triggers ───────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger purchases_updated_at  before update on public.purchases  for each row execute function public.set_updated_at();
create trigger profiles_updated_at   before update on public.profiles   for each row execute function public.set_updated_at();
create trigger spending_limits_upd   before update on public.spending_limits for each row execute function public.set_updated_at();
create trigger subscriptions_upd     before update on public.user_subscriptions for each row execute function public.set_updated_at();

-- ── Push Tokens ───────────────────────────────────────────────────────────────
-- Stores Expo push tokens for server-side notification delivery.
-- Required by the weekly-digest Edge Function before it can send notifications.

create table if not exists public.push_tokens (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  token      text not null check (length(token) > 10 and length(token) < 200),
  platform   text not null check (platform in ('ios','android','web')),
  updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

-- Users can manage their own token; service role reads all for digest
create policy "push_tokens: own row all" on public.push_tokens for all using (auth.uid() = user_id);
