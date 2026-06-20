#!/usr/bin/env node
// Part 2: problems 11-40
import fs from 'node:fs';

const entries = [];
const add = (p) => entries.push(p);

// 11. sudoku-solver — has 1 tc; needs solutions + editorial. Also need ≥10 tests.
add({
  id: 'sudoku-solver',
  return_type: 'List[List[str]]',
  test_cases: [
    { inputs: ['[["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]'], expected: '[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]]' },
    { inputs: ['[[".",".","9","7","4","8",".",".","."],["7",".",".",".",".",".",".",".","."],[".","2",".","1",".","9",".",".","."],[".",".","7",".",".",".","2","4","."],[".","6","4",".","1",".","5","9","."],[".","9","8",".",".",".","3",".","."],[".",".",".","8",".","3",".","2","."],[".",".",".",".",".",".",".",".","6"],[".",".",".","2","7","5","9",".","."]]'], expected: '[["5","1","9","7","4","8","6","3","2"],["7","8","3","6","5","2","4","1","9"],["4","2","6","1","3","9","8","7","5"],["3","5","7","9","8","6","2","4","1"],["2","6","4","3","1","7","5","9","8"],["1","9","8","5","2","4","3","6","7"],["9","7","5","8","6","3","1","2","4"],["8","3","2","4","9","1","7","5","6"],["6","4","1","2","7","5","9","8","3"]]' },
    { inputs: ['[["1","2","3","4","5","6","7","8","."],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","1","4","3","6","5","8","9","7"],["3","6","5","8","9","7","2","1","4"],["8","9","7","2","1","4","3","6","5"],["5","3","1","6","4","2","9","7","8"],["6","4","2","9","7","8","5","3","1"],["9","7","8","5","3","1","6","4","2"]]'], expected: '[["1","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","1","4","3","6","5","8","9","7"],["3","6","5","8","9","7","2","1","4"],["8","9","7","2","1","4","3","6","5"],["5","3","1","6","4","2","9","7","8"],["6","4","2","9","7","8","5","3","1"],["9","7","8","5","3","1","6","4","2"]]' },
    { inputs: ['[[".","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","1","4","3","6","5","8","9","7"],["3","6","5","8","9","7","2","1","4"],["8","9","7","2","1","4","3","6","5"],["5","3","1","6","4","2","9","7","8"],["6","4","2","9","7","8","5","3","1"],["9","7","8","5","3","1","6","4","2"]]'], expected: '[["1","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","1","4","3","6","5","8","9","7"],["3","6","5","8","9","7","2","1","4"],["8","9","7","2","1","4","3","6","5"],["5","3","1","6","4","2","9","7","8"],["6","4","2","9","7","8","5","3","1"],["9","7","8","5","3","1","6","4","2"]]' },
    { inputs: ['[["1","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","1","4","3","6","5","8","9","7"],["3","6","5","8","9","7","2","1","4"],["8","9","7","2","1","4","3","6","5"],["5","3","1","6","4","2","9","7","8"],["6","4","2","9","7","8","5","3","."],["9","7","8","5","3","1","6","4","2"]]'], expected: '[["1","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","1","4","3","6","5","8","9","7"],["3","6","5","8","9","7","2","1","4"],["8","9","7","2","1","4","3","6","5"],["5","3","1","6","4","2","9","7","8"],["6","4","2","9","7","8","5","3","1"],["9","7","8","5","3","1","6","4","2"]]' },
    { inputs: ['[["1","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","1","4","3","6","5","8","9","7"],["3","6","5","8","9","7","2","1","4"],["8","9","7","2","1","4","3","6","."],["5","3","1","6","4","2","9","7","8"],["6","4","2","9","7","8","5","3","1"],["9","7","8","5","3","1","6","4","2"]]'], expected: '[["1","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","1","4","3","6","5","8","9","7"],["3","6","5","8","9","7","2","1","4"],["8","9","7","2","1","4","3","6","5"],["5","3","1","6","4","2","9","7","8"],["6","4","2","9","7","8","5","3","1"],["9","7","8","5","3","1","6","4","2"]]' },
    { inputs: ['[["1","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","1","4","3","6","5","8","9","7"],["3","6","5","8","9","7","2","1","4"],["8","9","7","2","1","4","3","6","5"],["5","3","1","6","4","2","9","7","8"],["6","4","2","9","7","8","5","3","1"],["9","7","8","5","3","1","6","4","."]]'], expected: '[["1","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","1","4","3","6","5","8","9","7"],["3","6","5","8","9","7","2","1","4"],["8","9","7","2","1","4","3","6","5"],["5","3","1","6","4","2","9","7","8"],["6","4","2","9","7","8","5","3","1"],["9","7","8","5","3","1","6","4","2"]]' },
    { inputs: ['[["1","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","1","4","3","6","5","8","9","7"],["3","6","5","8","9","7","2","1","4"],["8","9","7","2","1","4","3","6","5"],["5","3","1","6","4","2","9","7","8"],["6","4","2","9","7","8","5","3","1"],["9","7","8","5","3",".","6","4","2"]]'], expected: '[["1","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","1","4","3","6","5","8","9","7"],["3","6","5","8","9","7","2","1","4"],["8","9","7","2","1","4","3","6","5"],["5","3","1","6","4","2","9","7","8"],["6","4","2","9","7","8","5","3","1"],["9","7","8","5","3","1","6","4","2"]]' },
    { inputs: ['[["1","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","1","4","3","6","5","8","9","7"],["3","6","5","8","9",".","2","1","4"],["8","9","7","2","1","4","3","6","5"],["5","3","1","6","4","2","9","7","8"],["6","4","2","9","7","8","5","3","1"],["9","7","8","5","3","1","6","4","2"]]'], expected: '[["1","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","1","4","3","6","5","8","9","7"],["3","6","5","8","9","7","2","1","4"],["8","9","7","2","1","4","3","6","5"],["5","3","1","6","4","2","9","7","8"],["6","4","2","9","7","8","5","3","1"],["9","7","8","5","3","1","6","4","2"]]' },
    { inputs: ['[["5","1","9","7","4","8","6","3","2"],["7","8","3","6","5","2","4","1","9"],["4","2","6","1","3","9","8","7","5"],["3","5","7","9","8","6","2","4","1"],["2","6","4","3","1","7","5","9","8"],["1","9","8","5","2","4","3","6","7"],["9","7","5","8","6","3","1","2","4"],["8","3","2","4","9","1","7","5","6"],["6","4","1","2","7",".","9","8","3"]]'], expected: '[["5","1","9","7","4","8","6","3","2"],["7","8","3","6","5","2","4","1","9"],["4","2","6","1","3","9","8","7","5"],["3","5","7","9","8","6","2","4","1"],["2","6","4","3","1","7","5","9","8"],["1","9","8","5","2","4","3","6","7"],["9","7","5","8","6","3","1","2","4"],["8","3","2","4","9","1","7","5","6"],["6","4","1","2","7","5","9","8","3"]]' },
  ],
  editorial_md: `## Intuition
A sudoku board has only 81 cells and a fixed branching factor of at most 9 per empty cell, but naive enumeration is hopeless. The classic recipe is depth-first backtracking with three lightweight constraint sets — rows, columns, and 3x3 boxes — so we can place or undo a digit in O(1) and reject illegal placements instantly.

## Approach
1. Build three arrays of 9 sets each: \`rows[i]\`, \`cols[j]\`, \`boxes[(i // 3) * 3 + (j // 3)]\`. Populate from the prefilled cells.
2. Find the first empty cell (we scan in row-major order; for a tighter solver, pick the cell with the fewest legal candidates).
3. Try each digit '1'..'9'. If it doesn't conflict with the three sets, place it, recurse, and on failure remove it.
4. When no empty cell remains, the board is solved.

The constraint sets give an O(1) feasibility test for every attempt, so the algorithm spends almost all its time on the recursion tree. Inputs with a unique solution finish in milliseconds.

## Complexity
- Time: worst case O(9^m) where m = number of blanks, but pruning collapses this to negligible cost on real puzzles.
- Space: O(1) auxiliary plus O(m) recursion stack.`,
  solutions: {
    python: `class Solution:
    def solveSudoku(self, board):
        rows = [set() for _ in range(9)]
        cols = [set() for _ in range(9)]
        boxes = [set() for _ in range(9)]
        empty = []
        for i in range(9):
            for j in range(9):
                v = board[i][j]
                if v == '.':
                    empty.append((i, j))
                else:
                    rows[i].add(v); cols[j].add(v); boxes[(i//3)*3+(j//3)].add(v)
        def back(k):
            if k == len(empty): return True
            i, j = empty[k]
            b = (i//3)*3+(j//3)
            for d in '123456789':
                if d not in rows[i] and d not in cols[j] and d not in boxes[b]:
                    board[i][j] = d; rows[i].add(d); cols[j].add(d); boxes[b].add(d)
                    if back(k+1): return True
                    board[i][j] = '.'; rows[i].remove(d); cols[j].remove(d); boxes[b].remove(d)
            return False
        back(0)
        return board
`,
    javascript: `class Solution {
    solveSudoku(board) {
        const rows = Array.from({length:9}, () => new Set());
        const cols = Array.from({length:9}, () => new Set());
        const boxes = Array.from({length:9}, () => new Set());
        const empty = [];
        for (let i=0;i<9;i++) for (let j=0;j<9;j++) {
            const v = board[i][j];
            if (v === '.') empty.push([i,j]);
            else { rows[i].add(v); cols[j].add(v); boxes[Math.floor(i/3)*3+Math.floor(j/3)].add(v); }
        }
        const back = (k) => {
            if (k === empty.length) return true;
            const [i,j] = empty[k], b = Math.floor(i/3)*3+Math.floor(j/3);
            for (const d of '123456789') {
                if (!rows[i].has(d) && !cols[j].has(d) && !boxes[b].has(d)) {
                    board[i][j]=d; rows[i].add(d); cols[j].add(d); boxes[b].add(d);
                    if (back(k+1)) return true;
                    board[i][j]='.'; rows[i].delete(d); cols[j].delete(d); boxes[b].delete(d);
                }
            }
            return false;
        };
        back(0);
        return board;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public String[][] solveSudoku(String[][] board) {
        Set<String>[] rows = new HashSet[9];
        Set<String>[] cols = new HashSet[9];
        Set<String>[] boxes = new HashSet[9];
        for (int i=0;i<9;i++){rows[i]=new HashSet<>();cols[i]=new HashSet<>();boxes[i]=new HashSet<>();}
        List<int[]> empty = new ArrayList<>();
        for (int i=0;i<9;i++) for (int j=0;j<9;j++) {
            String v = board[i][j];
            if (v.equals(".")) empty.add(new int[]{i,j});
            else { rows[i].add(v); cols[j].add(v); boxes[(i/3)*3+(j/3)].add(v); }
        }
        back(board, empty, 0, rows, cols, boxes);
        return board;
    }
    private boolean back(String[][] b, List<int[]> empty, int k, Set<String>[] rows, Set<String>[] cols, Set<String>[] boxes) {
        if (k == empty.size()) return true;
        int i = empty.get(k)[0], j = empty.get(k)[1], box = (i/3)*3+(j/3);
        for (char c='1'; c<='9'; c++) {
            String d = String.valueOf(c);
            if (!rows[i].contains(d) && !cols[j].contains(d) && !boxes[box].contains(d)) {
                b[i][j]=d; rows[i].add(d); cols[j].add(d); boxes[box].add(d);
                if (back(b, empty, k+1, rows, cols, boxes)) return true;
                b[i][j]="."; rows[i].remove(d); cols[j].remove(d); boxes[box].remove(d);
            }
        }
        return false;
    }
}
`,
    cpp: `#include <vector>
#include <string>
#include <unordered_set>
using namespace std;
class Solution {
public:
    vector<vector<string>> solveSudoku(vector<vector<string>>& board) {
        vector<unordered_set<string>> rows(9), cols(9), boxes(9);
        vector<pair<int,int>> empty;
        for (int i=0;i<9;i++) for (int j=0;j<9;j++) {
            if (board[i][j]==".") empty.push_back({i,j});
            else { rows[i].insert(board[i][j]); cols[j].insert(board[i][j]); boxes[(i/3)*3+(j/3)].insert(board[i][j]); }
        }
        back(board, empty, 0, rows, cols, boxes);
        return board;
    }
private:
    bool back(vector<vector<string>>& b, vector<pair<int,int>>& empty, int k,
              vector<unordered_set<string>>& rows, vector<unordered_set<string>>& cols, vector<unordered_set<string>>& boxes) {
        if (k == (int)empty.size()) return true;
        auto [i,j] = empty[k]; int box = (i/3)*3+(j/3);
        for (char c='1'; c<='9'; c++) {
            string d(1, c);
            if (!rows[i].count(d) && !cols[j].count(d) && !boxes[box].count(d)) {
                b[i][j]=d; rows[i].insert(d); cols[j].insert(d); boxes[box].insert(d);
                if (back(b, empty, k+1, rows, cols, boxes)) return true;
                b[i][j]="."; rows[i].erase(d); cols[j].erase(d); boxes[box].erase(d);
            }
        }
        return false;
    }
};
`,
  },
});

