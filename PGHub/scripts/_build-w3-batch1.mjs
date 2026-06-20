#!/usr/bin/env node
// Build patches for first 6 problems
import fs from 'node:fs';

const patches = [];

// 1. ones-and-zeroes — 0-1 knapsack 2D
patches.push({
  id: 'ones-and-zeroes',
  pattern: '2D Knapsack DP',
  hints: [
    "Each string is an item with cost (zeros, ones). Knapsack with two capacities m and n.",
    "dp[i][j] = max items using at most i zeros and j ones.",
    "Iterate strings; for each, iterate i from m down to zeros, j from n down to ones.",
    "Transition: dp[i][j] = max(dp[i][j], dp[i-zeros][j-ones] + 1).",
    "O(L * m * n) time where L is len(strs), O(m*n) space."
  ],
  test_cases: [
    { inputs: ['["10","0001","111001","1","0"]','5','3'], expected: '4' },
    { inputs: ['["10","0","1"]','1','1'], expected: '2' },
    { inputs: ['["111","1000","1000","1000"]','9','3'], expected: '3' },
    { inputs: ['["00","000"]','10','1'], expected: '1' },
    { inputs: ['["1","1","1"]','0','3'], expected: '3' },
    { inputs: ['["0","0","0"]','3','0'], expected: '3' },
    { inputs: ['["10","10","10"]','3','3'], expected: '3' },
    { inputs: ['[]','5','5'], expected: '0' },
    { inputs: ['["11111"]','0','5'], expected: '1' },
    { inputs: ['["00000"]','5','0'], expected: '1' },
    { inputs: ['["00","11","000","111"]','3','3'], expected: '3' },
    { inputs: ['["10","0001","111001","1","0"]','3','4'], expected: '3' }
  ],
  editorial_md: `## Intuition
Each string is an item with a two-dimensional weight: how many \`0\`s it contains and how many \`1\`s. You have a fixed budget of \`m\` zeros and \`n\` ones, and you want to pack the most items. That is exactly the 0/1 knapsack template with two capacity axes instead of one.

## Approach
Let \`dp[i][j]\` be the maximum number of strings we can select using at most \`i\` zeros and \`j\` ones. Iterate over the strings; for each string count its \`zeros\` and \`ones\`, then update the table in reverse so an item is not counted twice:

\`\`\`
for s in strs:
    z, o = count zeros and ones in s
    for i in range(m, z-1, -1):
        for j in range(n, o-1, -1):
            dp[i][j] = max(dp[i][j], dp[i-z][j-o] + 1)
\`\`\`

The reverse iteration is the standard 0/1 knapsack trick — if you went forward you would reuse the just-updated value and turn it into an unbounded knapsack. The final answer is \`dp[m][n]\`.

## Complexity
- Time: O(L * m * n) where L is the number of strings.
- Space: O(m * n) for the rolling table.

## Pitfalls
- Forgetting to iterate \`i\` and \`j\` in reverse converts the problem to unbounded knapsack and inflates the answer.
- Counting zeros/ones inline per inner-loop iteration is wasteful — precompute per string.
- Starting the inner loop at 0 instead of from the maximum is also slow but correct; the reverse direction is what matters.
`,
  solutions: {
    python: `class Solution:
    def findMaxForm(self, strs, m, n):
        dp = [[0]*(n+1) for _ in range(m+1)]
        for s in strs:
            o = s.count('1'); z = len(s) - o
            for i in range(m, z-1, -1):
                for j in range(n, o-1, -1):
                    v = dp[i-z][j-o] + 1
                    if v > dp[i][j]: dp[i][j] = v
        return dp[m][n]`,
    javascript: `class Solution {
  findMaxForm(strs, m, n) {
    const dp = Array.from({length: m+1}, () => new Array(n+1).fill(0));
    for (const s of strs) {
      let o = 0; for (const c of s) if (c === '1') o++;
      const z = s.length - o;
      for (let i = m; i >= z; i--) {
        for (let j = n; j >= o; j--) {
          const v = dp[i-z][j-o] + 1;
          if (v > dp[i][j]) dp[i][j] = v;
        }
      }
    }
    return dp[m][n];
  }
}`,
    java: `class Solution {
    public int findMaxForm(String[] strs, int m, int n) {
        int[][] dp = new int[m+1][n+1];
        for (String s : strs) {
            int o = 0; for (char c : s.toCharArray()) if (c == '1') o++;
            int z = s.length() - o;
            for (int i = m; i >= z; i--)
                for (int j = n; j >= o; j--)
                    dp[i][j] = Math.max(dp[i][j], dp[i-z][j-o] + 1);
        }
        return dp[m][n];
    }
}`,
    cpp: `class Solution {
public:
    int findMaxForm(vector<string>& strs, int m, int n) {
        vector<vector<int>> dp(m+1, vector<int>(n+1, 0));
        for (auto& s : strs) {
            int o = 0; for (char c : s) if (c == '1') o++;
            int z = (int)s.size() - o;
            for (int i = m; i >= z; i--)
                for (int j = n; j >= o; j--)
                    dp[i][j] = max(dp[i][j], dp[i-z][j-o] + 1);
        }
        return dp[m][n];
    }
};`
  }
});

