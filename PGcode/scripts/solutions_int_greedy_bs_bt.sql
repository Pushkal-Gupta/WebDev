-- Solution approaches: intervals (4) + greedy (4) + binary-search (4) + backtracking (4)
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'insert-interval','merge-intervals','non-overlapping-intervals','meeting-rooms',
  'max-subarray','jump-game','gas-station','hand-of-straights',
  'search-rotated','find-min-rotated','koko-bananas','search-2d-matrix',
  'subsets','combination-sum','permutations','word-search'
);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES

-- ==================== INTERVALS ====================

('insert-interval', 1, 'Three-Phase Walk',
'Split the sorted intervals into three groups relative to newInterval: those ending strictly before it, those overlapping it (merge with newInterval), and those starting strictly after. Emit them in that order.',
'["result = [], i = 0, n = len(intervals).","Phase 1: while i < n and intervals[i][1] < newInterval[0]: append intervals[i]; i += 1.","Phase 2: while i < n and intervals[i][0] <= newInterval[1]: merge by updating newInterval = [min(starts), max(ends)]; i += 1.","Append newInterval.","Phase 3: append remaining intervals."]'::jsonb,
$PY$class Solution:
    def insert(self, intervals: List[List[int]], newInterval: List[int]) -> List[List[int]]:
        result = []
        i, n = 0, len(intervals)
        while i < n and intervals[i][1] < newInterval[0]:
            result.append(intervals[i])
            i += 1
        while i < n and intervals[i][0] <= newInterval[1]:
            newInterval[0] = min(newInterval[0], intervals[i][0])
            newInterval[1] = max(newInterval[1], intervals[i][1])
            i += 1
        result.append(newInterval)
        while i < n:
            result.append(intervals[i])
            i += 1
        return result
$PY$,
$JS$var insert = function(intervals, newInterval) {
    const result = [];
    let i = 0, n = intervals.length;
    while (i < n && intervals[i][1] < newInterval[0]) result.push(intervals[i++]);
    while (i < n && intervals[i][0] <= newInterval[1]) {
        newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
        newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
        i++;
    }
    result.push(newInterval);
    while (i < n) result.push(intervals[i++]);
    return result;
};
$JS$,
$JAVA$class Solution {
    public int[][] insert(int[][] intervals, int[] newInterval) {
        List<int[]> result = new ArrayList<>();
        int i = 0, n = intervals.length;
        while (i < n && intervals[i][1] < newInterval[0]) result.add(intervals[i++]);
        while (i < n && intervals[i][0] <= newInterval[1]) {
            newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
            newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
            i++;
        }
        result.add(newInterval);
        while (i < n) result.add(intervals[i++]);
        return result.toArray(new int[0][]);
    }
}
$JAVA$,
'O(n)', 'O(n)'),

('merge-intervals', 1, 'Sort and Merge',
'After sorting by start, two intervals overlap iff the next start is at most the last end. Walk through and extend the last merged interval''s end when overlapping.',
'["Sort intervals by start.","merged = [intervals[0]].","For each subsequent interval: if it overlaps merged[-1], update merged[-1][1] = max(...); else append it.","Return merged."]'::jsonb,
$PY$class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        intervals.sort(key=lambda x: x[0])
        merged = [intervals[0]]
        for start, end in intervals[1:]:
            if start <= merged[-1][1]:
                merged[-1][1] = max(merged[-1][1], end)
            else:
                merged.append([start, end])
        return merged
$PY$,
$JS$var merge = function(intervals) {
    intervals.sort((a, b) => a[0] - b[0]);
    const merged = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
        const [start, end] = intervals[i];
        if (start <= merged[merged.length - 1][1]) {
            merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
        } else {
            merged.push([start, end]);
        }
    }
    return merged;
};
$JS$,
$JAVA$class Solution {
    public int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
        List<int[]> merged = new ArrayList<>();
        merged.add(intervals[0]);
        for (int i = 1; i < intervals.length; i++) {
            int[] last = merged.get(merged.size() - 1);
            if (intervals[i][0] <= last[1]) {
                last[1] = Math.max(last[1], intervals[i][1]);
            } else {
                merged.add(intervals[i]);
            }
        }
        return merged.toArray(new int[0][]);
    }
}
$JAVA$,
'O(n log n)', 'O(n)'),

