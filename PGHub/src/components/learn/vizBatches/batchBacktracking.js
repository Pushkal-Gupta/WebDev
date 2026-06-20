// Concept-visualization batch: backtracking & recursion (module recursion-bt).
// Five concepts, three renderers:
//
//  - n-queens-backtrack   -> 'grid'  (the board: queens, attacked cells, conflict
//    on a trial square, then the backtrack). NumberGridRenderer reads
//    frame.grid (a 2-D token array) + frame.cellLabel (token -> display glyph)
//    + frame.caption. Token roles are FIXED by NumberGridRenderer's default map:
//      'G' -> prime (placed queen)   '#' -> composite (attacked by a queen)
//      'O' -> cross  (trial square that conflicts)   '.' -> none (open square)
//      'S' -> current (the trial square being considered)
//    We only emit those tokens so the colours land; glyphs are remapped via
//    cellLabel so the reader sees Q / x / . / ? instead of the raw token.
//
//  - permutations / combinations / subsets -> 'tree' (the decision/recursion
//    tree). TreeRenderer walks a recursive frame.tree of shape
//      { _id, value, left, right, state? }
//    state in { 'current','visited','done','new','unbalanced','found','key' }.
//    It is a BINARY renderer (only left/right). subsets is a true binary
//    include/exclude tree so it maps perfectly; permutations/combinations are
//    n-ary, so each frame draws the single root-to-frontier PATH as a vertical
//    chain (each node's chosen child sits in the left slot), and the caption
//    narrates choose -> explore -> un-choose. A parallel 'array' case shows the
//    running result list alongside the current partial choice.
//
//  - recursion-tail-call -> 'array' (the call-frame stack / accumulator).
//    ArrayBarRenderer reads frame.array (each cell a frame label), frame.subRow
//    (the parallel accumulator / pending-multiply row), frame.highlights
//    ({ index: 'current'|'done'|'pivot'|'match' }), frame.pointers, frame.caption.
//
// Self-contained: no imports from conceptVisualizations.js. Pure JS.

// ---------------------------------------------------------------------------
// Tree helpers (binary frame.tree). One id counter per build; reset at entry.
// ---------------------------------------------------------------------------
let _bid = 0;
function tnode(value, state) { return { _id: ++_bid, value, left: null, right: null, state }; }
// Build a vertical chain from a list of { value, state } — each node's child
// goes in the LEFT slot, so the binary TreeRenderer draws a single spine that
// reads as "the current root-to-frontier path".
function chain(steps) {
  let root = null;
  let tail = null;
  for (const s of steps) {
    const n = tnode(s.value, s.state);
    if (!root) { root = n; tail = n; } else { tail.left = n; tail = n; }
  }
  return root;
}

