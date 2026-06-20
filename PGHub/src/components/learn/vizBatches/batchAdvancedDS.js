// Concept-visualization batch: advanced / self-balancing data structures.
//
// Two renderer families are used (renderer is fixed per CONFIG, never mixed
// within a slug):
//
//   'tree'  — red-black-tree, splay-tree, treap-randomized-bst.
//             Frame shape mirrors batchAvlTrees.js: a recursive frame.tree of
//             { _id, value, left, right, state? } where state in
//             { 'current','visited','done','new','unbalanced','found','key' }
//             maps to a CSS class (TreeRenderer in AlgoVisualizer.jsx). Captions
//             narrate. For red-black we encode the colour into `value` as a
//             "10·B" / "5·R" suffix so the colour is visible without new state
//             classes; the structural emphasis still rides on `state`.
//
//   'array' — skip-list, union-find-data-structure, quickselect-deterministic,
//             heaps-median-from-stream. Frame shape mirrors batchBitwise.js:
//             { array, highlights?:{[i]:role}, pointers?:{[i]:label|label[]},
//               subRow?:{values,label}, eliminated?, caption }. Roles in
//             { 'current','match','pivot','done','visited','low','high','mid' }.
//
// Self-contained: no imports from conceptVisualizations.js. Pure JS, lint-clean.

// ===========================================================================
// Shared tree helpers (tree renderer)
// ===========================================================================
let _nid = 0;
function nid() { return ++_nid; }
function tnode(value, state) { return { _id: nid(), value, left: null, right: null, state }; }
// Deep-clone preserving _id so the renderer keeps node identity across frames.
function tclone(n) {
  if (!n) return null;
  return { _id: n._id, value: n.value, state: n.state, left: tclone(n.left), right: tclone(n.right) };
}
// Re-paint a tree: strip all state, then apply a map of _id -> state.
function tpaint(n, states) {
  if (!n) return null;
  const st = states && states[n._id];
  return { _id: n._id, value: n.value, state: st, left: tpaint(n.left, states), right: tpaint(n.right, states) };
}

// ===========================================================================
// red-black-tree — insert as red, restore the 5 invariants via recolor/rotate.
// value is encoded "<key>·<R|B>" so the colour is visible in the node circle.
// ===========================================================================
function rbLabel(key, color) { return `${key}·${color}`; }

function rbInsertRecolorFrames() {
  _nid = 0;
  const frames = [];
  // Build: insert 10,20,30 — 30 triggers a right-right rotation+recolor.
  const root = tnode(rbLabel(10, 'B'));
  frames.push({
    tree: tclone(root),
    caption: 'Red-black invariants: (1) every node red or black, (2) root black, (3) null leaves black, (4) no red node has a red child, (5) every root-to-leaf path crosses the same number of black nodes. Insert 10 — the first node becomes the black root.',
  });
  root.right = tnode(rbLabel(20, 'R'));
  frames.push({
    tree: tpaint(root, { [root.right._id]: 'new' }),
    caption: 'Insert 20: new nodes are always RED so the black-height (rule 5) is never disturbed on the way down. 20 is a red right child of black 10 — no red-red conflict, nothing to fix.',
  });
  // Insert 30 red under 20 -> red-red (20R, 30R). Uncle is null (black) -> rotate.
  root.right.right = tnode(rbLabel(30, 'R'));
  frames.push({
    tree: tpaint(root, { [root.right._id]: 'unbalanced', [root.right.right._id]: 'new' }),
    caption: 'Insert 30 as a red child of 20. Now 20 (red) has a red child 30 — rule 4 broken (red-red). The uncle (10’s left child) is a null leaf, i.e. BLACK, so recoloring alone cannot fix it: we must ROTATE.',
  });
  frames.push({
    tree: tpaint(root, { [root._id]: 'key', [root.right._id]: 'unbalanced' }),
    caption: 'Black uncle, right-right shape (z and its parent are both right children). Left-rotate the grandparent 10 about its red child 20, then swap the colours of 10 and 20. This is the mirror of the AVL RR rotation, plus a recolour.',
  });
  // After left rotation about 10: 20 becomes root (black), 10 left (red), 30 right (red).
  const r2 = tnode(rbLabel(20, 'B'));
  r2.left = tnode(rbLabel(10, 'R'));
  r2.right = tnode(rbLabel(30, 'R'));
  frames.push({
    tree: tpaint(r2, { [r2._id]: 'done' }),
    caption: '20 rises to the root and is painted BLACK; 10 and 30 become red children. Every path now crosses exactly one black node (20) — rule 5 holds, no red-red pair remains. Balanced in one rotation.',
  });
  // Insert 15 red under 10's right -> 10R has red child 15R, uncle 30 is RED -> recolor.
  const r3 = tclone(r2);
  r3.left.right = tnode(rbLabel(15, 'R'));
  frames.push({
    tree: tpaint(r3, { [r3.left._id]: 'unbalanced', [r3.left.right._id]: 'new' }),
    caption: 'Insert 15 (10 < 15 < 20): it lands as a red right child of red 10 — another red-red violation. But this time the UNCLE 30 is also RED, so we take the cheap path: RECOLOR, no rotation.',
  });
  frames.push({
    tree: tpaint(r3, { [r3.left._id]: 'key', [r3.right._id]: 'key', [r3._id]: 'current' }),
    caption: 'Red-uncle case: paint the parent 10 and the uncle 30 BLACK, and the grandparent 20 RED. This pushes the extra black down one level evenly, so every path keeps the same black count.',
  });
  // recolored result: 20 R (but it's root -> must be black), 10 B, 30 B, 15 R
  const r4 = tclone(r3);
  r4.value = rbLabel(20, 'B');
  r4.left.value = rbLabel(10, 'B');
  r4.right.value = rbLabel(30, 'B');
  frames.push({
    tree: tpaint(r4, { [r4._id]: 'unbalanced' }),
    caption: 'Recoloring made the grandparent 20 red — but 20 is the ROOT, and rule 2 says the root must be black. Recursing upward, we simply repaint the root black. (Painting the root black never breaks rule 5 — it adds one black to every path equally.)',
  });
  r4.value = rbLabel(20, 'B');
  frames.push({
    tree: tpaint(r4, { [r4._id]: 'done' }),
    caption: 'Final tree: root 20 black, 10 and 30 black, 15 red. All five invariants hold again, so the longest path is at most twice the shortest — search, insert, delete stay O(log n) worst case.',
  });
  frames.push({
    tree: tpaint(r4, {}),
    caption: 'Takeaway: insert red, then walk up. Red uncle → recolour and recurse on the grandparent. Black uncle → rotate (LL/LR/RR/RL like AVL) and recolour. Red-black trees rotate less than AVL, which is why TreeMap, std::map and the Linux CFS scheduler use them.',
  });
  return frames;
}

