-- Post attachments: let a feed post carry a structured reference (currently a solved/shared
-- problem from the catalog) rendered as a rich card. JSONB so future attachment kinds
-- (contest result, snippet, list) need no further schema change. Additive + idempotent.
ALTER TABLE "PGcode_posts"
  ADD COLUMN IF NOT EXISTS attachment JSONB;
