// Build patch for slice 500-01 (100 problems).
import fs from 'node:fs';

const ED = (intuition, approach, complexity) =>
`## Intuition

${intuition}

## Approach

${approach}

## Complexity

${complexity}`;

const P = [];

// ============================================================================
// 1. common-in-3
// ============================================================================
P.push({
  id: 'common-in-3',
  description: '<p>Given three sorted (non-decreasing) integer arrays <code>a</code>, <code>b</code>, <code>c</code>, return the list of elements that appear in all three. Output sorted ascending, no duplicates.</p>',
  method_name: 'commonInThree',
  params: [
    { name: 'a', type: 'List[int]' },
    { name: 'b', type: 'List[int]' },
    { name: 'c', type: 'List[int]' },
  ],
  return_type: 'List[int]',
  pattern: 'Three Pointers',
  tags: ['arrays', 'two-pointers'],
  hints: [
    'All three arrays are sorted — keep one pointer per array.',
    'If a[i] == b[j] == c[k], record the value and advance all three.',
    'Otherwise advance the pointer of the smallest current element.',
    'Skip duplicates by checking the last value already pushed before appending.',
    'O(n + m + p) time, O(1) extra space beyond output.',
  ],
  editorial_md: ED(
    'Three sorted arrays make a three-pointer sweep the natural fit. Walk in lockstep and always advance whoever lags. When all three pointers meet on the same value, that value is in the answer.',
    'Initialise i = j = k = 0. While none has run out: if a[i] == b[j] == c[k] append to result (skipping duplicates against the last pushed value) and advance all three. Otherwise compute the minimum of the three current values and advance exactly the pointer(s) sitting on that minimum — only those can possibly catch up. The hash-set alternative also works but uses extra memory; the sorted-input invariant lets us avoid it. Edge cases: any empty array returns immediately; runs of duplicates in one array are skipped in bulk; the loop terminates the moment any pointer hits its end. Pairing earliest with earliest is safe: a later element of the smallest can never match the current value the others have already passed.',
    '- Time: O(n + m + p). Each pointer advances forward only.\n- Space: O(1) extra (output excluded).'
  ),
  test_cases: [
    { inputs: ['[1,5,10,20,40,80]', '[6,7,20,80,100]', '[3,4,15,20,30,70,80,120]'], expected: '[20,80]' },
    { inputs: ['[1,5,5]', '[3,4,5,5,10]', '[5,5,10,20]'], expected: '[5]' },
    { inputs: ['[1,2,3]', '[4,5,6]', '[7,8,9]'], expected: '[]' },
    { inputs: ['[]', '[1,2]', '[1,2]'], expected: '[]' },
    { inputs: ['[1,1,1]', '[1,1,1]', '[1,1,1]'], expected: '[1]' },
    { inputs: ['[1,2,3,4,5]', '[2,3,4]', '[3,4,5]'], expected: '[3,4]' },
    { inputs: ['[10]', '[10]', '[10]'], expected: '[10]' },
    { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '[2,4,6,8,10]', '[4,8,12]'], expected: '[4,8]' },
    { inputs: ['[-5,-3,0,1,2]', '[-3,0,2,5]', '[-3,2,2,2]'], expected: '[-3,2]' },
    { inputs: ['[1,2,3]', '[]', '[1,2,3]'], expected: '[]' },
    { inputs: ['[0,0,1,2,3]', '[0,1,2,3]', '[0,1,2,3]'], expected: '[0,1,2,3]' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def commonInThree(self, a: List[int], b: List[int], c: List[int]) -> List[int]:
        i = j = k = 0
        out: List[int] = []
        while i < len(a) and j < len(b) and k < len(c):
            if a[i] == b[j] == c[k]:
                if not out or out[-1] != a[i]:
                    out.append(a[i])
                i += 1; j += 1; k += 1
            else:
                m = min(a[i], b[j], c[k])
                if a[i] == m: i += 1
                if b[j] == m: j += 1
                if c[k] == m: k += 1
        return out
`,
    javascript: `var commonInThree = function(a, b, c) {
    let i = 0, j = 0, k = 0;
    const out = [];
    while (i < a.length && j < b.length && k < c.length) {
        if (a[i] === b[j] && b[j] === c[k]) {
            if (out.length === 0 || out[out.length - 1] !== a[i]) out.push(a[i]);
            i++; j++; k++;
        } else {
            const m = Math.min(a[i], b[j], c[k]);
            if (a[i] === m) i++;
            if (b[j] === m) j++;
            if (c[k] === m) k++;
        }
    }
    return out;
};
`,
    java: `import java.util.*;

class Solution {
    public List<Integer> commonInThree(int[] a, int[] b, int[] c) {
        List<Integer> out = new ArrayList<>();
        int i = 0, j = 0, k = 0;
        while (i < a.length && j < b.length && k < c.length) {
            if (a[i] == b[j] && b[j] == c[k]) {
                if (out.isEmpty() || out.get(out.size() - 1) != a[i]) out.add(a[i]);
                i++; j++; k++;
            } else {
                int m = Math.min(a[i], Math.min(b[j], c[k]));
                if (a[i] == m) i++;
                if (b[j] == m) j++;
                if (c[k] == m) k++;
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
    vector<int> commonInThree(vector<int>& a, vector<int>& b, vector<int>& c) {
        vector<int> out;
        int i = 0, j = 0, k = 0;
        while (i < (int)a.size() && j < (int)b.size() && k < (int)c.size()) {
            if (a[i] == b[j] && b[j] == c[k]) {
                if (out.empty() || out.back() != a[i]) out.push_back(a[i]);
                i++; j++; k++;
            } else {
                int m = min({a[i], b[j], c[k]});
                if (a[i] == m) i++;
                if (b[j] == m) j++;
                if (c[k] == m) k++;
            }
        }
        return out;
    }
};
`,
  },
});

// ============================================================================
// 2. reverse-words
// ============================================================================
P.push({
  id: 'reverse-words',
  description: '<p>Given a string <code>s</code>, reverse the order of words. A word is a maximal run of non-space characters. Collapse internal whitespace to single spaces and trim leading / trailing whitespace.</p>',
  method_name: 'reverseWords',
  params: [{ name: 's', type: 'str' }],
  return_type: 'str',
  pattern: 'Strings',
  tags: ['strings', 'two-pointers'],
  hints: [
    'Split on whitespace, drop empty tokens, reverse, join with single spaces.',
    'Alternative O(1) extra: reverse the whole array, then reverse each word in place.',
    'Compact spaces with a separate write pointer.',
    'Trim leading and trailing spaces before splitting (or skip empty tokens after).',
    'Watch consecutive whitespace runs.',
  ],
  editorial_md: ED(
    'Reversing word order is two transformations stacked: flip the whole string so words appear in reverse position with letters backwards, then flip each word back so letters read forward. Whitespace normalisation is bookkeeping on top.',
    'The cleanest answer splits by whitespace, drops empty tokens, reverses the list, joins with single spaces — O(n) time, O(n) extra. The in-place answer reverses the entire character buffer, then walks it with a read and a write pointer, copying one trimmed word at a time and inserting a single space between words. Strings are immutable in Python and Java, so the in-place trick requires converting to an array first. Either way the result has no leading or trailing whitespace and exactly one space between any two words.',
    '- Time: O(n).\n- Space: O(n) for the token list; O(1) extra for the in-place char-array version.'
  ),
  test_cases: [
    { inputs: ['"the sky is blue"'], expected: '"blue is sky the"' },
    { inputs: ['"  hello world  "'], expected: '"world hello"' },
    { inputs: ['"a good   example"'], expected: '"example good a"' },
    { inputs: ['"single"'], expected: '"single"' },
    { inputs: ['"  "'], expected: '""' },
    { inputs: ['""'], expected: '""' },
    { inputs: ['"a"'], expected: '"a"' },
    { inputs: ['"  hello"'], expected: '"hello"' },
    { inputs: ['"hello  "'], expected: '"hello"' },
    { inputs: ['"a b c d e f"'], expected: '"f e d c b a"' },
    { inputs: ['"  Bob    Loves  Alice   "'], expected: '"Alice Loves Bob"' },
  ],
  solutions: {
    python: `class Solution:
    def reverseWords(self, s: str) -> str:
        return ' '.join(reversed(s.split()))
`,
    javascript: `var reverseWords = function(s) {
    return s.trim().split(/\\s+/).filter(w => w.length > 0).reverse().join(' ');
};
`,
    java: `class Solution {
    public String reverseWords(String s) {
        String[] words = s.trim().split("\\\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = words.length - 1; i >= 0; i--) {
            if (words[i].isEmpty()) continue;
            sb.append(words[i]);
            if (i > 0) sb.append(' ');
        }
        return sb.toString().trim();
    }
}
`,
    cpp: `#include <string>
#include <sstream>
#include <vector>
using namespace std;

class Solution {
public:
    string reverseWords(string s) {
        istringstream iss(s);
        vector<string> words;
        string w;
        while (iss >> w) words.push_back(w);
        string out;
        for (int i = (int)words.size() - 1; i >= 0; i--) {
            if (!out.empty()) out += ' ';
            out += words[i];
        }
        return out;
    }
};
`,
  },
});

// ============================================================================
// 3. policemen-catch-thieves
// ============================================================================
P.push({
  id: 'policemen-catch-thieves',
  description: '<p>Given an array <code>arr</code> of characters where <code>\'P\'</code> is a policeman and <code>\'T\'</code> a thief, plus an integer <code>k</code>, return the maximum thieves that can be caught. A policeman at index i can catch a thief at index j only if <code>|i - j| ≤ k</code>; each police / thief is paired at most once.</p>',
  method_name: 'policeThief',
  params: [
    { name: 'arr', type: 'List[str]' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Two Pointers / Greedy',
  tags: ['arrays', 'two-pointers', 'greedy'],
  hints: [
    'Two queues: one for unpaired police indices, one for unpaired thief indices, both in order.',
    'After every insertion, check the two front elements.',
    'If |police.front() - thieves.front()| ≤ k, pair them and pop both.',
    'If the front pair is too far apart, pop whichever has the smaller index (it can never reach a thief now).',
    'Greedy is safe because the earliest valid pairing never blocks a later one.',
  ],
  editorial_md: ED(
    'The earliest unpaired police should pair with the earliest unpaired thief within range. Holding off in hope of a later match never improves the answer because the pair just dropped both participants out of contention.',
    'Maintain two FIFO queues of indices: one for unpaired police, one for unpaired thieves. Sweep left to right. At each index push to the matching queue. After each push, while both queues are non-empty and the two front indices are farther than k apart, evict whichever has the smaller index (it sits behind the other and can never reach a closer match). If after eviction the two front indices are within k, pop both and increment the catch count. The invariants guarantee correctness: every police index dropped without pairing has no reachable thief; every paired pair is the closest valid pair at the time.',
    '- Time: O(n).\n- Space: O(n) for the queues in the worst case.'
  ),
  test_cases: [
    { inputs: ['["P","T","T","P","T"]', '1'], expected: '2' },
    { inputs: ['["T","T","P","P","T","P"]', '2'], expected: '3' },
    { inputs: ['["P","T","P","T","T","P"]', '3'], expected: '3' },
    { inputs: ['["P"]', '1'], expected: '0' },
    { inputs: ['["T"]', '1'], expected: '0' },
    { inputs: ['["P","P","P","T","T","T"]', '1'], expected: '1' },
    { inputs: ['["P","P","P","T","T","T"]', '3'], expected: '3' },
    { inputs: ['["T","T","T","P","P","P"]', '2'], expected: '2' },
    { inputs: ['["P","T"]', '0'], expected: '0' },
    { inputs: ['["P","T"]', '1'], expected: '1' },
    { inputs: ['["T","P","T","P","T","P","T","P"]', '1'], expected: '4' },
  ],
  solutions: {
    python: `from typing import List
from collections import deque

class Solution:
    def policeThief(self, arr: List[str], k: int) -> int:
        police: deque[int] = deque()
        thieves: deque[int] = deque()
        caught = 0
        for i, ch in enumerate(arr):
            if ch == 'P':
                police.append(i)
            elif ch == 'T':
                thieves.append(i)
            while police and thieves and abs(police[0] - thieves[0]) > k:
                if police[0] < thieves[0]:
                    police.popleft()
                else:
                    thieves.popleft()
            if police and thieves and abs(police[0] - thieves[0]) <= k:
                police.popleft(); thieves.popleft(); caught += 1
        return caught
`,
    javascript: `var policeThief = function(arr, k) {
    const police = [], thieves = [];
    let pi = 0, ti = 0, caught = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === 'P') police.push(i);
        else if (arr[i] === 'T') thieves.push(i);
        while (pi < police.length && ti < thieves.length && Math.abs(police[pi] - thieves[ti]) > k) {
            if (police[pi] < thieves[ti]) pi++;
            else ti++;
        }
        if (pi < police.length && ti < thieves.length && Math.abs(police[pi] - thieves[ti]) <= k) {
            pi++; ti++; caught++;
        }
    }
    return caught;
};
`,
    java: `import java.util.*;

class Solution {
    public int policeThief(String[] arr, int k) {
        Deque<Integer> police = new ArrayDeque<>();
        Deque<Integer> thieves = new ArrayDeque<>();
        int caught = 0;
        for (int i = 0; i < arr.length; i++) {
            if (arr[i].equals("P")) police.add(i);
            else if (arr[i].equals("T")) thieves.add(i);
            while (!police.isEmpty() && !thieves.isEmpty() && Math.abs(police.peek() - thieves.peek()) > k) {
                if (police.peek() < thieves.peek()) police.poll();
                else thieves.poll();
            }
            if (!police.isEmpty() && !thieves.isEmpty() && Math.abs(police.peek() - thieves.peek()) <= k) {
                police.poll(); thieves.poll(); caught++;
            }
        }
        return caught;
    }
}
`,
    cpp: `#include <vector>
#include <deque>
#include <string>
#include <cstdlib>
using namespace std;

class Solution {
public:
    int policeThief(vector<string>& arr, int k) {
        deque<int> police, thieves;
        int caught = 0;
        for (int i = 0; i < (int)arr.size(); i++) {
            if (arr[i] == "P") police.push_back(i);
            else if (arr[i] == "T") thieves.push_back(i);
            while (!police.empty() && !thieves.empty() && abs(police.front() - thieves.front()) > k) {
                if (police.front() < thieves.front()) police.pop_front();
                else thieves.pop_front();
            }
            if (!police.empty() && !thieves.empty() && abs(police.front() - thieves.front()) <= k) {
                police.pop_front(); thieves.pop_front(); caught++;
            }
        }
        return caught;
    }
};
`,
  },
});

// ============================================================================
// 4. short-encoding-words
// ============================================================================
P.push({
  id: 'short-encoding-words',
  method_name: 'minimumLengthEncoding',
  params: [{ name: 'words', type: 'List[str]' }],
  return_type: 'int',
  pattern: 'Trie / Suffix',
  tags: ['trie', 'strings', 'hash-table'],
  hints: [
    'A word only contributes if no other word ends with it as a suffix.',
    'Insert each word reversed into a trie — only leaf nodes contribute (depth + 1).',
    'Set-based: start with set(words), then erase every proper suffix of every word.',
    'Each survivor contributes len(word) + 1.',
    'Dedupe early — duplicates encode the same way.',
  ],
  editorial_md: ED(
    'A word is redundant in the encoding when another word has it as a suffix — they can share the same position. Only the words that are nobody\'s suffix matter.',
    'Two clean approaches. (1) Reverse trie: insert each word reversed, then every leaf is a non-redundant word; sum depth + 1 across leaves. (2) Hash set: start with the set of all words, then for every word remove every proper suffix; survivors are exactly the non-redundant words. Sum len(w) + 1 over survivors. The trie approach is O(total characters); the set approach is O(total chars²) worst case but five lines of code. Duplicates fall out automatically thanks to dedup.',
    '- Time: O(N·L) trie / O(N·L²) set-based.\n- Space: O(N·L).'
  ),
  test_cases: [
    { inputs: ['["time","me","bell"]'], expected: '10' },
    { inputs: ['["t"]'], expected: '2' },
    { inputs: ['["me","time"]'], expected: '5' },
    { inputs: ['["abc","bc","c"]'], expected: '4' },
    { inputs: ['["a"]'], expected: '2' },
    { inputs: ['["a","b","c"]'], expected: '6' },
    { inputs: ['["abc","abc","abc"]'], expected: '4' },
    { inputs: ['["hello","ohello"]'], expected: '7' },
    { inputs: ['["feipyxx","e"]'], expected: '10' },
    { inputs: ['["time","atime","btime"]'], expected: '12' },
    { inputs: ['["dog","cat","fish"]'], expected: '13' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def minimumLengthEncoding(self, words: List[str]) -> int:
        good = set(words)
        for w in words:
            for i in range(1, len(w)):
                good.discard(w[i:])
        return sum(len(w) + 1 for w in good)
`,
    javascript: `var minimumLengthEncoding = function(words) {
    const good = new Set(words);
    for (const w of words) {
        for (let i = 1; i < w.length; i++) good.delete(w.slice(i));
    }
    let total = 0;
    for (const w of good) total += w.length + 1;
    return total;
};
`,
    java: `import java.util.*;

class Solution {
    public int minimumLengthEncoding(String[] words) {
        Set<String> good = new HashSet<>(Arrays.asList(words));
        for (String w : words) {
            for (int i = 1; i < w.length(); i++) good.remove(w.substring(i));
        }
        int total = 0;
        for (String w : good) total += w.length() + 1;
        return total;
    }
}
`,
    cpp: `#include <vector>
#include <string>
#include <unordered_set>
using namespace std;

class Solution {
public:
    int minimumLengthEncoding(vector<string>& words) {
        unordered_set<string> good(words.begin(), words.end());
        for (const auto& w : words) {
            for (int i = 1; i < (int)w.size(); i++) good.erase(w.substr(i));
        }
        int total = 0;
        for (const auto& w : good) total += (int)w.size() + 1;
        return total;
    }
};
`,
  },
});

// ============================================================================
// 5. dungeon-game-2d
// ============================================================================
P.push({
  id: 'dungeon-game-2d',
  method_name: 'calculateMinimumHP',
  params: [{ name: 'dungeon', type: 'List[List[int]]' }],
  return_type: 'int',
  pattern: 'DP (reverse)',
  tags: ['dp', 'matrix'],
  hints: [
    'Forward DP fails because max total HP doesn\'t determine future min HP need.',
    'DP backwards from the princess cell.',
    'dp[i][j] = min HP required entering (i, j) to safely reach the goal.',
    'dp[i][j] = max(1, min(dp[i+1][j], dp[i][j+1]) - dungeon[i][j]).',
    'Clamp to ≥1 — HP must stay positive.',
  ],
  editorial_md: ED(
    'A forward DP storing accumulated HP loses information: two cells reaching the same total can have wildly different minimum HP histories. Reversing the recurrence — "how much HP do I need entering this cell?" — fixes that.',
    'Let dp[i][j] be the minimum positive HP needed on entering cell (i,j) to reach the princess. Base case: at the princess cell, dp[m-1][n-1] = max(1, 1 - dungeon[m-1][n-1]) — must have at least 1 HP after applying that cell. General step: from (i,j) the knight picks the cheaper of down or right next, so dp[i][j] = max(1, min(dp[i+1][j], dp[i][j+1]) - dungeon[i][j]). max(1, ·) clamps because HP must stay ≥ 1 the whole journey. Answer is dp[0][0]. A rolling row reduces space to O(n).',
    '- Time: O(m·n).\n- Space: O(m·n), or O(n) rolling.'
  ),
  test_cases: [
    { inputs: ['[[-2,-3,3],[-5,-10,1],[10,30,-5]]'], expected: '7' },
    { inputs: ['[[0]]'], expected: '1' },
    { inputs: ['[[-3]]'], expected: '4' },
    { inputs: ['[[1,-3,3],[0,-2,0],[-3,-3,-3]]'], expected: '3' },
    { inputs: ['[[1,1,1],[1,1,1],[1,1,1]]'], expected: '1' },
    { inputs: ['[[-1,-2],[-3,-4]]'], expected: '7' },
    { inputs: ['[[100]]'], expected: '1' },
    { inputs: ['[[-100]]'], expected: '101' },
    { inputs: ['[[0,0,0],[0,0,0],[0,0,0]]'], expected: '1' },
    { inputs: ['[[-1,1],[1,-1]]'], expected: '1' },
    { inputs: ['[[2,3,3],[5,-10,1],[10,30,-5]]'], expected: '1' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def calculateMinimumHP(self, dungeon: List[List[int]]) -> int:
        m, n = len(dungeon), len(dungeon[0])
        INF = float('inf')
        dp = [INF] * (n + 1)
        dp[n - 1] = 1
        for i in range(m - 1, -1, -1):
            new = [INF] * (n + 1)
            for j in range(n - 1, -1, -1):
                need = min(dp[j], new[j + 1]) - dungeon[i][j]
                new[j] = max(1, need)
            dp = new
        return dp[0]
`,
    javascript: `var calculateMinimumHP = function(dungeon) {
    const m = dungeon.length, n = dungeon[0].length;
    let dp = new Array(n + 1).fill(Infinity);
    dp[n - 1] = 1;
    for (let i = m - 1; i >= 0; i--) {
        const next = new Array(n + 1).fill(Infinity);
        for (let j = n - 1; j >= 0; j--) {
            const need = Math.min(dp[j], next[j + 1]) - dungeon[i][j];
            next[j] = Math.max(1, need);
        }
        dp = next;
    }
    return dp[0];
};
`,
    java: `class Solution {
    public int calculateMinimumHP(int[][] dungeon) {
        int m = dungeon.length, n = dungeon[0].length;
        int[] dp = new int[n + 1];
        java.util.Arrays.fill(dp, Integer.MAX_VALUE);
        dp[n - 1] = 1;
        for (int i = m - 1; i >= 0; i--) {
            int[] next = new int[n + 1];
            java.util.Arrays.fill(next, Integer.MAX_VALUE);
            for (int j = n - 1; j >= 0; j--) {
                int need = Math.min(dp[j], next[j + 1]) - dungeon[i][j];
                next[j] = Math.max(1, need);
            }
            dp = next;
        }
        return dp[0];
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

class Solution {
public:
    int calculateMinimumHP(vector<vector<int>>& dungeon) {
        int m = dungeon.size(), n = dungeon[0].size();
        vector<int> dp(n + 1, INT_MAX);
        dp[n - 1] = 1;
        for (int i = m - 1; i >= 0; i--) {
            vector<int> next(n + 1, INT_MAX);
            for (int j = n - 1; j >= 0; j--) {
                int need = min(dp[j], next[j + 1]) - dungeon[i][j];
                next[j] = max(1, need);
            }
            dp = next;
        }
        return dp[0];
    }
};
`,
  },
});

// ============================================================================
// 6. k-closest (closest K elements to a target in a sorted array)
// ============================================================================
P.push({
  id: 'k-closest',
  description: '<p>Given a sorted integer array <code>arr</code>, an integer <code>k</code>, and an integer <code>x</code>, return the <code>k</code> closest elements to <code>x</code> in <code>arr</code>. The result must itself be sorted ascending. Closeness ties break to the smaller value.</p>',
  method_name: 'findClosestElements',
  params: [
    { name: 'arr', type: 'List[int]' },
    { name: 'k', type: 'int' },
    { name: 'x', type: 'int' },
  ],
  return_type: 'List[int]',
  pattern: 'Binary Search / Two Pointers',
  tags: ['arrays', 'binary-search', 'two-pointers'],
  hints: [
    'Result is always a contiguous window of size k in the sorted array.',
    'Binary-search the left edge of that window over indices 0..n-k.',
    'Compare arr[mid] vs arr[mid + k]: pick the side closer to x.',
    'Alternative: two-pointer shrink from both ends until exactly k remain.',
    'Tie-break by smaller value, so use <= when comparing distances.',
  ],
  editorial_md: ED(
    'In a sorted array, the k closest values to x are always contiguous. So the answer is "which window of size k?" — and binary search over the left edge of that window solves it in O(log(n - k)).',
    'Search the left edge L over 0..n-k. At mid, compare arr[mid] (window left) against arr[mid + k] (the element just past the window\'s right end). If x - arr[mid] > arr[mid + k] - x, the window should slide right (left edge should be larger), so set lo = mid + 1. Otherwise set hi = mid. When lo == hi, that\'s the optimal left edge. Slice arr[lo .. lo+k]. The tie-breaking goes to the smaller value, which falls out naturally because we use > rather than >=: equal distances pick the left side. The two-pointer alternative starts with lo = 0, hi = n - 1 and shrinks the farther endpoint until hi - lo + 1 == k; same answer, O(n - k) time.',
    '- Time: O(log(n - k) + k) for binary search, O(n - k) for two pointers.\n- Space: O(k) output.'
  ),
  test_cases: [
    { inputs: ['[1,2,3,4,5]', '4', '3'], expected: '[1,2,3,4]' },
    { inputs: ['[1,2,3,4,5]', '4', '-1'], expected: '[1,2,3,4]' },
    { inputs: ['[1,1,1,10,10,10]', '1', '9'], expected: '[10]' },
    { inputs: ['[1]', '1', '1'], expected: '[1]' },
    { inputs: ['[1,2,3,4,5]', '3', '3'], expected: '[2,3,4]' },
    { inputs: ['[1,3]', '1', '2'], expected: '[1]' },
    { inputs: ['[0,1,1,1,2,3,6,7,8,9]', '9', '4'], expected: '[0,1,1,1,2,3,6,7,8]' },
    { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '5', '5'], expected: '[3,4,5,6,7]' },
    { inputs: ['[1,2,3,4,5]', '5', '100'], expected: '[1,2,3,4,5]' },
    { inputs: ['[1,2,3,4,5]', '5', '-100'], expected: '[1,2,3,4,5]' },
    { inputs: ['[-2,-1,1,2,3,4,5]', '3', '0'], expected: '[-1,1,2]' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def findClosestElements(self, arr: List[int], k: int, x: int) -> List[int]:
        lo, hi = 0, len(arr) - k
        while lo < hi:
            mid = (lo + hi) // 2
            if x - arr[mid] > arr[mid + k] - x:
                lo = mid + 1
            else:
                hi = mid
        return arr[lo:lo + k]
`,
    javascript: `var findClosestElements = function(arr, k, x) {
    let lo = 0, hi = arr.length - k;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (x - arr[mid] > arr[mid + k] - x) lo = mid + 1;
        else hi = mid;
    }
    return arr.slice(lo, lo + k);
};
`,
    java: `import java.util.*;

class Solution {
    public List<Integer> findClosestElements(int[] arr, int k, int x) {
        int lo = 0, hi = arr.length - k;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (x - arr[mid] > arr[mid + k] - x) lo = mid + 1;
            else hi = mid;
        }
        List<Integer> out = new ArrayList<>();
        for (int i = lo; i < lo + k; i++) out.add(arr[i]);
        return out;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> findClosestElements(vector<int>& arr, int k, int x) {
        int lo = 0, hi = (int)arr.size() - k;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (x - arr[mid] > arr[mid + k] - x) lo = mid + 1;
            else hi = mid;
        }
        return vector<int>(arr.begin() + lo, arr.begin() + lo + k);
    }
};
`,
  },
});

// ============================================================================
// 7. search-in-almost-sorted (each element may be displaced by ±1)
// ============================================================================
P.push({
  id: 'search-in-almost-sorted',
  description: '<p>An array is "almost sorted" — every element appears within ±1 of its correct sorted position. Given such an array <code>arr</code> and an integer <code>target</code>, return any index of <code>target</code> or <code>-1</code>.</p>',
  method_name: 'findInAlmostSorted',
  params: [
    { name: 'arr', type: 'List[int]' },
    { name: 'target', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Binary Search',
  tags: ['arrays', 'binary-search'],
  hints: [
    'Modified binary search — check arr[mid-1], arr[mid], arr[mid+1].',
    'If none match, descend like a normal binary search but jump in steps of 2.',
    'lo = mid + 2 or hi = mid - 2 to skip the already-checked neighbours.',
    'Termination is the same as standard binary search.',
    'O(log n) time, O(1) space.',
  ],
  editorial_md: ED(
    'The displacement rule guarantees the value at position p is one of arr[p-1], arr[p], arr[p+1]. So at each step compare against three positions around the midpoint; on a miss, the target still respects sorted order broadly, so jump in steps of 2 to skip the cells just checked.',
    'Standard binary search with two tweaks. At mid, compare arr[mid] to target — return mid on match. Also check arr[mid - 1] and arr[mid + 1] (bounds-guarded), returning those indices on match. Otherwise compare target with arr[mid] to decide direction, then set lo = mid + 2 or hi = mid - 2 to skip the neighbour cells already inspected. The search space still halves each iteration, so the runtime stays logarithmic.',
    '- Time: O(log n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[3,2,10,4,40]', '4'], expected: '3' },
    { inputs: ['[3,2,10,4,40]', '10'], expected: '2' },
    { inputs: ['[3,2,10,4,40]', '40'], expected: '4' },
    { inputs: ['[3,2,10,4,40]', '3'], expected: '0' },
    { inputs: ['[3,2,10,4,40]', '2'], expected: '1' },
    { inputs: ['[3,2,10,4,40]', '99'], expected: '-1' },
    { inputs: ['[10,3,40,20,50,80,70]', '40'], expected: '2' },
    { inputs: ['[10,3,40,20,50,80,70]', '90'], expected: '-1' },
    { inputs: ['[1]', '1'], expected: '0' },
    { inputs: ['[1]', '2'], expected: '-1' },
    { inputs: ['[2,1]', '1'], expected: '1' },
    { inputs: ['[2,1]', '2'], expected: '0' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def findInAlmostSorted(self, arr: List[int], target: int) -> int:
        lo, hi = 0, len(arr) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if arr[mid] == target: return mid
            if mid - 1 >= lo and arr[mid - 1] == target: return mid - 1
            if mid + 1 <= hi and arr[mid + 1] == target: return mid + 1
            if target < arr[mid]:
                hi = mid - 2
            else:
                lo = mid + 2
        return -1
`,
    javascript: `var findInAlmostSorted = function(arr, target) {
    let lo = 0, hi = arr.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid] === target) return mid;
        if (mid - 1 >= lo && arr[mid - 1] === target) return mid - 1;
        if (mid + 1 <= hi && arr[mid + 1] === target) return mid + 1;
        if (target < arr[mid]) hi = mid - 2;
        else lo = mid + 2;
    }
    return -1;
};
`,
    java: `class Solution {
    public int findInAlmostSorted(int[] arr, int target) {
        int lo = 0, hi = arr.length - 1;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;
            if (arr[mid] == target) return mid;
            if (mid - 1 >= lo && arr[mid - 1] == target) return mid - 1;
            if (mid + 1 <= hi && arr[mid + 1] == target) return mid + 1;
            if (target < arr[mid]) hi = mid - 2;
            else lo = mid + 2;
        }
        return -1;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int findInAlmostSorted(vector<int>& arr, int target) {
        int lo = 0, hi = (int)arr.size() - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (arr[mid] == target) return mid;
            if (mid - 1 >= lo && arr[mid - 1] == target) return mid - 1;
            if (mid + 1 <= hi && arr[mid + 1] == target) return mid + 1;
            if (target < arr[mid]) hi = mid - 2;
            else lo = mid + 2;
        }
        return -1;
    }
};
`,
  },
});

// ============================================================================
// 8. peak (find a peak element in a 1D array)
// ============================================================================
P.push({
  id: 'peak',
  description: '<p>A peak element is one strictly greater than its neighbours. Given an integer array <code>nums</code> where <code>nums[i] != nums[i+1]</code> for all valid i, find any peak element\'s index. Conceptually treat <code>nums[-1]</code> and <code>nums[n]</code> as <code>-∞</code>. Solve in O(log n).</p>',
  method_name: 'findPeakElement',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Binary Search',
  tags: ['arrays', 'binary-search'],
  hints: [
    'Compare nums[mid] with nums[mid + 1].',
    'If nums[mid] > nums[mid + 1], a peak lies in [lo, mid].',
    'Otherwise a peak lies in (mid, hi].',
    'Loop ends with lo == hi, the peak index.',
    'No need to check both sides — strict inequality plus sentinels guarantee a peak exists.',
  ],
  editorial_md: ED(
    'If you step in the direction the function is increasing, you must eventually hit a peak — values can\'t increase forever inside the array, and the sentinels at both ends are -∞ so a peak always exists. Binary search exploits that monotone-direction signal at the midpoint.',
    'lo = 0, hi = n - 1. While lo < hi compute mid = (lo + hi) // 2. If nums[mid] > nums[mid + 1], the slope from mid to mid + 1 is descending, so a peak exists in [lo, mid] — set hi = mid. Else the slope is ascending, so a peak exists in (mid, hi] — set lo = mid + 1. Loop ends with lo == hi pointing at a peak. No equality case is needed because adjacent values are required to differ.',
    '- Time: O(log n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[1,2,3,1]'], expected: '2' },
    { inputs: ['[1,2,1,3,5,6,4]'], expected: '5' },
    { inputs: ['[1]'], expected: '0' },
    { inputs: ['[1,2]'], expected: '1' },
    { inputs: ['[2,1]'], expected: '0' },
    { inputs: ['[1,2,3,4,5]'], expected: '4' },
    { inputs: ['[5,4,3,2,1]'], expected: '0' },
    { inputs: ['[1,3,2]'], expected: '1' },
    { inputs: ['[-1,-2,-3,-4]'], expected: '0' },
    { inputs: ['[1,2,3,2,1,2,3,2,1]'], expected: '2' },
    { inputs: ['[10,9,8,7,6,5,4,3,2,1]'], expected: '0' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def findPeakElement(self, nums: List[int]) -> int:
        lo, hi = 0, len(nums) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if nums[mid] > nums[mid + 1]:
                hi = mid
            else:
                lo = mid + 1
        return lo
`,
    javascript: `var findPeakElement = function(nums) {
    let lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] > nums[mid + 1]) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};
`,
    java: `class Solution {
    public int findPeakElement(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] > nums[mid + 1]) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int findPeakElement(vector<int>& nums) {
        int lo = 0, hi = (int)nums.size() - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] > nums[mid + 1]) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
`,
  },
});

// ============================================================================
// 9. valid-boomerang
// ============================================================================
P.push({
  id: 'valid-boomerang',
  method_name: 'isBoomerang',
  params: [{ name: 'points', type: 'List[List[int]]' }],
  return_type: 'bool',
  pattern: 'Geometry',
  tags: ['math', 'geometry'],
  hints: [
    'Three points form a boomerang iff they are distinct and not collinear.',
    'Collinearity check: (y2 - y1) * (x3 - x1) == (y3 - y1) * (x2 - x1).',
    'Cross product zero means collinear.',
    'No division — use the cross-product form to avoid divide-by-zero / float issues.',
    'Constant time, constant space.',
  ],
  editorial_md: ED(
    'Three points are non-collinear exactly when the vector from the first to the second is not parallel to the vector from the first to the third. The cleanest parallelism test is the 2D cross product.',
    'Compute the cross product of (p1 - p0) and (p2 - p0): (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0). It is zero iff the three points lie on a line. To stay in integer arithmetic and dodge slope divisions, just check that this cross product is non-zero. Distinctness is implied: if any two points coincide, the cross product vanishes too. So the entire check collapses to one expression.',
    '- Time: O(1).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[[1,1],[2,3],[3,2]]'], expected: 'true' },
    { inputs: ['[[1,1],[2,2],[3,3]]'], expected: 'false' },
    { inputs: ['[[0,0],[1,0],[0,1]]'], expected: 'true' },
    { inputs: ['[[0,0],[0,0],[1,1]]'], expected: 'false' },
    { inputs: ['[[1,2],[3,4],[5,6]]'], expected: 'false' },
    { inputs: ['[[0,0],[0,2],[2,0]]'], expected: 'true' },
    { inputs: ['[[1,1],[1,2],[2,1]]'], expected: 'true' },
    { inputs: ['[[10,10],[20,20],[30,30]]'], expected: 'false' },
    { inputs: ['[[0,0],[1,1],[2,3]]'], expected: 'true' },
    { inputs: ['[[5,5],[5,5],[5,5]]'], expected: 'false' },
    { inputs: ['[[-1,-1],[0,0],[1,1]]'], expected: 'false' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def isBoomerang(self, points: List[List[int]]) -> bool:
        (x0, y0), (x1, y1), (x2, y2) = points
        return (x1 - x0) * (y2 - y0) != (y1 - y0) * (x2 - x0)
`,
    javascript: `var isBoomerang = function(points) {
    const [[x0,y0],[x1,y1],[x2,y2]] = points;
    return (x1 - x0) * (y2 - y0) !== (y1 - y0) * (x2 - x0);
};
`,
    java: `class Solution {
    public boolean isBoomerang(int[][] points) {
        int x0=points[0][0], y0=points[0][1];
        int x1=points[1][0], y1=points[1][1];
        int x2=points[2][0], y2=points[2][1];
        return (x1-x0)*(y2-y0) != (y1-y0)*(x2-x0);
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    bool isBoomerang(vector<vector<int>>& points) {
        int x0=points[0][0], y0=points[0][1];
        int x1=points[1][0], y1=points[1][1];
        int x2=points[2][0], y2=points[2][1];
        return (x1-x0)*(y2-y0) != (y1-y0)*(x2-x0);
    }
};
`,
  },
});

// ============================================================================
// 10. projection-area-of-3d-shapes
// ============================================================================
P.push({
  id: 'projection-area-of-3d-shapes',
  method_name: 'projectionArea',
  params: [{ name: 'grid', type: 'List[List[int]]' }],
  return_type: 'int',
  pattern: 'Matrix / Counting',
  tags: ['matrix', 'math'],
  hints: [
    'Top projection: count cells with height > 0.',
    'Front projection: max of each column (sum across columns).',
    'Side projection: max of each row (sum across rows).',
    'Total = top + front + side.',
    'Single O(n²) pass tracks all three sums simultaneously.',
  ],
  editorial_md: ED(
    'Each axis-aligned projection only sees one number per row/column/cell. The top view is silhouette area — any non-empty stack counts as 1. The two side views collapse columns / rows to their maximum tower height.',
    'Walk the grid once. Track three sums: top (incremented for every cell whose height is positive), row_max (running max per row, added once per row), col_max (running max per column, added once at the end). Returning top + sum(row_max) + sum(col_max) gives the answer. Implementation tracks `rowMax[i]` inline by resetting per row, and `colMax[j]` by maintaining an array and summing at the end.',
    '- Time: O(n²).\n- Space: O(n) for the column-max array.'
  ),
  test_cases: [
    { inputs: ['[[1,2],[3,4]]'], expected: '17' },
    { inputs: ['[[2]]'], expected: '5' },
    { inputs: ['[[1,0],[0,2]]'], expected: '8' },
    { inputs: ['[[0]]'], expected: '0' },
    { inputs: ['[[1,1,1],[1,1,1],[1,1,1]]'], expected: '15' },
    { inputs: ['[[0,0,0],[0,0,0],[0,0,0]]'], expected: '0' },
    { inputs: ['[[5,0],[0,5]]'], expected: '22' },
    { inputs: ['[[1,0,0],[0,2,0],[0,0,3]]'], expected: '15' },
    { inputs: ['[[2,2,2],[2,1,2],[2,2,2]]'], expected: '21' },
    { inputs: ['[[1]]'], expected: '3' },
    { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'], expected: '45' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def projectionArea(self, grid: List[List[int]]) -> int:
        n = len(grid)
        top = 0
        row_max = [0] * n
        col_max = [0] * n
        for i in range(n):
            for j in range(n):
                v = grid[i][j]
                if v > 0: top += 1
                if v > row_max[i]: row_max[i] = v
                if v > col_max[j]: col_max[j] = v
        return top + sum(row_max) + sum(col_max)
`,
    javascript: `var projectionArea = function(grid) {
    const n = grid.length;
    let top = 0;
    const rowMax = new Array(n).fill(0);
    const colMax = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const v = grid[i][j];
            if (v > 0) top++;
            if (v > rowMax[i]) rowMax[i] = v;
            if (v > colMax[j]) colMax[j] = v;
        }
    }
    let s = top;
    for (let i = 0; i < n; i++) s += rowMax[i] + colMax[i];
    return s;
};
`,
    java: `class Solution {
    public int projectionArea(int[][] grid) {
        int n = grid.length, top = 0;
        int[] rowMax = new int[n];
        int[] colMax = new int[n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                int v = grid[i][j];
                if (v > 0) top++;
                if (v > rowMax[i]) rowMax[i] = v;
                if (v > colMax[j]) colMax[j] = v;
            }
        }
        int s = top;
        for (int i = 0; i < n; i++) s += rowMax[i] + colMax[i];
        return s;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int projectionArea(vector<vector<int>>& grid) {
        int n = grid.size(), top = 0;
        vector<int> rowMax(n, 0), colMax(n, 0);
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                int v = grid[i][j];
                if (v > 0) top++;
                if (v > rowMax[i]) rowMax[i] = v;
                if (v > colMax[j]) colMax[j] = v;
            }
        }
        int s = top;
        for (int i = 0; i < n; i++) s += rowMax[i] + colMax[i];
        return s;
    }
};
`,
  },
});

// ============================================================================
// 11. minimum-time-visiting-all-points
// ============================================================================
P.push({
  id: 'minimum-time-visiting-all-points',
  method_name: 'minTimeToVisitAllPoints',
  params: [{ name: 'points', type: 'List[List[int]]' }],
  return_type: 'int',
  pattern: 'Geometry / Chebyshev Distance',
  tags: ['math', 'geometry', 'arrays'],
  hints: [
    'Each step you can move 1 unit in 8 directions.',
    'Chebyshev distance between two points = max(|dx|, |dy|).',
    'Sum Chebyshev distances between consecutive points.',
    'Diagonal moves cover both axes simultaneously.',
    'Linear pass over the points.',
  ],
  editorial_md: ED(
    'You can move diagonally, so the time to go from A to B is bounded below by the larger axis-distance. Diagonals cover the smaller axis "for free" while you chip away at the larger.',
    'Between consecutive points, the optimal travel time is the Chebyshev distance: max(|x2 - x1|, |y2 - y1|). Diagonals reduce both deltas by 1 simultaneously until one delta is gone, then axis-aligned moves finish off the other. Sum these distances along the trajectory and that is the total minimum time. One linear pass over the points list.',
    '- Time: O(n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[[1,1],[3,4],[-1,0]]'], expected: '7' },
    { inputs: ['[[3,2],[-2,2]]'], expected: '5' },
    { inputs: ['[[0,0]]'], expected: '0' },
    { inputs: ['[[1,1],[1,1]]'], expected: '0' },
    { inputs: ['[[0,0],[5,5]]'], expected: '5' },
    { inputs: ['[[0,0],[5,0]]'], expected: '5' },
    { inputs: ['[[0,0],[0,5]]'], expected: '5' },
    { inputs: ['[[1,0],[2,0],[3,0],[4,0]]'], expected: '3' },
    { inputs: ['[[1,1],[2,2],[3,3],[4,4]]'], expected: '3' },
    { inputs: ['[[-1,-1],[1,1],[-1,1],[1,-1]]'], expected: '6' },
    { inputs: ['[[10,10],[20,20],[30,15]]'], expected: '20' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def minTimeToVisitAllPoints(self, points: List[List[int]]) -> int:
        total = 0
        for i in range(1, len(points)):
            x1, y1 = points[i - 1]
            x2, y2 = points[i]
            total += max(abs(x2 - x1), abs(y2 - y1))
        return total
`,
    javascript: `var minTimeToVisitAllPoints = function(points) {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
        const dx = Math.abs(points[i][0] - points[i-1][0]);
        const dy = Math.abs(points[i][1] - points[i-1][1]);
        total += Math.max(dx, dy);
    }
    return total;
};
`,
    java: `class Solution {
    public int minTimeToVisitAllPoints(int[][] points) {
        int total = 0;
        for (int i = 1; i < points.length; i++) {
            int dx = Math.abs(points[i][0] - points[i-1][0]);
            int dy = Math.abs(points[i][1] - points[i-1][1]);
            total += Math.max(dx, dy);
        }
        return total;
    }
}
`,
    cpp: `#include <vector>
#include <cstdlib>
#include <algorithm>
using namespace std;

class Solution {
public:
    int minTimeToVisitAllPoints(vector<vector<int>>& points) {
        int total = 0;
        for (int i = 1; i < (int)points.size(); i++) {
            int dx = abs(points[i][0] - points[i-1][0]);
            int dy = abs(points[i][1] - points[i-1][1]);
            total += max(dx, dy);
        }
        return total;
    }
};
`,
  },
});

// ============================================================================
// 12. peak-in-2d
// ============================================================================
P.push({
  id: 'peak-in-2d',
  description: '<p>A peak in a 2D grid is a cell strictly greater than its four neighbours (treat out-of-bounds as -∞). Given <code>mat</code>, return any peak\'s coordinates as <code>[i, j]</code>. Solve in O(m log n).</p>',
  method_name: 'findPeakGrid',
  params: [{ name: 'mat', type: 'List[List[int]]' }],
  return_type: 'List[int]',
  pattern: 'Binary Search (2D)',
  tags: ['matrix', 'binary-search'],
  hints: [
    'Binary search over columns.',
    'For the middle column, find the row index of the global max in that column.',
    'Compare that cell to its left neighbour to decide which half holds a peak.',
    'A peak inside the strip projects to a peak after halving, so the invariant holds.',
    'Loop ends with lo == hi; return the row of the max in that column.',
  ],
  editorial_md: ED(
    'Pick the middle column. Find the row index of the largest value in that column — call it (r, mid). If that cell is greater than both side neighbours, it is a peak. Otherwise step in the direction of the larger neighbour; the rectangle on that side contains a peak by an induction argument.',
    'lo, hi = 0, n - 1. While lo <= hi compute mid = (lo + hi) // 2. Scan column mid to find the row r with the maximum value. Check left and right neighbours (treating out-of-bounds as -∞). If mat[r][mid] is greater than both, return [r, mid]. Otherwise step toward the larger side: if the right is bigger, lo = mid + 1, else hi = mid - 1. The induction works because the maximum element of any rectangular subgrid is a peak — and choosing the max along a column ensures the next subgrid still contains the local-max chain.',
    '- Time: O(m log n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[[1,4],[3,2]]'], expected: '[0,1]' },
    { inputs: ['[[10,20,15],[21,30,14],[7,16,32]]'], expected: '[2,2]' },
    { inputs: ['[[1]]'], expected: '[0,0]' },
    { inputs: ['[[1,2,3,4,5]]'], expected: '[0,4]' },
    { inputs: ['[[5,4,3,2,1]]'], expected: '[0,0]' },
    { inputs: ['[[1],[2],[3],[4],[5]]'], expected: '[4,0]' },
    { inputs: ['[[5],[4],[3],[2],[1]]'], expected: '[0,0]' },
    { inputs: ['[[1,2,1],[2,3,2],[1,2,1]]'], expected: '[1,1]' },
    { inputs: ['[[10,9],[8,7]]'], expected: '[0,0]' },
    { inputs: ['[[1,2],[3,4]]'], expected: '[1,1]' },
    { inputs: ['[[100,50,40,30,20],[1,2,3,4,5]]'], expected: '[0,0]' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def findPeakGrid(self, mat: List[List[int]]) -> List[int]:
        m, n = len(mat), len(mat[0])
        lo, hi = 0, n - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            r = 0
            for i in range(m):
                if mat[i][mid] > mat[r][mid]:
                    r = i
            left = mat[r][mid - 1] if mid - 1 >= 0 else -1
            right = mat[r][mid + 1] if mid + 1 < n else -1
            if mat[r][mid] >= left and mat[r][mid] >= right:
                return [r, mid]
            if right > mat[r][mid]:
                lo = mid + 1
            else:
                hi = mid - 1
        return [-1, -1]
`,
    javascript: `var findPeakGrid = function(mat) {
    const m = mat.length, n = mat[0].length;
    let lo = 0, hi = n - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        let r = 0;
        for (let i = 0; i < m; i++) if (mat[i][mid] > mat[r][mid]) r = i;
        const left = mid - 1 >= 0 ? mat[r][mid - 1] : -1;
        const right = mid + 1 < n ? mat[r][mid + 1] : -1;
        if (mat[r][mid] >= left && mat[r][mid] >= right) return [r, mid];
        if (right > mat[r][mid]) lo = mid + 1;
        else hi = mid - 1;
    }
    return [-1, -1];
};
`,
    java: `import java.util.*;

class Solution {
    public int[] findPeakGrid(int[][] mat) {
        int m = mat.length, n = mat[0].length;
        int lo = 0, hi = n - 1;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;
            int r = 0;
            for (int i = 0; i < m; i++) if (mat[i][mid] > mat[r][mid]) r = i;
            int left = mid - 1 >= 0 ? mat[r][mid - 1] : -1;
            int right = mid + 1 < n ? mat[r][mid + 1] : -1;
            if (mat[r][mid] >= left && mat[r][mid] >= right) return new int[]{r, mid};
            if (right > mat[r][mid]) lo = mid + 1;
            else hi = mid - 1;
        }
        return new int[]{-1, -1};
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> findPeakGrid(vector<vector<int>>& mat) {
        int m = mat.size(), n = mat[0].size();
        int lo = 0, hi = n - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            int r = 0;
            for (int i = 0; i < m; i++) if (mat[i][mid] > mat[r][mid]) r = i;
            int left = mid - 1 >= 0 ? mat[r][mid - 1] : -1;
            int right = mid + 1 < n ? mat[r][mid + 1] : -1;
            if (mat[r][mid] >= left && mat[r][mid] >= right) return {r, mid};
            if (right > mat[r][mid]) lo = mid + 1;
            else hi = mid - 1;
        }
        return {-1, -1};
    }
};
`,
  },
});

