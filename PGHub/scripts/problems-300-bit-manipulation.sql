-- Grow catalog 200 → 300: bit-manipulation topic (+4 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'hamming-distance','number-complement','single-number-iii','max-product-word-lengths'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'hamming-distance','number-complement','single-number-iii','max-product-word-lengths'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'hamming-distance','number-complement','single-number-iii','max-product-word-lengths'
);

-- ============================================================
-- 1) hamming-distance (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('hamming-distance', 'bit-manipulation', 'Hamming Distance', 'Easy',
$$<p>The Hamming distance between two integers is the number of positions at which the corresponding bits differ. Return the Hamming distance between integers <code>x</code> and <code>y</code>.</p>$$,
'', ARRAY[
  'XOR produces a 1 wherever the bits differ, so x ^ y is the "diff mask".',
  'Count the set bits of that mask (Kernighan trick or popcount).',
  'Constant time for 32-bit inputs.'
], '300', 'https://leetcode.com/problems/hamming-distance/',
'hammingDistance',
'[{"name":"x","type":"int"},{"name":"y","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["1","4"],"expected":"2"},
  {"inputs":["3","1"],"expected":"1"},
  {"inputs":["0","0"],"expected":"0"},
  {"inputs":["1","2147483647"],"expected":"30"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('hamming-distance', 'python',
$PY$class Solution:
    def hammingDistance(self, x: int, y: int) -> int:
        $PY$),
('hamming-distance', 'javascript',
$JS$var hammingDistance = function(x, y) {

};$JS$),
('hamming-distance', 'java',
$JAVA$class Solution {
    public int hammingDistance(int x, int y) {

    }
}$JAVA$),
('hamming-distance', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int hammingDistance(int x, int y) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('hamming-distance', 1, 'XOR + Popcount',
'x XOR y highlights every bit position where the two integers disagree. Counting the 1s in that mask gives the Hamming distance in O(popcount) using the n & (n-1) trick or a built-in bit count.',
'["mask = x XOR y. count = 0.","While mask != 0: mask &= mask - 1; count += 1.","Return count."]'::jsonb,
$PY$class Solution:
    def hammingDistance(self, x: int, y: int) -> int:
        mask = x ^ y
        count = 0
        while mask:
            mask &= mask - 1
            count += 1
        return count
$PY$,
$JS$var hammingDistance = function(x, y) {
    let mask = x ^ y;
    let count = 0;
    while (mask) {
        mask &= mask - 1;
        count++;
    }
    return count;
};
$JS$,
$JAVA$class Solution {
    public int hammingDistance(int x, int y) {
        int mask = x ^ y;
        int count = 0;
        while (mask != 0) {
            mask &= mask - 1;
            count++;
        }
        return count;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int hammingDistance(int x, int y) {
        unsigned int mask = (unsigned int)(x ^ y);
        int count = 0;
        while (mask) {
            mask &= mask - 1;
            count++;
        }
        return count;
    }
};
$CPP$,
'O(popcount)', 'O(1)');

-- ============================================================
-- 2) number-complement (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('number-complement', 'bit-manipulation', 'Number Complement', 'Easy',
$$<p>The complement of an integer is formed by flipping every bit in its binary representation — but only over the bits that appear in the natural (non-padded) form. Given a positive integer <code>num</code>, return its complement.</p>$$,
'', ARRAY[
  'The complement is num XOR mask, where mask is all 1s for the number of bits needed to represent num.',
  'Build mask by shifting 1 left until it exceeds num, then subtract 1. For num = 0, mask is 0 → complement is 0.',
  'Example: num = 5 (101) has mask = 7 (111); complement = 2 (010).'
], '300', 'https://leetcode.com/problems/number-complement/',
'findComplement',
'[{"name":"num","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["5"],"expected":"2"},
  {"inputs":["1"],"expected":"0"},
  {"inputs":["7"],"expected":"0"},
  {"inputs":["8"],"expected":"7"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('number-complement', 'python',
$PY$class Solution:
    def findComplement(self, num: int) -> int:
        $PY$),
('number-complement', 'javascript',
$JS$var findComplement = function(num) {

};$JS$),
('number-complement', 'java',
$JAVA$class Solution {
    public int findComplement(int num) {

    }
}$JAVA$),
('number-complement', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findComplement(int num) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('number-complement', 1, 'XOR with All-Ones Mask',
'To flip every meaningful bit we XOR with a mask that is all 1s over exactly the bit-width of num. Building that mask is a matter of left-shifting 1 past the highest bit of num and subtracting 1.',
'["mask = 1. While mask <= num: mask <<= 1.","mask -= 1 (now mask has ones in every bit position used by num).","Return num XOR mask."]'::jsonb,
$PY$class Solution:
    def findComplement(self, num: int) -> int:
        mask = 1
        while mask <= num:
            mask <<= 1
        mask -= 1
        return num ^ mask
$PY$,
$JS$var findComplement = function(num) {
    let mask = 1;
    while (mask <= num) mask <<= 1;
    mask -= 1;
    return num ^ mask;
};
$JS$,
$JAVA$class Solution {
    public int findComplement(int num) {
        long mask = 1;
        while (mask <= num) mask <<= 1;
        mask -= 1;
        return (int)(num ^ mask);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int findComplement(int num) {
        long long mask = 1;
        while (mask <= num) mask <<= 1;
        mask -= 1;
        return (int)(num ^ mask);
    }
};
$CPP$,
'O(log num)', 'O(1)');

-- ============================================================
-- 3) single-number-iii (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('single-number-iii', 'bit-manipulation', 'Single Number III', 'Medium',
$$<p>Given an integer array <code>nums</code> in which exactly two elements appear once and every other element appears twice, return the two elements that appear once (in any order).</p>$$,
'', ARRAY[
  'XOR-fold all numbers: pairs cancel, so the result = a ^ b, where a, b are the two unique values.',
  'Pick any bit that is set in a ^ b — it differs between a and b. Split nums by that bit; XOR each group.',
  'The two resulting XORs are a and b.'
], '300', 'https://leetcode.com/problems/single-number-iii/',
'singleNumber',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[1,2,1,3,2,5]"],"expected":"[3,5]"},
  {"inputs":["[-1,0]"],"expected":"[-1,0]"},
  {"inputs":["[0,1]"],"expected":"[1,0]"},
  {"inputs":["[1,1,0,-2147483648]"],"expected":"[0,-2147483648]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('single-number-iii', 'python',
$PY$class Solution:
    def singleNumber(self, nums: List[int]) -> List[int]:
        $PY$),
('single-number-iii', 'javascript',
$JS$var singleNumber = function(nums) {

};$JS$),
('single-number-iii', 'java',
$JAVA$class Solution {
    public int[] singleNumber(int[] nums) {

    }
}$JAVA$),
('single-number-iii', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> singleNumber(vector<int>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('single-number-iii', 1, 'XOR-Fold + Differentiating Bit',
'The total XOR isolates a XOR b since every duplicate cancels. Any set bit in that XOR is a position where a and b differ, so splitting nums by that bit puts a and b in different buckets — each bucket XOR-folds to one of them.',
'["xor_all = XOR over nums — equals a XOR b.","bit = xor_all & -xor_all — any single set bit (the lowest one).","a = 0, b = 0.","For each num: if num & bit, XOR it into a; else XOR it into b.","Return [a, b]."]'::jsonb,
$PY$class Solution:
    def singleNumber(self, nums: List[int]) -> List[int]:
        xor_all = 0
        for num in nums:
            xor_all ^= num
        bit = xor_all & -xor_all
        a = b = 0
        for num in nums:
            if num & bit:
                a ^= num
            else:
                b ^= num
        return [a, b]
$PY$,
$JS$var singleNumber = function(nums) {
    let xorAll = 0;
    for (const n of nums) xorAll ^= n;
    const bit = xorAll & -xorAll;
    let a = 0, b = 0;
    for (const n of nums) {
        if (n & bit) a ^= n;
        else b ^= n;
    }
    return [a, b];
};
$JS$,
$JAVA$class Solution {
    public int[] singleNumber(int[] nums) {
        int xorAll = 0;
        for (int n : nums) xorAll ^= n;
        int bit = xorAll & -xorAll;
        int a = 0, b = 0;
        for (int n : nums) {
            if ((n & bit) != 0) a ^= n;
            else b ^= n;
        }
        return new int[]{a, b};
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> singleNumber(vector<int>& nums) {
        long long xorAll = 0;
        for (int n : nums) xorAll ^= n;
        long long bit = xorAll & -xorAll;
        int a = 0, b = 0;
        for (int n : nums) {
            if (((long long)n & bit) != 0) a ^= n;
            else b ^= n;
        }
        return {a, b};
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 4) max-product-word-lengths (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('max-product-word-lengths', 'bit-manipulation', 'Maximum Product of Word Lengths', 'Medium',
$$<p>Given an array of lowercase words, return the maximum of <code>len(a) * len(b)</code> over all pairs <code>(a, b)</code> that share no common letter. Return 0 if no such pair exists.</p>$$,
'', ARRAY[
  'Encode each word as a 26-bit bitmask, one bit per distinct letter it contains.',
  'Two words share no letter iff their masks AND to 0.',
  'Precompute the masks, then an O(n^2) scan of pairs finds the best product.'
], '300', 'https://leetcode.com/problems/maximum-product-of-word-lengths/',
'maxProduct',
'[{"name":"words","type":"List[str]"}]'::jsonb,
'int',
'[
  {"inputs":["[\"abcw\",\"baz\",\"foo\",\"bar\",\"xtfn\",\"abcdef\"]"],"expected":"16"},
  {"inputs":["[\"a\",\"ab\",\"abc\",\"d\",\"cd\",\"bcd\",\"abcd\"]"],"expected":"4"},
  {"inputs":["[\"a\",\"aa\",\"aaa\",\"aaaa\"]"],"expected":"0"},
  {"inputs":["[\"ab\",\"cd\"]"],"expected":"4"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('max-product-word-lengths', 'python',
$PY$class Solution:
    def maxProduct(self, words: List[str]) -> int:
        $PY$),
('max-product-word-lengths', 'javascript',
$JS$var maxProduct = function(words) {

};$JS$),
('max-product-word-lengths', 'java',
$JAVA$class Solution {
    public int maxProduct(String[] words) {

    }
}$JAVA$),
('max-product-word-lengths', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxProduct(vector<string>& words) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('max-product-word-lengths', 1, 'Bitmask Per Word + Pairwise Check',
'A 26-bit mask captures which letters appear in a word. Two words share no letter iff mask(a) & mask(b) == 0 — a single AND replaces an O(L1 + L2) character comparison, so the overall cost becomes O(n^2) regardless of word length.',
'["Compute mask[i] = OR of (1 << (ord(c) - ord(a))) for every char c in words[i].","best = 0.","For each pair (i, j) with i < j: if mask[i] & mask[j] == 0, best = max(best, len(words[i]) * len(words[j])).","Return best."]'::jsonb,
$PY$class Solution:
    def maxProduct(self, words: List[str]) -> int:
        n = len(words)
        masks = [0] * n
        for i, w in enumerate(words):
            m = 0
            for c in w:
                m |= 1 << (ord(c) - ord('a'))
            masks[i] = m
        best = 0
        for i in range(n):
            for j in range(i + 1, n):
                if masks[i] & masks[j] == 0:
                    best = max(best, len(words[i]) * len(words[j]))
        return best
$PY$,
$JS$var maxProduct = function(words) {
    const n = words.length;
    const masks = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        let m = 0;
        for (const c of words[i]) m |= 1 << (c.charCodeAt(0) - 97);
        masks[i] = m;
    }
    let best = 0;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if ((masks[i] & masks[j]) === 0) {
                const p = words[i].length * words[j].length;
                if (p > best) best = p;
            }
        }
    }
    return best;
};
$JS$,
$JAVA$class Solution {
    public int maxProduct(String[] words) {
        int n = words.length;
        int[] masks = new int[n];
        for (int i = 0; i < n; i++) {
            int m = 0;
            for (char c : words[i].toCharArray()) m |= 1 << (c - 'a');
            masks[i] = m;
        }
        int best = 0;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if ((masks[i] & masks[j]) == 0) {
                    best = Math.max(best, words[i].length() * words[j].length());
                }
            }
        }
        return best;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int maxProduct(vector<string>& words) {
        int n = words.size();
        vector<int> masks(n, 0);
        for (int i = 0; i < n; i++) {
            int m = 0;
            for (char c : words[i]) m |= 1 << (c - 'a');
            masks[i] = m;
        }
        int best = 0;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if ((masks[i] & masks[j]) == 0) {
                    best = max(best, (int)(words[i].size() * words[j].size()));
                }
            }
        }
        return best;
    }
};
$CPP$,
'O(n^2 + total chars)', 'O(n)');

COMMIT;
