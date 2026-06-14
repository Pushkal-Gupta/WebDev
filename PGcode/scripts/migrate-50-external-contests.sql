-- 50: external contest aggregation. A single table holding contests pulled from
-- public judge / hackathon APIs (LeetCode, Codeforces, AtCoder, CodeChef,
-- DevPost, Kaggle, GSoC). Powers the unified upcoming/ongoing/past calendar +
-- the LeetCode contest analytics view. Live rows are upserted by the
-- fetch-contests edge function; seeded with sample data first.
--
-- Idempotent: safe to re-run (CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS
-- then CREATE). Public-read RLS only — writes come from the service role
-- (edge function / seed script), which bypasses RLS.

CREATE TABLE IF NOT EXISTS "PGcode_external_contests" (
  id               text PRIMARY KEY,
  platform         text NOT NULL CHECK (platform IN
                     ('leetcode','codeforces','atcoder','codechef','devpost','kaggle','gsoc')),
  name             text NOT NULL,
  url              text,
  start_time       timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 0,
  phase            text NOT NULL DEFAULT 'upcoming' CHECK (phase IN
                     ('upcoming','ongoing','finished')),
  extra            jsonb DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pgcode_ext_contests_start_idx
  ON "PGcode_external_contests" (start_time);
CREATE INDEX IF NOT EXISTS pgcode_ext_contests_phase_idx
  ON "PGcode_external_contests" (phase);

ALTER TABLE "PGcode_external_contests" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to PGcode_external_contests"
  ON "PGcode_external_contests";
CREATE POLICY "Allow public read access to PGcode_external_contests"
  ON "PGcode_external_contests" FOR SELECT TO public USING (true);