// ===========================================================================
// SUBSETS — true binary include/exclude tree (renderer fits exactly)
// ===========================================================================
// Pre-order DFS over the include/exclude tree for nums. We build the WHOLE
// tree once (so positions are stable) and re-paint node states per frame as the
// DFS choose -> explore -> un-choose walk visits each node.
function subsetsFrames(nums = [1, 2, 3]) {
  _bid = 0;
  const items = nums.slice(0, 4);
  const n = items.length;

  // Build the full include/exclude tree. Each node carries which index it
  // decides and whether this branch INCLUDES items[i] (right child) or skips it
  // (left child). Root decides index 0. Leaves (depth n) hold the finished set.
  // value is a short label of the partial subset on the path to this node.
  function build(depth, picked) {
    const label = picked.length ? `{${picked.join(',')}}` : '{}';
    const node = tnode(label);
    node._depth = depth;
    node._picked = picked.slice();
    if (depth < n) {
      // left = exclude items[depth], right = include items[depth]
      node.left = build(depth + 1, picked);
      node.right = build(depth + 1, [...picked, items[depth]]);
    }
    return node;
  }
  const root = build(0, []);

  // Re-paint: clear all states, then apply a map of _id -> state.
  function paint(states) {
    const recur = (n2) => {
      if (!n2) return null;
      return {
        _id: n2._id, value: n2.value, _depth: n2._depth, _picked: n2._picked,
        state: states[n2._id], left: recur(n2.left), right: recur(n2.right),
      };
    };
    return recur(root);
  }

  const frames = [];
  const result = [];
  frames.push({
    tree: paint({}),
    caption: `Power set of [${items.join(', ')}]: at each element make a binary choice — exclude (left) or include (right). The 2^${n} = ${1 << n} leaves are the subsets; each root-to-leaf path is one of them.`,
    traversal: [],
  });

  // Track ancestors on the current DFS path so we can show the spine as visited.
  const pathIds = [];
  function dfs(node) {
    pathIds.push(node._id);
    const baseStates = {};
    for (const id of pathIds) baseStates[id] = 'visited';
    baseStates[node._id] = 'current';

    if (node._depth === n) {
      // Leaf: record the subset.
      const label = node._picked.length ? `{${node._picked.join(', ')}}` : '{}';
      result.push(label);
      frames.push({
        tree: paint({ ...baseStates, [node._id]: 'done' }),
        caption: `Leaf reached (all ${n} decisions made): record subset ${label}. ${result.length} of ${1 << n} subsets found so far.`,
        traversal: result.slice(),
      });
      pathIds.pop();
      return;
    }
    const el = items[node._depth];
    frames.push({
      tree: paint(baseStates),
      caption: `At element ${el} (current path = ${node.value}). Explore the EXCLUDE branch first: leave ${el} out and recurse deeper.`,
      traversal: result.slice(),
    });
    dfs(node.left);
    frames.push({
      tree: paint(baseStates),
      caption: `Back at element ${el}: the exclude branch is done. Now CHOOSE ${el} (include it) and recurse into the right branch.`,
      traversal: result.slice(),
    });
    dfs(node.right);
    frames.push({
      tree: paint({ ...baseStates, [node._id]: 'key' }),
      caption: `Both branches of ${el} explored — UN-CHOOSE ${el} and return to its parent. The subtree under ${node.value} is fully enumerated.`,
      traversal: result.slice(),
    });
    pathIds.pop();
  }
  dfs(root);

  frames.push({
    tree: paint({}),
    caption: `Done. All ${result.length} subsets enumerated in DFS order: ${result.join(', ')}. O(n · 2^n) — every subset must be written out.`,
    traversal: result.slice(),
  });
  return frames;
}

// ===========================================================================
// PERMUTATIONS — n-ary DFS drawn as the current path (vertical chain)
// ===========================================================================
function permutationsFrames(nums = [1, 2, 3]) {
  const items = nums.slice(0, 4);
  const n = items.length;
  const used = new Array(n).fill(false);
  const path = [];
  const result = [];
  const frames = [];

  // chain step for a chosen value at a given depth.
  const pathChain = (frontierState) => {
    const steps = [{ value: 'start', state: 'visited' }];
    path.forEach((v, i) => {
      steps.push({ value: String(v), state: i === path.length - 1 ? frontierState : 'visited' });
    });
    return chain(steps);
  };

  frames.push({
    tree: chain([{ value: 'start', state: 'current' }]),
    caption: `Permutations of [${items.join(', ')}]: the decision tree has ${n} branches at the root, ${n - 1} at each child, down to ${n}! = ${[1, 2, 3, 4].slice(0, n).reduce((a, b) => a * b, 1)} leaves. A used[] array tracks which elements the current path has taken.`,
    traversal: [],
  });

  function dfs() {
    if (path.length === n) {
      const perm = `[${path.join(', ')}]`;
      result.push(perm);
      frames.push({
        tree: pathChain('done'),
        caption: `Path length = ${n}: leaf reached. Record permutation ${perm}. ${result.length} of ${[1, 2, 3, 4].slice(0, n).reduce((a, b) => a * b, 1)} found.`,
        traversal: result.slice(),
      });
      return;
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(items[i]);
      frames.push({
        tree: pathChain('current'),
        caption: `CHOOSE ${items[i]}: mark it used, push onto the path → [${path.join(', ')}]. Recurse to fill the next position.`,
        traversal: result.slice(),
      });
      dfs();
      path.pop();
      used[i] = false;
      frames.push({
        tree: pathChain('key'),
        caption: `UN-CHOOSE ${items[i]}: pop it off and clear used[${i}]. The path is back to [${path.join(', ') || '∅'}] so the next sibling branch starts from a clean state.`,
        traversal: result.slice(),
      });
    }
  }
  dfs();

  frames.push({
    tree: chain([{ value: 'start', state: 'visited' }]),
    caption: `All ${result.length} permutations generated: ${result.join(', ')}. Work is O(n · n!) — the output itself holds that many integers, so this is optimal.`,
    traversal: result.slice(),
  });
  return frames;
}

