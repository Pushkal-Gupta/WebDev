#!/usr/bin/env node
// Build WAVE 34X: simplify-path + remove-k-digits
// Appends two RICH_CONTENT entries to src/content/problemContent.js using SAFE replace (function form).

import fs from "node:fs";
import path from "node:path";

const FILE = path.resolve("src/content/problemContent.js");

function makeLcg(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
}

// ============================================================
// PROBLEM 1: simplify-path (LC 71)
//   simplifyPath(path: str) -> str
//   Convert an absolute Unix-style path to its canonical form.
//   Rules:
//     - "/" is the root
//     - "." is current dir (skip)
//     - ".." is parent dir (pop one)
//     - "..." (and longer dots / arbitrary names) are valid file names
//     - collapse multiple consecutive "/" into one
//     - canonical form starts with "/" and has no trailing "/" unless root
// ============================================================
function buildProblem1() {
  const lcg = makeLcg(0xA10F357A);

  function ref(p) {
    const parts = p.split("/");
    const stack = [];
    for (const seg of parts) {
      if (seg === "" || seg === ".") continue;
      if (seg === "..") {
        if (stack.length > 0) stack.pop();
      } else {
        stack.push(seg);
      }
    }
    return "/" + stack.join("/");
  }

  const cases = [];

  // Canonical LC samples
  cases.push("/home/");
  cases.push("/../");
  cases.push("/home//foo/");
  cases.push("/a/./b/../../c/");
  // Already canonical root
  cases.push("/");
  // Empty-ish (LC guarantees starts with /, so just "/")
  cases.push("/.");
  cases.push("/./");
  cases.push("/..");
  cases.push("/../..");
  cases.push("/../../..");
  // Triple dots (a valid file name)
  cases.push("/...");
  cases.push("/.../a");
  cases.push("/a/.../b");
  // Hidden-style names
  cases.push("/.hidden");
  cases.push("/.hidden/.config");
  // Multiple consecutive slashes
  cases.push("//");
  cases.push("///");
  cases.push("////home////user////");
  // Mixed dots
  cases.push("/a/b/c/../../d/e/../f");
  cases.push("/a/b/c/./d/./e/.");
  cases.push("/a/b/c/./../../d");
  // Pop past root
  cases.push("/a/../../../b");
  // Long deep path
  cases.push("/usr/local/bin/scripts/build/output");
  // Pop everything to root then descend
  cases.push("/a/b/c/d/e/../../../../../x/y/z");
  // Trailing slash only
  cases.push("/home");
  cases.push("/home/user/");
  // Path with names that contain dots but are not . or ..
  cases.push("/foo.bar/baz");
  cases.push("/a.b/c.d/e.f");
  // Many ..
  cases.push("/a/b/../c/d/../e/../f/g/../h");
  // Resolves to root
  cases.push("/a/..");
  cases.push("/a/b/../..");
  cases.push("/./././.");
  // Resolves to root with extra slashes
  cases.push("/a//b//..//..");
  // Long ascii-letter segments
  cases.push("/aaaa/bbbb/cccc/dddd/eeee");
  // Names like '....'
  cases.push("/..../a/..../b");
  // LC corner: name with underscores and digits
  cases.push("/var_log/2024/01_07/run_42.log");

  // Random LCG-generated paths
  const names = ["home", "user", "tmp", "var", "etc", "foo", "bar", "baz", "qux", "doc", "src", "lib", "bin"];
  while (cases.length < 33) {
    const segs = 1 + (lcg() % 10);
    let s = "";
    for (let i = 0; i < segs; i++) {
      const r = lcg() % 10;
      let token;
      if (r === 0) token = ".";
      else if (r === 1) token = "..";
      else if (r === 2) token = "...";
      else token = names[lcg() % names.length];
      // Sometimes inject a double slash before
      const slashes = (lcg() % 3) === 0 ? "//" : "/";
      s += slashes + token;
    }
    if ((lcg() & 1) === 0) s += "/";
    cases.push(s);
  }

  const test_cases = cases.map((p) => ({
    inputs: [JSON.stringify(p)],
    expected: JSON.stringify(ref(p))
  }));

  return {
    slug: "simplify-path",
    obj: {
      description: "You are given an **absolute path** for a Unix-style file system, which always begins with a slash `'/'`. Transform this absolute path into its **simplified canonical path**.\n\nIn a Unix-style file system, the rules are:\n- A single period `'.'` represents the **current directory**.\n- A double period `'..'` represents the **previous (parent) directory**.\n- Multiple consecutive slashes `'//'` are treated as a single slash `'/'`.\n- Any other sequence of periods or English letters (and digits, `_`, `.`, `-`) is treated as a **valid directory or file name**.\n\nThe simplified canonical path must:\n- Start with a single slash `'/'`.\n- Have any two directories separated by a single slash `'/'`.\n- **Not** end with a trailing `'/'`, unless it is the root `'/'`.\n- **Not** contain any single or double periods used as directory navigation (`'.'` or `'..'`).\n\nReturn the **simplified canonical path**.\n\n**Example 1**\n\n```\nInput:  path = \"/home/\"\nOutput: \"/home\"\nExplanation: the trailing slash is removed.\n```\n\n**Example 2**\n\n```\nInput:  path = \"/../\"\nOutput: \"/\"\nExplanation: going one level above the root is the root itself.\n```\n\n**Example 3**\n\n```\nInput:  path = \"/home//foo/\"\nOutput: \"/home/foo\"\n```\n\n**Example 4**\n\n```\nInput:  path = \"/a/./b/../../c/\"\nOutput: \"/c\"\n```\n\nThis is **LeetCode 71**. The canonical solution **tokenizes by `/`** and walks the tokens with a **stack**: `.` and empty tokens are skipped, `..` pops the stack (unless it is already empty), and any other token is pushed. The final canonical path is `\"/\" + \"/\".join(stack)`.",
      method_name: "simplifyPath",
      params: [
        { name: "path", type: "str" }
      ],
      return_type: "str",
      tags: ["stack", "string"],
      pattern: "**Tokenize by `/`, walk with a stack.** Every UNIX path-canonicalization problem of this shape has the same skeleton: split on `/`, then iterate the segments and let a stack maintain the current directory chain.\n\n**The four cases per segment.**\n\n```\nfor seg in path.split(\"/\"):\n    if seg == \"\" or seg == \".\":\n        continue            # consecutive slashes or current-dir no-op\n    if seg == \"..\":\n        if stack: stack.pop()   # go up one level (capped at root)\n        continue\n    stack.append(seg)       # any other token is a valid name\nreturn \"/\" + \"/\".join(stack)\n```\n\n**Why the empty-token check matters.** `\"/home//foo\".split(\"/\")` produces `['', 'home', '', 'foo']` in Python and JavaScript. The leading empty is from the root `/`, and the middle empty is from the `//`. Skipping all empties collapses runs of slashes for free.\n\n**Why `.` is a no-op.** The current-directory segment changes nothing — `cd .` from the cwd lands on the same directory.\n\n**Why `..` only pops when the stack is non-empty.** Going up from the root is the root. The spec says `\"/../\" -> \"/\"`, so capping the pop at the root matches the OS behavior.\n\n**Why every other token is appended verbatim.** The problem explicitly says that **any other sequence of periods, letters, digits, etc. is a valid file name**. `\"...\"`, `\"....\"`, `\".hidden\"`, `\"foo.bar\"` are all directory names. Only the **exact strings** `\".\"` and `\"..\"` are navigation primitives.\n\n**Why this beats string surgery.** A naive approach scans the input character by character, building the output and rewinding on `..`. It is fiddly, easy to get wrong on consecutive `/`, and indistinguishable in complexity. The stack approach handles every rule with one tiny `if`-tree.\n\n**Single-pass complexity.** Splitting is `O(n)`, the loop is `O(k)` where `k` is the number of tokens (`k <= n`), and joining is `O(n)`. Total `O(n)` time, `O(n)` space for the stack.\n\n**Edge cases worth practicing.**\n\n```\n\"/\"           -> \"/\"\n\"/.\"          -> \"/\"\n\"/..\"         -> \"/\"\n\"/...\"        -> \"/...\"\n\"//\"          -> \"/\"\n\"/a/../../b\"  -> \"/b\"\n\"/a/./b/./c\"  -> \"/a/b/c\"\n```\n\n**Mental model.** Treat the stack as the current working directory. Every segment is a `cd` command: `cd ..`, `cd .`, or `cd <name>`. At the end, the stack joined by `/` is exactly the canonical absolute path.\n\n**Why a deque instead of a list?** Either works — the only operations are push to the right and pop from the right. In Python a `list` is the canonical choice; in Java `ArrayDeque<String>` is idiomatic. C++ uses `vector<string>`.\n\n**Why splitting first beats char-by-char.** Splitting normalizes the `/` boundary issue once and isolates the per-segment logic. Char-by-char tends to grow conditional ladders for 'just saw a slash' and 'inside a name', neither of which is needed.",
      follow_up: "**Variant 1 — preserve trailing slash for directories.** Some path APIs distinguish files from directories by trailing `/`. Track whether the last token was followed by a slash and re-emit it after the join.\n\n**Variant 2 — relative paths (don't start with `/`).** Drop the leading `/` in the output and treat an unresolved `..` (popping past the start) by emitting `..` in the canonical form. Used by `os.path.normpath` style utilities.\n\n**Variant 3 — Windows-style with drive letters and `\\`.** Replace `/` with `\\`, normalize the drive prefix `\"C:\\\\\"` separately, and apply the same stack walk over the remaining segments.\n\n**Variant 4 — symbolic-link resolution.** Add a `readlink` map from segment to target path; recurse into the target whenever a segment is a link. Must guard against cycles.\n\n**Variant 5 — virtual file system with a permission check.** Apply the same stack walk but verify each intermediate stack state against an ACL; abort with an error if any traversal is forbidden.\n\n**Variant 6 — `~` expansion.** A token of `~` expands to `$HOME` before the stack walk. The replacement is character-equivalent to splicing the home path tokens into the stream.\n\n**Implementation pitfalls.**\n1. **Treating `\"...\"` as `..`.** Only the exact two-character `\"..\"` is the parent-directory token. `\"...\"`, `\"....\"`, `\".......\"` are valid file names.\n2. **Popping past root.** `\"/..\"` must yield `\"/\"`, not throw. Guard with `if stack`.\n3. **Forgetting the empty-segment skip.** `\"//\"` splits to `['', '', '']` and without the skip you push empty strings, producing `\"//\"` or `\"///\"` in the output.\n4. **Building the output by repeated string concatenation in Python.** Use a list + `\"/\".join(...)` once at the end. The same `+=` antipattern hurts Java; use `StringBuilder`.\n5. **Returning an empty string for `\"/\"`.** The canonical form of the root path is `\"/\"`, not `\"\"`. The `\"/\" + ...` prefix handles this naturally.\n6. **Stripping the leading slash before splitting.** Not wrong, but unnecessary — the leading empty token from `split('/')` is skipped by the loop, so the canonical form falls out without extra work.",
      complexity: {
        time: "**O(n)** where `n = len(path)`. Splitting the input is `O(n)`, the per-token loop runs at most `n` times (each token costs `O(1)` push/pop on the stack plus a constant string comparison), and the final join is `O(n)`. No nested loops or backtracking.",
        space: "**O(n)** auxiliary for the stack of name segments and the output buffer. In the worst case (a path with no `..` segments) the stack holds every name, totaling `O(n)` characters.",
        notes: "If you replace `split` with a manual two-pointer scan, the asymptotics stay the same but you avoid the intermediate token list, saving constant memory. For paths under 3000 characters the difference is unmeasurable in JS / Python.",
        optimal: "**O(n) is tight.** Any correct algorithm must read every character of `path` to decide whether it participates in a name or is a separator. The lower bound is `Omega(n)`; the stack walk matches it."
      },
      constraints: [
        "1 <= len(path) <= 3000",
        "path consists of English letters, digits, period '.', slash '/', or underscore '_'",
        "path is a valid absolute Unix path that begins with '/'",
        "Single periods '.' and double periods '..' are the only navigation tokens",
        "Multiple consecutive slashes are equivalent to one",
        "Output canonical path: starts with '/' and has no trailing '/' (except the root '/')"
      ],
      hints: [
        "**Split the path by `/`.** Each non-empty token is either `.`, `..`, or a directory name.",
        "**Walk the tokens with a stack.** Push names, skip `.` and empty strings, pop on `..` (if the stack is non-empty).",
        "**Empty tokens come from consecutive slashes.** Always skip them so `//` collapses cleanly.",
        "**`..` at the root is a no-op.** The pop is guarded: `if stack: stack.pop()`.",
        "**Reconstruct the canonical path as `\"/\" + \"/\".join(stack)`.** This handles the empty-stack root case (`\"/\"`) and avoids any extra trailing-slash logic."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\n\n\nclass Solution:\n    def simplifyPath(self, path: str) -> str:\n        stack: List[str] = []\n        for seg in path.split(\"/\"):\n            if seg == \"\" or seg == \".\":\n                continue\n            if seg == \"..\":\n                if stack:\n                    stack.pop()\n                continue\n            stack.append(seg)\n        return \"/\" + \"/\".join(stack)\n",
        javascript: "var simplifyPath = function(path) {\n    const stack = [];\n    const parts = path.split(\"/\");\n    for (const seg of parts) {\n        if (seg === \"\" || seg === \".\") continue;\n        if (seg === \"..\") {\n            if (stack.length > 0) stack.pop();\n            continue;\n        }\n        stack.push(seg);\n    }\n    return \"/\" + stack.join(\"/\");\n};\n",
        java: "import java.util.*;\n\npublic class Solution {\n    public String simplifyPath(String path) {\n        Deque<String> stack = new ArrayDeque<>();\n        String[] parts = path.split(\"/\");\n        for (String seg : parts) {\n            if (seg.isEmpty() || seg.equals(\".\")) continue;\n            if (seg.equals(\"..\")) {\n                if (!stack.isEmpty()) stack.pop();\n                continue;\n            }\n            stack.push(seg);\n        }\n        StringBuilder sb = new StringBuilder();\n        Iterator<String> it = stack.descendingIterator();\n        while (it.hasNext()) {\n            sb.append('/');\n            sb.append(it.next());\n        }\n        return sb.length() == 0 ? \"/\" : sb.toString();\n    }\n}\n",
        cpp: "#include <string>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\nclass Solution {\npublic:\n    string simplifyPath(string path) {\n        vector<string> stack;\n        string seg;\n        stringstream ss(path);\n        while (getline(ss, seg, '/')) {\n            if (seg.empty() || seg == \".\") continue;\n            if (seg == \"..\") {\n                if (!stack.empty()) stack.pop_back();\n                continue;\n            }\n            stack.push_back(seg);\n        }\n        string out;\n        for (const auto& s : stack) {\n            out.push_back('/');\n            out += s;\n        }\n        return out.empty() ? \"/\" : out;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// PROBLEM 2: remove-k-digits (LC 402)
//   removeKdigits(num: str, k: int) -> str
//   Given a non-negative integer num as a string and an integer k, return the
//   smallest possible integer (as a string) after removing exactly k digits.
//   Result must not have leading zeros unless it is exactly "0".
// ============================================================
function buildProblem2() {
  const lcg = makeLcg(0xA10F357B);

  function ref(num, k) {
    if (k >= num.length) return "0";
    const stack = [];
    let remove = k;
    for (let i = 0; i < num.length; i++) {
      const d = num[i];
      while (remove > 0 && stack.length > 0 && stack[stack.length - 1] > d) {
        stack.pop();
        remove--;
      }
      stack.push(d);
    }
    // If we still need to remove digits, drop from the right (largest tail)
    while (remove > 0) {
      stack.pop();
      remove--;
    }
    // Strip leading zeros
    let i = 0;
    while (i < stack.length && stack[i] === "0") i++;
    const out = stack.slice(i).join("");
    return out === "" ? "0" : out;
  }

  const cases = [];

  // Canonical LC samples
  cases.push(["1432219", 3]);
  cases.push(["10200", 1]);
  cases.push(["10", 2]);
  // Single digit
  cases.push(["1", 0]);
  cases.push(["1", 1]);
  cases.push(["9", 1]);
  // All same digit
  cases.push(["1111", 2]);
  cases.push(["9999", 3]);
  // Strictly increasing: removing from the tail
  cases.push(["12345", 2]);
  cases.push(["12345", 4]);
  // Strictly decreasing: removing from the head
  cases.push(["54321", 2]);
  cases.push(["54321", 4]);
  // Leading zeros after removal
  cases.push(["100", 1]);
  cases.push(["1000000", 4]);
  cases.push(["10001", 4]);
  // Remove all
  cases.push(["12345", 5]);
  // k = 0 is identity
  cases.push(["100000", 0]);
  cases.push(["9876543210", 0]);
  // Long zigzag
  cases.push(["91234567890", 3]);
  cases.push(["112", 1]);
  // Repeated patterns
  cases.push(["1234567890", 9]);
  cases.push(["1234567890", 1]);
  cases.push(["9080706050", 5]);
  // From LC discussion: tricky cases
  cases.push(["20100", 1]);
  cases.push(["1234", 1]);
  cases.push(["10", 1]);
  // Larger crafted: monotone then drop
  cases.push(["123456789876543210", 5]);
  cases.push(["555550000055555", 5]);
  // All zeros at end
  cases.push(["9000", 2]);
  cases.push(["90", 1]);
  cases.push(["19", 1]);
  cases.push(["91", 1]);
  cases.push(["10001", 1]);

  // Random LCG-generated cases
  while (cases.length < 33) {
    const len = 2 + (lcg() % 18); // length 2..19
    let num = "";
    // first digit non-zero
    num += String(1 + (lcg() % 9));
    for (let i = 1; i < len; i++) {
      num += String(lcg() % 10);
    }
    const k = 1 + (lcg() % (len - 1));
    cases.push([num, k]);
  }

  const test_cases = cases.map(([num, k]) => ({
    inputs: [JSON.stringify(num), String(k)],
    expected: JSON.stringify(ref(num, k))
  }));

  return {
    slug: "remove-k-digits",
    obj: {
      description: "Given a non-negative integer `num` represented as a string and an integer `k`, return **the smallest possible integer** (as a string) after removing exactly `k` digits from `num`.\n\nThe result must not contain any **leading zeros**, except for the case where the result itself is `\"0\"`.\n\n**Example 1**\n\n```\nInput:  num = \"1432219\", k = 3\nOutput: \"1219\"\nExplanation: remove 4, 3, 2 -> 1219, which is the smallest.\n```\n\n**Example 2**\n\n```\nInput:  num = \"10200\", k = 1\nOutput: \"200\"\nExplanation: remove the leading 1, and the leading 0 is then stripped.\n```\n\n**Example 3**\n\n```\nInput:  num = \"10\", k = 2\nOutput: \"0\"\nExplanation: remove all digits -> the empty result is canonicalized to \"0\".\n```\n\nThis is **LeetCode 402 — Remove K Digits**. The canonical approach uses a **monotonic non-decreasing stack**: scan the digits left to right; whenever the top of the stack is **greater** than the current digit and we still have removals left, pop. Any leftover removals are taken from the tail. Finally, strip leading zeros.",
      method_name: "removeKdigits",
      params: [
        { name: "num", type: "str" },
        { name: "k", type: "int" }
      ],
      return_type: "str",
      tags: ["stack", "greedy", "monotonic-stack", "string"],
      pattern: "**Monotonic non-decreasing stack with a removal budget.** The problem is the textbook 'smallest number by deleting `k` digits' shape, and the greedy is:\n\n```\nfor each digit d in num:\n    while removals_left > 0 and stack and stack[-1] > d:\n        stack.pop(); removals_left -= 1\n    stack.append(d)\nwhile removals_left > 0:\n    stack.pop(); removals_left -= 1\nresult = strip_leading_zeros(\"\".join(stack))\nreturn result if result else \"0\"\n```\n\n**Why the monotonic stack is optimal.** Reading left to right, the **most significant** position has the largest impact on the resulting number's value. If we can remove a digit at a higher (more significant) position that is larger than the digit immediately after it, doing so strictly reduces the resulting number. The stack's `while` loop performs exactly that: it removes a peak digit at the current frontier whenever the next digit is smaller. Because each digit is pushed once and popped at most once, the loop runs in amortized `O(n)`.\n\n**Why leftover removals come from the tail.** After the scan, the stack is non-decreasing. If we still have removals to spend, the **largest** remaining digits are at the back — popping the tail removes them and keeps the most significant prefix intact. Removing from anywhere earlier would replace a smaller digit with a larger one.\n\n**Why leading zeros are stripped.** The problem forbids leading zeros (except for the result `\"0\"` itself). After removing `k` digits, the new most significant position might be `0` (e.g. `\"10200\" -> remove '1' -> \"0200\"`). Stripping `0`s from the left turns it into `\"200\"`. The empty string canonicalizes to `\"0\"`.\n\n**Worked example.** `num = \"1432219\"`, `k = 3`.\n\n```\nstep 1: push '1' -> stack = [1]\nstep 2: '4' > '1' so push -> [1, 4]\nstep 3: '3' < '4', pop 4 (k=2) -> [1]; push '3' -> [1, 3]\nstep 4: '2' < '3', pop 3 (k=1) -> [1]; push '2' -> [1, 2]\nstep 5: '2' >= '2' push -> [1, 2, 2]\nstep 6: '1' < '2', pop 2 (k=0) -> [1, 2]; push '1' -> [1, 2, 1]\nstep 7: '9' >= '1' push -> [1, 2, 1, 9]\nleftover k = 0\nresult = \"1219\"\n```\n\n**Why the alphabetic comparison works.** Digits `'0'..'9'` have monotone ASCII codepoints, so `'5' > '3'` is equivalent to `5 > 3`. No int parsing needed.\n\n**Why `k >= len(num)` is a fast-path.** If we have to remove every digit, the only valid answer is `\"0\"` (empty number normalized). Returning early avoids dealing with empty buffers.\n\n**Edge cases worth practicing.**\n- `num` is strictly increasing, e.g. `\"12345\"`, `k = 2`: removing from the tail gives `\"123\"`.\n- `num` is strictly decreasing, e.g. `\"54321\"`, `k = 2`: each new digit triggers a pop, so we end at `\"321\"`.\n- `num` has lots of leading 9s and trailing 0s: pops propagate to expose the small tail.\n- `num = \"10\"`, `k = 2`: empty stack, canonicalize to `\"0\"`.",
      follow_up: "**Variant 1 — largest number after removing `k` digits.** Flip the comparison: use a **non-increasing** monotonic stack. Pop while `stack[-1] < d`. Leftover removals come from the tail.\n\n**Variant 2 — remove exactly `k` digits to form the **lex smallest** string (not numeric).** Same algorithm; the result is the same because digits have lexicographic == numeric ordering on equal-length strings, and the leading-zero strip is the only difference.\n\n**Variant 3 — remove `k` digits to make the resulting integer divisible by some `d`.** No longer purely greedy; needs DP on (position, digits remaining, residue mod `d`). `O(n * k * d)` states.\n\n**Variant 4 — given two strings, form the largest interleaving of total length `n` (LC 321).** Use this exact subroutine as a building block: for each split `i + j = n`, compute the lex-greatest length-`i` subsequence of `nums1` and length-`j` subsequence of `nums2`, then merge.\n\n**Variant 5 — same problem, but the digits live in a stream (one at a time).** The stack approach is online: each new digit pops only previous tops, never future ones. Memory is `O(n - k)`.\n\n**Variant 6 — remove **at most** `k` digits (rather than exactly `k`).** Identical recipe: never spend a removal unless it strictly improves the result. The stack pops only when `stack[-1] > d`. Leftovers are NOT spent.\n\n**Implementation pitfalls.**\n1. **Popping on `>=` instead of `>`.** Equal digits should not be popped — doing so wastes removals without improving the result. The pop predicate is **strict greater than**.\n2. **Forgetting leftover-removals-from-the-tail.** If the input is monotone increasing, the scan never pops; you must explicitly drop `k` from the right.\n3. **Forgetting the leading-zero strip.** `\"10200\" -> k=1` produces stack `[1, 0, 2, 0, 0] -> pop 1 -> [0, 2, 0, 0]`. Without strip, the output is `\"0200\"`, which is invalid.\n4. **Returning empty string instead of `\"0\"`.** When every digit is removed (or all remaining are leading zeros), normalize to `\"0\"`.\n5. **Using `int(num) - ...` to compute the answer.** The input length is up to `10^5`; `num` does not fit in a native integer.\n6. **`k == 0` edge.** The loop never pops; the canonical output is `num` itself (possibly with leading-zero strip, though the input guarantees no leading zeros).\n7. **String concatenation in a hot loop.** Use a list / `StringBuilder` / `vector<char>` to keep the running time linear; repeated `+=` in Python is `O(n^2)`.",
      complexity: {
        time: "**O(n)** amortized where `n = len(num)`. Each digit is pushed at most once and popped at most once across the entire scan. The leftover-tail removal is at most `k <= n` pops. Stripping leading zeros and joining are each `O(n)`.",
        space: "**O(n)** auxiliary for the stack of digits and the output buffer. In the worst case (a strictly non-decreasing input with `k = 0`) the stack equals the input length.",
        notes: "If you implement the stack with a fixed-size char buffer of size `n - k`, the algorithm uses exactly the output's storage and no scratch space beyond the budget counter. Wall-clock is dominated by character comparisons; for `n = 10^5` the entire run completes in well under 5 ms.",
        optimal: "**O(n) is optimal.** Any correct algorithm must inspect every digit to decide whether to keep it, so the lower bound is `Omega(n)`. The monotonic-stack approach matches it with one pass and constant work per digit."
      },
      constraints: [
        "1 <= k <= len(num) <= 10^5",
        "num consists of only digits 0-9",
        "num does not have any leading zeros, except when num is exactly \"0\"",
        "If k == len(num), the answer is the string \"0\"",
        "The output must not have leading zeros, except the result \"0\" itself"
      ],
      hints: [
        "**Monotonic non-decreasing stack.** Push each digit; before pushing, pop the top while it is strictly greater than the current digit AND you still have removals to spend.",
        "**Leftover removals are taken from the tail.** After the scan the stack is non-decreasing, so the **largest** digits are at the back. Popping them keeps the most significant prefix.",
        "**Strip leading zeros at the end.** Removing a leading digit can expose `0`s. Trim them off and canonicalize empty -> `\"0\"`.",
        "**Pop predicate is strict `>`, not `>=`.** Equal digits should not be popped — popping them wastes removals without improving the result.",
        "**Fast-path `k >= len(num)`.** The answer is the string `\"0\"`."
      ],
      test_cases,
      solutions: {
        python: "class Solution:\n    def removeKdigits(self, num: str, k: int) -> str:\n        if k >= len(num):\n            return \"0\"\n        stack = []\n        remove = k\n        for d in num:\n            while remove > 0 and stack and stack[-1] > d:\n                stack.pop()\n                remove -= 1\n            stack.append(d)\n        while remove > 0:\n            stack.pop()\n            remove -= 1\n        i = 0\n        while i < len(stack) and stack[i] == \"0\":\n            i += 1\n        out = \"\".join(stack[i:])\n        return out if out else \"0\"\n",
        javascript: "var removeKdigits = function(num, k) {\n    if (k >= num.length) return \"0\";\n    const stack = [];\n    let remove = k;\n    for (let i = 0; i < num.length; i++) {\n        const d = num[i];\n        while (remove > 0 && stack.length > 0 && stack[stack.length - 1] > d) {\n            stack.pop();\n            remove--;\n        }\n        stack.push(d);\n    }\n    while (remove > 0) {\n        stack.pop();\n        remove--;\n    }\n    let i = 0;\n    while (i < stack.length && stack[i] === \"0\") i++;\n    const out = stack.slice(i).join(\"\");\n    return out === \"\" ? \"0\" : out;\n};\n",
        java: "public class Solution {\n    public String removeKdigits(String num, int k) {\n        if (k >= num.length()) return \"0\";\n        StringBuilder stack = new StringBuilder();\n        int remove = k;\n        for (int i = 0; i < num.length(); i++) {\n            char d = num.charAt(i);\n            while (remove > 0 && stack.length() > 0 && stack.charAt(stack.length() - 1) > d) {\n                stack.deleteCharAt(stack.length() - 1);\n                remove--;\n            }\n            stack.append(d);\n        }\n        while (remove > 0) {\n            stack.deleteCharAt(stack.length() - 1);\n            remove--;\n        }\n        int i = 0;\n        while (i < stack.length() && stack.charAt(i) == '0') i++;\n        String out = stack.substring(i);\n        return out.isEmpty() ? \"0\" : out;\n    }\n}\n",
        cpp: "#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    string removeKdigits(string num, int k) {\n        if ((int)k >= (int)num.size()) return \"0\";\n        string stack;\n        int remove = k;\n        for (char d : num) {\n            while (remove > 0 && !stack.empty() && stack.back() > d) {\n                stack.pop_back();\n                remove--;\n            }\n            stack.push_back(d);\n        }\n        while (remove > 0) {\n            stack.pop_back();\n            remove--;\n        }\n        int i = 0;\n        while (i < (int)stack.size() && stack[i] == '0') i++;\n        string out = stack.substr(i);\n        return out.empty() ? \"0\" : out;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// Compose block and SAFE-replace into problemContent.js
// ============================================================
function buildBlock(p1, p2) {
  const j1 = JSON.stringify(p1.obj, null, 2);
  const j2 = JSON.stringify(p2.obj, null, 2);
  return [
    "",
    "// ===== WAVE 34X START =====",
    "// === WAVE 34X " + p1.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p1.slug) + ";",
    "  const _entry = " + j1 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 34X " + p1.slug + " END ===",
    "// === WAVE 34X " + p2.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p2.slug) + ";",
    "  const _entry = " + j2 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 34X " + p2.slug + " END ===",
    "// ===== WAVE 34X END =====",
    ""
  ].join("\n");
}

const p1 = buildProblem1();
const p2 = buildProblem2();

if (p1.obj.test_cases.length < 25) {
  console.error("P1 has only " + p1.obj.test_cases.length + " test cases");
  process.exit(1);
}
if (p2.obj.test_cases.length < 25) {
  console.error("P2 has only " + p2.obj.test_cases.length + " test cases");
  process.exit(1);
}

const block = buildBlock(p1, p2);

let src = fs.readFileSync(FILE, "utf8");

// guard: don't double-write
if (src.indexOf("WAVE 34X START") !== -1) {
  console.error("WAVE 34X already present; aborting to avoid duplicate.");
  process.exit(1);
}

// guard: ensure neither slug is already in the file as a RICH_CONTENT entry
if (src.indexOf("RICH_CONTENT[\"" + p1.slug + "\"]") !== -1) {
  console.error("Slug " + p1.slug + " already present in RICH_CONTENT");
  process.exit(1);
}
if (src.indexOf("RICH_CONTENT[\"" + p2.slug + "\"]") !== -1) {
  console.error("Slug " + p2.slug + " already present in RICH_CONTENT");
  process.exit(1);
}

// SAFE replace (function form) — anchor on the WAVE 34W END marker and append block after it.
const ANCHOR = "// ===== WAVE 34W END =====";
if (src.indexOf(ANCHOR) === -1) {
  console.error("Anchor " + ANCHOR + " not found");
  process.exit(1);
}

const next = src.replace(ANCHOR, function (m) {
  return m + "\n" + block;
});

if (next === src) {
  console.error("No-op replace; aborting");
  process.exit(1);
}

fs.writeFileSync(FILE, next);

console.log("DONE wave34x " + p1.slug + " + " + p2.slug);
process.exit(0);
