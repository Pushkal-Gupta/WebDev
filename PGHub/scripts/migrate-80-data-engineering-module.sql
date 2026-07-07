-- 80: add the Data Engineering module so /learn/data-engineering/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 36 slots it after the most recent learn modules; distinct from Databases
-- (that module covers engine internals and transactions; this one covers moving and
-- processing data at scale — pipelines, batch vs stream, warehouse modeling, messaging).

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'data-engineering',
  'Data Engineering',
  'How data moves and gets processed at scale — ETL and ELT pipelines with idempotent stages and DAG orchestration, batch versus stream processing with windowing and event-time semantics, warehouse modeling with star schemas and columnar storage, and the durable messaging logs that connect it all with partitions, consumer groups, backpressure, and replay — with interactive pipeline, windowing, star-schema, and partitioned-log visualizations.',
  36,
  'Workflow'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