// ===========================================================================
// COMBINATIONS — size-k subsets of [1..n], DFS with a start index (tree path)
// ===========================================================================
function combinationsFrames(n = 4, k = 2) {
  const N = Math.max(1, Math.min(6, n | 0));
  const K = Math.max(1, Math.min(N, k | 0));
  const path = [];
  const result = [];
  const frames = [];

  const pathChain = (frontierState) => {
    const steps = [{ value: 'start', state: 'visited' }];
    path.forEach((v, i) => {
      steps.push({ value: String(v), state: i === path.length - 1 ? frontierState : 'visited' });
    });
    return chain(steps);
  };

  const choose = (a, b) => { let r = 1; for (let i = 0; i < b; i++) r = (r * (a - i)) / (i + 1); return Math.round(r); };
  const target = choose(N, K);

  frames.push({
    tree: chain([{ value: 'start', state: 'current' }]),
    caption: `Choose ${K} of [1..${N}] in sorted order. The start index trick — only pick indices STRICTLY greater than the last — makes every leaf a unique increasing tuple, so the C(${N},${K}) = ${target} combinations appear exactly once.`,
    traversal: [],
  });

  function dfs(start) {
    if (path.length === K) {
      const combo = `[${path.join(', ')}]`;
      result.push(combo);
      frames.push({
        tree: pathChain('done'),
        caption: `Path length = ${K}: record combination ${combo}. ${result.length} of ${target} found.`,
        traversal: result.slice(),
      });
      return;
    }
    // Upper-bound prune: stop where not enough remaining numbers can fill k.
    const limit = N - (K - path.length) + 1;
    for (let i = start; i <= N; i++) {
      if (i > limit) {
        frames.push({
          tree: pathChain('visited'),
          caption: `Prune: from ${i} only ${N - i + 1} numbers remain but ${K - path.length} more are needed — no full combination possible, so stop the loop here.`,
          traversal: result.slice(),
        });
        break;
      }
      path.push(i);
      frames.push({
        tree: pathChain('current'),
        caption: `CHOOSE ${i}: path = [${path.join(', ')}]. Recurse with start = ${i + 1} so the next pick is strictly larger (keeps the tuple sorted, no duplicates).`,
        traversal: result.slice(),
      });
      dfs(i + 1);
      path.pop();
      frames.push({
        tree: pathChain('key'),
        caption: `UN-CHOOSE ${i}: pop it and try the next candidate at this level. Path back to [${path.join(', ') || '∅'}].`,
        traversal: result.slice(),
      });
    }
  }
  dfs(1);

  frames.push({
    tree: chain([{ value: 'start', state: 'visited' }]),
    caption: `All ${result.length} combinations in lexicographic order: ${result.join(', ')}. The start index alone enforced uniqueness — no hash set, no post-filter.`,
    traversal: result.slice(),
  });
  return frames;
}

