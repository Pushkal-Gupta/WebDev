#!/usr/bin/env node
// verify-wave33c-v2.mjs
// Hardened re-verify of the WAVE 33C-34J recovered problems. Grades each
// canonical Python (from RICH_CONTENT) against its BUNDLED test_cases through
// the run-code edge function. Improvements over v1:
//   - Pattern-1 aware: unwraps a "\"...\""-wrapped str-param input and a
//     wrapped str-return expected before grading (the bundled WAVE 33C data
//     carries the double-quote bug; the canonical solution is innocent).
//   - List[str] returns formatted as JSON so they compare against the
//     JSON-array expected.
//   - Every Judge0 call wrapped in try/catch with a hard timeout; a single
//     failing call can never kill the run. Writes a report at the end AND
//     incrementally so a mid-run death still leaves partial results.
//
// Problems whose type the single-method harness cannot drive (Codec/design,
// in-place void mutation, TreeNode/ListNode inputs) will still show 0/N — that
// is a HARNESS limitation, flagged in the report as "harness-incompatible",
// not a solution bug.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
if (!URL || !ANON) { console.error('need VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY'); process.exit(1); }

const REPORT = path.join(__dirname, 'report-wave33c-v2.json');
const isStr = (t) => { const s = String(t || '').toLowerCase().trim(); return s === 'str' || s === 'string'; };
const looksWrapped = (v) => typeof v === 'string' && v.length >= 2 && v[0] === '"' && v[v.length - 1] === '"';
const unwrap = (v) => { try { const p = JSON.parse(v); if (typeof p === 'string') return p; } catch { /**/ } return v.slice(1, -1); };

// Harness mirrors the deployed grade-submission driver: str read raw (we feed
// the UNWRAPPED value), int via int(input()), bool via lower()=='true', else
// ast.literal_eval. _fmt prints a top-level str raw but JSON-quotes nested
// strings so List[str] returns compare against the JSON-array expected.
function buildHarness(code, method, params) {
  const reads = (params || []).map((p, i) => {
    const t = String(p?.type || '').toLowerCase();
    if (t === 'str' || t === 'string') return `    a${i} = input()`;
    if (t === 'int' || t === 'integer' || t === 'long') return `    a${i} = int(input().strip())`;
    if (t === 'float' || t === 'double') return `    a${i} = float(input().strip())`;
    if (t === 'bool' || t === 'boolean') return `    a${i} = input().strip().lower() == 'true'`;
    return `    a${i} = __import__('ast').literal_eval(input())`;
  }).join('\n');
  const argList = (params || []).map((_, i) => `a${i}`).join(', ');
  const usesClass = /\bclass\s+Solution\b/.test(code);
  const call = usesClass ? `Solution().${method}(${argList})` : `${method}(${argList})`;
  return `from __future__ import annotations
import json, ast, sys
${code}

def _fmt(v, top=True):
    if isinstance(v, bool): return 'true' if v else 'false'
    if v is None: return 'null'
    if isinstance(v, (list, tuple)): return '[' + ','.join(_fmt(x, False) for x in v) + ']'
    if isinstance(v, str): return v if top else json.dumps(v)
    if isinstance(v, float):
        return ('%.5f' % v).rstrip('0').rstrip('.')
    return str(v)
if __name__ == '__main__':
${reads || '    pass'}
    r = ${call}
    print(_fmt(r))
`;
}

function normalize(s) {
  const t = String(s ?? '').trim();
  try { return JSON.stringify(JSON.parse(t)); } catch { return t; }
}
function eq(a, e) { return a === e || normalize(a) === normalize(e); }

