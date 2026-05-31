#!/usr/bin/env node
// Run the canonical Python solution for ONE problem against every test case in
// the DB and PRUNE (delete) any case the solution does not match.
//
// Usage:
//   node scripts/verify-prune-tests.js --slug two-sum [--dry] [--solution path/to/sol.py]
//
// Requires .env with VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY +
// VITE_SUPABASE_ANON_KEY.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';

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

const args = process.argv.slice(2);
const arg = (name, def = null) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = args[i + 1];
  return (v && !v.startsWith('--')) ? v : true;
};
const slug = arg('slug');
const dry = arg('dry');
const solutionPath = arg('solution');

if (!slug) {
  console.error('Pass --slug <id>');
  process.exit(1);
}

function buildHarness(solutionPy, methodName, params) {
  const argParse = params.map((p, i) => {
    const t = String(p.type).toLowerCase();
    if (t.includes('list') || t.includes('[') || t.includes('matrix')) {
      return `arg${i} = json.loads(sys.stdin.readline().strip())`;
    }
    if (t === 'int' || t === 'integer' || t === 'long') {
      return `arg${i} = int(sys.stdin.readline().strip())`;
    }
    if (t === 'bool' || t === 'boolean') {
      return `arg${i} = sys.stdin.readline().strip().lower() == 'true'`;
    }
    return `arg${i} = sys.stdin.readline().rstrip('\\n')`;
  }).join('\n');
  const argList = params.map((_, i) => `arg${i}`).join(', ');
  const usesClassSolution = /\bclass\s+Solution\b/.test(solutionPy);
  const callExpr = usesClassSolution
    ? `Solution().${methodName}(${argList})`
    : `${methodName}(${argList})`;
  return `from __future__ import annotations
${solutionPy}

import sys, json
${argParse}
res = ${callExpr}
print(json.dumps(res, separators=(',', ':'), default=str))
`;
}

// Normalize an output string for comparison. Matches the Workspace flow's
// lenience around JSON whitespace ([0, 7] vs [0,7]) and trailing newlines.
function normalize(s) {
  const t = String(s).trim();
  try {
    return JSON.stringify(JSON.parse(t));
  } catch {
    return t.replace(/\s+/g, '');
  }
}
function outputsEqual(actual, expected) {
  if (actual === expected) return true;
  return normalize(actual) === normalize(expected);
}

async function runOnce(source, stdin) {
  const res = await fetch(`${URL}/functions/v1/run-code`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${ANON}` },
    body: JSON.stringify({ language: 'python', code: source, stdins: [stdin] }),
  });
  if (!res.ok) throw new Error(`run-code ${res.status}: ${await res.text().then(t => t.slice(0, 120))}`);
  const data = await res.json();
  const first = (data.results || [])[0];
  if (!first) throw new Error('no result');
  if (first.status && first.status !== 'success' && first.status !== 'Accepted') {
    throw new Error(`${first.status}: ${(first.output || '').slice(0, 80)}`);
  }
  return (first.output || '').trim();
}

// Resolve the python solution: explicit --solution path > RICH_CONTENT > DB.solutions.python
async function resolveSolution(problem) {
  if (solutionPath) {
    const p = path.isAbsolute(solutionPath) ? solutionPath : path.join(process.cwd(), solutionPath);
    return fs.readFileSync(p, 'utf8');
  }
  try {
    const mod = await import(pathToFileURL(path.join(__dirname, '..', 'src', 'content', 'problemContent.js')).href);
    const rich = mod.RICH_CONTENT || mod.default?.RICH_CONTENT;
    const entry = rich?.[problem.id];
    const pyEntry = entry?.solutions?.python;
    const py = typeof pyEntry === 'string' ? pyEntry : pyEntry?.code;
    if (py) {
      console.log(`  using solution from RICH_CONTENT`);
      return py;
    }
  } catch (e) {
    console.log(`  RICH_CONTENT load failed: ${e.message.slice(0, 100)}`);
  }
  const pyEntry = problem.solutions?.python;
  const py = typeof pyEntry === 'string' ? pyEntry : pyEntry?.code;
  if (py) {
    console.log(`  using solution from DB.solutions.python`);
    return py;
  }
  return null;
}

async function main() {
  const { data: problem, error } = await sb
    .from('PGcode_problems')
    .select('id, method_name, params, return_type, solutions, test_cases')
    .eq('id', slug)
    .single();
  if (error) { console.error(error.message); process.exit(1); }
  if (!problem) { console.error(`Problem ${slug} not found`); process.exit(1); }

  const py = await resolveSolution(problem);
  if (!py) {
    console.error('No Python solution available (pass --solution or seed solutions.python in DB / RICH_CONTENT)');
    process.exit(1);
  }
  if (!problem.method_name || !Array.isArray(problem.params) || problem.params.length === 0) {
    console.error('Problem missing method_name or params');
    process.exit(1);
  }
  const cases = Array.isArray(problem.test_cases) ? problem.test_cases : [];
  if (cases.length === 0) {
    console.error('Problem has no test_cases to verify');
    process.exit(1);
  }

  const harness = buildHarness(py, problem.method_name, problem.params);

  console.log(`\nVerifying ${cases.length} cases for ${slug} (dry=${!!dry})\n`);

  const kept = [];
  const pruned = [];
  for (let i = 0; i < cases.length; i++) {
    const tc = cases[i];
    const inputs = Array.isArray(tc.inputs) ? tc.inputs : [];
    const expected = String(tc.expected ?? '').trim();
    const stdin = inputs.join('\n') + '\n';
    let actual = '';
    let status = 'ok';
    try {
      actual = await runOnce(harness, stdin);
    } catch (e) {
      status = `err:${e.message.slice(0, 60)}`;
    }
    const match = status === 'ok' && outputsEqual(actual, expected);
    if (match) {
      kept.push(tc);
      process.stdout.write('.');
    } else {
      pruned.push({ tc, actual, status });
      process.stdout.write('x');
    }
  }
  process.stdout.write('\n\n');

  console.log(`original_count: ${cases.length}`);
  console.log(`kept_count:     ${kept.length}`);
  console.log(`pruned_count:   ${pruned.length}`);

  if (pruned.length > 0) {
    console.log('\nPruned cases:');
    for (const { tc, actual, status } of pruned.slice(0, 30)) {
      const inStr = JSON.stringify(tc.inputs).slice(0, 80);
      console.log(`  inputs=${inStr}  expected=${String(tc.expected).slice(0, 40)}  actual=${actual.slice(0, 40)}  ${status !== 'ok' ? '[' + status + ']' : ''}`);
    }
    if (pruned.length > 30) console.log(`  ... and ${pruned.length - 30} more`);
  }

  if (dry) {
    console.log('\n(dry run — DB not updated)');
    return;
  }
  if (pruned.length === 0) {
    console.log('\nNothing to prune.');
    return;
  }
  const { error: upErr } = await sb.from('PGcode_problems').update({ test_cases: kept }).eq('id', slug);
  if (upErr) { console.error(`Write failed: ${upErr.message}`); process.exit(1); }
  console.log(`\nUpdated DB: ${slug} now has ${kept.length} test cases.`);
}

main().catch(e => { console.error(e); process.exit(1); });
