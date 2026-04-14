-- ═══════════════════════════════════════════════════════════════
-- Expand Dry Runs — Batch 4: Stack / Queue / Heap / Trie / Design
-- ───────────────────────────────────────────────────────────────
-- 18 problems, 10-13 frames each. Preserves existing renderer types.
-- ═══════════════════════════════════════════════════════════════


-- ══════════════════════════ STACK ══════════════════════════════

-- ── EVAL-RPN ────────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'eval-rpn';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('eval-rpn', 1, 'Problem Setup', '{
  "type": "stack",
  "items": [],
  "operation": "Evaluate RPN",
  "status": "Given tokens = [\"2\",\"1\",\"+\",\"3\",\"*\"]. Evaluate as Reverse Polish Notation. Expected: (2+1)*3 = 9."
}'::jsonb),
('eval-rpn', 2, 'Approach: Stack of Operands', '{
  "type": "stack",
  "items": [],
  "operation": "Why a stack?",
  "status": "In RPN, an operator applies to the two most recent operands. A stack naturally gives us O(1) access to ''the most recent things''. Push numbers; on an operator, pop two, compute, push result."
}'::jsonb),
('eval-rpn', 3, 'Complexity', '{
  "type": "stack",
  "items": [],
  "operation": "Analyze",
  "status": "Time O(n): each token is pushed/popped at most a constant number of times. Space O(n) for the stack in the worst case."
}'::jsonb),
('eval-rpn', 4, 'Initialize Empty Stack', '{
  "type": "stack",
  "items": [],
  "operation": "stack = []",
  "status": "Start with an empty operand stack. We will scan tokens left-to-right."
}'::jsonb),
('eval-rpn', 5, 'Token \"2\" → push', '{
  "type": "stack",
  "items": [2],
  "operation": "push 2",
  "status": "Token is a number. Push 2 onto the stack. stack = [2]."
}'::jsonb),
('eval-rpn', 6, 'Token \"1\" → push', '{
  "type": "stack",
  "items": [2, 1],
  "operation": "push 1",
  "status": "Another number. Push 1. stack = [2, 1]. The top of stack is the most recent operand."
}'::jsonb),
('eval-rpn', 7, 'Token \"+\": pop b=1', '{
  "type": "stack",
  "items": [2],
  "operation": "pop b=1",
  "status": "Operator +. First pop gives the RIGHT operand b=1 (because it was pushed last). stack = [2]."
}'::jsonb),
('eval-rpn', 8, 'Token \"+\": pop a=2, compute', '{
  "type": "stack",
  "items": [],
  "operation": "pop a=2; compute 2+1=3",
  "status": "Second pop gives the LEFT operand a=2. Evaluate a OP b = 2 + 1 = 3. Order matters for − and / — always: a is second-popped, b is first-popped."
}'::jsonb),
('eval-rpn', 9, 'Push result 3', '{
  "type": "stack",
  "items": [3],
  "operation": "push 3",
  "status": "Push the partial result 3 back. stack = [3]. It may participate in the next operation."
}'::jsonb),
('eval-rpn', 10, 'Token \"3\" → push', '{
  "type": "stack",
  "items": [3, 3],
  "operation": "push 3",
  "status": "Number 3. Push. stack = [3, 3]."
}'::jsonb),
('eval-rpn', 11, 'Token \"*\": pop and multiply', '{
  "type": "stack",
  "items": [9],
  "operation": "3 * 3 = 9",
  "status": "Operator *. Pop b=3, pop a=3. Compute 3 * 3 = 9. Push 9. stack = [9]."
}'::jsonb),
('eval-rpn', 12, 'Tokens Exhausted', '{
  "type": "stack",
  "items": [9],
  "operation": "done scanning",
  "status": "All tokens processed. A well-formed RPN expression leaves exactly one value on the stack — the answer."
}'::jsonb),
('eval-rpn', 13, 'Return 9', '{
  "type": "stack",
  "items": [9],
  "operation": "return stack.top() = 9",
  "status": "Return 9. Time O(n), Space O(n). Stack elegantly encodes evaluation order without recursion or precedence parsing."
}'::jsonb);


-- ── MIN-STACK ────────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'min-stack';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('min-stack', 1, 'Problem Setup', '{
  "type": "stack",
  "items": [],
  "operation": "Design MinStack",
  "status": "Design a stack supporting push(x), pop(), top(), and getMin() — all in O(1) time."
}'::jsonb),
('min-stack', 2, 'Approach: Auxiliary Min Stack', '{
  "type": "stack",
  "items": [],
  "operation": "Two parallel stacks",
  "status": "Scanning to find the min on every getMin() is O(n). Instead keep a parallel stack minStack where minStack[i] = min(stack[0..i]). Push/pop both together."
}'::jsonb),
('min-stack', 3, 'Complexity', '{
  "type": "stack",
  "items": [],
  "operation": "O(1) each op",
  "status": "All four operations are O(1). Extra space O(n) for minStack — a fine trade for constant-time min queries."
}'::jsonb),
('min-stack', 4, 'Initialize', '{
  "type": "stack",
  "items": [],
  "operation": "stack=[], minStack=[]",
  "status": "Both stacks start empty."
}'::jsonb),
('min-stack', 5, 'push(-2)', '{
  "type": "stack",
  "items": [-2],
  "operation": "push -2 to both",
  "status": "stack=[-2]. minStack empty → running min is -2; push -2. minStack=[-2]."
}'::jsonb),
('min-stack', 6, 'push(0)', '{
  "type": "stack",
  "items": [-2, 0],
  "operation": "push 0; min unchanged",
  "status": "stack=[-2, 0]. min(prev -2, new 0) = -2; push -2 to minStack. minStack=[-2, -2]."
}'::jsonb),
('min-stack', 7, 'push(-3) — new min', '{
  "type": "stack",
  "items": [-2, 0, -3],
  "operation": "push -3; min updates",
  "status": "stack=[-2, 0, -3]. min(prev -2, new -3) = -3; push -3 to minStack. minStack=[-2, -2, -3]."
}'::jsonb),
('min-stack', 8, 'getMin() → -3', '{
  "type": "stack",
  "items": [-2, 0, -3],
  "operation": "return minStack.top()",
  "status": "getMin() = minStack.top() = -3. O(1), no scanning."
}'::jsonb),
('min-stack', 9, 'pop() — remove -3', '{
  "type": "stack",
  "items": [-2, 0],
  "operation": "pop both",
  "status": "Pop -3 from stack and -3 from minStack. stack=[-2, 0], minStack=[-2, -2]. Running min correctly reverts to -2."
}'::jsonb),
('min-stack', 10, 'top() → 0', '{
  "type": "stack",
  "items": [-2, 0],
  "operation": "stack.top()",
  "status": "top() returns 0 — the real stack is untouched by the min bookkeeping."
}'::jsonb),
('min-stack', 11, 'getMin() → -2', '{
  "type": "stack",
  "items": [-2, 0],
  "operation": "return minStack.top()",
  "status": "Now getMin() = -2, reflecting the current contents."
}'::jsonb),
('min-stack', 12, 'Invariant Recap', '{
  "type": "stack",
  "items": [-2, 0],
  "operation": "why this works",
  "status": "At every moment, minStack.top() = min of current stack. Because we duplicate the running min on every push, pop is symmetric."
}'::jsonb),
('min-stack', 13, 'Result', '{
  "type": "stack",
  "items": [-2, 0],
  "operation": "all O(1)",
  "status": "All four methods run in O(1) time with O(n) extra space. Classic space-for-time tradeoff."
}'::jsonb);