// 2. stone-game — DP / parity
patches.push({
  id: 'stone-game',
  pattern: 'Game DP / Parity',
  hints: [
    "Total stones is odd (n is even and sum odd guaranteed by constraints in LC version).",
    "Alex picks first and can always choose all even-indexed piles or all odd-indexed piles.",
    "One of those two groups has a larger sum, so Alex always wins → return true.",
    "If you want the DP form, dp[i][j] = max(piles[i] - dp[i+1][j], piles[j] - dp[i][j-1])."
  ],
  test_cases: [
    { inputs: ['[5,3,4,5]'], expected: 'true' },
    { inputs: ['[3,7,2,3]'], expected: 'true' },
    { inputs: ['[1,2]'], expected: 'true' },
    { inputs: ['[100,1,1,100]'], expected: 'true' },
    { inputs: ['[1,100,100,1]'], expected: 'true' },
    { inputs: ['[7,8,8,10]'], expected: 'true' },
    { inputs: ['[2,4,55,6,8]'], expected: 'true' },
    { inputs: ['[1,2,3,4,5,6]'], expected: 'true' },
    { inputs: ['[9,1,9,1]'], expected: 'true' },
    { inputs: ['[2,2,2,2]'], expected: 'true' },
    { inputs: ['[10,1,1,10]'], expected: 'true' },
    { inputs: ['[3,1,4,1,5,9]'], expected: 'true' }
  ],
  editorial_md: `## Intuition
There are an even number of piles and the total is odd, so a tie is impossible. The first player can always guarantee winning by a clever parity argument: split the piles into "even-indexed" (0, 2, 4, …) and "odd-indexed" (1, 3, 5, …). At every turn Alex can force Lee to keep picking from one camp while Alex picks only from the other. Whichever camp has the larger sum, Alex can claim it entirely.

## Approach
Two ways to solve this:

1. **One-liner**: return true. The parity argument above guarantees it.
2. **Interval DP** (works if you change the constraints, e.g. arbitrary parity): let \`dp[i][j]\` be the maximum score difference (current player minus opponent) Alex can achieve on piles \`i..j\`. Transition:

\`\`\`
dp[i][j] = max(piles[i] - dp[i+1][j], piles[j] - dp[i][j-1])
\`\`\`

The answer is \`dp[0][n-1] > 0\`. The DP runs in O(n^2) time and O(n^2) space (reducible to O(n)).

## Complexity
- Constant approach: O(1) time and space.
- DP approach: O(n^2) time, O(n) space with the rolling trick.

## Pitfalls
- Believing the greedy "take the larger end" — it can lose on adversarial inputs.
- Forgetting to compare against zero in the DP form when checking who wins.
- Confusing "score difference" with "absolute score" — keep one or the other consistent throughout.
`,
  solutions: {
    python: `class Solution:
    def stoneGame(self, piles):
        return True`,
    javascript: `class Solution {
  stoneGame(piles) { return true; }
}`,
    java: `class Solution {
    public boolean stoneGame(int[] piles) { return true; }
}`,
    cpp: `class Solution {
public:
    bool stoneGame(vector<int>& piles) { return true; }
};`
  }
});

