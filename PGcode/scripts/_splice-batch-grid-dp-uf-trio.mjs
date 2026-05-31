#!/usr/bin/env node
// Atomic splice for the "unique-paths-ii / triangle / regions-cut-by-slashes" trio.
// unique-paths-ii and triangle already live in RICH_CONTENT — only regions-cut-by-slashes
// is missing, so this splice injects exactly one viz fn + one entry.
// Re-runnable: detects already-spliced state and exits cleanly.
//
// Backslash bookkeeping (this file is read twice — once as JS, once as injected JS):
//   - This .mjs uses template literals: `\\` here writes `\` on disk.
//   - The injected `code:` strings are also template literals in the target file:
//     `\\` on disk is one runtime backslash char.
//   - Therefore to spell the runtime char `\` inside a `code:` block, use `\\\\` here
//     (4 source chars -> 2 disk chars -> 1 runtime char).
//   - To spell `\\` (two runtime chars, e.g. inside a regex), use `\\\\\\\\` here.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'src', 'content', 'problemContent.js');

const src = fs.readFileSync(FILE, 'utf8');

if (src.includes('function regionsBySlashesViz(')
  || src.includes("'regions-cut-by-slashes':")
  || src.includes('"regions-cut-by-slashes":')) {
  console.log('Already spliced — nothing to do.');
  process.exit(0);
}

// BS = literal backslash char on disk (one char). Used in captions so we never have
// to count escape parity when free-text mentions "backslash".
const BS = '\\\\';

const VIZ_BLOCK = `function regionsBySlashesViz() {
  const n = 2;
  const frames = [];

  frames.push({
    grid: [
      [' ', '/'],
      ['/', ' '],
    ],
    caption: 'Input grid = [" /", "/ "]. Each cell is one of " ", "/" or "${BS}". Slashes are zero-width diagonals — they split the unit square into triangles, and adjacent triangles merge across edges.',
  });

  frames.push({
    grid: [
      ['T', 'T'],
      ['T', 'T'],
    ],
    caption: 'Trick: split every cell into 4 triangles — TOP (0), RIGHT (1), BOTTOM (2), LEFT (3). The 2x2 grid produces 2*2*4 = 16 nodes for the union-find structure.',
  });

  frames.push({
    grid: [
      ['0', '4'],
      ['8', '12'],
    ],
    highlights: { '0,0': 'low', '0,1': 'low', '1,0': 'low', '1,1': 'low' },
    caption: 'Index nodes as (row*n + col)*4 + side. Cell (0,0) owns ids 0..3, cell (0,1) owns 4..7, cell (1,0) owns 8..11, cell (1,1) owns 12..15.',
  });

  frames.push({
    grid: [
      [' ', '/'],
      ['/', ' '],
    ],
    highlights: { '0,0': 'mid' },
    caption: 'Cell (0,0) = " " (blank). No diagonal splits it, so union all 4 triangles together: TOP-RIGHT-BOTTOM-LEFT merge into one component.',
  });

  frames.push({
    grid: [
      [' ', '/'],
      ['/', ' '],
    ],
    highlights: { '0,1': 'mid' },
    caption: 'Cell (0,1) = "/". Forward slash separates TOP+LEFT from RIGHT+BOTTOM. Union TOP with LEFT, and union RIGHT with BOTTOM. Two components inside this cell.',
  });

  frames.push({
    grid: [
      [' ', '/'],
      ['/', ' '],
    ],
    highlights: { '1,0': 'mid' },
    caption: 'Cell (1,0) = "/". Same rule: union TOP+LEFT, union RIGHT+BOTTOM.',
  });

  frames.push({
    grid: [
      [' ', '/'],
      ['/', ' '],
    ],
    highlights: { '1,1': 'mid' },
    caption: 'Cell (1,1) = " " (blank). Union all four triangles together.',
  });

  frames.push({
    grid: [
      [' ', '/'],
      ['/', ' '],
    ],
    highlights: { '0,0': 'pink', '0,1': 'pink' },
    caption: 'Now merge across cell borders. (0,0).RIGHT must merge with its right neighbour (0,1).LEFT — same physical edge, two cell-local triangles.',
  });

  frames.push({
    grid: [
      [' ', '/'],
      ['/', ' '],
    ],
    highlights: { '1,0': 'pink', '1,1': 'pink' },
    caption: 'Same horizontal stitch on the bottom row: union (1,0).RIGHT with (1,1).LEFT.',
  });

  frames.push({
    grid: [
      [' ', '/'],
      ['/', ' '],
    ],
    highlights: { '0,0': 'mid', '1,0': 'mid' },
    caption: 'Vertical stitch on the left column: union (0,0).BOTTOM with (1,0).TOP.',
  });

  frames.push({
    grid: [
      [' ', '/'],
      ['/', ' '],
    ],
    highlights: { '0,1': 'mid', '1,1': 'mid' },
    caption: 'Vertical stitch on the right column: union (0,1).BOTTOM with (1,1).TOP.',
  });

  frames.push({
    grid: [
      ['R1', 'R1'],
      ['R1', 'R1'],
    ],
    caption: 'After all unions, traverse parents and count distinct roots. Region 1 wraps the outside of the two slashes — it spans triangles from every cell.',
  });

  frames.push({
    grid: [
      ['R1', 'R2'],
      ['R1', 'R1'],
    ],
    caption: 'Region 2 is the small enclosed pocket on the upper-right side of the slashes.',
  });

  frames.push({
    grid: [
      ['R1', 'R2'],
      ['R1', 'R3'],
    ],
    caption: 'Region 3 is the lower enclosed pocket. Distinct roots = 3 — exactly the answer for this grid.',
  });

  frames.push({
    grid: [
      ['R1', 'R2'],
      ['R1', 'R3'],
    ],
    chip: [
      { label: 'answer', value: '3', tone: 'pink' },
      { label: 'nodes', value: String(n * n * 4) },
      { label: 'time', value: 'O(n^2 * α(n))', tone: 'violet' },
      { label: 'space', value: 'O(n^2)' },
    ],
    caption: 'Final: 3 regions. The 4-triangle decomposition turns continuous geometry into a finite union-find problem — O(n^2) cells, O(1) work each amortized.',
  });

  return { renderer: 'grid', title: 'Regions Cut By Slashes — 4-triangle union-find', frames };
}

`;

