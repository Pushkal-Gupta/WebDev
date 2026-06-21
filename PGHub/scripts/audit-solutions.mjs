// Read-only audit of PGcode_problems.solutions completeness across all 4 langs.
// Reuses the .env-loading + service-role pattern from bulk-grow-test-cases.js.
// NO secrets inline — creds come from process.env only.
//
//   node scripts/audit-solutions.mjs
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

const SUPA_URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SVC) {
  console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}
const sb = createClient(SUPA_URL, SVC);

const LANGS = ['python', 'javascript', 'java', 'cpp'];

// Pull the code string out of either {code} or a bare string.
function codeOf(entry) {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object' && typeof entry.code === 'string') return entry.code;
  return '';
}

// Heuristic: is this a stub / non-solution?
function isStub(code) {
  if (!code) return true;
  const body = code.trim();
  if (body.length < 12) return true;
  // strip comments + whitespace, then look for a real body
  const stripped = body
    .replace(/(^|\n)\s*(#|\/\/).*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
  if (stripped.length < 12) return true;
  // common empty bodies
  if (/^\s*(pass|\.\.\.|return\s*(None|null|0|;)?\s*)$/i.test(stripped)) return true;
  // a function/method that only contains pass/return None/.../empty
  if (/(:|\{)\s*(pass|\.\.\.|return\s*(None|null)?\s*;?)\s*\}?\s*$/i.test(stripped)
      && stripped.split('\n').length <= 3) return true;
  return false;
}

async function main() {
  const PAGE = 1000;
  let from = 0;
  let rows = [];
  // paginate
  for (;;) {
    const { data, error } = await sb
      .from('PGcode_problems')
      .select('id, name, difficulty, solutions, test_cases')
      .range(from, from + PAGE - 1);
    if (error) { console.error(error); process.exit(1); }
    if (!data || data.length === 0) break;
    rows = rows.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  const total = rows.length;
  const langPresent = { python: 0, javascript: 0, java: 0, cpp: 0 };
  const langReal = { python: 0, javascript: 0, java: 0, cpp: 0 };
  let pyStub = 0;
  let allFourReal = 0;
  let zeroSolutions = 0;
  let testsButNoUsablePy = 0;
  const byDiff = {}; // diff -> {total, allFour, pyReal}
  const pyEqualsOther = { javascript: 0, java: 0, cpp: 0 }; // copy-pasted python smell

  for (const r of rows) {
    const sols = r.solutions || {};
    const code = {};
    let presentCount = 0;
    let realCount = 0;
    for (const L of LANGS) {
      code[L] = codeOf(sols[L]);
      if (code[L]) { langPresent[L] += 1; presentCount += 1; }
      const real = code[L] && !isStub(code[L]);
      if (real) langReal[L] += 1;
      if (real) realCount += 1;
    }
    if (presentCount === 0) zeroSolutions += 1;
    if (code.python && isStub(code.python)) pyStub += 1;
    const pyReal = code.python && !isStub(code.python);
    if (LANGS.every((L) => code[L] && !isStub(code[L]))) allFourReal += 1;
    const tc = Array.isArray(r.test_cases) ? r.test_cases.length : 0;
    if (tc > 0 && !pyReal) testsButNoUsablePy += 1;

    // copy-paste smell: a non-python lang byte-identical to python
    for (const L of ['javascript', 'java', 'cpp']) {
      if (code[L] && code.python && code[L].trim() === code.python.trim()) pyEqualsOther[L] += 1;
    }

    const d = r.difficulty || 'unknown';
    byDiff[d] = byDiff[d] || { total: 0, allFour: 0, pyReal: 0 };
    byDiff[d].total += 1;
    if (LANGS.every((L) => code[L] && !isStub(code[L]))) byDiff[d].allFour += 1;
    if (pyReal) byDiff[d].pyReal += 1;
  }

  const pct = (n) => `${((n / total) * 100).toFixed(1)}%`;
  console.log('\n===== PGcode SOLUTIONS AUDIT =====');
  console.log(`Total problems: ${total}\n`);
  console.log('Per-language (present / real non-stub):');
  for (const L of LANGS) {
    console.log(`  ${L.padEnd(11)} present ${String(langPresent[L]).padStart(4)} (${pct(langPresent[L])})   real ${String(langReal[L]).padStart(4)} (${pct(langReal[L])})`);
  }
  console.log('');
  console.log(`Python stubs:                 ${pyStub} (${pct(pyStub)})`);
  console.log(`ALL FOUR real:                ${allFourReal} (${pct(allFourReal)})`);
  console.log(`ZERO solutions:               ${zeroSolutions} (${pct(zeroSolutions)})`);
  console.log(`Has tests but no usable py:   ${testsButNoUsablePy} (${pct(testsButNoUsablePy)})`);
  console.log('');
  console.log('Copy-pasted-python smell (lang === python verbatim):');
  for (const L of ['javascript', 'java', 'cpp']) {
    console.log(`  ${L.padEnd(11)} ${pyEqualsOther[L]}`);
  }
  console.log('');
  console.log('By difficulty (total | allFourReal | pyReal):');
  for (const [d, v] of Object.entries(byDiff)) {
    console.log(`  ${d.padEnd(10)} ${String(v.total).padStart(4)} | ${String(v.allFour).padStart(4)} | ${String(v.pyReal).padStart(4)}`);
  }
  console.log('\n=================================\n');

  // Dump the actionable backfill targets (zero-solution OR tests-but-no-usable-python).
  const targets = [];
  for (const r of rows) {
    const sols = r.solutions || {};
    const pyReal = codeOf(sols.python) && !isStub(codeOf(sols.python));
    const presentCount = LANGS.filter((L) => codeOf(sols[L])).length;
    const missingLangs = LANGS.filter((L) => !codeOf(sols[L]) || isStub(codeOf(sols[L])));
    const tc = Array.isArray(r.test_cases) ? r.test_cases.length : 0;
    if (presentCount === 0 || (tc > 0 && !pyReal) || missingLangs.length > 0) {
      targets.push({ id: r.id, name: r.name, difficulty: r.difficulty, presentCount, missingLangs, tests: tc, pyReal: Boolean(pyReal) });
    }
  }
  const outPath = path.join(__dirname, 'solutions-backfill-targets.json');
  fs.writeFileSync(outPath, JSON.stringify(targets, null, 2));
  console.log(`Wrote ${targets.length} backfill targets -> ${outPath}`);
  console.log('Sample (first 15 zero-solution):');
  targets.filter((t) => t.presentCount === 0).slice(0, 15).forEach((t) => console.log(`  [${t.difficulty}] ${t.name}`));
}

main().catch((e) => { console.error(e); process.exit(1); });
