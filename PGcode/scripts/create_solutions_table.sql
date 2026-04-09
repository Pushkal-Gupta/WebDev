-- ═══════════════════════════════════════════════════════════════
-- Solution Approaches Table — NeetCode-style multi-approach solutions
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."PGcode_solution_approaches" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id TEXT NOT NULL REFERENCES public."PGcode_problems"(id) ON DELETE CASCADE,
  approach_number INT NOT NULL,
  approach_name TEXT NOT NULL,
  intuition TEXT,
  algorithm_steps JSONB DEFAULT '[]',
  code_python TEXT,
  code_javascript TEXT,
  code_java TEXT,
  time_complexity TEXT,
  space_complexity TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public."PGcode_solution_approaches" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public."PGcode_solution_approaches" FOR SELECT USING (true);

-- ── TWO SUM SOLUTIONS ─────────────────────────────────────────

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity) VALUES

('two-sum', 1, 'Brute Force',
'We can check every pair of elements in the array to see if they sum to the target. This is the most straightforward approach — compare all possible pairs.',
'["Iterate through the array with index i from 0 to n-1", "For each i, iterate with index j from i+1 to n-1", "If nums[i] + nums[j] equals the target, return [i, j]", "Since exactly one solution exists, we are guaranteed to find it"]',
'class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]
        return []',
'var twoSum = function(nums, target) {
    for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] === target) {
                return [i, j];
            }
        }
    }
    return [];
};',
'class Solution {
    public int[] twoSum(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) {
                    return new int[]{i, j};
                }
            }
        }
        return new int[]{};
    }
}',
'O(n²)', 'O(1)'),

('two-sum', 2, 'Hash Map (One Pass)',
'Instead of checking every pair, we can use a hash map to remember values we have seen. For each element, we compute its complement (target - num) and check if we have already seen it. This turns O(n²) into O(n).',
'["Create an empty hash map to store {value: index}", "Iterate through the array with index i", "Compute complement = target - nums[i]", "If complement exists in the hash map, return [map[complement], i]", "Otherwise, store nums[i] → i in the hash map", "Continue until the pair is found"]',
'class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        hashMap = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in hashMap:
                return [hashMap[complement], i]
            hashMap[num] = i
        return []',
'var twoSum = function(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
};',
'class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}',
'O(n)', 'O(n)');


-- ── CONTAINS DUPLICATE SOLUTIONS ──────────────────────────────

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity) VALUES

('contains-duplicate', 1, 'Brute Force',
'Check every pair of elements to see if any two are equal. This directly solves the problem but is the least efficient since it examines every combination.',
'["Iterate through the array with index i from 0 to n-1", "For each i, iterate with index j from i+1 to n-1", "If nums[i] equals nums[j], return true", "If no duplicates found after all pairs checked, return false"]',
'class Solution:
    def hasDuplicate(self, nums: List[int]) -> bool:
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                if nums[i] == nums[j]:
                    return True
        return False',
'var containsDuplicate = function(nums) {
    for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] === nums[j]) return true;
        }
    }
    return false;
};',
'class Solution {
    public boolean containsDuplicate(int[] nums) {
        for (int i = 0; i < nums.length; i++)
            for (int j = i + 1; j < nums.length; j++)
                if (nums[i] == nums[j]) return true;
        return false;
    }
}',
'O(n²)', 'O(1)'),

('contains-duplicate', 2, 'Sorting',
'If we sort the array, duplicate values will be adjacent. We can then scan once looking for neighboring equal elements.',
'["Sort the array in ascending order", "Iterate from index 1 to n-1", "Compare each element with the previous one", "If nums[i] == nums[i-1], a duplicate exists — return true", "If no adjacent duplicates found, return false"]',
'class Solution:
    def hasDuplicate(self, nums: List[int]) -> bool:
        nums.sort()
        for i in range(1, len(nums)):
            if nums[i] == nums[i - 1]:
                return True
        return False',
'var containsDuplicate = function(nums) {
    nums.sort((a, b) => a - b);
    for (let i = 1; i < nums.length; i++) {
        if (nums[i] === nums[i - 1]) return true;
    }
    return false;
};',
'class Solution {
    public boolean containsDuplicate(int[] nums) {
        Arrays.sort(nums);
        for (int i = 1; i < nums.length; i++)
            if (nums[i] == nums[i - 1]) return true;
        return false;
    }
}',
'O(n log n)', 'O(1)'),

