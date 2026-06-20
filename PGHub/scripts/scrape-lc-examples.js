#!/usr/bin/env node
// Pull LeetCode's public exampleTestcases for every PGcode_problems row that
// has a `leetcode_url` and APPEND them to test_cases as is_sample entries.
// Differs from scrape-lc-test-cases.js (which only writes to empty rows) —
// this one *augments* problems that already have a few test cases so we get
// ground-truth examples alongside auto-generated random cases.
//
// Notes
// - LC's GraphQL endpoint returns exampleTestcases as a newline-blob; we split
//   it into N param-count chunks using metaData.params.
// - Existing inputs (stringified for dedupe) are skipped — re-running is safe.
// - 1 req/sec to LC, 10s pause every 100, exponential backoff on 429.
//
// Usage:
//   node scripts/scrape-lc-examples.js --dry --limit 5         # preview only
//   node scripts/scrape-lc-examples.js --limit 50              # 50 problems
//   node scripts/scrape-lc-examples.js --start-from <slug>     # resume
//   node scripts/scrape-lc-examples.js                         # full run (slow)

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
if (!URL || !SVC) {
  console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const sb = createClient(URL, SVC);

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d = null) => {
  const i = args.indexOf(`--${n}`);
  if (i === -1) return d;
  const v = args[i + 1];
  return (v && !v.startsWith('--')) ? v : true;
};

const DRY = flag('dry');
const LIMIT = opt('limit') ? Number(opt('limit')) : null;
const START_FROM = opt('start-from') || null;
const TARGET = Number(opt('target') || 50);
const REQ_DELAY_MS = 2000;        // 1 req per 2s — polite, prompt asked for this rate
const PAUSE_EVERY = 100;
const PAUSE_MS = 10000;

const LOG_PATH = '/tmp/scrape-lc-examples-log.json';
function loadLog() {
  try { return JSON.parse(fs.readFileSync(LOG_PATH, 'utf8')); }
  catch { return { runs: [], processed: {} }; }
}
function saveLog(log) {
  try { fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2)); }
  catch (e) { console.warn(`log save failed: ${e.message}`); }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const GRAPHQL = 'https://leetcode.com/graphql';
const HEADERS = {
  'content-type': 'application/json',
  'user-agent': 'pgcode-personal-research/1.0 (single-user, polite)',
  'referer': 'https://leetcode.com/',
};

const Q_DETAIL = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      titleSlug
      exampleTestcases
      sampleTestCase
      metaData
    }
  }`;

async function gql(query, variables, attempt = 1) {
  const res = await fetch(GRAPHQL, {
    method: 'POST', headers: HEADERS,
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 429) {
    const backoff = Math.min(60000, 3000 * attempt);
    console.log(`  rate-limited, backing off ${backoff}ms`);
    await sleep(backoff);
    if (attempt < 5) return gql(query, variables, attempt + 1);
    throw new Error('Rate-limited too many times');
  }
  if (!res.ok) throw new Error(`gql ${res.status}: ${(await res.text()).slice(0, 120)}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map(e => e.message).join('; '));
  return json.data;
}

