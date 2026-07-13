// Supabase Edge Function: lc-contest
//
// Builds an EntrantHub-style per-contest result table for one or more LeetCode
// users, using LeetCode's PUBLIC GraphQL API (userContestRankingHistory) — which,
// unlike the REST /contest/api/ranking/ endpoint, is NOT behind Cloudflare's
// "Just a moment" JS challenge and so is reachable from server infrastructure.
//
// For any RATED contest this returns each user's real row: rank, old rating,
// rating change, new rating, and problems solved — the exact columns EntrantHub
// shows, straight from GraphQL (reliable, no Cloudflare).
//
// For a PENDING (not-yet-rated) contest GraphQL has no entry yet, so we fall back
// to a SHARED scan of LeetCode's live ranking through Jina AI Reader (a headless-
// browser proxy that clears Cloudflare). The scan fetches each ranking page ONCE
// and matches ALL requested users against it (not one scan per user), centering
// on the page each user's rating implies. Those rows come back with the real rank
// + old rating and pending:true; the client projects the swing with the same
// predictor. That mirrors EntrantHub's live pre-rating leaderboard.
//
// Request:  { contest: string|number, usernames?: string[], username?: string }
//             contest accepts a slug ("weekly-contest-509"), a title
//             ("Weekly Contest 509"), or a bare number (509 / "bw-141").
// Response: {
//   ok: true,
//   contest: { number, kind: "weekly"|"biweekly", title, slug },
//   totalUsers: number,
//   rows: Array<{ username, found, rated, pending?, rank, oldRating,
//                 newRating?, change?, problemsSolved?, totalProblems?,
//                 contestsPlayed?, fieldSize? }>,
//   note?: string
// }
// On bad input: { ok: false, error } with HTTP 200 so the client degrades
// gracefully rather than surfacing a 5xx.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Durable cache (PGcode_lc_rank_cache): only the expensive live SCAN result is
// cached (rank/score/solved/field size). GraphQL still runs every request to
// detect rated-vs-pending and read the old rating, so a contest that gets rated
// is never served a stale projection. Best-effort — failures don't break the scan.
const db = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

async function readScanCache(slug: string, user: string): Promise<{ rank: number; score: number; solved: number; total: number; field_size: number } | null> {
  try {
    const { data } = await db.from("PGcode_lc_rank_cache")
      .select("rank, score, solved, total, field_size, fetched_at")
      .eq("contest_slug", slug.toLowerCase())
      .eq("user_slug", user.toLowerCase())
      .maybeSingle();
    if (!data || !data.rank) return null;
    if (Date.now() - new Date(data.fetched_at).getTime() > CACHE_TTL_MS) return null;
    return { rank: data.rank, score: data.score, solved: data.solved, total: data.total, field_size: data.field_size };
  } catch { return null; }
}

async function writeScanCache(slug: string, user: string, hit: { rank: number; score: number; solved: number; total: number }, oldRating: number, contestsPlayed: number, fieldSize: number): Promise<void> {
  try {
    await db.from("PGcode_lc_rank_cache").upsert({
      contest_slug: slug.toLowerCase(),
      user_slug: user.toLowerCase(),
      rank: hit.rank, score: hit.score, solved: hit.solved, total: hit.total,
      old_rating: oldRating, contests_played: contestsPlayed, field_size: fieldSize,
      fetched_at: new Date().toISOString(),
    });
  } catch { /* best-effort */ }
}

const LC_GRAPHQL = "https://leetcode.com/graphql";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// ── Live-ranking scan (pending contests) via Jina AI Reader ───────────────────
const PAGE_SIZE = 25;
const MAX_SCAN = 120;   // cap on ranking pages fetched per request
const WINDOW = 70;      // ring radius (pages) swept around each user's expected page
const BATCH = 50;       // pages fetched concurrently — the centered scan order means
                        // the first parallel shot covers the user's expected page ±25,
                        // so most lookups resolve in ONE ~3s round-trip (not sequential)
const FETCH_TIMEOUT_MS = 28000;
const JINA_KEY = Deno.env.get("JINA_API_KEY") || "";