// For the `code:` template literals below, every runtime backslash is written as `\\\\`
// (4 here -> 2 on disk -> 1 at runtime inside a JS template literal).
const ENTRY_BLOCK = `  'regions-cut-by-slashes': {
    tags: ['union-find','graph','matrix','dfs','bfs'],
    companies: ['amazon','meta','microsoft','google','apple'],
    viz: regionsBySlashesViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def regionsBySlashes(self, grid):
        n = len(grid)
        parent = list(range(4 * n * n))

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        def union(a, b):
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb

        def idx(r, c, k):
            return (r * n + c) * 4 + k

        for r in range(n):
            for c in range(n):
                ch = grid[r][c]
                if ch != '/':
                    union(idx(r, c, 0), idx(r, c, 1))
                    union(idx(r, c, 2), idx(r, c, 3))
                if ch != '\\\\\\\\':
                    union(idx(r, c, 0), idx(r, c, 3))
                    union(idx(r, c, 1), idx(r, c, 2))
                if r + 1 < n:
                    union(idx(r, c, 2), idx(r + 1, c, 0))
                if c + 1 < n:
                    union(idx(r, c, 1), idx(r, c + 1, 3))

        return sum(1 for i in range(4 * n * n) if find(i) == i)\`,
        complexity: { time: 'O(n^2 * α(n))', space: 'O(n^2)' },
        approach: 'Split each unit cell into 4 triangles (TOP=0, RIGHT=1, BOTTOM=2, LEFT=3). Inside a cell, the character dictates which pairs merge: a blank merges all four, "/" merges TOP-LEFT and RIGHT-BOTTOM, backslash merges TOP-RIGHT and BOTTOM-LEFT. Across cells, stitch right-edge to next cell next-cell left-edge and bottom-edge to next-row top-edge. Distinct roots in the DSU equals the region count.',
      },
      javascript: {
        code: \`function regionsBySlashes(grid) {
  const n = grid.length;
  const parent = Array.from({ length: 4 * n * n }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  const union = (a, b) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  const idx = (r, c, k) => (r * n + c) * 4 + k;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const ch = grid[r][c];
      if (ch !== '/') {
        union(idx(r, c, 0), idx(r, c, 1));
        union(idx(r, c, 2), idx(r, c, 3));
      }
      if (ch !== '\\\\\\\\') {
        union(idx(r, c, 0), idx(r, c, 3));
        union(idx(r, c, 1), idx(r, c, 2));
      }
      if (r + 1 < n) union(idx(r, c, 2), idx(r + 1, c, 0));
      if (c + 1 < n) union(idx(r, c, 1), idx(r, c + 1, 3));
    }
  }

  let regions = 0;
  for (let i = 0; i < 4 * n * n; i++) if (find(i) === i) regions++;
  return regions;
}\`,
        complexity: { time: 'O(n^2 * α(n))', space: 'O(n^2)' },
        approach: 'Identical 4-triangle decomposition with path-compression DSU. Counting roots at the end avoids tracking component sizes during unions.',
      },
      java: {
        code: \`class Solution {
    int[] parent;

    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }

    void union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra != rb) parent[ra] = rb;
    }

    int idx(int r, int c, int k, int n) { return (r * n + c) * 4 + k; }

    public int regionsBySlashes(String[] grid) {
        int n = grid.length;
        parent = new int[4 * n * n];
        for (int i = 0; i < parent.length; i++) parent[i] = i;

        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                char ch = grid[r].charAt(c);
                if (ch != '/') {
                    union(idx(r, c, 0, n), idx(r, c, 1, n));
                    union(idx(r, c, 2, n), idx(r, c, 3, n));
                }
                if (ch != '\\\\\\\\') {
                    union(idx(r, c, 0, n), idx(r, c, 3, n));
                    union(idx(r, c, 1, n), idx(r, c, 2, n));
                }
                if (r + 1 < n) union(idx(r, c, 2, n), idx(r + 1, c, 0, n));
                if (c + 1 < n) union(idx(r, c, 1, n), idx(r, c + 1, 3, n));
            }
        }

        int regions = 0;
        for (int i = 0; i < parent.length; i++) if (find(i) == i) regions++;
        return regions;
    }
}\`,
        complexity: { time: 'O(n^2 * α(n))', space: 'O(n^2)' },
        approach: 'Java translation. The cell character compared against the backslash literal is escaped as a Java char literal.',
      },
      cpp: {
        code: \`class Solution {
public:
    vector<int> parent;

    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }

    void uni(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra != rb) parent[ra] = rb;
    }

    int idx(int r, int c, int k, int n) { return (r * n + c) * 4 + k; }

    int regionsBySlashes(vector<string>& grid) {
        int n = grid.size();
        parent.resize(4 * n * n);
        iota(parent.begin(), parent.end(), 0);

        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                char ch = grid[r][c];
                if (ch != '/') {
                    uni(idx(r, c, 0, n), idx(r, c, 1, n));
                    uni(idx(r, c, 2, n), idx(r, c, 3, n));
                }
                if (ch != '\\\\\\\\') {
                    uni(idx(r, c, 0, n), idx(r, c, 3, n));
                    uni(idx(r, c, 1, n), idx(r, c, 2, n));
                }
                if (r + 1 < n) uni(idx(r, c, 2, n), idx(r + 1, c, 0, n));
                if (c + 1 < n) uni(idx(r, c, 1, n), idx(r, c + 1, 3, n));
            }
        }

        int regions = 0;
        for (int i = 0; i < (int)parent.size(); i++) if (find(i) == i) regions++;
        return regions;
    }
};\`,
        complexity: { time: 'O(n^2 * α(n))', space: 'O(n^2)' },
        approach: 'C++ DSU using a vector<int>. iota fills the parent array with identity; uni avoids the name clash with std::union.',
      },
      typescript: {
        code: \`function regionsBySlashes(grid: string[]): number {
  const n = grid.length;
  const parent: number[] = Array.from({ length: 4 * n * n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  const union = (a: number, b: number): void => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  const idx = (r: number, c: number, k: number): number => (r * n + c) * 4 + k;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const ch = grid[r][c];
      if (ch !== '/') {
        union(idx(r, c, 0), idx(r, c, 1));
        union(idx(r, c, 2), idx(r, c, 3));
      }
      if (ch !== '\\\\\\\\') {
        union(idx(r, c, 0), idx(r, c, 3));
        union(idx(r, c, 1), idx(r, c, 2));
      }
      if (r + 1 < n) union(idx(r, c, 2), idx(r + 1, c, 0));
      if (c + 1 < n) union(idx(r, c, 1), idx(r, c + 1, 3));
    }
  }

  let regions = 0;
  for (let i = 0; i < 4 * n * n; i++) if (find(i) === i) regions++;
  return regions;
}\`,
        complexity: { time: 'O(n^2 * α(n))', space: 'O(n^2)' },
        approach: 'TS port of the JS solution with explicit number types. Identical 4-triangle DSU strategy.',
      },
      go: {
        code: \`func regionsBySlashes(grid []string) int {
    n := len(grid)
    parent := make([]int, 4*n*n)
    for i := range parent {
        parent[i] = i
    }
    var find func(int) int
    find = func(x int) int {
        for parent[x] != x {
            parent[x] = parent[parent[x]]
            x = parent[x]
        }
        return x
    }
    union := func(a, b int) {
        ra, rb := find(a), find(b)
        if ra != rb {
            parent[ra] = rb
        }
    }
    idx := func(r, c, k int) int { return (r*n+c)*4 + k }

    for r := 0; r < n; r++ {
        for c := 0; c < n; c++ {
            ch := grid[r][c]
            if ch != '/' {
                union(idx(r, c, 0), idx(r, c, 1))
                union(idx(r, c, 2), idx(r, c, 3))
            }
            if ch != '\\\\\\\\' {
                union(idx(r, c, 0), idx(r, c, 3))
                union(idx(r, c, 1), idx(r, c, 2))
            }
            if r+1 < n {
                union(idx(r, c, 2), idx(r+1, c, 0))
            }
            if c+1 < n {
                union(idx(r, c, 1), idx(r, c+1, 3))
            }
        }
    }

    regions := 0
    for i := 0; i < 4*n*n; i++ {
        if find(i) == i {
            regions++
        }
    }
    return regions
}\`,
        complexity: { time: 'O(n^2 * α(n))', space: 'O(n^2)' },
        approach: 'Go closures for find and union keep the parent slice captured. The byte rune for backslash is escaped as a single byte literal.',
      },
    },
  },
`;

