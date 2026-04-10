-- Solution approaches: arrays (8 problems)
-- One canonical approach per problem with full Python / JS / Java code.
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'two-sum','contains-duplicate','valid-anagram','group-anagrams',
  'top-k-frequent','product-except-self','longest-consecutive','encode-decode-strings'
);

-- ============ two-sum ============
INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES
('two-sum', 1, 'Hash Map (One Pass)',
'As we scan the array, for each number we check whether its complement (target - num) has already been seen. A hash map lets us answer that in O(1), so a single pass is enough.',
'["Create an empty hash map seen : value -> index.","For each i, num in nums: compute complement = target - num.","If complement is in seen, return [seen[complement], i].","Otherwise store seen[num] = i and continue."]'::jsonb,
$PY$class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []
$PY$,
$JS$var twoSum = function(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) return [seen.get(complement), i];
        seen.set(nums[i], i);
    }
    return [];
};
$JS$,
$JAVA$class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[]{seen.get(complement), i};
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}
$JAVA$,
'O(n)', 'O(n)'),

-- ============ contains-duplicate ============
('contains-duplicate', 1, 'Hash Set',
'Track every value we have already seen in a hash set. If a new value is already in the set, we have found a duplicate and can return immediately.',
'["Create an empty hash set seen.","For each num in nums: if num is in seen, return true.","Otherwise add num to seen.","After the loop, return false."]'::jsonb,
$PY$class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        seen = set()
        for num in nums:
            if num in seen:
                return True
            seen.add(num)
        return False
$PY$,
$JS$var containsDuplicate = function(nums) {
    const seen = new Set();
    for (const num of nums) {
        if (seen.has(num)) return true;
        seen.add(num);
    }
    return false;
};
$JS$,
$JAVA$class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>();
        for (int num : nums) {
            if (!seen.add(num)) return true;
        }
        return false;
    }
}
$JAVA$,
'O(n)', 'O(n)'),

-- ============ valid-anagram ============
('valid-anagram', 1, 'Character Count',
'Two strings are anagrams iff they contain the same characters with the same frequencies. Counting characters in one pass and decrementing in another is O(n).',
'["If lengths differ, return false immediately.","Build a frequency map of s.","For each char in t, decrement its count; if it drops below 0, return false.","All counts zero out when they match -> return true."]'::jsonb,
$PY$class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        if len(s) != len(t):
            return False
        count = {}
        for ch in s:
            count[ch] = count.get(ch, 0) + 1
        for ch in t:
            if count.get(ch, 0) == 0:
                return False
            count[ch] -= 1
        return True
$PY$,
$JS$var isAnagram = function(s, t) {
    if (s.length !== t.length) return false;
    const count = {};
    for (const ch of s) count[ch] = (count[ch] || 0) + 1;
    for (const ch of t) {
        if (!count[ch]) return false;
        count[ch]--;
    }
    return true;
};
$JS$,
$JAVA$class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] count = new int[26];
        for (int i = 0; i < s.length(); i++) {
            count[s.charAt(i) - 'a']++;
            count[t.charAt(i) - 'a']--;
        }
        for (int c : count) if (c != 0) return false;
        return true;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

-- ============ group-anagrams ============
('group-anagrams', 1, 'Hash Map Keyed by Char Count',
'Two words are anagrams iff their character-count tuples are identical. Use a 26-int tuple as a hash-map key to bucket words together in O(n * k) where k is the average word length.',
'["Create a defaultdict(list) groups.","For each word, build a 26-int count array of its letters.","Use the tuple of that array as the key and append the word to groups[key].","Return the list of grouped values."]'::jsonb,
$PY$class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        groups = {}
        for word in strs:
            key = [0] * 26
            for ch in word:
                key[ord(ch) - ord('a')] += 1
            t = tuple(key)
            if t not in groups:
                groups[t] = []
            groups[t].append(word)
        return list(groups.values())
$PY$,
$JS$var groupAnagrams = function(strs) {
    const groups = new Map();
    for (const word of strs) {
        const key = new Array(26).fill(0);
        for (const ch of word) key[ch.charCodeAt(0) - 97]++;
        const k = key.join(',');
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(word);
    }
    return Array.from(groups.values());
};
$JS$,
$JAVA$class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String word : strs) {
            int[] count = new int[26];
            for (char ch : word.toCharArray()) count[ch - 'a']++;
            String key = Arrays.toString(count);
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(word);
        }
        return new ArrayList<>(groups.values());
    }
}
$JAVA$,
'O(n * k)', 'O(n * k)'),

