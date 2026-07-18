-- Scheduled refresh of the external-contest calendar. Without this, PGcode_external_contests
-- goes stale (upcoming LeetCode/Codeforces/AtCoder/CodeChef rounds stop appearing). pg_cron
-- calls the fetch-contests edge function every 6 hours; it upserts the latest across all
-- platforms. Idempotent.
--
-- The Authorization value is the PUBLIC publishable (anon) key — the same key shipped in the
-- frontend bundle, not a secret. fetch-contests uses its own service-role env key to upsert.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('fetch-contests-cron')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fetch-contests-cron');

SELECT cron.schedule(
  'fetch-contests-cron',
  '0 */6 * * *',   -- every 6 hours
  $$
  SELECT net.http_post(
    url     := 'https://ykpjmvoyatcrlqyqbgfu.supabase.co/functions/v1/fetch-contests',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable__qbY0vXkNpH_rLhb4GYkAA_efhWihBH'
    ),
    body    := '{}'::jsonb
  );
  $$
);