// Representative field slice + expected-rank model (mirrors the client predictor),
// used only to center the scan on the page a user's rating implies.
const SAMPLE_FIELD = [
  125, 174, 222, 267, 311, 354, 395, 436, 475, 514, 552,
  589, 626, 662, 697, 733, 768, 803, 838, 873, 908, 943,
  978, 1013, 1049, 1085, 1122, 1159, 1197, 1236, 1276, 1318, 1361,
  1406, 1453, 1504, 1558, 1617, 1681, 1755, 1841, 1948, 2095, 2369,
];
function expectedRank(R: number, fieldSize: number): number {
  let sum = 0;
  for (const rj of SAMPLE_FIELD) sum += 1 / (1 + Math.pow(10, (R - rj) / 400));
  return 0.5 + (fieldSize / SAMPLE_FIELD.length) * sum;
}

function extractRanking(s: string): any | null {
  const t = s.trim();
  try {
    const j = JSON.parse(t);
    if (j && Array.isArray(j.total_rank)) return j;
    if (j?.data?.text) { const inner = JSON.parse(j.data.text); if (Array.isArray(inner.total_rank)) return inner; }
  } catch { /* fall through */ }
  const i = t.indexOf('{"time"');
  if (i >= 0) { try { return JSON.parse(t.slice(i)); } catch { /* noop */ } }
  return null;
}