-- ============ top-k-frequent ============
('top-k-frequent', 1, 'Bucket Sort',
'Count frequencies in one pass, then bucket numbers by frequency. Since frequencies are bounded by n, we can walk buckets from highest to lowest and collect the first k elements in O(n) total.',
'["Count frequencies in a hash map.","Create buckets: an array of empty lists of length n+1 where buckets[f] holds all values with frequency f.","Populate buckets from the frequency map.","Walk buckets from index n down to 1, extending the answer until it has k elements."]'::jsonb,
$PY$class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        freq = {}
        for num in nums:
            freq[num] = freq.get(num, 0) + 1
        buckets = [[] for _ in range(len(nums) + 1)]
        for num, f in freq.items():
            buckets[f].append(num)
        result = []
        for i in range(len(buckets) - 1, 0, -1):
            for num in buckets[i]:
                result.append(num)
                if len(result) == k:
                    return result
        return result
$PY$,
$JS$var topKFrequent = function(nums, k) {
    const freq = new Map();
    for (const n of nums) freq.set(n, (freq.get(n) || 0) + 1);
    const buckets = Array.from({ length: nums.length + 1 }, () => []);
    for (const [num, f] of freq) buckets[f].push(num);
    const result = [];
    for (let i = buckets.length - 1; i > 0 && result.length < k; i--) {
        for (const num of buckets[i]) {
            result.push(num);
            if (result.length === k) return result;
        }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int n : nums) freq.merge(n, 1, Integer::sum);
        List<List<Integer>> buckets = new ArrayList<>();
        for (int i = 0; i <= nums.length; i++) buckets.add(new ArrayList<>());
        for (var e : freq.entrySet()) buckets.get(e.getValue()).add(e.getKey());
        int[] result = new int[k];
        int idx = 0;
        for (int i = buckets.size() - 1; i > 0 && idx < k; i--) {
            for (int num : buckets.get(i)) {
                result[idx++] = num;
                if (idx == k) return result;
            }
        }
        return result;
    }
}
$JAVA$,
'O(n)', 'O(n)'),

-- ============ product-except-self ============
('product-except-self', 1, 'Prefix and Suffix Products',
'answer[i] is the product of everything left of i times everything right of i. We fill answer with left products in one pass, then multiply in the right products in a second pass with a running suffix variable — no extra array needed.',
'["Initialize answer = [1] * n.","Left pass: for i from 0 to n-1, set answer[i] = running_left then multiply running_left by nums[i].","Right pass: for i from n-1 down to 0, multiply answer[i] by running_right then multiply running_right by nums[i].","Return answer."]'::jsonb,
$PY$class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        n = len(nums)
        answer = [1] * n
        left = 1
        for i in range(n):
            answer[i] = left
            left *= nums[i]
        right = 1
        for i in range(n - 1, -1, -1):
            answer[i] *= right
            right *= nums[i]
        return answer
$PY$,
$JS$var productExceptSelf = function(nums) {
    const n = nums.length;
    const answer = new Array(n).fill(1);
    let left = 1;
    for (let i = 0; i < n; i++) {
        answer[i] = left;
        left *= nums[i];
    }
    let right = 1;
    for (let i = n - 1; i >= 0; i--) {
        answer[i] *= right;
        right *= nums[i];
    }
    return answer;
};
$JS$,
$JAVA$class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] answer = new int[n];
        int left = 1;
        for (int i = 0; i < n; i++) {
            answer[i] = left;
            left *= nums[i];
        }
        int right = 1;
        for (int i = n - 1; i >= 0; i--) {
            answer[i] *= right;
            right *= nums[i];
        }
        return answer;
    }
}
$JAVA$,
'O(n)', 'O(1) extra'),

