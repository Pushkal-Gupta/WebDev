#!/usr/bin/env node
// Programmatic backfill for problems missing method_name / editorial_md / solutions.
// Doesn't try to be LC-quality — just makes every problem WORK end-to-end with a
// sensible signature, runnable starter, and a templated editorial that references
// the problem's tags + hints + description.
//
// Why: the long-tail of 2800+ PGcode-200 problems can't realistically be filled
// with hand-written editorials. Better to give every problem a working
// starter + scaffold than to leave 2800 in a broken state.
//
// Usage: node scripts/programmatic-backfill.mjs [--dry] [--bucket 200]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const dry = process.argv.includes('--dry');
const bucketArg = process.argv.indexOf('--bucket');
const bucketFilter = bucketArg !== -1 ? process.argv[bucketArg + 1] : null;

// === Method-name derivation ===
function methodNameFromTitle(name) {
  if (!name) return 'solve';
  const cleaned = String(name)
    .replace(/^\d+\.\s*/, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/);
  if (!cleaned.length) return 'solve';
  return cleaned[0].toLowerCase() + cleaned.slice(1).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
}

// === Param-shape inference from test_cases + name ===
function inferParams(tc, name) {
  if (!Array.isArray(tc) || !tc.length) return { params: [{ name: 'input', type: 'str' }], return_type: 'str' };
  const sample = tc.find(t => Array.isArray(t.inputs) && t.inputs.length) || tc[0];
  const inputs = Array.isArray(sample?.inputs) ? sample.inputs : [];
  if (!inputs.length) return { params: [{ name: 'input', type: 'str' }], return_type: 'str' };

  const params = inputs.map((raw, i) => {
    const v = parseValue(raw);
    return { name: paramName(name, i, inputs.length), type: jsTypeToPy(v) };
  });

  const expected = sample.expected ?? sample.output ?? sample.out ?? null;
  const return_type = expected === null || expected === undefined
    ? 'Any'
    : jsTypeToPy(parseValue(expected));

  return { params, return_type };
}

function parseValue(str) {
  if (typeof str !== 'string') return str;
  const s = str.trim();
  if (s === '') return s;
  try { return JSON.parse(s); } catch { return s; }
}

function jsTypeToPy(v) {
  if (v === null || v === undefined) return 'Any';
  if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'float';
  if (typeof v === 'boolean') return 'bool';
  if (typeof v === 'string') return 'str';
  if (Array.isArray(v)) {
    if (!v.length) return 'List[Any]';
    const inner = jsTypeToPy(v[0]);
    return `List[${inner}]`;
  }
  return 'Any';
}

function paramName(probName, idx, total) {
  const lc = String(probName || '').toLowerCase();
  if (total === 1) {
    if (/array|list|nums/i.test(lc)) return 'nums';
    if (/string/i.test(lc)) return 's';
    if (/tree|root/i.test(lc)) return 'root';
    if (/graph|grid|matrix/i.test(lc)) return 'grid';
    return 'input';
  }
  const common = ['nums', 'target', 'k', 'n', 'm', 'x', 'y', 'z'];
  return common[idx] || `arg${idx}`;
}

// === Starter code by language ===
function buildSolutions(methodName, params, return_type, problemName) {
  const pyParams = params.map(p => `${p.name}: ${p.type}`).join(', ');
  const pyRet = return_type;

  return {
    python: `from typing import List, Optional, Any

class Solution:
    def ${methodName}(self, ${pyParams}) -> ${pyRet}:
        # ${problemName}
        # Reference skeleton. See the Editorial tab for approach + complexity.
        pass
`,
    javascript: `/**
 * ${problemName}
 * Reference skeleton. See the Editorial tab for approach + complexity.
 */
function ${methodName}(${params.map(p => p.name).join(', ')}) {
  // ...
}
`,
    java: `// ${problemName}
// Reference skeleton. See the Editorial tab for approach + complexity.
class Solution {
    public ${jsTypeToJava(return_type)} ${methodName}(${params.map(p => `${jsTypeToJava(p.type)} ${p.name}`).join(', ')}) {
        ${defaultReturn(return_type)}
    }
}
`,
    cpp: `// ${problemName}
// Reference skeleton. See the Editorial tab for approach + complexity.
class Solution {
public:
    ${jsTypeToCpp(return_type)} ${methodName}(${params.map(p => `${jsTypeToCpp(p.type)} ${p.name}`).join(', ')}) {
        ${defaultReturnCpp(return_type)}
    }
};
`,
  };
}

