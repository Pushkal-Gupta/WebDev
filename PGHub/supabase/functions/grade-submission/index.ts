// Supabase Edge Function: grade-submission
//
// Loads test cases + driver metadata server-side, wraps the user's code in a
// per-language harness, calls Judge0 batch, and returns aggregated verdict.
// Test expected_output never reaches the client.
//
// Request:  { problem_id: string, language: "python"|"javascript"|"java"|"cpp", code: string }
// Response: { verdict: "accepted"|"wrong_answer"|"compile_error"|"runtime_error"|"time_limit",
//             passed: number, total: number,
//             cases: Array<{ index: number, status: string, hint?: string, is_sample: boolean }> }
// Note: hidden (non-sample) case hints never include the test inputs or expected output.
//
// Env:
//   SUPABASE_URL                — auto-set by Supabase Functions runtime
//   SUPABASE_SERVICE_ROLE_KEY   — auto-set
//   JUDGE0_URL                  — default https://ce.judge0.com
//   JUDGE0_RAPIDAPI_KEY / HOST  — optional rapidapi pairing

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const LANG_MAP: Record<string, number> = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54,
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const JUDGE0_URL = Deno.env.get("JUDGE0_URL") || "https://ce.judge0.com";
const RAPID_KEY = Deno.env.get("JUDGE0_RAPIDAPI_KEY");
const RAPID_HOST = Deno.env.get("JUDGE0_RAPIDAPI_HOST");

function judge0Headers(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (RAPID_KEY) h["x-rapidapi-key"] = RAPID_KEY;
  if (RAPID_HOST) h["x-rapidapi-host"] = RAPID_HOST;
  return h;
}

type Param = { name: string; type: string };
type TestCase = { inputs: string[]; expected: string; is_sample?: boolean };

function pyLiteral(raw: string, type: string): string {
  // raw is the test-case input as serialised in the seed scripts (already a
  // python-compatible literal in almost every case, since we used [..], "..", numeric strings)
  if (type === "bool") return raw === "true" ? "True" : "False";
  if (type === "str") return raw;
  return raw;
}

function isCycledListParams(params: Param[]): boolean {
  return params.length === 2
    && params[0]?.type === "List[int]" && params[0]?.name === "values"
    && params[1]?.type === "int" && params[1]?.name === "pos";
}

const PY_IMPORTS = `import sys, json, math, re, bisect, heapq, random, functools, itertools, collections, string, operator
from typing import List, Optional, Dict, Tuple, Set
from collections import deque, defaultdict, Counter, OrderedDict
from functools import lru_cache, reduce
from math import inf, gcd`;

const PY_HELPERS = `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
class Node:
    def __init__(self, val=None, children=None):
        self.val = val
        self.children = children if children is not None else []
def _to_list(arr):
    if not arr: return None
    _h = ListNode(arr[0]); _c = _h
    for _v in arr[1:]:
        _c.next = ListNode(_v); _c = _c.next
    return _h
def _to_list_cycle(arr, pos):
    if not arr: return None
    _n = [ListNode(arr[0])]
    for _v in arr[1:]:
        _n.append(ListNode(_v)); _n[-2].next = _n[-1]
    if pos is not None and pos >= 0 and pos < len(_n): _n[-1].next = _n[pos]
    return _n[0]
def _from_list(head):
    _r = []
    while head:
        _r.append(head.val); head = head.next
    return _r
def _to_tree(arr):
    if not arr: return None
    _root = TreeNode(arr[0]); _q = [_root]; _i = 1
    while _q and _i < len(arr):
        _nd = _q.pop(0)
        if _i < len(arr) and arr[_i] is not None:
            _nd.left = TreeNode(arr[_i]); _q.append(_nd.left)
        _i += 1
        if _i < len(arr) and arr[_i] is not None:
            _nd.right = TreeNode(arr[_i]); _q.append(_nd.right)
        _i += 1
    return _root
def _from_tree(root):
    if not root: return []
    _r = []; _q = [root]
    while _q:
        _nd = _q.pop(0)
        if _nd is None: _r.append(None)
        else:
            _r.append(_nd.val); _q.append(_nd.left); _q.append(_nd.right)
    while _r and _r[-1] is None: _r.pop()
    return _r
def _to_nary(arr):
    if not arr: return None
    _root = Node(arr[0], []); _q = [_root]; _i = 2
    while _q and _i < len(arr):
        _p = _q.pop(0)
        while _i < len(arr) and arr[_i] is not None:
            _ch = Node(arr[_i], []); _p.children.append(_ch); _q.append(_ch); _i += 1
        _i += 1
    return _root
def _from_nary(root):
    if not root: return []
    _r = [root.val, None]; _q = [root]
    while _q:
        _nd = _q.pop(0)
        for _c in (_nd.children or []):
            _r.append(_c.val); _q.append(_c)
        if _q: _r.append(None)
    while _r and _r[-1] is None: _r.pop()
    return _r
`;

