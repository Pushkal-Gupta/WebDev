#!/usr/bin/env node
// Part 3: problems 21-35
import fs from 'node:fs';

const entries = [];
const add = (p) => entries.push(p);

// 21. word-squares (return list of all word squares from given words)
add({
  id: 'word-squares',
  return_type: 'List[List[str]]',
  params: [{ name: 'words', type: 'List[str]' }],
  pattern: 'Backtracking with prefix index',
  test_cases: [
    { inputs: ['["area","lead","wall","lady","ball"]'], expected: '[["ball","area","lead","lady"],["wall","area","lead","lady"]]' },
    { inputs: ['["abat","baba","atan","atal"]'], expected: '[["baba","abat","baba","atal"],["baba","abat","baba","atan"]]' },
    { inputs: ['["aa"]'], expected: '[["aa","aa"]]' },
    { inputs: ['["a"]'], expected: '[["a"]]' },
    { inputs: ['["ab"]'], expected: '[]' },
    { inputs: ['["abc","bca","cab"]'], expected: '[]' },
    { inputs: ['["aba","bab"]'], expected: '[]' },
    { inputs: ['["aaa","aaa"]'], expected: '[["aaa","aaa","aaa"]]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['["xy"]'], expected: '[]' },
  ],
  editorial_md: `## Intuition
A word square of size n has the property that the k-th row and the k-th column are the same word. So once we've placed the first \`k\` words, the next word is constrained to begin with the characters formed by the k-th column of the partial square. The key optimisation: precompute a prefix-to-words index so the candidates for "next word" can be fetched in O(1).

## Approach
1. Bucket all words by every prefix: \`prefix_map[prefix] = list of words starting with prefix\`.
2. For each candidate first word, start a recursion:
   - The current square has \`k\` rows. Build the required prefix by reading column \`k\` of the first \`k\` rows.
   - Look up that prefix in \`prefix_map\`. For every candidate, push it as the next row and recurse.
   - When \`k == n\`, record a copy of the square as a valid answer.
3. Backtrack by popping after recursion.

The prefix index turns the branching factor from \`n\` (all words) into the small set of words that match the column constraint, which is what makes this tractable.

## Complexity
- Time: O(n * 26^L) worst case, but the prefix prune typically makes it small.
- Space: O(n * L) for the index plus recursion depth O(L).`,
  solutions: {
    python: `from collections import defaultdict
class Solution:
    def wordSquares(self, words):
        if not words: return []
        L = len(words[0])
        if any(len(w) != L for w in words): return []
        pref = defaultdict(list)
        for w in words:
            for k in range(L + 1):
                pref[w[:k]].append(w)
        out = []
        def back(sq):
            if len(sq) == L:
                out.append(sq[:]); return
            k = len(sq)
            needed = ''.join(row[k] for row in sq)
            for w in pref.get(needed, []):
                sq.append(w)
                back(sq)
                sq.pop()
        for w in words:
            back([w])
        return out
`,
    javascript: `class Solution {
    wordSquares(words) {
        if (!words.length) return [];
        const L = words[0].length;
        if (words.some(w => w.length !== L)) return [];
        const pref = new Map();
        for (const w of words) {
            for (let k = 0; k <= L; k++) {
                const p = w.slice(0, k);
                if (!pref.has(p)) pref.set(p, []);
                pref.get(p).push(w);
            }
        }
        const out = [];
        const back = (sq) => {
            if (sq.length === L) { out.push(sq.slice()); return; }
            const k = sq.length;
            let needed = '';
            for (const row of sq) needed += row[k];
            for (const w of (pref.get(needed) || [])) {
                sq.push(w);
                back(sq);
                sq.pop();
            }
        };
        for (const w of words) back([w]);
        return out;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public List<List<String>> wordSquares(String[] words) {
        List<List<String>> out = new ArrayList<>();
        if (words.length == 0) return out;
        int L = words[0].length();
        for (String w : words) if (w.length() != L) return out;
        Map<String, List<String>> pref = new HashMap<>();
        for (String w : words) {
            for (int k = 0; k <= L; k++) {
                String p = w.substring(0, k);
                pref.computeIfAbsent(p, x -> new ArrayList<>()).add(w);
            }
        }
        for (String w : words) {
            List<String> sq = new ArrayList<>();
            sq.add(w);
            back(sq, L, pref, out);
        }
        return out;
    }
    private void back(List<String> sq, int L, Map<String,List<String>> pref, List<List<String>> out) {
        if (sq.size() == L) { out.add(new ArrayList<>(sq)); return; }
        int k = sq.size();
        StringBuilder sb = new StringBuilder();
        for (String row : sq) sb.append(row.charAt(k));
        for (String w : pref.getOrDefault(sb.toString(), Collections.emptyList())) {
            sq.add(w); back(sq, L, pref, out); sq.remove(sq.size() - 1);
        }
    }
}
`,
    cpp: `#include <vector>
#include <string>
#include <unordered_map>
using namespace std;
class Solution {
public:
    vector<vector<string>> wordSquares(vector<string>& words) {
        vector<vector<string>> out;
        if (words.empty()) return out;
        int L = words[0].size();
        for (auto& w : words) if ((int)w.size() != L) return out;
        unordered_map<string, vector<string>> pref;
        for (auto& w : words) {
            for (int k = 0; k <= L; k++) pref[w.substr(0, k)].push_back(w);
        }
        vector<string> sq;
        for (auto& w : words) {
            sq.clear(); sq.push_back(w);
            back(sq, L, pref, out);
        }
        return out;
    }
private:
    void back(vector<string>& sq, int L, unordered_map<string, vector<string>>& pref, vector<vector<string>>& out) {
        if ((int)sq.size() == L) { out.push_back(sq); return; }
        int k = sq.size();
        string needed;
        for (auto& row : sq) needed += row[k];
        auto it = pref.find(needed);
        if (it == pref.end()) return;
        for (auto& w : it->second) {
            sq.push_back(w);
            back(sq, L, pref, out);
            sq.pop_back();
        }
    }
};
`,
  },
});

// 22. queens-that-can-attack-king (already has 3 tc/hints/mn)
add({
  id: 'queens-that-can-attack-king',
  return_type: 'List[List[int]]',
  params: [{ name: 'queens', type: 'List[List[int]]' }, { name: 'king', type: 'List[int]' }],
  pattern: '8-direction ray scan',
  test_cases: [
    { inputs: ['[[0,1],[1,0],[4,0],[0,4],[3,3],[2,4]]', '[0,0]'], expected: '[[0,1],[1,0],[3,3]]' },
    { inputs: ['[[0,0],[1,1],[2,2],[3,4],[3,5],[4,4],[4,5]]', '[3,3]'], expected: '[[2,2],[3,4],[4,4]]' },
    { inputs: ['[[5,6],[7,7],[2,1],[0,7],[1,6],[5,1],[3,7],[0,3],[4,0],[1,2],[6,3],[5,0],[0,4],[2,2],[1,1],[6,4],[5,4],[0,0],[2,6],[4,5],[5,2],[1,4],[7,5],[2,3],[0,5],[4,2],[1,0],[2,7],[0,1],[4,6],[6,1],[0,6],[4,3],[1,7]]', '[3,4]'], expected: '[[2,3],[1,4],[1,6],[3,7],[4,3],[5,4],[4,5]]' },
    { inputs: ['[[1,1]]', '[0,0]'], expected: '[[1,1]]' },
    { inputs: ['[[0,1]]', '[7,7]'], expected: '[]' },
    { inputs: ['[[7,7]]', '[0,0]'], expected: '[[7,7]]' },
    { inputs: ['[[0,0],[7,0],[0,7],[7,7]]', '[3,3]'], expected: '[[0,0],[0,7],[7,0],[7,7]]' },
    { inputs: ['[[3,0],[3,7],[0,3],[7,3]]', '[3,3]'], expected: '[[3,0],[0,3],[3,7],[7,3]]' },
    { inputs: ['[[0,5],[2,4],[4,4],[5,3],[6,0],[1,3],[3,4]]', '[3,3]'], expected: '[[3,4],[1,3],[2,4],[5,3]]' },
    { inputs: ['[[5,5]]', '[3,3]'], expected: '[[5,5]]' },
  ],
  editorial_md: `## Intuition
The 8x8 board admits eight directions (N, NE, E, SE, S, SW, W, NW) from the king. The only queens that can attack are the **nearest** queen in each direction, because any queen behind another is blocked. So we walk outward in each direction until we either find a queen (record it) or fall off the board.

## Approach
1. Put the queen positions into a hash set for O(1) membership tests.
2. For each of the 8 directions \`(dx, dy)\`, start at the king's position and step \`(dx, dy)\` repeatedly.
3. The first cell that contains a queen is the attacking queen in that direction — append it and stop scanning that ray.
4. If the ray exits the 8x8 board first, no queen attacks from that side.
5. Return the collected list (at most 8 queens).

The inner loop runs at most 7 steps per direction, so the total work is O(56) plus O(|queens|) for the set build.

## Complexity
- Time: O(Q + 64) where Q is the number of queens.
- Space: O(Q) for the hash set.`,
  solutions: {
    python: `class Solution:
    def queensAttacktheKing(self, queens, king):
        qset = {(r, c) for r, c in queens}
        out = []
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                if dr == 0 and dc == 0: continue
                r, c = king[0] + dr, king[1] + dc
                while 0 <= r < 8 and 0 <= c < 8:
                    if (r, c) in qset:
                        out.append([r, c])
                        break
                    r += dr; c += dc
        return out
`,
    javascript: `class Solution {
    queensAttacktheKing(queens, king) {
        const qset = new Set(queens.map(q => q[0] + ',' + q[1]));
        const out = [];
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            let r = king[0] + dr, c = king[1] + dc;
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (qset.has(r + ',' + c)) { out.push([r, c]); break; }
                r += dr; c += dc;
            }
        }
        return out;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int[][] queensAttacktheKing(int[][] queens, int[] king) {
        Set<String> qset = new HashSet<>();
        for (int[] q : queens) qset.add(q[0] + "," + q[1]);
        List<int[]> out = new ArrayList<>();
        for (int dr = -1; dr <= 1; dr++) for (int dc = -1; dc <= 1; dc++) {
            if (dr == 0 && dc == 0) continue;
            int r = king[0] + dr, c = king[1] + dc;
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (qset.contains(r + "," + c)) { out.add(new int[]{r, c}); break; }
                r += dr; c += dc;
            }
        }
        return out.toArray(new int[0][]);
    }
}
`,
    cpp: `#include <vector>
#include <unordered_set>
#include <string>
using namespace std;
class Solution {
public:
    vector<vector<int>> queensAttacktheKing(vector<vector<int>>& queens, vector<int>& king) {
        unordered_set<string> qset;
        for (auto& q : queens) qset.insert(to_string(q[0]) + "," + to_string(q[1]));
        vector<vector<int>> out;
        for (int dr = -1; dr <= 1; dr++) for (int dc = -1; dc <= 1; dc++) {
            if (dr == 0 && dc == 0) continue;
            int r = king[0] + dr, c = king[1] + dc;
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (qset.count(to_string(r) + "," + to_string(c))) { out.push_back({r, c}); break; }
                r += dr; c += dc;
            }
        }
        return out;
    }
};
`,
  },
});

// 23. loud-and-rich
add({
  id: 'loud-and-rich',
  return_type: 'List[int]',
  params: [{ name: 'richer', type: 'List[List[int]]' }, { name: 'quiet', type: 'List[int]' }],
  pattern: 'DFS + memo on DAG',
  test_cases: [
    { inputs: ['[[1,0],[2,1],[3,1],[3,7],[4,3],[5,3],[6,3]]', '[3,2,5,4,6,1,7,0]'], expected: '[5,5,2,5,4,5,6,7]' },
    { inputs: ['[]', '[0]'], expected: '[0]' },
    { inputs: ['[[0,1]]', '[3,5]'], expected: '[0,0]' },
    { inputs: ['[[1,0]]', '[3,5]'], expected: '[1,1]' },
    { inputs: ['[[0,1],[1,2]]', '[1,2,3]'], expected: '[0,0,0]' },
    { inputs: ['[[2,0],[1,0]]', '[5,3,2]'], expected: '[2,1,2]' },
    { inputs: ['[[0,2],[1,2],[3,2]]', '[5,4,3,2]'], expected: '[0,1,2,3]' },
    { inputs: ['[]', '[0,1,2,3]'], expected: '[0,1,2,3]' },
    { inputs: ['[[1,0],[2,0]]', '[5,2,1]'], expected: '[2,1,2]' },
    { inputs: ['[[0,1],[1,2],[2,3]]', '[4,3,2,1]'], expected: '[0,0,0,0]' },
  ],
  editorial_md: `## Intuition
\`answer[x]\` is the person with the minimum quietness among all people richer than or equal to \`x\`. Build a directed graph where an edge \`u -> v\` means "u is richer than v"; then \`answer[x]\` is the argmin of quietness over the set reachable from \`x\`. DFS with memoisation computes this in O(V + E).

## Approach
1. Build the adjacency list: for each \`[a, b]\` in \`richer\`, add edge \`a -> b\` (a is richer than b, so b can reach a via reverse). It's cleaner to add edge \`b -> a\` so a DFS from b walks to richer people.
2. For each person \`x\` compute \`dfs(x)\` = the person with minimum quietness reachable from \`x\` (including \`x\`). Memoise the result so repeated nodes aren't re-explored.
3. The DFS from \`x\` visits \`x\` itself and the dfs result of every neighbour, keeping whichever has the smallest \`quiet\` value.
4. Answer for \`x\` is \`dfs(x)\`.

The graph is a DAG (richer is a strict order), so dfs always terminates.

## Complexity
- Time: O(V + E) where V is the number of people and E is the number of richer pairs.
- Space: O(V + E) for graph and memo.`,
  solutions: {
    python: `class Solution:
    def loudAndRich(self, richer, quiet):
        n = len(quiet)
        graph = [[] for _ in range(n)]
        for a, b in richer:
            graph[b].append(a)
        ans = [-1] * n
        def dfs(x):
            if ans[x] != -1: return ans[x]
            best = x
            for y in graph[x]:
                cand = dfs(y)
                if quiet[cand] < quiet[best]:
                    best = cand
            ans[x] = best
            return best
        for i in range(n): dfs(i)
        return ans
`,
    javascript: `class Solution {
    loudAndRich(richer, quiet) {
        const n = quiet.length;
        const graph = Array.from({length: n}, () => []);
        for (const [a, b] of richer) graph[b].push(a);
        const ans = new Array(n).fill(-1);
        const dfs = (x) => {
            if (ans[x] !== -1) return ans[x];
            let best = x;
            for (const y of graph[x]) {
                const c = dfs(y);
                if (quiet[c] < quiet[best]) best = c;
            }
            return ans[x] = best;
        };
        for (let i = 0; i < n; i++) dfs(i);
        return ans;
    }
}
`,
    java: `import java.util.*;
class Solution {
    int[] ans; int[] quiet; List<List<Integer>> graph;
    public int[] loudAndRich(int[][] richer, int[] quiet) {
        this.quiet = quiet;
        int n = quiet.length;
        graph = new ArrayList<>();
        for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
        for (int[] r : richer) graph.get(r[1]).add(r[0]);
        ans = new int[n]; Arrays.fill(ans, -1);
        for (int i = 0; i < n; i++) dfs(i);
        return ans;
    }
    int dfs(int x) {
        if (ans[x] != -1) return ans[x];
        int best = x;
        for (int y : graph.get(x)) {
            int c = dfs(y);
            if (quiet[c] < quiet[best]) best = c;
        }
        return ans[x] = best;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    vector<int> loudAndRich(vector<vector<int>>& richer, vector<int>& quiet) {
        int n = quiet.size();
        vector<vector<int>> graph(n);
        for (auto& r : richer) graph[r[1]].push_back(r[0]);
        vector<int> ans(n, -1);
        for (int i = 0; i < n; i++) dfs(i, graph, quiet, ans);
        return ans;
    }
private:
    int dfs(int x, vector<vector<int>>& g, vector<int>& q, vector<int>& ans) {
        if (ans[x] != -1) return ans[x];
        int best = x;
        for (int y : g[x]) {
            int c = dfs(y, g, q, ans);
            if (q[c] < q[best]) best = c;
        }
        return ans[x] = best;
    }
};
`,
  },
});

// 24. implement-atoi
add({
  id: 'implement-atoi',
  method_name: 'myAtoi',
  params: [{ name: 's', type: 'str' }],
  return_type: 'int',
  pattern: 'String parsing with state machine',
  description: '<p>Implement the <code>atoi</code> function: convert a string to a 32-bit signed integer. Skip leading whitespace, read an optional sign, then read digits until a non-digit. Clamp the result to <code>[-2^31, 2^31 - 1]</code>. If no digits are read, return 0.</p>',
  hints: [
    'Skip leading whitespace.',
    'Capture an optional + or - sign.',
    'Read digits and build the number.',
    'Stop at the first non-digit.',
    'Clamp to [-2147483648, 2147483647].',
  ],
  test_cases: [
    { inputs: ['"42"'], expected: '42' },
    { inputs: ['"   -42"'], expected: '-42' },
    { inputs: ['"4193 with words"'], expected: '4193' },
    { inputs: ['"words and 987"'], expected: '0' },
    { inputs: ['"-91283472332"'], expected: '-2147483648' },
    { inputs: ['"91283472332"'], expected: '2147483647' },
    { inputs: ['""'], expected: '0' },
    { inputs: ['"   "'], expected: '0' },
    { inputs: ['"+1"'], expected: '1' },
    { inputs: ['"00000-42a1234"'], expected: '0' },
  ],
  editorial_md: `## Intuition
The problem is a tiny lexer with four phases: skip whitespace, optional sign, read digits, clamp. Each phase peeks one character and decides whether to stay, advance, or finish. Doing this as an explicit state machine avoids subtle bugs around empty strings, "+-1", trailing whitespace, etc.

## Approach
1. Skip leading spaces.
2. If next char is \`+\` or \`-\`, record the sign and advance.
3. Read digits one at a time; build \`num = num * 10 + digit\`. After each digit, clamp early: if \`num\` exceeds \`INT_MAX\` (with sign), return the boundary value immediately.
4. Stop on the first non-digit or end of string.
5. Apply the sign and return \`num\`.

Watch for the case where the first non-space char is neither sign nor digit — return 0 immediately. Also, "00000-42" reads zeros then stops at \`-\`, giving 0 (not -42).

## Complexity
- Time: O(n).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def myAtoi(self, s):
        INT_MAX = 2**31 - 1
        INT_MIN = -2**31
        i, n = 0, len(s)
        while i < n and s[i] == ' ': i += 1
        if i == n: return 0
        sign = 1
        if s[i] == '+' or s[i] == '-':
            if s[i] == '-': sign = -1
            i += 1
        num = 0
        while i < n and s[i].isdigit():
            num = num * 10 + (ord(s[i]) - ord('0'))
            if sign * num > INT_MAX: return INT_MAX
            if sign * num < INT_MIN: return INT_MIN
            i += 1
        return sign * num
`,
    javascript: `class Solution {
    myAtoi(s) {
        const INT_MAX = 2147483647, INT_MIN = -2147483648;
        let i = 0, n = s.length;
        while (i < n && s[i] === ' ') i++;
        if (i === n) return 0;
        let sign = 1;
        if (s[i] === '+' || s[i] === '-') { if (s[i] === '-') sign = -1; i++; }
        let num = 0;
        while (i < n && s[i] >= '0' && s[i] <= '9') {
            num = num * 10 + (s.charCodeAt(i) - 48);
            if (sign * num > INT_MAX) return INT_MAX;
            if (sign * num < INT_MIN) return INT_MIN;
            i++;
        }
        return sign * num;
    }
}
`,
    java: `class Solution {
    public int myAtoi(String s) {
        int i = 0, n = s.length();
        while (i < n && s.charAt(i) == ' ') i++;
        if (i == n) return 0;
        int sign = 1;
        if (s.charAt(i) == '+' || s.charAt(i) == '-') {
            if (s.charAt(i) == '-') sign = -1;
            i++;
        }
        long num = 0;
        while (i < n && Character.isDigit(s.charAt(i))) {
            num = num * 10 + (s.charAt(i) - '0');
            if (sign * num > Integer.MAX_VALUE) return Integer.MAX_VALUE;
            if (sign * num < Integer.MIN_VALUE) return Integer.MIN_VALUE;
            i++;
        }
        return (int)(sign * num);
    }
}
`,
    cpp: `#include <string>
#include <climits>
using namespace std;
class Solution {
public:
    int myAtoi(string s) {
        int i = 0, n = s.size();
        while (i < n && s[i] == ' ') i++;
        if (i == n) return 0;
        int sign = 1;
        if (s[i] == '+' || s[i] == '-') {
            if (s[i] == '-') sign = -1;
            i++;
        }
        long long num = 0;
        while (i < n && isdigit(s[i])) {
            num = num * 10 + (s[i] - '0');
            if (sign * num > INT_MAX) return INT_MAX;
            if (sign * num < INT_MIN) return INT_MIN;
            i++;
        }
        return (int)(sign * num);
    }
};
`,
  },
});

