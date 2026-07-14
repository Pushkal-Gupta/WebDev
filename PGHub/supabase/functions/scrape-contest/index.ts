// Supabase Edge Function: scrape-contest
//
// Scrapes a LeetCode contest's FULL ranking (every participant) into
// PGcode_lc_contest_ranking, so user lookups become instant DB reads instead of
// live per-user Cloudflare-bypassing page scans. Scraped ONCE per contest (ranks
// are final after a contest ends). This is what turns hundreds-of-requests-per-
// user into ~1600-requests-per-contest-ever.
//
// Resumable: progress is tracked in PGcode_lc_contest_scrape (last_page). Each
// invocation scrapes pages until a wall-clock deadline, persists progress, and —
// if the field isn't fully covered yet — re-invokes ITSELF to continue. So one
// call eventually drives the whole scrape to completion without a cron.
//
// Request: { contest: string|number }   Response: { ok, done, lastPage, fieldSize }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAGE_SIZE = 25;
// Gap-fill: each pass fetches only the pages still MISSING from the DB, skipping
// failures fast (a stuck page just stays missing and is retried next pass — it
// never blocks the sweep). Gentle concurrency stays under Jina's rate limit.
const BATCH = 12;
const STAGGER_MS = 900;
const FETCH_TIMEOUT_MS = 12000;  // a ranking page renders in <10s or it's stuck — fail fast
const DEADLINE_MS = 50000;
const MAX_PASSES = 18;           // give up on a few genuinely-unfetchable pages (fallback scan covers them)
const JINA_KEY = Deno.env.get("JINA_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const db = createClient(SUPABASE_URL, SERVICE_KEY);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

function parseContest(raw: string): { slug: string } | null {
  const s = raw.trim().toLowerCase();
  const biweekly = /\bbi[-\s]?weekly\b|^bw[-\s]?\d/.test(s) || s.includes("biweekly");
  const m = /(\d+)\s*$/.exec(s);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 1 || n > 100000) return null;
  return { slug: `${biweekly ? "biweekly" : "weekly"}-contest-${n}` };
}

function extractRanking(s: string): any | null {
  const t = s.trim();
  try {
    const j = JSON.parse(t);
    if (j && Array.isArray(j.total_rank)) return j;
    if (j?.data?.text) { const inner = JSON.parse(j.data.text); if (Array.isArray(inner.total_rank)) return inner; }
  } catch { /* substring scan */ }
  const i = t.indexOf('{"time"');
  if (i >= 0) { try { return JSON.parse(t.slice(i)); } catch { /* noop */ } }
  return null;
}

