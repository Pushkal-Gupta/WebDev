#!/usr/bin/env node
// Take a flagship problem that has a working reference solution (solutions.python)
// and ~10 seeded test_cases, and pad it to 50+ by:
//   1. Generating fresh inputs by inspecting params/return_type
//      - int      → small/medium/large, negatives, edge ints (0, ±1, ±2^31, ±2^31-1)
//      - list[int]→ empty, single, sorted, reverse, all-same, dups, random sizes
//      - list[list[int]] → small + medium 2D grids
//      - string   → empty, single, all-same, palindrome, random short, random longer
//   2. Running each input through the reference Python solution via the
//      existing `run-code` Supabase Edge Function (so expected is computed,
//      not guessed)
//   3. Merging with existing test_cases (dedupe by JSON.stringify(inputs))
//   4. Writing back to PGcode_problems.test_cases
//
// Usage:
//   node scripts/multiply-test-cases.js --slug two-sum [--target 60] [--dry]
//   node scripts/multiply-test-cases.js --all --difficulty Easy --target 50
//
// Requires .env with VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY +
// VITE_SUPABASE_ANON_KEY (for the run-code function call).

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
const all = arg('all');
const difficulty = arg('difficulty');
const target = Number(arg('target') || 50);
const dry = arg('dry');

if (!slug && !all) {
  console.error('Pass --slug <id> or --all [--difficulty Easy]');
  process.exit(1);
}

// ── Input generators by parameter type ───────────────────────────────────────
const rand = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const randArr = (n, lo, hi) => Array.from({ length: n }, () => rand(lo, hi));

function generateForType(type, _name) {
  const t = String(type).toLowerCase().replace(/\s+/g, '');
  if (t === 'int' || t === 'integer' || t === 'long') {
    return [0, 1, -1, 2, 10, 100, 1000, 10000, -100, -1000,
      rand(2, 50), rand(50, 500), rand(500, 5000), rand(-500, -10)];
  }
  if (t === 'list[int]' || t === 'int[]' || t === 'list<int>' || t === 'array<int>') {
    return [
      [], [0], [1], [-1], [5, 5, 5, 5],
      [1, 2, 3, 4, 5], [5, 4, 3, 2, 1], [3, 1, 4, 1, 5, 9, 2, 6],
      randArr(2, -10, 10), randArr(5, -50, 50), randArr(8, 0, 100),
      randArr(12, -100, 100), randArr(20, 1, 50), randArr(15, -200, 200),
    ];
  }
  if (t === 'list[list[int]]' || t === 'int[][]' || t === 'matrix') {
    return [
      [[1]], [[1, 2], [3, 4]],
      Array.from({ length: 3 }, () => randArr(3, 0, 9)),
      Array.from({ length: 4 }, () => randArr(4, -5, 5)),
      Array.from({ length: 2 }, () => randArr(5, 0, 1)),
    ];
  }
  if (t === 'string' || t === 'str') {
    return ['', 'a', 'ab', 'aaaa', 'abc', 'abba', 'racecar', 'AaBb',
      'abcdef', 'aabbccdd', 'mississippi', 'algorithm', 'hello world'];
  }
  if (t === 'list[string]' || t === 'string[]') {
    return [[], ['a'], ['ab', 'cd'], ['abc', 'abd', 'abe'], ['flower', 'flow', 'flight']];
  }
  if (t === 'bool' || t === 'boolean') return [true, false];
  return null;
}

function stringifyInput(v) {
  if (typeof v === 'string') return v;
  return JSON.stringify(v);
}

// Cartesian product of per-param input pools, capped so we don't explode.
function buildInputCombos(params, cap = 200) {
  const pools = params.map(p => generateForType(p.type, p.name));
  if (pools.some(p => !p)) return [];
  const combos = [];
  const recurse = (i, acc) => {
    if (combos.length >= cap) return;
    if (i === pools.length) { combos.push(acc); return; }
    for (const v of pools[i]) {
      if (combos.length >= cap) return;
      recurse(i + 1, [...acc, v]);
    }
  };
  recurse(0, []);
  return combos.map(c => c.map(stringifyInput));
}

// ── Python harness: wrap the user's solution and print JSON.
// Supports two code shapes: a `class Solution` with the method, OR a bare
// `def methodName(...)` at module scope.
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
  // `from __future__ import annotations` makes PEP 585 generics (list[int], dict[str,int])
  // safe on Judge0's Python 3.8 by deferring annotation evaluation to strings.
  return `from __future__ import annotations
${solutionPy}

import sys, json
${argParse}
res = ${callExpr}
print(json.dumps(res, separators=(',', ':'), default=str))
`;
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

async function processProblem(problem) {
  const { id, method_name, params, solutions, test_cases: existing } = problem;
  // RICH_CONTENT stores { python: { code, complexity, approach } }, but older
  // seed shapes used a plain string. Accept both.
  const pyEntry = solutions?.python;
  const py = typeof pyEntry === 'string' ? pyEntry : pyEntry?.code;
  if (!py || !method_name || !Array.isArray(params) || params.length === 0) {
    console.log(`  ${id}: missing solutions.python / method_name / params — skip`);
    return null;
  }
  const have = Array.isArray(existing) ? existing : [];
  const needed = Math.max(0, target - have.length);
  if (needed === 0) {
    console.log(`  ${id}: already has ${have.length}/${target} — skip`);
    return null;
  }
  console.log(`  ${id}: have ${have.length}, generating ${needed}+ more`);

  const combos = buildInputCombos(params, target * 3);
  if (combos.length === 0) {
    console.log(`  ${id}: cannot generate inputs for param types ${params.map(p => p.type).join(',')} — skip`);
    return null;
  }

  const haveKeys = new Set(have.map(tc => JSON.stringify(tc.inputs)));
  const harness = buildHarness(py, method_name, params);

  const added = [];
  for (const inputs of combos) {
    if (added.length >= needed) break;
    const key = JSON.stringify(inputs);
    if (haveKeys.has(key)) continue;
    haveKeys.add(key);
    try {
      const stdin = inputs.join('\n') + '\n';
      const expected = await runOnce(harness, stdin);
      if (expected === '' || expected.length > 2000) continue;
      added.push({ inputs, expected });
    } catch (e) {
      console.log(`    skip ${key.slice(0, 60)}: ${e.message.slice(0, 80)}`);
    }
  }

  if (added.length === 0) {
    console.log(`  ${id}: failed to generate any — skip`);
    return null;
  }

  const merged = [...have, ...added];
  console.log(`  ${id}: merged → ${merged.length} test cases (+${added.length})`);
  if (dry) return null;

  const { error } = await sb.from('PGcode_problems').update({ test_cases: merged }).eq('id', id);
  if (error) { console.log(`  ${id}: write failed: ${error.message}`); return null; }
  return added.length;
}

async function main() {
  let q = sb.from('PGcode_problems').select('id, method_name, params, solutions, test_cases, difficulty');
  if (slug) q = q.eq('id', slug);
  if (all && difficulty) q = q.eq('difficulty', difficulty);
  const { data, error } = await q;
  if (error) { console.error(error.message); process.exit(1); }
  if (!data?.length) { console.error('No problems matched'); process.exit(1); }

  console.log(`Processing ${data.length} problem(s), target ${target} cases each, dry=${!!dry}`);
  let totalAdded = 0;
  for (const p of data) {
    const n = await processProblem(p);
    if (n) totalAdded += n;
  }
  console.log(`\nDone. Added ${totalAdded} test cases total.`);
}

main().catch(e => { console.error(e); process.exit(1); });
