#!/usr/bin/env node
import fs from 'node:fs';

const problems = [];

// 1. Buy and Sell – Max 2 Transactions Allowed (LC 123)
problems.push({
  id: 'buy-and-sell-max-2-transactions-allowed',
  description: '<p>Given an array <code>prices</code> where <code>prices[i]</code> is the stock price on day <code>i</code>, find the maximum profit achievable with at most <strong>two non-overlapping transactions</strong>. You must sell before buying again.</p><p><strong>Example:</strong></p><pre>Input: prices = [3,3,5,0,0,3,1,4]\nOutput: 6\nExplanation: Buy on day 4 (price=0), sell on day 6 (price=3), profit=3. Then buy on day 7 (price=1) and sell on day 8 (price=4), profit=3. Total = 6.</pre><p><strong>Constraints:</strong> 1 &le; prices.length &le; 10^5, 0 &le; prices[i] &le; 10^5.</p>',
  method_name: 'maxProfit',
  params: [{ name: 'prices', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Dynamic Programming',
  tags: ['dp', 'arrays', 'stock'],
  hints: [
    'Track four states: cost of first buy, profit after first sell, cost of second buy, profit after second sell.',
    'For each price, update: buy1 = min(buy1, price); sell1 = max(sell1, price - buy1); buy2 = min(buy2, price - sell1); sell2 = max(sell2, price - buy2).',
    'The buy2 cost is offset by sell1 profit to chain the transactions.',
    'Return sell2 which is the maximum profit from at most 2 transactions.',
    'Time O(n), space O(1).',
  ],
  test_cases: [
    { inputs: ['[3,3,5,0,0,3,1,4]'], expected: '6' },
    { inputs: ['[1,2,3,4,5]'], expected: '4' },
    { inputs: ['[7,6,4,3,1]'], expected: '0' },
    { inputs: ['[1]'], expected: '0' },
    { inputs: ['[2,1,2,0,1]'], expected: '2' },
    { inputs: ['[6,1,3,2,4,7]'], expected: '7' },
    { inputs: ['[1,2]'], expected: '1' },
    { inputs: ['[5,4,3,2,1]'], expected: '0' },
    { inputs: ['[1,4,2,7]'], expected: '8' },
    { inputs: ['[10,22,5,75,65,80]'], expected: '87' },
    { inputs: ['[0,0,0,0]'], expected: '0' },
    { inputs: ['[3,2,6,5,0,3]'], expected: '7' },
  ],
  editorial_md: `## Intuition
At most two transactions means we are looking for two non-overlapping price intervals whose summed profit is maximal. The brute force tries every split day where the first transaction ends and the second begins. We can collapse this into one pass by maintaining four rolling states.

## Approach
Track four scalars as we sweep prices left to right:
- buy1: minimum cost paid so far for the first stock
- sell1: best profit achievable from one completed transaction up to today
- buy2: effective cost of buying the second stock — current price minus profit already banked from the first transaction
- sell2: best profit from up to two transactions completed by today

For every price p we update in order:
\`buy1 = min(buy1, p)\`, \`sell1 = max(sell1, p - buy1)\`, \`buy2 = min(buy2, p - sell1)\`, \`sell2 = max(sell2, p - buy2)\`. Updating in this order is sound because each later state references an already-updated earlier one, which is exactly the relaxation we want.

## Complexity
Time O(n) — one pass. Space O(1) — four scalar accumulators. This beats the O(n) left/right max profit array approach in constants while remaining just as simple to reason about. The state-machine view also generalises to k transactions via DP on (day, transactionsUsed, holding).`,
  solutions: {
    python: `class Solution:
    def maxProfit(self, prices):
        buy1 = buy2 = float('inf')
        sell1 = sell2 = 0
        for p in prices:
            buy1 = min(buy1, p)
            sell1 = max(sell1, p - buy1)
            buy2 = min(buy2, p - sell1)
            sell2 = max(sell2, p - buy2)
        return sell2`,
    javascript: `var maxProfit = function(prices) {
    let buy1 = Infinity, buy2 = Infinity, sell1 = 0, sell2 = 0;
    for (const p of prices) {
        buy1 = Math.min(buy1, p);
        sell1 = Math.max(sell1, p - buy1);
        buy2 = Math.min(buy2, p - sell1);
        sell2 = Math.max(sell2, p - buy2);
    }
    return sell2;
};`,
    java: `class Solution {
    public int maxProfit(int[] prices) {
        int buy1 = Integer.MAX_VALUE, buy2 = Integer.MAX_VALUE;
        int sell1 = 0, sell2 = 0;
        for (int p : prices) {
            buy1 = Math.min(buy1, p);
            sell1 = Math.max(sell1, p - buy1);
            buy2 = Math.min(buy2, p - sell1);
            sell2 = Math.max(sell2, p - buy2);
        }
        return sell2;
    }
}`,
    cpp: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int buy1 = INT_MAX, buy2 = INT_MAX, sell1 = 0, sell2 = 0;
        for (int p : prices) {
            buy1 = min(buy1, p);
            sell1 = max(sell1, p - buy1);
            buy2 = min(buy2, p - sell1);
            sell2 = max(sell2, p - buy2);
        }
        return sell2;
    }
};`,
  },
});

// 2. Buy and Sell with Transaction Fee (LC 714)
problems.push({
  id: 'buy-and-sell-with-transaction-fee',
  description: '<p>Given an array <code>prices</code> and an integer <code>fee</code>, find the maximum profit. You may do unlimited transactions, but each sale costs <code>fee</code>. You cannot hold more than one share at a time.</p><p><strong>Example:</strong></p><pre>Input: prices = [1,3,2,8,4,9], fee = 2\nOutput: 8\nExplanation: Buy at 1, sell at 8 (profit 5), buy at 4, sell at 9 (profit 3). Total 8.</pre>',
  method_name: 'maxProfit',
  params: [{ name: 'prices', type: 'List[int]' }, { name: 'fee', type: 'int' }],
  return_type: 'int',
  pattern: 'Dynamic Programming',
  tags: ['dp', 'arrays', 'greedy'],
  hints: [
    'Maintain two states: cash (profit when not holding) and hold (profit when holding a share).',
    'Transitions: cash = max(cash, hold + price - fee); hold = max(hold, cash - price).',
    'Initialize cash = 0, hold = -prices[0].',
    'Apply the fee on selling so each completed trade pays exactly one fee.',
    'Answer is the final cash value — never sell to a hold state at the end.',
  ],
  test_cases: [
    { inputs: ['[1,3,2,8,4,9]', '2'], expected: '8' },
    { inputs: ['[1,3,7,5,10,3]', '3'], expected: '6' },
    { inputs: ['[1,2,3,4,5]', '1'], expected: '3' },
    { inputs: ['[5,4,3,2,1]', '1'], expected: '0' },
    { inputs: ['[1]', '2'], expected: '0' },
    { inputs: ['[2,1,4,4,2,3,2,5,1,2]', '1'], expected: '4' },
    { inputs: ['[9,8,7,1,2]', '3'], expected: '0' },
    { inputs: ['[4,5,2,4,3,3,1,2,5,4]', '1'], expected: '4' },
    { inputs: ['[1,4,6,2,8,3,10,14]', '3'], expected: '13' },
    { inputs: ['[1,1,1,1,1]', '0'], expected: '0' },
    { inputs: ['[10,11,12,13,14,15]', '5'], expected: '0' },
    { inputs: ['[1,10,1,10,1,10]', '2'], expected: '21' },
  ],
  editorial_md: `## Intuition
At each day you are in one of two situations: holding a share or not. The profit you can have from day i onwards depends only on which situation you are in, so two rolling scalars capture everything.

## Approach
Let cash be the maximum profit when not holding a share at end of day, hold the maximum profit when holding one. The transitions are:
- cash = max(cash, hold + price - fee) — either stay in cash, or sell today and pay the fee
- hold = max(hold, cash - price) — either keep holding, or buy today

Order matters but both choices are safe because we are not double counting: holding excludes the day-i sell action. Initialize cash = 0 and hold = -prices[0]. After scanning all days, the answer is cash because finishing while still holding always wastes the unsold share.

Charging the fee on sell rather than on buy keeps the bookkeeping simple — every completed trade pays exactly one fee. The pattern is the canonical buy-sell DP where the inner loop is O(1), so the whole algorithm is one linear sweep.

## Complexity
Time O(n) where n is the number of days. Space O(1) since only two integers are tracked. This works for any fee value, including 0 which degenerates to the classic unlimited-transactions problem.`,
  solutions: {
    python: `class Solution:
    def maxProfit(self, prices, fee):
        if not prices: return 0
        cash, hold = 0, -prices[0]
        for p in prices[1:]:
            cash = max(cash, hold + p - fee)
            hold = max(hold, cash - p)
        return cash`,
    javascript: `var maxProfit = function(prices, fee) {
    if (!prices.length) return 0;
    let cash = 0, hold = -prices[0];
    for (let i = 1; i < prices.length; i++) {
        const p = prices[i];
        cash = Math.max(cash, hold + p - fee);
        hold = Math.max(hold, cash - p);
    }
    return cash;
};`,
    java: `class Solution {
    public int maxProfit(int[] prices, int fee) {
        if (prices.length == 0) return 0;
        int cash = 0, hold = -prices[0];
        for (int i = 1; i < prices.length; i++) {
            int p = prices[i];
            cash = Math.max(cash, hold + p - fee);
            hold = Math.max(hold, cash - p);
        }
        return cash;
    }
}`,
    cpp: `class Solution {
public:
    int maxProfit(vector<int>& prices, int fee) {
        if (prices.empty()) return 0;
        int cash = 0, hold = -prices[0];
        for (size_t i = 1; i < prices.size(); i++) {
            int p = prices[i];
            cash = max(cash, hold + p - fee);
            hold = max(hold, cash - p);
        }
        return cash;
    }
};`,
  },
});

// 3. Count of distinct substrings
problems.push({
  id: 'count-of-distinct-substrings',
  description: '<p>Given a string <code>s</code>, count the number of distinct non-empty substrings of <code>s</code>.</p><p><strong>Example:</strong></p><pre>Input: s = "abc"\nOutput: 6\nExplanation: "a","b","c","ab","bc","abc" — 6 distinct substrings.</pre><p><strong>Constraints:</strong> 1 &le; |s| &le; 1000, lowercase letters.</p>',
  method_name: 'countDistinctSubstrings',
  params: [{ name: 's', type: 'str' }],
  return_type: 'int',
  pattern: 'Strings / Trie',
  topic_id: 'strings',
  tags: ['strings', 'trie', 'hashing'],
  hints: [
    'Brute force: enumerate all O(n^2) substrings into a hash set, then return its size.',
    'Insertion into a Python set / Java HashSet is amortised O(L) per substring of length L.',
    'A trie over all suffixes counts distinct substrings as the number of trie edges.',
    'Suffix array + LCP gives the optimal O(n log n) count for very long strings.',
    'For |s| up to ~10^3 the hash-set approach is the simplest correct answer.',
  ],
  test_cases: [
    { inputs: ['"abc"'], expected: '6' },
    { inputs: ['"aaa"'], expected: '3' },
    { inputs: ['"abab"'], expected: '7' },
    { inputs: ['"a"'], expected: '1' },
    { inputs: ['"ab"'], expected: '3' },
    { inputs: ['"abcd"'], expected: '10' },
    { inputs: ['"aaaa"'], expected: '4' },
    { inputs: ['"abcabc"'], expected: '15' },
    { inputs: ['"banana"'], expected: '15' },
    { inputs: ['"mississippi"'], expected: '53' },
    { inputs: ['"hello"'], expected: '14' },
    { inputs: ['"abacabad"'], expected: '32' },
  ],
  editorial_md: `## Intuition
A substring is uniquely determined by its starting index and ending index. There are O(n^2) such pairs but many may produce the same string ("ab" appearing in two places counts once). We need to count unique strings, so a deduplication structure is required.

## Approach
The clean baseline iterates over every (i, j) pair, builds the substring s[i..j], and inserts into a hash set. After the double loop, the set's size is the answer. This is O(n^3) due to per-substring hashing, but in practice for n up to a few thousand it runs in well under a second.

A faster approach builds a trie of all suffixes: start from each index i, walk down the trie inserting characters of s[i..]. Every newly created node corresponds to a distinct substring (the path from root to that node). Sum up the new-node creations across all suffixes to get the answer in O(n^2) time.

For very large strings, build a suffix array with LCP. The number of distinct substrings equals n(n+1)/2 minus the sum of LCP values. This is O(n log n) using DC3 or SA-IS.

## Complexity
Hash-set baseline: time O(n^3) worst case, space O(n^3). Suffix trie: O(n^2) time and space. Suffix array: O(n log n) time, O(n) space — the production answer for n up to 10^5.`,
  solutions: {
    python: `class Solution:
    def countDistinctSubstrings(self, s):
        seen = set()
        n = len(s)
        for i in range(n):
            for j in range(i + 1, n + 1):
                seen.add(s[i:j])
        return len(seen)`,
    javascript: `var countDistinctSubstrings = function(s) {
    const seen = new Set();
    const n = s.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j <= n; j++) {
            seen.add(s.substring(i, j));
        }
    }
    return seen.size;
};`,
    java: `class Solution {
    public int countDistinctSubstrings(String s) {
        java.util.Set<String> seen = new java.util.HashSet<>();
        int n = s.length();
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j <= n; j++)
                seen.add(s.substring(i, j));
        return seen.size();
    }
}`,
    cpp: `class Solution {
public:
    int countDistinctSubstrings(string s) {
        unordered_set<string> seen;
        int n = s.size();
        for (int i = 0; i < n; i++)
            for (int j = 1; j + i <= n; j++)
                seen.insert(s.substr(i, j));
        return (int)seen.size();
    }
};`,
  },
});

// 4. Duplicates in Binary Matrix - find duplicate rows
problems.push({
  id: 'duplicates-in-binary-matrix',
  description: '<p>Given a binary matrix <code>mat</code> of size <code>n x m</code>, return the row indices (in input order) of rows that appear more than once. For each repeated row, include the index of every occurrence except the first.</p><p><strong>Example:</strong></p><pre>Input: mat = [[1,1,0,1],[0,0,1,0],[1,1,0,1],[1,0,1,0]]\nOutput: [2]\nExplanation: Row 2 equals row 0.</pre>',
  method_name: 'duplicateRows',
  params: [{ name: 'mat', type: 'List[List[int]]' }],
  return_type: 'List[int]',
  pattern: 'Hashing',
  topic_id: 'matrix',
  tags: ['matrix', 'hashing', 'arrays'],
  hints: [
    'Convert each row to a canonical key — a tuple, string, or bitmask of its 0/1 values.',
    'Walk top to bottom; if the key was seen before, record the current index as a duplicate.',
    'Use a hash set keyed on the row representation for O(m) per row lookup/insert.',
    'For very wide rows (m up to 64 in problem constraints), pack the row into a 64-bit integer for O(1) hashing.',
    'Result must be in original index order — the linear sweep preserves that naturally.',
  ],
  test_cases: [
    { inputs: ['[[1,1,0,1],[0,0,1,0],[1,1,0,1],[1,0,1,0]]'], expected: '[2]' },
    { inputs: ['[[1,0],[0,1],[1,0]]'], expected: '[2]' },
    { inputs: ['[[1,1],[1,1],[1,1]]'], expected: '[1,2]' },
    { inputs: ['[[0]]'], expected: '[]' },
    { inputs: ['[[1,0,1],[1,0,1],[0,1,0],[0,1,0]]'], expected: '[1,3]' },
    { inputs: ['[[1,1,1],[0,0,0],[1,1,1],[0,0,0]]'], expected: '[2,3]' },
    { inputs: ['[[1]]'], expected: '[]' },
    { inputs: ['[[0,0,0,0],[0,0,0,0]]'], expected: '[1]' },
    { inputs: ['[[1,0,0],[0,1,0],[0,0,1]]'], expected: '[]' },
    { inputs: ['[[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,1,0]]'], expected: '[2,3,4]' },
    { inputs: ['[[1,0,1,1,0],[1,0,1,1,0]]'], expected: '[1]' },
    { inputs: ['[[0,0],[1,1],[0,0],[1,1],[0,0]]'], expected: '[2,3,4]' },
  ],
  editorial_md: `## Intuition