// 3. combination-sum-iv
patches.push({
  id: 'combination-sum-iv',
  pattern: 'Unbounded Knapsack DP (permutations)',
  hints: [
    "Order matters → outer loop over sums, inner loop over numbers.",
    "dp[t] = number of ways to make t. Base: dp[0] = 1.",
    "For each t from 1..target: for each n in nums where n<=t: dp[t] += dp[t-n].",
    "If order didn't matter (combinations), you'd swap loops.",
    "O(target * len(nums)) time."
  ],
  test_cases: [
    { inputs: ['[1,2,3]','4'], expected: '7' },
    { inputs: ['[9]','3'], expected: '0' },
    { inputs: ['[1,2,3]','32'], expected: '181997601' },
    { inputs: ['[2,1,3]','4'], expected: '7' },
    { inputs: ['[1]','5'], expected: '1' },
    { inputs: ['[2,4,6,8]','10'], expected: '14' },
    { inputs: ['[3,33,333]','10000'], expected: '0' },
    { inputs: ['[1,2]','3'], expected: '3' },
    { inputs: ['[5,10,25]','30'], expected: '4' },
    { inputs: ['[1,2,3,4]','4'], expected: '8' },
    { inputs: ['[7,14,21]','21'], expected: '4' },
    { inputs: ['[10]','10'], expected: '1' }
  ],
  editorial_md: `## Intuition
This is "coin change — number of ways" but with a twist: \`(1, 2)\` and \`(2, 1)\` count as two different sequences. That single line — *order matters* — completely changes the loop structure of the DP, so it's the detail to anchor on.

## Approach
Define \`dp[t]\` as the number of ordered ways to make target \`t\` using numbers from \`nums\` (with unlimited reuse). Base case: \`dp[0] = 1\` (the empty sequence). For each target \`t\` from 1 to \`target\`, sum over each \`n\` in \`nums\`:

\`\`\`
for t in 1..target:
    for n in nums:
        if n <= t: dp[t] += dp[t - n]
\`\`\`

Because the outer loop is over \`t\` and the inner over \`nums\`, every ordering of the same multiset is counted separately. If you swap the loops (outer over \`nums\`, inner over \`t\`), you collapse \`(1,2)\` and \`(2,1)\` to one — that's the combinations variant.

## Complexity
- Time: O(target * len(nums)).
- Space: O(target).

## Pitfalls
- Swapping the loops by accident — it silently gives the combinations answer.
- Negative numbers in \`nums\` would let \`dp[t]\` blow up; the problem disallows them.
- The intermediate \`dp[t]\` can overflow 32-bit ints — use Python/JS native numbers or 64-bit in Java/C++.
`,
  solutions: {
    python: `class Solution:
    def combinationSum4(self, nums, target):
        dp = [0]*(target+1); dp[0] = 1
        for t in range(1, target+1):
            for n in nums:
                if n <= t: dp[t] += dp[t-n]
        return dp[target]`,
    javascript: `class Solution {
  combinationSum4(nums, target) {
    const dp = new Array(target+1).fill(0); dp[0] = 1;
    for (let t = 1; t <= target; t++)
      for (const n of nums)
        if (n <= t) dp[t] += dp[t-n];
    return dp[target];
  }
}`,
    java: `class Solution {
    public int combinationSum4(int[] nums, int target) {
        int[] dp = new int[target+1]; dp[0] = 1;
        for (int t = 1; t <= target; t++)
            for (int n : nums)
                if (n <= t) dp[t] += dp[t-n];
        return dp[target];
    }
}`,
    cpp: `class Solution {
public:
    int combinationSum4(vector<int>& nums, int target) {
        vector<unsigned int> dp(target+1, 0); dp[0] = 1;
        for (int t = 1; t <= target; t++)
            for (int n : nums)
                if (n <= t) dp[t] += dp[t-n];
        return (int)dp[target];
    }
};`
  }
});

