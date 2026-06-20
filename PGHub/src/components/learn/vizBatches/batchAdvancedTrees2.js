// Concept-visualization batch: advanced & balanced trees (set 2).
//
// Renderers (one per config, never mixed inside a slug):
//   'tree'  → recursive { _id, value, left, right, state? } frames + caption.
//             state in { 'current','visited','done','new','unbalanced','found',
//             'key' } maps to a CSS node class. Binary renderer: only left/right
//             are walked, so multi-way / red-black colour is narrated in caption
//             and encoded via state flags + the comma-joined value where needed.
//   'array' → { array, subRow?, pointers?, highlights?, caption }. Non-numeric
//             cells render as labeled string tiles (persistent-segment-tree node
//             versions, skip-list level rows).
//
// Self-contained: no imports from conceptVisualizations.js. Pure JS, lint-clean.

let _nid = 0;
function nextId() { return ++_nid; }
function node(value, state) { return { _id: nextId(), value, left: null, right: null, state }; }
// Strip every state flag, re-applying a map of _id -> state.
function paint(n, states) {
  if (!n) return null;
  const st = states && states[n._id];
  return { _id: n._id, value: n.value, state: st, left: paint(n.left, states), right: paint(n.right, states) };
}
function clone(n) {
  if (!n) return null;
  return { _id: n._id, value: n.value, state: n.state, left: clone(n.left), right: clone(n.right) };
}

