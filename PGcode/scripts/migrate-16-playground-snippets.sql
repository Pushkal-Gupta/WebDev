-- Phase 6: shareable playground snippets.
-- Anyone with the slug can view / fork the snippet (read-public via RLS).
-- Authenticated owners can update their own snippets.

CREATE TABLE IF NOT EXISTS public."PGcode_playground_snippets" (
  slug TEXT PRIMARY KEY,
  user_id UUID,
  title TEXT,
  language TEXT NOT NULL,
  source_code TEXT NOT NULL,
  stdin TEXT,
  fork_of TEXT REFERENCES public."PGcode_playground_snippets"(slug) ON DELETE SET NULL,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snippets_user ON public."PGcode_playground_snippets"(user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_snippets_updated_at ON public."PGcode_playground_snippets";
CREATE TRIGGER trg_snippets_updated_at
  BEFORE UPDATE ON public."PGcode_playground_snippets"
  FOR EACH ROW EXECUTE FUNCTION public.pgcode_touch_updated_at();