// 12. swap-without-third
add({
  id: 'swap-without-third',
  method_name: 'swap',
  params: [{ name: 'a', type: 'int' }, { name: 'b', type: 'int' }],
  return_type: 'List[int]',
  pattern: 'Arithmetic/XOR trick',
  description: '<p>Swap two integers without using a third temporary variable. Return the swapped pair <code>[a, b]</code> after the swap (so the answer is the original <code>[b, a]</code>).</p>',
  hints: [
    'Arithmetic trick: a = a + b, then b = a - b, then a = a - b.',
    'Watch out for overflow if the values are near INT_MAX.',
    'XOR trick: a ^= b, b ^= a, a ^= b. Works for ints, avoids overflow.',
    'If a and b are the same memory slot, XOR will zero it out — guard with `if (a != b)`.',
    'Pythonic / multi-assignment is the idiomatic answer in most languages; this problem is about the trick.',
  ],
  test_cases: [
    { inputs: ['1', '2'], expected: '[2,1]' },
    { inputs: ['5', '10'], expected: '[10,5]' },
    { inputs: ['0', '0'], expected: '[0,0]' },
    { inputs: ['-1', '1'], expected: '[1,-1]' },
    { inputs: ['100', '200'], expected: '[200,100]' },
    { inputs: ['7', '7'], expected: '[7,7]' },
    { inputs: ['-5', '-10'], expected: '[-10,-5]' },
    { inputs: ['1000000', '999999'], expected: '[999999,1000000]' },
    { inputs: ['42', '13'], expected: '[13,42]' },
    { inputs: ['-2147483648', '2147483647'], expected: '[2147483647,-2147483648]' },
  ],
  editorial_md: `## Intuition
The most reliable bit-level swap uses XOR: \`a ^= b; b ^= a; a ^= b\`. It is overflow-free, runs in a couple of instructions, and works for any 32- or 64-bit integers. The arithmetic version \`(a + b, a - b)\` is easier to read but can overflow at extreme inputs.

## Approach (XOR)
1. \`a ^= b\` — now \`a\` holds \`a XOR b\`.
2. \`b ^= a\` — now \`b\` is \`b XOR (a XOR b) = a\`.
3. \`a ^= b\` — now \`a\` is \`(a XOR b) XOR a = b\`.

The values are swapped in place. Always check that \`a\` and \`b\` are not aliased to the same memory slot (a niche concern in languages with mutable references). For ordinary value semantics this is fine.

## Complexity
- Time: O(1).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def swap(self, a, b):
        a, b = b, a
        return [a, b]
`,
    javascript: `class Solution {
    swap(a, b) {
        a ^= b; b ^= a; a ^= b;
        return [a, b];
    }
}
`,
    java: `class Solution {
    public int[] swap(int a, int b) {
        a ^= b; b ^= a; a ^= b;
        return new int[]{a, b};
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    vector<int> swap(int a, int b) {
        a ^= b; b ^= a; a ^= b;
        return {a, b};
    }
};
`,
  },
});

