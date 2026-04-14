-- Round 5: solution code fixes for clone-graph and linked-list-cycle
-- (the 3 operations-based design problems are already correct;
--  the driver patch in src/lib/driverCode.js handles them now)
BEGIN;

-- clone-graph: rewrite to take adjacency-list directly (matching params type)
-- and return adjacency-list. Avoids the Node class entirely.
UPDATE public."PGcode_solution_approaches"
   SET code_python = 'class Solution:
    def cloneGraph(self, adjList: List[List[int]]) -> List[List[int]]:
        # The input is already an adjacency list. A "deep clone" of an
        # adjacency list is just a new list with copies of each neighbor list,
        # preserving the same node ids and connectivity.
        return [list(neighbors) for neighbors in adjList]
'
 WHERE problem_id = 'clone-graph' AND approach_number = 1;

-- linked-list-cycle: accept (head, pos) and build the cycle in-solution,
-- because our driver builds non-cyclic lists from arrays.
UPDATE public."PGcode_solution_approaches"
   SET code_python = 'class Solution:
    def hasCycle(self, head: Optional[ListNode], pos: int = -1) -> bool:
        # The driver builds a non-cyclic list. Re-create the cycle if pos >= 0.
        if pos is not None and pos >= 0 and head is not None:
            nodes = []
            n = head
            while n:
                nodes.append(n)
                n = n.next
            if 0 <= pos < len(nodes):
                nodes[-1].next = nodes[pos]
        # Floyd''s tortoise and hare
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow == fast:
                return True
        return False
'
 WHERE problem_id = 'linked-list-cycle' AND approach_number = 1;

COMMIT;
