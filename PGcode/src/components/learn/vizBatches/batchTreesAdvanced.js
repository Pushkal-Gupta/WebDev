// Concept-visualization batch: advanced tree structures & traversals.
//   fenwick-bit            -> 'array' (index-jump arrows over the BIT cells)
//   segment-tree-merge     -> 'tree'  (two trees merged node-by-node)
//   tree-morris-traversal  -> 'tree'  (temporary right-threads, no stack)
//   tree-iterative-traversals -> 'tree' (explicit-stack pre/in/post-order)
//   euler-tour-flatten     -> 'array' (DFS in/out times flatten subtrees)
//   trie                   -> 'tree'  (character-by-character insert/search)
//
// Frame shapes are read directly by AlgoVisualizer.jsx:
//   ArrayBarRenderer  — { array, highlights?:{idx:role}, pointers?:{idx:label|[labels]},
//                         subRow?:{values:[],label}, eliminated?, chip?, caption }
//   TreeRenderer      — { tree:{ _id, value, left, right, state? }, traversal?:[], caption }
// Tree node `state` uses the CSS-backed set: 'current' | 'visited' | 'done' | 'frontier'.
// Self-contained: no imports from conceptVisualizations.js.

// ---------------------------------------------------------------------------
// Shared tree helpers (binary nodes; TreeRenderer walks left/right only)
// ---------------------------------------------------------------------------
let _nid = 0;
function nextId() { return ++_nid; }
function tnode(value, state) { return { _id: nextId(), value, left: null, right: null, state }; }
// Re-emit the tree with state flags taken from a { _id: state } map.
function paint(n, states) {
  if (!n) return null;
  const st = states && states[n._id];
  return { _id: n._id, value: n.value, state: st, left: paint(n.left, states), right: paint(n.right, states) };
}

// ===========================================================================
// fenwick-bit (renderer: 'array')
// Each cell is a 1-indexed BIT node; subRow carries the range each node covers.
// pointers mark the current jump position; highlights flag touched nodes.
// ===========================================================================
function lowbit(i) { return i & -i; }
function coversLabel(i) { return `${i - lowbit(i) + 1}..${i}`; }

