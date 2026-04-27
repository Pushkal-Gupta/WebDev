-- Era Siege — proposed schema additions.
--
-- These tables are reserved for Era-Siege-specific features that aren't
-- needed by the existing PG.Play infrastructure (which already provides
-- the leaderboard for `aow` via pgplay_runs / pgplay_scores). They are:
--
--   1. era_siege_daily_challenge — a deterministic seed of the day so
--      every client plays the same match for "today's" daily.
--   2. era_siege_balance_overrides — live-tunable balance values that
--      the client merges over content/balance.js without a redeploy.
--   3. era_siege_content_versions — a manifest the client can pin to so
--      a stale tab can detect a content shift and warn the player.
--   4. era_siege_scores — per-difficulty score tracking (the existing
--      pgplay_scores table doesn't carry difficulty).
--
-- Apply with `supabase db push` (or copy into the SQL editor). Idempotent:
-- the file uses `if not exists` and `drop policy if exists` guards.
--
-- Rollback: drop the four tables (no dependents in PG.Play core).

-- ── 1. Daily challenge seeds ──────────────────────────────────────
create table if not exists public.era_siege_daily_challenge (
  id              bigserial primary key,
  challenge_date  date not null unique,
  seed            bigint not null,
  modifier_json   jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

alter table public.era_siege_daily_challenge enable row level security;

drop policy if exists "daily_challenge readable" on public.era_siege_daily_challenge;
create policy "daily_challenge readable"
  on public.era_siege_daily_challenge for select
  using (true);

-- Writes are service-role only (no client-write policy).

create index if not exists idx_era_siege_daily_date
  on public.era_siege_daily_challenge (challenge_date desc);

-- ── 2. Live balance overrides ─────────────────────────────────────
create table if not exists public.era_siege_balance_overrides (
  id             bigserial primary key,
  version        text not null unique,
  overrides_json jsonb not null default '{}'::jsonb,
  is_active      boolean not null default false,
  notes          text,
  created_at     timestamptz not null default now()
);

alter table public.era_siege_balance_overrides enable row level security;

drop policy if exists "balance_overrides public read" on public.era_siege_balance_overrides;
create policy "balance_overrides public read"
  on public.era_siege_balance_overrides for select
  using (is_active = true);

create unique index if not exists idx_era_siege_balance_active
  on public.era_siege_balance_overrides (is_active)
  where is_active = true;

-- ── 3. Content version manifest ───────────────────────────────────
create table if not exists public.era_siege_content_versions (
  id            bigserial primary key,
  version       text not null unique,
  manifest_json jsonb not null default '{}'::jsonb,
  is_active     boolean not null default false,
  released_at   timestamptz not null default now()
);

alter table public.era_siege_content_versions enable row level security;

drop policy if exists "content_versions public read" on public.era_siege_content_versions;
create policy "content_versions public read"
  on public.era_siege_content_versions for select
  using (true);

create unique index if not exists idx_era_siege_content_active
  on public.era_siege_content_versions (is_active)
  where is_active = true;

-- ── 4. Per-difficulty scores ──────────────────────────────────────
-- Mirrors the shape of pgplay_scores but adds difficulty + daily flags.
-- Submission flows through the existing submit-score edge function (or
-- a future Era-Siege-specific endpoint); RLS denies direct client writes.
create table if not exists public.era_siege_scores (
  id           bigserial primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  score        integer not null check (score between 0 and 100),
  difficulty   text not null check (difficulty in ('skirmish','standard','conquest','daily')),
  era          smallint not null check (era between 1 and 5),
  time_sec     integer not null check (time_sec >= 0),
  daily_date   date,
  meta         jsonb not null default '{}'::jsonb,
  run_id       uuid,
  created_at   timestamptz not null default now()
);

alter table public.era_siege_scores enable row level security;

drop policy if exists "era_siege_scores public read" on public.era_siege_scores;
create policy "era_siege_scores public read"
  on public.era_siege_scores for select
  using (true);

-- No client-write policy — all writes go through service-role edge functions.

create index if not exists idx_era_siege_scores_diff_score
  on public.era_siege_scores (difficulty, score desc, created_at desc);

create index if not exists idx_era_siege_scores_daily
  on public.era_siege_scores (daily_date, score desc)
  where daily_date is not null;

-- ── Views (security_invoker so RLS applies on read) ───────────────

create or replace view public.era_siege_leaderboard
with (security_invoker = true)
as
select
  s.id,
  s.user_id,
  p.display_name,
  s.score,
  s.difficulty,
  s.era,
  s.time_sec,
  s.daily_date,
  s.created_at
from public.era_siege_scores s
left join public.pgplay_profiles p on p.user_id = s.user_id
where s.score is not null
order by s.score desc, s.created_at desc;

-- Top per (difficulty, user) — useful for the per-tier leaderboard panel.
create or replace view public.era_siege_best
with (security_invoker = true)
as
select distinct on (s.user_id, s.difficulty)
  s.user_id,
  p.display_name,
  s.difficulty,
  s.score,
  s.era,
  s.time_sec,
  s.daily_date,
  s.created_at
from public.era_siege_scores s
left join public.pgplay_profiles p on p.user_id = s.user_id
order by s.user_id, s.difficulty, s.score desc, s.created_at desc;

-- ── Comments for the docs viewer ─────────────────────────────────
comment on table public.era_siege_daily_challenge   is 'Era Siege: deterministic seed-of-the-day.';
comment on table public.era_siege_balance_overrides is 'Era Siege: live-tunable balance overlay merged over content/balance.js by the client.';
comment on table public.era_siege_content_versions  is 'Era Siege: content manifest pinning so stale tabs can detect a balance shift.';
comment on table public.era_siege_scores            is 'Era Siege: per-difficulty score history. RLS denies client writes; submission via edge fn.';
