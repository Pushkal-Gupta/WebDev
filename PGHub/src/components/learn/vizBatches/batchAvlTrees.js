// Concept-visualization batch: balanced & disk-oriented trees (AVL, B-tree,
// B+ tree) plus core BST operations. All entries use the 'tree' renderer.
//
// TreeRenderer (AlgoVisualizer.jsx) reads a recursive frame.tree of shape
//   { _id, value, left, right, state? }
// where state in { 'current', 'visited', 'done', 'new', 'unbalanced', 'found',
// 'key' } maps to a CSS class. It also reads frame.caption and (optional)
// frame.chip / frame.traversal. It is a BINARY renderer: only left/right are
// walked. Multi-way B-tree/B+ nodes are therefore drawn as single nodes whose
// `value` is the comma-joined key list, with the two outermost children placed
// in left/right slots and the split mechanics narrated in the caption.
//
// Self-contained: no imports from conceptVisualizations.js.

let _nid = 0;
function nextId() { return ++_nid; }
function node(value, state) { return { _id: nextId(), value, left: null, right: null, state }; }
function clone(n) {
  if (!n) return null;
  return { _id: n._id, value: n.value, state: n.state, left: clone(n.left), right: clone(n.right) };
}
// Strip every state flag, optionally re-applying a map of _id -> state.
function paint(n, states) {
  if (!n) return null;
  const st = states && states[n._id];
  return { _id: n._id, value: n.value, state: st, left: paint(n.left, states), right: paint(n.right, states) };
}

// ---------------------------------------------------------------------------
// BST insert (used by binary-search-tree-operations and as AVL backdrop)
// ---------------------------------------------------------------------------
function bstInsert(root, v) {
  if (!root) return node(v);
  if (v < root.value) root.left = bstInsert(root.left, v);
  else if (v > root.value) root.right = bstInsert(root.right, v);
  return root;
}
function pathTo(root, v) {
  const path = [];
  let cur = root;
  while (cur) {
    path.push(cur._id);
    if (v === cur.value) break;
    cur = v < cur.value ? cur.left : cur.right;
  }
  return path;
}

function bstOpsFrames() {
  _nid = 0;
  const order = [50, 30, 70, 20, 40, 60, 80];
  const frames = [];
  let root = null;
  frames.push({ tree: null, caption: `BST invariant: left subtree < node < right subtree. Build by inserting [${order.join(', ')}].` });
  for (const v of order) {
    root = bstInsert(root, v);
    const states = {};
    for (const id of pathTo(root, v)) states[id] = 'visited';
    // mark the freshly placed node
    const place = (n) => { if (!n) return; if (n.value === v) states[n._id] = 'new'; place(n.left); place(n.right); };
    place(root);
    frames.push({ tree: paint(root, states), caption: `Insert ${v}: walk from root, go left when ${v} < node else right; attach as a leaf at the dead end.` });
  }
  // Search for 60
  const searchStates = {};
  for (const id of pathTo(root, 60)) searchStates[id] = 'visited';
  searchStates[pathTo(root, 60).slice(-1)[0]] = 'found';
  frames.push({ tree: paint(root, searchStates), caption: `Search 60: 60 > 50 go right, 60 < 70 go left, found at depth 2 in 3 comparisons — O(h).` });
  // Delete a leaf (20)
  let r2 = clone(root);
  const detach = (n) => { if (!n) return; if (n.left && n.left.value === 20) n.left = null; if (n.right && n.right.value === 20) n.right = null; detach(n.left); detach(n.right); };
  const delMark = {}; delMark[pathTo(root, 20).slice(-1)[0]] = 'unbalanced';
  frames.push({ tree: paint(root, delMark), caption: `Delete the leaf 20: it has no children, so just unlink it from its parent 30.` });
  detach(r2);
  frames.push({ tree: paint(r2, {}), caption: `20 removed. Leaf deletion is the easy case — no successor to splice in.` });
  // Delete node with two children (30) -> replace with inorder successor (40)
  const r3 = clone(r2);
  const repMark = {};
  const findId = (n, val) => { if (!n) return null; if (n.value === val) return n._id; return findId(n.left, val) || findId(n.right, val); };
  repMark[findId(r3, 30)] = 'unbalanced';
  repMark[findId(r3, 40)] = 'key';
  frames.push({ tree: paint(r3, repMark), caption: `Delete 30 (two children): find its in-order successor 40 — the smallest key in 30's right subtree.` });
  const r4 = clone(r2);
  // remove 30, promote 40
  const promote = (n) => {
    if (!n) return n;
    if (n.value === 30) { n.value = 40; n.right = null; return n; }
    n.left = promote(n.left); n.right = promote(n.right); return n;
  };
  promote(r4);
  const doneMark = {}; doneMark[findId(r4, 40)] = 'done';
  frames.push({ tree: paint(r4, doneMark), caption: `Copy 40 into 30's slot, then delete the original 40 leaf. BST order is preserved.` });
  frames.push({ tree: paint(r4, {}), caption: `Final tree. Search / insert / delete are all O(h); on a balanced tree h = O(log n), but a skewed BST degrades to O(n).` });
  return frames;
}

