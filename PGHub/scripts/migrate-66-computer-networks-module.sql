-- 66: add the Computer Networks module so /learn/computer-networks/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 22 slots it after the Operating Systems module (= 21), keeping the CS-core block contiguous.

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'computer-networks',
  'Computer Networks',
  'The layered model and encapsulation, TCP''s reliable byte stream, IP addressing and routing, and how DNS and HTTP turn a URL into a page — built from intuition with interactive visuals and runnable code in four languages.',
  22,
  'Network'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
