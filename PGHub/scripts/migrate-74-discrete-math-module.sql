-- 74: add the Discrete Mathematics module so /learn/discrete-math/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 30 slots it after the other math/foundations modules.

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'discrete-math',
  'Discrete Mathematics',
  'The math that computer science runs on — propositional logic and proof, sets and relations, counting and combinatorics, and graph theory — built from intuition with interactive visuals: truth tables you step through, Venn regions you shade, permutations you enumerate, and graphs you 2-color.',
  30,
  'Sigma'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