async function fetchPage(slug: string, page: number): Promise<{ rows: any[]; submissions: any[]; questionCount: number; userNum: number } | null> {
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
    let { r: res, text } = await attempt(true);
    if (res.status === 402 || text.includes("InsufficientBalance")) ({ r: res, text } = await attempt(false));
    if (!res.ok) return null;
    const p = extractRanking(text);
    if (!p) return null;
    return {
      rows: Array.isArray(p.total_rank) ? p.total_rank : [],
      submissions: Array.isArray(p.submissions) ? p.submissions : [],
      questionCount: Array.isArray(p.questions) ? p.questions.length : 0,
      userNum: Number(p.user_num ?? 0),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function pageToRows(slug: string, page: { rows: any[]; submissions: any[]; questionCount: number }): any[] {
  const out: any[] = [];
  for (let i = 0; i < page.rows.length; i++) {
    const row = page.rows[i];
    const userSlug = String(row?.user_slug || row?.username || "").toLowerCase();
    if (!userSlug) continue;
    const subs = page.submissions?.[i];
    const solved = subs && typeof subs === "object" ? Object.values(subs).filter((v: any) => Number(v?.status) === 10).length : 0;
    out.push({
      contest_slug: slug,
      user_slug: userSlug,
      username: String(row?.username || row?.user_slug || ""),
      rank: Number(row?.rank) || 0,
      score: Number(row?.score) || 0,
      solved,
      total: page.questionCount || 4,
    });
  }
  return out;
}

function selfContinue(slug: string): void {
  // Fire the next chunk as a background task so this invocation can return.
  // resume:true marks it as part of THIS chain so the concurrency guard lets it in.
  const p = fetch(`${SUPABASE_URL}/functions/v1/scrape-contest`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({ contest: slug, resume: true }),
  }).catch(() => {});
  // @ts-ignore EdgeRuntime is provided by the Supabase runtime
  try { EdgeRuntime.waitUntil(p); } catch { /* not available locally */ }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  let contest;
  let resume = false;
  try {
    const body = await req.json();
    contest = parseContest(String(body?.contest ?? ""));
    resume = body?.resume === true;
  } catch {
    return json({ ok: false, error: "invalid body" });
  }
  if (!contest) return json({ ok: false, error: "could not parse contest" });
  const slug = contest.slug;

  // Where did we leave off?
  const { data: status } = await db.from("PGcode_lc_contest_scrape")
    .select("field_size, last_page, done, updated_at").eq("contest_slug", slug).maybeSingle();
  if (status?.done) return json({ ok: true, done: true, lastPage: status.last_page, fieldSize: status.field_size });

  // Concurrency guard: only ONE chain per contest. An external trigger (no resume
  // flag) bows out if another chain touched the status in the last 90s — otherwise
  // parallel chains pile requests on Jina and cause the exact rate-limit drops.
  if (!resume && status && Date.now() - new Date(status.updated_at).getTime() < 90000) {
    return json({ ok: true, done: false, note: "chain already active" });
  }

  let fieldSize = Number(status?.field_size) || 0;
  const attempts = Number(status?.attempts) || 0;

  // First run: page 1 gives field size.
  if (fieldSize === 0) {
    const first = await fetchPage(slug, 1);
    if (!first || first.userNum === 0) return json({ ok: false, error: "no ranking data" });
    fieldSize = first.userNum;
    const rows = pageToRows(slug, first);
    if (rows.length) await db.from("PGcode_lc_contest_ranking").upsert(rows);
    await db.from("PGcode_lc_contest_scrape").upsert({ contest_slug: slug, field_size: fieldSize, last_page: 1, done: false, attempts: 0, updated_at: new Date().toISOString() });
  }

  const totalPages = Math.ceil(fieldSize / PAGE_SIZE);

  // GAP-FILL: which pages are still missing from the DB?
  const { data: missingData } = await db.rpc("lc_missing_pages", { p_slug: slug, p_total: totalPages });
  const missing: number[] = (missingData || []).map((r: any) => (typeof r === "number" ? r : r.lc_missing_pages ?? r.p));

  if (missing.length === 0) {
    await db.from("PGcode_lc_contest_scrape").upsert({ contest_slug: slug, field_size: fieldSize, last_page: totalPages, done: true, attempts, updated_at: new Date().toISOString() });
    return json({ ok: true, done: true, missing: 0, fieldSize });
  }

  // Fetch the missing pages, batch by batch, skipping failures (they stay missing
  // and get retried next pass). Stop at the deadline.
  const started = Date.now();
  let i = 0;
  for (; i < missing.length && Date.now() - started < DEADLINE_MS; i += BATCH) {
    const batch = missing.slice(i, i + BATCH);
    const results = await Promise.all(batch.map((p) => fetchPage(slug, p).catch(() => null)));
    const rows: any[] = [];
    for (const r of results) { if (r?.rows?.length) rows.push(...pageToRows(slug, r)); }
    if (rows.length) {
      for (let j = 0; j < rows.length; j += 500) await db.from("PGcode_lc_contest_ranking").upsert(rows.slice(j, j + 500));
    }
    await new Promise((res) => setTimeout(res, STAGGER_MS));
  }

  // Re-check what remains; give up on a stubborn few after MAX_PASSES so a handful
  // of unfetchable pages can't loop forever (the live scan still covers those users).
  const { data: after } = await db.rpc("lc_missing_pages", { p_slug: slug, p_total: totalPages });
  const remaining = (after || []).length;
  const nextAttempts = attempts + 1;
  const done = remaining === 0 || nextAttempts >= MAX_PASSES;

  await db.from("PGcode_lc_contest_scrape").upsert({
    contest_slug: slug, field_size: fieldSize, last_page: totalPages - remaining,
    done, attempts: nextAttempts, updated_at: new Date().toISOString(),
  });
  if (!done) selfContinue(slug);

  return json({ ok: true, done, missing: remaining, attempts: nextAttempts, fieldSize });
});