function fenwickFrames(values = [3, 2, -1, 6, 5, 4, -3, 3], updIdx = 5, delta = 4, queryIdx = 7) {
  const n = values.length;
  const idx0 = (i) => i - 1; // 1-indexed BIT pos -> 0-indexed array cell
  const covers = [];
  const cells = new Array(n).fill(0);
  for (let i = 1; i <= n; i++) covers.push(coversLabel(i));

  // Build the BIT array from the values (each node holds the sum of its range).
  const prefix = [0];
  for (let i = 0; i < n; i++) prefix.push(prefix[i] + values[i]);
  for (let i = 1; i <= n; i++) cells[idx0(i)] = prefix[i] - prefix[i - lowbit(i)];

  const subRow = () => ({ values: covers.slice(), label: 'covers' });
  const frames = [];

  frames.push({
    array: cells.slice(),
    subRow: subRow(),
    caption: `Fenwick tree (1-indexed). bit[i] stores the sum of the range it covers: ${covers.length} nodes, where node i owns the last (i & -i) elements ending at i.`,
  });
  frames.push({
    array: cells.slice(),
    subRow: subRow(),
    highlights: Object.fromEntries(Array.from({ length: n }, (_, k) => [k, lowbit(k + 1) === (k + 1) ? 'pivot' : 'visited'])),
    caption: `Powers of two (1, 2, 4, 8 — pivot cells) own large ranges; odd indices own a single element. The lowest set bit (i & -i) is exactly the range size.`,
  });

  // ---- update(updIdx, delta): jump forward i += i & -i ----
  frames.push({
    array: cells.slice(),
    subRow: subRow(),
    pointers: { [idx0(updIdx)]: 'i' },
    highlights: { [idx0(updIdx)]: 'current' },
    caption: `update(${updIdx}, ${delta >= 0 ? '+' : ''}${delta}): start at i = ${updIdx}. Every node whose range covers index ${updIdx} must absorb the delta. Walk UP via i += i & -i.`,
  });
  let i = updIdx;
  while (i <= n) {
    const before = cells[idx0(i)];
    cells[idx0(i)] = before + delta;
    frames.push({
      array: cells.slice(),
      subRow: subRow(),
      pointers: { [idx0(i)]: 'i' },
      highlights: { [idx0(i)]: 'match' },
      caption: `bit[${i}] covers ${coversLabel(i)} which includes ${updIdx} -> bit[${i}] += ${delta} (${before} -> ${cells[idx0(i)]}). Next jump: i += ${i} & -${i} = ${i} + ${lowbit(i)} = ${i + lowbit(i)}.`,
    });
    i += lowbit(i);
  }
  frames.push({
    array: cells.slice(),
    subRow: subRow(),
    caption: `i passed n = ${n}, so the update halts. Exactly the O(log n) nodes on the upward jump-chain changed — never the whole array.`,
  });

  // ---- prefix(queryIdx): jump backward i -= i & -i ----
  let j = queryIdx;
  let acc = 0;
  const touched = [];
  frames.push({
    array: cells.slice(),
    subRow: subRow(),
    pointers: { [idx0(queryIdx)]: 'i' },
    highlights: { [idx0(queryIdx)]: 'current' },
    caption: `prefix(${queryIdx}) = sum of indices 1..${queryIdx}. Start at i = ${queryIdx} and walk DOWN via i -= i & -i, accumulating bit[i] at each stop.`,
  });
  while (j > 0) {
    acc += cells[idx0(j)];
    touched.push(idx0(j));
    const hl = {};
    for (const t of touched) hl[t] = 'done';
    hl[idx0(j)] = 'match';
    frames.push({
      array: cells.slice(),
      subRow: subRow(),
      pointers: { [idx0(j)]: 'i' },
      highlights: hl,
      caption: `Add bit[${j}] (covers ${coversLabel(j)}) -> acc = ${acc}. Next jump: i -= ${j} & -${j} = ${j} - ${lowbit(j)} = ${j - lowbit(j)}.`,
    });
    j -= lowbit(j);
  }
  frames.push({
    array: cells.slice(),
    subRow: subRow(),
    highlights: Object.fromEntries(touched.map((t) => [t, 'done'])),
    caption: `i reached 0 — the disjoint covering ranges tile [1..${queryIdx}] perfectly, so prefix(${queryIdx}) = ${acc}. Both update and query touch only O(log n) nodes.`,
  });
  return frames;
}

