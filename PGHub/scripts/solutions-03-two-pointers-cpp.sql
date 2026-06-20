-- C++ reference solutions for two-pointers (10 problems).
BEGIN;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool isPalindrome(string& s) {
        int l = 0, r = s.size() - 1;
        while (l < r) {
            while (l < r && !isalnum((unsigned char)s[l])) l++;
            while (l < r && !isalnum((unsigned char)s[r])) r--;
            if (tolower((unsigned char)s[l]) != tolower((unsigned char)s[r])) return false;
            l++; r--;
        }
        return true;
    }
};
$CPP$ WHERE problem_id = 'valid-palindrome' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<int> twoSum(vector<int>& numbers, int target) {
        int l = 0, r = numbers.size() - 1;
        while (l < r) {
            int s = numbers[l] + numbers[r];
            if (s == target) return {l + 1, r + 1};
            if (s < target) l++;
            else r--;
        }
        return {};
    }
};
$CPP$ WHERE problem_id = 'two-sum-ii' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> result;
        int n = nums.size();
        for (int i = 0; i < n - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = n - 1;
            while (l < r) {
                int s = nums[i] + nums[l] + nums[r];
                if (s == 0) {
                    result.push_back({nums[i], nums[l], nums[r]});
                    l++; r--;
                    while (l < r && nums[l] == nums[l - 1]) l++;
                    while (l < r && nums[r] == nums[r + 1]) r--;
                } else if (s < 0) l++;
                else r--;
            }
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'three-sum' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int maxArea(vector<int>& height) {
        int l = 0, r = height.size() - 1, best = 0;
        while (l < r) {
            int area = min(height[l], height[r]) * (r - l);
            if (area > best) best = area;
            if (height[l] < height[r]) l++;
            else r--;
        }
        return best;
    }
};
$CPP$ WHERE problem_id = 'container-most-water' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int trap(vector<int>& height) {
        int l = 0, r = height.size() - 1;
        int leftMax = 0, rightMax = 0, total = 0;
        while (l < r) {
            if (height[l] < height[r]) {
                leftMax = max(leftMax, height[l]);
                total += leftMax - height[l];
                l++;
            } else {
                rightMax = max(rightMax, height[r]);
                total += rightMax - height[r];
                r--;
            }
        }
        return total;
    }
};
$CPP$ WHERE problem_id = 'trapping-rain-water' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int removeDuplicates(vector<int>& nums) {
        if (nums.empty()) return 0;
        int slow = 0;
        for (int fast = 1; fast < (int)nums.size(); fast++) {
            if (nums[fast] != nums[slow]) {
                slow++;
                nums[slow] = nums[fast];
            }
        }
        return slow + 1;
    }
};
$CPP$ WHERE problem_id = 'remove-duplicates-sorted' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    void moveZeroes(vector<int>& nums) {
        int slow = 0;
        for (int fast = 0; fast < (int)nums.size(); fast++) {
            if (nums[fast] != 0) {
                swap(nums[slow], nums[fast]);
                slow++;
            }
        }
    }
};
$CPP$ WHERE problem_id = 'move-zeroes' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    void sortColors(vector<int>& nums) {
        int low = 0, mid = 0, high = nums.size() - 1;
        while (mid <= high) {
            if (nums[mid] == 0) swap(nums[low++], nums[mid++]);
            else if (nums[mid] == 1) mid++;
            else swap(nums[mid], nums[high--]);
        }
    }
};
$CPP$ WHERE problem_id = 'sort-colors' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<int> sortedSquares(vector<int>& nums) {
        int n = nums.size();
        vector<int> result(n);
        int l = 0, r = n - 1, write = n - 1;
        while (l <= r) {
            if (abs(nums[l]) > abs(nums[r])) {
                result[write--] = nums[l] * nums[l];
                l++;
            } else {
                result[write--] = nums[r] * nums[r];
                r--;
            }
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'squares-sorted-array' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool isSubsequence(string& s, string& t) {
        int i = 0, j = 0;
        while (i < (int)s.size() && j < (int)t.size()) {
            if (s[i] == t[j]) i++;
            j++;
        }
        return i == (int)s.size();
    }
};
$CPP$ WHERE problem_id = 'is-subsequence' AND approach_number = 1;

COMMIT;