// 13. can-attend-meetings — Easy. Has 4 tc/3 hints/mn. Needs more tests + sol + ed.
add({
  id: 'can-attend-meetings',
  return_type: 'bool',
  params: [{ name: 'intervals', type: 'List[List[int]]' }],
  pattern: 'Interval sort + adjacent overlap check',
  test_cases: [
    { inputs: ['[[0,30],[5,10],[15,20]]'], expected: 'false' },
    { inputs: ['[[7,10],[2,4]]'], expected: 'true' },
    { inputs: ['[]'], expected: 'true' },
    { inputs: ['[[1,5]]'], expected: 'true' },
    { inputs: ['[[1,5],[5,10]]'], expected: 'true' },
    { inputs: ['[[1,5],[4,10]]'], expected: 'false' },
    { inputs: ['[[1,3],[3,5],[5,7]]'], expected: 'true' },
    { inputs: ['[[1,10],[2,3]]'], expected: 'false' },
    { inputs: ['[[6,7],[2,4],[8,12]]'], expected: 'true' },
    { inputs: ['[[1,2],[2,3],[3,4],[4,5],[5,6],[1,2]]'], expected: 'false' },
  ],
  editorial_md: `## Intuition
A person can attend every meeting only if no two meetings overlap. After sorting by start time, the only conflicts possible are between adjacent intervals, because non-adjacent ones are separated by a smaller-or-equal pair we already checked.

## Approach
1. Sort the intervals by their start time.
2. Walk through adjacent pairs. If \`intervals[i].start < intervals[i-1].end\`, an overlap exists — return \`false\`.
3. Treat a meeting that starts exactly when the previous one ends as non-conflicting (touching is fine).
4. If no overlap was found, return \`true\`.

This is the canonical interval-sweep idea: after a single sort, a linear scan answers the question. Heap or segment-tree machinery is unnecessary because we only care about a yes/no answer, not a count.

## Complexity
- Time: O(n log n) for the sort, then O(n) for the sweep.
- Space: O(1) extra (sort uses O(log n) stack).`,
  solutions: {
    python: `class Solution:
    def canAttendMeetings(self, intervals):
        intervals.sort(key=lambda x: x[0])
        for i in range(1, len(intervals)):
            if intervals[i][0] < intervals[i-1][1]:
                return False
        return True
`,
    javascript: `class Solution {
    canAttendMeetings(intervals) {
        intervals.sort((a, b) => a[0] - b[0]);
        for (let i = 1; i < intervals.length; i++) {
            if (intervals[i][0] < intervals[i-1][1]) return false;
        }
        return true;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public boolean canAttendMeetings(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
        for (int i = 1; i < intervals.length; i++) {
            if (intervals[i][0] < intervals[i-1][1]) return false;
        }
        return true;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;
class Solution {
public:
    bool canAttendMeetings(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());
        for (size_t i = 1; i < intervals.size(); i++) {
            if (intervals[i][0] < intervals[i-1][1]) return false;
        }
        return true;
    }
};
`,
  },
});

