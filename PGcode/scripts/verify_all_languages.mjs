#!/usr/bin/env node
// Multi-language verifier: runs each problem's Python, JavaScript, and Java
// solutions against stored test_cases and reports failures per language.
//
// Usage (from PGcode/):
//   node scripts/verify_all_languages.mjs              # all 3 languages
//   node scripts/verify_all_languages.mjs --lang=js    # just javascript
//   node scripts/verify_all_languages.mjs --lang=java  # just java
//   node scripts/verify_all_languages.mjs --lang=py    # just python (same as verify_solutions.mjs)

import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');

const langArg = process.argv.find(a => a.startsWith('--lang='));
const targetLang = langArg ? langArg.split('=')[1] : 'all';
const runPy = targetLang === 'all' || targetLang === 'py' || targetLang === 'python';
const runJs = targetLang === 'all' || targetLang === 'js' || targetLang === 'javascript';
const runJava = targetLang === 'all' || targetLang === 'java';

// ─── 1. Fetch data ───

function dbQuery(sql) {
  const r = spawnSync('supabase', ['db', 'query', '--linked', sql], {
    cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) { console.error('supabase db query failed:', r.stderr); process.exit(1); }
  const out = r.stdout;
  const start = out.indexOf('{');
  const end = out.lastIndexOf('}');
  if (start < 0 || end < 0) { console.error('no JSON in supabase output:', out.slice(0, 300)); process.exit(1); }
  return JSON.parse(out.slice(start, end + 1));
}

console.error('[1/4] Fetching problems + solutions from Supabase...');

const sql = `
  SELECT p.id, p.method_name, p.params, p.return_type, p.test_cases,
         sa.code_python, sa.code_javascript, sa.code_java
    FROM public."PGcode_problems" p
    JOIN public."PGcode_solution_approaches" sa ON sa.problem_id = p.id AND sa.approach_number = 1
   WHERE p.method_name IS NOT NULL
     AND p.test_cases IS NOT NULL
     AND jsonb_array_length(p.test_cases) > 0
   ORDER BY p.topic_id, p.id;
`;
const { rows } = dbQuery(sql);
console.error(`    fetched ${rows.length} problems`);

// ─── 2. Helpers ───

const isListNodeType = (t) => t === 'ListNode' || t === 'Optional[ListNode]';
const isTreeNodeType = (t) => t === 'TreeNode' || t === 'Optional[TreeNode]';

function compareOutput(actual, expected) {
  const a = (actual || '').trim();
  const e = (expected || '').trim();
  if (a === e) return true;
  try { return JSON.stringify(JSON.parse(a)) === JSON.stringify(JSON.parse(e)); } catch {}
  return a.toLowerCase() === e.toLowerCase();
}

function runCmd(cmd, args, code, stdin, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    let killed = false;
    const timer = setTimeout(() => { killed = true; proc.kill('SIGKILL'); }, timeoutMs);
    proc.stdout.on('data', d => out += d);
    proc.stderr.on('data', d => err += d);
    proc.on('close', (exitCode) => {
      clearTimeout(timer);
      resolve({ stdout: out, stderr: err, code: exitCode, timedOut: killed });
    });
    proc.stdin.write(stdin);
    proc.stdin.end();
  });
}

// ─── 3. Python wrapper ───

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
        if _node is None: _result.append(None)
        else: _result.append(_node.val); _q.append(_node.left); _q.append(_node.right)
    while _result and _result[-1] is None: _result.pop()
    return _result
