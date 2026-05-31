#!/usr/bin/env node
// Backfill description, constraints, follow_up, hints, and sample test-case flags
// for every PGcode_problems row using the cached LC HTML in content/leetcode/<slug>.json.
//
// What it writes per problem:
//   - description: full LC HTML (so Examples render inline in the UI)
//   - constraints: array<string> parsed from <ul> after "Constraints:"
//   - follow_up:   string parsed from "Follow-up:" paragraph
//   - hints:       LC hints (only if DB has none)
//   - test_cases:  first 3 marked { sample: true, explanation } using parsed Example blocks
//
// Usage:
//   node scripts/backfill-rich-content.js --dry --limit 5
//   node scripts/backfill-rich-content.js --limit 100
//   node scripts/backfill-rich-content.js          # full run
//   node scripts/backfill-rich-content.js --slug excel-sheet-column-title

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
  return (v && !v.startsWith('--')) ? v : d;
};

const DRY = flag('dry');
const LIMIT = Number(opt('limit') || 0); // 0 = no limit
const ONE_SLUG = opt('slug');
const STARTING = opt('start-from');

const LC_DIR = path.join(__dirname, '..', 'content', 'leetcode');

function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripTags(html) {
  if (!html) return '';
  return decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

// Find a section starting with one of the headers. Returns the slice from the
// header to the next major header (Example, Constraints, Follow-up) or EOS.
function sliceAfterHeader(html, headerVariants, terminatorVariants) {
  const lower = html.toLowerCase();
  let startIdx = -1;
  for (const h of headerVariants) {
    const i = lower.indexOf(h.toLowerCase());
    if (i !== -1 && (startIdx === -1 || i < startIdx)) startIdx = i;
  }
  if (startIdx === -1) return null;
  let endIdx = html.length;
  for (const t of terminatorVariants) {
    const i = lower.indexOf(t.toLowerCase(), startIdx + 1);
    if (i !== -1 && i < endIdx) endIdx = i;
  }
  return html.slice(startIdx, endIdx);
}

function parseConstraints(html) {
  const TERMINATORS = ['follow-up', 'follow up', '<p>follow', '</body>'];
  const sec = sliceAfterHeader(html, ['<strong>Constraints', '<b>Constraints', 'Constraints:'], TERMINATORS);
  if (!sec) return null;
  // Take the first <ul>...</ul> after the header
  const ulMatch = sec.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);
  if (!ulMatch) return null;
  const items = [...ulMatch[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map(m => stripTags(m[1]))
    .filter(Boolean);
  return items.length ? items : null;
}

function parseFollowUp(html) {
  // Match the paragraph or block following "Follow-up:" / "Follow up:"
  const re = /<(?:p|div|strong|b)[^>]*>\s*(?:<[^>]+>\s*)?Follow[\s-]?up\s*:?\s*<\/[^>]+>([\s\S]+?)(?=<p[^>]*>\s*(?:<strong|<b)|<\/body>|$)/i;
  const m = html.match(re);
  if (m) {
    const t = stripTags(m[1]);
    if (t) return t.slice(0, 800);
  }
  // Fallback: anything after the literal "Follow-up:" text
  const idx = html.toLowerCase().indexOf('follow-up');
  if (idx === -1) return null;
  const tail = html.slice(idx);
  const next = tail.match(/^[\s\S]{0,2000}/);
  if (!next) return null;
  const t = stripTags(next[0]).replace(/^Follow[\s-]?up\s*:?\s*/i, '').trim();
  return t ? t.slice(0, 800) : null;
}

function parseExamples(html) {
  // Match each example block: header (Example N:) ... <pre>...</pre>
  // Capture Input / Output / Explanation
  const blocks = [];
  const re = /Example\s+(\d+)\s*:?[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  let m;
  while ((m = re.exec(html))) {
    const raw = m[2];
    const text = decodeEntities(raw.replace(/<\/?[^>]+>/g, ''));
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let input = '', output = '', explanation = '';
    let mode = null;
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.startsWith('input')) { mode = 'input'; input += line.replace(/^input\s*:?\s*/i, ''); }
      else if (lower.startsWith('output')) { mode = 'output'; output += line.replace(/^output\s*:?\s*/i, ''); }
      else if (lower.startsWith('explanation')) { mode = 'explanation'; explanation += line.replace(/^explanation\s*:?\s*/i, ''); }
      else {
        if (mode === 'input') input += ' ' + line;
        else if (mode === 'output') output += ' ' + line;
        else if (mode === 'explanation') explanation += ' ' + line;
      }
    }
    blocks.push({
      n: Number(m[1]),
      input: input.trim(),
      output: output.trim(),
      explanation: explanation.trim(),
    });
  }
  return blocks;
}

async function loadAllProblems() {
  const all = [];
  let page = 0;
  while (true) {
    const { data, error } = await sb
      .from('PGcode_problems')
      .select('id, name, leetcode_number, description, constraints, follow_up, hints, test_cases')
      .order('id', { ascending: true })
      .range(page * 1000, page * 1000 + 999);
    if (error) { console.error('select:', error.message); process.exit(1); }
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  return all;
}

async function processOne(row) {
  const lcPath = path.join(LC_DIR, `${row.id}.json`);
  if (!fs.existsSync(lcPath)) return { skipped: 'no-lc-cache' };
  let blob;
  try { blob = JSON.parse(fs.readFileSync(lcPath, 'utf8')); }
  catch { return { skipped: 'parse-fail' }; }
  if (!blob.description_html) return { skipped: 'no-html' };

  const html = blob.description_html;
  const constraints = parseConstraints(html);
  const followUp = parseFollowUp(html);
  const examples = parseExamples(html);

  const updates = {};

  // Description: replace stripped version with full LC HTML.
  if (!row.description || row.description.length < html.length / 2) {
    updates.description = html;
  }

  // Constraints: only set when we found some AND DB is missing them.
  if (constraints && constraints.length) {
    const dbConstraints = Array.isArray(row.constraints)
      ? row.constraints
      : (typeof row.constraints === 'string'
          ? row.constraints.split('\n').filter(Boolean)
          : []);
    if (dbConstraints.length === 0) {
      updates.constraints = constraints;
    }
  }

  // Follow-up: only when LC has one AND DB doesn't.
  if (followUp && !row.follow_up) {
    updates.follow_up = followUp;
  }

  // Hints: only fill when DB is empty.
  const dbHints = Array.isArray(row.hints) ? row.hints : [];
  if (dbHints.length === 0 && Array.isArray(blob.hints) && blob.hints.length) {
    updates.hints = blob.hints.map(h => stripTags(h)).filter(Boolean);
  }

  // Test cases: mark first 3 as sample with explanations from examples.
  const tcs = Array.isArray(row.test_cases) ? row.test_cases : [];
  if (tcs.length > 0 && examples.length > 0) {
    const hasSamples = tcs.some(t => t && (t.sample === true || t.is_sample === true));
    if (!hasSamples) {
      const updated = tcs.map((t, i) => {
        if (i < 3 && i < examples.length) {
          return { ...t, sample: true, explanation: examples[i].explanation || (t.explanation || '') };
        }
        return t;
      });
      updates.test_cases = updated;
    }
  }

  if (Object.keys(updates).length === 0) return { skipped: 'nothing-to-update' };

  if (DRY) return { dryUpdates: updates };

  const { error } = await sb.from('PGcode_problems').update(updates).eq('id', row.id);
  if (error) return { error: error.message };
  return { updated: Object.keys(updates) };
}

(async function main() {
  console.log('Loading problems from DB...');
  let rows = await loadAllProblems();
  console.log(`Loaded ${rows.length} problems.`);

  if (ONE_SLUG) rows = rows.filter(r => r.id === ONE_SLUG);
  if (STARTING) {
    const i = rows.findIndex(r => r.id === STARTING);
    if (i >= 0) rows = rows.slice(i);
  }
  if (LIMIT > 0) rows = rows.slice(0, LIMIT);

  console.log(`Processing ${rows.length} rows${DRY ? ' (DRY)' : ''}...\n`);

  const counters = { updated: 0, skipped: 0, errors: 0 };
  for (const row of rows) {
    const r = await processOne(row);
    if (r.updated) {
      counters.updated++;
      console.log(`  ${row.id.padEnd(50)} updated: ${r.updated.join(',')}`);
    } else if (r.dryUpdates) {
      counters.updated++;
      console.log(`  ${row.id.padEnd(50)} would update: ${Object.keys(r.dryUpdates).join(',')}`);
    } else if (r.error) {
      counters.errors++;
      console.log(`  ${row.id.padEnd(50)} ERROR: ${r.error}`);
    } else {
      counters.skipped++;
      // Quieter on skips; uncomment for debugging:
      // console.log(`  ${row.id.padEnd(50)} skip: ${r.skipped}`);
    }
  }

  console.log(`\nDone. updated=${counters.updated} skipped=${counters.skipped} errors=${counters.errors}`);
})();
