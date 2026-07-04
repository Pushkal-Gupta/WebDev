---
slug: react-rendering-reconciliation
module: react-frontend
title: Rendering & Reconciliation
subtitle: How React re-computes a cheap in-memory tree on every render, diffs it against the last one, and patches only the real DOM nodes that actually changed.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 14
prereqs: [react-state-hooks]
relatedProblems: []
references:
  - title: "React — Render and Commit"
    url: "https://react.dev/learn/render-and-commit"
    type: article
  - title: "React — Preserving and Resetting State"
    url: "https://react.dev/learn/preserving-and-resetting-state"
    type: article
  - title: "React — Rendering Lists"
    url: "https://react.dev/learn/rendering-lists"
    type: article
  - title: "React — memo"
    url: "https://react.dev/reference/react/memo"
    type: article
  - title: "React (legacy) — Reconciliation"
    url: "https://legacy.reactjs.org/docs/reconciliation.html"
    type: article
status: published
---

## intro
When state changes in a React component, React does not immediately reach into the page and start editing DOM nodes. Instead it **re-runs your component function** to produce a fresh description of what the UI should look like — a lightweight tree of plain JavaScript objects called the **virtual DOM**. It then **reconciles** that new tree against the one from the previous render, working out the smallest set of real-DOM edits that turn the old screen into the new one, and only then does it touch the actual page. This two-phase dance — render a description, then diff and commit the changes — is the engine underneath everything React does.

## whyItMatters
The real DOM is slow: creating nodes, setting attributes, and reflowing layout are expensive operations, and doing them carelessly on every keystroke would make an app crawl. React's whole value proposition is that you write UI as a pure function of state — describe *what* the screen should be, not *how* to mutate it — and React figures out the minimal mutations for you. But that abstraction leaks in predictable ways: unnecessary re-renders, list items that lose their input focus or animation state when reordered, and components that silently reset. Every one of those bugs traces back to how reconciliation matches old nodes to new ones. Understanding the diffing rules is what separates "React just works" from "why did my form clear itself?" — and it is a staple front-end interview topic.

## intuition
Think of an editor marking up a manuscript versus reprinting the whole book. The naive way to update a page would be to throw away everything on screen and rebuild it from scratch — reprint the entire book because one paragraph changed. That is exactly what React refuses to do. Instead, every time your component renders, React produces a **cheap in-memory sketch** of the UI: not real DOM nodes, just plain objects saying "a `div` containing an `h1` with this text and a `ul` with these three `li` children." This sketch is the virtual DOM, and building it is fast because nothing touches the browser yet.

Now React has two sketches: the one it drew last time and the one it just drew. **Reconciliation** is the editor going through both drafts side by side, red pen in hand, marking only the differences — "this heading's text changed, patch it; this list gained an item, insert one node; this paragraph is identical, leave it alone." The output is a small **patch set**: the minimal list of real-DOM operations. Because the real DOM is the expensive part, React batches these patches and applies them in one pass during the **commit** phase, touching as few nodes as possible.

The subtle part is *how* React decides two nodes are "the same node." By default it matches children **by position**: the first child of the old list is compared to the first child of the new list, and so on. That works until a list reorders. If you prepend an item, every position shifts by one, and position-based matching now pairs each item against the wrong neighbour — React thinks every item changed and may destroy and rebuild DOM state that should have been preserved. **Keys** fix this. A key is a stable identity tag you attach to each list item, like a name badge that stays with a person as they move around a room. With keys, React matches items by identity instead of position, so a reordered item keeps its DOM node, its focus, its scroll position, and its component state — React just moves it. Keys are how you tell the editor "this is the same paragraph, it just moved," so it relocates instead of rewriting.

## visualization
```
  OLD vDOM tree              NEW vDOM tree            PATCH SET
  -------------              -------------            ---------
       ul                         ul
      /|\                        /|\
     / | \                      / | \
   li  li  li                 li  li  li
   A   B   C                  A   B*  D
   |   |   |                  |   |   |
  (keyA)(keyB)(keyC)      (keyA)(keyB)(keyD)

  match by key:
    keyA  A  == A          -> keep      (no patch)
    keyB  B  -> B*         -> UPDATE    (patch text B -> B*)
    keyC  C  -> (gone)     -> REMOVE    (unmount li C)
    keyD  (new)            -> ADD       (mount li D)

  commit: 1 text update + 1 remove + 1 insert  (not a full rebuild)
```