function jsTypeToJava(t) {
  if (t === 'int') return 'int';
  if (t === 'float') return 'double';
  if (t === 'bool') return 'boolean';
  if (t === 'str') return 'String';
  if (t?.startsWith('List[int]')) return 'int[]';
  if (t?.startsWith('List[str]')) return 'String[]';
  if (t?.startsWith('List[List[int]]')) return 'int[][]';
  if (t?.startsWith('List[')) return 'Object[]';
  return 'Object';
}

function jsTypeToCpp(t) {
  if (t === 'int') return 'int';
  if (t === 'float') return 'double';
  if (t === 'bool') return 'bool';
  if (t === 'str') return 'string';
  if (t === 'List[int]') return 'vector<int>';
  if (t === 'List[str]') return 'vector<string>';
  if (t === 'List[List[int]]') return 'vector<vector<int>>';
  if (t?.startsWith('List[')) return 'vector<int>';
  return 'auto';
}

function defaultReturn(t) {
  if (t === 'int' || t === 'float') return 'return 0;';
  if (t === 'bool') return 'return false;';
  if (t === 'str') return 'return "";';
  if (t?.startsWith('List[')) return 'return new int[0];';
  return 'return null;';
}
function defaultReturnCpp(t) {
  if (t === 'int' || t === 'float') return 'return 0;';
  if (t === 'bool') return 'return false;';
  if (t === 'str') return 'return "";';
  if (t?.startsWith('List[')) return 'return {};';
  return 'return {};';
}

// === Templated editorial ===
function buildEditorial(p) {
  const tags = Array.isArray(p.tags) ? p.tags : [];
  const hints = Array.isArray(p.hints) ? p.hints : [];
  const topic = p.topic_id || tags[0] || 'algorithms';
  const desc = (p.description || '').replace(/<[^>]+>/g, '').slice(0, 300).trim();

  const sections = [];
  sections.push(`## Approach`);
  sections.push(`This is a **${topic}** problem${tags.length ? ` (related: ${tags.slice(0, 4).join(', ')})` : ''}.`);

  if (desc) {
    sections.push(`### Problem recap`);
    sections.push(desc + (desc.length === 300 ? '...' : ''));
  }

  if (hints.length) {
    sections.push(`### Hints`);
    hints.slice(0, 5).forEach((h, i) => {
      sections.push(`${i + 1}. ${String(h).trim()}`);
    });
  }

  sections.push(`### Strategy`);
  sections.push(strategyForTopic(topic));

  sections.push(`### Complexity`);
  sections.push(complexityForTopic(topic));

  sections.push(`### Common pitfalls`);
  sections.push(`- Edge cases: empty input, single element, all-same elements.`);
  sections.push(`- Off-by-one errors in pointer / index arithmetic.`);
  sections.push(`- Integer overflow on large inputs (use \`long\` in Java/C++ where needed).`);
  sections.push(`- Modifying input while iterating — copy first or iterate over a snapshot.`);

  return sections.join('\n\n');
}

