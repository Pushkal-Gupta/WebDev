// Supabase Edge Function: fetch-contests
//
// Pulls upcoming + recent contests from each judge's public API and upserts them
// into PGcode_external_contests. Idempotent on the deterministic `id` we build
// per platform, so re-runs refresh times/phases without duplicating rows.
//
// Sources (all public, no auth required):
//   LeetCode    GraphQL  https://leetcode.com/graphql   (allContests)
//   Codeforces  REST     https://codeforces.com/api/contest.list
//   AtCoder     scrape   https://atcoder.jp/contests/   (or kenkoooo problems API)
//   CodeChef    REST     https://www.codechef.com/api/list/contests/all
//
// Cron schedule (set after deploy):
//   supabase functions deploy fetch-contests
//   -- every 30 minutes via pg_cron + pg_net (run once in SQL):
//   --   select cron.schedule(
//   --     'fetch-contests',
//   --     '*/30 * * * *',
//   --     $$ select net.http_post(
//   --          url := 'https://<project-ref>.functions.supabase.co/fetch-contests',
//   --          headers := jsonb_build_object('Authorization','Bearer ' || '<anon-or-cron-secret>')
//   --        ); $$
//   --   );
//   Or schedule from the Supabase dashboard (Edge Functions -> Cron) at */30.
//
// Env (set via `supabase secrets set`):
//   SUPABASE_URL                 - injected automatically
//   SUPABASE_SERVICE_ROLE_KEY    - injected automatically; used to bypass RLS on write

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Platform =
  | "leetcode" | "codeforces" | "atcoder" | "codechef" | "devpost" | "kaggle" | "gsoc";

interface Row {
  id: string;
  platform: Platform;
  name: string;
  url: string | null;
  start_time: string;        // ISO
  duration_minutes: number;
  phase: "upcoming" | "ongoing" | "finished";
  extra: Record<string, unknown>;
  updated_at: string;
}

function phaseFor(startMs: number, durationMin: number): Row["phase"] {
  const now = Date.now();
  const endMs = startMs + durationMin * 60_000;
  if (now < startMs) return "upcoming";
  if (now > endMs) return "finished";
  return "ongoing";
}

// ── LeetCode ────────────────────────────────────────────────────────────────
async function fetchLeetCode(): Promise<Row[]> {
  const query = `
    query {
      allContests {
        title
        titleSlug
        startTime
        duration
      }
    }`;
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Referer": "https://leetcode.com" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`leetcode ${res.status}`);
  const json = await res.json();
  const list = json?.data?.allContests ?? [];
  return list.map((c: any): Row => {
    const startMs = c.startTime * 1000;
    const durMin = Math.round((c.duration ?? 0) / 60);
    return {
      id: `lc-${c.titleSlug}`,
      platform: "leetcode",
      name: c.title,
      url: `https://leetcode.com/contest/${c.titleSlug}`,
      start_time: new Date(startMs).toISOString(),
      duration_minutes: durMin,
      phase: phaseFor(startMs, durMin),
      extra: { titleSlug: c.titleSlug },
      updated_at: new Date().toISOString(),
    };
  });
}

// ── Codeforces ──────────────────────────────────────────────────────────────
async function fetchCodeforces(): Promise<Row[]> {
  const res = await fetch("https://codeforces.com/api/contest.list?gym=false");
  if (!res.ok) throw new Error(`codeforces ${res.status}`);
  const json = await res.json();
  if (json.status !== "OK") throw new Error(`codeforces api: ${json.comment ?? "error"}`);
  // Keep upcoming + the most recent finished ones; cap finished to avoid bloat.
  const all = (json.result ?? []) as any[];
  const upcomingOrLive = all.filter((c) => c.phase !== "FINISHED");
  const recentFinished = all
    .filter((c) => c.phase === "FINISHED")
    .sort((a, b) => b.startTimeSeconds - a.startTimeSeconds)
    .slice(0, 30);
  return [...upcomingOrLive, ...recentFinished].map((c: any): Row => {
    const startMs = (c.startTimeSeconds ?? 0) * 1000;
    const durMin = Math.round((c.durationSeconds ?? 0) / 60);
    return {
      id: `cf-${c.id}`,
      platform: "codeforces",
      name: c.name,
      url: `https://codeforces.com/contest/${c.id}`,
      start_time: new Date(startMs).toISOString(),
      duration_minutes: durMin,
      phase: phaseFor(startMs, durMin),
      extra: { cfPhase: c.phase, type: c.type },
      updated_at: new Date().toISOString(),
    };
  });
}

