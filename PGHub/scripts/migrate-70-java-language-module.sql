-- 70: add the Java language module so /learn/java-language/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 26 continues the languages block (Python, C++ = 24, JavaScript, then Java).

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'java-language',
  'Java',
  'Primitives and objects, classes and encapsulation, inheritance and interfaces, and the collections framework with generics — learned by editing and running real Java in the browser, with interactive visuals for the parts that are hard to picture.',
  26,
  'Coffee'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