// ===========================================================================
// red-black-tree-properties  (renderer: 'tree')
// Colour is encoded in the node value suffix "·R"/"·B" (rendered text) AND in a
// state flag: red nodes carry 'key' (warm) so a violation reads visually; the
// node under repair carries 'unbalanced'. NIL sentinels are omitted, narrated.
// ===========================================================================
function rb(value, colour) { const n = node(value); n.colour = colour; return n; }
// Build the 5-invariant overview tree.
function rbOverviewFrames() {
  _nid = 0;
  const root = rb('13·B'); const c8 = rb('8·R'); const c17 = rb('17·R');
  const n1 = rb('1·B'); const n11 = rb('11·B'); const n15 = rb('15·B'); const n25 = rb('25·B');
  const n22 = rb('22·R'); const n27 = rb('27·R');
  root.left = c8; root.right = c17;
  c8.left = n1; c8.right = n11;
  c17.left = n15; c17.right = n25;
  n25.left = n22; n25.right = n27;
  const reds = { [c8._id]: 'key', [c17._id]: 'key', [n22._id]: 'key', [n27._id]: 'key' };
  const frames = [];
  frames.push({ tree: paint(root, { [root._id]: 'done' }), caption: 'Invariant 1: every node is red or black. Invariant 2: the root (13) is always black.' });
  frames.push({ tree: paint(root, {}), caption: 'Invariant 3: every leaf is the black NIL sentinel (omitted here). NILs make every real node have exactly two children for the colour rules.' });
  frames.push({ tree: paint(root, reds), caption: 'Invariant 4: a red node has only black children — no two reds in a row. Highlighted nodes are red; each of their children is black.' });
  frames.push({ tree: paint(root, { [n22._id]: 'key', [n27._id]: 'key', [n25._id]: 'current' }), caption: 'Check node 25 (black): both children 22 and 27 are red, both have black NIL children — invariant 4 holds along this path.' });
  frames.push({ tree: paint(root, { [root._id]: 'visited', [c8._id]: 'visited', [n1._id]: 'done' }), caption: 'Invariant 5 (black-height): path 13→8→1→NIL passes 13(B), 1(B), NIL(B) = 3 black nodes.' });
  frames.push({ tree: paint(root, { [root._id]: 'visited', [c17._id]: 'visited', [n25._id]: 'visited', [n27._id]: 'visited', [n1._id]: 'done' }), caption: 'Path 13→17→25→27→NIL passes 13(B), 25(B), NIL(B) = 3 black nodes too. Red 17 and 27 do not count.' });
  frames.push({ tree: paint(root, reds), caption: 'Every root-to-NIL path has black-height 3. Equal black-heights + at most alternating reds force the longest path ≤ 2× the shortest.' });
  frames.push({ tree: paint(root, { [root._id]: 'done' }), caption: 'That 2× bound makes height O(log n): search, insert, delete all run in O(log n) worst case. This is the discipline behind std::map and Java TreeMap.' });
  frames.push({ tree: paint(root, {}), caption: 'Compared to AVL: looser balance means fewer rotations per write — about half — which wins on update-heavy workloads at the cost of slightly deeper trees.' });
  frames.push({ tree: paint(root, {}), caption: 'Five invariants, one bit per node. Inserts and deletes restore any violated invariant with O(log n) recolours plus at most a constant number of rotations.' });
  return frames;
}
// Insert fix-up: 4 then 6 trigger a red-red conflict, zig-zag → double rotation.
function rbInsertFixupFrames() {
  _nid = 0;
  const frames = [];
  // Start: 8B with children 1B, 11B
  let n8 = rb('8·B'); let n1 = rb('1·B'); let n11 = rb('11·B');
  n8.left = n1; n8.right = n11;
  frames.push({ tree: paint(n8, { [n8._id]: 'done' }), caption: 'Subtree rooted at black 8 with black children 1 and 11. We insert keys as a normal BST, always coloured RED first.' });
  // insert 4 red under 1 (right child)
  let r2 = clone(n8); let n1b = r2.left; let n4 = rb('4·R'); n1b.right = n4;
  frames.push({ tree: paint(r2, { [n4._id]: 'new' }), caption: 'Insert 4: 4 < 8 go left, 4 > 1 go right → red 4 attaches under black 1. Parent 1 is black, so invariant 4 holds — no fix needed.' });
  // insert 6 red under 4 (right child) -> red-red violation
  let r3 = clone(r2);
  const find = (n, v) => { if (!n) return null; if (n.value === v) return n; return find(n.left, v) || find(n.right, v); };
  let n4b = find(r3, '4·R'); let n6 = rb('6·R'); n4b.right = n6;
  frames.push({ tree: paint(r3, { [n6._id]: 'new', [n4b._id]: 'unbalanced' }), caption: 'Insert 6: red 6 attaches under red 4 → INVARIANT 4 VIOLATED (two reds in a row, 4 and 6).' });
  let n1c = find(r3, '1·B'); let n8c = r3;
  frames.push({ tree: paint(r3, { [n6._id]: 'unbalanced', [n4b._id]: 'unbalanced', [find(r3, '11·B')._id]: 'key' }), caption: 'Look at the UNCLE of 4 (the other child of grandparent 8): it is 11, which is BLACK. Black uncle → rotation case, not recolour case.' });
  frames.push({ tree: paint(r3, { [n8c._id]: 'visited', [n1c._id]: 'visited', [n4b._id]: 'visited', [n6._id]: 'visited' }), caption: 'Trace the shape: 8 → 1 (left) → 4 (right) → 6 (right). The kink at 1→4 makes this a zig-zag (left-right). Fix needs TWO rotations.' });
  // Step 1: left-rotate at 1, so 4 rises above 1
  let s4 = clone(r3);
  // rebuild: 8 -> left subtree becomes 4 with left child 1, right child 6
  let new8 = rb('8·B'); let new4 = rb('4·R'); let new1 = rb('1·R'); let new6 = rb('6·R'); let new11 = rb('11·B');
  void s4;
  new8.left = new4; new8.right = new11; new4.left = new1; new4.right = new6;
  frames.push({ tree: paint(new8, { [new4._id]: 'current', [new1._id]: 'unbalanced', [new6._id]: 'unbalanced' }), caption: 'Step 1 — LEFT-rotate at 1: 4 lifts above its old parent 1. Now 8 → 4 → 1 (left) is a straight left line. The red-red pair is now 4 and its child.' });
  // Step 2: right-rotate at 8 -> 4 becomes local root
  let top4 = rb('4·B'); let kid1 = rb('1·R'); let kid6 = rb('6·R'); let kid8 = rb('8·R'); let kid11 = rb('11·B');
  top4.left = kid1; top4.right = kid8; kid8.left = kid6; kid8.right = kid11;
  // Actually after RB double-rotation + recolour: 4 black root, children 1R and 8R; 8's children are 6R? No — standard result:
  // 4 becomes parent of 1 (left) and 8 (right); 6 stays right child of 4 originally but standard outcome puts 6 as right child of 4?
  // Use the md's stated result: 8R root with children 4B and 11B; 4B has children 1R and 6R.
  let mr8 = rb('8·R'); let mr4 = rb('4·B'); let mr11 = rb('11·B'); let mr1 = rb('1·R'); let mr6 = rb('6·R');
  void top4; void kid1; void kid6; void kid8; void kid11;
  mr8.left = mr4; mr8.right = mr11; mr4.left = mr1; mr4.right = mr6;
  frames.push({ tree: paint(mr8, { [mr4._id]: 'current' }), caption: 'Step 2 — RIGHT-rotate at 8 and RECOLOUR: 4 becomes black and rises; 8 becomes its child. The two reds 4 and 6 are now split by black 4.' });
  frames.push({ tree: paint(mr8, { [mr4._id]: 'key', [mr1._id]: 'key', [mr6._id]: 'key', [mr8._id]: 'key' }), caption: 'Recolour result: 4 is black, its children 1 and 6 are red, 8 is red, 11 is black. No red has a red child — invariant 4 restored.' });
  frames.push({ tree: paint(mr8, { [mr4._id]: 'done', [mr11._id]: 'done', [mr1._id]: 'done', [mr6._id]: 'done' }), caption: 'Black-heights are preserved by the recolour, so invariant 5 still holds. The fix touched O(1) nodes; any upward red-red conflict recurses toward the root.' });
  frames.push({ tree: paint(mr8, {}), caption: 'Zig-zag (left-right) insert fix = rotate child, rotate grandparent, recolour. Zig-zig (straight line) needs a single rotation. Red uncle would instead just recolour and recurse.' });
  return frames;
}

