-- Atomic view-count increment for playground snippets. Avoids read-then-write
-- races when two tabs load the same snippet simultaneously.

CREATE OR REPLACE FUNCTION public.increment_snippet_views(snippet_slug TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public."PGcode_playground_snippets"
     SET view_count = COALESCE(view_count, 0) + 1
   WHERE slug = snippet_slug;
$$;

GRANT EXECUTE ON FUNCTION public.increment_snippet_views(TEXT) TO anon, authenticated;
