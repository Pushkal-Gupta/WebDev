-- 78: add the Cloud & Containers module so /learn/cloud-containers/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 34 slots it after the earlier practical/engineering modules.

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'cloud-containers',
  'Cloud & Containers',
  'The concrete tooling that ships and runs modern services — container images and the layered filesystem behind them, orchestration and desired-state reconciliation with pods, deployments, and services, container networking, ephemeral versus persistent storage, config and secret injection, and CI/CD pipelines with rolling, blue-green, and canary rollouts plus rollback — built from intuition with interactive visuals and real Dockerfile, kubectl, and YAML examples.',
  34,
  'Container'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