Two rows are duplicates iff their integer sequences are identical. Any structure that lets us look up a row by its content in expected O(m) suffices. Hash sets keyed on the row representation are the natural choice.

## Approach
Iterate over rows top to bottom. For each row construct a hashable key — easiest is to join the bits into a string, or pack them into a Python tuple. If the key already exists in the seen set, push the current row index into the answer list; otherwise add the key.

Three representational variations:
1. String join: clear and language-portable.
2. Tuple: Python idiomatic, slightly faster than string join.
3. Bitmask: when m is small (say, m up to 60), each row fits into a 64-bit integer. Hashing an integer is O(1), so the whole algorithm becomes O(n).

The answer is naturally produced in input order because we sweep top to bottom and append on detection. No sorting step is required.

Edge cases: a single row is never a duplicate; an empty matrix returns []. Multiple repeats of the same row (say it appears three times) yield two duplicate indices — every occurrence after the first.

## Complexity
Time O(n * m) using string or tuple keys; O(n) extra hashing cost with bitmask. Space O(n * m) for the seen set storing the row keys.`,
  solutions: {
    python: `class Solution:
    def duplicateRows(self, mat):
        seen = set()
        out = []
        for i, row in enumerate(mat):
            key = tuple(row)
            if key in seen:
                out.append(i)
            else:
                seen.add(key)
        return out`,
    javascript: `var duplicateRows = function(mat) {
    const seen = new Set();
    const out = [];
    for (let i = 0; i < mat.length; i++) {
        const key = mat[i].join(',');
        if (seen.has(key)) out.push(i);
        else seen.add(key);
    }
    return out;
};`,
    java: `class Solution {
    public java.util.List<Integer> duplicateRows(int[][] mat) {
        java.util.Set<String> seen = new java.util.HashSet<>();
        java.util.List<Integer> out = new java.util.ArrayList<>();
        for (int i = 0; i < mat.length; i++) {
            StringBuilder sb = new StringBuilder();
            for (int v : mat[i]) sb.append(v).append(',');
            String key = sb.toString();
            if (!seen.add(key)) out.add(i);
        }
        return out;
    }
}`,
    cpp: `class Solution {
public:
    vector<int> duplicateRows(vector<vector<int>>& mat) {
        unordered_set<string> seen;
        vector<int> out;
        for (int i = 0; i < (int)mat.size(); i++) {
            string key;
            for (int v : mat[i]) { key += (char)('0' + v); key += ','; }
            if (seen.count(key)) out.push_back(i);
            else seen.insert(key);
        }
        return out;
    }
};`,
  },
});

// 5. Egg Dropping (LC 887)
problems.push({
  id: 'egg-dropping',
  description: '<p>You have <code>k</code> identical eggs and a building with <code>n</code> floors. There is some floor <code>f</code> (0 &le; f &le; n) such that any egg dropped from a floor &gt; f breaks and any egg from &le; f survives. Find the minimum number of drops needed in the worst case to determine <code>f</code>.</p><p><strong>Example:</strong></p><pre>Input: k = 2, n = 6\nOutput: 3</pre>',
  method_name: 'superEggDrop',
  params: [{ name: 'k', type: 'int' }, { name: 'n', type: 'int' }],
  return_type: 'int',
  pattern: 'Dynamic Programming',
  topic_id: 'dp',
  tags: ['dp', 'binary-search', 'math'],
  hints: [
    'Let dp[m][k] = max floors checkable with m moves and k eggs. Recurrence: dp[m][k] = dp[m-1][k-1] + dp[m-1][k] + 1.',
    'Increase m until dp[m][k] >= n. The smallest such m is the answer.',
    'The naive DP f(n, k) = min over x of 1 + max(f(x-1, k-1), f(n-x, k)) is O(k * n^2) and too slow for n = 10000.',
    'The flipped DP runs in O(k log n) since m never exceeds ~log2(n) * k bound.',
    'Edge cases: k = 1 forces linear search, answer is n; n = 0 returns 0.',
  ],
  test_cases: [
    { inputs: ['1', '2'], expected: '2' },
    { inputs: ['2', '6'], expected: '3' },
    { inputs: ['3', '14'], expected: '4' },
    { inputs: ['1', '1'], expected: '1' },
    { inputs: ['2', '1'], expected: '1' },
    { inputs: ['4', '5000'], expected: '19' },
    { inputs: ['2', '100'], expected: '14' },
    { inputs: ['3', '25'], expected: '5' },
    { inputs: ['10', '10000'], expected: '14' },
    { inputs: ['1', '10'], expected: '10' },
    { inputs: ['2', '10'], expected: '4' },
    { inputs: ['3', '1'], expected: '1' },
  ],
  editorial_md: `## Intuition
