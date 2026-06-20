#!/usr/bin/env python3
"""End-to-end verification of the PGcode JavaScript execution pipeline.

Mirrors wrapWithDriver logic from src/lib/driverCode.js (javascript branch),
builds wrapped JS for 10 problems x 4 cases each, runs via `node` subprocess
with stdin piped, and compares output against the expected SQL values.
"""
import json
import subprocess
import tempfile
import os
import sys

# ---------------------------------------------------------------------------
# JS_HELPERS must match src/lib/driverCode.js exactly.
# ---------------------------------------------------------------------------
JS_HELPERS = r"""
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
    const _head = new ListNode(arr[0]);
    let _curr = _head;
    for (let _i = 1; _i < arr.length; _i++) {
        _curr.next = new ListNode(arr[_i]);
        _curr = _curr.next;
    }
    return _head;
}

function _fromList(head) {
    const _result = [];
    while (head) {
        _result.push(head.val);
        head = head.next;
    }
    return _result;
}

function _toTree(arr) {
    if (!arr || arr.length === 0) return null;
    const _root = new TreeNode(arr[0]);
    const _q = [_root];
    let _i = 1;
    while (_q.length > 0 && _i < arr.length) {
        const _node = _q.shift();
        if (_i < arr.length && arr[_i] !== null) {
            _node.left = new TreeNode(arr[_i]);
            _q.push(_node.left);
        }
        _i++;
        if (_i < arr.length && arr[_i] !== null) {
            _node.right = new TreeNode(arr[_i]);
            _q.push(_node.right);
        }
        _i++;
    }
    return _root;
}

function _fromTree(root) {
    if (!root) return [];
    const _result = [];
    const _q = [root];
    while (_q.length > 0) {
        const _node = _q.shift();
        if (_node === null) {
            _result.push(null);
        } else {
            _result.push(_node.val);
            _q.push(_node.left);
            _q.push(_node.right);
        }
    }
    while (_result.length > 0 && _result[_result.length - 1] === null) {
        _result.pop();
    }
    return _result;
}
"""

LISTNODE_TYPES = {"ListNode", "Optional[ListNode]"}
TREENODE_TYPES = {"TreeNode", "Optional[TreeNode]"}


def wrap_with_driver(user_code, method_name, params):
    """Python port of wrapWithDriver, javascript branch only."""
    args = ", ".join(p["name"] for p in params)
    parsing_lines = []
    for i, p in enumerate(params):
        if p["type"] in LISTNODE_TYPES:
            parsing_lines.append(
                "const %s = _toList(JSON.parse(_lines[%d]));" % (p["name"], i)
            )
        elif p["type"] in TREENODE_TYPES:
            parsing_lines.append(
                "const %s = _toTree(JSON.parse(_lines[%d]));" % (p["name"], i)
            )
        else:
            parsing_lines.append(
                "const %s = JSON.parse(_lines[%d]);" % (p["name"], i)
            )
    parsing = "\n".join(parsing_lines)
    return "\n".join([
        JS_HELPERS,
        user_code,
        "",
        "const _lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');",
        parsing,
        "const _result = %s(%s);" % (method_name, args),
        "if (_result instanceof ListNode) {",
        "    console.log(JSON.stringify(_fromList(_result)));",
        "} else if (_result instanceof TreeNode) {",
        "    console.log(JSON.stringify(_fromTree(_result)));",
        "} else {",
        "    console.log(JSON.stringify(_result));",
        "}",
    ])


def compare_output(actual, expected):
    """Port of compareOutput from driverCode.js."""
    a = (actual or "").strip()
    e = (expected or "").strip()
    if a == e:
        return True
    try:
        return json.dumps(json.loads(a)) == json.dumps(json.loads(e))
    except Exception:
        return a.lower() == e.lower()