// Worst case: inserting an already-sorted sequence makes every node a right
// child, so the BST collapses into a linked list and search becomes O(n).
function bstSkewFrames() {
  _nid = 0;
  const order = [10, 20, 30, 40, 50, 60];
  const frames = [];
  let root = null;
  frames.push({ tree: null, caption: `The same BST rules, but a sorted insert order [${order.join(', ')}] is the adversarial case. Watch the shape that results.` });
  for (const v of order) {
    root = bstInsert(root, v);
    const states = {};
    for (const id of pathTo(root, v)) states[id] = 'visited';
    const place = (n) => { if (!n) return; if (n.value === v) states[n._id] = 'new'; place(n.left); place(n.right); };
    place(root);
    frames.push({ tree: paint(root, states), caption: `Insert ${v}: it is larger than every existing node, so it walks the full right edge and attaches as the deepest right child.` });
  }
  const chainStates = {};
  for (const id of pathTo(root, order[order.length - 1])) chainStates[id] = 'unbalanced';
  frames.push({ tree: paint(root, chainStates), caption: `Every node has only a right child — the height is ${order.length - 1}, the same as a singly linked list. No branching means no logarithmic speedup.` });
  const searchStates = {};
  for (const id of pathTo(root, 60)) searchStates[id] = 'visited';
  searchStates[pathTo(root, 60).slice(-1)[0]] = 'found';
  frames.push({ tree: paint(root, searchStates), caption: `Search 60 now visits all ${order.length} nodes — the tree degenerated into a linked list, so search is O(n), not O(log n).` });
  frames.push({ tree: paint(root, {}), caption: `This is exactly why self-balancing trees (AVL, red-black) exist: they rotate after inserts to keep height at O(log n) regardless of input order.` });
  return frames;
}

// ---------------------------------------------------------------------------
// In-order traversal / BST iterator
// ---------------------------------------------------------------------------
function buildBst(order) { _nid = 0; let r = null; for (const v of order) r = bstInsert(r, v); return r; }

