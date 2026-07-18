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
//   DevPost     REST     https://devpost.com/api/hackathons (open + upcoming)
//   Kaggle      REST     https://www.kaggle.com/api/v1/competitions/list
//                        (live only with KAGGLE_USERNAME + KAGGLE_KEY; else seed)
//   GSoC        seed     summerofcode.withgoogle.com timeline (no public API)
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
//   KAGGLE_USERNAME, KAGGLE_KEY  - OPTIONAL; enables live Kaggle fetch. Without
//                                  them Kaggle serves a curated seed list.

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

// ── DevPost ─────────────────────────────────────────────────────────────────
// Public hackathon listing JSON (no auth). Returns open + upcoming hackathons.
// `submission_period_dates` is a human string ("Jun 14 - Aug 09, 2026"); we use
// the structured `submission_period_starts_at` when present and fall back to
// parsing the date string. DevPost has no fixed duration, so we derive it from
// the submission window end where available.
// A small curated fallback of well-known recurring hackathons, used when the live
// DevPost API is unreachable/blocked (it 403s or empties for server requests). Dates
// are approximate annual windows; a successful live fetch replaces these by id.
const DEVPOST_SEED: Array<{ id: string; name: string; url: string; start: string; end: string; prize?: string }> = [
  { id: "mlh-global-hack-week", name: "MLH Global Hack Week", url: "https://mlh.io/seasons/2026/events", start: "2026-08-03T00:00:00Z", end: "2026-08-10T00:00:00Z", prize: "Swag + prizes" },
  { id: "hackmit-2026", name: "HackMIT", url: "https://hackmit.org/", start: "2026-09-12T13:00:00Z", end: "2026-09-13T21:00:00Z", prize: "$$$" },
  { id: "pennapps-2026", name: "PennApps", url: "https://pennapps.com/", start: "2026-09-05T13:00:00Z", end: "2026-09-07T21:00:00Z", prize: "$$$" },
  { id: "hack-the-north-2026", name: "Hack the North", url: "https://hackthenorth.com/", start: "2026-09-19T13:00:00Z", end: "2026-09-21T17:00:00Z", prize: "$$$" },
  { id: "calhacks-2026", name: "Cal Hacks", url: "https://calhacks.io/", start: "2026-10-17T13:00:00Z", end: "2026-10-19T17:00:00Z", prize: "$$$" },
  { id: "treehacks-2027", name: "TreeHacks (Stanford)", url: "https://www.treehacks.com/", start: "2027-02-13T13:00:00Z", end: "2027-02-15T17:00:00Z", prize: "$$$" },
];
function devpostSeedRows(): Row[] {
  return DEVPOST_SEED.map((h) => {
    const startMs = Date.parse(h.start);
    return {
      id: `dp-${h.id}`,
      platform: "devpost" as const,
      name: h.name,
      url: h.url,
      start_time: new Date(startMs).toISOString(),
      duration_minutes: Math.round((Date.parse(h.end) - startMs) / 60_000),
      phase: phaseFor(startMs, Math.round((Date.parse(h.end) - startMs) / 60_000)),
      extra: { prize: h.prize ?? null, seeded: true },
      updated_at: new Date().toISOString(),
    };
  });
}

