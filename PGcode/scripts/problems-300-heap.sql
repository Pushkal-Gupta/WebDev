-- Grow catalog 200 → 300: heap topic (+6 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'relative-ranks','single-threaded-cpu','furthest-building-reach',
  'ipo','ugly-number-ii','min-refueling-stops'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'relative-ranks','single-threaded-cpu','furthest-building-reach',
  'ipo','ugly-number-ii','min-refueling-stops'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'relative-ranks','single-threaded-cpu','furthest-building-reach',
  'ipo','ugly-number-ii','min-refueling-stops'
);

-- ============================================================
-- 1) relative-ranks (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('relative-ranks', 'heap', 'Relative Ranks', 'Easy',
$$<p>Given an array <code>score</code> of unique integers, return an array of strings where <code>answer[i]</code> is the rank of <code>score[i]</code>: 1st → "Gold Medal", 2nd → "Silver Medal", 3rd → "Bronze Medal", and any lower rank as its integer string.</p>$$,
'', ARRAY[
  'Sort indices by score descending to determine ranks.',
  'Walk the sorted-index list and assign labels by position: 0→Gold, 1→Silver, 2→Bronze, otherwise (rank+1).',
  'Write each label back into the answer array at its original index.'
], '300', 'https://leetcode.com/problems/relative-ranks/',
'findRelativeRanks',
'[{"name":"score","type":"List[int]"}]'::jsonb,
'List[str]',
'[
  {"inputs":["[5,4,3,2,1]"],"expected":"[\"Gold Medal\",\"Silver Medal\",\"Bronze Medal\",\"4\",\"5\"]"},
  {"inputs":["[10,3,8,9,4]"],"expected":"[\"Gold Medal\",\"5\",\"Bronze Medal\",\"Silver Medal\",\"4\"]"},
  {"inputs":["[1]"],"expected":"[\"Gold Medal\"]"},
  {"inputs":["[1,2]"],"expected":"[\"Silver Medal\",\"Gold Medal\"]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('relative-ranks', 'python',
$PY$class Solution:
    def findRelativeRanks(self, score: List[int]) -> List[str]:
        $PY$),
('relative-ranks', 'javascript',
$JS$var findRelativeRanks = function(score) {

};$JS$),
('relative-ranks', 'java',
$JAVA$class Solution {
    public String[] findRelativeRanks(int[] score) {

    }
}$JAVA$),
('relative-ranks', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> findRelativeRanks(vector<int>& score) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('relative-ranks', 1, 'Sort Indices by Score',
'Sorting the original indices by score descending gives the ranking order. Walking that order, the first three indices get medal strings and the rest get their 1-indexed rank as a string — written back to the correct slot.',
'["Build an array of indices 0..n-1.","Sort those indices by score[i] descending.","Walk them. Assign answer[idx] = \"Gold Medal\" / \"Silver Medal\" / \"Bronze Medal\" for the top three and str(k + 1) otherwise, where k is the 0-indexed rank.","Return answer."]'::jsonb,
$PY$class Solution:
    def findRelativeRanks(self, score: List[int]) -> List[str]:
        n = len(score)
        indices = sorted(range(n), key=lambda i: -score[i])
        labels = ["Gold Medal", "Silver Medal", "Bronze Medal"]
        answer = [""] * n
        for rank, idx in enumerate(indices):
            answer[idx] = labels[rank] if rank < 3 else str(rank + 1)
        return answer
$PY$,
$JS$var findRelativeRanks = function(score) {
    const n = score.length;
    const indices = score.map((_, i) => i).sort((a, b) => score[b] - score[a]);
    const labels = ["Gold Medal", "Silver Medal", "Bronze Medal"];
    const answer = new Array(n);
    for (let rank = 0; rank < n; rank++) {
        answer[indices[rank]] = rank < 3 ? labels[rank] : String(rank + 1);
    }
    return answer;
};
$JS$,
$JAVA$class Solution {
    public String[] findRelativeRanks(int[] score) {
        int n = score.length;
        Integer[] indices = new Integer[n];
        for (int i = 0; i < n; i++) indices[i] = i;
        Arrays.sort(indices, (a, b) -> score[b] - score[a]);
        String[] labels = {"Gold Medal", "Silver Medal", "Bronze Medal"};
        String[] answer = new String[n];
        for (int rank = 0; rank < n; rank++) {
            answer[indices[rank]] = rank < 3 ? labels[rank] : String.valueOf(rank + 1);
        }
        return answer;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<string> findRelativeRanks(vector<int>& score) {
        int n = score.size();
        vector<int> indices(n);
        iota(indices.begin(), indices.end(), 0);
        sort(indices.begin(), indices.end(), [&](int a, int b) { return score[a] > score[b]; });
        vector<string> labels = {"Gold Medal", "Silver Medal", "Bronze Medal"};
        vector<string> answer(n);
        for (int rank = 0; rank < n; rank++) {
            answer[indices[rank]] = rank < 3 ? labels[rank] : to_string(rank + 1);
        }
        return answer;
    }
};
$CPP$,
'O(n log n)', 'O(n)');

-- ============================================================
-- 2) single-threaded-cpu (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('single-threaded-cpu', 'heap', 'Single-Threaded CPU', 'Medium',
$$<p>Given tasks where <code>tasks[i] = [enqueueTime, processingTime]</code>, a single CPU processes tasks in the following order: at any moment, when the CPU is free it runs the task with the smallest processing time among those that have already arrived; ties broken by the smaller original index. The CPU may idle until a task arrives. Return the order in which tasks are processed.</p>$$,
'', ARRAY[
  'Sort tasks by enqueue time and track the original index.',
  'Maintain a min-heap of available tasks keyed by (processing time, original index).',
  'Advance a clock; when the heap is empty, jump to the next enqueue time. Pop the best available task, record its index, advance the clock by its processing time.'
], '300', 'https://leetcode.com/problems/single-threaded-cpu/',
'getOrder',
'[{"name":"tasks","type":"List[List[int]]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[[1,2],[2,4],[3,2],[4,1]]"],"expected":"[0,2,3,1]"},
  {"inputs":["[[7,10],[7,12],[7,5],[7,4],[7,2]]"],"expected":"[4,3,2,0,1]"},
  {"inputs":["[[1,1]]"],"expected":"[0]"},
  {"inputs":["[[100,100],[1,1]]"],"expected":"[1,0]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('single-threaded-cpu', 'python',
$PY$class Solution:
    def getOrder(self, tasks: List[List[int]]) -> List[int]:
        $PY$),
('single-threaded-cpu', 'javascript',
$JS$var getOrder = function(tasks) {

};$JS$),
('single-threaded-cpu', 'java',
$JAVA$class Solution {
    public int[] getOrder(int[][] tasks) {

    }
}$JAVA$),
('single-threaded-cpu', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> getOrder(vector<vector<int>>& tasks) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('single-threaded-cpu', 1, 'Sort by Enqueue + Min-Heap by Processing Time',
'At any point the CPU must pick the shortest-processing available task. Sort tasks by enqueue time so we can admit them in order, then use a min-heap keyed by (processingTime, index) to always pull the right next task. If the heap is empty, fast-forward the clock to the next enqueue time.',
'["Pair each task with its original index and sort by enqueue time.","Walk a pointer i through the sorted tasks; maintain a min-heap and a current time clock.","Loop until all tasks dispatched: if heap is empty and i < n, jump clock to tasks[i].enqueueTime.","While i < n and tasks[i].enqueueTime <= clock, push (processingTime, original_index) to the heap and i += 1.","Pop the top (pt, idx); append idx to result; clock += pt.","Return result."]'::jsonb,
$PY$class Solution:
    def getOrder(self, tasks: List[List[int]]) -> List[int]:
        import heapq
        indexed = sorted(range(len(tasks)), key=lambda i: (tasks[i][0], tasks[i][1], i))
        heap = []
        result = []
        clock = 0
        i = 0
        n = len(tasks)
        while len(result) < n:
            if not heap and i < n:
                clock = max(clock, tasks[indexed[i]][0])
            while i < n and tasks[indexed[i]][0] <= clock:
                pt = tasks[indexed[i]][1]
                heapq.heappush(heap, (pt, indexed[i]))
                i += 1
            pt, idx = heapq.heappop(heap)
            result.append(idx)
            clock += pt
        return result
$PY$,
$JS$var getOrder = function(tasks) {
    const n = tasks.length;
    const indexed = tasks.map((t, i) => [t[0], t[1], i]).sort((a, b) => a[0] - b[0]);
    const heap = [];
    const push = (item) => {
        heap.push(item);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p][0] > heap[i][0] || (heap[p][0] === heap[i][0] && heap[p][1] > heap[i][1])) {
                [heap[p], heap[i]] = [heap[i], heap[p]];
                i = p;
            } else break;
        }
    };
    const pop = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length) {
            heap[0] = last;
            let i = 0;
            while (true) {
                const l = 2 * i + 1, r = 2 * i + 2;
                let s = i;
                const cmp = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
                if (l < heap.length && cmp(heap[l], heap[s])) s = l;
                if (r < heap.length && cmp(heap[r], heap[s])) s = r;
                if (s === i) break;
                [heap[i], heap[s]] = [heap[s], heap[i]];
                i = s;
            }
        }
        return top;
    };
    const result = [];
    let clock = 0, i = 0;
    while (result.length < n) {
        if (!heap.length && i < n) clock = Math.max(clock, indexed[i][0]);
        while (i < n && indexed[i][0] <= clock) {
            push([indexed[i][1], indexed[i][2]]);
            i++;
        }
        const [pt, idx] = pop();
        result.push(idx);
        clock += pt;
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public int[] getOrder(int[][] tasks) {
        int n = tasks.length;
        int[][] indexed = new int[n][3];
        for (int i = 0; i < n; i++) { indexed[i][0] = tasks[i][0]; indexed[i][1] = tasks[i][1]; indexed[i][2] = i; }
        Arrays.sort(indexed, (a, b) -> a[0] - b[0]);
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);
        int[] result = new int[n];
        int rIdx = 0;
        long clock = 0;
        int i = 0;
        while (rIdx < n) {
            if (heap.isEmpty() && i < n) clock = Math.max(clock, indexed[i][0]);
            while (i < n && indexed[i][0] <= clock) {
                heap.offer(new int[]{indexed[i][1], indexed[i][2]});
                i++;
            }
            int[] top = heap.poll();
            result[rIdx++] = top[1];
            clock += top[0];
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> getOrder(vector<vector<int>>& tasks) {
        int n = tasks.size();
        vector<array<int, 3>> indexed(n);
        for (int i = 0; i < n; i++) indexed[i] = {tasks[i][0], tasks[i][1], i};
        sort(indexed.begin(), indexed.end(), [](const array<int, 3>& a, const array<int, 3>& b) {
            return a[0] < b[0];
        });
        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> heap;
        vector<int> result;
        long long clock = 0;
        int i = 0;
        while ((int)result.size() < n) {
            if (heap.empty() && i < n) clock = max(clock, (long long)indexed[i][0]);
            while (i < n && indexed[i][0] <= clock) {
                heap.push({indexed[i][1], indexed[i][2]});
                i++;
            }
            auto [pt, idx] = heap.top(); heap.pop();
            result.push_back(idx);
            clock += pt;
        }
        return result;
    }
};
$CPP$,
'O(n log n)', 'O(n)');

-- ============================================================
-- 3) furthest-building-reach (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('furthest-building-reach', 'heap', 'Furthest Building You Can Reach', 'Medium',
$$<p>You are given an array <code>heights</code>, <code>bricks</code>, and <code>ladders</code>. Starting at building 0 you move right one building at a time. When moving from <code>heights[i]</code> to <code>heights[i + 1]</code>, if the next is lower or equal you proceed free; otherwise you must spend either a ladder OR <code>heights[i + 1] - heights[i]</code> bricks. Return the furthest index you can reach.</p>$$,
'', ARRAY[
  'Use ladders greedily on the largest climbs. Keep a min-heap of the climbs currently assigned to ladders.',
  'When the heap exceeds ladders in size, pop the smallest climb and pay for it with bricks.',
  'If at any point bricks go negative, return the previous building index.'
], '300', 'https://leetcode.com/problems/furthest-building-you-can-reach/',
'furthestBuilding',
'[{"name":"heights","type":"List[int]"},{"name":"bricks","type":"int"},{"name":"ladders","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[4,2,7,6,9,14,12]","5","1"],"expected":"4"},
  {"inputs":["[4,12,2,7,3,18,20,3,19]","10","2"],"expected":"7"},
  {"inputs":["[14,3,19,3]","17","0"],"expected":"3"},
  {"inputs":["[1,2,3,4,5]","0","0"],"expected":"0"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('furthest-building-reach', 'python',
$PY$class Solution:
    def furthestBuilding(self, heights: List[int], bricks: int, ladders: int) -> int:
        $PY$),
('furthest-building-reach', 'javascript',
$JS$var furthestBuilding = function(heights, bricks, ladders) {

};$JS$),
('furthest-building-reach', 'java',
$JAVA$class Solution {
    public int furthestBuilding(int[] heights, int bricks, int ladders) {

    }
}$JAVA$),
('furthest-building-reach', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int furthestBuilding(vector<int>& heights, int bricks, int ladders) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('furthest-building-reach', 1, 'Min-Heap for Ladder Assignments',
'Use a ladder for every climb as long as you have them; afterwards, trade off by replacing the smallest ladder-assigned climb with bricks. A min-heap of active ladder climbs keeps the "smallest" operation O(log n).',
'["Initialize an empty min-heap.","For i from 0 to n - 2: diff = heights[i + 1] - heights[i]. If diff <= 0, continue.","Push diff onto the heap. If heap.size() > ladders, pop the min and subtract it from bricks.","If bricks < 0, return i.","If loop completes, return n - 1."]'::jsonb,
$PY$class Solution:
    def furthestBuilding(self, heights: List[int], bricks: int, ladders: int) -> int:
        import heapq
        heap = []
        for i in range(len(heights) - 1):
            diff = heights[i + 1] - heights[i]
            if diff <= 0:
                continue
            heapq.heappush(heap, diff)
            if len(heap) > ladders:
                bricks -= heapq.heappop(heap)
            if bricks < 0:
                return i
        return len(heights) - 1
$PY$,
$JS$var furthestBuilding = function(heights, bricks, ladders) {
    const heap = [];
    const push = (x) => {
        heap.push(x);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p] > heap[i]) { [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
            else break;
        }
    };
    const pop = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length) {
            heap[0] = last;
            let i = 0;
            while (true) {
                const l = 2 * i + 1, r = 2 * i + 2;
                let s = i;
                if (l < heap.length && heap[l] < heap[s]) s = l;
                if (r < heap.length && heap[r] < heap[s]) s = r;
                if (s === i) break;
                [heap[i], heap[s]] = [heap[s], heap[i]];
                i = s;
            }
        }
        return top;
    };
    for (let i = 0; i < heights.length - 1; i++) {
        const diff = heights[i + 1] - heights[i];
        if (diff <= 0) continue;
        push(diff);
        if (heap.length > ladders) bricks -= pop();
        if (bricks < 0) return i;
    }
    return heights.length - 1;
};
$JS$,
$JAVA$class Solution {
    public int furthestBuilding(int[] heights, int bricks, int ladders) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int i = 0; i < heights.length - 1; i++) {
            int diff = heights[i + 1] - heights[i];
            if (diff <= 0) continue;
            heap.offer(diff);
            if (heap.size() > ladders) bricks -= heap.poll();
            if (bricks < 0) return i;
        }
        return heights.length - 1;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int furthestBuilding(vector<int>& heights, int bricks, int ladders) {
        priority_queue<int, vector<int>, greater<int>> heap;
        for (int i = 0; i + 1 < (int)heights.size(); i++) {
            int diff = heights[i + 1] - heights[i];
            if (diff <= 0) continue;
            heap.push(diff);
            if ((int)heap.size() > ladders) { bricks -= heap.top(); heap.pop(); }
            if (bricks < 0) return i;
        }
        return (int)heights.size() - 1;
    }
};
$CPP$,
'O(n log ladders)', 'O(ladders)');

-- ============================================================
-- 4) ipo (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('ipo', 'heap', 'IPO', 'Medium',
$$<p>You can complete at most <code>k</code> projects. You start with capital <code>w</code>. Project <code>i</code> has minimum required capital <code>capital[i]</code> and pure profit <code>profits[i]</code>. You cannot take a project unless your current capital meets its requirement, and after completing a project its profit is added to your capital. Return the maximum final capital.</p>$$,
'', ARRAY[
  'Greedily pick the most profitable affordable project at each step.',
  'Sort projects by capital requirement ascending. Use a pointer to push all now-affordable projects into a max-heap keyed by profit.',
  'Pop the heap to take that project, add its profit to w, and repeat up to k times or until the heap is empty.'
], '300', 'https://leetcode.com/problems/ipo/',
'findMaximizedCapital',
'[{"name":"k","type":"int"},{"name":"w","type":"int"},{"name":"profits","type":"List[int]"},{"name":"capital","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["2","0","[1,2,3]","[0,1,1]"],"expected":"4"},
  {"inputs":["3","0","[1,2,3]","[0,1,2]"],"expected":"6"},
  {"inputs":["1","0","[1,2,3]","[1,1,2]"],"expected":"0"},
  {"inputs":["2","2","[1,2,3]","[0,1,1]"],"expected":"7"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('ipo', 'python',
$PY$class Solution:
    def findMaximizedCapital(self, k: int, w: int, profits: List[int], capital: List[int]) -> int:
        $PY$),
('ipo', 'javascript',
$JS$var findMaximizedCapital = function(k, w, profits, capital) {

};$JS$),
('ipo', 'java',
$JAVA$class Solution {
    public int findMaximizedCapital(int k, int w, int[] profits, int[] capital) {

    }
}$JAVA$),
('ipo', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findMaximizedCapital(int k, int w, vector<int>& profits, vector<int>& capital) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('ipo', 1, 'Greedy Affordable-Then-Max-Profit',
'At every step we should take the project with the largest profit we can afford. Two data structures support this cleanly: (1) projects sorted by capital requirement ascending so we can scan in and pick up newly-affordable options, and (2) a max-heap of affordable projects keyed by profit so we always pop the best one next.',
'["Build a list of (capital[i], profits[i]) pairs and sort ascending by capital.","Maintain a pointer ptr = 0 and an empty max-heap.","Repeat up to k times: while ptr < n and pairs[ptr].capital <= w, push pairs[ptr].profit (negated for max-heap) and ptr += 1.","If heap is empty, break.","w += -heappop(heap).","Return w."]'::jsonb,
$PY$class Solution:
    def findMaximizedCapital(self, k: int, w: int, profits: List[int], capital: List[int]) -> int:
        import heapq
        projects = sorted(zip(capital, profits))
        heap = []
        ptr = 0
        for _ in range(k):
            while ptr < len(projects) and projects[ptr][0] <= w:
                heapq.heappush(heap, -projects[ptr][1])
                ptr += 1
            if not heap:
                break
            w += -heapq.heappop(heap)
        return w
$PY$,
$JS$var findMaximizedCapital = function(k, w, profits, capital) {
    const projects = capital.map((c, i) => [c, profits[i]]).sort((a, b) => a[0] - b[0]);
    const heap = [];
    const push = (x) => {
        heap.push(x);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p] < heap[i]) { [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
            else break;
        }
    };
    const pop = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length) {
            heap[0] = last;
            let i = 0;
            while (true) {
                const l = 2 * i + 1, r = 2 * i + 2;
                let s = i;
                if (l < heap.length && heap[l] > heap[s]) s = l;
                if (r < heap.length && heap[r] > heap[s]) s = r;
                if (s === i) break;
                [heap[i], heap[s]] = [heap[s], heap[i]];
                i = s;
            }
        }
        return top;
    };
    let ptr = 0;
    for (let i = 0; i < k; i++) {
        while (ptr < projects.length && projects[ptr][0] <= w) {
            push(projects[ptr][1]);
            ptr++;
        }
        if (!heap.length) break;
        w += pop();
    }
    return w;
};
$JS$,
$JAVA$class Solution {
    public int findMaximizedCapital(int k, int w, int[] profits, int[] capital) {
        int n = profits.length;
        int[][] projects = new int[n][2];
        for (int i = 0; i < n; i++) { projects[i][0] = capital[i]; projects[i][1] = profits[i]; }
        Arrays.sort(projects, (a, b) -> a[0] - b[0]);
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        int ptr = 0;
        for (int i = 0; i < k; i++) {
            while (ptr < n && projects[ptr][0] <= w) heap.offer(projects[ptr++][1]);
            if (heap.isEmpty()) break;
            w += heap.poll();
        }
        return w;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int findMaximizedCapital(int k, int w, vector<int>& profits, vector<int>& capital) {
        int n = profits.size();
        vector<pair<int, int>> projects(n);
        for (int i = 0; i < n; i++) projects[i] = {capital[i], profits[i]};
        sort(projects.begin(), projects.end());
        priority_queue<int> heap;
        int ptr = 0;
        for (int i = 0; i < k; i++) {
            while (ptr < n && projects[ptr].first <= w) { heap.push(projects[ptr].second); ptr++; }
            if (heap.empty()) break;
            w += heap.top(); heap.pop();
        }
        return w;
    }
};
$CPP$,
'O((n + k) log n)', 'O(n)');

-- ============================================================
-- 5) ugly-number-ii (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('ugly-number-ii', 'heap', 'Ugly Number II', 'Medium',
$$<p>An ugly number is a positive integer whose prime factors are limited to 2, 3, and 5. Given an integer <code>n</code>, return the <code>n</code>th ugly number (1-indexed; 1 is considered ugly).</p>$$,
'', ARRAY[
  'Maintain a min-heap seeded with 1. On each extraction, push that value times 2, 3, and 5 — skipping duplicates with a hash set.',
  'The k-th popped value is the k-th ugly number.',
  'An O(n) DP with three pointers is an alternative.'
], '300', 'https://leetcode.com/problems/ugly-number-ii/',
'nthUglyNumber',
'[{"name":"n","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["10"],"expected":"12"},
  {"inputs":["1"],"expected":"1"},
  {"inputs":["7"],"expected":"8"},
  {"inputs":["20"],"expected":"36"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('ugly-number-ii', 'python',
$PY$class Solution:
    def nthUglyNumber(self, n: int) -> int:
        $PY$),
('ugly-number-ii', 'javascript',
$JS$var nthUglyNumber = function(n) {

};$JS$),
('ugly-number-ii', 'java',
$JAVA$class Solution {
    public int nthUglyNumber(int n) {

    }
}$JAVA$),
('ugly-number-ii', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int nthUglyNumber(int n) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('ugly-number-ii', 1, 'Three-Pointer DP',
'Every ugly number after 1 is another ugly number times 2, 3, or 5. Keep pointers into a growing array of ugly numbers, one per base; at each step take the minimum of the three candidates and advance the matching pointers. This produces ugly numbers in order with no duplicates and no heap.',
'["Create dp of length n with dp[0] = 1.","Initialize i2 = i3 = i5 = 0.","For k from 1 to n - 1: next_ugly = min(dp[i2] * 2, dp[i3] * 3, dp[i5] * 5); dp[k] = next_ugly.","Advance i2 if dp[i2] * 2 == next_ugly, similarly for i3 and i5 (multiple may advance to skip duplicates).","Return dp[n - 1]."]'::jsonb,
$PY$class Solution:
    def nthUglyNumber(self, n: int) -> int:
        dp = [0] * n
        dp[0] = 1
        i2 = i3 = i5 = 0
        for k in range(1, n):
            nxt = min(dp[i2] * 2, dp[i3] * 3, dp[i5] * 5)
            dp[k] = nxt
            if nxt == dp[i2] * 2: i2 += 1
            if nxt == dp[i3] * 3: i3 += 1
            if nxt == dp[i5] * 5: i5 += 1
        return dp[n - 1]
$PY$,
$JS$var nthUglyNumber = function(n) {
    const dp = new Array(n);
    dp[0] = 1;
    let i2 = 0, i3 = 0, i5 = 0;
    for (let k = 1; k < n; k++) {
        const nxt = Math.min(dp[i2] * 2, dp[i3] * 3, dp[i5] * 5);
        dp[k] = nxt;
        if (nxt === dp[i2] * 2) i2++;
        if (nxt === dp[i3] * 3) i3++;
        if (nxt === dp[i5] * 5) i5++;
    }
    return dp[n - 1];
};
$JS$,
$JAVA$class Solution {
    public int nthUglyNumber(int n) {
        int[] dp = new int[n];
        dp[0] = 1;
        int i2 = 0, i3 = 0, i5 = 0;
        for (int k = 1; k < n; k++) {
            int nxt = Math.min(dp[i2] * 2, Math.min(dp[i3] * 3, dp[i5] * 5));
            dp[k] = nxt;
            if (nxt == dp[i2] * 2) i2++;
            if (nxt == dp[i3] * 3) i3++;
            if (nxt == dp[i5] * 5) i5++;
        }
        return dp[n - 1];
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int nthUglyNumber(int n) {
        vector<int> dp(n);
        dp[0] = 1;
        int i2 = 0, i3 = 0, i5 = 0;
        for (int k = 1; k < n; k++) {
            int nxt = min({dp[i2] * 2, dp[i3] * 3, dp[i5] * 5});
            dp[k] = nxt;
            if (nxt == dp[i2] * 2) i2++;
            if (nxt == dp[i3] * 3) i3++;
            if (nxt == dp[i5] * 5) i5++;
        }
        return dp[n - 1];
    }
};
$CPP$,
'O(n)', 'O(n)');

-- ============================================================
-- 6) min-refueling-stops (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('min-refueling-stops', 'heap', 'Minimum Number of Refueling Stops', 'Hard',
$$<p>A car starts at position 0 with <code>startFuel</code> and wants to reach position <code>target</code>. Gas stations along the way are given as <code>stations[i] = [position, fuelAvailable]</code>. Every unit of position consumes one unit of fuel. Return the minimum number of refueling stops required, or <code>-1</code> if the target is unreachable.</p>$$,
'', ARRAY[
  'As the car moves, track how far it can currently go (distance = startFuel + sum of fuels picked up).',
  'Process stations in order of position. Before passing each station, push the station''s fuel onto a max-heap.',
  'If the current range is short of the next station (or target), pop the heap to refuel greedily, counting stops. If heap is empty and still short, return -1.'
], '300', 'https://leetcode.com/problems/minimum-number-of-refueling-stops/',
'minRefuelStops',
'[{"name":"target","type":"int"},{"name":"startFuel","type":"int"},{"name":"stations","type":"List[List[int]]"}]'::jsonb,
'int',
'[
  {"inputs":["1","1","[]"],"expected":"0"},
  {"inputs":["100","1","[[10,100]]"],"expected":"-1"},
  {"inputs":["100","10","[[10,60],[20,30],[30,30],[60,40]]"],"expected":"2"},
  {"inputs":["1000","83","[[47,220],[65,1],[98,113],[126,196],[186,218],[320,205],[686,317],[707,325],[754,104],[781,105]]"],"expected":"4"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('min-refueling-stops', 'python',
$PY$class Solution:
    def minRefuelStops(self, target: int, startFuel: int, stations: List[List[int]]) -> int:
        $PY$),
('min-refueling-stops', 'javascript',
$JS$var minRefuelStops = function(target, startFuel, stations) {

};$JS$),
('min-refueling-stops', 'java',
$JAVA$class Solution {
    public int minRefuelStops(int target, int startFuel, int[][] stations) {

    }
}$JAVA$),
('min-refueling-stops', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRefuelStops(int target, int startFuel, vector<vector<int>>& stations) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('min-refueling-stops', 1, 'Greedy Max-Heap Refuel',
'Drive as far as you can; whenever you cannot reach the next station (or the target), retroactively refuel at the most generous station you have already passed. A max-heap of passed stations'' fuel values makes that retroactive pick O(log n).',
'["Add a sentinel [target, 0] to stations to simplify the final check.","Initialize heap (max-heap) empty, fuel = startFuel, stops = 0, i = 0.","Walk through stations in order: while i < len(stations) and stations[i].position <= fuel, push stations[i].fuel onto the heap; i += 1.","If fuel >= target, return stops.","While heap is non-empty and fuel < min(target, stations[i].position if i < n else target): fuel += heap.pop(); stops += 1.","If heap empties before catching up, return -1."]'::jsonb,
$PY$class Solution:
    def minRefuelStops(self, target: int, startFuel: int, stations: List[List[int]]) -> int:
        import heapq
        heap = []
        stations = sorted(stations) + [[target, 0]]
        fuel = startFuel
        stops = 0
        i = 0
        while i < len(stations):
            pos, f = stations[i]
            while fuel < pos:
                if not heap:
                    return -1
                fuel += -heapq.heappop(heap)
                stops += 1
            if pos == target:
                return stops
            heapq.heappush(heap, -f)
            i += 1
        return stops
$PY$,
$JS$var minRefuelStops = function(target, startFuel, stations) {
    const all = stations.slice().sort((a, b) => a[0] - b[0]);
    all.push([target, 0]);
    const heap = [];
    const push = (x) => {
        heap.push(x);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p] < heap[i]) { [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
            else break;
        }
    };
    const pop = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length) {
            heap[0] = last;
            let i = 0;
            while (true) {
                const l = 2 * i + 1, r = 2 * i + 2;
                let s = i;
                if (l < heap.length && heap[l] > heap[s]) s = l;
                if (r < heap.length && heap[r] > heap[s]) s = r;
                if (s === i) break;
                [heap[i], heap[s]] = [heap[s], heap[i]];
                i = s;
            }
        }
        return top;
    };
    let fuel = startFuel, stops = 0;
    for (const [pos, f] of all) {
        while (fuel < pos) {
            if (!heap.length) return -1;
            fuel += pop();
            stops++;
        }
        if (pos === target) return stops;
        push(f);
    }
    return stops;
};
$JS$,
$JAVA$class Solution {
    public int minRefuelStops(int target, int startFuel, int[][] stations) {
        List<int[]> all = new ArrayList<>(Arrays.asList(stations));
        all.sort((a, b) -> a[0] - b[0]);
        all.add(new int[]{target, 0});
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        long fuel = startFuel;
        int stops = 0;
        for (int[] st : all) {
            int pos = st[0], f = st[1];
            while (fuel < pos) {
                if (heap.isEmpty()) return -1;
                fuel += heap.poll();
                stops++;
            }
            if (pos == target) return stops;
            heap.offer(f);
        }
        return stops;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minRefuelStops(int target, int startFuel, vector<vector<int>>& stations) {
        vector<vector<int>> all = stations;
        sort(all.begin(), all.end(), [](const vector<int>& a, const vector<int>& b) { return a[0] < b[0]; });
        all.push_back({target, 0});
        priority_queue<int> heap;
        long long fuel = startFuel;
        int stops = 0;
        for (auto& st : all) {
            int pos = st[0], f = st[1];
            while (fuel < pos) {
                if (heap.empty()) return -1;
                fuel += heap.top(); heap.pop();
                stops++;
            }
            if (pos == target) return stops;
            heap.push(f);
        }
        return stops;
    }
};
$CPP$,
'O(n log n)', 'O(n)');

COMMIT;
