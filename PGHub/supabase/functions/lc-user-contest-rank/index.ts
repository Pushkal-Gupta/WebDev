// Supabase Edge Function: lc-user-contest-rank
// Finds a single user's RANK in a LeetCode contest by reading the public
// contest-ranking REST API (25 rows/page). LeetCode publishes the ranking
// immediately after a contest ends — well before it applies the official rating
// change — so this lets us auto-fill the rating-swing predictor for a round
// LeetCode hasn't rated yet (the round isn't in GraphQL history until rated).
//
// LeetCode's ranking REST endpoint sits behind Cloudflare's "Just a moment" JS
// challenge, which returns 403 to every plain server fetch (any IP, any header
// set — the challenge needs a real browser). We therefore fetch THROUGH Jina AI
// Reader (r.jina.ai), a keyless headless-browser proxy that solves the challenge
// and returns the raw JSON. That is the same rank EntrantHub shows.
//
// To find one user among tens of thousands without scanning every page, we
// center the scan on the page the user's RATING implies (expected rank / 25) and
// expand outward — an active rated user is found in a handful of pages.
//
// Request:  { contest: string (slug), username: string, rating?: number }
// Response: { ok:true, found:boolean, rank, score, finishTime, username,
//             totalUsers, pagesScanned } | { ok:false, error }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAGE_SIZE = 25;
const MAX_SCAN = 130;   // hard cap on pages fetched per request (bounds cost/time)
const WINDOW = 80;      // pages around the expected page we're willing to sweep
const BATCH = 10;       // pages fetched concurrently per round
const FETCH_TIMEOUT_MS = 28000;

