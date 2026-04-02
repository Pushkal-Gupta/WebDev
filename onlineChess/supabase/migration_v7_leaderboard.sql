-- ============================================================
-- Migration v7: Leaderboard view
-- Project: ykpjmvoyatcrlqyqbgfu
-- ============================================================

-- Ensure user_ratings has the username column (may be missing if v1 ran without it)
ALTER TABLE user_ratings ADD COLUMN IF NOT EXISTS username text;

-- Leaderboard view — ranks players per category.
-- Shows all players with at least 1 game; UI can filter further.
-- Uses COALESCE(user_profiles.username, user_ratings.username) so
-- the canonical profile username wins over the in-rating snapshot.
DROP VIEW IF EXISTS leaderboard;

CREATE VIEW leaderboard AS
  SELECT
    ur.user_id,
    COALESCE(up.username, 'Anonymous')               AS username,
    up.country,
    ur.category,
    ur.rating,
    ur.rd,
    ur.peak_rating,
    ur.games_played,
    ur.wins,
    ur.losses,
    ur.draws,
    RANK() OVER (PARTITION BY ur.category ORDER BY ur.rating DESC) AS rank
  FROM user_ratings ur
  LEFT JOIN user_profiles up ON up.user_id = ur.user_id
  WHERE ur.games_played >= 1;

-- Grant PostgREST access
GRANT SELECT ON leaderboard TO anon, authenticated;