function buildPythonDriver(code: string, methodName: string, params: Param[], returnType: string): string {
  const cycled = isCycledListParams(params);
  const reads = cycled
    ? `    _values = json.loads(input())\n    _pos = int(input().strip())\n    args.append(_to_list_cycle(_values, _pos))`
    : params.map((p) => {
        if (p.type === "bool") return `    args.append(input().strip() == 'true')`;
        if (p.type === "str") {
          // JSON-encoded string ("abc") or bare — accept both
          return `    _l = input()\n    try:\n        _v = json.loads(_l)\n        args.append(_v if isinstance(_v, str) else _l)\n    except Exception:\n        args.append(_l)`;
        }
        if (isTreeT(p.type)) return `    args.append(_to_tree(json.loads(input())))`;
        if (isListT(p.type)) return `    args.append(_to_list(json.loads(input())))`;
        if (isNaryT(p.type)) return `    args.append(_to_nary(json.loads(input())))`;
        return `    args.append(json.loads(input()))`;
      }).join("\n");
  const out = isTreeT(returnType)
    ? `    print(json.dumps(_from_tree(r)))`
    : isListT(returnType)
    ? `    print(json.dumps(_from_list(r)))`
    : isNaryT(returnType)
    ? `    print(json.dumps(_from_nary(r)))`
    : `    print(_fmt(r))`;
  return `${PY_IMPORTS}
${PY_HELPERS}
${code}

def _fmt(v):
    if isinstance(v, bool): return 'true' if v else 'false'
    if v is None: return 'null'
    if isinstance(v, (list, tuple)): return '[' + ','.join(_fmt(x) for x in v) + ']'
    if isinstance(v, str): return v
    return str(v)

if __name__ == '__main__':
    args = []
${reads}
    sol = Solution()
    r = sol.${methodName}(*args)
${out}
`;
}