// ===========================================================================
// N-QUEENS — grid renderer. Tokens chosen so NumberGridRenderer colours them:
//   'G' queen (prime/green)  '#' attacked (composite)  'O' conflict trial (cross)
//   'S' trial square under test (current)  '.' open
// ===========================================================================
function queensFrames(n = 4) {
  const N = Math.max(4, Math.min(6, n | 0));
  const cellLabel = { '.': '·', 'G': 'Q', '#': '×', 'O': 'O', 'S': '?' };
  const cols = new Set();
  const d1 = new Set(); // row - col
  const d2 = new Set(); // row + col
  const queens = []; // queens[r] = col
  const frames = [];
  let solved = false;

  // Render the board with current queens; mark squares attacked by placed
  // queens as '#', placed queens as 'G'; optional override of one cell.
  function render(override) {
    const g = [];
    for (let r = 0; r < N; r++) {
      const row = [];
      for (let c = 0; c < N; c++) {
        if (queens[r] === c) { row.push('G'); continue; }
        const attacked = cols.has(c) || d1.has(r - c) || d2.has(r + c);
        row.push(attacked ? '#' : '.');
      }
      g.push(row);
    }
    if (override) g[override.r][override.c] = override.token;
    return g;
  }

  frames.push({
    grid: render(),
    cellLabel,
    caption: `Place ${N} queens on a ${N}×${N} board, none attacking another. Search row by row (every solution has one queen per row). Three O(1) sets track occupied columns, ↗ diagonals (row−col) and ↘ diagonals (row+col).`,
  });

  function place(row) {
    if (solved) return;
    if (row === N) {
      solved = true;
      frames.push({
        grid: render(),
        cellLabel,
        caption: `All ${N} queens placed legally — solution found: columns [${queens.join(', ')}]. Every row, column and diagonal holds at most one queen.`,
      });
      return;
    }
    for (let c = 0; c < N && !solved; c++) {
      const conflict = cols.has(c) || d1.has(row - c) || d2.has(row + c);
      if (conflict) {
        const why = cols.has(c) ? `column ${c}` : (d1.has(row - c) ? `↗ diagonal (row−col=${row - c})` : `↘ diagonal (row+col=${row + c})`);
        frames.push({
          grid: render({ r: row, c, token: 'O' }),
          cellLabel,
          caption: `Try row ${row}, col ${c}: BLOCKED — ${why} is already attacked (marked ×). Reject this square and slide to the next column.`,
        });
        continue;
      }
      // tentatively show the trial square, then commit.
      frames.push({
        grid: render({ r: row, c, token: 'S' }),
        cellLabel,
        caption: `Try row ${row}, col ${c}: all three sets are clear here. CHOOSE it — add col ${c}, diagonals ${row - c} and ${row + c} to the sets.`,
      });
      cols.add(c); d1.add(row - c); d2.add(row + c); queens[row] = c;
      frames.push({
        grid: render(),
        cellLabel,
        caption: `Queen placed at (row ${row}, col ${c}). Its column and both diagonals (×) are now off-limits to deeper rows. Recurse into row ${row + 1}.`,
      });
      place(row + 1);
      if (solved) return;
      // backtrack
      cols.delete(c); d1.delete(row - c); d2.delete(row + c); queens[row] = undefined;
      frames.push({
        grid: render(),
        cellLabel,
        caption: `Row ${row + 1} had no legal column under the queen at (${row}, ${c}) — dead end. UN-CHOOSE: remove that queen and its three sets, then try the next column in row ${row}.`,
      });
    }
    if (!solved && row > 0 && queens[row] === undefined) {
      // loop exhausted with no placement: signal backtrack to caller (already narrated above for parent).
    }
  }
  place(0);

  if (!solved) {
    frames.push({
      grid: render(),
      cellLabel,
      caption: `No arrangement exists for n = ${N} (n = 2 and n = 3 are impossible). The whole search tree was pruned away by the column/diagonal constraints.`,
    });
  }
  return frames;
}