// ===========================================================================
// segment-tree-merge (renderer: 'tree')
// Two trees over the same index range; merge by recursively summing nodes.
// Null counterparts short-circuit (the surviving child is reused as-is).
// ===========================================================================
function segMergeFrames() {
  _nid = 0;
  const frames = [];

  // Tree A over [0..7]
  const a = tnode(7);
  a.left = tnode(3); a.right = tnode(4);
  a.left.left = tnode(2); a.left.right = tnode(1);
  // Tree B over [0..7]
  const b = tnode(5);
  b.left = tnode(2); b.right = tnode(3);
  b.right.left = tnode(1); b.right.right = tnode(2);

  frames.push({ tree: paint(a, {}), caption: `Two sparse segment trees over the same range [0,7]. Tree A holds counts in its left half. Goal: merge B into A by summing overlapping nodes.` });
  frames.push({ tree: paint(b, {}), caption: `Tree B holds counts in its right half. Merge rule: if either node is null return the other; at matching nodes add values; recurse on left and right children.` });

  // Build the merged tree explicitly, narrating overlaps and short-circuits.
  frames.push({ tree: paint(a, { [a._id]: 'current' }), caption: `merge(rootA=7, rootB=5): both non-null -> new root value = 7 + 5 = 12. Recurse into the left pair (A.left=3, B.left=2) then the right pair (A.right=4, B.right=3).` });

  const m = tnode(12, 'done');
  frames.push({ tree: paint(m, { [m._id]: 'done' }), caption: `Root merged to 12. Now descend left: merge(A.left=3, B.left=2).` });

  m.left = tnode(5, 'current');
  frames.push({ tree: paint(m, { [m.left._id]: 'current' }), caption: `Left children both present -> 3 + 2 = 5. A.left has children (2,1); B.left is a leaf (null children) -> A's children pass through unchanged (short-circuit).` });

  m.left.left = tnode(2, 'frontier'); m.left.right = tnode(1, 'frontier');
  frames.push({ tree: paint(m, { [m.left.left._id]: 'frontier', [m.left.right._id]: 'frontier' }), caption: `merge(A's 2, null) returns 2; merge(A's 1, null) returns 1. Null counterpart = no recursion, the node is reused as-is. These are the cheap "non-intersecting" branches.` });

  m.right = tnode(7, 'current');
  frames.push({ tree: paint(m, { [m.right._id]: 'current' }), caption: `Back up, descend right: merge(A.right=4, B.right=3) -> 4 + 3 = 7. A.right is a leaf; B.right has children (1,2) -> B's children pass through.` });

  m.right.left = tnode(1, 'frontier'); m.right.right = tnode(2, 'frontier');
  frames.push({ tree: paint(m, { [m.right.left._id]: 'frontier', [m.right.right._id]: 'frontier' }), caption: `merge(null, B's 1) = 1; merge(null, B's 2) = 2. Again null short-circuits — only the overlapping spine (root + two halves) did real addition work.` });

  frames.push({ tree: paint(m, { [m._id]: 'done', [m.left._id]: 'done', [m.right._id]: 'done' }), caption: `Merged tree complete: 12 at the root, 5 and 7 below, the disjoint subtrees grafted on. Only ~3 nodes overlapped; the rest were reused pointers.` });
  frames.push({ tree: paint(m, {}), caption: `Cost = nodes where BOTH trees were non-null (the intersection), bounded by the smaller tree. Across small-to-large merges this amortizes to O(n log n) total.` });
  frames.push({ tree: paint(m, { [m.left.left._id]: 'done', [m.left.right._id]: 'done', [m.right.left._id]: 'done', [m.right.right._id]: 'done' }), caption: `The four leaves (2, 1, 1, 2) carry the per-index counts; internal nodes carry range sums. Query any range on the merged tree in O(log n).` });
  return frames;
}

// ===========================================================================
// tree-morris-traversal (renderer: 'tree')
// In-order with O(1) extra space: thread each predecessor's right pointer to
// its inorder successor, follow the thread back, then unthread.
// ===========================================================================
function morrisFrames() {
  _nid = 0;
  // Fixed sample tree:   1
  //                     / \
  //                    2   3
  //                   / \
  //                  4   5
  const root = tnode(1);
  root.left = tnode(2); root.right = tnode(3);
  root.left.left = tnode(4); root.left.right = tnode(5);
  const id = { 1: root._id, 2: root.left._id, 3: root.right._id, 4: root.left.left._id, 5: root.left.right._id };
  const out = [];
  const frames = [];

  const push = (curId, threadFrom, threadTo, caption, extra) => {
    const states = {};
    for (const v of out) states[id[v]] = 'done';
    if (curId != null) states[curId] = 'current';
    if (extra) for (const [k, v] of Object.entries(extra)) states[k] = v;
    frames.push({ tree: paint(root, states), traversal: out.slice(), caption });
  };

  push(root._id, null, null, `Morris in-order on this tree should emit 4, 2, 5, 1, 3 using only two pointers — no stack, no recursion. curr starts at the root (1).`);
  push(root._id, null, null, `curr = 1 has a left child. Find its inorder predecessor = rightmost node of the left subtree = 5. Thread 5.right -> 1 so we can return, then move curr = 1.left = 2.`, { [id[5]]: 'frontier' });
  push(id[2], null, null, `curr = 2 has a left child. Predecessor = rightmost of subtree(4) = 4. Thread 4.right -> 2, then curr = 2.left = 4.`, { [id[4]]: 'frontier' });

  out.push(4);
  push(id[4], null, null, `curr = 4 has no left child -> EMIT 4. Follow 4.right, which is the thread we set, back to 2. curr = 2.`);
  push(id[2], null, null, `curr = 2 again. Its predecessor 4 already threads to 2 (thread detected) -> we have finished 2's left subtree. REMOVE the thread (4.right = null).`, { [id[4]]: 'frontier' });

  out.push(2);
  push(id[2], null, null, `EMIT 2 (a node is emitted once its left subtree is done). Move curr = 2.right = 5.`);
  out.push(5);
  push(id[5], null, null, `curr = 5 has no left child -> EMIT 5. Follow 5.right, the thread back to 1. curr = 1.`);

  push(root._id, null, null, `curr = 1 again. Predecessor 5 already threads to 1 (thread detected) -> left subtree of 1 is done. REMOVE the thread (5.right = null).`, { [id[5]]: 'frontier' });
  out.push(1);
  push(root._id, null, null, `EMIT 1. Move curr = 1.right = 3.`);
  out.push(3);
  push(id[3], null, null, `curr = 3 has no left child -> EMIT 3. curr = 3.right = null -> traversal ends.`);

  const allDone = {};
  for (const v of [1, 2, 3, 4, 5]) allDone[id[v]] = 'done';
  frames.push({ tree: paint(root, allDone), traversal: out.slice(), caption: `Output 4, 2, 5, 1, 3 — correct in-order. Every thread we created was later removed, so the tree is fully restored. Extra space: O(1).` });
  return frames;
}