const JS_HELPERS = `
function ListNode(val, next) { this.val = val === undefined ? 0 : val; this.next = next === undefined ? null : next; }
function TreeNode(val, left, right) { this.val = val === undefined ? 0 : val; this.left = left === undefined ? null : left; this.right = right === undefined ? null : right; }
function _Node(val, children) { this.val = val === undefined ? null : val; this.children = children === undefined ? [] : children; }
var Node = _Node;
function _toListCycle(arr, pos) {
  if (!arr || !arr.length) return null;
  const nodes = [new ListNode(arr[0])];
  for (let i = 1; i < arr.length; i++) { nodes.push(new ListNode(arr[i])); nodes[i-1].next = nodes[i]; }
  if (pos != null && pos >= 0 && pos < nodes.length) nodes[nodes.length - 1].next = nodes[pos];
  return nodes[0];
}
function _toList(arr) { if (!arr || !arr.length) return null; const h = new ListNode(arr[0]); let c = h; for (let i=1;i<arr.length;i++){ c.next = new ListNode(arr[i]); c = c.next; } return h; }
function _fromList(head){ const r=[]; while(head){ r.push(head.val); head=head.next; } return r; }
function _toTree(arr){ if(!arr||!arr.length) return null; const root=new TreeNode(arr[0]); const q=[root]; let i=1; while(q.length&&i<arr.length){ const nd=q.shift(); if(i<arr.length&&arr[i]!=null){ nd.left=new TreeNode(arr[i]); q.push(nd.left);} i++; if(i<arr.length&&arr[i]!=null){ nd.right=new TreeNode(arr[i]); q.push(nd.right);} i++; } return root; }
function _fromTree(root){ if(!root) return []; const r=[]; const q=[root]; while(q.length){ const nd=q.shift(); if(nd==null) r.push(null); else { r.push(nd.val); q.push(nd.left); q.push(nd.right);} } while(r.length&&r[r.length-1]==null) r.pop(); return r; }
function _toNary(arr){ if(!arr||!arr.length) return null; const root=new _Node(arr[0],[]); const q=[root]; let i=2; while(q.length&&i<arr.length){ const p=q.shift(); while(i<arr.length&&arr[i]!=null){ const ch=new _Node(arr[i],[]); p.children.push(ch); q.push(ch); i++; } i++; } return root; }
function _fromNary(root){ if(!root) return []; const r=[root.val,null]; const q=[root]; while(q.length){ const nd=q.shift(); for(const c of (nd.children||[])){ r.push(c.val); q.push(c);} if(q.length) r.push(null);} while(r.length&&r[r.length-1]==null) r.pop(); return r; }
`;

function buildJsDriver(code: string, methodName: string, params: Param[], returnType: string): string {
  const cycled = isCycledListParams(params);
  const reads = cycled
    ? `const _values = JSON.parse(lines.shift());\n  const _pos = parseInt(lines.shift().trim(), 10);\n  args.push(_toListCycle(_values, _pos));`
    : params.map((p) => {
        if (p.type === "bool") return `args.push(lines.shift() === 'true');`;
        if (p.type === "str") { return `{ const _l = lines.shift(); try { const _v = JSON.parse(_l); args.push(typeof _v === 'string' ? _v : _l); } catch(e) { args.push(_l); } }`; }
        if (isTreeT(p.type)) return `args.push(_toTree(JSON.parse(lines.shift())));`;
        if (isListT(p.type)) return `args.push(_toList(JSON.parse(lines.shift())));`;
        if (isNaryT(p.type)) return `args.push(_toNary(JSON.parse(lines.shift())));`;
        return `args.push(JSON.parse(lines.shift()));`;
      }).join("\n  ");
  const out = isTreeT(returnType)
    ? `console.log(JSON.stringify(_fromTree(r)));`
    : isListT(returnType)
    ? `console.log(JSON.stringify(_fromList(r)));`
    : isNaryT(returnType)
    ? `console.log(JSON.stringify(_fromNary(r)));`
    : `console.log(_fmt(r));`;
  return `${JS_HELPERS}
${code}
const lines = require('fs').readFileSync(0, 'utf8').split('\\n');
const args = [];
  ${reads}
function _fmt(v) {
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (v === null) return 'null';
  if (Array.isArray(v)) return '[' + v.map(_fmt).join(',') + ']';
  return String(v);
}
const sol = (typeof Solution !== 'undefined') ? new Solution() : { ${methodName}: (typeof ${methodName} !== 'undefined' ? ${methodName} : null) };
const r = (sol.${methodName}).apply(sol, args);
${out}
`;
}

