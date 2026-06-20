-- ────────────────────────────────────────────────────────────────────────
-- migrate-26-security-invoker.sql
--
-- Supabase database linter flags `pgcode_problem_catalog_v` as SECURITY
-- DEFINER. Postgres 15+ defaults views to DEFINER (creator's privileges,
-- ignoring the querying user's RLS) unless you opt into INVOKER. This
-- patch sets the view to INVOKER so RLS is enforced for the actual caller.
--
-- The catalog view exposes only PGcode_problems columns, which are public
-- read anyway, so behavior doesn't change for end users — but the lint goes
-- away and the security posture is correct.
--
-- We also flip the three RPCs (`pgcode_user_stats`, `pgcode_practice_history`,
-- `pgcode_resolve_tutorial`) to SECURITY INVOKER so the same lint check
-- doesn't fire on them either. They take `uid` / `names` as explicit input
-- and only need read access to public tables.
--
-- Idempotent: safe to re-run.
-- ────────────────────────────────────────────────────────────────────────

ALTER VIEW public."pgcode_problem_catalog_v" SET (security_invoker = on);

ALTER FUNCTION public.pgcode_user_stats(uuid) SECURITY INVOKER;
ALTER FUNCTION public.pgcode_practice_history(uuid, int) SECURITY INVOKER;
ALTER FUNCTION public.pgcode_resolve_tutorial(text[]) SECURITY INVOKER;