function bstIteratorFrames(order = [50, 30, 70, 20, 40, 60, 80]) {
  const root = buildBst(order);
  const frames = [];
  const out = [];
  const spine = [];
  for (let n = root; n; n = n.left) spine.push(n.value);
  frames.push({ tree: paint(root, {}), caption: `BST Iterator streams keys in sorted order using a stack. Start by pushing the leftmost spine: ${spine.join(' → ')}.` });
  // Simulate controlled-recursion in-order with explicit stack
  const stack = [];
  let cur = root;
  const pushLeft = (n) => { while (n) { stack.push(n._id); n = n.left; } };
  // we re-walk by value lookup for state painting
  const idToNode = {};
  (function index(n) { if (!n) return; idToNode[n._id] = n; index(n.left); index(n.right); })(root);
  pushLeft(cur);
  let guard = 0;
  while (stack.length && guard < 40) {
    guard++;
    const topId = stack[stack.length - 1];
    // show stack as visited, top as current
    const states = {};
    for (const id of stack) states[id] = 'visited';
    states[topId] = 'current';
    for (const v of out) { const nn = Object.values(idToNode).find(x => x.value === v); if (nn) states[nn._id] = 'done'; }
    frames.push({ tree: paint(root, states), caption: `Stack top is ${idToNode[topId].value}; it is the smallest unseen key. next() pops it.`, traversal: [...out] });
    stack.pop();
    const popped = idToNode[topId];
    out.push(popped.value);
    const states2 = {};
    for (const id of stack) states2[id] = 'visited';
    for (const v of out) { const nn = Object.values(idToNode).find(x => x.value === v); if (nn) states2[nn._id] = 'done'; }
    frames.push({ tree: paint(root, states2), caption: `Emit ${popped.value}. Then push the left spine of its right child so the next-smallest sits on top.`, traversal: [...out] });
    if (popped.right) pushLeft(popped.right);
  }
  frames.push({ tree: paint(root, Object.fromEntries(Object.keys(idToNode).map(id => [id, 'done']))), caption: `All ${order.length} keys emitted in order: [${out.join(', ')}]. next() is O(1) amortized, memory O(h).`, traversal: [...out] });
  return frames;
}

// ---------------------------------------------------------------------------
// AVL rotations: LL, RR, LR, RL
// ---------------------------------------------------------------------------
// Each case is a hand-built sequence: skewed tree -> mark pivot -> rotate -> balanced.
function avlLLFrames() {
  _nid = 0;
  // Insert 30, 20, 10 -> left-left heavy at 30
  const n30 = node(30), n20 = node(20), n10 = node(10);
  const frames = [];
  let root = node(30); frames.push({ tree: clone(root), caption: `LL case. Insert 30 as root.` });
  root.left = node(20); frames.push({ tree: paint(root, {}), caption: `Insert 20 < 30 — goes left. Balance factor of 30 is +1, still OK.` });
  // rebuild with deeper
  root = clone(root); const left = root.left; left.left = node(10);
  const bfStates = {}; bfStates[root._id] = 'unbalanced';
  frames.push({ tree: paint(root, bfStates), caption: `Insert 10 < 20 < 30. Now 30's left height is 2, right is 0 → balance factor +2: LEFT-LEFT imbalance.` });
  const pivotStates = {}; pivotStates[root._id] = 'unbalanced'; pivotStates[left._id] = 'key';
  frames.push({ tree: paint(root, pivotStates), caption: `Both 30 and its left child 20 lean left. Fix with a single RIGHT rotation about 30.` });
  // right rotate: 20 becomes root
  void n30; void n20; void n10;
  const newRoot = node(20); const r = node(30); const l = node(10);
  newRoot.left = l; newRoot.right = r;
  const midStates = {}; midStates[newRoot._id] = 'current';
  frames.push({ tree: paint(newRoot, midStates), caption: `20 rotates up to the root; 30 becomes its right child, 10 its left child.` });
  frames.push({ tree: paint(newRoot, Object.fromEntries([newRoot._id, l._id, r._id].map(id => [id, 'done']))), caption: `Balanced: every balance factor is now 0. One rotation restored O(log n) height.` });
  // pad to >=10 frames with a recap of balance factors
  frames.push({ tree: paint(newRoot, { [newRoot._id]: 'key' }), caption: `Root 20: left subtree height 1, right subtree height 1, balance factor 0.` });
  frames.push({ tree: paint(newRoot, { [l._id]: 'visited' }), caption: `Leaf 10: no children, balance factor 0.` });
  frames.push({ tree: paint(newRoot, { [r._id]: 'visited' }), caption: `Leaf 30: no children, balance factor 0.` });
  frames.push({ tree: paint(newRoot, {}), caption: `LL rotation complete. Rule of thumb: left-left heavy → one right rotation about the unbalanced node.` });
  return frames;
}