function buildJavaDriver(code: string, methodName: string, params: Param[], returnType: string): string {
  // Java driver: read each parameter from stdin lines, parse with helpers, call method, print result.
  const javaTypeOf = (t: string): string => {
    if (t === "int") return "int";
    if (t === "long") return "long";
    if (t === "double") return "double";
    if (t === "bool") return "boolean";
    if (t === "str") return "String";
    if (t === "List[int]") return "int[]";
    if (t === "List[List[int]]") return "int[][]";
    if (t === "List[str]") return "String[]";
    return "String";
  };
  const reads = params.map((p, i) => {
    const jt = javaTypeOf(p.type);
    if (p.type === "int") return `        int a${i} = Integer.parseInt(sc.nextLine().trim());`;
    if (p.type === "long") return `        long a${i} = Long.parseLong(sc.nextLine().trim());`;
    if (p.type === "double") return `        double a${i} = Double.parseDouble(sc.nextLine().trim());`;
    if (p.type === "bool") return `        boolean a${i} = sc.nextLine().trim().equals("true");`;
    if (p.type === "str") return `        String a${i} = sc.nextLine();`;
    if (p.type === "List[int]") return `        int[] a${i} = parseIntArr(sc.nextLine());`;
    if (p.type === "List[List[int]]") return `        int[][] a${i} = parseIntArr2(sc.nextLine());`;
    if (p.type === "List[str]") return `        String[] a${i} = parseStrArr(sc.nextLine());`;
    return `        String a${i} = sc.nextLine();`;
  }).join("\n");
  const argList = params.map((_, i) => `a${i}`).join(", ");
  return `import java.util.*;

${code}

public class Main {
    static int[] parseIntArr(String s) {
        s = s.trim();
        if (s.equals("[]")) return new int[0];
        s = s.substring(1, s.length()-1);
        String[] parts = s.split(",");
        int[] r = new int[parts.length];
        for (int i=0;i<parts.length;i++) r[i] = Integer.parseInt(parts[i].trim());
        return r;
    }
    static int[][] parseIntArr2(String s) {
        s = s.trim();
        if (s.equals("[]")) return new int[0][];
        s = s.substring(1, s.length()-1);
        if (s.isEmpty()) return new int[0][];
        List<int[]> rows = new ArrayList<>();
        int depth = 0, start = 0;
        for (int i=0;i<s.length();i++) {
            char c = s.charAt(i);
            if (c == '[') { if (depth==0) start = i; depth++; }
            else if (c == ']') { depth--; if (depth==0) rows.add(parseIntArr(s.substring(start, i+1))); }
        }
        return rows.toArray(new int[0][]);
    }
    static String[] parseStrArr(String s) {
        s = s.trim();
        if (s.equals("[]")) return new String[0];
        s = s.substring(1, s.length()-1);
        if (s.isEmpty()) return new String[0];
        String[] parts = s.split(",");
        for (int i=0;i<parts.length;i++) {
            parts[i] = parts[i].trim();
            if (parts[i].startsWith("\\"") && parts[i].endsWith("\\"")) parts[i] = parts[i].substring(1, parts[i].length()-1);
        }
        return parts;
    }
    static String fmt(Object v) {
        if (v instanceof Boolean) return ((Boolean)v) ? "true" : "false";
        if (v instanceof int[]) return Arrays.toString((int[])v).replaceAll(" ", "");
        if (v instanceof int[][]) {
            int[][] arr = (int[][])v;
            StringBuilder sb = new StringBuilder("[");
            for (int i=0;i<arr.length;i++) { if (i>0) sb.append(","); sb.append(fmt(arr[i])); }
            sb.append("]");
            return sb.toString();
        }
        if (v instanceof String[]) {
            String[] arr = (String[])v;
            StringBuilder sb = new StringBuilder("[");
            for (int i=0;i<arr.length;i++) { if (i>0) sb.append(","); sb.append("\\"").append(arr[i]).append("\\""); }
            sb.append("]");
            return sb.toString();
        }
        return String.valueOf(v);
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
${reads}
        Solution sol = new Solution();
        Object r = sol.${methodName}(${argList});
        System.out.println(fmt(r));
    }
}
`;
}