-- ── NEXT-GREATER-ELEMENT ────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'next-greater-element';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('next-greater-element', 1, 'Problem Setup', '{
  "type": "stack",
  "items": [],
  "operation": "nums1=[4,1,2], nums2=[1,3,4,2]",
  "status": "For each x in nums1, find the next greater element to its right in nums2 (or -1). Expected: [-1, 3, -1]."
}'::jsonb),
('next-greater-element', 2, 'Approach: Monotonic Decreasing Stack', '{
  "type": "stack",
  "items": [],
  "operation": "Why stack?",
  "status": "Scan nums2 left-to-right, keep a decreasing stack of values waiting for their ''next greater''. When current > stack.top(), the top has found its answer. Record into a hash map, then query for each nums1 entry."
}'::jsonb),
('next-greater-element', 3, 'Complexity', '{
  "type": "stack",
  "items": [],
  "operation": "O(n+m)",
  "status": "Each element of nums2 is pushed and popped at most once. Hash lookups O(1). Total O(n + m)."
}'::jsonb),
('next-greater-element', 4, 'Initialize', '{
  "type": "stack",
  "items": [],
  "operation": "stack=[], map={}",
  "status": "Empty monotonic stack, empty answer map."
}'::jsonb),
('next-greater-element', 5, 'Scan nums2[0]=1 → push', '{
  "type": "stack",
  "items": [1],
  "operation": "push 1",
  "status": "Stack empty. Push 1. stack=[1]. 1 is waiting for the next greater value to its right."
}'::jsonb),
('next-greater-element', 6, 'Scan nums2[1]=3: 3>1 → pop', '{
  "type": "stack",
  "items": [],
  "operation": "pop 1; map[1]=3",
  "status": "3 > top(1). 1 has found its next greater → map[1] = 3. Pop 1. Stack now empty."
}'::jsonb),
('next-greater-element', 7, 'Still at 3 → push', '{
  "type": "stack",
  "items": [3],
  "operation": "push 3",
  "status": "Stack empty, no more pops. Push current value 3. stack=[3]."
}'::jsonb),
('next-greater-element', 8, 'Scan nums2[2]=4: 4>3 → pop', '{
  "type": "stack",
  "items": [],
  "operation": "pop 3; map[3]=4",
  "status": "4 > top(3). map[3] = 4. Pop 3. Push 4. stack=[4]."
}'::jsonb),
('next-greater-element', 9, 'Scan nums2[3]=2: 2<4 → push', '{
  "type": "stack",
  "items": [4, 2],
  "operation": "push 2",
  "status": "2 < top(4), monotonic invariant preserved. Push 2. stack=[4, 2]. Both still waiting."
}'::jsonb),
('next-greater-element', 10, 'End of nums2: leftovers → -1', '{
  "type": "stack",
  "items": [4, 2],
  "operation": "flush with -1",
  "status": "Anything left on the stack has no greater element to its right. map[4] = -1, map[2] = -1. Final map = {1:3, 3:4, 4:-1, 2:-1}."
}'::jsonb),
('next-greater-element', 11, 'Query nums1', '{
  "type": "stack",
  "items": [],
  "operation": "build answer",
  "status": "For each x in nums1=[4,1,2], look up map[x]. map[4]=-1, map[1]=3, map[2]=-1."
}'::jsonb),
('next-greater-element', 12, 'Answer = [-1, 3, -1]', '{
  "type": "stack",
  "items": [],
  "operation": "result",
  "status": "Return [-1, 3, -1]. Each index in nums2 entered and left the stack at most once."
}'::jsonb),
('next-greater-element', 13, 'Complexity Recap', '{
  "type": "stack",
  "items": [],
  "operation": "O(n+m) time",
  "status": "Time O(n + m), Space O(n) for stack + map. The monotonic stack pattern generalizes to daily-temperatures, next-greater-II, etc."
}'::jsonb);


-- ── REMOVE-K-DIGITS ─────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'remove-k-digits';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('remove-k-digits', 1, 'Problem Setup', '{
  "type": "stack",
  "items": [],
  "operation": "num=\"1432219\", k=3",
  "status": "Remove k=3 digits from \"1432219\" to form the smallest possible number. Expected: \"1219\"."
}'::jsonb),
('remove-k-digits', 2, 'Approach: Monotonic Increasing Stack', '{
  "type": "stack",
  "items": [],
  "operation": "greedy",
  "status": "A digit is worth removing when it is greater than its right neighbor (that bigger digit is in a higher place value). Keep an increasing stack; when top > new digit and k>0, pop (remove top) until invariant restored."
}'::jsonb),
('remove-k-digits', 3, 'Complexity', '{
  "type": "stack",
  "items": [],
  "operation": "O(n)",
  "status": "Each digit is pushed/popped at most once. O(n) time, O(n) space for the stack."
}'::jsonb),
('remove-k-digits', 4, 'Initialize', '{
  "type": "stack",
  "items": [],
  "operation": "stack=[], k=3",
  "status": "Empty stack, k=3 removals remaining."
}'::jsonb),
('remove-k-digits', 5, 'digit 1 → push', '{
  "type": "stack",
  "items": [1],
  "operation": "push 1 (k=3)",
  "status": "Stack empty → push 1."
}'::jsonb),
('remove-k-digits', 6, 'digit 4 → push', '{
  "type": "stack",
  "items": [1, 4],
  "operation": "push 4 (k=3)",
  "status": "4 > top(1), monotone increasing preserved. Push. No pop."
}'::jsonb),
('remove-k-digits', 7, 'digit 3: 4>3 → pop, k→2', '{
  "type": "stack",
  "items": [1, 3],
  "operation": "pop 4; push 3 (k=2)",
  "status": "top(4) > 3 and k>0 → pop 4. k=2. Then push 3. Removing the bigger leading 4 makes the number smaller."
}'::jsonb),
('remove-k-digits', 8, 'digit 2: 3>2 → pop, k→1', '{
  "type": "stack",
  "items": [1, 2],
  "operation": "pop 3; push 2 (k=1)",
  "status": "top(3) > 2 → pop 3. k=1. Push 2."
}'::jsonb),
('remove-k-digits', 9, 'digit 2 → push (tie, no pop)', '{
  "type": "stack",
  "items": [1, 2, 2],
  "operation": "push 2 (k=1)",
  "status": "top(2) not > 2. Push. Ties are fine — we only pop on strict >.."
}'::jsonb),
('remove-k-digits', 10, 'digit 1: 2>1 → pop, k→0', '{
  "type": "stack",
  "items": [1, 2, 1],
  "operation": "pop 2; push 1 (k=0)",
  "status": "top(2) > 1 → pop. k=0. Further pops are now forbidden. Push 1."
}'::jsonb),
('remove-k-digits', 11, 'digit 9 → push (k=0)', '{
  "type": "stack",
  "items": [1, 2, 1, 9],
  "operation": "push 9",
  "status": "k=0, so no more pops even if we wanted them. Push 9."
}'::jsonb),
('remove-k-digits', 12, 'Handle leftover k, leading zeros', '{
  "type": "stack",
  "items": [1, 2, 1, 9],
  "operation": "k=0 already",
  "status": "If k>0 remained, we would pop from the end (smallest trailing). Then strip leading zeros. Here k=0 and no leading zeros."
}'::jsonb),
('remove-k-digits', 13, 'Result = \"1219\"', '{
  "type": "stack",
  "items": [1, 2, 1, 9],
  "operation": "return \"1219\"",
  "status": "Join stack → \"1219\". Time O(n), Space O(n). Greedy removal via monotone stack is the key insight."
}'::jsonb);


-- ── VALID-PARENTHESES ───────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'valid-parentheses';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('valid-parentheses', 1, 'Problem Setup', '{
  "type": "stack",
  "items": [],
  "operation": "s=\"()[]{}\"",
  "status": "Given a string of brackets, return true iff every bracket is properly nested and matched. Expected: true."
}'::jsonb),
('valid-parentheses', 2, 'Approach: Stack of Expected Closers', '{
  "type": "stack",
  "items": [],
  "operation": "LIFO matching",
  "status": "Brackets nest in LIFO order. On each opener, push its matching closer. On a closer, it must equal stack.top(); otherwise invalid."
}'::jsonb),
('valid-parentheses', 3, 'Complexity', '{
  "type": "stack",
  "items": [],
  "operation": "O(n)",
  "status": "Each character triggers at most one push and one pop. Time O(n), Space O(n)."
}'::jsonb),
('valid-parentheses', 4, 'Initialize', '{
  "type": "stack",
  "items": [],
  "operation": "empty stack",
  "status": "Empty stack. Map = {''('':'')'', ''['':'']'', ''{'':''}''}."
}'::jsonb),
('valid-parentheses', 5, 'char ''('' → push '')''', '{
  "type": "stack",
  "items": [")"],
  "operation": "push )",
  "status": "Opener ''(''. Push its expected closer '')''. stack=[\")\"]."
}'::jsonb),
('valid-parentheses', 6, 'char '')'' matches top', '{
  "type": "stack",
  "items": [],
  "operation": "pop )",
  "status": "Closer '')''. top = '')'' — match! Pop. stack=[]."
}'::jsonb),
('valid-parentheses', 7, 'char ''['' → push '']''', '{
  "type": "stack",
  "items": ["]"],
  "operation": "push ]",
  "status": "Opener ''[''. Push '']''. stack=[\"]\"]"
}'::jsonb),
('valid-parentheses', 8, 'char '']'' matches top', '{
  "type": "stack",
  "items": [],
  "operation": "pop ]",
  "status": "Closer '']''. top = '']''. Pop. stack=[]."
}'::jsonb),
('valid-parentheses', 9, 'char ''{'' → push ''}''', '{
  "type": "stack",
  "items": ["}"],
  "operation": "push }",
  "status": "Opener ''{''. Push ''}''. stack=[\"}\"]."
}'::jsonb),
('valid-parentheses', 10, 'char ''}'' matches top', '{
  "type": "stack",
  "items": [],
  "operation": "pop }",
  "status": "Closer ''}''. top matches. Pop."
}'::jsonb),
('valid-parentheses', 11, 'Early-fail Cases', '{
  "type": "stack",
  "items": [],
  "operation": "invariants",
  "status": "Would fail early if: (a) closer seen with empty stack, or (b) closer does not equal top. Either → return false immediately."
}'::jsonb),
('valid-parentheses', 12, 'End: stack empty?', '{
  "type": "stack",
  "items": [],
  "operation": "check empty",
  "status": "Scan finished. Stack empty → every opener was closed in correct order."
}'::jsonb),
('valid-parentheses', 13, 'Return true', '{
  "type": "stack",
  "items": [],
  "operation": "valid",
  "status": "Return true. Time O(n), Space O(n). Stack models nesting perfectly because brackets obey LIFO."
}'::jsonb);


