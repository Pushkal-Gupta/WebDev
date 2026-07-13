# Grading Harness Invariants (HARD — read before touching problem types or the driver)

The grader must behave **exactly like LeetCode**. A solution that runs on LeetCode
must run here unchanged, and vice-versa. This file records a class of bug that broke
that promise and the invariants that prevent it from ever recurring.

## The bug (2026-07-12): trees/lists passed as raw serialization

Q429 *N-ary Tree Level Order Traversal* (and ~193 other problems) were typed
`List[int]`. The driver therefore passed the **raw serialization array**
(`[1,null,3,2,4,null,5,6]`) straight into the user's function. But a standard
LeetCode solution signature is `def levelOrder(self, root: 'Node')` and does
`root.children` / `root.val`. Calling `.val` on a plain list throws
`AttributeError: 'list' object has no attribute 'val'`. So a **correct LeetCode
solution failed here** — the single worst class of grading bug.

Scope when found: **134 binary-tree + 50 linked-list + 9 n-ary** problems mistyped
as raw arrays. A prior "fix" had papered over it by rewriting each *canonical* to
reconstruct the structure from a list internally — which made our canonical pass but
left every real user's node-based solution still broken. That is the trap: **making
the canonical pass is not the goal; making a real LeetCode solution pass is.**

## Invariant 1 — structural inputs are reconstructed into objects, never passed raw

A parameter that is semantically a binary tree, linked list, or n-ary tree MUST be
typed with the node type, NOT `List[int]`:

| Structure        | Param type (Python key) | Driver reconstructs to        | Input encoding (LeetCode) |
|------------------|-------------------------|-------------------------------|---------------------------|
| Binary tree      | `TreeNode`              | `TreeNode` object             | level-order with `null`   |
| Linked list      | `ListNode`              | `ListNode` object             | flat array                |
| N-ary tree       | `Node`                  | `Node` object w/ `.children`  | level-order, `null`-separated groups |

The driver (`src/lib/driverCode.js` `_to_tree`/`_to_list`/`_to_nary` and the edge
function `supabase/functions/grade-submission/index.ts` `PY_HELPERS`) builds the real
object from the JSON serialization and passes THAT. Node **returns** are serialized
back via `_from_tree`/`_from_list`/`_from_nary`. Null marker is JSON `null` — never
`-1` (a valid node value). Any tree/list problem whose test inputs use `-1` as a null
marker must be re-encoded to `null` before it can be typed as a node.

**Never** type a tree/list/n-ary param as `List[int]` "to keep it simple". That
reintroduces this bug.

## Invariant 2 — user code runs without writing imports (like LeetCode)

LeetCode pre-imports the common surface. So do we. The Python driver prepends
(`PY_IMPORTS` in both driver files):
`collections` (deque, defaultdict, Counter, OrderedDict), `heapq`, `bisect`, `math`
(incl. `inf`, `gcd`), `itertools`, `functools` (incl. `lru_cache`, `reduce`), `re`,
`random`, `typing` (`List`, `Optional`, …). A user must never have to write
`from collections import deque`. Redundant re-imports in user code are harmless.

## Invariant 3 — the two drivers MUST stay in sync

There are **two** harness generators and BOTH grade real submissions:
1. `src/lib/driverCode.js` — client fallback (`wrapWithDriver`) + local grading.
2. `supabase/functions/grade-submission/index.ts` `buildDriver` — the **primary
   production path** (client sends raw code; the edge function wraps it).

Any change to node reconstruction, imports, or output serialization MUST be made in
BOTH, and the edge function redeployed (`supabase functions deploy grade-submission`).
They diverged once — that is how the edge path shipped with `literal_eval` (which
can't even parse JSON `null`) and no tree reconstruction. Keep the output formats
identical: bool→`true`/`false`, `None`→`null`, top-level `str`→bare, everything else
→ `json.dumps` / `JSON.stringify`; node returns via `_from_*`. Numeric comparison
obeys Invariant 4.

## Invariant 4 — float tolerance NEVER touches integers (2026-07-13)

Real-valued answers compare with a ~1e-5 tolerance (LeetCode parity: a stored
expected rounded to 5 dp vs a canonical printing full precision must still match).
But the tolerance must be applied **only when a fractional value is involved**.

The bug: `deepEqual` used a *relative* band, `|a-b| <= 1e-5 * max(1,|a|,|b|)`, for
ALL numbers. For a large integer answer (a MOD 1e9+7 result, a big count) that band
spans **thousands** — e.g. expected `249373321` would accept a wrong `249373335`
(off by 14, a `MOD = 1e9-7` typo). A wrong solution passed. This is the same
severity as Invariant 1: a submission that LeetCode rejects must be rejected here.

Rule, in BOTH `deepEqual`s (client `driverCode.js` + edge `grade-submission`):
```
if (Number.isInteger(a) && Number.isInteger(b)) return a === b;   // exact
return Math.abs(a - b) <= 1e-5 * Math.max(1, |a|, |b|);           // floats only
```
Both-integer → exact. Tolerance applies only when at least one side is fractional
(so genuine float problems, incl. an integer-valued float vs a full-precision
canonical, still pass). Never widen this back to a relative band over integers.

## Invariant 5 — correctness is the RETURN value only; user prints are debug (2026-07-13)

LeetCode judges only what the method **returns**. A `print(...)` / `console.log(...)` /
`System.out.println(...)` / `cout <<` in the user's code is debug output shown in a
separate Stdout panel — it has **zero** bearing on accept/reject. Our driver appended
the serialized result to stdout AFTER the user's code ran, so any debug line polluted
the compared stdout and WA'd a correct solution (e.g. `print("Hello")` → stdout
`"Hello\n3"` vs expected `"3"`).

Fix, in BOTH drivers, all four languages: the user's own stdout is redirected to
**stderr** for the duration of the solution call, then the driver emits ONLY the
serialized return value to real stdout. Judge0 ignores stderr on a clean (exit-0) run,
so debug output can never change the verdict, and it stays available (on stderr) for a
debug panel. Mechanics:
- **Python** — `sys.stdout = sys.stdout`→`sys.stderr` around the call (restore in `finally`).
- **JS** — override `console.log/info/debug` to `process.stderr.write` around the call (restore in `finally`).
- **Java** — `System.setOut(System.err)` around the call; emit the result via a saved `_realOut`.
- **C++** — `dup2(2,1)` to point fd 1 at stderr during execution (covers both `cout` and `printf`); flush + `dup2` restore before writing the buffered result. Needs `#include <unistd.h>`.

Never emit the result on the same stream the user prints to without this separation.

## Prevention — verify before shipping

- `node scripts/verify-all-canonicals.mjs` runs every canonical against all its cases
  through the real driver. A tree/list problem that a standard node-based solution
  can't pass shows up here.
- `node scripts/audit-structural-types.mjs` (this class's guard): flags any problem
  whose description/canonical implies a tree/list/n-ary but whose param type is a raw
  array — run it after any import wave. It must report **zero** mistyped problems.
- When authoring a new tree/list/n-ary problem: type the param as `TreeNode`/
  `ListNode`/`Node`, encode nulls as JSON `null`, and confirm a *stock LeetCode
  solution* (node-based, no imports) passes — not just our canonical.
- If in doubt about expected behaviour for a specific problem, run the reference
  solution on leetcode.com and match its I/O exactly.
