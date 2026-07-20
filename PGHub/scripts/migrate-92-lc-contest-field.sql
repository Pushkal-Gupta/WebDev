-- Per-contest field rating distribution for the dense-field rating predictor.
-- The LeetCode ranking API exposes rank/score but NOT ratings, so we sample
-- participants spread across all ranks and fetch each rating via GraphQL, storing
-- the resulting rating distribution (a few thousand real pre-contest ratings) per
-- contest. The predictor computes each looked-up user's exact expected rank against
-- this field: delta = (perf - rating) * f(contestsPlayed), perf from the geometric-
-- mean seed sqrt(E*rank). Far more accurate than the 44-point synthetic sample field.
CREATE TABLE IF NOT EXISTS "PGcode_lc_contest_field" (
  contest_slug text PRIMARY KEY,
  ratings      jsonb NOT NULL,          -- int[] of sampled real pre-contest ratings
  field_size   integer NOT NULL,        -- true participant count (user_num)
  sampled      integer NOT NULL,        -- how many ratings are in `ratings`
  built_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "PGcode_lc_contest_field" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lc_contest_field public read" ON "PGcode_lc_contest_field";
CREATE POLICY "lc_contest_field public read" ON "PGcode_lc_contest_field" FOR SELECT USING (true);
