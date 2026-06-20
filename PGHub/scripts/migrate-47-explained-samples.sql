-- Add explained_samples JSONB column to PGcode_problems.
-- Shape: array of objects, each { inputs: [str], expected: str, explanation_md: str, viz_anchor: str|null }.
-- The viz_anchor field, when set, names the visualization key for the third sample so the
-- solution-page viz steps through that exact case (matches the user's spec: "Three test cases
-- to be explained both after the question and in the solution visualization as well.").

ALTER TABLE public."PGcode_problems"
  ADD COLUMN IF NOT EXISTS explained_samples JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Index to find problems still missing their explained-samples backfill.
CREATE INDEX IF NOT EXISTS idx_pgcode_problems_explained_samples_empty
  ON public."PGcode_problems" ((jsonb_array_length(explained_samples)));
