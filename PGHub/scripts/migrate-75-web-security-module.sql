-- 75: add the Web Security module so /learn/web-security/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 31 slots it after Discrete Math (position 30).

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'web-security',
  'Web Security',
  'The attacks every web app must survive and the defenses that stop them — cross-site scripting, request forgery, SQL and command injection, and secrets management — built from intuition with interactive attack-flow visuals: type a payload and watch it fire or land inert, forge a request and watch a token reject it, and step a key through its lifecycle.',
  31,
  'ShieldAlert'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
