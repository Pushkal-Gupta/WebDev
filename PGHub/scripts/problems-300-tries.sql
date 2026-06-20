-- Grow catalog 200 → 300: tries topic (+8 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'camelcase-matching','number-of-matching-subsequences','maximum-xor-of-two-numbers',
  'extra-characters-in-string','sum-of-prefix-scores','longest-word-in-dictionary',
  'word-break-ii','concatenated-words'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'camelcase-matching','number-of-matching-subsequences','maximum-xor-of-two-numbers',
  'extra-characters-in-string','sum-of-prefix-scores','longest-word-in-dictionary',
  'word-break-ii','concatenated-words'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'camelcase-matching','number-of-matching-subsequences','maximum-xor-of-two-numbers',
  'extra-characters-in-string','sum-of-prefix-scores','longest-word-in-dictionary',
  'word-break-ii','concatenated-words'
);

-- ============================================================
-- 1) camelcase-matching (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('camelcase-matching', 'tries', 'Camelcase Matching', 'Medium',
$$<p>You are given a list of <code>queries</code> and a <code>pattern</code>. A query matches the pattern if you can insert lowercase English letters into the pattern so that it equals the query — the existing letters must appear in order, and any inserted letters must be lowercase. Return an array of booleans, one per query.</p>$$,
'', ARRAY[
  'Scan query and pattern with two pointers. Skip lowercase letters in the query freely; every uppercase letter in the query MUST match the current pattern character.',
  'If a query char matches pattern[j], advance j; otherwise the char must be lowercase.',
  'At the end, j must equal len(pattern) for a match.'
], '300', 'https://leetcode.com/problems/camelcase-matching/',
'camelMatch',
'[{"name":"queries","type":"List[str]"},{"name":"pattern","type":"str"}]'::jsonb,
'List[bool]',
'[
  {"inputs":["[\"FooBar\",\"FooBarTest\",\"FootBall\",\"FrameBuffer\",\"ForceFeedBack\"]","\"FB\""],"expected":"[true,false,true,true,false]"},
  {"inputs":["[\"FooBar\",\"FooBarTest\",\"FootBall\",\"FrameBuffer\",\"ForceFeedBack\"]","\"FoBa\""],"expected":"[true,false,true,false,false]"},
  {"inputs":["[\"FooBar\",\"FooBarTest\",\"FootBall\",\"FrameBuffer\",\"ForceFeedBack\"]","\"FoBaT\""],"expected":"[false,true,false,false,false]"},
  {"inputs":["[\"test\",\"TestT\",\"Test\"]","\"T\""],"expected":"[false,false,true]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('camelcase-matching', 'python',
$PY$class Solution:
    def camelMatch(self, queries: List[str], pattern: str) -> List[bool]:
        $PY$),
('camelcase-matching', 'javascript',
$JS$/**
 * @param {string[]} queries
 * @param {string} pattern
 * @return {boolean[]}
 */
var camelMatch = function(queries, pattern) {

};$JS$),
('camelcase-matching', 'java',
$JAVA$class Solution {
    public List<Boolean> camelMatch(String[] queries, String pattern) {

    }
}$JAVA$),
('camelcase-matching', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<bool> camelMatch(vector<string>& queries, string& pattern) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('camelcase-matching', 1, 'Two-Pointer Subsequence Check',
'Walking the query and the pattern in lockstep, lowercase letters in the query are "free" (they can be considered inserted), but every uppercase letter in the query must be consumed by the pattern. If we finish the query with the pattern fully consumed, it matches.',
'["For each query, set j = 0.","Walk each char c in query: if j < len(pattern) and c == pattern[j], advance j.","Else if c is uppercase, mark as mismatch.","At the end, the query matches iff j == len(pattern) and no mismatch was raised."]'::jsonb,
$PY$class Solution:
    def camelMatch(self, queries: List[str], pattern: str) -> List[bool]:
        result = []
        for q in queries:
            j = 0
            ok = True
            for c in q:
                if j < len(pattern) and c == pattern[j]:
                    j += 1
                elif c.isupper():
                    ok = False
                    break
            result.append(ok and j == len(pattern))
        return result
$PY$,
$JS$var camelMatch = function(queries, pattern) {
    const result = [];
    for (const q of queries) {
        let j = 0, ok = true;
        for (const c of q) {
            if (j < pattern.length && c === pattern[j]) j++;
            else if (c >= 'A' && c <= 'Z') { ok = false; break; }
        }
        result.push(ok && j === pattern.length);
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<Boolean> camelMatch(String[] queries, String pattern) {
        List<Boolean> result = new ArrayList<>();
        for (String q : queries) {
            int j = 0;
            boolean ok = true;
            for (int i = 0; i < q.length(); i++) {
                char c = q.charAt(i);
                if (j < pattern.length() && c == pattern.charAt(j)) j++;
                else if (Character.isUpperCase(c)) { ok = false; break; }
            }
            result.add(ok && j == pattern.length());
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<bool> camelMatch(vector<string>& queries, string& pattern) {
        vector<bool> result;
        for (const string& q : queries) {
            int j = 0;
            bool ok = true;
            for (char c : q) {
                if (j < (int)pattern.size() && c == pattern[j]) j++;
                else if (isupper((unsigned char)c)) { ok = false; break; }
            }
            result.push_back(ok && j == (int)pattern.size());
        }
        return result;
    }
};
$CPP$,
'O(sum of query lengths)', 'O(1) extra');

-- ============================================================
-- 2) number-of-matching-subsequences (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('number-of-matching-subsequences', 'tries', 'Number of Matching Subsequences', 'Medium',
$$<p>Given a string <code>s</code> and a list of words <code>words</code>, return the number of words that are subsequences of <code>s</code>.</p>$$,
'', ARRAY[
  'Naive O(|s| * sum(|words|)) is too slow. Group pending words by the character they are waiting on.',
  'Walk s from left to right. When at character c, every word waiting on c advances one character; if advanced past the end it counts as a match, otherwise it re-queues on its new next character.',
  'The total work is O(|s| + sum(|words|)) because each character in each word is touched exactly once.'
], '300', 'https://leetcode.com/problems/number-of-matching-subsequences/',
'numMatchingSubseq',
'[{"name":"s","type":"str"},{"name":"words","type":"List[str]"}]'::jsonb,
'int',
'[
  {"inputs":["\"abcde\"","[\"a\",\"bb\",\"acd\",\"ace\"]"],"expected":"3"},
  {"inputs":["\"dsahjpjauf\"","[\"ahjpjau\",\"ja\",\"ahbwzgqnuk\",\"tnmlanowax\"]"],"expected":"2"},
  {"inputs":["\"abc\"","[\"\",\"ab\",\"abc\",\"abcd\"]"],"expected":"4"},
  {"inputs":["\"z\"","[\"a\",\"b\"]"],"expected":"0"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('number-of-matching-subsequences', 'python',
$PY$class Solution:
    def numMatchingSubseq(self, s: str, words: List[str]) -> int:
        $PY$),
('number-of-matching-subsequences', 'javascript',
$JS$/**
 * @param {string} s
 * @param {string[]} words
 * @return {number}
 */
var numMatchingSubseq = function(s, words) {

};$JS$),
('number-of-matching-subsequences', 'java',
$JAVA$class Solution {
    public int numMatchingSubseq(String s, String[] words) {

    }
}$JAVA$),
('number-of-matching-subsequences', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numMatchingSubseq(string& s, vector<string>& words) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('number-of-matching-subsequences', 1, 'Buckets By Waiting Character',
'Place every word in a bucket indexed by the character it currently needs. Stream s character by character: when we see c, take every word in bucket[c], advance it one character, and either count it as matched or move it to its new bucket. Each character of each word moves buckets at most once.',
'["Initialize 26 buckets (lists of (word, index) pairs). Push every word with index 0 into bucket[word[0]]. (Words with length 0 match trivially.)","For each char c in s: swap out bucket[c] to a local list; for each (word, i): if i + 1 == len(word), count as matched; else push (word, i + 1) into bucket[word[i + 1]].","Return the total count."]'::jsonb,
$PY$class Solution:
    def numMatchingSubseq(self, s: str, words: List[str]) -> int:
        from collections import defaultdict
        buckets = defaultdict(list)
        matched = 0
        for w in words:
            if not w:
                matched += 1
            else:
                buckets[w[0]].append((w, 0))
        for c in s:
            if c not in buckets:
                continue
            current = buckets.pop(c)
            for w, i in current:
                if i + 1 == len(w):
                    matched += 1
                else:
                    buckets[w[i + 1]].append((w, i + 1))
        return matched
$PY$,
$JS$var numMatchingSubseq = function(s, words) {
    const buckets = new Map();
    let matched = 0;
    for (const w of words) {
        if (w.length === 0) matched++;
        else {
            if (!buckets.has(w[0])) buckets.set(w[0], []);
            buckets.get(w[0]).push([w, 0]);
        }
    }
    for (const c of s) {
        if (!buckets.has(c)) continue;
        const current = buckets.get(c);
        buckets.delete(c);
        for (const [w, i] of current) {
            if (i + 1 === w.length) matched++;
            else {
                if (!buckets.has(w[i + 1])) buckets.set(w[i + 1], []);
                buckets.get(w[i + 1]).push([w, i + 1]);
            }
        }
    }
    return matched;
};
$JS$,
$JAVA$class Solution {
    public int numMatchingSubseq(String s, String[] words) {
        List<int[]>[] buckets = new List[26];
        for (int i = 0; i < 26; i++) buckets[i] = new ArrayList<>();
        int matched = 0;
        for (int wi = 0; wi < words.length; wi++) {
            String w = words[wi];
            if (w.isEmpty()) matched++;
            else buckets[w.charAt(0) - 'a'].add(new int[]{wi, 0});
        }
        for (int k = 0; k < s.length(); k++) {
            char c = s.charAt(k);
            List<int[]> current = buckets[c - 'a'];
            buckets[c - 'a'] = new ArrayList<>();
            for (int[] entry : current) {
                int wi = entry[0], i = entry[1];
                String w = words[wi];
                if (i + 1 == w.length()) matched++;
                else buckets[w.charAt(i + 1) - 'a'].add(new int[]{wi, i + 1});
            }
        }
        return matched;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int numMatchingSubseq(string& s, vector<string>& words) {
        vector<vector<pair<int,int>>> buckets(26);
        int matched = 0;
        for (int wi = 0; wi < (int)words.size(); wi++) {
            const string& w = words[wi];
            if (w.empty()) matched++;
            else buckets[w[0] - 'a'].push_back({wi, 0});
        }
        for (char c : s) {
            vector<pair<int,int>> current = move(buckets[c - 'a']);
            buckets[c - 'a'].clear();
            for (auto& [wi, i] : current) {
                const string& w = words[wi];
                if (i + 1 == (int)w.size()) matched++;
                else buckets[w[i + 1] - 'a'].push_back({wi, i + 1});
            }
        }
        return matched;
    }
};
$CPP$,
'O(|s| + sum(|words|))', 'O(sum(|words|))');

-- ============================================================
-- 3) maximum-xor-of-two-numbers (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('maximum-xor-of-two-numbers', 'tries', 'Maximum XOR of Two Numbers in an Array', 'Medium',
$$<p>Given a non-negative integer array <code>nums</code>, return the maximum value of <code>nums[i] XOR nums[j]</code> over all <code>i, j</code>.</p>$$,
'', ARRAY[
  'Insert every number into a binary trie bit-by-bit from the most significant bit down.',
  'For each number n, walk the trie choosing the OPPOSITE bit at every level if possible — that maximizes the XOR.',
  'The highest possible XOR over the set is the maximum across all such greedy walks.'
], '300', 'https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/',
'findMaximumXOR',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["[3,10,5,25,2,8]"],"expected":"28"},
  {"inputs":["[0]"],"expected":"0"},
  {"inputs":["[2,4]"],"expected":"6"},
  {"inputs":["[14,70,53,83,49,91,36,80,92,51,66,70]"],"expected":"127"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('maximum-xor-of-two-numbers', 'python',
$PY$class Solution:
    def findMaximumXOR(self, nums: List[int]) -> int:
        $PY$),
('maximum-xor-of-two-numbers', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @return {number}
 */
var findMaximumXOR = function(nums) {

};$JS$),
('maximum-xor-of-two-numbers', 'java',
$JAVA$class Solution {
    public int findMaximumXOR(int[] nums) {

    }
}$JAVA$),
('maximum-xor-of-two-numbers', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findMaximumXOR(vector<int>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('maximum-xor-of-two-numbers', 1, 'Bit Trie Greedy',
'Treat each number as a 32-bit string and insert it into a binary trie. For any query n, the XOR is maximized by picking the opposite bit at each level of the trie (starting from the MSB) when such a branch exists. Running that query for every number gives the global max.',
'["Build a trie where each node has at most two children (0 and 1). Insert every number bit by bit, MSB first.","For each number n, walk the trie greedily: at bit b, prefer the child !b (which contributes 1 << i to the XOR) if present; otherwise follow b. Accumulate the bits chosen.","Track the max XOR across all queries and return it."]'::jsonb,
$PY$class Solution:
    def findMaximumXOR(self, nums: List[int]) -> int:
        root = {}
        for n in nums:
            node = root
            for i in range(31, -1, -1):
                b = (n >> i) & 1
                if b not in node:
                    node[b] = {}
                node = node[b]
        best = 0
        for n in nums:
            node = root
            x = 0
            for i in range(31, -1, -1):
                b = (n >> i) & 1
                opp = 1 - b
                if opp in node:
                    x |= 1 << i
                    node = node[opp]
                else:
                    node = node[b]
            if x > best:
                best = x
        return best
$PY$,
$JS$var findMaximumXOR = function(nums) {
    const root = {};
    for (const n of nums) {
        let node = root;
        for (let i = 31; i >= 0; i--) {
            const b = (n >> i) & 1;
            if (!(b in node)) node[b] = {};
            node = node[b];
        }
    }
    let best = 0;
    for (const n of nums) {
        let node = root, x = 0;
        for (let i = 31; i >= 0; i--) {
            const b = (n >> i) & 1;
            const opp = 1 - b;
            if (opp in node) { x |= (1 << i); node = node[opp]; }
            else node = node[b];
        }
        if (x > best) best = x;
    }
    return best;
};
$JS$,
$JAVA$class Solution {
    static class Node { Node[] c = new Node[2]; }
    public int findMaximumXOR(int[] nums) {
        Node root = new Node();
        for (int n : nums) {
            Node node = root;
            for (int i = 31; i >= 0; i--) {
                int b = (n >> i) & 1;
                if (node.c[b] == null) node.c[b] = new Node();
                node = node.c[b];
            }
        }
        int best = 0;
        for (int n : nums) {
            Node node = root;
            int x = 0;
            for (int i = 31; i >= 0; i--) {
                int b = (n >> i) & 1;
                int opp = 1 - b;
                if (node.c[opp] != null) { x |= (1 << i); node = node.c[opp]; }
                else node = node.c[b];
            }
            if (x > best) best = x;
        }
        return best;
    }
}
$JAVA$,
$CPP$class Solution {
    struct Node { Node* c[2] = {nullptr, nullptr}; };
public:
    int findMaximumXOR(vector<int>& nums) {
        Node root;
        for (int n : nums) {
            Node* node = &root;
            for (int i = 31; i >= 0; i--) {
                int b = (n >> i) & 1;
                if (!node->c[b]) node->c[b] = new Node();
                node = node->c[b];
            }
        }
        int best = 0;
        for (int n : nums) {
            Node* node = &root;
            int x = 0;
            for (int i = 31; i >= 0; i--) {
                int b = (n >> i) & 1;
                int opp = 1 - b;
                if (node->c[opp]) { x |= (1 << i); node = node->c[opp]; }
                else node = node->c[b];
            }
            if (x > best) best = x;
        }
        return best;
    }
};
$CPP$,
'O(n * 32)', 'O(n * 32)');

-- ============================================================
-- 4) extra-characters-in-string (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('extra-characters-in-string', 'tries', 'Extra Characters in a String', 'Medium',
$$<p>You are given a 0-indexed string <code>s</code> and a dictionary of words <code>dictionary</code>. Partition <code>s</code> into non-overlapping substrings so each substring is in the dictionary — with the minimum number of extra characters left over. Return the minimum extra characters.</p>$$,
'', ARRAY[
  'Let dp[i] = minimum extras in s[i..end]. Base case: dp[n] = 0.',
  'Transition at position i: either s[i] is extra (1 + dp[i + 1]) or s[i..j-1] is a dictionary word (dp[j]); take the minimum.',
  'A trie over the dictionary makes the inner "walk forward from i" step O(match length) and avoids hashing full substrings.'
], '300', 'https://leetcode.com/problems/extra-characters-in-a-string/',
'minExtraChar',
'[{"name":"s","type":"str"},{"name":"dictionary","type":"List[str]"}]'::jsonb,
'int',
'[
  {"inputs":["\"leetscode\"","[\"leet\",\"code\",\"leetcode\"]"],"expected":"1"},
  {"inputs":["\"sayhelloworld\"","[\"hello\",\"world\"]"],"expected":"3"},
  {"inputs":["\"abc\"","[\"a\",\"b\",\"c\"]"],"expected":"0"},
  {"inputs":["\"xyz\"","[\"a\"]"],"expected":"3"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('extra-characters-in-string', 'python',
$PY$class Solution:
    def minExtraChar(self, s: str, dictionary: List[str]) -> int:
        $PY$),
('extra-characters-in-string', 'javascript',
$JS$/**
 * @param {string} s
 * @param {string[]} dictionary
 * @return {number}
 */
var minExtraChar = function(s, dictionary) {

};$JS$),
('extra-characters-in-string', 'java',
$JAVA$class Solution {
    public int minExtraChar(String s, String[] dictionary) {

    }
}$JAVA$),
('extra-characters-in-string', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minExtraChar(string& s, vector<string>& dictionary) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('extra-characters-in-string', 1, 'Suffix DP + Word Set',
'Working back-to-front, dp[i] is the optimal number of extra characters in s[i:]. Either position i is extra (1 + dp[i+1]) or some substring s[i:j] is a dictionary word (dp[j]). A hash set of the dictionary keeps the inner check O(L) for each candidate end j.',
'["Let n = len(s). Allocate dp of length n + 1 with dp[n] = 0.","Put the dictionary into a set for O(1) membership.","For i from n - 1 down to 0: initialize dp[i] = 1 + dp[i + 1] (treat s[i] as extra).","For every j in i + 1..n, if s[i:j] is in the set, relax dp[i] = min(dp[i], dp[j]).","Return dp[0]."]'::jsonb,
$PY$class Solution:
    def minExtraChar(self, s: str, dictionary: List[str]) -> int:
        words = set(dictionary)
        n = len(s)
        dp = [0] * (n + 1)
        for i in range(n - 1, -1, -1):
            dp[i] = 1 + dp[i + 1]
            for j in range(i + 1, n + 1):
                if s[i:j] in words:
                    dp[i] = min(dp[i], dp[j])
        return dp[0]
$PY$,
$JS$var minExtraChar = function(s, dictionary) {
    const words = new Set(dictionary);
    const n = s.length;
    const dp = new Array(n + 1).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        dp[i] = 1 + dp[i + 1];
        for (let j = i + 1; j <= n; j++) {
            if (words.has(s.slice(i, j))) dp[i] = Math.min(dp[i], dp[j]);
        }
    }
    return dp[0];
};
$JS$,
$JAVA$class Solution {
    public int minExtraChar(String s, String[] dictionary) {
        Set<String> words = new HashSet<>(Arrays.asList(dictionary));
        int n = s.length();
        int[] dp = new int[n + 1];
        for (int i = n - 1; i >= 0; i--) {
            dp[i] = 1 + dp[i + 1];
            for (int j = i + 1; j <= n; j++) {
                if (words.contains(s.substring(i, j))) dp[i] = Math.min(dp[i], dp[j]);
            }
        }
        return dp[0];
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minExtraChar(string& s, vector<string>& dictionary) {
        unordered_set<string> words(dictionary.begin(), dictionary.end());
        int n = s.size();
        vector<int> dp(n + 1, 0);
        for (int i = n - 1; i >= 0; i--) {
            dp[i] = 1 + dp[i + 1];
            for (int j = i + 1; j <= n; j++) {
                if (words.count(s.substr(i, j - i))) dp[i] = min(dp[i], dp[j]);
            }
        }
        return dp[0];
    }
};
$CPP$,
'O(n^2 * L)', 'O(n + total dict chars)');

-- ============================================================
-- 5) sum-of-prefix-scores (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('sum-of-prefix-scores', 'tries', 'Sum of Prefix Scores of Strings', 'Medium',
$$<p>Define the score of a string as the number of words in <code>words</code> that share any non-empty prefix with it. For each word in <code>words</code>, return the sum of scores of all its non-empty prefixes.</p>$$,
'', ARRAY[
  'Insert every word into a trie and increment a counter at every node along the insertion path.',
  'For each word, walking it through the trie and summing those counters gives exactly the sum of prefix scores.',
  'Time is O(total characters) for both build and query.'
], '300', 'https://leetcode.com/problems/sum-of-prefix-scores-of-strings/',
'sumPrefixScores',
'[{"name":"words","type":"List[str]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[\"abc\",\"ab\",\"bc\",\"b\"]"],"expected":"[5,4,3,2]"},
  {"inputs":["[\"abcd\"]"],"expected":"[4]"},
  {"inputs":["[\"a\",\"a\",\"a\"]"],"expected":"[3,3,3]"},
  {"inputs":["[\"abc\",\"abcd\",\"abcde\"]"],"expected":"[3,6,8]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('sum-of-prefix-scores', 'python',
$PY$class Solution:
    def sumPrefixScores(self, words: List[str]) -> List[int]:
        $PY$),
('sum-of-prefix-scores', 'javascript',
$JS$/**
 * @param {string[]} words
 * @return {number[]}
 */
var sumPrefixScores = function(words) {

};$JS$),
('sum-of-prefix-scores', 'java',
$JAVA$class Solution {
    public int[] sumPrefixScores(String[] words) {

    }
}$JAVA$),
('sum-of-prefix-scores', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> sumPrefixScores(vector<string>& words) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('sum-of-prefix-scores', 1, 'Trie With Visit Counts',
'Each trie node records how many words pass through it during insertion — exactly the number of words that share that prefix. The answer for word w is the sum of counts on the path from root to the leaf corresponding to w.',
'["Build a trie. For every word, walk it character-by-character; at each node increment a counter cnt.","For each word, walk it again summing the counters on the path (not including the root).","Return the array of sums."]'::jsonb,
$PY$class Solution:
    def sumPrefixScores(self, words: List[str]) -> List[int]:
        root = {"cnt": 0}
        for w in words:
            node = root
            for ch in w:
                if ch not in node:
                    node[ch] = {"cnt": 0}
                node = node[ch]
                node["cnt"] += 1
        result = []
        for w in words:
            node = root
            total = 0
            for ch in w:
                node = node[ch]
                total += node["cnt"]
            result.append(total)
        return result
$PY$,
$JS$var sumPrefixScores = function(words) {
    const root = { cnt: 0, children: {} };
    for (const w of words) {
        let node = root;
        for (const ch of w) {
            if (!node.children[ch]) node.children[ch] = { cnt: 0, children: {} };
            node = node.children[ch];
            node.cnt++;
        }
    }
    const result = [];
    for (const w of words) {
        let node = root, total = 0;
        for (const ch of w) {
            node = node.children[ch];
            total += node.cnt;
        }
        result.push(total);
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    static class Node { int cnt = 0; Map<Character, Node> children = new HashMap<>(); }
    public int[] sumPrefixScores(String[] words) {
        Node root = new Node();
        for (String w : words) {
            Node node = root;
            for (char ch : w.toCharArray()) {
                node.children.computeIfAbsent(ch, k -> new Node());
                node = node.children.get(ch);
                node.cnt++;
            }
        }
        int[] result = new int[words.length];
        for (int k = 0; k < words.length; k++) {
            Node node = root;
            int total = 0;
            for (char ch : words[k].toCharArray()) {
                node = node.children.get(ch);
                total += node.cnt;
            }
            result[k] = total;
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
    struct Node { int cnt = 0; unordered_map<char, Node*> children; };
public:
    vector<int> sumPrefixScores(vector<string>& words) {
        Node root;
        for (const string& w : words) {
            Node* node = &root;
            for (char ch : w) {
                if (!node->children.count(ch)) node->children[ch] = new Node();
                node = node->children[ch];
                node->cnt++;
            }
        }
        vector<int> result;
        result.reserve(words.size());
        for (const string& w : words) {
            Node* node = &root;
            int total = 0;
            for (char ch : w) {
                node = node->children[ch];
                total += node->cnt;
            }
            result.push_back(total);
        }
        return result;
    }
};
$CPP$,
'O(sum of word lengths)', 'O(sum of word lengths)');

-- ============================================================
-- 6) longest-word-in-dictionary (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('longest-word-in-dictionary', 'tries', 'Longest Word in Dictionary', 'Medium',
$$<p>Given an array <code>words</code> of English words, return the longest word in <code>words</code> that can be built one letter at a time from other words already in <code>words</code>. If multiple such words have the same length, return the lexicographically smallest one.</p>$$,
'', ARRAY[
  'Sort words: shortest first, lexicographic tiebreaker. Then for each word w, w is buildable iff removing the last char still leaves a word in the set.',
  'Equivalent phrasing: insert words into a trie; a word is buildable iff every prefix (length 1..|w|) is itself an inserted word.',
  'Either way, scan all words and pick the buildable one with max length; ties broken by the sort order already placing smaller strings first.'
], '300', 'https://leetcode.com/problems/longest-word-in-dictionary/',
'longestWord',
'[{"name":"words","type":"List[str]"}]'::jsonb,
'str',
'[
  {"inputs":["[\"w\",\"wo\",\"wor\",\"worl\",\"world\"]"],"expected":"\"world\""},
  {"inputs":["[\"a\",\"banana\",\"app\",\"appl\",\"ap\",\"apply\",\"apple\"]"],"expected":"\"apple\""},
  {"inputs":["[\"m\",\"mo\",\"moc\",\"moch\",\"mocha\",\"l\",\"la\",\"lat\",\"latt\",\"latte\"]"],"expected":"\"latte\""},
  {"inputs":["[\"yo\",\"ew\",\"fc\",\"zrc\",\"yodn\",\"fcm\",\"qm\",\"qmo\",\"fcmz\",\"z\",\"ewq\",\"yod\",\"ewqz\",\"y\"]"],"expected":"\"yodn\""}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('longest-word-in-dictionary', 'python',
$PY$class Solution:
    def longestWord(self, words: List[str]) -> str:
        $PY$),
('longest-word-in-dictionary', 'javascript',
$JS$/**
 * @param {string[]} words
 * @return {string}
 */
var longestWord = function(words) {

};$JS$),
('longest-word-in-dictionary', 'java',
$JAVA$class Solution {
    public String longestWord(String[] words) {

    }
}$JAVA$),
('longest-word-in-dictionary', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string longestWord(vector<string>& words) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('longest-word-in-dictionary', 1, 'Sort + Build Set',
'Sorting lexicographically and then by length lets us grow a "buildable" set of valid prefixes. A word is buildable iff its prefix of length |w| - 1 is already in the set. Because we process shorter-and-earlier words first, we never miss a prerequisite.',
'["Sort words ascending (string comparison handles both lex order and length tiebreak).","Initialize built = {\"\"} and answer = \"\".","For each w in sorted order: if w[:-1] in built, insert w into built; update answer if len(w) > len(answer).","Return answer."]'::jsonb,
$PY$class Solution:
    def longestWord(self, words: List[str]) -> str:
        words.sort()
        built = {""}
        answer = ""
        for w in words:
            if w[:-1] in built:
                built.add(w)
                if len(w) > len(answer):
                    answer = w
        return answer
$PY$,
$JS$var longestWord = function(words) {
    words.sort();
    const built = new Set([""]);
    let answer = "";
    for (const w of words) {
        if (built.has(w.slice(0, -1))) {
            built.add(w);
            if (w.length > answer.length) answer = w;
        }
    }
    return answer;
};
$JS$,
$JAVA$class Solution {
    public String longestWord(String[] words) {
        Arrays.sort(words);
        Set<String> built = new HashSet<>();
        built.add("");
        String answer = "";
        for (String w : words) {
            if (built.contains(w.substring(0, w.length() - 1))) {
                built.add(w);
                if (w.length() > answer.length()) answer = w;
            }
        }
        return answer;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    string longestWord(vector<string>& words) {
        sort(words.begin(), words.end());
        unordered_set<string> built = {""};
        string answer;
        for (const string& w : words) {
            if (built.count(w.substr(0, w.size() - 1))) {
                built.insert(w);
                if (w.size() > answer.size()) answer = w;
            }
        }
        return answer;
    }
};
$CPP$,
'O(n log n + sum word lengths)', 'O(sum word lengths)');

-- ============================================================
-- 7) word-break-ii (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('word-break-ii', 'tries', 'Word Break II', 'Hard',
$$<p>Given a string <code>s</code> and a dictionary <code>wordDict</code>, return all possible sentences you can form by adding spaces in <code>s</code> so each resulting word is in the dictionary. Words may be reused. Return the sentences in any order.</p>$$,
'', ARRAY[
  'Memoize from each suffix s[i:] the list of sentences it can produce.',
  'For each i, try every word that matches starting at i (a trie or word-set plus prefix scan works); recurse on the remainder.',
  'Concatenate the current word with each recursive result, separated by a space.'
], '300', 'https://leetcode.com/problems/word-break-ii/',
'wordBreak',
'[{"name":"s","type":"str"},{"name":"wordDict","type":"List[str]"}]'::jsonb,
'List[str]',
'[
  {"inputs":["\"catsanddog\"","[\"cat\",\"cats\",\"and\",\"sand\",\"dog\"]"],"expected":"[\"cats and dog\",\"cat sand dog\"]"},
  {"inputs":["\"pineapplepenapple\"","[\"apple\",\"pen\",\"applepen\",\"pine\",\"pineapple\"]"],"expected":"[\"pine apple pen apple\",\"pine applepen apple\",\"pineapple pen apple\"]"},
  {"inputs":["\"catsandog\"","[\"cats\",\"dog\",\"sand\",\"and\",\"cat\"]"],"expected":"[]"},
  {"inputs":["\"a\"","[\"a\"]"],"expected":"[\"a\"]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('word-break-ii', 'python',
$PY$class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> List[str]:
        $PY$),
('word-break-ii', 'javascript',
$JS$/**
 * @param {string} s
 * @param {string[]} wordDict
 * @return {string[]}
 */
var wordBreak = function(s, wordDict) {

};$JS$),
('word-break-ii', 'java',
$JAVA$class Solution {
    public List<String> wordBreak(String s, List<String> wordDict) {

    }
}$JAVA$),
('word-break-ii', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> wordBreak(string& s, vector<string>& wordDict) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('word-break-ii', 1, 'Suffix DFS with Memoization',
'For each suffix starting at index i, the set of sentences equals the union over every word w in the dictionary with s[i:i+|w|] == w: w prepended to each sentence produced from the remaining suffix s[i+|w|:]. Memoize per i to avoid exponential re-exploration of shared suffixes.',
'["Put the dictionary into a set for O(|w|) match checks.","Define dfs(i) returning the list of sentences for s[i:]. Base: dfs(len(s)) = [\"\"].","For each w in wordDict: if s starts with w at i, recurse dfs(i + |w|) and either set result to [w] or join w with a space before each sub-sentence.","Return memo[0]."]'::jsonb,
$PY$class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> List[str]:
        words = set(wordDict)
        memo = {}
        n = len(s)
        def dfs(i):
            if i in memo:
                return memo[i]
            if i == n:
                return [""]
            result = []
            for j in range(i + 1, n + 1):
                if s[i:j] in words:
                    for tail in dfs(j):
                        result.append(s[i:j] if tail == "" else s[i:j] + " " + tail)
            memo[i] = result
            return result
        return dfs(0)
$PY$,
$JS$var wordBreak = function(s, wordDict) {
    const words = new Set(wordDict);
    const n = s.length;
    const memo = new Map();
    const dfs = (i) => {
        if (memo.has(i)) return memo.get(i);
        if (i === n) return [""];
        const result = [];
        for (let j = i + 1; j <= n; j++) {
            const prefix = s.slice(i, j);
            if (words.has(prefix)) {
                for (const tail of dfs(j)) {
                    result.push(tail === "" ? prefix : prefix + " " + tail);
                }
            }
        }
        memo.set(i, result);
        return result;
    };
    return dfs(0);
};
$JS$,
$JAVA$class Solution {
    public List<String> wordBreak(String s, List<String> wordDict) {
        Set<String> words = new HashSet<>(wordDict);
        Map<Integer, List<String>> memo = new HashMap<>();
        return dfs(s, 0, words, memo);
    }
    private List<String> dfs(String s, int i, Set<String> words, Map<Integer, List<String>> memo) {
        if (memo.containsKey(i)) return memo.get(i);
        List<String> result = new ArrayList<>();
        if (i == s.length()) { result.add(""); return result; }
        for (int j = i + 1; j <= s.length(); j++) {
            String prefix = s.substring(i, j);
            if (words.contains(prefix)) {
                for (String tail : dfs(s, j, words, memo)) {
                    result.add(tail.isEmpty() ? prefix : prefix + " " + tail);
                }
            }
        }
        memo.put(i, result);
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
    unordered_map<int, vector<string>> memo;
    unordered_set<string> words;
    string* src;
    vector<string>& dfs(int i) {
        auto it = memo.find(i);
        if (it != memo.end()) return it->second;
        vector<string>& result = memo[i];
        if (i == (int)src->size()) { result.push_back(""); return result; }
        for (int j = i + 1; j <= (int)src->size(); j++) {
            string prefix = src->substr(i, j - i);
            if (words.count(prefix)) {
                for (const string& tail : dfs(j)) {
                    result.push_back(tail.empty() ? prefix : prefix + " " + tail);
                }
            }
        }
        return result;
    }
public:
    vector<string> wordBreak(string& s, vector<string>& wordDict) {
        words = unordered_set<string>(wordDict.begin(), wordDict.end());
        src = &s;
        memo.clear();
        return dfs(0);
    }
};
$CPP$,
'O(n^2 * #sentences)', 'O(n + total dict chars)');

-- ============================================================
-- 8) concatenated-words (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('concatenated-words', 'tries', 'Concatenated Words', 'Hard',
$$<p>Given an array of distinct strings <code>words</code>, return all concatenated words. A concatenated word is a string entirely made of at least two shorter words from the same array.</p>$$,
'', ARRAY[
  'Put every word into a set (call it D). A word w is concatenated iff it can be split into >= 2 pieces all in D.',
  'Run Word Break on each word against D - {w} (exclude the word itself so it does not match as a single piece).',
  'Sort by length ascending so the DP over each word only references shorter words — then you can reuse a fast set lookup.'
], '300', 'https://leetcode.com/problems/concatenated-words/',
'findAllConcatenatedWordsInADict',
'[{"name":"words","type":"List[str]"}]'::jsonb,
'List[str]',
'[
  {"inputs":["[\"cat\",\"cats\",\"catsdogcats\",\"dog\",\"dogcatsdog\",\"hippopotamuses\",\"rat\",\"ratcatdogcat\"]"],"expected":"[\"catsdogcats\",\"dogcatsdog\",\"ratcatdogcat\"]"},
  {"inputs":["[\"cat\",\"dog\",\"catdog\"]"],"expected":"[\"catdog\"]"},
  {"inputs":["[\"a\",\"b\",\"ab\",\"abc\"]"],"expected":"[\"ab\"]"},
  {"inputs":["[\"hello\",\"world\"]"],"expected":"[]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('concatenated-words', 'python',
$PY$class Solution:
    def findAllConcatenatedWordsInADict(self, words: List[str]) -> List[str]:
        $PY$),
('concatenated-words', 'javascript',
$JS$/**
 * @param {string[]} words
 * @return {string[]}
 */
var findAllConcatenatedWordsInADict = function(words) {

};$JS$),
('concatenated-words', 'java',
$JAVA$class Solution {
    public List<String> findAllConcatenatedWordsInADict(String[] words) {

    }
}$JAVA$),
('concatenated-words', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> findAllConcatenatedWordsInADict(vector<string>& words) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('concatenated-words', 1, 'Per-Word DP Against Dictionary Set',
'For each word w, decide if it can be built from strictly smaller words in the dictionary. A classic Word Break DP over w against the dictionary set does this in O(|w|^2). Sorting by length first means, when we process w, every shorter word is already in the set; excluding w itself from that check guarantees at least two pieces.',
'["Sort words by length ascending.","Maintain a growing set built that we add each processed word to after the check.","For word w, run dp: dp[0] = True; for i in 1..|w|: dp[i] = any(dp[j] and w[j:i] in built).","If any dp[|w|] is True AND built is non-empty (ensuring >= 2 parts), append w to result. Finally add w to built regardless."]'::jsonb,
$PY$class Solution:
    def findAllConcatenatedWordsInADict(self, words: List[str]) -> List[str]:
        words.sort(key=len)
        built = set()
        result = []
        for w in words:
            if not built:
                built.add(w)
                continue
            n = len(w)
            dp = [False] * (n + 1)
            dp[0] = True
            for i in range(1, n + 1):
                for j in range(i):
                    if dp[j] and w[j:i] in built:
                        dp[i] = True
                        break
            if dp[n]:
                result.append(w)
            built.add(w)
        return result
$PY$,
$JS$var findAllConcatenatedWordsInADict = function(words) {
    words.sort((a, b) => a.length - b.length);
    const built = new Set();
    const result = [];
    for (const w of words) {
        if (built.size === 0) { built.add(w); continue; }
        const n = w.length;
        const dp = new Array(n + 1).fill(false);
        dp[0] = true;
        for (let i = 1; i <= n; i++) {
            for (let j = 0; j < i; j++) {
                if (dp[j] && built.has(w.slice(j, i))) { dp[i] = true; break; }
            }
        }
        if (dp[n]) result.push(w);
        built.add(w);
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<String> findAllConcatenatedWordsInADict(String[] words) {
        Arrays.sort(words, (a, b) -> a.length() - b.length());
        Set<String> built = new HashSet<>();
        List<String> result = new ArrayList<>();
        for (String w : words) {
            if (built.isEmpty()) { built.add(w); continue; }
            int n = w.length();
            boolean[] dp = new boolean[n + 1];
            dp[0] = true;
            for (int i = 1; i <= n; i++) {
                for (int j = 0; j < i; j++) {
                    if (dp[j] && built.contains(w.substring(j, i))) { dp[i] = true; break; }
                }
            }
            if (dp[n]) result.add(w);
            built.add(w);
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<string> findAllConcatenatedWordsInADict(vector<string>& words) {
        sort(words.begin(), words.end(),
             [](const string& a, const string& b){ return a.size() < b.size(); });
        unordered_set<string> built;
        vector<string> result;
        for (const string& w : words) {
            if (built.empty()) { built.insert(w); continue; }
            int n = w.size();
            vector<bool> dp(n + 1, false);
            dp[0] = true;
            for (int i = 1; i <= n; i++) {
                for (int j = 0; j < i; j++) {
                    if (dp[j] && built.count(w.substr(j, i - j))) { dp[i] = true; break; }
                }
            }
            if (dp[n]) result.push_back(w);
            built.insert(w);
        }
        return result;
    }
};
$CPP$,
'O(n * max_len^2)', 'O(total chars)');

COMMIT;
