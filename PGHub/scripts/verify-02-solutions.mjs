#!/usr/bin/env node
// Local verifier: runs each problem's reference Python solution against its
// stored test_cases and reports the first failing case per problem.
//
// Usage (from PGcode/):
//   node scripts/verify-02-solutions.mjs
//
// Output:
//   scripts/report-verify.md   — human-readable, only failing problems
//   scripts/report-verify.json — machine-readable, used by triage phase

import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');

// ─── 1. Pull problem + python solution data via Supabase CLI ───

function dbQuery(sql) {
  const r = spawnSync('supabase', ['db', 'query', '--linked', sql], {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) {
    console.error('supabase db query failed:', r.stderr);
    process.exit(1);
  }
  // CLI prefixes "Initialising login role..." etc. Find the first { and parse to last }.
  const out = r.stdout;
  const start = out.indexOf('{');
  const end = out.lastIndexOf('}');
  if (start < 0 || end < 0) {
    console.error('no JSON in supabase output:', out.slice(0, 300));
    process.exit(1);
  }
  return JSON.parse(out.slice(start, end + 1));
}

console.error('[1/3] Fetching problems + python solutions from Supabase...');

const sql = `
  SELECT p.id, p.method_name, p.params, p.return_type, p.test_cases,
         (SELECT code_python FROM public."PGcode_solution_approaches" sa
            WHERE sa.problem_id = p.id ORDER BY approach_number ASC LIMIT 1) AS code_python
    FROM public."PGcode_problems" p
   WHERE p.method_name IS NOT NULL
     AND p.test_cases IS NOT NULL
     AND jsonb_array_length(p.test_cases) > 0
   ORDER BY p.topic_id, p.id;
`;
const { rows } = dbQuery(sql);
console.error(`    fetched ${rows.length} problems with method + test_cases`);

// ─── 2. Python driver wrap (mirrors src/lib/driverCode.js) ───

const PY_HELPERS = `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val; self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def _to_list(arr):
    if not arr: return None
    _head = ListNode(arr[0]); _curr = _head
    for _v in arr[1:]:
        _curr.next = ListNode(_v); _curr = _curr.next
    return _head

def _from_list(head):
    _result = []
    while head:
        _result.append(head.val); head = head.next
    return _result

def _to_tree(arr):
    if not arr: return None
    _root = TreeNode(arr[0]); _q = [_root]; _i = 1
    while _q and _i < len(arr):
        _node = _q.pop(0)
        if _i < len(arr) and arr[_i] is not None:
            _node.left = TreeNode(arr[_i]); _q.append(_node.left)
        _i += 1
        if _i < len(arr) and arr[_i] is not None:
            _node.right = TreeNode(arr[_i]); _q.append(_node.right)
        _i += 1
    return _root

def _from_tree(root):
    if not root: return []
    _result = []; _q = [root]
    while _q:
        _node = _q.pop(0)
        if _node is None:
            _result.append(None)
        else:
            _result.append(_node.val); _q.append(_node.left); _q.append(_node.right)
    while _result and _result[-1] is None:
        _result.pop()
    return _result
`;

const isListNodeType = (t) => t === 'ListNode' || t === 'Optional[ListNode]';
const isTreeNodeType = (t) => t === 'TreeNode' || t === 'Optional[TreeNode]';

function wrapPython(userCode, methodName, params, returnType) {
  // Operations runner: design-class problems with tests like [["ClassName"],[op,args...],...]
  const isOps = params && params.length === 1 && params[0].name === 'operations'
                && params[0].type && params[0].type.startsWith('List[List');
  if (isOps) {
    return [
      'import sys, json',
      'from typing import List, Optional, Dict, Tuple, Set',
      PY_HELPERS,
      userCode,
      '',
      '_ops = json.loads(sys.stdin.read().strip())',
      '_results = []',
      '_instance = None',
      'for _op in _ops:',
      '    _name = _op[0]',
      '    _args = _op[1:]',
      '    if _instance is None:',
      '        _cls = globals()[_name]',
      '        _instance = _cls(*_args)',
      '        _results.append(None)',
      '    else:',
      '        _ret = getattr(_instance, _name)(*_args)',
      '        _results.append(_ret)',
      'print(json.dumps(_results))',
    ].join('\n');
  }

  const args = (params || []).map(p => p.name).join(', ');
  const parsing = (params || []).map((p, i) => {
    if (isListNodeType(p.type)) return `${p.name} = _to_list(json.loads(_lines[${i}]))`;
    if (isTreeNodeType(p.type)) return `${p.name} = _to_tree(json.loads(_lines[${i}]))`;
    return `${p.name} = json.loads(_lines[${i}])`;
  }).join('\n');

  let outputBlock;
  if (isListNodeType(returnType)) {
    outputBlock = 'print(json.dumps(_from_list(_result)))';
  } else if (isTreeNodeType(returnType)) {
    outputBlock = 'print(json.dumps(_from_tree(_result)))';
  } else {
    outputBlock = [
      'if isinstance(_result, bool):',
      '    print(str(_result).lower())',
      'elif _result is None:',
      '    print("null")',
      'else:',
      '    print(json.dumps(_result))',
    ].join('\n');
  }

  return [
    'import sys, json',
    'from typing import List, Optional, Dict, Tuple, Set',
    PY_HELPERS,
    userCode,
    '',
    '_lines = sys.stdin.read().strip().split("\\n")',
    parsing,
    '_sol = Solution()',
    `_result = _sol.${methodName}(${args})`,
    outputBlock,
  ].join('\n');
}

// ─── 3. Compare (mirror of driverCode.js compareOutput) ───

function compareOutput(actual, expected) {
  const a = (actual || '').trim();
  const e = (expected || '').trim();
  if (a === e) return true;
  try {
    return JSON.stringify(JSON.parse(a)) === JSON.stringify(JSON.parse(e));
  } catch {
    return a.toLowerCase() === e.toLowerCase();
  }
}

// ─── 4. Run python3 with stdin, return {stdout, stderr, code} ───

function runPython(code, stdin, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const proc = spawn('python3', ['-c', code], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    let killed = false;
    const timer = setTimeout(() => { killed = true; proc.kill('SIGKILL'); }, timeoutMs);
    proc.stdout.on('data', d => out += d);
    proc.stderr.on('data', d => err += d);
    proc.on('close', (codeExit) => {
      clearTimeout(timer);
      resolve({ stdout: out, stderr: err, code: codeExit, timedOut: killed });
    });
    proc.stdin.write(stdin);
    proc.stdin.end();
  });
}