function rbSortedInsertFrames() {
  _nid = 0;
  const frames = [];
  // Insert 1,2,3,4,5 in sorted order; a plain BST would skew, RB stays balanced.
  let root = tnode(rbLabel(1, 'B'));
  frames.push({
    tree: tclone(root),
    caption: 'Adversarial test: insert 1,2,3,4,5 in sorted order. A plain BST degenerates into a right-leaning chain of height 4 (O(n) search). Watch the red-black rotations keep the height at O(log n) instead.',
  });
  root.right = tnode(rbLabel(2, 'R'));
  frames.push({
    tree: tpaint(root, { [root.right._id]: 'new' }),
    caption: 'Insert 2 as a red right child of black 1 — no red-red conflict yet.',
  });
  // Insert 3 -> red-red on 2R-3R, black (null) uncle -> RR rotate about 1.
  root.right.right = tnode(rbLabel(3, 'R'));
  frames.push({
    tree: tpaint(root, { [root.right._id]: 'unbalanced', [root.right.right._id]: 'new' }),
    caption: 'Insert 3: red 2 now has red child 3 (rule 4 broken), uncle is a black null leaf → right-right rotation about 1, then recolour.',
  });
  let r = tnode(rbLabel(2, 'B'));
  r.left = tnode(rbLabel(1, 'R'));
  r.right = tnode(rbLabel(3, 'R'));
  frames.push({
    tree: tpaint(r, { [r._id]: 'done' }),
    caption: '2 rotates up to a black root with red children 1 and 3 — perfectly balanced, height 1. The sorted spine was straightened just like an AVL RR rotation.',
  });
  // Insert 4 -> under 3R, red-red, uncle 1 RED -> recolor.
  r.right.right = tnode(rbLabel(4, 'R'));
  frames.push({
    tree: tpaint(r, { [r.right._id]: 'unbalanced', [r.right.right._id]: 'new' }),
    caption: 'Insert 4 as red child of red 3 → red-red, but uncle 1 is RED. Recolour: parent 3 and uncle 1 black, grandparent 2 red (then root repainted black).',
  });
  r = tclone(r);
  r.value = rbLabel(2, 'B');
  r.left.value = rbLabel(1, 'B');
  r.right.value = rbLabel(3, 'B');
  frames.push({
    tree: tpaint(r, { [r.left._id]: 'key', [r.right._id]: 'key' }),
    caption: 'After recolouring: 1 and 3 black, 4 red. Black-height is now 2 on every path. No rotation was needed — the red uncle absorbed the violation.',
  });
  // Insert 5 -> under 4R, red-red, uncle (3's left = null) black -> RR rotate about 3.
  r.right.right.right = tnode(rbLabel(5, 'R'));
  frames.push({
    tree: tpaint(r, { [r.right.right._id]: 'unbalanced', [r.right.right.right._id]: 'new' }),
    caption: 'Insert 5 as red child of red 4 → red-red. Uncle (3’s left child) is a black null leaf → left-rotate about 3 and recolour, lifting 4 over 3 and 5.',
  });
  const fin = tnode(rbLabel(2, 'B'));
  fin.left = tnode(rbLabel(1, 'B'));
  fin.right = tnode(rbLabel(4, 'B'));
  fin.right.left = tnode(rbLabel(3, 'R'));
  fin.right.right = tnode(rbLabel(5, 'R'));
  frames.push({
    tree: tpaint(fin, { [fin.right._id]: 'done' }),
    caption: 'Final shape after all five sorted inserts: root 2 black, children 1 and 4 black, leaves 3 and 5 red. Height is 2, not 4 — the rotations defeated the worst-case input.',
  });
  frames.push({
    tree: tpaint(fin, {}),
    caption: 'A plain BST on 1..5 would be a 5-node chain; the red-black tree is a balanced height-2 tree. That is the entire value proposition: O(log n) worst case regardless of insertion order.',
  });
  frames.push({
    tree: tpaint(fin, { [fin._id]: 'key' }),
    caption: 'Verify the invariants on the final tree: root 2 is black (rule 2); no red node has a red child — 3 and 5 are red but their parents 4 and 4 are black (rule 4); and every root-to-null path crosses exactly two black nodes (rule 5).',
  });
  return frames;
}

// ===========================================================================
// splay-tree — bring an accessed node to the root via zig / zig-zig / zig-zag.
// ===========================================================================
// Rotations operate on a literal-id tree; we replay precomputed shapes so each
// frame highlights the node travelling toward the root.
function splayAccessFrames() {
  _nid = 0;
  const frames = [];
  // Tree:        5
  //            /   \
  //           3     8
  //          / \
  //         1   4
  // splay(1): zig-zig (1 left of 3, 3 left of 5).
  const n1 = tnode(1), n3 = tnode(3), n4 = tnode(4), n5 = tnode(5), n8 = tnode(8);
  n3.left = n1; n3.right = n4;
  n5.left = n3; n5.right = n8;
  let root = n5;
  frames.push({
    tree: tclone(root),
    caption: 'Splay tree: after touching a key, ROTATE it to the root so the next access to it is O(1). No colours, no heights, no balance factors — just rotations on the access path. Goal: splay(1) to the top.',
  });
  frames.push({
    tree: tpaint(root, { [n1._id]: 'current', [n3._id]: 'visited', [n5._id]: 'visited' }),
    caption: 'Walk down to find 1: 1 < 5 go left, 1 < 3 go left, found 1 at depth 2. Note the relationship — 1 is the LEFT child of 3, and 3 is the LEFT child of 5. Same-direction grandparent link → this is a ZIG-ZIG case.',
  });
  frames.push({
    tree: tpaint(root, { [n1._id]: 'current', [n3._id]: 'key', [n5._id]: 'unbalanced' }),
    caption: 'Zig-zig rule (the clever part): rotate the GRANDPARENT 5 first, then the parent 3 — not the other way round. Two same-direction rotations both lift 1 AND flatten the spine, halving the depth of every ancestor.',
  });
  // After right-rotate(5): 3 becomes root, 1 left, 5 right, 4 stays as 3->? ; then right-rotate(3).
  // Final shape of zig-zig on left spine: 1 at root, right child 3, 3.right = 5, 5.left=4, 5.right=8.
  const r1 = tnode(1), r3 = tnode(3), r4 = tnode(4), r5 = tnode(5), r8 = tnode(8);
  r1.right = r3; r3.right = r5; r5.left = r4; r5.right = r8;
  root = r1;
  frames.push({
    tree: tpaint(root, { [r1._id]: 'done', [r3._id]: 'visited', [r5._id]: 'visited' }),
    caption: '1 is now the root. The former left spine 5-3-1 has been "rotated flat" into a right spine 1-3-5, so 3 dropped from depth 1 to 1 and 5 from depth 0 to 2 — the whole access path got shallower, which is what makes splaying amortized O(log n).',
  });
  frames.push({
    tree: tpaint(root, { [r1._id]: 'key' }),
    caption: 'Next time we access 1 it is already the root: O(1). This self-adjusting locality is why splay trees shine on skewed workloads (route caches, symbol tables) where a few keys dominate the access pattern.',
  });
  // Now splay(8): 8 is right of 5, 5 is right of 3, 3 is right of 1 -> deep, show zig-zig again then zig.
  frames.push({
    tree: tpaint(root, { [r8._id]: 'current', [r5._id]: 'visited', [r3._id]: 'visited', [r1._id]: 'visited' }),
    caption: 'Now access 8: walk right, right, right to depth 3. 8 is the right child of 5, and 5 is the right child of 3 → another ZIG-ZIG (both right-links), so rotate grandparent 3 then parent 5.',
  });
  // After zig-zig: 8's grandparent path collapses. Resulting (simplified) shape: 8 root, left=5, 5.left=3, 3.left=1, 5.right?
  const s8 = tnode(8), s5 = tnode(5), s3 = tnode(3), s1 = tnode(1), s4 = tnode(4);
  s8.left = s5; s5.left = s3; s3.left = s1; s1.right = s4;
  root = s8;
  frames.push({
    tree: tpaint(root, { [s8._id]: 'done' }),
    caption: '8 reaches the root. After this single splay the tree is again reshaped around the most recent access. Each splay is O(actual depth), but the amortized cost over any sequence is O(log n) per operation — Sleator and Tarjan’s guarantee.',
  });
  frames.push({
    tree: tpaint(root, { [s8._id]: 'key' }),
    caption: 'Three cases cover every shape: ZIG (parent is the root, single rotation), ZIG-ZIG (node and parent on the same side, rotate grandparent then parent), ZIG-ZAG (opposite sides, rotate parent then grandparent). You never measure subtree heights.',
  });
  frames.push({
    tree: tpaint(root, {}),
    caption: 'Splay trees give amortized O(log n) search/insert/delete with the simplest possible code: no balance metadata at all. The price is per-operation variance and the fact that even reads mutate the tree.',
  });
  frames.push({
    tree: tpaint(root, { [s8._id]: 'done', [s5._id]: 'visited' }),
    caption: 'Because every access reshapes the tree toward recently-used keys, splay trees adapt to the workload for free — frequently-touched keys drift near the root, achieving the "working-set" bound without any frequency counters.',
  });
  return frames;
}

