-- Phase 9: achievements.
-- Earned achievements are stored per user; the catalog of available achievements
-- is hard-coded in src/lib/achievements.js so we can compute earnings in the
-- client without an extra round-trip on every progress change.

CREATE TABLE IF NOT EXISTS public."PGcode_user_achievements" (
  user_id UUID NOT NULL,
  achievement_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user
  ON public."PGcode_user_achievements"(user_id, earned_at DESC);
