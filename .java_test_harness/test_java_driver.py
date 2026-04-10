#!/usr/bin/env python3
"""
End-to-end test harness for the PGcode Java execution pipeline.
Mirrors src/lib/driverCode.js `wrapWithDriver` exactly, then invokes
real `javac` + `java` subprocesses against known test cases.
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile

# ----------------------------------------------------------------------
# Type mappings — mirror TYPE_MAP in driverCode.js
# ----------------------------------------------------------------------
TYPE_MAP = {
    'int': 'int',
    'float': 'double',
    'str': 'String',
    'bool': 'boolean',
    'List[int]': 'int[]',
    'List[str]': 'String[]',
    'List[List[int]]': 'int[][]',
    'List[List[str]]': 'String[][]',
    'List[bool]': 'boolean[]',
}


def jt(py_type):
    return TYPE_MAP.get(py_type, py_type)


# ----------------------------------------------------------------------
# wrapWithDriver — Java branch, ported 1:1 from driverCode.js
# ----------------------------------------------------------------------
USE_FIXED_PRINT = os.environ.get("PGCODE_FIX") == "1" or ("--fix" in sys.argv)


def generate_java_result_print(method_name, args):
    if USE_FIXED_PRINT:
        # Candidate fix: box via Object so instanceof checks are legal and cover List<Integer>.
        return "\n        ".join([
            f"Object _result = (Object) sol.{method_name}({args});",
            "if (_result instanceof int[]) {",
            '    StringBuilder sb = new StringBuilder("[");',
            "    for(int i=0;i<((int[])_result).length;i++){if(i>0)sb.append(\",\");sb.append(((int[])_result)[i]);}",
            '    sb.append("]"); System.out.println(sb);',
            "} else if (_result instanceof boolean[]) {",
            '    StringBuilder sb = new StringBuilder("[");',
            "    for(int i=0;i<((boolean[])_result).length;i++){if(i>0)sb.append(\",\");sb.append(((boolean[])_result)[i]);}",
            '    sb.append("]"); System.out.println(sb);',
            "} else if (_result instanceof java.util.List) {",
            '    StringBuilder sb = new StringBuilder("[");',
            "    java.util.List _l = (java.util.List) _result;",
            "    for(int i=0;i<_l.size();i++){if(i>0)sb.append(\",\");sb.append(_l.get(i));}",
            '    sb.append("]"); System.out.println(sb);',
            "} else { System.out.println(_result); }",
        ])
    # EXACT reproduction of current driverCode.js
    return "\n        ".join([
        f"var _result = sol.{method_name}({args});",
        "if (_result instanceof int[]) {",
        '    StringBuilder sb = new StringBuilder("[");',
        "    for(int i=0;i<((int[])_result).length;i++){if(i>0)sb.append(\",\");sb.append(((int[])_result)[i]);}",
        '    sb.append("]"); System.out.println(sb);',
        "} else if (_result instanceof boolean[]) {",
        '    StringBuilder sb = new StringBuilder("[");',
        "    for(int i=0;i<((boolean[])_result).length;i++){if(i>0)sb.append(\",\");sb.append(((boolean[])_result)[i]);}",
        '    sb.append("]"); System.out.println(sb);',
        "} else { System.out.println(_result); }",
    ])


def wrap_with_driver_java(user_code, method_name, params):
    args = ", ".join(p["name"] for p in params)

    parsing_blocks = []
    for p in params:
        name = p["name"]
        ptype = p["type"]
        line = f'String _raw_{name} = br.readLine().trim();'
        if ptype == "int":
            parsing_blocks.append(
                f'{line}\n        int {name} = Integer.parseInt(_raw_{name});'
            )
        elif ptype == "str":
            parsing_blocks.append(
                f'{line}\n        String {name} = _raw_{name}.startsWith("\\"") ? _raw_{name}.substring(1, _raw_{name}.length()-1) : _raw_{name};'
            )
        elif ptype == "bool":
            parsing_blocks.append(
                f'{line}\n        boolean {name} = Boolean.parseBoolean(_raw_{name});'
            )
        elif ptype == "List[int]":
            parsing_blocks.append("\n        ".join([
                line,
                f'String _s_{name} = _raw_{name}.substring(1, _raw_{name}.length()-1);',
                f'String[] _p_{name} = _s_{name}.isEmpty() ? new String[0] : _s_{name}.split(",");',
                f'int[] {name} = new int[_p_{name}.length];',
                f'for(int i=0;i<_p_{name}.length;i++) {name}[i]=Integer.parseInt(_p_{name}[i].trim());',
            ]))
        elif ptype == "List[str]":
            parsing_blocks.append("\n        ".join([
                line,
                f'String _s_{name} = _raw_{name}.substring(1, _raw_{name}.length()-1);',
                f'String[] {name} = _s_{name}.isEmpty() ? new String[0] : _s_{name}.split(",");',
                f'for(int i=0;i<{name}.length;i++) {name}[i]={name}[i].trim().replace("\\"","");',
            ]))
        else:
            parsing_blocks.append(f'{line}\n        // TODO: parse {ptype}')

    java_parsing = "\n        ".join(parsing_blocks)
    result_print = generate_java_result_print(method_name, args)

    return "\n".join([
        "import java.util.*;",
        "import java.io.*;",
        "",
        user_code,
        "",
        "class Main {",
        "    public static void main(String[] _args) throws Exception {",
        "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));",
        f"        {java_parsing}",
        "        Solution sol = new Solution();",
        f"        {result_print}",
        "    }",
        "}",
    ])


def compare_output(actual, expected):
    a = (actual or "").strip()
    e = (expected or "").strip()
    if a == e:
        return True
    try:
        return json.dumps(json.loads(a)) == json.dumps(json.loads(e))
    except Exception:
        return a.lower() == e.lower()


# ----------------------------------------------------------------------
# Runner
# ----------------------------------------------------------------------
def run_case(workdir, user_code, method_name, params, inputs, expected):
    wrapped = wrap_with_driver_java(user_code, method_name, params)
    main_path = os.path.join(workdir, "Main.java")
    with open(main_path, "w") as f:
        f.write(wrapped)

    compile_proc = subprocess.run(
        ["javac", main_path],
        capture_output=True, text=True, timeout=60,
    )
    if compile_proc.returncode != 0:
        return {
            "ok": False,
            "stage": "compile",
            "stdin": "\n".join(inputs),
            "expected": expected,
            "actual": "",
            "compile_error": compile_proc.stderr.strip(),
            "wrapped": wrapped,
        }

    run_proc = subprocess.run(
        ["java", "-cp", workdir, "Main"],
        input="\n".join(inputs),
        capture_output=True, text=True, timeout=30,
    )
    actual = run_proc.stdout.strip()
    ok = compare_output(actual, expected)
    return {
        "ok": ok,
        "stage": "run",
        "stdin": "\n".join(inputs),
        "expected": expected,
        "actual": actual,
        "stderr": run_proc.stderr.strip(),
        "wrapped": wrapped,
    }


# ----------------------------------------------------------------------
# Problem definitions
# ----------------------------------------------------------------------
PROBLEMS = [
    {
        "id": "two-sum",
        "method": "twoSum",
        "params": [{"name": "nums", "type": "List[int]"}, {"name": "target", "type": "int"}],
        "code": """class Solution {
    public int[] twoSum(int[] nums, int target) {
        java.util.Map<Integer, Integer> m = new java.util.HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int c = target - nums[i];
            if (m.containsKey(c)) return new int[]{m.get(c), i};
            m.put(nums[i], i);
        }
        return new int[]{};
    }
}""",
        "cases": [
            {"inputs": ["[2,7,11,15]", "9"], "expected": "[0,1]"},
            {"inputs": ["[3,2,4]", "6"], "expected": "[1,2]"},
            {"inputs": ["[3,3]", "6"], "expected": "[0,1]"},
            {"inputs": ["[-1,-2,-3,-4,-5]", "-8"], "expected": "[2,4]"},
        ],
    },
    {
        "id": "contains-duplicate",
        "method": "containsDuplicate",
        "params": [{"name": "nums", "type": "List[int]"}],
        "code": """class Solution {
    public boolean containsDuplicate(int[] nums) {
        java.util.Set<Integer> s = new java.util.HashSet<>();
        for (int n : nums) {
            if (!s.add(n)) return true;
        }
        return false;
    }
}""",
        "cases": [
            {"inputs": ["[1,2,3,1]"], "expected": "true"},
            {"inputs": ["[1,2,3,4]"], "expected": "false"},
            {"inputs": ["[1,1,1,3,3,4,3,2,4,2]"], "expected": "true"},
            {"inputs": ["[5,5,5,5,5]"], "expected": "true"},
        ],
    },
    {
        "id": "valid-palindrome",
        "method": "isPalindrome",
        "params": [{"name": "s", "type": "str"}],
        "code": """class Solution {
    public boolean isPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;
            while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;
            if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;
            l++; r--;
        }
        return true;
    }
}""",
        "cases": [
            {"inputs": ["\"A man, a plan, a canal: Panama\""], "expected": "true"},
            {"inputs": ["\"race a car\""], "expected": "false"},
            {"inputs": ["\" \""], "expected": "true"},
            {"inputs": ["\"0P\""], "expected": "false"},
        ],
    },
    {
        "id": "happy-number",
        "method": "isHappy",
        "params": [{"name": "n", "type": "int"}],
        "code": """class Solution {
    public boolean isHappy(int n) {
        java.util.Set<Integer> seen = new java.util.HashSet<>();
        while (n != 1 && !seen.contains(n)) {
            seen.add(n);
            int s = 0;
            while (n > 0) { int d = n % 10; s += d * d; n /= 10; }
            n = s;
        }
        return n == 1;
    }
}""",
        "cases": [
            {"inputs": ["1"], "expected": "true"},
            {"inputs": ["19"], "expected": "true"},
            {"inputs": ["2"], "expected": "false"},
            {"inputs": ["11"], "expected": "false"},
        ],
    },
    {
        "id": "single-number",
        "method": "singleNumber",
        "params": [{"name": "nums", "type": "List[int]"}],
        "code": """class Solution {
    public int singleNumber(int[] nums) {
        int r = 0;
        for (int n : nums) r ^= n;
        return r;
    }
}""",
        "cases": [
            {"inputs": ["[2,2,1]"], "expected": "1"},
            {"inputs": ["[4,1,2,1,2]"], "expected": "4"},
            {"inputs": ["[1]"], "expected": "1"},
            {"inputs": ["[-1,-1,-2]"], "expected": "-2"},
        ],
    },
    {
        "id": "climbing-stairs",
        "method": "climbStairs",
        "params": [{"name": "n", "type": "int"}],
        "code": """class Solution {
    public int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) {
            int c = a + b; a = b; b = c;
        }
        return b;
    }
}""",
        "cases": [
            {"inputs": ["1"], "expected": "1"},
            {"inputs": ["2"], "expected": "2"},
            {"inputs": ["5"], "expected": "8"},
            {"inputs": ["10"], "expected": "89"},
        ],
    },
    {
        "id": "spiral-matrix",
        "method": "spiralOrder",
        "params": [{"name": "matrix", "type": "List[List[int]]"}],
        "code": """import java.util.*;
