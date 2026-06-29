// Mutation-testing-driven test-case adequacy gate.
//
// For each problem: take the canonical Python (the oracle), generate small WRONG
// variants (mutants), and grade each against the problem's test_cases via Judge0.
// A mutant that produces identical output on every case SURVIVED -> the suite has a
// hole (an equivalent wrong submission would pass). We then synthesize a typed input
// where canonical and the surviving mutant DIVERGE, grade it with the canonical, and
// add it as a new case -> killing the survivor. Loop until mutation score = 100% or a
// cap. This is how a problem earns "the proper amount of cases" (not a fixed 50):
// however many it takes to kill every mutant with full coverage.
//
//   node scripts/mutation-test.mjs --slug two-sum            # one problem, report only
//   node scripts/mutation-test.mjs --slug two-sum --fix      # add cases to kill survivors
//   node scripts/mutation-test.mjs --max 200 --fix --resume  # sweep, lowest-coverage first
//
// Judge0 via env JUDGE0_URL + JUDGE0_AUTH_TOKEN (self-hosted => unlimited).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin, compareOutput } from '../src/lib/driverCode.js';
import { parseBounds, validateInputs, clampValue } from './lib/constraint-bounds.mjs';
import { runLocal } from './local-grade.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(
  process.env.VITE_SUPABASE_URL.startsWith('http') ? process.env.VITE_SUPABASE_URL : `https://${process.env.VITE_SUPABASE_URL}.supabase.co`,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? (process.argv[i + 1]?.startsWith('--') ? true : process.argv[i + 1]) : undefined; };
