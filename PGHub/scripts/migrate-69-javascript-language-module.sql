-- 69: add the JavaScript language module so /learn/javascript-language/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 25 slots it after the Python language module (= 23), continuing the language block.

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'javascript-language',
  'JavaScript',
  'Variables and scoping, functions and closures, async and the event loop, and objects and prototypes — learned by editing and running real code in the browser, with interactive visuals for the parts that are hard to picture.',
  25,
  'Braces'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