def run_node(wrapped_code, stdin, timeout=10):
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".js", delete=False, dir="/tmp"
    ) as tmp:
        tmp.write(wrapped_code)
        tmp_path = tmp.name
    try:
        proc = subprocess.run(
            ["node", tmp_path],
            input=stdin,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return proc.stdout, proc.stderr, proc.returncode
    finally:
        os.unlink(tmp_path)


# ---------------------------------------------------------------------------
# Reference solutions
# ---------------------------------------------------------------------------
SOLUTIONS = {}

SOLUTIONS["two-sum"] = r"""
var twoSum = function(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const need = target - nums[i];
        if (seen.has(need)) return [seen.get(need), i];
        seen.set(nums[i], i);
    }
    return [];
};
"""

SOLUTIONS["valid-palindrome"] = r"""
var isPalindrome = function(s) {
    const t = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    let i = 0, j = t.length - 1;
    while (i < j) {
        if (t[i] !== t[j]) return false;
        i++; j--;
    }
    return true;
};
"""

SOLUTIONS["spiral-matrix"] = r"""
var spiralOrder = function(matrix) {
    const res = [];
    if (!matrix.length) return res;
    let top = 0, bot = matrix.length - 1;
    let left = 0, right = matrix[0].length - 1;
    while (top <= bot && left <= right) {
        for (let j = left; j <= right; j++) res.push(matrix[top][j]);
        top++;
        for (let i = top; i <= bot; i++) res.push(matrix[i][right]);
        right--;
        if (top <= bot) {
            for (let j = right; j >= left; j--) res.push(matrix[bot][j]);
            bot--;
        }
        if (left <= right) {
            for (let i = bot; i >= top; i--) res.push(matrix[i][left]);
            left++;
        }
    }
    return res;
};
"""

SOLUTIONS["three-sum"] = r"""
var threeSum = function(nums) {
    nums.sort((a,b) => a-b);
    const res = [];
    for (let i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] === nums[i-1]) continue;
        let l = i + 1, r = nums.length - 1;
        while (l < r) {
            const s = nums[i] + nums[l] + nums[r];
            if (s === 0) {
                res.push([nums[i], nums[l], nums[r]]);
                while (l < r && nums[l] === nums[l+1]) l++;
                while (l < r && nums[r] === nums[r-1]) r--;
                l++; r--;
            } else if (s < 0) l++;
            else r--;
        }
    }
    return res;
};
"""

SOLUTIONS["happy-number"] = r"""
var isHappy = function(n) {
    const seen = new Set();
    while (n !== 1 && !seen.has(n)) {
        seen.add(n);
        let s = 0;
        while (n > 0) { const d = n % 10; s += d*d; n = Math.floor(n/10); }
        n = s;
    }
    return n === 1;
};
"""

SOLUTIONS["reverse-linked-list"] = r"""
var reverseList = function(head) {
    let prev = null, curr = head;
    while (curr) {
        const nxt = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nxt;
    }
    return prev;
};
"""

SOLUTIONS["invert-binary-tree"] = r"""
var invertTree = function(root) {
    if (!root) return null;
    const l = invertTree(root.left);
    const r = invertTree(root.right);
    root.left = r;
    root.right = l;
    return root;
};
"""

SOLUTIONS["max-depth-binary-tree"] = r"""
var maxDepth = function(root) {
    if (!root) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
};
"""

SOLUTIONS["merge-two-sorted"] = r"""
var mergeTwoLists = function(list1, list2) {
    const dummy = new ListNode(0);
    let tail = dummy;
    while (list1 && list2) {
        if (list1.val <= list2.val) {
            tail.next = list1; list1 = list1.next;
        } else {
            tail.next = list2; list2 = list2.next;
        }
        tail = tail.next;
    }
    tail.next = list1 || list2;
    return dummy.next;
};
"""

SOLUTIONS["same-tree"] = r"""
var isSameTree = function(p, q) {
    if (!p && !q) return true;
    if (!p || !q) return false;
    if (p.val !== q.val) return false;
    return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
};
"""

# ---------------------------------------------------------------------------
# Problems + test cases extracted from SQL scripts
# ---------------------------------------------------------------------------
PROBLEMS = {
    "two-sum": {
        "method": "twoSum",
        "params": [
            {"name": "nums", "type": "List[int]"},
            {"name": "target", "type": "int"},
        ],
        "cases": [
            {"inputs": ["[2,7,11,15]", "9"], "expected": "[0,1]"},
            {"inputs": ["[3,2,4]", "6"], "expected": "[1,2]"},
            {"inputs": ["[3,3]", "6"], "expected": "[0,1]"},
            {"inputs": ["[-1,-2,-3,-4,-5]", "-8"], "expected": "[2,4]"},
        ],
    },
    "valid-palindrome": {
        "method": "isPalindrome",
        "params": [{"name": "s", "type": "str"}],
        "cases": [
            {"inputs": ['"A man, a plan, a canal: Panama"'], "expected": "true"},
            {"inputs": ['"race a car"'], "expected": "false"},
            {"inputs": ['" "'], "expected": "true"},
            {"inputs": ['"0P"'], "expected": "false"},
        ],
    },
    "spiral-matrix": {
        "method": "spiralOrder",
        "params": [{"name": "matrix", "type": "List[List[int]]"}],
        "cases": [
            {"inputs": ["[[1,2,3],[4,5,6],[7,8,9]]"], "expected": "[1,2,3,6,9,8,7,4,5]"},
            {"inputs": ["[[1,2,3,4],[5,6,7,8],[9,10,11,12]]"], "expected": "[1,2,3,4,8,12,11,10,9,5,6,7]"},
            {"inputs": ["[[1]]"], "expected": "[1]"},
            {"inputs": ["[[1,2],[3,4]]"], "expected": "[1,2,4,3]"},
        ],
    },
    "three-sum": {
        "method": "threeSum",
        "params": [{"name": "nums", "type": "List[int]"}],
        "cases": [
            {"inputs": ["[-1,0,1,2,-1,-4]"], "expected": "[[-1,-1,2],[-1,0,1]]"},
            {"inputs": ["[0,0,0]"], "expected": "[[0,0,0]]"},
            {"inputs": ["[]"], "expected": "[]"},
            {"inputs": ["[-2,0,1,1,2]"], "expected": "[[-2,0,2],[-2,1,1]]"},
        ],
    },
    "happy-number": {
        "method": "isHappy",
        "params": [{"name": "n", "type": "int"}],
        "cases": [
            {"inputs": ["1"], "expected": "true"},
            {"inputs": ["19"], "expected": "true"},
            {"inputs": ["2"], "expected": "false"},
            {"inputs": ["11"], "expected": "false"},
        ],
    },
    "reverse-linked-list": {
        "method": "reverseList",
        "params": [{"name": "head", "type": "Optional[ListNode]"}],
        "cases": [
            {"inputs": ["[1,2,3,4,5]"], "expected": "[5,4,3,2,1]"},
            {"inputs": ["[]"], "expected": "[]"},
            {"inputs": ["[1]"], "expected": "[1]"},
            {"inputs": ["[1,2]"], "expected": "[2,1]"},
        ],
    },
    "invert-binary-tree": {
        "method": "invertTree",
        "params": [{"name": "root", "type": "Optional[TreeNode]"}],
        "cases": [
            {"inputs": ["[4,2,7,1,3,6,9]"], "expected": "[4,7,2,9,6,3,1]"},
            {"inputs": ["[2,1,3]"], "expected": "[2,3,1]"},
            {"inputs": ["[]"], "expected": "[]"},
            {"inputs": ["[1]"], "expected": "[1]"},
        ],
    },
    "max-depth-binary-tree": {
        "method": "maxDepth",
        "params": [{"name": "root", "type": "Optional[TreeNode]"}],
        "cases": [
            {"inputs": ["[3,9,20,null,null,15,7]"], "expected": "3"},
            {"inputs": ["[1,null,2]"], "expected": "2"},
            {"inputs": ["[]"], "expected": "0"},
            {"inputs": ["[1,2,3,4,5,6,7]"], "expected": "3"},
        ],
    },
    "merge-two-sorted": {
        "method": "mergeTwoLists",
        "params": [
            {"name": "list1", "type": "Optional[ListNode]"},
            {"name": "list2", "type": "Optional[ListNode]"},
        ],
        "cases": [
            {"inputs": ["[1,2,4]", "[1,3,4]"], "expected": "[1,1,2,3,4,4]"},
            {"inputs": ["[]", "[]"], "expected": "[]"},
            {"inputs": ["[]", "[0]"], "expected": "[0]"},
            {"inputs": ["[1,3,5]", "[2,4,6]"], "expected": "[1,2,3,4,5,6]"},
        ],
    },
    "same-tree": {
        "method": "isSameTree",
        "params": [
            {"name": "p", "type": "Optional[TreeNode]"},
            {"name": "q", "type": "Optional[TreeNode]"},
        ],
        "cases": [
            {"inputs": ["[1,2,3]", "[1,2,3]"], "expected": "true"},
            {"inputs": ["[1,2]", "[1,null,2]"], "expected": "false"},
            {"inputs": ["[]", "[]"], "expected": "true"},
            {"inputs": ["[1,2,3]", "[1,2,4]"], "expected": "false"},
        ],
    },
}


def main():
    total = 0
    passed = 0
    failures = []
    grid_rows = []

    for pid, meta in PROBLEMS.items():
        solution = SOLUTIONS[pid]
        method = meta["method"]
        params = meta["params"]
        wrapped = wrap_with_driver(solution, method, params)

        per_case = []
        for idx, tc in enumerate(meta["cases"]):
            stdin = "\n".join(tc["inputs"])
            expected = tc["expected"]
            total += 1
            try:
                stdout, stderr, rc = run_node(wrapped, stdin)
            except subprocess.TimeoutExpired:
                per_case.append("TIMEOUT")
                failures.append({
                    "problem": pid, "case": idx, "stdin": stdin,
                    "expected": expected, "actual": "<TIMEOUT>",
                    "diag": "node process exceeded 10s",
                })
                continue

            actual = stdout.strip()
            if rc != 0:
                per_case.append("ERR")
                failures.append({
                    "problem": pid, "case": idx, "stdin": stdin,
                    "expected": expected, "actual": stderr.strip(),
                    "diag": "node exited with rc=%d" % rc,
                })
                continue

            if compare_output(actual, expected):
                passed += 1
                per_case.append("PASS")
            else:
                per_case.append("FAIL")
                failures.append({
                    "problem": pid, "case": idx, "stdin": stdin,
                    "expected": expected, "actual": actual,
                    "diag": "output mismatch",
                })

        grid_rows.append((pid, per_case))

    print("\n=== PASS/FAIL GRID ===")
    print("%-24s  cases" % "problem")
    print("-" * 70)
    for pid, per_case in grid_rows:
        pct = sum(1 for r in per_case if r == "PASS")
        line = "%-24s  " % pid + " ".join("%-5s" % r for r in per_case) + "  (%d/%d)" % (pct, len(per_case))
        print(line)

    if failures:
        print("\n=== FAILURES ===")
        for f in failures:
            print("\n[%s] case#%d: %s" % (f["problem"], f["case"], f["diag"]))
            print("  stdin   : %r" % f["stdin"])
            print("  expected: %s" % f["expected"])
            print("  actual  : %s" % f["actual"])

    print("\nJAVASCRIPT RESULTS: %d/%d passed" % (passed, total))
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
