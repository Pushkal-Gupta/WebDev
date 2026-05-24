#!/usr/bin/env node
// Hydrate `test_cases` on LC-imported problems by pulling `exampleTestcases`
// + `metaData` from LeetCode's public GraphQL endpoint and chunking the
// newline-separated samples into per-call input arrays.
//
// Usage:
//   node scripts/scrape-lc-test-cases.js --dry --limit 5         # preview only
//   node scripts/scrape-lc-test-cases.js --limit 100             # write 100 rows
//   node scripts/scrape-lc-test-cases.js --start-from <slug>     # resume
//   node scripts/scrape-lc-test-cases.js                         # full run (slow)
//
// Behaviour:
// - Picks rows where leetcode_url IS NOT NULL AND (test_cases IS NULL
//   OR jsonb_array_length(test_cases) = 0). Already-hydrated rows skipped.
// - 1 req/sec to LC; 10s pause every 100 to stay polite.
// - Logs progress every 50 problems; resumable via --start-from.
// - Expected outputs are left null (LC's public API doesn't expose them).
//
// Requires .env with VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.

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
const REQ_DELAY_MS = 1000;
const PAUSE_EVERY = 100;
const PAUSE_MS = 10000;

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

function chunkTestcases(rawExample, paramCount) {
  // exampleTestcases is N*paramCount lines: one line per param per case.
  // If paramCount is unknown or 0, treat each line as a single-param case.
  if (!rawExample) return [];
  const lines = rawExample.split('\n');
  // LeetCode does NOT emit blank separators between cases — every line is
  // one stringified param. Trim only trailing empties (final newline).
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  if (!lines.length) return [];
  const n = Math.max(1, paramCount || 1);
  if (lines.length % n !== 0) {
    // Param-count mismatch: fall back to one-line-per-case to avoid junk.
    return lines.map(line => ({ inputs: [line], expected: null, is_sample: true }));
  }
  const cases = [];
  for (let i = 0; i < lines.length; i += n) {
    cases.push({ inputs: lines.slice(i, i + n), expected: null, is_sample: true });
  }
  return cases;
}

function paramCountFromMetaData(metaDataStr) {
  if (!metaDataStr) return 0;
  try {
    const meta = JSON.parse(metaDataStr);
    if (Array.isArray(meta.params)) return meta.params.length;
  } catch { /* malformed metaData — ignore */ }
  return 0;
}

async function fetchAllCandidates() {
  // PostgREST caps at 1000/req; paginate. Filter: has LC url, missing cases.
  const out = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await sb
      .from('PGcode_problems')
      .select('id, leetcode_url, test_cases')
      .not('leetcode_url', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const row of data) {
      const tc = row.test_cases;
      const empty = !tc || (Array.isArray(tc) && tc.length === 0);
      if (empty) out.push(row);
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

async function main() {
  console.log('Loading candidate problems from Supabase...');
  let candidates = await fetchAllCandidates();
  console.log(`Found ${candidates.length} LC-imported problems missing test_cases.`);

  if (START_FROM) {
    const idx = candidates.findIndex(c => c.id === START_FROM);
    if (idx >= 0) {
      candidates = candidates.slice(idx);
      console.log(`Resuming from ${START_FROM} (index ${idx}).`);
    } else {
      console.log(`--start-from ${START_FROM} not found; processing from top.`);
    }
  }

  if (LIMIT != null) candidates = candidates.slice(0, LIMIT);

  const totalEstSec = candidates.length * (REQ_DELAY_MS / 1000)
    + Math.floor(candidates.length / PAUSE_EVERY) * (PAUSE_MS / 1000);
  const mins = Math.floor(totalEstSec / 60);
  const secs = Math.round(totalEstSec % 60);
  console.log(`Will process ${candidates.length} problems. Estimated time: ~${mins}m ${secs}s.`);
  if (DRY) console.log('[DRY] No writes will be performed.');

  const samplePreviews = [];
  const failures = [];
  let updated = 0;
  let skipped = 0;
  let processed = 0;

  for (const row of candidates) {
    const slug = extractSlug(row.leetcode_url) || row.id;
    processed++;
    try {
      const data = await gql(Q_DETAIL, { titleSlug: slug });
      const q = data?.question;
      if (!q) {
        skipped++;
        failures.push({ slug, reason: 'no question data' });
      } else {
        const paramCount = paramCountFromMetaData(q.metaData);
        const cases = chunkTestcases(q.exampleTestcases, paramCount);
        if (!cases.length) {
          skipped++;
          failures.push({ slug, reason: 'no exampleTestcases' });
        } else {
          if (samplePreviews.length < 5) {
            samplePreviews.push({ id: row.id, slug, paramCount, cases });
          }
          if (!DRY) {
            const { error } = await sb
              .from('PGcode_problems')
              .update({ test_cases: cases })
              .eq('id', row.id);
            if (error) {
              failures.push({ slug, reason: `update: ${error.message.slice(0, 100)}` });
              skipped++;
            } else {
              updated++;
            }
          } else {
            updated++;
          }
        }
      }
    } catch (e) {
      skipped++;
      failures.push({ slug, reason: e.message.slice(0, 120) });
    }

    if (processed % 50 === 0) {
      console.log(`  [${processed}/${candidates.length}] updated=${updated} skipped=${skipped}`);
    }
    if (processed % PAUSE_EVERY === 0 && processed < candidates.length) {
      console.log(`  pausing ${PAUSE_MS}ms (every ${PAUSE_EVERY})...`);
      await sleep(PAUSE_MS);
    } else {
      await sleep(REQ_DELAY_MS);
    }
  }

  console.log(`\nDone. updated=${updated} skipped=${skipped} processed=${processed}`);
  if (samplePreviews.length) {
    console.log('\nSample payloads:');
    for (const s of samplePreviews) {
      console.log(`  ${s.id} (params=${s.paramCount}, cases=${s.cases.length}):`);
      console.log(`    ${JSON.stringify(s.cases.slice(0, 2))}`);
    }
  }
  if (failures.length) {
    console.log(`\nFirst 10 failures:`);
    for (const f of failures.slice(0, 10)) console.log(`  ${f.slug}: ${f.reason}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