// ─── 5. Main loop ───

console.error('[2/3] Running each problem through python3...');

const failures = [];
const skipped = [];
let okCount = 0;

for (let pi = 0; pi < rows.length; pi++) {
  const p = rows[pi];
  const tag = `(${pi + 1}/${rows.length}) ${p.id}`;
  if (!p.code_python) {
    skipped.push({ id: p.id, reason: 'no python solution' });
    console.error(`    SKIP ${tag} — no python solution`);
    continue;
  }
  const tcs = p.test_cases || [];
  const total = tcs.length;
  if (!total) {
    skipped.push({ id: p.id, reason: 'no test cases' });
    continue;
  }
  const wrapped = wrapPython(p.code_python, p.method_name, p.params, p.return_type);

  let firstFail = null;
  let runtimeError = null;
  for (let i = 0; i < total; i++) {
    const tc = tcs[i];
    const stdin = (tc.inputs || []).join('\n');
    const r = await runPython(wrapped, stdin);
    if (r.timedOut) {
      runtimeError = { idx: i, kind: 'timeout', stderr: '' };
      break;
    }
    if (r.code !== 0) {
      runtimeError = { idx: i, kind: 'runtime_error', stderr: (r.stderr || '').slice(0, 600) };
      break;
    }
    if (!compareOutput(r.stdout, tc.expected)) {
      firstFail = {
        idx: i,
        inputs: tc.inputs,
        expected: tc.expected,
        got: r.stdout.trim(),
      };
      break;
    }
  }

  if (firstFail) {
    failures.push({
      id: p.id,
      method_name: p.method_name,
      params: p.params,
      return_type: p.return_type,
      totalCases: total,
      passedCount: firstFail.idx,
      firstFail,
      kind: 'wrong_answer',
    });
    console.error(`    FAIL ${tag} — ${firstFail.idx}/${total} passed, first fail #${firstFail.idx + 1}`);
  } else if (runtimeError) {
    failures.push({
      id: p.id,
      method_name: p.method_name,
      params: p.params,
      return_type: p.return_type,
      totalCases: total,
      passedCount: runtimeError.idx,
      runtimeError,
      kind: runtimeError.kind,
    });
    console.error(`    ERR  ${tag} — ${runtimeError.kind} on test #${runtimeError.idx + 1}`);
  } else {
    okCount++;
  }
}

// ─── 6. Write reports ───

console.error('[3/3] Writing reports...');

writeFileSync(
  join(REPO, 'scripts/report-verify.json'),
  JSON.stringify({ ok: okCount, failed: failures.length, skipped: skipped.length, failures, skipped }, null, 2)
);

const md = [];
md.push(`# Verifier report`);
md.push('');
md.push(`- **Passing:** ${okCount}`);
md.push(`- **Failing:** ${failures.length}`);
md.push(`- **Skipped (no python solution / no tests):** ${skipped.length}`);
md.push('');
if (failures.length === 0) {
  md.push(`No failing problems. 🎉`);
} else {
  md.push(`## Failing problems`);
  md.push('');
  md.push(`| Problem | Pass/Total | First fail | Inputs | Expected | Got |`);
  md.push(`|---|---|---|---|---|---|`);
  for (const f of failures) {
    if (f.kind === 'wrong_answer') {
      const ff = f.firstFail;
      const inp = (ff.inputs || []).join(' \\| ').replace(/\|/g, '\\|');
      md.push(`| \`${f.id}\` | ${f.passedCount}/${f.totalCases} | #${ff.idx + 1} | ${inp} | \`${ff.expected}\` | \`${ff.got}\` |`);
    } else {
      const re = f.runtimeError;
      md.push(`| \`${f.id}\` | ${f.passedCount}/${f.totalCases} | #${re.idx + 1} | ${f.kind} | — | ${(re.stderr || '').split('\n').slice(-3).join(' ').slice(0, 200)} |`);
    }
  }
}
md.push('');
if (skipped.length) {
  md.push(`## Skipped`);
  for (const s of skipped) md.push(`- \`${s.id}\` — ${s.reason}`);
}

writeFileSync(join(REPO, 'scripts/report-verify.md'), md.join('\n'));

console.error(`\nDone. ${okCount} ok, ${failures.length} failing, ${skipped.length} skipped.`);
console.error(`Report: scripts/report-verify.md`);
