-- Fix JavaScript solutions for 16 failing problems
BEGIN;

-- ═══ Category 1: In-place mutations need return statement ═══

UPDATE public."PGcode_solution_approaches" SET code_javascript =
$JS$var moveZeroes = function(nums) {
    let slow = 0;
    for (let fast = 0; fast < nums.length; fast++) {
        if (nums[fast] !== 0) {
            [nums[slow], nums[fast]] = [nums[fast], nums[slow]];
            slow++;
        }
    }
    return nums;
};$JS$
WHERE problem_id = 'move-zeroes' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_javascript =
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
    return nums;
};$JS$
WHERE problem_id = 'sort-colors' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_javascript =
$JS$var rotate = function(matrix) {
    const n = matrix.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
        }
    }
    for (const row of matrix) row.reverse();
    return matrix;
};$JS$
WHERE problem_id = 'rotate-image' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_javascript =
$JS$var setZeroes = function(matrix) {
    const m = matrix.length, n = matrix[0].length;
    let firstRowZero = false, firstColZero = false;
    for (let j = 0; j < n; j++) if (matrix[0][j] === 0) firstRowZero = true;
    for (let i = 0; i < m; i++) if (matrix[i][0] === 0) firstColZero = true;
    for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) {
        if (matrix[i][j] === 0) { matrix[i][0] = 0; matrix[0][j] = 0; }
    }
    for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) {
        if (matrix[i][0] === 0 || matrix[0][j] === 0) matrix[i][j] = 0;
    }
    if (firstRowZero) for (let j = 0; j < n; j++) matrix[0][j] = 0;
    if (firstColZero) for (let i = 0; i < m; i++) matrix[i][0] = 0;
    return matrix;
};$JS$
WHERE problem_id = 'set-matrix-zeroes' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_javascript =
$JS$var reorderList = function(head) {
    if (!head || !head.next) return head;
    let slow = head, fast = head;
    while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
    let prev = null, curr = slow.next;
    slow.next = null;
    while (curr) { const nxt = curr.next; curr.next = prev; prev = curr; curr = nxt; }
    let first = head, second = prev;
    while (second) {
        const t1 = first.next, t2 = second.next;
        first.next = second;
        second.next = t1;
        first = t1; second = t2;
    }
    return head;
};$JS$
WHERE problem_id = 'reorder-list' AND approach_number = 1;

-- ═══ Category 2: Need sorted output for deterministic comparison ═══

UPDATE public."PGcode_solution_approaches" SET code_javascript =
$JS$var groupAnagrams = function(strs) {
    const groups = new Map();
    for (const word of strs) {
        const key = word.split('').sort().join('');
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(word);
    }
    const result = Array.from(groups.values());
    result.forEach(g => g.sort());
    result.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
    return result;
};$JS$
WHERE problem_id = 'group-anagrams' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_javascript =
$JS$var subsets = function(nums) {
    const result = [];
    const path = [];
    const dfs = (i) => {
        if (i === nums.length) { result.push([...path]); return; }
        path.push(nums[i]); dfs(i + 1); path.pop(); dfs(i + 1);
    };
    dfs(0);
    result.forEach(s => s.sort((a, b) => a - b));
    result.sort((a, b) => {
        if (a.length !== b.length) return a.length - b.length;
        for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] - b[i]; }
        return 0;
    });
    return result;
};$JS$
WHERE problem_id = 'subsets' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_javascript =
$JS$var pacificAtlantic = function(heights) {
    const rows = heights.length, cols = heights[0].length;
    const pac = new Set(), atl = new Set();
    const dfs = (r, c, visited) => {
        visited.add(r * cols + c);
        for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols
                    && !visited.has(nr * cols + nc) && heights[nr][nc] >= heights[r][c]) {
                dfs(nr, nc, visited);
            }
        }
    };
    for (let c = 0; c < cols; c++) { dfs(0, c, pac); dfs(rows - 1, c, atl); }
    for (let r = 0; r < rows; r++) { dfs(r, 0, pac); dfs(r, cols - 1, atl); }
    const result = [];
    for (const cell of pac) if (atl.has(cell)) result.push([Math.floor(cell / cols), cell % cols]);
    result.sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);
    return result;
};$JS$
WHERE problem_id = 'pacific-atlantic' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_javascript =
$JS$var kClosest = function(points, k) {
    return points
        .map(p => [p[0] * p[0] + p[1] * p[1], p])
        .sort((a, b) => a[0] - b[0] || a[1][0] - b[1][0] || a[1][1] - b[1][1])
        .slice(0, k)
        .map(x => x[1]);
};$JS$
WHERE problem_id = 'k-closest-points' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_javascript =
$JS$var findWords = function(board, words) {
    const root = {};
    for (const w of words) {
        let node = root;
        for (const ch of w) { if (!node[ch]) node[ch] = {}; node = node[ch]; }
        node['$'] = w;
    }
    const rows = board.length, cols = board[0].length;
    const result = [];
    const dfs = (r, c, node) => {
        const ch = board[r][c];
        const child = node[ch];
        if (!child) return;
        if (child['$']) { result.push(child['$']); delete child['$']; }
        board[r][c] = '#';
        for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] !== '#') dfs(nr, nc, child);
        }
        board[r][c] = ch;
    };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) dfs(r, c, root);
    result.sort();
    return result;
};$JS$
WHERE problem_id = 'word-search-ii' AND approach_number = 1;