class Solution {
    public List<Integer> spiralOrder(int[][] matrix) {
        List<Integer> out = new ArrayList<>();
        if (matrix.length == 0) return out;
        int top = 0, bot = matrix.length - 1;
        int left = 0, right = matrix[0].length - 1;
        while (top <= bot && left <= right) {
            for (int c = left; c <= right; c++) out.add(matrix[top][c]);
            top++;
            for (int r = top; r <= bot; r++) out.add(matrix[r][right]);
            right--;
            if (top <= bot) {
                for (int c = right; c >= left; c--) out.add(matrix[bot][c]);
                bot--;
            }
            if (left <= right) {
                for (int r = bot; r >= top; r--) out.add(matrix[r][left]);
                left++;
            }
        }
        return out;
    }
}""",
        "cases": [
            {"inputs": ["[[1,2,3],[4,5,6],[7,8,9]]"], "expected": "[1,2,3,6,9,8,7,4,5]"},
            {"inputs": ["[[1,2,3,4],[5,6,7,8],[9,10,11,12]]"], "expected": "[1,2,3,4,8,12,11,10,9,5,6,7]"},
            {"inputs": ["[[1]]"], "expected": "[1]"},
            {"inputs": ["[[1,2],[3,4]]"], "expected": "[1,2,4,3]"},
        ],
    },
]


# ----------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------
def main():
    workdir = os.environ.get("PGCODE_JAVA_WORKDIR") or tempfile.mkdtemp(prefix="pgcode_java_")
    os.makedirs(workdir, exist_ok=True)
    passed = 0
    total = 0
    known_limits = 0
    rows = []

    for prob in PROBLEMS:
        pid = prob["id"]
        for idx, case in enumerate(prob["cases"]):
            total += 1
            for f in os.listdir(workdir):
                if f.endswith(".class") or f.endswith(".java"):
                    try:
                        os.remove(os.path.join(workdir, f))
                    except OSError:
                        pass
            res = run_case(workdir, prob["code"], prob["method"],
                           prob["params"], case["inputs"], case["expected"])
            status = "PASS" if res["ok"] else "FAIL"
            if res["ok"]:
                passed += 1
            rows.append({"id": pid, "case": idx, "status": status, "res": res, "prob": prob})

    print("=" * 92)
    print(f"{'PROBLEM':<22}{'CASE':<6}{'STATUS':<8}{'EXPECTED':<28}{'ACTUAL':<28}")
    print("-" * 92)
    for r in rows:
        exp = r["res"]["expected"]
        act = r["res"].get("actual", "")
        if r["res"]["stage"] == "compile":
            act = "<compile error>"
        print(f"{r['id']:<22}{r['case']:<6}{r['status']:<8}{exp[:26]:<28}{act[:26]:<28}")

    print()
    print("=" * 92)
    print("FAILURE DIAGNOSTICS")
    print("=" * 92)
    for r in rows:
        if r["status"] == "FAIL":
            res = r["res"]
            prob = r["prob"]
            param_types = [p["type"] for p in prob["params"]]
            diag = ""
            is_known = False

            if "List[List[int]]" in param_types or "List[List[str]]" in param_types:
                diag = "KNOWN: List[List[int]] parsing is TODO in driver (param never materialized)"
                is_known = True
            elif "List<Integer>" in prob["code"] or "List<String>" in prob["code"]:
                diag = "KNOWN: List<Integer> return -> generateJavaResultPrint has no branch, uses Object.toString -> '[1, 2, 3]' vs JSON '[1,2,3]'"
                is_known = True

            if not is_known and res["stage"] == "run":
                exp_s = res["expected"]
                act_s = res.get("actual", "")
                if exp_s.startswith("[") and act_s.startswith("[") and " " in act_s and " " not in exp_s:
                    diag = "KNOWN: List return type printed via Object.toString adds spaces"
                    is_known = True

            if is_known:
                known_limits += 1

            print(f"\n--- {r['id']} case {r['case']} [{res['stage']}] ---")
            print(f"stdin:    {res['stdin']!r}")
            print(f"expected: {res['expected']!r}")
            print(f"actual:   {res.get('actual','')!r}")
            if res["stage"] == "compile":
                print("compile_error:")
                print(res.get("compile_error", ""))
            elif res.get("stderr"):
                print("stderr:")
                print(res["stderr"])
            print(f"diagnosis: {diag or 'driver bug / investigate'}")

    print()
    print("=" * 92)
    print(f"JAVA RESULTS: {passed}/{total} passed (+ {known_limits} known limitations)")
    print("=" * 92)


if __name__ == "__main__":
    main()