// ===========================================================================
// tree-iterative-traversals (renderer: 'tree')
// Explicit-stack pre / in / post-order. The stack contents ride in the caption.
//          1
//         / \
//        2   3
//       / \   \
//      4   5   6
// ===========================================================================
function buildSampleTree() {
  _nid = 0;
  const r = tnode(1);
  r.left = tnode(2); r.right = tnode(3);
  r.left.left = tnode(4); r.left.right = tnode(5);
  r.right.right = tnode(6);
  return r;
}
function idMap(r) {
  const m = {};
  const walk = (n) => { if (!n) return; m[n.value] = n._id; walk(n.left); walk(n.right); };
  walk(r);
  return m;
}

function preorderIterFrames() {
  const root = buildSampleTree();
  const id = idMap(root);
  const out = [];
  const frames = [];
  const child = (v) => ({ 1: [3, 2], 2: [5, 4], 3: [6], 4: [], 5: [], 6: [] }[v]);
  const stateFrame = (curId, stack, caption) => {
    const states = {};
    for (const v of out) states[id[v]] = 'done';
    for (const v of stack) states[id[v]] = 'visited';
    if (curId != null) states[curId] = 'current';
    frames.push({ tree: paint(root, states), traversal: out.slice(), caption });
  };

  let stack = [1];
  stateFrame(null, stack, `Preorder (root -> left -> right) with an explicit stack — the iterative twin of recursion. Push the root: stack = [1].`);
  stateFrame(null, stack, `Rule each step: pop the top, EMIT it, then push its RIGHT child before its LEFT child. Pushing right first means left ends up on top, so left is visited first — that is what "root then left then right" requires.`);
  while (stack.length) {
    const v = stack[stack.length - 1];
    stack = stack.slice(0, -1);
    out.push(v);
    const kids = child(v);
    stack = stack.concat(kids); // right already first in our arrays
    stateFrame(id[v], stack, `Pop ${v}, EMIT ${v}. Push its children right-then-left -> stack = [${stack.join(', ') || 'empty'}]. The top of the stack is always the next node to visit.`);
  }
  frames.push({ tree: paint(root, Object.fromEntries(out.map((v) => [id[v], 'done']))), traversal: out.slice(), caption: `Stack empty. Preorder = [${out.join(', ')}].` });
  frames.push({ tree: paint(root, Object.fromEntries(out.map((v) => [id[v], 'done']))), traversal: out.slice(), caption: `The explicit stack mirrors recursion's call stack exactly, but lives on the heap — so it never blows the language's recursion limit on a deep or skewed tree. That is the whole reason to iterate instead of recurse.` });
  return frames;
}

