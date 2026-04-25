-- PG.Play v2: tighten the score path.
--
-- The v1 schema let any signed-in client insert any score they wanted via
-- supabase.from('pgplay_scores').insert(). v2 forces all writes through the
-- submit-score edge function (using the service role key, which only the
-- function holds) and adds a run-token table so submissions must reference
-- a server-issued, time-bounded token.

-- ── runs (server-issued tokens for score submissions) ────────────
create table if not exists public.pgplay_runs (
  run_id      uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  game_id     text not null,
  started_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '30 minutes',
  consumed_at timestamptz,
  nonce       text not null
);

create index if not exists pgplay_runs_user_idx on public.pgplay_runs (user_id, started_at desc);
create index if not exists pgplay_runs_active_idx on public.pgplay_runs (run_id) where consumed_at is null;

alter table public.pgplay_runs enable row level security;

-- Reads only — clients should never write here. Only the edge function
-- (using service role) inserts and consumes.
drop policy if exists "runs self-read" on public.pgplay_runs;
create policy "runs self-read"
  on public.pgplay_runs for select
  using (auth.uid() = user_id);

-- ── tighten scores: kill direct client insert ────────────────────
-- The v1 policy let auth.uid() = user_id insert. We drop it so all writes
-- now require service role (edge function). The select policy stays open.
drop policy if exists "scores self-write" on public.pgplay_scores;
-- Intentionally no replacement policy: only service role bypasses RLS.

-- Add a fingerprint column for spam/duplicate detection. Not unique
-- (legitimate users can re-run), but lets us correlate weird patterns.
alter table public.pgplay_scores
  add column if not exists run_id uuid references public.pgplay_runs(run_id);

create index if not exists pgplay_scores_run_idx
  on public.pgplay_scores (run_id);

-- ── public leaderboard view (no PII) ────────────────────────────
-- Anyone can read this. Joins to pgplay_profiles for the display name
-- (falls back to a hashed user id chunk if no profile).
create or replace view public.pgplay_leaderboard as
  select
    s.game_id,
    s.user_id,
    coalesce(p.display_name, substr(replace(s.user_id::text, '-', ''), 1, 6)) as display_name,
    p.color as color,
    max(s.score) as best,
    max(s.created_at) as last_played
  from public.pgplay_scores s
  left join public.pgplay_profiles p on p.user_id = s.user_id
  group by s.game_id, s.user_id, p.display_name, p.color;

-- ── server-side achievement triggers (move logic out of the client) ──
-- v2 ships with one trigger as proof-of-concept; the existing client
-- achievement code keeps working until per-game rules land.
create or replace function public.pgplay_award_first_play()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.pgplay_achievements (user_id, achievement)
  values (new.user_id, 'first-' || new.game_id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists pgplay_first_play on public.pgplay_scores;
create trigger pgplay_first_play
  after insert on public.pgplay_scores
  for each row
  execute function public.pgplay_award_first_play();

-- ── basic per-user rate limiting (advisory; edge function does the real work) ──
-- A helper view the function can read to decide if a user is hot.
create or replace view public.pgplay_recent_submission_count as
  select user_id, game_id, count(*) as submissions_last_minute
  from public.pgplay_scores
  where created_at > now() - interval '1 minute'
  group by user_id, game_id;
