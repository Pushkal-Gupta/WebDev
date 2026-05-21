-- Learn / Algorithms Library schema
-- Run in the Supabase SQL editor.
--
-- Top-level modules (e.g. "Math & Number Theory", "Linked Lists", "Trees")
-- Individual concepts (e.g. "Loop Detection", "Manacher's Algorithm")
-- Many-to-many: concept ↔ problem
-- Prereq edges between concepts

CREATE TABLE IF NOT EXISTS public."PGcode_modules" (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  position INT NOT NULL DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."PGcode_concepts" (
  slug TEXT PRIMARY KEY,
  module_slug TEXT NOT NULL REFERENCES public."PGcode_modules"(slug) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  position INT NOT NULL DEFAULT 0,
  -- Structured JSONB body. Schema (all sections optional, see content/concepts/*.md):
  --   { intro, whyItMatters, intuition, visualization, bruteForce, optimal,
  --     complexity: { time, space, notes }, pitfalls, interviewTips, examples }
  body JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Code snippets keyed by language: { python: "...", cpp: "...", ... }
  code JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Free-form metadata: { reference_pdf, last_authored_at, tags }
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_concepts_module ON public."PGcode_concepts"(module_slug, position);
CREATE INDEX IF NOT EXISTS idx_concepts_status ON public."PGcode_concepts"(status);

CREATE TABLE IF NOT EXISTS public."PGcode_concept_problems" (
  concept_slug TEXT REFERENCES public."PGcode_concepts"(slug) ON DELETE CASCADE,
  problem_id TEXT NOT NULL,
  relation_type TEXT NOT NULL DEFAULT 'practice' CHECK (relation_type IN ('practice', 'introduces', 'follow_up')),
  position INT NOT NULL DEFAULT 0,
  PRIMARY KEY (concept_slug, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_concept_problems_problem ON public."PGcode_concept_problems"(problem_id);

CREATE TABLE IF NOT EXISTS public."PGcode_concept_prereqs" (
  concept_slug TEXT REFERENCES public."PGcode_concepts"(slug) ON DELETE CASCADE,
  requires_slug TEXT REFERENCES public."PGcode_concepts"(slug) ON DELETE CASCADE,
  PRIMARY KEY (concept_slug, requires_slug)
);

-- Per-user "I've finished reading this concept" flag
CREATE TABLE IF NOT EXISTS public."PGcode_user_concept_progress" (
  user_id UUID NOT NULL,
  concept_slug TEXT NOT NULL REFERENCES public."PGcode_concepts"(slug) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'reading' CHECK (status IN ('reading', 'read', 'mastered')),
  confidence INT CHECK (confidence BETWEEN 0 AND 5),
  last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, concept_slug)
);

-- Updated-at trigger
CREATE OR REPLACE FUNCTION public.pgcode_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_concepts_updated_at ON public."PGcode_concepts";
CREATE TRIGGER trg_concepts_updated_at
  BEFORE UPDATE ON public."PGcode_concepts"
  FOR EACH ROW EXECUTE FUNCTION public.pgcode_touch_updated_at();

-- Seed: 15 modules covering the integrated syllabus (Course I + Course II merged)
INSERT INTO public."PGcode_modules" (slug, name, description, position, icon) VALUES
  ('foundations',     'Foundations',                'Algorithm intro, complexity analysis, Java essentials.',     1, 'BookOpen'),
  ('math',            'Math & Number Theory',       'Sieves, modular arithmetic, classic number-theoretic algos.', 2, 'Sigma'),
  ('bitwise',         'Bitwise Algorithms',         'Bit tricks, classical algorithms operating on binary.',       3, 'Binary'),
  ('arrays-searching','Arrays & Searching',         'Array transformations, search patterns, Boyer-Moore.',       4, 'List'),
  ('sorting-strings', 'Sorting & Strings',          'Sorts, string manipulation, Manacher''s, palindromes.',      5, 'AArrowUp'),
  ('linked-lists',    'Linked Lists',               'Floyd''s cycle, segregation, DLL sorts.',                    6, 'Link'),
  ('stacks-queues',   'Stacks & Queues',            'Min stack, sliding window, monotonic structures.',            7, 'Layers'),
  ('recursion-bt',    'Recursion & Backtracking',   'Permutations, combinations, mazes, N-Queens.',                8, 'Repeat'),
  ('trees',           'Trees',                      'Traversals, BST, views, boundary, Dial''s.',                  9, 'GitBranch'),
  ('graphs',          'Graphs',                     'BFS/DFS, MST, shortest paths, topological sort, coloring.', 10, 'Network'),
  ('heaps',           'Heaps',                      'Binomial, K-ary, winner tree, heap sort.',                  11, 'Mountain'),
  ('hashing',         'Maps, Sets & Hashing',       'HashMap to TreeMap, set theory, distribution problems.',     12, 'Hash'),
  ('dp',              'Dynamic Programming',        'Knapsack, LCS, LIS, TSP, coin change, Levenshtein.',         13, 'Table'),
  ('greedy',          'Greedy Algorithms',          'Huffman, activity selection, Warnsdorff, Hamiltonian.',      14, 'Zap'),
  ('cs-core',         'CS Core for Interviews',     'OS, DBMS, RDBMS, networking, security, cryptography.',       15, 'Cpu')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  position = EXCLUDED.position,
  icon = EXCLUDED.icon;
