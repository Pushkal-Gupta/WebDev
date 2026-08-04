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

// --- CodeChef: profile HTML scrape (rating/highest/global-rank; stars derived
// from rating since the star glyphs are colored entities, not a plain number) ---
function ccStars(rating: number | null): number | null {
  if (rating == null) return null;
  if (rating < 1400) return 1;
  if (rating < 1600) return 2;
  if (rating < 1800) return 3;
  if (rating < 2000) return 4;
  if (rating < 2200) return 5;
  if (rating < 2500) return 6;
  return 7;
}
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
  const global = num(html.match(/class=['"]global-rank['"]>\s*(\d+)/)?.[1] ?? null);
  const solved = num(html.match(/Total Problems Solved[^\d]{0,40}(\d+)/i)?.[1] ?? null);
  const stars = ccStars(rating);
  if (rating == null) throw new Error("could not read profile");

  const items: { label: string; value: number | string }[] = [{ label: "Rating", value: rating }];
  if (highest != null) items.push({ label: "Max", value: highest });
  if (stars != null) items.push({ label: "Stars", value: `${stars}★` });
  if (global != null) items.push({ label: "Global rank", value: `#${global.toLocaleString()}` });
  if (solved != null) items.push({ label: "Solved", value: solved });
  return { solved: solved ?? undefined, items };
}

// --- GeeksforGeeks: official profile JSON API (no HTML scraping needed) ---
async function gfg(handle: string) {
  const r = await fetch(
    `https://authapi.geeksforgeeks.org/api-get/user-profile-info/?handle=${encodeURIComponent(handle)}`,
    { headers: { "User-Agent": UA, Accept: "application/json" } },
  );
  if (!r.ok) throw new Error("user not found");
  const d = await r.json().catch(() => ({}));
  const x = d?.data as Record<string, unknown> | undefined;
  if (!x || (x.total_problems_solved == null && x.score == null)) throw new Error("user not found");

  const solved = Number(x.total_problems_solved) || 0;
  const rank = Number(x.institute_rank) || 0;
  const items: { label: string; value: number | string }[] = [
    { label: "Solved", value: solved },
    { label: "Score", value: Number(x.score) || 0 },
  ];
  if (x.pod_solved_longest_streak != null) items.push({ label: "Streak", value: Number(x.pod_solved_longest_streak) || 0 });
  if (rank > 0) items.push({ label: "Institute rank", value: `#${rank.toLocaleString()}` });
  return { solved, items };
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