// 14. kth-set-bit (kth set bit position from right in n)
add({
  id: 'kth-set-bit',
  method_name: 'kthSetBit',
  params: [{ name: 'n', type: 'int' }, { name: 'k', type: 'int' }],
  return_type: 'int',
  pattern: 'Bit manipulation / iterate set bits',
  description: '<p>Given a positive integer <code>n</code> and an integer <code>k</code>, return the position (1-indexed from the least significant bit) of the k-th set bit in <code>n</code>. Return <code>-1</code> if there are fewer than <code>k</code> set bits.</p>',
  hints: [
    'Walk the bits of n from LSB to MSB and count 1-bits.',
    'When the count reaches k, return the current position (1-indexed).',
    'Use n >> pos & 1 to test each bit, or repeatedly strip the lowest set bit with n & -n.',
    'Number of set bits is __builtin_popcount(n) in C++ / Integer.bitCount in Java / bin(n).count("1") in Python.',
    'If k > popcount(n) return -1.',
  ],
  test_cases: [
    { inputs: ['20', '2'], expected: '5' },
    { inputs: ['10', '1'], expected: '2' },
    { inputs: ['1', '1'], expected: '1' },
    { inputs: ['1', '2'], expected: '-1' },
    { inputs: ['255', '4'], expected: '4' },
    { inputs: ['256', '1'], expected: '9' },
    { inputs: ['1024', '1'], expected: '11' },
    { inputs: ['7', '3'], expected: '3' },
    { inputs: ['7', '4'], expected: '-1' },
    { inputs: ['170', '3'], expected: '6' },
  ],
  editorial_md: `## Intuition
A "set bit" is a 1 in the binary representation. To find the k-th one counting from the least significant side, simply walk the bits, increment a counter on every 1, and stop when the counter equals k.

## Approach
1. Initialise \`count = 0\` and \`pos = 1\`.
2. Loop while \`n > 0\`:
   - If \`n & 1\` is 1, increment \`count\`. If \`count == k\`, return \`pos\`.
   - Right-shift \`n\` by 1 and increment \`pos\`.
3. If the loop ends without reaching k, return \`-1\`.

An alternative O(popcount) version uses \`n & -n\` to extract the lowest set bit on each iteration, computes its position with \`log2\`, and clears it. Both are O(log max-int) in the worst case, which is constant for fixed-width ints.

## Complexity
- Time: O(b) where b is the number of bits in n.
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def kthSetBit(self, n, k):
        count = 0
        pos = 1
        while n > 0:
            if n & 1:
                count += 1
                if count == k:
                    return pos
            n >>= 1
            pos += 1
        return -1
`,
    javascript: `class Solution {
    kthSetBit(n, k) {
        let count = 0, pos = 1;
        while (n > 0) {
            if (n & 1) {
                count++;
                if (count === k) return pos;
            }
            n >>>= 1;
            pos++;
        }
        return -1;
    }
}
`,
    java: `class Solution {
    public int kthSetBit(int n, int k) {
        int count = 0, pos = 1;
        while (n > 0) {
            if ((n & 1) == 1) {
                count++;
                if (count == k) return pos;
            }
            n >>>= 1;
            pos++;
        }
        return -1;
    }
}
`,
    cpp: `class Solution {
public:
    int kthSetBit(int n, int k) {
        int count = 0, pos = 1;
        while (n > 0) {
            if (n & 1) {
                count++;
                if (count == k) return pos;
            }
            n >>= 1;
            pos++;
        }
        return -1;
    }
};
`,
  },
});

// 15. shortest-common-supersequence
add({
  id: 'shortest-common-supersequence',
  return_type: 'str',
  pattern: '2D DP + traceback',
  editorial_md: `## Intuition
A shortest common supersequence (SCS) of two strings contains both as subsequences and is as short as possible. Its length equals \`len(a) + len(b) - LCS(a, b)\`: every matched character of the LCS is shared and counted once, while the rest must appear separately. To reconstruct the actual string we trace back through the LCS DP table, emitting one character per cell.

## Approach
1. Build a 2D DP \`lcs[i][j]\` = length of the longest common subsequence of \`a[:i]\` and \`b[:j]\`.
   - If \`a[i-1] == b[j-1]\`, \`lcs[i][j] = lcs[i-1][j-1] + 1\`.
   - Else \`lcs[i][j] = max(lcs[i-1][j], lcs[i][j-1])\`.
2. Reconstruct from \`(len(a), len(b))\` walking backwards:
   - If chars match, prepend \`a[i-1]\` and step diagonally.
   - Else if \`lcs[i-1][j] >= lcs[i][j-1]\`, prepend \`a[i-1]\` and step up.
   - Else prepend \`b[j-1]\` and step left.
3. After the loop, prepend any remaining prefix of \`a\` or \`b\`.

The traceback walks each cell at most once.

## Complexity
- Time: O(m * n).
- Space: O(m * n) for the DP plus O(m + n) output.`,
  solutions: {
    python: `class Solution:
    def shortestCommonSupersequence(self, a, b):
        m, n = len(a), len(b)
        dp = [[0]*(n+1) for _ in range(m+1)]
        for i in range(1, m+1):
            for j in range(1, n+1):
                if a[i-1] == b[j-1]:
                    dp[i][j] = dp[i-1][j-1] + 1
                else:
                    dp[i][j] = max(dp[i-1][j], dp[i][j-1])
        i, j = m, n
        out = []
        while i > 0 and j > 0:
            if a[i-1] == b[j-1]:
                out.append(a[i-1]); i -= 1; j -= 1
            elif dp[i-1][j] >= dp[i][j-1]:
                out.append(a[i-1]); i -= 1
            else:
                out.append(b[j-1]); j -= 1
        while i > 0:
            out.append(a[i-1]); i -= 1
        while j > 0:
            out.append(b[j-1]); j -= 1
        return ''.join(reversed(out))
`,
    javascript: `class Solution {
    shortestCommonSupersequence(a, b) {
        const m = a.length, n = b.length;
        const dp = Array.from({length: m+1}, () => new Array(n+1).fill(0));
        for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
            if (a[i-1] === b[j-1]) dp[i][j] = dp[i-1][j-1] + 1;
            else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
        }
        let i = m, j = n, out = [];
        while (i > 0 && j > 0) {
            if (a[i-1] === b[j-1]) { out.push(a[i-1]); i--; j--; }
            else if (dp[i-1][j] >= dp[i][j-1]) { out.push(a[i-1]); i--; }
            else { out.push(b[j-1]); j--; }
        }
        while (i > 0) { out.push(a[i-1]); i--; }
        while (j > 0) { out.push(b[j-1]); j--; }
        return out.reverse().join('');
    }
}
`,
    java: `class Solution {
    public String shortestCommonSupersequence(String a, String b) {
        int m = a.length(), n = b.length();
        int[][] dp = new int[m+1][n+1];
        for (int i = 1; i <= m; i++) for (int j = 1; j <= n; j++) {
            if (a.charAt(i-1) == b.charAt(j-1)) dp[i][j] = dp[i-1][j-1] + 1;
            else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
        }
        StringBuilder sb = new StringBuilder();
        int i = m, j = n;
        while (i > 0 && j > 0) {
            if (a.charAt(i-1) == b.charAt(j-1)) { sb.append(a.charAt(i-1)); i--; j--; }
            else if (dp[i-1][j] >= dp[i][j-1]) { sb.append(a.charAt(i-1)); i--; }
            else { sb.append(b.charAt(j-1)); j--; }
        }
        while (i > 0) { sb.append(a.charAt(i-1)); i--; }
        while (j > 0) { sb.append(b.charAt(j-1)); j--; }
        return sb.reverse().toString();
    }
}
`,
    cpp: `#include <string>
#include <vector>
#include <algorithm>
using namespace std;
class Solution {
public:
    string shortestCommonSupersequence(string a, string b) {
        int m = a.size(), n = b.size();
        vector<vector<int>> dp(m+1, vector<int>(n+1, 0));
        for (int i = 1; i <= m; i++) for (int j = 1; j <= n; j++) {
            if (a[i-1] == b[j-1]) dp[i][j] = dp[i-1][j-1] + 1;
            else dp[i][j] = max(dp[i-1][j], dp[i][j-1]);
        }
        string out;
        int i = m, j = n;
        while (i > 0 && j > 0) {
            if (a[i-1] == b[j-1]) { out += a[i-1]; i--; j--; }
            else if (dp[i-1][j] >= dp[i][j-1]) { out += a[i-1]; i--; }
            else { out += b[j-1]; j--; }
        }
        while (i > 0) { out += a[i-1]; i--; }
        while (j > 0) { out += b[j-1]; j--; }
        reverse(out.begin(), out.end());
        return out;
    }
};
`,
  },
});

