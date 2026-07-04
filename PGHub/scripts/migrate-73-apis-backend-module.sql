-- 73: add the APIs & Backend module so /learn/apis-backend/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 29 slots it after React & Frontend (position 28).

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'apis-backend',
  'APIs & Backend',
  'How a backend answers a request — REST resource design and HTTP verbs, authentication with sessions and JWTs, CRUD mapped onto SQL through the validate-persist-respond loop, and the caching and rate-limiting that keep it fast and safe under load, built from intuition with interactive visuals and server code you can read.',
  29,
  'Server'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