function splayZigZagFrames() {
  _nid = 0;
  const frames = [];
  // Tree:      10
  //          /    \
  //         4      ...
  //          \
  //           6        splay(6): 6 right-of 4, 4 left-of 10 -> ZIG-ZAG
  const a4 = tnode(4), a6 = tnode(6), a10 = tnode(10), a14 = tnode(14);
  a4.right = a6; a10.left = a4; a10.right = a14;
  let root = a10;
  frames.push({
    tree: tclone(root),
    caption: 'Zig-zag case. Tree has 10 at the root, 4 as its left child, and 6 as the RIGHT child of 4. We splay 6 to the root.',
  });
  frames.push({
    tree: tpaint(root, { [a6._id]: 'current', [a4._id]: 'visited', [a10._id]: 'visited' }),
    caption: 'Locate 6: 6 < 10 go left to 4, 6 > 4 go right, found. The directions DIFFER — 6 is a right child but its parent 4 is a left child. That zig-then-zag pattern is the ZIG-ZAG case.',
  });
  frames.push({
    tree: tpaint(root, { [a6._id]: 'current', [a4._id]: 'key', [a10._id]: 'unbalanced' }),
    caption: 'Zig-zag rule: rotate the PARENT first (left-rotate 4 so 6 rises over it), then rotate the new grandparent (right-rotate 10). Two opposite-direction rotations pull 6 straight up between its old parent and grandparent.',
  });
  // After zig-zag: 6 root, left=4, right=10, 10.right=14.
  const b6 = tnode(6), b4 = tnode(4), b10 = tnode(10), b14 = tnode(14);
  b6.left = b4; b6.right = b10; b10.right = b14;
  root = b6;
  frames.push({
    tree: tpaint(root, { [b6._id]: 'done', [b4._id]: 'visited', [b10._id]: 'visited' }),
    caption: '6 is now the root, with 4 as its left child and 10 as its right child — the classic "lift the middle key" outcome, identical in spirit to the AVL left-right double rotation. Depths of 4 and 10 both shrank.',
  });
  frames.push({
    tree: tpaint(root, { [b6._id]: 'key' }),
    caption: 'Zig-zag versus zig-zig: same number of rotations (two), but the order and directions differ. Same side → grandparent-first (zig-zig); opposite sides → parent-first (zig-zag). Both halve the access-path depth.',
  });
  // Demonstrate the lone ZIG case: now splay 4 (child of the root 6).
  frames.push({
    tree: tpaint(root, { [b4._id]: 'current', [b6._id]: 'visited' }),
    caption: 'Now access 4, which sits directly under the root 6. When the node’s parent IS the root, there is no grandparent — this is the simple ZIG case: a single rotation finishes the job.',
  });
  // right-rotate(6): 4 becomes root, 6 right child, 10 stays under 6.
  const c4 = tnode(4), c6 = tnode(6), c10 = tnode(10), c14 = tnode(14);
  c4.right = c6; c6.right = c10; c10.right = c14;
  frames.push({
    tree: tpaint(c4, { [c4._id]: 'done', [c6._id]: 'visited' }),
    caption: 'Single right-rotation about 6: node 4 becomes the root, 6 its right child. ZIG is used at most once per splay — only when the node ends up one level below the root after the double rotations.',
  });
  frames.push({
    tree: tpaint(c4, { [c4._id]: 'key', [c6._id]: 'visited' }),
    caption: 'With 4 splayed to the root, the next access to 4 costs O(1), and 6, 10, 14 hang off to the right in BST order. Notice no balance metadata was ever read or written — the tree self-adjusts purely through rotations.',
  });
  frames.push({
    tree: tpaint(c4, { [c4._id]: 'key' }),
    caption: 'Three cases, fully covered: ZIG (one rotation, parent is root), ZIG-ZIG (two same-direction rotations, grandparent first), ZIG-ZAG (two opposite rotations, parent first). Every splay is a chain of these until the node reaches the top.',
  });
  frames.push({
    tree: tpaint(c4, {}),
    caption: 'Whatever the shape, repeated splay steps march the accessed node to the root two levels at a time, and the amortized analysis (potential = sum of log subtree sizes) turns that into O(log n) per operation.',
  });
  return frames;
}

// ===========================================================================
// treap-randomized-bst — BST on key, max-heap on random priority; rotations
// restore the heap order after a BST insert.
// ===========================================================================
function treapLabel(key, pri) { return `${key}·p${pri}`; }