async function fetchDevPost(): Promise<Row[]> {
  let res: Response;
  try {
    res = await fetch(
      "https://devpost.com/api/hackathons?status[]=upcoming&status[]=open",
      { headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" } },
    );
  } catch {
    return devpostSeedRows();
  }
  if (!res.ok) return devpostSeedRows();
  const json = await res.json().catch(() => ({}));
  const list = ((json?.hackathons ?? json?.data ?? []) as any[]);
  const rows: Row[] = [];
  for (const h of list) {
    // Prefer structured timestamps; fall back to parsing the dates string.
    const startRaw =
      h.submission_period_starts_at ?? h.submission_period_dates ?? null;
    const startMs = startRaw ? Date.parse(startRaw) : NaN;
    if (Number.isNaN(startMs)) continue;
    const endRaw = h.submission_period_ends_at ?? null;
    const endMs = endRaw ? Date.parse(endRaw) : NaN;
    const durMin = Number.isNaN(endMs) ? 0 : Math.round((endMs - startMs) / 60_000);
    // DevPost ids are stable; fall back to slug from the url.
    const id = h.id ?? (h.url ?? "").replace(/[^a-z0-9]+/gi, "-");
    if (!id) continue;
    rows.push({
      id: `dp-${id}`,
      platform: "devpost",
      name: h.title ?? "Untitled hackathon",
      url: h.url ?? null,
      start_time: new Date(startMs).toISOString(),
      duration_minutes: durMin,
      phase: phaseFor(startMs, durMin),
      extra: {
        thumbnail: h.thumbnail_url ?? null,
        prize: h.prize_amount ?? null,
        dates: h.submission_period_dates ?? null,
        themes: (h.themes ?? []).map((t: any) => t?.name).filter(Boolean),
      },
      updated_at: new Date().toISOString(),
    });
  }
  return rows.length ? rows : devpostSeedRows();
}

// ── Kaggle ──────────────────────────────────────────────────────────────────
// Kaggle's official competitions API requires an authenticated key
// (KAGGLE_USERNAME + KAGGLE_KEY). When that is set we hit the live REST endpoint;
// otherwise we fall back to a small curated seed so the platform isn't dark.
// Seed rows are deterministic-id'd so they upsert cleanly and get replaced the
// moment a live fetch succeeds for the same competition ref.
const KAGGLE_SEED: Array<{
  ref: string; name: string; url: string; start: string; end: string;
}> = [
  // Long-running "Getting Started" competitions that are reliably open.
  {
    ref: "titanic",
    name: "Titanic - Machine Learning from Disaster",
    url: "https://www.kaggle.com/competitions/titanic",
    start: "2018-01-01T00:00:00Z",
    end: "2030-01-01T00:00:00Z",
  },
  {
    ref: "house-prices-advanced-regression-techniques",
    name: "House Prices - Advanced Regression Techniques",
    url: "https://www.kaggle.com/competitions/house-prices-advanced-regression-techniques",
    start: "2018-01-01T00:00:00Z",
    end: "2030-01-01T00:00:00Z",
  },
  {
    ref: "digit-recognizer",
    name: "Digit Recognizer",
    url: "https://www.kaggle.com/competitions/digit-recognizer",
    start: "2018-01-01T00:00:00Z",
    end: "2030-01-01T00:00:00Z",
  },
  {
    ref: "spaceship-titanic",
    name: "Spaceship Titanic",
    url: "https://www.kaggle.com/competitions/spaceship-titanic",
    start: "2022-01-01T00:00:00Z",
    end: "2030-01-01T00:00:00Z",
  },
];

function kaggleSeedRows(): Row[] {
  return KAGGLE_SEED.map((c): Row => {
    const startMs = Date.parse(c.start);
    const endMs = Date.parse(c.end);
    const durMin = Math.round((endMs - startMs) / 60_000);
    return {
      id: `kg-${c.ref}`,
      platform: "kaggle",
      name: c.name,
      url: c.url,
      start_time: new Date(startMs).toISOString(),
      duration_minutes: durMin,
      phase: phaseFor(startMs, durMin),
      extra: { ref: c.ref, source: "seed" },
      updated_at: new Date().toISOString(),
    };
  });
}

async function fetchKaggle(): Promise<Row[]> {
  const username = Deno.env.get("KAGGLE_USERNAME");
  const key = Deno.env.get("KAGGLE_KEY");
  // No credentials -> serve the curated seed so the platform isn't dark.
  if (!username || !key) return kaggleSeedRows();

  // LIVE path: Kaggle REST API uses HTTP Basic auth (username:key).
  const auth = btoa(`${username}:${key}`);
  const res = await fetch(
    "https://www.kaggle.com/api/v1/competitions/list?sortBy=latestDeadline",
    { headers: { "Authorization": `Basic ${auth}`, "Accept": "application/json" } },
  );
  // On any auth/upstream failure, degrade to the seed rather than throwing.
  if (!res.ok) return kaggleSeedRows();
  const list = (await res.json()) as any[];
  if (!Array.isArray(list) || !list.length) return kaggleSeedRows();
  return list.map((c: any): Row => {
    const startMs = Date.parse(c.enabledDate ?? c.enabled_date ?? "");
    const endMs = Date.parse(c.deadline ?? "");
    const safeStart = Number.isNaN(startMs) ? Date.now() : startMs;
    const durMin = Number.isNaN(endMs) ? 0 : Math.round((endMs - safeStart) / 60_000);
    const ref = c.ref ?? c.id ?? c.title;
    return {
      id: `kg-${ref}`,
      platform: "kaggle",
      name: c.title ?? c.ref ?? "Kaggle competition",
      url: c.ref
        ? `https://www.kaggle.com/competitions/${String(c.ref).split("/").pop()}`
        : (c.url ?? null),
      start_time: new Date(safeStart).toISOString(),
      duration_minutes: durMin,
      phase: phaseFor(safeStart, durMin),
      extra: {
        ref,
        reward: c.reward ?? null,
        category: c.category ?? null,
        source: "live",
      },
      updated_at: new Date().toISOString(),
    };
  });
}

// ── GSoC ────────────────────────────────────────────────────────────────────
// Google Summer of Code is seasonal and has no public contest API. We seed the
// current cycle's key milestone dates so the platform shows the timeline. Update
// GSOC_CYCLE each year (dates from summerofcode.withgoogle.com program timeline).
// If/when an official timeline JSON becomes available this can be swapped to a
// live fetch; until then the seed is the source of truth.
const GSOC_CYCLE = {
  year: 2026,
  // Each milestone: [id-suffix, label, ISO start, duration in minutes].
  // Durations are nominal windows; single-day deadlines use one day.
  milestones: [
    {
      key: "org-apps",
      name: "GSoC 2026 — Mentoring organization applications",
      start: "2026-01-27T18:00:00Z",
      end: "2026-02-11T18:00:00Z",
    },
    {
      key: "contributor-apps",
      name: "GSoC 2026 — Contributor application period",
      start: "2026-03-24T18:00:00Z",
      end: "2026-04-08T18:00:00Z",
    },
    {
      key: "coding",
      name: "GSoC 2026 — Standard coding period",
      start: "2026-06-01T18:00:00Z",
      end: "2026-08-25T18:00:00Z",
    },
  ],
};

function gsocSeedRows(): Row[] {
  return GSOC_CYCLE.milestones.map((m): Row => {
    const startMs = Date.parse(m.start);
    const endMs = Date.parse(m.end);
    const durMin = Number.isNaN(endMs) ? 0 : Math.round((endMs - startMs) / 60_000);
    return {
      id: `gsoc-${GSOC_CYCLE.year}-${m.key}`,
      platform: "gsoc",
      name: m.name,
      url: "https://summerofcode.withgoogle.com/",
      start_time: new Date(startMs).toISOString(),
      duration_minutes: durMin,
      phase: phaseFor(startMs, durMin),
      extra: { year: GSOC_CYCLE.year, milestone: m.key, source: "seed" },
      updated_at: new Date().toISOString(),
    };
  });
}

// Seed-only for now; wrapped to match the fetcher signature + failure isolation.
async function fetchGSoC(): Promise<Row[]> {
  return gsocSeedRows();
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
    ["devpost", fetchDevPost],
    ["kaggle", fetchKaggle],
    ["gsoc", fetchGSoC],
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