-- ══════════════════════════ QUEUE ══════════════════════════════

-- ── IMPLEMENT-STACK-QUEUES (Stack using two Queues) ─────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'implement-stack-queues';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('implement-stack-queues', 1, 'Problem Setup', '{
  "type": "queue",
  "items": [],
  "operation": "Design Stack using Queues",
  "status": "Implement LIFO stack operations (push, pop, top, empty) using only standard FIFO queue operations."
}'::jsonb),
('implement-stack-queues', 2, 'Approach: Rotate on Push', '{
  "type": "queue",
  "items": [],
  "operation": "one-queue trick",
  "status": "Push: enqueue x, then rotate the queue by dequeueing and re-enqueueing the previous (n-1) items. Now x sits at the FRONT. Front of queue = top of stack."
}'::jsonb),
('implement-stack-queues', 3, 'Complexity', '{
  "type": "queue",
  "items": [],
  "operation": "push O(n), pop O(1)",
  "status": "Push O(n) due to rotation. Pop / top / empty all O(1) because the newest element is already at the front."
}'::jsonb),
('implement-stack-queues', 4, 'Initialize', '{
  "type": "queue",
  "items": [],
  "operation": "q = []",
  "status": "Start with one empty FIFO queue."
}'::jsonb),
('implement-stack-queues', 5, 'push(1)', '{
  "type": "queue",
  "items": [1],
  "operation": "enqueue 1",
  "status": "Enqueue 1. No rotation needed (size was 0). q=[1]. Front=1."
}'::jsonb),
('implement-stack-queues', 6, 'push(2): enqueue', '{
  "type": "queue",
  "items": [1, 2],
  "operation": "enqueue 2",
  "status": "Enqueue 2. Before rotation: q=[1, 2]. Front is still 1 (wrong for stack semantics)."
}'::jsonb),
('implement-stack-queues', 7, 'push(2): rotate 1 step', '{
  "type": "queue",
  "items": [2, 1],
  "operation": "dequeue 1, enqueue 1",
  "status": "Rotate n-1 = 1 time: dequeue 1 from front, enqueue to back. q=[2, 1]. Now 2 is at the front — correct LIFO top."
}'::jsonb),
('implement-stack-queues', 8, 'push(3): enqueue', '{
  "type": "queue",
  "items": [2, 1, 3],
  "operation": "enqueue 3",
  "status": "Enqueue 3. q=[2, 1, 3]."
}'::jsonb),
('implement-stack-queues', 9, 'push(3): rotate 2 steps', '{
  "type": "queue",
  "items": [3, 2, 1],
  "operation": "rotate two items",
  "status": "Dequeue 2, enqueue → q=[1, 3, 2]. Dequeue 1, enqueue → q=[3, 2, 1]. 3 is now at the front, the stack top."
}'::jsonb),
('implement-stack-queues', 10, 'top() → 3', '{
  "type": "queue",
  "items": [3, 2, 1],
  "operation": "peek front",
  "status": "top() simply returns q.front() = 3. O(1)."
}'::jsonb),
('implement-stack-queues', 11, 'pop() → 3', '{
  "type": "queue",
  "items": [2, 1],
  "operation": "dequeue",
  "status": "Dequeue the front — 3 leaves. q=[2, 1]. Stack now has [2 at top, 1 below]."
}'::jsonb),
('implement-stack-queues', 12, 'pop() → 2', '{
  "type": "queue",
  "items": [1],
  "operation": "dequeue",
  "status": "Dequeue front 2. q=[1]."
}'::jsonb),
('implement-stack-queues', 13, 'empty()?', '{
  "type": "queue",
  "items": [1],
  "operation": "return size==0",
  "status": "empty() = (size == 0) → false. The invariant ''newest is always at front'' makes pop/top O(1); push bears the rotation cost."
}'::jsonb);


-- ══════════════════════════ ARRAY (Heap / Trie / Design) ═══════

-- ── DESIGN-ADD-SEARCH (WordDictionary with Trie) ────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'design-add-search';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('design-add-search', 1, 'Problem Setup', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Design WordDictionary: addWord(w) and search(pattern) where pattern may contain ''.'' matching any single letter. Example: add ''bad'',''dad'',''mad'', then search(''.ad'') → true."
}'::jsonb),
('design-add-search', 2, 'Approach: Trie + DFS on dots', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"structure": "Trie", "node": "{children[26], isEnd}"},
  "status": "Trie shares prefixes so adds are O(L). On search, normal chars follow one child; ''.'' branches into ALL children via DFS."
}'::jsonb),
('design-add-search', 3, 'Complexity', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"add": "O(L)", "search": "O(26^d * L) worst"},
  "status": "addWord: O(L). search: O(L) if no dots; worst O(26^d · L) where d = #dots. Space O(total chars)."
}'::jsonb),
('design-add-search', 4, 'Initialize', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"root": "{}"},
  "status": "Create empty root node. No children, isEnd=false."
}'::jsonb),
('design-add-search', 5, 'addWord(\"bad\")', '{
  "type": "array",
  "array": ["b", "a", "d"],
  "highlights": [0, 1, 2],
  "pointers": {"i": 2},
  "hashmap": {"path": "root → b → a → d", "isEnd(d)": "true"},
  "status": "Walk from root; for each char, create child if missing. After ''bad'': path b-a-d, mark last node isEnd=true."
}'::jsonb),
('design-add-search', 6, 'addWord(\"dad\")', '{
  "type": "array",
  "array": ["d", "a", "d"],
  "highlights": [0, 1, 2],
  "pointers": {"i": 2},
  "hashmap": {"root.children": "{b, d}", "path": "root → d → a → d", "isEnd": "true"},
  "status": "Root now has two children: b and d. Create d→a→d, mark terminal."
}'::jsonb),
('design-add-search', 7, 'addWord(\"mad\")', '{
  "type": "array",
  "array": ["m", "a", "d"],
  "highlights": [0, 1, 2],
  "pointers": {"i": 2},
  "hashmap": {"root.children": "{b, d, m}", "path": "root → m → a → d"},
  "status": "Add m→a→d. Root children = {b, d, m}. Three words stored."
}'::jsonb),
('design-add-search', 8, 'search(\"pad\") — miss', '{
  "type": "array",
  "array": ["p", "a", "d"],
  "highlights": [0],
  "highlightColor": "red",
  "pointers": {"i": 0},
  "hashmap": {"node": "root", "children_have_p": "false"},
  "status": "At root, look up child ''p''. Missing → return false immediately."
}'::jsonb),
('design-add-search', 9, 'search(\".ad\") — DFS start', '{
  "type": "array",
  "array": [".", "a", "d"],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashmap": {"node": "root", "branches": "b, d, m"},
  "status": "''.'' at i=0 → try every child of root: b, d, m. Recurse into each with remainder ''ad''."
}'::jsonb),
('design-add-search', 10, 'DFS via ''b'' branch: ''ad''', '{
  "type": "array",
  "array": [".", "a", "d"],
  "highlights": [1, 2],
  "pointers": {"i": 1},
  "hashmap": {"node": "b", "follow": "a → d", "isEnd": "true"},
  "status": "In branch b: match ''a'' at b.children[a], then ''d'' at a.children[d]. i reached end and node.isEnd=true → return true."
}'::jsonb),
('design-add-search', 11, 'Return true (short-circuit)', '{
  "type": "array",
  "array": [".", "a", "d"],
  "highlights": [0, 1, 2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"result": "true"},
  "status": "First successful DFS branch returns true; no need to try d or m branches."
}'::jsonb),
('design-add-search', 12, 'search(\"b..\") edge', '{
  "type": "array",
  "array": ["b", ".", "."],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashmap": {"node after b": "a", "dots explore": "a.children then next dot"},
  "status": "Exact ''b'' first, then two dots DFS over descendants. Dots near root are expensive; near the end are cheap."
}'::jsonb),
('design-add-search', 13, 'Result Recap', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"add": "O(L)", "search_nodots": "O(L)", "search_worst": "O(26^d·L)"},
  "status": "Trie + DFS handles wildcards cleanly. Memory is bounded by total characters across added words."
}'::jsonb);