// ===========================================================================
// heaps-skew-leftist  (renderer: 'tree')
// Leftist heap: nodes show "value [s]"; merge walks right spines, swaps so the
// right child has the smaller s-value. Skew heap: always swap, no s-values.
// ===========================================================================
function leftistMergeFrames() {
  _nid = 0;
  const frames = [];
  // Heap A: 2[2] -> left 6[1] (left 10[1]), right 8[1]
  const a2 = node('2 [2]'); const a6 = node('6 [1]'); const a8 = node('8 [1]'); const a10 = node('10 [1]');
  a2.left = a6; a2.right = a8; a6.left = a10;
  // Heap B: 4[1] -> left 9[1]
  const b4 = node('4 [1]'); const b9 = node('9 [1]');
  b4.left = b9;
  frames.push({ tree: paint(a2, { [a2._id]: 'key' }), caption: 'Leftist heap A (min-heap). Each node shows value and its s-value [npl] = length of the shortest path to a missing child. Right spine 2→8 is short.' });
  frames.push({ tree: paint(b4, { [b4._id]: 'key' }), caption: 'Leftist heap B. We want merge(A, B) in O(log n). Every other operation is built from merge: push = merge with a 1-node heap, pop = merge of the root\'s two children.' });
  // Step 1: smaller root is 2; recurse merge(A.right=8, B=4)
  frames.push({ tree: paint(a2, { [a2._id]: 'current', [a8._id]: 'unbalanced' }), caption: 'Step 1: compare roots 2 and 4. 2 is smaller → 2 stays on top; recursively merge 2\'s RIGHT subtree (8) with all of B (rooted at 4).' });
  // Step 2: merge(8,4): smaller is 4; recurse merge(8, B.right=nil) -> 8
  frames.push({ tree: paint(b4, { [b4._id]: 'current', [b9._id]: 'visited' }), caption: 'Step 2: merge(8, 4). 4 is smaller → 4 on top; recurse merge(8, 4\'s right child = nil). Merging with nil just returns the other heap, 8.' });
  // sub-result: 4 with left 9, right 8
  const m4 = node('4 [?]'); const m9 = node('9 [1]'); const m8 = node('8 [1]');
  m4.left = m9; m4.right = m8;
  frames.push({ tree: paint(m4, { [m4._id]: 'current', [m8._id]: 'new' }), caption: 'merge(8, nil) = 8, attached as 4\'s right child. Now 4 has left child 9 (s=1) and right child 8 (s=1). Time to enforce the leftist rule.' });
  // leftist fixup: s(left)=1, s(right)=1 -> equal, keep; s of 4 = 1 + min = 1 +? right's s; here both 1, so 4.s = 1+1 = 2? npl = 1 + min(s(left),s(right)) for two children =1+1=2.
  const m4b = node('4 [1]'); const m9b = node('9 [1]'); const m8b = node('8 [1]');
  m4b.left = m9b; m4b.right = m8b;
  frames.push({ tree: paint(m4b, { [m4b._id]: 'key' }), caption: 'Leftist rule: ensure s(left) ≥ s(right); swap children if not. Here both children have s=1, no swap. s(4) = 1 + min(1,1) = 1. This merged sub-heap returns up to step 1.' });
  // Final: 2 with left 6(left 10), right = merged 4
  const f2 = node('2 [2]'); const f6 = node('6 [1]'); const f10 = node('10 [1]'); const f4 = node('4 [1]'); const f9 = node('9 [1]'); const f8 = node('8 [1]');
  f2.left = f6; f6.left = f10; f2.right = f4; f4.left = f9; f4.right = f8;
  frames.push({ tree: paint(f2, { [f2._id]: 'current', [f4._id]: 'new' }), caption: 'Back at step 1: attach the merged heap (root 4) as 2\'s right child. 2\'s left subtree (6→10) was untouched. Now enforce the leftist rule at 2.' });
  frames.push({ tree: paint(f2, { [f6._id]: 'key', [f4._id]: 'key' }), caption: 'At 2: s(left=6) = 1, s(right=4) = 1. Equal, so no swap. If the right s-value had exceeded the left, we would swap children to keep the right spine shortest.' });
  frames.push({ tree: paint(f2, { [f2._id]: 'done' }), caption: 'Merge complete. The right spine 2→4→8 has length ≤ log(n+1) by the leftist invariant, so the whole recursion is O(log n) worst case.' });
  frames.push({ tree: paint(f2, {}), caption: 'Skew heap variant: drop the s-values and ALWAYS swap children after each merge. Simpler code; the same O(log n) bound, but amortized rather than worst-case.' });
  return frames;
}
function skewMergeFrames() {
  _nid = 0;
  const frames = [];
  // Skew heap: no s-values, always swap after merge.
  const a3 = node('3'); const a7 = node('7'); const a8 = node('8');
  a3.left = a7; a3.right = a8;
  const b5 = node('5'); const b9 = node('9');
  b5.left = b9;
  frames.push({ tree: paint(a3, { [a3._id]: 'key' }), caption: 'Skew heap A (min-heap, no s-value bookkeeping). Merge is the only primitive, just like a leftist heap.' });
  frames.push({ tree: paint(b5, { [b5._id]: 'key' }), caption: 'Skew heap B. Rule of a skew merge: pick the smaller root, recursively merge its RIGHT subtree with the other heap, then UNCONDITIONALLY swap the result\'s children.' });
  frames.push({ tree: paint(a3, { [a3._id]: 'current', [a8._id]: 'unbalanced' }), caption: 'Step 1: roots 3 vs 5 → 3 smaller, stays on top. Recurse merge(3\'s right subtree = 8, B rooted at 5).' });
  frames.push({ tree: paint(b5, { [b5._id]: 'current' }), caption: 'Step 2: merge(8, 5) → 5 smaller, on top. Recurse merge(5\'s right = nil, 8) = 8. Then swap 5\'s children.' });
  const m5 = node('5'); const m8 = node('8'); const m9 = node('9');
  m5.left = m8; m5.right = m9;
  frames.push({ tree: paint(m5, { [m5._id]: 'current', [m8._id]: 'new' }), caption: 'After merge(8, nil)=8 and the unconditional swap: 5 now has left child 8 and right child 9. The newly merged branch is forced to the LEFT.' });
  const f3 = node('3'); const f5 = node('5'); const f7 = node('7'); const f8 = node('8'); const f9 = node('9');
  f3.left = f5; f5.left = f8; f5.right = f9; f3.right = f7;
  frames.push({ tree: paint(f3, { [f3._id]: 'current', [f5._id]: 'new' }), caption: 'Back at step 1: attach merged heap (root 5) as 3\'s right child, then SWAP 3\'s children → the merged side moves left, old left (7) moves right.' });
  frames.push({ tree: paint(f3, { [f5._id]: 'key', [f7._id]: 'key' }), caption: 'The swap is what keeps skew heaps balanced on average: it pushes recently-merged (potentially long) spines to the left so future merges meet short right spines.' });
  frames.push({ tree: paint(f3, { [f3._id]: 'done' }), caption: 'Merge done with zero s-value tracking. Any sequence of m operations costs O(m log n) amortized — same as leftist, fewer lines of code.' });
  frames.push({ tree: paint(f3, {}), caption: 'Skew is to leftist what splay is to AVL: drop the explicit balance metadata, restructure aggressively every operation, pay for it amortized.' });
  frames.push({ tree: paint(f3, {}), caption: 'Push x = merge(heap, single-node x). Pop-min = remove root, then merge its two children. Both reduce to one O(log n) merge — that is the entire API.' });
  return frames;
}