function buildCppDriver(code: string, methodName: string, params: Param[]): string {
  const reads = params.map((p, i) => {
    if (p.type === "int") return `    int a${i}; cin >> a${i}; cin.ignore();`;
    if (p.type === "long") return `    long long a${i}; cin >> a${i}; cin.ignore();`;
    if (p.type === "double") return `    double a${i}; cin >> a${i}; cin.ignore();`;
    if (p.type === "bool") return `    string _b${i}; getline(cin,_b${i}); bool a${i} = (_b${i}=="true");`;
    if (p.type === "str") return `    string a${i}; getline(cin,a${i});`;
    if (p.type === "List[int]") return `    string _l${i}; getline(cin,_l${i}); auto a${i} = parseVec(_l${i});`;
    if (p.type === "List[List[int]]") return `    string _l${i}; getline(cin,_l${i}); auto a${i} = parseVec2(_l${i});`;
    return `    string a${i}; getline(cin,a${i});`;
  }).join("\n");
  const argList = params.map((_, i) => `a${i}`).join(", ");
  return `#include <bits/stdc++.h>
using namespace std;

${code}

vector<int> parseVec(string s) {
    vector<int> r;
    string num;
    for (char c : s) {
        if (isdigit(c) || c=='-') num.push_back(c);
        else if (!num.empty()) { r.push_back(stoi(num)); num.clear(); }
    }
    if (!num.empty()) r.push_back(stoi(num));
    return r;
}
vector<vector<int>> parseVec2(string s) {
    vector<vector<int>> r;
    int depth=0; string buf;
    for (char c : s) {
        if (c=='[') { if (depth==1) buf.clear(); depth++; if (depth>=2) buf.push_back(c); }
        else if (c==']') { depth--; if (depth>=1) buf.push_back(c); if (depth==1) r.push_back(parseVec(buf)); }
        else if (depth>=2) buf.push_back(c);
    }
    return r;
}
string fmtVec(vector<int>& v) { string s="["; for(size_t i=0;i<v.size();i++){if(i)s+=",";s+=to_string(v[i]);} return s+"]"; }
string fmtBool(bool b) { return b?"true":"false"; }

int main(){
${reads}
    Solution sol;
    auto r = sol.${methodName}(${argList});
    cout << r << endl;
    return 0;
}
`;
}

function buildDriver(language: string, code: string, methodName: string, params: Param[], returnType: string): string {
  if (language === "python") return buildPythonDriver(code, methodName, params, returnType);
  if (language === "javascript") return buildJsDriver(code, methodName, params, returnType);
  if (language === "java") return buildJavaDriver(code, methodName, params, returnType);
  if (language === "cpp") return buildCppDriver(code, methodName, params);
  throw new Error(`grade-submission: unsupported language ${language}`);
}

const isTreeT = (t: string) => t === "TreeNode" || t === "Optional[TreeNode]";
const isListT = (t: string) => t === "ListNode" || t === "Optional[ListNode]";
const isNaryT = (t: string) => t === "Node" || t === "Optional[Node]";

function stdinFromTestCase(tc: TestCase): string {
  // Each input on its own line; preserve as-is (already serialised by seed scripts).
  return tc.inputs.join("\n") + "\n";
}

function normalise(s: string): string {
  return (s || "").trim().replace(/\s+/g, "");
}

// Deep structural equality for JSON values. Required because Judge0/Python
// emit "[0, 7]" while stored expected is "[0,7]" — strict string compare
// (Judge0's expected_output mechanism) flags WA on every array result.
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  // Float tolerance (~1e-5, LeetCode parity): stored expecteds rounded to 5 dp
  // vs canonical full precision would strict-WA a correct real-valued answer.
  // Integers differ by >=1, far above tolerance, so no wrong int answer passes.
  if (typeof a === "number") return Math.abs(a - (b as number)) <= 1e-5 * Math.max(1, Math.abs(a), Math.abs(b as number));
  if (typeof a !== "object") return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const ba = b as unknown[];
    if (a.length !== ba.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], ba[i])) return false;
    return true;
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const ak = Object.keys(ao), bk = Object.keys(bo);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (!Object.prototype.hasOwnProperty.call(bo, k)) return false;
    if (!deepEqual(ao[k], bo[k])) return false;
  }
  return true;
}