-- ── FIND-MEDIAN-DATA-STREAM ─────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'find-median-data-stream';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('find-median-data-stream', 1, 'Problem Setup', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"stream": "1, 2, 3, 4, 5"},
  "status": "addNum(x) inserts into a stream; findMedian() returns the running median. Sorting each query is O(n log n) per call — too slow."
}'::jsonb),
('find-median-data-stream', 2, 'Approach: Two Heaps', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"maxHeap (low)": "bottom half", "minHeap (high)": "top half"},
  "status": "Keep a max-heap LOW holding the smaller half and min-heap HIGH holding the larger half. Median is LOW.top() (odd) or (LOW.top()+HIGH.top())/2 (even)."
}'::jsonb),
('find-median-data-stream', 3, 'Complexity', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"addNum": "O(log n)", "findMedian": "O(1)"},
  "status": "Each insert: push + rebalance = O(log n). Median query: O(1) heap peek."
}'::jsonb),
('find-median-data-stream', 4, 'Initialize', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"maxHeap": "[]", "minHeap": "[]", "size": "0"},
  "status": "Both heaps empty."
}'::jsonb),
('find-median-data-stream', 5, 'addNum(1)', '{
  "type": "array",
  "array": [1],
  "highlights": [0],
  "pointers": {},
  "hashmap": {"maxHeap": "[1]", "minHeap": "[]", "rule": "push to max first"},
  "status": "Push 1 to maxHeap. Rebalance: maxHeap.top()=1, minHeap empty → no swap needed."
}'::jsonb),
('find-median-data-stream', 6, 'findMedian() → 1', '{
  "type": "array",
  "array": [1],
  "highlights": [0],
  "pointers": {},
  "hashmap": {"maxHeap": "[1]", "minHeap": "[]", "median": "1"},
  "status": "Odd total size; median = maxHeap.top() = 1."
}'::jsonb),
('find-median-data-stream', 7, 'addNum(2): push then rebalance', '{
  "type": "array",
  "array": [2],
  "highlights": [0],
  "pointers": {},
  "hashmap": {"maxHeap": "[2]", "minHeap": "[]", "step": "pushed 2 to max"},
  "status": "Push 2 to maxHeap → [2, 1]. But 2 > minHeap values none here, but in general move max.top() to min to keep halves sorted."
}'::jsonb),
('find-median-data-stream', 8, 'Rebalance — move to minHeap', '{
  "type": "array",
  "array": [1],
  "highlights": [0],
  "pointers": {},
  "hashmap": {"maxHeap": "[1]", "minHeap": "[2]", "sizes": "1,1"},
  "status": "Pop maxHeap top 2 → push to minHeap. maxHeap=[1], minHeap=[2]. Halves are balanced; 1 ≤ 2 invariant holds."
}'::jsonb),
('find-median-data-stream', 9, 'findMedian() → 1.5', '{
  "type": "array",
  "array": [1, 2],
  "highlights": [0, 1],
  "pointers": {},
  "hashmap": {"maxHeap": "[1]", "minHeap": "[2]", "median": "(1+2)/2 = 1.5"},
  "status": "Even total. Median = (maxHeap.top() + minHeap.top()) / 2 = 1.5."
}'::jsonb),
('find-median-data-stream', 10, 'addNum(3)', '{
  "type": "array",
  "array": [1],
  "highlights": [],
  "pointers": {},
  "hashmap": {"maxHeap": "[1]", "minHeap": "[2, 3]", "step": "push 3 path"},
  "status": "Push 3 to maxHeap → [3, 1], then move top 3 to minHeap. maxHeap=[1], minHeap=[2, 3]. Sizes 1, 2 — minHeap now larger."
}'::jsonb),
('find-median-data-stream', 11, 'Rebalance sizes', '{
  "type": "array",
  "array": [2, 1],
  "highlights": [0],
  "pointers": {},
  "hashmap": {"maxHeap": "[2, 1]", "minHeap": "[3]", "sizes": "2,1"},
  "status": "minHeap has 2 elements and maxHeap has 1 → move minHeap.top() 2 back to maxHeap. maxHeap=[2, 1], minHeap=[3]."
}'::jsonb),
('find-median-data-stream', 12, 'findMedian() → 2', '{
  "type": "array",
  "array": [2, 1],
  "highlights": [0],
  "pointers": {},
  "hashmap": {"maxHeap.top": "2", "minHeap.top": "3", "median": "2"},
  "status": "Odd total 3. Convention: maxHeap holds the extra → median = maxHeap.top() = 2."
}'::jsonb),
('find-median-data-stream', 13, 'Result / Invariants', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"invariant1": "max.top() ≤ min.top()", "invariant2": "|size diff| ≤ 1"},
  "status": "Two invariants keep the median O(1). Each add is O(log n). This two-heap trick is the canonical streaming-median solution."
}'::jsonb);


-- ── IMPLEMENT-TRIE ──────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'implement-trie';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('implement-trie', 1, 'Problem Setup', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Implement Trie with insert(word), search(word) and startsWith(prefix). Example: insert ''apple'', search(''apple'')=true, search(''app'')=false, startsWith(''app'')=true."
}'::jsonb),
('implement-trie', 2, 'Approach: 26-ary Tree', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"node": "{children[26], isEnd}"},
  "status": "Each node has up to 26 children (one per lowercase letter) and a flag isEnd marking terminal words. Shared prefixes collapse into shared paths."
}'::jsonb),
('implement-trie', 3, 'Complexity', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"insert": "O(L)", "search": "O(L)", "startsWith": "O(L)"},
  "status": "All ops are O(L) where L = word length. Space O(total chars inserted · 26) worst case."
}'::jsonb),
('implement-trie', 4, 'Initialize', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"root": "{children:{}, isEnd:false}"},
  "status": "Single empty root node."
}'::jsonb),
('implement-trie', 5, 'insert(\"apple\") — char ''a''', '{
  "type": "array",
  "array": ["a", "p", "p", "l", "e"],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashmap": {"node": "root", "action": "create child ''a''"},
  "status": "At root, no child ''a''. Create new node; descend into it."
}'::jsonb),
('implement-trie', 6, 'insert — remaining chars', '{
  "type": "array",
  "array": ["a", "p", "p", "l", "e"],
  "highlights": [1, 2, 3, 4],
  "pointers": {"i": 4},
  "hashmap": {"path": "root → a → p → p → l → e", "isEnd(e)": "true"},
  "status": "Create children p, p, l, e in succession. On the final node, set isEnd=true — marks ''apple'' as a complete word."
}'::jsonb),
('implement-trie', 7, 'search(\"apple\") — walk path', '{
  "type": "array",
  "array": ["a", "p", "p", "l", "e"],
  "highlights": [0, 1, 2, 3, 4],
  "pointers": {"i": 4},
  "hashmap": {"node": "e-node", "isEnd": "true"},
  "status": "Walk root→a→p→p→l→e. All children exist. Final node.isEnd=true → return true."
}'::jsonb),
('implement-trie', 8, 'search(\"app\") — prefix only', '{
  "type": "array",
  "array": ["a", "p", "p"],
  "highlights": [0, 1, 2],
  "pointers": {"i": 2},
  "hashmap": {"node": "second-p", "isEnd": "false"},
  "status": "Path exists but the second-p node has isEnd=false (only ''apple'' was inserted, not ''app''). Return false."
}'::jsonb),
('implement-trie', 9, 'startsWith(\"app\")', '{
  "type": "array",
  "array": ["a", "p", "p"],
  "highlights": [0, 1, 2],
  "highlightColor": "green",
  "pointers": {"i": 2},
  "hashmap": {"node": "second-p", "exists": "true"},
  "status": "Walk path; ignore isEnd. Path exists → return true. This is the only difference from search."
}'::jsonb),
('implement-trie', 10, 'insert(\"app\")', '{
  "type": "array",
  "array": ["a", "p", "p"],
  "highlights": [0, 1, 2],
  "pointers": {"i": 2},
  "hashmap": {"path": "root → a → p → p", "isEnd(second p)": "true now"},
  "status": "Re-walk; all nodes already exist. Just set isEnd=true on the second-p node."
}'::jsonb),
('implement-trie', 11, 'search(\"app\") now', '{
  "type": "array",
  "array": ["a", "p", "p"],
  "highlights": [0, 1, 2],
  "highlightColor": "green",
  "pointers": {"i": 2},
  "hashmap": {"isEnd": "true", "result": "true"},
  "status": "Walk succeeds and isEnd is true → return true. Prefix sharing let us store ''app'' with zero new nodes."
}'::jsonb),
('implement-trie', 12, 'search(\"apricot\") — mismatch', '{
  "type": "array",
  "array": ["a", "p", "r"],
  "highlights": [2],
  "highlightColor": "red",
  "pointers": {"i": 2},
  "hashmap": {"node": "first-p", "child[r]": "missing"},
  "status": "At first-p, no child ''r''. Return false without further scanning — O(mismatch depth)."
}'::jsonb),
('implement-trie', 13, 'Result', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"insert": "O(L)", "search": "O(L)", "startsWith": "O(L)"},
  "status": "Trie gives O(L) for all ops and shares prefixes for memory. Ideal for dictionaries, autocomplete, spellcheck."
}'::jsonb);