// Representative field slice + expected-rank model, mirrored from the client
// predictor so the scan can center on the page the rating implies.
const SAMPLE_FIELD = [
  1194, 1276, 1319, 1349, 1373, 1393, 1411, 1426, 1440, 1453, 1465,
  1476, 1486, 1496, 1506, 1515, 1524, 1533, 1541, 1549, 1557, 1565,
  1573, 1581, 1588, 1596, 1604, 1611, 1619, 1627, 1635, 1643, 1652,
  1660, 1669, 1679, 1689, 1700, 1712, 1725, 1741, 1760, 1786, 1834,
];
function expectedRank(R: number, fieldSize: number): number {
  let sum = 0;
  for (const rj of SAMPLE_FIELD) sum += 1 / (1 + Math.pow(10, (R - rj) / 400));
  return 0.5 + (fieldSize / SAMPLE_FIELD.length) * sum;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const rowUsername = (r: any): string => String(r?.user_slug || r?.username || "");

let LAST_DIAG = "";

// Pull the LeetCode ranking JSON out of whatever Jina hands back: raw JSON, the
// Jina {code,data:{text}} envelope, or a "Markdown Content:" text blob.
function extractPayload(s: string): any | null {
  const t = s.trim();
  try {
    const j = JSON.parse(t);
    if (j && Array.isArray(j.total_rank)) return j;
    if (j?.data?.text) { const inner = JSON.parse(j.data.text); if (Array.isArray(inner.total_rank)) return inner; }
  } catch { /* fall through to substring scan */ }
  const i = t.indexOf('{"time"');
  if (i >= 0) { try { return JSON.parse(t.slice(i)); } catch { /* noop */ } }
  return null;
}

// Optional free Jina key (jina.ai/reader) — lifts the keyless ~20 req/min cap to
// 500 req/min so a full multi-page scan completes in one request. Set via:
//   supabase secrets set JINA_API_KEY=jina_xxx
const JINA_KEY = Deno.env.get("JINA_API_KEY") || "";

async function fetchPage(contest: string, page: number): Promise<{ rows: any[]; userNum: number } | null> {
  const target = `https://leetcode.com/contest/api/ranking/${contest}/?pagination=${page}&region=global`;
  const url = `https://r.jina.ai/${target}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { "X-Return-Format": "text", "Accept": "text/plain, application/json" };
    if (JINA_KEY) headers["Authorization"] = `Bearer ${JINA_KEY}`;
    const res = await fetch(url, { method: "GET", headers, signal: ctrl.signal });
    const text = await res.text();
    if (page === 1) LAST_DIAG = `status=${res.status} len=${text.length} head=${text.slice(0, 80).replace(/\s+/g, " ")}`;
    if (!res.ok) return null;
    const payload = extractPayload(text);
    if (!payload) return null;
    const rows = Array.isArray(payload.total_rank) ? payload.total_rank : [];
    const userNum = Number(payload.user_num ?? 0);
    return { rows, userNum };
  } catch (e) {
    if (page === 1) LAST_DIAG = `fetch-threw ${(e as Error).message}`;
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const matchRow = (rows: any[], target: string): any | null => {
  const t = target.toLowerCase();
  return rows.find((r) => rowUsername(r).toLowerCase() === t) || null;
};

function foundResponse(r: any, totalUsers: number, pagesScanned: number): Response {
  return jsonResponse({
    ok: true,
    found: true,
    rank: typeof r?.rank === "number" ? r.rank : Number(r?.rank ?? 0) || null,
    score: Number(r?.score ?? 0),
    finishTime: r?.finish_time ?? null,
    username: rowUsername(r) || null,
    totalUsers,
    pagesScanned,
  });
}

// Ordered page list: expected page first, expanding outward within WINDOW, then
// any remaining low pages — capped at MAX_SCAN. Dedups, clamps to [1,lastPage].
function scanOrder(expPage: number, lastPage: number): number[] {
  const seen = new Set<number>();
  const order: number[] = [];
  const push = (p: number) => { if (p >= 1 && p <= lastPage && !seen.has(p)) { seen.add(p); order.push(p); } };
  push(expPage);
  for (let d = 1; d <= WINDOW && order.length < MAX_SCAN; d++) { push(expPage + d); push(expPage - d); }
  for (let p = 1; p <= lastPage && order.length < MAX_SCAN; p++) push(p);
  return order.slice(0, MAX_SCAN);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "Method not allowed" }, 405);

  let contest = "";
  let username = "";
  let rating = 0;
  try {
    const body = await req.json();
    contest = String(body?.contest || "").trim();
    username = String(body?.username || "").trim();
    rating = Number(body?.rating) || 0;
    if (!contest || !/^[A-Za-z0-9-]+$/.test(contest) || contest.length > 64) {
      return jsonResponse({ ok: false, error: "invalid contest slug" });
    }
    if (!username || username.length > 64) {
      return jsonResponse({ ok: false, error: "invalid username" });
    }
  } catch {
    return jsonResponse({ ok: false, error: "invalid request body" });
  }

  try {
    // Page 1 gives user_num (field size) and covers the top 25.
    const first = await fetchPage(contest, 1);
    if (!first || (first.rows.length === 0 && first.userNum === 0)) {
      return jsonResponse({ ok: false, error: "No ranking data returned", diag: LAST_DIAG });
    }
    const totalUsers = first.userNum;
    const lastPage = totalUsers > 0 ? Math.ceil(totalUsers / PAGE_SIZE) : MAX_SCAN;

    const hitFirst = matchRow(first.rows, username);
    if (hitFirst) return foundResponse(hitFirst, totalUsers, 1);

    const expPage = rating > 0 && totalUsers > 0
      ? Math.min(Math.max(Math.round(expectedRank(rating, totalUsers) / PAGE_SIZE), 1), lastPage)
      : 2;
    const pagesToScan = scanOrder(expPage, lastPage).filter((p) => p !== 1);

    let pagesScanned = 1;
    for (let i = 0; i < pagesToScan.length; i += BATCH) {
      const batch = pagesToScan.slice(i, i + BATCH);
      const results = await Promise.all(batch.map((p) => fetchPage(contest, p).catch(() => null)));
      pagesScanned += results.length;
      for (const r of results) {
        if (!r || r.rows.length === 0) continue;
        const hit = matchRow(r.rows, username);
        if (hit) return foundResponse(hit, totalUsers || r.userNum, pagesScanned);
      }
    }

    // Not found within the scanned window — still hand back the field size so the
    // predictor can auto-fill everything except the rank.
    return jsonResponse({
      ok: true, found: false, rank: null, score: null, finishTime: null,
      username: null, totalUsers, pagesScanned,
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: (err as Error).message });
  }
});