async function fetchRankPage(
  slug: string,
  page: number,
): Promise<{ rows: any[]; submissions: any[]; questionCount: number; userNum: number } | null> {
  const target = `https://leetcode.com/contest/api/ranking/${slug}/?pagination=${page}&region=global`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const attempt = async (useKey: boolean) => {
      const headers: Record<string, string> = { "X-Return-Format": "text", "Accept": "text/plain, application/json" };
      if (useKey && JINA_KEY) headers["Authorization"] = `Bearer ${JINA_KEY}`;
      const r = await fetch(`https://r.jina.ai/${target}`, { method: "GET", headers, signal: ctrl.signal });
      return { r, text: await r.text() };
    };
    // If the keyed request is out of balance (402), fall back to the keyless tier.
    let { r: res, text } = await attempt(true);
    if (res.status === 402 || text.includes("InsufficientBalance")) ({ r: res, text } = await attempt(false));
    if (!res.ok) return null;
    const payload = extractRanking(text);
    if (!payload) return null;
    return {
      rows: Array.isArray(payload.total_rank) ? payload.total_rank : [],
      submissions: Array.isArray(payload.submissions) ? payload.submissions : [],
      questionCount: Array.isArray(payload.questions) ? payload.questions.length : 0,
      userNum: Number(payload.user_num ?? 0),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Solved count for row i = accepted (status 10) entries in its submissions map.
function solvedAt(submissions: any[], i: number): number {
  const s = submissions?.[i];
  if (!s || typeof s !== "object") return 0;
  return Object.values(s).filter((v: any) => Number(v?.status) === 10).length;
}

// Union scan order: expanding rings around every target's expected page,
// interleaved so clustered users resolve first, then any remaining pages.
function unionScanOrder(expPages: number[], lastPage: number): number[] {
  const seen = new Set<number>();
  const order: number[] = [];
  const push = (p: number) => { if (p >= 1 && p <= lastPage && !seen.has(p)) { seen.add(p); order.push(p); } };
  for (let d = 0; d <= WINDOW && order.length < MAX_SCAN; d++) {
    for (const ep of expPages) { push(ep + d); if (d) push(ep - d); }
  }
  for (let p = 1; p <= lastPage && order.length < MAX_SCAN; p++) push(p);
  return order.slice(0, MAX_SCAN);
}

// Find every target user in the live ranking with a single shared page sweep.
async function scanRanking(
  slug: string,
  targets: Map<string, { currentRating: number }>,
): Promise<{ totalUsers: number; found: Map<string, { rank: number; score: number; solved: number; total: number }> }> {
  const found = new Map<string, { rank: number; score: number; solved: number; total: number }>();
  const first = await fetchRankPage(slug, 1);
  if (!first || (first.rows.length === 0 && first.userNum === 0)) return { totalUsers: 0, found };
  const totalUsers = first.userNum;
  const lastPage = totalUsers > 0 ? Math.ceil(totalUsers / PAGE_SIZE) : MAX_SCAN;
  const remaining = new Set([...targets.keys()]);

  const matchPage = (page: { rows: any[]; submissions: any[]; questionCount: number }) => {
    for (let i = 0; i < page.rows.length; i++) {
      const row = page.rows[i];
      // A user may be searched by either their URL slug or their display username.
      for (const key of [String(row?.user_slug || "").toLowerCase(), String(row?.username || "").toLowerCase()]) {
        if (key && remaining.has(key)) {
          found.set(key, {
            rank: Number(row.rank) || 0,
            score: Number(row.score) || 0,
            solved: solvedAt(page.submissions, i),
            total: page.questionCount || 4,
          });
          remaining.delete(key);
          break;
        }
      }
    }
  };
  matchPage(first);
  if (remaining.size === 0) return { totalUsers, found };

  const expPages = [...targets.values()].map((t) =>
    Math.min(Math.max(Math.round(expectedRank(t.currentRating, totalUsers) / PAGE_SIZE), 1), lastPage),
  );
  const order = unionScanOrder(expPages, lastPage).filter((p) => p !== 1);
  for (let i = 0; i < order.length && remaining.size > 0; i += BATCH) {
    const batch = order.slice(i, i + BATCH);
    const results = await Promise.all(batch.map((p) => fetchRankPage(slug, p).catch(() => null)));
    for (const r of results) { if (r?.rows?.length) matchPage(r); if (remaining.size === 0) break; }
  }
  return { totalUsers, found };
}

const HISTORY_QUERY = `
query userContestRankingHistory($username: String!) {
  userContestRankingHistory(username: $username) {
    attended
    rating
    ranking
    problemsSolved
    totalProblems
    contest { title titleSlug startTime }
  }
}`;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// Normalize whatever the caller passed into { number, kind, slug, title }.
function parseContest(raw: string): { number: number; kind: string; slug: string; title: string } | null {
  const s = raw.trim().toLowerCase();
  const biweekly = /\bbi[-\s]?weekly\b|^bw[-\s]?\d/.test(s) || s.includes("biweekly");
  const m = /(\d+)\s*$/.exec(s);
  if (!m) return null;
  const number = Number(m[1]);
  if (!Number.isFinite(number) || number < 1 || number > 100000) return null;
  const kind = biweekly ? "biweekly" : "weekly";
  const slug = `${kind}-contest-${number}`;
  const title = `${biweekly ? "Biweekly" : "Weekly"} Contest ${number}`;
  return { number, kind, slug, title };
}

// The contest number embedded in a history entry's title/slug.
function entryNumber(entry: any): number | null {
  const t = String(entry?.contest?.titleSlug || entry?.contest?.title || "");
  const m = /(\d+)\s*$/.exec(t.trim());
  return m ? Number(m[1]) : null;
}
function entryIsBiweekly(entry: any): boolean {
  const t = String(entry?.contest?.titleSlug || entry?.contest?.title || "").toLowerCase();
  return t.includes("biweekly");
}

async function fetchHistory(username: string): Promise<any[] | null> {
  try {
    const res = await fetch(LC_GRAPHQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": UA,
        "Referer": `https://leetcode.com/u/${encodeURIComponent(username)}/`,
        "Origin": "https://leetcode.com",
      },
      body: JSON.stringify({ query: HISTORY_QUERY, variables: { username } }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const hist = data?.data?.userContestRankingHistory;
    return Array.isArray(hist) ? hist : null;
  } catch {
    return null;
  }
}

// Build one user's row for the target contest. oldRating is the rating carried
// into the contest = the most recent rating from an earlier entry (LeetCode
// updates rating every week even for unattended contests, so we walk the full
// history to find the value immediately preceding this contest's slot).
function buildRow(username: string, hist: any[] | null, target: { number: number; kind: string }): any {
  if (!hist) return { username, found: false, attended: false, rated: false };
  const wantBiweekly = target.kind === "biweekly";
  let prevRating: number | null = null;
  for (const entry of hist) {
    const num = entryNumber(entry);
    const isBw = entryIsBiweekly(entry);
    if (num === target.number && isBw === wantBiweekly) {
      if (!entry.attended) {
        return { username, found: true, attended: false, rated: false, oldRating: prevRating };
      }
      const newRating = Number(entry.rating);
      const oldRating = prevRating ?? newRating;
      return {
        username,
        found: true,
        attended: true,
        rated: true,
        rank: Number(entry.ranking) || null,
        oldRating: Math.round(oldRating * 100) / 100,
        newRating: Math.round(newRating * 100) / 100,
        change: Math.round((newRating - oldRating) * 100) / 100,
        problemsSolved: Number(entry.problemsSolved) || 0,
        totalProblems: Number(entry.totalProblems) || 0,
      };
    }
    // rating advances after every entry (attended or not)
    if (Number.isFinite(Number(entry.rating))) prevRating = Number(entry.rating);
  }
  return { username, found: false, attended: false, rated: false };
}

// Current (last confirmed) rating + number of rated contests attended — used to
// center a pending user's scan and to seed the client-side swing projection.
function userMeta(hist: any[] | null): { currentRating: number; attendedCount: number } {
  let currentRating = 1500;
  let attendedCount = 0;
  if (Array.isArray(hist)) {
    for (const e of hist) {
      if (e?.attended) attendedCount++;
      const r = Number(e?.rating);
      if (Number.isFinite(r) && r > 0) currentRating = r;
    }
  }
  return { currentRating: Math.round(currentRating * 100) / 100, attendedCount };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  let contestRaw = "";
  let usernames: string[] = [];
  try {
    const body = await req.json();
    contestRaw = String(body?.contest ?? "").trim();
    const list = Array.isArray(body?.usernames) ? body.usernames : [];
    if (body?.username) list.push(body.username);
    usernames = [...new Set(list.map((u: unknown) => String(u || "").trim()).filter(Boolean))].slice(0, 25);
  } catch {
    return json({ ok: false, error: "invalid request body" });
  }

  const contest = parseContest(contestRaw);
  if (!contest) return json({ ok: false, error: "could not parse contest (need a number, e.g. weekly-contest-509)" });
  if (usernames.length === 0) return json({ ok: false, error: "provide at least one username" });

  const histories = await Promise.all(usernames.map((u) => fetchHistory(u)));
  const rows = usernames.map((u, i) => buildRow(u, histories[i], contest));

  // Pending users (no rated GraphQL row) → real rank from the live ranking. Try
  // the durable cache first; only the cache-misses drive the (slow) shared scan.
  const pending = rows.filter((r) => !r.rated);
  let totalUsers = 0;
  if (pending.length > 0) {
    const metaByUser = new Map<string, { currentRating: number; attendedCount: number }>();
    for (const r of pending) {
      metaByUser.set(r.username.toLowerCase(), userMeta(histories[usernames.indexOf(r.username)]));
    }

    const applyScan = (r: any, hit: { rank: number; score: number; solved: number; total: number }, meta: { currentRating: number; attendedCount: number }, fieldSize: number) => {
      r.pending = true;
      r.found = true;
      r.rank = hit.rank;
      r.score = hit.score;
      r.problemsSolved = hit.solved;
      r.totalProblems = hit.total;
      r.oldRating = meta.currentRating;
      r.contestsPlayed = meta.attendedCount;
      r.fieldSize = fieldSize;
    };

    // Cache lookups in parallel.
    const cacheHits = await Promise.all(pending.map((r) => readScanCache(contest.slug, r.username)));
    const targets = new Map<string, { currentRating: number }>();
    pending.forEach((r, i) => {
      const meta = metaByUser.get(r.username.toLowerCase())!;
      const c = cacheHits[i];
      if (c && c.rank > 0) {
        applyScan(r, { rank: c.rank, score: c.score, solved: c.solved, total: c.total }, meta, c.field_size);
        totalUsers = c.field_size || totalUsers;
      } else {
        targets.set(r.username.toLowerCase(), { currentRating: meta.currentRating });
      }
    });

    // Scan whatever the cache missed, then persist those results.
    if (targets.size > 0) {
      const { totalUsers: tu, found } = await scanRanking(contest.slug, targets);
      if (tu) totalUsers = tu;
      for (const r of rows) {
        if (r.rated || r.rank) continue;
        const hit = found.get(r.username.toLowerCase());
        const meta = metaByUser.get(r.username.toLowerCase());
        if (hit && hit.rank > 0 && meta) {
          applyScan(r, hit, meta, tu);
          await writeScanCache(contest.slug, r.username, hit, meta.currentRating, meta.attendedCount, tu);
        }
      }
    }
  }

  const anyRated = rows.some((r) => r.rated);
  const anyPendingRank = rows.some((r) => r.pending && r.rank);

  return json({
    ok: true,
    contest,
    totalUsers,
    rows: rows.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity)),
    note: anyRated
      ? undefined
      : anyPendingRank
        ? "Live ranking shown — LeetCode hasn't finalized ratings for this contest yet, so the change is our projection until it does."
        : "This contest is not yet rated by LeetCode (or these users did not attend). Rating changes appear once LeetCode finalizes the contest.",
  });
});