// ===========================================================================
// RECURSION TAIL CALL — array renderer = the frame stack / accumulator.
// Cell i = a live call frame; subRow = the pending work each frame holds.
// ===========================================================================
// Non-tail factorial: frames pile up, each holding a pending "× n".
function nonTailFactorialFrames(n = 4) {
  const N = Math.max(1, Math.min(6, n | 0));
  const frames = [];
  const stack = [];   // frame labels, index 0 = bottom (first call)
  const pending = []; // the "× n" each frame still owes

  frames.push({
    array: [],
    subRow: { values: [], label: 'pending' },
    caption: `Non-tail factorial: return n * fact(n-1). After the recursive call returns, the caller STILL has to multiply by n — so its frame must stay alive. Watch the stack grow to depth ${N}.`,
  });

  // Descent: push a frame per call.
  for (let k = N; k >= 1; k--) {
    stack.push(`f(${k})`);
    pending.push(k > 1 ? `× ${k}` : '1');
    frames.push({
      array: stack.slice(),
      subRow: { values: pending.slice(), label: 'pending' },
      highlights: { [stack.length - 1]: 'current' },
      pointers: { [stack.length - 1]: 'top' },
      caption: k > 1
        ? `Call fact(${k}): it owes "× ${k}" once fact(${k - 1}) returns, so frame f(${k}) is pushed and kept. Stack depth = ${stack.length}.`
        : `Call fact(1): base case returns 1 immediately — but ${stack.length - 1} frames below are still waiting to multiply. Stack depth peaked at ${stack.length}.`,
    });
  }

  // Unwind: pop and fold the pending multiplies into a running product.
  let acc = 1;
  for (let k = 1; k <= N; k++) {
    const popped = stack.pop();
    pending.pop();
    acc *= k;
    frames.push({
      array: stack.slice(),
      subRow: { values: pending.slice(), label: 'pending' },
      highlights: stack.length ? { [stack.length - 1]: 'current' } : {},
      caption: `${popped} returns; its caller applies the pending × ${k} → running product = ${acc}. Frame popped only NOW — peak memory was O(${N}).`,
    });
  }
  frames.push({
    array: [],
    subRow: { values: [], label: 'pending' },
    caption: `Result ${N}! = ${acc}. Because each frame held live work (the pending multiply), none could be reused — depth N stack, the classic stack-overflow risk for deep recursion.`,
  });
  return frames;
}