-- ── K-CLOSEST-POINTS ────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'k-closest-points';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('k-closest-points', 1, 'Problem Setup', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"points": "[[1,3],[-2,2],[5,8],[0,1]]", "k": "2"},
  "status": "Return the k=2 points closest to origin by Euclidean distance. Expected: [[0,1], [-2,2]]."
}'::jsonb),
('k-closest-points', 2, 'Approach: Max-Heap of size k', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"key": "d² = x²+y²", "why_max_heap": "pop the worst"},
  "status": "Keep a max-heap ordered by distance². Push first k points. For each later point, if d² < heap.top(), pop the worst and push. Heap eventually holds the k closest."
}'::jsonb),
('k-closest-points', 3, 'Complexity', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"time": "O(n log k)", "space": "O(k)"},
  "status": "Each of n points does at most O(log k) heap work. Better than O(n log n) full sort when k << n."
}'::jsonb),
('k-closest-points', 4, 'Initialize — heap empty', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"maxHeap": "[]"},
  "status": "Max-heap empty. We also skip computing sqrt — comparing d² is equivalent."
}'::jsonb),
('k-closest-points', 5, 'Point [1,3]: d²=10', '{
  "type": "array",
  "array": [10],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashmap": {"maxHeap": "[(10, [1,3])]", "size": "1"},
  "status": "Heap size 1 < k=2 → push. Heap root = 10."
}'::jsonb),
('k-closest-points', 6, 'Point [-2,2]: d²=8', '{
  "type": "array",
  "array": [10, 8],
  "highlights": [0, 1],
  "pointers": {"i": 1},
  "hashmap": {"maxHeap": "[10, 8]", "size": "2"},
  "status": "Size < k → push. Max-heap keeps 10 at top (10 > 8)."
}'::jsonb),
('k-closest-points', 7, 'Point [5,8]: d²=89', '{
  "type": "array",
  "array": [10, 8],
  "highlights": [0],
  "pointers": {"i": 2},
  "hashmap": {"maxHeap": "[10, 8]", "skip": "89 > 10"},
  "status": "Heap full. 89 > top 10 → this point is FARTHER than our current worst. Skip."
}'::jsonb),
('k-closest-points', 8, 'Point [0,1]: d²=1', '{
  "type": "array",
  "array": [10, 8],
  "highlights": [0],
  "pointers": {"i": 3},
  "hashmap": {"maxHeap": "[10, 8]", "compare": "1 < 10"},
  "status": "1 < top 10 → this point is closer than the worst in heap. Replace."
}'::jsonb),
('k-closest-points', 9, 'Pop top 10', '{
  "type": "array",
  "array": [8],
  "highlights": [0],
  "pointers": {"i": 3},
  "hashmap": {"maxHeap": "[8]", "popped": "(10, [1,3])"},
  "status": "Pop max (10, [1,3]). Heap now [8]."
}'::jsonb),
('k-closest-points', 10, 'Push (1, [0,1])', '{
  "type": "array",
  "array": [8, 1],
  "highlights": [0, 1],
  "pointers": {"i": 3},
  "hashmap": {"maxHeap": "[8, 1]", "top": "8"},
  "status": "Push 1. Sift up doesn''t move it — 1 < parent 8. Heap = [8, 1]."
}'::jsonb),
('k-closest-points', 11, 'Scan done', '{
  "type": "array",
  "array": [8, 1],
  "highlights": [0, 1],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"maxHeap": "{(8,[-2,2]),(1,[0,1])}"},
  "status": "All n points processed. Heap holds exactly the k closest (in unspecified order)."
}'::jsonb),
('k-closest-points', 12, 'Extract Points', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"result": "[[0,1], [-2,2]]"},
  "status": "Drain heap into result array. Order within the k doesn''t matter per problem."
}'::jsonb),
('k-closest-points', 13, 'Return / Complexity', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"time": "O(n log k)", "space": "O(k)"},
  "status": "Time O(n log k), Space O(k). Quickselect would give O(n) avg but is harder to implement correctly."
}'::jsonb);


-- ── KTH-LARGEST-ELEMENT ─────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'kth-largest-element';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('kth-largest-element', 1, 'Problem Setup', '{
  "type": "array",
  "array": [3, 2, 1, 5, 6, 4],
  "highlights": [],
  "pointers": {},
  "hashmap": {"k": "2"},
  "status": "Return the k=2nd largest element. Expected: 5. (Sorted desc: 6, 5, 4, 3, 2, 1.)"
}'::jsonb),
('kth-largest-element', 2, 'Approach: Min-Heap of size k', '{
  "type": "array",
  "array": [3, 2, 1, 5, 6, 4],
  "highlights": [],
  "pointers": {},
  "hashmap": {"why_min_heap": "pop smallest to keep largest k"},
  "status": "Maintain a min-heap of the k largest seen. Push first k. For each later, if x > heap.top() replace top. After scanning, heap.top() is the kth largest."
}'::jsonb),
('kth-largest-element', 3, 'Complexity', '{
  "type": "array",
  "array": [3, 2, 1, 5, 6, 4],
  "highlights": [],
  "pointers": {},
  "hashmap": {"time": "O(n log k)", "space": "O(k)"},
  "status": "Each push/pop is O(log k); n elements → O(n log k). Beats O(n log n) sort when k is small."
}'::jsonb),
('kth-largest-element', 4, 'Initialize', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {"i": 0},
  "hashmap": {"minHeap": "[]"},
  "status": "Empty min-heap."
}'::jsonb),
('kth-largest-element', 5, 'i=0: push 3', '{
  "type": "array",
  "array": [3],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashmap": {"minHeap": "[3]"},
  "status": "Size < k. Push 3. Heap = [3]."
}'::jsonb),
('kth-largest-element', 6, 'i=1: push 2', '{
  "type": "array",
  "array": [2, 3],
  "highlights": [0],
  "pointers": {"i": 1},
  "hashmap": {"minHeap": "[2, 3]"},
  "status": "Push 2. Sift up: 2 < parent 3 → swap. Heap = [2, 3]. Root = smallest."
}'::jsonb),
('kth-largest-element', 7, 'i=2: 1 < top 2 → skip', '{
  "type": "array",
  "array": [2, 3],
  "highlights": [0],
  "pointers": {"i": 2},
  "hashmap": {"minHeap": "[2, 3]", "skip": "1"},
  "status": "Heap full. 1 < root 2 → 1 is smaller than our current kth candidate. Skip."
}'::jsonb),
('kth-largest-element', 8, 'i=3: 5 > top 2 → replace', '{
  "type": "array",
  "array": [3, 5],
  "highlights": [0, 1],
  "pointers": {"i": 3},
  "hashmap": {"minHeap": "[3, 5]", "popped": "2"},
  "status": "5 > 2 → pop 2, push 5. Heap = [3, 5]. Root = 3 = current kth-largest candidate."
}'::jsonb),
('kth-largest-element', 9, 'i=4: 6 > top 3 → replace', '{
  "type": "array",
  "array": [5, 6],
  "highlights": [0, 1],
  "pointers": {"i": 4},
  "hashmap": {"minHeap": "[5, 6]", "popped": "3"},
  "status": "6 > 3 → pop 3, push 6. Heap = [5, 6]."
}'::jsonb),
('kth-largest-element', 10, 'i=5: 4 < top 5 → skip', '{
  "type": "array",
  "array": [5, 6],
  "highlights": [0],
  "pointers": {"i": 5},
  "hashmap": {"minHeap": "[5, 6]", "skip": "4"},
  "status": "4 < root 5 → skip. Heap unchanged."
}'::jsonb),
('kth-largest-element', 11, 'Scan Done', '{
  "type": "array",
  "array": [5, 6],
  "highlights": [0, 1],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"minHeap": "[5, 6]", "invariant": "holds 2 largest"},
  "status": "Heap holds the k=2 largest elements in no particular order. Root = smallest of those k = kth largest overall."
}'::jsonb),
('kth-largest-element', 12, 'Peek root → 5', '{
  "type": "array",
  "array": [5, 6],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "5"},
  "status": "Return heap.top() = 5. That is the kth largest."
}'::jsonb),
('kth-largest-element', 13, 'Complexity Recap', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"time": "O(n log k)", "space": "O(k)"},
  "status": "Time O(n log k), Space O(k). Quickselect is O(n) avg but trickier; heap is cleaner and handles streaming inputs."
}'::jsonb);


