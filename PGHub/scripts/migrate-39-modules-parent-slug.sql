-- 39: nest System Design's 8 sub-modules under a parent `system-design` module.
-- After migration 37 the sd-* rows lived as siblings at positions 101..108,
-- pushing them to the bottom of the flat /concepts grid. We want them rendered
-- INSIDE the System Design card instead. The UI keys off `parent_slug` to
-- decide what's top-level (parent_slug IS NULL) vs nested.
-- Idempotent: safe to re-run.

ALTER TABLE public."PGcode_modules"
  ADD COLUMN IF NOT EXISTS parent_slug TEXT REFERENCES public."PGcode_modules"(slug);

-- Ensure the System Design parent row exists at its original position (18 in
-- the canonical curriculum order; 30-migration originally placed it at 100 so
-- it appeared at the end of the flat grid). We pick 18 to slot it among the
-- senior-track modules ahead of the eight sub-modules being attached.
INSERT INTO public."PGcode_modules" (slug, name, position, description, icon)
VALUES (
  'system-design',
  'System Design',
  18,
  'Distributed-systems building blocks for senior interviews — network, storage, consensus, caching, auth, API, reliability, microservices.',
  'Network'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      position = EXCLUDED.position,
      description = EXCLUDED.description,
      icon = COALESCE(public."PGcode_modules".icon, EXCLUDED.icon);

UPDATE public."PGcode_modules"
   SET parent_slug = 'system-design'
 WHERE slug IN (
   'sd-network',
   'sd-storage',
   'sd-consensus',
   'sd-caching-cdn',
   'sd-auth-security',
   'sd-api',
   'sd-reliability',
   'sd-microservices'
 );

-- Children are ordered by their original position (101..108) within the parent.
-- Leaving position values intact preserves that ordering for the sub-grid.