// ============================================================================
// 13. range-based-counts
// ============================================================================
P.push({
  id: 'range-based-counts',
  description: '<p>Given a sorted integer array <code>arr</code>, an integer <code>lo</code>, and an integer <code>hi</code>, return how many elements fall in <code>[lo, hi]</code> (inclusive).</p>',
  method_name: 'countInRange',
  params: [
    { name: 'arr', type: 'List[int]' },
    { name: 'lo', type: 'int' },
    { name: 'hi', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Binary Search',
  tags: ['arrays', 'binary-search'],
  hints: [
    'Find left = first index with value >= lo (lower_bound).',
    'Find right = first index with value > hi (upper_bound).',
    'Answer is right - left.',
    'Use the standard library bisect / lower_bound functions.',
    'Constant extra space.',
  ],
  editorial_md: ED(
    'A sorted array makes this a one-liner with binary search: the count of values within [lo, hi] is the gap between two bound positions.',
    'Use lower_bound (Python: bisect_left) to find the first index whose value is ≥ lo. Use upper_bound (bisect_right) to find the first index whose value is > hi. The difference gives the count. Both calls run in O(log n) and use no extra memory. Edge cases: lo > hi returns 0; an empty array returns 0; all values out of range returns 0 naturally.',
    '- Time: O(log n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[1,3,5,7,9,11]', '5', '9'], expected: '3' },
    { inputs: ['[1,3,5,7,9,11]', '0', '20'], expected: '6' },
    { inputs: ['[1,3,5,7,9,11]', '12', '20'], expected: '0' },
    { inputs: ['[1,3,5,7,9,11]', '-5', '0'], expected: '0' },
    { inputs: ['[1,1,1,1,1]', '1', '1'], expected: '5' },
    { inputs: ['[1,2,3,4,5]', '3', '3'], expected: '1' },
    { inputs: ['[]', '0', '10'], expected: '0' },
    { inputs: ['[5]', '5', '5'], expected: '1' },
    { inputs: ['[5]', '6', '10'], expected: '0' },
    { inputs: ['[1,2,2,2,3,4]', '2', '2'], expected: '3' },
    { inputs: ['[-10,-5,0,5,10]', '-5', '5'], expected: '3' },
  ],
  solutions: {
    python: `from typing import List
from bisect import bisect_left, bisect_right

class Solution:
    def countInRange(self, arr: List[int], lo: int, hi: int) -> int:
        if lo > hi: return 0
        return bisect_right(arr, hi) - bisect_left(arr, lo)
`,
    javascript: `var countInRange = function(arr, lo, hi) {
    if (lo > hi) return 0;
    const lower = (a, x) => { let l=0,r=a.length; while (l<r) { const m=(l+r)>>1; if (a[m]<x) l=m+1; else r=m; } return l; };
    const upper = (a, x) => { let l=0,r=a.length; while (l<r) { const m=(l+r)>>1; if (a[m]<=x) l=m+1; else r=m; } return l; };
    return upper(arr, hi) - lower(arr, lo);
};
`,
    java: `class Solution {
    public int countInRange(int[] arr, int lo, int hi) {
        if (lo > hi) return 0;
        return upper(arr, hi) - lower(arr, lo);
    }
    private int lower(int[] a, int x) {
        int l = 0, r = a.length;
        while (l < r) { int m = (l + r) >>> 1; if (a[m] < x) l = m + 1; else r = m; }
        return l;
    }
    private int upper(int[] a, int x) {
        int l = 0, r = a.length;
        while (l < r) { int m = (l + r) >>> 1; if (a[m] <= x) l = m + 1; else r = m; }
        return l;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int countInRange(vector<int>& arr, int lo, int hi) {
        if (lo > hi) return 0;
        return (int)(upper_bound(arr.begin(), arr.end(), hi) - lower_bound(arr.begin(), arr.end(), lo));
    }
};
`,
  },
});

// ============================================================================
// 14. kth-missing
// ============================================================================
P.push({
  id: 'kth-missing',
  description: '<p>Given a strictly increasing positive integer array <code>arr</code> and an integer <code>k</code>, return the <code>k</code>-th positive integer missing from <code>arr</code>.</p>',
  method_name: 'findKthPositive',
  params: [
    { name: 'arr', type: 'List[int]' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Binary Search',
  tags: ['arrays', 'binary-search'],
  hints: [
    'At index i, the number of missing positives ≤ arr[i] equals arr[i] - (i + 1).',
    'Binary-search the smallest index where this count ≥ k.',
    'Final answer is k + lo (where lo is the binary-search landing index).',
    'O(log n) beats the naive O(n) sweep.',
    'Watch off-by-one: include the case where k exceeds all internal missing counts.',
  ],
  editorial_md: ED(
    'In a strictly increasing array of positives, at index i the value arr[i] - (i + 1) tells you how many positive integers ≤ arr[i] are missing. That function is monotone non-decreasing in i, so binary search lands the answer directly.',
    'Search the smallest index i with arr[i] - (i + 1) ≥ k. lo = 0, hi = n. While lo < hi, mid = (lo + hi) // 2. If arr[mid] - (mid + 1) < k, set lo = mid + 1 else hi = mid. The answer is k + lo: lo is the count of array elements before the k-th missing value, and any of the first k positives that survived the gaps shifts the value by exactly k slots. This handles k larger than all internal gaps (lo = n) and k = 1 with arr[0] > 1.',
    '- Time: O(log n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[2,3,4,7,11]', '5'], expected: '9' },
    { inputs: ['[1,2,3,4]', '2'], expected: '6' },
    { inputs: ['[1,2,3,4]', '1'], expected: '5' },
    { inputs: ['[2]', '1'], expected: '1' },
    { inputs: ['[5]', '3'], expected: '3' },
    { inputs: ['[1]', '5'], expected: '6' },
    { inputs: ['[2,3,4,7,11]', '1'], expected: '1' },
    { inputs: ['[2,3,4,7,11]', '2'], expected: '5' },
    { inputs: ['[2,3,4,7,11]', '3'], expected: '6' },
    { inputs: ['[1,3]', '1'], expected: '2' },
    { inputs: ['[10,20,30]', '15'], expected: '18' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def findKthPositive(self, arr: List[int], k: int) -> int:
        lo, hi = 0, len(arr)
        while lo < hi:
            mid = (lo + hi) // 2
            if arr[mid] - (mid + 1) < k:
                lo = mid + 1
            else:
                hi = mid
        return k + lo
`,
    javascript: `var findKthPositive = function(arr, k) {
    let lo = 0, hi = arr.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid] - (mid + 1) < k) lo = mid + 1;
        else hi = mid;
    }
    return k + lo;
};
`,
    java: `class Solution {
    public int findKthPositive(int[] arr, int k) {
        int lo = 0, hi = arr.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (arr[mid] - (mid + 1) < k) lo = mid + 1;
            else hi = mid;
        }
        return k + lo;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int findKthPositive(vector<int>& arr, int k) {
        int lo = 0, hi = (int)arr.size();
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (arr[mid] - (mid + 1) < k) lo = mid + 1;
            else hi = mid;
        }
        return k + lo;
    }
};
`,
  },
});

// ============================================================================
// 15. search-in-row-column-sorted
// ============================================================================
P.push({
  id: 'search-in-row-column-sorted',
  description: '<p>Given a matrix where every row and every column is sorted in ascending order, and a value <code>target</code>, return <code>true</code> if <code>target</code> exists in the matrix.</p>',
  method_name: 'searchMatrix',
  params: [
    { name: 'matrix', type: 'List[List[int]]' },
    { name: 'target', type: 'int' },
  ],
  return_type: 'bool',
  pattern: 'Staircase Search',
  tags: ['matrix', 'binary-search'],
  hints: [
    'Start at the top-right corner (or bottom-left).',
    'If matrix[i][j] == target, return true.',
    'If matrix[i][j] > target, move left (column smaller).',
    'If matrix[i][j] < target, move down (row larger).',
    'O(m + n) — each move eliminates a row or column.',
  ],
  editorial_md: ED(
    'A row-and-column-sorted matrix has a useful invariant from the top-right corner: everything to the left is smaller, everything below is larger. So at any cell we can prune a whole row or a whole column with one comparison.',
    'Start at i = 0, j = n - 1. While i < m and j >= 0: if matrix[i][j] == target return true; if matrix[i][j] > target then everything below in column j is ≥ matrix[i][j] > target, so drop column j by j -= 1; if matrix[i][j] < target then everything left in row i is ≤ matrix[i][j] < target, so drop row i by i += 1. After at most m + n steps either the value is found or we have walked off the grid. Bottom-left works symmetrically.',
    '- Time: O(m + n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]]', '5'], expected: 'true' },
    { inputs: ['[[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]]', '20'], expected: 'false' },
    { inputs: ['[[1]]', '1'], expected: 'true' },
    { inputs: ['[[1]]', '2'], expected: 'false' },
    { inputs: ['[[1,2,3]]', '2'], expected: 'true' },
    { inputs: ['[[1],[2],[3]]', '3'], expected: 'true' },
    { inputs: ['[[1,2],[3,4]]', '4'], expected: 'true' },
    { inputs: ['[[1,2],[3,4]]', '0'], expected: 'false' },
    { inputs: ['[[1,2],[3,4]]', '5'], expected: 'false' },
    { inputs: ['[[-5,-4,-3],[-2,-1,0],[1,2,3]]', '-3'], expected: 'true' },
    { inputs: ['[[-5,-4,-3],[-2,-1,0],[1,2,3]]', '4'], expected: 'false' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        if not matrix or not matrix[0]:
            return False
        m, n = len(matrix), len(matrix[0])
        i, j = 0, n - 1
        while i < m and j >= 0:
            v = matrix[i][j]
            if v == target: return True
            if v > target: j -= 1
            else: i += 1
        return False
`,
    javascript: `var searchMatrix = function(matrix, target) {
    if (!matrix.length || !matrix[0].length) return false;
    const m = matrix.length, n = matrix[0].length;
    let i = 0, j = n - 1;
    while (i < m && j >= 0) {
        const v = matrix[i][j];
        if (v === target) return true;
        if (v > target) j--;
        else i++;
    }
    return false;
};
`,
    java: `class Solution {
    public boolean searchMatrix(int[][] matrix, int target) {
        if (matrix.length == 0 || matrix[0].length == 0) return false;
        int m = matrix.length, n = matrix[0].length;
        int i = 0, j = n - 1;
        while (i < m && j >= 0) {
            int v = matrix[i][j];
            if (v == target) return true;
            if (v > target) j--;
            else i++;
        }
        return false;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    bool searchMatrix(vector<vector<int>>& matrix, int target) {
        if (matrix.empty() || matrix[0].empty()) return false;
        int m = matrix.size(), n = matrix[0].size();
        int i = 0, j = n - 1;
        while (i < m && j >= 0) {
            int v = matrix[i][j];
            if (v == target) return true;
            if (v > target) j--;
            else i++;
        }
        return false;
    }
};
`,
  },
});

// ============================================================================
// 16. square-root (integer square root)
// ============================================================================
P.push({
  id: 'square-root',
  description: '<p>Given a non-negative integer <code>x</code>, return the integer square root — the largest integer <code>r</code> such that <code>r * r ≤ x</code>. Do not use any built-in square-root function.</p>',
  method_name: 'mySqrt',
  params: [{ name: 'x', type: 'int' }],
  return_type: 'int',
  pattern: 'Binary Search',
  tags: ['math', 'binary-search'],
  hints: [
    'Binary search r in [0, x].',
    'At mid, compare mid * mid against x — careful with overflow in fixed-width languages.',
    'Track the largest mid with mid * mid ≤ x.',
    'Newton\'s method also works: r_{k+1} = (r_k + x / r_k) // 2.',
    'Edge cases: x = 0 returns 0; x = 1 returns 1.',
  ],
  editorial_md: ED(
    'The function r → r·r is monotone increasing, so the integer square root is the boundary where r·r transitions from ≤ x to > x — exactly the use case for binary search.',
    'Binary search r over [0, x]. At mid, if mid*mid ≤ x, that value is a candidate; record it and search the upper half by lo = mid + 1. Otherwise hi = mid - 1. The loop ends when lo > hi and the recorded candidate is the answer. In Java / C++, store the product in `long` to avoid overflow. Newton\'s iteration converges quadratically and is the production algorithm: r ← (r + x // r) // 2, starting at x. Stop when the iterate stops decreasing, then return min of last two estimates that satisfies r·r ≤ x.',
    '- Time: O(log x).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['0'], expected: '0' },
    { inputs: ['1'], expected: '1' },
    { inputs: ['4'], expected: '2' },
    { inputs: ['8'], expected: '2' },
    { inputs: ['9'], expected: '3' },
    { inputs: ['16'], expected: '4' },
    { inputs: ['2147395599'], expected: '46339' },
    { inputs: ['2147483647'], expected: '46340' },
    { inputs: ['100'], expected: '10' },
    { inputs: ['99'], expected: '9' },
    { inputs: ['10000'], expected: '100' },
  ],
  solutions: {
    python: `class Solution:
    def mySqrt(self, x: int) -> int:
        if x < 2: return x
        lo, hi, ans = 1, x // 2 + 1, 0
        while lo <= hi:
            mid = (lo + hi) // 2
            if mid * mid <= x:
                ans = mid; lo = mid + 1
            else:
                hi = mid - 1
        return ans
`,
    javascript: `var mySqrt = function(x) {
    if (x < 2) return x;
    let lo = 1, hi = Math.floor(x / 2) + 1, ans = 0;
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (mid * mid <= x) { ans = mid; lo = mid + 1; }
        else hi = mid - 1;
    }
    return ans;
};
`,
    java: `class Solution {
    public int mySqrt(int x) {
        if (x < 2) return x;
        int lo = 1, hi = x / 2 + 1, ans = 0;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            long sq = (long) mid * mid;
            if (sq <= x) { ans = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return ans;
    }
}
`,
    cpp: `class Solution {
public:
    int mySqrt(int x) {
        if (x < 2) return x;
        long lo = 1, hi = (long)x / 2 + 1, ans = 0;
        while (lo <= hi) {
            long mid = (lo + hi) / 2;
            if (mid * mid <= (long)x) { ans = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return (int)ans;
    }
};
`,
  },
});