-- ── LARGEST-RECT-HISTOGRAM ──────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'largest-rect-histogram';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('largest-rect-histogram', 1, 'Problem Setup', '{
  "type": "array",
  "array": [2, 1, 5, 6, 2, 3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"best": "0"},
  "status": "Given heights = [2,1,5,6,2,3]. Find the largest rectangle fully inside the histogram. Expected: 10 (bars 5,6 span width 2, height 5)."
}'::jsonb),
('largest-rect-histogram', 2, 'Approach: Monotonic Increasing Stack', '{
  "type": "array",
  "array": [2, 1, 5, 6, 2, 3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"stack": "indices", "invariant": "heights increase"},
  "status": "For each bar h, the max rectangle using h extends left/right until a shorter bar. Use an increasing stack of indices; when a shorter bar arrives, pop and compute area with popped bar as the limiting height."
}'::jsonb),
('largest-rect-histogram', 3, 'Complexity', '{
  "type": "array",
  "array": [2, 1, 5, 6, 2, 3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"time": "O(n)", "space": "O(n)"},
  "status": "Each index is pushed/popped at most once → O(n) time. Stack space O(n)."
}'::jsonb),
('largest-rect-histogram', 4, 'Initialize', '{
  "type": "array",
  "array": [2, 1, 5, 6, 2, 3],
  "highlights": [],
  "pointers": {"i": 0},
  "hashmap": {"stack": "[]", "best": "0"},
  "status": "Empty stack, best=0."
}'::jsonb),
('largest-rect-histogram', 5, 'i=0 (h=2) push', '{
  "type": "array",
  "array": [2, 1, 5, 6, 2, 3],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashmap": {"stack": "[0]", "best": "0"},
  "status": "Stack empty → push index 0."
}'::jsonb),
('largest-rect-histogram', 6, 'i=1 (h=1): pop 0, area=2', '{
  "type": "array",
  "array": [2, 1, 5, 6, 2, 3],
  "highlights": [0, 1],
  "highlightColor": "yellow",
  "pointers": {"i": 1},
  "hashmap": {"stack": "[1]", "best": "2"},
  "status": "1 < heights[0]=2 → pop 0. Width = i − prevTop − 1 = 1 − (−1) − 1 = 1. Area = 2·1 = 2. best=2. Push 1."
}'::jsonb),
('largest-rect-histogram', 7, 'i=2,3 push (increasing)', '{
  "type": "array",
  "array": [2, 1, 5, 6, 2, 3],
  "highlights": [2, 3],
  "pointers": {"i": 3},
  "hashmap": {"stack": "[1, 2, 3]", "best": "2"},
  "status": "5 > 1 push 2. 6 > 5 push 3. Stack heights are 1, 5, 6 — strictly increasing."
}'::jsonb),
('largest-rect-histogram', 8, 'i=4 (h=2): pop 3, area=6', '{
  "type": "array",
  "array": [2, 1, 5, 6, 2, 3],
  "highlights": [3, 4],
  "highlightColor": "yellow",
  "pointers": {"i": 4},
  "hashmap": {"stack": "[1, 2]", "best": "6"},
  "status": "2 < heights[3]=6 → pop 3. New top=2. Width = 4−2−1 = 1. Area = 6·1 = 6. best=6."
}'::jsonb),
('largest-rect-histogram', 9, 'i=4 keep popping: pop 2, area=10', '{
  "type": "array",
  "array": [2, 1, 5, 6, 2, 3],
  "highlights": [2, 3, 4],
  "highlightColor": "yellow",
  "pointers": {"i": 4},
  "hashmap": {"stack": "[1, 4]", "best": "10"},
  "status": "2 < heights[2]=5 → pop 2. New top=1. Width = 4−1−1 = 2. Area = 5·2 = 10. best=10. Now 2 > heights[1]=1, stop. Push 4."
}'::jsonb),
('largest-rect-histogram', 10, 'i=5 (h=3) push', '{
  "type": "array",
  "array": [2, 1, 5, 6, 2, 3],
  "highlights": [5],
  "pointers": {"i": 5},
  "hashmap": {"stack": "[1, 4, 5]", "best": "10"},
  "status": "3 > heights[4]=2 → push 5."
}'::jsonb),
('largest-rect-histogram', 11, 'End — flush stack', '{
  "type": "array",
  "array": [2, 1, 5, 6, 2, 3],
  "highlights": [],
  "pointers": {"i": 6},
  "hashmap": {"stack": "[1, 4, 5]", "flush_with_i=6": "true"},
  "status": "Scan ended. Treat i=n=6 as a sentinel height of 0; pop remaining indices to compute their areas."
}'::jsonb),
('largest-rect-histogram', 12, 'Flush pops', '{
  "type": "array",
  "array": [2, 1, 5, 6, 2, 3],
  "highlights": [1, 4, 5],
  "highlightColor": "yellow",
  "pointers": {"i": 6},
  "hashmap": {"pop 5 area 3·1=3": "best=10", "pop 4 area 2·4=8": "best=10", "pop 1 area 1·6=6": "best=10"},
  "status": "Pop 5: w=6−4−1=1, area=3. Pop 4: w=6−1−1=4, area=8. Pop 1: stack empty → w=6, area=6. None beat 10."
}'::jsonb),
('largest-rect-histogram', 13, 'Return 10', '{
  "type": "array",
  "array": [2, 1, 5, 6, 2, 3],
  "highlights": [2, 3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "10"},
  "status": "Return 10. Time O(n), Space O(n). Monotonic stack computes the left/right limits for every bar in one pass."
}'::jsonb);


-- ── LAST-STONE-WEIGHT ───────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'last-stone-weight';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('last-stone-weight', 1, 'Problem Setup', '{
  "type": "array",
  "array": [2, 7, 4, 1, 8, 1],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Smash the two heaviest stones. If equal both destroyed; else a difference y−x remains. Repeat. Return last stone weight (0 if none). Expected: 1."
}'::jsonb),
('last-stone-weight', 2, 'Approach: Max-Heap', '{
  "type": "array",
  "array": [2, 7, 4, 1, 8, 1],
  "highlights": [],
  "pointers": {},
  "hashmap": {"why_heap": "repeat max-extraction"},
  "status": "We repeatedly need the two largest → classic max-heap use case. Each round: pop y, pop x; if y>x push y−x. Continue until ≤1 stone."
}'::jsonb),
('last-stone-weight', 3, 'Complexity', '{
  "type": "array",
  "array": [2, 7, 4, 1, 8, 1],
  "highlights": [],
  "pointers": {},
  "hashmap": {"build": "O(n)", "rounds": "O(n log n)"},
  "status": "Heapify O(n). Each of up to n rounds does O(log n) work → O(n log n)."
}'::jsonb),
('last-stone-weight', 4, 'Build Max-Heap', '{
  "type": "array",
  "array": [8, 7, 4, 1, 2, 1],
  "highlights": [0],
  "pointers": {},
  "hashmap": {"maxHeap": "[8, 7, 4, 1, 2, 1]"},
  "status": "Heapify in O(n). Root = 8 (heaviest stone)."
}'::jsonb),
('last-stone-weight', 5, 'Round 1: pop 8 then 7', '{
  "type": "array",
  "array": [4, 2, 1, 1],
  "highlights": [],
  "pointers": {},
  "hashmap": {"y": "8", "x": "7", "push": "1"},
  "status": "Extract y=8, x=7. Smash: y≠x → residue 8−7=1. Push 1. Heap = [4, 2, 1, 1, 1] internally."
}'::jsonb),
('last-stone-weight', 6, 'After push 1', '{
  "type": "array",
  "array": [4, 2, 1, 1, 1],
  "highlights": [0],
  "pointers": {},
  "hashmap": {"maxHeap": "[4, 2, 1, 1, 1]", "size": "5"},
  "status": "Heap now has 5 stones. Root = 4."
}'::jsonb),
('last-stone-weight', 7, 'Round 2: pop 4 then 2', '{
  "type": "array",
  "array": [2, 1, 1, 1],
  "highlights": [],
  "pointers": {},
  "hashmap": {"y": "4", "x": "2", "push": "2"},
  "status": "y=4, x=2. residue 2. Push 2. Heap = [2, 1, 1, 1] plus the new 2."
}'::jsonb),
('last-stone-weight', 8, 'After push 2', '{
  "type": "array",
  "array": [2, 2, 1, 1, 1],
  "highlights": [0],
  "pointers": {},
  "hashmap": {"maxHeap": "[2, 2, 1, 1, 1]", "size": "5"},
  "status": "Sift-up places 2 at root (tie with existing 2). Heap sits 5 elements."
}'::jsonb),
('last-stone-weight', 9, 'Round 3: pop 2 then 2', '{
  "type": "array",
  "array": [1, 1, 1],
  "highlights": [0],
  "pointers": {},
  "hashmap": {"y": "2", "x": "2", "both_destroyed": "true"},
  "status": "y=x=2 → BOTH destroyed, nothing pushed back. Heap shrinks to [1, 1, 1]."
}'::jsonb),
('last-stone-weight', 10, 'Round 4: pop 1 then 1', '{
  "type": "array",
  "array": [1],
  "highlights": [0],
  "pointers": {},
  "hashmap": {"y": "1", "x": "1", "destroyed": "true"},
  "status": "Equal again. Both destroyed. Heap = [1]."
}'::jsonb),
('last-stone-weight', 11, 'Loop Exit Check', '{
  "type": "array",
  "array": [1],
  "highlights": [0],
  "pointers": {},
  "hashmap": {"size": "1", "continue": "false"},
  "status": "Only one stone remains; cannot pick two anymore. Exit loop."
}'::jsonb),
('last-stone-weight', 12, 'Return root', '{
  "type": "array",
  "array": [1],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "1"},
  "status": "Return heap.top() = 1. If heap were empty we''d return 0."
}'::jsonb),
('last-stone-weight', 13, 'Recap', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"time": "O(n log n)", "space": "O(n)"},
  "status": "Max-heap enables O(log n) extract-max + push per round. Total O(n log n). Heap is the natural structure whenever ''repeatedly take the best'' shows up."
}'::jsonb);