// 4. word-pattern
patches.push({
  id: 'word-pattern',
  pattern: 'Bijection Hash Map',
  hints: [
    "Split s by spaces. Lengths must match pattern.",
    "Maintain two maps: char→word and word→char.",
    "For each (c, w): if c mapped, must equal w; if w mapped, must equal c.",
    "Else create both mappings. Mismatch anywhere → false.",
    "O(n) time."
  ],
  test_cases: [
    { inputs: ['"abba"','"dog cat cat dog"'], expected: 'true' },
    { inputs: ['"abba"','"dog cat cat fish"'], expected: 'false' },
    { inputs: ['"aaaa"','"dog cat cat dog"'], expected: 'false' },
    { inputs: ['"abba"','"dog dog dog dog"'], expected: 'false' },
    { inputs: ['"a"','"dog"'], expected: 'true' },
    { inputs: ['"ab"','"dog"'], expected: 'false' },
    { inputs: ['"aaa"','"aa aa aa aa"'], expected: 'false' },
    { inputs: ['"abc"','"dog cat fish"'], expected: 'true' },
    { inputs: ['"abc"','"dog cat dog"'], expected: 'false' },
    { inputs: ['"aabb"','"dog dog cat cat"'], expected: 'true' },
    { inputs: ['"abab"','"dog cat dog cat"'], expected: 'true' },
    { inputs: ['"abab"','"dog cat dog fish"'], expected: 'false' }
  ],
  editorial_md: `## Intuition
You need a one-to-one mapping (a bijection) between pattern characters and words. Same letter must always pair with the same word, *and* the same word must always pair with the same letter. A single map is half the check — you also need to forbid two different letters from grabbing the same word.

## Approach
Split \`s\` into \`words\` by spaces. If \`len(words) != len(pattern)\`, return false immediately. Keep two dictionaries:

- \`c2w\`: letter → word
- \`w2c\`: word → letter

Walk in lockstep. For each \`(c, w)\`:

1. If \`c\` already in \`c2w\`, check \`c2w[c] == w\`. If not, return false.
2. Else if \`w\` already in \`w2c\` (with a different letter), return false.
3. Else add both mappings.

If you finish the loop with no conflict, the bijection holds. Return true.

## Complexity
- Time: O(n + m) where n = pattern length and m = total characters in s.
- Space: O(n) for the maps.

## Pitfalls
- Using only one map — \`("ab", "dog dog")\` would falsely succeed.
- Forgetting the length check up front — splitting on spaces and the pattern have to align.
- Splitting by whitespace regex when single spaces are guaranteed is fine but slower.
`,
  solutions: {
    python: `class Solution:
    def wordPattern(self, pattern, s):
        words = s.split(' ')
        if len(words) != len(pattern): return False
        c2w, w2c = {}, {}
        for c, w in zip(pattern, words):
            if c in c2w:
                if c2w[c] != w: return False
            elif w in w2c:
                return False
            else:
                c2w[c] = w; w2c[w] = c
        return True`,
    javascript: `class Solution {
  wordPattern(pattern, s) {
    const words = s.split(' ');
    if (words.length !== pattern.length) return false;
    const c2w = new Map(), w2c = new Map();
    for (let i = 0; i < pattern.length; i++) {
      const c = pattern[i], w = words[i];
      if (c2w.has(c)) { if (c2w.get(c) !== w) return false; }
      else if (w2c.has(w)) return false;
      else { c2w.set(c, w); w2c.set(w, c); }
    }
    return true;
  }
}`,
    java: `class Solution {
    public boolean wordPattern(String pattern, String s) {
        String[] words = s.split(" ");
        if (words.length != pattern.length()) return false;
        java.util.Map<Character,String> c2w = new java.util.HashMap<>();
        java.util.Map<String,Character> w2c = new java.util.HashMap<>();
        for (int i = 0; i < pattern.length(); i++) {
            char c = pattern.charAt(i); String w = words[i];
            if (c2w.containsKey(c)) { if (!c2w.get(c).equals(w)) return false; }
            else if (w2c.containsKey(w)) return false;
            else { c2w.put(c, w); w2c.put(w, c); }
        }
        return true;
    }
}`,
    cpp: `class Solution {
public:
    bool wordPattern(string pattern, string s) {
        vector<string> words; string cur;
        for (char c : s) { if (c == ' ') { words.push_back(cur); cur.clear(); } else cur.push_back(c); }
        words.push_back(cur);
        if (words.size() != pattern.size()) return false;
        unordered_map<char,string> c2w; unordered_map<string,char> w2c;
        for (size_t i = 0; i < pattern.size(); i++) {
            char c = pattern[i]; string& w = words[i];
            if (c2w.count(c)) { if (c2w[c] != w) return false; }
            else if (w2c.count(w)) return false;
            else { c2w[c] = w; w2c[w] = c; }
        }
        return true;
    }
};`
  }
});