The forward DP "given n floors and k eggs, what is the min worst-case drops?" is hard because the recursion branches on every possible first drop. Flip the question: given m drops and k eggs, what is the maximum floor count we can solve? That DP has a simple closed recurrence.

## Approach
Let f(m, k) be the maximum number of floors we can distinguish with m drops and k eggs. Drop one egg:
- If it breaks, we have m-1 drops and k-1 eggs, distinguishing f(m-1, k-1) floors below.
- If it survives, we have m-1 drops and k eggs, distinguishing f(m-1, k) floors above.
- Plus the one floor we just tested.

So f(m, k) = f(m-1, k-1) + f(m-1, k) + 1, with f(0, k) = 0 and f(m, 0) = 0.

Iterate m upward; at each step compute f for all egg counts. Return the smallest m such that f(m, k) >= n. Since f doubles roughly with each m when k is large, m never exceeds ~log2(n+1) for k >= log2(n+1), giving an effective bound of O(k log n).

## Complexity
Time O(k log n) — m runs to at most about log2(n+1) when k is large, and each iteration does O(k) work. Space O(k) using a 1D rolling array. The naive O(k n^2) DP also works for small inputs and is simpler to write if performance is not critical.`,
  solutions: {
    python: `class Solution:
    def superEggDrop(self, k, n):
        dp = [0] * (k + 1)
        m = 0
        while dp[k] < n:
            m += 1
            for j in range(k, 0, -1):
                dp[j] = dp[j] + dp[j-1] + 1
        return m`,
    javascript: `var superEggDrop = function(k, n) {
    const dp = new Array(k + 1).fill(0);
    let m = 0;
    while (dp[k] < n) {
        m++;
        for (let j = k; j > 0; j--) {
            dp[j] = dp[j] + dp[j-1] + 1;
        }
    }
    return m;
};`,
    java: `class Solution {
    public int superEggDrop(int k, int n) {
        int[] dp = new int[k + 1];
        int m = 0;
        while (dp[k] < n) {
            m++;
            for (int j = k; j > 0; j--) {
                dp[j] = dp[j] + dp[j-1] + 1;
            }
        }
        return m;
    }
}`,
    cpp: `class Solution {
public:
    int superEggDrop(int k, int n) {
        vector<int> dp(k + 1, 0);
        int m = 0;
        while (dp[k] < n) {
            m++;
            for (int j = k; j > 0; j--) {
                dp[j] = dp[j] + dp[j-1] + 1;
            }
        }
        return m;
    }
};`,
  },
});

// 6. Euler totient
problems.push({
  id: 'euler',
  description: '<p>Compute Euler\'s Totient Function <code>&phi;(n)</code> — the number of integers in [1, n] coprime to <code>n</code>.</p><p><strong>Example:</strong></p><pre>Input: n = 10\nOutput: 4\nExplanation: {1, 3, 7, 9} are coprime to 10.</pre><p><strong>Constraints:</strong> 1 &le; n &le; 10^9.</p>',
  method_name: 'eulerTotient',
  params: [{ name: 'n', type: 'int' }],
  return_type: 'int',
  pattern: 'Math / Number Theory',
  topic_id: 'math',
  tags: ['math', 'number-theory'],
  hints: [
    'Use the product formula: phi(n) = n * product over distinct prime factors p of (1 - 1/p).',
    'Trial divide by primes up to sqrt(n), pulling each factor out completely and applying the formula.',
    'Initialize result = n, then for each prime factor p: result -= result / p and divide n by p repeatedly.',
    'If after the loop n > 1, the remaining n is itself a prime factor.',
    'Time O(sqrt(n)).',
  ],
  test_cases: [
    { inputs: ['1'], expected: '1' },
    { inputs: ['2'], expected: '1' },
    { inputs: ['3'], expected: '2' },
    { inputs: ['10'], expected: '4' },
    { inputs: ['11'], expected: '10' },
    { inputs: ['12'], expected: '4' },
    { inputs: ['36'], expected: '12' },
    { inputs: ['100'], expected: '40' },
    { inputs: ['97'], expected: '96' },
    { inputs: ['1000'], expected: '400' },
    { inputs: ['999999937'], expected: '999999936' },
    { inputs: ['720'], expected: '192' },
  ],
  editorial_md: `## Intuition