function treapInsertFrames() {
  _nid = 0;
  const frames = [];
  // Insert 5(p50), 3(p90), 8(p30), 1(p20), 7(p60) — heap on priority (max at root).
  // 5 p50:
  let root = tnode(treapLabel(5, 50));
  frames.push({
    tree: tclone(root),
    caption: 'Treap = tree + heap. Each node carries a KEY (obeys BST order, left < node < right) and a random PRIORITY (obeys MAX-heap order, parent priority ≥ child). The shape depends only on the priorities, so random priorities make the tree behave like a randomly-built BST: expected O(log n) height.',
  });
  // Insert 3 p90: BST left of 5; but p90 > p50 -> rotate right so 3 becomes parent.
  let r = tclone(root);
  r.left = tnode(treapLabel(3, 90));
  frames.push({
    tree: tpaint(r, { [r.left._id]: 'new', [r._id]: 'unbalanced' }),
    caption: 'Insert key 3 (priority 90). BST step: 3 < 5 so it attaches as 5’s left child. But heap rule is broken — child priority 90 > parent priority 50. Fix with a rotation that lifts the higher-priority node.',
  });
  // right-rotate about 5: 3 becomes root, 5 its right child.
  let t3 = tnode(treapLabel(3, 90)); t3.right = tnode(treapLabel(5, 50));
  root = t3;
  frames.push({
    tree: tpaint(root, { [root._id]: 'done', [root.right._id]: 'visited' }),
    caption: 'Right-rotate about 5: node 3 (p90) rises to the root, 5 (p50) becomes its right child. BST order still holds (3 < 5), and now priorities are heap-ordered (90 ≥ 50). One rotation per heap violation.',
  });
  // Insert 8 p30: BST right of 5; p30 < p50 -> no rotation.
  root = tclone(root);
  root.right.right = tnode(treapLabel(8, 30));
  frames.push({
    tree: tpaint(root, { [root.right.right._id]: 'new' }),
    caption: 'Insert key 8 (priority 30): 8 > 3 go right, 8 > 5 go right → right child of 5. Its priority 30 < parent 50, so the heap rule already holds — no rotation needed.',
  });
  // Insert 1 p20: BST left of 3; p20 < p90 -> no rotation.
  root = tclone(root);
  root.left = tnode(treapLabel(1, 20));
  frames.push({
    tree: tpaint(root, { [root.left._id]: 'new' }),
    caption: 'Insert key 1 (priority 20): 1 < 3 → left child of root. Priority 20 < 90, heap rule holds, no rotation. Low-priority nodes naturally sink toward the leaves.',
  });
  // Insert 7 p60: BST 7>3 right to 5, 7>5 right to 8, 7<8 left of 8. p60 > p30 -> rotate.
  root = tclone(root);
  root.right.right.left = tnode(treapLabel(7, 60));
  frames.push({
    tree: tpaint(root, { [root.right.right.left._id]: 'new', [root.right.right._id]: 'unbalanced' }),
    caption: 'Insert key 7 (priority 60): 7 > 3 right, 7 > 5 right, 7 < 8 left → left child of 8. Heap broken: child 60 > parent 30. Right-rotate about 8 to lift 7 above it.',
  });
  // right-rotate about 8: 7 becomes parent, 8 its right child. 7 is right child of 5.
  const fin = tclone(root);
  // Rebuild the 5-subtree: 5.right was 8(p30) with left 7(p60). After rotation 5.right = 7(p60), 7.right = 8(p30).
  // Locate node 5 (root.right) and rewrite.
  const five = fin.right;
  const seven = tnode(treapLabel(7, 60));
  const eight = tnode(treapLabel(8, 30));
  seven.right = eight;
  five.right = seven;
  frames.push({
    tree: tpaint(fin, { [seven._id]: 'done', [eight._id]: 'visited' }),
    caption: '7 (p60) rises over 8 (p30): now 7 is 5’s right child and 8 is 7’s right child. BST order intact (5 < 7 < 8), heap order restored (60 ≥ 30). Every insert is one BST descent plus a bubble-up of rotations.',
  });
  frames.push({
    tree: tpaint(fin, {}),
    caption: 'Final treap: read keys in-order and you get 1,3,5,7,8 (a valid BST); read priorities top-down and they only decrease (a valid max-heap). The two orders together fix the shape uniquely.',
  });
  frames.push({
    tree: tpaint(fin, { [fin._id]: 'key' }),
    caption: 'Why it works: assigning random priorities is equivalent to inserting the keys in a random order, the textbook setting for expected O(log n) height. split and merge (the treap’s two core ops) make set union, ranked select, and order-statistics easy — for a tiny constant-factor cost over an AVL or red-black tree.',
  });
  frames.push({
    tree: tpaint(fin, {}),
    caption: 'Double-check both orders on the final treap: in-order keys are 1, 3, 5, 7, 8 (strictly increasing → valid BST) and top-down priorities 90, then 20 and 50, then 60, then 30 never increase toward the leaves (→ valid max-heap). Those two constraints pin the shape uniquely, independent of insertion order.',
  });
  return frames;
}

function treapSplitMergeFrames() {
  _nid = 0;
  const frames = [];
  // Treap with keys 1,3,5,7,8 (from above). split at k=6.
  const r3 = tnode(treapLabel(3, 90));
  const r1 = tnode(treapLabel(1, 20));
  const r5 = tnode(treapLabel(5, 50));
  const r7 = tnode(treapLabel(7, 60));
  const r8 = tnode(treapLabel(8, 30));
  r3.left = r1; r3.right = r5; r5.right = r7; r7.right = r8;
  const root = r3;
  frames.push({
    tree: tclone(root),
    caption: 'split(treap, k=6): partition into a left treap with all keys ≤ 6 and a right treap with all keys > 6, each still a valid treap. Walk from the root comparing the key against 6.',
  });
  frames.push({
    tree: tpaint(root, { [r3._id]: 'current' }),
    caption: 'At root 3: 3 ≤ 6, so 3 and its whole left subtree (key 1) belong to the LEFT result. Recurse into 3’s right child to keep splitting the larger keys.',
  });
  frames.push({
    tree: tpaint(root, { [r3._id]: 'visited', [r5._id]: 'current' }),
    caption: 'At 5: 5 ≤ 6 → 5 joins the left side too. Recurse right into 7.',
  });
  frames.push({
    tree: tpaint(root, { [r3._id]: 'visited', [r5._id]: 'visited', [r7._id]: 'current' }),
    caption: 'At 7: 7 > 6 → 7 and its right subtree (key 8) go to the RIGHT result. The recursion stitches the pieces back into two treaps as it unwinds.',
  });
  // Left treap: 3 root, left 1, right 5.
  const lroot = tnode(treapLabel(3, 90));
  lroot.left = tnode(treapLabel(1, 20));
  lroot.right = tnode(treapLabel(5, 50));
  frames.push({
    tree: tpaint(lroot, { [lroot._id]: 'done' }),
    caption: 'Left treap (keys ≤ 6): {1, 3, 5}, rooted at 3 (priority 90 is still the max here). Heap and BST order both preserved — split never breaks the treap invariants.',
  });
  const rroot = tnode(treapLabel(7, 60));
  rroot.right = tnode(treapLabel(8, 30));
  frames.push({
    tree: tpaint(rroot, { [rroot._id]: 'done' }),
    caption: 'Right treap (keys > 6): {7, 8}, rooted at 7 (priority 60). Two clean treaps in O(log n) expected time — this single primitive powers insert, delete, range-extract and set union.',
  });
  // merge back
  frames.push({
    tree: tpaint(lroot, { [lroot._id]: 'key' }),
    caption: 'merge(L, R) is the inverse, valid only when every key in L < every key in R (true here: 5 < 7). Compare the two roots’ priorities: 90 (L) vs 60 (R). The higher-priority root wins the merged root → 3 stays on top.',
  });
  const merged = tnode(treapLabel(3, 90));
  merged.left = tnode(treapLabel(1, 20));
  merged.right = tnode(treapLabel(5, 50));
  merged.right.right = tnode(treapLabel(7, 60));
  merged.right.right.right = tnode(treapLabel(8, 30));
  frames.push({
    tree: tpaint(merged, { [merged._id]: 'done' }),
    caption: 'Since 3 (p90) outranks 7 (p60), 3 becomes the merged root; we recursively merge L’s right subtree with R. The result re-forms the original treap {1,3,5,7,8} with heap order intact.',
  });
  frames.push({
    tree: tpaint(merged, {}),
    caption: 'split + merge are the whole treap toolkit: delete(k) = split out k then merge the neighbours; insert(k) = split at k then merge with a singleton; range ops slice the tree in O(log n). Random priorities keep every one of these expected-logarithmic.',
  });
  frames.push({
    tree: tpaint(merged, { [merged.right._id]: 'visited' }),
    caption: 'Both split and merge are single recursive descents down one root-to-leaf path, so each is O(height) = expected O(log n). That is why treaps are a favourite for competitive programming: implicit treaps even support O(log n) array insert/erase/reverse by keying on position instead of value.',
  });
  return frames;
}