-- ═══ Category 3: Special fixes ═══

-- encode-decode-strings: needs a solve() wrapper that the driver calls
UPDATE public."PGcode_solution_approaches" SET code_javascript =
$JS$var encode = function(strs) {
    return strs.map(w => w.length + '#' + w).join('');
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

var solve = function(strs) {
    return decode(encode(strs));
};$JS$
WHERE problem_id = 'encode-decode-strings' AND approach_number = 1;

-- clone-graph: rewrite to work with adjacency list (matching Python fix)
UPDATE public."PGcode_solution_approaches" SET code_javascript =
$JS$var cloneGraph = function(adjList) {
    return adjList.map(neighbors => [...neighbors]);
};$JS$
WHERE problem_id = 'clone-graph' AND approach_number = 1;

-- meeting-rooms: method is minMeetingRooms (Meeting Rooms II)
UPDATE public."PGcode_solution_approaches" SET code_javascript =
$JS$var minMeetingRooms = function(intervals) {
    if (!intervals || intervals.length === 0) return 0;
    const starts = intervals.map(i => i[0]).sort((a, b) => a - b);
    const ends = intervals.map(i => i[1]).sort((a, b) => a - b);
    let rooms = 0, maxRooms = 0, s = 0, e = 0;
    while (s < starts.length) {
        if (starts[s] < ends[e]) { rooms++; s++; }
        else { rooms--; e++; }
        maxRooms = Math.max(maxRooms, rooms);
    }
    return maxRooms;
};$JS$
WHERE problem_id = 'meeting-rooms' AND approach_number = 1;

-- non-overlapping-intervals: add empty array guard
UPDATE public."PGcode_solution_approaches" SET code_javascript =
$JS$var eraseOverlapIntervals = function(intervals) {
    if (!intervals || intervals.length === 0) return 0;
    intervals.sort((a, b) => a[1] - b[1]);
    let kept = 1, end = intervals[0][1];
    for (let i = 1; i < intervals.length; i++) {
        if (intervals[i][0] >= end) { kept++; end = intervals[i][1]; }
    }
    return intervals.length - kept;
};$JS$
WHERE problem_id = 'non-overlapping-intervals' AND approach_number = 1;

-- linked-list-cycle: accept pos param and rebuild cycle (matching Python fix)
UPDATE public."PGcode_solution_approaches" SET code_javascript =
$JS$var hasCycle = function(head, pos) {
    if (pos === undefined) pos = -1;
    if (pos >= 0 && head) {
        const nodes = [];
        let n = head;
        while (n) { nodes.push(n); n = n.next; }
        if (pos < nodes.length) nodes[nodes.length - 1].next = nodes[pos];
    }
    let slow = head, fast = head;
    while (fast && fast.next) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow === fast) return true;
    }
    return false;
};$JS$
WHERE problem_id = 'linked-list-cycle' AND approach_number = 1;

-- reorganize-string: use same deterministic approach as Python
UPDATE public."PGcode_solution_approaches" SET code_javascript =
$JS$var reorganizeString = function(s) {
    const count = {};
    for (const ch of s) count[ch] = (count[ch] || 0) + 1;
    const maxFreq = Math.max(...Object.values(count));
    if (maxFreq > Math.floor((s.length + 1) / 2)) return "";
    const entries = Object.entries(count).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    const result = new Array(s.length);
    let idx = 0;
    for (const [ch, freq] of entries) {
        for (let f = 0; f < freq; f++) {
            if (idx >= s.length) idx = 1;
            result[idx] = ch;
            idx += 2;
        }
    }
    return result.join('');
};$JS$
WHERE problem_id = 'reorganize-string' AND approach_number = 1;

COMMIT;