('contains-duplicate', 3, 'Hash Set',
'Use a hash set to track seen values. For each element, check if it already exists in the set. If yes, we found a duplicate. Hash set gives O(1) lookups.',
'["Initialize an empty hash set", "Iterate through each number in the array", "If the number is already in the set, return true (duplicate found)", "Otherwise, add it to the set", "If loop finishes without finding duplicates, return false"]',
'class Solution:
    def hasDuplicate(self, nums: List[int]) -> bool:
        seen = set()
        for num in nums:
            if num in seen:
                return True
            seen.add(num)
        return False',
'var containsDuplicate = function(nums) {
    const seen = new Set();
    for (const num of nums) {
        if (seen.has(num)) return true;
        seen.add(num);
    }
    return false;
};',
'class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>();
        for (int num : nums) {
            if (seen.contains(num)) return true;
            seen.add(num);
        }
        return false;
    }
}',
'O(n)', 'O(n)'),

('contains-duplicate', 4, 'Hash Set Length',
'A set only stores unique values. If the set of nums is smaller than the original array, duplicates must exist. This is the most concise approach.',
'["Convert the array to a set (removes duplicates)", "Compare the length of the set with the original array", "If set is smaller, return true (duplicates were removed)", "Otherwise return false"]',
'class Solution:
    def hasDuplicate(self, nums: List[int]) -> bool:
        return len(set(nums)) < len(nums)',
'var containsDuplicate = function(nums) {
    return new Set(nums).size < nums.length;
};',
'class Solution {
    public boolean containsDuplicate(int[] nums) {
        return new HashSet<>(Arrays.stream(nums).boxed().toList()).size() < nums.length;
    }
}',
'O(n)', 'O(n)');


-- ── VALID PALINDROME SOLUTIONS ────────────────────────────────

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity) VALUES

('valid-palindrome', 1, 'Reverse String',
'Clean the string by removing non-alphanumeric characters and converting to lowercase. Then compare it with its reverse. If they match, it is a palindrome.',
'["Remove all non-alphanumeric characters from the string", "Convert to lowercase", "Compare the cleaned string with its reverse", "If equal, return true; otherwise false"]',
'class Solution:
    def isPalindrome(self, s: str) -> bool:
        cleaned = "".join(c.lower() for c in s if c.isalnum())
        return cleaned == cleaned[::-1]',
'var isPalindrome = function(s) {
    const cleaned = s.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    return cleaned === cleaned.split("").reverse().join("");
};',
'class Solution {
    public boolean isPalindrome(String s) {
        String cleaned = s.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        return cleaned.equals(new StringBuilder(cleaned).reverse().toString());
    }
}',
'O(n)', 'O(n)'),

('valid-palindrome', 2, 'Two Pointers',
'Use two pointers starting from both ends. Skip non-alphanumeric characters. Compare characters moving inward. This avoids creating a new string and uses O(1) extra space.',
'["Initialize left pointer at start, right pointer at end", "Skip non-alphanumeric characters for both pointers", "Compare lowercase characters at left and right", "If mismatch found, return false", "Move pointers inward and repeat", "If pointers cross without mismatch, return true"]',
'class Solution:
    def isPalindrome(self, s: str) -> bool:
        l, r = 0, len(s) - 1
        while l < r:
            while l < r and not s[l].isalnum():
                l += 1
            while l < r and not s[r].isalnum():
                r -= 1
            if s[l].lower() != s[r].lower():
                return False
            l += 1
            r -= 1
        return True',
'var isPalindrome = function(s) {
    let l = 0, r = s.length - 1;
    while (l < r) {
        while (l < r && !s[l].match(/[a-zA-Z0-9]/)) l++;
        while (l < r && !s[r].match(/[a-zA-Z0-9]/)) r--;
        if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;
        l++; r--;
    }
    return true;
};',
'class Solution {
    public boolean isPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;
            while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;
            if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r)))
                return false;
            l++; r--;
        }
        return true;
    }
}',
'O(n)', 'O(1)');
