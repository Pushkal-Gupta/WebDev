-- 79: add the Computer Architecture module so /learn/computer-architecture/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 35 slots it after the earlier practical/engineering modules.

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'computer-architecture',
  'Computer Architecture',
  'How the machine underneath your code actually runs it — the CPU instruction pipeline and its hazards, the memory hierarchy from registers to disk, cache mechanics with direct-mapped and set-associative lines, and how numbers are really stored with two''s complement and IEEE-754 floats — built from intuition with interactive visuals and real C and assembly examples.',
  35,
  'Cpu'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