`;

function wrapPython(userCode, methodName, params, returnType) {
  const isOps = params?.length === 1 && params[0].name === 'operations'
                && params[0].type?.startsWith('List[List');
  if (isOps) {
    return [
      'import sys, json', 'from typing import List, Optional, Dict, Tuple, Set',
      PY_HELPERS, userCode, '',
      '_ops = json.loads(sys.stdin.read().strip())',
      '_results = []', '_instance = None',
      'for _op in _ops:',
      '    _name = _op[0]', '    _args = _op[1:]',
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
  if (isListNodeType(returnType)) outputBlock = 'print(json.dumps(_from_list(_result)))';
  else if (isTreeNodeType(returnType)) outputBlock = 'print(json.dumps(_from_tree(_result)))';
  else outputBlock = [
    'if isinstance(_result, bool):', '    print(str(_result).lower())',
    'elif _result is None:', '    print("null")',
    'else:', '    print(json.dumps(_result))',
  ].join('\n');

  return [
    'import sys, json', 'from typing import List, Optional, Dict, Tuple, Set',
    PY_HELPERS, userCode, '',
    '_lines = sys.stdin.read().strip().split("\\n")',
    parsing, '_sol = Solution()',
    `_result = _sol.${methodName}(${args})`,
    outputBlock,
  ].join('\n');
}

// ─── 4. JavaScript wrapper ───

const JS_HELPERS = `
function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val);
    this.next = (next===undefined ? null : next);
}
function TreeNode(val, left, right) {
    this.val = (val===undefined ? 0 : val);
    this.left = (left===undefined ? null : left);
    this.right = (right===undefined ? null : right);
}
function _toList(arr) {
    if (!arr || arr.length === 0) return null;
    const head = new ListNode(arr[0]); let curr = head;
    for (let i = 1; i < arr.length; i++) { curr.next = new ListNode(arr[i]); curr = curr.next; }
    return head;
}
function _fromList(head) {
    const r = []; while (head) { r.push(head.val); head = head.next; } return r;
}
function _toTree(arr) {
    if (!arr || arr.length === 0) return null;
    const root = new TreeNode(arr[0]); const q = [root]; let i = 1;
    while (q.length > 0 && i < arr.length) {
        const node = q.shift();
        if (i < arr.length && arr[i] !== null) { node.left = new TreeNode(arr[i]); q.push(node.left); } i++;
        if (i < arr.length && arr[i] !== null) { node.right = new TreeNode(arr[i]); q.push(node.right); } i++;
    }
    return root;
}
function _fromTree(root) {
    if (!root) return [];
    const r = []; const q = [root];
    while (q.length > 0) {
        const node = q.shift();
        if (node === null) r.push(null);
        else { r.push(node.val); q.push(node.left); q.push(node.right); }
    }
    while (r.length > 0 && r[r.length - 1] === null) r.pop();
    return r;
}
`;

function wrapJavaScript(userCode, methodName, params, returnType) {
  const isOps = params?.length === 1 && params[0].name === 'operations'
                && params[0].type?.startsWith('List[List');
  if (isOps) {
    return [
      JS_HELPERS, userCode, '',
      "const _ops = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8').trim());",
      'const _results = []; let _instance = null;',
      'for (const _op of _ops) {',
      '    const [_name, ..._args] = _op;',
      '    if (_instance === null) {',
      '        const _Cls = eval(_name);',
      '        _instance = new _Cls(..._args);',
      '        _results.push(null);',
      '    } else {',
      '        const _ret = _instance[_name](..._args);',
      '        _results.push(_ret === undefined ? null : _ret);',
      '    }',
      '}',
      'console.log(JSON.stringify(_results));',
    ].join('\n');
  }

  const args = (params || []).map(p => p.name).join(', ');
  const parsing = (params || []).map((p, i) => {
    if (isListNodeType(p.type)) return `const ${p.name} = _toList(JSON.parse(_lines[${i}]));`;
    if (isTreeNodeType(p.type)) return `const ${p.name} = _toTree(JSON.parse(_lines[${i}]));`;
    return `const ${p.name} = JSON.parse(_lines[${i}]);`;
  }).join('\n');

  let outputBlock;
  if (isListNodeType(returnType)) outputBlock = 'console.log(JSON.stringify(_fromList(_result)));';
  else if (isTreeNodeType(returnType)) outputBlock = 'console.log(JSON.stringify(_fromTree(_result)));';
  else outputBlock = 'console.log(JSON.stringify(_result));';

  return [
    JS_HELPERS, userCode, '',
    "const _lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');",
    parsing,
    `const _result = ${methodName}(${args});`,
    outputBlock,
  ].join('\n');
}

// ─── 5. Java wrapper ───

function canRunJava(params, returnType) {
  // Java driver doesn't support ListNode/TreeNode types
  const hasNodeType = (params || []).some(p => isListNodeType(p.type) || isTreeNodeType(p.type))
                      || isListNodeType(returnType) || isTreeNodeType(returnType);
  return !hasNodeType;
}

function wrapJava(userCode, methodName, params, returnType) {
  const isOps = params?.length === 1 && params[0].name === 'operations'
                && params[0].type?.startsWith('List[List');
  // Skip ops-based Java for now — too complex to wrap generically
  if (isOps) return null;

  const args = (params || []).map(p => p.name).join(', ');

  const javaParsing = (params || []).map(p => {
    const line = `String _raw_${p.name} = br.readLine().trim();`;
    if (p.type === 'int') return `${line}\n        int ${p.name} = Integer.parseInt(_raw_${p.name});`;
    if (p.type === 'float') return `${line}\n        double ${p.name} = Double.parseDouble(_raw_${p.name});`;
    if (p.type === 'str') return `${line}\n        String ${p.name} = _raw_${p.name}.startsWith("\\"") ? _raw_${p.name}.substring(1, _raw_${p.name}.length()-1) : _raw_${p.name};`;
    if (p.type === 'bool') return `${line}\n        boolean ${p.name} = Boolean.parseBoolean(_raw_${p.name});`;
    if (p.type === 'List[int]') return [
      line,
      `        String _s_${p.name} = _raw_${p.name}.substring(1, _raw_${p.name}.length()-1);`,
      `        String[] _p_${p.name} = _s_${p.name}.isEmpty() ? new String[0] : _s_${p.name}.split(",");`,
      `        int[] ${p.name} = new int[_p_${p.name}.length];`,
      `        for(int i=0;i<_p_${p.name}.length;i++) ${p.name}[i]=Integer.parseInt(_p_${p.name}[i].trim());`,
    ].join('\n        ');
    if (p.type === 'List[str]') return [
      line,
      `        String _s_${p.name} = _raw_${p.name}.substring(1, _raw_${p.name}.length()-1);`,
      `        String[] ${p.name} = _s_${p.name}.isEmpty() ? new String[0] : _s_${p.name}.split(",");`,
      `        for(int i=0;i<${p.name}.length;i++) ${p.name}[i]=${p.name}[i].trim().replace("\\"","");`,
    ].join('\n        ');
    if (p.type === 'List[List[int]]') return [
      line, `        int[][] ${p.name} = _parseIntIntArr(_raw_${p.name});`,
    ].join('\n        ');
    if (p.type === 'List[List[str]]') return [
      line, `        String[][] ${p.name} = _parseStrStrArr(_raw_${p.name});`,
    ].join('\n        ');
    if (p.type === 'List') return `${line}\n        // generic List — skip`;
    return `${line}\n        // TODO: parse ${p.type}`;
  }).join('\n        ');

  return [
    'import java.util.*;',
    'import java.io.*;',
    '',
    userCode,
    '',
    'class Main {',
    '    public static void main(String[] _args) throws Exception {',
    '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
    `        ${javaParsing}`,
    '        Solution sol = new Solution();',
    `        Object _result = (Object) sol.${methodName}(${args});`,
    '        System.out.println(_jsonify(_result));',
    '    }',
    '',
    '    static int[][] _parseIntIntArr(String s) {',
    '        if (s.length() < 2) return new int[0][];',
    '        String inner = s.substring(1, s.length()-1);',
    '        if (inner.isEmpty()) return new int[0][];',
    '        List<int[]> rows = new ArrayList<>();',
    '        int depth = 0, start = 0;',
    '        for (int i = 0; i < inner.length(); i++) {',
    '            char c = inner.charAt(i);',
    '            if (c == \'[\') depth++;',
    '            else if (c == \']\') {',
    '                depth--;',
    '                if (depth == 0) {',
    '                    String row = inner.substring(start, i+1);',
    '                    String ri = row.substring(1, row.length()-1);',
    '                    if (ri.isEmpty()) rows.add(new int[0]);',
    '                    else {',
    '                        String[] parts = ri.split(",");',
    '                        int[] arr = new int[parts.length];',
    '                        for (int k = 0; k < parts.length; k++) arr[k] = Integer.parseInt(parts[k].trim());',
    '                        rows.add(arr);',
    '                    }',
    '                    i++; start = i + 1;',
    '                }',
    '            }',
    '        }',
    '        return rows.toArray(new int[0][]);',
    '    }',
    '',
    '    static String[][] _parseStrStrArr(String s) {',
    '        if (s.length() < 2) return new String[0][];',
    '        String inner = s.substring(1, s.length()-1);',
    '        if (inner.isEmpty()) return new String[0][];',
    '        List<String[]> rows = new ArrayList<>();',
    '        int depth = 0, start = 0;',
    '        for (int i = 0; i < inner.length(); i++) {',
    '            char c = inner.charAt(i);',
    '            if (c == \'[\') depth++;',
    '            else if (c == \']\') {',
    '                depth--;',
    '                if (depth == 0) {',
    '                    String row = inner.substring(start, i+1);',
    '                    String ri = row.substring(1, row.length()-1);',
    '                    if (ri.isEmpty()) rows.add(new String[0]);',
    '                    else {',
    '                        String[] parts = ri.split(",");',
    '                        for (int k = 0; k < parts.length; k++) parts[k] = parts[k].trim().replace("\\"","");',
    '                        rows.add(parts);',
    '                    }',
    '                    i++; start = i + 1;',
    '                }',
    '            }',
    '        }',
    '        return rows.toArray(new String[0][]);',
    '    }',
    '',
    '    static String _jsonify(Object o) {',
    '        if (o == null) return "null";',
    '        if (o instanceof Boolean) return o.toString();',
    '        if (o instanceof Integer || o instanceof Long) return o.toString();',
    '        if (o instanceof Double || o instanceof Float) return o.toString();',
    '        if (o instanceof String) return "\\"" + o + "\\"";',
    '        if (o instanceof int[]) {',
    '            StringBuilder sb = new StringBuilder("[");',
    '            int[] a = (int[]) o;',
    '            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }',
    '            sb.append("]"); return sb.toString();',
    '        }',
    '        if (o instanceof double[]) {',
    '            StringBuilder sb = new StringBuilder("[");',
    '            double[] a = (double[]) o;',
    '            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }',
    '            sb.append("]"); return sb.toString();',
    '        }',
    '        if (o instanceof String[]) {',
    '            StringBuilder sb = new StringBuilder("[");',
    '            String[] a = (String[]) o;',
    '            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append("\\""+a[i]+"\\""); }',
    '            sb.append("]"); return sb.toString();',
    '        }',
    '        if (o instanceof List) {',
    '            StringBuilder sb = new StringBuilder("[");',
    '            List<?> lst = (List<?>) o;',
    '            for (int i = 0; i < lst.size(); i++) { if (i > 0) sb.append(","); sb.append(_jsonify(lst.get(i))); }',
    '            sb.append("]"); return sb.toString();',
    '        }',
    '        if (o instanceof int[][]) {',
    '            StringBuilder sb = new StringBuilder("[");',
    '            int[][] a = (int[][]) o;',
    '            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(_jsonify(a[i])); }',
    '            sb.append("]"); return sb.toString();',
    '        }',
    '        return o.toString();',
    '    }',
    '}',
  ].join('\n');
}