## bruteForce
The dead-simple approach is to skip diffing entirely: whenever anything changes, tear down the whole rendered subtree and rebuild it from the new description. It is trivially correct but catastrophically slow — every state change reflows and repaints the entire component, discarding DOM nodes that were perfectly fine. A subtler brute-force trap is diffing children **by position only, with no keys**. Rendering a list as `items.map(item => <Row .../>)` with no `key` makes React pair the Nth old row with the Nth new row. Reorder, insert at the front, or filter the list, and every position shifts — React mis-pairs the rows, patches the wrong nodes, and any per-row state (an open dropdown, a half-typed input) attaches to the wrong item.

## optimal
Reconciliation follows a small set of deterministic rules. When React re-renders, each component returns a new virtual-DOM tree, and React walks the old and new trees together comparing node by node.

**Rule 1 — different element type means replace.** If a node was a `<div>` and is now a `<span>` (or `<Counter>` became `<Profile>`), React does not try to diff their internals. It **unmounts the entire old subtree** — destroying its DOM and its component state — and **mounts the new one from scratch**. Type identity is all-or-nothing.

**Rule 2 — same type means patch in place.** If the type matches, React keeps the same DOM node and only **updates the attributes that differ** — change `className`, set a new `value`, update text — then recurses into the children. The node's identity and state survive.

**Rule 3 — children are matched by position, unless you provide keys.** Within a list of siblings, React lines up old and new children by index. This is fine for static lists but wrong for dynamic ones. A **key** overrides positional matching: React groups children by key, so an item with `key="user-42"` is matched to next render's `key="user-42"` no matter where it sits. Matched-by-key items are *moved*, not rebuilt, preserving their DOM node and state. This is why **index-as-key is a bug** on any list that can reorder, filter, or insert: the index of an item changes when the list changes, so `key={index}` still ties identity to position and reintroduces every positional bug — plus stale state bleeding into the wrong row.

**A parent re-render re-renders its children by default.** When a component renders, React re-invokes every child component beneath it and diffs their output — even children whose props did not change. That is usually cheap because diffing plain objects is fast, but for expensive subtrees you can short-circuit it: `React.memo` skips a child's re-render when its props are shallowly equal, and stable prop identity (avoiding fresh object/array/function literals each render) is what lets `memo` actually bite. Finally, the **commit phase** applies the computed patch set to the real DOM in one batched pass, then runs layout effects — so the browser sees a single coherent update rather than a flurry of intermediate states.

## complexity
time: A fully general tree diff — matching two arbitrary trees optimally — is **O(n^3)**, far too slow for UI. React sidesteps it with a **heuristic O(n) diff** built on two assumptions: elements of different types produce different trees (so it never diffs across a type change), and stable **keys** identify which children persist across renders. With those, one render's reconciliation is linear in the number of nodes.
space: O(n) to hold each virtual-DOM tree in memory (React keeps the current tree to diff the next one against), plus O(k) for the computed patch set, where k is the number of changed nodes.
notes: Diffing the virtual DOM is cheap but **not free** — it still walks the whole rendered tree. Keys and `memo` reduce work by pruning subtrees; they do not make an unbounded render count acceptable.

## pitfalls
- **Index as key on a reorderable list.** `key={index}` ties identity to position, so reordering, filtering, or prepending mis-pairs items — React patches the wrong nodes and per-row state (inputs, checkboxes, animations) sticks to the wrong item. Fix: key by a stable domain id (`key={item.id}`), never the array index, on any list that can change order.
- **Unstable keys.** `key={Math.random()}` or `key={{}}` (a fresh object each render) gives every item a brand-new identity every render, so React unmounts and remounts *everything* on each update — the exact opposite of what keys are for. Fix: keys must be stable and consistent across renders for the same logical item.
- **Assuming virtual-DOM diffing is free — or that it skips renders.** Reconciliation still walks the tree; a parent re-render still re-runs every child's function even if the DOM ends up unchanged. Diffing avoiding a DOM write is not the same as avoiding the render. Fix: use `React.memo` / stable prop identity to actually skip child renders when it matters; do not rely on "the virtual DOM makes it fast" as a blanket excuse.
- **Changing an element's TYPE at a position resets child state unexpectedly.** Rendering `{cond ? <Panel/> : <div>...</div>}` at the same slot, or swapping a wrapper element, makes React unmount the old subtree and mount a fresh one — losing input values, focus, and component state. Fix: keep the type stable across renders (render the same component and toggle its props/children), or deliberately use a changing `key` when you *want* a reset.