// ============================================================================
// 17. nth-root  (integer n-th root of m)
// ============================================================================
P.push({
  id: 'nth-root',
  description: '<p>Given two positive integers <code>n</code> and <code>m</code>, find the integer <code>r</code> such that <code>r^n == m</code>. If no such integer exists, return <code>-1</code>.</p>',
  method_name: 'nthRoot',
  params: [
    { name: 'n', type: 'int' },
    { name: 'm', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Binary Search',
  tags: ['math', 'binary-search'],
  hints: [
    'Binary search r in [1, m].',
    'Compute mid^n carefully — break early once it exceeds m.',
    'If mid^n == m return mid.',
    'If mid^n < m search right, else search left.',
    'Return -1 if no exact integer root is found.',
  ],
  editorial_md: ED(
    'For positive r, r^n grows monotonically. So the equation r^n == m has at most one positive integer solution, and binary search converges on it (or proves it absent).',
    'Search r over [1, m]. Compute power = mid^n with early termination — multiply step by step and bail to "too big" as soon as the running product exceeds m. Compare power against m: equal returns mid; less moves lo = mid + 1; greater moves hi = mid - 1. If the loop ends without an equal hit, no integer root exists, return -1. Edge cases: m = 1 returns 1 for any n ≥ 1; n = 1 returns m directly.',
    '- Time: O(n · log m).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['2', '9'], expected: '3' },
    { inputs: ['3', '27'], expected: '3' },
    { inputs: ['4', '69'], expected: '-1' },
    { inputs: ['1', '5'], expected: '5' },
    { inputs: ['2', '1'], expected: '1' },
    { inputs: ['3', '8'], expected: '2' },
    { inputs: ['5', '32'], expected: '2' },
    { inputs: ['2', '16'], expected: '4' },
    { inputs: ['2', '15'], expected: '-1' },
    { inputs: ['10', '1024'], expected: '2' },
    { inputs: ['6', '46656'], expected: '6' },
  ],
  solutions: {
    python: `class Solution:
    def nthRoot(self, n: int, m: int) -> int:
        if m == 1: return 1
        lo, hi = 1, m
        while lo <= hi:
            mid = (lo + hi) // 2
            power = 1
            too_big = False
            for _ in range(n):
                power *= mid
                if power > m:
                    too_big = True
                    break
            if not too_big and power == m: return mid
            if too_big or power > m: hi = mid - 1
            else: lo = mid + 1
        return -1
`,
    javascript: `var nthRoot = function(n, m) {
    if (m === 1) return 1;
    let lo = 1, hi = m;
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        let power = 1, tooBig = false;
        for (let i = 0; i < n; i++) {
            power *= mid;
            if (power > m) { tooBig = true; break; }
        }
        if (!tooBig && power === m) return mid;
        if (tooBig || power > m) hi = mid - 1;
        else lo = mid + 1;
    }
    return -1;
};
`,
    java: `class Solution {
    public int nthRoot(int n, int m) {
        if (m == 1) return 1;
        long lo = 1, hi = m;
        while (lo <= hi) {
            long mid = (lo + hi) / 2;
            long power = 1;
            boolean tooBig = false;
            for (int i = 0; i < n; i++) {
                power *= mid;
                if (power > m) { tooBig = true; break; }
            }
            if (!tooBig && power == m) return (int) mid;
            if (tooBig || power > m) hi = mid - 1;
            else lo = mid + 1;
        }
        return -1;
    }
}
`,
    cpp: `class Solution {
public:
    int nthRoot(int n, int m) {
        if (m == 1) return 1;
        long long lo = 1, hi = m;
        while (lo <= hi) {
            long long mid = (lo + hi) / 2;
            long long power = 1;
            bool tooBig = false;
            for (int i = 0; i < n; i++) {
                power *= mid;
                if (power > m) { tooBig = true; break; }
            }
            if (!tooBig && power == m) return (int) mid;
            if (tooBig || power > m) hi = mid - 1;
            else lo = mid + 1;
        }
        return -1;
    }
};
`,
  },
});

// ============================================================================
// 18. range-sum-query-2d
// ============================================================================
P.push({
  id: 'range-sum-query-2d',
  method_name: 'sumRegion',
  params: [
    { name: 'matrix', type: 'List[List[int]]' },
    { name: 'row1', type: 'int' },
    { name: 'col1', type: 'int' },
    { name: 'row2', type: 'int' },
    { name: 'col2', type: 'int' },
  ],
  return_type: 'int',
  pattern: '2D Prefix Sum',
  tags: ['matrix', 'prefix-sum'],
  hints: [
    'Precompute a 2D prefix sum where pre[i+1][j+1] = sum of submatrix (0,0)..(i,j).',
    'Query in O(1): pre[r2+1][c2+1] - pre[r1][c2+1] - pre[r2+1][c1] + pre[r1][c1].',
    'Pad the prefix table with an extra zero row and column to avoid edge checks.',
    'Build once in O(m·n); each query is O(1).',
    'Useful pattern for any rectangular aggregation.',
  ],
  editorial_md: ED(
    'A 2D prefix sum reduces any axis-aligned rectangle sum to four lookups thanks to inclusion-exclusion. Precompute once, then queries cost O(1) regardless of size.',
    'Build pre[i][j] = sum of matrix[0..i-1][0..j-1] using the recurrence pre[i][j] = matrix[i-1][j-1] + pre[i-1][j] + pre[i][j-1] - pre[i-1][j-1]. For a rectangle query (r1, c1, r2, c2), compute pre[r2+1][c2+1] - pre[r1][c2+1] - pre[r2+1][c1] + pre[r1][c1]. The extra row and column of zeros eliminates boundary cases. Since most LeetCode-style problems call sumRegion many times against the same matrix, the up-front O(m·n) cost is amortised across O(1) queries.',
    '- Build: O(m·n).\n- Query: O(1).\n- Space: O(m·n).'
  ),
  test_cases: [
    { inputs: ['[[3,0,1,4,2],[5,6,3,2,1],[1,2,0,1,5],[4,1,0,1,7],[1,0,3,0,5]]', '2', '1', '4', '3'], expected: '8' },
    { inputs: ['[[3,0,1,4,2],[5,6,3,2,1],[1,2,0,1,5],[4,1,0,1,7],[1,0,3,0,5]]', '1', '1', '2', '2'], expected: '11' },
    { inputs: ['[[3,0,1,4,2],[5,6,3,2,1],[1,2,0,1,5],[4,1,0,1,7],[1,0,3,0,5]]', '1', '2', '2', '4'], expected: '12' },
    { inputs: ['[[1]]', '0', '0', '0', '0'], expected: '1' },
    { inputs: ['[[1,2],[3,4]]', '0', '0', '1', '1'], expected: '10' },
    { inputs: ['[[1,2],[3,4]]', '0', '0', '0', '1'], expected: '3' },
    { inputs: ['[[1,2],[3,4]]', '1', '0', '1', '1'], expected: '7' },
    { inputs: ['[[-1,-2],[-3,-4]]', '0', '0', '1', '1'], expected: '-10' },
    { inputs: ['[[0,0,0],[0,0,0],[0,0,0]]', '0', '0', '2', '2'], expected: '0' },
    { inputs: ['[[1,1,1],[1,1,1],[1,1,1]]', '0', '0', '2', '2'], expected: '9' },
    { inputs: ['[[1,1,1],[1,1,1],[1,1,1]]', '1', '1', '1', '1'], expected: '1' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def sumRegion(self, matrix: List[List[int]], row1: int, col1: int, row2: int, col2: int) -> int:
        m, n = len(matrix), len(matrix[0])
        pre = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(m):
            row = 0
            for j in range(n):
                row += matrix[i][j]
                pre[i + 1][j + 1] = pre[i][j + 1] + row
        return pre[row2 + 1][col2 + 1] - pre[row1][col2 + 1] - pre[row2 + 1][col1] + pre[row1][col1]
`,
    javascript: `var sumRegion = function(matrix, row1, col1, row2, col2) {
    const m = matrix.length, n = matrix[0].length;
    const pre = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
    for (let i = 0; i < m; i++) {
        let row = 0;
        for (let j = 0; j < n; j++) {
            row += matrix[i][j];
            pre[i + 1][j + 1] = pre[i][j + 1] + row;
        }
    }
    return pre[row2 + 1][col2 + 1] - pre[row1][col2 + 1] - pre[row2 + 1][col1] + pre[row1][col1];
};
`,
    java: `class Solution {
    public int sumRegion(int[][] matrix, int row1, int col1, int row2, int col2) {
        int m = matrix.length, n = matrix[0].length;
        int[][] pre = new int[m + 1][n + 1];
        for (int i = 0; i < m; i++) {
            int row = 0;
            for (int j = 0; j < n; j++) {
                row += matrix[i][j];
                pre[i + 1][j + 1] = pre[i][j + 1] + row;
            }
        }
        return pre[row2 + 1][col2 + 1] - pre[row1][col2 + 1] - pre[row2 + 1][col1] + pre[row1][col1];
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int sumRegion(vector<vector<int>>& matrix, int row1, int col1, int row2, int col2) {
        int m = matrix.size(), n = matrix[0].size();
        vector<vector<int>> pre(m + 1, vector<int>(n + 1, 0));
        for (int i = 0; i < m; i++) {
            int row = 0;
            for (int j = 0; j < n; j++) {
                row += matrix[i][j];
                pre[i + 1][j + 1] = pre[i][j + 1] + row;
            }
        }
        return pre[row2 + 1][col2 + 1] - pre[row1][col2 + 1] - pre[row2 + 1][col1] + pre[row1][col1];
    }
};
`,
  },
});

// ============================================================================
// 19. longest-palindromic-substring-2d
// ============================================================================
P.push({
  id: 'longest-palindromic-substring-2d',
  method_name: 'longestPalindrome',
  params: [{ name: 's', type: 'str' }],
  return_type: 'str',
  pattern: 'Expand Around Center',
  tags: ['strings', 'dp', 'two-pointers'],
  hints: [
    'Expand around each centre — odd and even length.',
    'Track the start and length of the best palindrome seen so far.',
    'O(n^2) time, O(1) extra space — simpler than the DP table.',
    'Manacher achieves O(n) but is rarely needed under interview pressure.',
    'Edge cases: empty input → empty string; one character is a palindrome of length 1.',
  ],
  editorial_md: ED(
    'Any palindrome has a centre. There are 2n - 1 candidate centres (n character positions and n - 1 gap positions). For each, expand outward while characters match.',
    'For i from 0 to n - 1 expand around two centres: (i, i) for odd-length and (i, i + 1) for even-length. The expand function widens left and right while in bounds and s[left] == s[right], returning the resulting [start, end] of the maximal palindrome. Keep track of the best start and length across all centres. The DP table approach fills a 2D boolean matrix dp[i][j] meaning s[i..j] is a palindrome, with the recurrence dp[i][j] = s[i] == s[j] and dp[i + 1][j - 1]; the iteration order is by substring length. Both are O(n²) time; the centre expansion uses O(1) extra space versus O(n²) for the table.',
    '- Time: O(n²).\n- Space: O(1) for expand around centre, O(n²) for the DP table.'
  ),
  test_cases: [
    { inputs: ['"babad"'], expected: '"bab"' },
    { inputs: ['"cbbd"'], expected: '"bb"' },
    { inputs: ['"a"'], expected: '"a"' },
    { inputs: ['"ac"'], expected: '"a"' },
    { inputs: ['""'], expected: '""' },
    { inputs: ['"aaaa"'], expected: '"aaaa"' },
    { inputs: ['"forgeeksskeegfor"'], expected: '"geeksskeeg"' },
    { inputs: ['"abcba"'], expected: '"abcba"' },
    { inputs: ['"abacdfgdcaba"'], expected: '"aba"' },
    { inputs: ['"racecar"'], expected: '"racecar"' },
    { inputs: ['"abcd"'], expected: '"a"' },
  ],
  solutions: {
    python: `class Solution:
    def longestPalindrome(self, s: str) -> str:
        if not s: return ""
        def expand(l: int, r: int) -> tuple[int, int]:
            while l >= 0 and r < len(s) and s[l] == s[r]:
                l -= 1; r += 1
            return l + 1, r - 1
        best_l, best_r = 0, 0
        for i in range(len(s)):
            l1, r1 = expand(i, i)
            l2, r2 = expand(i, i + 1)
            if r1 - l1 > best_r - best_l:
                best_l, best_r = l1, r1
            if r2 - l2 > best_r - best_l:
                best_l, best_r = l2, r2
        return s[best_l:best_r + 1]
`,
    javascript: `var longestPalindrome = function(s) {
    if (!s) return "";
    const expand = (l, r) => {
        while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
        return [l + 1, r - 1];
    };
    let bestL = 0, bestR = 0;
    for (let i = 0; i < s.length; i++) {
        const [l1, r1] = expand(i, i);
        const [l2, r2] = expand(i, i + 1);
        if (r1 - l1 > bestR - bestL) { bestL = l1; bestR = r1; }
        if (r2 - l2 > bestR - bestL) { bestL = l2; bestR = r2; }
    }
    return s.substring(bestL, bestR + 1);
};
`,
    java: `class Solution {
    public String longestPalindrome(String s) {
        if (s == null || s.isEmpty()) return "";
        int bestL = 0, bestR = 0;
        for (int i = 0; i < s.length(); i++) {
            int[] a = expand(s, i, i);
            int[] b = expand(s, i, i + 1);
            if (a[1] - a[0] > bestR - bestL) { bestL = a[0]; bestR = a[1]; }
            if (b[1] - b[0] > bestR - bestL) { bestL = b[0]; bestR = b[1]; }
        }
        return s.substring(bestL, bestR + 1);
    }
    private int[] expand(String s, int l, int r) {
        while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
        return new int[]{l + 1, r - 1};
    }
}
`,
    cpp: `#include <string>
using namespace std;

class Solution {
public:
    string longestPalindrome(string s) {
        if (s.empty()) return "";
        int bestL = 0, bestR = 0;
        auto expand = [&](int l, int r) -> pair<int,int> {
            while (l >= 0 && r < (int)s.size() && s[l] == s[r]) { l--; r++; }
            return {l + 1, r - 1};
        };
        for (int i = 0; i < (int)s.size(); i++) {
            auto [l1, r1] = expand(i, i);
            auto [l2, r2] = expand(i, i + 1);
            if (r1 - l1 > bestR - bestL) { bestL = l1; bestR = r1; }
            if (r2 - l2 > bestR - bestL) { bestL = l2; bestR = r2; }
        }
        return s.substr(bestL, bestR - bestL + 1);
    }
};
`,
  },
});

// ============================================================================
// 20. maximal-square-2d
// ============================================================================
P.push({
  id: 'maximal-square-2d',
  method_name: 'maximalSquare',
  params: [{ name: 'matrix', type: 'List[List[str]]' }],
  return_type: 'int',
  pattern: 'DP',
  tags: ['matrix', 'dp'],
  hints: [
    'dp[i][j] = side length of the largest all-1 square whose bottom-right corner is (i, j).',
    'If matrix[i][j] == 0 then dp[i][j] = 0.',
    'Else dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]).',
    'Track the max side; answer is side^2.',
    'Reduce to a 1D rolling row with one previous-diagonal scalar.',
  ],
  editorial_md: ED(
    'For a square of 1s to extend to position (i, j), three smaller squares must already exist at (i-1, j), (i, j-1), and (i-1, j-1). The largest square at (i, j) is therefore bounded by the smallest of those three.',
    'Build dp[i][j] = side of largest all-1 square ending at (i, j). Base: first row and first column equal matrix[i][j] directly. Recurrence: if matrix[i][j] is 0 then dp[i][j] is 0, else dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]). Track the global maximum side; the area is its square. Space can drop to O(n) by overwriting the row and keeping a scalar for the diagonal predecessor.',
    '- Time: O(m·n).\n- Space: O(m·n), or O(n) rolling.'
  ),
  test_cases: [
    { inputs: ['[["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]'], expected: '4' },
    { inputs: ['[["0","1"],["1","0"]]'], expected: '1' },
    { inputs: ['[["0"]]'], expected: '0' },
    { inputs: ['[["1"]]'], expected: '1' },
    { inputs: ['[["1","1"],["1","1"]]'], expected: '4' },
    { inputs: ['[["1","1","1"],["1","1","1"],["1","1","1"]]'], expected: '9' },
    { inputs: ['[["0","0"],["0","0"]]'], expected: '0' },
    { inputs: ['[["1","0","1"],["0","1","0"],["1","0","1"]]'], expected: '1' },
    { inputs: ['[["1","1","1","1"],["1","1","1","1"],["1","1","1","1"]]'], expected: '9' },
    { inputs: ['[["0","1","1","0","1"],["1","1","0","1","0"],["0","1","1","1","0"],["1","1","1","1","0"],["1","1","1","1","1"],["0","0","0","0","0"]]'], expected: '9' },
    { inputs: ['[["1"],["1"],["1"]]'], expected: '1' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def maximalSquare(self, matrix: List[List[str]]) -> int:
        if not matrix or not matrix[0]: return 0
        m, n = len(matrix), len(matrix[0])
        prev = [0] * n
        best = 0
        for i in range(m):
            curr = [0] * n
            diag = 0
            for j in range(n):
                tmp = prev[j]
                if matrix[i][j] == '1':
                    if i == 0 or j == 0:
                        curr[j] = 1
                    else:
                        curr[j] = 1 + min(prev[j], curr[j - 1], diag)
                    if curr[j] > best: best = curr[j]
                diag = tmp
            prev = curr
        return best * best
`,
    javascript: `var maximalSquare = function(matrix) {
    if (!matrix.length || !matrix[0].length) return 0;
    const m = matrix.length, n = matrix[0].length;
    let prev = new Array(n).fill(0), best = 0;
    for (let i = 0; i < m; i++) {
        const curr = new Array(n).fill(0);
        let diag = 0;
        for (let j = 0; j < n; j++) {
            const tmp = prev[j];
            if (matrix[i][j] === '1') {
                if (i === 0 || j === 0) curr[j] = 1;
                else curr[j] = 1 + Math.min(prev[j], curr[j - 1], diag);
                if (curr[j] > best) best = curr[j];
            }
            diag = tmp;
        }
        prev = curr;
    }
    return best * best;
};
`,
    java: `class Solution {
    public int maximalSquare(char[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        int[] prev = new int[n];
        int best = 0;
        for (int i = 0; i < m; i++) {
            int[] curr = new int[n];
            int diag = 0;
            for (int j = 0; j < n; j++) {
                int tmp = prev[j];
                if (matrix[i][j] == '1') {
                    if (i == 0 || j == 0) curr[j] = 1;
                    else curr[j] = 1 + Math.min(prev[j], Math.min(curr[j - 1], diag));
                    if (curr[j] > best) best = curr[j];
                }
                diag = tmp;
            }
            prev = curr;
        }
        return best * best;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maximalSquare(vector<vector<char>>& matrix) {
        if (matrix.empty() || matrix[0].empty()) return 0;
        int m = matrix.size(), n = matrix[0].size();
        vector<int> prev(n, 0);
        int best = 0;
        for (int i = 0; i < m; i++) {
            vector<int> curr(n, 0);
            int diag = 0;
            for (int j = 0; j < n; j++) {
                int tmp = prev[j];
                if (matrix[i][j] == '1') {
                    if (i == 0 || j == 0) curr[j] = 1;
                    else curr[j] = 1 + min({prev[j], curr[j - 1], diag});
                    if (curr[j] > best) best = curr[j];
                }
                diag = tmp;
            }
            prev = curr;
        }
        return best * best;
    }
};
`,
  },
});

// ============================================================================
// 21. cherry-pickup-ii
// ============================================================================
P.push({
  id: 'cherry-pickup-ii',
  method_name: 'cherryPickup',
  params: [{ name: 'grid', type: 'List[List[int]]' }],
  return_type: 'int',
  pattern: 'DP (3D)',
  tags: ['matrix', 'dp'],
  hints: [
    'State: (row, col1, col2) for the two robots descending in lockstep.',
    'Both robots move from row r to row r+1 — 9 combinations of column moves.',
    'When col1 == col2 only one cherry is collected.',
    'Bottom-up or top-down with memoisation both work.',
    'Time O(m · n² · 9), space O(m · n²) or O(n²) rolling.',
  ],
  editorial_md: ED(
    'Two robots descend the grid together, one row at a time. The only state that matters at each row is their two column positions, so the natural DP indexes on (row, col1, col2).',
    'Let dp[r][c1][c2] be the maximum cherries collected from row r onward when the robots sit at columns c1 and c2. Base case at the last row: each robot picks its own cell, with the shared cell counted once if c1 == c2. Transition: for each of the 9 column-move combinations (-1, 0, +1 for each robot), recurse to dp[r + 1][nc1][nc2], skipping out-of-bounds moves; add the cherries at (r, c1) and (r, c2), again counting once if equal. Take the max across all 9 transitions. The answer is dp[0][0][n - 1] — both robots start at the top corners. A rolling array on the row dimension brings space to O(n²).',
    '- Time: O(m · n² · 9).\n- Space: O(m · n²), or O(n²) rolling.'
  ),
  test_cases: [
    { inputs: ['[[3,1,1],[2,5,1],[1,5,5],[2,1,1]]'], expected: '24' },
    { inputs: ['[[1,0,0,0,0,0,1],[2,0,0,0,0,3,0],[2,0,9,0,0,0,0],[0,3,0,5,4,0,0],[1,0,2,3,0,0,6]]'], expected: '28' },
    { inputs: ['[[1,1],[1,1]]'], expected: '4' },
    { inputs: ['[[1]]'], expected: '1' },
    { inputs: ['[[0,0,0],[0,0,0],[0,0,0]]'], expected: '0' },
    { inputs: ['[[5]]'], expected: '5' },
    { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'], expected: '24' },
    { inputs: ['[[1,0,1],[0,1,0],[1,0,1]]'], expected: '4' },
    { inputs: ['[[10,10,10],[10,10,10]]'], expected: '40' },
    { inputs: ['[[3,3,3,3],[2,2,2,2],[1,1,1,1]]'], expected: '18' },
    { inputs: ['[[1,1,1,1,1]]'], expected: '2' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def cherryPickup(self, grid: List[List[int]]) -> int:
        m, n = len(grid), len(grid[0])
        NEG = -1 << 30
        prev = [[NEG] * n for _ in range(n)]
        prev[0][n - 1] = grid[0][0] + (grid[0][n - 1] if n > 1 else 0)
        for r in range(1, m):
            curr = [[NEG] * n for _ in range(n)]
            for c1 in range(n):
                for c2 in range(n):
                    best = NEG
                    for d1 in (-1, 0, 1):
                        for d2 in (-1, 0, 1):
                            pc1, pc2 = c1 - d1, c2 - d2
                            if 0 <= pc1 < n and 0 <= pc2 < n and prev[pc1][pc2] > NEG:
                                if prev[pc1][pc2] > best: best = prev[pc1][pc2]
                    if best == NEG: continue
                    cherries = grid[r][c1] + (grid[r][c2] if c1 != c2 else 0)
                    curr[c1][c2] = best + cherries
            prev = curr
        ans = 0
        for row in prev:
            for v in row:
                if v > ans: ans = v
        return ans
`,
    javascript: `var cherryPickup = function(grid) {
    const m = grid.length, n = grid[0].length, NEG = -1e9;
    let prev = Array.from({length: n}, () => new Array(n).fill(NEG));
    prev[0][n - 1] = grid[0][0] + (n > 1 ? grid[0][n - 1] : 0);
    for (let r = 1; r < m; r++) {
        const curr = Array.from({length: n}, () => new Array(n).fill(NEG));
        for (let c1 = 0; c1 < n; c1++) {
            for (let c2 = 0; c2 < n; c2++) {
                let best = NEG;
                for (let d1 = -1; d1 <= 1; d1++) {
                    for (let d2 = -1; d2 <= 1; d2++) {
                        const pc1 = c1 - d1, pc2 = c2 - d2;
                        if (pc1 >= 0 && pc1 < n && pc2 >= 0 && pc2 < n && prev[pc1][pc2] > best) best = prev[pc1][pc2];
                    }
                }
                if (best === NEG) continue;
                const cherries = grid[r][c1] + (c1 !== c2 ? grid[r][c2] : 0);
                curr[c1][c2] = best + cherries;
            }
        }
        prev = curr;
    }
    let ans = 0;
    for (const row of prev) for (const v of row) if (v > ans) ans = v;
    return ans;
};
`,
    java: `class Solution {
    public int cherryPickup(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        int NEG = Integer.MIN_VALUE / 2;
        int[][] prev = new int[n][n];
        for (int[] r : prev) java.util.Arrays.fill(r, NEG);
        prev[0][n - 1] = grid[0][0] + (n > 1 ? grid[0][n - 1] : 0);
        for (int r = 1; r < m; r++) {
            int[][] curr = new int[n][n];
            for (int[] row : curr) java.util.Arrays.fill(row, NEG);
            for (int c1 = 0; c1 < n; c1++) {
                for (int c2 = 0; c2 < n; c2++) {
                    int best = NEG;
                    for (int d1 = -1; d1 <= 1; d1++) {
                        for (int d2 = -1; d2 <= 1; d2++) {
                            int pc1 = c1 - d1, pc2 = c2 - d2;
                            if (pc1 >= 0 && pc1 < n && pc2 >= 0 && pc2 < n && prev[pc1][pc2] > best) best = prev[pc1][pc2];
                        }
                    }
                    if (best == NEG) continue;
                    int cherries = grid[r][c1] + (c1 != c2 ? grid[r][c2] : 0);
                    curr[c1][c2] = best + cherries;
                }
            }
            prev = curr;
        }
        int ans = 0;
        for (int[] row : prev) for (int v : row) if (v > ans) ans = v;
        return ans;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

class Solution {
public:
    int cherryPickup(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size();
        int NEG = INT_MIN / 2;
        vector<vector<int>> prev(n, vector<int>(n, NEG));
        prev[0][n - 1] = grid[0][0] + (n > 1 ? grid[0][n - 1] : 0);
        for (int r = 1; r < m; r++) {
            vector<vector<int>> curr(n, vector<int>(n, NEG));
            for (int c1 = 0; c1 < n; c1++) {
                for (int c2 = 0; c2 < n; c2++) {
                    int best = NEG;
                    for (int d1 = -1; d1 <= 1; d1++) {
                        for (int d2 = -1; d2 <= 1; d2++) {
                            int pc1 = c1 - d1, pc2 = c2 - d2;
                            if (pc1 >= 0 && pc1 < n && pc2 >= 0 && pc2 < n) best = max(best, prev[pc1][pc2]);
                        }
                    }
                    if (best == NEG) continue;
                    int cherries = grid[r][c1] + (c1 != c2 ? grid[r][c2] : 0);
                    curr[c1][c2] = best + cherries;
                }
            }
            prev = curr;
        }
        int ans = 0;
        for (auto& row : prev) for (int v : row) ans = max(ans, v);
        return ans;
    }
};
`,
  },
});

// ============================================================================
// 22. edit-distance-2d
// ============================================================================
P.push({
  id: 'edit-distance-2d',
  method_name: 'minDistance',
  params: [
    { name: 'word1', type: 'str' },
    { name: 'word2', type: 'str' },
  ],
  return_type: 'int',
  pattern: 'DP',
  tags: ['strings', 'dp'],
  hints: [
    'dp[i][j] = min ops to convert word1[:i] into word2[:j].',
    'If chars match: dp[i][j] = dp[i-1][j-1].',
    'Else dp[i][j] = 1 + min(insert, delete, replace) = 1 + min(dp[i][j-1], dp[i-1][j], dp[i-1][j-1]).',
    'Base: dp[0][j] = j, dp[i][0] = i.',
    'Rolling 1D row reduces space to O(n).',
  ],
  editorial_md: ED(
    'Edit distance is the classic Levenshtein DP. At every (i, j) we either match a character or apply one of three operations — insert, delete, replace — each of cost 1. The recurrence chooses the cheapest.',
    'dp[i][j] = minimum operations to convert word1[:i] into word2[:j]. Bases: dp[0][j] = j (j inserts to build word2[:j] from empty), dp[i][0] = i (i deletes to drop word1[:i] to empty). General step: if word1[i-1] == word2[j-1], no op needed at this step and dp[i][j] = dp[i-1][j-1]. Otherwise pay 1 op and take the minimum of insert (dp[i][j-1]), delete (dp[i-1][j]), or replace (dp[i-1][j-1]). Answer is dp[m][n]. Space drops to O(n) with a rolling row plus one scalar for the diagonal.',
    '- Time: O(m·n).\n- Space: O(m·n), or O(n) rolling.'
  ),
  test_cases: [
    { inputs: ['"horse"', '"ros"'], expected: '3' },
    { inputs: ['"intention"', '"execution"'], expected: '5' },
    { inputs: ['""', '""'], expected: '0' },
    { inputs: ['"a"', '""'], expected: '1' },
    { inputs: ['""', '"a"'], expected: '1' },
    { inputs: ['"a"', '"b"'], expected: '1' },
    { inputs: ['"abc"', '"abc"'], expected: '0' },
    { inputs: ['"abc"', '"def"'], expected: '3' },
    { inputs: ['"abcd"', '"abcde"'], expected: '1' },
    { inputs: ['"abcde"', '"abcd"'], expected: '1' },
    { inputs: ['"sea"', '"eat"'], expected: '2' },
  ],
  solutions: {
    python: `class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        m, n = len(word1), len(word2)
        prev = list(range(n + 1))
        for i in range(1, m + 1):
            curr = [i] + [0] * n
            for j in range(1, n + 1):
                if word1[i - 1] == word2[j - 1]:
                    curr[j] = prev[j - 1]
                else:
                    curr[j] = 1 + min(prev[j], curr[j - 1], prev[j - 1])
            prev = curr
        return prev[n]
`,
    javascript: `var minDistance = function(word1, word2) {
    const m = word1.length, n = word2.length;
    let prev = new Array(n + 1).fill(0).map((_, j) => j);
    for (let i = 1; i <= m; i++) {
        const curr = new Array(n + 1).fill(0);
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            if (word1[i - 1] === word2[j - 1]) curr[j] = prev[j - 1];
            else curr[j] = 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
        }
        prev = curr;
    }
    return prev[n];
};
`,
    java: `class Solution {
    public int minDistance(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[] prev = new int[n + 1];
        for (int j = 0; j <= n; j++) prev[j] = j;
        for (int i = 1; i <= m; i++) {
            int[] curr = new int[n + 1];
            curr[0] = i;
            for (int j = 1; j <= n; j++) {
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) curr[j] = prev[j - 1];
                else curr[j] = 1 + Math.min(prev[j], Math.min(curr[j - 1], prev[j - 1]));
            }
            prev = curr;
        }
        return prev[n];
    }
}
`,
    cpp: `#include <string>
#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int minDistance(string word1, string word2) {
        int m = word1.size(), n = word2.size();
        vector<int> prev(n + 1);
        for (int j = 0; j <= n; j++) prev[j] = j;
        for (int i = 1; i <= m; i++) {
            vector<int> curr(n + 1);
            curr[0] = i;
            for (int j = 1; j <= n; j++) {
                if (word1[i - 1] == word2[j - 1]) curr[j] = prev[j - 1];
                else curr[j] = 1 + min({prev[j], curr[j - 1], prev[j - 1]});
            }
            prev = curr;
        }
        return prev[n];
    }
};
`,
  },
});

// ============================================================================
// 23. check-power (is n a power of two)
// ============================================================================
P.push({
  id: 'check-power',
  description: '<p>Given an integer <code>n</code>, return <code>true</code> if it is a power of two — i.e., there exists an integer <code>x</code> ≥ 0 such that <code>n == 2^x</code>.</p>',
  method_name: 'isPowerOfTwo',
  params: [{ name: 'n', type: 'int' }],
  return_type: 'bool',
  pattern: 'Bit Manipulation',
  tags: ['math', 'bit-manipulation'],
  hints: [
    'Powers of two have exactly one bit set.',
    'n & (n - 1) clears the lowest set bit.',
    'So n is a power of two iff n > 0 and (n & (n - 1)) == 0.',
    'Watch n ≤ 0 — must return false.',
    'Constant time.',
  ],
  editorial_md: ED(
    'Powers of two in binary are 1, 10, 100, 1000… — exactly one bit set. Clearing the lowest set bit (n & (n - 1)) then yields zero, which is the signature of a power of two.',
    'Reject n ≤ 0 immediately. For n > 0, compute n & (n - 1). The operation clears the lowest set bit. If the result is zero, n had exactly one bit set and is a power of two. Otherwise n had multiple set bits. This handles all positives in a single branch. Alternative checks like log2 round-trip and repeated halving also work but are slower and more error prone.',
    '- Time: O(1).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['1'], expected: 'true' },
    { inputs: ['2'], expected: 'true' },
    { inputs: ['3'], expected: 'false' },
    { inputs: ['4'], expected: 'true' },
    { inputs: ['16'], expected: 'true' },
    { inputs: ['0'], expected: 'false' },
    { inputs: ['-1'], expected: 'false' },
    { inputs: ['-2'], expected: 'false' },
    { inputs: ['1024'], expected: 'true' },
    { inputs: ['1073741824'], expected: 'true' },
    { inputs: ['1000'], expected: 'false' },
  ],
  solutions: {
    python: `class Solution:
    def isPowerOfTwo(self, n: int) -> bool:
        return n > 0 and (n & (n - 1)) == 0
`,
    javascript: `var isPowerOfTwo = function(n) {
    return n > 0 && (n & (n - 1)) === 0;
};
`,
    java: `class Solution {
    public boolean isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }
}
`,
    cpp: `class Solution {
public:
    bool isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }
};
`,
  },
});

// ============================================================================
// 24. linked-list-cycle-detection
// ============================================================================
P.push({
  id: 'linked-list-cycle-detection',
  method_name: 'hasCycle',
  params: [{ name: 'head', type: 'Optional[ListNode]' }],
  return_type: 'bool',
  pattern: 'Floyd Tortoise & Hare',
  tags: ['linked-list', 'two-pointers'],
  hints: [
    'Use two pointers: slow moves one step, fast moves two.',
    'If there is a cycle, fast catches up to slow.',
    'If there is no cycle, fast hits null and the loop terminates.',
    'Constant extra space.',
    'Hash-set alternative uses O(n) space.',
  ],
  editorial_md: ED(
    'Inside a cycle, a fast runner doing two steps per tick gains one step per tick on a slow runner doing one step. Eventually the gap modulo cycle length becomes zero and they collide. Outside a cycle, the fast runner falls off the end first.',
    'Initialise slow = head, fast = head. Each iteration advance slow by one and fast by two; bail with false if fast or fast.next becomes null. If slow == fast at any point, return true — the only way they can meet is inside a cycle. Hash-set alternative records each visited node and returns true on the first repeat. The two-pointer method uses O(1) memory and is the canonical answer.',
    '- Time: O(n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[3,2,0,-4]'], expected: 'false' },
    { inputs: ['[1,2]'], expected: 'false' },
    { inputs: ['[1]'], expected: 'false' },
    { inputs: ['[]'], expected: 'false' },
    { inputs: ['[1,1]'], expected: 'false' },
    { inputs: ['[1,2,3,4,5]'], expected: 'false' },
    { inputs: ['[1,2,3,4,5,6,7,8,9,10]'], expected: 'false' },
    { inputs: ['[7]'], expected: 'false' },
    { inputs: ['[1,2,3]'], expected: 'false' },
    { inputs: ['[-1,-2,-3,-4,-5]'], expected: 'false' },
    { inputs: ['[0]'], expected: 'false' },
  ],
  solutions: {
    python: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, x):
#         self.val = x
#         self.next = None

class Solution:
    def hasCycle(self, head):
        slow = head
        fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow is fast:
                return True
        return False
`,
    javascript: `var hasCycle = function(head) {
    let slow = head, fast = head;
    while (fast && fast.next) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow === fast) return true;
    }
    return false;
};
`,
    java: `public class Solution {
    public boolean hasCycle(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }
}
`,
    cpp: `class Solution {
public:
    bool hasCycle(ListNode *head) {
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
            if (slow == fast) return true;
        }
        return false;
    }
};
`,
  },
});

// ============================================================================
// 25. remove-duplicates-from-sorted-list-ii (no duplicates at all)
// ============================================================================
P.push({
  id: 'remove-duplicates-from-sorted-list-ii',
  method_name: 'deleteDuplicates',
  params: [{ name: 'head', type: 'Optional[ListNode]' }],
  return_type: 'Optional[ListNode]',
  pattern: 'Linked List Two Pointers',
  tags: ['linked-list', 'two-pointers'],
  hints: [
    'Use a dummy node to simplify head removal.',
    'Maintain prev pointing to the last "kept" node.',
    'If prev.next and prev.next.next have the same value, skip the entire run.',
    'Otherwise advance prev.',
    'One linear pass.',
  ],
  editorial_md: ED(
    'The list is sorted, so duplicate values form contiguous runs. A node should survive only if its value differs from both neighbours. A dummy in front of the head sidesteps the special case where the head itself is part of a duplicate run.',
    'Allocate a dummy node with dummy.next = head and set prev = dummy. Walk the list. If prev.next exists and prev.next.next has the same value, scan ahead while values keep matching and re-point prev.next past the entire run — those nodes are all duplicates. Otherwise advance prev = prev.next. Return dummy.next at the end. The pass is one traversal because the inner while only consumes nodes that were going to be visited anyway.',
    '- Time: O(n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[1,2,3,3,4,4,5]'], expected: '[1,2,5]' },
    { inputs: ['[1,1,1,2,3]'], expected: '[2,3]' },
    { inputs: ['[1,1,2,2,3,3]'], expected: '[]' },
    { inputs: ['[1,2,3,4,5]'], expected: '[1,2,3,4,5]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[1]'], expected: '[1]' },
    { inputs: ['[1,1]'], expected: '[]' },
    { inputs: ['[1,2,2]'], expected: '[1]' },
    { inputs: ['[1,1,2]'], expected: '[2]' },
    { inputs: ['[1,1,1,1,1]'], expected: '[]' },
    { inputs: ['[-1,0,0,0,1,2]'], expected: '[-1,1,2]' },
  ],
  solutions: {
    python: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

class Solution:
    def deleteDuplicates(self, head):
        dummy = ListNode(0, head)
        prev = dummy
        while prev.next:
            curr = prev.next
            if curr.next and curr.next.val == curr.val:
                v = curr.val
                while curr and curr.val == v:
                    curr = curr.next
                prev.next = curr
            else:
                prev = prev.next
        return dummy.next
`,
    javascript: `var deleteDuplicates = function(head) {
    const dummy = { val: 0, next: head };
    let prev = dummy;
    while (prev.next) {
        let curr = prev.next;
        if (curr.next && curr.next.val === curr.val) {
            const v = curr.val;
            while (curr && curr.val === v) curr = curr.next;
            prev.next = curr;
        } else {
            prev = prev.next;
        }
    }
    return dummy.next;
};
`,
    java: `class Solution {
    public ListNode deleteDuplicates(ListNode head) {
        ListNode dummy = new ListNode(0, head);
        ListNode prev = dummy;
        while (prev.next != null) {
            ListNode curr = prev.next;
            if (curr.next != null && curr.next.val == curr.val) {
                int v = curr.val;
                while (curr != null && curr.val == v) curr = curr.next;
                prev.next = curr;
            } else {
                prev = prev.next;
            }
        }
        return dummy.next;
    }
}
`,
    cpp: `class Solution {
public:
    ListNode* deleteDuplicates(ListNode* head) {
        ListNode dummy(0, head);
        ListNode* prev = &dummy;
        while (prev->next) {
            ListNode* curr = prev->next;
            if (curr->next && curr->next->val == curr->val) {
                int v = curr->val;
                while (curr && curr->val == v) curr = curr->next;
                prev->next = curr;
            } else {
                prev = prev->next;
            }
        }
        return dummy.next;
    }
};
`,
  },
});

// ============================================================================
// 26. pick-k (any k distinct elements / first k after sort)
// ============================================================================
P.push({
  id: 'pick-k',
  description: '<p>Given an integer array <code>nums</code> and an integer <code>k</code>, return the <code>k</code> smallest elements of <code>nums</code> in ascending order.</p>',
  method_name: 'pickK',
  params: [
    { name: 'nums', type: 'List[int]' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'List[int]',
  pattern: 'Heap / Selection',
  tags: ['arrays', 'heap', 'sorting'],
  hints: [
    'Max-heap of size k: push then pop if size exceeds k.',
    'After scanning, the heap holds the k smallest; pop into a list and reverse.',
    'Quickselect achieves average O(n) but the output still needs sorting.',
    'k = 0 returns []; k ≥ n returns the full sorted array.',
    'Stable across negative numbers and duplicates.',
  ],
  editorial_md: ED(
    'To collect the k smallest values online, hold the current k best in a max-heap. Every new value either evicts the current worst or is discarded — the heap shrinks the cost of "is this in the top k?" to O(log k).',
    'Scan nums, pushing each value into a max-heap. After the push, if the heap size exceeds k, pop. At the end the heap holds the k smallest elements, in arbitrary heap order. Drain into a list and sort ascending. Quickselect finds the k-th smallest in expected O(n) and then a final partition or filter pulls the k values — slightly faster but harder to write under pressure. Edge cases: k = 0 returns the empty list immediately; k ≥ len(nums) returns the entire array sorted.',
    '- Time: O(n log k) heap, O(n) average quickselect.\n- Space: O(k).'
  ),
  test_cases: [
    { inputs: ['[3,1,4,1,5,9,2,6]', '3'], expected: '[1,1,2]' },
    { inputs: ['[5,4,3,2,1]', '2'], expected: '[1,2]' },
    { inputs: ['[1,2,3,4,5]', '5'], expected: '[1,2,3,4,5]' },
    { inputs: ['[1]', '1'], expected: '[1]' },
    { inputs: ['[1,2,3]', '0'], expected: '[]' },
    { inputs: ['[]', '0'], expected: '[]' },
    { inputs: ['[7,7,7,7]', '2'], expected: '[7,7]' },
    { inputs: ['[-3,-1,-2,0,1,2]', '3'], expected: '[-3,-2,-1]' },
    { inputs: ['[10,9,8,7,6,5]', '4'], expected: '[5,6,7,8]' },
    { inputs: ['[100,1,50,25,75]', '2'], expected: '[1,25]' },
    { inputs: ['[5,3,5,3,5]', '3'], expected: '[3,3,5]' },
  ],
  solutions: {
    python: `from typing import List
import heapq

class Solution:
    def pickK(self, nums: List[int], k: int) -> List[int]:
        if k <= 0: return []
        if k >= len(nums): return sorted(nums)
        heap: List[int] = []
        for v in nums:
            heapq.heappush(heap, -v)
            if len(heap) > k:
                heapq.heappop(heap)
        return sorted(-x for x in heap)
`,
    javascript: `var pickK = function(nums, k) {
    if (k <= 0) return [];
    return nums.slice().sort((a, b) => a - b).slice(0, Math.min(k, nums.length));
};
`,
    java: `import java.util.*;

class Solution {
    public List<Integer> pickK(int[] nums, int k) {
        List<Integer> out = new ArrayList<>();
        if (k <= 0) return out;
        PriorityQueue<Integer> pq = new PriorityQueue<>(Collections.reverseOrder());
        for (int v : nums) {
            pq.offer(v);
            if (pq.size() > k) pq.poll();
        }
        while (!pq.isEmpty()) out.add(pq.poll());
        Collections.sort(out);
        return out;
    }
}
`,
    cpp: `#include <vector>
#include <queue>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<int> pickK(vector<int>& nums, int k) {
        vector<int> out;
        if (k <= 0) return out;
        priority_queue<int> pq;
        for (int v : nums) {
            pq.push(v);
            if ((int)pq.size() > k) pq.pop();
        }
        while (!pq.empty()) { out.push_back(pq.top()); pq.pop(); }
        sort(out.begin(), out.end());
        return out;
    }
};
`,
  },
});

// ============================================================================
// 27. insertion-sort-list (LeetCode 147)
// ============================================================================
P.push({
  id: 'insertion-sort-list',
  method_name: 'insertionSortList',
  params: [{ name: 'head', type: 'Optional[ListNode]' }],
  return_type: 'Optional[ListNode]',
  pattern: 'Linked List Insertion',
  tags: ['linked-list', 'sorting'],
  hints: [
    'Build a new sorted list by repeatedly removing the head of the input.',
    'Find the correct insertion point in the sorted list using a dummy node.',
    'Optimisation: remember the previous insertion point — skip it on monotone runs.',
    'O(n²) worst case, O(n) on already-sorted input.',
    'O(1) extra space (just pointers).',
  ],
  editorial_md: ED(
    'Insertion sort on a linked list mirrors the array version: scan one element at a time and splice it into the correct slot of the growing sorted prefix. Pointer surgery replaces array shifting.',
    'Allocate a dummy node and let sorted = dummy be the sorted prefix. Walk the input list. For each node detach it, then search sorted starting at dummy for the first place whose .next has a strictly greater value (or is null); splice node in there. A small optimisation: if the new node\'s value is at least as big as the last inserted node\'s value, you can append at the tail without searching from the start. The list is mutated in place — no new node allocations.',
    '- Time: O(n²) worst case.\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[4,2,1,3]'], expected: '[1,2,3,4]' },
    { inputs: ['[-1,5,3,4,0]'], expected: '[-1,0,3,4,5]' },
    { inputs: ['[1]'], expected: '[1]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[1,2,3]'], expected: '[1,2,3]' },
    { inputs: ['[3,2,1]'], expected: '[1,2,3]' },
    { inputs: ['[2,1]'], expected: '[1,2]' },
    { inputs: ['[5,5,5]'], expected: '[5,5,5]' },
    { inputs: ['[1,1,2]'], expected: '[1,1,2]' },
    { inputs: ['[10,-1,5,3,7]'], expected: '[-1,3,5,7,10]' },
    { inputs: ['[0,0,-1,1]'], expected: '[-1,0,0,1]' },
  ],
  solutions: {
    python: `# Definition for singly-linked list.
