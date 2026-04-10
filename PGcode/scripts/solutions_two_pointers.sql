-- Solution approaches: two-pointers (10 problems)
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'valid-palindrome','two-sum-ii','three-sum','container-most-water','trapping-rain-water',
  'remove-duplicates-sorted','move-zeroes','sort-colors','squares-sorted-array','is-subsequence'
);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES

('valid-palindrome', 1, 'Two Pointers',
'Compare characters from both ends toward the middle, skipping non-alphanumerics and lowercasing for the comparison. If all paired characters match, it is a palindrome.',
'["l = 0, r = len(s) - 1.","While l < r: skip non-alphanumerics on the left by advancing l; skip on the right by retreating r.","If s[l].lower() != s[r].lower(), return false.","Otherwise advance both pointers and continue."]'::jsonb,
$PY$class Solution:
    def isPalindrome(self, s: str) -> bool:
        l, r = 0, len(s) - 1
        while l < r:
            while l < r and not s[l].isalnum(): l += 1
            while l < r and not s[r].isalnum(): r -= 1
            if s[l].lower() != s[r].lower():
                return False
            l += 1
            r -= 1
        return True
$PY$,
$JS$var isPalindrome = function(s) {
    const isAlnum = c => /[a-zA-Z0-9]/.test(c);
    let l = 0, r = s.length - 1;
    while (l < r) {
        while (l < r && !isAlnum(s[l])) l++;
        while (l < r && !isAlnum(s[r])) r--;
        if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;
        l++; r--;
    }
    return true;
};
$JS$,
$JAVA$class Solution {
    public boolean isPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;
            while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;
            if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;
            l++; r--;
        }
        return true;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('two-sum-ii', 1, 'Two Pointers on Sorted Array',
'Because the array is sorted, we can place pointers at both ends. If their sum is too small, advance the left pointer; if too big, retreat the right one. This converges in O(n) with O(1) extra space.',
'["l = 0, r = n - 1.","While l < r: compute sum = numbers[l] + numbers[r].","If sum == target, return [l + 1, r + 1] (1-indexed).","If sum < target, l += 1; else r -= 1."]'::jsonb,
$PY$class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        l, r = 0, len(numbers) - 1
        while l < r:
            s = numbers[l] + numbers[r]
            if s == target:
                return [l + 1, r + 1]
            if s < target:
                l += 1
            else:
                r -= 1
        return []
$PY$,
$JS$var twoSum = function(numbers, target) {
    let l = 0, r = numbers.length - 1;
    while (l < r) {
        const s = numbers[l] + numbers[r];
        if (s === target) return [l + 1, r + 1];
        if (s < target) l++;
        else r--;
    }
    return [];
};
$JS$,
$JAVA$class Solution {
    public int[] twoSum(int[] numbers, int target) {
        int l = 0, r = numbers.length - 1;
        while (l < r) {
            int s = numbers[l] + numbers[r];
            if (s == target) return new int[]{l + 1, r + 1};
            if (s < target) l++;
            else r--;
        }
        return new int[0];
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('three-sum', 1, 'Sort + Two Pointers',
'Sort the array so we can skip duplicates and use two-pointer search for each fixed first element. Total time is O(n^2) dominated by the nested sweep.',
'["Sort nums.","For i from 0 to n - 3: skip if nums[i] == nums[i - 1] to avoid duplicate triples.","Use l = i + 1, r = n - 1; look for sum == 0 - nums[i].","On a hit, record the triple then advance l/r skipping duplicates. On sum too small advance l, too big retreat r."]'::jsonb,
$PY$class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        result = []
        n = len(nums)
        for i in range(n - 2):
            if i > 0 and nums[i] == nums[i - 1]:
                continue
            l, r = i + 1, n - 1
            while l < r:
                s = nums[i] + nums[l] + nums[r]
                if s == 0:
                    result.append([nums[i], nums[l], nums[r]])
                    l += 1
                    r -= 1
                    while l < r and nums[l] == nums[l - 1]: l += 1
                    while l < r and nums[r] == nums[r + 1]: r -= 1
                elif s < 0:
                    l += 1
                else:
                    r -= 1
        return result
$PY$,
$JS$var threeSum = function(nums) {
    nums.sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        let l = i + 1, r = nums.length - 1;
        while (l < r) {
            const s = nums[i] + nums[l] + nums[r];
            if (s === 0) {
                result.push([nums[i], nums[l], nums[r]]);
                l++; r--;
                while (l < r && nums[l] === nums[l - 1]) l++;
                while (l < r && nums[r] === nums[r + 1]) r--;
            } else if (s < 0) l++;
            else r--;
        }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = nums.length - 1;
            while (l < r) {
                int s = nums[i] + nums[l] + nums[r];
                if (s == 0) {
                    result.add(Arrays.asList(nums[i], nums[l], nums[r]));
                    l++; r--;
                    while (l < r && nums[l] == nums[l - 1]) l++;
                    while (l < r && nums[r] == nums[r + 1]) r--;
                } else if (s < 0) l++;
                else r--;
            }
        }
        return result;
    }
}
$JAVA$,
'O(n^2)', 'O(1) extra (ignoring sort)'),

('container-most-water', 1, 'Two Pointers Shrinking Inward',
'Start with the widest container possible and always move the shorter side inward. Moving the taller side can never increase the bounded area, so this sweep is optimal.',
'["l = 0, r = n - 1, best = 0.","Area = min(height[l], height[r]) * (r - l); update best.","If height[l] < height[r], advance l; else retreat r.","Repeat until l >= r."]'::jsonb,
$PY$class Solution:
    def maxArea(self, height: List[int]) -> int:
        l, r = 0, len(height) - 1
        best = 0
        while l < r:
            area = min(height[l], height[r]) * (r - l)
            if area > best:
                best = area
            if height[l] < height[r]:
                l += 1
            else:
                r -= 1
        return best
$PY$,
$JS$var maxArea = function(height) {
    let l = 0, r = height.length - 1, best = 0;
    while (l < r) {
        const area = Math.min(height[l], height[r]) * (r - l);
        if (area > best) best = area;
        if (height[l] < height[r]) l++;
        else r--;
    }
    return best;
};
$JS$,
$JAVA$class Solution {
    public int maxArea(int[] height) {
        int l = 0, r = height.length - 1, best = 0;
        while (l < r) {
            int area = Math.min(height[l], height[r]) * (r - l);
            if (area > best) best = area;
            if (height[l] < height[r]) l++;
            else r--;
        }
        return best;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('trapping-rain-water', 1, 'Two Pointers with Running Maxes',
'Water trapped at index i equals min(maxLeft, maxRight) - height[i]. Two pointers let us compute this in one pass: always advance the side whose max is the binding constraint.',
'["l = 0, r = n - 1, leftMax = rightMax = 0, total = 0.","While l < r: if height[l] < height[r]: update leftMax; add leftMax - height[l] to total; l += 1.","Else: update rightMax; add rightMax - height[r] to total; r -= 1.","Return total."]'::jsonb,
$PY$class Solution:
    def trap(self, height: List[int]) -> int:
        l, r = 0, len(height) - 1
        leftMax = rightMax = total = 0
        while l < r:
            if height[l] < height[r]:
                leftMax = max(leftMax, height[l])
                total += leftMax - height[l]
                l += 1
            else:
                rightMax = max(rightMax, height[r])
                total += rightMax - height[r]
                r -= 1
        return total
$PY$,
$JS$var trap = function(height) {
    let l = 0, r = height.length - 1, leftMax = 0, rightMax = 0, total = 0;
    while (l < r) {
        if (height[l] < height[r]) {
            leftMax = Math.max(leftMax, height[l]);
            total += leftMax - height[l];
            l++;
        } else {
            rightMax = Math.max(rightMax, height[r]);
            total += rightMax - height[r];
            r--;
        }
    }
    return total;
};
$JS$,
$JAVA$class Solution {
    public int trap(int[] height) {
        int l = 0, r = height.length - 1, leftMax = 0, rightMax = 0, total = 0;
        while (l < r) {
            if (height[l] < height[r]) {
                leftMax = Math.max(leftMax, height[l]);
                total += leftMax - height[l];
                l++;
            } else {
                rightMax = Math.max(rightMax, height[r]);
                total += rightMax - height[r];
                r--;
            }
        }
        return total;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('remove-duplicates-sorted', 1, 'Slow-Fast Pointers',
'Slow tracks the next write position; fast scans. When nums[fast] differs from nums[slow], advance slow and copy. slow + 1 is the count of unique elements.',
'["If nums is empty, return 0.","slow = 0.","For fast from 1 to n - 1: if nums[fast] != nums[slow]: slow += 1; nums[slow] = nums[fast].","Return slow + 1."]'::jsonb,
$PY$class Solution:
    def removeDuplicates(self, nums: List[int]) -> int:
        if not nums:
            return 0
        slow = 0
        for fast in range(1, len(nums)):
            if nums[fast] != nums[slow]:
                slow += 1
                nums[slow] = nums[fast]
        return slow + 1
$PY$,
$JS$var removeDuplicates = function(nums) {
    if (nums.length === 0) return 0;
    let slow = 0;
    for (let fast = 1; fast < nums.length; fast++) {
        if (nums[fast] !== nums[slow]) {
            slow++;
            nums[slow] = nums[fast];
        }
    }
    return slow + 1;
};
$JS$,
$JAVA$class Solution {
    public int removeDuplicates(int[] nums) {
        if (nums.length == 0) return 0;
        int slow = 0;
        for (int fast = 1; fast < nums.length; fast++) {
            if (nums[fast] != nums[slow]) {
                slow++;
                nums[slow] = nums[fast];
            }
        }
        return slow + 1;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('move-zeroes', 1, 'Slow-Fast Swap',
'Slow pointer = next write position for non-zeros. Every time fast finds a non-zero, swap it into slow and advance slow.',
'["slow = 0.","For fast from 0 to n - 1: if nums[fast] != 0, swap nums[slow] and nums[fast]; slow += 1.","Loop finishes with zeros pushed to the end and non-zeros in their original order."]'::jsonb,
$PY$class Solution:
    def moveZeroes(self, nums: List[int]) -> None:
        slow = 0
        for fast in range(len(nums)):
            if nums[fast] != 0:
                nums[slow], nums[fast] = nums[fast], nums[slow]
                slow += 1
$PY$,
$JS$var moveZeroes = function(nums) {
    let slow = 0;
    for (let fast = 0; fast < nums.length; fast++) {
        if (nums[fast] !== 0) {
            [nums[slow], nums[fast]] = [nums[fast], nums[slow]];
            slow++;
        }
    }
};
$JS$,
$JAVA$class Solution {
    public void moveZeroes(int[] nums) {
        int slow = 0;
        for (int fast = 0; fast < nums.length; fast++) {
            if (nums[fast] != 0) {
                int tmp = nums[slow];
                nums[slow] = nums[fast];
                nums[fast] = tmp;
                slow++;
            }
        }
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('sort-colors', 1, 'Dutch National Flag',
'Three pointers: low is the boundary of 0s, mid is the scan cursor, high is the boundary of 2s. Partition in a single pass.',
'["low = mid = 0, high = n - 1.","While mid <= high: if nums[mid] == 0, swap with low, advance both.","If nums[mid] == 1, just advance mid.","If nums[mid] == 2, swap with high, decrement high (do NOT advance mid since the swapped-in value is unknown)."]'::jsonb,
$PY$class Solution:
    def sortColors(self, nums: List[int]) -> None:
        low, mid, high = 0, 0, len(nums) - 1
        while mid <= high:
            if nums[mid] == 0:
                nums[low], nums[mid] = nums[mid], nums[low]
                low += 1
                mid += 1
            elif nums[mid] == 1:
                mid += 1
            else:
                nums[mid], nums[high] = nums[high], nums[mid]
                high -= 1
$PY$,
$JS$var sortColors = function(nums) {
    let low = 0, mid = 0, high = nums.length - 1;
    while (mid <= high) {
        if (nums[mid] === 0) {
            [nums[low], nums[mid]] = [nums[mid], nums[low]];
            low++; mid++;
        } else if (nums[mid] === 1) {
            mid++;
        } else {
            [nums[mid], nums[high]] = [nums[high], nums[mid]];
            high--;
        }
    }
};
$JS$,
$JAVA$class Solution {
    public void sortColors(int[] nums) {
        int low = 0, mid = 0, high = nums.length - 1;
        while (mid <= high) {
            if (nums[mid] == 0) { int t = nums[low]; nums[low++] = nums[mid]; nums[mid++] = t; }
            else if (nums[mid] == 1) mid++;
            else { int t = nums[mid]; nums[mid] = nums[high]; nums[high--] = t; }
        }
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('squares-sorted-array', 1, 'Two Pointers from Both Ends',
'After squaring, the largest values live at the ORIGINAL extremes (most negative or most positive). Two pointers from both ends let us fill the result array from the end in one pass.',
'["l = 0, r = n - 1, write = n - 1, result = new array of length n.","While l <= r: if abs(nums[l]) > abs(nums[r]), result[write] = nums[l]^2; l += 1.","Else result[write] = nums[r]^2; r -= 1.","write -= 1; return result."]'::jsonb,
$PY$class Solution:
    def sortedSquares(self, nums: List[int]) -> List[int]:
        n = len(nums)
        result = [0] * n
        l, r, write = 0, n - 1, n - 1
        while l <= r:
            if abs(nums[l]) > abs(nums[r]):
                result[write] = nums[l] * nums[l]
                l += 1
            else:
                result[write] = nums[r] * nums[r]
                r -= 1
            write -= 1
        return result
$PY$,
$JS$var sortedSquares = function(nums) {
    const n = nums.length;
    const result = new Array(n);
    let l = 0, r = n - 1, write = n - 1;
    while (l <= r) {
        if (Math.abs(nums[l]) > Math.abs(nums[r])) {
            result[write--] = nums[l] * nums[l];
            l++;
        } else {
            result[write--] = nums[r] * nums[r];
            r--;
        }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public int[] sortedSquares(int[] nums) {
        int n = nums.length;
        int[] result = new int[n];
        int l = 0, r = n - 1, write = n - 1;
        while (l <= r) {
            if (Math.abs(nums[l]) > Math.abs(nums[r])) {
                result[write--] = nums[l] * nums[l];
                l++;
            } else {
                result[write--] = nums[r] * nums[r];
                r--;
            }
        }
        return result;
    }
}
$JAVA$,
'O(n)', 'O(n)'),

('is-subsequence', 1, 'Two Pointers',
'One pointer in s, one in t. Always advance in t; advance in s only on a match. If s is exhausted before t ends, it is a subsequence.',
'["i = 0, j = 0.","While i < len(s) and j < len(t): if s[i] == t[j], advance both; else advance only j.","Return i == len(s)."]'::jsonb,
$PY$class Solution:
    def isSubsequence(self, s: str, t: str) -> bool:
        i, j = 0, 0
        while i < len(s) and j < len(t):
            if s[i] == t[j]:
                i += 1
            j += 1
        return i == len(s)
$PY$,
$JS$var isSubsequence = function(s, t) {
    let i = 0, j = 0;
    while (i < s.length && j < t.length) {
        if (s[i] === t[j]) i++;
        j++;
    }
    return i === s.length;
};
$JS$,
$JAVA$class Solution {
    public boolean isSubsequence(String s, String t) {
        int i = 0, j = 0;
        while (i < s.length() && j < t.length()) {
            if (s.charAt(i) == t.charAt(j)) i++;
            j++;
        }
        return i == s.length();
    }
}
$JAVA$,
'O(n + m)', 'O(1)');

COMMIT;
SELECT COUNT(*) AS two_pointers_solutions FROM public."PGcode_solution_approaches" sa JOIN public."PGcode_problems" p ON p.id=sa.problem_id WHERE p.topic_id='two-pointers';