function inorderIterFrames() {
  const root = buildSampleTree();
  const id = idMap(root);
  const node = {};
  (function idx(n) { if (!n) return; node[n.value] = n; idx(n.left); idx(n.right); })(root);
  const out = [];
  const frames = [];
  const stateFrame = (curVal, stackVals, caption) => {
    const states = {};
    for (const v of out) states[id[v]] = 'done';
    for (const v of stackVals) states[id[v]] = 'visited';
    if (curVal != null) states[id[curVal]] = 'current';
    frames.push({ tree: paint(root, states), traversal: out.slice(), caption });
  };

  let stack = [];
  let cur = root;
  stateFrame(1, [], `Inorder (left -> root -> right). Keep curr and a stack. Phase 1: walk left from curr, pushing every node, until curr is null.`);
  let guard = 0;
  while ((stack.length || cur) && guard < 40) {
    guard++;
    while (cur) {
      stack = stack.concat(cur.value);
      const next = cur.left;
      stateFrame(next ? next.value : null, stack.slice(), `Push ${cur.value}, go left -> curr = ${next ? next.value : 'null'}. Stack = [${stack.join(', ')}].`);
      cur = next;
    }
    const v = stack[stack.length - 1];
    stack = stack.slice(0, -1);
    out.push(v);
    const r = node[v].right;
    stateFrame(v, stack.slice(), `curr hit null -> pop ${v}, EMIT ${v}. Then curr = ${v}.right = ${r ? r.value : 'null'}. Stack = [${stack.join(', ') || 'empty'}].`);
    cur = r;
  }
  frames.push({ tree: paint(root, Object.fromEntries(out.map((v) => [id[v], 'done']))), traversal: out.slice(), caption: `Inorder = [${out.join(', ')}]. On a BST this streams keys in sorted order; the stack depth never exceeds the tree height O(h).` });
  return frames;
}

function postorderIterFrames() {
  const root = buildSampleTree();
  const id = idMap(root);
  const out = [];
  const frames = [];
  const child = (v) => ({ 1: [2, 3], 2: [4, 5], 3: [6], 4: [], 5: [], 6: [] }[v]); // left-then-right for reverse-preorder
  const stateFrame = (curId, stack, rev, caption) => {
    const states = {};
    for (const v of rev) states[id[v]] = 'done';
    for (const v of stack) states[id[v]] = 'visited';
    if (curId != null) states[curId] = 'current';
    frames.push({ tree: paint(root, states), traversal: rev.slice().reverse(), caption });
  };

  // Approach: modified preorder (root, right, left) into `rev`, then reverse.
  let stack = [1];
  const rev = [];
  stateFrame(null, stack, rev, `Postorder (left -> right -> root) is awkward iteratively because the root is visited LAST but seen FIRST. The "reverse preorder" trick sidesteps that. Push the root: stack = [1].`);
  stateFrame(null, stack, rev, `Run a preorder that pushes LEFT then RIGHT (so RIGHT pops first), collecting into rev. That produces order root -> right -> left; reversing it yields left -> right -> root = true postorder.`);
  while (stack.length) {
    const v = stack[stack.length - 1];
    stack = stack.slice(0, -1);
    rev.push(v);
    stack = stack.concat(child(v)); // left then right -> right on top
    stateFrame(id[v], stack, rev, `Pop ${v}, append to rev = [${rev.join(', ')}]. Push children left-then-right -> stack = [${stack.join(', ') || 'empty'}]. (Traversal row shows rev reversed so far.)`);
  }
  for (const v of rev.slice().reverse()) out.push(v);
  frames.push({ tree: paint(root, Object.fromEntries(out.map((v) => [id[v], 'done']))), traversal: out.slice(), caption: `Collection done: rev = [${rev.join(', ')}] (the root -> right -> left order).` });
  frames.push({ tree: paint(root, Object.fromEntries(out.map((v) => [id[v], 'done']))), traversal: out.slice(), caption: `Reverse rev to get postorder = [${out.join(', ')}]. Every child is now emitted before its parent — exactly what postorder demands, and useful for freeing/aggregating a tree bottom-up.` });
  return frames;
}

