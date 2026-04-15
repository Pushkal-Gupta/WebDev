-- C++ reference solutions for intervals + greedy + binary-search + backtracking (16 problems).
BEGIN;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<vector<int>> insert(vector<vector<int>>& intervals, vector<int>& newInterval) {
        vector<vector<int>> result;
        int i = 0, n = intervals.size();
        while (i < n && intervals[i][1] < newInterval[0]) result.push_back(intervals[i++]);
        while (i < n && intervals[i][0] <= newInterval[1]) {
            newInterval[0] = min(newInterval[0], intervals[i][0]);
            newInterval[1] = max(newInterval[1], intervals[i][1]);
            i++;
        }
        result.push_back(newInterval);
        while (i < n) result.push_back(intervals[i++]);
        return result;
    }
};
$CPP$ WHERE problem_id = 'insert-interval' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        vector<vector<int>> merged = { intervals[0] };
        for (int i = 1; i < (int)intervals.size(); i++) {
            if (intervals[i][0] <= merged.back()[1]) {
                merged.back()[1] = max(merged.back()[1], intervals[i][1]);
            } else {
                merged.push_back(intervals[i]);
            }
        }
        return merged;
    }
};
$CPP$ WHERE problem_id = 'merge-intervals' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int eraseOverlapIntervals(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[1] < b[1]; });
        int kept = 1, end = intervals[0][1];
        for (int i = 1; i < (int)intervals.size(); i++) {
            if (intervals[i][0] >= end) {
                kept++;
                end = intervals[i][1];
            }
        }
        return (int)intervals.size() - kept;
    }
};
$CPP$ WHERE problem_id = 'non-overlapping-intervals' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool canAttendMeetings(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        for (int i = 1; i < (int)intervals.size(); i++) {
            if (intervals[i][0] < intervals[i-1][1]) return false;
        }
        return true;
    }
};
$CPP$ WHERE problem_id = 'meeting-rooms' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int current = nums[0], best = nums[0];
        for (int i = 1; i < (int)nums.size(); i++) {
            current = max(nums[i], current + nums[i]);
            if (current > best) best = current;
        }
        return best;
    }
};
$CPP$ WHERE problem_id = 'max-subarray' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool canJump(vector<int>& nums) {
        int farthest = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            if (i > farthest) return false;
            if (i + nums[i] > farthest) farthest = i + nums[i];
        }
        return true;
    }
};
$CPP$ WHERE problem_id = 'jump-game' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {
        int total = 0, tank = 0, start = 0;
        for (int i = 0; i < (int)gas.size(); i++) {
            int diff = gas[i] - cost[i];
            total += diff;
            tank += diff;
            if (tank < 0) { start = i + 1; tank = 0; }
        }
        return total < 0 ? -1 : start;
    }
};
$CPP$ WHERE problem_id = 'gas-station' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool isNStraightHand(vector<int>& hand, int groupSize) {
        if ((int)hand.size() % groupSize != 0) return false;
        map<int, int> count;
        for (int c : hand) count[c]++;
        while (!count.empty()) {
            int first = count.begin()->first;
            int c = count.begin()->second;
            for (int k = 0; k < groupSize; k++) {
                auto it = count.find(first + k);
                if (it == count.end() || it->second < c) return false;
                it->second -= c;
                if (it->second == 0) count.erase(it);
            }
        }
        return true;
    }
};
$CPP$ WHERE problem_id = 'hand-of-straights' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int search(vector<int>& nums, int target) {
        int lo = 0, hi = nums.size() - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] == target) return mid;
            if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }
};
$CPP$ WHERE problem_id = 'search-rotated' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int findMin(vector<int>& nums) {
        int lo = 0, hi = nums.size() - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] > nums[hi]) lo = mid + 1;
            else hi = mid;
        }
        return nums[lo];
    }
};
$CPP$ WHERE problem_id = 'find-min-rotated' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int minEatingSpeed(vector<int>& piles, int h) {
        int lo = 1, hi = *max_element(piles.begin(), piles.end());
        while (lo < hi) {
            int k = (lo + hi) / 2;
            long long hours = 0;
            for (int p : piles) hours += (p + k - 1) / k;
            if (hours <= h) hi = k;
            else lo = k + 1;
        }
        return lo;
    }
};
$CPP$ WHERE problem_id = 'koko-bananas' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool searchMatrix(vector<vector<int>>& matrix, int target) {
        int m = matrix.size(), n = matrix[0].size();
        int lo = 0, hi = m * n - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            int value = matrix[mid / n][mid % n];
            if (value == target) return true;
            if (value < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return false;
    }
};
$CPP$ WHERE problem_id = 'search-2d-matrix' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<vector<int>> subsets(vector<int>& nums) {
        vector<vector<int>> result;
        vector<int> path;
        function<void(int)> dfs = [&](int i) {
            if (i == (int)nums.size()) { result.push_back(path); return; }
            path.push_back(nums[i]);
            dfs(i + 1);
            path.pop_back();
            dfs(i + 1);
        };
        dfs(0);
        return result;
    }
};
$CPP$ WHERE problem_id = 'subsets' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
        vector<vector<int>> result;
        vector<int> path;
        function<void(int, int)> dfs = [&](int i, int remaining) {
            if (remaining == 0) { result.push_back(path); return; }
            if (remaining < 0 || i == (int)candidates.size()) return;
            path.push_back(candidates[i]);
            dfs(i, remaining - candidates[i]);
            path.pop_back();
            dfs(i + 1, remaining);
        };
        dfs(0, target);
        return result;
    }
};
$CPP$ WHERE problem_id = 'combination-sum' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<vector<int>> permute(vector<int>& nums) {
        vector<vector<int>> result;
        vector<int> path;
        vector<bool> used(nums.size(), false);
        function<void()> dfs = [&]() {
            if (path.size() == nums.size()) { result.push_back(path); return; }
            for (int i = 0; i < (int)nums.size(); i++) {
                if (used[i]) continue;
                used[i] = true;
                path.push_back(nums[i]);
                dfs();
                path.pop_back();
                used[i] = false;
            }
        };
        dfs();
        return result;
    }
};
$CPP$ WHERE problem_id = 'permutations' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool exist(vector<vector<string>>& board, string& word) {
        int rows = board.size(), cols = board[0].size();
        function<bool(int, int, int)> dfs = [&](int r, int c, int i) -> bool {
            if (i == (int)word.size()) return true;
            if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c].empty() || board[r][c][0] != word[i]) return false;
            string tmp = board[r][c];
            board[r][c] = "#";
            bool found = dfs(r + 1, c, i + 1) || dfs(r - 1, c, i + 1)
                       || dfs(r, c + 1, i + 1) || dfs(r, c - 1, i + 1);
            board[r][c] = tmp;
            return found;
        };
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (dfs(r, c, 0)) return true;
        return false;
    }
};
$CPP$ WHERE problem_id = 'word-search' AND approach_number = 1;

COMMIT;
