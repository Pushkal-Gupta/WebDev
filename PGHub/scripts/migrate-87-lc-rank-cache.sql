-- Durable cache for LeetCode pending-contest rank scans.
-- The live-ranking scan through the Cloudflare-clearing proxy is slow (~15s for a
-- far-off user). A contest that has ENDED but isn't rated yet has FINAL ranks
-- (no more submissions), so once scanned a (contest, user) result is stable — we
-- cache it here so every repeat lookup (and every prefetched handle) is instant.
-- Rows are only written for pending contests; once LeetCode rates a contest the
-- app reads the official change from GraphQL instead and ignores this table.
-- Idempotent.

CREATE TABLE IF NOT EXISTS "PGcode_lc_rank_cache" (
  contest_slug    text        NOT NULL,
  user_slug       text        NOT NULL,   -- lower-cased handle
  rank            integer,
  score           integer,
  solved          integer,
  total           integer,
  old_rating      numeric,
  contests_played integer,
  field_size      integer,
  fetched_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contest_slug, user_slug)
);

CREATE INDEX IF NOT EXISTS idx_lc_rank_cache_fetched
  ON "PGcode_lc_rank_cache" (fetched_at);

ALTER TABLE "PGcode_lc_rank_cache" ENABLE ROW LEVEL SECURITY;

-- Public read (the data is public LeetCode ranking info); writes happen only
-- through the edge functions with the service role, which bypasses RLS.
DROP POLICY IF EXISTS "lc_rank_cache_public_read" ON "PGcode_lc_rank_cache";
CREATE POLICY "lc_rank_cache_public_read"
  ON "PGcode_lc_rank_cache" FOR SELECT
  USING (true);