('non-overlapping-intervals', 1, 'Activity Selection (Sort by End)',
'Sorting by END time lets us greedily keep intervals that finish earliest, maximizing how many we can fit without overlap. The answer is total - kept.',
'["Sort intervals by end.","kept = 1, end = intervals[0][1].","For each subsequent interval: if interval.start >= end, keep it; kept += 1; end = interval.end.","Return n - kept."]'::jsonb,
$PY$class Solution:
    def eraseOverlapIntervals(self, intervals: List[List[int]]) -> int:
        intervals.sort(key=lambda x: x[1])
        kept = 1
        end = intervals[0][1]
        for i in range(1, len(intervals)):
            if intervals[i][0] >= end:
                kept += 1
                end = intervals[i][1]
        return len(intervals) - kept
$PY$,
$JS$var eraseOverlapIntervals = function(intervals) {
    intervals.sort((a, b) => a[1] - b[1]);
    let kept = 1, end = intervals[0][1];
    for (let i = 1; i < intervals.length; i++) {
        if (intervals[i][0] >= end) {
            kept++;
            end = intervals[i][1];
        }
    }
    return intervals.length - kept;
};
$JS$,
$JAVA$class Solution {
    public int eraseOverlapIntervals(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> a[1] - b[1]);
        int kept = 1, end = intervals[0][1];
        for (int i = 1; i < intervals.length; i++) {
            if (intervals[i][0] >= end) {
                kept++;
                end = intervals[i][1];
            }
        }
        return intervals.length - kept;
    }
}
$JAVA$,
'O(n log n)', 'O(1)'),

('meeting-rooms', 1, 'Sort and Compare Adjacent',
'Sort by start time. A conflict exists iff any interval starts before the previous one ends.',
'["Sort intervals by start.","For i from 1 to n - 1: if intervals[i][0] < intervals[i-1][1], return false.","Return true."]'::jsonb,
$PY$class Solution:
    def canAttendMeetings(self, intervals: List[List[int]]) -> bool:
        intervals.sort(key=lambda x: x[0])
        for i in range(1, len(intervals)):
            if intervals[i][0] < intervals[i-1][1]:
                return False
        return True
$PY$,
$JS$var canAttendMeetings = function(intervals) {
    intervals.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < intervals.length; i++) {
        if (intervals[i][0] < intervals[i-1][1]) return false;
    }
    return true;
};
$JS$,
$JAVA$class Solution {
    public boolean canAttendMeetings(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
        for (int i = 1; i < intervals.length; i++) {
            if (intervals[i][0] < intervals[i-1][1]) return false;
        }
        return true;
    }
}
$JAVA$,
'O(n log n)', 'O(1)'),

-- ==================== GREEDY ====================