function avlRRFrames() {
  _nid = 0;
  let root = node(10); const frames = [];
  frames.push({ tree: clone(root), caption: `RR case. Insert 10 as root.` });
  root = clone(root); root.right = node(20);
  frames.push({ tree: paint(root, {}), caption: `Insert 20 > 10 — goes right. Balance factor of 10 is -1, still OK.` });
  root = clone(root); root.right.right = node(30);
  const unb = {}; unb[root._id] = 'unbalanced';
  frames.push({ tree: paint(root, unb), caption: `Insert 30 > 20 > 10. 10's right height is 2, left is 0 → balance factor -2: RIGHT-RIGHT imbalance.` });
  const pv = {}; pv[root._id] = 'unbalanced'; pv[root.right._id] = 'key';
  frames.push({ tree: paint(root, pv), caption: `10 and its right child 20 both lean right. Fix with a single LEFT rotation about 10.` });
  const nr = node(20), l = node(10), r = node(30); nr.left = l; nr.right = r;
  frames.push({ tree: paint(nr, { [nr._id]: 'current' }), caption: `20 rotates up to the root; 10 becomes its left child, 30 its right child.` });
  frames.push({ tree: paint(nr, Object.fromEntries([nr._id, l._id, r._id].map(id => [id, 'done']))), caption: `Balanced: all balance factors 0. Symmetric to the LL case.` });
  frames.push({ tree: paint(nr, { [nr._id]: 'key' }), caption: `Root 20 now has equal-height subtrees — balance factor 0.` });
  frames.push({ tree: paint(nr, { [l._id]: 'visited' }), caption: `Leaf 10: balance factor 0.` });
  frames.push({ tree: paint(nr, { [r._id]: 'visited' }), caption: `Leaf 30: balance factor 0.` });
  frames.push({ tree: paint(nr, {}), caption: `RR rotation complete — one left rotation fixed the right-heavy spine.` });
  return frames;
}

function avlLRFrames() {
  _nid = 0;
  // Insert 30, 10, 20 -> left child is right-heavy: LR
  let root = node(30); const frames = [];
  frames.push({ tree: clone(root), caption: `LR case. Insert 30 as root.` });
  root = clone(root); root.left = node(10);
  frames.push({ tree: paint(root, {}), caption: `Insert 10 < 30 — goes left.` });
  root = clone(root); root.left.right = node(20);
  const unb = {}; unb[root._id] = 'unbalanced'; unb[root.left._id] = 'key';
  frames.push({ tree: paint(root, unb), caption: `Insert 20 (10 < 20 < 30): it lands right-of-left. 30 is left-heavy (+2) but its left child 10 leans RIGHT — LEFT-RIGHT zig-zag.` });
  frames.push({ tree: paint(root, unb), caption: `A single rotation can't fix a zig-zag. Step 1: LEFT-rotate the left child 10 to straighten it into an LL shape.` });
  // after left-rotating 10: left subtree root becomes 20 with left child 10
  let s2 = node(30); const twenty = node(20); twenty.left = node(10); s2.left = twenty;
  const straight = {}; straight[s2._id] = 'unbalanced'; straight[twenty._id] = 'key';
  frames.push({ tree: paint(s2, straight), caption: `Now 20 sits above 10 on a straight left spine under 30 — this is the LL shape. Step 2: RIGHT-rotate about 30.` });
  const nr = node(20), l = node(10), r = node(30); nr.left = l; nr.right = r;
  frames.push({ tree: paint(nr, { [nr._id]: 'current' }), caption: `20 rotates up to the root; 10 becomes left child, 30 becomes right child.` });
  frames.push({ tree: paint(nr, Object.fromEntries([nr._id, l._id, r._id].map(id => [id, 'done']))), caption: `Balanced. LR = left-rotate the child, then right-rotate the grandparent (two rotations).` });
  frames.push({ tree: paint(nr, { [nr._id]: 'key' }), caption: `Root 20: balance factor 0.` });
  frames.push({ tree: paint(nr, { [l._id]: 'visited', [r._id]: 'visited' }), caption: `Leaves 10 and 30: balance factor 0.` });
  frames.push({ tree: paint(nr, {}), caption: `LR rotation complete. Detect it when the heavy side and its child lean in OPPOSITE directions.` });
  return frames;
}

