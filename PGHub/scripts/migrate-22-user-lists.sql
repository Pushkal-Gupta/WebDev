-- User-owned custom lists (LeetCode-style playlists / favorites).
-- A user can create any number of lists and add problems to them.

CREATE TABLE IF NOT EXISTS public."PGcode_user_lists" (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  share_slug TEXT UNIQUE,                  -- public share key
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_lists_user ON public."PGcode_user_lists"(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public."PGcode_user_list_problems" (
  list_id BIGINT REFERENCES public."PGcode_user_lists"(id) ON DELETE CASCADE,
  problem_id TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  position INT NOT NULL DEFAULT 0,
  PRIMARY KEY (list_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_user_list_problems_list ON public."PGcode_user_list_problems"(list_id, position);

DROP TRIGGER IF EXISTS trg_user_lists_updated_at ON public."PGcode_user_lists";
CREATE TRIGGER trg_user_lists_updated_at
  BEFORE UPDATE ON public."PGcode_user_lists"
  FOR EACH ROW EXECUTE FUNCTION public.pgcode_touch_updated_at();