function strategyForTopic(t) {
  const map = {
    'arrays': 'Walk the array once, tracking the running quantity the problem asks about. If the brute force is O(n²), look for a way to reuse work — prefix sums, hash-of-complements, or two pointers usually unlock O(n).',
    'strings': 'Convert to characters or work with indices. Hash maps shine for frequency counts; sliding window for substrings; KMP / Z-algorithm for pattern search.',
    'two-pointers': 'Place pointers at chosen positions (both ends, or both at start) and move them based on a comparison rule. Each iteration shrinks the search space by one.',
    'sliding-window': 'Maintain a window over a contiguous segment. Expand the right edge; shrink the left edge when the invariant breaks. Track the answer at each valid window.',
    'binary-search': 'Identify the monotonic property in the search space, then repeatedly halve. Watch the loop invariant: `lo <= hi` vs `lo < hi`, and where to assign `mid+1` vs `mid`.',
    'dp': 'Define the state precisely: what does `dp[i]` represent? Write the recurrence. Decide between top-down (memoization) and bottom-up (tabulation). Reduce dimensions if rolling-window works.',
    '2d-dp': 'Define `dp[i][j]` as the answer for the prefix / subarray ending at (i, j). Most transitions reuse cells from the row above or column to the left.',
    'graphs': 'Build the adjacency list, then run BFS (shortest path in unweighted) or DFS (component / cycle detection). For weighted shortest path use Dijkstra or Bellman-Ford.',
    'advanced-graphs': 'Pick the right primitive: union-find (connectivity), topological sort (ordering), Tarjan/Kosaraju (SCC), MST (Kruskal/Prim).',
    'trees': 'Decide the traversal: pre-order (root first), in-order (sorted for BSTs), post-order (subtree results), or level-order (BFS for layer-by-layer).',
    'heap': 'Use a min-heap when you want the smallest k; max-heap for the largest. Heap operations are O(log n).',
    'backtracking': 'Build the candidate incrementally. Prune as soon as the partial candidate violates a constraint. Don\'t forget to undo state on the way back up.',
    'greedy': 'Identify the locally-optimal choice. Prove (or argue) it leads to a global optimum — usually via exchange or matroid arguments.',
    'intervals': 'Sort by start (or end). Sweep left-to-right merging overlaps; or count active intervals at each point.',
    'stack': 'Push when you see an opening / unresolved item; pop when the matching close arrives. Monotonic stacks resolve "next greater / smaller" in linear time.',
    'queue': 'FIFO for level-order / scheduling. Deque (double-ended) for sliding-window minimum/maximum.',
    'linkedlist': 'Use dummy heads to simplify head-pointer edits. Two pointers (slow / fast) detect cycles and find the midpoint.',
    'tries': 'Insert each word character-by-character. Mark a node `is_end` after the last character. Search/prefix is O(word length).',
    'recursion': 'Define base case + recursive case. Trust the recursion — assume it works for smaller inputs and combine those results.',
    'bit-manipulation': 'XOR cancels duplicates. `x & (x-1)` clears the lowest set bit. `1 << k` isolates the k-th bit.',
    'math': 'Look for closed-form formulas, modular arithmetic, GCD/LCM properties, or number-theoretic patterns. Avoid loops where a formula exists.',
    'geometry': 'Cross-product determines orientation. Sweep-line resolves many "max overlapping" questions in O(n log n).',
  };
  return map[t] || 'Identify the relevant data structure or invariant, then iterate carefully tracking the answer as you go.';
}

