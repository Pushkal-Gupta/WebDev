-- 77: add the Git & Version Control module so /learn/git-vcs/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 33 slots it after Testing & Software Engineering (position 32).

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'git-vcs',
  'Git & Version Control',
  'How Git actually works, built from its tiny data model up — commits as immutable snapshots named by content hashes, branches as cheap movable pointers, fast-forward versus three-way merges, rebasing and the golden rule of rewriting history, and the remote workflow of fetch, pull, push, and pull requests that turns solo commits into reviewed team history — with interactive DAG, merge, rebase, and sync visualizations.',
  33,
  'GitBranch'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