-- ── REORGANIZE-STRING ───────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'reorganize-string';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('reorganize-string', 1, 'Problem Setup', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"s": "\"aab\""},
  "status": "Rearrange s so that no two adjacent letters are equal. Return any valid arrangement or \"\" if impossible. Expected: \"aba\"."
}'::jsonb),
('reorganize-string', 2, 'Approach: Max-Heap by Frequency', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"strategy": "greedy: always pick most-frequent char (not just used)"},
  "status": "Always append the most frequent remaining char that isn''t the previous char. Use a max-heap of (count, char)."
}'::jsonb),
('reorganize-string', 3, 'Feasibility Check', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"rule": "max_count ≤ (n+1)/2"},
  "status": "If any letter appears more than (n+1)/2 times, impossible. Here n=3, max allowed=2. ''a'' has 2 — OK."
}'::jsonb),
('reorganize-string', 4, 'Count Frequencies', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"counts": "{a:2, b:1}", "maxHeap": "[(2,a), (1,b)]"},
  "status": "Count chars. Build max-heap keyed by count. Root = most frequent."
}'::jsonb),
('reorganize-string', 5, 'Step 1: pop (2,a), append', '{
  "type": "array",
  "array": ["a"],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashmap": {"result": "\"a\"", "heldBack": "(1,a)", "heap": "[(1,b)]"},
  "status": "Pop max (2,a). Append ''a'' to result. Decrement count to 1; HOLD it aside so we don''t place ''a'' twice in a row."
}'::jsonb),
('reorganize-string', 6, 'Step 2: pop (1,b), append', '{
  "type": "array",
  "array": ["a", "b"],
  "highlights": [1],
  "pointers": {"i": 1},
  "hashmap": {"result": "\"ab\"", "pushBack": "(1,a)", "heap": "[(1,a)]"},
  "status": "Pop (1,b). Append ''b''. count-1 = 0 → do not push back. Now push the previously held (1,a) back into the heap."
}'::jsonb),
('reorganize-string', 7, 'Step 3: pop (1,a), append', '{
  "type": "array",
  "array": ["a", "b", "a"],
  "highlights": [2],
  "pointers": {"i": 2},
  "hashmap": {"result": "\"aba\"", "heap": "[]"},
  "status": "Pop (1,a). Append ''a''. count-1 = 0 → drop. Previous char was ''b'', not ''a'', so no adjacency violation."
}'::jsonb),
('reorganize-string', 8, 'Heap Empty', '{
  "type": "array",
  "array": ["a", "b", "a"],
  "highlights": [0, 1, 2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"heap": "[]", "result_len": "3"},
  "status": "No more chars to place. result length = n → success."
}'::jsonb),
('reorganize-string', 9, 'Deadlock Edge Case', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"example": "\"aaab\"", "stuck": "only a left, prev was a"},
  "status": "If at some step heap is empty but we still hold a char equal to prev, it''s impossible. The initial feasibility check prevents this."
}'::jsonb),
('reorganize-string', 10, 'Why the \"hold-back\" works', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"trick": "skip one slot"},
  "status": "Holding the just-used char out for exactly ONE round guarantees the next char differs. Reinserting afterwards lets it still compete for later slots."
}'::jsonb),
('reorganize-string', 11, 'Complexity', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"time": "O(n log 26)", "space": "O(26)"},
  "status": "Heap has ≤26 entries → operations effectively O(1). Total O(n). Space O(1)."
}'::jsonb),
('reorganize-string', 12, 'Return \"aba\"', '{
  "type": "array",
  "array": ["a", "b", "a"],
  "highlights": [0, 1, 2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "\"aba\""},
  "status": "Return result \"aba\". All adjacent pairs differ."
}'::jsonb),
('reorganize-string', 13, 'Recap', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"pattern": "most-frequent-first with cooldown"},
  "status": "Greedy: take the most frequent remaining char, with a one-slot cooldown on the char you just placed. The heap gives O(log k) ''give me the max'' access."
}'::jsonb);


-- ── SORT-CHARACTERS-BY-FREQUENCY ───────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'sort-characters-by-frequency';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('sort-characters-by-frequency', 1, 'Problem Setup', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"s": "\"tree\""},
  "status": "Sort characters of s in decreasing frequency order. Return any valid result. Expected: \"eert\" or \"eetr\"."
}'::jsonb),
('sort-characters-by-frequency', 2, 'Approach: Count + Max-Heap', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"step1": "count", "step2": "heap by count", "step3": "dump char×count"},
  "status": "Count frequencies. Push (count, char) pairs into a max-heap. Repeatedly pop the top and append char·count to the result."
}'::jsonb),
('sort-characters-by-frequency', 3, 'Complexity', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"time": "O(n + k log k)", "space": "O(k + n)"},
  "status": "k = distinct chars. Count O(n), heap ops O(k log k), building output O(n). Bucket-sort alternative gives O(n)."
}'::jsonb),
('sort-characters-by-frequency', 4, 'Count Frequencies', '{
  "type": "array",
  "array": ["t", "r", "e", "e"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"counts": "{t:1, r:1, e:2}"},
  "status": "Scan ''tree'' → t:1, r:1, e:2."
}'::jsonb),
('sort-characters-by-frequency', 5, 'Build Max-Heap', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"maxHeap": "[(2,e), (1,t), (1,r)]", "root": "(2,e)"},
  "status": "Push all (count, char). Root = highest count = (2, e)."
}'::jsonb),
('sort-characters-by-frequency', 6, 'Pop (2,e) — append ''ee''', '{
  "type": "array",
  "array": ["e", "e"],
  "highlights": [0, 1],
  "pointers": {},
  "hashmap": {"result": "\"ee\"", "heap": "[(1,t), (1,r)]"},
  "status": "Pop root. Append ''e'' count=2 times → result=\"ee\"."
}'::jsonb),
('sort-characters-by-frequency', 7, 'Pop (1,t) — append ''t''', '{
  "type": "array",
  "array": ["e", "e", "t"],
  "highlights": [2],
  "pointers": {},
  "hashmap": {"result": "\"eet\"", "heap": "[(1,r)]"},
  "status": "Pop next. Append ''t''. (Order of ties is implementation-defined.)"
}'::jsonb),
('sort-characters-by-frequency', 8, 'Pop (1,r) — append ''r''', '{
  "type": "array",
  "array": ["e", "e", "t", "r"],
  "highlights": [3],
  "pointers": {},
  "hashmap": {"result": "\"eetr\"", "heap": "[]"},
  "status": "Pop (1,r). Append ''r''. Heap now empty."
}'::jsonb),
('sort-characters-by-frequency', 9, 'Heap Empty → Done', '{
  "type": "array",
  "array": ["e", "e", "t", "r"],
  "highlights": [0, 1, 2, 3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"result": "\"eetr\""},
  "status": "All characters placed. Length matches |s|."
}'::jsonb),
('sort-characters-by-frequency', 10, 'Alternative: Bucket Sort', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"buckets": "index = frequency"},
  "status": "Instead of a heap, we can use buckets indexed by frequency, then iterate from highest to lowest. O(n) but needs O(n) extra space."
}'::jsonb),
('sort-characters-by-frequency', 11, 'Tie Handling', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"note": "t and r both count 1"},
  "status": "t and r tied. Any ordering is accepted by the problem."
}'::jsonb),
('sort-characters-by-frequency', 12, 'Return', '{
  "type": "array",
  "array": ["e", "e", "t", "r"],
  "highlights": [0, 1, 2, 3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "\"eetr\""},
  "status": "Return \"eetr\". Sum of counts = n, so output length is n."
}'::jsonb),
('sort-characters-by-frequency', 13, 'Recap', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"time": "O(n + k log k)", "space": "O(n)"},
  "status": "Counting + heap is a staple frequency-sort pattern; also shows up in top-k frequent variants."
}'::jsonb);


-- ── TASK-SCHEDULER ──────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'task-scheduler';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('task-scheduler', 1, 'Problem Setup', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"tasks": "[A,A,A,B,B,B]", "n": "2"},
  "status": "Same tasks must be at least n=2 time units apart. Find min total time units. Expected: 8 (A B idle A B idle A B)."
}'::jsonb),
('task-scheduler', 2, 'Approach: Max-Heap + Cooldown Queue', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap": "ready tasks by remaining count", "queue": "(readyTime, count)"},
  "status": "Each tick: pop max-count task, run it, put leftover in cooldown queue with readyTime = t + n + 1. When a cooling task is ready, push back to heap."
}'::jsonb),
('task-scheduler', 3, 'Complexity', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"time": "O(T log 26)", "space": "O(26)"},
  "status": "T = total time. Heap holds ≤26 letters. Each tick costs O(log 26) = O(1) effectively."
}'::jsonb),
('task-scheduler', 4, 'Count Frequencies', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"counts": "{A:3, B:3}", "maxHeap": "[3, 3]", "queue": "[]", "t": "0"},
  "status": "counts = {A:3, B:3}. Max-heap initial [3, 3]. Cooldown queue empty."
}'::jsonb),
('task-scheduler', 5, 't=0: run A', '{
  "type": "array",
  "array": ["A"],
  "highlights": [0],
  "pointers": {"t": 0},
  "hashmap": {"heap": "[3]", "queue": "[(3, 2)]"},
  "status": "Pop top=3 (A). Append ''A''. Remaining 2 → push (readyAt=0+2+1=3, count=2) into cooldown queue."
}'::jsonb),
('task-scheduler', 6, 't=1: run B', '{
  "type": "array",
  "array": ["A", "B"],
  "highlights": [1],
  "pointers": {"t": 1},
  "hashmap": {"heap": "[]", "queue": "[(3,2_A), (4,2_B)]"},
  "status": "Pop 3 (B). Append. Remaining 2 → cooldown ready at t=4. Heap empty."
}'::jsonb),
('task-scheduler', 7, 't=2: idle', '{
  "type": "array",
  "array": ["A", "B", "idle"],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"t": 2},
  "hashmap": {"heap": "[]", "queue_front_readyAt": "3"},
  "status": "Heap empty, nothing ready yet (queue front ready at 3). Emit idle. Advance time."
}'::jsonb),
('task-scheduler', 8, 't=3: A ready, run A', '{
  "type": "array",
  "array": ["A", "B", "idle", "A"],
  "highlights": [3],
  "pointers": {"t": 3},
  "hashmap": {"heap": "[2]", "queue": "[(4,2_B),(6,1_A)]"},
  "status": "Queue front readyAt=3 ≤ t → push 2 back to heap. Pop 2 (A). Append. Remaining 1 → ready at 6."
}'::jsonb),
('task-scheduler', 9, 't=4: B ready, run B', '{
  "type": "array",
  "array": ["A", "B", "idle", "A", "B"],
  "highlights": [4],
  "pointers": {"t": 4},
  "hashmap": {"heap": "[1]", "queue": "[(6,1_A),(7,1_B)]"},
  "status": "Queue front readyAt=4 → push 2 back. Pop (B). Append. Remaining 1 → ready at 7."
}'::jsonb),
('task-scheduler', 10, 't=5: idle', '{
  "type": "array",
  "array": ["A", "B", "idle", "A", "B", "idle"],
  "highlights": [5],
  "highlightColor": "yellow",
  "pointers": {"t": 5},
  "hashmap": {"heap": "[]", "queue_front": "readyAt 6"},
  "status": "Heap empty, A ready at 6. Emit idle."
}'::jsonb),
('task-scheduler', 11, 't=6,7: run A, run B', '{
  "type": "array",
  "array": ["A", "B", "idle", "A", "B", "idle", "A", "B"],
  "highlights": [6, 7],
  "pointers": {"t": 7},
  "hashmap": {"heap": "[]", "queue": "[]"},
  "status": "t=6: A ready → run final A. t=7: B ready → run final B. No remainders."
}'::jsonb),
('task-scheduler', 12, 'Both Empty → Done', '{
  "type": "array",
  "array": ["A", "B", "idle", "A", "B", "idle", "A", "B"],
  "highlights": [0, 1, 2, 3, 4, 5, 6, 7],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"total_time": "8"},
  "status": "Heap and queue both empty → done. Total ticks = 8."
}'::jsonb),
('task-scheduler', 13, 'Return 8', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"answer": "8", "formula_check": "(maxCount-1)·(n+1) + numTies = 2·3+2 = 8"},
  "status": "Return 8. Closed-form: (maxCount-1)·(n+1) + tiesOnMax matches. Heap simulation is the general-purpose solution."
}'::jsonb);