const SLUG = arg('slug');
const FIX = process.argv.includes('--fix');
const MAX = Number(arg('max') || 50);
const ADD_CAP = Number(arg('addcap') || 40);       // max new cases per problem per run
const MUTANT_CAP = Number(arg('mutants') || 40);   // cap mutants graded per problem
const JUDGE0_URL = (arg('judge0') || process.env.JUDGE0_URL || 'https://ce.judge0.com').replace(/\/$/, '');
const JUDGE0_AUTH = arg('auth') || process.env.JUDGE0_AUTH_TOKEN || '';
const J0_HEADERS = JUDGE0_AUTH ? { 'content-type': 'application/json', 'X-Auth-Token': JUDGE0_AUTH } : { 'content-type': 'application/json' };
const PY = 71;
// Local host exec by default — faster + no rate limit; LOCAL_EXEC=0 forces Judge0.
const LOCAL_EXEC = process.env.LOCAL_EXEC !== '0' && !process.argv.includes('--judge0-remote');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function judgeRun(source, stdin) {
  if (LOCAL_EXEC) {
    const r = runLocal(PY, source, stdin, { timeoutMs: 8000 });
    return r.ok ? { ok: true, stdout: r.stdout, status: r.status } : { ok: false, status: r.status, err: r.err };
  }
  const url = `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`;
  for (let a = 1; a <= 3; a++) {
    try {
      const res = await fetch(url, { method: 'POST', headers: J0_HEADERS, body: JSON.stringify({ language_id: PY, source_code: source, stdin, cpu_time_limit: 5, wall_time_limit: 8 }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      return { ok: true, stdout: (d.stdout || '').replace(/\r\n/g, '\n').replace(/\n$/, ''), status: d.status?.description || '' };
    } catch (e) { if (a === 3) return { ok: false, err: e.message }; await sleep(400 * a * a); }
  }
  return { ok: false };
}

// ── Mutation operators on Python source ──────────────────────────────────────
// Operate on a masked view (strings/comments blanked) so we never mutate literals;
// apply each replacement at one site at a time to get single-point mutants.
function maskLiterals(src) {
  // replace string contents + comments with same-length filler so indices line up
  let out = src.replace(/(['"])(?:\\.|(?!\1).)*\1/g, (m) => m[0] + 'x'.repeat(Math.max(0, m.length - 2)) + m[0]);
  out = out.replace(/#.*$/gm, (m) => '#'.repeat(m.length));
  return out;
}
const OPS = [
  [/<=/g, '<'], [/>=/g, '>'], [/(?<![<>=!])<(?![=])/g, '<='], [/(?<![<>=!])>(?![=])/g, '>='],
  [/==/g, '!='], [/!=/g, '=='],
  [/\band\b/g, 'or'], [/\bor\b/g, 'and'], [/\bTrue\b/g, 'False'], [/\bFalse\b/g, 'True'],
  [/\+/g, '-'], [/(?<![\-\w])\-(?![\-=>])/g, '+'],
  [/(?<![*\/])\/\/(?!=)/g, '*'], [/(?<![*\/])\*(?![*\/=])/g, '//'],
  [/\breturn\s+True\b/g, 'return False'], [/\breturn\s+0\b/g, 'return 1'],
  // optimization-direction flips — catch greedy/DP bugs that have no relational op
  [/\bmin\b/g, 'max'], [/\bmax\b/g, 'min'],
];
function genMutants(src) {
  const masked = maskLiterals(src);
  const mutants = [];
  for (const [re, rep] of OPS) {
    let m; const r = new RegExp(re.source, 'g');
    while ((m = r.exec(masked)) !== null) {
      const i = m.index; const len = m[0].length;
      // only mutate if the masked char(s) match the real source (not inside a blanked literal)
      if (masked.slice(i, i + len) !== src.slice(i, i + len) && !/[<>=!+\-*/]/.test(masked[i])) continue;
      const mutant = src.slice(0, i) + rep + src.slice(i + len);
      if (mutant !== src) mutants.push({ op: `${m[0]}->${rep}@${i}`, src: mutant });
      if (mutants.length >= MUTANT_CAP * 3) break;
    }
  }
  // de-dup + cap
  const seen = new Set(); const uniq = [];
  for (const x of mutants) { if (!seen.has(x.src)) { seen.add(x.src); uniq.push(x); } if (uniq.length >= MUTANT_CAP) break; }
  return uniq;
}

// ── Typed input generation for distinguishing-input synthesis ────────────────
function seededRand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function genValue(type, rnd) {
  const t = String(type);
  if (t === 'int') return String(Math.floor(rnd() * 41) - 20);
  if (t === 'bool') return rnd() < 0.5 ? 'true' : 'false';
  if (t === 'str') { const n = Math.floor(rnd() * 6); const cs = 'aabbc()01'; let s = ''; for (let i = 0; i < n; i++) s += cs[Math.floor(rnd() * cs.length)]; return s; }
  if (t === 'List[int]') { const n = Math.floor(rnd() * 6); const a = []; for (let i = 0; i < n; i++) a.push(Math.floor(rnd() * 21) - 10); return `[${a.join(',')}]`; }
  if (t === 'List[str]') { const n = Math.floor(rnd() * 4); const a = []; for (let i = 0; i < n; i++) a.push(`"${'abc'[Math.floor(rnd() * 3)]}"`); return `[${a.join(',')}]`; }
  if (t === 'List[List[int]]') { const r = Math.floor(rnd() * 3) + 1; const rows = []; for (let i = 0; i < r; i++) { const c = Math.floor(rnd() * 3) + 1; const row = []; for (let j = 0; j < c; j++) row.push(Math.floor(rnd() * 9)); rows.push(`[${row.join(',')}]`); } return `[${rows.join(',')}]`; }
  return null; // unsupported -> caller skips synthesis
}

async function processProblem(p) {
  const py = p.solutions?.python; const code = typeof py === 'string' ? py : py?.code;
  if (!code || /^\s*(pass|\.\.\.|return None)\s*$/m.test(code.trim().split('\n').slice(-1)[0] || '')) return { id: p.id, skip: 'no canonical' };
  const cases = Array.isArray(p.test_cases) ? p.test_cases : [];
  if (cases.length === 0) return { id: p.id, skip: 'no test_cases' };
  const wrap = (src) => wrapWithDriver(src, 'python', p.method_name, p.params, p.return_type);
  let canonWrapped; try { canonWrapped = wrap(code); } catch (e) { return { id: p.id, skip: `wrap: ${e.message.slice(0, 40)}` }; }

  const mutants = genMutants(code);
  if (!mutants.length) return { id: p.id, skip: 'no mutants generated' };

  // grade each mutant against existing cases; a mutant is KILLED if it differs on any case
  let killed = 0; const survivors = [];
  for (const mut of mutants) {
    let mWrapped; try { mWrapped = wrap(mut.src); } catch { killed++; continue; } // uncompilable mutant = trivially killed
    let differs = false;
    for (const tc of cases.slice(0, 30)) {
      const stdin = buildStdin(tc.inputs) + '\n';
      const r = await judgeRun(mWrapped, stdin);
      if (!r.ok) { differs = true; break; } // crash/compile-fail on a case = killed
      if (!compareOutput(r.stdout, tc.expected)) { differs = true; break; }
    }
    if (differs) killed++; else survivors.push(mut);
  }
  const score = mutants.length ? killed / mutants.length : 1;
  const result = { id: p.id, name: p.name, mutants: mutants.length, killed, survivors: survivors.length, score: +(score * 100).toFixed(1), added: 0 };

  // FIX: for each survivor, synthesize a distinguishing input and add it as a verified case
  if (FIX && survivors.length) {
    const types = (p.params || []).map((x) => x.type);
    if (types.some((t) => genValue(t, Math.random) === null)) { result.note = 'unsynthesizable param type'; return result; }
    const newCases = [];
    // Parse stated constraints so synthesized distinguishing inputs stay
    // in-range — an out-of-constraint case would wrongly fail a correct
    // solution. Best effort: empty bounds => behavior unchanged.
    const bounds = parseBounds(p.constraints, p.params);
    const params = p.params || [];
    const clampInputs = (inputs) => inputs.map((raw, i) => {
      const pb = bounds.perParam ? bounds.perParam[params[i]?.name] : null;
      if (!pb) return raw;
      try { return JSON.stringify(clampValue(params[i].type, JSON.parse(raw), pb)); }
      catch { return raw; }
    });
    const rnd = seededRand(p.id.split('').reduce((a, c) => a + c.charCodeAt(0), 7));
    for (const mut of survivors) {
      let mWrapped; try { mWrapped = wrap(mut.src); } catch { continue; }
      let found = null;
      for (let attempt = 0; attempt < 60 && !found; attempt++) {
        const inputs = clampInputs(types.map((t) => genValue(t, rnd)));
        if (!validateInputs(inputs, params, bounds).ok) continue; // never emit out-of-constraint
        const stdin = buildStdin(inputs) + '\n';
        const [cr, mr] = [await judgeRun(canonWrapped, stdin), await judgeRun(mWrapped, stdin)];
        if (cr.ok && (!mr.ok || !compareOutput(cr.stdout, mr.stdout))) found = { inputs, expected: cr.stdout };
      }
      if (found && newCases.length < ADD_CAP) newCases.push(found);
    }
    if (newCases.length && !arg('dry')) {
      const merged = [...cases, ...newCases];
      const { error } = await sb.from('PGcode_problems').update({ test_cases: merged }).eq('id', p.id);
      if (!error) result.added = newCases.length;
      else result.note = `db: ${error.message.slice(0, 40)}`;
    } else result.added = newCases.length;
  }
  return result;
}

async function main() {
  console.log(`mutation-test ${FIX ? '(FIX — adds cases)' : '(report only)'} | exec: ${LOCAL_EXEC ? 'LOCAL host' : 'Judge0 ' + JUDGE0_URL}`);
  let rows;
  if (SLUG) {
    const { data } = await sb.from('PGcode_problems').select('id,name,method_name,params,return_type,test_cases,solutions,constraints').eq('id', SLUG).limit(1);
    rows = data || [];
  } else {
    const OFFSET = Number(arg('offset') || 0);
    const { data } = await sb.from('PGcode_problems').select('id,name,method_name,params,return_type,test_cases,solutions,constraints').order('id').range(OFFSET, OFFSET + MAX - 1);
    rows = (data || []).filter((r) => r.solutions?.python && (Array.isArray(r.test_cases) ? r.test_cases.length : 0) > 0);
  }
  let totMut = 0, totKill = 0, totAdd = 0, weak = 0;
  for (const p of rows) {
    const r = await processProblem(p);
    if (r.skip) { console.log(`  - ${r.id}: skip (${r.skip})`); continue; }
    totMut += r.mutants; totKill += r.killed; totAdd += r.added || 0;
    if (r.score < 100) weak++;
    console.log(`  ${r.score === 100 ? 'OK ' : 'WEAK'} ${r.id}: score ${r.score}% (${r.killed}/${r.mutants} killed, ${r.survivors} survived${r.added ? `, +${r.added} cases` : ''})${r.note ? ` [${r.note}]` : ''}`);
  }
  console.log(`\nproblems: ${rows.length} | weak(<100%): ${weak} | overall mutation score: ${totMut ? (totKill / totMut * 100).toFixed(1) : 0}% | cases added: ${totAdd}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
