-- Phase 5: Data-driven roadmap engine.
--
-- A roadmap = an ordered set of nodes. Each node either points at a list
-- (problem set), a concept, a single problem, or a milestone marker.
--
-- The existing rigidGrid DSA roadmap stays as a special graph-rendered roadmap;
-- list-style roadmaps (Blind 75, SQL 50, ...) render through this engine.

CREATE TABLE IF NOT EXISTS public."PGcode_roadmaps" (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  kind TEXT NOT NULL DEFAULT 'list' CHECK (kind IN ('list','graph','sequence')),
  default_layout TEXT NOT NULL DEFAULT 'list',  -- 'list' | 'graph'
  estimated_hours INT,
  position INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."PGcode_roadmap_nodes" (
  id BIGSERIAL PRIMARY KEY,
  roadmap_slug TEXT NOT NULL REFERENCES public."PGcode_roadmaps"(slug) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  node_type TEXT NOT NULL CHECK (node_type IN ('concept','problem','list','milestone','section')),
  ref_id TEXT,             -- concept slug, problem id, list slug, depending on node_type
  title TEXT,              -- override label (especially for milestone/section)
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_position
  ON public."PGcode_roadmap_nodes"(roadmap_slug, position);

-- Seed: register the existing DSA Fundamentals graph + a few list-style ones
INSERT INTO public."PGcode_roadmaps" (slug, name, description, kind, default_layout, estimated_hours, position, is_featured) VALUES
  ('dsa-fundamentals', 'DSA Fundamentals',      'The full 22-topic roadmap with prerequisite dependencies.',          'graph', 'graph',  80, 1, true),
  ('blind-75',         'Blind 75 Track',         '75 hand-picked problems covering interview pattern breadth.',        'list',  'list',   40, 2, true),
  ('grind-75',         'Grind 75 (8 Weeks)',     'Frequency-weighted study plan over 8 focused weeks.',                'sequence','list', 40, 3, true),
  ('sql-50',           'SQL 50',                 'Joins, windows, CTEs, aggregations — from zero to interview ready.', 'list',  'list',   25, 4, true),
  ('python-50',        'Python 50',              'Idiomatic Python solving — heapq, collections, comprehensions.',    'list',  'list',   25, 5, true),
  ('graph-50',         'Graph 50',               'BFS, DFS, MST, shortest paths, topological sort, union-find.',       'list',  'list',   35, 6, false),
  ('dp-50',            'DP 50',                  '1D, 2D, interval, tree, and bitmask dynamic programming.',           'list',  'list',   35, 7, false),
  ('tree-50',          'Tree 50',                'Traversals, BST, balanced trees, segment trees, Fenwick.',           'list',  'list',   30, 8, false)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  kind = EXCLUDED.kind,
  default_layout = EXCLUDED.default_layout,
  estimated_hours = EXCLUDED.estimated_hours,
  position = EXCLUDED.position,
  is_featured = EXCLUDED.is_featured;