-- ============ longest-consecutive ============
('longest-consecutive', 1, 'Hash Set Streak Starts',
'Put every number into a hash set. A number x can start a streak only if x - 1 is NOT in the set. From each true start, walk upward as long as the next number exists. Each number is visited at most twice, so the total work is O(n).',
'["Convert nums to a hash set num_set.","For each num in num_set: if num - 1 is not in num_set, num is the start of a streak.","Walk current = num, length = 1; while current + 1 is in the set, increment both.","Track the maximum length seen."]'::jsonb,
$PY$class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        num_set = set(nums)
        best = 0
        for num in num_set:
            if num - 1 not in num_set:
                current = num
                length = 1
                while current + 1 in num_set:
                    current += 1
                    length += 1
                best = max(best, length)
        return best
$PY$,
$JS$var longestConsecutive = function(nums) {
    const set = new Set(nums);
    let best = 0;
    for (const num of set) {
        if (!set.has(num - 1)) {
            let current = num, length = 1;
            while (set.has(current + 1)) { current++; length++; }
            best = Math.max(best, length);
        }
    }
    return best;
};
$JS$,
$JAVA$class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for (int n : nums) set.add(n);
        int best = 0;
        for (int num : set) {
            if (!set.contains(num - 1)) {
                int current = num, length = 1;
                while (set.contains(current + 1)) { current++; length++; }
                best = Math.max(best, length);
            }
        }
        return best;
    }
}
$JAVA$,
'O(n)', 'O(n)'),

-- ============ encode-decode-strings ============
('encode-decode-strings', 1, 'Length Prefix Delimiter',
'Encode each string as "<length>#<string>". The delimiter # is unambiguous because we always know exactly how many characters to consume after reading the length, regardless of what characters the string contains.',
'["encode: for each word, append str(len(word)) + ''#'' + word to the buffer.","decode: scan with i = 0. Read digits until # to get length L.","Append s[i+1 : i+1+L] to the result list.","Advance i to i + 1 + L and repeat until i >= len(s)."]'::jsonb,
$PY$class Solution:
    def encode(self, strs: List[str]) -> str:
        return ''.join(f"{len(w)}#{w}" for w in strs)

    def decode(self, s: str) -> List[str]:
        result = []
        i = 0
        while i < len(s):
            j = i
            while s[j] != '#':
                j += 1
            length = int(s[i:j])
            result.append(s[j + 1 : j + 1 + length])
            i = j + 1 + length
        return result
$PY$,
$JS$var encode = function(strs) {
    return strs.map(w => `${w.length}#${w}`).join('');
};

var decode = function(s) {
    const result = [];
    let i = 0;
    while (i < s.length) {
        let j = i;
        while (s[j] !== '#') j++;
        const length = parseInt(s.slice(i, j));
        result.push(s.slice(j + 1, j + 1 + length));
        i = j + 1 + length;
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public String encode(List<String> strs) {
        StringBuilder sb = new StringBuilder();
        for (String w : strs) sb.append(w.length()).append('#').append(w);
        return sb.toString();
    }

    public List<String> decode(String s) {
        List<String> result = new ArrayList<>();
        int i = 0;
        while (i < s.length()) {
            int j = i;
            while (s.charAt(j) != '#') j++;
            int length = Integer.parseInt(s.substring(i, j));
            result.add(s.substring(j + 1, j + 1 + length));
            i = j + 1 + length;
        }
        return result;
    }
}
$JAVA$,
'O(n)', 'O(1) extra');

COMMIT;

SELECT problem_id, approach_name, time_complexity FROM public."PGcode_solution_approaches"
WHERE problem_id IN ('two-sum','contains-duplicate','valid-anagram','group-anagrams','top-k-frequent','product-except-self','longest-consecutive','encode-decode-strings')
ORDER BY problem_id;
