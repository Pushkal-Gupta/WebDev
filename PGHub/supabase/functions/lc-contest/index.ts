// Supabase Edge Function: lc-contest
//
// Builds an EntrantHub-style per-contest result table for one or more LeetCode
// users, using LeetCode's PUBLIC GraphQL API (userContestRankingHistory) — which,
// unlike the REST /contest/api/ranking/ endpoint, is NOT behind Cloudflare's
// "Just a moment" JS challenge and so is reachable from server infrastructure.
//
// For any RATED contest this returns each user's real row: rank, old rating,
// rating change, new rating, and problems solved — the exact columns EntrantHub
// shows. The full 40k-row leaderboard is intentionally NOT fetched here: that
// requires the REST ranking endpoint, which Cloudflare blocks for datacenter IPs
// (all region variants return HTTP 403). GraphQL per-user history is the reliable
// substitute — you search users into the table instead of paginating the field.
//
// Request:  { contest: string|number, usernames?: string[], username?: string }
//             contest accepts a slug ("weekly-contest-509"), a title
//             ("Weekly Contest 509"), or a bare number (509 / "bw-141").
// Response: {
//   ok: true,
//   contest: { number, kind: "weekly"|"biweekly", title, slug },
//   rows: Array<{ username, found, attended, rated, rank, oldRating,
//                 newRating, change, problemsSolved, totalProblems }>,
//   note?: string
// }
// On bad input: { ok: false, error } with HTTP 200 so the client degrades
// gracefully rather than surfacing a 5xx.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LC_GRAPHQL = "https://leetcode.com/graphql";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

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
  const anyRated = rows.some((r) => r.rated);

  return json({
    ok: true,
    contest,
    rows: rows.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity)),
    note: anyRated
      ? undefined
      : "This contest is not yet rated by LeetCode (or these users did not attend). Rating changes appear once LeetCode finalizes the contest.",
  });
});