async function runJavaCode(javaCode, stdin, timeoutMs = 15000) {
  const tmpDir = mkdtempSync(join(tmpdir(), 'pgcode-java-'));
  try {
    writeFileSync(join(tmpDir, 'Main.java'), javaCode);
    const comp = spawnSync('javac', [join(tmpDir, 'Main.java')], {
      encoding: 'utf8', timeout: 15000,
    });
    if (comp.status !== 0) {
      return { stdout: '', stderr: (comp.stderr || '').slice(0, 600), code: 1, timedOut: false, compileError: true };
    }
    return runCmd('java', ['-cp', tmpDir, 'Main'], null, stdin, timeoutMs);
  } finally {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

// ─── 6. Main loop ───

const langNames = [];
if (runPy) langNames.push('Python');
if (runJs) langNames.push('JavaScript');
if (runJava) langNames.push('Java');
console.error(`[2/4] Running solutions for: ${langNames.join(', ')}...`);

const results = { python: [], javascript: [], java: [] };
const counts = {
  python: { ok: 0, fail: 0, skip: 0 },
  javascript: { ok: 0, fail: 0, skip: 0 },
  java: { ok: 0, fail: 0, skip: 0 },
};

for (let pi = 0; pi < rows.length; pi++) {
  const p = rows[pi];
  const tag = `(${pi + 1}/${rows.length}) ${p.id}`;
  const tcs = p.test_cases || [];
  if (!tcs.length) continue;

  // ── Python ──
  if (runPy) {
    if (!p.code_python) {
      counts.python.skip++;
    } else {
      const wrapped = wrapPython(p.code_python, p.method_name, p.params, p.return_type);
      const res = await runOneLanguage('python3', ['-c', wrapped], null, tcs, p.id, 'py');
      if (res.ok) counts.python.ok++;
      else { counts.python.fail++; results.python.push({ id: p.id, ...res }); }
    }
  }

  // ── JavaScript ──
  if (runJs) {
    if (!p.code_javascript) {
      counts.javascript.skip++;
    } else {
      const wrapped = wrapJavaScript(p.code_javascript, p.method_name, p.params, p.return_type);
      const res = await runOneLanguage('node', ['-e', wrapped], null, tcs, p.id, 'js');
      if (res.ok) counts.javascript.ok++;
      else { counts.javascript.fail++; results.javascript.push({ id: p.id, ...res }); }
    }
  }

  // ── Java ──
  if (runJava) {
    const isOps = p.params?.length === 1 && p.params[0].name === 'operations'
                  && p.params[0].type?.startsWith('List[List');
    if (!p.code_java || !canRunJava(p.params, p.return_type) || isOps) {
      counts.java.skip++;
    } else {
      const wrapped = wrapJava(p.code_java, p.method_name, p.params, p.return_type);
      if (!wrapped || wrapped.includes('// TODO:') || wrapped.includes('// generic List')) {
        counts.java.skip++;
      } else {
        const res = await runJavaTests(wrapped, tcs, p.id);
        if (res.ok) counts.java.ok++;
        else { counts.java.fail++; results.java.push({ id: p.id, ...res }); }
      }
    }
  }

  // Progress every 20 problems
  if ((pi + 1) % 20 === 0) {
    console.error(`    ... ${pi + 1}/${rows.length} done`);
  }
}

async function runOneLanguage(cmd, args, _unused, tcs, problemId, lang) {
  for (let i = 0; i < tcs.length; i++) {
    const tc = tcs[i];
    const stdin = (tc.inputs || []).join('\n');
    const r = await runCmd(cmd, args, null, stdin);
    if (r.timedOut) return { ok: false, kind: 'timeout', testIdx: i, stderr: '' };
    if (r.code !== 0) return { ok: false, kind: 'runtime_error', testIdx: i, stderr: (r.stderr || '').slice(0, 400) };
    if (!compareOutput(r.stdout, tc.expected)) {
      return { ok: false, kind: 'wrong_answer', testIdx: i, expected: tc.expected, got: r.stdout.trim(), inputs: tc.inputs };
    }
  }
  return { ok: true };
}

async function runJavaTests(javaCode, tcs, problemId) {
  // Compile once, run each test case
  const tmpDir = mkdtempSync(join(tmpdir(), 'pgcode-java-'));
  try {
    writeFileSync(join(tmpDir, 'Main.java'), javaCode);
    const comp = spawnSync('javac', [join(tmpDir, 'Main.java')], {
      encoding: 'utf8', timeout: 15000,
    });
    if (comp.status !== 0) {
      return { ok: false, kind: 'compile_error', testIdx: 0, stderr: (comp.stderr || '').slice(0, 400) };
    }

    for (let i = 0; i < tcs.length; i++) {
      const tc = tcs[i];
      const stdin = (tc.inputs || []).join('\n');
      const r = await runCmd('java', ['-cp', tmpDir, 'Main'], null, stdin, 10000);
      if (r.timedOut) return { ok: false, kind: 'timeout', testIdx: i, stderr: '' };
      if (r.code !== 0) return { ok: false, kind: 'runtime_error', testIdx: i, stderr: (r.stderr || '').slice(0, 400) };
      if (!compareOutput(r.stdout, tc.expected)) {
        return { ok: false, kind: 'wrong_answer', testIdx: i, expected: tc.expected, got: r.stdout.trim(), inputs: tc.inputs };
      }
    }
    return { ok: true };
  } finally {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

// ─── 7. Report ───

console.error('[3/4] Writing reports...');

const report = { counts, failures: results };
writeFileSync(join(REPO, 'scripts/verifier_all_report.json'), JSON.stringify(report, null, 2));

const md = ['# Multi-Language Verifier Report', ''];
for (const lang of ['python', 'javascript', 'java']) {
  const c = counts[lang];
  const total = c.ok + c.fail + c.skip;
  if (!total) continue;
  md.push(`## ${lang.charAt(0).toUpperCase() + lang.slice(1)}`);
  md.push(`- **Pass:** ${c.ok}  **Fail:** ${c.fail}  **Skip:** ${c.skip}`);
  if (results[lang].length === 0) {
    md.push('- All passing!');
  } else {
    md.push('');
    md.push('| Problem | Kind | Test# | Expected | Got |');
    md.push('|---|---|---|---|---|');
    for (const f of results[lang]) {
      const exp = f.expected ? `\`${(f.expected || '').slice(0, 60)}\`` : '—';
      const got = f.got ? `\`${(f.got || '').slice(0, 60)}\`` : (f.stderr || '').slice(0, 80);
      md.push(`| \`${f.id}\` | ${f.kind} | #${f.testIdx + 1} | ${exp} | ${got} |`);
    }
  }
  md.push('');
}
writeFileSync(join(REPO, 'scripts/verifier_all_report.md'), md.join('\n'));

console.error('[4/4] Summary:');
for (const lang of ['python', 'javascript', 'java']) {
  const c = counts[lang];
  if (c.ok + c.fail + c.skip === 0) continue;
  const status = c.fail === 0 ? '✓' : '✗';
  console.error(`    ${status} ${lang}: ${c.ok} ok, ${c.fail} failing, ${c.skip} skipped`);
}
console.error(`\nReport: scripts/verifier_all_report.md`);
