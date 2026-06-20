// Supabase Edge Function: lc-contest-ranking
// Proxies LeetCode's public contest-ranking REST API for a single contest +
// page, normalizing it to a flat shape the client can render directly.
//
// Request:  { contest: string (slug, e.g. "weekly-contest-492"), page?: number }
// Response on success: {
//   ok: true,
//   contest, page, totalUsers,
//   rankings: Array<{ rank, username, country, score, finishTime, dataRegion }>,
//   questions: Array<{ id, title, credit }>,
// }
// Response on any fetch failure: { ok: false, error } with HTTP 200 — the
// client falls back to its sample view rather than surfacing a 5xx.
//
// LeetCode's ranking endpoint requires no auth but rejects requests without a
// browser-like User-Agent / Referer, so we send them.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function normalizeRankings(rows: any): any[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({
    rank: typeof r?.rank === "number" ? r.rank : Number(r?.rank ?? 0),
    username: r?.username || r?.user_slug || "",
    country: r?.country_name || r?.country_code || "",
    score: Number(r?.score ?? 0),
    finishTime: r?.finish_time ?? null,
    dataRegion: r?.data_region || "",
  }));
}

function normalizeQuestions(rows: any): any[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((q, i) => ({
    id: q?.question_id ?? q?.id ?? i,
    title: q?.title || q?.title_slug || `Q${i + 1}`,
    credit: Number(q?.credit ?? 0),
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  let contest = "";
  let page = 1;
  try {
    const body = await req.json();
    contest = String(body?.contest || "").trim();
    const rawPage = Number(body?.page ?? 1);
    page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
    if (!contest || !/^[A-Za-z0-9-]+$/.test(contest) || contest.length > 64) {
      return jsonResponse({ ok: false, error: "invalid contest slug" });
    }
  } catch {
    return jsonResponse({ ok: false, error: "invalid request body" });
  }

  // Any failure past this point degrades to ok:false rather than throwing 5xx.
  try {
    const url =
      `https://leetcode.com/contest/api/ranking/${contest}/?pagination=${page}&region=global`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Referer": `https://leetcode.com/contest/${contest}/ranking/`,
        "Origin": "https://leetcode.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      const txt = await res.text();
      return jsonResponse({
        ok: false,
        error: `LeetCode ranking fetch failed: ${res.status} ${txt.slice(0, 160)}`,
      });
    }

    const payload = await res.json();
    const rankings = normalizeRankings(payload?.total_rank);
    if (rankings.length === 0) {
      return jsonResponse({ ok: false, error: "No ranking data returned" });
    }

    return jsonResponse({
      ok: true,
      contest,
      page,
      totalUsers: Number(payload?.user_num ?? 0),
      rankings,
      questions: normalizeQuestions(payload?.questions),
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: (err as Error).message });
  }
});
