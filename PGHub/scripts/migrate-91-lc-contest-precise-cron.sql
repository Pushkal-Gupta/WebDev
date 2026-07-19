-- Precise post-contest scrape crons. LeetCode contest END times (user is IST = UTC+5:30):
--   Weekly   — every Sunday   09:30 IST  = 04:00 UTC  -> scrape Sunday   04:02 UTC (09:32 IST)
--   Biweekly — every 2nd Sat  21:30 IST  = 16:00 UTC  -> scrape Saturday 16:02 UTC (21:32 IST)
-- The +2 min buffer lets LeetCode lock the leaderboard before we scrape.
-- Both fire every week; scrape-cron is idempotent and no-ops when no contest actually
-- ended (so the biweekly job harmlessly does nothing on off-weeks — standard cron can't
-- express "every other Saturday"). The hourly lc-scrape-cron stays as a safety net so a
-- single missed fire (pg_net hiccup) is still caught within the hour.
--
-- Authorization is the PUBLIC publishable (anon) key shipped in the frontend bundle, not a
-- secret. scrape-cron uses its own service-role key from env to run the scrape.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Weekly: Sunday 04:02 UTC = 09:32 IST (2 min after the 09:30 IST end).
SELECT cron.unschedule('lc-weekly-scrape')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lc-weekly-scrape');
SELECT cron.schedule(
  'lc-weekly-scrape',
  '2 4 * * 0',
  $$
  SELECT net.http_post(
    url     := 'https://ykpjmvoyatcrlqyqbgfu.supabase.co/functions/v1/scrape-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable__qbY0vXkNpH_rLhb4GYkAA_efhWihBH'
    ),
    body    := '{"reason":"weekly-contest-ended"}'::jsonb
  );
  $$
);

-- Biweekly: Saturday 16:02 UTC = 21:32 IST (2 min after the 21:30 IST end). Fires every
-- Saturday; scrape-cron no-ops on non-biweekly weekends.
SELECT cron.unschedule('lc-biweekly-scrape')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lc-biweekly-scrape');
SELECT cron.schedule(
  'lc-biweekly-scrape',
  '2 16 * * 6',
  $$
  SELECT net.http_post(
    url     := 'https://ykpjmvoyatcrlqyqbgfu.supabase.co/functions/v1/scrape-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable__qbY0vXkNpH_rLhb4GYkAA_efhWihBH'
    ),
    body    := '{"reason":"biweekly-contest-ended"}'::jsonb
  );
  $$
);