// ===========================================================================
// skip-list — multi-level express lanes; search drops down level by level.
// Array renderer: one cell per sorted key; the subRow shows the highest level
// each key reaches; pointers mark the search cursor; highlights mark the path.
// ===========================================================================
function skipListSearchFrames(target = 10) {
  // Sorted keys and their tower heights (level reached), matching the lesson.
  const keys = [1, 4, 6, 8, 10, 12, 14];
  const levels = [3, 1, 1, 2, 1, 2, 1]; // height of each tower (>=1)
  const maxLevel = Math.max(...levels);
  const frames = [];
  const levelRow = keys.map((k, i) => 'L'.repeat(levels[i]) || 'L'); // textual tower
  const towerStr = keys.map((k, i) => `${k}@${levels[i]}`);
  void levelRow;

  frames.push({
    array: keys,
    subRow: { values: keys.map((k, i) => 'h' + levels[i]), label: 'tower' },
    caption: `Skip list: a sorted list (level 0) plus express lanes above it. Tower height per key (h): ${towerStr.join('  ')}. Higher lanes skip more keys, so search is O(log n) instead of O(n) — and heights are chosen by coin flips, no rebalancing.`,
  });
  frames.push({
    array: keys,
    subRow: { values: keys.map((k, i) => 'h' + levels[i]), label: 'tower' },
    highlights: { 0: 'visited' },
    pointers: { 0: 'cur' },
    caption: `Search for ${target}. Start at the head, on the TOP level ${maxLevel} (the tallest tower, key 1). On each level, move right while the next key ≤ target; when the next would overshoot, drop down one level.`,
  });

  // Simulate the level-by-level search starting at the leftmost tall tower.
  let pos = 0; // index of current node (start at key with max level)
  // ensure we start at a node that reaches maxLevel (key 1 does)
  for (let lvl = maxLevel; lvl >= 1; lvl--) {
    // On this level, advance right while next node exists at this level and <= target.
    frames.push({
      array: keys,
      subRow: { values: keys.map((k, i) => (levels[i] >= lvl ? 'h' + levels[i] : '·')), label: `level ${lvl}` },
      highlights: { [pos]: 'current' },
      pointers: { [pos]: 'cur' },
      caption: `Now scanning express LEVEL ${lvl}. Only keys whose tower reaches level ${lvl} are visible here (the rest show ·). Cursor sits on key ${keys[pos]}; look rightward for the next node present on this level.`,
    });
    let advanced = false;
    let next = pos + 1;
    while (next < keys.length) {
      if (levels[next] >= lvl && keys[next] <= target) {
        // move to next on this level
        frames.push({
          array: keys,
          subRow: { values: keys.map((k, i) => (levels[i] >= lvl ? 'h' + levels[i] : '·')), label: `level ${lvl}` },
          highlights: { [pos]: 'visited', [next]: 'current' },
          pointers: { [next]: 'cur' },
          caption: `Key ${keys[next]} ≤ ${target}, so hop right to it on level ${lvl} — skipping over ${next - pos - 1} lower-level key(s) in one stride. That skip is exactly where the O(log n) comes from.`,
        });
        pos = next;
        next = pos + 1;
        advanced = true;
        if (keys[pos] === target) break;
      } else {
        // next overshoots or isn't on this level
        break;
      }
    }
    if (keys[pos] === target) {
      frames.push({
        array: keys,
        subRow: { values: keys.map((k, i) => 'h' + levels[i]), label: 'tower' },
        highlights: { [pos]: 'done' },
        pointers: { [pos]: 'found' },
        caption: `Found ${target} at index ${pos}. The search walked down the level pyramid, taking long hops on high lanes and short ones near the bottom.`,
      });
      return frames;
    }
    if (lvl > 1) {
      frames.push({
        array: keys,
        subRow: { values: keys.map((k, i) => (levels[i] >= lvl - 1 ? 'h' + levels[i] : '·')), label: `drop to ${lvl - 1}` },
        highlights: { [pos]: 'pivot' },
        pointers: { [pos]: 'cur' },
        caption: `The next key on level ${lvl} would overshoot ${target}${advanced ? '' : ' (or no further node exists on this lane)'}. Drop DOWN to level ${lvl - 1} from key ${keys[pos]} and resume scanning right.`,
      });
    }
  }
  // Reached level 1 (base). Final check.
  const idx = keys.indexOf(target);
  if (idx >= 0) {
    frames.push({
      array: keys,
      subRow: { values: keys.map((k, i) => 'h' + levels[i]), label: 'tower' },
      highlights: { [idx]: 'done' },
      pointers: { [idx]: 'found' },
      caption: `On the base level, one more hop lands exactly on ${target} at index ${idx}. Total: a handful of hops instead of a full linear scan.`,
    });
  } else {
    frames.push({
      array: keys,
      subRow: { values: keys.map((k, i) => 'h' + levels[i]), label: 'tower' },
      highlights: { [pos]: 'pivot' },
      pointers: { [pos]: 'cur' },
      caption: `Base level reached and the next key exceeds ${target}: ${target} is NOT in the list. The cursor stopped at key ${keys[pos]}, its in-order predecessor.`,
    });
  }
  frames.push({
    array: keys,
    subRow: { values: keys.map((k, i) => 'h' + levels[i]), label: 'tower' },
    caption: 'Each tower’s height comes from a coin flip: level 1 always, level 2 with prob 1/2, level 3 with 1/4, etc. Expected height O(log n), expected search/insert/delete O(log n) — all with no explicit rebalancing, just randomization.',
  });
  return frames;
}