// Tail-recursive factorial WITH TCO: one reused frame; acc carries the state.
function tailFactorialFrames(n = 4) {
  const N = Math.max(1, Math.min(6, n | 0));
  const frames = [];

  frames.push({
    array: ['fact(n, acc)'],
    subRow: { values: ['—'], label: 'acc' },
    caption: `Tail-recursive: return fact(n-1, acc*n). The recursive call is the LAST action — the multiply is folded into the accumulator argument BEFORE the call, so the caller's frame holds no live state.`,
  });

  let acc = 1;
  let k = N;
  let step = 0;
  while (k >= 1) {
    const nextAcc = acc * k;
    frames.push({
      array: [`fact(${k}, ${acc})`],
      subRow: { values: [String(acc)], label: 'acc' },
      highlights: { 0: 'current' },
      pointers: { 0: 'the one frame' },
      caption: k > 1
        ? `Step ${++step}: enter fact(${k}, acc=${acc}). The pending multiply acc·n = ${acc}·${k} = ${nextAcc} is computed BEFORE the call, so nothing is left over to do on return.`
        : `Step ${++step}: fact(1, acc=${acc}) — base case. Nothing pending, so just return acc = ${acc}. The stack never grew past one frame.`,
    });
    if (k > 1) {
      frames.push({
        array: [`fact(${k - 1}, ${nextAcc})`],
        subRow: { values: [String(nextAcc)], label: 'acc' },
        highlights: { 0: 'match' },
        pointers: { 0: 'same frame, updated' },
        caption: `Tail-call fact(${k - 1}, ${nextAcc}): instead of a new frame, TCO overwrites n = ${k - 1} and acc = ${nextAcc} in place and jumps back to the top — a loop in disguise.`,
      });
    }
    acc = nextAcc;
    k -= 1;
  }
  frames.push({
    array: ['return acc'],
    subRow: { values: [String(acc)], label: 'acc' },
    highlights: { 0: 'done' },
    caption: `Result ${N}! = ${acc} in ONE frame, mutated in place — n decremented, acc accumulated, the rest discarded. The accumulator replaced the entire call stack: O(1) space.`,
  });

  // Contrast row: the same computation as a plain loop (what TCO compiles to).
  frames.push({
    array: ['while n > 1'],
    subRow: { values: [String(acc)], label: 'acc' },
    caption: `This is structurally identical to "acc = 1; while n > 1: acc *= n; n -= 1". TCO is the compiler turning the tail call into exactly this jump-with-updated-args loop — zero runtime cost.`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
// Export map
// ---------------------------------------------------------------------------
export default {
  'subsets-power-set': {
    title: 'Subsets / Power Set',
    renderer: 'tree',
    cases: [
      { label: 'Include/exclude DFS [1,2,3]', frames: subsetsFrames([1, 2, 3]) },
      { label: 'DFS on [a,b,c]', frames: subsetsFrames(['a', 'b', 'c']) },
      { label: 'DFS on [a,b]', frames: subsetsFrames(['a', 'b']) },
    ],
    build: ({ nums }) => subsetsFrames(
      String(nums ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    ),
    inputSchema: {
      fields: [
        { name: 'nums', label: 'elements (comma-separated, ≤4)', type: 'string', default: '1,2,3', max: 20, placeholder: '1,2,3' },
      ],
    },
  },
  'permutations-backtrack': {
    title: 'Permutations (Backtracking)',
    renderer: 'tree',
    cases: [
      { label: 'DFS tree [1,2,3]', frames: permutationsFrames([1, 2, 3]) },
      { label: 'DFS tree [a,b,c]', frames: permutationsFrames(['a', 'b', 'c']) },
    ],
    build: ({ nums }) => permutationsFrames(
      String(nums ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    ),
    inputSchema: {
      fields: [
        { name: 'nums', label: 'elements (comma-separated, ≤4)', type: 'string', default: '1,2,3', max: 20, placeholder: '1,2,3' },
      ],
    },
  },
  'combinations-backtrack': {
    title: 'Combinations (Backtracking)',
    renderer: 'tree',
    cases: [
      { label: 'C(4,2)', frames: combinationsFrames(4, 2) },
      { label: 'C(5,3)', frames: combinationsFrames(5, 3) },
      { label: 'C(4,3)', frames: combinationsFrames(4, 3) },
    ],
    build: ({ n, k }) => combinationsFrames(Number(n), Number(k)),
    inputSchema: {
      fields: [
        { name: 'n', label: 'n (1-6)', type: 'number', default: 4, min: 1, max: 6 },
        { name: 'k', label: 'k (1-n)', type: 'number', default: 2, min: 1, max: 6 },
      ],
    },
  },
  'n-queens-backtrack': {
    title: 'N-Queens (Backtracking)',
    renderer: 'grid',
    cases: [
      { label: '4×4 board', frames: queensFrames(4) },
      { label: '5×5 board', frames: queensFrames(5) },
    ],
    build: ({ n }) => queensFrames(Number(n)),
    inputSchema: {
      fields: [
        { name: 'n', label: 'board size (4-6)', type: 'number', default: 4, min: 4, max: 6 },
      ],
    },
  },
  'recursion-tail-call': {
    title: 'Tail Call Optimization',
    renderer: 'array',
    cases: [
      { label: 'Non-tail: stack grows to n', frames: nonTailFactorialFrames(4) },
      { label: 'Tail call: one frame (TCO)', frames: tailFactorialFrames(4) },
      { label: 'Non-tail factorial(5)', frames: nonTailFactorialFrames(5) },
    ],
    build: ({ n }) => nonTailFactorialFrames(Number(n)),
    inputSchema: {
      fields: [
        { name: 'n', label: 'n (1-6)', type: 'number', default: 4, min: 1, max: 6 },
      ],
    },
  },
};