Euler's totient counts integers in [1, n] that share no factor with n. Inclusion-exclusion over the prime factors of n gives the multiplicative formula phi(n) = n * product_p (1 - 1/p). To use it we just need n's distinct prime factors.

## Approach
Initialize result = n. Trial divide n by every candidate p starting at 2 while p * p <= n:
- If p divides n, apply result = result - result / p (this is equivalent to multiplying by (1 - 1/p) but stays in integers).
- Divide n by p repeatedly until p no longer divides n; this pulls the prime out completely.
- Continue with the next candidate.

After the loop, if n is still greater than 1 then the remaining value is itself a prime factor that was never reduced — apply result = result - result / n.

This works for all n up to about 10^18 in O(sqrt n) since we only trial divide up to sqrt(n). For computing phi for many values up to some N a linear sieve runs in O(N) total.

## Complexity
Time O(sqrt(n)) per query. Space O(1). For 10^9 inputs this is roughly 30000 iterations, well within limits. The formula extends to multiplicative properties: phi(a*b) = phi(a)*phi(b) when gcd(a,b) = 1, enabling combination across factors.`,
  solutions: {
    python: `class Solution:
    def eulerTotient(self, n):
        result = n
        p = 2
        while p * p <= n:
            if n % p == 0:
                while n % p == 0:
                    n //= p
                result -= result // p
            p += 1
        if n > 1:
            result -= result // n
        return result`,
    javascript: `var eulerTotient = function(n) {
    let result = n;
    let p = 2;
    while (p * p <= n) {
        if (n % p === 0) {
            while (n % p === 0) n = Math.floor(n / p);
            result -= Math.floor(result / p);
        }
        p++;
    }
    if (n > 1) result -= Math.floor(result / n);
    return result;
};`,
    java: `class Solution {
    public int eulerTotient(int n) {
        long result = n;
        long m = n;
        for (long p = 2; p * p <= m; p++) {
            if (m % p == 0) {
                while (m % p == 0) m /= p;
                result -= result / p;
            }
        }
        if (m > 1) result -= result / m;
        return (int)result;
    }
}`,
    cpp: `class Solution {
public:
    int eulerTotient(int n) {
        long long result = n;
        long long m = n;
        for (long long p = 2; p * p <= m; p++) {
            if (m % p == 0) {
                while (m % p == 0) m /= p;
                result -= result / p;
            }
        }
        if (m > 1) result -= result / m;
        return (int)result;
    }
};`,
  },
});

// 7. Largest Divisible Subset (LC 368)
problems.push({
  id: 'largest-divisible',
  description: '<p>Given a set of distinct positive integers <code>nums</code>, return the largest subset such that for every pair (a, b) in the subset, either a % b == 0 or b % a == 0.</p><p><strong>Example:</strong></p><pre>Input: nums = [1,2,4,8]\nOutput: [1,2,4,8]</pre>',
  method_name: 'largestDivisibleSubset',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'List[int]',
  pattern: 'Dynamic Programming',
  topic_id: 'dp',
  tags: ['dp', 'arrays', 'math'],
  hints: [
    'Sort nums ascending. Now divisibility only needs to be checked between a smaller and a larger element.',
    'Let dp[i] = length of longest divisible subset ending at nums[i]; parent[i] tracks the predecessor.',
    'For each i, scan j < i: if nums[i] % nums[j] == 0 and dp[j] + 1 > dp[i], update dp[i] and parent[i].',
    'Track the index with the global max dp value, then reconstruct the chain via parent pointers.',
    'Time O(n^2), space O(n). Result order does not matter — return in any order.',
  ],
  test_cases: [
    { inputs: ['[1,2,3]'], expected: '[1,2]' },
    { inputs: ['[1,2,4,8]'], expected: '[1,2,4,8]' },
    { inputs: ['[1]'], expected: '[1]' },
    { inputs: ['[2,3,4,9,8]'], expected: '[2,4,8]' },
    { inputs: ['[3,4,16,8]'], expected: '[4,8,16]' },
    { inputs: ['[1,2,4,8,16,32]'], expected: '[1,2,4,8,16,32]' },
    { inputs: ['[5,10,20,40]'], expected: '[5,10,20,40]' },
    { inputs: ['[7,11,13]'], expected: '[7]' },
    { inputs: ['[1,3,6,24]'], expected: '[1,3,6,24]' },
    { inputs: ['[2,3,8,9]'], expected: '[2,8]' },
    { inputs: ['[1,2,4,8,3,9,27]'], expected: '[1,3,9,27]' },
    { inputs: ['[4,8,10,240]'], expected: '[4,8,240]' },
  ],
  editorial_md: `## Intuition