function extractSlug(leetcodeUrl) {
  if (!leetcodeUrl) return null;
  const m = leetcodeUrl.match(/leetcode\.com\/problems\/([^/?#]+)/i);
  return m ? m[1] : null;
}

function paramCountFromMetaData(metaDataStr) {
  if (!metaDataStr) return 0;
  try {
    const meta = JSON.parse(metaDataStr);
    if (Array.isArray(meta.params)) return meta.params.length;
  } catch { /* malformed metaData — ignore */ }
  return 0;
}

function chunkTestcases(rawExample, paramCount) {
  if (!rawExample) return [];
  const lines = rawExample.split('\n');
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  if (!lines.length) return [];
  const n = Math.max(1, paramCount || 1);
  if (lines.length % n !== 0) {
    return lines.map(line => ({ inputs: [line], expected: null, is_sample: true }));
  }
  const cases = [];
  for (let i = 0; i < lines.length; i += n) {
    cases.push({ inputs: lines.slice(i, i + n), expected: null, is_sample: true });
  }
  return cases;
}

async function fetchCandidates() {
  // Pull every row with leetcode_url whose test_cases are below the target.
  const out = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await sb.from('PGcode_problems')
      .select('id, leetcode_url, params, test_cases')
      .not('leetcode_url', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const row of data) {
      const tc = Array.isArray(row.test_cases) ? row.test_cases : [];
      if (tc.length < TARGET) out.push(row);
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

async function main() {
  console.log('Loading candidates...');
  let candidates = await fetchCandidates();
  console.log(`Found ${candidates.length} LC-linked problems with < ${TARGET} test cases.`);

  if (START_FROM) {
    const idx = candidates.findIndex(c => c.id === START_FROM);
    if (idx >= 0) {
      candidates = candidates.slice(idx);
      console.log(`Resuming from ${START_FROM} (index ${idx}).`);
    }
  }

  if (LIMIT != null) candidates = candidates.slice(0, LIMIT);

  const estSec = candidates.length * (REQ_DELAY_MS / 1000)
    + Math.floor(candidates.length / PAUSE_EVERY) * (PAUSE_MS / 1000);
  console.log(`Will process ${candidates.length}. Est time ~${Math.floor(estSec / 60)}m ${Math.round(estSec % 60)}s.`);
  if (DRY) console.log('[DRY] No writes will be performed.');

  const log = loadLog();
  const runStart = new Date().toISOString();
  let updated = 0, skipped = 0, processed = 0, addedTotal = 0;
  const samples = [];
  const failures = [];

  for (const row of candidates) {
    processed++;
    const slug = extractSlug(row.leetcode_url) || row.id;
    try {
      const data = await gql(Q_DETAIL, { titleSlug: slug });
      const q = data?.question;
      if (!q) { skipped++; failures.push({ slug, reason: 'no question data' }); continue; }
      const fallbackParamCount = Array.isArray(row.params) ? row.params.length : 0;
      const paramCount = paramCountFromMetaData(q.metaData) || fallbackParamCount;
      const fresh = chunkTestcases(q.exampleTestcases, paramCount);
      if (!fresh.length) { skipped++; failures.push({ slug, reason: 'no exampleTestcases' }); continue; }

      const existing = Array.isArray(row.test_cases) ? row.test_cases : [];
      const existingKeys = new Set(existing.map(tc => JSON.stringify(tc.inputs)));
      const toAdd = fresh.filter(tc => !existingKeys.has(JSON.stringify(tc.inputs)));
      if (!toAdd.length) {
        log.processed[row.id] = { added: 0, at: new Date().toISOString(), reason: 'all examples already present' };
        saveLog(log);
        continue;
      }

      const merged = [...existing, ...toAdd];
      if (samples.length < 5) samples.push({ id: row.id, slug, paramCount, added: toAdd.length, preview: toAdd.slice(0, 2) });
      if (!DRY) {
        const { error } = await sb.from('PGcode_problems')
          .update({ test_cases: merged })
          .eq('id', row.id);
        if (error) {
          failures.push({ slug, reason: `update: ${error.message.slice(0, 100)}` });
          skipped++;
          continue;
        }
      }
      updated++;
      addedTotal += toAdd.length;
      log.processed[row.id] = { added: toAdd.length, at: new Date().toISOString(), before: existing.length, after: merged.length };
      saveLog(log);
    } catch (e) {
      skipped++;
      failures.push({ slug, reason: e.message.slice(0, 120) });
    }

    if (processed % 50 === 0) {
      console.log(`  [${processed}/${candidates.length}] updated=${updated} skipped=${skipped} addedTotal=${addedTotal}`);
    }
    if (processed % PAUSE_EVERY === 0 && processed < candidates.length) {
      console.log(`  pausing ${PAUSE_MS}ms (every ${PAUSE_EVERY})...`);
      await sleep(PAUSE_MS);
    } else {
      await sleep(REQ_DELAY_MS);
    }
  }

  log.runs.push({
    started_at: runStart,
    finished_at: new Date().toISOString(),
    processed,
    updated,
    addedTotal,
  });
  saveLog(log);

  console.log(`\nDone. updated=${updated} skipped=${skipped} processed=${processed} added=${addedTotal}`);
  if (samples.length) {
    console.log('\nSample payloads:');
    for (const s of samples) {
      console.log(`  ${s.id} (params=${s.paramCount}, +${s.added}):`);
      console.log(`    ${JSON.stringify(s.preview)}`);
    }
  }
  if (failures.length) {
    console.log(`\nFirst 10 failures:`);
    for (const f of failures.slice(0, 10)) console.log(`  ${f.slug}: ${f.reason}`);
  }
  console.log(`Log: ${LOG_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