// ===========================================================================
// union-find — find with path compression + union by rank.
// Array renderer: cell = parent[i]; subRow = rank; pointers/highlights mark the
// walk and the merge.
// ===========================================================================
function unionFindFrames() {
  const n = 6;
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);
  const frames = [];
  const snapshot = (caption, highlights = {}, pointers = {}) => {
    frames.push({
      array: parent.slice(),
      subRow: { values: rank.slice().map(String), label: 'rank' },
      highlights: { ...highlights },
      pointers: { ...pointers },
      caption,
    });
  };

  snapshot('Union-Find on {0..5}. Each cell holds parent[i]; a node whose parent is itself is a ROOT (set representative). rank[] (below) bounds tree height. Initially every element is its own singleton set: parent[i] = i.');

  // find with path compression (halving), returns root and records path.
  const find = (x) => {
    const path = [];
    let r = x;
    while (parent[r] !== r) { path.push(r); r = parent[r]; }
    // path-halving compression
    for (const p of path) parent[p] = r;
    return { root: r, path };
  };
  const union = (a, b, captionPrefix) => {
    const ra = find(a).root;
    const rb = find(b).root;
    if (ra === rb) { snapshot(`${captionPrefix} find(${a})=${ra}, find(${b})=${rb} — already in the same set, nothing to merge.`); return; }
    if (rank[ra] < rank[rb]) {
      parent[ra] = rb;
      snapshot(`${captionPrefix} roots ${ra} (rank ${rank[ra]}) and ${rb} (rank ${rank[rb]}). Union by rank: attach the SHORTER tree (${ra}) under the taller (${rb}). Taller tree’s depth is unchanged.`, { [ra]: 'pivot', [rb]: 'done' }, { [rb]: 'root' });
    } else if (rank[ra] > rank[rb]) {
      parent[rb] = ra;
      snapshot(`${captionPrefix} roots ${ra} (rank ${rank[ra]}) and ${rb} (rank ${rank[rb]}). Attach shorter ${rb} under taller ${ra}.`, { [rb]: 'pivot', [ra]: 'done' }, { [ra]: 'root' });
    } else {
      parent[rb] = ra;
      rank[ra] += 1;
      snapshot(`${captionPrefix} roots ${ra} and ${rb} have EQUAL rank ${rank[rb]}. Tie-break: attach ${rb} under ${ra} and bump ${ra}’s rank to ${rank[ra]} — the only time rank ever increases.`, { [rb]: 'pivot', [ra]: 'done' }, { [ra]: 'root' });
    }
  };

  union(0, 1, 'union(0,1):');
  union(2, 3, 'union(2,3):');
  union(4, 5, 'union(4,5):');
  union(0, 2, 'union(0,2):');

  // Demonstrate find(3) with path compression — first show the walk.
  {
    const path = [];
    let r = 3;
    while (parent[r] !== r) { path.push(r); r = parent[r]; }
    const hl = {};
    for (const p of path) hl[p] = 'visited';
    hl[r] = 'current';
    frames.push({
      array: parent.slice(),
      subRow: { values: rank.slice().map(String), label: 'rank' },
      highlights: hl,
      pointers: { [r]: 'root', 3: 'x' },
      caption: `find(3): follow parent pointers 3 → ${parent[3]} → ${r} until we reach the self-looping root ${r}. The visited chain is the find PATH whose length is the cost of this query.`,
    });
    // apply full path compression: point every node on the path directly at root.
    for (const p of path) parent[p] = r;
    const hl2 = {};
    for (const p of path) hl2[p] = 'done';
    hl2[r] = 'current';
    frames.push({
      array: parent.slice(),
      subRow: { values: rank.slice().map(String), label: 'rank' },
      highlights: hl2,
      pointers: { [r]: 'root' },
      caption: `Path compression: rewrite every node on the path to point STRAIGHT at root ${r}. parent[3] and parent[2] now equal ${r}, so the next find on either is O(1). This is the trick that flattens the trees over time.`,
    });
  }

  union(3, 5, 'union(3,5):');

  // Final connectivity query.
  {
    const a = 1, b = 5;
    const ra = find(a).root;
    const rb = find(b).root;
    frames.push({
      array: parent.slice(),
      subRow: { values: rank.slice().map(String), label: 'rank' },
      highlights: { [a]: 'match', [b]: 'match', [ra]: 'done' },
      pointers: { [ra]: 'root' },
      caption: `connected(${a},${b})? find(${a}) = ${ra}, find(${b}) = ${rb}. Same root → they are in the same set. After path compression, almost every node points directly at root ${ra}.`,
    });
  }
  frames.push({
    array: parent.slice(),
    subRow: { values: rank.slice().map(String), label: 'rank' },
    caption: 'Union by rank keeps trees O(log n) deep; path compression flattens them on every find. Together they give Tarjan’s O(m · α(n)) bound — α is the inverse Ackermann function, ≤ 4 for any input you will ever see, so each operation is effectively O(1).',
  });
  return frames;
}

function unionFindChainFrames() {
  // Deliberately build a long parent chain (no rank balancing), then show a
  // no-op union and a single find that path-compresses the whole chain flat.
  const n = 6;
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);
  const frames = [];
  const snapshot = (caption, highlights = {}, pointers = {}) => {
    frames.push({
      array: parent.slice(),
      subRow: { values: rank.slice().map(String), label: 'rank' },
      highlights: { ...highlights },
      pointers: { ...pointers },
      caption,
    });
  };

  snapshot('Worst-case shape: a degenerate CHAIN. Suppose unions were done so each node points at the next, building 5 → 4 → 3 → 2 → 1 → 0. This is what union WITHOUT balancing produces; we use it to spotlight what path compression fixes.');

  // Hand-build the chain 5->4->3->2->1->0 so a find walk is maximally long.
  for (let i = n - 1; i >= 1; i--) {
    parent[i] = i - 1;
    snapshot(`Link node ${i} under ${i - 1}: parent[${i}] = ${i - 1}. The tree is now one long stalk with root 0 at the bottom — every deeper node sits one extra hop from the root.`, { [i]: 'pivot', [i - 1]: 'done' }, { 0: 'root' });
  }

  // find with full path compression, recording the walk.
  const findCompress = (x) => {
    const path = [];
    let r = x;
    while (parent[r] !== r) { path.push(r); r = parent[r]; }
    return { root: r, path };
  };

  // No-op union: 2 and 5 already share root 0.
  {
    const ra = findCompress(2).root;
    const rb = findCompress(5).root;
    snapshot(`union(2,5): find(2)=${ra}, find(5)=${rb} — both already resolve to root 0, so they are already in the same set. Union is a NO-OP; we touch nothing. (Detecting "already connected" is the cycle-test cycle-detection relies on.)`, { 2: 'match', 5: 'match', 0: 'done' }, { 0: 'root' });
  }

  // find(5): show the long walk first.
  {
    const { root, path } = findCompress(5);
    const hl = {};
    for (const p of path) hl[p] = 'visited';
    hl[root] = 'current';
    frames.push({
      array: parent.slice(),
      subRow: { values: rank.slice().map(String), label: 'rank' },
      highlights: hl,
      pointers: { [root]: 'root', 5: 'x' },
      caption: `find(5): walk the full chain 5 → 4 → 3 → 2 → 1 → 0 — five hops to reach root ${root}. On an unbalanced chain a single query costs O(n); this is exactly the cost we want to amortize away.`,
    });
    // apply full path compression: every node on the path points straight at root.
    for (const p of path) parent[p] = root;
    const hl2 = {};
    for (const p of path) hl2[p] = 'done';
    hl2[root] = 'current';
    frames.push({
      array: parent.slice(),
      subRow: { values: rank.slice().map(String), label: 'rank' },
      highlights: hl2,
      pointers: { [root]: 'root' },
      caption: `Path compression: rewrite parent[5], parent[4], parent[3], parent[2], parent[1] to point STRAIGHT at root ${root}. The 5-deep stalk collapses into a flat star in one pass — every future find on these nodes is now O(1).`,
    });
  }

  // Second find proves the flattening stuck.
  {
    const { root, path } = findCompress(4);
    frames.push({
      array: parent.slice(),
      subRow: { values: rank.slice().map(String), label: 'rank' },
      highlights: { 4: 'match', [root]: 'done' },
      pointers: { [root]: 'root', 4: 'x' },
      caption: `find(4) again: parent[4] already equals root ${root}, so the walk is a single hop (${path.length} step). The earlier compression paid for itself — the amortized cost of a find drops toward O(α(n)) even though one unlucky query was O(n).`,
    });
  }

  frames.push({
    array: parent.slice(),
    subRow: { values: rank.slice().map(String), label: 'rank' },
    caption: 'Lesson: an unbalanced chain makes a single find O(n), but path compression flattens it permanently, so the cost is spread across all the queries that follow. This is why path compression alone (even without union by rank) already gives near-constant amortized finds.',
  });
  return frames;
}

