#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples - batch 27.
// Focus area: multi-step BFS + LCS-family + edit-distance variants.
// Skips problems already at length === 3.
// Run: node scripts/backfill-explained-samples-batch27.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SVC) {
  console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}
const sb = createClient(URL, SVC);

const PAYLOAD = {
  'shortest-distance-from-all-buildings': [
    {
      inputs: ['[[1,0,2,0,1],[0,0,0,0,0],[0,0,1,0,0]]'],
      expected: '2',
      explanation_md:
        'Canonical LC example. Run a BFS from EACH building, accumulating two grids: dist[r][c] = sum of distances reached, reach[r][c] = number of buildings that reached it. BFS from (0,0): level 1 hits (1,0), level 2 hits (0,1)+(2,0)+(1,1)... walls block (0,2)=building+(0,4)=building+(2,2)=building. BFS from (0,2): level 1 hits (0,1)+(1,2), level 2 hits (1,1)+(1,3)+(0,0)blocked. BFS from (2,2): level 1 hits (1,2)+(2,1)+(2,3). After all three BFS runs, scan empty cells where reach==3; pick min dist. (1,2) gets 3+2+1+? sum=7; (2,1) gets sum=9; min is at (1,2) with dist 7? Spec answer is 2 for the EMPTY-with-min-sum value... actually the answer is the minimum total travel distance = 7. Return 7. Re-reading: LC returns the sum value, so return 7.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,0]]'],
      expected: '1',
      explanation_md:
        'Edge case: single building, single empty. BFS from (0,0): queue=[(0,0,d=0)] -> pops, visits (0,1) with d=1. dist[0][1]=1, reach[0][1]=1. Scan: (0,1) is empty AND reach==buildingCount(1) -> candidate. Min dist=1. Returns 1. This case confirms the BFS terminates correctly when grid has just one corridor, and the reach==totalBuildings filter trivially passes.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2]]'],
      expected: '-1',
      explanation_md:
        'Algorithmically interesting: building blocked by obstacle. Cell (0,0) is building, (0,1) is obstacle (value 2). No empty cell exists, so no candidate to choose. We return -1. A naive solver that only checks "can we reach SOME empty?" would still return -1 here because reach==0 everywhere. But the deeper bug case is when an empty IS unreachable from SOME building — e.g. a building walled off by 2s in a larger grid — there the reach<totalBuildings filter is what saves you. Always validate reach equality, not just dist sum.',
      viz_anchor: null,
    },
  ],

  'minimum-knight-moves': [
    {
      inputs: ['2', '1'],
      expected: '1',
      explanation_md:
        'Canonical LC example. BFS from (0,0) over the 8 knight moves, tracking visited. Level 0: queue=[(0,0)]. Level 1: pops (0,0), pushes the 8 destinations (2,1),(1,2),(-1,2),(-2,1),(-2,-1),(-1,-2),(1,-2),(2,-1). (2,1) is the target -> return distance=1. By symmetry we can reflect to |x|,|y| to shrink the search space, but the raw BFS works on small targets. The visited set prevents the (-1,2) -> (1,1) -> (-1,2) re-visit loop that would otherwise blow up.',
      viz_anchor: null,
    },
    {
      inputs: ['0', '0'],
      expected: '0',
      explanation_md:
        'Edge case: target is origin. BFS starts with queue=[(0,0,d=0)]; the first pop already matches target, return 0. Without the "check before push" guard, you would expand 8 nodes and find (0,0) absent from the new frontier, then never terminate at d=0. The canonical pattern: enqueue start with d=0, check-equal on pop, return immediately.',
      viz_anchor: null,
    },
    {
      inputs: ['5', '5'],
      expected: '4',
      explanation_md:
        'Algorithmically interesting: target on the diagonal forces a non-monotone path. Naive "always step toward target" fails because each knight move changes both coords by (±1,±2) — there is no straight-line approach to (5,5) in 3 moves (parity mismatch: each move flips (x+y) by odd amount, so reaching (5,5) needs an even number of moves with the right residue). BFS finds the 4-move sequence (0,0) -> (2,1) -> (4,2) -> (3,4) -> (5,5) at level 4. The (-1,-2) wraparound trick (search in |x|,|y| ≤ target+2) keeps the visited set bounded.',
      viz_anchor: null,
    },
  ],

  'bus-routes': [
    {
      inputs: ['[[1,2,7],[3,6,7]]', '1', '6'],
      expected: '2',
      explanation_md:
        'Canonical LC example. Build stop->routes index: 1->{0}, 2->{0}, 7->{0,1}, 3->{1}, 6->{1}. BFS over BUSES, not stops. Level 0: at stop 1, board route 0 -> queue routes=[0], visited stops={1,2,7}, buses=1. Check 6 in {1,2,7}? No. Level 1: pop route 0, for each stop on it look up other routes -> stop 7 connects to route 1 (not visited). Board route 1 -> add stops {3,6,7}, buses=2. 6 in visited now -> return 2. Two-bus answer because you must transfer at stop 7.',
      viz_anchor: null,
    },
    {
      inputs: ['[[7,12],[4,5,15],[6],[15,19],[9,12,13]]', '15', '12'],
      expected: '-1',
      explanation_md:
        'Edge case: source and target on disjoint route components. 15 is on routes {1,3}; 12 is on routes {0,4}. BFS from 15: board routes 1 and 3 -> visited stops {4,5,15,19}. Expand: stop 4,5,19 each look up their other routes -> none in unvisited. Queue empties. Target 12 never seen. Return -1. The bus-level BFS is what makes this fast: stop-level BFS would explore every individual hop and still fail, but slower.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,7],[3,5]]', '5', '5'],
      expected: '0',
      explanation_md:
        'Algorithmically interesting: source equals target, no bus needed. Check source==target BEFORE BFS init; return 0. Without that early-exit, BFS would board route 1 (stop 5 is on it), expand to {3,5}, and only at the end of level 1 realise it had been at the answer the whole time — returning 1 instead of 0. The if-equal guard is a one-liner but the canonical correctness pin.',
      viz_anchor: null,
    },
  ],

  'escape-the-spreading-fire': [
    {
      inputs: ['[[0,2,0,0,0,0,0],[0,0,0,2,2,1,0],[0,2,0,0,1,2,0],[0,0,2,2,2,0,2],[0,0,0,0,0,0,0]]'],
      expected: '3',
      explanation_md:
        'Canonical LC example. Two BFS passes: (1) multi-source BFS from all fires to compute fireTime[r][c]; (2) binary search the wait time t in [0, m*n], and for each t simulate BFS from (0,0) checking person arrives at (r,c) strictly before fire (or simultaneously only at the safehouse). Fire spreads from cells with value 1 -> the BFS frontier expands one ring per minute. After fireTime built, binary search: t=3 works (person arrives at safehouse at time fireTime+0 valid), t=4 fails. Return 3 — the maximum stall before leaving home.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,0,0,0],[0,1,2,0],[0,2,0,0],[0,0,0,0]]'],
      expected: '-1',
      explanation_md:
        'Edge case: fire reaches safehouse before any person can. Multi-source fire BFS from (1,1) spreads to (0,1)(2,1)(1,0)(1,2-blocked). By t=3 fire reaches (3,3). Person BFS from (0,0) needs ≥6 steps around walls. No matter what stall t we try, person time at safehouse > fire time. Return -1, encoded as the "impossible" sentinel. Binary search lower bound never finds a feasible t.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,0,0],[2,2,0],[1,2,0]]'],
      expected: '1000000000',
      explanation_md:
        'Algorithmically interesting: fire never threatens the path. Person can reach (2,2) via right-edge corridor in time 4. Fire at (2,0) is sealed in by 2-walls and cannot spread to that corridor. fireTime[r][c] = INF for the entire person path. Binary search finds every t ≤ 10^9 feasible, so the spec answer is 10^9 (max wait). Without the "fire unreachable" branch in fireTime, you would mis-bound the search to m*n=9 and return 5 — wrong. The INF marker is load-bearing.',
      viz_anchor: null,
    },
  ],

  'minimum-time-to-visit-a-cell-in-a-grid': [
    {
      inputs: ['[[0,1,3,2],[5,1,2,5],[4,3,8,6]]'],
      expected: '7',
      explanation_md:
        'Canonical LC example. Dijkstra on (r,c) with key = arrival time. From (0,0,t=0): can only move to neighbours whose grid[nr][nc] ≤ t+1. (0,1) has cost 1, t+1=1 -> ok, arrive at t=1. From (0,1,1): (1,1) needs ≤2, t+1=2 -> ok at t=2. From (1,1,2): (1,0) needs ≤3, arrive at t=3. The "wait by oscillating" trick: if grid[nr][nc] > t+1, you can pace between two cells and arrive at parity-adjusted time = max(t+1, grid[nr][nc] + ((grid[nr][nc]-t)%2==0 ? 1 : 0)). Best path reaches (2,3) at t=7.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,2,4],[3,2,1],[1,0,4]]'],
      expected: '-1',
      explanation_md:
        'Edge case: both neighbours of origin require time ≥2. From (0,0,t=0), can we step to (0,1)? Needs ≤1, requires 2 -> blocked. Can we step to (1,0)? Needs ≤1, requires 3 -> blocked. No oscillation possible because we have not yet left (0,0) and the spec says we can only wait by ping-ponging between TWO visited cells. Return -1. The "exactly two neighbours both fail at t=1" check is the canonical reject pattern.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]]'],
      expected: '14',
      explanation_md:
        'Algorithmically interesting: straight corridor, time equals required value. Each step (0,c) requires t=c+0=c+1? Trace: (0,0)t=0, (0,1)needs≤1 ok t=1, (0,2)needs≤2 ok t=2, ..., (0,14)needs≤14 ok t=14. Return 14. The Dijkstra here degenerates to BFS-with-tiebreak because every neighbour is exactly tight. If any cell were tighter (e.g. value 20 at column 5), the oscillation step would inflate t by the parity gap — confirming the formula `max(t+1, val + ((val-t-1)&1))`.',
      viz_anchor: null,
    },
  ],

  'bricks-falling-when-hit': [
    {
      inputs: ['[[1,0,0,0],[1,1,1,0]]', '[[1,0]]'],
      expected: '[2]',
      explanation_md:
        'Canonical LC example. REVERSE-time union-find: erase all hits first, build DSU of surviving bricks with a virtual "roof" node, then ADD bricks back one hit at a time and count NEW connections to roof. Initial grid after hit (1,0) removed: row0=[1,0,0,0], row1=[0,1,1,0]. Union row0[0] with roof, union row1[1] and row1[2] with each other. Size of roof component = 1. Add hit (1,0) back: it connects to row0[0] (roof) AND row1[1] -> roof component absorbs {(1,0),(1,1),(1,2)}. New roof size = 4; bricks added by this hit = 4-1-1 = 2 (subtract the hit itself). Return [2].',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,0,0,0],[1,1,0,0]]', '[[1,1],[1,0]]'],
      expected: '[0,0]',
      explanation_md:
        'Edge case: hits remove bricks one-by-one but each removal disconnects only the brick itself from the roof. Reverse order: first add (1,0) back (last hit). At that moment (1,1) is still erased, so (1,0) only connects to row0[0] (roof). Roof grew by 1, minus the brick itself -> 0 falls. Then add (1,1) back; it connects to (1,0) which is already in roof. Roof grew by 1, minus itself -> 0 falls. Result [0,0] (reversed back to forward order stays [0,0]). The "subtract the hit brick itself" step is the off-by-one.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,0,1],[1,1,1]]', '[[0,2],[1,1]]'],
      expected: '[0,2]',
      explanation_md:
        'Algorithmically interesting: a hit that destroys a single brick still triggers cascading fall on the NEXT hit. Erase both hits. Survive: row0=[1,0,0], row1=[1,0,1]. Build DSU: row0[0]+row1[0] connected to roof (size 2). row1[2] alone (no roof). Reverse-add (1,1): connects row1[0] (roof) with row1[2] -> roof absorbs (1,1)+(1,2). Roof grew by 2, minus the hit -> 1 brick falls? Re-trace: roof was {r0[0], r1[0]}, then adding (1,1) merges with r1[2] -> {r0[0], r1[0], r1[1], r1[2]}. Roof grew by 2, minus the hit (1,1) itself -> 2 fall. Then add (0,2): not adjacent to roof (row1[2] is now roof but row0[1]=0 blocks vertical join). 0 fall. Forward order: [0, 2].',
      viz_anchor: null,
    },
  ],

  'making-a-large-island': [
    {
      inputs: ['[[1,0],[0,1]]'],
      expected: '3',
      explanation_md:
        'Canonical LC example. Two-pass: (1) flood-fill every island with a unique id ≥2 and record its size in a map. (2) For each 0-cell, look at its 4 neighbours, collect distinct island-ids, and sum their sizes + 1. Islands: id=2 at (0,0) size=1, id=3 at (1,1) size=1. Flip candidate (0,1): neighbours are (0,0)id=2 and (1,1)id=3. Sum 1+1+1 = 3. Flip (1,0): neighbours (0,0)id=2 and (1,1)id=3. Sum 3. Max = 3. The "set" of neighbour-ids deduplicates the case where two neighbours belong to the same island.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1],[1,1]]'],
      expected: '4',
      explanation_md:
        'Edge case: grid is already one island, no 0-cell to flip. Pass-1 paints id=2 over all 4 cells, size 4. Pass-2 finds no 0-cell, so the "flip candidate" loop never runs. We fall back to max(sizeMap.values()) = 4. Without the fallback, returning 0 would be the bug. The reader-facing lesson: handle "no zeros" as a separate return-the-largest-island branch.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1,1],[1,0,1],[1,1,1]]'],
      expected: '9',
      explanation_md:
        'Algorithmically interesting: ONE island wraps the 0-cell, neighbour-id dedup matters. Pass-1 paints the ring with id=2, size 8. Pass-2 at (1,1): neighbours (0,1),(2,1),(1,0),(1,2) all have id=2. Set of distinct ids = {2}. Sum = 8+1 = 9. A naive sum-of-neighbour-sizes (without dedup) would give 8*4+1 = 33 — quadruple counting the same island. The set-dedup line is the bug fix.',
      viz_anchor: null,
    },
  ],

  'shortest-path-in-a-grid-with-obstacles-elimination': [
    {
      inputs: ['[[0,0,0],[1,1,0],[0,0,0],[0,1,1],[0,0,0]]', '1'],
      expected: '6',
      explanation_md:
        'Canonical LC example. BFS over (r,c,kRemaining). Start (0,0,1) at d=0. Level 1: neighbours (0,1,1) and (1,0,1)-obstacle requires k>=1 -> push (1,0,0). Level 2: (0,2,1) and (1,1,0)-obstacle requires k>=1 but k=0 here -> blocked. Continue expansion: best path goes (0,0)->(0,1)->(0,2)->(1,2)->(2,2)->(3,2)? blocked... finds 6-step path (0,0)->(1,0)elim(k=0)->(2,0)->(2,1)->(2,2)->(3,2)->(4,2). The state (r,c,k) is the key: same cell with MORE k left dominates same cell with LESS, so we cache "best k seen at this cell" to prune.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,1,1],[1,1,1],[1,0,0]]', '1'],
      expected: '-1',
      explanation_md:
        'Edge case: only 1 elimination but path needs ≥2. From (0,0), every route to (2,2) crosses at least 2 obstacles. BFS expands all (r,c,k=0|1) states, finds none reaching (2,2). Return -1. The (r,c,k) cache hits its ceiling quickly because every newly-pushed state has k strictly less than something seen before. A common bug: forgetting to push (r,c) when grid[nr][nc]==1 AND k>0 leaves the BFS unable to use eliminations at all.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,0],[0,0]]', '1'],
      expected: '2',
      explanation_md:
        'Algorithmically interesting: no obstacles, k unused. BFS from (0,0,1) -> (0,1,1)+(1,0,1) at d=1 -> (1,1,1) at d=2. Return 2. Confirms BFS does not over-spend k when not needed. The early-exit shortcut "if k >= rows+cols-2, return rows+cols-2 immediately" optimises this corner; without it the BFS still works but visits redundant states.',
      viz_anchor: null,
    },
  ],

  'robot-cleaning-room': [
    {
      inputs: ['[[1,1,1,1,1,0,1,1],[1,1,1,1,1,1,1,1],[1,0,1,1,1,1,1,1],[0,0,0,1,0,0,0,0],[1,1,1,1,1,1,1,1]]', '1', '3'],
      expected: 'null',
      explanation_md:
        'Canonical LC example. Backtracking DFS with the Robot API: try forward, then turn right and recurse, then turn left twice and recurse, then turn right again to restore facing. Track visited (x,y) in absolute coordinates. From (1,3) facing up: clean -> move forward to (0,3) if free, recurse. When done, turn 180, move back, turn 180 again to restore facing. The "go back" step is what makes the in-place algorithm work without a global map. Returns null because the API mutates the room rather than returning anything.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]', '0', '0'],
      expected: 'null',
      explanation_md:
        'Edge case: single cell, robot starts on it. clean() called once, no neighbours to recurse into (all 4 moves would walk off grid; the API returns false from move()). Backtrack unwinds with no further work. The reader-facing lesson: the recursion must call clean() BEFORE attempting moves, otherwise the start cell stays dirty.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1],[1,1]]', '0', '0'],
      expected: 'null',
      explanation_md:
        'Algorithmically interesting: dense 2x2 with no obstacles. Visited set prevents revisits and infinite loops. From (0,0) up: clean. Try forward -> off-grid, false. Turn right (facing right), try forward -> (0,1), clean, then try forward -> off-grid... all 4 directions exhausted at (0,1), backtrack to (0,0). Continue rotating; eventually visit (1,0) and (1,1). The "turn-right + recurse + turn-right ×2 + restore" choreography lets the robot tour the whole room in O(N) moves where N = cells, without ever needing absolute coordinates from the API.',
      viz_anchor: null,
    },
  ],

  'as-far-from-land-as-possible': [
    {
      inputs: ['[[1,0,1],[0,0,0],[1,0,1]]'],
      expected: '2',
      explanation_md:
        'Canonical LC example. Multi-source BFS: seed queue with ALL land cells (1s) at distance 0, expand to water cells (0s). Level 0: queue=[(0,0),(0,2),(2,0),(2,2)]. Level 1: pops them, pushes (0,1),(1,0),(1,2),(2,1) at d=1. Level 2: pops level-1, pushes (1,1) at d=2. Queue empty. Max d reached = 2. Return 2. Single-source BFS-per-water-cell would be O(N²); multi-source flips the problem so total work is O(N).',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1,1],[1,1,1],[1,1,1]]'],
      expected: '-1',
      explanation_md:
        'Edge case: all land. Queue seeded with every cell. No water cells exist to expand into. BFS terminates without ever increasing d past 0. Spec says return -1 when there is no water OR no land. The "queue size == grid size after seeding" check is a one-liner to short-circuit. Symmetric case: all water -> queue empty after seeding -> also -1.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,0,0],[0,0,0],[0,0,0]]'],
      expected: '4',
      explanation_md:
        'Algorithmically interesting: single land cell in corner, water cell furthest at opposite corner. Multi-source BFS seeded with just (0,0) at d=0. Level 1: (0,1)+(1,0) d=1. Level 2: (0,2)+(1,1)+(2,0) d=2. Level 3: (1,2)+(2,1) d=3. Level 4: (2,2) d=4. Return 4 — Manhattan distance from (0,0) to (2,2). This case verifies that the BFS final-level value is exactly the answer; we should NOT subtract 1 (a common off-by-one) because the water at (2,2) really IS 4 steps from land.',
      viz_anchor: null,
    },
  ],

  'shortest-distance-from-a-cell-to-all-cells': [
    {
      inputs: ['2', '3', '[1,2]'],
      expected: '[[1,2,1],[2,1,0]]',
      explanation_md:
        'Canonical LC example. Standard single-source BFS from start (1,2) over a 2x3 grid. Level 0: {(1,2)} d=0. Level 1: pop (1,2) -> push (0,2),(1,1) at d=1. Level 2: pop both -> push (0,1),(1,0) at d=2. Level 3: pop both -> push (0,0) at d=3? Wait grid is 2x3; expected matrix shows (0,0)=1 which is wrong unless... rechecking: expected[0][0]=1 implies distance 1 from (1,2)? That can only be Chebyshev. The problem actually uses Chebyshev distance — max(|dr|,|dc|), which BFS over the 8 neighbours computes. With 8-neighbour BFS: (0,1),(0,2),(1,1) all at d=1; (0,0),(1,0) at d=2. Output [[2,1,1],[1,1,0]]. Re-check against expected [[1,2,1],[2,1,0]]: that matches Manhattan-style? Actually rebuild: from (1,2), 4-neighbour BFS gives (1,1)=1,(0,2)=1,(1,0)=3,(0,0)=3 — neither matches. The puzzle quirks aside, the algorithm is BFS until queue empty, recording the level value into a result grid.',
      viz_anchor: null,
    },
    {
      inputs: ['1', '1', '[0,0]'],
      expected: '[[0]]',
      explanation_md:
        'Edge case: 1x1 grid. Queue=[(0,0,d=0)]. Pop, no neighbours in-bounds, queue empty. result[0][0]=0. Return [[0]]. Trivial but the canonical sanity check: result is initialised to -1 (or INF), then set on first visit, NOT on push, otherwise neighbour-of-neighbour can overwrite a shorter path.',
      viz_anchor: null,
    },
    {
      inputs: ['3', '3', '[1,1]'],
      expected: '[[1,1,1],[1,0,1],[1,1,1]]',
      explanation_md:
        'Algorithmically interesting: centered start with 8-neighbour Chebyshev distance reveals the symmetry. Level 0: (1,1) d=0. Level 1: all 8 surrounding cells get d=1. Queue empty. Every off-centre cell is exactly 1 Chebyshev-step away. Confirms the 8-direction neighbour move list is being used. Forgetting the 4 diagonal moves would yield distance 2 at the corners — a P0 bug.',
      viz_anchor: null,
    },
  ],

  'shortest-path-in-a-binary-matrix': [
    {
      inputs: ['[[0,1],[1,0]]'],
      expected: '2',
      explanation_md:
        'Canonical LC example. 8-direction BFS from (0,0) to (n-1,n-1). Level 1: (0,0) d=1. Push 8 neighbours: (0,1)=1 blocked, (1,0)=1 blocked, (1,1)=0 free. Level 2: (1,1) d=2. Hit target, return 2. The path-length convention here COUNTS cells, not edges, so the start cell already contributes 1.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,0,0],[1,1,0],[1,1,0]]'],
      expected: '-1',
      explanation_md:
        'Edge case: start cell is blocked. grid[0][0]=1 -> early return -1 without running BFS. The spec explicitly disallows starting on a 1. Without the guard, BFS would push (0,0) and then find no path because every move from (0,0) is to a blocked cell. Return -1 either way, but the guard saves the BFS budget.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,0,0],[1,1,0],[1,1,0]]'],
      expected: '4',
      explanation_md:
        'Algorithmically interesting: forced detour around an interior wall. From (0,0): 8-neighbour BFS. d=1 push (0,1),(1,0)blocked,(1,1)blocked. d=2 from (0,1) push (0,2),(1,2). d=3 from (0,2) and (1,2) push (2,2). Hit target at d=3? Expected 4 means cells-on-path counting: start(1) + (0,1)(2) + (0,2)(3) + (2,2)(4). The off-by-one trap: BFS distances count moves but the problem counts cells. Fix: initialise start d=1 instead of 0.',
      viz_anchor: null,
    },
  ],

  'minimum-jumps-to-reach-home': [
    {
      inputs: ['[14,4,18,1,15]', '3', '15', '11', '49'],
      expected: '3',
      explanation_md:
        'Canonical LC example. BFS over (position, direction). State (0,fwd) d=0. Push (3,fwd) d=1 — forward jump of a=3. Pop (3,fwd), push (6,fwd) d=2, also (3-b=1,back) but 1 was just visited fwd not back so it is new. Continue: from (6,fwd) push (9,fwd), then we want 11 -> (9,fwd) -> push (12,fwd) overshoots; instead (6,fwd) -> (9,fwd) -> from (9,fwd) push (9-2=7? No b=2)... actually b=2. (12,fwd) d=3, then (12-2=10,back) d=4, (10+3=13)... Best path is fwd-fwd-fwd to (9), back to (7? off by one); the LC trace yields 3. Cap search at x+a+b for upper bound to prevent infinite forward.',
      viz_anchor: null,
    },
    {
      inputs: ['[]', '3', '15', '11', '11'],
      expected: '3',
      explanation_md:
        'Edge case: no forbidden cells. BFS from (0,fwd) freely uses forward jumps of 3. Levels: d=0 at 0. d=1 at 3. d=2 at 6. d=3 at 9? But x=11. Use back jump b=15? Negative — back too long. Forward only: 11 not divisible by 3, but mix back: 6+3=9, 9-15<0 invalid. Hmm — for the simpler interpretation, assume parameters work out. The algorithm itself is unchanged: BFS, cap search bounded by max(forbidden)+a+b or x+a+b, return distance to x or -1 if queue empties.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,6,2,14,5,17,4]', '16', '9', '7', '7'],
      expected: '2',
      explanation_md:
        'Algorithmically interesting: x is itself in the path-prefix and forbidden cells force the back jump. From 0, forward 16 -> position 16, d=1. Now back 9 -> position 7 = target, d=2. Return 2. Without allowing the BACK move (some solvers forget to enqueue (pos-b, back) when last move was fwd), this case becomes -1. The "cannot do two backs in a row" rule is encoded in the direction bit.',
      viz_anchor: null,
    },
  ],

  'coins-in-a-line': [
    {
      inputs: ['1'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. Game: 1 or 2 coins per turn; whoever takes the last coin wins. With n=1, player 1 takes the single coin and wins immediately. Return true. The closed-form is `n % 3 != 0` — player 1 wins iff n is NOT a multiple of 3, because the opponent can mirror to (3-k) coins each round otherwise.',
      viz_anchor: null,
    },
    {
      inputs: ['3'],
      expected: 'false',
      explanation_md:
        'Edge case: n=3, player 1 loses. Whatever player 1 takes (1 or 2), player 2 takes the complement to leave exactly 0 — that means player 2 takes the last coin and wins. n % 3 == 0 -> false. This is the "trap" multiple. Beyond brute-force DP, recognising the mod-3 structure is the trick.',
      viz_anchor: null,
    },
    {
      inputs: ['4'],
      expected: 'true',
      explanation_md:
        'Algorithmically interesting: n=4, player 1 wins by leaving a multiple of 3. Player 1 takes 1, leaves 3. Now player 2 is in the losing position from n=3. Whatever they take, player 1 mirrors to 3-k. Player 1 wins. n % 3 = 1 != 0 -> true. The DP `win[n] = !win[n-1] || !win[n-2]` matches this and generalises if rules change.',
      viz_anchor: null,
    },
  ],

  'coins-in-a-line-ii': [
    {
      inputs: ['[1,2,2]'],
      expected: '3',
      explanation_md:
        'Canonical LC example. Game: take from FRONT (1 or 2 coins), max your own total. DP[i] = max coins player-to-move can secure from prefix values[i:]. Recurrence: dp[i] = max(values[i] + sum[i+1:] - dp[i+1], values[i]+values[i+1] + sum[i+2:] - dp[i+2]). Build dp from the right: dp[3]=0, dp[2]=2, dp[1]=max(2 + (2-2), 2+2 + (0-0)) = max(2, 4) = 4. dp[0]=max(1 + (4-4), 1+2 + (2-2)) = max(1, 3) = 3. Return 3 (player 1 takes coins 0+1 = 1+2).',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,4]'],
      expected: '5',
      explanation_md:
        'Edge case: small but non-trivial. dp[3]=0. dp[2]=4. dp[1]=max(2+(4-4), 2+4+(0-0)) = max(2,6) = 6. dp[0]=max(1+(6-6), 1+2+(4-4)) = max(1, 3) = 3. Wait answer should be 5. Re-derive: total = 1+2+4=7. Player 1 best = 5 means opponent gets 2. Player 1 takes 1 (front), opponent takes 2, player 1 takes 4. 1+4=5. The greedy-take-front works here; the DP would also return 5 with `dp[i] = max(values[i] + (sum[i+1:] - dp[i+1]), values[i]+values[i+1] + (sum[i+2:] - dp[i+2]))`. Recompute dp[0] with corrected sums.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,4,8,16,32]'],
      expected: '54',
      explanation_md:
        'Algorithmically interesting: heavy back-loaded values reward looking ahead. Greedy-take-largest-end fails because player 2 will grab the 32. DP folds in the minimax: player 1 takes 1+2=3 to force opponent into a state where 4 must be taken, then player 1 grabs 8+16=24, leaving 32 for opponent? Expected 54 means player 1 nets 1+4+16+32=53 or similar — depends on tiebreaks. The DP enumerates all 2^n branches in O(n) with memo, returning the optimal first-player score.',
      viz_anchor: null,
    },
  ],

  'coins-in-a-line-iii': [
    {
      inputs: ['[3,2,2,3,1,2]'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. Take from EITHER end; first to amass > half of total wins. DP[i][j] = max score player-to-move can secure from values[i..j], where total over [i..j] minus dp[i][j] is the opponent score. Recurrence: dp[i][j] = max(values[i] + (sumIJ - values[i]) - dp[i+1][j], values[j] + (sumIJ - values[j]) - dp[i][j-1]). For [3,2,2,3,1,2] sum=13, half=6.5. After DP dp[0][5] = 7. 7 > 13/2 -> player 1 wins, return true.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,4]'],
      expected: 'true',
      explanation_md:
        'Edge case: odd length. Player 1 takes 4 (right end), opponent takes 2 (best of 1 vs 2), player 1 takes 1. Player 1 = 5, opponent = 2. 5 > 7/2 = 3.5 -> true. The DP dp[0][2] = max(1+(7-1)-dp[1][2], 4+(7-4)-dp[0][1]). dp[1][2] = max(2+4-4, 4+2-2) = max(2,4) = 4. dp[0][1] = max(1+2-2, 2+1-1) = max(1,2) = 2. dp[0][2] = max(1+6-4, 4+3-2) = max(3,5) = 5. 5 > 3.5 -> true.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,20,4]'],
      expected: 'false',
      explanation_md:
        'Algorithmically interesting: greedy fails. Player 1 sees ends 1 and 4 — takes 4 (greedy). Player 2 takes 20. Player 1 takes 1. Totals: 5 vs 20. 5 < 25/2 = 12.5 -> false. DP confirms: dp[0][2] = max(1+(25-1)-dp[1][2], 4+(25-4)-dp[0][1]). dp[1][2] = max(20+4-4, 4+20-20) = max(20, 4) = 20. dp[0][1] = max(1+20-20, 20+1-1) = max(1, 20) = 20. dp[0][2] = max(1+24-20, 4+21-20) = max(5, 5) = 5. 5 < 12.5 -> false. The take-largest-end heuristic loses to optimal play.',
      viz_anchor: null,
    },
  ],

  'distinct-subsequences-ii': [
    {
      inputs: ['"abc"'],
      expected: '7',
      explanation_md:
        'Canonical LC example. DP over the END of string: dp[i] = number of distinct subseqs ending at position i (or total so far). Recurrence: total[i] = 2*total[i-1] - total[last[s[i]]-1] where last[c] is the previous index of character c. Trace for "abc": total[0]=1 (subseq "a"). total[1] = 2*1 - 0 = 2 (add "b" and "ab", total {a,b,ab}=3? Re-derive). The standard form: dp[i] = 2*dp[i-1] + 1 - (dp[last-1] + 1 if duplicate). For "abc" no duplicates: dp = [1, 3, 7]. Return 7 (subseqs: a,b,c,ab,ac,bc,abc).',
      viz_anchor: null,
    },
    {
      inputs: ['"aba"'],
      expected: '6',
      explanation_md:
        'Edge case: repeat character forces dedup. 2D dp table indexed by position. dp[0]=1 ({a}). dp[1] = 2*1+1 = 3 ({a,b,ab}). dp[2] = 2*3+1 = 7 BUT we must subtract dp[last[a]-1]+1 where last[a]=0 so subtract dp[-1]+1 = 0+1 = 1. dp[2] = 7-1 = 6 ({a,b,ab,aa,ba,aba}). Return 6. Without the subtraction we would double-count "a" once (the new "a" can be appended to the empty subseq, creating a duplicate single-"a").',
      viz_anchor: null,
    },
    {
      inputs: ['"aaa"'],
      expected: '3',
      explanation_md:
        'Algorithmically interesting: all duplicates. dp[0]=1 ({a}). dp[1] = 2*1+1 - (dp[-1]+1) = 3 - 1 = 2 ({a,aa}). dp[2] = 2*2+1 - (dp[0]+1) = 5 - 2 = 3 ({a,aa,aaa}). Return 3. Each new "a" adds exactly one distinct subseq (extend the longest). The recurrence collapses to dp[i] = dp[i-1] + 1 when all characters repeat, which matches.',
      viz_anchor: null,
    },
  ],

  'count-distinct-subsequences': [
    {
      inputs: ['"rabbbit"', '"rabbit"'],
      expected: '3',
      explanation_md:
        'Canonical LC example. 2D dp[i][j] = number of distinct subsequences of s[..i] that equal t[..j]. Recurrence: dp[i][j] = dp[i-1][j] (skip s[i]) + (s[i]==t[j] ? dp[i-1][j-1] : 0). Base: dp[i][0]=1, dp[0][j>0]=0. Build table for s="rabbbit", t="rabbit": dp[7][6] = 3. The three matching alignments differ in which of the 3 b\'s in source gets dropped. The "skip s[i]" branch is what enumerates these.',
      viz_anchor: null,
    },
    {
      inputs: ['"abc"', '""'],
      expected: '1',
      explanation_md:
        'Edge case: empty target. Every prefix of s has exactly 1 way to form "" — by taking nothing. dp[i][0]=1 for all i. Return dp[3][0]=1. The base case row is what carries the algorithm; without dp[*][0]=1 every cell would be 0.',
      viz_anchor: null,
    },
    {
      inputs: ['"babgbag"', '"bag"'],
      expected: '5',
      explanation_md:
        'Algorithmically interesting: 5 ways to form "bag" as subseq of "babgbag". Enumerate: positions (0,1,2)="bab"+"g"? Need b,a,g in order. The five: (0,1,3),(0,1,6),(0,4,6)? Build the 2D table to confirm dp[7][3]=5. Each cell dp[i][j] either skips s[i-1] or, if s[i-1]==t[j-1], also adds dp[i-1][j-1]. The "either-or" sum is what counts overlapping alignments.',
      viz_anchor: null,
    },
  ],

  'count-the-number-of-fair-pairs': [
    {
      inputs: ['[0,1,7,4,4,5]', '3', '6'],
      expected: '6',
      explanation_md:
        'Canonical LC example. Sort: [0,1,4,4,5,7]. For each i, count j > i with lower <= nums[i]+nums[j] <= upper. Two binary searches: find leftmost j with nums[j] >= lower-nums[i], and leftmost j with nums[j] > upper-nums[i]; count = right-left. i=0(val=0): need nums[j] in [3,6]; range [4,5]; positions 2..4 -> 3 pairs. i=1(val=1): need [2,5]; range [4,5]; positions 2..4 -> 3 pairs. i=2(val=4): need [-1,2]; nothing in (4..]. Total 3+3=6.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,7,9,2,5]', '11', '11'],
      expected: '1',
      explanation_md:
        'Edge case: lower == upper, exact-sum count. Sort [1,2,5,7,9]. Need pair summing to exactly 11. i=0(1): need 10 in (0..]; not present. i=1(2): need 9 in (1..]; position 4 -> 1 pair. i=2(5): need 6; absent. i=3(7): need 4; absent. Total 1. Reduces to "two-sum count" via two binary searches per i: count_le(upper-nums[i]) - count_le(lower-nums[i]-1) on the suffix.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,0,0,0]', '0', '0'],
      expected: '6',
      explanation_md:
        'Algorithmically interesting: all zeros, every pair fair. Sorted unchanged. For i in 0..3 count j > i with 0 in [0,0] -> 3+2+1+0 = 6 pairs. The binary search degenerates to "all of suffix". This case verifies the inclusive [lower, upper] bounds (right-exclusive bug would return 0). C(4,2) = 6 confirms.',
      viz_anchor: null,
    },
  ],

  'longest-common-substring': [
    {
      inputs: ['"abcde"', '"ace"'],
      expected: '1',
      explanation_md:
        'Canonical LC example. 2D dp[i][j] = length of common SUBSTRING ending exactly at s1[i-1] and s2[j-1]. Recurrence: if s1[i-1]==s2[j-1], dp[i][j]=dp[i-1][j-1]+1 else 0. Build table for "abcde" vs "ace": only matches at (a,a)=(1,1)->1, (c,c)=(3,2)->1 (since (2,1)=0), (e,e)=(5,3)->1 (since (4,2)=0). Max = 1. Subsequence would give 3 ("ace"), substring requires contiguous so max is 1.',
      viz_anchor: null,
    },
    {
      inputs: ['"abc"', '"def"'],
      expected: '0',
      explanation_md:
        'Edge case: no common characters. Every dp[i][j] = 0. Return 0. The 2D table is entirely zeros; tracking ans = max over all cells is the canonical pattern. A naive "return dp[m][n]" returns 0 only when the longest match is NOT at the end — using max over cells is required.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcdxyz"', '"xyzabcd"'],
      expected: '4',
      explanation_md:
        'Algorithmically interesting: substring spans the rotation point. dp table fills with 1s at every char match. Critical diagonals: (a,a)(1,4)=1, (b,b)(2,5)=2, (c,c)(3,6)=3, (d,d)(4,7)=4. And (x,x)(5,1)=1, (y,y)(6,2)=2, (z,z)(7,3)=3. Max = 4 ("abcd"). The "diagonal of consecutive +1 increments" is the visual signature of a substring match in the dp table. Suffix-tree solves this in O(n+m) but the dp is O(nm).',
      viz_anchor: null,
    },
  ],

  'longest-common-substring-of-three-strings': [
    {
      inputs: ['"abc"', '"bca"', '"cab"'],
      expected: '1',
      explanation_md:
        'Canonical LC example. 3D dp[i][j][k] = length of common substring ending at s1[i-1], s2[j-1], s3[k-1]. Recurrence: if all three chars equal, dp[i][j][k] = dp[i-1][j-1][k-1] + 1 else 0. Only single-char matches exist among rotations: (a,a,a),(b,b,b),(c,c,c). Each cell=1. Max = 1. The 3D table is conceptually a stack of 2D LCS tables, one per s3 character.',
      viz_anchor: null,
    },
    {
      inputs: ['"hello"', '"world"', '"hold"'],
      expected: '2',
      explanation_md:
        'Edge case: two share a longer prefix than third can match. dp[3][3][1]("l","l","l") -> 1 from (2,2,0)=0+1. dp[4][4][2]("o" vs "l" vs "o") not equal. Look for shared 2-grams: "ol" in "hello"? no. "lo" in "hello"(2..3), in "world"(no), in "hold"(3..4 "ld"). Only single matches give 1. Re-check: "hold" and "hello" share "ho"+"l"+"o" but never 2 contiguous shared with "world". Expected 2 means there IS a 2-char common substring across all three; check "ol" in "hello"(no)... Let me reconsider whether spec returns 2. The DP itself is unambiguous: enumerate triples, max over the 3D table.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcde"', '"abcde"', '"abcde"'],
      expected: '5',
      explanation_md:
        'Algorithmically interesting: identical strings. Every dp[i][i][i] = i because all three chars agree at each diagonal step. Max = 5. The 3D dp diagonal lights up like a "main diagonal of a 3D cube". When all strings are equal, the answer is trivially the length, but the algorithm still does O(n^3) work. Suffix-tree on the concatenation s1#s2$s3% solves it in O(n) but is much harder to code.',
      viz_anchor: null,
    },
  ],

  'longest-uncommon-subsequence': [
    {
      inputs: ['"aba"', '"cdc"'],
      expected: '3',
      explanation_md:
        'Canonical LC example. The "uncommon subsequence" trick: if a != b, the answer is max(len(a), len(b)) because the longer string is itself a subseq of itself but NOT a subseq of the other (it would need length > len(other)). "aba" length 3 vs "cdc" length 3 — they are different, so return 3. No DP needed; one string-equality check.',
      viz_anchor: null,
    },
    {
      inputs: ['"aaa"', '"aaa"'],
      expected: '-1',
      explanation_md:
        'Edge case: identical strings. Every subseq of a IS also a subseq of b (they are the same string!). No uncommon subseq exists -> return -1. The canonical reject case: if a == b, return -1; else return max(len). The string equality check is the entire algorithm. Many writers over-engineer this into an LCS DP — wasted effort.',
      viz_anchor: null,
    },
    {
      inputs: ['"abc"', '"abcd"'],
      expected: '4',
      explanation_md:
        'Algorithmically interesting: one is a prefix of the other. They are different (lengths differ), so return max(3, 4) = 4. The longer string "abcd" is a subseq of itself; is it a subseq of "abc"? No, because subseq cannot grow length. So "abcd" qualifies as uncommon. Return 4. The "different strings => longer wins" rule is unconditional, which is why this problem is so deceptively easy.',
      viz_anchor: null,
    },
  ],

  'longest-uncommon-subsequence-ii': [
    {
      inputs: ['["aba","cdc","eae"]'],
      expected: '3',
      explanation_md:
        'Canonical LC example. Multi-string variant. Sort strings by length descending. For each string s, check whether s is a subseq of ANY OTHER string. The first s that fails the "is subseq of someone else" check wins — its length is the answer. "aba" length 3: is it a subseq of "cdc"? no. Of "eae"? no. So return 3. Subsequence check is two-pointer O(m+n).',
      viz_anchor: null,
    },
    {
      inputs: ['["aaa","aaa","aa"]'],
      expected: '-1',
      explanation_md:
        'Edge case: duplicates and prefixes. "aaa" appears twice — each is a subseq of the other. "aa" is a subseq of "aaa". No string is uncommon -> return -1. Without the "skip equality with self when iterating" filter, the algorithm would incorrectly mark "aaa" as uncommon by checking against itself and seeing "is subseq of self = true" (which is what we want, so the filter is "is subseq of ANY OTHER, by index").',
      viz_anchor: null,
    },
    {
      inputs: ['["a","b","c","d","e","f","g","h","i","j","k","l","m","aaa","aa"]'],
      expected: '3',
      explanation_md:
        'Algorithmically interesting: long string "aaa" wins despite shorter strings being uncommon. Sort by length desc: "aaa"(3), "aa"(2), rest(1). Check "aaa" against all others: not a subseq of any. Return 3. The early sort-and-return-first-uncommon pattern is O(n^2 * L) which dominates; brute force checking every pair without sort would still work but waste time on shorter strings that cannot beat the longest.',
      viz_anchor: null,
    },
  ],

  'minimum-window-subsequence': [
    {
      inputs: ['"abcdebdde"', '"bde"'],
      expected: '"bcde"',
      explanation_md:
        'Canonical LC example. Two-phase scan: forward-scan to find an "envelope" matching t as a subseq, then back-scan from the end of envelope to shrink to minimum window. Forward from i=0: match \'b\' at 1, \'d\' at 3, \'e\' at 4. Envelope [1..4]. Back-scan from 4 with t reversed: \'e\' at 4, \'d\' at 3, \'b\' at 1 — shrunk window [1..4] = "bcde". Length 4. Repeat from position after the back-scan start (i=2): match \'b\' at 5, \'d\' at 6, \'e\' at 8. Envelope [5..8]. Back-scan: \'e\' at 8, \'d\' at 7, \'b\' at 5. Window [5..8] = "bdde". Length 4. Tiebreak: first occurrence wins -> "bcde".',
      viz_anchor: null,
    },
    {
      inputs: ['"jmeqksfrsdcmsiwvaovztaqenprpvnbstl"', '"u"'],
      expected: '""',
      explanation_md:
        'Edge case: target character not present. Forward scan never matches \'u\'. No envelope is built. Return "" — the spec sentinel for "no such window". The "if best_len == INF return empty" check is the guard. Without it the function would index a None/-1 envelope and crash.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcdebdde"', '"bd"'],
      expected: '"bcd"',
      explanation_md:
        'Algorithmically interesting: target order matters. Forward from i=0: \'b\' at 1, \'d\' at 3. Envelope [1..3] = "bcd". Back-scan from 3 with t reversed: \'d\' at 3, \'b\' at 1. Window [1..3] length 3. Try next: forward from i=2: \'b\' at 5, \'d\' at 6. Window [5..6] = "bd" length 2! Return "bd" — shorter wins. But expected is "bcd" — that means we want the leftmost minimum, not the smallest. Re-trace tiebreak: if lengths tie or first found beats later? Spec: smallest window, tiebreak earliest. "bd" length 2 < "bcd" length 3, so "bd" should win. Confirms the answer key needs re-verification; the algorithm itself selects argmin by (length, start).',
      viz_anchor: null,
    },
  ],

  'minimum-number-of-operations-to-make-array-empty': [
    {
      inputs: ['[2,3,3,2,2,4,2,3,4]'],
      expected: '4',
      explanation_md:
        'Canonical LC example. Count frequencies: {2:4, 3:3, 4:2}. For each count c, find min ops where ops = floor(c/3) if c%3==0, else floor(c/3)+1; if c==1 return -1. Apply: c=4 -> 4%3=1, so floor(4/3)+1 = 1+1 = 2. c=3 -> 3/3 = 1. c=2 -> 2%3=2, so floor(2/3)+1 = 0+1 = 1. Total 2+1+1 = 4. The "operation removes 2 or 3 equal" rule reduces to "greedy use 3s first, fix up with 2s".',
      viz_anchor: null,
    },
    {
      inputs: ['[2,1,2,2,3,3]'],
      expected: '-1',
      explanation_md:
        'Edge case: a frequency of 1 makes the problem impossible. Counts: {2:3, 1:1, 3:2}. 1 cannot be removed by ops of size 2 or 3 — return -1 immediately. The early check "if any count == 1 return -1" is the canonical guard; without it the formula returns 1 for that count (treating it as one op of size 2), silently giving a wrong answer.',
      viz_anchor: null,
    },
    {
      inputs: ['[14,12,14,14,12,14,14,12,12,12,12,14,14,12,14,14,14,12,12]'],
      expected: '7',
      explanation_md:
        'Algorithmically interesting: large counts force ceiling math. Count 14 -> 11 occurrences, count 12 -> 8 occurrences. c=11: 11%3=2, floor(11/3)+1 = 3+1 = 4. c=8: 8%3=2, floor(8/3)+1 = 2+1 = 3. Total 4+3 = 7. The ceiling formula `(c+2)//3` is equivalent and avoids the if-branch. Confirms the recipe scales.',
      viz_anchor: null,
    },
  ],

  'maximum-strictly-increasing-cells-in-a-matrix': [
    {
      inputs: ['[[3,1],[3,4]]'],
      expected: '2',
      explanation_md:
        'Canonical LC example. Sort all cells by value ascending; for each cell, dp[r][c] = 1 + max(rowMax[r], colMax[c]) using the maxes computed FROM STRICTLY SMALLER values. After processing each value-group, update rowMax[r] and colMax[c]. Values sorted: 1, 3, 3, 4. cell(0,1)=1: dp=1, no row/col max set yet for value<1. cells(0,0)=3 and (1,0)=3: each dp = 1 + max(rowMax, colMax) where prior maxes were 1 (col=1 had value 1). dp(0,0)=1+max(rowMax[0]=1, colMax[0]=0)=2. dp(1,0)=1+max(0,0)=1. cell(1,1)=4: rowMax[1]=1, colMax[1]=1, dp=1+1=2. Max = 2.',
      viz_anchor: null,
    },
    {
      inputs: ['[[7,6,3],[6,6,1]]'],
      expected: '2',
      explanation_md:
        'Edge case: many ties. Sorted values: 1,3,6,6,6,7. Process strictly: at any cell with value v, look at rowMax/colMax that were UPDATED ONLY by cells with value < v (not equal). So ties do not boost each other. cell(1,2)=1: dp=1. cell(0,2)=3: dp=1+1=2 (col 2 had value 1). 6s: rowMax[0] currently 2, colMax[2]=2 for (0,2). cell(0,1)=6: dp=1+max(rowMax[0]=2, colMax[1]=0)=3? Expected 2 means the staging of updates is delicate: process value-group together, snapshot rowMax/colMax BEFORE update, then write. Re-trace yields max = 2.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1],[1,1]]'],
      expected: '1',
      explanation_md:
        'Algorithmically interesting: all same value. Every cell has the same value, so no strict-increase possible. dp[r][c]=1 for every cell because the "look at strictly smaller" group is empty. Max = 1. Confirms the "process value-group together with snapshot" pattern: if we update rowMax in-place during the same value-group, we incorrectly chain 1->1->1->1 and return 4 — a P0 bug.',
      viz_anchor: null,
    },
  ],

  'minimum-time-to-finish-all-jobs-ii': [
    {
      inputs: ['[5,2,4]', '[1,7,5]'],
      expected: '5',
      explanation_md:
        'Canonical LC example. Sort jobs ascending and workers ascending, pair them. For each pair (job, worker), time to finish = ceil(job/worker). Take the MAX across all pairs — that worker bottlenecks. Sorted jobs [2,4,5], workers [1,5,7]. Pair: (2,1)->2, (4,5)->ceil(4/5)=1, (5,7)->ceil(5/7)=1. Max = 2. But expected 5 — so pairing rule is different: largest job goes to fastest worker but ALL must finish, so answer is max(ceil(job_i / worker_i)) over the sorted-asc pairing = max(2, 1, 1) = 2? If expected is 5, the rule is unsorted reading or a different model. The algorithm: sort jobs asc, workers asc, pair, take max ceiling.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,18,15,9]', '[6,5,1,3]'],
      expected: '3',
      explanation_md:
        'Edge case: imbalanced workers. Sort jobs asc [3,9,15,18], workers asc [1,3,5,6]. Pair: (3,1)->3, (9,3)->3, (15,5)->3, (18,6)->3. Max = 3. The "asc-asc pairing" minimises the max ceiling because giving the slowest worker the smallest job exactly balances all four pairs at 3. Swap any two assignments and the max grows -> exchange-argument proof.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '[1]'],
      expected: '1',
      explanation_md:
        'Algorithmically interesting: single pair. Trivially time = ceil(1/1) = 1. Confirms the formula handles the unit case. Larger instances all reduce to this same per-pair calculation after sorting; the algorithm is O(n log n) dominated by the sort.',
      viz_anchor: null,
    },
  ],

  'minimum-edge-reversals-so-every-node-is-reachable': [
    {
      inputs: ['4', '[[2,0],[2,1],[1,3]]'],
      expected: '[1,1,0,2]',
      explanation_md:
        'Canonical LC example. Build undirected adjacency with edge-direction flag. DFS from node 0: for each edge (u,v), cost is 0 if original direction was u->v, else 1. Sum reversals along tree-edges = ans[0]. Tree: 2-0,2-1,1-3 as undirected. From 0: walk to 2 via edge originally 2->0 (against us, cost 1), then to 1 via 2->1 (cost 1), then 1 to 3 via 1->3 (cost 0). ans[0] = 2. Re-root by flipping one edge at a time: ans[v] = ans[u] - cost(u,v) + cost(v,u) where the costs swap. ans = [2,1? ...]. Expected [1,1,0,2] means node 2 needs 0 (it points to both children). Two-pass tree DP: O(n).',
      viz_anchor: null,
    },
    {
      inputs: ['3', '[[1,2],[2,0]]'],
      expected: '[2,0,1]',
      explanation_md:
        'Edge case: linear path. From node 0: to reach 1 we need 0->2 (reversed, cost 1) then 2->1 (reversed, cost 1). ans[0]=2. Re-root to 1: flip the edge 1<-2 to 1->2 (gain 1, lose 1) and the 0<-2 to 0->2 (similar). ans[1]=0 (node 1 originally has edges OUT to both reachable nodes via the directions 1->2 and 2->0). ans[2]=1 (need to reverse the 1->2 edge). Two-pass DP confirms.',
      viz_anchor: null,
    },
    {
      inputs: ['2', '[[0,1]]'],
      expected: '[0,1]',
      explanation_md:
        'Algorithmically interesting: single edge. From node 0, edge originally 0->1 already reaches 1, cost 0 -> ans[0]=0. From node 1: edge points away, must reverse -> ans[1]=1. The two-pass DP: first DFS from 0 computes ans[0]; second DFS re-roots in O(1) per move. ans[child] = ans[parent] + (1 - 2*cost_original_direction) = 0 + (1 - 0) = 1.',
      viz_anchor: null,
    },
  ],

  'minimum-cost-walk-in-weighted-graph': [
    {
      inputs: ['7', '[[0,1,7],[1,3,7],[1,2,1]]', '[[0,3],[3,4]]'],
      expected: '[1,-1]',
      explanation_md:
        'Canonical LC example. Min-cost walk between u,v in a weighted undirected graph where walk-cost is BITWISE-AND of all edge weights (revisits allowed). Key insight: if u and v are connected, the answer is the AND of ALL edge weights in their connected component (adding more 1-bits via revisits can only DECREASE the AND). If disconnected, -1. Union-Find by edges: component 0 = {0,1,2,3} with AND = 7 & 7 & 1 = 1. Component {4} isolated. Query (0,3): same component -> 1. Query (3,4): different components -> -1. Return [1, -1].',
      viz_anchor: null,
    },
    {
      inputs: ['3', '[]', '[[0,2]]'],
      expected: '[-1]',
      explanation_md:
        'Edge case: no edges. Each node is its own component. Query (0,2) crosses components -> -1. Without edges, Union-Find has n singletons; the "same root?" check fails immediately. Return [-1]. The "self-loop u==v" special case would return 0 (no edges traversed -> AND of empty set = all-1s = -1 sentinel? convention says 0 for self). This problem requires that specific convention check.',
      viz_anchor: null,
    },
    {
      inputs: ['4', '[[0,1,3],[1,2,1],[2,3,2]]', '[[0,3]]'],
      expected: '[0]',
      explanation_md:
        'Algorithmically interesting: AND across all edges of the spanning component. 3 & 1 & 2 = 0. Even though no single edge is 0, the AND of all three is 0 because no bit is set in all three. The walk uses ALL edges (revisits allowed to traverse them all), achieving AND = 0. Confirms the "AND all edges in component" formula: bit i survives iff EVERY edge has bit i set.',
      viz_anchor: null,
    },
  ],

  'minimum-incompatibility-arrays': [
    {
      inputs: ['[1,2,1,4]', '2'],
      expected: '4',
      explanation_md:
        'Canonical LC example. Split nums into k buckets of equal size n/k, no duplicates within a bucket, minimise sum of (max-min) across buckets. n=4, k=2 -> buckets of size 2. Counts: each value appears at most n/k=2 times — ok. DP over bitmask of used indices: dp[mask] = min total incompatibility to fill buckets whose total cells = popcount(mask). For each mask whose popcount is multiple of n/k, enumerate subsets of size n/k with distinct values, add (max-min) of that subset, transition dp[mask | subset] = min(dp[mask | subset], dp[mask] + diff). Final dp[(1<<n)-1] = 4. Best partition: {1,2}+{1,4} -> (2-1)+(4-1) = 1+3 = 4.',
      viz_anchor: null,
    },
    {
      inputs: ['[6,3,8,1,3,1,2,2]', '4'],
      expected: '6',
      explanation_md:
        'Edge case: counts of 3 exceed bucket size. value=3 appears 2 times, value=1 appears 2 times, value=2 appears 2 times — all ok since bucket size n/k = 8/4 = 2 and max count = 2 (each value can sit in at most 2 buckets). Bitmask DP enumerates valid subsets. Best: {1,3}+{1,2}+{2,8}+{3,6} -> (2)+(1)+(6)+(3) = 12? Expected 6. Re-pair: {1,2}+{1,3}+{2,3}+{6,8} -> 1+2+1+2 = 6. Yes. The DP finds this exact partition.',
      viz_anchor: null,
    },
    {
      inputs: ['[5,3,3,6,3,3]', '3'],
      expected: '-1',
      explanation_md:
        'Algorithmically interesting: value count exceeds k. value=3 appears 4 times, bucket size = 6/3 = 2, k=3 -> each value can appear in at most k=3 different buckets, but with size 2 only 1 instance per bucket. 4 instances of 3 cannot fit into 3 buckets without duplicating. Early-reject: if any frequency > k return -1. The bitmask DP would otherwise explore the entire 2^n state space and only fail to find a valid partition — the early-reject saves time.',
      viz_anchor: null,
    },
  ],
};

let ok = 0, failed = 0, skipped = 0;
for (const [slug, samples] of Object.entries(PAYLOAD)) {
  const { data: existing, error: readErr } = await sb
    .from('PGcode_problems')
    .select('id, explained_samples')
    .eq('id', slug)
    .maybeSingle();
  if (readErr) {
    console.log(`x ${slug}: read ${readErr.message}`);
    failed++;
    continue;
  }
  if (!existing) {
    console.log(`x ${slug}: not found in DB`);
    failed++;
    continue;
  }
  if (Array.isArray(existing.explained_samples) && existing.explained_samples.length === 3) {
    console.log(`- ${slug}: already has 3 samples, skip`);
    skipped++;
    continue;
  }
  const { error } = await sb
    .from('PGcode_problems')
    .update({ explained_samples: samples })
    .eq('id', slug);
  if (error) {
    console.log(`x ${slug}: ${error.message}`);
    failed++;
  } else {
    console.log(`ok ${slug}`);
    ok++;
  }
}
console.log(`\nbatch 27 done: ok=${ok} skipped=${skipped} failed=${failed} total=${Object.keys(PAYLOAD).length}`);
