#!/usr/bin/env node
// Audit correctness of flagship solutions in PGcode_problems.solutions.
// For each problem with solutions.{python|javascript|java|cpp}.code populated,
// wrap with the driver and run against the problem's test_cases via the
// run-code Supabase Edge Function. Writes scripts/solution-audit-report.json.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, compareOutput } from '../src/lib/driverCode.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SVC || !ANON) {
  console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const sb = createClient(URL, SVC);

const LANGS = ['python', 'javascript', 'java', 'cpp'];
const CASE_CAP = 20;
const RATE_LIMIT_MS = 200;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runCode(code, language, stdin) {
  const res = await fetch(`${URL}/functions/v1/run-code`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${ANON}` },
    body: JSON.stringify({ language, code, stdins: [stdin] }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`run-code ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  if (data?.error) throw new Error(data.error);
  return (data.results || [])[0] || { status: 'runtime_error', output: 'no result' };
}

function pickCode(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') return entry;
  return entry.code || null;
}

function classifyVerdict(result, expected) {
  if (!result) return { verdict: 'RTE', got: '(no result)' };
  const status = result.status;
  const output = (result.output || '').trim();
  if (status === 'compile_error') return { verdict: 'CE', got: output };
  if (status === 'runtime_error') return { verdict: 'RTE', got: output };
  if (status === 'time_limit') return { verdict: 'RTE', got: 'TLE' };
  if (status === 'success' || status === 'Accepted') {
    if (compareOutput(output, expected)) return { verdict: 'PASS', got: output };
    return { verdict: 'WA', got: output };
  }
  return { verdict: 'RTE', got: output || String(status) };
}

async function main() {
  console.log('Fetching candidates...');
  const { data, error } = await sb
    .from('PGcode_problems')
    .select('id, name, params, return_type, method_name, solutions, test_cases')
    .not('solutions', 'is', null);
  if (error) { console.error(error.message); process.exit(1); }

  const candidates = (data || []).filter((p) => {
    if (!p.solutions || typeof p.solutions !== 'object') return false;
    if (!Array.isArray(p.test_cases) || p.test_cases.length === 0) return false;
    if (!p.method_name || !Array.isArray(p.params)) return false;
    return LANGS.some((l) => pickCode(p.solutions[l]));
  });

  console.log(`Found ${candidates.length} problems with at least one populated language.`);

  const report = {
    summary: {
      problems_audited: candidates.length,
      languages_audited: 0,
      total_pass: 0,
      total_fail: 0,
    },
    by_problem: [],
    failures: [],
  };

  let langPairCount = 0;

  for (const p of candidates) {
    console.log(`\n=== ${p.id} (${p.name}) ===`);
    const byLang = {};
    const cases = p.test_cases.slice(0, CASE_CAP);

    for (const lang of LANGS) {
      const userCode = pickCode(p.solutions[lang]);
      if (!userCode) continue;
      langPairCount++;

      const stats = { pass: 0, wa: 0, rte: 0, ce: 0 };
      let wrapped;
      try {
        wrapped = wrapWithDriver(userCode, lang, p.method_name, p.params, p.return_type);
      } catch (e) {
        console.log(`  ${lang}: wrap failed: ${e.message}`);
        stats.ce = cases.length;
        report.failures.push({
          id: p.id,
          lang,
          case_idx: -1,
          verdict: 'CE',
          got: `wrap failed: ${e.message}`,
          expected: '',
        });
        byLang[lang] = stats;
        report.summary.total_fail += cases.length;
        continue;
      }

      for (let i = 0; i < cases.length; i++) {
        const tc = cases[i];
        const inputs = Array.isArray(tc.inputs) ? tc.inputs : [];
        const stdin = inputs.join('\n');
        const expected = String(tc.expected ?? '').trim();
        let result;
        try {
          result = await runCode(wrapped, lang, stdin);
        } catch (e) {
          result = { status: 'runtime_error', output: `run-code error: ${e.message}` };
        }
        const { verdict, got } = classifyVerdict(result, expected);
        if (verdict === 'PASS') stats.pass++;
        else if (verdict === 'WA') stats.wa++;
        else if (verdict === 'RTE') stats.rte++;
        else if (verdict === 'CE') stats.ce++;

        if (verdict !== 'PASS') {
          report.failures.push({
            id: p.id,
            lang,
            case_idx: i,
            verdict,
            got: String(got).slice(0, 500),
            expected: expected.slice(0, 500),
          });
        }
        await sleep(RATE_LIMIT_MS);

        // Compile errors propagate to every case; no point continuing.
        if (verdict === 'CE' && i === 0) {
          // We already counted case 0 above; backfill the rest as CE.
          for (let j = 1; j < cases.length; j++) {
            stats.ce++;
            report.failures.push({
              id: p.id,
              lang,
              case_idx: j,
              verdict: 'CE',
              got: String(got).slice(0, 500),
              expected: String(cases[j].expected ?? '').trim().slice(0, 500),
            });
          }
          break;
        }
      }

      report.summary.total_pass += stats.pass;
      report.summary.total_fail += (stats.wa + stats.rte + stats.ce);
      byLang[lang] = stats;
      console.log(`  ${lang}: pass=${stats.pass} wa=${stats.wa} rte=${stats.rte} ce=${stats.ce}`);
    }

    report.by_problem.push({ id: p.id, name: p.name, by_lang: byLang });
  }

  report.summary.languages_audited = langPairCount;

  const out = path.join(__dirname, 'solution-audit-report.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`\nWrote ${out}`);

  // ── Human summary ──
  console.log('\n========= SUMMARY =========');
  console.log(`Problems audited:    ${report.summary.problems_audited}`);
  console.log(`(problem,lang) pairs: ${langPairCount}`);
  console.log(`Total PASS:          ${report.summary.total_pass}`);
  console.log(`Total FAIL:          ${report.summary.total_fail}`);

  const perLang = { python: { pass: 0, fail: 0 }, javascript: { pass: 0, fail: 0 }, java: { pass: 0, fail: 0 }, cpp: { pass: 0, fail: 0 } };
  for (const p of report.by_problem) {
    for (const [lang, s] of Object.entries(p.by_lang)) {
      perLang[lang].pass += s.pass;
      perLang[lang].fail += s.wa + s.rte + s.ce;
    }
  }
  console.log('\nPer-language pass rate:');
  for (const lang of LANGS) {
    const { pass, fail } = perLang[lang];
    const total = pass + fail;
    const pct = total ? ((pass / total) * 100).toFixed(1) : 'n/a';
    console.log(`  ${lang.padEnd(10)} ${pass}/${total} (${pct}%)`);
  }

  console.log('\n(problem, lang) pairs with failures:');
  let anyFail = false;
  for (const p of report.by_problem) {
    for (const [lang, s] of Object.entries(p.by_lang)) {
      const f = s.wa + s.rte + s.ce;
      if (f > 0) {
        anyFail = true;
        console.log(`  ${p.id} / ${lang}: pass=${s.pass} wa=${s.wa} rte=${s.rte} ce=${s.ce}`);
      }
    }
  }
  if (!anyFail) console.log('  (none — all pass)');
}

main().catch((e) => { console.error(e); process.exit(1); });