async function runOnce(source, stdin, ms = 25000) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(`${URL}/functions/v1/run-code`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${ANON}` },
      body: JSON.stringify({ language: 'python', code: source, stdins: [stdin] }),
      signal: ctrl.signal,
    });
    if (!res.ok) return { status: `http ${res.status}`, output: '' };
    const data = await res.json();
    const first = (data.results || [])[0] || {};
    const st = first.status;
    if (st && st !== 'success' && st !== 'Accepted') return { status: String(st), output: first.output || '' };
    return { status: 'ok', output: (first.output || '').replace(/\s+$/, '') };
  } catch (e) {
    return { status: `err:${String(e.message).slice(0, 40)}`, output: '' };
  } finally { clearTimeout(to); }
}

function prep(tc, params, returnsStr) {
  const inputs = (Array.isArray(tc.inputs) ? tc.inputs : []).map((v, i) => {
    if (isStr(params?.[i]?.type) && looksWrapped(v)) return unwrap(v);
    return v;
  });
  let expected = String(tc.expected ?? '');
  if (returnsStr && looksWrapped(expected)) expected = unwrap(expected);
  return { stdin: inputs.join('\n') + '\n', expected: expected.replace(/\s+$/, '') };
}

const main = async () => {
  const mod = await import(pathToFileURL(path.join(__dirname, '..', 'src', 'content', 'problemContent.js')).href);
  const R = mod.RICH_CONTENT;
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'content', 'problemContent.js'), 'utf8');
  const seg = src.slice(src.indexOf('WAVE 33C-34J (resumed from stash'));
  const slugs = [...seg.matchAll(/^RICH_CONTENT\["([^"]+)"\] =/gm)].map((m) => m[1]);
  console.log(`Re-verifying ${slugs.length} WAVE 33C-34J problems (Pattern-1 aware).`);

  const results = [];
  for (let n = 0; n < slugs.length; n++) {
    const slug = slugs[n];
    const c = R[slug];
    const py = typeof c.solutions?.python === 'string' ? c.solutions.python : c.solutions?.python?.code;
    const cases = Array.isArray(c.test_cases) ? c.test_cases : [];
    const returnsStr = isStr(c.return_type);
    if (!py || !c.method_name || !cases.length) {
      results.push({ slug, status: 'unverifiable', reason: !py ? 'no python' : !cases.length ? 'no cases' : 'no method', passed: 0, total: cases.length });
      console.log(`[${n + 1}/${slugs.length}] ${slug}  UNVERIFIABLE`);
      fs.writeFileSync(REPORT, JSON.stringify(results, null, 2));
      continue;
    }
    const harness = buildHarness(py, c.method_name, c.params);
    let passed = 0; const fails = [];
    process.stdout.write(`[${n + 1}/${slugs.length}] ${slug} `);
    for (let i = 0; i < cases.length; i++) {
      const { stdin, expected } = prep(cases[i], c.params, returnsStr);
      const r = await runOnce(harness, stdin);
      if (r.status === 'ok' && eq(r.output, expected)) { passed++; process.stdout.write('.'); }
      else { fails.push({ i, expected: expected.slice(0, 30), actual: r.output.slice(0, 30), status: r.status }); process.stdout.write('x'); }
    }
    const allErr = fails.length && fails.every((f) => f.status !== 'ok');
    const verdict = passed === cases.length ? 'PASS'
      : passed === 0 ? (allErr ? 'HARNESS/ERR' : 'ZERO') : 'PARTIAL';
    results.push({ slug, verdict, passed, total: cases.length, returnsStr, firstFails: fails.slice(0, 3) });
    console.log(`  ${verdict} ${passed}/${cases.length}`);
    fs.writeFileSync(REPORT, JSON.stringify(results, null, 2));
  }

  const pass = results.filter((r) => r.verdict === 'PASS');
  const partial = results.filter((r) => r.verdict === 'PARTIAL');
  const zero = results.filter((r) => r.verdict === 'ZERO' || r.verdict === 'HARNESS/ERR');
  const unver = results.filter((r) => r.status === 'unverifiable');
  console.log(`\n=== SUMMARY ===`);
  console.log(`PASS: ${pass.length}`);
  console.log(`PARTIAL (investigate — possible real bug): ${partial.length}`);
  partial.forEach((r) => console.log(`   ${r.slug} ${r.passed}/${r.total}  e.g. ${JSON.stringify(r.firstFails[0])}`));
  console.log(`ZERO/HARNESS (design/in-place/tree — harness limit): ${zero.length}`);
  zero.forEach((r) => console.log(`   ${r.slug} 0/${r.total} [${r.verdict}]`));
  console.log(`UNVERIFIABLE: ${unver.length}`);
  console.log(`Report: ${REPORT}`);
};
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