// ===========================================================================
// euler-tour-flatten (renderer: 'array')
// DFS assigns tin/tout; the flat array (indexed by tin) makes each subtree a
// contiguous slice. subRow carries the timer; pointers mark enter/exit.
// Tree: 1 -[2 -[4,5], 3]; children order 2 before 3, 4 before 5.
// ===========================================================================
function eulerFrames() {
  // adjacency for the fixed tree, parent-aware order
  const children = { 1: [2, 3], 2: [4, 5], 3: [], 4: [], 5: [] };
  const tin = {}, tout = {};
  const flat = []; // flat[time] = node entered at that time
  let timer = 0;
  const frames = [];
  const order = []; // record (node, phase) for narration

  // Iterative-flavoured DFS but recorded recursively for clean tin/tout.
  (function dfs(v) {
    tin[v] = timer; flat[timer] = v; order.push([v, 'in']); timer++;
    for (const c of children[v]) dfs(c);
    tout[v] = timer - 1; order.push([v, 'out']);
  })(1);

  const n = flat.length;
  const flatVals = flat.slice();
  // Build subRow showing the timer axis labels (0..n-1).
  const axis = () => ({ values: Array.from({ length: n }, (_, k) => `t${k}`), label: 'time' });

  frames.push({
    array: new Array(n).fill('·'),
    subRow: axis(),
    caption: `Euler tour flattens the tree (root 1, children: 2->[4,5], 3) into a length-${n} array indexed by entry time. DFS stamps tin on entry and tout on exit; the array fills left to right.`,
  });

  // Replay the DFS entry phase, filling the flat array.
  let placed = 0;
  const placedSet = new Set();
  for (const [v, phase] of order) {
    if (phase === 'in') {
      const t = tin[v];
      placedSet.add(t);
      placed++;
      const cur = flatVals.slice(0, placed).concat(new Array(n - placed).fill('·'));
      frames.push({
        array: cur,
        subRow: axis(),
        pointers: { [t]: 'in' },
        highlights: { [t]: 'current' },
        caption: `Enter node ${v}: tin[${v}] = ${t}. Write node ${v} into flat[${t}]. Every descendant of ${v} will be entered AFTER this moment and exited before we leave ${v}.`,
      });
    } else {
      const t = tout[v];
      const cur = flatVals.slice();
      const hl = {};
      for (let k = tin[v]; k <= tout[v]; k++) hl[k] = 'match';
      frames.push({
        array: cur,
        subRow: axis(),
        pointers: { [tin[v]]: 'in', [t]: 'out' },
        highlights: hl,
        caption: `Leave node ${v}: tout[${v}] = ${t}. Its subtree occupies the contiguous slice [tin[${v}]=${tin[v]} .. tout[${v}]=${t}] (highlighted) — node ${v} plus exactly its descendants.`,
      });
    }
  }

  // Subtree-range demo for node 2.
  const lo = tin[2], hi = tout[2];
  const hl2 = {};
  for (let k = lo; k <= hi; k++) hl2[k] = 'done';
  frames.push({
    array: flatVals.slice(),
    subRow: axis(),
    highlights: hl2,
    caption: `Subtree of 2 = slice [${lo}, ${hi}] = nodes ${flatVals.slice(lo, hi + 1).join(', ')}. A subtree query/update is now a RANGE op on the flat array — feed it to a Fenwick or segment tree for O(log n).`,
  });
  // Ancestry check demo.
  frames.push({
    array: flatVals.slice(),
    subRow: axis(),
    highlights: { [tin[2]]: 'pivot', [tin[4]]: 'current' },
    caption: `is_ancestor(2, 4)? Check tin[2]=${tin[2]} <= tin[4]=${tin[4]} <= tout[2]=${tout[2]} -> true. Ancestry collapses to one interval test on the timestamps.`,
  });
  frames.push({
    array: flatVals.slice(),
    subRow: axis(),
    highlights: { [tin[3]]: 'pivot', [tin[4]]: 'current' },
    caption: `is_ancestor(3, 4)? tin[3]=${tin[3]} <= tin[4]=${tin[4]} is false -> 4 is NOT in subtree of 3. O(n) preprocessing buys O(1) ancestry and O(log n) subtree queries forever.`,
  });
  return frames;
}