The relation "a divides b" is transitive on a sorted ascending sequence: if a | b and b | c then a | c. So once we sort, finding the longest divisible subset reduces to a longest-chain DP analogous to longest increasing subsequence — except the comparator is divisibility rather than less-than.

## Approach
Sort nums ascending. Define dp[i] = length of the longest divisible subset whose largest element is nums[i]. Also track parent[i] — the index of the predecessor in that optimal subset.

For each i from 0 to n-1, scan all j < i. If nums[i] % nums[j] == 0 and dp[j] + 1 > dp[i], set dp[i] = dp[j] + 1 and parent[i] = j. Base case dp[i] = 1, parent[i] = -1.

Track the index k with maximum dp[k] across all i. To rebuild the subset, walk backwards from k via parent pointers, pushing nums[k] each time, then reverse the collected list.

## Complexity
Time O(n^2) due to the double loop over indices. Space O(n) for dp and parent arrays. For n up to about 2000 this is fast; for much larger inputs one can prune by skipping i values whose dp can no longer beat the current best, but the worst case remains quadratic.`,
  solutions: {
    python: `class Solution:
    def largestDivisibleSubset(self, nums):
        if not nums: return []
        nums.sort()
        n = len(nums)
        dp = [1] * n
        parent = [-1] * n
        best = 0
        for i in range(n):
            for j in range(i):
                if nums[i] % nums[j] == 0 and dp[j] + 1 > dp[i]:
                    dp[i] = dp[j] + 1
                    parent[i] = j
            if dp[i] > dp[best]:
                best = i
        out = []
        k = best
        while k != -1:
            out.append(nums[k])
            k = parent[k]
        return out[::-1]`,
    javascript: `var largestDivisibleSubset = function(nums) {
    if (!nums.length) return [];
    nums.sort((a, b) => a - b);
    const n = nums.length;
    const dp = new Array(n).fill(1);
    const parent = new Array(n).fill(-1);
    let best = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < i; j++) {
            if (nums[i] % nums[j] === 0 && dp[j] + 1 > dp[i]) {
                dp[i] = dp[j] + 1;
                parent[i] = j;
            }
        }
        if (dp[i] > dp[best]) best = i;
    }
    const out = [];
    for (let k = best; k !== -1; k = parent[k]) out.push(nums[k]);
    return out.reverse();
};`,
    java: `class Solution {
    public java.util.List<Integer> largestDivisibleSubset(int[] nums) {
        if (nums.length == 0) return new java.util.ArrayList<>();
        java.util.Arrays.sort(nums);
        int n = nums.length;
        int[] dp = new int[n], parent = new int[n];
        java.util.Arrays.fill(dp, 1);
        java.util.Arrays.fill(parent, -1);
        int best = 0;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < i; j++) {
                if (nums[i] % nums[j] == 0 && dp[j] + 1 > dp[i]) {
                    dp[i] = dp[j] + 1;
                    parent[i] = j;
                }
            }
            if (dp[i] > dp[best]) best = i;
        }
        java.util.List<Integer> out = new java.util.ArrayList<>();
        for (int k = best; k != -1; k = parent[k]) out.add(nums[k]);
        java.util.Collections.reverse(out);
        return out;
    }
}`,
    cpp: `class Solution {
public:
    vector<int> largestDivisibleSubset(vector<int>& nums) {
        if (nums.empty()) return {};
        sort(nums.begin(), nums.end());
        int n = nums.size();
        vector<int> dp(n, 1), parent(n, -1);
        int best = 0;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < i; j++) {
                if (nums[i] % nums[j] == 0 && dp[j] + 1 > dp[i]) {
                    dp[i] = dp[j] + 1;
                    parent[i] = j;
                }
            }
            if (dp[i] > dp[best]) best = i;
        }
        vector<int> out;
        for (int k = best; k != -1; k = parent[k]) out.push_back(nums[k]);
        reverse(out.begin(), out.end());
        return out;
    }
};`,
  },
});

// 8. Longest Bitonic Subsequence
problems.push({
  id: 'longest-bitonic',
  description: '<p>Given an array <code>nums</code>, find the length of the longest <strong>bitonic</strong> subsequence — a subsequence that first strictly increases and then strictly decreases (either side can be empty).</p><p><strong>Example:</strong></p><pre>Input: nums = [1,11,2,10,4,5,2,1]\nOutput: 6\nExplanation: 1,2,10,4,2,1 or 1,11,10,5,2,1 each have length 6.</pre>',
  method_name: 'longestBitonic',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Dynamic Programming',
  topic_id: 'dp',
  tags: ['dp', 'arrays', 'lis'],
  hints: [
    'Compute lis[i] = length of LIS ending at i scanning left to right.',
    'Compute lds[i] = length of LDS starting at i scanning right to left.',
    'For each i, bitonic length through i = lis[i] + lds[i] - 1 (avoid double-counting nums[i]).',
    'Answer is the maximum over all i.',
    'O(n^2) using direct DP, O(n log n) using patience-sort LIS twice.',
  ],
  test_cases: [
    { inputs: ['[1,11,2,10,4,5,2,1]'], expected: '6' },
    { inputs: ['[12,11,40,5,3,1]'], expected: '5' },
    { inputs: ['[80,60,30,40,20,10]'], expected: '5' },
    { inputs: ['[1,2,3,4,5]'], expected: '5' },
    { inputs: ['[5,4,3,2,1]'], expected: '5' },
    { inputs: ['[1]'], expected: '1' },
    { inputs: ['[1,2,1]'], expected: '3' },
    { inputs: ['[10,20,30,25,15,5]'], expected: '6' },
    { inputs: ['[1,3,5,4,2]'], expected: '5' },
    { inputs: ['[1,2,3,3,2,1]'], expected: '5' },
    { inputs: ['[9,9,9,9]'], expected: '1' },
    { inputs: ['[1,15,51,45,33,100,12,18,9]'], expected: '6' },
  ],
  editorial_md: `## Intuition
