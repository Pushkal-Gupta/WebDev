-- Scheduled proactive scrape: hourly, pg_cron calls the scrape-cron edge function,
-- which kicks off the full leaderboard scrape for any recently-ended weekly/
-- biweekly contest not already done — so the FIRST visitor to a fresh contest
-- gets instant DB results, no first-user scan wait. Idempotent.
--
-- The Authorization value is the PUBLIC publishable (anon) key — the same key
-- shipped in the frontend bundle, not a secret. scrape-cron itself uses the
-- service-role key from its own env to start scrapes.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Re-create the job idempotently.
SELECT cron.unschedule('lc-scrape-cron')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lc-scrape-cron');

SELECT cron.schedule(
  'lc-scrape-cron',
  '0 * * * *',   -- top of every hour
  $$
  SELECT net.http_post(
    url     := 'https://ykpjmvoyatcrlqyqbgfu.supabase.co/functions/v1/scrape-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable__qbY0vXkNpH_rLhb4GYkAA_efhWihBH'
    ),
    body    := '{}'::jsonb
  );
  $$
);