## interviewTips
- Be able to state the two-phase model crisply: **render** re-runs components to build a new virtual-DOM tree (pure, no DOM touched), then **commit** applies the diff to the real DOM. Many bugs come from confusing "React rendered" with "the DOM changed."
- Explain keys as **identity, not order**: they tell React which items are the same across renders so it can move rather than rebuild them, preserving DOM state. Then explain why index-as-key defeats this the moment the list reorders.
- Know the type rule: **same type patches in place, different type unmounts and remounts**. Interviewers love "why did my form reset when I toggled this?" — the answer is almost always a changed element type or a changed key at that slot.

## keyTakeaways
- Every render produces a fresh, cheap virtual-DOM tree; React reconciles it against the previous tree to compute a minimal patch set, then commits only those changes to the expensive real DOM.
- Reconciliation is rule-based: different type unmounts and remounts, same type patches in place, and children match by position unless stable keys override that with identity-based matching.
- Keys must be stable domain ids — index or random keys reintroduce positional bugs and stale state — and diffing is cheap but not free, so `memo` and stable props are how you actually skip needless child renders.

## code.jsx
```jsx
// Good vs. bad key choice on a reorderable list.
// Each row holds LOCAL state (a draft input). Watch what survives a reorder.

function Row({ user }) {
  const [draft, setDraft] = React.useState('');
  return (
    <li>
      <span>{user.name}</span>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="note..."
      />
    </li>
  );
}

// BAD: key={index}. Identity is tied to POSITION. Sort or filter the list and
// every index shifts -> React re-pairs rows by slot, so the note you typed in
// row 0 now shows against whatever user landed in slot 0. State leaks sideways.
function UserListBad({ users }) {
  return (
    <ul>
      {users.map((user, index) => (
        <Row key={index} user={user} />
      ))}
    </ul>
  );
}

// GOOD: key={user.id}. Identity travels WITH the user. Reorder the list and
// React matches by key, MOVES each existing <li> node, and the draft you typed
// stays attached to the correct person. DOM node, focus, and state preserved.
function UserListGood({ users }) {
  return (
    <ul>
      {users.map((user) => (
        <Row key={user.id} user={user} />
      ))}
    </ul>
  );
}
```

## code.javascript
```javascript
// A tiny reconciliation diff over two flat child lists.
// Each node is { key, value }. We match by KEY (identity), not by position,
// and emit the minimal patch set: added / removed / updated / moved.

function diff(oldNodes, newNodes) {
  var patches = [];

  var oldByKey = {};
  var oldIndex = {};
  for (var i = 0; i < oldNodes.length; i++) {
    oldByKey[oldNodes[i].key] = oldNodes[i];
    oldIndex[oldNodes[i].key] = i;
  }

  var newByKey = {};
  for (var j = 0; j < newNodes.length; j++) {
    newByKey[newNodes[j].key] = newNodes[j];
  }

  // Walk the NEW list: decide add / update / move for each key.
  for (var n = 0; n < newNodes.length; n++) {
    var node = newNodes[n];
    var prev = oldByKey[node.key];

    if (!prev) {
      patches.push({ op: 'add', key: node.key, value: node.value, at: n });
    } else {
      if (prev.value !== node.value) {
        patches.push({ op: 'update', key: node.key, from: prev.value, to: node.value });
      }
      if (oldIndex[node.key] !== n) {
        patches.push({ op: 'move', key: node.key, from: oldIndex[node.key], to: n });
      }
    }
  }

  // Anything in OLD but not in NEW is unmounted.
  for (var k = 0; k < oldNodes.length; k++) {
    if (!newByKey[oldNodes[k].key]) {
      patches.push({ op: 'remove', key: oldNodes[k].key });
    }
  }

  return patches;
}

var oldTree = [
  { key: 'a', value: 'Apple' },
  { key: 'b', value: 'Banana' },
  { key: 'c', value: 'Cherry' },
];

var newTree = [
  { key: 'b', value: 'Blueberry' }, // moved up + value changed
  { key: 'a', value: 'Apple' },     // moved down, unchanged value
  { key: 'd', value: 'Date' },      // brand new
  // 'c' (Cherry) dropped -> remove
];

console.log(diff(oldTree, newTree));
// [
//   { op: 'update', key: 'b', from: 'Banana', to: 'Blueberry' },
//   { op: 'move',   key: 'b', from: 1, to: 0 },
//   { op: 'move',   key: 'a', from: 0, to: 1 },
//   { op: 'add',    key: 'd', value: 'Date', at: 2 },
//   { op: 'remove', key: 'c' }
// ]
// Keyed matching keeps 'a' and 'b' as the SAME nodes (moved, not rebuilt);
// only 'd' mounts and 'c' unmounts. That is the minimal patch set.
```