// 25. urlify
add({
  id: 'urlify',
  method_name: 'urlify',
  params: [{ name: 's', type: 'str' }],
  return_type: 'str',
  pattern: 'In-place string rewrite (two-pointer)',
  description: '<p>Replace every space in the input string with <code>"%20"</code>. Trailing spaces (intended as padding for in-place rewriting) should be ignored — the input contains exactly enough trailing space to fit the rewrite. Return the resulting URL-safe string.</p>',
  hints: [
    'Count the non-trailing spaces in the meaningful prefix.',
    'Each space contributes 3 chars when replaced.',
    'Walk the string and append: space -> "%20", else original.',
    'For true in-place rewriting, walk from the right with two pointers.',
    'Be careful to strip trailing whitespace before processing.',
  ],
  test_cases: [
    { inputs: ['"Mr John Smith    "'], expected: '"Mr%20John%20Smith"' },
    { inputs: ['"      "'], expected: '""' },
    { inputs: ['"a b"'], expected: '"a%20b"' },
    { inputs: ['""'], expected: '""' },
    { inputs: ['"abc"'], expected: '"abc"' },
    { inputs: ['" a "'], expected: '"%20a"' },
    { inputs: ['"hello world"'], expected: '"hello%20world"' },
    { inputs: ['"a b c"'], expected: '"a%20b%20c"' },
    { inputs: ['"   leading and trailing   "'], expected: '"%20%20%20leading%20and%20trailing"' },
    { inputs: ['"single"'], expected: '"single"' },
  ],
  editorial_md: `## Intuition
Two micro-passes do the job: strip any trailing padding, then walk the meaningful prefix and emit either the character itself or the three-character replacement \`%20\` whenever a space is found. The classic interview twist asks for the rewrite to happen in place using extra trailing capacity — that requires a back-to-front two-pointer.

## Approach (simple, idiomatic)
1. Right-strip the input to remove the trailing pad.
2. Walk left to right. For each character: if it is a space, append \`%20\`; otherwise append the character.
3. Join and return.

## Approach (in-place, two-pointer)
1. Count the non-padding spaces \`k\`. The final string has length \`L = original_length + 2k\` where \`original_length\` excludes trailing padding.
2. Use two pointers: \`read = original_length - 1\`, \`write = L - 1\`.
3. Walk \`read\` backwards: if the char is a space, write \`%20\` at positions \`write, write-1, write-2\` and decrement \`write\` by 3. Else copy the char and decrement \`write\` by 1.
4. Stop when \`write < 0\` or \`read < 0\`.

## Complexity
- Time: O(n).
- Space: O(n) for the simple version, O(1) for the in-place variant.`,
  solutions: {
    python: `class Solution:
    def urlify(self, s):
        return s.rstrip().replace(' ', '%20')
`,
    javascript: `class Solution {
    urlify(s) {
        return s.replace(/\\s+$/, '').replace(/ /g, '%20');
    }
}
`,
    java: `class Solution {
    public String urlify(String s) {
        return s.replaceAll("\\\\s+$", "").replace(" ", "%20");
    }
}
`,
    cpp: `#include <string>
using namespace std;
class Solution {
public:
    string urlify(string s) {
        while (!s.empty() && s.back() == ' ') s.pop_back();
        string out;
        for (char c : s) {
            if (c == ' ') out += "%20";
            else out += c;
        }
        return out;
    }
};
`,
  },
});

