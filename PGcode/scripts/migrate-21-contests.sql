-- Phase 7: Contests engine.
-- A contest = a timed problem set. Participants log submissions; we score by
-- problems solved with penalty for wrong attempts (ICPC-style). Leaderboards
-- materialize from PGcode_user_submissions filtered by contest.

CREATE TABLE IF NOT EXISTS public."PGcode_contests" (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 90,
  starts_at TIMESTAMPTZ,         -- null means "virtual / on-demand"
  ends_at TIMESTAMPTZ,           -- computed convenience; null when virtual
  difficulty TEXT CHECK (difficulty IN ('Beginner','Intermediate','Advanced','Mixed')) DEFAULT 'Mixed',
  is_featured BOOLEAN DEFAULT FALSE,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."PGcode_contest_problems" (
  contest_slug TEXT REFERENCES public."PGcode_contests"(slug) ON DELETE CASCADE,
  problem_id TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 100,
  PRIMARY KEY (contest_slug, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_contest_problems_contest
  ON public."PGcode_contest_problems"(contest_slug, position);

-- Per-user contest attempt (starts the clock for a virtual contest).
CREATE TABLE IF NOT EXISTS public."PGcode_user_contest_attempts" (
  user_id UUID NOT NULL,
  contest_slug TEXT NOT NULL REFERENCES public."PGcode_contests"(slug) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  score INT DEFAULT 0,
  problems_solved INT DEFAULT 0,
  penalty_seconds INT DEFAULT 0,
  PRIMARY KEY (user_id, contest_slug)
);

-- Seed a handful of virtual contests so the UI has content immediately.
INSERT INTO public."PGcode_contests" (slug, name, description, duration_minutes, difficulty, is_featured, position) VALUES
  ('warmup-30',         'Warmup 30',          '4 easy problems in 30 minutes. Perfect for starting your day.',                     30, 'Beginner',     true, 1),
  ('arrays-sprint',     'Arrays Sprint',      '6 array problems in 60 minutes. Mix of easy and medium.',                          60, 'Beginner',     true, 2),
  ('dp-deep-dive',      'DP Deep Dive',       '5 dynamic-programming problems in 90 minutes. Mostly medium / one hard.',           90, 'Intermediate', true, 3),
  ('graphs-mock-oa',    'Graphs Mock OA',     'BFS/DFS/topological-sort/Dijkstra-style problems. 90 minutes, Big Tech OA flavor.', 90, 'Intermediate', true, 4),
  ('classic-interview', 'Classic Interview',  '5 frequently-asked problems in 75 minutes. Tests pattern recognition.',             75, 'Intermediate', false, 5),
  ('hard-grind',        'Hard Grind',         '3 hard problems, 120 minutes. For when you want to be humbled.',                    120, 'Advanced',    false, 6)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration_minutes = EXCLUDED.duration_minutes,
  difficulty = EXCLUDED.difficulty,
  is_featured = EXCLUDED.is_featured,
  position = EXCLUDED.position;