// 5. detect-capital
patches.push({
  id: 'detect-capital',
  pattern: 'String Scan',
  hints: [
    "Three valid forms: all upper, all lower, or first upper + rest lower.",
    "Count uppercase letters: must be 0, len(word), or 1 (with index 0).",
    "Or use built-ins: word.isupper(), word.islower(), word.istitle()."
  ],
  test_cases: [
    { inputs: ['"USA"'], expected: 'true' },
    { inputs: ['"FlaG"'], expected: 'false' },
    { inputs: ['"leetcode"'], expected: 'true' },
    { inputs: ['"Google"'], expected: 'true' },
    { inputs: ['"g"'], expected: 'true' },
    { inputs: ['"G"'], expected: 'true' },
    { inputs: ['"mL"'], expected: 'false' },
    { inputs: ['"ABCD"'], expected: 'true' },
    { inputs: ['"abcd"'], expected: 'true' },
    { inputs: ['"Abcd"'], expected: 'true' },
    { inputs: ['"aBCD"'], expected: 'false' },
    { inputs: ['"ABCDe"'], expected: 'false' }
  ],
  editorial_md: `## Intuition
Only three patterns are accepted: ALLCAPS, alllower, or Capitalized. Count uppercase letters once and the answer falls out: it must be either zero (all lower), the full length (all upper), or exactly one *and* that one must be the first character (capitalized).

## Approach
Walk the string and count uppercase letters into \`upper\`. Then:

- \`upper == 0\` → all lowercase ✓
- \`upper == len(word)\` → all uppercase ✓
- \`upper == 1\` *and* the first character is uppercase → capitalized ✓
- Otherwise → invalid ✗

Single pass, O(1) extra space. As an alternative, most languages ship with helpers: \`word.isupper()\`, \`word.islower()\`, and a "title case" check; combining them yields the same answer with less code.

## Complexity
- Time: O(n) where n = len(word).
- Space: O(1).

## Pitfalls
- For the third case, checking \`upper == 1\` alone is wrong — \`"aBcd"\` would pass. The single uppercase letter must be at index 0.
- Using \`word.istitle()\` in Python works because the word has no spaces.
- Edge case: single character string — both \`isupper\` and \`islower\` handle it without special casing.
`,
  solutions: {
    python: `class Solution:
    def detectCapitalUse(self, word):
        upper = sum(1 for c in word if c.isupper())
        if upper == 0 or upper == len(word): return True
        return upper == 1 and word[0].isupper()`,
    javascript: `class Solution {
  detectCapitalUse(word) {
    let upper = 0;
    for (const c of word) if (c >= 'A' && c <= 'Z') upper++;
    if (upper === 0 || upper === word.length) return true;
    return upper === 1 && word[0] >= 'A' && word[0] <= 'Z';
  }
}`,
    java: `class Solution {
    public boolean detectCapitalUse(String word) {
        int upper = 0;
        for (int i = 0; i < word.length(); i++) if (Character.isUpperCase(word.charAt(i))) upper++;
        if (upper == 0 || upper == word.length()) return true;
        return upper == 1 && Character.isUpperCase(word.charAt(0));
    }
}`,
    cpp: `class Solution {
public:
    bool detectCapitalUse(string word) {
        int upper = 0;
        for (char c : word) if (c >= 'A' && c <= 'Z') upper++;
        if (upper == 0 || upper == (int)word.size()) return true;
        return upper == 1 && word[0] >= 'A' && word[0] <= 'Z';
    }
};`
  }
});

