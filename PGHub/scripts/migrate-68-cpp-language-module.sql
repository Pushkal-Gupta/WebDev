-- 68: add the C++ language module so /learn/cpp-language/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 24 slots it right after the Python language module (= 23), continuing the languages block.

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'cpp-language',
  'C++',
  'Fundamental types, pointers and references, memory and ownership, and the STL containers and algorithms — learned by editing and running real C++ in the browser, with interactive visuals for the parts that are hard to picture.',
  24,
  'Binary'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