// ===========================================================================
// quickselect-deterministic — partition narrowing to the kth, median-of-medians
// pivot. Array renderer: cells = values, pivot/partition highlighted, pointers
// mark lo/hi and the kth target.
// ===========================================================================
function partition(arr, lo, hi, pivotVal) {
  // Lomuto-style partition around the value pivotVal (assumed present in [lo,hi]).
  // Move pivot to end first.
  let pivIdx = lo;
  for (let i = lo; i <= hi; i++) if (arr[i] === pivotVal) { pivIdx = i; break; }
  [arr[pivIdx], arr[hi]] = [arr[hi], arr[pivIdx]];
  let store = lo;
  for (let i = lo; i < hi; i++) {
    if (arr[i] < pivotVal) { [arr[i], arr[store]] = [arr[store], arr[i]]; store++; }
  }
  [arr[store], arr[hi]] = [arr[hi], arr[store]];
  return store; // final index of the pivot
}

function quickselectMoMFrames(original = [7, 3, 9, 1, 4, 8, 2, 6, 5, 0, 12, 11, 14, 13, 10], k = 8) {
  // Find the k-th smallest (1-indexed k) using median-of-medians pivots.
  const arr = original.slice();
  const n = arr.length;
  const frames = [];

  frames.push({
    array: arr.slice(),
    caption: `Deterministic quickselect: find the k=${k}th smallest of ${n} values in GUARANTEED O(n). The danger with plain quickselect is a bad pivot (e.g. always the min) giving O(n²). Median-of-medians manufactures a provably good pivot in linear time.`,
  });

  // Median-of-medians pivot computation (illustrative, on the initial array).
  const groups = [];
  for (let i = 0; i < n; i += 5) groups.push(arr.slice(i, i + 5));
  const medians = groups.map((g) => { const s = g.slice().sort((a, b) => a - b); return s[Math.floor((s.length - 1) / 2)]; });
  // highlight group medians in the original layout
  {
    const hl = {};
    let gi = 0;
    for (let i = 0; i < n; i += 5) {
      const g = arr.slice(i, i + 5);
      const s = g.slice().sort((a, b) => a - b);
      const med = s[Math.floor((s.length - 1) / 2)];
      const localIdx = g.indexOf(med);
      hl[i + localIdx] = 'match';
      gi++;
    }
    void gi;
    frames.push({
      array: arr.slice(),
      highlights: hl,
      caption: `Step 1: split into groups of 5: ${groups.map((g) => '[' + g.join(' ') + ']').join(' ')}. Take each group’s median by hand (constant work per group) → medians ${medians.join(', ')} (highlighted).`,
    });
  }
  const mom = (() => { const s = medians.slice().sort((a, b) => a - b); return s[Math.floor((s.length - 1) / 2)]; })();
  {
    const hl = {};
    const idx = arr.indexOf(mom);
    if (idx >= 0) hl[idx] = 'pivot';
    frames.push({
      array: arr.slice(),
      highlights: hl,
      caption: `Step 2: recursively select the MEDIAN of those medians → ${mom}. Guarantee: ${mom} exceeds 3 of every 5 elements in at least half the groups, so it is larger than ~3n/10 and smaller than ~3n/10 — the worst partition leaves ≤ 7n/10 on either side. That bound is what kills the O(n²) case.`,
    });
  }

  // Now run the actual selection loop using median-of-medians-ish pivots.
  // For clarity we use the computed `mom` as the first pivot, then fall back to
  // recomputing on each subrange.
  let lo = 0, hi = n - 1;
  const target = k - 1; // 0-indexed
  let guard = 0;
  let pivotVal = mom;
  while (lo < hi && guard < 12) {
    guard++;
    // pick pivot = median-of-medians of arr[lo..hi]
    if (guard > 1) {
      const sub = arr.slice(lo, hi + 1);
      const gs = [];
      for (let i = 0; i < sub.length; i += 5) gs.push(sub.slice(i, i + 5));
      const meds = gs.map((g) => { const s = g.slice().sort((a, b) => a - b); return s[Math.floor((s.length - 1) / 2)]; });
      const s2 = meds.slice().sort((a, b) => a - b);
      pivotVal = s2[Math.floor((s2.length - 1) / 2)];
    }
    const pivIdx0 = (() => { for (let i = lo; i <= hi; i++) if (arr[i] === pivotVal) return i; return lo; })();
    frames.push({
      array: arr.slice(),
      highlights: { [pivIdx0]: 'pivot' },
      pointers: { [lo]: 'lo', [hi]: 'hi', [target]: 'k' },
      caption: `Partition arr[${lo}..${hi}] around pivot ${pivotVal}. Everything smaller moves left of it, everything larger to the right; the pivot lands at its final sorted position. Looking for index k-1 = ${target}.`,
    });
    const p = partition(arr, lo, hi, pivotVal);
    // highlight: < pivot, pivot, > pivot
    const hl = {};
    for (let i = lo; i <= hi; i++) {
      if (i < p) hl[i] = 'visited';
      else if (i === p) hl[i] = 'pivot';
      else hl[i] = 'match';
    }
    frames.push({
      array: arr.slice(),
      highlights: hl,
      pointers: { [p]: 'piv', [target]: 'k' },
      caption: `Pivot ${pivotVal} settled at index ${p}. Left block (smaller) is "visited", right block (larger) is "match". Compare p=${p} with target ${target}: ${p === target ? 'EXACT hit.' : p < target ? 'target is to the RIGHT — recurse on the upper part, discard the left.' : 'target is to the LEFT — recurse on the lower part, discard the right.'}`,
    });
    if (p === target) { lo = hi = p; break; }
    if (p < target) lo = p + 1; else hi = p - 1;
  }
  const ans = arr[target];
  frames.push({
    array: arr.slice(),
    highlights: { [target]: 'done' },
    pointers: { [target]: 'k' },
    caption: `The ${k}th smallest value is ${ans} (now resting at index ${target}). Each round discards a constant fraction (≥ 3/10), giving T(n) = T(7n/10) + T(n/5) + O(n) = O(n) worst case — linear selection with no luck involved.`,
  });
  frames.push({
    array: arr.slice(),
    caption: 'Practical note: median-of-medians has a large constant factor, so production code (C++ nth_element, introselect) uses a RANDOM pivot for speed and only falls back to the deterministic pivot if recursion runs too deep. Same O(n) expected, better constants.',
  });
  return frames;
}