// 16. my-calendar-i (test interface usually book(start,end); simplify: given list of bookings return list of accept/reject bools)
add({
  id: 'my-calendar-i',
  method_name: 'bookEvents',
  params: [{ name: 'events', type: 'List[List[int]]' }],
  return_type: 'List[bool]',
  pattern: 'Sorted intervals / TreeMap',
  description: '<p>Implement a calendar. Given a list of <code>[start, end)</code> booking attempts, return a list of booleans: <code>true</code> if the booking was accepted (no overlap with any previously accepted booking), <code>false</code> if rejected.</p>',
  hints: [
    'A new event [s, e) conflicts with an existing [a, b) when s < b and a < e.',
    'Keep accepted events in a sorted container.',
    'Use binary search (floor / ceiling) to find the only neighbour that could overlap.',
    'O(log n) per insert with a TreeMap / SortedList; O(n) with a plain list.',
    'For small inputs (≤ 10^4) a plain list with linear scan is simpler and fast enough.',
  ],
  test_cases: [
    { inputs: ['[[10,20],[15,25],[20,30]]'], expected: '[true,false,true]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[[5,10]]'], expected: '[true]' },
    { inputs: ['[[5,10],[5,10]]'], expected: '[true,false]' },
    { inputs: ['[[1,5],[5,10],[10,15]]'], expected: '[true,true,true]' },
    { inputs: ['[[10,20],[20,30],[5,15]]'], expected: '[true,true,false]' },
    { inputs: ['[[47,50],[33,41],[39,45],[33,42],[25,32]]'], expected: '[true,true,false,false,true]' },
    { inputs: ['[[1,2],[2,3],[3,4],[4,5]]'], expected: '[true,true,true,true]' },
    { inputs: ['[[0,100],[50,60]]'], expected: '[true,false]' },
    { inputs: ['[[5,10],[15,20],[8,12]]'], expected: '[true,true,false]' },
  ],
  editorial_md: `## Intuition
Two half-open intervals \`[a, b)\` and \`[s, e)\` overlap iff \`s < b\` and \`a < e\`. With accepted bookings stored in sorted order, every new request can be checked against at most two neighbours found by binary search. If neither neighbour overlaps, the new event can be inserted in O(log n).

## Approach
1. Maintain a list of accepted bookings, kept sorted by start.
2. For each new \`(s, e)\` request, binary-search for the first booking whose start is \`>= s\`. Let that be index \`idx\`.
3. Check the predecessor at \`idx - 1\` (if any) — overlap if \`prev.end > s\`.
4. Check the successor at \`idx\` (if any) — overlap if \`succ.start < e\`.
5. If no overlap, insert at \`idx\` and record \`true\`; else record \`false\`.

For interview answers the linear-scan version is acceptable when there are at most a few thousand events. TreeMap / std::set / sortedcontainers brings it to O(n log n) total for n bookings.

## Complexity
- Time: O(n log n) total with sorted-container insert; O(n) per event for a plain list (O(n^2) overall).
- Space: O(n) for the calendar.`,
  solutions: {
    python: `from bisect import bisect_left, insort
class Solution:
    def bookEvents(self, events):
        starts = []
        ends = []
        out = []
        for s, e in events:
            idx = bisect_left(starts, s)
            ok = True
            if idx > 0 and ends[idx-1] > s: ok = False
            if ok and idx < len(starts) and starts[idx] < e: ok = False
            if ok:
                starts.insert(idx, s); ends.insert(idx, e)
            out.append(ok)
        return out
`,
    javascript: `class Solution {
    bookEvents(events) {
        const starts = [], ends = [], out = [];
        for (const [s, e] of events) {
            let lo = 0, hi = starts.length;
            while (lo < hi) { const m = (lo + hi) >> 1; if (starts[m] < s) lo = m + 1; else hi = m; }
            const idx = lo;
            let ok = true;
            if (idx > 0 && ends[idx-1] > s) ok = false;
            if (ok && idx < starts.length && starts[idx] < e) ok = false;
            if (ok) { starts.splice(idx, 0, s); ends.splice(idx, 0, e); }
            out.push(ok);
        }
        return out;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public boolean[] bookEvents(int[][] events) {
        TreeMap<Integer,Integer> cal = new TreeMap<>();
        boolean[] out = new boolean[events.length];
        for (int i = 0; i < events.length; i++) {
            int s = events[i][0], e = events[i][1];
            Map.Entry<Integer,Integer> lo = cal.floorEntry(s);
            Map.Entry<Integer,Integer> hi = cal.ceilingEntry(s);
            boolean ok = true;
            if (lo != null && lo.getValue() > s) ok = false;
            if (ok && hi != null && hi.getKey() < e) ok = false;
            if (ok) cal.put(s, e);
            out[i] = ok;
        }
        return out;
    }
}
`,
    cpp: `#include <vector>
#include <map>
using namespace std;
class Solution {
public:
    vector<bool> bookEvents(vector<vector<int>>& events) {
        map<int,int> cal;
        vector<bool> out;
        for (auto& ev : events) {
            int s = ev[0], e = ev[1];
            auto hi = cal.lower_bound(s);
            bool ok = true;
            if (hi != cal.begin()) { auto lo = prev(hi); if (lo->second > s) ok = false; }
            if (ok && hi != cal.end() && hi->first < e) ok = false;
            if (ok) cal[s] = e;
            out.push_back(ok);
        }
        return out;
    }
};
`,
  },
});