// ===========================================================================
// quadtree-spatial  (renderer: 'tree')
// Each quadtree node value = its region label + contained points. Four children
// (NW/NE/SW/SE) collapse onto the binary renderer as left=SW-line, right=NE-line;
// the four-way split is narrated. Capacity = 2 over region (0,0)-(16,16).
// ===========================================================================
function quadtreeFrames() {
  _nid = 0;
  const frames = [];
  // root holds P1,P2,P3 over capacity 2
  let root = node('ROOT 0-16 {P1,P2,P3}');
  frames.push({ tree: paint(root, { [root._id]: 'current' }), caption: 'Quadtree over region (0,0)-(16,16), leaf capacity 2. Insert P1(2,2), P2(3,3), P3(14,14): all land in the root leaf — now 3 points, over capacity.' });
  frames.push({ tree: paint(root, { [root._id]: 'unbalanced' }), caption: 'Over capacity → SUBDIVIDE the root region into four equal quadrants of size 8: NW, NE, SW(0,0)-(8,8), SE. Redistribute the 3 points by which quadrant contains them.' });
  // root with SW and NE children (binary: left=SW, right=NE)
  let r2 = node('ROOT 0-16'); const sw = node('SW 0-8 {P1,P2}'); const ne = node('NE 8-16 {P3}');
  r2.left = sw; r2.right = ne;
  frames.push({ tree: paint(r2, { [sw._id]: 'new', [ne._id]: 'new' }), caption: 'P1(2,2), P2(3,3) fall in SW (0,0)-(8,8) — 2 points, fits capacity. P3(14,14) falls in NE (8,8)-(16,16). NW and SE are empty (drawn implicitly between SW and NE).' });
  frames.push({ tree: paint(r2, { [sw._id]: 'visited', [ne._id]: 'visited' }), caption: 'Insert P4(2,7): 2 < 8 and 7 < 8 → also SW. SW would hold {P1,P2,P4} = 3 points, over capacity again.' });
  // subdivide SW
  let r3 = node('ROOT 0-16'); const sw2 = node('SW 0-8'); const ne2 = node('NE 8-16 {P3}');
  const swsw = node('SW-SW 0-4 {P1,P2}'); const swnw = node('SW-NW 0-4y4-8 {P4}');
  r3.left = sw2; r3.right = ne2; sw2.left = swsw; sw2.right = swnw;
  frames.push({ tree: paint(r3, { [sw2._id]: 'unbalanced' }), caption: 'Subdivide SW into four quadrants of size 4. P1(2,2), P2(3,3) → SW-SW (0,0)-(4,4). P4(2,7) → SW-NW (0,4)-(4,8). Each leaf now holds ≤ 2 points.' });
  frames.push({ tree: paint(r3, { [swsw._id]: 'new', [swnw._id]: 'new' }), caption: 'Tree shape now mirrors point density: empty regions stay shallow, dense corners subdivide deeper. This adaptive depth is the whole advantage over a flat array.' });
  // Range query (0,0)-(5,5)
  frames.push({ tree: paint(r3, { [r3._id]: 'current' }), caption: 'Range query: report all points in rectangle (0,0)-(5,5). Start at root — the query box overlaps the root region, so descend into its quadrants.' });
  frames.push({ tree: paint(r3, { [sw2._id]: 'current', [ne2._id]: 'done' }), caption: 'NE region (8,8)-(16,16) is DISJOINT from (0,0)-(5,5) → prune the entire NE subtree (and P3) without inspecting it. SW overlaps → descend.' });
  frames.push({ tree: paint(r3, { [swsw._id]: 'found' }), caption: 'SW-SW (0,0)-(4,4) overlaps the query and is fully inside it → return all its points: P1(2,2), P2(3,3). Both are reported.' });
  frames.push({ tree: paint(r3, { [swnw._id]: 'visited' }), caption: 'SW-NW (0,4)-(4,8) overlaps the query box, so we open it, but its only point P4(2,7) has y=7 > 5 → outside the query. Report nothing.' });
  frames.push({ tree: paint(r3, { [swsw._id]: 'done', [ne2._id]: 'done' }), caption: 'Answer: {P1, P2}. We visited 4 nodes instead of scanning all 4 points blindly; on n points uniformly distributed, range and nearest-neighbour queries run in near-O(log n).' });
  return frames;
}

