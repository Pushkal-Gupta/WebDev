-- Phase 4: curated lists (Blind 75, NeetCode 150, etc.)
-- Each list is metadata + ordered set of problem_ids; powers the "List" filter
-- on the Practice page and seeds future roadmap tracks.

CREATE TABLE IF NOT EXISTS public."PGcode_lists" (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  curator TEXT,
  problem_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."PGcode_list_problems" (
  list_slug TEXT REFERENCES public."PGcode_lists"(slug) ON DELETE CASCADE,
  problem_id TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  PRIMARY KEY (list_slug, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_list_problems_problem ON public."PGcode_list_problems"(problem_id);

-- Seed: a handful of curated lists. Population of each list happens via
-- scripts/import-lists.js (CSV / JSON import). Counts shown here are placeholders
-- and are recomputed when list_problems is populated.
INSERT INTO public."PGcode_lists" (slug, name, description, curator, is_featured, position) VALUES
  ('blind-75',       'Blind 75',         '75 hand-picked problems covering the breadth of interview patterns.', 'Yangshun Tay',  true, 1),
  ('neetcode-150',   'NeetCode 150',     'Extension of Blind 75 with broader topical coverage.',                'NeetCode',      true, 2),
  ('grind-75',       'Grind 75',         'Frequency-weighted 75 for 8 weeks of focused interview prep.',        'Yangshun Tay',  true, 3),
  ('sql-50',         'SQL 50',           'Foundational SQL problems — joins, windows, CTEs, aggregations.',     'LeetCode',      true, 4),
  ('python-50',      'Python 50',        'Idiomatic Python solving — comprehensions, collections, heapq.',      'PGcode',        true, 5),
  ('java-50',        'Java 50',          'Java essentials — collections, streams, comparator, StringBuilder.',  'PGcode',        false, 6),
  ('cpp-50',         'C++ 50',           'STL mastery and idiomatic competitive C++.',                          'PGcode',        false, 7),
  ('javascript-50',  'JavaScript 50',    'JS interview prep — async, closures, prototypes, ES6 patterns.',     'PGcode',        false, 8),
  ('dp-50',          'DP 50',            '50 problems covering 1D, 2D, interval, tree, and bitmask DP.',        'PGcode',        false, 9),
  ('graph-50',       'Graph 50',         'BFS, DFS, MST, shortest paths, topological sort, union-find.',        'PGcode',        false, 10),
  ('tree-50',        'Tree 50',          'Traversals, BST, balanced trees, segment trees, Fenwick.',            'PGcode',        false, 11)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  curator = EXCLUDED.curator,
  is_featured = EXCLUDED.is_featured,
  position = EXCLUDED.position;
