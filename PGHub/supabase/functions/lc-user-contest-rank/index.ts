// Supabase Edge Function: lc-user-contest-rank
// Finds a single user's RANK in a LeetCode contest by scanning the public
// contest-ranking REST API page by page (25 rows/page) server-side. LeetCode
// publishes the ranking immediately after a contest ends — well before it
// applies the official rating change — so this lets us predict the rating swing
// for a round LeetCode hasn't rated yet.
//
// Request:  { contest: string (slug, e.g. "weekly-contest-508"), username: string }
// Response on success: {
//   ok: true, found: boolean,
//   rank: number|null, score: number|null, finishTime: number|null,
//   username: string|null, totalUsers: number, pagesScanned: number,
// }
// Response on any fetch failure: { ok: false, error } with HTTP 200 — the client
// falls back to its what-if path rather than surfacing a 5xx.
//
// LeetCode's ranking endpoint requires no auth but rejects requests without a
// browser-like User-Agent / Referer, so we send them.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAGE_SIZE = 25;
const MAX_USERS = 10000; // never scan past rank ~10k
const MAX_PAGES = Math.ceil(MAX_USERS / PAGE_SIZE); // 400
const BATCH = 5; // pages fetched concurrently per round

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function rowUsername(r: any): string {
  return String(r?.username || r?.user_slug || "");
}

let LAST_DIAG = "";

async function fetchPage(contest: string, page: number): Promise<{ rows: any[]; userNum: number } | null> {
  // LeetCode's ranking REST API — try both region variants (the web app uses
  // global_v2). Whichever returns rows wins.
  for (const region of ["global_v2", "global"]) {
    const url = `https://leetcode.com/contest/api/ranking/${contest}/?pagination=${page}&region=${region}`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Referer": `https://leetcode.com/contest/${contest}/ranking/`,
          "Origin": "https://leetcode.com",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          "Accept": "application/json",
          "Accept-Language": "en-US,en;q=0.9",
          "x-requested-with": "XMLHttpRequest",
        },
      });
      const text = await res.text();
      if (page === 1) LAST_DIAG = `region=${region} status=${res.status} ct=${res.headers.get("content-type")} body[0:120]=${text.slice(0, 120).replace(/\s+/g, " ")}`;
      if (!res.ok) continue;
      let payload: any;
      try { payload = JSON.parse(text); } catch { continue; }
      const rows = Array.isArray(payload?.total_rank) ? payload.total_rank : [];
      const userNum = Number(payload?.user_num ?? 0);
      if (rows.length > 0 || userNum > 0) return { rows, userNum };
    } catch (e) {
      if (page === 1) LAST_DIAG = `region=${region} fetch-threw ${(e as Error).message}`;
    }
  }
  return null;
}

function matchRow(rows: any[], target: string): any | null {
  const t = target.toLowerCase();
  for (const r of rows) {
    if (rowUsername(r).toLowerCase() === t) return r;
  }
  return null;
}

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  let contest = "";
  let username = "";
  try {
    const body = await req.json();
    contest = String(body?.contest || "").trim();
    username = String(body?.username || "").trim();
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
    // Page 1 also gives us user_num so we know how far to scan.
    const first = await fetchPage(contest, 1);
    if (!first || first.rows.length === 0) {
      return jsonResponse({ ok: false, error: "No ranking data returned", diag: LAST_DIAG });
    }
    const totalUsers = first.userNum;
    const hitFirst = matchRow(first.rows, username);
    if (hitFirst) return foundResponse(hitFirst, totalUsers, 1);

    const lastPage = Math.min(
      MAX_PAGES,
      totalUsers > 0 ? Math.ceil(totalUsers / PAGE_SIZE) : MAX_PAGES,
    );

    let pagesScanned = 1;
    for (let start = 2; start <= lastPage; start += BATCH) {
      const pages: number[] = [];
      for (let p = start; p < start + BATCH && p <= lastPage; p++) pages.push(p);
      const results = await Promise.all(pages.map((p) => fetchPage(contest, p).catch(() => null)));
      pagesScanned += results.length;
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (!r || r.rows.length === 0) continue;
        const hit = matchRow(r.rows, username);
        if (hit) return foundResponse(hit, totalUsers || r.userNum, pagesScanned);
      }
    }

    return jsonResponse({
      ok: true,
      found: false,
      rank: null,
      score: null,
      finishTime: null,
      username: null,
      totalUsers,
      pagesScanned,
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: (err as Error).message });
  }
});