A bitonic sequence is the concatenation of a strictly increasing prefix and a strictly decreasing suffix that share their peak element. The longest such subsequence through a fixed peak i is exactly the longest increasing subsequence ending at i plus the longest decreasing subsequence starting at i, minus one for the shared peak.

## Approach
Compute two DP arrays:
- lis[i] = length of strictly-increasing subsequence ending at nums[i]. For each i, lis[i] = 1 + max(lis[j]) over j < i with nums[j] < nums[i].
- lds[i] = length of strictly-decreasing subsequence starting at nums[i]. Compute right to left: for each i, lds[i] = 1 + max(lds[j]) over j > i with nums[j] < nums[i].

Then the bitonic length with peak at i is lis[i] + lds[i] - 1. Take the maximum across all i for the answer.

The "strictly" requirement matters: equal-valued neighbours are not allowed in either half. If the problem permitted plateaus the comparisons would use <= and >=.

For each side we can replace the quadratic DP with an O(n log n) patience-sort LIS (using bisect / lowerBound) when n grows beyond a few thousand, dropping total complexity from O(n^2) to O(n log n).

## Complexity
Time O(n^2) with the straightforward DP, O(n log n) with patience-sort LIS twice. Space O(n) for the two DP arrays.`,
  solutions: {
    python: `class Solution:
    def longestBitonic(self, nums):
        n = len(nums)
        if n == 0: return 0
        lis = [1] * n
        lds = [1] * n
        for i in range(n):
            for j in range(i):
                if nums[j] < nums[i]:
                    lis[i] = max(lis[i], lis[j] + 1)
        for i in range(n - 1, -1, -1):
            for j in range(i + 1, n):
                if nums[j] < nums[i]:
                    lds[i] = max(lds[i], lds[j] + 1)
        return max(lis[i] + lds[i] - 1 for i in range(n))`,
    javascript: `var longestBitonic = function(nums) {
    const n = nums.length;
    if (n === 0) return 0;
    const lis = new Array(n).fill(1);
    const lds = new Array(n).fill(1);
    for (let i = 0; i < n; i++)
        for (let j = 0; j < i; j++)
            if (nums[j] < nums[i]) lis[i] = Math.max(lis[i], lis[j] + 1);
    for (let i = n - 1; i >= 0; i--)
        for (let j = i + 1; j < n; j++)
            if (nums[j] < nums[i]) lds[i] = Math.max(lds[i], lds[j] + 1);
    let best = 0;
    for (let i = 0; i < n; i++) best = Math.max(best, lis[i] + lds[i] - 1);
    return best;
};`,
    java: `class Solution {
    public int longestBitonic(int[] nums) {
        int n = nums.length;
        if (n == 0) return 0;
        int[] lis = new int[n], lds = new int[n];
        java.util.Arrays.fill(lis, 1);
        java.util.Arrays.fill(lds, 1);
        for (int i = 0; i < n; i++)
            for (int j = 0; j < i; j++)
                if (nums[j] < nums[i]) lis[i] = Math.max(lis[i], lis[j] + 1);
        for (int i = n - 1; i >= 0; i--)
            for (int j = i + 1; j < n; j++)
                if (nums[j] < nums[i]) lds[i] = Math.max(lds[i], lds[j] + 1);
        int best = 0;
        for (int i = 0; i < n; i++) best = Math.max(best, lis[i] + lds[i] - 1);
        return best;
    }
}`,
    cpp: `class Solution {
public:
    int longestBitonic(vector<int>& nums) {
        int n = nums.size();
        if (n == 0) return 0;
        vector<int> lis(n, 1), lds(n, 1);
        for (int i = 0; i < n; i++)
            for (int j = 0; j < i; j++)
                if (nums[j] < nums[i]) lis[i] = max(lis[i], lis[j] + 1);
        for (int i = n - 1; i >= 0; i--)
            for (int j = i + 1; j < n; j++)
                if (nums[j] < nums[i]) lds[i] = max(lds[i], lds[j] + 1);
        int best = 0;
        for (int i = 0; i < n; i++) best = max(best, lis[i] + lds[i] - 1);
        return best;
    }
};`,
  },
});

// 9. Longest Increasing Path in matrix (LC 329)
problems.push({
  id: 'longest-increasing-path',
  description: '<p>Given an <code>m x n</code> integer matrix, return the length of the longest strictly increasing path. From each cell you may move in four directions (up, down, left, right). Diagonal moves and wrap-around are not allowed.</p><p><strong>Example:</strong></p><pre>Input: matrix = [[9,9,4],[6,6,8],[2,1,1]]\nOutput: 4\nExplanation: 1 -> 2 -> 6 -> 9.</pre>',
  method_name: 'longestIncreasingPath',
  params: [{ name: 'matrix', type: 'List[List[int]]' }],
  return_type: 'int',
  pattern: 'DFS + Memoization',
  topic_id: 'graphs',
  tags: ['dfs', 'matrix', 'dp', 'memoization'],
  hints: [
    'DFS from every cell, but memoize the longest path that starts at each cell.',
    'Because edges only go from smaller to strictly larger values, the implicit graph is a DAG — memoization is safe and complete.',
    'For each neighbour with a strictly larger value, recurse and take 1 + max of the recursive results.',
    'Without memoization the brute force is exponential; with memoization each cell is computed once.',
    'Time O(m*n), space O(m*n) for the memo table and recursion stack.',
  ],
  test_cases: [
    { inputs: ['[[9,9,4],[6,6,8],[2,1,1]]'], expected: '4' },
    { inputs: ['[[3,4,5],[3,2,6],[2,2,1]]'], expected: '4' },
    { inputs: ['[[1]]'], expected: '1' },
    { inputs: ['[[1,2]]'], expected: '2' },
    { inputs: ['[[2,1]]'], expected: '2' },
    { inputs: ['[[1,2,3],[6,5,4],[7,8,9]]'], expected: '9' },
    { inputs: ['[[7,7,7],[7,7,7]]'], expected: '1' },
    { inputs: ['[[1,2,3,4,5]]'], expected: '5' },
    { inputs: ['[[5,4,3,2,1]]'], expected: '5' },
    { inputs: ['[[1,2],[4,3]]'], expected: '4' },
    { inputs: ['[[0,1,2,3,4,5,6,7,8,9]]'], expected: '10' },
    { inputs: ['[[1,3,5],[2,4,6],[3,5,7]]'], expected: '5' },
  ],
  editorial_md: `## Intuition
