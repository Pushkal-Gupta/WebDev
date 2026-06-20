-- LeetCode contest questions with community difficulty ratings.
-- Source data: the public zerotrac problem-rating dataset (ingested via
-- scripts/seed-lc-questions.mjs). Powers the Compete → LeetCode → Problems
-- browser (rating chart + sortable table) and per-problem detail pages.
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS "PGcode_lc_questions" (
  title_slug     text PRIMARY KEY,
  question_id    integer,
  title          text NOT NULL,
  rating         numeric NOT NULL,
  contest_slug   text,
  contest_label  text,
  problem_index  text,            -- Q1..Q4
  difficulty     text NOT NULL,   -- easy | medium | hard (derived from rating)
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lc_questions_rating       ON "PGcode_lc_questions" (rating);
CREATE INDEX IF NOT EXISTS idx_lc_questions_contest_slug ON "PGcode_lc_questions" (contest_slug);
CREATE INDEX IF NOT EXISTS idx_lc_questions_difficulty   ON "PGcode_lc_questions" (difficulty);

ALTER TABLE "PGcode_lc_questions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lc_questions_public_read" ON "PGcode_lc_questions";
CREATE POLICY "lc_questions_public_read"
  ON "PGcode_lc_questions" FOR SELECT
  USING (true);
