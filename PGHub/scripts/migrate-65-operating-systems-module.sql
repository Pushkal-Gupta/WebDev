-- 65: add the Operating Systems module so /learn/operating-systems/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 21 slots it after the Databases module (= 20), keeping the CS-core block contiguous.

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'operating-systems',
  'Operating Systems',
  'Processes and threads, CPU scheduling, virtual memory and paging, and deadlocks — built from intuition with interactive visuals and runnable code in four languages.',
  21,
  'Cpu'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
