// Supabase Edge Function: grade-submission
//
// Loads test cases + driver metadata server-side, wraps the user's code in a
// per-language harness, calls Judge0 batch, and returns aggregated verdict.
// Test expected_output never reaches the client.
//
// Request:  { problem_id: string, language: "python"|"javascript"|"java"|"cpp", code: string }
// Response: { verdict: "accepted"|"wrong_answer"|"compile_error"|"runtime_error"|"time_limit",
//             passed: number, total: number,
//             cases: Array<{ index: number, status: string, hint?: string }> }
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
type TestCase = { inputs: string[]; expected: string };

function pyLiteral(raw: string, type: string): string {
  // raw is the test-case input as serialised in the seed scripts (already a
  // python-compatible literal in almost every case, since we used [..], "..", numeric strings)
  if (type === "bool") return raw === "true" ? "True" : "False";
  if (type === "str") return raw;
  return raw;
}

function buildPythonDriver(code: string, methodName: string, params: Param[]): string {
  const reads = params.map((p, i) => {
    if (p.type === "bool") {
      return `    _line = input()\n    args.append(_line == 'true')`;
    }
    if (p.type === "str") {
      return `    args.append(input())`;
    }
    return `    args.append(__import__('ast').literal_eval(input()))`;
  }).join("\n");
  return `import sys
${code}

def _fmt(v):
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (list, tuple)):
        return '[' + ','.join(_fmt(x) for x in v) + ']'
    if isinstance(v, str):
        return v
    return str(v)

if __name__ == '__main__':
    args = []
${reads}
    sol = Solution()
    r = sol.${methodName}(*args)
    print(_fmt(r))
`;
}

function buildJsDriver(code: string, methodName: string, params: Param[]): string {
  const reads = params.map((p) => {
    if (p.type === "bool") return `args.push(lines.shift() === 'true');`;
    if (p.type === "str") return `args.push(lines.shift());`;
    return `args.push(JSON.parse(lines.shift()));`;
  }).join("\n  ");
  return `${code}
const lines = require('fs').readFileSync(0, 'utf8').split('\\n');
const args = [];
  ${reads}
function _fmt(v) {
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) return '[' + v.map(_fmt).join(',') + ']';
  return String(v);
}
const sol = new Solution();
const r = sol.${methodName}(...args);
console.log(_fmt(r));
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
  if (language === "python") return buildPythonDriver(code, methodName, params);
  if (language === "javascript") return buildJsDriver(code, methodName, params);
  if (language === "java") return buildJavaDriver(code, methodName, params, returnType);
  if (language === "cpp") return buildCppDriver(code, methodName, params);
  throw new Error(`grade-submission: unsupported language ${language}`);
}

function stdinFromTestCase(tc: TestCase): string {
  // Each input on its own line; preserve as-is (already serialised by seed scripts).
  return tc.inputs.join("\n") + "\n";
}

function normalise(s: string): string {
  return (s || "").trim().replace(/\s+/g, "");
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

    const CHUNK = 20;
    const cases: { index: number; status: string; hint?: string }[] = new Array(tests.length);

    for (let start = 0; start < tests.length; start += CHUNK) {
      const chunk = tests.slice(start, start + CHUNK);
      const body = {
        submissions: chunk.map((t) => ({
          language_id: langId,
          source_code: source,
          stdin: stdinFromTestCase(t),
          expected_output: t.expected.trim() + "\n",
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
        if (sid === 3) {
          cases[idx] = { index: idx, status: "passed" };
        } else if (sid === 4) {
          // Wrong answer (expected_output mismatch)
          const got = normalise(sub.stdout || "");
          const exp = normalise(tests[idx].expected);
          cases[idx] = { index: idx, status: "wrong_answer", hint: `Expected ${exp.slice(0, 60)}, got ${got.slice(0, 60)}` };
        } else if (sid === 6) {
          cases[idx] = { index: idx, status: "compile_error", hint: (sub.compile_output || "").slice(0, 200) };
        } else if (sid === 5) {
          cases[idx] = { index: idx, status: "time_limit" };
        } else {
          cases[idx] = { index: idx, status: "runtime_error", hint: (sub.stderr || sub.message || "").slice(0, 200) };
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
