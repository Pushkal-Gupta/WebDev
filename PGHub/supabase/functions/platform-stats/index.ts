// Supabase Edge Function: platform-stats
// Server-side stats proxy for platforms that block browser CORS or only expose
// data in HTML: CodeChef, HackerRank, GeeksforGeeks. Each scraper is best-effort
// and degrades to { ok:false } instead of throwing the whole request.
//
// Request:  { platform: 'codechef'|'hackerrank'|'gfg', handle: string }
// Response: { ok:true, stats:{ solved?:number, items:[{label,value}] } }
//           | { ok:false, error:string }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const num = (s: string | null | undefined): number | null => {
  if (s == null) return null;
  const n = parseInt(String(s).replace(/[,\s]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

// --- HackerRank: public REST badges endpoint (JSON) ---
async function hackerrank(handle: string) {
  const r = await fetch(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(handle)}/badges`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!r.ok) throw new Error("user not found");
  const d = await r.json();
  const models = Array.isArray(d?.models) ? d.models : [];
  if (models.length === 0) throw new Error("no public badges");
  let stars = 0, solved = 0;
  for (const m of models) { stars += Number(m.stars) || 0; solved += Number(m.solved) || 0; }
  return {
    solved,
    items: [
      { label: "Stars", value: stars },
      { label: "Badges", value: models.filter((m: Record<string, unknown>) => Number(m.stars) > 0).length },
      { label: "Solved", value: solved },
    ],
  };
}

// --- CodeChef: profile HTML scrape ---
async function codechef(handle: string) {
  const r = await fetch(`https://www.codechef.com/users/${encodeURIComponent(handle)}`, {
    headers: { "User-Agent": UA },
  });
  if (r.status === 404) throw new Error("user not found");
  if (!r.ok) throw new Error("codechef unavailable");
  const html = await r.text();
  if (/userNotFound|user not found/i.test(html)) throw new Error("user not found");

  const rating = num(html.match(/<div class="rating-number">\s*(\d+)/)?.[1] ?? null);
  const highest = num(html.match(/Highest Rating\s*(\d+)/i)?.[1] ?? null);
  const stars = num(html.match(/<span class="rating">\s*(\d+)\s*★/)?.[1] ?? null);
  const ranksBlock = html.split("rating-ranks")[1] || html;
  const global = num(ranksBlock.match(/<strong>\s*(\d+)\s*<\/strong>/)?.[1] ?? null);
  const solved = num(html.match(/(?:Total\s+)?Problems\s+(?:Fully\s+)?Solved[^<]*<\/h3>\s*<h5[^>]*>\s*(\d+)/i)?.[1]
    ?? html.match(/Practice Problems solved[^>]*>\s*(\d+)/i)?.[1] ?? null);
  if (rating == null && stars == null) throw new Error("could not read profile");

  const items: { label: string; value: number | string }[] = [];
  if (rating != null) items.push({ label: "Rating", value: rating });
  if (highest != null) items.push({ label: "Max", value: highest });
  if (stars != null) items.push({ label: "Stars", value: `${stars}★` });
  if (global != null) items.push({ label: "Global rank", value: `#${global.toLocaleString()}` });
  return { solved: solved ?? undefined, items };
}

// --- GeeksforGeeks: __NEXT_DATA__ JSON in profile HTML ---
async function gfg(handle: string) {
  const r = await fetch(`https://www.geeksforgeeks.org/user/${encodeURIComponent(handle)}/`, {
    headers: { "User-Agent": UA },
  });
  if (r.status === 404) throw new Error("user not found");
  if (!r.ok) throw new Error("gfg unavailable");
  const html = await r.text();

  let info: Record<string, unknown> = {};
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (m) {
    try {
      const data = JSON.parse(m[1]);
      const pp = data?.props?.pageProps ?? {};
      info = (pp.userInfo ?? pp.user_info ?? pp.data?.userInfo ?? {}) as Record<string, unknown>;
    } catch { /* fall through to regex */ }
  }
  const pick = (k: string, re: RegExp) =>
    num((info[k] as string | undefined)?.toString() ?? html.match(re)?.[1] ?? null);

  const solved = pick("total_problems_solved", /"total_problems_solved":\s*(\d+)/);
  const score = pick("score", /"score":\s*(\d+)/);
  const streak = pick("pod_solved_longest_streak", /"pod_solved_longest_streak":\s*(\d+)/);
  const rank = pick("institute_rank", /"institute_rank":\s*(\d+)/);
  if (solved == null && score == null) throw new Error("could not read profile");

  const items: { label: string; value: number | string }[] = [];
  if (solved != null) items.push({ label: "Solved", value: solved });
  if (score != null) items.push({ label: "Coding score", value: score });
  if (streak != null) items.push({ label: "Streak", value: streak });
  if (rank != null && rank > 0) items.push({ label: "Institute rank", value: `#${rank.toLocaleString()}` });
  return { solved: solved ?? undefined, items };
}

const SCRAPERS: Record<string, (h: string) => Promise<unknown>> = { hackerrank, codechef, gfg };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { platform, handle } = await req.json();
    const fn = SCRAPERS[String(platform)];
    if (!fn) return json({ ok: false, error: "unsupported platform" }, 400);
    if (!handle || !String(handle).trim()) return json({ ok: false, error: "handle required" }, 400);
    const stats = await fn(String(handle).trim());
    return json({ ok: true, stats });
  } catch (err) {
    return json({ ok: false, error: (err as Error).message || "lookup failed" });
  }
});
