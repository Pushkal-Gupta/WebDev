#!/usr/bin/env node
// Probes the Supabase REST API to determine which migrations are present.
// Reads SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) and VITE_SUPABASE_URL from .env.
// Output: PASS/FAIL for each known artifact so we know what still needs applying.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Tiny .env reader (no dotenv dep needed).
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
try {
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!URL || !KEY) {
  console.error('Missing VITE_SUPABASE_URL or service/anon key in .env');
  process.exit(1);
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const ANON_UID = '00000000-0000-0000-0000-000000000000';

async function probeRpc(name, body) {
  const r = await fetch(`${URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (r.ok) return { ok: true, status: r.status };
  const txt = await r.text();
  return { ok: false, status: r.status, error: txt.slice(0, 300) };
}

async function probeTable(table, params = '?limit=1') {
  const r = await fetch(`${URL}/rest/v1/${table}${params}`, { headers });
  if (r.ok) return { ok: true, status: r.status, sample: (await r.json()).slice(0, 1) };
  const txt = await r.text();
  return { ok: false, status: r.status, error: txt.slice(0, 300) };
}

const checks = [
  // ── migrate-25 server-aggregates ─────────────
  { label: 'RPC pgcode_user_stats',         run: () => probeRpc('pgcode_user_stats', { uid: ANON_UID }) },
  { label: 'RPC pgcode_practice_history',   run: () => probeRpc('pgcode_practice_history', { uid: ANON_UID, lim: 1 }) },
  { label: 'RPC pgcode_resolve_tutorial',   run: () => probeRpc('pgcode_resolve_tutorial', { names: ['two sum'] }) },
  { label: 'VIEW pgcode_problem_catalog_v', run: () => probeTable('pgcode_problem_catalog_v') },
  // ── existing tables (sanity) ─────────────────
  { label: 'TABLE PGcode_problems',         run: () => probeTable('PGcode_problems') },
  { label: 'TABLE PGcode_concepts',         run: () => probeTable('PGcode_concepts') },
  { label: 'TABLE PGcode_modules',          run: () => probeTable('PGcode_modules') },
  { label: 'TABLE PGcode_companies',        run: () => probeTable('PGcode_companies') },
  { label: 'TABLE PGcode_user_submissions', run: () => probeTable('PGcode_user_submissions') },
  { label: 'TABLE PGcode_lists',            run: () => probeTable('PGcode_lists') },
  { label: 'TABLE PGcode_roadmaps',         run: () => probeTable('PGcode_roadmaps') },
  { label: 'TABLE PGcode_playground_snippets', run: () => probeTable('PGcode_playground_snippets') },
  { label: 'TABLE PGcode_user_achievements',   run: () => probeTable('PGcode_user_achievements') },
  { label: 'TABLE PGcode_problem_templates',   run: () => probeTable('PGcode_problem_templates') },
];

let pass = 0, fail = 0;
for (const c of checks) {
  const r = await c.run();
  if (r.ok) {
    console.log(`PASS   ${c.label}`);
    pass += 1;
  } else {
    console.log(`FAIL   ${c.label}  (HTTP ${r.status})  ${r.error}`);
    fail += 1;
  }
}
console.log(`\n${pass}/${pass + fail} present.`);
process.exit(fail ? 1 : 0);
