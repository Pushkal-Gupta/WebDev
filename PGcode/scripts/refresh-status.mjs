#!/usr/bin/env node
// One-shot status auditor.
//
// Pages through PGcode_problems, computes the bucket numbers for the
// test-coverage drive (≥1 / ≥10 / ≥25 / ≥40 / ≥50 test cases, 4-lang
// solutions, full harness, explained_samples), and rewrites the two
// summary tables inside `status.md` in place — preserving every other
// section of the file untouched.
//
// Usage:
//   node scripts/refresh-status.mjs
//
// Requires .env with VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const STATUS_PATH = path.join(ROOT, 'status.md');
const SIDECAR_PATH = path.join(__dirname, '.status-last.json');

// ── Env load (mirrors scripts/multiply-test-cases.js) ────────────────────────
try {
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SVC) {
  console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const sb = createClient(URL, SVC);

// ── Bucket math ──────────────────────────────────────────────────────────────
function emptyBucket() {
  return {
    total: 0,
    python: 0,
    fourLang: 0,
    harness: 0,
    tc1: 0,
    tc10: 0,
    tc25: 0,
    tc40: 0,
    tc50: 0,
    explainedAny: 0,
    explained3: 0,
  };
}

function bumpBucket(b, row) {
  b.total += 1;

  const sol = row.solutions && typeof row.solutions === 'object' ? row.solutions : null;
  const hasPy = !!(sol && typeof sol.python === 'string' && sol.python.trim());
  const hasJs = !!(sol && typeof sol.javascript === 'string' && sol.javascript.trim());
  const hasJava = !!(sol && typeof sol.java === 'string' && sol.java.trim());
  const hasCpp = !!(sol && typeof sol.cpp === 'string' && sol.cpp.trim());
  if (hasPy) b.python += 1;
  if (hasPy && hasJs && hasJava && hasCpp) b.fourLang += 1;

  const hasMethod = !!(row.method_name && String(row.method_name).trim());
  const hasParams = Array.isArray(row.params) && row.params.length > 0;
  const hasReturn = !!(row.return_type && String(row.return_type).trim());
  if (hasMethod && hasParams && hasReturn) b.harness += 1;

  const tc = Array.isArray(row.test_cases) ? row.test_cases.length : 0;
  if (tc >= 1) b.tc1 += 1;
  if (tc >= 10) b.tc10 += 1;
  if (tc >= 25) b.tc25 += 1;
  if (tc >= 40) b.tc40 += 1;
  if (tc >= 50) b.tc50 += 1;

  const es = Array.isArray(row.explained_samples) ? row.explained_samples.length : 0;
  if (es >= 1) b.explainedAny += 1;
  if (es === 3) b.explained3 += 1;
}

// ── DB pagination ────────────────────────────────────────────────────────────
async function audit() {
  // explained_samples may not exist yet — try with, fall back without.
  const colsWithEs = 'id, difficulty, method_name, params, return_type, solutions, test_cases, explained_samples';
  const colsNoEs = 'id, difficulty, method_name, params, return_type, solutions, test_cases';

  let cols = colsWithEs;
  let explainedSamplesSupported = true;

  // Probe with a tiny request to see if the column exists.
  {
    const probe = await sb.from('PGcode_problems').select(colsWithEs).limit(1);
    if (probe.error) {
      const msg = probe.error.message || '';
      if (/explained_samples/i.test(msg) || /column .* does not exist/i.test(msg)) {
        cols = colsNoEs;
        explainedSamplesSupported = false;
        console.error('  (note: explained_samples column not present — skipping that metric)');
      } else {
        throw new Error(`Probe failed: ${msg}`);
      }
    }
  }

  const overall = emptyBucket();
  const byDiff = { Easy: emptyBucket(), Medium: emptyBucket(), Hard: emptyBucket() };

  const PAGE = 1000;
  let from = 0;
  let pages = 0;
  while (true) {
    const { data, error } = await sb
      .from('PGcode_problems')
      .select(cols)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Page at ${from}: ${error.message}`);
    if (!data || data.length === 0) break;
    pages += 1;
    for (const row of data) {
      bumpBucket(overall, row);
      const d = row.difficulty;
      if (d && byDiff[d]) bumpBucket(byDiff[d], row);
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return { overall, byDiff, pages, explainedSamplesSupported };
}

// ── Markdown table builders ──────────────────────────────────────────────────
const pct = (n, total) => (total === 0 ? '0.0%' : `${((n / total) * 100).toFixed(1)}%`);
const cell = (v) => String(v).padStart(0); // right-align handled via column ratchet

function buildTierTable(b) {
  // Mirror the original column widths/alignment to keep the file diff small.
  const rows = [
    ['Tier', 'Count', 'Share', 'What it means'],
    ['---', '---', '---', '---'],
    ['Total catalog', b.total, '100%', 'Source of truth: `PGcode_problems` rows in Supabase'],
    ['with python solution', b.python, pct(b.python, b.total), 'Canonical solution exists — verify-prune has something to grade against'],
    ['with all 4 language solutions', b.fourLang, pct(b.fourLang, b.total), 'Py + JS + Java + C++ — every workspace lang can be submitted'],
    ['with full harness (method/params/return)', b.harness, pct(b.harness, b.total), 'Every row has the grading skeleton — Workspace can route inputs to the canonical'],
    ['≥1 test case', b.tc1, pct(b.tc1, b.total), 'At least one example case'],
    ['≥10 test cases', b.tc10, pct(b.tc10, b.total), 'Above the floor — catches most wrong solutions'],
    ['≥25 test cases', b.tc25, pct(b.tc25, b.total), '(Previous soft target, now superseded.)'],
    ['≥40 test cases', b.tc40, pct(b.tc40, b.total), 'Deep coverage tier'],
    ['**≥50 test cases (NEW FLOOR)**', b.tc50, pct(b.tc50, b.total), 'The number we need to drive to **3788 / 3788**. Re-audit in next tick.'],
    ['**with 3 explained samples**', b.explained3, pct(b.explained3, b.total), 'Three explained samples shipped — render in description + viz.'],
    ['**mutation-tested**', 0, '0%', 'No mutation testing has run. New work item.'],
  ];

  const align = ['l', 'r', 'r', 'l'];
  return renderTable(rows, align);
}

function buildDiffTable(byDiff, overall) {
  const order = ['Easy', 'Medium', 'Hard'];
  const rows = [
    ['Difficulty', 'Total', '≥1 tc', '≥10 tc', '≥25 tc', '≥50 tc', 'gap to ≥50'],
    ['---', '---', '---', '---', '---', '---', '---'],
  ];
  for (const d of order) {
    const b = byDiff[d];
    const gap = Math.max(0, b.total - b.tc50);
    rows.push([d, b.total, b.tc1, b.tc10, b.tc25, b.tc50, gap]);
  }
  const gapTotal = Math.max(0, overall.total - overall.tc50);
  rows.push(['**Total**', overall.total, overall.tc1, overall.tc10, overall.tc25, overall.tc50, gapTotal]);
  const align = ['l', 'r', 'r', 'r', 'r', 'r', 'r'];
  return renderTable(rows, align);
}

function renderTable(rows, align) {
  // Compute column widths from non-separator rows.
  const cols = rows[0].length;
  const widths = Array(cols).fill(0);
  for (const r of rows) {
    if (r.every((c) => c === '---')) continue;
    for (let i = 0; i < cols; i++) {
      const s = String(r[i]);
      if (s.length > widths[i]) widths[i] = s.length;
    }
  }
  const lines = [];
  for (const r of rows) {
    if (r.every((c) => c === '---')) {
      const sep = widths.map((w, i) => {
        const a = align[i] || 'l';
        const base = '-'.repeat(Math.max(3, w));
        if (a === 'r') return base.slice(0, -1) + ':';
        if (a === 'c') return ':' + base.slice(1, -1) + ':';
        return base;
      });
      lines.push(`| ${sep.join(' | ')} |`);
      continue;
    }
    const cells = r.map((c, i) => {
      const s = String(c);
      const a = align[i] || 'l';
      const w = widths[i];
      if (a === 'r') return s.padStart(w);
      return s.padEnd(w);
    });
    lines.push(`| ${cells.join(' | ')} |`);
  }
  return lines.join('\n');
}

// ── status.md surgery ────────────────────────────────────────────────────────
function replaceTableUnderHeading(md, headingRegex, newTable) {
  const headIdx = md.search(headingRegex);
  if (headIdx === -1) throw new Error(`status.md missing heading matching ${headingRegex}`);
  // Find the first table after the heading (line starting with `|`).
  const after = md.slice(headIdx);
  const tableStartRel = after.search(/^\|/m);
  if (tableStartRel === -1) throw new Error(`No markdown table found after heading ${headingRegex}`);
  const tableStart = headIdx + tableStartRel;

  // Table ends at the first blank line (or end of file) AFTER the table starts.
  const rest = md.slice(tableStart);
  const blankRel = rest.search(/\n[ \t]*\n/);
  const tableEnd = blankRel === -1 ? md.length : tableStart + blankRel;

  return md.slice(0, tableStart) + newTable + md.slice(tableEnd);
}

function nowStamp() {
  // YYYY-MM-DD HH:MM PT — matches the existing format.
  const d = new Date();
  const opts = { timeZone: 'America/Los_Angeles', hour12: false };
  const fmt = new Intl.DateTimeFormat('en-CA', {
    ...opts,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} PT`;
}

function updateRefreshedLine(md, stamp, deltaLine) {
  const re = /^\*\*Last refreshed:\*\*[^\n]*\n/m;
  if (!re.test(md)) throw new Error('status.md missing "Last refreshed:" line');
  const replacement = `**Last refreshed:** ${stamp} — auto-audit via scripts/refresh-status.mjs.\n${deltaLine ? deltaLine + '\n' : ''}`;
  // If there's an existing optional delta footer line directly under, replace it too.
  return md.replace(/^\*\*Last refreshed:\*\*[^\n]*\n(_Δ[^\n]*\n)?/m, replacement);
}

// ── Driver ───────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(STATUS_PATH)) {
    console.error(`status.md not found at ${STATUS_PATH}`);
    process.exit(1);
  }
  let md = fs.readFileSync(STATUS_PATH, 'utf8');

  // Sanity: required anchors.
  const tierHeadingRe = /^## Where we are right now[^\n]*$/m;
  const diffHeadingRe = /^\*\*By difficulty[^\n]*$/m;
  if (!tierHeadingRe.test(md) || !diffHeadingRe.test(md)) {
    console.error('status.md is malformed: missing "## Where we are right now" or "**By difficulty" anchors');
    process.exit(1);
  }

  console.log('Auditing PGcode_problems …');
  const { overall, byDiff, pages, explainedSamplesSupported } = await audit();
  console.log(`  paged ${pages} batch(es) of 1000`);

  // Load previous numbers for delta footer.
  let prev = null;
  try { prev = JSON.parse(fs.readFileSync(SIDECAR_PATH, 'utf8')); } catch { /* first run */ }

  const tierTable = buildTierTable(overall);
  const diffTable = buildDiffTable(byDiff, overall);

  // Stdout summary.
  const line = (k, v, total) => `  ${k.padEnd(38)} ${String(v).padStart(5)}  ${pct(v, total).padStart(6)}`;
  console.log('');
  console.log(`Total catalog: ${overall.total}`);
  console.log(line('with python solution', overall.python, overall.total));
  console.log(line('with all 4 language solutions', overall.fourLang, overall.total));
  console.log(line('with full harness', overall.harness, overall.total));
  console.log(line('≥1 test case', overall.tc1, overall.total));
  console.log(line('≥10 test cases', overall.tc10, overall.total));
  console.log(line('≥25 test cases', overall.tc25, overall.total));
  console.log(line('≥40 test cases', overall.tc40, overall.total));
  console.log(line('≥50 test cases (FLOOR)', overall.tc50, overall.total));
  if (explainedSamplesSupported) {
    console.log(line('explained_samples (≥1)', overall.explainedAny, overall.total));
    console.log(line('explained_samples (==3)', overall.explained3, overall.total));
  } else {
    console.log('  explained_samples column not yet present');
  }
  console.log('');
  console.log('By difficulty (Easy / Medium / Hard):');
  for (const d of ['Easy', 'Medium', 'Hard']) {
    const b = byDiff[d];
    console.log(`  ${d.padEnd(7)} total=${b.total}  tc≥1=${b.tc1}  tc≥10=${b.tc10}  tc≥25=${b.tc25}  tc≥50=${b.tc50}`);
  }
  console.log('');

  // Build delta footer.
  let deltaLine = '';
  if (prev) {
    const dTc50 = overall.tc50 - (prev.tc50 ?? 0);
    const dExp = overall.explained3 - (prev.explained3 ?? 0);
    const fmt = (v) => (v > 0 ? `+${v}` : `${v}`);
    deltaLine = `_Δ since last refresh: ≥50 tc ${fmt(dTc50)}, explained samples (==3) ${fmt(dExp)}._`;
    console.log(deltaLine);
  } else {
    console.log('(No prior snapshot — delta footer skipped on first run.)');
  }

  // Rewrite the two tables + timestamp.
  md = replaceTableUnderHeading(md, tierHeadingRe, tierTable);
  md = replaceTableUnderHeading(md, diffHeadingRe, diffTable);
  md = updateRefreshedLine(md, nowStamp(), deltaLine);

  fs.writeFileSync(STATUS_PATH, md);
  console.log(`\nstatus.md rewritten at ${STATUS_PATH}`);

  // Persist sidecar.
  const snapshot = {
    at: new Date().toISOString(),
    total: overall.total,
    python: overall.python,
    fourLang: overall.fourLang,
    harness: overall.harness,
    tc1: overall.tc1,
    tc10: overall.tc10,
    tc25: overall.tc25,
    tc40: overall.tc40,
    tc50: overall.tc50,
    explainedAny: overall.explainedAny,
    explained3: overall.explained3,
    byDiff,
  };
  fs.writeFileSync(SIDECAR_PATH, JSON.stringify(snapshot, null, 2));
}

main().catch((e) => {
  console.error(e?.stack || e?.message || String(e));
  process.exit(1);
});
