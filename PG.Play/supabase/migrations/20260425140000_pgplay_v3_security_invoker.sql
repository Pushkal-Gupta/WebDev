-- PG.Play v3.1: switch the three public views to SECURITY INVOKER.
--
-- Postgres views default to SECURITY DEFINER, which means queries against
-- the view run with the privileges of the view's *owner* (typically
-- `postgres` / `supabase_admin`), bypassing RLS on the underlying tables.
-- Supabase Advisor flagged this as a critical issue. Fix: recreate each
-- view with `security_invoker = true` so it runs with the caller's
-- privileges and the existing RLS policies on `pgplay_scores`,
-- `pgplay_profiles`, etc. apply naturally.
--
-- Behaviour preserved:
--   - pgplay_scores SELECT policy is `using (true)` (everyone can read),
--     so pgplay_best and pgplay_leaderboard remain publicly readable.
--   - pgplay_recent_submission_count is consumed by the submit-score
--     edge function via service role, which bypasses RLS regardless.
--
-- Net effect: same data visibility, no more advisor warnings.

-- ── pgplay_best (per-user best per game) ─────────────────────────────
drop view if exists public.pgplay_best;
create view public.pgplay_best
  with (security_invoker = true)
  as select
    user_id,
    game_id,
    max(score) as best,
    count(*) as plays,
    max(created_at) as last_played
  from public.pgplay_scores
  group by user_id, game_id;

-- ── pgplay_leaderboard (top scores per game with display name) ────────
drop view if exists public.pgplay_leaderboard;
create view public.pgplay_leaderboard
  with (security_invoker = true)
  as select
    s.game_id,
    s.user_id,
    coalesce(p.display_name, substr(replace(s.user_id::text, '-', ''), 1, 6)) as display_name,
    p.color as color,
    max(s.score) as best,
    max(s.created_at) as last_played
  from public.pgplay_scores s
  left join public.pgplay_profiles p on p.user_id = s.user_id
  group by s.game_id, s.user_id, p.display_name, p.color;

-- ── pgplay_recent_submission_count (rate-limit advisory) ─────────────
drop view if exists public.pgplay_recent_submission_count;
create view public.pgplay_recent_submission_count
  with (security_invoker = true)
  as select user_id, game_id, count(*) as submissions_last_minute
  from public.pgplay_scores
  where created_at > now() - interval '1 minute'
  group by user_id, game_id;