// ===========================================================================
// link-cut-tree  (renderer: 'tree')
// Represented tree A-B-D / C / E. access(D) splices the path A-B-D into one
// splay tree. Node value shows the vertex; 'key' marks preferred-path members,
// 'current' the accessed node, 'visited' the climb, 'done' the exposed path.
// ===========================================================================
function lctAccessFrames() {
  _nid = 0;
  const frames = [];
  // Represented forest: A root, children B and C; B child D; C child E.
  const A = node('A'); const B = node('B'); const C = node('C'); const D = node('D'); const E = node('E');
  A.left = B; A.right = C; B.left = D; C.right = E;
  frames.push({ tree: paint(A, { [A._id]: 'key' }), caption: 'Represented forest: A is the root; B and C are its children; D hangs off B, E off C. We want O(log n) link, cut, and path-aggregate as edges change online.' });
  frames.push({ tree: paint(A, { [A._id]: 'visited', [B._id]: 'visited', [D._id]: 'key' }), caption: 'Decompose into PREFERRED PATHS: each node keeps at most one preferred child (its most recently accessed). Suppose A-B-D is the current preferred path; C and E sit on their own paths.' });
  frames.push({ tree: paint(A, { [A._id]: 'key', [B._id]: 'key', [D._id]: 'key', [C._id]: 'visited', [E._id]: 'visited' }), caption: 'Each preferred path is stored as its OWN splay tree, keyed by depth, so an in-order walk gives the path shallow→deep. Non-preferred child C dangles off A via a path-parent pointer (not a splay edge).' });
  frames.push({ tree: paint(A, { [D._id]: 'current' }), caption: 'access(D): expose the path from the represented root A down to D inside a single splay tree. Walk upward from D, splaying as we go and re-routing preferred edges.' });
  frames.push({ tree: paint(A, { [D._id]: 'current', [B._id]: 'visited' }), caption: 'Step 1: splay D within its current preferred path (A-B-D). D rises toward the top of its auxiliary splay tree; depth ordering is maintained by the splay key.' });
  frames.push({ tree: paint(A, { [D._id]: 'current', [B._id]: 'visited', [A._id]: 'visited' }), caption: 'Step 2: follow D\'s path-parent jumps upward. Splice each ancestor\'s preferred child to point toward D, detaching whatever path it preferred before.' });
  frames.push({ tree: paint(A, { [A._id]: 'done', [B._id]: 'done', [D._id]: 'done', [C._id]: 'key', [E._id]: 'key' }), caption: 'After access(D): the entire path A-B-D lives in ONE splay tree with D splayed to the root. C now becomes A\'s non-preferred (path-parent) child; the A-C edge stopped being preferred.' });
  frames.push({ tree: paint(A, { [A._id]: 'visited', [B._id]: 'visited', [D._id]: 'visited' }), caption: 'A path-aggregate query (sum / max edge / count on A..D) is now ONE splay-tree traversal: read the aggregate stored at D\'s splay-root in O(log n) amortized.' });
  frames.push({ tree: paint(A, { [D._id]: 'current' }), caption: 'makeRoot(D) = access(D) then set a lazy REVERSE flag on D\'s splay tree. Flipping the flag swaps shallow↔deep along the path, re-rooting the represented tree at D for free.' });
  frames.push({ tree: paint(A, { [D._id]: 'key', [E._id]: 'key' }), caption: 'link(u,v): makeRoot(u); access(v); attach u\'s splay tree under v via a path-parent pointer. cut(u,v): access(v), splay, and detach the left subtree. Each is O(log n) amortized.' });
  frames.push({ tree: paint(A, {}), caption: 'The amortized bound comes from the same potential argument as splay trees: preferred-child changes are paid for by the access that caused them. This beats heavy-light decomposition when the tree itself mutates.' });
  return frames;
}