# class ListNode: ...

class Solution:
    def insertionSortList(self, head):
        dummy = ListNode(0)
        curr = head
        while curr:
            nxt = curr.next
            prev = dummy
            while prev.next and prev.next.val < curr.val:
                prev = prev.next
            curr.next = prev.next
            prev.next = curr
            curr = nxt
        return dummy.next
`,
    javascript: `var insertionSortList = function(head) {
    const dummy = { val: 0, next: null };
    let curr = head;
    while (curr) {
        const next = curr.next;
        let prev = dummy;
        while (prev.next && prev.next.val < curr.val) prev = prev.next;
        curr.next = prev.next;
        prev.next = curr;
        curr = next;
    }
    return dummy.next;
};
`,
    java: `class Solution {
    public ListNode insertionSortList(ListNode head) {
        ListNode dummy = new ListNode(0);
        ListNode curr = head;
        while (curr != null) {
            ListNode next = curr.next;
            ListNode prev = dummy;
            while (prev.next != null && prev.next.val < curr.val) prev = prev.next;
            curr.next = prev.next;
            prev.next = curr;
            curr = next;
        }
        return dummy.next;
    }
}
`,
    cpp: `class Solution {
public:
    ListNode* insertionSortList(ListNode* head) {
        ListNode dummy(0);
        ListNode* curr = head;
        while (curr) {
            ListNode* next = curr->next;
            ListNode* prev = &dummy;
            while (prev->next && prev->next->val < curr->val) prev = prev->next;
            curr->next = prev->next;
            prev->next = curr;
            curr = next;
        }
        return dummy.next;
    }
};
`,
  },
});

// ============================================================================
// 28. split-linked-list-in-parts
// ============================================================================
P.push({
  id: 'split-linked-list-in-parts',
  method_name: 'splitListToParts',
  params: [
    { name: 'head', type: 'Optional[ListNode]' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'List[Optional[ListNode]]',
  pattern: 'Linked List Partition',
  tags: ['linked-list'],
  hints: [
    'Count the list length n.',
    'Each part has base = n // k nodes; the first (n % k) parts get one extra.',
    'Walk the list cutting off chunks of the computed size.',
    'If a part is empty, push null.',
    'O(n) time, O(k) for the result array.',
  ],
  editorial_md: ED(
    'Splitting n nodes into k parts as evenly as possible means each part has either floor(n / k) or floor(n / k) + 1 nodes, with the larger ones bunched at the front. Once you know each part\'s size, walk and cut.',
    'Compute n by traversing once. base = n // k, extra = n % k. For each of k parts compute size = base + (1 if i < extra else 0). If size is zero, set parts[i] = null and continue. Otherwise the current node becomes the head of part i; walk size - 1 nodes forward, capture the next pointer, sever the link, and move curr to that captured next. Result holds k entries, some possibly None at the tail when k > n.',
    '- Time: O(n).\n- Space: O(k) for the output array.'
  ),
  test_cases: [
    { inputs: ['[1,2,3]', '5'], expected: '[[1],[2],[3],[],[]]' },
    { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '3'], expected: '[[1,2,3,4],[5,6,7],[8,9,10]]' },
    { inputs: ['[]', '3'], expected: '[[],[],[]]' },
    { inputs: ['[1]', '1'], expected: '[[1]]' },
    { inputs: ['[1,2]', '5'], expected: '[[1],[2],[],[],[]]' },
    { inputs: ['[1,2,3,4]', '5'], expected: '[[1],[2],[3],[4],[]]' },
    { inputs: ['[1,2,3,4,5]', '5'], expected: '[[1],[2],[3],[4],[5]]' },
    { inputs: ['[1,2,3,4,5,6]', '2'], expected: '[[1,2,3],[4,5,6]]' },
    { inputs: ['[1,2,3,4,5,6,7]', '2'], expected: '[[1,2,3,4],[5,6,7]]' },
    { inputs: ['[1,2,3,4,5,6,7,8]', '3'], expected: '[[1,2,3],[4,5,6],[7,8]]' },
    { inputs: ['[1]', '3'], expected: '[[1],[],[]]' },
  ],
  solutions: {
    python: `# Definition for singly-linked list.
# class ListNode: ...

from typing import List, Optional

class Solution:
    def splitListToParts(self, head, k: int):
        n = 0
        curr = head
        while curr:
            n += 1
            curr = curr.next
        base, extra = divmod(n, k)
        out = []
        curr = head
        for i in range(k):
            size = base + (1 if i < extra else 0)
            if size == 0:
                out.append(None)
                continue
            part_head = curr
            for _ in range(size - 1):
                curr = curr.next
            nxt = curr.next
            curr.next = None
            out.append(part_head)
            curr = nxt
        return out
`,
    javascript: `var splitListToParts = function(head, k) {
    let n = 0, curr = head;
    while (curr) { n++; curr = curr.next; }
    const base = Math.floor(n / k), extra = n % k;
    const out = [];
    curr = head;
    for (let i = 0; i < k; i++) {
        const size = base + (i < extra ? 1 : 0);
        if (size === 0) { out.push(null); continue; }
        const partHead = curr;
        for (let j = 0; j < size - 1; j++) curr = curr.next;
        const next = curr.next;
        curr.next = null;
        out.push(partHead);
        curr = next;
    }
    return out;
};
`,
    java: `class Solution {
    public ListNode[] splitListToParts(ListNode head, int k) {
        int n = 0;
        ListNode curr = head;
        while (curr != null) { n++; curr = curr.next; }
        int base = n / k, extra = n % k;
        ListNode[] out = new ListNode[k];
        curr = head;
        for (int i = 0; i < k; i++) {
            int size = base + (i < extra ? 1 : 0);
            if (size == 0) { out[i] = null; continue; }
            ListNode partHead = curr;
            for (int j = 0; j < size - 1; j++) curr = curr.next;
            ListNode next = curr.next;
            curr.next = null;
            out[i] = partHead;
            curr = next;
        }
        return out;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<ListNode*> splitListToParts(ListNode* head, int k) {
        int n = 0;
        ListNode* curr = head;
        while (curr) { n++; curr = curr->next; }
        int base = n / k, extra = n % k;
        vector<ListNode*> out(k, nullptr);
        curr = head;
        for (int i = 0; i < k; i++) {
            int size = base + (i < extra ? 1 : 0);
            if (size == 0) continue;
            ListNode* partHead = curr;
            for (int j = 0; j < size - 1; j++) curr = curr->next;
            ListNode* next = curr->next;
            curr->next = nullptr;
            out[i] = partHead;
            curr = next;
        }
        return out;
    }
};
`,
  },
});

// ============================================================================
// 29. reverse-nodes-in-k-group-500
// ============================================================================
P.push({
  id: 'reverse-nodes-in-k-group-500',
  method_name: 'reverseKGroup',
  params: [
    { name: 'head', type: 'Optional[ListNode]' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'Optional[ListNode]',
  pattern: 'Linked List Reversal',
  tags: ['linked-list', 'recursion'],
  hints: [
    'Maintain a dummy and a group_prev pointer.',
    'Verify k nodes remain before reversing; if fewer, leave them as-is.',
    'Reverse the next k nodes in place, then re-stitch group_prev to the new head.',
    'Move group_prev to the (former) start of the group.',
    'O(n) time, O(1) extra space.',
  ],
  editorial_md: ED(
    'Reverse the list k nodes at a time. The trick is to verify a full group exists before reversing — otherwise the trailing partial group must remain untouched.',
    'Use a dummy node, set group_prev = dummy. Loop: walk k nodes ahead from group_prev — if you fall off, return dummy.next. Otherwise the k-th node is group_end; remember next_group_start = group_end.next. Reverse the k nodes between group_prev.next and group_end. After reversal, group_prev.next becomes the former group_end (now the new head of the reversed segment), and the former first node of the group becomes the tail; wire its .next to next_group_start. Update group_prev to that former first node and repeat.',
    '- Time: O(n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[1,2,3,4,5]', '2'], expected: '[2,1,4,3,5]' },
    { inputs: ['[1,2,3,4,5]', '3'], expected: '[3,2,1,4,5]' },
    { inputs: ['[1,2,3,4,5]', '1'], expected: '[1,2,3,4,5]' },
    { inputs: ['[1,2]', '2'], expected: '[2,1]' },
    { inputs: ['[1]', '1'], expected: '[1]' },
    { inputs: ['[]', '3'], expected: '[]' },
    { inputs: ['[1,2,3,4,5,6,7,8]', '4'], expected: '[4,3,2,1,8,7,6,5]' },
    { inputs: ['[1,2,3,4,5]', '5'], expected: '[5,4,3,2,1]' },
    { inputs: ['[1,2,3]', '4'], expected: '[1,2,3]' },
    { inputs: ['[1,2,3,4,5,6]', '3'], expected: '[3,2,1,6,5,4]' },
    { inputs: ['[1,2,3,4,5,6,7]', '3'], expected: '[3,2,1,6,5,4,7]' },
  ],
  solutions: {
    python: `# class ListNode: ...

class Solution:
    def reverseKGroup(self, head, k: int):
        dummy = ListNode(0, head)
        group_prev = dummy
        while True:
            kth = group_prev
            for _ in range(k):
                kth = kth.next
                if not kth: return dummy.next
            group_next = kth.next
            prev, curr = group_next, group_prev.next
            while curr is not group_next:
                tmp = curr.next
                curr.next = prev
                prev = curr
                curr = tmp
            tmp = group_prev.next
            group_prev.next = kth
            group_prev = tmp
        return dummy.next
`,
    javascript: `var reverseKGroup = function(head, k) {
    const dummy = { val: 0, next: head };
    let groupPrev = dummy;
    while (true) {
        let kth = groupPrev;
        for (let i = 0; i < k; i++) {
            kth = kth.next;
            if (!kth) return dummy.next;
        }
        const groupNext = kth.next;
        let prev = groupNext, curr = groupPrev.next;
        while (curr !== groupNext) {
            const tmp = curr.next;
            curr.next = prev;
            prev = curr;
            curr = tmp;
        }
        const tmp = groupPrev.next;
        groupPrev.next = kth;
        groupPrev = tmp;
    }
};
`,
    java: `class Solution {
    public ListNode reverseKGroup(ListNode head, int k) {
        ListNode dummy = new ListNode(0, head);
        ListNode groupPrev = dummy;
        while (true) {
            ListNode kth = groupPrev;
            for (int i = 0; i < k; i++) {
                kth = kth.next;
                if (kth == null) return dummy.next;
            }
            ListNode groupNext = kth.next;
            ListNode prev = groupNext, curr = groupPrev.next;
            while (curr != groupNext) {
                ListNode tmp = curr.next;
                curr.next = prev;
                prev = curr;
                curr = tmp;
            }
            ListNode tmp = groupPrev.next;
            groupPrev.next = kth;
            groupPrev = tmp;
        }
    }
}
`,
    cpp: `class Solution {
public:
    ListNode* reverseKGroup(ListNode* head, int k) {
        ListNode dummy(0, head);
        ListNode* groupPrev = &dummy;
        while (true) {
            ListNode* kth = groupPrev;
            for (int i = 0; i < k; i++) {
                kth = kth->next;
                if (!kth) return dummy.next;
            }
            ListNode* groupNext = kth->next;
            ListNode* prev = groupNext;
            ListNode* curr = groupPrev->next;
            while (curr != groupNext) {
                ListNode* tmp = curr->next;
                curr->next = prev;
                prev = curr;
                curr = tmp;
            }
            ListNode* tmp = groupPrev->next;
            groupPrev->next = kth;
            groupPrev = tmp;
        }
    }
};
`,
  },
});

// ============================================================================
// 30. next-greater-element-i
// ============================================================================
P.push({
  id: 'next-greater-element-i',
  method_name: 'nextGreaterElement',
  params: [
    { name: 'nums1', type: 'List[int]' },
    { name: 'nums2', type: 'List[int]' },
  ],
  return_type: 'List[int]',
  pattern: 'Monotonic Stack',
  tags: ['arrays', 'stack', 'hash-table'],
  hints: [
    'Solve "next greater element" on nums2 with a decreasing stack.',
    'Pop while top < current; record the current value as the answer for the popped index.',
    'Store the mapping (value → next greater) in a hash map.',
    'For each query in nums1 look up the map; default -1.',
    'O(n + m) time.',
  ],
  editorial_md: ED(
    'For each value in nums2, the next greater element is the first larger value to its right. A monotonic decreasing stack pops everything smaller than the current value, and at the moment of popping you know the current value is the answer.',
    'Walk nums2 left to right keeping a stack of values whose "next greater" is still unknown. While the stack is non-empty and the top is less than the current value, pop and record `next_greater[top] = current` in a hash map. Push the current value. After the pass any values still on the stack have no next greater — they default to -1 when not present in the map. For each x in nums1 look up the map and return the answer or -1.',
    '- Time: O(n + m).\n- Space: O(n).'
  ),
  test_cases: [
    { inputs: ['[4,1,2]', '[1,3,4,2]'], expected: '[-1,3,-1]' },
    { inputs: ['[2,4]', '[1,2,3,4]'], expected: '[3,-1]' },
    { inputs: ['[1]', '[1]'], expected: '[-1]' },
    { inputs: ['[1,2,3]', '[3,2,1]'], expected: '[-1,-1,-1]' },
    { inputs: ['[3,2,1]', '[1,2,3]'], expected: '[-1,-1,-1]' },
    { inputs: ['[1,3,5,2,4]', '[6,5,4,3,2,1,7]'], expected: '[7,7,7,7,7]' },
    { inputs: ['[1]', '[1,2]'], expected: '[2]' },
    { inputs: ['[100,200]', '[100,200,300]'], expected: '[200,300]' },
    { inputs: ['[5]', '[5,4,3,2,1]'], expected: '[-1]' },
    { inputs: ['[1,5,9]', '[9,5,1,3,7]'], expected: '[3,7,-1]' },
    { inputs: ['[0]', '[0,1,-1,2]'], expected: '[1]' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def nextGreaterElement(self, nums1: List[int], nums2: List[int]) -> List[int]:
        nxt: dict[int, int] = {}
        stack: List[int] = []
        for v in nums2:
            while stack and stack[-1] < v:
                nxt[stack.pop()] = v
            stack.append(v)
        return [nxt.get(v, -1) for v in nums1]
`,
    javascript: `var nextGreaterElement = function(nums1, nums2) {
    const nxt = new Map();
    const stack = [];
    for (const v of nums2) {
        while (stack.length && stack[stack.length - 1] < v) nxt.set(stack.pop(), v);
        stack.push(v);
    }
    return nums1.map(v => nxt.has(v) ? nxt.get(v) : -1);
};
`,
    java: `import java.util.*;

class Solution {
    public int[] nextGreaterElement(int[] nums1, int[] nums2) {
        Map<Integer, Integer> nxt = new HashMap<>();
        Deque<Integer> stack = new ArrayDeque<>();
        for (int v : nums2) {
            while (!stack.isEmpty() && stack.peek() < v) nxt.put(stack.pop(), v);
            stack.push(v);
        }
        int[] out = new int[nums1.length];
        for (int i = 0; i < nums1.length; i++) out[i] = nxt.getOrDefault(nums1[i], -1);
        return out;
    }
}
`,
    cpp: `#include <vector>
#include <stack>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> nextGreaterElement(vector<int>& nums1, vector<int>& nums2) {
        unordered_map<int, int> nxt;
        stack<int> st;
        for (int v : nums2) {
            while (!st.empty() && st.top() < v) { nxt[st.top()] = v; st.pop(); }
            st.push(v);
        }
        vector<int> out;
        out.reserve(nums1.size());
        for (int v : nums1) out.push_back(nxt.count(v) ? nxt[v] : -1);
        return out;
    }
};
`,
  },
});

// ============================================================================
// 31. exclusive-time-of-functions
// ============================================================================
P.push({
  id: 'exclusive-time-of-functions',
  method_name: 'exclusiveTime',
  params: [
    { name: 'n', type: 'int' },
    { name: 'logs', type: 'List[str]' },
  ],
  return_type: 'List[int]',
  pattern: 'Stack Simulation',
  tags: ['stack', 'simulation'],
  hints: [
    'Parse logs into (id, type, timestamp).',
    'Stack holds currently running function ids.',
    'On "start": charge the running function for time since the last event, push id, update prev time.',
    'On "end": charge top of stack for inclusive duration, pop, update prev = end + 1.',
    'Sum into the answer array, indexed by function id.',
  ],
  editorial_md: ED(
    'A single-threaded CPU plus a function call stack — exclusive time of a function is the time it spent on top of the stack. Sweep the log entries and charge intervals to whoever currently sits at the top.',
    'Track a stack of function ids currently executing and a `prev` time pointer. Parse each log. On "start" with timestamp t: if the stack is non-empty, add t - prev to the function at the top (it ran from prev up to t-1 inclusive, which is t - prev units). Push the new id. Set prev = t. On "end" at timestamp t: add t - prev + 1 to the function at the top (it ran the last [prev, t] interval, which is t - prev + 1 units). Pop. Set prev = t + 1. Accumulate per-id totals into the output. The first "start" pushes onto the empty stack with no charge, which is correct.',
    '- Time: O(L).\n- Space: O(L) worst case stack.'
  ),
  test_cases: [
    { inputs: ['2', '["0:start:0","1:start:2","1:end:5","0:end:6"]'], expected: '[3,4]' },
    { inputs: ['1', '["0:start:0","0:end:0"]'], expected: '[1]' },
    { inputs: ['2', '["0:start:0","0:start:2","0:end:5","0:end:6"]'], expected: '[7,0]' },
    { inputs: ['2', '["0:start:0","0:end:0","1:start:1","1:end:1"]'], expected: '[1,1]' },
    { inputs: ['1', '["0:start:0","0:start:1","0:end:2","0:end:3"]'], expected: '[4]' },
    { inputs: ['1', '["0:start:0","0:end:9"]'], expected: '[10]' },
    { inputs: ['3', '["0:start:0","1:start:2","2:start:3","2:end:4","1:end:5","0:end:6"]'], expected: '[3,2,2]' },
    { inputs: ['1', '["0:start:5","0:end:5"]'], expected: '[1]' },
    { inputs: ['2', '["0:start:0","1:start:1","1:end:1","0:end:2"]'], expected: '[2,1]' },
    { inputs: ['1', '["0:start:0","0:start:5","0:end:6","0:end:7"]'], expected: '[8]' },
    { inputs: ['2', '["1:start:0","1:end:0","0:start:1","0:end:9"]'], expected: '[9,1]' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def exclusiveTime(self, n: int, logs: List[str]) -> List[int]:
        ans = [0] * n
        stack: List[int] = []
        prev = 0
        for log in logs:
            sid, kind, t = log.split(':')
            fid = int(sid); ts = int(t)
            if kind == 'start':
                if stack:
                    ans[stack[-1]] += ts - prev
                stack.append(fid)
                prev = ts
            else:
                ans[stack.pop()] += ts - prev + 1
                prev = ts + 1
        return ans
`,
    javascript: `var exclusiveTime = function(n, logs) {
    const ans = new Array(n).fill(0);
    const stack = [];
    let prev = 0;
    for (const log of logs) {
        const [sid, kind, t] = log.split(':');
        const fid = +sid, ts = +t;
        if (kind === 'start') {
            if (stack.length) ans[stack[stack.length - 1]] += ts - prev;
            stack.push(fid);
            prev = ts;
        } else {
            ans[stack.pop()] += ts - prev + 1;
            prev = ts + 1;
        }
    }
    return ans;
};
`,
    java: `import java.util.*;

class Solution {
    public int[] exclusiveTime(int n, List<String> logs) {
        int[] ans = new int[n];
        Deque<Integer> stack = new ArrayDeque<>();
        int prev = 0;
        for (String log : logs) {
            String[] parts = log.split(":");
            int fid = Integer.parseInt(parts[0]);
            int ts = Integer.parseInt(parts[2]);
            if (parts[1].equals("start")) {
                if (!stack.isEmpty()) ans[stack.peek()] += ts - prev;
                stack.push(fid);
                prev = ts;
            } else {
                ans[stack.pop()] += ts - prev + 1;
                prev = ts + 1;
            }
        }
        return ans;
    }
}
`,
    cpp: `#include <vector>
#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    vector<int> exclusiveTime(int n, vector<string>& logs) {
        vector<int> ans(n, 0);
        stack<int> st;
        int prev = 0;
        for (auto& log : logs) {
            auto p1 = log.find(':');
            auto p2 = log.find(':', p1 + 1);
            int fid = stoi(log.substr(0, p1));
            string kind = log.substr(p1 + 1, p2 - p1 - 1);
            int ts = stoi(log.substr(p2 + 1));
            if (kind == "start") {
                if (!st.empty()) ans[st.top()] += ts - prev;
                st.push(fid);
                prev = ts;
            } else {
                ans[st.top()] += ts - prev + 1;
                st.pop();
                prev = ts + 1;
            }
        }
        return ans;
    }
};
`,
  },
});

// ============================================================================
// 32. design-a-stack-with-increment (operation log simulation)
// ============================================================================
P.push({
  id: 'design-a-stack-with-increment',
  method_name: 'stackWithIncrement',
  params: [{ name: 'operations', type: 'List[str]' }],
  return_type: 'List[int]',
  pattern: 'Stack + Lazy Increment',
  tags: ['stack', 'design'],
  hints: [
    'Track a stack of values and a parallel "increment" array.',
    'push: append to stack (bounded by maxSize); inc receives a 0 push too.',
    'pop: apply pending increment to the value below, then pop and return.',
    'inc k val: add val to inc[min(k, size) - 1] — propagates lazily.',
    'Operations are strings: "push x", "pop", "inc k val".',
  ],
  editorial_md: ED(
    'Bulk-incrementing the bottom k elements naively is O(k). The lazy trick stores the pending increment in a parallel array indexed by the topmost element it affects, then folds it downward at pop time.',
    'Allocate two arrays the size of the stack: `vals` (the actual values) and `inc` (pending increments). For "push x" parse x; if vals already at capacity ignore (or do nothing per problem); otherwise append x and push a 0 to inc. For "pop": if empty return -1; otherwise let v = vals[top] + inc[top]; if there is an element below (top > 0) propagate inc[top - 1] += inc[top]; pop both arrays and append v to the output. For "inc k val" with k > 0: let i = min(k, len(vals)) - 1; if i >= 0 then inc[i] += val. The whole simulation runs in O(N) ops because each push, pop, and inc is amortized O(1).',
    '- Time: O(M) amortized over M operations.\n- Space: O(maxSize).'
  ),
  test_cases: [
    { inputs: ['["push 1","push 2","pop","push 3","inc 2 100","pop","pop"]'], expected: '[2,103,101]' },
    { inputs: ['["pop","push 5","pop"]'], expected: '[-1,5]' },
    { inputs: ['["push 1","push 2","push 3","inc 3 10","pop","pop","pop"]'], expected: '[13,12,11]' },
    { inputs: ['["push 1","pop","pop"]'], expected: '[1,-1]' },
    { inputs: ['["inc 5 10","push 1","pop"]'], expected: '[1]' },
    { inputs: ['["push 1","push 2","inc 1 5","pop","pop"]'], expected: '[2,6]' },
    { inputs: ['["push 1","inc 1 100","pop"]'], expected: '[101]' },
    { inputs: ['["push 10","push 20","push 30","inc 2 5","pop","pop","pop"]'], expected: '[30,25,15]' },
    { inputs: ['["push 0","push 0","inc 2 0","pop","pop"]'], expected: '[0,0]' },
    { inputs: ['["push 5"]'], expected: '[]' },
    { inputs: ['["push 1","push 2","push 3","inc 10 1","pop","pop","pop"]'], expected: '[4,3,2]' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def stackWithIncrement(self, operations: List[str]) -> List[int]:
        vals: List[int] = []
        inc: List[int] = []
        out: List[int] = []
        for op in operations:
            parts = op.split()
            if parts[0] == 'push':
                vals.append(int(parts[1]))
                inc.append(0)
            elif parts[0] == 'pop':
                if not vals:
                    out.append(-1)
                else:
                    v = vals.pop() + inc.pop()
                    if inc:
                        inc[-1] += 0  # noop placeholder; propagation already handled below
                    out.append(v)
                    # propagate is wrong above; correct: propagate before pop
            else:  # 'inc'
                k = int(parts[1]); val = int(parts[2])
                if vals:
                    i = min(k, len(vals)) - 1
                    inc[i] += val
        # The above pop is slightly off — redo cleanly:
        return out
`,
    // Rewrite python cleanly below
    javascript: `var stackWithIncrement = function(operations) {
    const vals = [], inc = [];
    const out = [];
    for (const op of operations) {
        const parts = op.split(' ');
        if (parts[0] === 'push') {
            vals.push(+parts[1]);
            inc.push(0);
        } else if (parts[0] === 'pop') {
            if (!vals.length) { out.push(-1); continue; }
            const top = vals.length - 1;
            const v = vals[top] + inc[top];
            if (top > 0) inc[top - 1] += inc[top];
            vals.pop(); inc.pop();
            out.push(v);
        } else { // inc
            const k = +parts[1], val = +parts[2];
            if (vals.length) {
                const i = Math.min(k, vals.length) - 1;
                inc[i] += val;
            }
        }
    }
    return out;
};
`,
    java: `import java.util.*;

class Solution {
    public List<Integer> stackWithIncrement(List<String> operations) {
        List<Integer> vals = new ArrayList<>();
        List<Integer> inc = new ArrayList<>();
        List<Integer> out = new ArrayList<>();
        for (String op : operations) {
            String[] parts = op.split(" ");
            if (parts[0].equals("push")) {
                vals.add(Integer.parseInt(parts[1]));
                inc.add(0);
            } else if (parts[0].equals("pop")) {
                if (vals.isEmpty()) { out.add(-1); continue; }
                int top = vals.size() - 1;
                int v = vals.get(top) + inc.get(top);
                if (top > 0) inc.set(top - 1, inc.get(top - 1) + inc.get(top));
                vals.remove(top);
                inc.remove(top);
                out.add(v);
            } else {
                int k = Integer.parseInt(parts[1]);
                int val = Integer.parseInt(parts[2]);
                if (!vals.isEmpty()) {
                    int i = Math.min(k, vals.size()) - 1;
                    inc.set(i, inc.get(i) + val);
                }
            }
        }
        return out;
    }
}
`,
    cpp: `#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<int> stackWithIncrement(vector<string>& operations) {
        vector<int> vals, inc, out;
        for (auto& op : operations) {
            stringstream ss(op);
            string cmd; ss >> cmd;
            if (cmd == "push") {
                int x; ss >> x;
                vals.push_back(x);
                inc.push_back(0);
            } else if (cmd == "pop") {
                if (vals.empty()) { out.push_back(-1); continue; }
                int top = (int)vals.size() - 1;
                int v = vals[top] + inc[top];
                if (top > 0) inc[top - 1] += inc[top];
                vals.pop_back(); inc.pop_back();
                out.push_back(v);
            } else {
                int k, val; ss >> k >> val;
                if (!vals.empty()) {
                    int i = min(k, (int)vals.size()) - 1;
                    inc[i] += val;
                }
            }
        }
        return out;
    }
};
`,
  },
});

// Fix python solution for design-a-stack-with-increment
P[P.length - 1].solutions.python = `from typing import List

class Solution:
    def stackWithIncrement(self, operations: List[str]) -> List[int]:
        vals: List[int] = []
        inc: List[int] = []
        out: List[int] = []
        for op in operations:
            parts = op.split()
            if parts[0] == 'push':
                vals.append(int(parts[1]))
                inc.append(0)
            elif parts[0] == 'pop':
                if not vals:
                    out.append(-1)
                    continue
                top = len(vals) - 1
                v = vals[top] + inc[top]
                if top > 0:
                    inc[top - 1] += inc[top]
                vals.pop()
                inc.pop()
                out.append(v)
            else:  # 'inc'
                k = int(parts[1]); val = int(parts[2])
                if vals:
                    i = min(k, len(vals)) - 1
                    inc[i] += val
        return out
`;

// ============================================================================
// 33. car-fleet-ii (asteroid collision)
// ============================================================================
P.push({
  id: 'car-fleet-ii',
  method_name: 'asteroidCollision',
  params: [{ name: 'asteroids', type: 'List[int]' }],
  return_type: 'List[int]',
  pattern: 'Monotonic Stack',
  tags: ['stack', 'simulation'],
  hints: [
    'Iterate the asteroids using a stack.',
    'Positive asteroid never collides — just push.',
    'Negative asteroid annihilates positive asteroids on top while |neg| > top, popping equals.',
    'Push the surviving negative if no positive remains on the stack.',
    'O(n) total since each asteroid is pushed and popped at most once.',
  ],
  editorial_md: ED(
    'Collisions only happen at the moment a moving-left asteroid encounters a moving-right one already on the stack. Use the stack as the current rightward column and resolve collisions with each incoming negative until it settles.',
    'Walk left to right. For each value: if it is positive, push. If negative, loop: while the stack is non-empty and its top is positive (so they\'re moving toward each other), compare magnitudes. If top < |value|, pop and continue (incoming wins). If top == |value|, pop and break (both destroyed). If top > |value|, break (incoming destroyed). After the loop, if the stack is empty or the top is negative, push the current value. The total work across all asteroids is O(n) because each asteroid is pushed once and popped at most once.',
    '- Time: O(n).\n- Space: O(n).'
  ),
  test_cases: [
    { inputs: ['[5,10,-5]'], expected: '[5,10]' },
    { inputs: ['[8,-8]'], expected: '[]' },
    { inputs: ['[10,2,-5]'], expected: '[10]' },
    { inputs: ['[-2,-1,1,2]'], expected: '[-2,-1,1,2]' },
    { inputs: ['[1,-2,-2,-2]'], expected: '[-2,-2,-2]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[5]'], expected: '[5]' },
    { inputs: ['[-5]'], expected: '[-5]' },
    { inputs: ['[1,2,3,-3,-2,-1]'], expected: '[]' },
    { inputs: ['[10,-5,-10]'], expected: '[-10]' },
    { inputs: ['[-2,2,-1,-2]'], expected: '[-2,-2]' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def asteroidCollision(self, asteroids: List[int]) -> List[int]:
        st: List[int] = []
        for a in asteroids:
            alive = True
            while alive and a < 0 and st and st[-1] > 0:
                if st[-1] < -a:
                    st.pop()
                elif st[-1] == -a:
                    st.pop(); alive = False
                else:
                    alive = False
            if alive:
                st.append(a)
        return st
`,
    javascript: `var asteroidCollision = function(asteroids) {
    const st = [];
    for (const a of asteroids) {
        let alive = true;
        while (alive && a < 0 && st.length && st[st.length - 1] > 0) {
            if (st[st.length - 1] < -a) st.pop();
            else if (st[st.length - 1] === -a) { st.pop(); alive = false; }
            else alive = false;
        }
        if (alive) st.push(a);
    }
    return st;
};
`,
    java: `import java.util.*;

class Solution {
    public int[] asteroidCollision(int[] asteroids) {
        Deque<Integer> st = new ArrayDeque<>();
        for (int a : asteroids) {
            boolean alive = true;
            while (alive && a < 0 && !st.isEmpty() && st.peek() > 0) {
                if (st.peek() < -a) st.pop();
                else if (st.peek() == -a) { st.pop(); alive = false; }
                else alive = false;
            }
            if (alive) st.push(a);
        }
        int[] out = new int[st.size()];
        for (int i = st.size() - 1; i >= 0; i--) out[i] = st.pop();
        return out;
    }
}
`,
    cpp: `#include <vector>
#include <cstdlib>
using namespace std;

class Solution {
public:
    vector<int> asteroidCollision(vector<int>& asteroids) {
        vector<int> st;
        for (int a : asteroids) {
            bool alive = true;
            while (alive && a < 0 && !st.empty() && st.back() > 0) {
                if (st.back() < -a) st.pop_back();
                else if (st.back() == -a) { st.pop_back(); alive = false; }
                else alive = false;
            }
            if (alive) st.push_back(a);
        }
        return st;
    }
};
`,
  },
});

// ============================================================================
// 34. largest-rectangle-in-histogram-500
// ============================================================================
P.push({
  id: 'largest-rectangle-in-histogram-500',
  method_name: 'largestRectangleArea',
  params: [{ name: 'heights', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Monotonic Stack',
  tags: ['stack', 'arrays'],
  hints: [
    'For each bar, find the widest rectangle in which it is the smallest.',
    'Monotonic increasing stack of indices.',
    'When a smaller bar appears, pop and compute the area using popped height × width.',
    'Width = current_index - stack.top() - 1 (or current_index if stack empty).',
    'Append a sentinel height = 0 at the end to flush the stack.',
  ],
  editorial_md: ED(
    'Every maximal rectangle has some bar as its limiting height. So if we can compute, for each bar, the widest range over which it stays the minimum, the answer is the max of height × width across all bars. A monotonic stack does this in O(n).',
    'Maintain a stack of indices whose heights are strictly increasing. Walk the array; while the current bar is shorter than the height at the stack top, pop. The popped bar can no longer extend to the right, so finalize its area: height = heights[popped], width = current_index - (new_top + 1) if stack non-empty else current_index. Push the current index. At the end, treat any remaining indices as if the right boundary were n. The sentinel trick — append 0 to heights — flushes the stack in the main loop without a special case.',
    '- Time: O(n).\n- Space: O(n).'
  ),
  test_cases: [
    { inputs: ['[2,1,5,6,2,3]'], expected: '10' },
    { inputs: ['[2,4]'], expected: '4' },
    { inputs: ['[1]'], expected: '1' },
    { inputs: ['[0]'], expected: '0' },
    { inputs: ['[]'], expected: '0' },
    { inputs: ['[5,4,3,2,1]'], expected: '9' },
    { inputs: ['[1,2,3,4,5]'], expected: '9' },
    { inputs: ['[3,3,3,3]'], expected: '12' },
    { inputs: ['[6,2,5,4,5,1,6]'], expected: '12' },
    { inputs: ['[1,1,1,1,1,1,1,1,1,1]'], expected: '10' },
    { inputs: ['[2,1,2]'], expected: '3' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def largestRectangleArea(self, heights: List[int]) -> int:
        st: List[int] = []
        best = 0
        n = len(heights)
        for i in range(n + 1):
            cur = 0 if i == n else heights[i]
            while st and heights[st[-1]] > cur:
                h = heights[st.pop()]
                w = i if not st else i - st[-1] - 1
                if h * w > best: best = h * w
            st.append(i)
        return best
`,
    javascript: `var largestRectangleArea = function(heights) {
    const st = [];
    let best = 0;
    const n = heights.length;
    for (let i = 0; i <= n; i++) {
        const cur = i === n ? 0 : heights[i];
        while (st.length && heights[st[st.length - 1]] > cur) {
            const h = heights[st.pop()];
            const w = st.length === 0 ? i : i - st[st.length - 1] - 1;
            if (h * w > best) best = h * w;
        }
        st.push(i);
    }
    return best;
};
`,
    java: `import java.util.*;

class Solution {
    public int largestRectangleArea(int[] heights) {
        Deque<Integer> st = new ArrayDeque<>();
        int best = 0, n = heights.length;
        for (int i = 0; i <= n; i++) {
            int cur = (i == n) ? 0 : heights[i];
            while (!st.isEmpty() && heights[st.peek()] > cur) {
                int h = heights[st.pop()];
                int w = st.isEmpty() ? i : i - st.peek() - 1;
                if (h * w > best) best = h * w;
            }
            st.push(i);
        }
        return best;
    }
}
`,
    cpp: `#include <vector>
#include <stack>
using namespace std;

class Solution {
public:
    int largestRectangleArea(vector<int>& heights) {
        stack<int> st;
        int best = 0, n = heights.size();
        for (int i = 0; i <= n; i++) {
            int cur = (i == n) ? 0 : heights[i];
            while (!st.empty() && heights[st.top()] > cur) {
                int h = heights[st.top()]; st.pop();
                int w = st.empty() ? i : i - st.top() - 1;
                if (h * w > best) best = h * w;
            }
            st.push(i);
        }
        return best;
    }
};
`,
  },
});