The grid plus the "strictly increasing" rule forms a directed acyclic graph: an edge exists from cell a to neighbouring cell b only when matrix[b] > matrix[a]. Longest path in a DAG is a classic memoized DFS.

## Approach
Define dfs(r, c) = length of the longest strictly-increasing path starting at (r, c). For each cell:
- Initialize best = 1 (the cell itself).
- For each of the four neighbours (dr, dc), if (nr, nc) is in bounds and matrix[nr][nc] > matrix[r][c], compute candidate = 1 + dfs(nr, nc) and update best.
- Memoize and return best.

Iterate every cell as a starting point, take the global max. Because edges only go strictly upward in value, no cycle is possible — memoization will fill every cell exactly once in topologically consistent order.

An alternative is Kahn-style topological BFS by sorting cells in descending value order and computing dp bottom-up. Both have the same asymptotic cost; recursion with memoization is the more compact code.

## Complexity
Time O(m * n) since each cell is visited at most once after memoization and each visit does O(4) neighbour work. Space O(m * n) for the memo table and recursion stack — in the worst case (sorted matrix) the recursion depth is m * n, so for very large grids convert to an iterative topological order to avoid stack overflow.`,
  solutions: {
    python: `class Solution:
    def longestIncreasingPath(self, matrix):
        if not matrix: return 0
        m, n = len(matrix), len(matrix[0])
        memo = [[0]*n for _ in range(m)]
        def dfs(r, c):
            if memo[r][c]: return memo[r][c]
            best = 1
            for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
                nr, nc = r+dr, c+dc
                if 0 <= nr < m and 0 <= nc < n and matrix[nr][nc] > matrix[r][c]:
                    best = max(best, 1 + dfs(nr, nc))
            memo[r][c] = best
            return best
        return max(dfs(r, c) for r in range(m) for c in range(n))`,
    javascript: `var longestIncreasingPath = function(matrix) {
    if (!matrix.length) return 0;
    const m = matrix.length, n = matrix[0].length;
    const memo = Array.from({length: m}, () => new Array(n).fill(0));
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    function dfs(r, c) {
        if (memo[r][c]) return memo[r][c];
        let best = 1;
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < m && nc >= 0 && nc < n && matrix[nr][nc] > matrix[r][c]) {
                best = Math.max(best, 1 + dfs(nr, nc));
            }
        }
        memo[r][c] = best;
        return best;
    }
    let ans = 0;
    for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) ans = Math.max(ans, dfs(r, c));
    return ans;
};`,
    java: `class Solution {
    int[][] memo;
    int[][] mat;
    int m, n;
    int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
    public int longestIncreasingPath(int[][] matrix) {
        if (matrix.length == 0) return 0;
        mat = matrix; m = matrix.length; n = matrix[0].length;
        memo = new int[m][n];
        int ans = 0;
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++)
                ans = Math.max(ans, dfs(r, c));
        return ans;
    }
    int dfs(int r, int c) {
        if (memo[r][c] != 0) return memo[r][c];
        int best = 1;
        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < m && nc >= 0 && nc < n && mat[nr][nc] > mat[r][c]) {
                best = Math.max(best, 1 + dfs(nr, nc));
            }
        }
        memo[r][c] = best;
        return best;
    }
}`,
    cpp: `class Solution {
    vector<vector<int>> memo;
    vector<vector<int>>* mat;
    int m, n;
    int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
    int dfs(int r, int c) {
        if (memo[r][c]) return memo[r][c];
        int best = 1;
        for (auto& d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < m && nc >= 0 && nc < n && (*mat)[nr][nc] > (*mat)[r][c]) {
                best = max(best, 1 + dfs(nr, nc));
            }
        }
        return memo[r][c] = best;
    }