function complexityForTopic(t) {
  const map = {
    'arrays': '- Time: O(n) for single-pass solutions; O(n log n) when sorting; O(n²) for brute force.\n- Space: O(1) for in-place; O(n) when using a hash map or auxiliary array.',
    'strings': '- Time: O(n) or O(n + m) for pattern matching.\n- Space: O(k) for the character set (typically 26 or 128).',
    'binary-search': '- Time: O(log n).\n- Space: O(1) iterative, O(log n) recursive.',
    'sliding-window': '- Time: O(n) — each element enters and leaves the window once.\n- Space: O(k) for the window state.',
    'dp': '- Time: O(states × transitions).\n- Space: O(states), often reducible to O(width) with rolling arrays.',
    '2d-dp': '- Time: O(n × m).\n- Space: O(n × m), reducible to O(min(n, m)) with rolling rows.',
    'graphs': '- Time: O(V + E) for BFS / DFS.\n- Space: O(V) for visited + queue / stack.',
    'advanced-graphs': '- Time: O(E log V) for Dijkstra; O((V + E) α(V)) for union-find.\n- Space: O(V + E).',
    'trees': '- Time: O(n) — every node visited once.\n- Space: O(h) recursion depth; O(n) worst case for skewed trees.',
    'heap': '- Time: O(n log k) for top-k.\n- Space: O(k).',
    'backtracking': '- Time: O(branches^depth) — exponential, but pruning helps.\n- Space: O(depth) recursion + O(candidate) for the partial.',
    'two-pointers': '- Time: O(n) after the initial O(n log n) sort (if any).\n- Space: O(1).',
    'intervals': '- Time: O(n log n) for the sort.\n- Space: O(n) output, O(1) auxiliary.',
    'stack': '- Time: O(n) — amortized; each element pushed and popped once.\n- Space: O(n) worst case.',
    'queue': '- Time: O(n).\n- Space: O(k) for the window.',
    'linkedlist': '- Time: O(n).\n- Space: O(1) for two-pointer; O(n) for hash-based detection.',
    'tries': '- Time: O(word length) for insert / search.\n- Space: O(total characters across all words).',
    'bit-manipulation': '- Time: O(n) over bits or items.\n- Space: O(1).',
  };
  return map[t] || '- Time: depends on the chosen approach.\n- Space: O(input size) typical.';
}

// === Main ===
const all = [];
let from = 0;
while (true) {
  let q = sb.from('PGcode_problems')
    .select('id,name,roadmap_set,topic_id,tags,hints,description,test_cases,method_name,editorial_md,solutions,params')
    .range(from, from + 999);
  const { data, error } = await q;
  if (error) throw error;
  if (!data.length) break;
  all.push(...data);
  if (data.length < 1000) break;
  from += 1000;
}

const forceSkeletons = process.argv.includes('--force-skeletons');

const isSkeletonSol = (s) => {
  if (!s || typeof s !== 'object') return false;
  const py = s.python;
  return typeof py === 'string' && py.includes('Reference skeleton');
};

const eligible = all.filter(p => {
  if (bucketFilter && p.roadmap_set !== bucketFilter) return false;
  const noMethod = !p.method_name;
  const noEd = !p.editorial_md;
  const noSol = !p.solutions || Object.keys(p.solutions || {}).length === 0;
  const staleSkel = forceSkeletons && isSkeletonSol(p.solutions);
  return noMethod || noEd || noSol || staleSkel;
});

console.log(`Total problems: ${all.length}`);
console.log(`Eligible for backfill: ${eligible.length}`);

const patches = [];
for (const p of eligible) {
  const patch = { id: p.id };
  const inferred = inferParams(p.test_cases, p.name);
  const params = p.params && Array.isArray(p.params) && p.params.length ? p.params : inferred.params;
  const return_type = p.return_type || inferred.return_type;
  const methodName = p.method_name || methodNameFromTitle(p.name);

  if (!p.method_name) {
    patch.method_name = methodName;
    patch.params = inferred.params;
    patch.return_type = inferred.return_type;
  }

  if (!p.editorial_md) {
    patch.editorial_md = buildEditorial(p);
  }

  if (!p.solutions || Object.keys(p.solutions || {}).length === 0 || (forceSkeletons && isSkeletonSol(p.solutions))) {
    patch.solutions = buildSolutions(methodName, params, return_type, p.name);
  }

  if (Object.keys(patch).length > 1) patches.push(patch);
}

console.log(`Generated patches: ${patches.length}`);
if (dry) {
  console.log('Sample patch:', JSON.stringify(patches[0], null, 2).slice(0, 2000));
  process.exit(0);
}

const out = '/tmp/programmatic-backfill.json';
fs.writeFileSync(out, JSON.stringify(patches));
console.log(`Wrote ${out} (${(fs.statSync(out).size/1024).toFixed(1)} KB)`);
console.log(`\nNext: node scripts/upsert-problem-content.js ${out}`);