// ============================================================================
// 35. minimum-remove-to-make-valid (parentheses)
// ============================================================================
P.push({
  id: 'minimum-remove-to-make-valid',
  method_name: 'minRemoveToMakeValid',
  params: [{ name: 's', type: 'str' }],
  return_type: 'str',
  pattern: 'Stack',
  tags: ['strings', 'stack'],
  hints: [
    'Pass 1: stack of unmatched ( indices. On ) pop if non-empty else mark this ) for removal.',
    'Pass 2: anything left on the stack is unmatched ( — mark for removal.',
    'Build the result skipping marked indices.',
    'Letters are never touched.',
    'O(n) time, O(n) space.',
  ],
  editorial_md: ED(
    'Two kinds of problem characters: a `)` with no earlier unmatched `(`, and a `(` with no later matching `)`. Mark both kinds for deletion, then rebuild.',
    'First pass: walk left to right. Push index of every `(` onto a stack. For each `)`, if the stack is non-empty pop a matched `(`, otherwise add this index to the remove set. Second pass / cleanup: any indices left on the stack are unmatched `(` — add them to the remove set. Final pass: build the result by appending every character whose index is not in the remove set. Letters are copied untouched. Hash set of removable indices keeps lookup O(1).',
    '- Time: O(n).\n- Space: O(n).'
  ),
  test_cases: [
    { inputs: ['"lee(t(c)o)de)"'], expected: '"lee(t(c)o)de"' },
    { inputs: ['"a)b(c)d"'], expected: '"ab(c)d"' },
    { inputs: ['"))(("'], expected: '""' },
    { inputs: ['""'], expected: '""' },
    { inputs: ['"abc"'], expected: '"abc"' },
    { inputs: ['"((("'], expected: '""' },
    { inputs: ['")))"'], expected: '""' },
    { inputs: ['"(a(b)c)"'], expected: '"(a(b)c)"' },
    { inputs: ['"(a)"'], expected: '"(a)"' },
    { inputs: ['"a"'], expected: '"a"' },
    { inputs: ['"((a)"'], expected: '"(a)"' },
  ],
  solutions: {
    python: `class Solution:
    def minRemoveToMakeValid(self, s: str) -> str:
        remove = set()
        stack = []
        for i, ch in enumerate(s):
            if ch == '(':
                stack.append(i)
            elif ch == ')':
                if stack:
                    stack.pop()
                else:
                    remove.add(i)
        remove.update(stack)
        return ''.join(ch for i, ch in enumerate(s) if i not in remove)
`,
    javascript: `var minRemoveToMakeValid = function(s) {
    const remove = new Set();
    const stack = [];
    for (let i = 0; i < s.length; i++) {
        if (s[i] === '(') stack.push(i);
        else if (s[i] === ')') {
            if (stack.length) stack.pop();
            else remove.add(i);
        }
    }
    for (const i of stack) remove.add(i);
    let out = '';
    for (let i = 0; i < s.length; i++) if (!remove.has(i)) out += s[i];
    return out;
};
`,
    java: `import java.util.*;

class Solution {
    public String minRemoveToMakeValid(String s) {
        Set<Integer> remove = new HashSet<>();
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '(') stack.push(i);
            else if (c == ')') {
                if (!stack.isEmpty()) stack.pop();
                else remove.add(i);
            }
        }
        while (!stack.isEmpty()) remove.add(stack.pop());
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) if (!remove.contains(i)) sb.append(s.charAt(i));
        return sb.toString();
    }
}
`,
    cpp: `#include <string>
#include <unordered_set>
#include <stack>
using namespace std;

class Solution {
public:
    string minRemoveToMakeValid(string s) {
        unordered_set<int> remove;
        stack<int> st;
        for (int i = 0; i < (int)s.size(); i++) {
            if (s[i] == '(') st.push(i);
            else if (s[i] == ')') {
                if (!st.empty()) st.pop();
                else remove.insert(i);
            }
        }
        while (!st.empty()) { remove.insert(st.top()); st.pop(); }
        string out;
        for (int i = 0; i < (int)s.size(); i++) if (!remove.count(i)) out += s[i];
        return out;
    }
};
`,
  },
});

// ============================================================================
// 36. n-trailing-zeroes (count trailing zeros of n!)
// ============================================================================
P.push({
  id: 'n-trailing-zeroes',
  description: '<p>Given an integer <code>n</code>, return the number of trailing zeros in <code>n!</code> (n factorial).</p>',
  method_name: 'trailingZeroes',
  params: [{ name: 'n', type: 'int' }],
  return_type: 'int',
  pattern: 'Math (Legendre)',
  tags: ['math'],
  hints: [
    'Trailing zeros come from factors of 10 = 2 × 5.',
    'Factors of 2 always exceed factors of 5 in n!, so just count 5s.',
    'Sum n//5 + n//25 + n//125 + … (Legendre\'s formula).',
    'Stop when the divisor exceeds n.',
    'O(log_5 n) time.',
  ],
  editorial_md: ED(
    'A trailing zero in n! is contributed by every pair (2, 5) in the prime factorisation. There are always more 2s than 5s, so the answer is the exponent of 5 in n!.',
    'Legendre\'s formula says the exponent of prime p in n! is sum over k of floor(n / p^k). For p = 5, that is n // 5 + n // 25 + n // 125 + … Compute it iteratively: keep dividing n by 5 and accumulate. The loop runs about log_5 n times because once 5^k exceeds n the contribution is zero. No big-integer arithmetic needed even for very large n.',
    '- Time: O(log_5 n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['3'], expected: '0' },
    { inputs: ['5'], expected: '1' },
    { inputs: ['10'], expected: '2' },
    { inputs: ['25'], expected: '6' },
    { inputs: ['0'], expected: '0' },
    { inputs: ['1'], expected: '0' },
    { inputs: ['100'], expected: '24' },
    { inputs: ['125'], expected: '31' },
    { inputs: ['1000'], expected: '249' },
    { inputs: ['9999'], expected: '2498' },
    { inputs: ['50'], expected: '12' },
  ],
  solutions: {
    python: `class Solution:
    def trailingZeroes(self, n: int) -> int:
        count = 0
        while n:
            n //= 5
            count += n
        return count
`,
    javascript: `var trailingZeroes = function(n) {
    let count = 0;
    while (n > 0) {
        n = Math.floor(n / 5);
        count += n;
    }
    return count;
};
`,
    java: `class Solution {
    public int trailingZeroes(int n) {
        int count = 0;
        while (n > 0) { n /= 5; count += n; }
        return count;
    }
}
`,
    cpp: `class Solution {
public:
    int trailingZeroes(int n) {
        int count = 0;
        while (n > 0) { n /= 5; count += n; }
        return count;
    }
};
`,
  },
});

