// Supabase Edge Function: scrape-cron
//
// Runs on a schedule (pg_cron → this function) and proactively kicks off the full
// leaderboard scrape for any recently-ENDED weekly/biweekly contest that isn't
// already scraped — so the FIRST visitor to a fresh contest gets instant DB
// results too, with no first-user scan wait.
//
// It only STARTS the scrapes (scrape-contest is resumable + self-chaining and has
// its own concurrency guard); it returns quickly.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const db = createClient(SUPABASE_URL, SERVICE_KEY);

// Cadence anchors (UTC): Weekly every Sun 02:30, Biweekly every other Sat 14:30.
const WEEKLY_ANCHOR = { ms: Date.UTC(2024, 8, 29, 2, 30), n: 417 };
const BIWEEKLY_ANCHOR = { ms: Date.UTC(2024, 9, 5, 14, 30), n: 141 };
const DURATION_MS = 90 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const FORTNIGHT_MS = 14 * 24 * 60 * 60 * 1000;

// Highest contest number that has FULLY ENDED by `now`.
function latestEnded(anchor: { ms: number; n: number }, period: number, now: number): number {
  const k = Math.floor((now - anchor.ms - DURATION_MS) / period);
  return anchor.n + Math.max(0, k);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const now = Date.now();
  // Only scrape contests in the PENDING window — ended, but not yet rated by
  // LeetCode (rated contests are served from GraphQL, so scraping them wastes
  // requests). LeetCode finalizes ratings within ~1-2 days, so a ~40h window
  // after a contest ends captures exactly the rounds that need the leaderboard.
  const PENDING_WINDOW_MS = 40 * 60 * 60 * 1000;
  const endOf = (anchor: { ms: number; n: number }, period: number, n: number) =>
    anchor.ms + (n - anchor.n) * period + DURATION_MS;

  const slugs: string[] = [];
  const w = latestEnded(WEEKLY_ANCHOR, WEEK_MS, now);
  if (now - endOf(WEEKLY_ANCHOR, WEEK_MS, w) < PENDING_WINDOW_MS) slugs.push(`weekly-contest-${w}`);
  const bw = latestEnded(BIWEEKLY_ANCHOR, FORTNIGHT_MS, now);
  if (now - endOf(BIWEEKLY_ANCHOR, FORTNIGHT_MS, bw) < PENDING_WINDOW_MS) slugs.push(`biweekly-contest-${bw}`);

  const results: Array<{ slug: string; action: string }> = [];
  const kicks: Promise<unknown>[] = [];
  for (const slug of slugs) {
    const { data } = await db.from("PGcode_lc_contest_scrape").select("done").eq("contest_slug", slug).maybeSingle();
    if (data?.done) { results.push({ slug, action: "already-done" }); continue; }
    results.push({ slug, action: "triggered" });
    kicks.push(
      fetch(`${SUPABASE_URL}/functions/v1/scrape-contest`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify({ contest: slug }),
      }).catch(() => {}),
    );
  }
  // Keep this invocation alive until the kick-off requests are sent, but don't
  // block the response on the (long) scrapes themselves.
  // @ts-ignore EdgeRuntime provided by Supabase
  try { EdgeRuntime.waitUntil(Promise.all(kicks)); } catch { await Promise.all(kicks); }

  return json({ ok: true, now: new Date(now).toISOString(), results });
});
