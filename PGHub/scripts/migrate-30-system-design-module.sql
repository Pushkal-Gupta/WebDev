-- 30: add the System Design module so /learn/system-design/* concepts can be imported.
-- Idempotent: ON CONFLICT DO NOTHING preserves any later edits.

INSERT INTO "PGcode_modules" (slug, name, position, description)
VALUES (
  'system-design',
  'System Design',
  100,
  'Distributed-systems building blocks for senior interviews: load balancing, caching, sharding, queues, consensus, consistency.'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description;
