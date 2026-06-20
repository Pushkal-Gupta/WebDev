---
slug: virtual-dom-internals
module: cs-tools-encodings
title: Virtual DOM Internals
subtitle: How React's diff algorithm turns two element trees into a minimal sequence of DOM ops in O(n).
difficulty: Advanced
position: 81
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "React legacy docs — Reconciliation (O(n) heuristic, keys)"
    url: "https://legacy.reactjs.org/docs/reconciliation.html"
    type: docs
  - title: "react.dev — Preserving and resetting state (position vs key identity)"
    url: "https://react.dev/learn/preserving-and-resetting-state"
    type: docs
  - title: "Inferno team — The Virtual DOM is slow. Meet the Memo (diff cost study)"
    url: "https://svelte.dev/blog/virtual-dom-is-pure-overhead"
    type: blog
status: published
---

## intro
A virtual DOM is a plain JavaScript tree of `{ type, props, children }` objects that React builds on every render. Instead of mutating real DOM nodes during your `render`, you describe what the UI should look like and React computes the difference between the previous tree and the new one. That diff becomes a small batch of imperative DOM operations — `insertBefore`, `removeChild`, `setAttribute`. The whole point is to make declarative rendering cheap.

## whyItMatters
Touching the real DOM is expensive: layout invalidation, paint, style recomputation, and synchronous reflow can cost milliseconds per node. Re-rendering 1000 list rows naively would be unusable. The virtual DOM lets you write "always render the full list from state" and pay only for the rows that actually changed. The same algorithm powers Preact, Inferno, Vue 2, and Snabbdom — anything claiming a "declarative UI" runs some flavor of this diff. Understanding it is also the only way to debug the bug that bites every React developer: state that resets when it shouldn't, or persists when it shouldn't.

## intuition
Start with a thought experiment. You have two trees, old and new, each with N nodes. The optimal tree-edit distance is O(N^3) — far too slow for a UI framework that needs to repaint every keystroke. React makes two assumptions that drop this to O(N):

1. **If two nodes at the same position have different types, throw the whole subtree away and rebuild.** A `<div>` becoming a `<span>` is treated as "completely different UI" — there is no attempt to find common descendants. This collapses an exponential search into one comparison per node.
2. **The developer hints at list identity via `key`.** Without keys, children are matched by index. With keys, children are matched by name. That's the entire optimization — but it changes everything for lists where items move, reorder, or get inserted at the front.

The third invariant that confuses everyone: **state lives at a tree position, not on the component instance**. If the same component type sits at the same position across renders, React reuses its fiber and its hooks state. If you wrap it in an `if/else` that swaps types at that position, the state is gone. If you remount it under a different `key`, the state is gone. Position + type + key is the component's identity to React.

This is why "why does my input lose focus when I type?" is almost always either (a) a parent re-rendering with a new component reference at that position, or (b) `key={Math.random()}` on a list parent.

## visualization
```
Old tree                     New tree                      Diff ops
                                                            
   div                          div                         
  /   \                        /   \                        
 a     ul                     a     ul                      
       |                            |                       
   ┌───┼───┐                    ┌───┼───┐                   
  li   li   li                 li   li   li                 
  K=1  K=2  K=3                K=2  K=3  K=4                
                                                            
  position 0 -> div == div, recurse                         
  position 0.0 -> a == a, recurse                           
  position 0.1 -> ul == ul, recurse into children with keys 
                                                            
  Match by key (not index):                                 
    K=1 in old, not in new       -> REMOVE node K=1         
    K=2 in both, same type       -> reuse + update props    
    K=3 in both, same type       -> reuse + update props    
    K=4 in new, not in old       -> CREATE new li           
                                                            
  Without keys, React would have matched by index:          
    li[0] old(K=1) vs new(K=2)   -> update + rebuild        
    li[1] old(K=2) vs new(K=3)   -> update + rebuild        
    li[2] old(K=3) vs new(K=4)   -> update + rebuild        
  3 mutations instead of 1 add + 1 remove.                  
```

## bruteForce
The textbook tree-edit-distance algorithm (Zhang-Shasha, 1989) finds the minimum sequence of insert/delete/relabel operations to turn tree A into tree B in O(N^3) time and O(N^2) space. For a UI with 10,000 nodes that's 10^12 operations per render — unusable. Frameworks need diffs in single-digit milliseconds, so the optimal answer is sacrificed.

## optimal
React's reconciler runs a **single recursive walk** of the old and new trees in lockstep. At each pair of positions it picks one of four cases:

- **Both null** → nothing to do.
- **Old null, new present** → mount the new subtree (create DOM nodes, run effects).
- **Old present, new null** → unmount the old subtree (run cleanup, remove DOM nodes).
- **Both present** → check the `type` field. Different types → unmount old, mount new (no descent). Same type → reuse the DOM node, diff the props (one map walk to compute `attrsToSet` / `attrsToRemove`), then recurse into children.

For children, React looks at the parent's array of children:

