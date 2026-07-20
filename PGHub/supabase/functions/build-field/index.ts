// Supabase Edge Function: build-field
//
// Builds the per-contest field rating distribution for the dense-field rating
// predictor. The LeetCode ranking API exposes rank but NOT rating, so we sample
// usernames spread across ALL ranks (ranking API via Jina) and fetch each user's
// PRE-contest rating via GraphQL (unrated -> 1500), storing the distribution in
// PGcode_lc_contest_field. Called by pg_cron right after a contest ends (when the
// live leaderboard shows pre-rating values). Heavy work runs in waitUntil so the
// HTTP response returns fast. Accepts { contest: slug } to (re)build a specific one.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const JINA_KEY = Deno.env.get("JINA_KEY") || "";
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const WEEKLY_ANCHOR = { ms: Date.UTC(2024, 8, 29, 2, 30), n: 417 };
const BIWEEKLY_ANCHOR = { ms: Date.UTC(2024, 9, 5, 14, 30), n: 141 };
const DURATION_MS = 90 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const FORTNIGHT_MS = 14 * 24 * 60 * 60 * 1000;
const SAMPLE_PAGES = 48;      // spread pages -> ~1200 usernames
const REBUILD_AFTER_MS = 6 * 24 * 60 * 60 * 1000; // don't rebuild a fresh field
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function latestEnded(anchor: { ms: number; n: number }, period: number, now: number): number {
  return anchor.n + Math.max(0, Math.floor((now - anchor.ms - DURATION_MS) / period));
}
function endOf(anchor: { ms: number; n: number }, period: number, n: number): number {
  return anchor.ms + (n - anchor.n) * period + DURATION_MS;
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

function extractRanking(s: string): any | null {
  const t = s.trim();
  try {
    const j = JSON.parse(t);
    if (Array.isArray(j.total_rank)) return j;
    if (j?.data?.text) { const inner = JSON.parse(j.data.text); if (Array.isArray(inner.total_rank)) return inner; }
  } catch { /* fall through */ }
  const i = t.indexOf('{"time"');
  if (i >= 0) { try { return JSON.parse(t.slice(i)); } catch { /* noop */ } }
  return null;
}
async function fetchPage(slug: string, page: number): Promise<{ rows: any[]; userNum: number }> {
  const target = `https://leetcode.com/contest/api/ranking/${slug}/?pagination=${page}&region=global`;
  for (let a = 0; a < 3; a++) {
    try {
      const headers: Record<string, string> = { "X-Return-Format": "text", Accept: "text/plain, application/json" };
      if (JINA_KEY) headers["Authorization"] = `Bearer ${JINA_KEY}`;
      let r = await fetch(`https://r.jina.ai/${target}`, { headers });
      let text = await r.text();
      if (r.status === 402 || text.includes("InsufficientBalance")) { r = await fetch(`https://r.jina.ai/${target}`, { headers: { "X-Return-Format": "text" } }); text = await r.text(); }
      const p = extractRanking(text);
      if (p) return { rows: p.total_rank || [], userNum: Number(p.user_num || 0) };
      await sleep(500 * (a + 1));
    } catch { await sleep(500 * (a + 1)); }
  }
  return { rows: [], userNum: 0 };
}
const GQLR = `query h($u:String!){userContestRankingHistory(username:$u){attended rating contest{titleSlug}}}`;
async function preRating(slug: string, user: string): Promise<number> {
  for (let a = 0; a < 2; a++) {
    try {
      const r = await fetch("https://leetcode.com/graphql", { method: "POST", headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" }, body: JSON.stringify({ query: GQLR, variables: { u: user } }) });
      if (!r.ok) { await sleep(300 * (a + 1)); continue; }
      const h = (await r.json())?.data?.userContestRankingHistory;
      if (!Array.isArray(h)) return 1500;
      let prev = 1500;
      for (const e of h) { if (e?.contest?.titleSlug === slug) return prev; if (e.rating != null) prev = e.rating; }
      return prev;
    } catch { await sleep(300 * (a + 1)); }
  }
  return 1500;
}

async function buildField(slug: string): Promise<{ slug: string; sampled: number; fieldSize: number }> {
  const first = await fetchPage(slug, 1);
  const fieldSize = first.userNum || 40000;
  const totalPages = Math.ceil(fieldSize / 25);
  const step = Math.max(1, Math.floor(totalPages / SAMPLE_PAGES));
  // gather usernames spread across ranks (paced, small concurrency to respect Jina)
  const slugs: string[] = [];
  const pages: number[] = [];
  for (let p = 1; p <= totalPages; p += step) pages.push(p);
  const PC = 4;
  for (let i = 0; i < pages.length; i += PC) {
    const got = await Promise.all(pages.slice(i, i + PC).map((p) => fetchPage(slug, p)));
    for (const g of got) for (const r of g.rows) if (r.user_slug) slugs.push(r.user_slug);
    await sleep(120);
  }
  const uniq = [...new Set(slugs)];
  const field: number[] = [];
  const GC = 12;
  for (let i = 0; i < uniq.length; i += GC) {
    const rs = await Promise.all(uniq.slice(i, i + GC).map((u) => preRating(slug, u)));
    for (const rt of rs) if (rt > 0) field.push(Math.round(rt));
    await sleep(80);
  }
  if (field.length >= 200) {
    await db.from("PGcode_lc_contest_field").upsert({ contest_slug: slug, ratings: field, field_size: fieldSize, sampled: field.length, built_at: new Date().toISOString() }, { onConflict: "contest_slug" });
  }
  return { slug, sampled: field.length, fieldSize };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  let body: any = {};
  try { body = await req.json(); } catch { /* cron sends {} or nothing */ }
  const now = Date.now();

  // Explicit slug -> (re)build it. Otherwise pick the recently-ended round(s).
  let slugs: string[] = [];
  if (body?.contest) {
    slugs = [String(body.contest)];
  } else {
    const PENDING_WINDOW_MS = 40 * 60 * 60 * 1000;
    const w = latestEnded(WEEKLY_ANCHOR, WEEK_MS, now);
    if (now - endOf(WEEKLY_ANCHOR, WEEK_MS, w) < PENDING_WINDOW_MS) slugs.push(`weekly-contest-${w}`);
    const bw = latestEnded(BIWEEKLY_ANCHOR, FORTNIGHT_MS, now);
    if (now - endOf(BIWEEKLY_ANCHOR, FORTNIGHT_MS, bw) < PENDING_WINDOW_MS) slugs.push(`biweekly-contest-${bw}`);
  }

  const todo: string[] = [];
  for (const slug of slugs) {
    if (body?.contest) { todo.push(slug); continue; }
    const { data } = await db.from("PGcode_lc_contest_field").select("built_at").eq("contest_slug", slug).maybeSingle();
    if (data?.built_at && now - new Date(data.built_at).getTime() < REBUILD_AFTER_MS) continue; // already fresh
    todo.push(slug);
  }

  const work = Promise.all(todo.map((s) => buildField(s).catch((e) => ({ slug: s, error: String(e) }))));
  // @ts-ignore EdgeRuntime provided by Supabase
  try { EdgeRuntime.waitUntil(work); } catch { await work; }

  return json({ ok: true, now: new Date(now).toISOString(), building: todo });
});
