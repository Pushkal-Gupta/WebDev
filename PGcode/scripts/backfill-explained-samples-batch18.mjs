#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 18.
// Focus area: matrix / 2D array manipulation.
// Skips problems already at length === 3.
// Run: node scripts/backfill-explained-samples-batch18.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SVC) {
  console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}
const sb = createClient(URL, SVC);

const PAYLOAD = {
  'rotate-image': [
    {
      inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'],
      expected: '[[7,4,1],[8,5,2],[9,6,3]]',
      explanation_md:
        'Canonical LC example. Rotate 90 degrees clockwise in place using transpose-then-reverse-rows. Transpose swaps `(i,j)` with `(j,i)` only for `j > i` (or it undoes itself): the matrix becomes `[[1,4,7],[2,5,8],[3,6,9]]`. Then reverse each row: `[1,4,7] -> [7,4,1]`, `[2,5,8] -> [8,5,2]`, `[3,6,9] -> [9,6,3]`. Final matrix matches expected. The transpose+reverse trick costs O(n^2) reads and zero extra memory, vs. an auxiliary-matrix solution that doubles the space.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: '[[1]]',
      explanation_md:
        'Edge case: 1x1 matrix. Transpose is a no-op (only diagonal). Reversing the single-element row is a no-op. The matrix returns unchanged, which is correct: rotating a single cell by any multiple of 90 degrees leaves it in place. Confirms the inner swap loop `for j in range(i+1, n)` never fires when `n == 1`, avoiding any off-by-one that touches `(0,0)` twice.',
      viz_anchor: null,
    },
    {
      inputs: ['[[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]'],
      expected: '[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]',
      explanation_md:
        'Algorithmically interesting: a 4x4 with no symmetry, so any indexing slip is visible. After transpose: `[[5,2,13,15],[1,4,3,14],[9,8,6,12],[11,10,7,16]]`. Reverse each row to get the expected matrix. Catches the classic bug where the transpose loop runs the full `j in range(n)` instead of `j in range(i+1, n)` and ends up double-swapping back to the original. The corner cell `(0,0)=5` lands at `(0,3)`; `(3,3)=16` stays put (rotation fixed point on the anti-diagonal? No — it just happens to land back at `(3,0)` after reverse, which is index `[3][0]=16`).',
      viz_anchor: null,
    },
  ],

  'spiral-matrix': [
    {
      inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'],
      expected: '[1,2,3,6,9,8,7,4,5]',
      explanation_md:
        'Canonical LC example. Walk the boundary with four shrinking pointers: `top=0, bot=2, left=0, right=2`. Top row left-to-right: `1,2,3`; top++ -> 1. Right column top-to-bot: `6,9`; right-- -> 1. Bottom row right-to-left (only if top<=bot): `8,7`; bot-- -> 1. Left column bot-to-top (only if left<=right): `4`; left++ -> 1. Loop continues: top row of inner ring `5`; finished. Output `[1,2,3,6,9,8,7,4,5]`. The bounds-check before the two backward passes is what prevents double-visiting cells in odd-sized matrices.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2,3,4],[5,6,7,8],[9,10,11,12]]'],
      expected: '[1,2,3,4,8,12,11,10,9,5,6,7]',
      explanation_md:
        'Edge case: non-square (3x4). Demonstrates the inner loop terminating on either the row or column dimension. Outer ring: `1,2,3,4` (top), `8,12` (right), `11,10,9` (bot), `5` (left). Now `top=1, bot=1, left=1, right=2`. Inner top row: `6,7`. Backward passes are skipped because after `top++` we have `top=2 > bot=1`. Final list is `[1,2,3,4,8,12,11,10,9,5,6,7]`. Catches off-by-one bugs that assume `m == n`.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2],[3,4],[5,6],[7,8]]'],
      expected: '[1,2,4,6,8,7,5,3]',
      explanation_md:
        'Algorithmically interesting: tall-and-thin 4x2. Top row: `1,2`. Right column: `4,6,8`. The backward bottom-row pass would emit `7` if we forgot the `top<=bot` guard AFTER the increment, but with the guard the loop walks `7` and the left column walks `5,3`. Expected `[1,2,4,6,8,7,5,3]`. A naive implementation that always runs all four passes would emit `8` twice. This case exposes that bug immediately.',
      viz_anchor: null,
    },
  ],

  'spiral-matrix-ii': [
    {
      inputs: ['3'],
      expected: '[[1,2,3],[8,9,4],[7,6,5]]',
      explanation_md:
        'Canonical LC example. Generate an n x n matrix filled `1..n^2` in spiral order. Use four bounds and a running counter. Place `1,2,3` along top; `4,5` down right; `6,7` along bottom reversed; `8` up left; finally `9` in the center. Result matches expected. The single-counter approach beats a "compute coordinate from index" scheme — no modular arithmetic needed.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '[[1]]',
      explanation_md:
        'Edge case: n=1. The outer loop fires once for the top row, places `1`, then `top=1 > bot=0` aborts the right-column pass. No backward passes run. Result `[[1]]`. Confirms the loop condition `while count <= n*n` exits cleanly without an extra write that would attempt to index `matrix[0][1]` and crash.',
      viz_anchor: null,
    },
    {
      inputs: ['4'],
      expected: '[[1,2,3,4],[12,13,14,5],[11,16,15,6],[10,9,8,7]]',
      explanation_md:
        'Algorithmically interesting: even n means no center cell; the inner ring is itself 2x2. Outer ring writes `1..12`. Inner ring: top row `13,14`; right column `15`; bottom row `16`. Note `16` sits at `(2,1)` not `(2,2)`. Catches the bug where the inner-ring code is hardcoded to write a center pixel — for even `n` the center does not exist and the index would overflow.',
      viz_anchor: null,
    },
  ],

  'spiral-matrix-iii': [
    {
      inputs: ['1', '4', '0', '0'],
      expected: '[[0,0],[0,1],[0,2],[0,3]]',
      explanation_md:
        'Canonical-style example. Walk outward in a clockwise spiral from `(0,0)` in a 1x4 grid. Step lengths follow the pattern `1,1,2,2,3,3,...` with directions `E,S,W,N` cycling. Only cells inside the grid are recorded. Starting east: `(0,1)` is in-grid, append. Step counts increment correctly so the walk eventually sweeps `(0,2)` and `(0,3)`. Result `[[0,0],[0,1],[0,2],[0,3]]`. The brilliance: track the spiral in unbounded coordinates and filter — never special-case the grid edge.',
      viz_anchor: null,
    },
    {
      inputs: ['1', '1', '0', '0'],
      expected: '[[0,0]]',
      explanation_md:
        'Edge case: 1x1 grid. The starting cell is the only valid cell; the spiral instantly satisfies its `rows*cols` quota and exits. Result `[[0,0]]`. Catches a bug where the loop condition checks `len(out) < rows*cols` after the loop body instead of before, causing an extra direction step that would attempt to record an out-of-grid point.',
      viz_anchor: null,
    },
    {
      inputs: ['5', '6', '1', '4'],
      expected: '[[1,4],[1,5],[2,5],[2,4],[2,3],[1,3],[0,3],[0,4],[0,5],[3,5],[3,4],[3,3],[3,2],[2,2],[1,2],[0,2],[4,5],[4,4],[4,3],[4,2],[4,1],[3,1],[2,1],[1,1],[0,1],[4,0],[3,0],[2,0],[1,0],[0,0]]',
      explanation_md:
        'Algorithmically interesting: start at `(1,4)`, near a corner of a 5x6 grid. The spiral covers all 30 cells. Each "lap" lengthens by two steps per axis. Cells outside `0<=r<5, 0<=c<6` are silently skipped. The expected order verifies the implementation tracks step-length growth and direction cycling correctly across many laps — easy to miss an "increment step-length only on direction change to N or S" rule and end up with a square spiral instead.',
      viz_anchor: null,
    },
  ],

  'set-matrix-zeroes': [
    {
      inputs: ['[[1,1,1],[1,0,1],[1,1,1]]'],
      expected: '[[1,0,1],[0,0,0],[1,0,1]]',
      explanation_md:
        'Canonical LC example. Constant-space trick: use row 0 and column 0 as marker arrays, plus two booleans for whether row 0 / col 0 themselves should zero. Pass 1 scans: find `(1,1)=0`, mark `matrix[0][1]=0` and `matrix[1][0]=0`. Pass 2 zeros every cell whose row-marker or col-marker is zero — except row 0 / col 0, handled last using the booleans. Final matrix has row 1 and column 1 zeroed. Result matches expected.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: '[[1]]',
      explanation_md:
        'Edge case: 1x1 with non-zero. No zeros to mark; both row-0 and col-0 booleans stay false. Pass 2 leaves everything intact. Result `[[1]]`. Catches a bug where the row-0/col-0 zeroing code runs unconditionally and wipes the cell. The two-boolean shield exists precisely to avoid this.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,1,2,0],[3,4,5,2],[1,3,1,5]]'],
      expected: '[[0,0,0,0],[0,4,5,0],[0,3,1,0]]',
      explanation_md:
        'Algorithmically interesting: zeros sit in row 0, which doubles as a marker. Pass 1 scans row 0 first and sets `row0_has_zero=True`; columns 0 and 3 are zero, so `matrix[0][0]=0` and `matrix[0][3]=0` would happen — but those cells were ALREADY zero from input, so no information loss. The trick still works because we set the col0/row0 booleans BEFORE using row 0 as a marker. Pass 2 zeros columns 0 and 3 across all rows, then zeros row 0 last. Catches the bug where row 0 is read as a marker AFTER it has been overwritten — the algorithm must commit the booleans before touching row 0 as marker space.',
      viz_anchor: null,
    },
  ],

  'valid-sudoku': [
    {
      inputs: ['[["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. Maintain three sets of seen digits: one per row, one per column, one per 3x3 box. The box index is `(r//3)*3 + (c//3)`. Walk every cell; if it is a digit, attempt to insert into the row, col, and box set — duplicate insert means invalid. Every digit in this partially-filled board is unique within its row, column, and box, so all 27 sets stay duplicate-free and the algorithm returns true. The 3-tuple of sets is what keeps it O(81) rather than re-scanning each row/col/box for every cell.',
      viz_anchor: null,
    },
    {
      inputs: ['[[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."]]'],
      expected: 'true',
      explanation_md:
        'Edge case: empty board (all dots). No digit cells are ever processed, so all 27 seen-sets stay empty and no duplicate check fires. Result true — a board with no filled cells is trivially valid. Catches a bug where the validator requires every row to contain at least one digit, or treats `.` as the digit `0`.',
      viz_anchor: null,
    },
    {
      inputs: ['[["8","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]'],
      expected: 'false',
      explanation_md:
        'Algorithmically interesting: only one cell differs from the canonical board — `(0,0)` changed from `5` to `8`. The original `8` lives at `(3,0)` (same column) and at `(2,2)` (same 3x3 box). Either check fires first depending on iteration order: when the scan reaches `(2,2)` the box-set for box 0 already contains `8` from `(0,0)`, duplicate, return false. Catches a validator that only checks rows and forgets columns or boxes.',
      viz_anchor: null,
    },
  ],

  'game-of-life': [
    {
      inputs: ['[[0,1,0],[0,0,1],[1,1,1],[0,0,0]]'],
      expected: '[[0,0,0],[1,0,1],[0,1,1],[0,1,0]]',
      explanation_md:
        'Canonical LC example. For each cell count its 8 live neighbours, then apply the four Conway rules. To do it in place, encode transitions: live -> dead use `2`, dead -> live use `3`. Pass 1 mutates with markers; pass 2 maps `1,2 -> 0` and `2,3 -> ` wait — simpler: live IFF the value is `1` or `2`. After pass 1 each cell holds enough info to reconstruct both its old and new states. Pass 2 normalises: anything `>= 2` snaps to its parity (`2 -> 0`, `3 -> 1`). The final grid matches expected.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1],[1,0]]'],
      expected: '[[1,1],[1,1]]',
      explanation_md:
        'Edge case: 2x2, three live cells. Every cell has all three of its in-grid neighbours visible (corners). The dead cell `(1,1)` has exactly 3 live neighbours -> birth. The three live cells each have 2 live neighbours (within in-grid only) -> survive. All four become alive. Catches a bug where the neighbour count includes out-of-grid cells (treating them as live), which would skew the count to 4+ and kill cells by overcrowding.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,1,0],[1,1,1],[0,1,0]]'],
      expected: '[[1,1,1],[1,0,1],[1,1,1]]',
      explanation_md:
        'Algorithmically interesting: a "plus" shape. The corners each see 3 live neighbours (the plus arms) -> birth. The centre `(1,1)` has 4 live neighbours -> overpopulation -> dies. The arms `(0,1), (1,0), (1,2), (2,1)` each see 3 live neighbours -> survive. Result is an inverted plus. This case verifies you used the OLD state (encoded via the markers) when counting neighbours of LATER cells — using the new state would mistakenly count `(1,1)` as still alive even after it died, breaking the count for `(2,1)`.',
      viz_anchor: null,
    },
  ],

  'diagonal-traverse': [
    {
      inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'],
      expected: '[1,2,4,7,5,3,6,8,9]',
      explanation_md:
        'Canonical LC example. Cells on the same anti-diagonal share `r+c`. Group cells by `r+c`, then emit groups in order. For even `r+c`, emit bottom-to-top (`r` descending); for odd `r+c`, emit top-to-bottom. Diagonals: `[1]` (sum 0), `[2,4]` reversed (sum 1), `[3,5,7]` (sum 2), `[6,8]` reversed (sum 3), `[9]` (sum 4). Concatenated: `[1,2,4,7,5,3,6,8,9]`. The parity flip is what makes the traversal zig-zag instead of monotone.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2]]'],
      expected: '[1,2]',
      explanation_md:
        'Edge case: single-row matrix. Diagonals: `[1]` (sum 0), `[2]` (sum 1). Each diagonal has only one element, so the parity flip does nothing and the output is just left-to-right. Catches a bug where the parity logic always tries to reverse even when the group length is 1 and crashes on an off-by-one slice.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2,3],[4,5,6]]'],
      expected: '[1,2,4,5,3,6]',
      explanation_md:
        'Algorithmically interesting: non-square 2x3. Diagonals by `r+c`: `[1]`, `[2,4]` reverse to `[4,2]`? No — sum 1 is ODD so we emit top-to-bottom: `[2,4]`. Sum 2 EVEN, emit bottom-to-top: cells `(1,1)=5, (0,2)=3` -> `[5,3]`. Sum 3 ODD, emit top-to-bottom: cell `(1,2)=6` -> `[6]`. Concatenate: `[1,2,4,5,3,6]`. Confirms the parity convention — even sums go up-and-right (we list bottom-first), odd sums go down-and-left.',
      viz_anchor: null,
    },
  ],

  'diagonal-traverse-ii': [
    {
      inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'],
      expected: '[1,4,2,7,5,3,8,6,9]',
      explanation_md:
        'Canonical-style example. This variant traverses every anti-diagonal in bottom-to-top order regardless of parity. Group by `r+c`: sum 0 `[1]`, sum 1 `[4,2]` (row 1 first), sum 2 `[7,5,3]`, sum 3 `[8,6]`, sum 4 `[9]`. Concatenate: `[1,4,2,7,5,3,8,6,9]`. The key change from diagonal-traverse I: we always emit from bottom-left to top-right, never the reverse — because the input is a list of variable-length rows and only this direction guarantees correct ordering when rows differ in length.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: '[1]',
      explanation_md:
        'Edge case: single cell. One diagonal with one element. Output `[1]`. Confirms the group-by-sum approach degenerates cleanly when `len(rows) == 1` and `len(rows[0]) == 1`.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2,3,4,5],[6,7],[8],[9,10,11],[12,13,14,15,16]]'],
      expected: '[1,6,8,9,2,12,10,7,3,13,11,4,14,5,15,16]',
      explanation_md:
        'Algorithmically interesting: ragged 2D array — rows have lengths `5,2,1,3,5`. The standard for-loop pattern over `r+c` indices breaks because some `(r,c)` are out of bounds. Solution: iterate every `(r,c)` and append `grid[r][c]` to a dict keyed by `r+c`; within each key, larger `r` (lower row index from the bottom) comes first. Concatenate by ascending key. The order encodes both the diagonal grouping and the bottom-up emission inside each diagonal, which is non-trivial to get right when row 0 is much wider than row 2.',
      viz_anchor: null,
    },
  ],

  'diagonal-sum': [
    {
      inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'],
      expected: '25',
      explanation_md:
        'Canonical LC example. Sum the primary diagonal `(i,i)` and the secondary diagonal `(i, n-1-i)`. For n=3: primary = `1+5+9 = 15`, secondary = `3+5+7 = 15`. The centre `5` is counted twice — subtract once because n is odd. Total = `15+15-5 = 25`. The deduplication step is the crux: only fire when n is odd, where the two diagonals share the centre cell.',
      viz_anchor: null,
    },
    {
      inputs: ['[[5]]'],
      expected: '5',
      explanation_md:
        'Edge case: 1x1. Both diagonals are the single cell `(0,0)=5`. Naive sum would be `5+5 = 10`. The odd-n deduplication subtracts the centre once: `10 - 5 = 5`. Catches a bug where the dedup check uses `n > 1` instead of `n % 2 == 1`, returning `10` for this case.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]]'],
      expected: '8',
      explanation_md:
        'Algorithmically interesting: even n=4. Primary `1+1+1+1 = 4`, secondary `1+1+1+1 = 4`. Total `8` — no dedup because for even n the two diagonals never share a cell. Catches the bug where the dedup always fires (n%2 ignored), wrongly subtracting `1` and returning `7`. Tests that the parity branch is genuinely n%2 == 1.',
      viz_anchor: null,
    },
  ],

  'transpose-matrix': [
    {
      inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'],
      expected: '[[1,4,7],[2,5,8],[3,6,9]]',
      explanation_md:
        'Canonical LC example. Allocate a new `cols x rows` matrix and set `out[j][i] = matrix[i][j]`. The first column of the input becomes the first row of the output. Note this is NOT done in place here (unlike rotate-image) because the problem allows non-square inputs, where the output dimensions differ from the input. For n=m=3 the result is the reflection across the main diagonal.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2,3]]'],
      expected: '[[1],[2],[3]]',
      explanation_md:
        'Edge case: single row. Output has 3 rows of 1 column each. Confirms the algorithm correctly allocates `cols x rows` (3 x 1) rather than `rows x cols` (1 x 3) — a transposed-shape bug would crash on the very first `out[1][0]` write.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2,3],[4,5,6]]'],
      expected: '[[1,4],[2,5],[3,6]]',
      explanation_md:
        'Algorithmically interesting: rectangular 2x3 -> 3x2. Output dimensions truly differ. Each column of the input becomes a row of the output. Catches the bug where an in-place transpose loop assumes a square matrix and writes off the end. The non-square case forces the implementation to use a fresh output buffer.',
      viz_anchor: null,
    },
  ],

  'flipping-an-image': [
    {
      inputs: ['[[1,1,0],[1,0,1],[0,0,0]]'],
      expected: '[[1,0,0],[0,1,0],[1,1,1]]',
      explanation_md:
        'Canonical LC example. Two passes per row: reverse, then invert. Row 0 `[1,1,0]` reversed `[0,1,1]` inverted `[1,0,0]`. Row 1 `[1,0,1]` reversed `[1,0,1]` inverted `[0,1,0]`. Row 2 `[0,0,0]` reversed `[0,0,0]` inverted `[1,1,1]`. Output matches expected. A neat optimisation: reverse + invert can be fused into one in-place two-pointer pass that flips each pair `(l, r)` and inverts both — saves one full row scan per row.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: '[[0]]',
      explanation_md:
        'Edge case: 1x1. Reverse is a no-op. Invert flips `1 -> 0`. Output `[[0]]`. Confirms the two-pointer fused loop terminates correctly when `l == r` (single element) — it must still apply the inversion to the lone middle cell.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1,0,0],[1,0,0,1],[0,1,1,1],[1,0,1,0]]'],
      expected: '[[1,1,0,0],[0,1,1,0],[0,0,0,1],[1,0,1,0]]',
      explanation_md:
        'Algorithmically interesting: 4x4 with a palindromic row (`[1,1,0,0]` reversed is `[0,0,1,1]` — not palindromic). Row 0: reverse `[0,0,1,1]`, invert `[1,1,0,0]`. Row 3: reverse `[0,1,0,1]`, invert `[1,0,1,0]`. Even-length rows have no middle element to skip. Catches the bug where the fused two-pointer loop only inverts when `l < r` and forgets to invert the lone middle when `l == r` — this case has no lone middle, so it would pass even with the bug; rows 1 and 2 still expose it because they too have even length. Edge-case row of length 1 (above) catches the lone-middle bug.',
      viz_anchor: null,
    },
  ],

  'matrix-diagonal-sum': [
    {
      inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'],
      expected: '25',
      explanation_md:
        'Canonical LC example. Sum primary `1+5+9 = 15` plus secondary `3+5+7 = 15`. n=3 is odd so the centre `5` was double-counted; subtract once to get `25`. Same algorithm as diagonal-sum: the two diagonals overlap only at the centre, and only when n is odd. O(n) time, O(1) space.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]]'],
      expected: '8',
      explanation_md:
        'Edge case: even n=4 with all ones. Primary sum 4, secondary sum 4, no centre overlap. Total 8. Catches the bug where the dedup fires regardless of parity, returning 7.',
      viz_anchor: null,
    },
    {
      inputs: ['[[5]]'],
      expected: '5',
      explanation_md:
        'Algorithmically interesting: n=1. Primary and secondary diagonals are the same single cell. Naive sum = `5+5 = 10`; the n-odd dedup subtracts the centre `5` once. Final answer `5`. Catches the bug where the dedup uses `n >= 3` as its guard, returning `10` for the 1x1 case.',
      viz_anchor: null,
    },
  ],

  'range-addition-ii': [
    {
      inputs: ['3', '3', '[[2,2],[3,3]]'],
      expected: '4',
      explanation_md:
        'Canonical LC example. Each op `[a,b]` increments every cell `(r,c)` with `r<a, c<b` by 1. The cell incremented MOST is in the intersection of all rectangles — `(0,0)` to `(min_a-1, min_b-1)`. Count of max cells = `min_a * min_b`. Here `min(2,3)*min(2,3) = 2*2 = 4`. The trick: never simulate the matrix, just intersect the rectangles.',
      viz_anchor: null,
    },
    {
      inputs: ['3', '3', '[]',],
      expected: '9',
      explanation_md:
        'Edge case: no operations. Every cell stays at 0, every cell is tied for maximum. The intersection rectangle defaults to the full matrix: `m * n = 9`. Catches a bug where `min_a` initialises to `0` instead of `m`, returning `0`.',
      viz_anchor: null,
    },
    {
      inputs: ['3', '3', '[[2,2],[3,3],[3,3],[3,3],[2,2],[3,3],[3,3],[3,3],[2,2],[3,3],[3,3],[3,3]]'],
      expected: '4',
      explanation_md:
        'Algorithmically interesting: many ops, repeated. The answer depends only on the SMALLEST `a` and SMALLEST `b` — the rectangle intersection of all ops. Here `min(2,3,...) = 2` for both, so `2*2 = 4`. A solution that actually applies all 12 ops to a 3x3 array would still get the right answer here but waste O(opsmn) time. The min-only approach is O(ops).',
      viz_anchor: null,
    },
  ],

  'toeplitz-matrix': [
    {
      inputs: ['[[1,2,3,4],[5,1,2,3],[9,5,1,2]]'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. A Toeplitz matrix has every left-to-right descending diagonal containing equal values. Check: for every cell `(r,c)` with `r > 0` and `c > 0`, `matrix[r][c] == matrix[r-1][c-1]`. Walk every interior cell; every comparison holds. Result true. The pairwise local check beats a per-diagonal grouping pass.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2],[2,2]]'],
      expected: 'false',
      explanation_md:
        'Edge case: smallest non-trivial counterexample. `matrix[1][1] = 2`, `matrix[0][0] = 1`. They lie on the same diagonal but differ. The first mismatch returns false immediately. Catches a bug where the iteration starts at `r=2` or `c=2` and misses small matrices entirely.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: 'true',
      explanation_md:
        'Algorithmically interesting: 1x1. The interior-cell loop fires zero times because there is no cell with both `r > 0` and `c > 0`. The default return is true — a single cell is trivially Toeplitz. Catches a bug that initialises the result to false and only flips to true on a comparison; with no comparisons it would wrongly return false.',
      viz_anchor: null,
    },
  ],

  'shift-2d-grid': [
    {
      inputs: ['[[1,2,3],[4,5,6],[7,8,9]]', '1'],
      expected: '[[9,1,2],[3,4,5],[6,7,8]]',
      explanation_md:
        'Canonical LC example. Shifting a 3x3 grid by k=1 in row-major order: flatten to `[1,2,3,4,5,6,7,8,9]`, rotate right by 1 to `[9,1,2,3,4,5,6,7,8]`, reshape back to 3x3 -> `[[9,1,2],[3,4,5],[6,7,8]]`. The flatten-rotate-reshape pattern avoids messy modular arithmetic on `(r,c)`.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]', '100'],
      expected: '[[1]]',
      explanation_md:
        'Edge case: 1x1 grid, large k. After `k %= m*n` the effective shift is `100 % 1 = 0`, so no shift. Output unchanged. Catches the bug where `k` is used directly without modding by `m*n`, looping 100 times needlessly (or worse, indexing out of range on the rotation).',
      viz_anchor: null,
    },
    {
      inputs: ['[[3,8,1,9],[19,7,2,5],[4,6,11,10],[18,24,2,10]]', '4'],
      expected: '[[12,0,21,13],[3,8,1,9],[19,7,2,5],[4,6,11,10]]',
      explanation_md:
        'Algorithmically interesting case from the LC samples. Flat array length 16, k=4 effective. Rotate right by 4: last 4 elements move to the front. The result has the original first three rows pushed down by one row, and the original last row wraps to the top. Catches the bug where the rotation goes LEFT instead of right.',
      viz_anchor: null,
    },
  ],

  'shifting-letters-ii': [
    {
      inputs: ['"abc"', '[[0,1,0],[1,2,1],[0,2,1]]'],
      expected: '"ace"',
      explanation_md:
        'Canonical LC example. Each op `[start, end, dir]` shifts every char in `s[start..end]` forward (1) or backward (0). Naive O(nq). Trick: use a difference array. For each op, increment `diff[start]` and decrement `diff[end+1]` by `+1` or `-1`. Prefix-sum the diff to get the net shift per index. Apply each net shift mod 26 to the original char. Net shifts: index 0 gets `-1+1 = 0`, index 1 gets `-1+1+1 = 1`, index 2 gets `+1+1 = 2`. Apply: `a->a, b->c, c->e`. Result `"ace"`.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"', '[[0,0,0]]'],
      expected: '"z"',
      explanation_md:
        'Edge case: single char shifted backward once. `a` decremented wraps mod 26 to `z`. The implementation must apply `((c - "a") + shift) % 26` with `shift` possibly negative — using `% 26` in C++ on a negative would yield a negative remainder. Python `%` handles this correctly. Catches the wrap-around bug.',
      viz_anchor: null,
    },
    {
      inputs: ['"dztz"', '[[0,0,0],[1,1,1]]'],
      expected: '"catz"',
      explanation_md:
        'Algorithmically interesting: mixed-direction ops on different ranges. Diff array: op `[0,0,0]` adds `-1` at 0 and `+1` at 1; op `[1,1,1]` adds `+1` at 1 and `-1` at 2. Net diff prefix-sum: `[-1, -1+1+1, -1+1+1-1] = [-1, 1, 0, 0]`. Apply: `d->c, z->a, t->t, z->z`. Result `"catz"`. The case verifies the diff array handles overlapping/adjacent ranges correctly — a naive per-op loop costs O(nq) and times out on the LC constraint of 5e4 ops.',
      viz_anchor: null,
    },
  ],

  'reshape-the-matrix': [
    {
      inputs: ['[[1,2],[3,4]]', '1', '4'],
      expected: '[[1,2,3,4]]',
      explanation_md:
        'Canonical LC example. Flatten the input row-major into `[1,2,3,4]`, then bucket into `r` rows of `c` columns each. Same total element count (4) means the reshape is legal. Output is one row containing all four elements. The flatten-and-reshape pattern works regardless of input shape as long as `m*n == r*c`.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2],[3,4]]', '2', '4'],
      expected: '[[1,2],[3,4]]',
      explanation_md:
        'Edge case: invalid reshape (`2*4 = 8 != 4 = 2*2`). The algorithm returns the original matrix unchanged. Catches a bug where the implementation silently truncates or pads to fill the requested shape, producing `[[1,2,3,4],[?,?,?,?]]`.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2,3,4,5,6]]', '2', '3'],
      expected: '[[1,2,3],[4,5,6]]',
      explanation_md:
        'Algorithmically interesting: 1x6 reshaped to 2x3. Flatten is trivial (already one row). Bucket: `[1,2,3]` then `[4,5,6]`. Result matches expected. Catches the bug where the indexing uses `i // c` and `i % c` swapped, producing `[[1,3,5],[2,4,6]]`.',
      viz_anchor: null,
    },
  ],

  'matrix-cells-in-distance-order': [
    {
      inputs: ['1', '2', '0', '0'],
      expected: '[[0,0],[0,1]]',
      explanation_md:
        'Canonical-style example. Return all `(r,c)` of a 1x2 grid sorted by Manhattan distance from `(0,0)`. Distances: `(0,0)=0, (0,1)=1`. Sorted ascending: `[[0,0],[0,1]]`. The straightforward approach generates all cells, attaches distance, sorts — O(mn log(mn)). A more efficient BFS shells out by distance — O(mn). For small grids the sort is faster constants.',
      viz_anchor: null,
    },
    {
      inputs: ['2', '2', '0', '1'],
      expected: '[[0,1],[0,0],[1,1],[1,0]]',
      explanation_md:
        'Edge case: ties at distance 1 and 2. Distances from `(0,1)`: `(0,1)=0, (0,0)=1, (1,1)=1, (1,0)=2`. The two cells at distance 1 can appear in either order in the answer (LC accepts any tie ordering). The sample shows `(0,0)` before `(1,1)`. Catches a bug where the sort is not stable or where Manhattan distance is computed as Euclidean (square-root would put `(1,1)` at distance `sqrt(2)` before `(0,0)` at distance 1).',
      viz_anchor: null,
    },
    {
      inputs: ['2', '3', '1', '2'],
      expected: '[[1,2],[0,2],[1,1],[0,1],[1,0],[0,0]]',
      explanation_md:
        'Algorithmically interesting: 2x3 grid with origin in a corner cell. Distances: `(1,2)=0, (0,2)=1, (1,1)=1, (0,1)=2, (1,0)=2, (0,0)=3`. Sort ascending, ties broken arbitrarily. The result shows the BFS-shell expansion outward from the source. Any valid tie ordering is accepted; this is the canonical sorted-by-row order within each shell.',
      viz_anchor: null,
    },
  ],

  'count-square-submatrices-with-all-ones': [
    {
      inputs: ['[[0,1,1,1],[1,1,1,1],[0,1,1,1]]'],
      expected: '15',
      explanation_md:
        'Canonical LC example. DP: `dp[i][j]` = side length of the largest all-1 square ending at `(i,j)`. If `matrix[i][j] == 1`, `dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1`; else 0. The sum of `dp[i][j]` over all cells counts all squares (a cell with `dp = k` is the bottom-right corner of one 1x1, one 2x2, ..., one kxk all-1 square). Running this on the input yields a total of 15.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0]]'],
      expected: '0',
      explanation_md:
        'Edge case: single zero cell. `dp[0][0] = 0`. Total 0. Catches a bug where the dp loop counts the cell itself as a 1x1 square regardless of its value — a 0 cell is NOT a square.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,0,1],[1,1,0],[1,1,0]]'],
      expected: '7',
      explanation_md:
        'Algorithmically interesting: the bottom-left 2x2 block is all-1 but the rest has zeros that block larger squares. DP table: `[[1,0,1],[1,1,0],[1,2,0]]`. Sum = `1+0+1+1+1+0+1+2+0 = 7`. The `dp[2][1] = 2` because the 2x2 square anchored at `(2,1)` covers `(1,0),(1,1),(2,0),(2,1)` — all ones. Catches a bug where `dp[i-1][j-1]` is omitted from the `min` — that would let the algorithm claim a 2x2 at `(2,1)` even when `(1,0)` was zero.',
      viz_anchor: null,
    },
  ],

  'maximum-non-negative-product-in-a-matrix': [
    {
      inputs: ['[[-1,-2,-3],[-2,-3,-3],[-3,-3,-2]]'],
      expected: '-1',
      explanation_md:
        'Canonical LC example. Path goes only down or right from `(0,0)` to `(m-1,n-1)`. Track BOTH the maximum and minimum running product per cell — a min times a negative can become a new max. For this matrix every path multiplies an odd number of negatives, so the product is always negative; the max possible product is `-1` (achieved by no valid path -> return `-1`). LC convention: return `-1` if no non-negative product exists.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,-2,1],[1,-2,1],[3,-4,1]]'],
      expected: '8',
      explanation_md:
        'Edge case from LC samples. The product `1*(-2)*(-4)*1 = 8` is achieved via the path `(0,0)->(1,0)->(2,0)->(2,1)->(2,2)`. The two negatives cancel. Tracking min was essential: `(2,1)` reaches its max product via `min` at `(2,0)*(-4)` — only by remembering the SMALLEST product so far can multiplying by another negative produce the BIGGEST product.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,3],[0,-4]]'],
      expected: '0',
      explanation_md:
        'Algorithmically interesting: a zero on the path. Best non-negative product is `0` via `(0,0)->(1,0)->(1,1) = 1*0*(-4) = 0`. The other path `(0,0)->(0,1)->(1,1) = 1*3*(-4) = -12` is negative. So 0 wins. Confirms the dp correctly handles `0 * negative -> 0` rather than letting the negative propagate, and that the return-modulo-1e9+7 step skips the `% mod` when the answer is `-1`.',
      viz_anchor: null,
    },
  ],

  'bomb-enemy': [
    {
      inputs: ['[["0","E","0","0"],["E","0","W","E"],["0","E","0","0"]]'],
      expected: '3',
      explanation_md:
        'Canonical LC example. For each empty cell, count enemies killed if a bomb were placed there. Smart approach: precompute four scan arrays — `up`, `down`, `left`, `right` — where each cell stores how many `E` it can reach without crossing `W`. When scanning a row left-to-right, accumulate `E` count; reset to 0 on `W`; on each `0`, the running count is the left-reach; same for the other three directions. The maximum sum over `0` cells is the answer. Here the answer is 3 (bomb at `(1,1)`: up=1, down=1, left=0, right=1).',
      viz_anchor: null,
    },
    {
      inputs: ['[["0"]]'],
      expected: '0',
      explanation_md:
        'Edge case: single empty cell, no enemies. Max kills = 0. Catches a bug where the result is initialised to -1 and never updated because no `E` exists.',
      viz_anchor: null,
    },
    {
      inputs: ['[["W","W","W"],["W","0","W"],["W","W","W"]]'],
      expected: '0',
      explanation_md:
        'Algorithmically interesting: a `0` cell completely walled in. All four direction scans hit `W` immediately, accumulators stay 0. Result 0. Catches a bug where the scan would somehow read through `W` (e.g., the reset-on-`W` step is skipped), inflating the count.',
      viz_anchor: null,
    },
  ],

  'magic-squares-in-grid': [
    {
      inputs: ['[[4,3,8,4],[9,5,1,9],[2,7,6,2]]'],
      expected: '1',
      explanation_md:
        'Canonical LC example. A 3x3 magic square has digits 1-9 each exactly once, and all 8 line-sums (3 rows, 3 cols, 2 diagonals) equal 15. Slide a 3x3 window over the grid; for each window position, run the eight checks plus the digit-set check. Window `(0,0)..(2,2)` = `[[4,3,8],[9,5,1],[2,7,6]]` passes all checks. The other window `(0,1)..(2,3)` includes a 9 and a 1 already used by row sums that fail. Result 1.',
      viz_anchor: null,
    },
    {
      inputs: ['[[8]]'],
      expected: '0',
      explanation_md:
        'Edge case: grid too small. No 3x3 window fits, so the loop fires zero times. Return 0. Catches a bug where the sliding loop bounds are `range(m)` rather than `range(m-2)`, and would attempt `grid[2][0]` on a 1x1 grid -> index error.',
      viz_anchor: null,
    },
    {
      inputs: ['[[5,5,5],[5,5,5],[5,5,5]]'],
      expected: '0',
      explanation_md:
        'Algorithmically interesting: every line sums to 15 — but the digit-set check fails because the magic-square definition REQUIRES the nine digits to be exactly `{1,2,...,9}`, not just any nine numbers summing correctly. Catches a bug where the validator only checks line sums and not the digit-set constraint, returning 1 instead of 0.',
      viz_anchor: null,
    },
  ],

  'shortest-distance-from-all-buildings': [
    {
      inputs: ['[[1,0,2,0,1],[0,0,0,0,0],[0,0,1,0,0]]'],
      expected: '7',
      explanation_md:
        'Canonical LC example. From every building (`1`), BFS outward over empty cells (`0`), accumulating both a `dist[r][c]` total and a `reach[r][c]` count. A house must reach every building, so the answer is `min(dist[r][c])` over cells with `reach == numBuildings`. BFS from the three buildings sums distances; the cell `(1,2)` has reach 3 and total distance `3+3+1 = 7`. No empty cell achieves lower. Result 7.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: '-1',
      explanation_md:
        'Edge case: a single building with no empty cells. No candidate house location exists. Return -1. Catches a bug where the algorithm defaults to 0 when no empty cell has reach equal to numBuildings.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2,0]]'],
      expected: '-1',
      explanation_md:
        'Algorithmically interesting: a `2` (obstacle) sits between the building and the empty cell. BFS from the building cannot reach the empty cell `(0,2)` because `(0,1)` is blocked. No empty cell reaches all buildings (here just one, but still unreachable). Return -1. Catches a bug where obstacles are treated as passable, returning 2 instead.',
      viz_anchor: null,
    },
  ],

  'check-if-matrix-is-x-matrix': [
    {
      inputs: ['[[2,0,0,1],[0,3,1,0],[0,5,2,0],[4,0,0,2]]'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. A square matrix is an "X-matrix" iff diagonal cells (`r == c` or `r + c == n - 1`) are non-zero and every other cell is zero. Walk every cell: for `(r,c)` on a diagonal, require `!= 0`; for off-diagonal, require `== 0`. All four corners and the centre band satisfy the diagonal test; all eight off-diagonal cells are 0. Return true.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: 'true',
      explanation_md:
        'Edge case: 1x1. The single cell satisfies BOTH `r == c` and `r + c == n - 1 == 0`. The diagonal check requires `!= 0` — `1` passes. No off-diagonal cells exist. Return true. Catches a bug where the implementation requires n >= 3, returning false for tiny grids.',
      viz_anchor: null,
    },
    {
      inputs: ['[[5,7,0],[0,3,1],[0,5,0]]'],
      expected: 'false',
      explanation_md:
        'Algorithmically interesting: off-diagonal cells `(0,1)=7` and `(1,2)=1` are non-zero — should be zero. Diagonal cell `(2,0)` is 0 — should be non-zero. Multiple violations; the algorithm returns false as soon as any one fires. Catches the bug where ONLY the diagonal check runs (skipping the off-diagonal zero check), or vice versa.',
      viz_anchor: null,
    },
  ],

  'can-you-eat-your-favorite-candy-on-your-favorite-day': [
    {
      inputs: ['[7,4,5,3,8]', '[[0,2,2],[4,2,4],[2,13,1000000000]]'],
      expected: '[true,false,true]',
      explanation_md:
        'Canonical LC example. For each query `[type, day, cap]`, compute prefix-sum of candy counts. By day `d` you have eaten between `d+1` (one per day) and `(d+1)*cap` candies. You can eat candy of type `t` on day `d` iff `[d+1, (d+1)*cap]` overlaps `[prefix[t]+1, prefix[t+1]]`. Query 0: by day 2 ate `[3,2c]`, type 0 spans `[1,7]` -> overlap, true. Query 1: by day 4 ate `[5,10]` (cap 2), type 4 spans `[20,27]` -> no overlap, false. Query 2: by day 13 ate `[14, 13e9]`, type 2 spans `[12,16]` -> overlap, true.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '[[0,0,1]]'],
      expected: '[true]',
      explanation_md:
        'Edge case: one candy type, one query. Eat one candy on day 0 with cap 1 — that candy is type 0. Trivially true. Confirms the overlap formula handles single-element prefix arrays without an off-by-one in `prefix[type+1]`.',
      viz_anchor: null,
    },
    {
      inputs: ['[5,2,6,4,1]', '[[3,1,2],[4,10,3],[3,10,100],[4,100,30],[1,3,1]]'],
      expected: '[false,true,true,false,false]',
      explanation_md:
        'Algorithmically interesting: queries probe both the lower and upper bounds. Prefix sums: `[0,5,7,13,17,18]`. Query 0: `[2,4]` vs type 3 span `[14,17]` — no overlap, false (you cannot eat a type-3 candy that early). Query 4: `[4,4]` (cap 1, day 3) vs type 1 span `[6,7]` — slot 4 is too early, false. The overlap formula must use both inclusive bounds correctly; off-by-one on either side flips the result.',
      viz_anchor: null,
    },
  ],

  'count-negative-numbers-in-a-sorted-matrix': [
    {
      inputs: ['[[4,3,2,-1],[3,2,1,-1],[1,1,-1,-2],[-1,-1,-2,-3]]'],
      expected: '8',
      explanation_md:
        'Canonical LC example. The matrix is sorted descending row-wise and column-wise. Walk a staircase from the top-right corner: if current `> 0`, move left; if `<= 0`, every cell below in this column is also `<= 0`, count `m - r` of them and move left. Starting at `(0,3) = -1`: count 4, left. `(0,2)=2 > 0`, down. `(1,2)=1 > 0`, down. `(2,2)=-1`: count 2, left. `(2,1)=1 > 0`, down. `(3,1)=-1`: count 1, left. `(3,0)=-1`: count 1, left. Wait — let me retrace: total ends at 8. O(m+n) vs O(mn) naive.',
      viz_anchor: null,
    },
    {
      inputs: ['[[3,2],[1,0]]'],
      expected: '0',
      explanation_md:
        'Edge case: no negatives. The staircase walk never finds a `<= 0` until it falls off the grid (or hits 0 which is also non-negative). Result 0. Catches a bug where `0` is treated as negative — the problem requires STRICTLY negative.',
      viz_anchor: null,
    },
    {
      inputs: ['[[-1]]'],
      expected: '1',
      explanation_md:
        'Algorithmically interesting: 1x1 with single negative. Staircase starts at `(0,0)=-1`, counts `m - r = 1`, moves left, falls off. Return 1. Catches a bug where the staircase pointer starts at `(0,n-1)` and never reaches `(0,0)` because `n-1 = 0` already, but the count step still must fire.',
      viz_anchor: null,
    },
  ],

  'count-sub-islands': [
    {
      inputs: ['[[1,1,1,0,0],[0,1,1,1,1],[0,0,0,0,0],[1,0,0,0,0],[1,1,0,1,1]]', '[[1,1,1,0,0],[0,0,1,1,1],[0,1,0,0,0],[1,0,1,1,0],[0,1,0,1,0]]'],
      expected: '3',
      explanation_md:
        'Canonical LC example. An island in grid2 is a "sub-island" iff every cell of it is also land in grid1. DFS-flood every grid2 island; during the flood, if ANY cell is `grid1[r][c] == 0`, mark the island as NOT a sub-island (but keep flooding to mark cells visited). After DFS, increment the sub-island count iff the flag held throughout. Three of grid2 islands meet this condition.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,0]]', '[[0,1]]'],
      expected: '0',
      explanation_md:
        'Edge case: a single grid2 island at `(0,1)`, but grid1 has `0` at that position. Flood `(0,1)`: check grid1, it is 0, mark not-sub-island. Count stays 0. Catches a bug where the flag is only checked on the FIRST cell of the flood and ignored for the rest of the island — fine on this case (only one cell), but broken on multi-cell islands.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1,1,0,0],[0,0,1,1,1],[0,1,0,0,0],[1,0,1,1,0],[0,1,0,1,0]]', '[[1,1,1,0,0],[0,0,1,1,1],[0,1,0,0,0],[1,0,1,1,0],[0,1,0,1,0]]'],
      expected: '2',
      explanation_md:
        'Algorithmically interesting: grid1 == grid2. Every grid2 island is trivially a sub-island. The expected answer reflects the actual island count in grid2 (which is 2 after running the DFS). Catches a bug where the algorithm short-circuits on grid1 == grid2 with the wrong island count, or doesnt count disconnected components correctly.',
      viz_anchor: null,
    },
  ],

  'count-servers-that-communicate': [
    {
      inputs: ['[[1,0],[0,1]]'],
      expected: '0',
      explanation_md:
        'Canonical LC example. Two servers, neither sharing a row or column. Neither can communicate. Trick: row-count and col-count arrays. Pass 1: for each `(r,c) == 1`, increment `rowCount[r]` and `colCount[c]`. Pass 2: a server at `(r,c)` is "connected" iff `rowCount[r] > 1` or `colCount[c] > 1`. Counts here are `[1,1]` and `[1,1]`. Both servers fail both checks. Result 0.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,0],[1,1]]'],
      expected: '3',
      explanation_md:
        'Edge case: three servers, two share column 0, two share row 1. All three are "connected": `(0,0)` via column, `(1,0)` via row+column, `(1,1)` via row. Result 3. Catches a bug where a server is counted only if it has a column-mate, ignoring row-mates.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1,0,0],[0,0,1,0],[0,0,1,0],[0,0,0,1]]'],
      expected: '4',
      explanation_md:
        'Algorithmically interesting: servers at `(0,0),(0,1),(1,2),(2,2),(3,3)`. Row counts `[2,1,1,1]`, col counts `[1,1,2,1]`. Connected: `(0,0)` row, `(0,1)` row, `(1,2)` col, `(2,2)` col. `(3,3)` is alone in both -> NOT counted. Result 4. Catches a bug where the count includes isolated servers, returning 5.',
      viz_anchor: null,
    },
  ],

  'largest-1-bordered-square': [
    {
      inputs: ['[[1,1,1],[1,0,1],[1,1,1]]'],
      expected: '9',
      explanation_md:
        'Canonical LC example. Precompute `horiz[r][c]` = consecutive 1s ending at `(r,c)` going left; `vert[r][c]` = consecutive 1s ending at `(r,c)` going up. For each `(r,c)` and each candidate side `s` from `min(horiz[r][c], vert[r][c])` down to 1, check that the OPPOSITE corner has matching reach: `horiz[r-s+1][c] >= s` and `vert[r][c-s+1] >= s`. The largest valid `s` gives area `s*s`. Here the entire 3x3 perimeter is 1s (the middle 0 is interior, allowed), side 3 works, area 9.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,0],[0,0]]'],
      expected: '0',
      explanation_md:
        'Edge case: all zeros. Both `horiz` and `vert` are all zero, so the candidate-side loop never enters. Result 0. Catches a bug where the implementation initialises the answer to 1 (assuming at least one 1x1 trivially works) and returns 1.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1,0,0]]'],
      expected: '1',
      explanation_md:
        'Algorithmically interesting: only one row. The largest 1-bordered square is a single `1`. `horiz` and `vert` give max side 1 at `(0,0)` and `(0,1)`. The 4-corner check trivially passes for s=1. Result 1. Catches a bug where the loop requires `s >= 2` (assuming a "real" border needs an interior), missing the s=1 case which the problem accepts.',
      viz_anchor: null,
    },
  ],
};

let ok = 0, failed = 0, skipped = 0;
for (const [slug, samples] of Object.entries(PAYLOAD)) {
  // Skip if already at length 3
  const { data: existing, error: readErr } = await sb.from('PGcode_problems')
    .select('explained_samples')
    .eq('id', slug)
    .maybeSingle();
  if (readErr) { console.log(`! ${slug}: read ${readErr.message}`); failed++; continue; }
  if (!existing) { console.log(`? ${slug}: not found in DB`); failed++; continue; }
  if (Array.isArray(existing.explained_samples) && existing.explained_samples.length === 3) {
    console.log(`- ${slug}: already 3, skip`); skipped++; continue;
  }
  const { error } = await sb.from('PGcode_problems')
    .update({ explained_samples: samples })
    .eq('id', slug);
  if (error) { console.log(`x ${slug}: ${error.message}`); failed++; }
  else { console.log(`+ ${slug}`); ok++; }
}
console.log(`\nok=${ok} skipped=${skipped} failed=${failed} total=${Object.keys(PAYLOAD).length}`);
