-- Auto-build the per-contest field rating distribution right after each contest ends,
-- feeding the dense-field rating predictor. Fires ~10 min after the contest end
-- (Weekly Sun 04:00 UTC, Biweekly Sat 16:00 UTC), a few minutes after the leaderboard
-- scrape so the live pre-rating leaderboard is populated. build-field is idempotent
-- and no-ops when a fresh field already exists; the biweekly job harmlessly does
-- nothing on off-weekends (build-field only acts on a recently-ended round).
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('lc-weekly-field')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lc-weekly-field');
SELECT cron.schedule('lc-weekly-field', '10 4 * * 0', $$
  SELECT net.http_post(
    url     := 'https://ykpjmvoyatcrlqyqbgfu.supabase.co/functions/v1/build-field',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer sb_publishable__qbY0vXkNpH_rLhb4GYkAA_efhWihBH'),
    body    := '{}'::jsonb
  );
$$);

SELECT cron.unschedule('lc-biweekly-field')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lc-biweekly-field');
SELECT cron.schedule('lc-biweekly-field', '10 16 * * 6', $$
  SELECT net.http_post(
    url     := 'https://ykpjmvoyatcrlqyqbgfu.supabase.co/functions/v1/build-field',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer sb_publishable__qbY0vXkNpH_rLhb4GYkAA_efhWihBH'),
    body    := '{}'::jsonb
  );
$$);