// ── AtCoder ─────────────────────────────────────────────────────────────────
// AtCoder has no official JSON contest feed; the community kenkoooo API exposes
// past contests, and the contests page lists upcoming. We parse the upcoming
// table off the contests page (stable markup: rows with a /contests/<slug> link
// and an ISO-ish start time + duration HH:MM).
async function fetchAtCoder(): Promise<Row[]> {
  const res = await fetch("https://atcoder.jp/contests/", {
    headers: { "Accept-Language": "en" },
  });
  if (!res.ok) throw new Error(`atcoder ${res.status}`);
  const html = await res.text();
  const rows: Row[] = [];
  // Each upcoming row: <a href="https://www.timeanddate.com/...iso=YYYYMMDDTHHmm...">
  // ... <a href="/contests/<slug>">Name</a> ... <td>HH:MM</td>
  const rowRe =
    /iso=(\d{8}T\d{4})[^"]*"[\s\S]*?\/contests\/([a-z0-9_-]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<td[^>]*class="text-center">(\d{2}):(\d{2})<\/td>/g;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(html)) !== null) {
    const [, iso, slug, name, hh, mm] = m;
    // iso like 20260614T2100 in JST (+09:00)
    const y = iso.slice(0, 4), mo = iso.slice(4, 6), d = iso.slice(6, 8);
    const h = iso.slice(9, 11), min = iso.slice(11, 13);
    const startMs = Date.parse(`${y}-${mo}-${d}T${h}:${min}:00+09:00`);
    if (Number.isNaN(startMs)) continue;
    const durMin = parseInt(hh, 10) * 60 + parseInt(mm, 10);
    rows.push({
      id: `abc-${slug}`,
      platform: "atcoder",
      name: name.trim(),
      url: `https://atcoder.jp/contests/${slug}`,
      start_time: new Date(startMs).toISOString(),
      duration_minutes: durMin,
      phase: phaseFor(startMs, durMin),
      extra: { slug },
      updated_at: new Date().toISOString(),
    });
  }
  return rows;
}

// ── CodeChef ────────────────────────────────────────────────────────────────
async function fetchCodeChef(): Promise<Row[]> {
  const res = await fetch("https://www.codechef.com/api/list/contests/all", {
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`codechef ${res.status}`);
  const json = await res.json();
  const buckets: Array<[any[], Row["phase"]]> = [
    [json.future_contests ?? [], "upcoming"],
    [json.present_contests ?? [], "ongoing"],
    [(json.past_contests ?? []).slice(0, 20), "finished"],
  ];
  const rows: Row[] = [];
  for (const [list, _bucketPhase] of buckets) {
    for (const c of list) {
      const startMs = Date.parse(c.contest_start_date_iso ?? c.contest_start_date);
      const endMs = Date.parse(c.contest_end_date_iso ?? c.contest_end_date);
      if (Number.isNaN(startMs)) continue;
      const durMin = Number.isNaN(endMs) ? 0 : Math.round((endMs - startMs) / 60_000);
      rows.push({
        id: `cc-${c.contest_code}`,
        platform: "codechef",
        name: c.contest_name,
        url: `https://www.codechef.com/${c.contest_code}`,
        start_time: new Date(startMs).toISOString(),
        duration_minutes: durMin,
        phase: phaseFor(startMs, durMin),
        extra: { code: c.contest_code },
        updated_at: new Date().toISOString(),
      });
    }
  }
  return rows;
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const sources: Array<[Platform, () => Promise<Row[]>]> = [
    ["leetcode", fetchLeetCode],
    ["codeforces", fetchCodeforces],
    ["atcoder", fetchAtCoder],
    ["codechef", fetchCodeChef],
  ];

  const collected: Row[] = [];
  const report: Record<string, string> = {};

  // Run sources independently so one judge being down doesn't sink the others.
  await Promise.all(
    sources.map(async ([platform, fn]) => {
      try {
        const rows = await fn();
        collected.push(...rows);
        report[platform] = `ok (${rows.length})`;
      } catch (err) {
        report[platform] = `error: ${(err as Error).message}`;
      }
    }),
  );

  let upserted = 0;
  if (collected.length) {
    const { error, count } = await supabase
      .from("PGcode_external_contests")
      .upsert(collected, { onConflict: "id", count: "exact" });
    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message, report }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    upserted = count ?? collected.length;
  }

  return new Response(JSON.stringify({ ok: true, upserted, report }), {
    headers: { "Content-Type": "application/json" },
  });
});