public:
    int longestIncreasingPath(vector<vector<int>>& matrix) {
        if (matrix.empty()) return 0;
        mat = &matrix; m = matrix.size(); n = matrix[0].size();
        memo.assign(m, vector<int>(n, 0));
        int ans = 0;
        for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) ans = max(ans, dfs(r, c));
        return ans;
    }
};`,
  },
});

// 10. Matrix Chain Multiplication
problems.push({
  id: 'matrix-chain-multiplication',
  description: '<p>Given an array <code>dims</code> of length <code>n+1</code> where matrix <code>A_i</code> has dimensions <code>dims[i] x dims[i+1]</code>, return the minimum number of scalar multiplications needed to compute the product <code>A_1 * A_2 * ... * A_n</code>.</p><p><strong>Example:</strong></p><pre>Input: dims = [40,20,30,10,30]\nOutput: 26000</pre>',
  method_name: 'matrixChainMultiplication',
  params: [{ name: 'dims', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Interval DP',
  topic_id: 'dp',
  tags: ['dp', 'interval-dp', 'matrix'],
  hints: [
    'Let dp[i][j] = min cost to multiply A_i..A_j. Base case dp[i][i] = 0.',
    'Try every split point k in [i, j-1]: dp[i][j] = min(dp[i][k] + dp[k+1][j] + dims[i-1]*dims[k]*dims[j]).',
    'Iterate by chain length L from 2 to n, then i from 1 to n-L+1, j = i+L-1.',
    'Output is dp[1][n].',
    'Time O(n^3), space O(n^2).',
  ],
  test_cases: [
    { inputs: ['[40,20,30,10,30]'], expected: '26000' },
    { inputs: ['[10,20,30,40,30]'], expected: '30000' },
    { inputs: ['[1,2,3,4]'], expected: '18' },
    { inputs: ['[10,30,5,60]'], expected: '4500' },
    { inputs: ['[10,20]'], expected: '0' },
    { inputs: ['[10,20,30]'], expected: '6000' },
    { inputs: ['[5,10,15,20,25]'], expected: '4375' },
    { inputs: ['[2,3,4,5]'], expected: '64' },
    { inputs: ['[1,2,3,4,5,6]'], expected: '90' },
    { inputs: ['[30,35,15,5,10,20,25]'], expected: '15125' },
    { inputs: ['[10,100,5,50]'], expected: '7500' },
    { inputs: ['[4,10,3,12,20,7]'], expected: '1344' },
  ],
  editorial_md: `## Intuition
Matrix multiplication is associative, so the final answer does not depend on parenthesisation — but the number of scalar multiplications does. Picking a split point k for the outermost product gives subproblems that are smaller chains, each solved optimally. Classic interval DP.

## Approach
Let n be the number of matrices, so dims has length n+1 and A_i is dims[i-1] x dims[i]. Define dp[i][j] for 1 <= i <= j <= n as the minimum cost to multiply A_i .. A_j.

Recurrence:
- dp[i][i] = 0 (a single matrix needs no multiplication)
- dp[i][j] = min over k in [i, j-1] of dp[i][k] + dp[k+1][j] + dims[i-1] * dims[k] * dims[j]

The cost term dims[i-1] * dims[k] * dims[j] is the cost to multiply the two intermediate matrices of shape (dims[i-1] x dims[k]) and (dims[k] x dims[j]).

Iterate by chain length L from 2 to n; for each L, slide window i from 1 to n-L+1 and set j = i+L-1. Inner loop scans k in [i, j-1]. The answer is dp[1][n].

For very large n (n > 500) Knuth's optimisation cuts the time to O(n^2 log n) by exploiting monotonicity of the optimal split index, but the canonical O(n^3) DP handles n up to a few hundred easily.

## Complexity
Time O(n^3) — three nested loops over chain length, start, and split point. Space O(n^2) for the dp table.`,
  solutions: {
    python: `class Solution:
    def matrixChainMultiplication(self, dims):
        n = len(dims) - 1
        if n <= 1: return 0
        dp = [[0]*(n+1) for _ in range(n+1)]
        for L in range(2, n+1):
            for i in range(1, n - L + 2):
                j = i + L - 1
                dp[i][j] = float('inf')
                for k in range(i, j):
                    cost = dp[i][k] + dp[k+1][j] + dims[i-1]*dims[k]*dims[j]
                    if cost < dp[i][j]: dp[i][j] = cost
        return dp[1][n]`,
    javascript: `var matrixChainMultiplication = function(dims) {
    const n = dims.length - 1;
    if (n <= 1) return 0;
    const dp = Array.from({length: n+1}, () => new Array(n+1).fill(0));
    for (let L = 2; L <= n; L++) {
        for (let i = 1; i <= n - L + 1; i++) {
            const j = i + L - 1;
            dp[i][j] = Infinity;
            for (let k = i; k < j; k++) {
                const cost = dp[i][k] + dp[k+1][j] + dims[i-1]*dims[k]*dims[j];
                if (cost < dp[i][j]) dp[i][j] = cost;
            }
        }
    }
    return dp[1][n];
};`,
    java: `class Solution {
    public int matrixChainMultiplication(int[] dims) {
        int n = dims.length - 1;
        if (n <= 1) return 0;
        int[][] dp = new int[n+1][n+1];
        for (int L = 2; L <= n; L++) {
            for (int i = 1; i <= n - L + 1; i++) {
                int j = i + L - 1;
                dp[i][j] = Integer.MAX_VALUE;
                for (int k = i; k < j; k++) {
                    int cost = dp[i][k] + dp[k+1][j] + dims[i-1]*dims[k]*dims[j];
                    if (cost < dp[i][j]) dp[i][j] = cost;
                }
            }
        }
        return dp[1][n];
    }
}`,
    cpp: `class Solution {
public:
    int matrixChainMultiplication(vector<int>& dims) {
        int n = dims.size() - 1;
        if (n <= 1) return 0;
        vector<vector<int>> dp(n+1, vector<int>(n+1, 0));
        for (int L = 2; L <= n; L++) {
            for (int i = 1; i <= n - L + 1; i++) {
                int j = i + L - 1;
                dp[i][j] = INT_MAX;
                for (int k = i; k < j; k++) {
                    int cost = dp[i][k] + dp[k+1][j] + dims[i-1]*dims[k]*dims[j];
                    if (cost < dp[i][j]) dp[i][j] = cost;
                }
            }
        }
        return dp[1][n];
    }
};`,
  },
});

fs.writeFileSync('/tmp/patch-w3r-500-07.json', JSON.stringify(problems, null, 2));
console.log('Wrote', problems.length, 'problems to patch file');
