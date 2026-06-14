#!/usr/bin/env node
// Seed PGcode_external_contests with sample rows spanning every platform and
// every phase (upcoming / ongoing / finished). Idempotent: upsert on id, so
// re-running overwrites with the same source-of-truth.
//
// Requires migrate-50-external-contests.sql to have been applied first.
// Loads VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env (mirrors
// push-rich-content.js). Writes go through the service role (bypasses RLS).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SVC) { console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const sb = createClient(URL, SVC);

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = Date.now();
const at = (ms) => new Date(now + ms).toISOString();

// phase is derived from start_time + duration relative to "now" at seed time,
// but stored explicitly so the calendar can group without recomputing.
const rows = [
  // ── upcoming ──────────────────────────────────────────────────────────
  { id: 'lc-weekly-441',  platform: 'leetcode',   name: 'Weekly Contest 441',         url: 'https://leetcode.com/contest/weekly-contest-441',  start: at(2 * DAY + 2 * HOUR),  dur: 90,   phase: 'upcoming',  extra: { kind: 'weekly', problems: 4 } },
  { id: 'lc-biweekly-152',platform: 'leetcode',   name: 'Biweekly Contest 152',       url: 'https://leetcode.com/contest/biweekly-contest-152', start: at(5 * DAY),            dur: 90,   phase: 'upcoming',  extra: { kind: 'biweekly', problems: 4 } },
  { id: 'cf-round-1024',  platform: 'codeforces', name: 'Codeforces Round 1024 (Div. 2)', url: 'https://codeforces.com/contest/2024',          start: at(1 * DAY + 6 * HOUR),  dur: 120,  phase: 'upcoming',  extra: { division: 2, rated: '< 2100' } },
  { id: 'cf-edu-178',     platform: 'codeforces', name: 'Educational Codeforces Round 178', url: 'https://codeforces.com/contest/2030',        start: at(4 * DAY + 3 * HOUR),  dur: 135,  phase: 'upcoming',  extra: { division: 'edu', rated: '< 2100' } },
  { id: 'abc-410',        platform: 'atcoder',    name: 'AtCoder Beginner Contest 410', url: 'https://atcoder.jp/contests/abc410',             start: at(3 * DAY + 12 * HOUR), dur: 100,  phase: 'upcoming',  extra: { rated: '< 1999', tasks: 7 } },
  { id: 'arc-200',        platform: 'atcoder',    name: 'AtCoder Regular Contest 200', url: 'https://atcoder.jp/contests/arc200',              start: at(6 * DAY + 12 * HOUR), dur: 120,  phase: 'upcoming',  extra: { rated: '< 2799', tasks: 6 } },
  { id: 'cc-starters-185',platform: 'codechef',   name: 'CodeChef Starters 185',       url: 'https://www.codechef.com/START185',               start: at(1 * DAY + 9 * HOUR),  dur: 120,  phase: 'upcoming',  extra: { divisions: 4 } },
  { id: 'cc-cookoff-jun', platform: 'codechef',   name: 'CodeChef June Cook-Off',      url: 'https://www.codechef.com/COOK',                    start: at(7 * DAY),            dur: 150,  phase: 'upcoming',  extra: { divisions: 3 } },
  { id: 'devpost-aiagents',platform: 'devpost',   name: 'Global AI Agents Hackathon',  url: 'https://aiagents.devpost.com',                     start: at(2 * DAY),            dur: 14 * 24 * 60, phase: 'upcoming', extra: { prize_usd: 50000, online: true } },
  { id: 'devpost-web3',   platform: 'devpost',    name: 'Web3 Builders Weekend',       url: 'https://web3builders.devpost.com',                 start: at(9 * DAY),            dur: 3 * 24 * 60,  phase: 'upcoming', extra: { prize_usd: 20000, online: true } },
  { id: 'kaggle-llm-prompt',platform: 'kaggle',   name: 'LLM Prompt Recovery',         url: 'https://www.kaggle.com/competitions/llm-prompt-recovery', start: at(3 * DAY), dur: 60 * 24 * 60, phase: 'upcoming', extra: { prize_usd: 25000, metric: 'SCS' } },
  { id: 'kaggle-mol-prop',platform: 'kaggle',     name: 'Molecular Property Prediction', url: 'https://www.kaggle.com/competitions/mol-prop',  start: at(10 * DAY),           dur: 75 * 24 * 60, phase: 'upcoming', extra: { prize_usd: 40000, metric: 'MAE' } },
  { id: 'gsoc-2026-apps', platform: 'gsoc',       name: 'GSoC 2026 — Contributor Applications', url: 'https://summerofcode.withgoogle.com',     start: at(12 * DAY),           dur: 14 * 24 * 60, phase: 'upcoming', extra: { stage: 'application', stipend: true } },

  // ── ongoing ───────────────────────────────────────────────────────────
  { id: 'cf-global-22',   platform: 'codeforces', name: 'Codeforces Global Round 22',  url: 'https://codeforces.com/contest/2018',              start: at(-1 * HOUR),          dur: 150,  phase: 'ongoing',   extra: { division: 'global', rated: 'all' } },
  { id: 'kaggle-arc-agi', platform: 'kaggle',     name: 'ARC Prize 2026',              url: 'https://www.kaggle.com/competitions/arc-prize-2026', start: at(-20 * DAY),       dur: 90 * 24 * 60, phase: 'ongoing', extra: { prize_usd: 1000000, metric: 'accuracy' } },
  { id: 'gsoc-2026-code', platform: 'gsoc',       name: 'GSoC 2026 — Coding Period',   url: 'https://summerofcode.withgoogle.com',              start: at(-5 * DAY),           dur: 84 * 24 * 60, phase: 'ongoing',  extra: { stage: 'coding', stipend: true } },

  // ── finished ──────────────────────────────────────────────────────────
  { id: 'lc-weekly-440',  platform: 'leetcode',   name: 'Weekly Contest 440',          url: 'https://leetcode.com/contest/weekly-contest-440',  start: at(-5 * DAY),           dur: 90,   phase: 'finished',  extra: { kind: 'weekly', participants: 24180, problems: 4 } },
  { id: 'lc-biweekly-151',platform: 'leetcode',   name: 'Biweekly Contest 151',        url: 'https://leetcode.com/contest/biweekly-contest-151', start: at(-12 * DAY),         dur: 90,   phase: 'finished',  extra: { kind: 'biweekly', participants: 11920, problems: 4 } },
  { id: 'cf-round-1023',  platform: 'codeforces', name: 'Codeforces Round 1023 (Div. 1)', url: 'https://codeforces.com/contest/2016',           start: at(-3 * DAY),           dur: 120,  phase: 'finished',  extra: { division: 1, participants: 8740 } },
  { id: 'abc-409',        platform: 'atcoder',    name: 'AtCoder Beginner Contest 409', url: 'https://atcoder.jp/contests/abc409',              start: at(-4 * DAY),           dur: 100,  phase: 'finished',  extra: { rated: '< 1999', participants: 9310 } },
  { id: 'cc-starters-184',platform: 'codechef',   name: 'CodeChef Starters 184',        url: 'https://www.codechef.com/START184',               start: at(-8 * DAY),           dur: 120,  phase: 'finished',  extra: { divisions: 4, participants: 6120 } },
];

const records = rows.map(r => ({
  id: r.id,
  platform: r.platform,
  name: r.name,
  url: r.url,
  start_time: r.start,
  duration_minutes: r.dur,
  phase: r.phase,
  extra: r.extra || {},
  updated_at: new Date().toISOString(),
}));

const { error } = await sb.from('PGcode_external_contests').upsert(records, { onConflict: 'id' });
if (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}

const { count } = await sb
  .from('PGcode_external_contests')
  .select('*', { count: 'exact', head: true });

console.log(`Seeded ${records.length} external contests. Table now holds ${count} rows.`);