// ===========================================================================
// heaps-median-from-stream — two heaps (max-heap lo, min-heap hi) balanced.
// Array renderer: the array IS the live stream; subRow shows lo|hi contents;
// pointers mark the freshly inserted value; caption gives the running median.
// ===========================================================================
function medianStreamFrames(stream = [1, 5, 3, 8, 2, 4]) {
  const frames = [];
  const lo = []; // max-heap of the lower half (kept sorted desc; lo[0] = max)
  const hi = []; // min-heap of the upper half (kept sorted asc;  hi[0] = min)
  const seen = [];

  const loTop = () => (lo.length ? lo[0] : null);
  const hiTop = () => (hi.length ? hi[0] : null);
  const pushLo = (x) => { lo.push(x); lo.sort((a, b) => b - a); };
  const pushHi = (x) => { hi.push(x); hi.sort((a, b) => a - b); };
  const median = () => {
    if (lo.length === hi.length) return (loTop() + hiTop()) / 2;
    return loTop();
  };
  const heapsStr = () => `lo(max-heap)=[${lo.join(', ')}]  hi(min-heap)=[${hi.join(', ')}]`;

  frames.push({
    array: stream.slice(),
    subRow: { values: stream.map(() => '·'), label: 'unseen' },
    caption: `Running median of a stream with two heaps: a MAX-heap "lo" holds the smaller half (its top is the largest of the small side) and a MIN-heap "hi" holds the larger half (its top is the smallest of the large side). The median sits at the boundary between the two tops. Stream: [${stream.join(', ')}].`,
  });
  frames.push({
    array: stream.slice(),
    subRow: { values: stream.map(() => '·'), label: 'rules' },
    caption: 'Two invariants: (1) sizes balanced — |lo| equals |hi| or is exactly one larger; (2) every element of lo ≤ every element of hi. Insert rule: if x ≤ lo.top push to lo, else push to hi; then if sizes differ by more than one, move a top across to rebalance.',
  });

  for (let i = 0; i < stream.length; i++) {
    const x = stream[i];
    seen.push(x);
    const seenRow = stream.map((v, j) => (j <= i ? String(v) : '·'));
    // decide target heap (compare against lo's CURRENT top, before pushing)
    const prevLoTop = loTop();
    const target = (lo.length === 0 || x <= prevLoTop) ? 'lo' : 'hi';
    const reason = lo.length === 0
      ? 'lo is empty, so seed the lower half with it'
      : (target === 'lo'
        ? `${x} ≤ lo.top=${prevLoTop}, so it belongs in the lower half`
        : `${x} > lo.top=${prevLoTop}, so it belongs in the upper half`);
    if (target === 'lo') pushLo(x); else pushHi(x);
    frames.push({
      array: stream.slice(),
      subRow: { values: seenRow, label: 'stream' },
      highlights: { [i]: 'current' },
      pointers: { [i]: 'x' },
      caption: `Insert ${x}: ${reason} → push to ${target === 'lo' ? 'MAX-heap lo' : 'MIN-heap hi'}. ${heapsStr()}.`,
    });
    // rebalance if needed
    if (lo.length > hi.length + 1) {
      const moved = lo.shift(); // pop max of lo
      pushHi(moved);
      frames.push({
        array: stream.slice(),
        subRow: { values: seenRow, label: 'rebalance' },
        highlights: { [i]: 'pivot' },
        caption: `lo grew too big (|lo|=${lo.length + 1} > |hi|+1). Pop lo’s max ${moved} and push it onto hi to restore the size balance. ${heapsStr()}.`,
      });
    } else if (hi.length > lo.length + 1) {
      const moved = hi.shift(); // pop min of hi
      pushLo(moved);
      frames.push({
        array: stream.slice(),
        subRow: { values: seenRow, label: 'rebalance' },
        highlights: { [i]: 'pivot' },
        caption: `hi grew too big (|hi|=${hi.length + 1} > |lo|+1). Pop hi’s min ${moved} and push it onto lo to restore balance. ${heapsStr()}.`,
      });
    }
    const med = median();
    frames.push({
      array: stream.slice(),
      subRow: { values: seenRow, label: 'median' },
      highlights: { [i]: 'done' },
      caption: `After ${i + 1} value(s): ${heapsStr()}. ${lo.length === hi.length ? `Sizes equal → median is the average of the two tops (${loTop()} + ${hiTop()})/2 = ${med}.` : `lo is larger by one → median is lo’s top = ${med}.`}`,
    });
  }
  frames.push({
    array: stream.slice(),
    subRow: { values: stream.map(String), label: 'final' },
    caption: `All ${stream.length} values processed; final median = ${median()}. Each insert is O(log n) (one heap push plus an optional rebalance), and the median read is O(1) — far better than re-sorting the whole stream every query.`,
  });
  return frames;
}

// ===========================================================================
// Export map
// ===========================================================================
export default {
  'red-black-tree': {
    title: 'Red-Black Tree',
    renderer: 'tree',
    cases: [
      { label: 'Insert: recolor & rotate', frames: rbInsertRecolorFrames() },
      { label: 'Sorted input stays balanced', frames: rbSortedInsertFrames() },
    ],
  },
  'splay-tree': {
    title: 'Splay Tree',
    renderer: 'tree',
    cases: [
      { label: 'Splay to root (zig-zig)', frames: splayAccessFrames() },
      { label: 'Zig-zag case', frames: splayZigZagFrames() },
    ],
  },
  'treap-randomized-bst': {
    title: 'Treap (Randomized BST)',
    renderer: 'tree',
    cases: [
      { label: 'Insert: BST key + heap priority', frames: treapInsertFrames() },
      { label: 'split / merge', frames: treapSplitMergeFrames() },
    ],
  },
  'skip-list': {
    title: 'Skip List',
    renderer: 'array',
    cases: [
      { label: 'Search 10 (drop down lanes)', frames: skipListSearchFrames(10) },
      { label: 'Search 12', frames: skipListSearchFrames(12) },
    ],
  },
  'union-find-data-structure': {
    title: 'Union-Find (Disjoint Set)',
    renderer: 'array',
    cases: [
      { label: 'union by rank + path compression', frames: unionFindFrames() },
      { label: 'no-op union + chain flattening', frames: unionFindChainFrames() },
    ],
  },
  'quickselect-deterministic': {
    title: 'Deterministic Quickselect',
    renderer: 'array',
    cases: [
      { label: 'Median-of-medians select', frames: quickselectMoMFrames() },
      { label: 'Median of a duplicate-heavy array', frames: quickselectMoMFrames([5, 2, 5, 1, 5, 2, 3, 5, 1, 4, 5, 2, 5, 3, 5], 8) },
    ],
  },
  'heaps-median-from-stream': {
    title: 'Median from a Stream (Two Heaps)',
    renderer: 'array',
    cases: [
      { label: 'Stream [1,5,3,8,2,4]', frames: medianStreamFrames([1, 5, 3, 8, 2, 4]) },
      { label: 'Stream [6,10,2,6,5,0,6,3]', frames: medianStreamFrames([6, 10, 2, 6, 5, 0, 6, 3]) },
    ],
  },
};