function equalsNormalized(expected: string, actual: string): boolean {
  const a = (actual ?? "").toString().trim();
  const e = (expected ?? "").toString().trim();
  if (a === e) return true;
  let pa: unknown, pe: unknown, parsedA = false, parsedE = false;
  try { pa = JSON.parse(a); parsedA = true; } catch { /* not JSON */ }
  try { pe = JSON.parse(e); parsedE = true; } catch { /* not JSON */ }
  if (parsedA && parsedE) return deepEqual(pa, pe);
  // Fallback for non-JSON output (e.g. a bare `str` return). Collapse internal
  // whitespace runs to a single space and trim — tolerant of incidental double
  // spaces, but case- and word-boundary-SENSITIVE so a wrong-cased or wrong-
  // spaced string (which LeetCode would reject) fails here too. NEVER strip all
  // whitespace or lowercase: that passed wrong solutions on string-output problems.
  return a.replace(/\s+/g, " ") === e.replace(/\s+/g, " ");
}

async function pollBatch(tokens: string[]): Promise<any[]> {
  const tokenParam = tokens.join(",");
  const fields = "status,stdout,stderr,compile_output,message,token";
  const url = `${JUDGE0_URL}/submissions/batch?tokens=${tokenParam}&base64_encoded=false&fields=${fields}`;
  for (let attempt = 0; attempt < 30; attempt++) {
    const res = await fetch(url, { headers: judge0Headers() });
    if (!res.ok) throw new Error(`Judge0 poll failed: ${res.status}`);
    const data = await res.json();
    const subs = data.submissions || [];
    const pending = subs.some((s: any) => s.status?.id === 1 || s.status?.id === 2);
    if (!pending && subs.length === tokens.length) return subs;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("Judge0 poll timed out");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const { problem_id, language, code } = await req.json();
    if (!problem_id || typeof problem_id !== "string") throw new Error("problem_id required");
    if (!code || typeof code !== "string") throw new Error("code required");
    if (code.length > 100_000) throw new Error("code too large");
    const langId = LANG_MAP[language];
    if (!langId) throw new Error(`Unsupported language: ${language}`);

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: problem, error } = await sb
      .from("PGcode_problems")
      .select("id, method_name, params, return_type, test_cases")
      .eq("id", problem_id)
      .maybeSingle();

    if (error) throw new Error(`DB error: ${error.message}`);
    if (!problem) throw new Error(`Problem not found: ${problem_id}`);
    if (!problem.method_name || !Array.isArray(problem.test_cases) || problem.test_cases.length === 0) {
      throw new Error("Problem is not graded yet (missing method_name or test_cases)");
    }

    const params: Param[] = problem.params || [];
    const tests: TestCase[] = problem.test_cases as TestCase[];
    const source = buildDriver(language, code, problem.method_name, params, problem.return_type);

    // A case is "sample" (visible to the user) if explicitly flagged, OR — as a
    // legacy fallback for problems whose test_cases haven't been backfilled —
    // the first three indices. Everything else is hidden; failure hints for
    // hidden cases must NOT leak inputs or expected output.
    const anyFlagged = tests.some((t) => t && t.is_sample === true);
    const isSample = (idx: number) => anyFlagged ? !!tests[idx]?.is_sample : idx < 3;

    const CHUNK = 20;
    const cases: { index: number; status: string; hint?: string; is_sample: boolean }[] = new Array(tests.length);

    for (let start = 0; start < tests.length; start += CHUNK) {
      const chunk = tests.slice(start, start + CHUNK);
      // Intentionally omit expected_output: Judge0's compare is strict-string,
      // which flags "[0, 7]" vs "[0,7]" as WA. We run and decide pass/fail
      // ourselves via equalsNormalized below.
      const body = {
        submissions: chunk.map((t) => ({
          language_id: langId,
          source_code: source,
          stdin: stdinFromTestCase(t),
        })),
      };
      const createRes = await fetch(
        `${JUDGE0_URL}/submissions/batch?base64_encoded=false`,
        { method: "POST", headers: judge0Headers(), body: JSON.stringify(body) },
      );
      if (!createRes.ok) {
        const txt = await createRes.text();
        throw new Error(`Judge0 batch create failed: ${createRes.status} ${txt}`);
      }
      const created = await createRes.json();
      const tokens = created.map((c: any) => c.token).filter(Boolean);
      if (tokens.length !== chunk.length) throw new Error("Judge0 returned fewer tokens than requested");
      const subs = await pollBatch(tokens);
      const byToken: Record<string, any> = {};
      for (const s of subs) byToken[s.token] = s;
      tokens.forEach((t: string, i: number) => {
        const sub = byToken[t] || {};
        const idx = start + i;
        const sid = sub.status?.id;
        const sample = isSample(idx);
        if (sid === 3) {
          // Program ran cleanly. Decide pass/fail ourselves via normalized
          // compare — Judge0's expected_output check is too strict (whitespace,
          // key order). Only flag WA if the JSON-normalized shapes differ.
          if (equalsNormalized(tests[idx].expected, sub.stdout || "")) {
            cases[idx] = { index: idx, status: "passed", is_sample: sample };
          } else if (sample) {
            const got = normalise(sub.stdout || "");
            const exp = normalise(tests[idx].expected);
            cases[idx] = { index: idx, status: "wrong_answer", hint: `Expected ${exp.slice(0, 60)}, got ${got.slice(0, 60)}`, is_sample: true };
          } else {
            cases[idx] = { index: idx, status: "wrong_answer", hint: `Hidden test case ${idx + 1} failed`, is_sample: false };
          }
        } else if (sid === 4) {
          // Defensive: shouldn't fire now that expected_output is omitted, but
          // some Judge0 deployments still return 4 for stdout/stderr quirks.
          // Re-check with our normalized compare before declaring WA.
          if (equalsNormalized(tests[idx].expected, sub.stdout || "")) {
            cases[idx] = { index: idx, status: "passed", is_sample: sample };
          } else if (sample) {
            const got = normalise(sub.stdout || "");
            const exp = normalise(tests[idx].expected);
            cases[idx] = { index: idx, status: "wrong_answer", hint: `Expected ${exp.slice(0, 60)}, got ${got.slice(0, 60)}`, is_sample: true };
          } else {
            cases[idx] = { index: idx, status: "wrong_answer", hint: `Hidden test case ${idx + 1} failed`, is_sample: false };
          }
        } else if (sid === 6) {
          // Compile error is code-level (same for every case), no leak risk.
          cases[idx] = { index: idx, status: "compile_error", hint: (sub.compile_output || "").slice(0, 200), is_sample: sample };
        } else if (sid === 5) {
          cases[idx] = { index: idx, status: "time_limit", is_sample: sample };
        } else {
          // Runtime errors include stderr/stack traces; safe to surface even for
          // hidden cases since they don't echo the inputs.
          cases[idx] = { index: idx, status: "runtime_error", hint: (sub.stderr || sub.message || "").slice(0, 200), is_sample: sample };
        }
      });
    }

    const passed = cases.filter((c) => c.status === "passed").length;
    const total = cases.length;
    let verdict: string;
    if (passed === total) verdict = "accepted";
    else if (cases.some((c) => c.status === "compile_error")) verdict = "compile_error";
    else if (cases.some((c) => c.status === "time_limit")) verdict = "time_limit";
    else if (cases.some((c) => c.status === "runtime_error")) verdict = "runtime_error";
    else verdict = "wrong_answer";

    return new Response(JSON.stringify({ verdict, passed, total, cases }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