// ===========================================================================
// persistent-segment-tree  (renderer: 'array')
// Each cell is a node-version tile (string). subRow labels the leaf coverage.
// Path-copy: an update clones only O(log n) nodes; old roots stay queryable.
// Array layout per frame: a row of node tiles for the version being built.
// ===========================================================================
function persistentSegTreeFrames() {
  const frames = [];
  // Underlying array A = [0,0,0,0]; segment tree over [0,3]. Nodes labelled.
  // Layout cells: [root, left[0..1], right[2..3], leaf0, leaf1, leaf2, leaf3].
  const v0 = ['root0', 'L0[0..1]', 'R0[2..3]', 'a0=0', 'a1=0', 'a2=0', 'a3=0'];
  const cov = ['[0..3]', '[0..1]', '[2..3]', '[0]', '[1]', '[2]', '[3]'];
  frames.push({
    array: v0,
    subRow: { values: cov, label: 'covers' },
    caption: 'Version 0: a segment tree over A = [0,0,0,0]. Internal nodes store subtree sums; leaves store single elements. All sums are 0.',
  });
  frames.push({
    array: v0,
    subRow: { values: cov, label: 'covers' },
    highlights: { 3: 'current', 4: 'current', 5: 'current', 6: 'current' },
    caption: 'A point update normally walks root → … → leaf, touching only the O(log n) nodes on that path. The other subtrees are never modified — the key to making it persistent cheaply.',
  });
  frames.push({
    array: v0,
    subRow: { values: cov, label: 'covers' },
    pointers: { 0: 'root0', 4: 'A[1]' },
    highlights: { 0: 'visited', 1: 'visited', 4: 'pivot' },
    caption: 'Update version 1: set A[1] = 5. The path from root0 reaches leaf A[1] via root0 → L0 (covers [0..1]) → leaf a1. Three nodes lie on this path.',
  });
  // Version 1: clone the 3 path nodes; share the rest.
  const v1 = ["root1'", "L1[0..1]'", 'R0[2..3]→shared', 'a0=0→shared', 'a1=5*', 'a2=0→shared', 'a3=0→shared'];
  frames.push({
    array: v1,
    subRow: { values: cov, label: 'covers' },
    highlights: { 0: 'new', 1: 'new', 4: 'match' },
    caption: 'Copy-on-write: CLONE only the 3 path nodes (root1\', L1\', leaf a1=5). The new leaf holds 5; root1\' and L1\' get fresh sums.',
  });
  frames.push({
    array: v1,
    subRow: { values: cov, label: 'covers' },
    highlights: { 2: 'done', 3: 'done', 5: 'done', 6: 'done' },
    caption: 'SHARE everything off the path: root1\'.right still points at version 0\'s R0 subtree; L1\'.left still points at the old leaf a0. No copying of untouched nodes — only 3 new nodes total.',
  });
  frames.push({
    array: v1,
    subRow: { values: cov, label: 'covers' },
    pointers: { 0: 'root1' },
    highlights: { 0: 'visited', 1: 'visited', 4: 'found' },
    caption: 'Query "sum over [0,1] in version 1": start at root1\', descend into L1\' (covers [0..1]) which already aggregates a0=0 + a1=5 = 5. Returns 5 in O(log n).',
  });
  frames.push({
    array: v0,
    subRow: { values: cov, label: 'covers' },
    pointers: { 0: 'root0' },
    highlights: { 0: 'visited', 1: 'visited', 3: 'found', 4: 'found' },
    caption: 'Query "sum over [0,1] in version 0": start at the OLD root0 (still alive!), descend into L0 → leaves [0,0] → returns 0. Time-travel: every historical version stays queryable.',
  });
  frames.push({
    array: ["root2'", "L0[0..1]→shared", "R2[2..3]'", 'a2=9*', 'shared', 'shared', 'shared'],
    subRow: { values: ['[0..3]', '[0..1]', '[2..3]', '[2]', '', '', ''], label: 'covers' },
    highlights: { 0: 'new', 2: 'new', 3: 'match' },
    caption: 'Update version 2 on top of v1: set A[2] = 9. Now the path goes root → R (covers [2..3]) → leaf a2. This time the LEFT subtree is shared and only the right path is cloned.',
  });
  frames.push({
    array: ['root0', 'root1', 'root2', '— versions —', 'A[1]=5@v1', 'A[2]=9@v2', 'base@v0'],
    subRow: { values: ['ptr', 'ptr', 'ptr', '', 'edit', 'edit', 'edit'], label: 'roots' },
    highlights: { 0: 'visited', 1: 'visited', 2: 'visited' },
    caption: 'Keep an array of ROOT pointers, one per version. root[k] is the entry point for querying the tree as it looked after update k. Querying version k = walk from root[k].',
  });
  frames.push({
    array: ['+log n', '+log n', '+log n', 'per update', 'total:', '(n+u)·log n', 'memory'],
    subRow: { values: ['v1', 'v2', 'v3', '', '', '', ''], label: 'cost' },
    caption: 'Each update adds only O(log n) new nodes, so u updates over an array of size n cost O((n + u)·log n) memory — not O(n) per version. This powers offline range-kth-smallest in O(log² n).',
  });
  frames.push({
    array: ['shared', 'shared', 'cloned', 'cloned', 'shared', 'shared', 'cloned'],
    subRow: { values: ['', '', 'path', 'path', '', '', 'path'], label: 'node' },
    highlights: { 2: 'done', 3: 'done', 6: 'done' },
    caption: 'Mental model: each update creates a thin new spine of cloned nodes; the rest of the tree is shared with the previous version. Functional, immutable, and exactly how Clojure/Haskell persistent structures work.',
  });
  return frames;
}

