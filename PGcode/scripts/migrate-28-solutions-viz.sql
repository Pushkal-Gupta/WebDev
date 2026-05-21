-- ────────────────────────────────────────────────────────────────────────
-- migrate-28-solutions-viz.sql
--
-- Adds two structured-content columns to PGcode_problems so the
-- Workspace's Solution tab can show multi-language reference solutions
-- and the new Visualize tab can show per-problem step-by-step frames.
--
-- Shape of `solutions` JSONB:
--   { "python": { code: "...", complexity: { time: "O(log n)", space: "O(1)" }, approach: "..." },
--     "javascript": { ... }, "java": { ... }, "cpp": { ... } }
--
-- Shape of `viz_steps` JSONB:
--   { renderer: 'array' | 'graph' | 'tree' | 'window' | 'grid',
--     title: '...',
--     frames: [{ caption: '...', ...payload }, ...] }
-- ────────────────────────────────────────────────────────────────────────

ALTER TABLE public."PGcode_problems"
  ADD COLUMN IF NOT EXISTS solutions JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS viz_steps JSONB DEFAULT NULL;

-- Idempotent.