// 6. max-product-three
patches.push({
  id: 'max-product-three',
  pattern: 'Sort / Linear Scan Extremes',
  hints: [
    "Two candidates: top 3 positives, OR two smallest (negative) * largest positive.",
    "Sort and compare nums[-1]*nums[-2]*nums[-3] vs nums[0]*nums[1]*nums[-1].",
    "Or in O(n) track top-3 max and bottom-2 min in one pass.",
    "Watch out for all-negative arrays — top 3 negatives give the answer."
  ],
  test_cases: [
    { inputs: ['[1,2,3]'], expected: '6' },
    { inputs: ['[1,2,3,4]'], expected: '24' },
    { inputs: ['[-1,-2,-3]'], expected: '-6' },
    { inputs: ['[-100,-98,-1,2,3,4]'], expected: '39200' },
    { inputs: ['[1,2,3,-100,-100]'], expected: '30000' },
    { inputs: ['[-1,-2,-3,-4]'], expected: '-6' },
    { inputs: ['[0,0,0]'], expected: '0' },
    { inputs: ['[10,20,30]'], expected: '6000' },
    { inputs: ['[-10,-10,5,2]'], expected: '500' },
    { inputs: ['[1,1,1,1,1]'], expected: '1' },
    { inputs: ['[-5,-4,-3,-2,-1]'], expected: '-6' },
    { inputs: ['[7,8,9,10,11]'], expected: '990' }
  ],
  editorial_md: `## Intuition
The maximum product of three numbers is one of two things:

1. The product of the three largest numbers (when positives dominate).
2. The product of the two smallest (most negative) numbers times the single largest positive (when two big negatives multiply to a big positive).

Anything else is dominated by one of these two configurations.

## Approach
Two clean solutions:

**Sort, O(n log n)**: sort the array; compare \`nums[-1]*nums[-2]*nums[-3]\` and \`nums[0]*nums[1]*nums[-1]\`; return the larger.

**Linear scan, O(n)**: walk once, tracking the three largest values (\`max1 >= max2 >= max3\`) and the two smallest (\`min1 <= min2\`). After the pass return \`max(max1*max2*max3, min1*min2*max1)\`.

The linear version is the version interviewers want — it's the same idea as the sort, just stripped of unnecessary work. An all-negative array is handled correctly: \`max1*max2*max3\` is the least-negative product, while \`min1*min2*max1\` is more negative, so the max picks the right one.

## Complexity
- Sort: O(n log n) time, O(1) extra space.
- Linear scan: O(n) time, O(1) space.

## Pitfalls
- Only multiplying the top three — fails on \`[-100,-100,1,2,3]\`.
- Comparing with \`>=\` vs \`>\` when updating the tracker variables — get it wrong and \`max3\` stays at -inf when duplicates show up.
- 32-bit overflow in C++ / Java when values are near 1000 — three multiplications can exceed int; the LC constraints fit in int but use long if unsure.
`,
  solutions: {
    python: `class Solution:
    def maximumProduct(self, nums):
        max1=max2=max3=float('-inf'); min1=min2=float('inf')
        for x in nums:
            if x >= max1: max3=max2; max2=max1; max1=x
            elif x >= max2: max3=max2; max2=x
            elif x > max3: max3=x
            if x <= min1: min2=min1; min1=x
            elif x < min2: min2=x
        return max(max1*max2*max3, min1*min2*max1)`,
    javascript: `class Solution {
  maximumProduct(nums) {
    let max1=-Infinity, max2=-Infinity, max3=-Infinity, min1=Infinity, min2=Infinity;
    for (const x of nums) {
      if (x >= max1) { max3=max2; max2=max1; max1=x; }
      else if (x >= max2) { max3=max2; max2=x; }
      else if (x > max3) { max3=x; }
      if (x <= min1) { min2=min1; min1=x; }
      else if (x < min2) { min2=x; }
    }
    return Math.max(max1*max2*max3, min1*min2*max1);
  }
}`,
    java: `class Solution {
    public int maximumProduct(int[] nums) {
        long max1=Long.MIN_VALUE,max2=Long.MIN_VALUE,max3=Long.MIN_VALUE;
        long min1=Long.MAX_VALUE,min2=Long.MAX_VALUE;
        for (int x : nums) {
            if (x >= max1) { max3=max2; max2=max1; max1=x; }
            else if (x >= max2) { max3=max2; max2=x; }
            else if (x > max3) { max3=x; }
            if (x <= min1) { min2=min1; min1=x; }
            else if (x < min2) { min2=x; }
        }
        return (int)Math.max(max1*max2*max3, min1*min2*max1);
    }
}`,
    cpp: `class Solution {
public:
    int maximumProduct(vector<int>& nums) {
        long long max1=LLONG_MIN,max2=LLONG_MIN,max3=LLONG_MIN;
        long long min1=LLONG_MAX,min2=LLONG_MAX;
        for (int x : nums) {
            if (x >= max1) { max3=max2; max2=max1; max1=x; }
            else if (x >= max2) { max3=max2; max2=x; }
            else if (x > max3) { max3=x; }
            if (x <= min1) { min2=min1; min1=x; }
            else if (x < min2) { min2=x; }
        }
        return (int)max(max1*max2*max3, min1*min2*max1);
    }
};`
  }
});

const existing = fs.existsSync('/tmp/patch-w3-400-01.json') ? JSON.parse(fs.readFileSync('/tmp/patch-w3-400-01.json','utf8')) : [];
const ids = new Set(patches.map(p => p.id));
const merged = [...existing.filter(p => !ids.has(p.id)), ...patches];
fs.writeFileSync('/tmp/patch-w3-400-01.json', JSON.stringify(merged, null, 2));
console.log(`Wrote ${patches.length} patches. Total in file: ${merged.length}`);