function avlRLFrames() {
  _nid = 0;
  // Insert 10, 30, 20 -> right child is left-heavy: RL
  let root = node(10); const frames = [];
  frames.push({ tree: clone(root), caption: `RL case. Insert 10 as root.` });
  root = clone(root); root.right = node(30);
  frames.push({ tree: paint(root, {}), caption: `Insert 30 > 10 — goes right.` });
  root = clone(root); root.right.left = node(20);
  const unb = {}; unb[root._id] = 'unbalanced'; unb[root.right._id] = 'key';
  frames.push({ tree: paint(root, unb), caption: `Insert 20 (10 < 20 < 30): lands left-of-right. 10 is right-heavy (-2) but its right child 30 leans LEFT — RIGHT-LEFT zig-zag.` });
  frames.push({ tree: paint(root, unb), caption: `Step 1: RIGHT-rotate the right child 30 to straighten the zig-zag into an RR shape.` });
  let s2 = node(10); const twenty = node(20); twenty.right = node(30); s2.right = twenty;
  const straight = {}; straight[s2._id] = 'unbalanced'; straight[twenty._id] = 'key';
  frames.push({ tree: paint(s2, straight), caption: `Now 20 sits above 30 on a straight right spine under 10 — the RR shape. Step 2: LEFT-rotate about 10.` });
  const nr = node(20), l = node(10), r = node(30); nr.left = l; nr.right = r;
  frames.push({ tree: paint(nr, { [nr._id]: 'current' }), caption: `20 rotates up to the root; 10 becomes left child, 30 becomes right child.` });
  frames.push({ tree: paint(nr, Object.fromEntries([nr._id, l._id, r._id].map(id => [id, 'done']))), caption: `Balanced. RL = right-rotate the child, then left-rotate the grandparent (two rotations).` });
  frames.push({ tree: paint(nr, { [nr._id]: 'key' }), caption: `Root 20: balance factor 0.` });
  frames.push({ tree: paint(nr, { [l._id]: 'visited', [r._id]: 'visited' }), caption: `Leaves 10 and 30: balance factor 0.` });
  frames.push({ tree: paint(nr, {}), caption: `RL rotation complete — the mirror image of LR. Both zig-zag cases need exactly two rotations.` });
  return frames;
}

// avl-tree (overview): grow an AVL tree showing a rotation triggered mid-insert.
function avlBuildFrames() {
  const frames = avlLLFrames().slice(0, 6);
  // Re-narrate as a build story then continue with a second rotation episode.
  const more = avlRLFrames().slice(2);
  return [...frames, ...more].map((f, i) => i === 0
    ? { ...f, caption: `AVL tree = BST + the rule |height(left) - height(right)| <= 1 at every node. ${f.caption}` }
    : f);
}

// ---------------------------------------------------------------------------
// B-tree / B+ tree: node value is a comma-joined key list. Binary renderer
// shows the two outer children; split mechanics narrated in captions.
// ---------------------------------------------------------------------------
function btreeInsertSplitFrames() {
  _nid = 0;
  const frames = [];
  // Order-4 B-tree (max 3 keys per node). Insert 10,20,30 then 40 -> split.
  let root = node('10');
  frames.push({ tree: clone(root), caption: `B-tree of order 4: each node holds up to 3 keys, all leaves at the same depth. Insert 10 — it is the root.` });
  root = node('10, 20');
  frames.push({ tree: clone(root), caption: `Insert 20: keys stay sorted inside the node → [10, 20]. No split, root still has room.` });
  root = node('10, 20, 30');
  frames.push({ tree: paint(root, { [root._id]: 'unbalanced' }), caption: `Insert 30 → [10, 20, 30]. The node is now FULL (3 keys = max for order 4).` });
  frames.push({ tree: paint(root, { [root._id]: 'unbalanced' }), caption: `Insert 40 would overflow to 4 keys. A B-tree never overflows — it SPLITS the full node before descending.` });
  // split: median of [10,20,30] is 20 -> promote 20, left=[10], right=[30]; 40 then joins right
  const r = node('20'); const lchild = node('10'); const rchild = node('30');
  r.left = lchild; r.right = rchild;
  frames.push({ tree: paint(r, { [r._id]: 'key' }), caption: `Split: promote the median key 20 into a new root; left child keeps [10], right child keeps [30]. Tree height grows by 1.` });
  const r2 = clone(r); r2.right = node('30, 40');
  frames.push({ tree: paint(r2, { [r2.right._id]: 'new' }), caption: `Now place 40: 40 > 20 so descend right into [30]; insert in sorted order → [30, 40].` });
  frames.push({ tree: paint(r2, {}), caption: `Done. Splitting on the way down keeps every leaf at the same depth — the tree stays perfectly balanced.` });
  // search illustration
  const sr = clone(r2);
  frames.push({ tree: paint(sr, { [sr._id]: 'visited' }), caption: `Search 40: at root compare against 20; 40 > 20, follow the right pointer.` });
  frames.push({ tree: paint(sr, { [sr._id]: 'visited', [sr.right._id]: 'found' }), caption: `In the right leaf [30, 40], scan keys: 40 found. High fan-out means few node hops = few disk reads.` });
  frames.push({ tree: paint(sr, {}), caption: `B-tree property: with up to m children per node, height is O(log_m n) — the whole point is minimizing I/O.` });
  return frames;
}