// 26. multiply-large-numbers (multiply two non-negative integers represented as strings)
add({
  id: 'multiply-large-numbers',
  method_name: 'multiply',
  params: [{ name: 'a', type: 'str' }, { name: 'b', type: 'str' }],
  return_type: 'str',
  pattern: 'Schoolbook string multiplication',
  description: '<p>Given two non-negative integers represented as strings, return their product, also represented as a string. The numbers can be arbitrarily large and may not be parsed directly into a built-in numeric type.</p>',
  hints: [
    'Result has at most len(a) + len(b) digits.',
    'Multiply digit by digit from the right, accumulating into a result array.',
    'a[i] * b[j] contributes to positions i+j and i+j+1 of the result.',
    'Carry overflow forward at the end (or after each add).',
    'Strip leading zeros; preserve "0" if the answer is zero.',
  ],
  test_cases: [
    { inputs: ['"2"', '"3"'], expected: '"6"' },
    { inputs: ['"123"', '"456"'], expected: '"56088"' },
    { inputs: ['"0"', '"99999"'], expected: '"0"' },
    { inputs: ['"99"', '"99"'], expected: '"9801"' },
    { inputs: ['"100"', '"10"'], expected: '"1000"' },
    { inputs: ['"1"', '"1"'], expected: '"1"' },
    { inputs: ['"9"', '"9"'], expected: '"81"' },
    { inputs: ['"123456789"', '"987654321"'], expected: '"121932631112635269"' },
    { inputs: ['"99999999999999999"', '"99999999999999999"'], expected: '"9999999999999999800000000000000001"' },
    { inputs: ['"7"', '"143"'], expected: '"1001"' },
  ],
  editorial_md: `## Intuition
Schoolbook long multiplication maps to code directly: the digit \`a[i]\` (counted from the right) times \`b[j]\` contributes to positions \`i + j\` (the carry) and \`i + j + 1\` (the ones place) in the result, where positions are also measured from the right. So a result buffer of size \`len(a) + len(b)\` is large enough to hold any product without further resizing.

## Approach
1. Handle the zero shortcut: if either string is \`"0"\`, return \`"0"\`.
2. Allocate an integer array \`res\` of size \`m + n\`.
3. For \`i = m - 1\` down to 0, for \`j = n - 1\` down to 0:
   - \`mul = (a[i] - '0') * (b[j] - '0')\`.
   - \`sum = mul + res[i + j + 1]\`.
   - \`res[i + j + 1] = sum % 10\`.
   - \`res[i + j] += sum / 10\` (this can later exceed 9; the next outer iteration will carry further).
4. Build the output string, skipping leading zeros.

## Complexity
- Time: O(m * n).
- Space: O(m + n) for the result buffer.`,
  solutions: {
    python: `class Solution:
    def multiply(self, a, b):
        if a == '0' or b == '0': return '0'
        m, n = len(a), len(b)
        res = [0] * (m + n)
        for i in range(m - 1, -1, -1):
            for j in range(n - 1, -1, -1):
                mul = (ord(a[i]) - 48) * (ord(b[j]) - 48)
                s = mul + res[i + j + 1]
                res[i + j + 1] = s % 10
                res[i + j] += s // 10
        out = ''.join(map(str, res)).lstrip('0')
        return out or '0'
`,
    javascript: `class Solution {
    multiply(a, b) {
        if (a === '0' || b === '0') return '0';
        const m = a.length, n = b.length;
        const res = new Array(m + n).fill(0);
        for (let i = m - 1; i >= 0; i--) {
            for (let j = n - 1; j >= 0; j--) {
                const mul = (a.charCodeAt(i) - 48) * (b.charCodeAt(j) - 48);
                const s = mul + res[i + j + 1];
                res[i + j + 1] = s % 10;
                res[i + j] += Math.floor(s / 10);
            }
        }
        let out = res.join('').replace(/^0+/, '');
        return out || '0';
    }
}
`,
    java: `class Solution {
    public String multiply(String a, String b) {
        if (a.equals("0") || b.equals("0")) return "0";
        int m = a.length(), n = b.length();
        int[] res = new int[m + n];
        for (int i = m - 1; i >= 0; i--) {
            for (int j = n - 1; j >= 0; j--) {
                int mul = (a.charAt(i) - '0') * (b.charAt(j) - '0');
                int s = mul + res[i + j + 1];
                res[i + j + 1] = s % 10;
                res[i + j] += s / 10;
            }
        }
        StringBuilder sb = new StringBuilder();
        for (int d : res) if (!(sb.length() == 0 && d == 0)) sb.append(d);
        return sb.length() == 0 ? "0" : sb.toString();
    }
}
`,
    cpp: `#include <string>
#include <vector>
using namespace std;
class Solution {
public:
    string multiply(string a, string b) {
        if (a == "0" || b == "0") return "0";
        int m = a.size(), n = b.size();
        vector<int> res(m + n, 0);
        for (int i = m - 1; i >= 0; i--) {
            for (int j = n - 1; j >= 0; j--) {
                int mul = (a[i] - '0') * (b[j] - '0');
                int s = mul + res[i + j + 1];
                res[i + j + 1] = s % 10;
                res[i + j] += s / 10;
            }
        }
        string out;
        for (int d : res) if (!(out.empty() && d == 0)) out += char('0' + d);
        return out.empty() ? "0" : out;
    }
};
`,
  },
});