- **No keys**: pair up by index. Children list `[A, B, C]` becoming `[D, A, B, C]` produces four type-compatible updates (every position now holds a different element), so React rebuilds all four nodes plus mounts one.
- **With keys**: build a map from `key -> oldChild`. Walk the new list left to right, popping matches from the map. Anything still in the map after the walk is removed. Anything new gets created. Anything matched gets reused, with a possible `insertBefore` if it moved.

The bookkeeping fits in O(N) time because every node is visited at most twice (once during the parent's children walk, once during its own recursive descent). Space is O(D) for the recursion stack where D is tree depth — typically tiny.

The killer subtlety: **a stable `key` is a promise to React that "this element is the same logical thing across renders."** Using array index as `key` is no key — it gives the same fast pairing as no-key behaviour and reintroduces the rebuild-on-reorder bug. Using `Math.random()` as `key` lies to React the other direction: every render looks brand new, state and DOM are recreated, focus is lost, scroll position resets.

## complexity
- **Time**: O(N) where N is the total number of nodes in the new tree. Each node is visited once during type/prop comparison; children matching is O(C) per parent using a hash map by `key`.
- **Space**: O(D) recursion stack where D is tree depth (Fiber converts this to a linked-list iteration — still O(D) for the work-in-progress chain).
- **Prop diff**: O(K) per element where K is the number of props on that element.
- **Best case** (nothing changed): O(N) since React still walks the tree to compare references. `React.memo` and `shouldComponentUpdate` short-circuit subtrees back to O(visited) by returning early.
- **Worst case for lists without keys**: still O(N) but with a constant multiplier from rebuilds; with keys, only changed positions pay.

## pitfalls
- **Index as `key` on a reorderable list.** Reordering rows now triggers prop updates on every position instead of one move. Inputs lose focus, animations restart, child state leaks across rows. Use a stable id from your data.
- **`Math.random()` or `Date.now()` as `key`.** Every render produces fresh keys, so React unmounts and remounts every child. The first render looks fine; everything after looks broken.
- **Same-type conditional swap.** Rendering `<Form mode="edit"/>` vs `<Form mode="view"/>` at the same position reuses the fiber — internal state persists. If you need a fresh state, wrap in `<div key={mode}>` to force reset.
- **Wrapping in a different parent.** `<>{...children}</>` vs `<div>{...children}</div>` are different types at the same position. All children unmount and remount, even though they look identical.
- **Trusting "the virtual DOM is fast"**. The diff itself is fast; the DOM mutations it emits aren't free. A perfect diff that creates 500 `<li>` is still 500 layout invalidations. Virtualize long lists; memoize expensive children.

## interviewTips
- When asked "how does React update the DOM efficiently," say the keywords: **O(n) heuristic**, **type comparison short-circuits subtrees**, **key-based child matching**. Then explain why the heuristic gives up optimality.
- For lists, the canonical interview answer is "stable id from data, never index, never random." Be ready to draw the reorder case showing why index breaks.
- Know the position-vs-key state rule. The question "why does my input lose state when I toggle this?" is asked in 9/10 senior React interviews; the answer is always "different position, different type, or different key."

## code.python
```python
# Minimal virtual-DOM diff producing a patch list.
# Not React — a teaching skeleton showing the four cases.

def h(type_, props=None, children=None):
    return {"type": type_, "props": props or {}, "children": children or []}

def diff_props(old, new):
    patches = []
    for k, v in new.items():
        if old.get(k) != v:
            patches.append(("SET", k, v))
    for k in old:
        if k not in new:
            patches.append(("REMOVE", k))
    return patches

def diff(old_node, new_node, path=()):
    if old_node is None and new_node is None:
        return []
    if old_node is None:
        return [("MOUNT", path, new_node)]
    if new_node is None:
        return [("UNMOUNT", path)]
    if old_node["type"] != new_node["type"]:
        return [("REPLACE", path, new_node)]
    patches = [("PROPS", path, diff_props(old_node["props"], new_node["props"]))]
    patches.extend(diff_children(old_node["children"], new_node["children"], path))
    return patches

def diff_children(old_kids, new_kids, path):
    keyed_old = {c["props"].get("key", i): c for i, c in enumerate(old_kids)}
    keyed_new = {c["props"].get("key", i): c for i, c in enumerate(new_kids)}
    patches = []
    for k, child in keyed_new.items():
        if k in keyed_old:
            patches.extend(diff(keyed_old[k], child, path + (k,)))
        else:
            patches.append(("MOUNT", path + (k,), child))
    for k in keyed_old:
        if k not in keyed_new:
            patches.append(("UNMOUNT", path + (k,)))
    return patches
```

## code.javascript
```javascript
const h = (type, props = {}, children = []) => ({ type, props, children });

function diffProps(oldP, newP) {
  const out = [];
  for (const k in newP) if (oldP[k] !== newP[k]) out.push(['SET', k, newP[k]]);
  for (const k in oldP) if (!(k in newP)) out.push(['REMOVE', k]);
  return out;
}

function diff(oldN, newN, path = []) {
  if (!oldN && !newN) return [];
  if (!oldN) return [['MOUNT', path, newN]];
  if (!newN) return [['UNMOUNT', path]];
  if (oldN.type !== newN.type) return [['REPLACE', path, newN]];
  const patches = [['PROPS', path, diffProps(oldN.props, newN.props)]];
  patches.push(...diffChildren(oldN.children, newN.children, path));
  return patches;
}

function diffChildren(oldKids, newKids, path) {
  const keyOf = (c, i) => c.props.key ?? i;
  const oldMap = new Map(oldKids.map((c, i) => [keyOf(c, i), c]));
  const out = [];
  newKids.forEach((c, i) => {
    const k = keyOf(c, i);
    if (oldMap.has(k)) out.push(...diff(oldMap.get(k), c, [...path, k]));
    else out.push(['MOUNT', [...path, k], c]);
    oldMap.delete(k);
  });
  for (const k of oldMap.keys()) out.push(['UNMOUNT', [...path, k]]);
  return out;
}
```

## code.java
```java
import java.util.*;

class VNode {
    String type;
    Map<String,Object> props;
    List<VNode> children;
    VNode(String t, Map<String,Object> p, List<VNode> c) {
        type = t; props = p; children = c;
    }
}

class VDomDiff {
    static List<Object[]> diff(VNode oldN, VNode newN, List<Object> path) {
        List<Object[]> out = new ArrayList<>();
        if (oldN == null && newN == null) return out;
        if (oldN == null) { out.add(new Object[]{"MOUNT", path, newN}); return out; }
        if (newN == null) { out.add(new Object[]{"UNMOUNT", path}); return out; }
        if (!oldN.type.equals(newN.type)) { out.add(new Object[]{"REPLACE", path, newN}); return out; }
        out.add(new Object[]{"PROPS", path, diffProps(oldN.props, newN.props)});
        out.addAll(diffChildren(oldN.children, newN.children, path));
        return out;
    }

    static List<Object[]> diffProps(Map<String,Object> oldP, Map<String,Object> newP) {
        List<Object[]> out = new ArrayList<>();
        for (var e : newP.entrySet()) if (!Objects.equals(oldP.get(e.getKey()), e.getValue())) out.add(new Object[]{"SET", e.getKey(), e.getValue()});
        for (var k : oldP.keySet()) if (!newP.containsKey(k)) out.add(new Object[]{"REMOVE", k});
        return out;
    }

    static List<Object[]> diffChildren(List<VNode> oldKids, List<VNode> newKids, List<Object> path) {
        Map<Object,VNode> oldMap = new LinkedHashMap<>();
        for (int i = 0; i < oldKids.size(); i++) oldMap.put(oldKids.get(i).props.getOrDefault("key", i), oldKids.get(i));
        List<Object[]> out = new ArrayList<>();
        for (int i = 0; i < newKids.size(); i++) {
            Object k = newKids.get(i).props.getOrDefault("key", i);
            List<Object> p = new ArrayList<>(path); p.add(k);
            if (oldMap.containsKey(k)) { out.addAll(diff(oldMap.remove(k), newKids.get(i), p)); }
            else out.add(new Object[]{"MOUNT", p, newKids.get(i)});
        }
        for (var k : oldMap.keySet()) { List<Object> p = new ArrayList<>(path); p.add(k); out.add(new Object[]{"UNMOUNT", p}); }
        return out;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <string>
#include <unordered_map>
#include <memory>
#include <variant>

struct VNode {
    std::string type;
    std::unordered_map<std::string, std::string> props;
    std::vector<std::shared_ptr<VNode>> children;
};

struct Patch { std::string op; std::vector<std::string> path; std::shared_ptr<VNode> node; };

std::vector<Patch> diff(std::shared_ptr<VNode> a, std::shared_ptr<VNode> b, std::vector<std::string> path = {}) {
    std::vector<Patch> out;
    if (!a && !b) return out;
    if (!a) { out.push_back({"MOUNT", path, b}); return out; }
    if (!b) { out.push_back({"UNMOUNT", path, nullptr}); return out; }
    if (a->type != b->type) { out.push_back({"REPLACE", path, b}); return out; }
    out.push_back({"PROPS", path, b});
    std::unordered_map<std::string, std::shared_ptr<VNode>> oldMap;
    for (size_t i = 0; i < a->children.size(); i++) {
        auto& c = a->children[i];
        auto it = c->props.find("key");
        oldMap[it == c->props.end() ? std::to_string(i) : it->second] = c;
    }
    for (size_t i = 0; i < b->children.size(); i++) {
        auto& c = b->children[i];
        auto it = c->props.find("key");
        std::string k = (it == c->props.end()) ? std::to_string(i) : it->second;
        auto p = path; p.push_back(k);
        if (oldMap.count(k)) { auto sub = diff(oldMap[k], c, p); for (auto& x : sub) out.push_back(x); oldMap.erase(k); }
        else out.push_back({"MOUNT", p, c});
    }
    for (auto& kv : oldMap) { auto p = path; p.push_back(kv.first); out.push_back({"UNMOUNT", p, nullptr}); }
    return out;
}
```