// ===========================================================================
// trie (renderer: 'tree')
// Insert words character by character (shared prefixes share nodes), then
// search. Terminal nodes carry a '*' suffix in their value.
// ===========================================================================
function trieFrames() {
  _nid = 0;
  const root = tnode('•'); // root represents the empty prefix
  const frames = [];

  // We build the trie as a binary-rendered tree: each node's single relevant
  // child sits in `left`; a branch puts the alternative in `right`.
  // Words: car, cat, card.
  const idOf = {}; // path-string -> node
  idOf[''] = root;

  const snap = (caption, states, terminals) => {
    // terminals: set of path-strings currently marked terminal -> append '*'
    const tag = (n, path) => {
      if (!n) return null;
      const isTerm = terminals && terminals.has(path);
      return {
        _id: n._id,
        value: isTerm ? `${n.value}*` : n.value,
        state: states && states[n._id],
        left: tagChild(n.left, path),
        right: tagChild(n.right, path),
      };
    };
    const tagChild = (c, parentPath) => {
      if (!c) return null;
      // find this child's path
      const entry = Object.entries(idOf).find(([, nn]) => nn === c);
      const p = entry ? entry[0] : parentPath + c.value;
      return tag(c, p);
    };
    frames.push({ tree: tag(root, ''), caption });
  };

  const terminals = new Set();

  snap(`Trie (prefix tree). The root is the empty prefix; each edge adds one character, so every node spells the prefix on its root-path. Insert "car", "cat", "card".`, {}, terminals);

  // Insert "car"
  const c = tnode('c'); root.left = c; idOf['c'] = c;
  snap(`insert("car") char 'c': no edge from root for 'c' -> create node. It spells the prefix "c".`, { [c._id]: 'current' }, terminals);
  const ca = tnode('a'); c.left = ca; idOf['ca'] = ca;
  snap(`Next char 'a': no 'a'-edge below "c" -> create it. Path c -> a spells "ca".`, { [ca._id]: 'current' }, terminals);
  const car = tnode('r'); ca.left = car; idOf['car'] = car;
  terminals.add('car');
  snap(`Last char 'r': create node, then mark it terminal (the '*' suffix) -> the word "car" now ends here.`, { [car._id]: 'current' }, terminals);

  // Insert "cat" — shares prefix "ca"
  snap(`insert("cat"): walk 'c' then 'a' — both edges already exist, so we REUSE the shared "ca" prefix. No new nodes yet.`, { [c._id]: 'visited', [ca._id]: 'visited' }, terminals);
  const cat = tnode('t'); ca.right = cat; idOf['cat'] = cat;
  terminals.add('cat');
  snap(`At "ca", char 't' has no edge -> branch: create the 't' child alongside 'r'. Mark it terminal -> "cat" ends here. "car" and "cat" share the "ca" node.`, { [cat._id]: 'current' }, terminals);

  // Insert "card" — extends "car"
  snap(`insert("card"): walk 'c','a','r' — all exist (reusing "car"). curr is the 'r' node; it is terminal for "car" but we continue.`, { [c._id]: 'visited', [ca._id]: 'visited', [car._id]: 'visited' }, terminals);
  const card = tnode('d'); car.left = card; idOf['card'] = card;
  terminals.add('card');
  snap(`Char 'd' has no edge below "car" -> create it and mark terminal. "card" ends here; "car" stays terminal one level up. One trie now stores all three words.`, { [card._id]: 'current' }, terminals);

  // search("car")
  snap(`search("car"): walk 'c' -> 'a' -> 'r'. Every edge exists and the final node is terminal ('*') -> return TRUE.`, { [c._id]: 'done', [ca._id]: 'done', [car._id]: 'done' }, terminals);
  // search("ca") — prefix but not a word
  snap(`search("ca"): edges 'c' -> 'a' exist but the "ca" node is NOT terminal -> "ca" is a prefix, not a stored word -> return FALSE.`, { [c._id]: 'done', [ca._id]: 'done' }, terminals);
  // startsWith("ca")
  snap(`startsWith("ca"): walk 'c' -> 'a'; no missing edge, so a stored word begins with "ca" -> return TRUE (terminal flag is irrelevant for prefix checks).`, { [c._id]: 'done', [ca._id]: 'done' }, terminals);
  // search miss
  snap(`search("cab"): walk 'c' -> 'a', then look for 'b' — no such edge below "ca" -> fall off the trie -> return FALSE. Every operation is O(L), independent of how many words are stored.`, { [c._id]: 'done', [ca._id]: 'done' }, terminals);
  return frames;
}