// ============================================================================
// 37. book-allocation (split-array minimum largest sum — m subarrays)
// ============================================================================
P.push({
  id: 'book-allocation',
  description: '<p>Given an integer array <code>pages</code> where <code>pages[i]</code> is the number of pages in the i-th book, and an integer <code>m</code> students, allocate the books to students so that:</p><ul><li>Each student gets at least one book.</li><li>Each book goes to exactly one student.</li><li>Books are assigned in contiguous order.</li></ul><p>Minimise the maximum pages any single student reads.</p>',
  method_name: 'findPages',
  params: [
    { name: 'pages', type: 'List[int]' },
    { name: 'm', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Binary Search on Answer',
  tags: ['arrays', 'binary-search'],
  hints: [
    'Binary search the answer in [max(pages), sum(pages)].',
    'Feasibility: greedily count how many students are needed if the cap is mid.',
    'If feasible students ≤ m, shrink upper bound.',
    'If not, raise lower bound.',
    'Return -1 if m > len(pages).',
  ],
  editorial_md: ED(
    'Asking "can we allocate with max load ≤ X?" is monotone: if true for X, it is true for any larger X. Binary search the smallest X where the answer flips from false to true.',
    'Edge case: if m > len(pages), no valid allocation exists (some student gets no book). Lower bound for the answer is max(pages) — no student can have less than the largest book. Upper bound is sum(pages) — one student takes everything. Binary search mid in [lo, hi]. Feasibility check: greedily group pages from left to right, starting a new group whenever adding the next book would exceed mid. Count groups. If groups ≤ m we can do it with at most m students, so hi = mid. Else lo = mid + 1. Loop ends with lo == hi, the answer.',
    '- Time: O(n · log(sum(pages))).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[12,34,67,90]', '2'], expected: '113' },
    { inputs: ['[10,20,30,40]', '2'], expected: '60' },
    { inputs: ['[10,20,30,40]', '4'], expected: '40' },
    { inputs: ['[10,20,30,40]', '1'], expected: '100' },
    { inputs: ['[100]', '1'], expected: '100' },
    { inputs: ['[100]', '2'], expected: '-1' },
    { inputs: ['[1,1,1,1,1]', '5'], expected: '1' },
    { inputs: ['[5,5,5,5]', '2'], expected: '10' },
    { inputs: ['[7,2,5,10,8]', '2'], expected: '18' },
    { inputs: ['[1,2,3,4,5]', '2'], expected: '9' },
    { inputs: ['[2,3,1,1,1,1,3]', '5'], expected: '3' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def findPages(self, pages: List[int], m: int) -> int:
        n = len(pages)
        if m > n: return -1
        def feasible(cap: int) -> bool:
            students = 1; load = 0
            for p in pages:
                if load + p > cap:
                    students += 1; load = p
                    if students > m: return False
                else:
                    load += p
            return True
        lo, hi = max(pages), sum(pages)
        while lo < hi:
            mid = (lo + hi) // 2
            if feasible(mid):
                hi = mid
            else:
                lo = mid + 1
        return lo
`,
    javascript: `var findPages = function(pages, m) {
    const n = pages.length;
    if (m > n) return -1;
    const feasible = cap => {
        let students = 1, load = 0;
        for (const p of pages) {
            if (load + p > cap) { students++; load = p; if (students > m) return false; }
            else load += p;
        }
        return true;
    };
    let lo = Math.max(...pages), hi = pages.reduce((s, x) => s + x, 0);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (feasible(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};
`,
    java: `class Solution {
    public int findPages(int[] pages, int m) {
        int n = pages.length;
        if (m > n) return -1;
        int lo = 0, hi = 0;
        for (int p : pages) { lo = Math.max(lo, p); hi += p; }
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (feasible(pages, m, mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
    private boolean feasible(int[] pages, int m, int cap) {
        int students = 1, load = 0;
        for (int p : pages) {
            if (load + p > cap) { students++; load = p; if (students > m) return false; }
            else load += p;
        }
        return true;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;

class Solution {
public:
    int findPages(vector<int>& pages, int m) {
        int n = pages.size();
        if (m > n) return -1;
        int lo = *max_element(pages.begin(), pages.end());
        int hi = accumulate(pages.begin(), pages.end(), 0);
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (feasible(pages, m, mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
private:
    bool feasible(vector<int>& pages, int m, int cap) {
        int students = 1, load = 0;
        for (int p : pages) {
            if (load + p > cap) { students++; load = p; if (students > m) return false; }
            else load += p;
        }
        return true;
    }
};
`,
  },
});

// ============================================================================
// 38. isomorphic-strings
// ============================================================================
P.push({
  id: 'isomorphic-strings',
  method_name: 'isIsomorphic',
  params: [
    { name: 's', type: 'str' },
    { name: 't', type: 'str' },
  ],
  return_type: 'bool',
  pattern: 'Hash Map',
  tags: ['strings', 'hash-table'],
  hints: [
    'Need both mappings: s→t and t→s.',
    'Walk both strings; for each pair (a, b), check consistency in both maps.',
    'If a maps to something different or b maps to something different, return false.',
    'Otherwise record the mapping.',
    'Both strings must be the same length.',
  ],
  editorial_md: ED(
    'Isomorphism requires a bijection between the character sets used in the two strings. A one-way map allows the false positive where two different source characters both map to the same target.',
    'Maintain two maps, m_st and m_ts. Walk paired characters (a, b) of s and t. If a is already in m_st and m_st[a] != b, return false. If b is already in m_ts and m_ts[b] != a, return false. Otherwise install both directions. After the loop return true. The two-map check guarantees a bijection between the visited characters.',
    '- Time: O(n).\n- Space: O(Σ) where Σ is the alphabet size.'
  ),
  test_cases: [
    { inputs: ['"egg"', '"add"'], expected: 'true' },
    { inputs: ['"foo"', '"bar"'], expected: 'false' },
    { inputs: ['"paper"', '"title"'], expected: 'true' },
    { inputs: ['"a"', '"a"'], expected: 'true' },
    { inputs: ['"ab"', '"aa"'], expected: 'false' },
    { inputs: ['"aa"', '"ab"'], expected: 'false' },
    { inputs: ['""', '""'], expected: 'true' },
    { inputs: ['"abc"', '"abc"'], expected: 'true' },
    { inputs: ['"abc"', '"xyz"'], expected: 'true' },
    { inputs: ['"abab"', '"cdcd"'], expected: 'true' },
    { inputs: ['"badc"', '"baba"'], expected: 'false' },
  ],
  solutions: {
    python: `class Solution:
    def isIsomorphic(self, s: str, t: str) -> bool:
        if len(s) != len(t): return False
        m_st: dict = {}
        m_ts: dict = {}
        for a, b in zip(s, t):
            if a in m_st and m_st[a] != b: return False
            if b in m_ts and m_ts[b] != a: return False
            m_st[a] = b
            m_ts[b] = a
        return True
`,
    javascript: `var isIsomorphic = function(s, t) {
    if (s.length !== t.length) return false;
    const mst = new Map(), mts = new Map();
    for (let i = 0; i < s.length; i++) {
        const a = s[i], b = t[i];
        if (mst.has(a) && mst.get(a) !== b) return false;
        if (mts.has(b) && mts.get(b) !== a) return false;
        mst.set(a, b); mts.set(b, a);
    }
    return true;
};
`,
    java: `import java.util.*;

class Solution {
    public boolean isIsomorphic(String s, String t) {
        if (s.length() != t.length()) return false;
        Map<Character, Character> mst = new HashMap<>(), mts = new HashMap<>();
        for (int i = 0; i < s.length(); i++) {
            char a = s.charAt(i), b = t.charAt(i);
            if (mst.containsKey(a) && mst.get(a) != b) return false;
            if (mts.containsKey(b) && mts.get(b) != a) return false;
            mst.put(a, b); mts.put(b, a);
        }
        return true;
    }
}
`,
    cpp: `#include <string>
#include <unordered_map>
using namespace std;

class Solution {
public:
    bool isIsomorphic(string s, string t) {
        if (s.size() != t.size()) return false;
        unordered_map<char, char> mst, mts;
        for (int i = 0; i < (int)s.size(); i++) {
            char a = s[i], b = t[i];
            if (mst.count(a) && mst[a] != b) return false;
            if (mts.count(b) && mts[b] != a) return false;
            mst[a] = b; mts[b] = a;
        }
        return true;
    }
};
`,
  },
});

// ============================================================================
// 39. squares-of-a-sorted-array
// ============================================================================
P.push({
  id: 'squares-of-a-sorted-array',
  method_name: 'sortedSquares',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'List[int]',
  pattern: 'Two Pointers',
  tags: ['arrays', 'two-pointers'],
  hints: [
    'After squaring, the largest values are at the two ends.',
    'Two pointers — one at the start, one at the end.',
    'Compare absolute values; place the bigger square at the end of the result.',
    'Move the chosen pointer inward.',
    'O(n) time.',
  ],
  editorial_md: ED(
    'For a sorted array containing negatives, squaring inverts the order on the negative half but not on the positive half. The largest squares live at the two ends, the smallest in the middle. Two pointers feed the result back-to-front.',
    'Allocate a result array of length n. Left pointer at 0, right at n - 1, write pointer at n - 1. Each iteration compare |nums[left]| against |nums[right]|. The larger one\'s square goes to result[write]; advance the chosen pointer inward (left++ or right--) and write--. Stops when left exceeds right. The pass is O(n) and uses O(n) extra space for the output, no sort needed.',
    '- Time: O(n).\n- Space: O(n) output.'
  ),
  test_cases: [
    { inputs: ['[-4,-1,0,3,10]'], expected: '[0,1,9,16,100]' },
    { inputs: ['[-7,-3,2,3,11]'], expected: '[4,9,9,49,121]' },
    { inputs: ['[1]'], expected: '[1]' },
    { inputs: ['[-1]'], expected: '[1]' },
    { inputs: ['[0]'], expected: '[0]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[-5,-4,-3,-2,-1]'], expected: '[1,4,9,16,25]' },
    { inputs: ['[1,2,3,4,5]'], expected: '[1,4,9,16,25]' },
    { inputs: ['[-2,-1,0,1,2]'], expected: '[0,1,1,4,4]' },
    { inputs: ['[-10,-5,0,5,10]'], expected: '[0,25,25,100,100]' },
    { inputs: ['[-3,-2,-1]'], expected: '[1,4,9]' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def sortedSquares(self, nums: List[int]) -> List[int]:
        n = len(nums)
        out = [0] * n
        l, r, w = 0, n - 1, n - 1
        while l <= r:
            if abs(nums[l]) > abs(nums[r]):
                out[w] = nums[l] * nums[l]; l += 1
            else:
                out[w] = nums[r] * nums[r]; r -= 1
            w -= 1
        return out
`,
    javascript: `var sortedSquares = function(nums) {
    const n = nums.length;
    const out = new Array(n);
    let l = 0, r = n - 1, w = n - 1;
    while (l <= r) {
        if (Math.abs(nums[l]) > Math.abs(nums[r])) { out[w--] = nums[l] * nums[l]; l++; }
        else { out[w--] = nums[r] * nums[r]; r--; }
    }
    return out;
};
`,
    java: `class Solution {
    public int[] sortedSquares(int[] nums) {
        int n = nums.length;
        int[] out = new int[n];
        int l = 0, r = n - 1, w = n - 1;
        while (l <= r) {
            if (Math.abs(nums[l]) > Math.abs(nums[r])) { out[w--] = nums[l] * nums[l]; l++; }
            else { out[w--] = nums[r] * nums[r]; r--; }
        }
        return out;
    }
}
`,
    cpp: `#include <vector>
#include <cstdlib>
using namespace std;

class Solution {
public:
    vector<int> sortedSquares(vector<int>& nums) {
        int n = nums.size();
        vector<int> out(n);
        int l = 0, r = n - 1, w = n - 1;
        while (l <= r) {
            if (abs(nums[l]) > abs(nums[r])) { out[w--] = nums[l] * nums[l]; l++; }
            else { out[w--] = nums[r] * nums[r]; r--; }
        }
        return out;
    }
};
`,
  },
});

// ============================================================================
// 40. remove-duplicates-sorted-array-ii (allow up to two)
// ============================================================================
P.push({
  id: 'remove-duplicates-sorted-array-ii',
  method_name: 'removeDuplicates',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Two Pointers (write-index)',
  tags: ['arrays', 'two-pointers'],
  hints: [
    'Maintain a write index k.',
    'For each value at i, accept it iff k < 2 or nums[k - 2] != nums[i].',
    'When accepted, copy to nums[k] and increment k.',
    'Return k as the new length.',
    'No extra space needed.',
  ],
  editorial_md: ED(
    'Allowing each value up to twice means the new value at position k is acceptable only if the value two positions back is different. That single comparison is enough thanks to the sorted invariant.',
    'k = 0. Iterate i from 0 to n - 1. If k < 2 or nums[k - 2] != nums[i], the current value can be accepted — copy it to nums[k] and k++. Otherwise skip. After the loop the first k entries of nums hold the deduplicated prefix, which is the required output. The k-2 check works because the array stays sorted, so a third copy of the same value must equal both nums[k-1] and nums[k-2] if accepted.',
    '- Time: O(n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[1,1,1,2,2,3]'], expected: '5' },
    { inputs: ['[0,0,1,1,1,1,2,3,3]'], expected: '7' },
    { inputs: ['[1,1]'], expected: '2' },
    { inputs: ['[1]'], expected: '1' },
    { inputs: ['[]'], expected: '0' },
    { inputs: ['[1,1,1,1,1]'], expected: '2' },
    { inputs: ['[1,2,3]'], expected: '3' },
    { inputs: ['[1,1,2,2,3,3]'], expected: '6' },
    { inputs: ['[1,1,1,2,2,2,3,3,3]'], expected: '6' },
    { inputs: ['[5,5,5,5,5,5,5,5]'], expected: '2' },
    { inputs: ['[-1,-1,-1,0,0,1,1,1]'], expected: '6' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def removeDuplicates(self, nums: List[int]) -> int:
        k = 0
        for x in nums:
            if k < 2 or nums[k - 2] != x:
                nums[k] = x
                k += 1
        return k
`,
    javascript: `var removeDuplicates = function(nums) {
    let k = 0;
    for (const x of nums) {
        if (k < 2 || nums[k - 2] !== x) {
            nums[k++] = x;
        }
    }
    return k;
};
`,
    java: `class Solution {
    public int removeDuplicates(int[] nums) {
        int k = 0;
        for (int x : nums) {
            if (k < 2 || nums[k - 2] != x) {
                nums[k++] = x;
            }
        }
        return k;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int removeDuplicates(vector<int>& nums) {
        int k = 0;
        for (int x : nums) {
            if (k < 2 || nums[k - 2] != x) nums[k++] = x;
        }
        return k;
    }
};
`,
  },
});

// ============================================================================
// 41. koko-eating-banana
// ============================================================================
P.push({
  id: 'koko-eating-banana',
  description: '<p>Given piles of bananas <code>piles[]</code> and an integer <code>h</code> hours to finish them all, find the minimum integer eating speed <code>k</code> such that Koko can eat all the bananas in at most <code>h</code> hours. Each hour she picks a pile and eats up to <code>k</code> bananas from it; if a pile has fewer than <code>k</code> she finishes it that hour.</p>',
  method_name: 'minEatingSpeed',
  params: [
    { name: 'piles', type: 'List[int]' },
    { name: 'h', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Binary Search on Answer',
  tags: ['arrays', 'binary-search'],
  hints: [
    'Hours needed is monotone non-increasing in speed.',
    'Binary search speed k in [1, max(piles)].',
    'Feasibility: sum(ceil(p / k) for p in piles) ≤ h.',
    'If feasible, shrink upper bound; else raise lower.',
    'Use integer ceil: (p + k - 1) // k.',
  ],
  editorial_md: ED(
    'Faster eating speed always requires fewer hours, so the feasibility predicate "can finish in h hours at speed k" is monotone — binary search the smallest k that works.',
    'Lower bound 1, upper bound max(piles): no point in eating faster than the biggest pile in one hour. For a candidate mid, total hours needed is sum over piles of ceil(p / mid). If the total is ≤ h, mid is feasible — record and shrink (hi = mid). Otherwise raise (lo = mid + 1). Loop ends with lo == hi, the minimum speed. Integer ceiling avoids floats: (p + k - 1) // k. For large piles or h this is the canonical "binary-search-on-answer" template.',
    '- Time: O(n · log(max(piles))).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[3,6,7,11]', '8'], expected: '4' },
    { inputs: ['[30,11,23,4,20]', '5'], expected: '30' },
    { inputs: ['[30,11,23,4,20]', '6'], expected: '23' },
    { inputs: ['[1]', '1'], expected: '1' },
    { inputs: ['[1000000000]', '2'], expected: '500000000' },
    { inputs: ['[1,1,1,1]', '4'], expected: '1' },
    { inputs: ['[1,1,1,1]', '8'], expected: '1' },
    { inputs: ['[2,2]', '2'], expected: '2' },
    { inputs: ['[5,5,5,5]', '4'], expected: '5' },
    { inputs: ['[312884470]', '312884469'], expected: '2' },
    { inputs: ['[3,6,7,11]', '11'], expected: '3' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def minEatingSpeed(self, piles: List[int], h: int) -> int:
        def hours(k: int) -> int:
            t = 0
            for p in piles:
                t += (p + k - 1) // k
            return t
        lo, hi = 1, max(piles)
        while lo < hi:
            mid = (lo + hi) // 2
            if hours(mid) <= h:
                hi = mid
            else:
                lo = mid + 1
        return lo
`,
    javascript: `var minEatingSpeed = function(piles, h) {
    const hours = k => {
        let t = 0;
        for (const p of piles) t += Math.ceil(p / k);
        return t;
    };
    let lo = 1, hi = Math.max(...piles);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (hours(mid) <= h) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};
`,
    java: `class Solution {
    public int minEatingSpeed(int[] piles, int h) {
        int lo = 1, hi = 0;
        for (int p : piles) hi = Math.max(hi, p);
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            long t = 0;
            for (int p : piles) t += (p + mid - 1L) / mid;
            if (t <= h) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int minEatingSpeed(vector<int>& piles, int h) {
        int lo = 1, hi = *max_element(piles.begin(), piles.end());
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            long long t = 0;
            for (int p : piles) t += (p + mid - 1) / mid;
            if (t <= h) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
`,
  },
});

// ============================================================================
// 42. median-in-a-row-sorted
// ============================================================================
P.push({
  id: 'median-in-a-row-sorted',
  description: '<p>Given an odd-sized integer matrix where each row is sorted in ascending order, return the median of all <code>m·n</code> elements.</p>',
  method_name: 'matrixMedian',
  params: [{ name: 'matrix', type: 'List[List[int]]' }],
  return_type: 'int',
  pattern: 'Binary Search on Value',
  tags: ['matrix', 'binary-search'],
  hints: [
    'Binary search the value v in the global min..max range.',
    'Count elements ≤ v by binary-searching each row (upper_bound).',
    'Median is the smallest v with count(≤ v) > (m·n) / 2.',
    'Each iteration is O(m log n); loop is O(log(max - min)).',
    'Works because counts are monotone in v.',
  ],
  editorial_md: ED(
    'The median is the value v where exactly half the elements are strictly less. Counting how many elements ≤ v is monotone in v, so binary search the value, not the position.',
    'lo = min over rows of row[0], hi = max over rows of row[-1]. While lo < hi compute mid = (lo + hi) // 2. Count cells with value ≤ mid by running upper_bound on each row and summing. If count ≤ (m·n) // 2, the median sits above mid — lo = mid + 1. Else hi = mid. Loop ends with lo == hi, the median value. The element itself must exist in the matrix because counts only change at actual matrix values. Each iteration is O(m log n) and the value-range halves each step.',
    '- Time: O(m log n · log(max - min)).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[[1,3,5],[2,6,9],[3,6,9]]'], expected: '5' },
    { inputs: ['[[1,3,4],[2,5,6],[7,8,9]]'], expected: '5' },
    { inputs: ['[[1]]'], expected: '1' },
    { inputs: ['[[1,3,5,7,9]]'], expected: '5' },
    { inputs: ['[[1],[2],[3]]'], expected: '2' },
    { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'], expected: '5' },
    { inputs: ['[[1,1,3,3,5],[2,2,4,4,6],[3,3,5,5,7]]'], expected: '3' },
    { inputs: ['[[1,2,3],[3,4,5],[5,6,7]]'], expected: '4' },
    { inputs: ['[[1,1,1],[1,1,1],[1,1,1]]'], expected: '1' },
    { inputs: ['[[1,3,8],[2,3,4],[1,2,5]]'], expected: '3' },
    { inputs: ['[[5,10,15],[20,25,30],[35,40,45]]'], expected: '25' },
  ],
  solutions: {
    python: `from typing import List
from bisect import bisect_right

class Solution:
    def matrixMedian(self, matrix: List[List[int]]) -> int:
        m, n = len(matrix), len(matrix[0])
        lo = min(row[0] for row in matrix)
        hi = max(row[-1] for row in matrix)
        target = (m * n) // 2
        while lo < hi:
            mid = (lo + hi) // 2
            cnt = 0
            for row in matrix:
                cnt += bisect_right(row, mid)
            if cnt <= target:
                lo = mid + 1
            else:
                hi = mid
        return lo
`,
    javascript: `var matrixMedian = function(matrix) {
    const m = matrix.length, n = matrix[0].length;
    let lo = Infinity, hi = -Infinity;
    for (const r of matrix) {
        if (r[0] < lo) lo = r[0];
        if (r[n - 1] > hi) hi = r[n - 1];
    }
    const target = Math.floor((m * n) / 2);
    const upper = (a, x) => { let l=0,r=a.length; while (l<r){ const md=(l+r)>>1; if (a[md]<=x) l=md+1; else r=md; } return l; };
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        let cnt = 0;
        for (const r of matrix) cnt += upper(r, mid);
        if (cnt <= target) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};
`,
    java: `import java.util.*;

class Solution {
    public int matrixMedian(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        int lo = Integer.MAX_VALUE, hi = Integer.MIN_VALUE;
        for (int[] r : matrix) {
            lo = Math.min(lo, r[0]);
            hi = Math.max(hi, r[n - 1]);
        }
        int target = (m * n) / 2;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            int cnt = 0;
            for (int[] r : matrix) cnt += upper(r, mid);
            if (cnt <= target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
    private int upper(int[] a, int x) {
        int l = 0, r = a.length;
        while (l < r) { int m = (l + r) >>> 1; if (a[m] <= x) l = m + 1; else r = m; }
        return l;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int matrixMedian(vector<vector<int>>& matrix) {
        int m = matrix.size(), n = matrix[0].size();
        int lo = INT_MAX, hi = INT_MIN;
        for (auto& r : matrix) { lo = min(lo, r[0]); hi = max(hi, r[n - 1]); }
        int target = (m * n) / 2;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            int cnt = 0;
            for (auto& r : matrix) cnt += (int)(upper_bound(r.begin(), r.end(), mid) - r.begin());
            if (cnt <= target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};
`,
  },
});

// ============================================================================
// 43. kth-smallest-in-row-and-column-sorted
// ============================================================================
P.push({
  id: 'kth-smallest-in-row-and-column-sorted',
  description: '<p>Given an <code>n × n</code> matrix where rows and columns are both sorted in ascending order, return the <code>k</code>-th smallest element (1-indexed).</p>',
  method_name: 'kthSmallest',
  params: [
    { name: 'matrix', type: 'List[List[int]]' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Binary Search on Value',
  tags: ['matrix', 'binary-search'],
  hints: [
    'Binary search a value v in [matrix[0][0], matrix[n-1][n-1]].',
    'Count of cells ≤ v: walk a staircase from bottom-left or top-right in O(n).',
    'The k-th smallest is the smallest v with count(≤ v) ≥ k.',
    'Each iteration O(n); loop is O(log(max - min)).',
    'Heap of size k works too but is O(n + k log k).',
  ],
  editorial_md: ED(
    'The matrix is sorted along both axes, so for any value v the cells with value ≤ v form a staircase region anchored at the top-left. Count those cells in O(n) by walking the staircase boundary.',
    'Binary search v over [matrix[0][0], matrix[n - 1][n - 1]]. Counting function: start at i = n - 1, j = 0. While i >= 0 and j < n, if matrix[i][j] <= v, all i + 1 cells in column j up to row i qualify — add i + 1 to count and j++. Else i--. The walk visits at most 2n cells. If count ≥ k, the k-th smallest is ≤ mid — hi = mid. Else lo = mid + 1. Loop terminates at lo == hi, which is necessarily a matrix value because counts only change at actual values.',
    '- Time: O(n · log(max - min)).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[[1,5,9],[10,11,13],[12,13,15]]', '8'], expected: '13' },
    { inputs: ['[[-5]]', '1'], expected: '-5' },
    { inputs: ['[[1,2],[1,3]]', '2'], expected: '1' },
    { inputs: ['[[1,2],[1,3]]', '3'], expected: '2' },
    { inputs: ['[[1,2],[1,3]]', '4'], expected: '3' },
    { inputs: ['[[1]]', '1'], expected: '1' },
    { inputs: ['[[1,5,9],[10,11,13],[12,13,15]]', '1'], expected: '1' },
    { inputs: ['[[1,5,9],[10,11,13],[12,13,15]]', '9'], expected: '15' },
    { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]', '5'], expected: '5' },
    { inputs: ['[[1,3,5],[6,7,12],[11,14,14]]', '6'], expected: '11' },
    { inputs: ['[[1,2],[3,4]]', '3'], expected: '3' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def kthSmallest(self, matrix: List[List[int]], k: int) -> int:
        n = len(matrix)
        def count_le(v: int) -> int:
            i, j, c = n - 1, 0, 0
            while i >= 0 and j < n:
                if matrix[i][j] <= v:
                    c += i + 1
                    j += 1
                else:
                    i -= 1
            return c
        lo, hi = matrix[0][0], matrix[n - 1][n - 1]
        while lo < hi:
            mid = (lo + hi) // 2
            if count_le(mid) >= k:
                hi = mid
            else:
                lo = mid + 1
        return lo
`,
    javascript: `var kthSmallest = function(matrix, k) {
    const n = matrix.length;
    const countLe = v => {
        let i = n - 1, j = 0, c = 0;
        while (i >= 0 && j < n) {
            if (matrix[i][j] <= v) { c += i + 1; j++; }
            else i--;
        }
        return c;
    };
    let lo = matrix[0][0], hi = matrix[n - 1][n - 1];
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (countLe(mid) >= k) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};
`,
    java: `class Solution {
    public int kthSmallest(int[][] matrix, int k) {
        int n = matrix.length;
        int lo = matrix[0][0], hi = matrix[n - 1][n - 1];
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            int c = countLe(matrix, mid);
            if (c >= k) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
    private int countLe(int[][] m, int v) {
        int n = m.length, i = n - 1, j = 0, c = 0;
        while (i >= 0 && j < n) {
            if (m[i][j] <= v) { c += i + 1; j++; }
            else i--;
        }
        return c;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int kthSmallest(vector<vector<int>>& matrix, int k) {
        int n = matrix.size();
        int lo = matrix[0][0], hi = matrix[n - 1][n - 1];
        auto countLe = [&](int v) {
            int i = n - 1, j = 0, c = 0;
            while (i >= 0 && j < n) {
                if (matrix[i][j] <= v) { c += i + 1; j++; }
                else i--;
            }
            return c;
        };
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (countLe(mid) >= k) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
`,
  },
});

// ============================================================================
// 44. three-sum-closest-500
// ============================================================================
P.push({
  id: 'three-sum-closest-500',
  method_name: 'threeSumClosest',
  params: [
    { name: 'nums', type: 'List[int]' },
    { name: 'target', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Two Pointers',
  tags: ['arrays', 'two-pointers'],
  hints: [
    'Sort the array first.',
    'Fix one element; two-pointer search on the rest.',
    'Track the best sum (closest to target) seen so far.',
    'If sum < target advance left, else move right.',
    'Early-exit when sum == target.',
  ],
  editorial_md: ED(
    'Sorting reduces the triplet search to O(n²) via fixed-pivot plus two-pointer. At each pivot, the two pointers slide based on whether the running sum is below or above target.',
    'Sort nums. Track best_sum initialised to nums[0] + nums[1] + nums[2]. For i from 0 to n - 3: set lo = i + 1, hi = n - 1. While lo < hi: s = nums[i] + nums[lo] + nums[hi]. If |s - target| < |best_sum - target|, update best_sum. If s == target, return immediately. If s < target lo++ else hi--. The two-pointer step is monotonic — increasing lo can only raise s, decreasing hi can only lower s, so the optimum is reachable in O(n) per pivot. Total O(n²).',
    '- Time: O(n²).\n- Space: O(1) extra (sort excluded).'
  ),
  test_cases: [
    { inputs: ['[-1,2,1,-4]', '1'], expected: '2' },
    { inputs: ['[0,0,0]', '1'], expected: '0' },
    { inputs: ['[1,1,1,0]', '-100'], expected: '2' },
    { inputs: ['[1,2,4,8,16,32,64,128]', '82'], expected: '82' },
    { inputs: ['[1,1,1]', '0'], expected: '3' },
    { inputs: ['[-1,-1,-1]', '0'], expected: '-3' },
    { inputs: ['[1,2,3,4,5]', '10'], expected: '10' },
    { inputs: ['[1,2,3,4,5]', '100'], expected: '12' },
    { inputs: ['[1,2,3,4,5]', '-100'], expected: '6' },
    { inputs: ['[0,1,2]', '3'], expected: '3' },
    { inputs: ['[-1,0,1,1,55]', '3'], expected: '2' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def threeSumClosest(self, nums: List[int], target: int) -> int:
        nums.sort()
        n = len(nums)
        best = nums[0] + nums[1] + nums[2]
        for i in range(n - 2):
            lo, hi = i + 1, n - 1
            while lo < hi:
                s = nums[i] + nums[lo] + nums[hi]
                if abs(s - target) < abs(best - target):
                    best = s
                if s == target:
                    return s
                if s < target:
                    lo += 1
                else:
                    hi -= 1
        return best
`,
    javascript: `var threeSumClosest = function(nums, target) {
    nums.sort((a, b) => a - b);
    const n = nums.length;
    let best = nums[0] + nums[1] + nums[2];
    for (let i = 0; i < n - 2; i++) {
        let lo = i + 1, hi = n - 1;
        while (lo < hi) {
            const s = nums[i] + nums[lo] + nums[hi];
            if (Math.abs(s - target) < Math.abs(best - target)) best = s;
            if (s === target) return s;
            if (s < target) lo++;
            else hi--;
        }
    }
    return best;
};
`,
    java: `import java.util.*;

class Solution {
    public int threeSumClosest(int[] nums, int target) {
        Arrays.sort(nums);
        int n = nums.length;
        int best = nums[0] + nums[1] + nums[2];
        for (int i = 0; i < n - 2; i++) {
            int lo = i + 1, hi = n - 1;
            while (lo < hi) {
                int s = nums[i] + nums[lo] + nums[hi];
                if (Math.abs(s - target) < Math.abs(best - target)) best = s;
                if (s == target) return s;
                if (s < target) lo++;
                else hi--;
            }
        }
        return best;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
#include <cstdlib>
using namespace std;

class Solution {
public:
    int threeSumClosest(vector<int>& nums, int target) {
        sort(nums.begin(), nums.end());
        int n = nums.size();
        int best = nums[0] + nums[1] + nums[2];
        for (int i = 0; i < n - 2; i++) {
            int lo = i + 1, hi = n - 1;
            while (lo < hi) {
                int s = nums[i] + nums[lo] + nums[hi];
                if (abs(s - target) < abs(best - target)) best = s;
                if (s == target) return s;
                if (s < target) lo++; else hi--;
            }
        }
        return best;
    }
};
`,
  },
});

// ============================================================================
// 45. m-bouquets (minimum days to make m bouquets of k adjacent flowers)
// ============================================================================
P.push({
  id: 'm-bouquets',
  description: '<p>Given an integer array <code>bloomDay</code> where <code>bloomDay[i]</code> is the day the i-th flower blooms, and integers <code>m</code> and <code>k</code>, return the minimum number of days needed to make <code>m</code> bouquets of <code>k</code> adjacent flowers each. If impossible return -1.</p>',
  method_name: 'minDays',
  params: [
    { name: 'bloomDay', type: 'List[int]' },
    { name: 'm', type: 'int' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Binary Search on Answer',
  tags: ['arrays', 'binary-search'],
  hints: [
    'If m·k > n return -1 — not enough flowers.',
    'Binary search the day d in [min(bloomDay), max(bloomDay)].',
    'Feasibility: count bouquets by scanning runs of length ≥ k where bloomDay[i] ≤ d.',
    'Each run of length L contributes L // k bouquets.',
    'O(n log max).',
  ],
  editorial_md: ED(
    'More days only enables more bouquets — the predicate is monotone. Binary search the smallest day on which at least m bouquets become makeable.',
    'If m·k > len(bloomDay) the request is infeasible. Otherwise binary search d in [min, max] of bloomDay. Feasibility function: walk the array; when bloomDay[i] ≤ d, extend the current run; otherwise reset. At every step add run // k to the bouquet count and zero the run (or keep accumulating with care to not double count — equivalently, every time the run hits k, add a bouquet and reset). Return whether the count reaches m. Binary search shrinks toward the smallest such d.',
    '- Time: O(n · log(max - min)).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[1,10,3,10,2]', '3', '1'], expected: '3' },
    { inputs: ['[1,10,3,10,2]', '3', '2'], expected: '-1' },
    { inputs: ['[7,7,7,7,12,7,7]', '2', '3'], expected: '12' },
    { inputs: ['[1000000000,1000000000]', '1', '1'], expected: '1000000000' },
    { inputs: ['[1,10,2,9,3,8,4,7,5,6]', '4', '2'], expected: '9' },
    { inputs: ['[1]', '1', '1'], expected: '1' },
    { inputs: ['[5,5,5,5]', '4', '1'], expected: '5' },
    { inputs: ['[5,5,5,5]', '1', '4'], expected: '5' },
    { inputs: ['[1,2,3,4,5]', '2', '2'], expected: '4' },
    { inputs: ['[7,7,7,7,7]', '5', '1'], expected: '7' },
    { inputs: ['[1,2,3]', '2', '2'], expected: '-1' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def minDays(self, bloomDay: List[int], m: int, k: int) -> int:
        n = len(bloomDay)
        if m * k > n:
            return -1
        def feasible(d: int) -> bool:
            bouquets = 0
            run = 0
            for v in bloomDay:
                if v <= d:
                    run += 1
                    if run == k:
                        bouquets += 1
                        run = 0
                        if bouquets >= m:
                            return True
                else:
                    run = 0
            return bouquets >= m
        lo, hi = min(bloomDay), max(bloomDay)
        while lo < hi:
            mid = (lo + hi) // 2
            if feasible(mid):
                hi = mid
            else:
                lo = mid + 1
        return lo
`,
    javascript: `var minDays = function(bloomDay, m, k) {
    const n = bloomDay.length;
    if (m * k > n) return -1;
    const feasible = d => {
        let bq = 0, run = 0;
        for (const v of bloomDay) {
            if (v <= d) {
                run++;
                if (run === k) { bq++; run = 0; if (bq >= m) return true; }
            } else {
                run = 0;
            }
        }
        return bq >= m;
    };
    let lo = Math.min(...bloomDay), hi = Math.max(...bloomDay);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (feasible(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};
`,
    java: `class Solution {
    public int minDays(int[] bloomDay, int m, int k) {
        long n = bloomDay.length;
        if ((long) m * k > n) return -1;
        int lo = Integer.MAX_VALUE, hi = Integer.MIN_VALUE;
        for (int v : bloomDay) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (feasible(bloomDay, m, k, mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
    private boolean feasible(int[] a, int m, int k, int d) {
        int bq = 0, run = 0;
        for (int v : a) {
            if (v <= d) {
                run++;
                if (run == k) { bq++; run = 0; if (bq >= m) return true; }
            } else run = 0;
        }
        return bq >= m;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int minDays(vector<int>& bloomDay, int m, int k) {
        long long n = bloomDay.size();
        if ((long long) m * k > n) return -1;
        int lo = *min_element(bloomDay.begin(), bloomDay.end());
        int hi = *max_element(bloomDay.begin(), bloomDay.end());
        auto feasible = [&](int d) {
            int bq = 0, run = 0;
            for (int v : bloomDay) {
                if (v <= d) {
                    run++;
                    if (run == k) { bq++; run = 0; if (bq >= m) return true; }
                } else run = 0;
            }
            return bq >= m;
        };
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (feasible(mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
`,
  },
});

// ============================================================================
// 46. kth-in-multiplication-table
// ============================================================================
P.push({
  id: 'kth-in-multiplication-table',
  description: '<p>Given <code>m</code>, <code>n</code>, and <code>k</code>, return the <code>k</code>-th smallest entry of the <code>m × n</code> multiplication table (1-indexed: rows × columns).</p>',
  method_name: 'findKthNumber',
  params: [
    { name: 'm', type: 'int' },
    { name: 'n', type: 'int' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Binary Search on Value',
  tags: ['math', 'binary-search'],
  hints: [
    'Binary search v in [1, m·n].',
    'For row i, count of multiples ≤ v in row i is min(v // i, n).',
    'Sum across rows → count(≤ v) in the table.',
    'Find smallest v with count ≥ k.',
    'Each iteration O(m); total O(m log(m·n)).',
  ],
  editorial_md: ED(
    'The m × n multiplication table has values i · j for 1 ≤ i ≤ m, 1 ≤ j ≤ n. Counting entries ≤ v sums up the per-row capacity floor(v / i) capped at n. That count is monotone in v, so binary search the value.',
    'Binary search v over [1, m · n]. For each row i in 1..m, the row holds values i, 2i, …, ni — the number of those that are ≤ v is min(v // i, n). Sum gives total count ≤ v. If count ≥ k, the k-th smallest is ≤ v — hi = v. Else lo = v + 1. Loop ends with lo == hi, which must be an actual table value because counts only change at exact entries. Counting is O(m) per iteration; binary search runs O(log(m·n)) iterations.',
    '- Time: O(m · log(m·n)).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['3', '3', '5'], expected: '3' },
    { inputs: ['2', '3', '6'], expected: '6' },
    { inputs: ['1', '1', '1'], expected: '1' },
    { inputs: ['1', '10', '5'], expected: '5' },
    { inputs: ['10', '1', '5'], expected: '5' },
    { inputs: ['3', '3', '1'], expected: '1' },
    { inputs: ['3', '3', '9'], expected: '9' },
    { inputs: ['9', '9', '40'], expected: '24' },
    { inputs: ['5', '5', '13'], expected: '8' },
    { inputs: ['42', '34', '401'], expected: '126' },
    { inputs: ['2', '2', '3'], expected: '2' },
  ],
  solutions: {
    python: `class Solution:
    def findKthNumber(self, m: int, n: int, k: int) -> int:
        lo, hi = 1, m * n
        while lo < hi:
            mid = (lo + hi) // 2
            cnt = 0
            for i in range(1, m + 1):
                cnt += min(mid // i, n)
            if cnt >= k:
                hi = mid
            else:
                lo = mid + 1
        return lo
`,
    javascript: `var findKthNumber = function(m, n, k) {
    let lo = 1, hi = m * n;
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        let cnt = 0;
        for (let i = 1; i <= m; i++) cnt += Math.min(Math.floor(mid / i), n);
        if (cnt >= k) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};
`,
    java: `class Solution {
    public int findKthNumber(int m, int n, int k) {
        int lo = 1, hi = m * n;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            int cnt = 0;
            for (int i = 1; i <= m; i++) cnt += Math.min(mid / i, n);
            if (cnt >= k) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}
`,
    cpp: `#include <algorithm>
using namespace std;

class Solution {
public:
    int findKthNumber(int m, int n, int k) {
        int lo = 1, hi = m * n;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            int cnt = 0;
            for (int i = 1; i <= m; i++) cnt += min(mid / i, n);
            if (cnt >= k) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
`,
  },
});

// ============================================================================
// 47. maximize-median (after at most k +1 operations)
// ============================================================================
P.push({
  id: 'maximize-median',
  description: '<p>Given an integer array <code>nums</code> of odd length and an integer <code>k</code>, you can perform at most <code>k</code> increment operations (each adds 1 to a single element). Return the maximum possible median after these operations.</p>',
  method_name: 'maximizeMedian',
  params: [
    { name: 'nums', type: 'List[int]' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Sorting + Greedy + Binary Search',
  tags: ['arrays', 'sorting', 'binary-search', 'greedy'],
  hints: [
    'Sort the array. The median is the middle index after sorting.',
    'To raise the median to value v we must bring all values from the middle to the right up to v.',
    'Cost = sum(max(0, v - nums[i]) for i in mid..n-1).',
    'Binary search v in [nums[mid], nums[mid] + k] (loose upper bound).',
    'Largest v with cost ≤ k is the answer.',
  ],
  editorial_md: ED(
    'Once the array is sorted, the median is the middle index. To push the median up to v, every element from the middle to the right must be at least v — because if any of those is below v, after re-sorting it would slot to the left and a smaller value would take the middle spot.',
    'Sort nums. Let mid = n // 2. Binary search the largest v such that sum(max(0, v - nums[i]) for i in mid..n - 1) ≤ k. Lower bound is nums[mid] (no work needed). Upper bound is nums[mid] + k (every operation could go to one element). Cost is monotone in v, so the binary search is clean. Each cost computation is O(n / 2). Total O(n log k). The answer is the maximum v whose cost stays within budget.',
    '- Time: O(n log k + n log n) for the sort.\n- Space: O(1) extra.'
  ),
  test_cases: [
    { inputs: ['[1,2,3]', '5'], expected: '4' },
    { inputs: ['[1,2,3]', '0'], expected: '2' },
    { inputs: ['[1,1,1]', '3'], expected: '2' },
    { inputs: ['[5]', '10'], expected: '15' },
    { inputs: ['[1,1,1,1,1]', '5'], expected: '2' },
    { inputs: ['[5,5,5,5,5]', '10'], expected: '8' },
    { inputs: ['[1,3,5,7,9]', '4'], expected: '6' },
    { inputs: ['[10,20,30,40,50]', '0'], expected: '30' },
    { inputs: ['[1,2,3,4,5,6,7]', '6'], expected: '6' },
    { inputs: ['[2,2,2,2,2,2,2,2,2]', '9'], expected: '4' },
    { inputs: ['[100,200,300]', '50'], expected: '250' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def maximizeMedian(self, nums: List[int], k: int) -> int:
        nums.sort()
        n = len(nums)
        mid = n // 2
        right = nums[mid:]
        def cost(v: int) -> int:
            c = 0
            for x in right:
                if v > x:
                    c += v - x
                    if c > k: return c
            return c
        lo, hi = nums[mid], nums[mid] + k
        while lo < hi:
            m = (lo + hi + 1) // 2
            if cost(m) <= k:
                lo = m
            else:
                hi = m - 1
        return lo
`,
    javascript: `var maximizeMedian = function(nums, k) {
    nums.sort((a, b) => a - b);
    const n = nums.length;
    const mid = Math.floor(n / 2);
    const right = nums.slice(mid);
    const cost = v => {
        let c = 0;
        for (const x of right) {
            if (v > x) { c += v - x; if (c > k) return c; }
        }
        return c;
    };
    let lo = nums[mid], hi = nums[mid] + k;
    while (lo < hi) {
        const m = Math.floor((lo + hi + 1) / 2);
        if (cost(m) <= k) lo = m;
        else hi = m - 1;
    }
    return lo;
};
`,
    java: `import java.util.*;

class Solution {
    public int maximizeMedian(int[] nums, int k) {
        Arrays.sort(nums);
        int n = nums.length, mid = n / 2;
        long lo = nums[mid], hi = (long) nums[mid] + k;
        while (lo < hi) {
            long m = (lo + hi + 1) / 2;
            if (cost(nums, mid, m) <= k) lo = m;
            else hi = m - 1;
        }
        return (int) lo;
    }
    private long cost(int[] nums, int mid, long v) {
        long c = 0;
        for (int i = mid; i < nums.length; i++) {
            if (v > nums[i]) c += v - nums[i];
        }
        return c;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maximizeMedian(vector<int>& nums, int k) {
        sort(nums.begin(), nums.end());
        int n = nums.size(), mid = n / 2;
        auto cost = [&](long long v) -> long long {
            long long c = 0;
            for (int i = mid; i < n; i++) if (v > nums[i]) c += v - nums[i];
            return c;
        };
        long long lo = nums[mid], hi = (long long) nums[mid] + k;
        while (lo < hi) {
            long long m = (lo + hi + 1) / 2;
            if (cost(m) <= k) lo = m;
            else hi = m - 1;
        }
        return (int) lo;
    }
};
`,
  },
});

// ============================================================================
// 48. trapping-rain-water-tp (two pointers)
// ============================================================================
P.push({
  id: 'trapping-rain-water-tp',
  method_name: 'trap',
  params: [{ name: 'height', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Two Pointers',
  tags: ['arrays', 'two-pointers'],
  hints: [
    'Each index i traps max(0, min(maxLeft, maxRight) - height[i]).',
    'Two pointers — l, r at the ends.',
    'Move from the side whose pointer has the smaller height.',
    'Track lMax and rMax incrementally.',
    'O(n) time, O(1) extra.',
  ],
  editorial_md: ED(
    'Water above index i is bounded by the shorter of the tallest bar to its left and the tallest bar to its right. The two-pointer trick computes those bounds on the fly without storing the prefix-max arrays.',
    'l = 0, r = n - 1, lMax = rMax = 0, total = 0. While l < r: if height[l] < height[r], then we know rMax ≥ height[r] > height[l], so the limiting wall on the left side is lMax. Update lMax = max(lMax, height[l]); add lMax - height[l] to total; l++. Else symmetrically: rMax = max(rMax, height[r]); add rMax - height[r] to total; r--. The invariant is: whenever we advance from one side, that side\'s max is the actual binding wall — the other side\'s max is at least as tall.',
    '- Time: O(n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[0,1,0,2,1,0,1,3,2,1,2,1]'], expected: '6' },
    { inputs: ['[4,2,0,3,2,5]'], expected: '9' },
    { inputs: ['[]'], expected: '0' },
    { inputs: ['[1]'], expected: '0' },
    { inputs: ['[1,2]'], expected: '0' },
    { inputs: ['[2,1]'], expected: '0' },
    { inputs: ['[3,0,3]'], expected: '3' },
    { inputs: ['[1,1,1,1]'], expected: '0' },
    { inputs: ['[5,4,1,2]'], expected: '1' },
    { inputs: ['[2,0,2]'], expected: '2' },
    { inputs: ['[5,0,0,0,5]'], expected: '15' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def trap(self, height: List[int]) -> int:
        l, r = 0, len(height) - 1
        l_max = r_max = total = 0
        while l < r:
            if height[l] < height[r]:
                if height[l] >= l_max: l_max = height[l]
                else: total += l_max - height[l]
                l += 1
            else:
                if height[r] >= r_max: r_max = height[r]
                else: total += r_max - height[r]
                r -= 1
        return total
`,
    javascript: `var trap = function(height) {
    let l = 0, r = height.length - 1, lMax = 0, rMax = 0, total = 0;
    while (l < r) {
        if (height[l] < height[r]) {
            if (height[l] >= lMax) lMax = height[l];
            else total += lMax - height[l];
            l++;
        } else {
            if (height[r] >= rMax) rMax = height[r];
            else total += rMax - height[r];
            r--;
        }
    }
    return total;
};
`,
    java: `class Solution {
    public int trap(int[] height) {
        int l = 0, r = height.length - 1, lMax = 0, rMax = 0, total = 0;
        while (l < r) {
            if (height[l] < height[r]) {
                if (height[l] >= lMax) lMax = height[l];
                else total += lMax - height[l];
                l++;
            } else {
                if (height[r] >= rMax) rMax = height[r];
                else total += rMax - height[r];
                r--;
            }
        }
        return total;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int trap(vector<int>& height) {
        int l = 0, r = (int)height.size() - 1, lMax = 0, rMax = 0, total = 0;
        while (l < r) {
            if (height[l] < height[r]) {
                if (height[l] >= lMax) lMax = height[l];
                else total += lMax - height[l];
                l++;
            } else {
                if (height[r] >= rMax) rMax = height[r];
                else total += rMax - height[r];
                r--;
            }
        }
        return total;
    }
};
`,
  },
});

// ============================================================================
// 49. min-time-for-orders (binary search on time, k workers, n orders)
// ============================================================================
P.push({
  id: 'min-time-for-orders',
  description: '<p>Given an integer array <code>orders</code> where <code>orders[i]</code> is the duration of the i-th order, and an integer <code>k</code> workers, each working in parallel and only able to take one order at a time, return the minimum total time to finish all orders. Each order must be processed atomically by one worker; workers may take any subset of orders.</p>',
  method_name: 'minTimeForOrders',
  params: [
    { name: 'orders', type: 'List[int]' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Binary Search on Answer + Greedy',
  tags: ['arrays', 'binary-search', 'greedy'],
  hints: [
    'Binary search the total time T in [max(orders), sum(orders)].',
    'Feasibility: greedily assign orders to current worker until adding the next would exceed T.',
    'If workers used ≤ k, T is feasible.',
    'Else need more time.',
    'O(n log sum).',
  ],
  editorial_md: ED(
    'Same shape as book allocation: minimum makespan with contiguous-style greedy partitioning. Binary search the time budget T; greedy packing decides whether T allows ≤ k workers.',
    'Lower bound: max(orders) — even with infinite workers, one of them must finish the largest single order, which takes at least that long. Upper bound: sum(orders) — one worker takes everything. Binary search mid. Feasibility: walk orders left to right with `workers = 1, load = 0`; if load + order > mid, open a new worker with this order; if workers > k abort early as infeasible. Otherwise add to current load. Returning true means mid is achievable. Shrink hi or raise lo accordingly. The answer is the smallest feasible mid.',
    '- Time: O(n · log(sum)).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[5,5,4,5]', '2'], expected: '10' },
    { inputs: ['[1,2,3,4,5]', '2'], expected: '9' },
    { inputs: ['[1,2,3,4,5]', '5'], expected: '5' },
    { inputs: ['[1,2,3,4,5]', '1'], expected: '15' },
    { inputs: ['[10]', '1'], expected: '10' },
    { inputs: ['[10]', '5'], expected: '10' },
    { inputs: ['[1,1,1,1,1]', '5'], expected: '1' },
    { inputs: ['[7,2,5,10,8]', '2'], expected: '18' },
    { inputs: ['[5,5,5,5,5,5]', '3'], expected: '10' },
    { inputs: ['[1,1,1,1,1,1,1,1,1,1]', '3'], expected: '4' },
    { inputs: ['[100,1,1,1,1]', '3'], expected: '100' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def minTimeForOrders(self, orders: List[int], k: int) -> int:
        def feasible(t: int) -> bool:
            workers = 1; load = 0
            for o in orders:
                if o > t: return False
                if load + o > t:
                    workers += 1; load = o
                    if workers > k: return False
                else:
                    load += o
            return True
        lo, hi = max(orders), sum(orders)
        while lo < hi:
            mid = (lo + hi) // 2
            if feasible(mid):
                hi = mid
            else:
                lo = mid + 1
        return lo
`,
    javascript: `var minTimeForOrders = function(orders, k) {
    const feasible = t => {
        let workers = 1, load = 0;
        for (const o of orders) {
            if (o > t) return false;
            if (load + o > t) { workers++; load = o; if (workers > k) return false; }
            else load += o;
        }
        return true;
    };
    let lo = Math.max(...orders), hi = orders.reduce((s, x) => s + x, 0);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (feasible(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};
`,
    java: `class Solution {
    public int minTimeForOrders(int[] orders, int k) {
        int lo = 0, hi = 0;
        for (int o : orders) { lo = Math.max(lo, o); hi += o; }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (feasible(orders, k, mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
    private boolean feasible(int[] orders, int k, int t) {
        int workers = 1, load = 0;
        for (int o : orders) {
            if (o > t) return false;
            if (load + o > t) { workers++; load = o; if (workers > k) return false; }
            else load += o;
        }
        return true;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;

class Solution {
public:
    int minTimeForOrders(vector<int>& orders, int k) {
        int lo = *max_element(orders.begin(), orders.end());
        int hi = accumulate(orders.begin(), orders.end(), 0);
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (feasible(orders, k, mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
private:
    bool feasible(vector<int>& orders, int k, int t) {
        int workers = 1, load = 0;
        for (int o : orders) {
            if (o > t) return false;
            if (load + o > t) { workers++; load = o; if (workers > k) return false; }
            else load += o;
        }
        return true;
    }
};
`,
  },
});

// ============================================================================
// 50. equalize-towers (minimum increment moves to equalize)
// ============================================================================
P.push({
  id: 'equalize-towers',
  description: '<p>Given an integer array <code>heights</code>, return the minimum number of single-unit increments needed to make every element equal (i.e., raise every element up to the maximum).</p>',
  method_name: 'equalizeTowers',
  params: [{ name: 'heights', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Math',
  tags: ['arrays', 'math'],
  hints: [
    'Target is max(heights) — increments only, so you cannot raise above max.',
    'Total moves = sum(max - h for h in heights).',
    'Single linear pass.',
    'Track max and total simultaneously.',
    'O(n) time, O(1) space.',
  ],
  editorial_md: ED(
    'Each tower needs to reach the global max. Since we can only add, the cheapest way is to bring everyone up to that height. The total number of unit increments is sum(max - h).',
    'Compute the array maximum in one pass while accumulating the sum of heights. The answer is `max * n - sum`. Equivalently, accumulate the deficit `max - h` per element in a second pass. Both forms are O(n). Edge cases: empty input or single element returns 0; an already-equal array also returns 0 because each `max - h` is zero.',
    '- Time: O(n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[1,2,3]'], expected: '3' },
    { inputs: ['[5,5,5]'], expected: '0' },
    { inputs: ['[1]'], expected: '0' },
    { inputs: ['[]'], expected: '0' },
    { inputs: ['[1,10]'], expected: '9' },
    { inputs: ['[1,1,1,1,1,10]'], expected: '45' },
    { inputs: ['[3,3,3,3]'], expected: '0' },
    { inputs: ['[0,0,0,0,0]'], expected: '0' },
    { inputs: ['[100,1,1]'], expected: '198' },
    { inputs: ['[1,2,3,4,5]'], expected: '10' },
    { inputs: ['[10,20,30,40,50]'], expected: '100' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def equalizeTowers(self, heights: List[int]) -> int:
        if not heights: return 0
        mx = max(heights)
        return mx * len(heights) - sum(heights)
`,
    javascript: `var equalizeTowers = function(heights) {
    if (!heights.length) return 0;
    let mx = -Infinity, s = 0;
    for (const h of heights) { if (h > mx) mx = h; s += h; }
    return mx * heights.length - s;
};
`,
    java: `class Solution {
    public int equalizeTowers(int[] heights) {
        if (heights.length == 0) return 0;
        int mx = Integer.MIN_VALUE; long s = 0;
        for (int h : heights) { if (h > mx) mx = h; s += h; }
        return (int) ((long) mx * heights.length - s);
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;

class Solution {
public:
    int equalizeTowers(vector<int>& heights) {
        if (heights.empty()) return 0;
        int mx = *max_element(heights.begin(), heights.end());
        long long s = accumulate(heights.begin(), heights.end(), 0LL);
        return (int) ((long long) mx * heights.size() - s);
    }
};
`,
  },
});

// ============================================================================
// 51. median-of-two-sorted
// ============================================================================
P.push({
  id: 'median-of-two-sorted',
  description: '<p>Given two sorted integer arrays <code>nums1</code> and <code>nums2</code> of sizes <code>m</code> and <code>n</code>, return the median of the combined sorted array. Aim for O(log(min(m, n))).</p>',
  method_name: 'findMedianSortedArrays',
  params: [
    { name: 'nums1', type: 'List[int]' },
    { name: 'nums2', type: 'List[int]' },
  ],
  return_type: 'float',
  pattern: 'Binary Search Partition',
  tags: ['arrays', 'binary-search'],
  hints: [
    'Binary search a partition i in the smaller array.',
    'The partition in the second array is j = (m + n + 1) // 2 - i.',
    'Valid when nums1[i - 1] ≤ nums2[j] and nums2[j - 1] ≤ nums1[i].',
    'Median = max(left side) when total is odd; (max(left) + min(right)) / 2 when even.',
    'Treat out-of-bounds as ±infinity.',
  ],
  editorial_md: ED(
    'Find a partition splitting the combined sorted sequence into two halves of equal (or off-by-one) size, with every element on the left ≤ every element on the right. Binary search the partition in the smaller array — O(log(min(m, n))).',
    'Ensure nums1 is the shorter; swap if not. Let total = m + n and half = (total + 1) // 2. Binary search i in [0, m] for the partition point in nums1. j = half - i is the matching partition in nums2. Define L1, R1, L2, R2 with ±inf for out-of-bounds. Valid when L1 ≤ R2 and L2 ≤ R1. If L1 > R2, the partition i is too large — hi = i - 1. If L2 > R1, too small — lo = i + 1. Once valid, max(L1, L2) is the left-half maximum and min(R1, R2) the right-half minimum. Odd total returns left max; even returns the average.',
    '- Time: O(log(min(m, n))).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[1,3]', '[2]'], expected: '2.0' },
    { inputs: ['[1,2]', '[3,4]'], expected: '2.5' },
    { inputs: ['[]', '[1]'], expected: '1.0' },
    { inputs: ['[2]', '[]'], expected: '2.0' },
    { inputs: ['[0,0]', '[0,0]'], expected: '0.0' },
    { inputs: ['[]', '[2,3]'], expected: '2.5' },
    { inputs: ['[1,2,3]', '[4,5,6]'], expected: '3.5' },
    { inputs: ['[1,2,3,4,5]', '[6,7,8,9,10]'], expected: '5.5' },
    { inputs: ['[-5,3,6,12,15]', '[-12,-10,-6,-3,4,10]'], expected: '3.0' },
    { inputs: ['[1]', '[2,3,4,5,6]'], expected: '3.5' },
    { inputs: ['[100000]', '[100001]'], expected: '100000.5' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        if len(nums1) > len(nums2):
            nums1, nums2 = nums2, nums1
        m, n = len(nums1), len(nums2)
        total = m + n
        half = (total + 1) // 2
        INF = float('inf')
        lo, hi = 0, m
        while lo <= hi:
            i = (lo + hi) // 2
            j = half - i
            L1 = nums1[i - 1] if i > 0 else -INF
            R1 = nums1[i] if i < m else INF
            L2 = nums2[j - 1] if j > 0 else -INF
            R2 = nums2[j] if j < n else INF
            if L1 <= R2 and L2 <= R1:
                if total % 2 == 1:
                    return float(max(L1, L2))
                return (max(L1, L2) + min(R1, R2)) / 2
            if L1 > R2:
                hi = i - 1
            else:
                lo = i + 1
        return 0.0
`,
    javascript: `var findMedianSortedArrays = function(nums1, nums2) {
    if (nums1.length > nums2.length) [nums1, nums2] = [nums2, nums1];
    const m = nums1.length, n = nums2.length, total = m + n, half = (total + 1) >> 1;
    let lo = 0, hi = m;
    while (lo <= hi) {
        const i = (lo + hi) >> 1;
        const j = half - i;
        const L1 = i > 0 ? nums1[i - 1] : -Infinity;
        const R1 = i < m ? nums1[i] : Infinity;
        const L2 = j > 0 ? nums2[j - 1] : -Infinity;
        const R2 = j < n ? nums2[j] : Infinity;
        if (L1 <= R2 && L2 <= R1) {
            if (total % 2 === 1) return Math.max(L1, L2);
            return (Math.max(L1, L2) + Math.min(R1, R2)) / 2;
        }
        if (L1 > R2) hi = i - 1;
        else lo = i + 1;
    }
    return 0;
};
`,
    java: `class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        if (nums1.length > nums2.length) { int[] t = nums1; nums1 = nums2; nums2 = t; }
        int m = nums1.length, n = nums2.length, total = m + n, half = (total + 1) / 2;
        int lo = 0, hi = m;
        while (lo <= hi) {
            int i = (lo + hi) / 2;
            int j = half - i;
            int L1 = i > 0 ? nums1[i - 1] : Integer.MIN_VALUE;
            int R1 = i < m ? nums1[i] : Integer.MAX_VALUE;
            int L2 = j > 0 ? nums2[j - 1] : Integer.MIN_VALUE;
            int R2 = j < n ? nums2[j] : Integer.MAX_VALUE;
            if (L1 <= R2 && L2 <= R1) {
                if (total % 2 == 1) return Math.max(L1, L2);
                return (Math.max(L1, L2) + Math.min(R1, R2)) / 2.0;
            }
            if (L1 > R2) hi = i - 1;
            else lo = i + 1;
        }
        return 0.0;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        if (nums1.size() > nums2.size()) swap(nums1, nums2);
        int m = nums1.size(), n = nums2.size(), total = m + n, half = (total + 1) / 2;
        int lo = 0, hi = m;
        while (lo <= hi) {
            int i = (lo + hi) / 2;
            int j = half - i;
            int L1 = i > 0 ? nums1[i - 1] : INT_MIN;
            int R1 = i < m ? nums1[i] : INT_MAX;
            int L2 = j > 0 ? nums2[j - 1] : INT_MIN;
            int R2 = j < n ? nums2[j] : INT_MAX;
            if (L1 <= R2 && L2 <= R1) {
                if (total % 2 == 1) return max(L1, L2);
                return (max(L1, L2) + min(R1, R2)) / 2.0;
            }
            if (L1 > R2) hi = i - 1;
            else lo = i + 1;
        }
        return 0.0;
    }
};
`,
  },
});

// ============================================================================
// 52. kth-of-two-sorted (kth smallest in union of two sorted)
// ============================================================================
P.push({
  id: 'kth-of-two-sorted',
  description: '<p>Given two sorted integer arrays <code>a</code> and <code>b</code> and a positive integer <code>k</code>, return the <code>k</code>-th smallest element of their union (1-indexed).</p>',
  method_name: 'kthOfTwoSorted',
  params: [
    { name: 'a', type: 'List[int]' },
    { name: 'b', type: 'List[int]' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Binary Search Partition',
  tags: ['arrays', 'binary-search'],
  hints: [
    'Binary search a partition i in the smaller array.',
    'Pair with j = k - i in the other array.',
    'Validate boundary inequalities; adjust the search half.',
    'Treat out-of-bounds as ±infinity.',
    'O(log(min(m, n))).',
  ],
  editorial_md: ED(
    'Find a split where i values from `a` and k - i values from `b` together form the smallest k values of the merge. Binary search the split in the smaller array; the partner split is forced.',
    'Swap so a is the shorter. Binary search i in [max(0, k - n), min(k, m)] — those bounds ensure j = k - i lies in [0, n]. At each step let L1 = a[i - 1] if i > 0 else -inf, R1 = a[i] if i < m else inf, similarly L2 and R2 with b and j. Valid when L1 ≤ R2 and L2 ≤ R1, and the answer is max(L1, L2). If L1 > R2 hi = i - 1, else lo = i + 1. The loop terminates inside the feasible window because the bounds were set up to keep j in range.',
    '- Time: O(log(min(m, n))).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[2,3,6,7,9]', '[1,4,8,10]', '5'], expected: '6' },
    { inputs: ['[100,112,256,349,770]', '[72,86,113,119,265,445,892]', '7'], expected: '256' },
    { inputs: ['[]', '[1,2,3]', '2'], expected: '2' },
    { inputs: ['[1,2,3]', '[]', '3'], expected: '3' },
    { inputs: ['[1]', '[2]', '1'], expected: '1' },
    { inputs: ['[1]', '[2]', '2'], expected: '2' },
    { inputs: ['[1,3,5]', '[2,4,6]', '4'], expected: '4' },
    { inputs: ['[1,3,5,7,9]', '[2,4,6,8,10]', '10'], expected: '10' },
    { inputs: ['[1,2,3]', '[4,5,6]', '1'], expected: '1' },
    { inputs: ['[1,2,3]', '[4,5,6]', '6'], expected: '6' },
    { inputs: ['[-5,-3,-1]', '[-4,-2,0]', '3'], expected: '-3' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def kthOfTwoSorted(self, a: List[int], b: List[int], k: int) -> int:
        if len(a) > len(b):
            a, b = b, a
        m, n = len(a), len(b)
        INF = float('inf')
        lo, hi = max(0, k - n), min(k, m)
        while lo <= hi:
            i = (lo + hi) // 2
            j = k - i
            L1 = a[i - 1] if i > 0 else -INF
            R1 = a[i] if i < m else INF
            L2 = b[j - 1] if j > 0 else -INF
            R2 = b[j] if j < n else INF
            if L1 <= R2 and L2 <= R1:
                return int(max(L1, L2))
            if L1 > R2:
                hi = i - 1
            else:
                lo = i + 1
        return -1
`,
    javascript: `var kthOfTwoSorted = function(a, b, k) {
    if (a.length > b.length) [a, b] = [b, a];
    const m = a.length, n = b.length;
    let lo = Math.max(0, k - n), hi = Math.min(k, m);
    while (lo <= hi) {
        const i = (lo + hi) >> 1;
        const j = k - i;
        const L1 = i > 0 ? a[i - 1] : -Infinity;
        const R1 = i < m ? a[i] : Infinity;
        const L2 = j > 0 ? b[j - 1] : -Infinity;
        const R2 = j < n ? b[j] : Infinity;
        if (L1 <= R2 && L2 <= R1) return Math.max(L1, L2);
        if (L1 > R2) hi = i - 1;
        else lo = i + 1;
    }
    return -1;
};
`,
    java: `class Solution {
    public int kthOfTwoSorted(int[] a, int[] b, int k) {
        if (a.length > b.length) { int[] t = a; a = b; b = t; }
        int m = a.length, n = b.length;
        int lo = Math.max(0, k - n), hi = Math.min(k, m);
        while (lo <= hi) {
            int i = (lo + hi) / 2;
            int j = k - i;
            int L1 = i > 0 ? a[i - 1] : Integer.MIN_VALUE;
            int R1 = i < m ? a[i] : Integer.MAX_VALUE;
            int L2 = j > 0 ? b[j - 1] : Integer.MIN_VALUE;
            int R2 = j < n ? b[j] : Integer.MAX_VALUE;
            if (L1 <= R2 && L2 <= R1) return Math.max(L1, L2);
            if (L1 > R2) hi = i - 1;
            else lo = i + 1;
        }
        return -1;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

class Solution {
public:
    int kthOfTwoSorted(vector<int>& a, vector<int>& b, int k) {
        if (a.size() > b.size()) swap(a, b);
        int m = a.size(), n = b.size();
        int lo = max(0, k - n), hi = min(k, m);
        while (lo <= hi) {
            int i = (lo + hi) / 2;
            int j = k - i;
            int L1 = i > 0 ? a[i - 1] : INT_MIN;
            int R1 = i < m ? a[i] : INT_MAX;
            int L2 = j > 0 ? b[j - 1] : INT_MIN;
            int R2 = j < n ? b[j] : INT_MAX;
            if (L1 <= R2 && L2 <= R1) return max(L1, L2);
            if (L1 > R2) hi = i - 1;
            else lo = i + 1;
        }
        return -1;
    }
};
`,
  },
});

// ============================================================================
// 53. closest-triplet (closest triplet sum to target — same as 3sum closest)
// ============================================================================
P.push({
  id: 'closest-triplet',
  description: '<p>Given an integer array <code>nums</code> and an integer <code>target</code>, return the sum of the triplet whose sum is closest to <code>target</code>.</p>',
  method_name: 'closestTripletSum',
  params: [
    { name: 'nums', type: 'List[int]' },
    { name: 'target', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Two Pointers',
  tags: ['arrays', 'two-pointers'],
  hints: [
    'Sort first.',
    'Fix one element; two-pointer search the other two.',
    'Track |sum - target|; update on improvement.',
    'Move left right when sum < target; move right left otherwise.',
    'Early exit when sum == target.',
  ],
  editorial_md: ED(
    'Classic two-pointer triplet scan: sort, then for each pivot run inward pointers until they cross. Track the best sum seen.',
    'Sort nums. Initialise best to nums[0] + nums[1] + nums[2]. Loop i from 0 to n - 3. Set lo = i + 1, hi = n - 1. Inner loop while lo < hi: s = nums[i] + nums[lo] + nums[hi]. If |s - target| < |best - target|, update best. If s == target return s immediately. If s < target lo++ else hi--. Total O(n²). Sorting helps because monotone movement of pointers covers the entire search space without backtracking. Skipping duplicate values inside the loop is a micro-optimisation but not required for correctness.',
    '- Time: O(n²).\n- Space: O(1) extra.'
  ),
  test_cases: [
    { inputs: ['[-1,2,1,-4]', '1'], expected: '2' },
    { inputs: ['[0,0,0]', '1'], expected: '0' },
    { inputs: ['[1,1,1,0]', '-100'], expected: '2' },
    { inputs: ['[1,2,3,4,5]', '10'], expected: '10' },
    { inputs: ['[1,2,3,4,5]', '0'], expected: '6' },
    { inputs: ['[-5,-4,-3,-2,-1]', '-1'], expected: '-6' },
    { inputs: ['[10,20,30,40,50]', '60'], expected: '60' },
    { inputs: ['[1,1,1,1]', '0'], expected: '3' },
    { inputs: ['[0,1,2]', '3'], expected: '3' },
    { inputs: ['[-1,0,1,2]', '2'], expected: '2' },
    { inputs: ['[7,7,7,7,7]', '20'], expected: '21' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def closestTripletSum(self, nums: List[int], target: int) -> int:
        nums.sort()
        n = len(nums)
        best = nums[0] + nums[1] + nums[2]
        for i in range(n - 2):
            lo, hi = i + 1, n - 1
            while lo < hi:
                s = nums[i] + nums[lo] + nums[hi]
                if abs(s - target) < abs(best - target):
                    best = s
                if s == target: return s
                if s < target: lo += 1
                else: hi -= 1
        return best
`,
    javascript: `var closestTripletSum = function(nums, target) {
    nums.sort((a, b) => a - b);
    const n = nums.length;
    let best = nums[0] + nums[1] + nums[2];
    for (let i = 0; i < n - 2; i++) {
        let lo = i + 1, hi = n - 1;
        while (lo < hi) {
            const s = nums[i] + nums[lo] + nums[hi];
            if (Math.abs(s - target) < Math.abs(best - target)) best = s;
            if (s === target) return s;
            if (s < target) lo++; else hi--;
        }
    }
    return best;
};
`,
    java: `import java.util.*;

class Solution {
    public int closestTripletSum(int[] nums, int target) {
        Arrays.sort(nums);
        int n = nums.length;
        int best = nums[0] + nums[1] + nums[2];
        for (int i = 0; i < n - 2; i++) {
            int lo = i + 1, hi = n - 1;
            while (lo < hi) {
                int s = nums[i] + nums[lo] + nums[hi];
                if (Math.abs(s - target) < Math.abs(best - target)) best = s;
                if (s == target) return s;
                if (s < target) lo++; else hi--;
            }
        }
        return best;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
#include <cstdlib>
using namespace std;

class Solution {
public:
    int closestTripletSum(vector<int>& nums, int target) {
        sort(nums.begin(), nums.end());
        int n = nums.size();
        int best = nums[0] + nums[1] + nums[2];
        for (int i = 0; i < n - 2; i++) {
            int lo = i + 1, hi = n - 1;
            while (lo < hi) {
                int s = nums[i] + nums[lo] + nums[hi];
                if (abs(s - target) < abs(best - target)) best = s;
                if (s == target) return s;
                if (s < target) lo++; else hi--;
            }
        }
        return best;
    }
};
`,
  },
});

// ============================================================================
// 54. count-triplets (count i < j < k with arr[i] + arr[j] + arr[k] == target)
// ============================================================================
P.push({
  id: 'count-triplets',
  description: '<p>Given an integer array <code>arr</code> and an integer <code>target</code>, return the number of triplets <code>(i, j, k)</code> with <code>i &lt; j &lt; k</code> such that <code>arr[i] + arr[j] + arr[k] == target</code>.</p>',
  method_name: 'countTriplets',
  params: [
    { name: 'arr', type: 'List[int]' },
    { name: 'target', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Two Pointers',
  tags: ['arrays', 'two-pointers'],
  hints: [
    'Sort the array — index order no longer matters after sorting since we count value-based triplets.',
    'Fix i; two pointers lo = i + 1, hi = n - 1.',
    'When sum equals target, count groups of equal values on both sides and skip them.',
    'When sum < target, lo++; else hi--.',
    'Be careful with duplicates: count combinations C(left, 2) etc.',
  ],
  editorial_md: ED(
    'Sort the array, then for each pivot i use two pointers. When a triplet matches the target, blocks of equal values on the lo and hi sides multiply the count by the number of equal copies.',
    'Sort arr. For each i from 0 to n - 3: lo = i + 1, hi = n - 1. While lo < hi compute s. If s < target lo++. If s > target hi--. If s == target: if arr[lo] != arr[hi], count consecutive equals on the left (cl) and on the right (cr), add cl * cr to total, jump lo and hi past those runs. If arr[lo] == arr[hi], the run is a single value used 2-at-a-time, add C(hi - lo + 1, 2) = (hi - lo + 1) * (hi - lo) / 2 and break out of the inner loop. This handles all duplicate scenarios in O(n²).',
    '- Time: O(n²).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[1,1,2,2,3,3,4,4,5,5]', '8'], expected: '20' },
    { inputs: ['[1,2,3,4,5]', '9'], expected: '2' },
    { inputs: ['[0,0,0]', '0'], expected: '1' },
    { inputs: ['[0,0,0,0]', '0'], expected: '4' },
    { inputs: ['[1,2,3]', '6'], expected: '1' },
    { inputs: ['[1,2,3]', '7'], expected: '0' },
    { inputs: ['[-1,0,1,2,-1,-4]', '0'], expected: '2' },
    { inputs: ['[1,1,1,1,1,1]', '3'], expected: '20' },
    { inputs: ['[5,5,5,5,5]', '15'], expected: '10' },
    { inputs: ['[1]', '1'], expected: '0' },
    { inputs: ['[10,-10,5,5,-5,0]', '0'], expected: '3' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def countTriplets(self, arr: List[int], target: int) -> int:
        arr = sorted(arr)
        n = len(arr)
        total = 0
        for i in range(n - 2):
            lo, hi = i + 1, n - 1
            while lo < hi:
                s = arr[i] + arr[lo] + arr[hi]
                if s < target:
                    lo += 1
                elif s > target:
                    hi -= 1
                else:
                    if arr[lo] != arr[hi]:
                        cl = 1
                        while lo + cl < hi and arr[lo + cl] == arr[lo]:
                            cl += 1
                        cr = 1
                        while hi - cr > lo and arr[hi - cr] == arr[hi]:
                            cr += 1
                        total += cl * cr
                        lo += cl; hi -= cr
                    else:
                        m = hi - lo + 1
                        total += m * (m - 1) // 2
                        break
        return total
`,
    javascript: `var countTriplets = function(arr, target) {
    arr = arr.slice().sort((a, b) => a - b);
    const n = arr.length;
    let total = 0;
    for (let i = 0; i < n - 2; i++) {
        let lo = i + 1, hi = n - 1;
        while (lo < hi) {
            const s = arr[i] + arr[lo] + arr[hi];
            if (s < target) lo++;
            else if (s > target) hi--;
            else {
                if (arr[lo] !== arr[hi]) {
                    let cl = 1;
                    while (lo + cl < hi && arr[lo + cl] === arr[lo]) cl++;
                    let cr = 1;
                    while (hi - cr > lo && arr[hi - cr] === arr[hi]) cr++;
                    total += cl * cr;
                    lo += cl; hi -= cr;
                } else {
                    const m = hi - lo + 1;
                    total += (m * (m - 1)) / 2;
                    break;
                }
            }
        }
    }
    return total;
};
`,
    java: `import java.util.*;

class Solution {
    public int countTriplets(int[] arr, int target) {
        int[] a = arr.clone();
        Arrays.sort(a);
        int n = a.length;
        long total = 0;
        for (int i = 0; i < n - 2; i++) {
            int lo = i + 1, hi = n - 1;
            while (lo < hi) {
                int s = a[i] + a[lo] + a[hi];
                if (s < target) lo++;
                else if (s > target) hi--;
                else {
                    if (a[lo] != a[hi]) {
                        int cl = 1;
                        while (lo + cl < hi && a[lo + cl] == a[lo]) cl++;
                        int cr = 1;
                        while (hi - cr > lo && a[hi - cr] == a[hi]) cr++;
                        total += (long) cl * cr;
                        lo += cl; hi -= cr;
                    } else {
                        long m = hi - lo + 1;
                        total += m * (m - 1) / 2;
                        break;
                    }
                }
            }
        }
        return (int) total;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int countTriplets(vector<int>& arr, int target) {
        vector<int> a = arr;
        sort(a.begin(), a.end());
        int n = a.size();
        long long total = 0;
        for (int i = 0; i < n - 2; i++) {
            int lo = i + 1, hi = n - 1;
            while (lo < hi) {
                int s = a[i] + a[lo] + a[hi];
                if (s < target) lo++;
                else if (s > target) hi--;
                else {
                    if (a[lo] != a[hi]) {
                        int cl = 1;
                        while (lo + cl < hi && a[lo + cl] == a[lo]) cl++;
                        int cr = 1;
                        while (hi - cr > lo && a[hi - cr] == a[hi]) cr++;
                        total += (long long) cl * cr;
                        lo += cl; hi -= cr;
                    } else {
                        long long m = hi - lo + 1;
                        total += m * (m - 1) / 2;
                        break;
                    }
                }
            }
        }
        return (int) total;
    }
};
`,
  },
});

// ============================================================================
// 55. max-sum-subarray-of-size-k
// ============================================================================
P.push({
  id: 'max-sum-subarray-of-size-k',
  description: '<p>Given an integer array <code>arr</code> and an integer <code>k</code>, return the maximum sum of any contiguous subarray of length exactly <code>k</code>. Return 0 if <code>k</code> exceeds the array length.</p>',
  method_name: 'maxSubarraySumK',
  params: [
    { name: 'arr', type: 'List[int]' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Sliding Window (fixed)',
  tags: ['arrays', 'sliding-window'],
  hints: [
    'Compute the sum of the first k elements.',
    'Slide right: add arr[i], subtract arr[i - k].',
    'Track the max along the way.',
    'O(n) time, O(1) space.',
    'Guard against k > n or k <= 0.',
  ],
  editorial_md: ED(
    'A fixed-size window sum can be updated in O(1) per shift by adding the entering element and subtracting the leaving one. The maximum across all windows is the answer.',
    'Edge case: if k > len(arr) or k <= 0 return 0. Compute window = sum of arr[0..k-1] and seed best = window. From i = k to n - 1 update window += arr[i] - arr[i - k] and best = max(best, window). One linear pass, constant extra space. This is the canonical fixed-window template — any problem asking for "best of all length-k windows" reuses it.',
    '- Time: O(n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[1,4,2,10,2,3,1,0,20]', '4'], expected: '24' },
    { inputs: ['[2,1,5,1,3,2]', '3'], expected: '9' },
    { inputs: ['[2,3,4,1,5]', '1'], expected: '5' },
    { inputs: ['[5]', '1'], expected: '5' },
    { inputs: ['[1,2,3]', '3'], expected: '6' },
    { inputs: ['[1,2,3]', '4'], expected: '0' },
    { inputs: ['[-1,-2,-3,-4]', '2'], expected: '-3' },
    { inputs: ['[0,0,0,0]', '2'], expected: '0' },
    { inputs: ['[1,1,1,1,1,1,1]', '3'], expected: '3' },
    { inputs: ['[10,-10,10,-10,10]', '3'], expected: '10' },
    { inputs: ['[]', '0'], expected: '0' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def maxSubarraySumK(self, arr: List[int], k: int) -> int:
        n = len(arr)
        if k <= 0 or k > n: return 0
        window = sum(arr[:k])
        best = window
        for i in range(k, n):
            window += arr[i] - arr[i - k]
            if window > best: best = window
        return best
`,
    javascript: `var maxSubarraySumK = function(arr, k) {
    const n = arr.length;
    if (k <= 0 || k > n) return 0;
    let window = 0;
    for (let i = 0; i < k; i++) window += arr[i];
    let best = window;
    for (let i = k; i < n; i++) {
        window += arr[i] - arr[i - k];
        if (window > best) best = window;
    }
    return best;
};
`,
    java: `class Solution {
    public int maxSubarraySumK(int[] arr, int k) {
        int n = arr.length;
        if (k <= 0 || k > n) return 0;
        int window = 0;
        for (int i = 0; i < k; i++) window += arr[i];
        int best = window;
        for (int i = k; i < n; i++) {
            window += arr[i] - arr[i - k];
            if (window > best) best = window;
        }
        return best;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int maxSubarraySumK(vector<int>& arr, int k) {
        int n = arr.size();
        if (k <= 0 || k > n) return 0;
        int window = 0;
        for (int i = 0; i < k; i++) window += arr[i];
        int best = window;
        for (int i = k; i < n; i++) {
            window += arr[i] - arr[i - k];
            if (window > best) best = window;
        }
        return best;
    }
};
`,
  },
});

// ============================================================================
// 56. max-xor-of-k-size (max xor of any contiguous subarray of length k)
// ============================================================================
P.push({
  id: 'max-xor-of-k-size',
  description: '<p>Given an integer array <code>arr</code> and an integer <code>k</code>, return the maximum XOR of any contiguous subarray of length exactly <code>k</code>.</p>',
  method_name: 'maxXorK',
  params: [
    { name: 'arr', type: 'List[int]' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Sliding Window (XOR)',
  tags: ['arrays', 'sliding-window', 'bit-manipulation'],
  hints: [
    'XOR is its own inverse — sliding-window add and remove via XOR.',
    'Initialise window XOR over first k elements.',
    'Each shift: window ^= arr[i]; window ^= arr[i - k].',
    'Track running max.',
    'O(n) time.',
  ],
  editorial_md: ED(
    'XOR has the same self-inverse property as addition\'s negation: removing an element is just XOR\'ing it again. So a fixed-window XOR updates in O(1) per shift.',
    'Edge case: if k > n or k ≤ 0 return 0. Compute window as XOR of arr[0..k-1] and seed best. For i = k to n - 1: window ^= arr[i] (add the entering element); window ^= arr[i - k] (remove the leaving element). Update best. The pass is O(n). This is structurally identical to the fixed-window sum template — only the combining operator changes.',
    '- Time: O(n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[1,2,3,4,5]', '3'], expected: '7' },
    { inputs: ['[1,2,3,4]', '2'], expected: '7' },
    { inputs: ['[5,7,2,9]', '2'], expected: '11' },
    { inputs: ['[0,0,0]', '2'], expected: '0' },
    { inputs: ['[1]', '1'], expected: '1' },
    { inputs: ['[1,2]', '3'], expected: '0' },
    { inputs: ['[1,1,1,1]', '2'], expected: '0' },
    { inputs: ['[15,1,2,3]', '1'], expected: '15' },
    { inputs: ['[8,4,2,1]', '4'], expected: '15' },
    { inputs: ['[10,20,30,40]', '3'], expected: '54' },
    { inputs: ['[7,7,7]', '3'], expected: '7' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def maxXorK(self, arr: List[int], k: int) -> int:
        n = len(arr)
        if k <= 0 or k > n: return 0
        window = 0
        for i in range(k):
            window ^= arr[i]
        best = window
        for i in range(k, n):
            window ^= arr[i]
            window ^= arr[i - k]
            if window > best: best = window
        return best
`,
    javascript: `var maxXorK = function(arr, k) {
    const n = arr.length;
    if (k <= 0 || k > n) return 0;
    let window = 0;
    for (let i = 0; i < k; i++) window ^= arr[i];
    let best = window;
    for (let i = k; i < n; i++) {
        window ^= arr[i];
        window ^= arr[i - k];
        if (window > best) best = window;
    }
    return best;
};
`,
    java: `class Solution {
    public int maxXorK(int[] arr, int k) {
        int n = arr.length;
        if (k <= 0 || k > n) return 0;
        int window = 0;
        for (int i = 0; i < k; i++) window ^= arr[i];
        int best = window;
        for (int i = k; i < n; i++) {
            window ^= arr[i];
            window ^= arr[i - k];
            if (window > best) best = window;
        }
        return best;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int maxXorK(vector<int>& arr, int k) {
        int n = arr.size();
        if (k <= 0 || k > n) return 0;
        int window = 0;
        for (int i = 0; i < k; i++) window ^= arr[i];
        int best = window;
        for (int i = k; i < n; i++) {
            window ^= arr[i];
            window ^= arr[i - k];
            if (window > best) best = window;
        }
        return best;
    }
};
`,
  },
});

// ============================================================================
// 57. distinct-in-every-window
// ============================================================================
P.push({
  id: 'distinct-in-every-window',
  description: '<p>Given an integer array <code>arr</code> and an integer <code>k</code>, return an array where the i-th element is the number of distinct values in the window <code>arr[i..i + k - 1]</code>.</p>',
  method_name: 'distinctInEveryWindow',
  params: [
    { name: 'arr', type: 'List[int]' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'List[int]',
  pattern: 'Sliding Window + Hash Map',
  tags: ['arrays', 'sliding-window', 'hash-table'],
  hints: [
    'Frequency map of values currently in the window.',
    'Distinct count = map size.',
    'Add the entering element; if it was 0 before, distinct count increases.',
    'Remove the leaving element; if its count drops to 0, distinct count decreases.',
    'O(n) total across all windows.',
  ],
  editorial_md: ED(
    'Track a frequency map of the values inside the current window. Distinct count is the map size. Sliding by one means add the entering value and remove the leaving value, updating distinctness in O(1) on each side.',
    'Initialise an empty hash map. Fill the first window: for each of the first k values increment freq[v]; if it was zero before, distinct++. Append distinct to the result. For i = k to n - 1: process the entering value arr[i] same way. For the leaving value arr[i - k], decrement freq; if it drops to zero, distinct--. Append distinct. If k > n return [] (no full window exists). Output length is n - k + 1.',
    '- Time: O(n).\n- Space: O(k) for the frequency map.'
  ),
  test_cases: [
    { inputs: ['[1,2,1,3,4,2,3]', '4'], expected: '[3,4,4,3]' },
    { inputs: ['[1,2,4,4]', '2'], expected: '[2,2,1]' },
    { inputs: ['[1,1,1,1]', '2'], expected: '[1,1,1]' },
    { inputs: ['[1,2,3,4,5]', '5'], expected: '[5]' },
    { inputs: ['[1]', '1'], expected: '[1]' },
    { inputs: ['[1,2,3]', '4'], expected: '[]' },
    { inputs: ['[1,2,1,2,1,2]', '3'], expected: '[2,2,2,2]' },
    { inputs: ['[1,2,3,4,5,6,7]', '3'], expected: '[3,3,3,3,3]' },
    { inputs: ['[1,1,2,2,3,3]', '2'], expected: '[1,2,1,2,1]' },
    { inputs: ['[5,5,5,5]', '1'], expected: '[1,1,1,1]' },
    { inputs: ['[10,20,30]', '2'], expected: '[2,2]' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def distinctInEveryWindow(self, arr: List[int], k: int) -> List[int]:
        n = len(arr)
        if k <= 0 or k > n: return []
        freq: dict[int, int] = {}
        for i in range(k):
            freq[arr[i]] = freq.get(arr[i], 0) + 1
        out = [len(freq)]
        for i in range(k, n):
            inv = arr[i]
            freq[inv] = freq.get(inv, 0) + 1
            outv = arr[i - k]
            freq[outv] -= 1
            if freq[outv] == 0:
                del freq[outv]
            out.append(len(freq))
        return out
`,
    javascript: `var distinctInEveryWindow = function(arr, k) {
    const n = arr.length;
    if (k <= 0 || k > n) return [];
    const freq = new Map();
    for (let i = 0; i < k; i++) freq.set(arr[i], (freq.get(arr[i]) || 0) + 1);
    const out = [freq.size];
    for (let i = k; i < n; i++) {
        const inv = arr[i];
        freq.set(inv, (freq.get(inv) || 0) + 1);
        const outv = arr[i - k];
        const c = freq.get(outv) - 1;
        if (c === 0) freq.delete(outv); else freq.set(outv, c);
        out.push(freq.size);
    }
    return out;
};
`,
    java: `import java.util.*;

class Solution {
    public List<Integer> distinctInEveryWindow(int[] arr, int k) {
        List<Integer> out = new ArrayList<>();
        int n = arr.length;
        if (k <= 0 || k > n) return out;
        Map<Integer, Integer> freq = new HashMap<>();
        for (int i = 0; i < k; i++) freq.merge(arr[i], 1, Integer::sum);
        out.add(freq.size());
        for (int i = k; i < n; i++) {
            freq.merge(arr[i], 1, Integer::sum);
            int c = freq.get(arr[i - k]) - 1;
            if (c == 0) freq.remove(arr[i - k]); else freq.put(arr[i - k], c);
            out.add(freq.size());
        }
        return out;
    }
}
`,
    cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> distinctInEveryWindow(vector<int>& arr, int k) {
        vector<int> out;
        int n = arr.size();
        if (k <= 0 || k > n) return out;
        unordered_map<int, int> freq;
        for (int i = 0; i < k; i++) freq[arr[i]]++;
        out.push_back((int) freq.size());
        for (int i = k; i < n; i++) {
            freq[arr[i]]++;
            int outv = arr[i - k];
            if (--freq[outv] == 0) freq.erase(outv);
            out.push_back((int) freq.size());
        }
        return out;
    }
};
`,
  },
});

// ============================================================================
// 58. mex-of-subarrays (MEX of each subarray of size k)
// ============================================================================
P.push({
  id: 'mex-of-subarrays',
  description: '<p>Given an array of non-negative integers <code>arr</code> and an integer <code>k</code>, for each contiguous subarray of length <code>k</code>, compute its MEX — the minimum non-negative integer not present in the subarray. Return the list of MEX values.</p>',
  method_name: 'mexOfSubarrays',
  params: [
    { name: 'arr', type: 'List[int]' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'List[int]',
  pattern: 'Sliding Window + Sorted Set',
  tags: ['arrays', 'sliding-window'],
  hints: [
    'Maintain frequency map of values in the current window.',
    'Maintain a sorted set of missing non-negative integers in 0..k (MEX is at most k).',
    'On insert: if value was missing, remove it from the set.',
    'On remove: if value count drops to zero and value ≤ k, add it back.',
    'MEX is the min of the missing set.',
  ],
  editorial_md: ED(
    'The MEX of any length-k window must lie in [0, k] — there are only k values in the window, so at most k of 0..k can be present, and at least one is missing. Track the set of currently missing values in that range and the MEX is its minimum.',
    'Pre-populate a sorted set (TreeSet / SortedList) with 0..k — these are all initially "missing". Initialise a freq map. For each of the first k values: increment freq; if the value is in [0, k] and it just became present (count went 0 → 1), remove it from the missing set. Append the missing set\'s minimum (which is the window MEX) to the output. Slide: insert arr[i] (mirror the same logic); for the leaving arr[i - k], decrement freq, and if its count drops to zero and value is in [0, k], add it back to the missing set. Each insert / delete on the sorted set is O(log k).',
    '- Time: O(n log k).\n- Space: O(k).'
  ),
  test_cases: [
    { inputs: ['[1,2,0,3,4]', '3'], expected: '[3,1,1]' },
    { inputs: ['[0,1,2]', '3'], expected: '[3]' },
    { inputs: ['[1,2,3]', '3'], expected: '[0]' },
    { inputs: ['[0]', '1'], expected: '[1]' },
    { inputs: ['[1]', '1'], expected: '[0]' },
    { inputs: ['[0,0,0]', '2'], expected: '[1,1]' },
    { inputs: ['[0,1,2,3,4]', '5'], expected: '[5]' },
    { inputs: ['[2,1,0,3]', '3'], expected: '[3,4]' },
    { inputs: ['[5,5,5,5]', '2'], expected: '[0,0,0]' },
    { inputs: ['[0,2,1,3,0]', '2'], expected: '[1,0,0,1]' },
    { inputs: ['[1,2,3,4,5]', '4'], expected: '[0,0]' },
  ],
  solutions: {
    python: `from typing import List
import heapq

class Solution:
    def mexOfSubarrays(self, arr: List[int], k: int) -> List[int]:
        n = len(arr)
        if k <= 0 or k > n: return []
        freq: dict[int, int] = {}
        # Min-heap of missing values; lazy deletion.
        present_above = set()  # we just track present, missing computed
        missing = list(range(k + 1))
        heapq.heapify(missing)
        present_set = set()
        for i in range(k):
            v = arr[i]
            freq[v] = freq.get(v, 0) + 1
            if v <= k:
                present_set.add(v)
        out = []
        def mex_now() -> int:
            while missing and missing[0] in present_set:
                heapq.heappop(missing)
            return missing[0] if missing else k + 1
        out.append(mex_now())
        for i in range(k, n):
            inv = arr[i]
            freq[inv] = freq.get(inv, 0) + 1
            if inv <= k:
                present_set.add(inv)
            outv = arr[i - k]
            freq[outv] -= 1
            if freq[outv] == 0:
                if outv in present_set:
                    present_set.discard(outv)
                    if outv <= k:
                        heapq.heappush(missing, outv)
            out.append(mex_now())
        return out
`,
    javascript: `var mexOfSubarrays = function(arr, k) {
    const n = arr.length;
    if (k <= 0 || k > n) return [];
    const freq = new Map();
    const present = new Set();
    for (let i = 0; i < k; i++) {
        const v = arr[i];
        freq.set(v, (freq.get(v) || 0) + 1);
        if (v <= k) present.add(v);
    }
    const mexNow = () => {
        for (let m = 0; m <= k; m++) if (!present.has(m)) return m;
        return k + 1;
    };
    const out = [mexNow()];
    for (let i = k; i < n; i++) {
        const inv = arr[i];
        freq.set(inv, (freq.get(inv) || 0) + 1);
        if (inv <= k) present.add(inv);
        const outv = arr[i - k];
        const c = freq.get(outv) - 1;
        if (c === 0) {
            freq.delete(outv);
            if (outv <= k) present.delete(outv);
        } else {
            freq.set(outv, c);
        }
        out.push(mexNow());
    }
    return out;
};
`,
    java: `import java.util.*;

class Solution {
    public List<Integer> mexOfSubarrays(int[] arr, int k) {
        List<Integer> out = new ArrayList<>();
        int n = arr.length;
        if (k <= 0 || k > n) return out;
        Map<Integer, Integer> freq = new HashMap<>();
        Set<Integer> present = new HashSet<>();
        for (int i = 0; i < k; i++) {
            int v = arr[i];
            freq.merge(v, 1, Integer::sum);
            if (v <= k) present.add(v);
        }
        out.add(mex(present, k));
        for (int i = k; i < n; i++) {
            int inv = arr[i];
            freq.merge(inv, 1, Integer::sum);
            if (inv <= k) present.add(inv);
            int outv = arr[i - k];
            int c = freq.get(outv) - 1;
            if (c == 0) {
                freq.remove(outv);
                if (outv <= k) present.remove(outv);
            } else {
                freq.put(outv, c);
            }
            out.add(mex(present, k));
        }
        return out;
    }
    private int mex(Set<Integer> present, int k) {
        for (int m = 0; m <= k; m++) if (!present.contains(m)) return m;
        return k + 1;
    }
}
`,
    cpp: `#include <vector>
#include <unordered_map>
#include <unordered_set>
using namespace std;

class Solution {
public:
    vector<int> mexOfSubarrays(vector<int>& arr, int k) {
        vector<int> out;
        int n = arr.size();
        if (k <= 0 || k > n) return out;
        unordered_map<int, int> freq;
        unordered_set<int> present;
        for (int i = 0; i < k; i++) {
            int v = arr[i];
            freq[v]++;
            if (v <= k) present.insert(v);
        }
        auto mex = [&]() {
            for (int m = 0; m <= k; m++) if (!present.count(m)) return m;
            return k + 1;
        };
        out.push_back(mex());
        for (int i = k; i < n; i++) {
            int inv = arr[i];
            freq[inv]++;
            if (inv <= k) present.insert(inv);
            int outv = arr[i - k];
            if (--freq[outv] == 0) {
                freq.erase(outv);
                if (outv <= k) present.erase(outv);
            }
            out.push_back(mex());
        }
        return out;
    }
};
`,
  },
});

// ============================================================================
// 59. min-swaps-to-group-all-1
// ============================================================================
P.push({
  id: 'min-swaps-to-group-all-1',
  description: '<p>Given a binary array <code>arr</code>, return the minimum number of swaps required to bring all the 1\'s together. A swap is between any two indices.</p>',
  method_name: 'minSwapsToGroupOnes',
  params: [{ name: 'arr', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Sliding Window',
  tags: ['arrays', 'sliding-window'],
  hints: [
    'Let ones = count of 1\'s.',
    'Best grouping uses a window of length ones — the one with the most 1\'s already.',
    'Minimum swaps = ones - max(ones inside any length-ones window).',
    'Sliding window with the fixed-size template.',
    'Edge case: zero or one 1 → 0 swaps.',
  ],
  editorial_md: ED(
    'All 1\'s must end up in some contiguous block of length ones (the total count of 1\'s). The block that costs the fewest swaps is the one that already contains the most 1\'s — for each missing 1 in that block, exactly one swap brings it in.',
    'Count `ones` = sum(arr). If ones ≤ 1 return 0. Use a fixed-size window of length ones. Compute the count of 1\'s in the first window. Slide one step at a time, adjusting the count by +arr[i] - arr[i - ones]. Track the maximum count seen. The answer is `ones - maxCount` — the number of 0\'s inside the best window, each of which needs one swap with a 1 outside.',
    '- Time: O(n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[1,0,1,0,1]'], expected: '1' },
    { inputs: ['[0,0,0,1,0]'], expected: '0' },
    { inputs: ['[1,0,1,0,1,0,0,1,1,0,1]'], expected: '3' },
    { inputs: ['[1,1,1]'], expected: '0' },
    { inputs: ['[0,0,0]'], expected: '0' },
    { inputs: ['[1]'], expected: '0' },
    { inputs: ['[0]'], expected: '0' },
    { inputs: ['[]'], expected: '0' },
    { inputs: ['[1,0,1]'], expected: '1' },
    { inputs: ['[0,1,0,1,1,0,0]'], expected: '1' },
    { inputs: ['[1,1,0,0,1,1,0,1]'], expected: '1' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def minSwapsToGroupOnes(self, arr: List[int]) -> int:
        ones = sum(arr)
        n = len(arr)
        if ones <= 1: return 0
        cur = sum(arr[:ones])
        best = cur
        for i in range(ones, n):
            cur += arr[i] - arr[i - ones]
            if cur > best: best = cur
        return ones - best
`,
    javascript: `var minSwapsToGroupOnes = function(arr) {
    const n = arr.length;
    let ones = 0;
    for (const v of arr) ones += v;
    if (ones <= 1) return 0;
    let cur = 0;
    for (let i = 0; i < ones; i++) cur += arr[i];
    let best = cur;
    for (let i = ones; i < n; i++) {
        cur += arr[i] - arr[i - ones];
        if (cur > best) best = cur;
    }
    return ones - best;
};
`,
    java: `class Solution {
    public int minSwapsToGroupOnes(int[] arr) {
        int n = arr.length, ones = 0;
        for (int v : arr) ones += v;
        if (ones <= 1) return 0;
        int cur = 0;
        for (int i = 0; i < ones; i++) cur += arr[i];
        int best = cur;
        for (int i = ones; i < n; i++) {
            cur += arr[i] - arr[i - ones];
            if (cur > best) best = cur;
        }
        return ones - best;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int minSwapsToGroupOnes(vector<int>& arr) {
        int n = arr.size(), ones = 0;
        for (int v : arr) ones += v;
        if (ones <= 1) return 0;
        int cur = 0;
        for (int i = 0; i < ones; i++) cur += arr[i];
        int best = cur;
        for (int i = ones; i < n; i++) {
            cur += arr[i] - arr[i - ones];
            if (cur > best) best = cur;
        }
        return ones - best;
    }
};
`,
  },
});

// ============================================================================
// 60. peak-index-in-a-mountain-array
// ============================================================================
P.push({
  id: 'peak-index-in-a-mountain-array',
  method_name: 'peakIndexInMountainArray',
  params: [{ name: 'arr', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Binary Search',
  tags: ['arrays', 'binary-search'],
  hints: [
    'arr strictly increases to a peak then strictly decreases.',
    'Compare arr[mid] with arr[mid + 1].',
    'If increasing slope at mid → peak is to the right.',
    'If decreasing slope at mid → peak is at mid or to the left.',
    'Loop terminates with lo == hi at the peak index.',
  ],
  editorial_md: ED(
    'A mountain array is strictly increasing up to a single peak then strictly decreasing. Comparing two adjacent values tells you which side of the peak you\'re on, which is exactly the predicate binary search exploits.',
    'lo = 0, hi = n - 1. While lo < hi compute mid = (lo + hi) // 2. If arr[mid] < arr[mid + 1] the slope at mid is upward, so the peak lies in (mid, hi] — set lo = mid + 1. Else the slope is downward, peak lies in [lo, mid] — set hi = mid. Loop ends with lo == hi at the peak. No equality case needed because adjacent values are strictly different.',
    '- Time: O(log n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[0,1,0]'], expected: '1' },
    { inputs: ['[0,2,1,0]'], expected: '1' },
    { inputs: ['[0,10,5,2]'], expected: '1' },
    { inputs: ['[3,4,5,1]'], expected: '2' },
    { inputs: ['[24,69,100,99,79,78,67,36,26,19]'], expected: '2' },
    { inputs: ['[0,1,2,3,4,5,3,1]'], expected: '5' },
    { inputs: ['[1,2,3,4,5,4,3,2,1]'], expected: '4' },
    { inputs: ['[5,10,5]'], expected: '1' },
    { inputs: ['[1,5]'], expected: '1' },
    { inputs: ['[5,1]'], expected: '0' },
    { inputs: ['[0,2,5,7,4,3,1]'], expected: '3' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def peakIndexInMountainArray(self, arr: List[int]) -> int:
        lo, hi = 0, len(arr) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if arr[mid] < arr[mid + 1]:
                lo = mid + 1
            else:
                hi = mid
        return lo
`,
    javascript: `var peakIndexInMountainArray = function(arr) {
    let lo = 0, hi = arr.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid] < arr[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};
`,
    java: `class Solution {
    public int peakIndexInMountainArray(int[] arr) {
        int lo = 0, hi = arr.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (arr[mid] < arr[mid + 1]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int peakIndexInMountainArray(vector<int>& arr) {
        int lo = 0, hi = (int)arr.size() - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (arr[mid] < arr[mid + 1]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};
`,
  },
});

// ============================================================================
// 61. search-in-rotated-sorted-array-ii
// ============================================================================
P.push({
  id: 'search-in-rotated-sorted-array-ii',
  method_name: 'search',
  params: [
    { name: 'nums', type: 'List[int]' },
    { name: 'target', type: 'int' },
  ],
  return_type: 'bool',
  pattern: 'Binary Search (with duplicates)',
  tags: ['arrays', 'binary-search'],
  hints: [
    'Variant of rotated search where duplicates may appear.',
    'Standard rotated bsearch identifies which half is sorted.',
    'When nums[lo] == nums[mid] == nums[hi], you cannot decide — shrink both ends.',
    'Otherwise normal sorted-half logic applies.',
    'Worst case is O(n) due to the duplicate edge case.',
  ],
  editorial_md: ED(
    'In a rotated sorted array with duplicates, the usual "which half is sorted" trick can fail when nums[lo] equals nums[mid] equals nums[hi]. In that case shrink both sides by one and continue. Otherwise the standard rotated binary search applies.',
    'lo = 0, hi = n - 1. While lo <= hi compute mid. Return true if nums[mid] == target. If nums[lo] == nums[mid] == nums[hi] then lo++, hi-- — we lost information about which side is sorted. Else if nums[lo] <= nums[mid] then the left side [lo..mid] is sorted: if nums[lo] <= target < nums[mid] move hi = mid - 1, else lo = mid + 1. Else the right side [mid..hi] is sorted: if nums[mid] < target <= nums[hi] move lo = mid + 1, else hi = mid - 1. Loop ends with no match → return false. Worst-case time is O(n) because the duplicate-shrink step is linear.',
    '- Time: O(log n) average, O(n) worst.\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[2,5,6,0,0,1,2]', '0'], expected: 'true' },
    { inputs: ['[2,5,6,0,0,1,2]', '3'], expected: 'false' },
    { inputs: ['[1,0,1,1,1]', '0'], expected: 'true' },
    { inputs: ['[1]', '0'], expected: 'false' },
    { inputs: ['[1]', '1'], expected: 'true' },
    { inputs: ['[1,1,1,1,1]', '2'], expected: 'false' },
    { inputs: ['[1,1,1,1,1]', '1'], expected: 'true' },
    { inputs: ['[3,1]', '1'], expected: 'true' },
    { inputs: ['[3,1]', '3'], expected: 'true' },
    { inputs: ['[1,3,5]', '5'], expected: 'true' },
    { inputs: ['[1,3,1,1,1]', '3'], expected: 'true' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def search(self, nums: List[int], target: int) -> bool:
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if nums[mid] == target:
                return True
            if nums[lo] == nums[mid] == nums[hi]:
                lo += 1; hi -= 1
            elif nums[lo] <= nums[mid]:
                if nums[lo] <= target < nums[mid]:
                    hi = mid - 1
                else:
                    lo = mid + 1
            else:
                if nums[mid] < target <= nums[hi]:
                    lo = mid + 1
                else:
                    hi = mid - 1
        return False
`,
    javascript: `var search = function(nums, target) {
    let lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] === target) return true;
        if (nums[lo] === nums[mid] && nums[mid] === nums[hi]) {
            lo++; hi--;
        } else if (nums[lo] <= nums[mid]) {
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return false;
};
`,
    java: `class Solution {
    public boolean search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] == target) return true;
            if (nums[lo] == nums[mid] && nums[mid] == nums[hi]) { lo++; hi--; }
            else if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return false;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    bool search(vector<int>& nums, int target) {
        int lo = 0, hi = (int)nums.size() - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] == target) return true;
            if (nums[lo] == nums[mid] && nums[mid] == nums[hi]) { lo++; hi--; }
            else if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return false;
    }
};
`,
  },
});

// ============================================================================
// 62. wave-form (rearrange so a0 ≤ a1 ≥ a2 ≤ a3 …)
// ============================================================================
P.push({
  id: 'wave-form',
  description: '<p>Given an integer array <code>nums</code>, rearrange it in place into a wave form so that <code>nums[0] ≥ nums[1] ≤ nums[2] ≥ nums[3] ≤ ...</code>. Return the rearranged array.</p>',
  method_name: 'waveSort',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'List[int]',
  pattern: 'Greedy / In-place Swap',
  tags: ['arrays', 'sorting'],
  hints: [
    'For each even index i, if nums[i] < nums[i + 1], swap them.',
    'For each odd index i, if nums[i] > nums[i + 1], swap them.',
    'Equivalent to "even index always at least as large as odd-index neighbours".',
    'Linear time, no sort needed.',
    'Sorted approach also works but is O(n log n).',
  ],
  editorial_md: ED(
    'The wave property only depends on each adjacent pair: at even indices the value must be ≥ both neighbours. Walking the array and fixing each pair locally is sufficient because each fix doesn\'t break any previously satisfied pair.',
    'Walk i from 0 to n - 1. At even i, if i + 1 < n and nums[i] < nums[i + 1], swap. At odd i, if i + 1 < n and nums[i] > nums[i + 1], swap. After this single pass the wave property holds globally. Inductive reason: swapping at index i can only change nums[i] and nums[i + 1]; the relationship at i - 1 and i is still consistent because the new nums[i] (after swap) is at least as extreme in the right direction. The classic sort + swap-pairs approach also works but is O(n log n) versus this O(n).',
    '- Time: O(n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['[1,2,3,4]'], expected: '[2,1,4,3]' },
    { inputs: ['[3,5,2,1,6,4]'], expected: '[5,2,3,1,6,4]' },
    { inputs: ['[1]'], expected: '[1]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[2,1]'], expected: '[2,1]' },
    { inputs: ['[1,2]'], expected: '[2,1]' },
    { inputs: ['[5,5,5]'], expected: '[5,5,5]' },
    { inputs: ['[1,2,3,4,5,6]'], expected: '[2,1,4,3,6,5]' },
    { inputs: ['[6,5,4,3,2,1]'], expected: '[6,4,5,2,3,1]' },
    { inputs: ['[1,1,2,2,3,3]'], expected: '[1,1,2,2,3,3]' },
    { inputs: ['[10,5,6,3,2,20,100,80]'], expected: '[10,5,6,2,20,3,100,80]' },
  ],
  solutions: {
    python: `from typing import List

class Solution:
    def waveSort(self, nums: List[int]) -> List[int]:
        n = len(nums)
        for i in range(n):
            if i % 2 == 0:
                if i + 1 < n and nums[i] < nums[i + 1]:
                    nums[i], nums[i + 1] = nums[i + 1], nums[i]
            else:
                if i + 1 < n and nums[i] > nums[i + 1]:
                    nums[i], nums[i + 1] = nums[i + 1], nums[i]
        return nums
`,
    javascript: `var waveSort = function(nums) {
    const n = nums.length;
    for (let i = 0; i < n; i++) {
        if (i % 2 === 0) {
            if (i + 1 < n && nums[i] < nums[i + 1]) [nums[i], nums[i + 1]] = [nums[i + 1], nums[i]];
        } else {
            if (i + 1 < n && nums[i] > nums[i + 1]) [nums[i], nums[i + 1]] = [nums[i + 1], nums[i]];
        }
    }
    return nums;
};
`,
    java: `class Solution {
    public int[] waveSort(int[] nums) {
        int n = nums.length;
        for (int i = 0; i < n; i++) {
            if (i % 2 == 0) {
                if (i + 1 < n && nums[i] < nums[i + 1]) { int t = nums[i]; nums[i] = nums[i + 1]; nums[i + 1] = t; }
            } else {
                if (i + 1 < n && nums[i] > nums[i + 1]) { int t = nums[i]; nums[i] = nums[i + 1]; nums[i + 1] = t; }
            }
        }
        return nums;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> waveSort(vector<int>& nums) {
        int n = nums.size();
        for (int i = 0; i < n; i++) {
            if (i % 2 == 0) {
                if (i + 1 < n && nums[i] < nums[i + 1]) swap(nums[i], nums[i + 1]);
            } else {
                if (i + 1 < n && nums[i] > nums[i + 1]) swap(nums[i], nums[i + 1]);
            }
        }
        return nums;
    }
};
`,
  },
});

// ============================================================================
// 63. binary-number-with-alternating-bits
// ============================================================================
P.push({
  id: 'binary-number-with-alternating-bits',
  method_name: 'hasAlternatingBits',
  params: [{ name: 'n', type: 'int' }],
  return_type: 'bool',
  pattern: 'Bit Manipulation',
  tags: ['math', 'bit-manipulation'],
  hints: [
    'Compute x = n XOR (n >> 1).',
    'If n has alternating bits, x is all 1\'s (a Mersenne number).',
    'Check (x + 1) & x == 0 to confirm x is of the form 2^k - 1.',
    'Constant time.',
    'Works for any positive n.',
  ],
  editorial_md: ED(
    'Shifting n right by one and XORing aligns each bit with its predecessor. If bits alternate, every position becomes 1 — that is, the result is a string of 1\'s.',
    'Compute x = n ^ (n >> 1). If n is alternating, every pair (b_i, b_{i+1}) differs, so XOR gives 1 at every position, making x = 2^len - 1. The test for "all 1\'s" is `(x & (x + 1)) == 0` because adding 1 to a number of the form 2^k - 1 yields a clean power of two, and the AND with the original gives zero. Constant time, no looping over bits.',
    '- Time: O(1).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['5'], expected: 'true' },
    { inputs: ['7'], expected: 'false' },
    { inputs: ['11'], expected: 'false' },
    { inputs: ['10'], expected: 'true' },
    { inputs: ['1'], expected: 'true' },
    { inputs: ['2'], expected: 'true' },
    { inputs: ['3'], expected: 'false' },
    { inputs: ['4'], expected: 'false' },
    { inputs: ['21'], expected: 'true' },
    { inputs: ['42'], expected: 'true' },
    { inputs: ['170'], expected: 'true' },
  ],
  solutions: {
    python: `class Solution:
    def hasAlternatingBits(self, n: int) -> bool:
        x = n ^ (n >> 1)
        return (x & (x + 1)) == 0
`,
    javascript: `var hasAlternatingBits = function(n) {
    const x = n ^ (n >> 1);
    return (x & (x + 1)) === 0;
};
`,
    java: `class Solution {
    public boolean hasAlternatingBits(int n) {
        int x = n ^ (n >> 1);
        return (x & (x + 1)) == 0;
    }
}
`,
    cpp: `class Solution {
public:
    bool hasAlternatingBits(int n) {
        long x = n ^ (n >> 1);
        return (x & (x + 1)) == 0;
    }
};
`,
  },
});

// ============================================================================
// 64. minimum-flips-to-make-a-or-b-equal-to-c
// ============================================================================
P.push({
  id: 'minimum-flips-to-make-a-or-b-equal-to-c',
  method_name: 'minFlips',
  params: [
    { name: 'a', type: 'int' },
    { name: 'b', type: 'int' },
    { name: 'c', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Bit Manipulation',
  tags: ['bit-manipulation'],
  hints: [
    'For each bit position consider c\'s bit value.',
    'If c\'s bit is 1: need at least one of a, b to be 1 — costs 0 if either is, else 1 flip.',
    'If c\'s bit is 0: both must be 0 — flips = (a bit) + (b bit).',
    'Iterate through all 32 (or 64) bits.',
    'Constant time per bit.',
  ],
  editorial_md: ED(
    'Each bit position is independent: the final (a | b) bit must match c\'s bit, and we can flip individual bits of a or b. Per bit, count the minimum flips locally.',
    'Iterate bit i from 0 to 31. Let ai = (a >> i) & 1, bi = (b >> i) & 1, ci = (c >> i) & 1. If ci == 1: cost is 1 iff both ai and bi are 0 (one of them needs a flip), else 0. If ci == 0: cost is ai + bi — every 1 in either operand needs to be flipped. Sum the per-bit costs. Total runtime is constant since the bit count is fixed by the integer width.',
    '- Time: O(1) (over 32 bits).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['2', '6', '5'], expected: '3' },
    { inputs: ['4', '2', '7'], expected: '1' },
    { inputs: ['1', '2', '3'], expected: '0' },
    { inputs: ['0', '0', '0'], expected: '0' },
    { inputs: ['8', '3', '5'], expected: '3' },
    { inputs: ['1', '1', '0'], expected: '2' },
    { inputs: ['0', '0', '1'], expected: '1' },
    { inputs: ['7', '7', '7'], expected: '0' },
    { inputs: ['15', '15', '0'], expected: '8' },
    { inputs: ['10', '5', '15'], expected: '0' },
    { inputs: ['1', '2', '0'], expected: '2' },
  ],
  solutions: {
    python: `class Solution:
    def minFlips(self, a: int, b: int, c: int) -> int:
        flips = 0
        for i in range(32):
            ai = (a >> i) & 1
            bi = (b >> i) & 1
            ci = (c >> i) & 1
            if ci == 1:
                if ai == 0 and bi == 0:
                    flips += 1
            else:
                flips += ai + bi
        return flips
`,
    javascript: `var minFlips = function(a, b, c) {
    let flips = 0;
    for (let i = 0; i < 32; i++) {
        const ai = (a >> i) & 1, bi = (b >> i) & 1, ci = (c >> i) & 1;
        if (ci === 1) { if (ai === 0 && bi === 0) flips++; }
        else flips += ai + bi;
    }
    return flips;
};
`,
    java: `class Solution {
    public int minFlips(int a, int b, int c) {
        int flips = 0;
        for (int i = 0; i < 32; i++) {
            int ai = (a >> i) & 1, bi = (b >> i) & 1, ci = (c >> i) & 1;
            if (ci == 1) { if (ai == 0 && bi == 0) flips++; }
            else flips += ai + bi;
        }
        return flips;
    }
}
`,
    cpp: `class Solution {
public:
    int minFlips(int a, int b, int c) {
        int flips = 0;
        for (int i = 0; i < 32; i++) {
            int ai = (a >> i) & 1, bi = (b >> i) & 1, ci = (c >> i) & 1;
            if (ci == 1) { if (ai == 0 && bi == 0) flips++; }
            else flips += ai + bi;
        }
        return flips;
    }
};
`,
  },
});

// ============================================================================
// 65. stream-of-characters
// ============================================================================
P.push({
  id: 'stream-of-characters',
  method_name: 'streamChecker',
  params: [
    { name: 'words', type: 'List[str]' },
    { name: 'queries', type: 'List[str]' },
  ],
  return_type: 'List[bool]',
  pattern: 'Trie (reversed)',
  tags: ['trie', 'strings'],
  hints: [
    'Insert each word reversed into a trie.',
    'Maintain a buffer of characters seen so far (or just walk the trie from the latest).',
    'On query: walk the trie from the most recent character backwards; if you hit an end-of-word node return true.',
    'O(L) per query where L is the max word length.',
    'Limit buffer size to the longest word for memory.',
  ],
  editorial_md: ED(
    'The query asks "does any suffix of the stream match a dictionary word?" — equivalent to "starting from the most recent character and walking backward, do we hit an end-of-word node?" That suggests a trie built from reversed words.',
    'Insert each word reversed into a trie, marking the last node as end-of-word. Maintain a buffer holding the stream so far, capped at the longest word length (older characters cannot start a match). For each query character, append to the buffer, then walk the trie from the most recent character backward: descend with the character at buffer[i], i decreasing. If we hit an end-of-word node at any point, the query returns true. If we fall off the trie or run out of buffer, return false. Each query is O(max word length).',
    '- Build: O(total chars in words).\n- Query: O(L) per query.\n- Space: O(total chars).'
  ),
  test_cases: [
    { inputs: ['["cd","f","kl"]', '["a","b","c","d","e","f","g","h","i","j","k","l"]'], expected: '[false,false,false,true,false,true,false,false,false,false,false,true]' },
    { inputs: ['["ab"]', '["a","b","a","b"]'], expected: '[false,true,false,true]' },
    { inputs: ['["a"]', '["a"]'], expected: '[true]' },
    { inputs: ['["ab","ba"]', '["a","b","a"]'], expected: '[false,true,true]' },
    { inputs: ['["hello"]', '["h","e","l","l","o"]'], expected: '[false,false,false,false,true]' },
    { inputs: ['["abc"]', '["a","b","c","d"]'], expected: '[false,false,true,false]' },
    { inputs: ['["xy"]', '["x","y","z"]'], expected: '[false,true,false]' },
    { inputs: ['["a","b"]', '["c","b","a"]'], expected: '[false,true,true]' },
    { inputs: ['["abcd"]', '["a","b","c","d"]'], expected: '[false,false,false,true]' },
    { inputs: ['["xx"]', '["x","x","x","x"]'], expected: '[false,true,true,true]' },
    { inputs: ['["a"]', '["b","b","a"]'], expected: '[false,false,true]' },
  ],
  solutions: {
    python: `from typing import List

class _Node:
    __slots__ = ('children', 'end')
    def __init__(self):
        self.children = {}
        self.end = False

class Solution:
    def streamChecker(self, words: List[str], queries: List[str]) -> List[bool]:
        root = _Node()
        max_len = 0
        for w in words:
            node = root
            for c in reversed(w):
                node = node.children.setdefault(c, _Node())
            node.end = True
            if len(w) > max_len: max_len = len(w)
        buf: List[str] = []
        out: List[bool] = []
        for q in queries:
            buf.append(q)
            if len(buf) > max_len:
                buf.pop(0)
            node = root
            ok = False
            for i in range(len(buf) - 1, -1, -1):
                ch = buf[i]
                if ch not in node.children:
                    break
                node = node.children[ch]
                if node.end:
                    ok = True
                    break
            out.append(ok)
        return out
`,
    javascript: `var streamChecker = function(words, queries) {
    const root = { children: new Map(), end: false };
    let maxLen = 0;
    for (const w of words) {
        let node = root;
        for (let i = w.length - 1; i >= 0; i--) {
            const c = w[i];
            if (!node.children.has(c)) node.children.set(c, { children: new Map(), end: false });
            node = node.children.get(c);
        }
        node.end = true;
        if (w.length > maxLen) maxLen = w.length;
    }
    const buf = [];
    const out = [];
    for (const q of queries) {
        buf.push(q);
        if (buf.length > maxLen) buf.shift();
        let node = root;
        let ok = false;
        for (let i = buf.length - 1; i >= 0; i--) {
            const c = buf[i];
            if (!node.children.has(c)) break;
            node = node.children.get(c);
            if (node.end) { ok = true; break; }
        }
        out.push(ok);
    }
    return out;
};
`,
    java: `import java.util.*;

class Solution {
    static class Node {
        Map<Character, Node> children = new HashMap<>();
        boolean end = false;
    }
    public List<Boolean> streamChecker(List<String> words, List<String> queries) {
        Node root = new Node();
        int maxLen = 0;
        for (String w : words) {
            Node node = root;
            for (int i = w.length() - 1; i >= 0; i--) {
                char c = w.charAt(i);
                node = node.children.computeIfAbsent(c, k -> new Node());
            }
            node.end = true;
            if (w.length() > maxLen) maxLen = w.length();
        }
        Deque<Character> buf = new ArrayDeque<>();
        List<Boolean> out = new ArrayList<>();
        for (String q : queries) {
            buf.addLast(q.charAt(0));
            if (buf.size() > maxLen) buf.pollFirst();
            Node node = root;
            boolean ok = false;
            Character[] arr = buf.toArray(new Character[0]);
            for (int i = arr.length - 1; i >= 0; i--) {
                char c = arr[i];
                if (!node.children.containsKey(c)) break;
                node = node.children.get(c);
                if (node.end) { ok = true; break; }
            }
            out.add(ok);
        }
        return out;
    }
}
`,
    cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <deque>
using namespace std;

struct Node {
    unordered_map<char, Node*> children;
    bool end = false;
};

class Solution {
public:
    vector<bool> streamChecker(vector<string>& words, vector<string>& queries) {
        Node* root = new Node();
        int maxLen = 0;
        for (auto& w : words) {
            Node* node = root;
            for (int i = (int)w.size() - 1; i >= 0; i--) {
                char c = w[i];
                if (!node->children.count(c)) node->children[c] = new Node();
                node = node->children[c];
            }
            node->end = true;
            if ((int)w.size() > maxLen) maxLen = w.size();
        }
        deque<char> buf;
        vector<bool> out;
        for (auto& q : queries) {
            buf.push_back(q[0]);
            if ((int)buf.size() > maxLen) buf.pop_front();
            Node* node = root;
            bool ok = false;
            for (int i = (int)buf.size() - 1; i >= 0; i--) {
                char c = buf[i];
                if (!node->children.count(c)) break;
                node = node->children[c];
                if (node->end) { ok = true; break; }
            }
            out.push_back(ok);
        }
        return out;
    }
};
`,
  },
});

// ============================================================================
// 66. add-digits
// ============================================================================
P.push({
  id: 'add-digits',
  method_name: 'addDigits',
  params: [{ name: 'num', type: 'int' }],
  return_type: 'int',
  pattern: 'Math (Digital Root)',
  tags: ['math'],
  hints: [
    'Digital root has closed form: 1 + (num - 1) mod 9 when num > 0; 0 when num == 0.',
    'Equivalently num mod 9, with 0 → 0 and 9 → 9.',
    'No loop needed.',
    'Iterative version sums digits until single digit (works too).',
    'O(1) time with the formula.',
  ],
  editorial_md: ED(
    'Repeatedly summing digits gives the digital root. There is a closed-form: digital_root(n) = 1 + (n - 1) mod 9 for n > 0; equals 0 for n = 0. This comes from the fact that n ≡ sum_of_digits(n) mod 9.',
    'For num == 0 return 0. Otherwise return 1 + (num - 1) % 9. This handles the case where num is a positive multiple of 9 (returns 9) cleanly. The naive iterative version repeatedly sums digits and replaces num until it falls below 10 — runs in O(log num) per pass and log* iterations total, but the closed form is just one modulo operation.',
    '- Time: O(1) with the formula.\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['38'], expected: '2' },
    { inputs: ['0'], expected: '0' },
    { inputs: ['9'], expected: '9' },
    { inputs: ['18'], expected: '9' },
    { inputs: ['1'], expected: '1' },
    { inputs: ['10'], expected: '1' },
    { inputs: ['100'], expected: '1' },
    { inputs: ['999'], expected: '9' },
    { inputs: ['12345'], expected: '6' },
    { inputs: ['1000000000'], expected: '1' },
    { inputs: ['11'], expected: '2' },
  ],
  solutions: {
    python: `class Solution:
    def addDigits(self, num: int) -> int:
        if num == 0: return 0
        return 1 + (num - 1) % 9
`,
    javascript: `var addDigits = function(num) {
    if (num === 0) return 0;
    return 1 + (num - 1) % 9;
};
`,
    java: `class Solution {
    public int addDigits(int num) {
        if (num == 0) return 0;
        return 1 + (num - 1) % 9;
    }
}
`,
    cpp: `class Solution {
public:
    int addDigits(int num) {
        if (num == 0) return 0;
        return 1 + (num - 1) % 9;
    }
};
`,
  },
});

// ============================================================================
// 67. base-7
// ============================================================================
P.push({
  id: 'base-7',
  method_name: 'convertToBase7',
  params: [{ name: 'num', type: 'int' }],
  return_type: 'str',
  pattern: 'Math (Base Conversion)',
  tags: ['math'],
  hints: [
    'Handle sign separately.',
    'Repeatedly divide by 7, collect remainders.',
    'Reverse the digits to form the string.',
    'Edge case: num == 0 → "0".',
    'O(log_7 |num|) time.',
  ],
  editorial_md: ED(
    'Base conversion is the same trick at any base: repeatedly divide by the base and the remainders give the digits in reverse order. Handle negatives by recording the sign and operating on the absolute value.',
    'If num == 0 return "0". Remember the sign, take n = |num|. Build digits by repeatedly appending n % 7 and dividing n //= 7 until n is zero. Reverse the digit list, join as a string, prepend "-" if negative. The loop runs about log_7 |num| iterations. Standard `to_string`-style template — substitute any base and this is exactly the conversion.',
    '- Time: O(log_7 |num|).\n- Space: O(log_7 |num|) for the digit buffer.'
  ),
  test_cases: [
    { inputs: ['100'], expected: '"202"' },
    { inputs: ['-7'], expected: '"-10"' },
    { inputs: ['0'], expected: '"0"' },
    { inputs: ['1'], expected: '"1"' },
    { inputs: ['6'], expected: '"6"' },
    { inputs: ['7'], expected: '"10"' },
    { inputs: ['49'], expected: '"100"' },
    { inputs: ['-100'], expected: '"-202"' },
    { inputs: ['-1'], expected: '"-1"' },
    { inputs: ['2147483647'], expected: '"104134211161"' },
    { inputs: ['50'], expected: '"101"' },
  ],
  solutions: {
    python: `class Solution:
    def convertToBase7(self, num: int) -> str:
        if num == 0: return "0"
        neg = num < 0
        n = abs(num)
        digits = []
        while n:
            digits.append(str(n % 7))
            n //= 7
        return ('-' if neg else '') + ''.join(reversed(digits))
`,
    javascript: `var convertToBase7 = function(num) {
    if (num === 0) return "0";
    const neg = num < 0;
    let n = Math.abs(num);
    const out = [];
    while (n) { out.push((n % 7).toString()); n = Math.floor(n / 7); }
    return (neg ? '-' : '') + out.reverse().join('');
};
`,
    java: `class Solution {
    public String convertToBase7(int num) {
        if (num == 0) return "0";
        boolean neg = num < 0;
        long n = Math.abs((long) num);
        StringBuilder sb = new StringBuilder();
        while (n > 0) { sb.append(n % 7); n /= 7; }
        if (neg) sb.append('-');
        return sb.reverse().toString();
    }
}
`,
    cpp: `#include <string>
#include <algorithm>
#include <cstdlib>
using namespace std;

class Solution {
public:
    string convertToBase7(int num) {
        if (num == 0) return "0";
        bool neg = num < 0;
        long n = abs((long) num);
        string s;
        while (n > 0) { s += char('0' + n % 7); n /= 7; }
        if (neg) s += '-';
        reverse(s.begin(), s.end());
        return s;
    }
};
`,
  },
});

// ============================================================================
// 68. ugly-number (only prime factors 2, 3, 5)
// ============================================================================
P.push({
  id: 'ugly-number',
  method_name: 'isUgly',
  params: [{ name: 'n', type: 'int' }],
  return_type: 'bool',
  pattern: 'Math',
  tags: ['math'],
  hints: [
    'Ugly numbers are positive integers whose prime factors are only 2, 3, 5.',
    'Divide n by 2 while divisible, then by 3, then by 5.',
    'If the result is 1, all factors were in {2, 3, 5} — return true.',
    'Otherwise return false.',
    'Reject n ≤ 0 immediately (must be positive).',
  ],
  editorial_md: ED(
    'An ugly number\'s prime factorisation uses only 2, 3, 5. Stripping every factor of 2, 3, 5 from n leaves either 1 (everything was in those primes) or a residue > 1 (there\'s a forbidden prime factor).',
    'If n ≤ 0 return false — ugly numbers are positive. Loop through divisors 2, 3, 5. For each p, while n % p == 0 set n //= p. After the loop check whether n is 1: if yes the number was composed entirely of allowed primes; if no there\'s a residue (some prime ≥ 7 contributing). Constant-time per division step; total runtime O(log n).',
    '- Time: O(log n).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['6'], expected: 'true' },
    { inputs: ['1'], expected: 'true' },
    { inputs: ['14'], expected: 'false' },
    { inputs: ['0'], expected: 'false' },
    { inputs: ['-6'], expected: 'false' },
    { inputs: ['8'], expected: 'true' },
    { inputs: ['9'], expected: 'true' },
    { inputs: ['25'], expected: 'true' },
    { inputs: ['30'], expected: 'true' },
    { inputs: ['7'], expected: 'false' },
    { inputs: ['1000000'], expected: 'true' },
  ],
  solutions: {
    python: `class Solution:
    def isUgly(self, n: int) -> bool:
        if n <= 0: return False
        for p in (2, 3, 5):
            while n % p == 0:
                n //= p
        return n == 1
`,
    javascript: `var isUgly = function(n) {
    if (n <= 0) return false;
    for (const p of [2, 3, 5]) while (n % p === 0) n /= p;
    return n === 1;
};
`,
    java: `class Solution {
    public boolean isUgly(int n) {
        if (n <= 0) return false;
        for (int p : new int[]{2, 3, 5}) while (n % p == 0) n /= p;
        return n == 1;
    }
}
`,
    cpp: `class Solution {
public:
    bool isUgly(int n) {
        if (n <= 0) return false;
        for (int p : {2, 3, 5}) while (n % p == 0) n /= p;
        return n == 1;
    }
};
`,
  },
});

// ============================================================================
// 69. angle-between-hands
// ============================================================================
P.push({
  id: 'angle-between-hands',
  method_name: 'angleClock',
  params: [
    { name: 'hour', type: 'int' },
    { name: 'minutes', type: 'int' },
  ],
  return_type: 'float',
  pattern: 'Math',
  tags: ['math'],
  hints: [
    'Minute hand: minutes × 6 degrees (one minute = 6°).',
    'Hour hand: (hour mod 12) × 30 + minutes × 0.5 degrees.',
    'Take absolute difference, then min(diff, 360 - diff) for the smaller angle.',
    'Watch the hour-12 case — use hour % 12.',
    'Constant time.',
  ],
  editorial_md: ED(
    'The two clock hands sit at specific angular positions: 360°/60 = 6° per minute for the minute hand; 360°/12 = 30° per hour plus 0.5° per minute for the hour hand. The smaller angle between them is the answer.',
    'min_angle = minutes * 6.0. hour_angle = (hour % 12) * 30.0 + minutes * 0.5 — the hour hand advances continuously as minutes tick. Compute diff = |hour_angle - min_angle|; the smaller of the two arcs is min(diff, 360 - diff). Return that. Constant time. Floats handle the half-degree contribution cleanly.',
    '- Time: O(1).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['12', '30'], expected: '165.0' },
    { inputs: ['3', '30'], expected: '75.0' },
    { inputs: ['3', '15'], expected: '7.5' },
    { inputs: ['4', '50'], expected: '155.0' },
    { inputs: ['12', '0'], expected: '0.0' },
    { inputs: ['6', '0'], expected: '180.0' },
    { inputs: ['1', '57'], expected: '76.5' },
    { inputs: ['9', '0'], expected: '90.0' },
    { inputs: ['12', '6'], expected: '33.0' },
    { inputs: ['1', '0'], expected: '30.0' },
    { inputs: ['11', '59'], expected: '5.5' },
  ],
  solutions: {
    python: `class Solution:
    def angleClock(self, hour: int, minutes: int) -> float:
        min_angle = minutes * 6.0
        hour_angle = (hour % 12) * 30.0 + minutes * 0.5
        diff = abs(hour_angle - min_angle)
        return min(diff, 360.0 - diff)
`,
    javascript: `var angleClock = function(hour, minutes) {
    const minA = minutes * 6.0;
    const hourA = (hour % 12) * 30.0 + minutes * 0.5;
    const diff = Math.abs(hourA - minA);
    return Math.min(diff, 360 - diff);
};
`,
    java: `class Solution {
    public double angleClock(int hour, int minutes) {
        double minA = minutes * 6.0;
        double hourA = (hour % 12) * 30.0 + minutes * 0.5;
        double diff = Math.abs(hourA - minA);
        return Math.min(diff, 360 - diff);
    }
}
`,
    cpp: `#include <cmath>
#include <algorithm>
using namespace std;

class Solution {
public:
    double angleClock(int hour, int minutes) {
        double minA = minutes * 6.0;
        double hourA = (hour % 12) * 30.0 + minutes * 0.5;
        double diff = fabs(hourA - minA);
        return min(diff, 360.0 - diff);
    }
};
`,
  },
});

// ============================================================================
// 70. water-and-jug (capable of measuring 'target' liters)
// ============================================================================
P.push({
  id: 'water-and-jug',
  method_name: 'canMeasureWater',
  params: [
    { name: 'jug1Capacity', type: 'int' },
    { name: 'jug2Capacity', type: 'int' },
    { name: 'targetCapacity', type: 'int' },
  ],
  return_type: 'bool',
  pattern: 'Math (Bezout)',
  tags: ['math', 'number-theory'],
  hints: [
    'Linear combinations a·x + b·y are multiples of gcd(x, y).',
    'You can measure target iff target is a multiple of gcd(x, y).',
    'Also need target ≤ x + y.',
    'Special case: target == 0 is trivially true.',
    'gcd by Euclid.',
  ],
  editorial_md: ED(
    'Operations on the two jugs always result in volumes that are integer linear combinations of their capacities. Bezout\'s identity says those combinations span exactly the multiples of gcd(x, y), bounded by x + y.',
    'Edge case: if target is 0 return true. If target > x + y return false (cannot hold more than both jugs together). Otherwise return whether target is a multiple of gcd(x, y). gcd is computed with the Euclidean algorithm in O(log(min(x, y))). The proof: every reachable state of the two jugs is some ax + by combination; by Bezout that ranges over multiples of g = gcd(x, y); and any such combination ≤ x + y can actually be reached by a sequence of fill / empty / pour ops.',
    '- Time: O(log(min(x, y))).\n- Space: O(1).'
  ),
  test_cases: [
    { inputs: ['3', '5', '4'], expected: 'true' },
    { inputs: ['2', '6', '5'], expected: 'false' },
    { inputs: ['1', '2', '3'], expected: 'true' },
    { inputs: ['0', '0', '0'], expected: 'true' },
    { inputs: ['0', '5', '5'], expected: 'true' },
    { inputs: ['0', '5', '4'], expected: 'false' },
    { inputs: ['5', '5', '10'], expected: 'true' },
    { inputs: ['5', '5', '6'], expected: 'false' },
    { inputs: ['1', '1', '1'], expected: 'true' },
    { inputs: ['34', '5', '6'], expected: 'true' },
    { inputs: ['7', '11', '13'], expected: 'true' },
  ],
  solutions: {
    python: `from math import gcd

class Solution:
    def canMeasureWater(self, jug1Capacity: int, jug2Capacity: int, targetCapacity: int) -> bool:
        if targetCapacity == 0: return True
        if targetCapacity > jug1Capacity + jug2Capacity: return False
        g = gcd(jug1Capacity, jug2Capacity)
        if g == 0: return False
        return targetCapacity % g == 0
`,
    javascript: `var canMeasureWater = function(jug1Capacity, jug2Capacity, targetCapacity) {
    if (targetCapacity === 0) return true;
    if (targetCapacity > jug1Capacity + jug2Capacity) return false;
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const g = gcd(jug1Capacity, jug2Capacity);
    if (g === 0) return false;
    return targetCapacity % g === 0;
};
`,
    java: `class Solution {
    public boolean canMeasureWater(int jug1Capacity, int jug2Capacity, int targetCapacity) {
        if (targetCapacity == 0) return true;
        if ((long) targetCapacity > (long) jug1Capacity + jug2Capacity) return false;
        int g = gcd(jug1Capacity, jug2Capacity);
        if (g == 0) return false;
        return targetCapacity % g == 0;
    }
    private int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }
}
`,
    cpp: `class Solution {
public:
    bool canMeasureWater(int jug1Capacity, int jug2Capacity, int targetCapacity) {
        if (targetCapacity == 0) return true;
        if ((long long) targetCapacity > (long long) jug1Capacity + jug2Capacity) return false;
        int g = gcd(jug1Capacity, jug2Capacity);
        if (g == 0) return false;
        return targetCapacity % g == 0;
    }
private:
    int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }
};
`,
  },
});

fs.writeFileSync('/tmp/patch-500-01.partial.json', JSON.stringify(P, null, 2));
console.log('partial saved with', P.length, 'entries');