function btreeClassicFrames() {
  _nid = 0;
  const frames = [];
  // Order-3 (2-3 tree): max 2 keys. Insert 1,2,3,4,5 with two splits.
  let root = node('1');
  frames.push({ tree: clone(root), caption: `2-3 tree (B-tree of order 3): up to 2 keys per node, 2 or 3 children. Insert 1.` });
  root = node('1, 2');
  frames.push({ tree: clone(root), caption: `Insert 2 → root [1, 2]. Node is now full (2 keys).` });
  // insert 3 -> split: median 2 up
  let r = node('2'); r.left = node('1'); r.right = node('3');
  frames.push({ tree: paint(r, { [r._id]: 'key' }), caption: `Insert 3 overflows [1,2,3] → split: median 2 rises to a new root, leaving leaves [1] and [3].` });
  // insert 4 -> goes right into [3] -> [3,4]
  r = clone(r); r.right = node('3, 4');
  frames.push({ tree: paint(r, { [r.right._id]: 'new' }), caption: `Insert 4: 4 > 2 descend right, insert into leaf → [3, 4].` });
  // insert 5 -> right leaf [3,4,5] splits, median 4 promoted into root [2] -> [2,4]
  frames.push({ tree: paint(r, { [r.right._id]: 'unbalanced' }), caption: `Insert 5: right leaf becomes [3,4,5] — overflow. Split it: median 4 must rise to the parent.` });
  let r2 = node('2, 4'); r2.left = node('1'); r2.right = node('5');
  // middle child [3] cannot be shown by a binary renderer; narrate it.
  frames.push({ tree: paint(r2, { [r2._id]: 'key' }), caption: `4 joins the root → [2, 4]. The root now has THREE children: [1], [3] (middle), [5]. Only outer children drawn; middle [3] sits between 2 and 4.` });
  frames.push({ tree: paint(r2, {}), caption: `All leaves remain at depth 1 — splits push height up uniformly, never lopsidedly.` });
  // search 3
  const sr = clone(r2);
  frames.push({ tree: paint(sr, { [sr._id]: 'visited' }), caption: `Search 3: at root [2, 4], 2 < 3 < 4 → follow the MIDDLE pointer to leaf [3].` });
  frames.push({ tree: paint(sr, { [sr._id]: 'visited' }), caption: `Found 3 in the middle leaf. Every search path has the same length = the tree's uniform height.` });
  frames.push({ tree: paint(sr, {}), caption: `2-3 trees guarantee O(log n) height with at most one split per insertion level. The classic B-tree generalizes this to large m.` });
  return frames;
}