// ---------------------------------------------------------------------------
// Export map
// ---------------------------------------------------------------------------
export default {
  'fenwick-bit': {
    title: 'Fenwick Tree (BIT): i ± (i & -i) jumps',
    renderer: 'array',
    cases: [
      { label: 'update(5,+4) · prefix(7)', frames: fenwickFrames([3, 2, -1, 6, 5, 4, -3, 3], 5, 4, 7) },
      { label: 'update(3,+10) · prefix(8)', frames: fenwickFrames([1, 1, 1, 1, 1, 1, 1, 1], 3, 10, 8) },
    ],
    build: ({ vals, upd, delta, query }) => {
      const v = String(vals ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter((x) => Number.isFinite(x));
      const safe = v.length ? v : [3, 2, -1, 6, 5, 4, -3, 3];
      const n = safe.length;
      const u = Math.max(1, Math.min(n, Number(upd) || 5));
      const q = Math.max(1, Math.min(n, Number(query) || n));
      return fenwickFrames(safe, u, Number(delta) || 1, q);
    },
    inputSchema: {
      fields: [
        { name: 'vals', label: 'values (comma-separated)', type: 'string', default: '3,2,-1,6,5,4,-3,3', max: 40, placeholder: '3,2,-1,6,5,4,-3,3' },
        { name: 'upd', label: 'update index (1-based)', type: 'number', default: 5, min: 1, max: 16 },
        { name: 'delta', label: 'delta', type: 'number', default: 4, min: -50, max: 50 },
        { name: 'query', label: 'prefix index (1-based)', type: 'number', default: 7, min: 1, max: 16 },
      ],
    },
  },
  'segment-tree-merge': {
    title: 'Segment Tree Merging',
    renderer: 'tree',
    cases: [
      { label: 'Merge two sparse trees', frames: segMergeFrames() },
    ],
  },
  'tree-morris-traversal': {
    title: 'Morris In-Order Traversal (O(1) space)',
    renderer: 'tree',
    cases: [
      { label: 'Thread · follow · unthread', frames: morrisFrames() },
    ],
  },
  'tree-iterative-traversals': {
    title: 'Iterative Tree Traversals (stack-based)',
    renderer: 'tree',
    cases: [
      { label: 'Preorder (stack)', frames: preorderIterFrames() },
      { label: 'Inorder (stack)', frames: inorderIterFrames() },
      { label: 'Postorder (reverse preorder)', frames: postorderIterFrames() },
    ],
  },
  'euler-tour-flatten': {
    title: 'Euler Tour — Flatten Tree (tin / tout)',
    renderer: 'array',
    cases: [
      { label: 'DFS stamps + subtree slice', frames: eulerFrames() },
    ],
  },
  'trie': {
    title: 'Trie (Prefix Tree): insert · search',
    renderer: 'tree',
    cases: [
      { label: 'Insert car/cat/card · search', frames: trieFrames() },
    ],
  },
};