-- ── TOP-K-FREQUENT ──────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'top-k-frequent';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('top-k-frequent', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1, 1, 1, 2, 2, 3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"k": "2"},
  "status": "Return the k=2 most frequent numbers. Expected: [1, 2]."
}'::jsonb),
('top-k-frequent', 2, 'Approach: Count + Min-Heap of size k', '{
  "type": "array",
  "array": [1, 1, 1, 2, 2, 3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"strategy": "count then keep top-k by freq"},
  "status": "Count freqs. Maintain min-heap of size k ordered by frequency. For each (num,freq), if heap full & freq > heap.top().freq → replace. Heap holds top-k freq values."
}'::jsonb),
('top-k-frequent', 3, 'Complexity', '{
  "type": "array",
  "array": [1, 1, 1, 2, 2, 3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"time": "O(n log k)", "space": "O(n)"},
  "status": "Counts O(n). Heap work across distinct keys: O(distinct · log k). Bucket-sort variant is O(n)."
}'::jsonb),
('top-k-frequent', 4, 'Count Frequencies', '{
  "type": "array",
  "array": [1, 1, 1, 2, 2, 3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"counts": "{1:3, 2:2, 3:1}"},
  "status": "Count: 1 appears 3x, 2 appears 2x, 3 appears 1x."
}'::jsonb),
('top-k-frequent', 5, 'Init Min-Heap', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"minHeap": "[]", "k": "2"},
  "status": "Empty min-heap keyed by freq."
}'::jsonb),
('top-k-frequent', 6, 'Push (3,1): size<k → in', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"minHeap": "[(3,1)]", "size": "1"},
  "status": "Heap size < k. Push (freq=3, num=1)."
}'::jsonb),
('top-k-frequent', 7, 'Push (2,2): size<k → in', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"minHeap": "[(2,2), (3,1)]", "root": "(2,2)"},
  "status": "Heap size=1<k. Push. Min-heap bubbles smaller freq to root → root = (freq=2, num=2)."
}'::jsonb),
('top-k-frequent', 8, '(1,3): 1 < top freq 2 → skip', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"minHeap": "[(2,2), (3,1)]", "skip": "(1,3)"},
  "status": "Heap full. 1 < root freq 2 → 3 cannot displace a more-frequent number. Skip."
}'::jsonb),
('top-k-frequent', 9, 'Scan Done — invariant', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"minHeap": "[(2,2), (3,1)]", "contains": "top k by freq"},
  "status": "All distinct numbers processed. Heap contains the k most frequent (root = least of the k)."
}'::jsonb),
('top-k-frequent', 10, 'Extract', '{
  "type": "array",
  "array": [2, 1],
  "highlights": [0, 1],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"order": "any within top k"},
  "status": "Drain heap nums → [2, 1]. Problem accepts any order."
}'::jsonb),
('top-k-frequent', 11, 'Return [1, 2]', '{
  "type": "array",
  "array": [1, 2],
  "highlights": [0, 1],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "[1, 2]"},
  "status": "Return [1, 2] (any permutation is accepted)."
}'::jsonb),
('top-k-frequent', 12, 'Alt: Bucket Sort O(n)', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"buckets[i]": "nums with freq i"},
  "status": "Since freqs are bounded by n, use buckets[0..n] and iterate from bucket n down, collecting k items."
}'::jsonb),
('top-k-frequent', 13, 'Complexity Recap', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap": "O(n log k)", "bucket": "O(n)"},
  "status": "Heap: O(n log k). Bucket: O(n). Both beat the naive sort-by-freq O(n log n)."
}'::jsonb);


-- ── TOP-K-FREQUENT-WORDS ────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'top-k-frequent-words';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('top-k-frequent-words', 1, 'Problem Setup', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"words": "[i, love, leetcode, i, love, coding]", "k": "2"},
  "status": "Return the k=2 most frequent words. Tie-break: lexicographically smaller first. Expected: [\"i\", \"love\"]."
}'::jsonb),
('top-k-frequent-words', 2, 'Approach: Custom-Compare Min-Heap', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"compare": "higher freq wins; ties: lexicographically LARGER wins in heap (so smaller stays)"},
  "status": "Count freqs. Use a min-heap of size k with a comparator that inverts the tie-break: since smaller word is ''better'', the heap should eject the LARGER (worse) word first."
}'::jsonb),
('top-k-frequent-words', 3, 'Complexity', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"time": "O(n log k)", "space": "O(n)"},
  "status": "Counting O(n). Heap ops over distinct words O(k log k) per candidate, total O(n log k)."
}'::jsonb),
('top-k-frequent-words', 4, 'Count Frequencies', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"counts": "{i:2, love:2, leetcode:1, coding:1}"},
  "status": "Scan once, build a frequency map."
}'::jsonb),
('top-k-frequent-words', 5, 'Init Heap, push (i,2)', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap": "[(i,2)]", "size": "1"},
  "status": "Push first word. Size < k."
}'::jsonb),
('top-k-frequent-words', 6, 'push (love,2)', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap": "[(love,2), (i,2)]", "root": "(love,2)"},
  "status": "Push. Tie on freq=2. Under our comparator, the LARGER word (''love'' > ''i'') is the ''worse'' → sits at min-heap root so it leaves first."
}'::jsonb),
('top-k-frequent-words', 7, '(leetcode,1): freq<root freq → skip', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap": "[(love,2), (i,2)]", "skip": "(leetcode,1)"},
  "status": "Heap full. leetcode freq 1 < root freq 2 → skip."
}'::jsonb),
('top-k-frequent-words', 8, '(coding,1): skip', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap": "[(love,2), (i,2)]", "skip": "(coding,1)"},
  "status": "Same reason. Heap unchanged."
}'::jsonb),
('top-k-frequent-words', 9, 'Scan Done', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap": "[(love,2), (i,2)]", "holds": "top-k"},
  "status": "Heap contains exactly the k most frequent words (with tie-break already respected by ordering in heap)."
}'::jsonb),
('top-k-frequent-words', 10, 'Pop → reverse order', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"pops_in_order": "love, i", "result_built_reversed": "[love, i]"},
  "status": "Pop yields the ''worst'' first: love then i. Output must list BEST first → reverse."
}'::jsonb),
('top-k-frequent-words', 11, 'Reverse → [i, love]', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"answer": "[i, love]"},
  "status": "Reverse the pop list → [i, love]. ''i'' beats ''love'' lexicographically at freq=2, so it goes first."
}'::jsonb),
('top-k-frequent-words', 12, 'Return', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"result": "[\"i\", \"love\"]"},
  "status": "Return [\"i\", \"love\"]."
}'::jsonb),
('top-k-frequent-words', 13, 'Recap', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"key_trick": "invert tie-break in heap comparator"},
  "status": "Same top-k heap pattern as numbers, with a custom comparator to handle lexicographic ties correctly."
}'::jsonb);