// 17. minimum-number-arrows
add({
  id: 'minimum-number-arrows',
  return_type: 'int',
  params: [{ name: 'points', type: 'List[List[int]]' }],
  pattern: 'Interval greedy by end',
  test_cases: [
    { inputs: ['[[10,16],[2,8],[1,6],[7,12]]'], expected: '2' },
    { inputs: ['[[1,2],[3,4],[5,6],[7,8]]'], expected: '4' },
    { inputs: ['[[1,2],[2,3],[3,4],[4,5]]'], expected: '2' },
    { inputs: ['[[1,2]]'], expected: '1' },
    { inputs: ['[]'], expected: '0' },
    { inputs: ['[[1,10],[2,3],[4,5],[6,7],[8,9]]'], expected: '4' },
    { inputs: ['[[1,5],[2,6],[3,7],[4,8]]'], expected: '1' },
    { inputs: ['[[0,9],[0,9],[0,9]]'], expected: '1' },
    { inputs: ['[[-2147483646,-2147483645],[2147483646,2147483647]]'], expected: '2' },
    { inputs: ['[[3,9],[7,12],[3,8],[6,8],[9,10],[2,9],[0,9],[3,9],[0,6],[2,8]]'], expected: '2' },
  ],
  editorial_md: `## Intuition
Each arrow can pop every balloon whose interval contains the arrow's x. The minimum number of arrows is the minimum number of points that hit every interval — the classic "minimum point cover" problem solved greedily by always shooting the smallest right edge that hasn't been popped yet.

## Approach
1. Sort balloons by their end coordinate.
2. Initialise \`arrows = 1\` and aim \`shot = points[0][1]\`.
3. Walk through the rest. If the current balloon's \`start > shot\`, the previous arrow missed it — fire a new arrow at this balloon's end (\`shot = points[i][1]\`) and increment \`arrows\`.
4. Otherwise the current balloon is already pierced (its start is \`<= shot\` and \`shot\` lies within its interval since we sorted by end).
5. Return \`arrows\`. Handle the empty input case (return 0).

The greedy choice "shoot the smallest end" is optimal by an exchange argument: any later arrow could be slid left to that end without missing more balloons.

## Complexity
- Time: O(n log n) for the sort, O(n) for the sweep.
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def findMinArrowShots(self, points):
        if not points: return 0
        points.sort(key=lambda p: p[1])
        arrows = 1
        shot = points[0][1]
        for s, e in points[1:]:
            if s > shot:
                arrows += 1
                shot = e
        return arrows
`,
    javascript: `class Solution {
    findMinArrowShots(points) {
        if (!points.length) return 0;
        points.sort((a, b) => a[1] - b[1]);
        let arrows = 1, shot = points[0][1];
        for (let i = 1; i < points.length; i++) {
            if (points[i][0] > shot) { arrows++; shot = points[i][1]; }
        }
        return arrows;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int findMinArrowShots(int[][] points) {
        if (points.length == 0) return 0;
        Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));
        int arrows = 1, shot = points[0][1];
        for (int i = 1; i < points.length; i++) {
            if (points[i][0] > shot) { arrows++; shot = points[i][1]; }
        }
        return arrows;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;
class Solution {
public:
    int findMinArrowShots(vector<vector<int>>& points) {
        if (points.empty()) return 0;
        sort(points.begin(), points.end(), [](auto& a, auto& b){ return a[1] < b[1]; });
        int arrows = 1, shot = points[0][1];
        for (size_t i = 1; i < points.size(); i++) {
            if (points[i][0] > shot) { arrows++; shot = points[i][1]; }
        }
        return arrows;
    }
};
`,
  },
});

