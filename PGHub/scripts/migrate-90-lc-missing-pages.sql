-- Gap-fill support for scrape-contest. Instead of a fragile contiguous sweep
-- (one stuck/timing-out page halts everything), the scraper fetches only the
-- pages still MISSING from the leaderboard, skips failures fast, and re-fetches
-- stragglers on the next pass. This function returns those missing page numbers.
-- Idempotent.

CREATE OR REPLACE FUNCTION lc_missing_pages(p_slug text, p_total int)
RETURNS SETOF int
LANGUAGE sql STABLE AS $$
  SELECT g.p
  FROM generate_series(1, p_total) AS g(p)
  WHERE NOT EXISTS (
    SELECT 1 FROM "PGcode_lc_contest_ranking" r
    WHERE r.contest_slug = p_slug
      AND r.rank >  (g.p - 1) * 25
      AND r.rank <=  g.p * 25
  );
$$;

-- Pass counter so a handful of genuinely-unfetchable pages can't loop forever.
ALTER TABLE "PGcode_lc_contest_scrape"
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