function bplusInsertFrames() {
  _nid = 0;
  const frames = [];
  // B+ tree: ALL keys live in leaves; internal nodes are routers; leaves linked.
  let root = node('1, 2, 3');
  frames.push({ tree: paint(root, { [root._id]: 'key' }), caption: `B+ tree: every actual record lives in a LEAF; internal nodes only route. Start with one leaf [1, 2, 3] (order 4, max 3 keys).` });
  frames.push({ tree: paint(root, { [root._id]: 'unbalanced' }), caption: `Insert 4 would overflow the leaf [1,2,3,4]. Split the leaf into [1,2] and [3,4].` });
  // split leaf: in B+ the SMALLEST key of the new right leaf (3) is COPIED up, not moved
  let r = node('3'); r.left = node('1, 2'); r.right = node('3, 4');
  frames.push({ tree: paint(r, { [r._id]: 'key' }), caption: `Leaf split: COPY the first key of the right leaf (3) up as a router. Unlike a B-tree, 3 still ALSO lives in the leaf [3, 4].` });
  frames.push({ tree: paint(r, { [r.left._id]: 'visited', [r.right._id]: 'visited' }), caption: `Leaves [1,2] and [3,4] are chained left→right by a sibling pointer (drawn implicitly). Internal 3 just says "< 3 go left, >= 3 go right".` });
  // insert 5 -> right leaf [3,4,5]
  r = clone(r); r.right = node('3, 4, 5');
  frames.push({ tree: paint(r, { [r.right._id]: 'new' }), caption: `Insert 5: 5 >= 3, descend right; leaf becomes [3, 4, 5] — full again.` });
  frames.push({ tree: paint(r, { [r.right._id]: 'unbalanced' }), caption: `Insert 6 overflows [3,4,5,6]. Split into [3,4] and [5,6]; copy 5 up into the router node.` });
  let r2 = node('3, 5'); r2.left = node('1, 2'); r2.right = node('5, 6');
  frames.push({ tree: paint(r2, { [r2._id]: 'key' }), caption: `Router now holds [3, 5] with three leaves: [1,2], [3,4] (middle), [5,6]. All data still in leaves; routers are copies.` });
  // range scan
  const sr = clone(r2);
  frames.push({ tree: paint(sr, { [sr._id]: 'visited' }), caption: `Range query 2..5: descend router [3,5] to find the FIRST leaf containing 2 → leaf [1,2].` });
  frames.push({ tree: paint(sr, { [sr.left._id]: 'found' }), caption: `Emit 2 from leaf [1,2], then follow the leaf SIBLING link rightward — no need to climb back up.` });
  frames.push({ tree: paint(sr, { [sr.right._id]: 'found' }), caption: `Walk linked leaves [3,4] → [5,6], emitting 3, 4, 5. Range scans are sequential leaf reads — the B+ tree's killer feature.` });
  frames.push({ tree: paint(sr, {}), caption: `Because all data sits in linked leaves of equal depth, point lookups and range scans both run in O(log_m n) + scan.` });
  return frames;
}

function bplusInternalsFrames() {
  _nid = 0;
  const frames = [];
  // Focus: internal vs leaf roles, fan-out, redistribute vs split.
  let r = node('30'); r.left = node('10, 20'); r.right = node('30, 40, 50');
  frames.push({ tree: paint(r, { [r._id]: 'key' }), caption: `B+ internals. Top node [30] is an INTERNAL router (keys only, no data). Below are two LEAF nodes holding the real records.` });
  frames.push({ tree: paint(r, { [r._id]: 'key', [r.left._id]: 'visited', [r.right._id]: 'visited' }), caption: `Router rule: key 30 separates leaves — anything < 30 in the left leaf, >= 30 in the right leaf.` });
  frames.push({ tree: paint(r, { [r.right._id]: 'unbalanced' }), caption: `Fan-out math: with a 4 KB page and ~16-byte entries, an internal node holds ~250 children — height stays tiny. Right leaf [30,40,50] is now full.` });
  // insert 60 -> right leaf full -> redistribute with left sibling if it has room
  frames.push({ tree: paint(r, { [r.right._id]: 'unbalanced', [r.left._id]: 'new' }), caption: `Insert 60 into the full right leaf. The left sibling [10,20] has spare room → REDISTRIBUTE instead of splitting (cheaper, avoids growing height).` });
  let r2 = node('30'); r2.left = node('10, 20'); r2.right = node('30, 40, 50, 60');
  // Actually redistribute: move boundary; show shifted
  let r3 = node('40'); r3.left = node('10, 20, 30'); r3.right = node('40, 50, 60');
  void r2;
  frames.push({ tree: paint(r3, { [r3._id]: 'key' }), caption: `Redistribute: shift one key across the sibling boundary and UPDATE the router from 30 to 40. No new node, height unchanged.` });
  frames.push({ tree: paint(r3, { [r3.left._id]: 'visited', [r3.right._id]: 'visited' }), caption: `Both leaves now hold 3 keys — balanced load. Splits only happen when a sibling can't absorb the overflow.` });
  // now force a split
  frames.push({ tree: paint(r3, { [r3.right._id]: 'unbalanced' }), caption: `Insert 70: right leaf [40,50,60,70] overflows and the sibling is also full → must SPLIT and grow the router.` });
  let r4 = node('40, 60'); r4.left = node('10, 20, 30'); r4.right = node('60, 70');
  frames.push({ tree: paint(r4, { [r4._id]: 'key' }), caption: `Split right leaf into [40,50] and [60,70]; copy 60 up so the router becomes [40, 60] with three leaves.` });
  frames.push({ tree: paint(r4, { [r4._id]: 'found' }), caption: `Leaf sibling pointers are re-stitched left→right so a range scan still walks the bottom level sequentially.` });
  frames.push({ tree: paint(r4, {}), caption: `Invariant kept: data only in leaves, leaves linked, internal nodes are sparse routers — that asymmetry is what makes B+ trees ideal for disk-backed indexes.` });
  return frames;
}