const MARKER = 'export const RICH_CONTENT = {';
const markerIdx = src.indexOf(MARKER);
if (markerIdx === -1) {
  console.error('RICH_CONTENT marker not found.');
  process.exit(1);
}

// Insert viz fn just before `export const RICH_CONTENT = {`.
let next = src.slice(0, markerIdx) + VIZ_BLOCK + src.slice(markerIdx);

// Unique structural anchor for the RICH_CONTENT close — exactly one occurrence of
// `    },\n  },\n};` exists in the whole file (verified before write).
const CLOSE_ANCHOR = '    },\n  },\n};';
const closeIdx = next.indexOf(CLOSE_ANCHOR);
const lastCloseIdx = next.lastIndexOf(CLOSE_ANCHOR);
if (closeIdx === -1 || closeIdx !== lastCloseIdx) {
  console.error('RICH_CONTENT close anchor missing or ambiguous (' + closeIdx + ' vs ' + lastCloseIdx + ').');
  process.exit(1);
}

// Insert the new entry right before the `};` that closes RICH_CONTENT — i.e. after
// the trailing `    },\n  },\n` of the previous entry but before the final `};`.
const insertAt = closeIdx + '    },\n  },\n'.length;
next = next.slice(0, insertAt) + ENTRY_BLOCK + next.slice(insertAt);

fs.writeFileSync(FILE, next);
console.log('Spliced regions-cut-by-slashes (viz fn + entry). unique-paths-ii and triangle already present — skipped.');
