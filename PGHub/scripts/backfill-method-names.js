#!/usr/bin/env node
// Backfill PGcode_problems.method_name from LeetCode's official codeSnippets.
//
// Why: method_name MUST match LC's Python signature exactly so any LC-working
// solution copy-pastes cleanly into the editor. We extract `def <name>(` from
// the Python3 snippet in each cached content/leetcode/<slug>.json.
//
// Usage:
//   node scripts/backfill-method-names.js --dry              # count mismatches only
//   node scripts/backfill-method-names.js                    # apply fixes
//   node scripts/backfill-method-names.js --slugs a,b,c      # restrict to specific slugs
//   node scripts/backfill-method-names.js --rescrape         # re-fetch codeSnippets for slugs in /tmp/needs-rescrape.txt
//
// Outputs:
//   /tmp/needs-rescrape.txt  — slugs whose cached JSON lacked code_snippets
//   /tmp/method-fixes.json   — list of {slug, old, new} that were updated

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

const OUT_DIR = path.join(__dirname, '..', 'content', 'leetcode');
const NEEDS_RESCRAPE = '/tmp/needs-rescrape.txt';
const FIXES_LOG = '/tmp/method-fixes.json';

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d = null) => {
  const i = args.indexOf(`--${n}`);
  if (i === -1) return d;
  const v = args[i + 1];
  return (v && !v.startsWith('--')) ? v : true;
};

const DRY = flag('dry');
const RESCRAPE = flag('rescrape');
const DELAY_MS = Number(opt('delay') || 1200);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const GRAPHQL = 'https://leetcode.com/graphql';
const HEADERS = {
  'content-type': 'application/json',
  'user-agent': 'pgcode-personal-research/1.0 (single-user, polite)',
  'referer': 'https://leetcode.com/',
};

const Q_SNIPPETS = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      codeSnippets { lang langSlug code }
    }
  }`;

async function gql(query, variables, attempt = 1) {
  const res = await fetch(GRAPHQL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 429) {
    const backoff = Math.min(30000, 2000 * attempt);
    console.log(`  rate-limited, backing off ${backoff}ms`);
    await sleep(backoff);
    if (attempt < 5) return gql(query, variables, attempt + 1);
    throw new Error('Rate-limited too many times');
  }
  if (!res.ok) throw new Error(`gql ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map(e => e.message).join('; '));
  return json.data;
}