// ---------------------------------------------------------------------------
// Export map
// ---------------------------------------------------------------------------
export default {
  'binary-search-tree-operations': {
    title: 'Binary Search Tree Operations',
    renderer: 'tree',
    cases: [
      { label: 'Insert · Search · Delete', frames: bstOpsFrames() },
      { label: 'Sorted input degrades to O(n)', frames: bstSkewFrames() },
    ],
  },
  'bst-iterator-inorder': {
    title: 'BST Iterator (In-Order)',
    renderer: 'tree',
    cases: [
      { label: 'Stack-based next()', frames: bstIteratorFrames() },
      { label: 'Right-skewed tree, O(h) stack', frames: bstIteratorFrames([10, 20, 30, 40, 50]) },
    ],
  },
  'avl-tree': {
    title: 'AVL Tree',
    renderer: 'tree',
    cases: [
      { label: 'Build with rotations', frames: avlBuildFrames() },
      { label: 'LL rotation', frames: avlLLFrames() },
      { label: 'RL rotation', frames: avlRLFrames() },
    ],
  },
  'avl-tree-rotations': {
    title: 'AVL Tree Rotations',
    renderer: 'tree',
    cases: [
      { label: 'LL (single right)', frames: avlLLFrames() },
      { label: 'RR (single left)', frames: avlRRFrames() },
      { label: 'LR (left-right)', frames: avlLRFrames() },
      { label: 'RL (right-left)', frames: avlRLFrames() },
    ],
  },
  'b-tree': {
    title: 'B-Tree',
    renderer: 'tree',
    cases: [
      { label: 'Insert with split (order 4)', frames: btreeInsertSplitFrames() },
      { label: '2-3 tree splits', frames: btreeClassicFrames() },
    ],
  },
  'b-tree-classic': {
    title: 'B-Tree (Classic)',
    renderer: 'tree',
    cases: [
      { label: '2-3 tree: cascading splits', frames: btreeClassicFrames() },
      { label: 'Order-4 split', frames: btreeInsertSplitFrames() },
    ],
  },
  'b-plus-tree': {
    title: 'B+ Tree',
    renderer: 'tree',
    cases: [
      { label: 'Insert + leaf split', frames: bplusInsertFrames() },
      { label: 'Internals: redistribute vs split', frames: bplusInternalsFrames() },
    ],
  },
  'bplus-tree-internals': {
    title: 'B+ Tree Internals',
    renderer: 'tree',
    cases: [
      { label: 'Routers, redistribute, split', frames: bplusInternalsFrames() },
      { label: 'Insert + leaf split', frames: bplusInsertFrames() },
    ],
  },
};