('max-subarray', 1, 'Kadane',
'Track the best subarray sum ending at the current index. At each step we either extend the previous best or start fresh at nums[i]. The global maximum of these is the answer.',
'["current = nums[0], best = nums[0].","For i from 1 to n - 1: current = max(nums[i], current + nums[i]).","best = max(best, current).","Return best."]'::jsonb,
$PY$class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        current = best = nums[0]
        for i in range(1, len(nums)):
            current = max(nums[i], current + nums[i])
            if current > best:
                best = current
        return best
$PY$,
$JS$var maxSubArray = function(nums) {
    let current = nums[0], best = nums[0];
    for (let i = 1; i < nums.length; i++) {
        current = Math.max(nums[i], current + nums[i]);
        if (current > best) best = current;
    }
    return best;
};
$JS$,
$JAVA$class Solution {
    public int maxSubArray(int[] nums) {
        int current = nums[0], best = nums[0];
        for (int i = 1; i < nums.length; i++) {
            current = Math.max(nums[i], current + nums[i]);
            if (current > best) best = current;
        }
        return best;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('jump-game', 1, 'Greedy Reachable Index',
'Track the farthest index we can reach. If at any point i exceeds that, we are stuck. Otherwise updating farthest as we go determines whether the last index is reachable.',
'["farthest = 0.","For i from 0 to n - 1: if i > farthest, return false.","farthest = max(farthest, i + nums[i]).","Return true."]'::jsonb,
$PY$class Solution:
    def canJump(self, nums: List[int]) -> bool:
        farthest = 0
        for i, jump in enumerate(nums):
            if i > farthest:
                return False
            if i + jump > farthest:
                farthest = i + jump
        return True
$PY$,
$JS$var canJump = function(nums) {
    let farthest = 0;
    for (let i = 0; i < nums.length; i++) {
        if (i > farthest) return false;
        if (i + nums[i] > farthest) farthest = i + nums[i];
    }
    return true;
};
$JS$,
$JAVA$class Solution {
    public boolean canJump(int[] nums) {
        int farthest = 0;
        for (int i = 0; i < nums.length; i++) {
            if (i > farthest) return false;
            if (i + nums[i] > farthest) farthest = i + nums[i];
        }
        return true;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('gas-station', 1, 'Single-Pass Greedy',
'If total gas >= total cost, a valid start exists. As you walk, whenever the running tank drops below zero, none of the stations between the last candidate and the current one can work; reset the candidate to i + 1.',
'["If sum(gas) < sum(cost), return -1.","start = 0, tank = 0.","For i from 0 to n - 1: tank += gas[i] - cost[i]. If tank < 0: start = i + 1; tank = 0.","Return start."]'::jsonb,
$PY$class Solution:
    def canCompleteCircuit(self, gas: List[int], cost: List[int]) -> int:
        if sum(gas) < sum(cost):
            return -1
        start = tank = 0
        for i in range(len(gas)):
            tank += gas[i] - cost[i]
            if tank < 0:
                start = i + 1
                tank = 0
        return start
$PY$,
$JS$var canCompleteCircuit = function(gas, cost) {
    let total = 0, tank = 0, start = 0;
    for (let i = 0; i < gas.length; i++) {
        const diff = gas[i] - cost[i];
        total += diff;
        tank += diff;
        if (tank < 0) {
            start = i + 1;
            tank = 0;
        }
    }
    return total < 0 ? -1 : start;
};
$JS$,
$JAVA$class Solution {
    public int canCompleteCircuit(int[] gas, int[] cost) {
        int total = 0, tank = 0, start = 0;
        for (int i = 0; i < gas.length; i++) {
            int diff = gas[i] - cost[i];
            total += diff;
            tank += diff;
            if (tank < 0) { start = i + 1; tank = 0; }
        }
        return total < 0 ? -1 : start;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('hand-of-straights', 1, 'Sorted Counter Greedy',
'Take the smallest remaining card and build a run of length groupSize starting there. If any card in that run has count 0, the grouping fails.',
'["If len(hand) % groupSize != 0, return false.","Sort the unique cards and maintain a frequency counter.","For each card v in sorted order: if count[v] == 0, skip.","Otherwise consume count[v] copies of v, v+1, ..., v+groupSize-1 (return false if any is missing)."]'::jsonb,
$PY$class Solution:
    def isNStraightHand(self, hand: List[int], groupSize: int) -> bool:
        if len(hand) % groupSize != 0:
            return False
        from collections import Counter
        count = Counter(hand)
        for v in sorted(count):
            c = count[v]
            if c == 0:
                continue
            for k in range(groupSize):
                if count[v + k] < c:
                    return False
                count[v + k] -= c
        return True
$PY$,
$JS$var isNStraightHand = function(hand, groupSize) {
    if (hand.length % groupSize !== 0) return false;
    const count = new Map();
    for (const c of hand) count.set(c, (count.get(c) || 0) + 1);
    const keys = [...count.keys()].sort((a, b) => a - b);
    for (const v of keys) {
        const c = count.get(v);
        if (c === 0) continue;
        for (let k = 0; k < groupSize; k++) {
            if ((count.get(v + k) || 0) < c) return false;
            count.set(v + k, count.get(v + k) - c);
        }
    }
    return true;
};
$JS$,
$JAVA$class Solution {
    public boolean isNStraightHand(int[] hand, int groupSize) {
        if (hand.length % groupSize != 0) return false;
        TreeMap<Integer, Integer> count = new TreeMap<>();
        for (int c : hand) count.merge(c, 1, Integer::sum);
        while (!count.isEmpty()) {
            int first = count.firstKey();
            int c = count.get(first);
            for (int k = 0; k < groupSize; k++) {
                int key = first + k;
                if (!count.containsKey(key) || count.get(key) < c) return false;
                if (count.get(key) == c) count.remove(key);
                else count.put(key, count.get(key) - c);
            }
        }
        return true;
    }
}
$JAVA$,
'O(n log n)', 'O(n)'),

-- ==================== BINARY-SEARCH ====================

('search-rotated', 1, 'Modified Binary Search',
'In a rotated sorted array, one of the halves nums[lo..mid] or nums[mid..hi] is always sorted. Check which, then decide whether the target falls inside that sorted range.',
'["lo = 0, hi = n - 1.","While lo <= hi: mid = (lo + hi) // 2. If nums[mid] == target, return mid.","If nums[lo] <= nums[mid]: left half is sorted; recurse left iff target is in [nums[lo], nums[mid]).","Else right half is sorted; recurse right iff target is in (nums[mid], nums[hi]]."]'::jsonb,
$PY$class Solution:
    def search(self, nums: List[int], target: int) -> int:
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if nums[mid] == target:
                return mid
            if nums[lo] <= nums[mid]:
                if nums[lo] <= target < nums[mid]:
                    hi = mid - 1
                else:
                    lo = mid + 1
            else:
                if nums[mid] < target <= nums[hi]:
                    lo = mid + 1
                else:
                    hi = mid - 1
        return -1
$PY$,
$JS$var search = function(nums, target) {
    let lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] === target) return mid;
        if (nums[lo] <= nums[mid]) {
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
};
$JS$,
$JAVA$class Solution {
    public int search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;
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
}
$JAVA$,
'O(log n)', 'O(1)'),

('find-min-rotated', 1, 'Binary Search vs Right End',
'Compare nums[mid] against nums[hi]. If greater, the minimum must be strictly to the right of mid; otherwise it is at mid or to its left. Converge until lo == hi.',
'["lo = 0, hi = n - 1.","While lo < hi: mid = (lo + hi) // 2.","If nums[mid] > nums[hi]: lo = mid + 1.","Else: hi = mid.","Return nums[lo]."]'::jsonb,
$PY$class Solution:
    def findMin(self, nums: List[int]) -> int:
        lo, hi = 0, len(nums) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if nums[mid] > nums[hi]:
                lo = mid + 1
            else:
                hi = mid
        return nums[lo]
$PY$,
$JS$var findMin = function(nums) {
    let lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] > nums[hi]) lo = mid + 1;
        else hi = mid;
    }
    return nums[lo];
};
$JS$,
$JAVA$class Solution {
    public int findMin(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] > nums[hi]) lo = mid + 1;
            else hi = mid;
        }
        return nums[lo];
    }
}
$JAVA$,
'O(log n)', 'O(1)'),

('koko-bananas', 1, 'Binary Search on Answer',
'Koko''s eating speed can be in [1, max(piles)]. Binary search for the smallest speed k that lets her finish all piles within h hours.',
'["lo = 1, hi = max(piles).","While lo < hi: k = (lo + hi) // 2; hours = sum(ceil(pile / k) for pile in piles).","If hours <= h, hi = k; else lo = k + 1.","Return lo."]'::jsonb,
$PY$class Solution:
    def minEatingSpeed(self, piles: List[int], h: int) -> int:
        lo, hi = 1, max(piles)
        while lo < hi:
            k = (lo + hi) // 2
            hours = sum((pile + k - 1) // k for pile in piles)
            if hours <= h:
                hi = k
            else:
                lo = k + 1
        return lo
$PY$,
$JS$var minEatingSpeed = function(piles, h) {
    let lo = 1, hi = Math.max(...piles);
    while (lo < hi) {
        const k = (lo + hi) >> 1;
        let hours = 0;
        for (const pile of piles) hours += Math.ceil(pile / k);
        if (hours <= h) hi = k;
        else lo = k + 1;
    }
    return lo;
};
$JS$,
$JAVA$class Solution {
    public int minEatingSpeed(int[] piles, int h) {
        int lo = 1, hi = 0;
        for (int p : piles) hi = Math.max(hi, p);
        while (lo < hi) {
            int k = (lo + hi) >>> 1;
            long hours = 0;
            for (int p : piles) hours += (p + k - 1) / k;
            if (hours <= h) hi = k;
            else lo = k + 1;
        }
        return lo;
    }
}
$JAVA$,
'O(n log max(piles))', 'O(1)'),

('search-2d-matrix', 1, 'Treat as Flat Sorted Array',
'Because rows are sorted AND the first element of each row is greater than the last of the previous, the whole matrix is a single sorted sequence. Binary-search across m*n indices, converting to (row, col) when reading.',
'["lo = 0, hi = m * n - 1.","While lo <= hi: mid = (lo + hi) // 2; value = matrix[mid // n][mid % n].","If value == target, return true; if value < target, lo = mid + 1; else hi = mid - 1.","Return false."]'::jsonb,
$PY$class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        m, n = len(matrix), len(matrix[0])
        lo, hi = 0, m * n - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            value = matrix[mid // n][mid % n]
            if value == target:
                return True
            if value < target:
                lo = mid + 1
            else:
                hi = mid - 1
        return False
$PY$,
$JS$var searchMatrix = function(matrix, target) {
    const m = matrix.length, n = matrix[0].length;
    let lo = 0, hi = m * n - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const value = matrix[Math.floor(mid / n)][mid % n];
        if (value === target) return true;
        if (value < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return false;
};
$JS$,
$JAVA$class Solution {
    public boolean searchMatrix(int[][] matrix, int target) {
        int m = matrix.length, n = matrix[0].length;
        int lo = 0, hi = m * n - 1;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;
            int value = matrix[mid / n][mid % n];
            if (value == target) return true;
            if (value < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return false;
    }
}
$JAVA$,
'O(log(m*n))', 'O(1)'),

-- ==================== BACKTRACKING ====================

('subsets', 1, 'Backtracking Decision Tree',
'At each index decide to include or skip the current element, then recurse on the next index. When the index reaches n, snapshot the current path.',
'["path = [], result = [].","def dfs(i): if i == n: result.append(path.copy()); return.","Include: path.append(nums[i]); dfs(i + 1); path.pop().","Skip: dfs(i + 1)."]'::jsonb,
$PY$class Solution:
    def subsets(self, nums: List[int]) -> List[List[int]]:
        result = []
        path = []
        def dfs(i):
            if i == len(nums):
                result.append(path.copy())
                return
            path.append(nums[i])
            dfs(i + 1)
            path.pop()
            dfs(i + 1)
        dfs(0)
        return result
$PY$,
$JS$var subsets = function(nums) {
    const result = [];
    const path = [];
    const dfs = (i) => {
        if (i === nums.length) {
            result.push([...path]);
            return;
        }
        path.push(nums[i]);
        dfs(i + 1);
        path.pop();
        dfs(i + 1);
    };
    dfs(0);
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        dfs(nums, 0, new ArrayList<>(), result);
        return result;
    }
    private void dfs(int[] nums, int i, List<Integer> path, List<List<Integer>> result) {
        if (i == nums.length) { result.add(new ArrayList<>(path)); return; }
        path.add(nums[i]);
        dfs(nums, i + 1, path, result);
        path.remove(path.size() - 1);
        dfs(nums, i + 1, path, result);
    }
}
$JAVA$,
'O(2^n * n)', 'O(n)'),

('combination-sum', 1, 'Backtracking with Reuse',
'Branch on either "use candidates[i] again" (staying at index i) or "advance to i + 1". Record the path when remaining reaches 0, and prune when it goes negative.',
'["path = [], result = [].","def dfs(i, remaining): if remaining == 0: result.append(path.copy()); return.","If remaining < 0 or i == n: return.","Include candidates[i]: path.append; dfs(i, remaining - candidates[i]); path.pop.","Skip: dfs(i + 1, remaining)."]'::jsonb,
$PY$class Solution:
    def combinationSum(self, candidates: List[int], target: int) -> List[List[int]]:
        result = []
        path = []
        def dfs(i, remaining):
            if remaining == 0:
                result.append(path.copy())
                return
            if remaining < 0 or i == len(candidates):
                return
            path.append(candidates[i])
            dfs(i, remaining - candidates[i])
            path.pop()
            dfs(i + 1, remaining)
        dfs(0, target)
        return result
$PY$,
$JS$var combinationSum = function(candidates, target) {
    const result = [];
    const path = [];
    const dfs = (i, remaining) => {
        if (remaining === 0) { result.push([...path]); return; }
        if (remaining < 0 || i === candidates.length) return;
        path.push(candidates[i]);
        dfs(i, remaining - candidates[i]);
        path.pop();
        dfs(i + 1, remaining);
    };
    dfs(0, target);
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> result = new ArrayList<>();
        dfs(candidates, 0, target, new ArrayList<>(), result);
        return result;
    }
    private void dfs(int[] c, int i, int remaining, List<Integer> path, List<List<Integer>> result) {
        if (remaining == 0) { result.add(new ArrayList<>(path)); return; }
        if (remaining < 0 || i == c.length) return;
        path.add(c[i]);
        dfs(c, i, remaining - c[i], path, result);
        path.remove(path.size() - 1);
        dfs(c, i + 1, remaining, path, result);
    }
}
$JAVA$,
'O(2^T)', 'O(T)'),

('permutations', 1, 'Backtracking with Visited Array',
'At each recursion level pick any unused element and append it to the current path. When the path reaches length n, record a copy.',
'["used = [False] * n, path = [], result = [].","def dfs(): if len(path) == n: result.append(path.copy()); return.","For each i in 0..n-1 where not used[i]: used[i] = True; path.append(nums[i]); dfs(); path.pop(); used[i] = False."]'::jsonb,
$PY$class Solution:
    def permute(self, nums: List[int]) -> List[List[int]]:
        result = []
        path = []
        used = [False] * len(nums)
        def dfs():
            if len(path) == len(nums):
                result.append(path.copy())
                return
            for i in range(len(nums)):
                if used[i]:
                    continue
                used[i] = True
                path.append(nums[i])
                dfs()
                path.pop()
                used[i] = False
        dfs()
        return result
$PY$,
$JS$var permute = function(nums) {
    const result = [];
    const path = [];
    const used = new Array(nums.length).fill(false);
    const dfs = () => {
        if (path.length === nums.length) { result.push([...path]); return; }
        for (let i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            path.push(nums[i]);
            dfs();
            path.pop();
            used[i] = false;
        }
    };
    dfs();
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        boolean[] used = new boolean[nums.length];
        dfs(nums, used, new ArrayList<>(), result);
        return result;
    }
    private void dfs(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> result) {
        if (path.size() == nums.length) { result.add(new ArrayList<>(path)); return; }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            path.add(nums[i]);
            dfs(nums, used, path, result);
            path.remove(path.size() - 1);
            used[i] = false;
        }
    }
}
$JAVA$,
'O(n * n!)', 'O(n)'),

('word-search', 1, 'DFS with Visited Marking',
'From each cell, DFS in four directions trying to match successive characters of word. Mark visited cells with a sentinel and restore on backtrack.',
'["For each cell (r, c): if dfs(r, c, 0) returns true, return true.","dfs(r, c, i): if i == len(word), return true. Check bounds and board[r][c] == word[i]; otherwise return false.","Mark board[r][c] = ''#''.","Recurse into 4 neighbors with i + 1; unmark and return any hit."]'::jsonb,
$PY$class Solution:
    def exist(self, board: List[List[str]], word: str) -> bool:
        rows, cols = len(board), len(board[0])
        def dfs(r, c, i):
            if i == len(word):
                return True
            if r < 0 or r >= rows or c < 0 or c >= cols or board[r][c] != word[i]:
                return False
            tmp = board[r][c]
            board[r][c] = '#'
            found = (dfs(r + 1, c, i + 1) or dfs(r - 1, c, i + 1) or
                     dfs(r, c + 1, i + 1) or dfs(r, c - 1, i + 1))
            board[r][c] = tmp
            return found
        for r in range(rows):
            for c in range(cols):
                if dfs(r, c, 0):
                    return True
        return False
$PY$,
$JS$var exist = function(board, word) {
    const rows = board.length, cols = board[0].length;
    const dfs = (r, c, i) => {
        if (i === word.length) return true;
        if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== word[i]) return false;
        const tmp = board[r][c];
        board[r][c] = '#';
        const found = dfs(r + 1, c, i + 1) || dfs(r - 1, c, i + 1) ||
                      dfs(r, c + 1, i + 1) || dfs(r, c - 1, i + 1);
        board[r][c] = tmp;
        return found;
    };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (dfs(r, c, 0)) return true;
    }
    return false;
};
$JS$,
$JAVA$class Solution {
    public boolean exist(char[][] board, String word) {
        int rows = board.length, cols = board[0].length;
        for (int r = 0; r < rows; r++) for (int c = 0; c < cols; c++) {
            if (dfs(board, r, c, 0, word)) return true;
        }
        return false;
    }
    private boolean dfs(char[][] board, int r, int c, int i, String word) {
        if (i == word.length()) return true;
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length || board[r][c] != word.charAt(i)) return false;
        char tmp = board[r][c];
        board[r][c] = '#';
        boolean found = dfs(board, r + 1, c, i + 1, word) || dfs(board, r - 1, c, i + 1, word) ||
                        dfs(board, r, c + 1, i + 1, word) || dfs(board, r, c - 1, i + 1, word);
        board[r][c] = tmp;
        return found;
    }
}
$JAVA$,
'O(cells * 4^L)', 'O(L)');

COMMIT;
SELECT (SELECT COUNT(*) FROM public."PGcode_solution_approaches") AS total_solutions;