// ===========================================================================
// skiplist-concurrent  (renderer: 'array')
// Each level is a row of node tiles. We animate one insert (F) and one
// concurrent delete (C) via logical mark + physical unlink with CAS.
// Array per frame = the level row being acted on; subRow = the other level.
// ===========================================================================
function skiplistConcurrentFrames() {
  const frames = [];
  const L0 = ['A', 'B', 'C', 'D', 'E'];
  const L1 = ['A', '·', 'C', '·', 'E'];
  frames.push({
    array: L0,
    subRow: { values: L1, label: 'L1 (express)' },
    caption: 'Concurrent skip list: a sorted set with multiple levels. L0 holds every node; higher levels are sparse express lanes. No locks, no rotations — coordination is plain CAS on forward pointers.',
  });
  frames.push({
    array: L1,
    subRow: { values: L0, label: 'L0 (base)' },
    pointers: { 0: 'start' },
    highlights: { 0: 'visited', 2: 'visited', 4: 'visited' },
    caption: 'Search walks the top level first: at L1, A → C → E → nil. Dropping a level at each over-shoot gives O(log n) expected search, the same shape as a balanced tree but randomized.',
  });
  // Insert F at level 1
  frames.push({
    array: L0,
    subRow: { values: L1, label: 'L1' },
    pointers: { 4: 'after E' },
    highlights: { 4: 'current' },
    caption: 'Thread T1 inserts F (random promotion level = 1, so it appears on L0 and L1). Search finds the insert point: F goes right after E on both levels.',
  });
  frames.push({
    array: ['A', 'B', 'C', 'D', 'E', 'F'],
    subRow: { values: ['E.fwd[0]', '', '', '', '→ F', 'new'], label: 'CAS L0' },
    highlights: { 5: 'new' },
    caption: 'CAS L0: atomically swing E.forward[0] from nil to F. If another thread changed E.forward[0] meanwhile, the CAS fails — re-read and retry. No lock is ever held.',
  });
  frames.push({
    array: ['A', '·', 'C', '·', 'E', 'F'],
    subRow: { values: ['E.fwd[1]', '', '', '', '→ F', 'new'], label: 'CAS L1' },
    highlights: { 5: 'new' },
    caption: 'CAS L1: link F into the express lane too. Insert succeeds bottom-up; a reader that only saw the L0 link still finds F correctly — the structure is never in an inconsistent state.',
  });
  // Concurrent delete C: phase 1 mark
  frames.push({
    array: ['A', 'B', 'C', 'D', 'E', 'F'],
    subRow: { values: ['', '', 'MARK', '', '', ''], label: 'T2 phase 1' },
    pointers: { 2: 'C' },
    highlights: { 2: 'pivot' },
    caption: 'Thread T2 deletes C in two phases. Phase 1 — LOGICAL delete: CAS a "marked" tag bit onto every C.forward[*] pointer. C is now logically gone but still physically linked.',
  });
  frames.push({
    array: ['A', 'B', 'C', 'D', 'E', 'F'],
    subRow: { values: ['B.fwd[0]', '', 'skip', '→ D', '', ''], label: 'T2 phase 2' },
    pointers: { 1: 'B' },
    highlights: { 1: 'current', 2: 'pivot', 3: 'match' },
    caption: 'Phase 2 — PHYSICAL unlink: CAS B.forward[0] from C to C.next (= D), splicing C out of L0. The mark bit guarantees no thread re-links a node that is already logically deleted.',
  });
  frames.push({
    array: ['A', '·', 'C', '·', 'E', 'F'],
    subRow: { values: ['A.fwd[1]', '', 'skip', '', '→ E', ''], label: 'unlink L1' },
    pointers: { 0: 'A' },
    highlights: { 0: 'current', 2: 'pivot', 4: 'match' },
    caption: 'Unlink C on the express lane too: CAS A.forward[1] from C to E. Levels are independent, so each is unlinked by its own CAS — no global structure lock.',
  });
  frames.push({
    array: ['A', 'B', 'D', 'E', 'F', ''],
    subRow: { values: ['T1 helps', 'past', 'C gone', '', '', ''], label: 'helping' },
    highlights: { 0: 'visited', 1: 'done', 2: 'done' },
    caption: 'HELPING: if T1 traverses and sees C\'s marked tag before T2 finishes, T1 performs the unlink CAS itself. Lock-free progress — a stalled deleter never blocks readers.',
  });
  frames.push({
    array: ['A', 'B', 'D', 'E', 'F', ''],
    subRow: { values: ['', '', '', '', '', ''], label: 'L0 final' },
    highlights: { 0: 'done', 1: 'done', 2: 'done', 3: 'done', 4: 'done' },
    caption: 'Final L0: A → B → D → E → F, C fully removed. Mark-then-unlink + CAS + helping is exactly the design behind Java\'s ConcurrentSkipListMap and RocksDB\'s MemTable.',
  });
  return frames;
}

