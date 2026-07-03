-- 71: add the Web Fundamentals module so /learn/web-fundamentals/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 27 slots it after the language modules (python/cpp/javascript/java = 23..26).

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'web-fundamentals',
  'Web Fundamentals',
  'How the web actually works — HTML parsed into the DOM tree, the CSS box model and layout, the full journey of a request from URL to response, and the browser''s critical rendering path — built from intuition with interactive visuals and HTML/CSS/JS you can run.',
  27,
  'Globe'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