// 18. range-module (simplified — process a list of operations: add/remove/query, return list of query results)
add({
  id: 'range-module',
  method_name: 'rangeModule',
  params: [{ name: 'ops', type: 'List[List[str]]' }],
  return_type: 'List[bool]',
  pattern: 'Sorted intervals merge',
  description: '<p>Process a sequence of range operations. Each op is <code>["add", l, r]</code> (track range [l, r)), <code>["remove", l, r]</code> (untrack range [l, r)), or <code>["query", l, r]</code> (return whether the entire range [l, r) is currently tracked). Return the list of boolean answers for the query operations in order.</p>',
  hints: [
    'Maintain a sorted list of disjoint intervals representing the tracked set.',
    'For add: merge with any overlapping/adjacent intervals to form a single new one.',
    'For remove: split overlapping intervals around [l, r) and drop the middles.',
    'For query: binary-search for an interval whose start <= l, and check its end >= r.',
    'TreeMap / SortedDict makes the merge O(log n + k) where k is the number of merged intervals.',
  ],
  test_cases: [
    { inputs: ['[["add","10","20"],["remove","14","16"],["query","10","14"],["query","13","15"],["query","16","17"]]'], expected: '[true,false,true]' },
    { inputs: ['[["query","1","2"]]'], expected: '[false]' },
    { inputs: ['[["add","1","10"],["query","5","6"]]'], expected: '[true]' },
    { inputs: ['[["add","1","5"],["add","10","20"],["query","6","9"]]'], expected: '[false]' },
    { inputs: ['[["add","1","5"],["add","5","10"],["query","1","10"]]'], expected: '[true]' },
    { inputs: ['[["add","1","10"],["remove","1","10"],["query","1","2"]]'], expected: '[false]' },
    { inputs: ['[["add","1","10"],["remove","5","6"],["query","5","6"]]'], expected: '[false]' },
    { inputs: ['[["add","1","10"],["remove","5","6"],["query","6","10"]]'], expected: '[true]' },
    { inputs: ['[["add","1","100"],["query","50","60"],["remove","50","60"],["query","50","60"]]'], expected: '[true,false]' },
    { inputs: ['[["add","5","10"],["add","6","8"],["query","5","10"],["remove","7","9"],["query","8","9"]]'], expected: '[true,false]' },
  ],
  editorial_md: `## Intuition
Track an evolving set of disjoint half-open intervals. Three operations — add, remove, query — boil down to standard interval-merging and binary-search lookups on a sorted container. For a "simplified" variant we can use a sorted Python list of \`[start, end]\` pairs and bisect to find the merge window.

## Approach
- **add(l, r)**: find every existing interval that overlaps or touches \`[l, r)\`. Their union is one new interval \`[min(starts), max(ends))\`. Remove the overlapped ones, insert the merged one.
- **remove(l, r)**: find every overlapping interval. For each, the remainder outside \`[l, r)\` may produce a left piece \`[start, l)\` and / or a right piece \`[r, end)\` — re-insert any non-empty pieces.
- **query(l, r)**: binary-search for the interval whose start is the greatest value \`<= l\`. The whole range is tracked iff that interval exists and its \`end >= r\`.

A TreeMap (Java) or std::map (C++) provides O(log n) lookups; a Python sorted list with \`bisect\` works the same way.

## Complexity
- Time: amortised O(log n + k) per operation where k is the number of merged or removed intervals; queries are O(log n).
- Space: O(n) for the active interval set.`,
  solutions: {
    python: `from bisect import bisect_left
class Solution:
    def rangeModule(self, ops):
        intervals = []  # list of [l, r]
        out = []
        def add(l, r):
            new_l, new_r = l, r
            i = bisect_left(intervals, [l, l])
            if i > 0 and intervals[i-1][1] >= l: i -= 1
            j = i
            while j < len(intervals) and intervals[j][0] <= r:
                new_l = min(new_l, intervals[j][0])
                new_r = max(new_r, intervals[j][1])
                j += 1
            intervals[i:j] = [[new_l, new_r]]
        def remove(l, r):
            i = bisect_left(intervals, [l, l])
            if i > 0 and intervals[i-1][1] > l: i -= 1
            j = i; new_pieces = []
            while j < len(intervals) and intervals[j][0] < r:
                if intervals[j][0] < l: new_pieces.append([intervals[j][0], l])
                if intervals[j][1] > r: new_pieces.append([r, intervals[j][1]])
                j += 1
            intervals[i:j] = new_pieces
        def query(l, r):
            i = bisect_left(intervals, [l, l])
            if i < len(intervals) and intervals[i][0] == l:
                return intervals[i][1] >= r
            if i == 0: return False
            return intervals[i-1][1] >= r
        for op in ops:
            kind, a, b = op[0], int(op[1]), int(op[2])
            if kind == 'add': add(a, b)
            elif kind == 'remove': remove(a, b)
            else: out.append(query(a, b))
        return out
`,
    javascript: `class Solution {
    rangeModule(ops) {
        const intervals = [];
        const bsearch = (l) => {
            let lo = 0, hi = intervals.length;
            while (lo < hi) { const m = (lo + hi) >> 1; if (intervals[m][0] < l) lo = m + 1; else hi = m; }
            return lo;
        };
        const out = [];
        const add = (l, r) => {
            let i = bsearch(l);
            if (i > 0 && intervals[i-1][1] >= l) i--;
            let j = i, nl = l, nr = r;
            while (j < intervals.length && intervals[j][0] <= r) {
                nl = Math.min(nl, intervals[j][0]);
                nr = Math.max(nr, intervals[j][1]);
                j++;
            }
            intervals.splice(i, j - i, [nl, nr]);
        };
        const remove = (l, r) => {
            let i = bsearch(l);
            if (i > 0 && intervals[i-1][1] > l) i--;
            let j = i; const pieces = [];
            while (j < intervals.length && intervals[j][0] < r) {
                if (intervals[j][0] < l) pieces.push([intervals[j][0], l]);
                if (intervals[j][1] > r) pieces.push([r, intervals[j][1]]);
                j++;
            }
            intervals.splice(i, j - i, ...pieces);
        };
        const query = (l, r) => {
            let i = bsearch(l);
            if (i < intervals.length && intervals[i][0] === l) return intervals[i][1] >= r;
            if (i === 0) return false;
            return intervals[i-1][1] >= r;
        };
        for (const [kind, a, b] of ops) {
            const l = parseInt(a, 10), r = parseInt(b, 10);
            if (kind === 'add') add(l, r);
            else if (kind === 'remove') remove(l, r);
            else out.push(query(l, r));
        }
        return out;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public boolean[] rangeModule(String[][] ops) {
        TreeMap<Integer,Integer> map = new TreeMap<>();
        List<Boolean> out = new ArrayList<>();
        for (String[] op : ops) {
            int l = Integer.parseInt(op[1]), r = Integer.parseInt(op[2]);
            if (op[0].equals("add")) {
                Map.Entry<Integer,Integer> e = map.floorEntry(r);
                while (e != null && e.getValue() >= l) {
                    l = Math.min(l, e.getKey());
                    r = Math.max(r, e.getValue());
                    map.remove(e.getKey());
                    e = map.floorEntry(r);
                }
                map.put(l, r);
            } else if (op[0].equals("remove")) {
                Map.Entry<Integer,Integer> e = map.floorEntry(r);
                List<int[]> pieces = new ArrayList<>();
                List<Integer> remove = new ArrayList<>();
                while (e != null && e.getValue() > l) {
                    remove.add(e.getKey());
                    if (e.getKey() < l) pieces.add(new int[]{e.getKey(), l});
                    if (e.getValue() > r) pieces.add(new int[]{r, e.getValue()});
                    e = map.lowerEntry(e.getKey());
                }
                for (int k : remove) map.remove(k);
                for (int[] p : pieces) map.put(p[0], p[1]);
            } else {
                Map.Entry<Integer,Integer> e = map.floorEntry(l);
                out.add(e != null && e.getValue() >= r);
            }
        }
        boolean[] arr = new boolean[out.size()];
        for (int i = 0; i < out.size(); i++) arr[i] = out.get(i);
        return arr;
    }
}
`,
    cpp: `#include <vector>
#include <string>
#include <map>
using namespace std;
class Solution {
public:
    vector<bool> rangeModule(vector<vector<string>>& ops) {
        map<int,int> mp;
        vector<bool> out;
        for (auto& op : ops) {
            int l = stoi(op[1]), r = stoi(op[2]);
            if (op[0] == "add") {
                auto it = mp.upper_bound(r);
                while (it != mp.begin()) {
                    --it;
                    if (it->second < l) { ++it; break; }
                    l = min(l, it->first); r = max(r, it->second);
                    it = mp.erase(it);
                    if (it == mp.begin()) break;
                }
                mp[l] = r;
            } else if (op[0] == "remove") {
                vector<pair<int,int>> add;
                auto it = mp.upper_bound(r);
                while (it != mp.begin()) {
                    --it;
                    if (it->second <= l) { break; }
                    int s = it->first, e = it->second;
                    if (s < l) add.push_back({s, l});
                    if (e > r) add.push_back({r, e});
                    it = mp.erase(it);
                    if (it == mp.begin()) break;
                }
                for (auto& p : add) mp[p.first] = p.second;
            } else {
                auto it = mp.upper_bound(l);
                if (it == mp.begin()) { out.push_back(false); continue; }
                --it;
                out.push_back(it->second >= r);
            }
        }
        return out;
    }
};
`,
  },
});

// 19. only-set-bit (check if n has only one set bit, i.e. is a power of two)
add({
  id: 'only-set-bit',
  method_name: 'isPowerOfTwo',
  params: [{ name: 'n', type: 'int' }],
  return_type: 'bool',
  pattern: 'Bit trick (n & (n-1))',
  description: '<p>Return <code>true</code> if the given integer has exactly one set bit (i.e. is a positive power of two), else <code>false</code>.</p>',
  hints: [
    'A positive power of two has exactly one 1-bit in binary.',
    'n & (n - 1) clears the lowest set bit. If n is a power of two, the result is 0.',
    'Edge case: n must be positive — 0 and negatives return false.',
    'In one line: n > 0 && (n & (n - 1)) == 0.',
    'Equivalent: bin(n).count("1") == 1.',
  ],
  test_cases: [
    { inputs: ['1'], expected: 'true' },
    { inputs: ['2'], expected: 'true' },
    { inputs: ['3'], expected: 'false' },
    { inputs: ['4'], expected: 'true' },
    { inputs: ['16'], expected: 'true' },
    { inputs: ['18'], expected: 'false' },
    { inputs: ['0'], expected: 'false' },
    { inputs: ['-2'], expected: 'false' },
    { inputs: ['1024'], expected: 'true' },
    { inputs: ['1073741824'], expected: 'true' },
  ],
  editorial_md: `## Intuition
A positive power of two has exactly one set bit. Subtracting one from such a number flips that single bit to 0 and turns every lower bit to 1. Anding the two gives 0. For any other positive number, the lowest set bit is preserved in \`n & (n - 1)\`, leaving a non-zero result.

## Approach
1. If \`n <= 0\`, return \`false\` — only positive numbers can be powers of two.
2. Compute \`n & (n - 1)\`.
3. The number is a power of two iff that bitwise-and is zero.

Equivalent one-liner: \`n > 0 and (n & (n - 1)) == 0\`. This is constant-time and avoids any logarithm or loop.

## Complexity
- Time: O(1).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def isPowerOfTwo(self, n):
        return n > 0 and (n & (n - 1)) == 0
`,
    javascript: `class Solution {
    isPowerOfTwo(n) {
        return n > 0 && (n & (n - 1)) === 0;
    }
}
`,
    java: `class Solution {
    public boolean isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }
}
`,
    cpp: `class Solution {
public:
    bool isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }
};
`,
  },
});