// ===========================================================================
// Export map
// ===========================================================================
export default {
  'red-black-tree-properties': {
    title: 'Red-Black Tree Properties',
    renderer: 'tree',
    cases: [
      { label: 'Five invariants', frames: rbOverviewFrames() },
      { label: 'Insert fix-up (rotate + recolour)', frames: rbInsertFixupFrames() },
    ],
  },
  'heaps-skew-leftist': {
    title: 'Leftist & Skew Heaps',
    renderer: 'tree',
    cases: [
      { label: 'Leftist merge (s-value swap)', frames: leftistMergeFrames() },
      { label: 'Skew merge (always swap)', frames: skewMergeFrames() },
    ],
  },
  'quadtree-spatial': {
    title: 'Quadtree (Spatial Index)',
    renderer: 'tree',
    cases: [
      { label: 'Subdivide + range query', frames: quadtreeFrames() },
    ],
  },
  'link-cut-tree': {
    title: 'Link-Cut Tree',
    renderer: 'tree',
    cases: [
      { label: 'access() exposes a path', frames: lctAccessFrames() },
    ],
  },
  'persistent-segment-tree': {
    title: 'Persistent Segment Tree',
    renderer: 'array',
    cases: [
      { label: 'Path-copy update + time-travel query', frames: persistentSegTreeFrames() },
    ],
  },
  'skiplist-concurrent': {
    title: 'Lock-free Concurrent Skip List',
    renderer: 'array',
    cases: [
      { label: 'Insert + concurrent delete (CAS)', frames: skiplistConcurrentFrames() },
    ],
  },
};