// 27. diagonal-traversal — anti-diagonal traversal of a matrix
add({
  id: 'diagonal-traversal',
  method_name: 'diagonalTraversal',
  params: [{ name: 'matrix', type: 'List[List[int]]' }],
  return_type: 'List[int]',
  pattern: 'Anti-diagonal grouping by i+j',
  description: '<p>Given an m x n matrix, return all its elements in anti-diagonal order: cells with the same value of <code>i + j</code> grouped together. For even-numbered diagonals walk upward (decreasing row), for odd-numbered diagonals walk downward.</p>',
  hints: [
    'Every cell (i, j) belongs to anti-diagonal d = i + j.',
    'Diagonals 0..(m+n-2) need to be visited in order.',
    'Even d: walk from bottom-left to top-right (i decreases, j increases).',
    'Odd d: walk from top-right to bottom-left (i increases, j decreases).',
    'Or: bucket cells by i+j and reverse alternate buckets.',
  ],
  test_cases: [
    { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'], expected: '[1,2,4,7,5,3,6,8,9]' },
    { inputs: ['[[1,2],[3,4]]'], expected: '[1,2,3,4]' },
    { inputs: ['[[1]]'], expected: '[1]' },
    { inputs: ['[[1,2,3,4,5]]'], expected: '[1,2,3,4,5]' },
    { inputs: ['[[1],[2],[3],[4],[5]]'], expected: '[1,2,3,4,5]' },
    { inputs: ['[[1,2],[3,4],[5,6]]'], expected: '[1,2,3,5,4,6]' },
    { inputs: ['[[1,2,3],[4,5,6]]'], expected: '[1,2,4,5,3,6]' },
    { inputs: ['[[1,2,3,4],[5,6,7,8],[9,10,11,12]]'], expected: '[1,2,5,9,6,3,4,7,10,11,8,12]' },
    { inputs: ['[[1,2],[3,4],[5,6],[7,8]]'], expected: '[1,2,3,5,4,6,7,8]' },
    { inputs: ['[[1,2,3],[4,5,6],[7,8,9],[10,11,12]]'], expected: '[1,2,4,7,5,3,6,8,10,11,9,12]' },
  ],
  editorial_md: `## Intuition
Each anti-diagonal of a matrix collects cells whose row and column indices sum to a constant. Iterating diagonals \`d = 0\` up to \`m + n - 2\` and flipping direction every other diagonal walks the matrix in a zig-zag pattern that hits each cell exactly once.

## Approach
1. Pre-bucket: walk every cell once and push \`mat[i][j]\` into bucket \`d = i + j\`.
2. Build the output by concatenating the buckets in order. Reverse each even-indexed bucket so even diagonals come out bottom-up.
3. (Alternative without buckets) For \`d\` from 0 to \`m + n - 2\`, derive the start cell: if \`d\` even, start at \`(min(d, m-1), d - min(d, m-1))\` and step \`(i--, j++)\`; if odd, start at \`(max(0, d-n+1), min(d, n-1))\` and step \`(i++, j--)\`.

Both versions are O(m * n).

## Complexity
- Time: O(m * n).
- Space: O(m * n) for the output (and the optional bucket array).`,
  solutions: {
    python: `class Solution:
    def diagonalTraversal(self, matrix):
        if not matrix or not matrix[0]: return []
        m, n = len(matrix), len(matrix[0])
        buckets = [[] for _ in range(m + n - 1)]
        for i in range(m):
            for j in range(n):
                buckets[i + j].append(matrix[i][j])
        out = []
        for d, bucket in enumerate(buckets):
            if d % 2 == 0: out.extend(reversed(bucket))
            else: out.extend(bucket)
        return out
`,
    javascript: `class Solution {
    diagonalTraversal(matrix) {
        if (!matrix.length || !matrix[0].length) return [];
        const m = matrix.length, n = matrix[0].length;
        const buckets = Array.from({length: m + n - 1}, () => []);
        for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) buckets[i + j].push(matrix[i][j]);
        const out = [];
        for (let d = 0; d < buckets.length; d++) {
            if (d % 2 === 0) for (let k = buckets[d].length - 1; k >= 0; k--) out.push(buckets[d][k]);
            else for (const x of buckets[d]) out.push(x);
        }
        return out;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int[] diagonalTraversal(int[][] matrix) {
        if (matrix.length == 0 || matrix[0].length == 0) return new int[0];
        int m = matrix.length, n = matrix[0].length;
        List<List<Integer>> buckets = new ArrayList<>();
        for (int i = 0; i < m + n - 1; i++) buckets.add(new ArrayList<>());
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) buckets.get(i + j).add(matrix[i][j]);
        int[] out = new int[m * n]; int k = 0;
        for (int d = 0; d < buckets.size(); d++) {
            List<Integer> b = buckets.get(d);
            if (d % 2 == 0) for (int i = b.size() - 1; i >= 0; i--) out[k++] = b.get(i);
            else for (int x : b) out[k++] = x;
        }
        return out;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    vector<int> diagonalTraversal(vector<vector<int>>& matrix) {
        if (matrix.empty() || matrix[0].empty()) return {};
        int m = matrix.size(), n = matrix[0].size();
        vector<vector<int>> buckets(m + n - 1);
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) buckets[i + j].push_back(matrix[i][j]);
        vector<int> out;
        for (int d = 0; d < (int)buckets.size(); d++) {
            if (d % 2 == 0) for (int k = buckets[d].size() - 1; k >= 0; k--) out.push_back(buckets[d][k]);
            else for (int x : buckets[d]) out.push_back(x);
        }
        return out;
    }
};
`,
  },
});

// 28. magic-square — check if given n x n matrix is a magic square
add({
  id: 'magic-square',
  method_name: 'isMagicSquare',
  params: [{ name: 'matrix', type: 'List[List[int]]' }],
  return_type: 'bool',
  pattern: 'Row / column / diagonal sum check',
  description: '<p>Given an n x n grid of integers, return <code>true</code> if every row, every column, and both diagonals share the same sum (i.e. it is a magic square), else <code>false</code>.</p>',
  hints: [
    'Compute the sum of the first row; call it target.',
    'Walk every row and column, verifying each sums to target.',
    'Sum both diagonals and check they equal target.',
    'Return true only if all 2n + 2 sums match.',
    'Empty or 1x1 grids are trivially magic.',
  ],
  test_cases: [
    { inputs: ['[[2,7,6],[9,5,1],[4,3,8]]'], expected: 'true' },
    { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'], expected: 'false' },
    { inputs: ['[[5]]'], expected: 'true' },
    { inputs: ['[[16,3,2,13],[5,10,11,8],[9,6,7,12],[4,15,14,1]]'], expected: 'true' },
    { inputs: ['[[1]]'], expected: 'true' },
    { inputs: ['[[2,7,6],[9,5,1],[4,3,9]]'], expected: 'false' },
    { inputs: ['[[8,1,6],[3,5,7],[4,9,2]]'], expected: 'true' },
    { inputs: ['[[4,9,2],[3,5,7],[8,1,6]]'], expected: 'true' },
    { inputs: ['[[0,0,0],[0,0,0],[0,0,0]]'], expected: 'true' },
    { inputs: ['[[1,2],[3,4]]'], expected: 'false' },
  ],
  editorial_md: `## Intuition
A magic square has 2n + 2 separate "lines" that must all share the same sum: \`n\` rows, \`n\` columns, the main diagonal, and the anti-diagonal. Pick the first row's sum as the target, then verify every other line matches.

## Approach
1. If the grid is empty or 1x1, return \`true\`.
2. Let \`target\` be the sum of row 0.
3. For \`i\` in \`[1, n)\`, sum row \`i\` and reject if it differs from \`target\`.
4. For \`j\` in \`[0, n)\`, sum column \`j\` and reject if mismatched.
5. Sum the main diagonal (i == j) and anti-diagonal (i + j == n - 1); reject on mismatch.
6. Return \`true\` if every line matched.

The check makes one pass per row, column, and diagonal, so it visits each cell a constant number of times.

## Complexity
- Time: O(n^2).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def isMagicSquare(self, matrix):
        n = len(matrix)
        if n <= 1: return True
        target = sum(matrix[0])
        for i in range(1, n):
            if sum(matrix[i]) != target: return False
        for j in range(n):
            if sum(matrix[i][j] for i in range(n)) != target: return False
        if sum(matrix[i][i] for i in range(n)) != target: return False
        if sum(matrix[i][n-1-i] for i in range(n)) != target: return False
        return True
`,
    javascript: `class Solution {
    isMagicSquare(matrix) {
        const n = matrix.length;
        if (n <= 1) return true;
        const target = matrix[0].reduce((a, b) => a + b, 0);
        for (let i = 1; i < n; i++) if (matrix[i].reduce((a,b)=>a+b,0) !== target) return false;
        for (let j = 0; j < n; j++) {
            let s = 0; for (let i = 0; i < n; i++) s += matrix[i][j];
            if (s !== target) return false;
        }
        let d1 = 0, d2 = 0;
        for (let i = 0; i < n; i++) { d1 += matrix[i][i]; d2 += matrix[i][n-1-i]; }
        return d1 === target && d2 === target;
    }
}
`,
    java: `class Solution {
    public boolean isMagicSquare(int[][] matrix) {
        int n = matrix.length;
        if (n <= 1) return true;
        int target = 0; for (int x : matrix[0]) target += x;
        for (int i = 1; i < n; i++) { int s = 0; for (int x : matrix[i]) s += x; if (s != target) return false; }
        for (int j = 0; j < n; j++) { int s = 0; for (int i = 0; i < n; i++) s += matrix[i][j]; if (s != target) return false; }
        int d1 = 0, d2 = 0;
        for (int i = 0; i < n; i++) { d1 += matrix[i][i]; d2 += matrix[i][n-1-i]; }
        return d1 == target && d2 == target;
    }
}
`,
    cpp: `#include <vector>
#include <numeric>
using namespace std;
class Solution {
public:
    bool isMagicSquare(vector<vector<int>>& matrix) {
        int n = matrix.size();
        if (n <= 1) return true;
        int target = accumulate(matrix[0].begin(), matrix[0].end(), 0);
        for (int i = 1; i < n; i++) if (accumulate(matrix[i].begin(), matrix[i].end(), 0) != target) return false;
        for (int j = 0; j < n; j++) { int s = 0; for (int i = 0; i < n; i++) s += matrix[i][j]; if (s != target) return false; }
        int d1 = 0, d2 = 0;
        for (int i = 0; i < n; i++) { d1 += matrix[i][i]; d2 += matrix[i][n-1-i]; }
        return d1 == target && d2 == target;
    }
};
`,
  },
});

// 29. matrix-spiral
add({
  id: 'matrix-spiral',
  method_name: 'spiralOrder',
  params: [{ name: 'matrix', type: 'List[List[int]]' }],
  return_type: 'List[int]',
  pattern: 'Layer-by-layer boundary shrink',
  description: '<p>Given an m x n matrix, return all its elements in spiral order (clockwise from the top-left corner).</p>',
  hints: [
    'Maintain four boundaries: top, bottom, left, right.',
    'Walk right across the top row, then down the right column.',
    'If a row/column remains, walk left across the bottom and up the left.',
    'After each side, shrink the corresponding boundary.',
    'Stop when top > bottom or left > right.',
  ],
  test_cases: [
    { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'], expected: '[1,2,3,6,9,8,7,4,5]' },
    { inputs: ['[[1,2,3,4],[5,6,7,8],[9,10,11,12]]'], expected: '[1,2,3,4,8,12,11,10,9,5,6,7]' },
    { inputs: ['[[1]]'], expected: '[1]' },
    { inputs: ['[[1,2],[3,4]]'], expected: '[1,2,4,3]' },
    { inputs: ['[[1,2,3,4,5]]'], expected: '[1,2,3,4,5]' },
    { inputs: ['[[1],[2],[3],[4],[5]]'], expected: '[1,2,3,4,5]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[[1,2,3],[4,5,6]]'], expected: '[1,2,3,6,5,4]' },
    { inputs: ['[[1,2],[3,4],[5,6]]'], expected: '[1,2,4,6,5,3]' },
    { inputs: ['[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]'], expected: '[1,2,3,4,8,12,16,15,14,13,9,5,6,7,11,10]' },
  ],
  editorial_md: `## Intuition
Walking a matrix in spiral order is naturally described as peeling off the outer ring, then recursing into the inner sub-matrix. Iteratively, we keep four boundary indices — \`top\`, \`bottom\`, \`left\`, \`right\` — and walk one edge at a time, shrinking the relevant boundary after each edge.

## Approach
1. Initialise \`top = 0\`, \`bottom = m - 1\`, \`left = 0\`, \`right = n - 1\`.
2. Loop while \`top <= bottom\` and \`left <= right\`:
   - Top edge: emit \`matrix[top][left..right]\`, then \`top++\`.
   - Right edge: emit \`matrix[top..bottom][right]\`, then \`right--\`.
   - If \`top <= bottom\`: bottom edge — emit \`matrix[bottom][right..left]\` (reverse), then \`bottom--\`.
   - If \`left <= right\`: left edge — emit \`matrix[bottom..top][left]\` (reverse), then \`left++\`.
3. The two guards prevent over-emitting on the last row or column of a thin matrix.

## Complexity
- Time: O(m * n) — each cell visited once.
- Space: O(1) extra (output not counted).`,
  solutions: {
    python: `class Solution:
    def spiralOrder(self, matrix):
        if not matrix or not matrix[0]: return []
        m, n = len(matrix), len(matrix[0])
        top, bot, left, right = 0, m - 1, 0, n - 1
        out = []
        while top <= bot and left <= right:
            for j in range(left, right + 1): out.append(matrix[top][j])
            top += 1
            for i in range(top, bot + 1): out.append(matrix[i][right])
            right -= 1
            if top <= bot:
                for j in range(right, left - 1, -1): out.append(matrix[bot][j])
                bot -= 1
            if left <= right:
                for i in range(bot, top - 1, -1): out.append(matrix[i][left])
                left += 1
        return out
`,
    javascript: `class Solution {
    spiralOrder(matrix) {
        if (!matrix.length || !matrix[0].length) return [];
        const m = matrix.length, n = matrix[0].length;
        let top = 0, bot = m - 1, left = 0, right = n - 1;
        const out = [];
        while (top <= bot && left <= right) {
            for (let j = left; j <= right; j++) out.push(matrix[top][j]);
            top++;
            for (let i = top; i <= bot; i++) out.push(matrix[i][right]);
            right--;
            if (top <= bot) { for (let j = right; j >= left; j--) out.push(matrix[bot][j]); bot--; }
            if (left <= right) { for (let i = bot; i >= top; i--) out.push(matrix[i][left]); left++; }
        }
        return out;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int[] spiralOrder(int[][] matrix) {
        if (matrix.length == 0 || matrix[0].length == 0) return new int[0];
        int m = matrix.length, n = matrix[0].length;
        int top = 0, bot = m - 1, left = 0, right = n - 1;
        int[] out = new int[m * n]; int k = 0;
        while (top <= bot && left <= right) {
            for (int j = left; j <= right; j++) out[k++] = matrix[top][j];
            top++;
            for (int i = top; i <= bot; i++) out[k++] = matrix[i][right];
            right--;
            if (top <= bot) { for (int j = right; j >= left; j--) out[k++] = matrix[bot][j]; bot--; }
            if (left <= right) { for (int i = bot; i >= top; i--) out[k++] = matrix[i][left]; left++; }
        }
        return out;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    vector<int> spiralOrder(vector<vector<int>>& matrix) {
        if (matrix.empty() || matrix[0].empty()) return {};
        int m = matrix.size(), n = matrix[0].size();
        int top = 0, bot = m - 1, left = 0, right = n - 1;
        vector<int> out;
        while (top <= bot && left <= right) {
            for (int j = left; j <= right; j++) out.push_back(matrix[top][j]);
            top++;
            for (int i = top; i <= bot; i++) out.push_back(matrix[i][right]);
            right--;
            if (top <= bot) { for (int j = right; j >= left; j--) out.push_back(matrix[bot][j]); bot--; }
            if (left <= right) { for (int i = bot; i >= top; i--) out.push_back(matrix[i][left]); left++; }
        }
        return out;
    }
};
`,
  },
});

// 30. matrix-zig-zag — diagonal traversal (Leetcode 498)
add({
  id: 'matrix-zig-zag',
  method_name: 'findDiagonalOrder',
  params: [{ name: 'mat', type: 'List[List[int]]' }],
  return_type: 'List[int]',
  pattern: 'Anti-diagonal alternating direction',
  description: '<p>Given an m x n matrix, return all its elements in a diagonal "zig-zag" order: traverse diagonals starting from the top-left, alternating direction each diagonal (up-right, then down-left).</p>',
  hints: [
    'Each diagonal d has all cells with i + j = d.',
    'Even diagonals go up-right (i--, j++); odd diagonals go down-left (i++, j--).',
    'Start of an even diagonal: (min(d, m-1), d - min(d, m-1)).',
    'Start of an odd diagonal: (max(0, d - n + 1), min(d, n - 1)).',
    'Walk d from 0 to m + n - 2.',
  ],
  test_cases: [
    { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'], expected: '[1,2,4,7,5,3,6,8,9]' },
    { inputs: ['[[1,2],[3,4]]'], expected: '[1,2,3,4]' },
    { inputs: ['[[1]]'], expected: '[1]' },
    { inputs: ['[[1,2,3]]'], expected: '[1,2,3]' },
    { inputs: ['[[1],[2],[3]]'], expected: '[1,2,3]' },
    { inputs: ['[[1,2,3,4]]'], expected: '[1,2,3,4]' },
    { inputs: ['[[1,2],[3,4],[5,6]]'], expected: '[1,2,3,5,4,6]' },
    { inputs: ['[[1,2,3],[4,5,6]]'], expected: '[1,2,4,5,3,6]' },
    { inputs: ['[[1,2,3,4,5],[6,7,8,9,10],[11,12,13,14,15]]'], expected: '[1,2,6,11,7,3,4,8,12,13,9,5,10,14,15]' },
    { inputs: ['[]'], expected: '[]' },
  ],
  editorial_md: `## Intuition
Cells on a single anti-diagonal share the value \`i + j\`. Walking the matrix in zig-zag order means visiting diagonals in increasing order of that sum, while alternating the direction each diagonal so the cells form a continuous zig-zag.

## Approach
1. If the matrix is empty, return an empty list.
2. Let \`m\` = number of rows, \`n\` = number of columns. Loop \`d\` from 0 to \`m + n - 2\`.
3. For each diagonal \`d\`:
   - If \`d\` is even, start at \`(min(d, m - 1), d - min(d, m - 1))\` and step \`(i--, j++)\` until off the grid.
   - If \`d\` is odd, start at \`(max(0, d - n + 1), min(d, n - 1))\` and step \`(i++, j--)\`.
4. Append every visited cell value.

The traversal touches each cell exactly once.

## Complexity
- Time: O(m * n).
- Space: O(m * n) for the output.`,
  solutions: {
    python: `class Solution:
    def findDiagonalOrder(self, mat):
        if not mat or not mat[0]: return []
        m, n = len(mat), len(mat[0])
        out = []
        for d in range(m + n - 1):
            if d % 2 == 0:
                i = min(d, m - 1); j = d - i
                while i >= 0 and j < n:
                    out.append(mat[i][j]); i -= 1; j += 1
            else:
                j = min(d, n - 1); i = d - j
                while j >= 0 and i < m:
                    out.append(mat[i][j]); i += 1; j -= 1
        return out
`,
    javascript: `class Solution {
    findDiagonalOrder(mat) {
        if (!mat.length || !mat[0].length) return [];
        const m = mat.length, n = mat[0].length, out = [];
        for (let d = 0; d < m + n - 1; d++) {
            if (d % 2 === 0) {
                let i = Math.min(d, m - 1), j = d - i;
                while (i >= 0 && j < n) { out.push(mat[i][j]); i--; j++; }
            } else {
                let j = Math.min(d, n - 1), i = d - j;
                while (j >= 0 && i < m) { out.push(mat[i][j]); i++; j--; }
            }
        }
        return out;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int[] findDiagonalOrder(int[][] mat) {
        if (mat.length == 0 || mat[0].length == 0) return new int[0];
        int m = mat.length, n = mat[0].length;
        int[] out = new int[m * n]; int k = 0;
        for (int d = 0; d < m + n - 1; d++) {
            if (d % 2 == 0) {
                int i = Math.min(d, m - 1), j = d - i;
                while (i >= 0 && j < n) { out[k++] = mat[i][j]; i--; j++; }
            } else {
                int j = Math.min(d, n - 1), i = d - j;
                while (j >= 0 && i < m) { out[k++] = mat[i][j]; i++; j--; }
            }
        }
        return out;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;
class Solution {
public:
    vector<int> findDiagonalOrder(vector<vector<int>>& mat) {
        if (mat.empty() || mat[0].empty()) return {};
        int m = mat.size(), n = mat[0].size();
        vector<int> out;
        for (int d = 0; d < m + n - 1; d++) {
            if (d % 2 == 0) {
                int i = min(d, m - 1), j = d - i;
                while (i >= 0 && j < n) { out.push_back(mat[i][j]); i--; j++; }
            } else {
                int j = min(d, n - 1), i = d - j;
                while (j >= 0 && i < m) { out.push_back(mat[i][j]); i++; j--; }
            }
        }
        return out;
    }
};
`,
  },
});

fs.writeFileSync('/tmp/patch-500-02-part3.json', JSON.stringify(entries, null, 2));
console.log('Wrote part3 with ' + entries.length + ' entries.');