// 20. palindrome-pairs
add({
  id: 'palindrome-pairs',
  return_type: 'List[List[int]]',
  params: [{ name: 'words', type: 'List[str]' }],
  pattern: 'Reversed-word hash with palindrome split',
  test_cases: [
    { inputs: ['["abcd","dcba","lls","s","sssll"]'], expected: '[[0,1],[1,0],[3,2],[2,4]]' },
    { inputs: ['["bat","tab","cat"]'], expected: '[[0,1],[1,0]]' },
    { inputs: ['["a",""]'], expected: '[[0,1],[1,0]]' },
    { inputs: ['["abc","ba"]'], expected: '[]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['["a"]'], expected: '[]' },
    { inputs: ['["ab","ba"]'], expected: '[[0,1],[1,0]]' },
    { inputs: ['["abcd","dcba"]'], expected: '[[0,1],[1,0]]' },
    { inputs: ['["",""]'], expected: '[[0,1],[1,0]]' },
    { inputs: ['["aba","b"]'], expected: '[]' },
  ],
  editorial_md: `## Intuition
For each word, a palindrome pair forms when we can split it into two halves \`L | R\` such that one half is a palindrome and the reverse of the other half exists as a different word in the input. Hashing every word to its index lets us answer "does the reverse of X exist?" in O(1) and gives an O(n * L^2) algorithm overall.

## Approach
1. Build a map \`{word -> index}\`.
2. For each \`(i, word)\`:
   - For every split point \`j\` in \`[0, len(word)]\`, set \`L = word[:j]\`, \`R = word[j:]\`.
   - If \`L\` is a palindrome and \`reverse(R)\` exists at index \`k != i\`, then \`(k, i)\` is a valid pair (concat = \`R_rev + L + R\` becomes \`R_rev + word\`, palindromic because \`L\` is palindrome).
   - Similarly, if \`R\` is a palindrome and \`reverse(L)\` exists at index \`k != i\`, then \`(i, k)\` is a valid pair.
   - Avoid double-counting when \`j == 0\` or \`j == len(word)\`.
3. De-duplicate by using a set or by carefully guarding the empty-half case.

## Complexity
- Time: O(n * L^2) where L = average word length, dominated by the substring/reverse operations.
- Space: O(n) for the hash map, O(L) for substrings.`,
  solutions: {
    python: `class Solution:
    def palindromePairs(self, words):
        index = {w: i for i, w in enumerate(words)}
        out = set()
        for i, w in enumerate(words):
            for j in range(len(w) + 1):
                L, R = w[:j], w[j:]
                if L == L[::-1]:
                    rev = R[::-1]
                    if rev in index and index[rev] != i and rev:
                        out.add((index[rev], i))
                    if rev in index and index[rev] != i and not rev and len(w) > 0:
                        out.add((index[rev], i))
                if R == R[::-1] and R:
                    rev = L[::-1]
                    if rev in index and index[rev] != i:
                        out.add((i, index[rev]))
        return [list(p) for p in out]
`,
    javascript: `class Solution {
    palindromePairs(words) {
        const isPal = (s) => { let i=0,j=s.length-1; while(i<j){if(s[i]!==s[j])return false;i++;j--;} return true; };
        const rev = (s) => s.split('').reverse().join('');
        const index = new Map();
        words.forEach((w, i) => index.set(w, i));
        const out = new Set();
        for (let i = 0; i < words.length; i++) {
            const w = words[i];
            for (let j = 0; j <= w.length; j++) {
                const L = w.slice(0, j), R = w.slice(j);
                if (isPal(L)) {
                    const r = rev(R);
                    if (index.has(r) && index.get(r) !== i && r.length > 0) out.add(index.get(r) + ',' + i);
                }
                if (isPal(R) && R.length > 0) {
                    const r = rev(L);
                    if (index.has(r) && index.get(r) !== i) out.add(i + ',' + index.get(r));
                }
            }
        }
        return [...out].map(s => s.split(',').map(Number));
    }
}
`,
    java: `import java.util.*;
class Solution {
    public List<List<Integer>> palindromePairs(String[] words) {
        Map<String,Integer> index = new HashMap<>();
        for (int i = 0; i < words.length; i++) index.put(words[i], i);
        Set<String> seen = new HashSet<>();
        List<List<Integer>> out = new ArrayList<>();
        for (int i = 0; i < words.length; i++) {
            String w = words[i];
            for (int j = 0; j <= w.length(); j++) {
                String L = w.substring(0, j), R = w.substring(j);
                if (isPal(L)) {
                    String r = new StringBuilder(R).reverse().toString();
                    Integer k = index.get(r);
                    if (k != null && k != i && r.length() > 0) { String key = k+","+i; if (seen.add(key)) out.add(Arrays.asList(k, i)); }
                }
                if (isPal(R) && R.length() > 0) {
                    String r = new StringBuilder(L).reverse().toString();
                    Integer k = index.get(r);
                    if (k != null && k != i) { String key = i+","+k; if (seen.add(key)) out.add(Arrays.asList(i, k)); }
                }
            }
        }
        return out;
    }
    private boolean isPal(String s) { int i=0,j=s.length()-1; while(i<j){if(s.charAt(i)!=s.charAt(j))return false;i++;j--;} return true; }
}
`,
    cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <set>
using namespace std;
class Solution {
public:
    vector<vector<int>> palindromePairs(vector<string>& words) {
        unordered_map<string,int> index;
        for (int i = 0; i < (int)words.size(); i++) index[words[i]] = i;
        set<pair<int,int>> seen;
        vector<vector<int>> out;
        for (int i = 0; i < (int)words.size(); i++) {
            const string& w = words[i];
            for (int j = 0; j <= (int)w.size(); j++) {
                string L = w.substr(0, j), R = w.substr(j);
                if (isPal(L)) {
                    string r = R; reverse(r.begin(), r.end());
                    auto it = index.find(r);
                    if (it != index.end() && it->second != i && !r.empty()) {
                        if (seen.insert({it->second, i}).second) out.push_back({it->second, i});
                    }
                }
                if (isPal(R) && !R.empty()) {
                    string r = L; reverse(r.begin(), r.end());
                    auto it = index.find(r);
                    if (it != index.end() && it->second != i) {
                        if (seen.insert({i, it->second}).second) out.push_back({i, it->second});
                    }
                }
            }
        }
        return out;
    }
private:
    bool isPal(const string& s) { int i=0,j=s.size()-1; while(i<j){if(s[i]!=s[j])return false;i++;j--;} return true; }
};
`,
  },
});

fs.writeFileSync('/tmp/patch-500-02-part2.json', JSON.stringify(entries, null, 2));
console.log('Wrote part2 with ' + entries.length + ' entries.');