// Extract official method name from a Python3 snippet.
// LC snippets look like:
//   class Solution:
//       def uniqueMorseRepresentations(self, words: List[str]) -> int:
// Grab the first `def <name>(` that isn't `__init__`.
function extractPythonMethodName(snippets) {
  if (!Array.isArray(snippets)) return null;
  const py = snippets.find(s => s.langSlug === 'python3') ||
             snippets.find(s => s.langSlug === 'python') ||
             snippets.find(s => /python/i.test(s.lang || ''));
  if (!py || !py.code) return null;
  const matches = [...py.code.matchAll(/def\s+(\w+)\s*\(/g)];
  for (const m of matches) {
    if (m[1] !== '__init__') return m[1];
  }
  return null;
}

async function rescrapeOne(slug) {
  const data = await gql(Q_SNIPPETS, { titleSlug: slug });
  const q = data.question;
  if (!q) return null;
  const out = path.join(OUT_DIR, `${slug}.json`);
  let blob = {};
  if (fs.existsSync(out)) blob = JSON.parse(fs.readFileSync(out, 'utf8'));
  blob.code_snippets = (q.codeSnippets || []).map(s => ({ lang: s.lang, langSlug: s.langSlug, code: s.code }));
  blob.fetched_at = new Date().toISOString();
  fs.writeFileSync(out, JSON.stringify(blob, null, 2));
  return blob;
}

async function runRescrape() {
  if (!fs.existsSync(NEEDS_RESCRAPE)) {
    console.log(`No ${NEEDS_RESCRAPE} found — nothing to rescrape.`);
    return;
  }
  const slugs = fs.readFileSync(NEEDS_RESCRAPE, 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
  console.log(`Rescraping ${slugs.length} slugs (delay ${DELAY_MS}ms)...`);
  let ok = 0, fail = 0;
  for (const slug of slugs) {
    try {
      const b = await rescrapeOne(slug);
      if (b) { ok++; if (ok % 25 === 0) console.log(`  ${ok}/${slugs.length}`); }
      else fail++;
    } catch (e) {
      console.log(`  ${slug}: ${e.message.slice(0, 100)}`);
      fail++;
    }
    await sleep(DELAY_MS);
  }
  console.log(`Rescrape done: ${ok} ok, ${fail} failed.`);
}

async function main() {
  const URL = process.env.VITE_SUPABASE_URL;
  const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !SVC) { console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
  const sb = createClient(URL, SVC);

  if (RESCRAPE) {
    await runRescrape();
    console.log('Now re-running backfill against updated cache...\n');
  }

  // Pull every problem with a leetcode_number (paginated, PostgREST caps at 1000).
  console.log('Loading PGcode_problems rows with leetcode_number...');
  const rows = [];
  let page = 0;
  while (true) {
    const { data, error } = await sb.from('PGcode_problems')
      .select('id, method_name, leetcode_number')
      .not('leetcode_number', 'is', null)
      .range(page * 1000, page * 1000 + 999);
    if (error) { console.error(error.message); process.exit(1); }
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  console.log(`Loaded ${rows.length} candidate rows.`);

  let restrict = null;
  const slugsOpt = opt('slugs');
  if (slugsOpt && slugsOpt !== true) {
    restrict = new Set(String(slugsOpt).split(',').map(s => s.trim()).filter(Boolean));
    console.log(`Restricted to: ${[...restrict].join(', ')}`);
  }

  let checked = 0, missingCache = 0, needsRescrape = 0, noPython = 0, matched = 0, mismatches = 0, fixed = 0, failed = 0;
  const rescrapeList = [];
  const fixes = [];

  for (const row of rows) {
    if (restrict && !restrict.has(row.id)) continue;
    checked++;
    const cachePath = path.join(OUT_DIR, `${row.id}.json`);
    if (!fs.existsSync(cachePath)) { missingCache++; rescrapeList.push(row.id); continue; }
    let blob;
    try { blob = JSON.parse(fs.readFileSync(cachePath, 'utf8')); }
    catch { missingCache++; rescrapeList.push(row.id); continue; }

    if (!blob.code_snippets || !Array.isArray(blob.code_snippets) || blob.code_snippets.length === 0) {
      needsRescrape++;
      rescrapeList.push(row.id);
      continue;
    }
    const official = extractPythonMethodName(blob.code_snippets);
    if (!official) { noPython++; continue; }

    if (official === row.method_name) {
      matched++;
      continue;
    }
    mismatches++;
    fixes.push({ slug: row.id, old: row.method_name, new: official });

    if (DRY) continue;

    const { error } = await sb.from('PGcode_problems')
      .update({ method_name: official })
      .eq('id', row.id);
    if (error) {
      console.log(`  ${row.id}: UPDATE failed — ${error.message.slice(0, 120)}`);
      failed++;
    } else {
      fixed++;
      if (fixed <= 25 || fixed % 50 === 0) {
        console.log(`  fix ${row.id}: ${row.method_name || '(null)'} -> ${official}`);
      }
    }
  }

  if (rescrapeList.length) {
    fs.writeFileSync(NEEDS_RESCRAPE, rescrapeList.join('\n') + '\n');
  }
  if (fixes.length) {
    fs.writeFileSync(FIXES_LOG, JSON.stringify(fixes, null, 2));
  }

  console.log('\n=== Report ===');
  console.log(`Checked          : ${checked}`);
  console.log(`Matched (no-op)  : ${matched}`);
  console.log(`Mismatches found : ${mismatches}`);
  console.log(`Mismatches fixed : ${DRY ? 0 : fixed}`);
  console.log(`Update failures  : ${failed}`);
  console.log(`Missing cache    : ${missingCache}`);
  console.log(`Lacks snippets   : ${needsRescrape}`);
  console.log(`No python snippet: ${noPython}`);
  console.log(`Needs rescrape   : ${rescrapeList.length} -> ${NEEDS_RESCRAPE}`);
  console.log(`Fixes log        : ${fixes.length} -> ${FIXES_LOG}`);
  if (DRY) console.log('\n(DRY RUN — no DB writes performed.)');
}

main().catch(e => { console.error(e); process.exit(1); });
