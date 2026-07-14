-- Pre-scraped LeetCode contest leaderboards (EntrantHub-style). A contest's
-- ranking is scraped ONCE into these tables after it ends (ranks are final), so
-- every user lookup becomes an instant DB query instead of a live Cloudflare-
-- bypassing page scan — cutting scraper usage from hundreds of requests PER USER
-- to ~1600 PER CONTEST, ever. Idempotent.

-- The full leaderboard: one row per participant.
CREATE TABLE IF NOT EXISTS "PGcode_lc_contest_ranking" (
  contest_slug text    NOT NULL,
  user_slug    text    NOT NULL,   -- canonical URL handle (lower-cased)
  username     text,               -- display name (may differ from slug)
  rank         integer NOT NULL,
  score        integer,
  solved       integer,
  total        integer,
  PRIMARY KEY (contest_slug, user_slug)
);
CREATE INDEX IF NOT EXISTS idx_lc_ranking_by_rank ON "PGcode_lc_contest_ranking" (contest_slug, rank);
CREATE INDEX IF NOT EXISTS idx_lc_ranking_by_name ON "PGcode_lc_contest_ranking" (contest_slug, lower(username));

-- Scrape progress per contest — lets scrape-contest resume where it left off and
-- lets the lookup functions know whether the leaderboard is fully in the DB.
CREATE TABLE IF NOT EXISTS "PGcode_lc_contest_scrape" (
  contest_slug text PRIMARY KEY,
  field_size   integer,
  last_page    integer     NOT NULL DEFAULT 0,  -- highest page persisted so far
  done         boolean     NOT NULL DEFAULT false,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "PGcode_lc_contest_ranking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PGcode_lc_contest_scrape"  ENABLE ROW LEVEL SECURITY;

-- Public LeetCode data → public read; writes go only through the edge functions
-- with the service role (bypasses RLS).
DROP POLICY IF EXISTS "lc_ranking_public_read" ON "PGcode_lc_contest_ranking";
CREATE POLICY "lc_ranking_public_read" ON "PGcode_lc_contest_ranking" FOR SELECT USING (true);
DROP POLICY IF EXISTS "lc_scrape_public_read" ON "PGcode_lc_contest_scrape";
CREATE POLICY "lc_scrape_public_read" ON "PGcode_lc_contest_scrape" FOR SELECT USING (true);
