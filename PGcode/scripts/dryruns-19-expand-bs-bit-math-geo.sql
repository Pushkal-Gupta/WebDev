-- ═══════════════════════════════════════════════════════════════
-- Dry Runs — Batch 7: Binary Search, Bit Manipulation, Math, Geometry
-- ───────────────────────────────────────────────────────────────
-- Re-authors dry runs for 22 problems with 10-13 frames each.
-- GEOMETRY renderer: check-if-straight-line, k-closest-origin,
--   max-points-on-line, minimum-area-rectangle, rectangle-overlap, valid-square
-- ARRAY renderer: binary-search, counting-bits, find-min-rotated,
--   first-last-position, koko-bananas, median-two-sorted, missing-number-xor,
--   number-of-1-bits, power-of-three, power-of-two, reverse-bits,
--   reverse-integer, search-2d-matrix, search-rotated, sum-of-two-integers,
--   time-based-key-value
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
-- GEOMETRY PROBLEMS
-- ═══════════════════════════════════════════════════════════════


-- ── CHECK IF STRAIGHT LINE ────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'check-if-straight-line';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('check-if-straight-line', 1, 'Problem Setup', '{"type":"geometry","points":[{"x":1,"y":2,"label":"P0","state":"default"},{"x":2,"y":3,"label":"P1","state":"default"},{"x":3,"y":4,"label":"P2","state":"default"},{"x":4,"y":5,"label":"P3","state":"default"},{"x":5,"y":6,"label":"P4","state":"default"},{"x":6,"y":7,"label":"P5","state":"default"}],"lines":[],"bounds":{"minX":0,"maxX":8,"minY":0,"maxY":8},"status":"Given 6 points P0..P5. Return true iff they all lie on one straight line."}'::jsonb),
('check-if-straight-line', 2, 'Approach: Cross-Product Test', '{"type":"geometry","points":[{"x":1,"y":2,"label":"P0","state":"default"},{"x":2,"y":3,"label":"P1","state":"default"},{"x":3,"y":4,"label":"P2","state":"default"},{"x":4,"y":5,"label":"P3","state":"default"},{"x":5,"y":6,"label":"P4","state":"default"},{"x":6,"y":7,"label":"P5","state":"default"}],"lines":[],"bounds":{"minX":0,"maxX":8,"minY":0,"maxY":8},"status":"Anchor at P0 and P1. For each Pi, test dx1*(yi-y0) == dy1*(xi-x0). Avoids division."}'::jsonb),
('check-if-straight-line', 3, 'Complexity', '{"type":"geometry","points":[{"x":1,"y":2,"label":"P0","state":"default"},{"x":2,"y":3,"label":"P1","state":"default"},{"x":3,"y":4,"label":"P2","state":"default"},{"x":4,"y":5,"label":"P3","state":"default"},{"x":5,"y":6,"label":"P4","state":"default"},{"x":6,"y":7,"label":"P5","state":"default"}],"lines":[],"bounds":{"minX":0,"maxX":8,"minY":0,"maxY":8},"status":"Time O(n) — single pass through points. Space O(1) — only dx/dy constants."}'::jsonb),
('check-if-straight-line', 4, 'Anchor P0→P1', '{"type":"geometry","points":[{"x":1,"y":2,"label":"P0","state":"highlighted"},{"x":2,"y":3,"label":"P1","state":"highlighted"},{"x":3,"y":4,"label":"P2","state":"default"},{"x":4,"y":5,"label":"P3","state":"default"},{"x":5,"y":6,"label":"P4","state":"default"},{"x":6,"y":7,"label":"P5","state":"default"}],"lines":[{"x1":1,"y1":2,"x2":2,"y2":3,"state":"highlighted"}],"bounds":{"minX":0,"maxX":8,"minY":0,"maxY":8},"status":"Reference dx1 = 2-1 = 1, dy1 = 3-2 = 1. Slope ratio 1:1."}'::jsonb),
('check-if-straight-line', 5, 'Check P2(3,4)', '{"type":"geometry","points":[{"x":1,"y":2,"label":"P0","state":"highlighted"},{"x":2,"y":3,"label":"P1","state":"highlighted"},{"x":3,"y":4,"label":"P2","state":"current"},{"x":4,"y":5,"label":"P3","state":"default"},{"x":5,"y":6,"label":"P4","state":"default"},{"x":6,"y":7,"label":"P5","state":"default"}],"lines":[{"x1":1,"y1":2,"x2":3,"y2":4,"state":"current"}],"bounds":{"minX":0,"maxX":8,"minY":0,"maxY":8},"status":"dx=2, dy=2. Cross: 1*2 == 1*2 → true. P2 collinear."}'::jsonb),
('check-if-straight-line', 6, 'Check P3(4,5)', '{"type":"geometry","points":[{"x":1,"y":2,"label":"P0","state":"match"},{"x":2,"y":3,"label":"P1","state":"match"},{"x":3,"y":4,"label":"P2","state":"match"},{"x":4,"y":5,"label":"P3","state":"current"},{"x":5,"y":6,"label":"P4","state":"default"},{"x":6,"y":7,"label":"P5","state":"default"}],"lines":[{"x1":1,"y1":2,"x2":4,"y2":5,"state":"current"}],"bounds":{"minX":0,"maxX":8,"minY":0,"maxY":8},"status":"dx=3, dy=3. 1*3 == 1*3 → true. P3 collinear."}'::jsonb),
('check-if-straight-line', 7, 'Check P4(5,6)', '{"type":"geometry","points":[{"x":1,"y":2,"label":"P0","state":"match"},{"x":2,"y":3,"label":"P1","state":"match"},{"x":3,"y":4,"label":"P2","state":"match"},{"x":4,"y":5,"label":"P3","state":"match"},{"x":5,"y":6,"label":"P4","state":"current"},{"x":6,"y":7,"label":"P5","state":"default"}],"lines":[{"x1":1,"y1":2,"x2":5,"y2":6,"state":"current"}],"bounds":{"minX":0,"maxX":8,"minY":0,"maxY":8},"status":"dx=4, dy=4. 1*4 == 1*4 → true. P4 collinear."}'::jsonb),
('check-if-straight-line', 8, 'Check P5(6,7)', '{"type":"geometry","points":[{"x":1,"y":2,"label":"P0","state":"match"},{"x":2,"y":3,"label":"P1","state":"match"},{"x":3,"y":4,"label":"P2","state":"match"},{"x":4,"y":5,"label":"P3","state":"match"},{"x":5,"y":6,"label":"P4","state":"match"},{"x":6,"y":7,"label":"P5","state":"current"}],"lines":[{"x1":1,"y1":2,"x2":6,"y2":7,"state":"current"}],"bounds":{"minX":0,"maxX":8,"minY":0,"maxY":8},"status":"dx=5, dy=5. 1*5 == 1*5 → true. P5 collinear."}'::jsonb),
('check-if-straight-line', 9, 'Loop Terminates', '{"type":"geometry","points":[{"x":1,"y":2,"label":"P0","state":"match"},{"x":2,"y":3,"label":"P1","state":"match"},{"x":3,"y":4,"label":"P2","state":"match"},{"x":4,"y":5,"label":"P3","state":"match"},{"x":5,"y":6,"label":"P4","state":"match"},{"x":6,"y":7,"label":"P5","state":"match"}],"lines":[{"x1":1,"y1":2,"x2":6,"y2":7,"state":"match"}],"bounds":{"minX":0,"maxX":8,"minY":0,"maxY":8},"status":"All points passed the cross-product check — no rejection encountered."}'::jsonb),
('check-if-straight-line', 10, 'Result: true', '{"type":"geometry","points":[{"x":1,"y":2,"label":"P0","state":"match"},{"x":2,"y":3,"label":"P1","state":"match"},{"x":3,"y":4,"label":"P2","state":"match"},{"x":4,"y":5,"label":"P3","state":"match"},{"x":5,"y":6,"label":"P4","state":"match"},{"x":6,"y":7,"label":"P5","state":"match"}],"lines":[{"x1":1,"y1":2,"x2":6,"y2":7,"state":"match"}],"bounds":{"minX":0,"maxX":8,"minY":0,"maxY":8},"status":"Return true. Time O(n), Space O(1)."}'::jsonb);


-- ── K CLOSEST ORIGIN ──────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'k-closest-origin';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('k-closest-origin', 1, 'Problem Setup', '{"type":"geometry","points":[{"x":0,"y":0,"label":"O","state":"highlighted"},{"x":1,"y":3,"label":"A","state":"default"},{"x":-2,"y":2,"label":"B","state":"default"},{"x":5,"y":6,"label":"C","state":"default"},{"x":0,"y":1,"label":"D","state":"default"},{"x":-2,"y":4,"label":"E","state":"default"}],"lines":[],"bounds":{"minX":-4,"maxX":7,"minY":-1,"maxY":8},"status":"Given 5 points A..E and origin O. Return the k=2 points closest to O by Euclidean distance."}'::jsonb),
('k-closest-origin', 2, 'Approach: Max-Heap of Size k', '{"type":"geometry","points":[{"x":0,"y":0,"label":"O","state":"highlighted"},{"x":1,"y":3,"label":"A","state":"default"},{"x":-2,"y":2,"label":"B","state":"default"},{"x":5,"y":6,"label":"C","state":"default"},{"x":0,"y":1,"label":"D","state":"default"},{"x":-2,"y":4,"label":"E","state":"default"}],"lines":[],"bounds":{"minX":-4,"maxX":7,"minY":-1,"maxY":8},"status":"Use a max-heap keyed by squared distance x²+y². If new point < heap top, pop and push."}'::jsonb),
('k-closest-origin', 3, 'Complexity', '{"type":"geometry","points":[{"x":0,"y":0,"label":"O","state":"highlighted"},{"x":1,"y":3,"label":"A","state":"default"},{"x":-2,"y":2,"label":"B","state":"default"},{"x":5,"y":6,"label":"C","state":"default"},{"x":0,"y":1,"label":"D","state":"default"},{"x":-2,"y":4,"label":"E","state":"default"}],"lines":[],"bounds":{"minX":-4,"maxX":7,"minY":-1,"maxY":8},"status":"Time O(n log k). Space O(k) for the heap."}'::jsonb),
('k-closest-origin', 4, 'Initialize: empty heap', '{"type":"geometry","points":[{"x":0,"y":0,"label":"O","state":"highlighted"},{"x":1,"y":3,"label":"A","state":"default"},{"x":-2,"y":2,"label":"B","state":"default"},{"x":5,"y":6,"label":"C","state":"default"},{"x":0,"y":1,"label":"D","state":"default"},{"x":-2,"y":4,"label":"E","state":"default"}],"lines":[],"bounds":{"minX":-4,"maxX":7,"minY":-1,"maxY":8},"status":"heap = []. Iterate points in order A,B,C,D,E."}'::jsonb),
('k-closest-origin', 5, 'Measure A(1,3)', '{"type":"geometry","points":[{"x":0,"y":0,"label":"O","state":"highlighted"},{"x":1,"y":3,"label":"A","state":"current"},{"x":-2,"y":2,"label":"B","state":"default"},{"x":5,"y":6,"label":"C","state":"default"},{"x":0,"y":1,"label":"D","state":"default"},{"x":-2,"y":4,"label":"E","state":"default"}],"lines":[{"x1":0,"y1":0,"x2":1,"y2":3,"state":"highlighted"}],"bounds":{"minX":-4,"maxX":7,"minY":-1,"maxY":8},"status":"d²(A) = 1+9 = 10. Heap size 0 < 2 → push A. heap = [A:10]."}'::jsonb),
('k-closest-origin', 6, 'Measure B(-2,2)', '{"type":"geometry","points":[{"x":0,"y":0,"label":"O","state":"highlighted"},{"x":1,"y":3,"label":"A","state":"highlighted"},{"x":-2,"y":2,"label":"B","state":"current"},{"x":5,"y":6,"label":"C","state":"default"},{"x":0,"y":1,"label":"D","state":"default"},{"x":-2,"y":4,"label":"E","state":"default"}],"lines":[{"x1":0,"y1":0,"x2":1,"y2":3,"state":"highlighted"},{"x1":0,"y1":0,"x2":-2,"y2":2,"state":"current"}],"bounds":{"minX":-4,"maxX":7,"minY":-1,"maxY":8},"status":"d²(B) = 4+4 = 8. Heap has room → push. heap = [A:10, B:8]. Top = A(10)."}'::jsonb),
('k-closest-origin', 7, 'Measure C(5,6) — reject', '{"type":"geometry","points":[{"x":0,"y":0,"label":"O","state":"highlighted"},{"x":1,"y":3,"label":"A","state":"highlighted"},{"x":-2,"y":2,"label":"B","state":"highlighted"},{"x":5,"y":6,"label":"C","state":"reject"},{"x":0,"y":1,"label":"D","state":"default"},{"x":-2,"y":4,"label":"E","state":"default"}],"lines":[{"x1":0,"y1":0,"x2":1,"y2":3,"state":"highlighted"},{"x1":0,"y1":0,"x2":-2,"y2":2,"state":"highlighted"},{"x1":0,"y1":0,"x2":5,"y2":6,"state":"reject"}],"bounds":{"minX":-4,"maxX":7,"minY":-1,"maxY":8},"status":"d²(C) = 25+36 = 61. 61 > heap top 10 → discard C."}'::jsonb),
('k-closest-origin', 8, 'Measure D(0,1) — swap in', '{"type":"geometry","points":[{"x":0,"y":0,"label":"O","state":"highlighted"},{"x":1,"y":3,"label":"A","state":"reject"},{"x":-2,"y":2,"label":"B","state":"highlighted"},{"x":5,"y":6,"label":"C","state":"reject"},{"x":0,"y":1,"label":"D","state":"current"},{"x":-2,"y":4,"label":"E","state":"default"}],"lines":[{"x1":0,"y1":0,"x2":-2,"y2":2,"state":"highlighted"},{"x1":0,"y1":0,"x2":0,"y2":1,"state":"current"}],"bounds":{"minX":-4,"maxX":7,"minY":-1,"maxY":8},"status":"d²(D) = 0+1 = 1. 1 < 10 → pop A, push D. heap = [B:8, D:1]. Top = B(8)."}'::jsonb),
('k-closest-origin', 9, 'Measure E(-2,4) — reject', '{"type":"geometry","points":[{"x":0,"y":0,"label":"O","state":"highlighted"},{"x":1,"y":3,"label":"A","state":"reject"},{"x":-2,"y":2,"label":"B","state":"highlighted"},{"x":5,"y":6,"label":"C","state":"reject"},{"x":0,"y":1,"label":"D","state":"highlighted"},{"x":-2,"y":4,"label":"E","state":"reject"}],"lines":[{"x1":0,"y1":0,"x2":-2,"y2":2,"state":"highlighted"},{"x1":0,"y1":0,"x2":0,"y2":1,"state":"highlighted"},{"x1":0,"y1":0,"x2":-2,"y2":4,"state":"reject"}],"bounds":{"minX":-4,"maxX":7,"minY":-1,"maxY":8},"status":"d²(E) = 4+16 = 20. 20 > 8 → discard E."}'::jsonb),
('k-closest-origin', 10, 'Termination', '{"type":"geometry","points":[{"x":0,"y":0,"label":"O","state":"highlighted"},{"x":1,"y":3,"label":"A","state":"reject"},{"x":-2,"y":2,"label":"B","state":"match"},{"x":5,"y":6,"label":"C","state":"reject"},{"x":0,"y":1,"label":"D","state":"match"},{"x":-2,"y":4,"label":"E","state":"reject"}],"lines":[{"x1":0,"y1":0,"x2":-2,"y2":2,"state":"match"},{"x1":0,"y1":0,"x2":0,"y2":1,"state":"match"}],"bounds":{"minX":-4,"maxX":7,"minY":-1,"maxY":8},"status":"Loop ends. Heap holds the 2 closest: B(8) and D(1)."}'::jsonb),
('k-closest-origin', 11, 'Result', '{"type":"geometry","points":[{"x":0,"y":0,"label":"O","state":"highlighted"},{"x":1,"y":3,"label":"A","state":"reject"},{"x":-2,"y":2,"label":"B","state":"match"},{"x":5,"y":6,"label":"C","state":"reject"},{"x":0,"y":1,"label":"D","state":"match"},{"x":-2,"y":4,"label":"E","state":"reject"}],"lines":[{"x1":0,"y1":0,"x2":-2,"y2":2,"state":"match"},{"x1":0,"y1":0,"x2":0,"y2":1,"state":"match"}],"bounds":{"minX":-4,"maxX":7,"minY":-1,"maxY":8},"status":"Return [D, B]. Time O(n log k). Space O(k)."}'::jsonb);


-- ── MAX POINTS ON LINE ────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'max-points-on-line';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('max-points-on-line', 1, 'Problem Setup', '{"type":"geometry","points":[{"x":1,"y":1,"label":"A","state":"default"},{"x":2,"y":2,"label":"B","state":"default"},{"x":3,"y":3,"label":"C","state":"default"},{"x":1,"y":3,"label":"D","state":"default"},{"x":4,"y":1,"label":"E","state":"default"}],"lines":[],"bounds":{"minX":0,"maxX":6,"minY":0,"maxY":5},"status":"Given 5 points. Return the maximum number of points that lie on the same straight line."}'::jsonb),
('max-points-on-line', 2, 'Approach: Slope Hash per Anchor', '{"type":"geometry","points":[{"x":1,"y":1,"label":"A","state":"default"},{"x":2,"y":2,"label":"B","state":"default"},{"x":3,"y":3,"label":"C","state":"default"},{"x":1,"y":3,"label":"D","state":"default"},{"x":4,"y":1,"label":"E","state":"default"}],"lines":[],"bounds":{"minX":0,"maxX":6,"minY":0,"maxY":5},"status":"For each anchor Pi, hash (reduced dx,dy) from Pi to every Pj. Max bucket count + 1 is the best line through Pi."}'::jsonb),
('max-points-on-line', 3, 'Complexity', '{"type":"geometry","points":[{"x":1,"y":1,"label":"A","state":"default"},{"x":2,"y":2,"label":"B","state":"default"},{"x":3,"y":3,"label":"C","state":"default"},{"x":1,"y":3,"label":"D","state":"default"},{"x":4,"y":1,"label":"E","state":"default"}],"lines":[],"bounds":{"minX":0,"maxX":6,"minY":0,"maxY":5},"status":"Time O(n²). Space O(n) per anchor for the slope map."}'::jsonb),
('max-points-on-line', 4, 'Anchor A(1,1) — test B', '{"type":"geometry","points":[{"x":1,"y":1,"label":"A","state":"highlighted"},{"x":2,"y":2,"label":"B","state":"current"},{"x":3,"y":3,"label":"C","state":"default"},{"x":1,"y":3,"label":"D","state":"default"},{"x":4,"y":1,"label":"E","state":"default"}],"lines":[{"x1":1,"y1":1,"x2":2,"y2":2,"state":"current"}],"bounds":{"minX":0,"maxX":6,"minY":0,"maxY":5},"status":"Slope A→B = (1,1). map[(1,1)] = 1."}'::jsonb),
('max-points-on-line', 5, 'Anchor A — test C', '{"type":"geometry","points":[{"x":1,"y":1,"label":"A","state":"highlighted"},{"x":2,"y":2,"label":"B","state":"match"},{"x":3,"y":3,"label":"C","state":"current"},{"x":1,"y":3,"label":"D","state":"default"},{"x":4,"y":1,"label":"E","state":"default"}],"lines":[{"x1":1,"y1":1,"x2":3,"y2":3,"state":"current"}],"bounds":{"minX":0,"maxX":6,"minY":0,"maxY":5},"status":"Slope A→C = (2,2) reduces to (1,1). map[(1,1)] = 2. A,B,C colinear."}'::jsonb),
('max-points-on-line', 6, 'Anchor A — test D', '{"type":"geometry","points":[{"x":1,"y":1,"label":"A","state":"highlighted"},{"x":2,"y":2,"label":"B","state":"match"},{"x":3,"y":3,"label":"C","state":"match"},{"x":1,"y":3,"label":"D","state":"current"},{"x":4,"y":1,"label":"E","state":"default"}],"lines":[{"x1":1,"y1":1,"x2":1,"y2":3,"state":"current"}],"bounds":{"minX":0,"maxX":6,"minY":0,"maxY":5},"status":"Slope A→D = (0,2) reduces to (0,1). map[(0,1)] = 1."}'::jsonb),
('max-points-on-line', 7, 'Anchor A — test E', '{"type":"geometry","points":[{"x":1,"y":1,"label":"A","state":"highlighted"},{"x":2,"y":2,"label":"B","state":"match"},{"x":3,"y":3,"label":"C","state":"match"},{"x":1,"y":3,"label":"D","state":"highlighted"},{"x":4,"y":1,"label":"E","state":"current"}],"lines":[{"x1":1,"y1":1,"x2":4,"y2":1,"state":"current"}],"bounds":{"minX":0,"maxX":6,"minY":0,"maxY":5},"status":"Slope A→E = (3,0) reduces to (1,0). map[(1,0)] = 1."}'::jsonb),
('max-points-on-line', 8, 'Anchor A done: best=3', '{"type":"geometry","points":[{"x":1,"y":1,"label":"A","state":"match"},{"x":2,"y":2,"label":"B","state":"match"},{"x":3,"y":3,"label":"C","state":"match"},{"x":1,"y":3,"label":"D","state":"highlighted"},{"x":4,"y":1,"label":"E","state":"highlighted"}],"lines":[{"x1":1,"y1":1,"x2":3,"y2":3,"state":"match"}],"bounds":{"minX":0,"maxX":6,"minY":0,"maxY":5},"status":"Max bucket for A is (1,1)=2, so best line through A has 2+1 = 3 points (A,B,C)."}'::jsonb),
('max-points-on-line', 9, 'Anchor B — test C', '{"type":"geometry","points":[{"x":1,"y":1,"label":"A","state":"default"},{"x":2,"y":2,"label":"B","state":"highlighted"},{"x":3,"y":3,"label":"C","state":"current"},{"x":1,"y":3,"label":"D","state":"default"},{"x":4,"y":1,"label":"E","state":"default"}],"lines":[{"x1":2,"y1":2,"x2":3,"y2":3,"state":"current"}],"bounds":{"minX":0,"maxX":6,"minY":0,"maxY":5},"status":"New anchor B. Slope B→C = (1,1). map[(1,1)] = 1."}'::jsonb),
('max-points-on-line', 10, 'Anchor B — still 3 via A', '{"type":"geometry","points":[{"x":1,"y":1,"label":"A","state":"match"},{"x":2,"y":2,"label":"B","state":"highlighted"},{"x":3,"y":3,"label":"C","state":"match"},{"x":1,"y":3,"label":"D","state":"default"},{"x":4,"y":1,"label":"E","state":"default"}],"lines":[{"x1":1,"y1":1,"x2":3,"y2":3,"state":"match"}],"bounds":{"minX":0,"maxX":6,"minY":0,"maxY":5},"status":"Slope B→A = (-1,-1) same bucket as (1,1). map[(1,1)] = 2 → best through B = 3."}'::jsonb),
('max-points-on-line', 11, 'Remaining anchors cannot beat 3', '{"type":"geometry","points":[{"x":1,"y":1,"label":"A","state":"match"},{"x":2,"y":2,"label":"B","state":"match"},{"x":3,"y":3,"label":"C","state":"match"},{"x":1,"y":3,"label":"D","state":"highlighted"},{"x":4,"y":1,"label":"E","state":"highlighted"}],"lines":[{"x1":1,"y1":1,"x2":3,"y2":3,"state":"match"}],"bounds":{"minX":0,"maxX":6,"minY":0,"maxY":5},"status":"D and E anchors each produce buckets of at most 2 → best stays at 3."}'::jsonb),
('max-points-on-line', 12, 'Result: 3', '{"type":"geometry","points":[{"x":1,"y":1,"label":"A","state":"match"},{"x":2,"y":2,"label":"B","state":"match"},{"x":3,"y":3,"label":"C","state":"match"},{"x":1,"y":3,"label":"D","state":"reject"},{"x":4,"y":1,"label":"E","state":"reject"}],"lines":[{"x1":1,"y1":1,"x2":3,"y2":3,"state":"match"}],"bounds":{"minX":0,"maxX":6,"minY":0,"maxY":5},"status":"Return 3 (A,B,C on y=x). Time O(n²), Space O(n)."}'::jsonb);


-- ── MINIMUM AREA RECTANGLE ────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'minimum-area-rectangle';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('minimum-area-rectangle', 1, 'Problem Setup', '{"type":"geometry","points":[{"x":1,"y":1,"label":"P1","state":"default"},{"x":1,"y":3,"label":"P2","state":"default"},{"x":3,"y":1,"label":"P3","state":"default"},{"x":3,"y":3,"label":"P4","state":"default"},{"x":4,"y":1,"label":"P5","state":"default"},{"x":4,"y":3,"label":"P6","state":"default"}],"lines":[],"bounds":{"minX":0,"maxX":5,"minY":0,"maxY":4},"status":"Given 6 axis-aligned points. Return the minimum area rectangle with sides parallel to axes, or 0 if none."}'::jsonb),
('minimum-area-rectangle', 2, 'Approach: Diagonal Pair + Set', '{"type":"geometry","points":[{"x":1,"y":1,"label":"P1","state":"default"},{"x":1,"y":3,"label":"P2","state":"default"},{"x":3,"y":1,"label":"P3","state":"default"},{"x":3,"y":3,"label":"P4","state":"default"},{"x":4,"y":1,"label":"P5","state":"default"},{"x":4,"y":3,"label":"P6","state":"default"}],"lines":[],"bounds":{"minX":0,"maxX":5,"minY":0,"maxY":4},"status":"For every pair (a,b) with different x and y, check if (ax,by) and (bx,ay) are in the point set. Track min area."}'::jsonb),
('minimum-area-rectangle', 3, 'Complexity', '{"type":"geometry","points":[{"x":1,"y":1,"label":"P1","state":"default"},{"x":1,"y":3,"label":"P2","state":"default"},{"x":3,"y":1,"label":"P3","state":"default"},{"x":3,"y":3,"label":"P4","state":"default"},{"x":4,"y":1,"label":"P5","state":"default"},{"x":4,"y":3,"label":"P6","state":"default"}],"lines":[],"bounds":{"minX":0,"maxX":5,"minY":0,"maxY":4},"status":"Time O(n²). Space O(n) for the hash set of points."}'::jsonb),
('minimum-area-rectangle', 4, 'Initialize', '{"type":"geometry","points":[{"x":1,"y":1,"label":"P1","state":"highlighted"},{"x":1,"y":3,"label":"P2","state":"highlighted"},{"x":3,"y":1,"label":"P3","state":"highlighted"},{"x":3,"y":3,"label":"P4","state":"highlighted"},{"x":4,"y":1,"label":"P5","state":"highlighted"},{"x":4,"y":3,"label":"P6","state":"highlighted"}],"lines":[],"bounds":{"minX":0,"maxX":5,"minY":0,"maxY":4},"status":"Build set S = {(1,1),(1,3),(3,1),(3,3),(4,1),(4,3)}. best = ∞."}'::jsonb),
('minimum-area-rectangle', 5, 'Pair P1,P4 — candidate rect', '{"type":"geometry","points":[{"x":1,"y":1,"label":"P1","state":"current"},{"x":1,"y":3,"label":"P2","state":"match"},{"x":3,"y":1,"label":"P3","state":"match"},{"x":3,"y":3,"label":"P4","state":"current"},{"x":4,"y":1,"label":"P5","state":"default"},{"x":4,"y":3,"label":"P6","state":"default"}],"lines":[],"rectangles":[{"x1":1,"y1":1,"x2":3,"y2":3,"label":"R","state":"current"}],"bounds":{"minX":0,"maxX":5,"minY":0,"maxY":4},"status":"Diagonal (1,1)-(3,3). Check (1,3) ∈ S ✓ and (3,1) ∈ S ✓. Area = 2*2 = 4. best = 4."}'::jsonb),
('minimum-area-rectangle', 6, 'Pair P1,P6 — candidate rect', '{"type":"geometry","points":[{"x":1,"y":1,"label":"P1","state":"current"},{"x":1,"y":3,"label":"P2","state":"match"},{"x":3,"y":1,"label":"P3","state":"default"},{"x":3,"y":3,"label":"P4","state":"default"},{"x":4,"y":1,"label":"P5","state":"match"},{"x":4,"y":3,"label":"P6","state":"current"}],"lines":[],"rectangles":[{"x1":1,"y1":1,"x2":4,"y2":3,"label":"R","state":"current"}],"bounds":{"minX":0,"maxX":5,"minY":0,"maxY":4},"status":"Diagonal (1,1)-(4,3). Check (1,3) ✓ and (4,1) ✓. Area = 3*2 = 6. 6 ≥ 4 → best stays 4."}'::jsonb),
('minimum-area-rectangle', 7, 'Pair P3,P6 — candidate rect', '{"type":"geometry","points":[{"x":1,"y":1,"label":"P1","state":"default"},{"x":1,"y":3,"label":"P2","state":"default"},{"x":3,"y":1,"label":"P3","state":"current"},{"x":3,"y":3,"label":"P4","state":"match"},{"x":4,"y":1,"label":"P5","state":"match"},{"x":4,"y":3,"label":"P6","state":"current"}],"lines":[],"rectangles":[{"x1":3,"y1":1,"x2":4,"y2":3,"label":"R","state":"current"}],"bounds":{"minX":0,"maxX":5,"minY":0,"maxY":4},"status":"Diagonal (3,1)-(4,3). Check (3,3) ✓ and (4,1) ✓. Area = 1*2 = 2. best = 2 (improved!)."}'::jsonb),
('minimum-area-rectangle', 8, 'Pair P1,P5 — same x? reject', '{"type":"geometry","points":[{"x":1,"y":1,"label":"P1","state":"current"},{"x":1,"y":3,"label":"P2","state":"default"},{"x":3,"y":1,"label":"P3","state":"default"},{"x":3,"y":3,"label":"P4","state":"default"},{"x":4,"y":1,"label":"P5","state":"reject"},{"x":4,"y":3,"label":"P6","state":"default"}],"lines":[],"rectangles":[],"bounds":{"minX":0,"maxX":5,"minY":0,"maxY":4},"status":"P1(1,1) and P5(4,1) share y → cannot form a diagonal. Skip."}'::jsonb),
('minimum-area-rectangle', 9, 'Pair P2,P3 — candidate', '{"type":"geometry","points":[{"x":1,"y":1,"label":"P1","state":"match"},{"x":1,"y":3,"label":"P2","state":"current"},{"x":3,"y":1,"label":"P3","state":"current"},{"x":3,"y":3,"label":"P4","state":"match"},{"x":4,"y":1,"label":"P5","state":"default"},{"x":4,"y":3,"label":"P6","state":"default"}],"lines":[],"rectangles":[{"x1":1,"y1":1,"x2":3,"y2":3,"label":"R","state":"current"}],"bounds":{"minX":0,"maxX":5,"minY":0,"maxY":4},"status":"Same rect as step 5 (area 4). Does not improve best = 2."}'::jsonb),
('minimum-area-rectangle', 10, 'All pairs exhausted', '{"type":"geometry","points":[{"x":1,"y":1,"label":"P1","state":"default"},{"x":1,"y":3,"label":"P2","state":"default"},{"x":3,"y":1,"label":"P3","state":"match"},{"x":3,"y":3,"label":"P4","state":"match"},{"x":4,"y":1,"label":"P5","state":"match"},{"x":4,"y":3,"label":"P6","state":"match"}],"lines":[],"rectangles":[{"x1":3,"y1":1,"x2":4,"y2":3,"label":"MIN","state":"match"}],"bounds":{"minX":0,"maxX":5,"minY":0,"maxY":4},"status":"Loop ends. best = 2 from rectangle P3-P4-P5-P6."}'::jsonb),
('minimum-area-rectangle', 11, 'Result: 2', '{"type":"geometry","points":[{"x":1,"y":1,"label":"P1","state":"default"},{"x":1,"y":3,"label":"P2","state":"default"},{"x":3,"y":1,"label":"P3","state":"match"},{"x":3,"y":3,"label":"P4","state":"match"},{"x":4,"y":1,"label":"P5","state":"match"},{"x":4,"y":3,"label":"P6","state":"match"}],"lines":[],"rectangles":[{"x1":3,"y1":1,"x2":4,"y2":3,"label":"MIN","state":"match"}],"bounds":{"minX":0,"maxX":5,"minY":0,"maxY":4},"status":"Return 2. Time O(n²), Space O(n)."}'::jsonb);


-- ── RECTANGLE OVERLAP ─────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'rectangle-overlap';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('rectangle-overlap', 1, 'Problem Setup', '{"type":"geometry","points":[],"lines":[],"rectangles":[{"x1":0,"y1":0,"x2":3,"y2":3,"label":"R1","state":"default"},{"x1":2,"y1":1,"x2":5,"y2":4,"label":"R2","state":"default"}],"bounds":{"minX":-1,"maxX":6,"minY":-1,"maxY":5},"status":"Given R1=[0,0,3,3] and R2=[2,1,5,4]. Return true iff their interiors overlap with positive area."}'::jsonb),
('rectangle-overlap', 2, 'Approach: Separate-Axis Test', '{"type":"geometry","points":[],"lines":[],"rectangles":[{"x1":0,"y1":0,"x2":3,"y2":3,"label":"R1","state":"default"},{"x1":2,"y1":1,"x2":5,"y2":4,"label":"R2","state":"default"}],"bounds":{"minX":-1,"maxX":6,"minY":-1,"maxY":5},"status":"Rectangles overlap iff their projections overlap on BOTH axes. Check X then Y."}'::jsonb),
('rectangle-overlap', 3, 'Complexity', '{"type":"geometry","points":[],"lines":[],"rectangles":[{"x1":0,"y1":0,"x2":3,"y2":3,"label":"R1","state":"default"},{"x1":2,"y1":1,"x2":5,"y2":4,"label":"R2","state":"default"}],"bounds":{"minX":-1,"maxX":6,"minY":-1,"maxY":5},"status":"Time O(1). Space O(1). Just four comparisons."}'::jsonb),
('rectangle-overlap', 4, 'Initialize', '{"type":"geometry","points":[{"x":0,"y":0,"label":"R1.lo","state":"highlighted"},{"x":3,"y":3,"label":"R1.hi","state":"highlighted"},{"x":2,"y":1,"label":"R2.lo","state":"highlighted"},{"x":5,"y":4,"label":"R2.hi","state":"highlighted"}],"lines":[],"rectangles":[{"x1":0,"y1":0,"x2":3,"y2":3,"label":"R1","state":"current"},{"x1":2,"y1":1,"x2":5,"y2":4,"label":"R2","state":"current"}],"bounds":{"minX":-1,"maxX":6,"minY":-1,"maxY":5},"status":"Extract corners. R1=(0,0)-(3,3). R2=(2,1)-(5,4)."}'::jsonb),
('rectangle-overlap', 5, 'Check X separation: R1.hi > R2.lo', '{"type":"geometry","points":[],"lines":[{"x1":0,"y1":-0.5,"x2":3,"y2":-0.5,"state":"highlighted"},{"x1":2,"y1":-0.8,"x2":5,"y2":-0.8,"state":"current"}],"rectangles":[{"x1":0,"y1":0,"x2":3,"y2":3,"label":"R1","state":"highlighted"},{"x1":2,"y1":1,"x2":5,"y2":4,"label":"R2","state":"highlighted"}],"bounds":{"minX":-1,"maxX":6,"minY":-1,"maxY":5},"status":"X-projection: R1 = [0,3], R2 = [2,5]. R1.x2=3 > R2.x1=2 ✓ (right edge of R1 passes left edge of R2)."}'::jsonb),
('rectangle-overlap', 6, 'Check X separation: R2.hi > R1.lo', '{"type":"geometry","points":[],"lines":[{"x1":0,"y1":-0.5,"x2":3,"y2":-0.5,"state":"highlighted"},{"x1":2,"y1":-0.8,"x2":5,"y2":-0.8,"state":"highlighted"}],"rectangles":[{"x1":0,"y1":0,"x2":3,"y2":3,"label":"R1","state":"match"},{"x1":2,"y1":1,"x2":5,"y2":4,"label":"R2","state":"match"}],"bounds":{"minX":-1,"maxX":6,"minY":-1,"maxY":5},"status":"R2.x2=5 > R1.x1=0 ✓. X-axis overlap confirmed: [2,3] is shared."}'::jsonb),
('rectangle-overlap', 7, 'Check Y separation: R1.hi > R2.lo', '{"type":"geometry","points":[],"lines":[{"x1":-0.5,"y1":0,"x2":-0.5,"y2":3,"state":"highlighted"},{"x1":-0.8,"y1":1,"x2":-0.8,"y2":4,"state":"current"}],"rectangles":[{"x1":0,"y1":0,"x2":3,"y2":3,"label":"R1","state":"highlighted"},{"x1":2,"y1":1,"x2":5,"y2":4,"label":"R2","state":"highlighted"}],"bounds":{"minX":-1,"maxX":6,"minY":-1,"maxY":5},"status":"Y-projection: R1 = [0,3], R2 = [1,4]. R1.y2=3 > R2.y1=1 ✓."}'::jsonb),
('rectangle-overlap', 8, 'Check Y separation: R2.hi > R1.lo', '{"type":"geometry","points":[],"lines":[{"x1":-0.5,"y1":0,"x2":-0.5,"y2":3,"state":"highlighted"},{"x1":-0.8,"y1":1,"x2":-0.8,"y2":4,"state":"highlighted"}],"rectangles":[{"x1":0,"y1":0,"x2":3,"y2":3,"label":"R1","state":"match"},{"x1":2,"y1":1,"x2":5,"y2":4,"label":"R2","state":"match"}],"bounds":{"minX":-1,"maxX":6,"minY":-1,"maxY":5},"status":"R2.y2=4 > R1.y1=0 ✓. Y-axis overlap confirmed: [1,3] is shared."}'::jsonb),
('rectangle-overlap', 9, 'Intersection region', '{"type":"geometry","points":[],"lines":[],"rectangles":[{"x1":0,"y1":0,"x2":3,"y2":3,"label":"R1","state":"highlighted"},{"x1":2,"y1":1,"x2":5,"y2":4,"label":"R2","state":"highlighted"},{"x1":2,"y1":1,"x2":3,"y2":3,"label":"∩","state":"match"}],"bounds":{"minX":-1,"maxX":6,"minY":-1,"maxY":5},"status":"Intersection = [2,1]-(3,3), area = 1*2 = 2 > 0."}'::jsonb),
('rectangle-overlap', 10, 'Result: true', '{"type":"geometry","points":[],"lines":[],"rectangles":[{"x1":0,"y1":0,"x2":3,"y2":3,"label":"R1","state":"match"},{"x1":2,"y1":1,"x2":5,"y2":4,"label":"R2","state":"match"},{"x1":2,"y1":1,"x2":3,"y2":3,"label":"∩","state":"match"}],"bounds":{"minX":-1,"maxX":6,"minY":-1,"maxY":5},"status":"Both axes overlap → return true. Time O(1), Space O(1)."}'::jsonb);


-- ── VALID SQUARE ──────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'valid-square';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('valid-square', 1, 'Problem Setup', '{"type":"geometry","points":[{"x":0,"y":0,"label":"A","state":"default"},{"x":2,"y":0,"label":"B","state":"default"},{"x":0,"y":2,"label":"C","state":"default"},{"x":2,"y":2,"label":"D","state":"default"}],"lines":[],"bounds":{"minX":-1,"maxX":3,"minY":-1,"maxY":3},"status":"Given 4 points A,B,C,D. Return true iff they form a square (equal sides, equal diagonals, non-degenerate)."}'::jsonb),
('valid-square', 2, 'Approach: 6 Pairwise Distances', '{"type":"geometry","points":[{"x":0,"y":0,"label":"A","state":"default"},{"x":2,"y":0,"label":"B","state":"default"},{"x":0,"y":2,"label":"C","state":"default"},{"x":2,"y":2,"label":"D","state":"default"}],"lines":[],"bounds":{"minX":-1,"maxX":3,"minY":-1,"maxY":3},"status":"Compute all 6 squared distances. A square has exactly 2 distinct values: 4 sides (small) + 2 diagonals (= 2*small)."}'::jsonb),
('valid-square', 3, 'Complexity', '{"type":"geometry","points":[{"x":0,"y":0,"label":"A","state":"default"},{"x":2,"y":0,"label":"B","state":"default"},{"x":0,"y":2,"label":"C","state":"default"},{"x":2,"y":2,"label":"D","state":"default"}],"lines":[],"bounds":{"minX":-1,"maxX":3,"minY":-1,"maxY":3},"status":"Time O(1) — fixed 6 distance computations. Space O(1)."}'::jsonb),
('valid-square', 4, 'Edge A-B', '{"type":"geometry","points":[{"x":0,"y":0,"label":"A","state":"current"},{"x":2,"y":0,"label":"B","state":"current"},{"x":0,"y":2,"label":"C","state":"default"},{"x":2,"y":2,"label":"D","state":"default"}],"lines":[{"x1":0,"y1":0,"x2":2,"y2":0,"state":"current"}],"bounds":{"minX":-1,"maxX":3,"minY":-1,"maxY":3},"status":"d²(A,B) = 4 + 0 = 4."}'::jsonb),
('valid-square', 5, 'Edge A-C', '{"type":"geometry","points":[{"x":0,"y":0,"label":"A","state":"current"},{"x":2,"y":0,"label":"B","state":"highlighted"},{"x":0,"y":2,"label":"C","state":"current"},{"x":2,"y":2,"label":"D","state":"default"}],"lines":[{"x1":0,"y1":0,"x2":2,"y2":0,"state":"highlighted"},{"x1":0,"y1":0,"x2":0,"y2":2,"state":"current"}],"bounds":{"minX":-1,"maxX":3,"minY":-1,"maxY":3},"status":"d²(A,C) = 0 + 4 = 4. Matches d²(A,B)."}'::jsonb),
('valid-square', 6, 'Diagonal A-D', '{"type":"geometry","points":[{"x":0,"y":0,"label":"A","state":"current"},{"x":2,"y":0,"label":"B","state":"highlighted"},{"x":0,"y":2,"label":"C","state":"highlighted"},{"x":2,"y":2,"label":"D","state":"current"}],"lines":[{"x1":0,"y1":0,"x2":2,"y2":0,"state":"highlighted"},{"x1":0,"y1":0,"x2":0,"y2":2,"state":"highlighted"},{"x1":0,"y1":0,"x2":2,"y2":2,"state":"current"}],"bounds":{"minX":-1,"maxX":3,"minY":-1,"maxY":3},"status":"d²(A,D) = 4 + 4 = 8. This is the diagonal length: 2 * 4 ✓."}'::jsonb),
('valid-square', 7, 'Edge B-D', '{"type":"geometry","points":[{"x":0,"y":0,"label":"A","state":"highlighted"},{"x":2,"y":0,"label":"B","state":"current"},{"x":0,"y":2,"label":"C","state":"highlighted"},{"x":2,"y":2,"label":"D","state":"current"}],"lines":[{"x1":0,"y1":0,"x2":2,"y2":0,"state":"highlighted"},{"x1":0,"y1":0,"x2":0,"y2":2,"state":"highlighted"},{"x1":0,"y1":0,"x2":2,"y2":2,"state":"highlighted"},{"x1":2,"y1":0,"x2":2,"y2":2,"state":"current"}],"bounds":{"minX":-1,"maxX":3,"minY":-1,"maxY":3},"status":"d²(B,D) = 0 + 4 = 4. Another side."}'::jsonb),
('valid-square', 8, 'Diagonal B-C', '{"type":"geometry","points":[{"x":0,"y":0,"label":"A","state":"highlighted"},{"x":2,"y":0,"label":"B","state":"current"},{"x":0,"y":2,"label":"C","state":"current"},{"x":2,"y":2,"label":"D","state":"highlighted"}],"lines":[{"x1":0,"y1":0,"x2":2,"y2":0,"state":"highlighted"},{"x1":0,"y1":0,"x2":0,"y2":2,"state":"highlighted"},{"x1":0,"y1":0,"x2":2,"y2":2,"state":"highlighted"},{"x1":2,"y1":0,"x2":2,"y2":2,"state":"highlighted"},{"x1":2,"y1":0,"x2":0,"y2":2,"state":"current"}],"bounds":{"minX":-1,"maxX":3,"minY":-1,"maxY":3},"status":"d²(B,C) = 4 + 4 = 8. Second diagonal, matches A-D."}'::jsonb),
('valid-square', 9, 'Edge C-D', '{"type":"geometry","points":[{"x":0,"y":0,"label":"A","state":"highlighted"},{"x":2,"y":0,"label":"B","state":"highlighted"},{"x":0,"y":2,"label":"C","state":"current"},{"x":2,"y":2,"label":"D","state":"current"}],"lines":[{"x1":0,"y1":0,"x2":2,"y2":0,"state":"highlighted"},{"x1":0,"y1":0,"x2":0,"y2":2,"state":"highlighted"},{"x1":0,"y1":0,"x2":2,"y2":2,"state":"highlighted"},{"x1":2,"y1":0,"x2":2,"y2":2,"state":"highlighted"},{"x1":2,"y1":0,"x2":0,"y2":2,"state":"highlighted"},{"x1":0,"y1":2,"x2":2,"y2":2,"state":"current"}],"bounds":{"minX":-1,"maxX":3,"minY":-1,"maxY":3},"status":"d²(C,D) = 4 + 0 = 4. Sixth and final distance."}'::jsonb),
('valid-square', 10, 'Tally distances', '{"type":"geometry","points":[{"x":0,"y":0,"label":"A","state":"highlighted"},{"x":2,"y":0,"label":"B","state":"highlighted"},{"x":0,"y":2,"label":"C","state":"highlighted"},{"x":2,"y":2,"label":"D","state":"highlighted"}],"lines":[],"bounds":{"minX":-1,"maxX":3,"minY":-1,"maxY":3},"status":"Multiset = {4,4,4,4,8,8}. Two distinct values; count 4 and 2; small ≠ 0; 8 == 2*4 ✓."}'::jsonb),
('valid-square', 11, 'Validate non-degenerate', '{"type":"geometry","points":[{"x":0,"y":0,"label":"A","state":"match"},{"x":2,"y":0,"label":"B","state":"match"},{"x":0,"y":2,"label":"C","state":"match"},{"x":2,"y":2,"label":"D","state":"match"}],"lines":[{"x1":0,"y1":0,"x2":2,"y2":0,"state":"match"},{"x1":2,"y1":0,"x2":2,"y2":2,"state":"match"},{"x1":2,"y1":2,"x2":0,"y2":2,"state":"match"},{"x1":0,"y1":2,"x2":0,"y2":0,"state":"match"}],"bounds":{"minX":-1,"maxX":3,"minY":-1,"maxY":3},"status":"small = 4 > 0 → all points distinct. Geometry is a valid square."}'::jsonb),
('valid-square', 12, 'Result: true', '{"type":"geometry","points":[{"x":0,"y":0,"label":"A","state":"match"},{"x":2,"y":0,"label":"B","state":"match"},{"x":0,"y":2,"label":"C","state":"match"},{"x":2,"y":2,"label":"D","state":"match"}],"lines":[{"x1":0,"y1":0,"x2":2,"y2":0,"state":"match"},{"x1":2,"y1":0,"x2":2,"y2":2,"state":"match"},{"x1":2,"y1":2,"x2":0,"y2":2,"state":"match"},{"x1":0,"y1":2,"x2":0,"y2":0,"state":"match"}],"bounds":{"minX":-1,"maxX":3,"minY":-1,"maxY":3},"status":"Return true. Time O(1), Space O(1)."}'::jsonb);


-- ═══════════════════════════════════════════════════════════════
-- BINARY SEARCH PROBLEMS (ARRAY)
-- ═══════════════════════════════════════════════════════════════


-- ── BINARY SEARCH ─────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'binary-search';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('binary-search', 1, 'Problem Setup', '{"type":"array","array":[-1,0,3,5,9,12],"highlights":[],"pointers":{},"status":"Given a sorted array nums and target = 9. Return index of target or -1."}'::jsonb),
('binary-search', 2, 'Approach', '{"type":"array","array":[-1,0,3,5,9,12],"highlights":[],"pointers":{},"status":"Halve the search range each step by comparing nums[mid] to target."}'::jsonb),
('binary-search', 3, 'Complexity', '{"type":"array","array":[-1,0,3,5,9,12],"highlights":[],"pointers":{},"status":"Time O(log n). Space O(1)."}'::jsonb),
('binary-search', 4, 'Initialize: lo=0, hi=5', '{"type":"array","array":[-1,0,3,5,9,12],"highlights":[],"pointers":{"lo":0,"hi":5},"status":"Set lo = 0, hi = n-1 = 5. Loop while lo ≤ hi."}'::jsonb),
('binary-search', 5, 'Iter 1: mid=2', '{"type":"array","array":[-1,0,3,5,9,12],"highlights":[2],"pointers":{"lo":0,"mid":2,"hi":5},"status":"mid = (0+5)/2 = 2. nums[2] = 3."}'::jsonb),
('binary-search', 6, 'Iter 1: 3 < 9 → move lo', '{"type":"array","array":[-1,0,3,5,9,12],"highlights":[2],"pointers":{"lo":0,"mid":2,"hi":5},"status":"3 < target. Target must be to the right. lo = mid + 1 = 3."}'::jsonb),
('binary-search', 7, 'Iter 2: mid=4', '{"type":"array","array":[-1,0,3,5,9,12],"highlights":[4],"pointers":{"lo":3,"mid":4,"hi":5},"status":"mid = (3+5)/2 = 4. nums[4] = 9."}'::jsonb),
('binary-search', 8, 'Iter 2: 9 == 9 → match', '{"type":"array","array":[-1,0,3,5,9,12],"highlights":[4],"pointers":{"lo":3,"mid":4,"hi":5},"status":"nums[mid] equals target. Return mid = 4."}'::jsonb),
('binary-search', 9, 'Counter-example walkthrough', '{"type":"array","array":[-1,0,3,5,9,12],"highlights":[],"pointers":{},"status":"If target were 2: after mid=2 (3>2), hi=1; then mid=0 (−1<2), lo=1; then mid=1 (0<2), lo=2 > hi=1 → exit, return -1."}'::jsonb),
('binary-search', 10, 'Termination rule', '{"type":"array","array":[-1,0,3,5,9,12],"highlights":[4],"pointers":{"lo":3,"hi":5},"status":"Either nums[mid] matches (return mid) or lo crosses hi (return -1)."}'::jsonb),
('binary-search', 11, 'Result: 4', '{"type":"array","array":[-1,0,3,5,9,12],"highlights":[4],"pointers":{},"status":"Return 4. Time O(log n), Space O(1)."}'::jsonb);


-- ── FIND MIN IN ROTATED SORTED ARRAY ──────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'find-min-rotated';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('find-min-rotated', 1, 'Problem Setup', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[],"pointers":{},"status":"Given rotated sorted array [4,5,6,7,0,1,2]. Return the minimum element."}'::jsonb),
('find-min-rotated', 2, 'Approach', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[],"pointers":{},"status":"Binary search: if nums[mid] > nums[hi] the minimum is to the right; else it is at mid or left."}'::jsonb),
('find-min-rotated', 3, 'Complexity', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[],"pointers":{},"status":"Time O(log n). Space O(1)."}'::jsonb),
('find-min-rotated', 4, 'Initialize: lo=0, hi=6', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[],"pointers":{"lo":0,"hi":6},"status":"lo = 0, hi = 6. Loop while lo < hi."}'::jsonb),
('find-min-rotated', 5, 'Iter 1: mid=3', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[3,6],"pointers":{"lo":0,"mid":3,"hi":6},"status":"mid = 3, nums[mid] = 7, nums[hi] = 2."}'::jsonb),
('find-min-rotated', 6, 'Iter 1: 7 > 2 → min on right', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[3],"pointers":{"lo":0,"mid":3,"hi":6},"status":"Because nums[mid] > nums[hi], the rotation point lies after mid. lo = mid + 1 = 4."}'::jsonb),
('find-min-rotated', 7, 'Iter 2: mid=5', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[5,6],"pointers":{"lo":4,"mid":5,"hi":6},"status":"mid = (4+6)/2 = 5. nums[mid] = 1, nums[hi] = 2."}'::jsonb),
('find-min-rotated', 8, 'Iter 2: 1 ≤ 2 → min on left', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[5],"pointers":{"lo":4,"mid":5,"hi":5},"status":"nums[mid] ≤ nums[hi] → min is at mid or earlier. hi = mid = 5."}'::jsonb),
('find-min-rotated', 9, 'Iter 3: mid=4', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[4,5],"pointers":{"lo":4,"mid":4,"hi":5},"status":"mid = 4. nums[mid] = 0, nums[hi] = 1. 0 ≤ 1 → hi = 4."}'::jsonb),
('find-min-rotated', 10, 'Termination: lo == hi', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[4],"pointers":{"lo":4,"hi":4},"status":"lo == hi == 4. Loop exits."}'::jsonb),
('find-min-rotated', 11, 'Result: 0', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[4],"pointers":{"lo":4,"hi":4},"status":"Return nums[lo] = 0. Time O(log n), Space O(1)."}'::jsonb);


-- ── FIRST AND LAST POSITION ───────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'first-last-position';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('first-last-position', 1, 'Problem Setup', '{"type":"array","array":[5,7,7,8,8,10],"highlights":[],"pointers":{},"status":"Sorted nums, target = 8. Return [first, last] indices of target, or [-1,-1]."}'::jsonb),
('first-last-position', 2, 'Approach', '{"type":"array","array":[5,7,7,8,8,10],"highlights":[],"pointers":{},"status":"Two binary searches: one biased left (leftmost), one biased right (rightmost)."}'::jsonb),
('first-last-position', 3, 'Complexity', '{"type":"array","array":[5,7,7,8,8,10],"highlights":[],"pointers":{},"status":"Time O(log n). Space O(1)."}'::jsonb),
('first-last-position', 4, 'Find first: init lo=0, hi=5', '{"type":"array","array":[5,7,7,8,8,10],"highlights":[],"pointers":{"lo":0,"hi":5},"status":"Search for leftmost 8."}'::jsonb),
('first-last-position', 5, 'First: mid=2 → 7 < 8', '{"type":"array","array":[5,7,7,8,8,10],"highlights":[2],"pointers":{"lo":0,"mid":2,"hi":5},"status":"nums[2] = 7 < 8 → lo = 3."}'::jsonb),
('first-last-position', 6, 'First: mid=4 → 8, bias left', '{"type":"array","array":[5,7,7,8,8,10],"highlights":[4],"pointers":{"lo":3,"mid":4,"hi":5},"status":"nums[4] = 8. Record ans=4; shrink right: hi = mid-1 = 3 to find earlier 8."}'::jsonb),
('first-last-position', 7, 'First: mid=3 → 8, record', '{"type":"array","array":[5,7,7,8,8,10],"highlights":[3],"pointers":{"lo":3,"mid":3,"hi":3},"status":"nums[3] = 8. ans = 3. hi = 2 → exit. First index = 3."}'::jsonb),
('first-last-position', 8, 'Find last: init lo=0, hi=5', '{"type":"array","array":[5,7,7,8,8,10],"highlights":[],"pointers":{"lo":0,"hi":5},"status":"Search for rightmost 8."}'::jsonb),
('first-last-position', 9, 'Last: mid=2 → 7 < 8', '{"type":"array","array":[5,7,7,8,8,10],"highlights":[2],"pointers":{"lo":0,"mid":2,"hi":5},"status":"nums[2] = 7 < 8 → lo = 3."}'::jsonb),
('first-last-position', 10, 'Last: mid=4 → 8, bias right', '{"type":"array","array":[5,7,7,8,8,10],"highlights":[4],"pointers":{"lo":3,"mid":4,"hi":5},"status":"nums[4] = 8. ans = 4; lo = mid+1 = 5 to look right."}'::jsonb),
('first-last-position', 11, 'Last: mid=5 → 10, shrink right', '{"type":"array","array":[5,7,7,8,8,10],"highlights":[5],"pointers":{"lo":5,"mid":5,"hi":5},"status":"nums[5] = 10 > 8 → hi = 4 → exit. Last index = 4."}'::jsonb),
('first-last-position', 12, 'Result: [3,4]', '{"type":"array","array":[5,7,7,8,8,10],"highlights":[3,4],"pointers":{},"status":"Return [3,4]. Time O(log n), Space O(1)."}'::jsonb);


-- ── KOKO BANANAS ──────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'koko-bananas';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('koko-bananas', 1, 'Problem Setup', '{"type":"array","array":[3,6,7,11],"highlights":[],"pointers":{},"status":"Piles = [3,6,7,11], h = 8 hours. Find min eating speed k such that total hours ≤ h."}'::jsonb),
('koko-bananas', 2, 'Approach', '{"type":"array","array":[3,6,7,11],"highlights":[],"pointers":{},"status":"Binary search k in [1, max(piles)]. For each k compute sum of ceil(pile/k) and compare to h."}'::jsonb),
('koko-bananas', 3, 'Complexity', '{"type":"array","array":[3,6,7,11],"highlights":[],"pointers":{},"status":"Time O(n log M) where M = max(piles). Space O(1)."}'::jsonb),
('koko-bananas', 4, 'Initialize: lo=1, hi=11', '{"type":"array","array":[3,6,7,11],"highlights":[],"pointers":{"lo":1,"hi":11},"status":"lo = 1, hi = max = 11."}'::jsonb),
('koko-bananas', 5, 'k=6 (mid): hours', '{"type":"array","array":[3,6,7,11],"highlights":[0,1,2,3],"pointers":{"lo":1,"mid":6,"hi":11},"status":"k=6 → ceil: 1+1+2+2 = 6 ≤ 8 ✓. k could be smaller. hi = 5."}'::jsonb),
('koko-bananas', 6, 'k=3 (mid): hours', '{"type":"array","array":[3,6,7,11],"highlights":[0,1,2,3],"pointers":{"lo":1,"mid":3,"hi":5},"status":"k=3 → 1+2+3+4 = 10 > 8 ✗. Need faster. lo = 4."}'::jsonb),
('koko-bananas', 7, 'k=4 (mid): hours', '{"type":"array","array":[3,6,7,11],"highlights":[0,1,2,3],"pointers":{"lo":4,"mid":4,"hi":5},"status":"k=4 → 1+2+2+3 = 8 ≤ 8 ✓. Record and shrink: hi = 3."}'::jsonb),
('koko-bananas', 8, 'Loop ends: lo=4, hi=3', '{"type":"array","array":[3,6,7,11],"highlights":[],"pointers":{"lo":4,"hi":3},"status":"lo > hi → exit."}'::jsonb),
('koko-bananas', 9, 'Answer is lo', '{"type":"array","array":[3,6,7,11],"highlights":[],"pointers":{"lo":4},"status":"lo points at the smallest feasible speed, k = 4."}'::jsonb),
('koko-bananas', 10, 'Verify k=4', '{"type":"array","array":[3,6,7,11],"highlights":[0,1,2,3],"pointers":{},"status":"Hours at k=4: 1 (pile 3) + 2 (pile 6) + 2 (pile 7) + 3 (pile 11) = 8. Fits in h=8."}'::jsonb),
('koko-bananas', 11, 'k=3 was too slow', '{"type":"array","array":[3,6,7,11],"highlights":[],"pointers":{},"status":"Hours at k=3 would be 10 > 8 → infeasible, confirming 4 is the minimum."}'::jsonb),
('koko-bananas', 12, 'Result: 4', '{"type":"array","array":[3,6,7,11],"highlights":[],"pointers":{},"status":"Return 4. Time O(n log M), Space O(1)."}'::jsonb);


-- ── MEDIAN OF TWO SORTED ARRAYS ───────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'median-two-sorted';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('median-two-sorted', 1, 'Problem Setup', '{"type":"array","array":[1,3,8,9,15],"highlights":[],"pointers":{},"status":"A = [1,3,8,9,15], B = [7,11,18,19,21,25]. Find overall median in O(log(min(m,n)))."}'::jsonb),
('median-two-sorted', 2, 'Approach', '{"type":"array","array":[1,3,8,9,15],"highlights":[],"pointers":{},"status":"Binary-search a cut in the shorter array A. Derive B''s cut so left-half size = (m+n+1)/2. Check cross-order."}'::jsonb),
('median-two-sorted', 3, 'Complexity', '{"type":"array","array":[1,3,8,9,15],"highlights":[],"pointers":{},"status":"Time O(log min(m,n)). Space O(1)."}'::jsonb),
('median-two-sorted', 4, 'Init on shorter A', '{"type":"array","array":[1,3,8,9,15],"highlights":[],"pointers":{"lo":0,"hi":5},"status":"m=5, n=6, total=11, half = 6. Search i in [0,5]."}'::jsonb),
('median-two-sorted', 5, 'Iter 1: i=2 (mid of A)', '{"type":"array","array":[1,3,8,9,15],"highlights":[1,2],"pointers":{"lo":0,"mid":2,"hi":5},"status":"i=2 → j = 6 - 2 = 4. A: [1,3 | 8,9,15], B: [7,11,18,19 | 21,25]. Lmax=max(3,19)=19, Rmin=min(8,21)=8."}'::jsonb),
('median-two-sorted', 6, 'Iter 1: 19 > 8 → shift right', '{"type":"array","array":[1,3,8,9,15],"highlights":[1,2],"pointers":{"lo":0,"mid":2,"hi":5},"status":"Left of B too large (19 > 8). Need more of A on the left. lo = i + 1 = 3."}'::jsonb),
('median-two-sorted', 7, 'Iter 2: i=4', '{"type":"array","array":[1,3,8,9,15],"highlights":[3,4],"pointers":{"lo":3,"mid":4,"hi":5},"status":"i=4 → j = 2. A: [1,3,8,9 | 15], B: [7,11 | 18,19,21,25]. Lmax=max(9,11)=11, Rmin=min(15,18)=15."}'::jsonb),
('median-two-sorted', 8, 'Iter 2: 11 ≤ 15 → valid cut', '{"type":"array","array":[1,3,8,9,15],"highlights":[3],"pointers":{"lo":3,"mid":4,"hi":5},"status":"Cross-order holds: Aleft≤Bright and Bleft≤Aright. Cut is valid."}'::jsonb),
('median-two-sorted', 9, 'Compute median', '{"type":"array","array":[1,3,8,9,15],"highlights":[3],"pointers":{"lo":3,"mid":4,"hi":5},"status":"Total is odd (11). Median = max of left side = max(9, 11) = 11."}'::jsonb),
('median-two-sorted', 10, 'Termination', '{"type":"array","array":[1,3,8,9,15],"highlights":[],"pointers":{},"status":"Valid partition found — algorithm returns early without scanning remaining i values."}'::jsonb),
('median-two-sorted', 11, 'Result: 11', '{"type":"array","array":[1,3,8,9,15],"highlights":[],"pointers":{},"status":"Return 11. Time O(log min(m,n)), Space O(1)."}'::jsonb);


-- ── SEARCH 2D MATRIX ──────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'search-2d-matrix';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('search-2d-matrix', 1, 'Problem Setup', '{"type":"array","array":[1,3,5,7,10,11,16,20,23,30,34,60],"highlights":[],"pointers":{},"status":"Flattened 3x4 matrix treated as a single sorted array. Target = 11. Return true if present."}'::jsonb),
('search-2d-matrix', 2, 'Approach', '{"type":"array","array":[1,3,5,7,10,11,16,20,23,30,34,60],"highlights":[],"pointers":{},"status":"Binary search over 0..m*n-1. Convert flat index to (row, col): row = idx/cols, col = idx%cols."}'::jsonb),
('search-2d-matrix', 3, 'Complexity', '{"type":"array","array":[1,3,5,7,10,11,16,20,23,30,34,60],"highlights":[],"pointers":{},"status":"Time O(log(mn)). Space O(1)."}'::jsonb),
('search-2d-matrix', 4, 'Initialize: lo=0, hi=11', '{"type":"array","array":[1,3,5,7,10,11,16,20,23,30,34,60],"highlights":[],"pointers":{"lo":0,"hi":11},"status":"lo = 0, hi = 11 (total cells − 1)."}'::jsonb),
('search-2d-matrix', 5, 'Iter 1: mid=5', '{"type":"array","array":[1,3,5,7,10,11,16,20,23,30,34,60],"highlights":[5],"pointers":{"lo":0,"mid":5,"hi":11},"status":"mid = 5 → (row 1, col 1) → value 11."}'::jsonb),
('search-2d-matrix', 6, 'Iter 1: 11 == 11 → match', '{"type":"array","array":[1,3,5,7,10,11,16,20,23,30,34,60],"highlights":[5],"pointers":{"lo":0,"mid":5,"hi":11},"status":"Target found. Return true."}'::jsonb),
('search-2d-matrix', 7, 'Alt scenario: target=12', '{"type":"array","array":[1,3,5,7,10,11,16,20,23,30,34,60],"highlights":[5],"pointers":{"lo":0,"mid":5,"hi":11},"status":"If target were 12: 11 < 12 → lo = 6."}'::jsonb),
('search-2d-matrix', 8, 'Alt: mid=8', '{"type":"array","array":[1,3,5,7,10,11,16,20,23,30,34,60],"highlights":[8],"pointers":{"lo":6,"mid":8,"hi":11},"status":"mid = 8, value 23 > 12 → hi = 7."}'::jsonb),
('search-2d-matrix', 9, 'Alt: mid=6', '{"type":"array","array":[1,3,5,7,10,11,16,20,23,30,34,60],"highlights":[6],"pointers":{"lo":6,"mid":6,"hi":7},"status":"mid = 6, value 16 > 12 → hi = 5."}'::jsonb),
('search-2d-matrix', 10, 'Alt: lo>hi, return false', '{"type":"array","array":[1,3,5,7,10,11,16,20,23,30,34,60],"highlights":[],"pointers":{"lo":6,"hi":5},"status":"lo > hi → target not present → return false."}'::jsonb),
('search-2d-matrix', 11, 'Result: true (target 11)', '{"type":"array","array":[1,3,5,7,10,11,16,20,23,30,34,60],"highlights":[5],"pointers":{},"status":"Return true. Time O(log mn), Space O(1)."}'::jsonb);


-- ── SEARCH ROTATED ────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'search-rotated';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('search-rotated', 1, 'Problem Setup', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[],"pointers":{},"status":"Rotated sorted array, target = 0. Return index, else -1."}'::jsonb),
('search-rotated', 2, 'Approach', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[],"pointers":{},"status":"Binary search. At each mid, one half is sorted. Decide which half contains target based on range checks."}'::jsonb),
('search-rotated', 3, 'Complexity', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[],"pointers":{},"status":"Time O(log n). Space O(1)."}'::jsonb),
('search-rotated', 4, 'Initialize: lo=0, hi=6', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[],"pointers":{"lo":0,"hi":6},"status":"lo = 0, hi = 6."}'::jsonb),
('search-rotated', 5, 'Iter 1: mid=3 (value 7)', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[3],"pointers":{"lo":0,"mid":3,"hi":6},"status":"nums[lo..mid] = [4,5,6,7] is sorted. Is target=0 in [4,7]? No."}'::jsonb),
('search-rotated', 6, 'Iter 1: shift right', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[3],"pointers":{"lo":0,"mid":3,"hi":6},"status":"Sorted half doesn''t contain 0 → search right. lo = 4."}'::jsonb),
('search-rotated', 7, 'Iter 2: mid=5 (value 1)', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[5],"pointers":{"lo":4,"mid":5,"hi":6},"status":"nums[lo..mid] = [0,1] is sorted. Is 0 in [0,1]? Yes."}'::jsonb),
('search-rotated', 8, 'Iter 2: shift left', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[5],"pointers":{"lo":4,"mid":5,"hi":6},"status":"Target in sorted left half → hi = mid − 1 = 4."}'::jsonb),
('search-rotated', 9, 'Iter 3: mid=4 (value 0)', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[4],"pointers":{"lo":4,"mid":4,"hi":4},"status":"nums[4] = 0 == target. Match."}'::jsonb),
('search-rotated', 10, 'Termination', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[4],"pointers":{},"status":"Match found — return mid immediately."}'::jsonb),
('search-rotated', 11, 'Result: 4', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[4],"pointers":{},"status":"Return 4. Time O(log n), Space O(1)."}'::jsonb);


-- ── TIME-BASED KEY-VALUE ──────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'time-based-key-value';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('time-based-key-value', 1, 'Problem Setup', '{"type":"array","array":[1,4,7,10],"highlights":[],"pointers":{},"hashmap":{"1":"a","4":"b","7":"c","10":"d"},"status":"Store: set(\"k\",\"a\",1), set(\"k\",\"b\",4), set(\"k\",\"c\",7), set(\"k\",\"d\",10). Query get(\"k\",6)."}'::jsonb),
('time-based-key-value', 2, 'Approach', '{"type":"array","array":[1,4,7,10],"highlights":[],"pointers":{},"hashmap":{"1":"a","4":"b","7":"c","10":"d"},"status":"Each key maps to a sorted list of (timestamp,value). Binary-search for largest ts ≤ query ts."}'::jsonb),
('time-based-key-value', 3, 'Complexity', '{"type":"array","array":[1,4,7,10],"highlights":[],"pointers":{},"hashmap":{},"status":"set: O(1) amortized. get: O(log n). Space O(n)."}'::jsonb),
('time-based-key-value', 4, 'get(k,6): init lo=0, hi=3', '{"type":"array","array":[1,4,7,10],"highlights":[],"pointers":{"lo":0,"hi":3},"hashmap":{"1":"a","4":"b","7":"c","10":"d"},"status":"Search largest ts ≤ 6 in [1,4,7,10]."}'::jsonb),
('time-based-key-value', 5, 'Iter 1: mid=1 (ts=4)', '{"type":"array","array":[1,4,7,10],"highlights":[1],"pointers":{"lo":0,"mid":1,"hi":3},"hashmap":{"1":"a","4":"b","7":"c","10":"d"},"status":"ts[1] = 4 ≤ 6 → candidate. Record ans = \"b\"; search right. lo = 2."}'::jsonb),
('time-based-key-value', 6, 'Iter 2: mid=2 (ts=7)', '{"type":"array","array":[1,4,7,10],"highlights":[2],"pointers":{"lo":2,"mid":2,"hi":3},"hashmap":{"1":"a","4":"b","7":"c","10":"d"},"status":"ts[2] = 7 > 6 → not allowed. hi = 1."}'::jsonb),
('time-based-key-value', 7, 'Loop ends: lo>hi', '{"type":"array","array":[1,4,7,10],"highlights":[1],"pointers":{"lo":2,"hi":1},"hashmap":{"1":"a","4":"b","7":"c","10":"d"},"status":"lo = 2 > hi = 1 → exit. ans stays \"b\"."}'::jsonb),
('time-based-key-value', 8, 'Return ans = \"b\"', '{"type":"array","array":[1,4,7,10],"highlights":[1],"pointers":{},"hashmap":{"1":"a","4":"b","7":"c","10":"d"},"status":"Return \"b\" — value at largest ts ≤ 6."}'::jsonb),
('time-based-key-value', 9, 'Edge: get(k,0)', '{"type":"array","array":[1,4,7,10],"highlights":[],"pointers":{"lo":0,"hi":-1},"hashmap":{"1":"a","4":"b","7":"c","10":"d"},"status":"No ts ≤ 0 exists. Loop leaves ans unset → return \"\"."}'::jsonb),
('time-based-key-value', 10, 'Edge: get(k,15)', '{"type":"array","array":[1,4,7,10],"highlights":[3],"pointers":{},"hashmap":{"1":"a","4":"b","7":"c","10":"d"},"status":"All ts ≤ 15 → final candidate is last one: return \"d\"."}'::jsonb),
('time-based-key-value', 11, 'Result', '{"type":"array","array":[1,4,7,10],"highlights":[1],"pointers":{},"hashmap":{"1":"a","4":"b","7":"c","10":"d"},"status":"get(k,6) = \"b\". set O(1), get O(log n), Space O(n)."}'::jsonb);


-- ═══════════════════════════════════════════════════════════════
-- BIT MANIPULATION PROBLEMS (ARRAY renderer, bits shown as array)
-- ═══════════════════════════════════════════════════════════════


-- ── COUNTING BITS ─────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'counting-bits';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('counting-bits', 1, 'Problem Setup', '{"type":"array","array":[0,0,0,0,0,0],"highlights":[],"pointers":{},"status":"Given n = 5. Return ans[i] = popcount(i) for i in 0..5."}'::jsonb),
('counting-bits', 2, 'Approach: DP with i>>1', '{"type":"array","array":[0,0,0,0,0,0],"highlights":[],"pointers":{},"status":"ans[i] = ans[i>>1] + (i & 1). Drop the low bit, reuse the answer for i/2."}'::jsonb),
('counting-bits', 3, 'Complexity', '{"type":"array","array":[0,0,0,0,0,0],"highlights":[],"pointers":{},"status":"Time O(n). Space O(n) for the output array."}'::jsonb),
('counting-bits', 4, 'Initialize ans[0]=0', '{"type":"array","array":[0,0,0,0,0,0],"highlights":[0],"pointers":{"i":0},"status":"Base case: popcount(0) = 0. ans[0] = 0."}'::jsonb),
('counting-bits', 5, 'i=1: bits of 1 = 001', '{"type":"array","array":[0,0,1],"highlights":[2],"pointers":{"i":1},"status":"1>>1 = 0, 1 & 1 = 1 → ans[1] = ans[0] + 1 = 1. Binary: 001."}'::jsonb),
('counting-bits', 6, 'i=2: bits of 2 = 010', '{"type":"array","array":[0,1,0],"highlights":[1],"pointers":{"i":2},"status":"2>>1 = 1, 2 & 1 = 0 → ans[2] = ans[1] + 0 = 1. Binary: 010."}'::jsonb),
('counting-bits', 7, 'i=3: bits of 3 = 011', '{"type":"array","array":[0,1,1],"highlights":[1,2],"pointers":{"i":3},"status":"3>>1 = 1, 3 & 1 = 1 → ans[3] = ans[1] + 1 = 2. Binary: 011."}'::jsonb),
('counting-bits', 8, 'i=4: bits of 4 = 100', '{"type":"array","array":[1,0,0],"highlights":[0],"pointers":{"i":4},"status":"4>>1 = 2, 4 & 1 = 0 → ans[4] = ans[2] + 0 = 1. Binary: 100."}'::jsonb),
('counting-bits', 9, 'i=5: bits of 5 = 101', '{"type":"array","array":[1,0,1],"highlights":[0,2],"pointers":{"i":5},"status":"5>>1 = 2, 5 & 1 = 1 → ans[5] = ans[2] + 1 = 2. Binary: 101."}'::jsonb),
('counting-bits', 10, 'Assemble output', '{"type":"array","array":[0,1,1,2,1,2],"highlights":[0,1,2,3,4,5],"pointers":{},"status":"ans = [0,1,1,2,1,2]."}'::jsonb),
('counting-bits', 11, 'Termination', '{"type":"array","array":[0,1,1,2,1,2],"highlights":[],"pointers":{},"status":"Loop ran from 1 to n; every index filled using its halved predecessor."}'::jsonb),
('counting-bits', 12, 'Result', '{"type":"array","array":[0,1,1,2,1,2],"highlights":[],"pointers":{},"status":"Return [0,1,1,2,1,2]. Time O(n), Space O(n)."}'::jsonb);


-- ── MISSING NUMBER XOR ────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'missing-number-xor';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('missing-number-xor', 1, 'Problem Setup', '{"type":"array","array":[3,0,1],"highlights":[],"pointers":{},"status":"nums = [3,0,1] of length n=3. Find the one missing number in [0..n]."}'::jsonb),
('missing-number-xor', 2, 'Approach: XOR indices with values', '{"type":"array","array":[3,0,1],"highlights":[],"pointers":{},"status":"XOR of 0..n XORed with every nums[i] leaves only the missing number because pairs cancel."}'::jsonb),
('missing-number-xor', 3, 'Complexity', '{"type":"array","array":[3,0,1],"highlights":[],"pointers":{},"status":"Time O(n). Space O(1)."}'::jsonb),
('missing-number-xor', 4, 'Initialize xor = n = 3', '{"type":"array","array":[3,0,1],"highlights":[],"pointers":{"i":0},"hashmap":{"xor":"3"},"status":"Start xor = n so index n is included (there are n+1 possible numbers but only n indices)."}'::jsonb),
('missing-number-xor', 5, 'i=0: xor ^= 0 ^ nums[0]=3', '{"type":"array","array":[3,0,1],"highlights":[0],"pointers":{"i":0},"hashmap":{"xor":"0"},"status":"xor = 3 ^ 0 ^ 3 = 0. (3 cancels 3)."}'::jsonb),
('missing-number-xor', 6, 'i=1: xor ^= 1 ^ nums[1]=0', '{"type":"array","array":[3,0,1],"highlights":[1],"pointers":{"i":1},"hashmap":{"xor":"1"},"status":"xor = 0 ^ 1 ^ 0 = 1."}'::jsonb),
('missing-number-xor', 7, 'i=2: xor ^= 2 ^ nums[2]=1', '{"type":"array","array":[3,0,1],"highlights":[2],"pointers":{"i":2},"hashmap":{"xor":"2"},"status":"xor = 1 ^ 2 ^ 1 = 2. (1 cancels 1)."}'::jsonb),
('missing-number-xor', 8, 'Loop ends', '{"type":"array","array":[3,0,1],"highlights":[],"pointers":{},"hashmap":{"xor":"2"},"status":"All indices and values consumed. xor = 2."}'::jsonb),
('missing-number-xor', 9, 'Why XOR works', '{"type":"array","array":[3,0,1],"highlights":[],"pointers":{},"hashmap":{"xor":"2"},"status":"Multiset of indices ∪ values = {0,1,2,3} ∪ {3,0,1}. Pairs cancel, leaving 2."}'::jsonb),
('missing-number-xor', 10, 'Bit view of result 2 = 010', '{"type":"array","array":[0,1,0],"highlights":[1],"pointers":{},"status":"Binary of 2 is 010. Only the 2^1 bit is set."}'::jsonb),
('missing-number-xor', 11, 'Result: 2', '{"type":"array","array":[3,0,1],"highlights":[],"pointers":{},"hashmap":{"xor":"2"},"status":"Return 2. Time O(n), Space O(1)."}'::jsonb);


-- ── NUMBER OF 1 BITS ──────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'number-of-1-bits';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('number-of-1-bits', 1, 'Problem Setup', '{"type":"array","array":[0,0,0,0,1,0,1,1],"highlights":[],"pointers":{},"status":"n = 11 = 00001011₂. Count the set bits (Hamming weight)."}'::jsonb),
('number-of-1-bits', 2, 'Approach: Brian Kernighan', '{"type":"array","array":[0,0,0,0,1,0,1,1],"highlights":[],"pointers":{},"status":"Repeatedly do n = n & (n-1) — each step clears the lowest set bit. Count iterations."}'::jsonb),
('number-of-1-bits', 3, 'Complexity', '{"type":"array","array":[0,0,0,0,1,0,1,1],"highlights":[],"pointers":{},"status":"Time O(k) where k = popcount. Space O(1)."}'::jsonb),
('number-of-1-bits', 4, 'Initialize count=0, n=1011', '{"type":"array","array":[0,0,0,0,1,0,1,1],"highlights":[4,6,7],"pointers":{},"hashmap":{"count":"0"},"status":"Bits set at positions 0, 1, 3. n = 1011₂."}'::jsonb),
('number-of-1-bits', 5, 'Iter 1: n=1011, n-1=1010', '{"type":"array","array":[0,0,0,0,1,0,1,1],"highlights":[7],"pointers":{},"hashmap":{"count":"0"},"status":"n & (n-1) = 1011 & 1010 = 1010. Low bit (position 0) cleared."}'::jsonb),
('number-of-1-bits', 6, 'Iter 1: count→1', '{"type":"array","array":[0,0,0,0,1,0,1,0],"highlights":[6],"pointers":{},"hashmap":{"count":"1"},"status":"n = 1010. count = 1."}'::jsonb),
('number-of-1-bits', 7, 'Iter 2: n=1010, n-1=1001', '{"type":"array","array":[0,0,0,0,1,0,1,0],"highlights":[6],"pointers":{},"hashmap":{"count":"1"},"status":"1010 & 1001 = 1000. Cleared position 1."}'::jsonb),
('number-of-1-bits', 8, 'Iter 2: count→2', '{"type":"array","array":[0,0,0,0,1,0,0,0],"highlights":[4],"pointers":{},"hashmap":{"count":"2"},"status":"n = 1000. count = 2."}'::jsonb),
('number-of-1-bits', 9, 'Iter 3: n=1000, n-1=0111', '{"type":"array","array":[0,0,0,0,1,0,0,0],"highlights":[4],"pointers":{},"hashmap":{"count":"2"},"status":"1000 & 0111 = 0000. Cleared position 3."}'::jsonb),
('number-of-1-bits', 10, 'Iter 3: count→3, n=0', '{"type":"array","array":[0,0,0,0,0,0,0,0],"highlights":[],"pointers":{},"hashmap":{"count":"3"},"status":"n = 0 → loop exits."}'::jsonb),
('number-of-1-bits', 11, 'Result: 3', '{"type":"array","array":[0,0,0,0,1,0,1,1],"highlights":[4,6,7],"pointers":{},"hashmap":{"count":"3"},"status":"Return 3. Time O(popcount), Space O(1)."}'::jsonb);


-- ── REVERSE BITS ──────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'reverse-bits';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('reverse-bits', 1, 'Problem Setup', '{"type":"array","array":[0,0,0,0,1,1,0,1],"highlights":[],"pointers":{},"status":"Input 8-bit n = 00001101₂ = 13. Return bit-reversed value (treat as 8 bits for illustration)."}'::jsonb),
('reverse-bits', 2, 'Approach: shift-and-OR', '{"type":"array","array":[0,0,0,0,1,1,0,1],"highlights":[],"pointers":{},"status":"For each of the 8 bits, take low bit of n and OR it into result after shifting result left by 1."}'::jsonb),
('reverse-bits', 3, 'Complexity', '{"type":"array","array":[0,0,0,0,1,1,0,1],"highlights":[],"pointers":{},"status":"Time O(32) constant. Space O(1)."}'::jsonb),
('reverse-bits', 4, 'Initialize result=00000000', '{"type":"array","array":[0,0,0,0,0,0,0,0],"highlights":[],"pointers":{"i":0},"hashmap":{"n":"00001101","res":"00000000"},"status":"res = 0, i = 0."}'::jsonb),
('reverse-bits', 5, 'i=0: grab n&1 = 1', '{"type":"array","array":[0,0,0,0,0,0,0,1],"highlights":[7],"pointers":{"i":0},"hashmap":{"n":"00000110","res":"00000001"},"status":"res = (res<<1) | (n&1) = 1. Shift n right: n = 00000110."}'::jsonb),
('reverse-bits', 6, 'i=1: grab 0', '{"type":"array","array":[0,0,0,0,0,0,1,0],"highlights":[6],"pointers":{"i":1},"hashmap":{"n":"00000011","res":"00000010"},"status":"res<<1 = 10, OR 0 → res = 10. n = 00000011."}'::jsonb),
('reverse-bits', 7, 'i=2: grab 1', '{"type":"array","array":[0,0,0,0,0,1,0,1],"highlights":[5,7],"pointers":{"i":2},"hashmap":{"n":"00000001","res":"00000101"},"status":"res = 100 | 1 = 101. n = 00000001."}'::jsonb),
('reverse-bits', 8, 'i=3: grab 1', '{"type":"array","array":[0,0,0,0,1,0,1,1],"highlights":[4,6,7],"pointers":{"i":3},"hashmap":{"n":"00000000","res":"00001011"},"status":"res = 1010 | 1 = 1011. n = 0."}'::jsonb),
('reverse-bits', 9, 'i=4..7: grab 0 four times', '{"type":"array","array":[1,0,1,1,0,0,0,0],"highlights":[0,2,3],"pointers":{"i":7},"hashmap":{"n":"00000000","res":"10110000"},"status":"Remaining low bits of n are 0, but res keeps shifting left 4 more times → res = 10110000."}'::jsonb),
('reverse-bits', 10, 'Termination', '{"type":"array","array":[1,0,1,1,0,0,0,0],"highlights":[],"pointers":{},"hashmap":{"res":"10110000"},"status":"All 8 shifts performed. Loop ends."}'::jsonb),
('reverse-bits', 11, 'Result: 10110000₂ = 176', '{"type":"array","array":[1,0,1,1,0,0,0,0],"highlights":[0,2,3],"pointers":{},"status":"Return 176 (for true 32-bit it would be shifted further). Time O(32), Space O(1)."}'::jsonb);


-- ── SUM OF TWO INTEGERS ───────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'sum-of-two-integers';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('sum-of-two-integers', 1, 'Problem Setup', '{"type":"array","array":[0,1,0,1],"highlights":[],"pointers":{},"hashmap":{"a":"0101 (5)","b":"0011 (3)"},"status":"Compute a + b = 5 + 3 without using + or - operators."}'::jsonb),
('sum-of-two-integers', 2, 'Approach', '{"type":"array","array":[0,1,0,1],"highlights":[],"pointers":{},"status":"XOR gives sum without carry. AND<<1 gives carry. Loop while carry != 0."}'::jsonb),
('sum-of-two-integers', 3, 'Complexity', '{"type":"array","array":[0,1,0,1],"highlights":[],"pointers":{},"status":"Time O(log max(a,b)). Space O(1)."}'::jsonb),
('sum-of-two-integers', 4, 'Initialize', '{"type":"array","array":[0,1,0,1],"highlights":[],"pointers":{},"hashmap":{"a":"0101","b":"0011"},"status":"Start with a=0101, b=0011."}'::jsonb),
('sum-of-two-integers', 5, 'Iter 1: XOR', '{"type":"array","array":[0,1,1,0],"highlights":[1,2],"pointers":{},"hashmap":{"a^b":"0110","a&b":"0001"},"status":"sum = a^b = 0101 ^ 0011 = 0110. carry pre-shift = a&b = 0001."}'::jsonb),
('sum-of-two-integers', 6, 'Iter 1: carry<<1', '{"type":"array","array":[0,0,1,0],"highlights":[2],"pointers":{},"hashmap":{"a":"0110","b":"0010"},"status":"Shift carry left: b = (a&b)<<1 = 0010. a = 0110."}'::jsonb),
('sum-of-two-integers', 7, 'Iter 2: XOR', '{"type":"array","array":[0,1,0,0],"highlights":[1],"pointers":{},"hashmap":{"a^b":"0100","a&b":"0010"},"status":"sum = 0110 ^ 0010 = 0100. carry pre-shift = 0010."}'::jsonb),
('sum-of-two-integers', 8, 'Iter 2: carry<<1', '{"type":"array","array":[0,1,0,0],"highlights":[1],"pointers":{},"hashmap":{"a":"0100","b":"0100"},"status":"b = 0010<<1 = 0100. a = 0100."}'::jsonb),
('sum-of-two-integers', 9, 'Iter 3: XOR', '{"type":"array","array":[1,0,0,0],"highlights":[0],"pointers":{},"hashmap":{"a^b":"1000","a&b":"0100"},"status":"sum = 0100 ^ 0100 = 0000. carry pre-shift = 0100."}'::jsonb),
('sum-of-two-integers', 10, 'Iter 3: carry<<1', '{"type":"array","array":[1,0,0,0],"highlights":[0],"pointers":{},"hashmap":{"a":"0000","b":"1000"},"status":"b = 0100<<1 = 1000. a = 0000."}'::jsonb),
('sum-of-two-integers', 11, 'Iter 4: XOR, carry=0', '{"type":"array","array":[1,0,0,0],"highlights":[0],"pointers":{},"hashmap":{"a":"1000","b":"0000"},"status":"a = 0^1000 = 1000. b = (0 & 1000)<<1 = 0. Loop ends."}'::jsonb),
('sum-of-two-integers', 12, 'Result: 8', '{"type":"array","array":[1,0,0,0],"highlights":[0],"pointers":{},"status":"Return a = 1000₂ = 8 = 5 + 3. Time O(log), Space O(1)."}'::jsonb);


-- ═══════════════════════════════════════════════════════════════
-- MATH PROBLEMS (ARRAY renderer)
-- ═══════════════════════════════════════════════════════════════


-- ── POWER OF THREE ────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'power-of-three';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('power-of-three', 1, 'Problem Setup', '{"type":"array","array":[27],"highlights":[0],"pointers":{},"status":"Given n = 27. Return true iff n is a power of 3 (3^k for some k ≥ 0)."}'::jsonb),
('power-of-three', 2, 'Approach: Divide-by-3 loop', '{"type":"array","array":[27],"highlights":[],"pointers":{},"status":"While n > 1 and n % 3 == 0, divide by 3. At the end check n == 1."}'::jsonb),
('power-of-three', 3, 'Complexity', '{"type":"array","array":[27],"highlights":[],"pointers":{},"status":"Time O(log₃ n). Space O(1)."}'::jsonb),
('power-of-three', 4, 'Initial check n > 0', '{"type":"array","array":[27],"highlights":[0],"pointers":{},"status":"27 > 0 ✓. Continue."}'::jsonb),
('power-of-three', 5, 'Iter 1: 27 % 3 == 0', '{"type":"array","array":[27],"highlights":[0],"pointers":{},"hashmap":{"n":"27"},"status":"27 mod 3 = 0 → divide. n = 9."}'::jsonb),
('power-of-three', 6, 'Iter 2: 9 % 3 == 0', '{"type":"array","array":[9],"highlights":[0],"pointers":{},"hashmap":{"n":"9"},"status":"9 mod 3 = 0 → divide. n = 3."}'::jsonb),
('power-of-three', 7, 'Iter 3: 3 % 3 == 0', '{"type":"array","array":[3],"highlights":[0],"pointers":{},"hashmap":{"n":"3"},"status":"3 mod 3 = 0 → divide. n = 1."}'::jsonb),
('power-of-three', 8, 'Loop ends: n == 1', '{"type":"array","array":[1],"highlights":[0],"pointers":{},"hashmap":{"n":"1"},"status":"Loop condition n > 1 fails. Exit."}'::jsonb),
('power-of-three', 9, 'Final check n == 1', '{"type":"array","array":[1],"highlights":[0],"pointers":{},"status":"n == 1 ✓ → original was a power of 3."}'::jsonb),
('power-of-three', 10, 'Counter-example n = 45', '{"type":"array","array":[45],"highlights":[0],"pointers":{},"status":"45 → 15 → 5 (not divisible by 3). Loop exits with n = 5 ≠ 1 → false."}'::jsonb),
('power-of-three', 11, 'Result: true', '{"type":"array","array":[27],"highlights":[0],"pointers":{},"status":"27 = 3³ → return true. Time O(log₃ n), Space O(1)."}'::jsonb);


-- ── POWER OF TWO ──────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'power-of-two';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('power-of-two', 1, 'Problem Setup', '{"type":"array","array":[0,0,0,1,0,0,0,0],"highlights":[3],"pointers":{},"status":"n = 16 = 00010000₂. Return true iff n is a power of 2."}'::jsonb),
('power-of-two', 2, 'Approach: n & (n-1)', '{"type":"array","array":[0,0,0,1,0,0,0,0],"highlights":[],"pointers":{},"status":"A power of 2 has exactly one set bit. n & (n-1) clears that bit → equals 0 iff power of 2. Also require n > 0."}'::jsonb),
('power-of-two', 3, 'Complexity', '{"type":"array","array":[0,0,0,1,0,0,0,0],"highlights":[],"pointers":{},"status":"Time O(1). Space O(1)."}'::jsonb),
('power-of-two', 4, 'Guard: n > 0', '{"type":"array","array":[0,0,0,1,0,0,0,0],"highlights":[3],"pointers":{},"hashmap":{"n":"16"},"status":"16 > 0 ✓."}'::jsonb),
('power-of-two', 5, 'Compute n - 1 = 15', '{"type":"array","array":[0,0,0,0,1,1,1,1],"highlights":[4,5,6,7],"pointers":{},"hashmap":{"n-1":"00001111"},"status":"n − 1 = 15 = 00001111. Subtracting 1 turns the lone set bit into a trailing run of ones."}'::jsonb),
('power-of-two', 6, 'Compute n & (n-1)', '{"type":"array","array":[0,0,0,0,0,0,0,0],"highlights":[],"pointers":{},"hashmap":{"n&(n-1)":"00000000"},"status":"00010000 & 00001111 = 00000000. Bits have no overlap."}'::jsonb),
('power-of-two', 7, 'Check == 0', '{"type":"array","array":[0,0,0,0,0,0,0,0],"highlights":[],"pointers":{},"status":"Result is 0 → n has a single bit."}'::jsonb),
('power-of-two', 8, 'Counter-example n=12', '{"type":"array","array":[0,0,0,0,1,1,0,0],"highlights":[4,5],"pointers":{},"hashmap":{"n":"1100","n-1":"1011"},"status":"12 = 1100, 11 = 1011 → 1100 & 1011 = 1000 ≠ 0 → not a power of 2."}'::jsonb),
('power-of-two', 9, 'Edge n=0', '{"type":"array","array":[0,0,0,0,0,0,0,0],"highlights":[],"pointers":{},"status":"0 & -1 = 0 but 0 is NOT a power of 2 — that is why we require n > 0."}'::jsonb),
('power-of-two', 10, 'Edge n=1', '{"type":"array","array":[0,0,0,0,0,0,0,1],"highlights":[7],"pointers":{},"status":"1 & 0 = 0 ✓ and 1 > 0 ✓ → true (1 = 2^0)."}'::jsonb),
('power-of-two', 11, 'Result: true', '{"type":"array","array":[0,0,0,1,0,0,0,0],"highlights":[3],"pointers":{},"status":"16 is a power of 2 → return true. Time O(1), Space O(1)."}'::jsonb);


-- ── REVERSE INTEGER ───────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'reverse-integer';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('reverse-integer', 1, 'Problem Setup', '{"type":"array","array":[1,2,3],"highlights":[],"pointers":{},"status":"x = 123. Return reversed digits as signed 32-bit int, or 0 on overflow."}'::jsonb),
('reverse-integer', 2, 'Approach', '{"type":"array","array":[1,2,3],"highlights":[],"pointers":{},"status":"Pop last digit with x%10, push into result via result = result*10 + digit. Check overflow before pushing."}'::jsonb),
('reverse-integer', 3, 'Complexity', '{"type":"array","array":[1,2,3],"highlights":[],"pointers":{},"status":"Time O(log₁₀ x). Space O(1)."}'::jsonb),
('reverse-integer', 4, 'Initialize result=0', '{"type":"array","array":[1,2,3],"highlights":[],"pointers":{},"hashmap":{"x":"123","res":"0"},"status":"res = 0, x = 123."}'::jsonb),
('reverse-integer', 5, 'Iter 1: pop 3', '{"type":"array","array":[1,2,3],"highlights":[2],"pointers":{},"hashmap":{"x":"12","res":"3"},"status":"digit = 123 % 10 = 3. res = 0*10 + 3 = 3. x = 12."}'::jsonb),
('reverse-integer', 6, 'Iter 2: pop 2', '{"type":"array","array":[1,2,3],"highlights":[1],"pointers":{},"hashmap":{"x":"1","res":"32"},"status":"digit = 12 % 10 = 2. res = 3*10 + 2 = 32. x = 1."}'::jsonb),
('reverse-integer', 7, 'Iter 3: pop 1', '{"type":"array","array":[1,2,3],"highlights":[0],"pointers":{},"hashmap":{"x":"0","res":"321"},"status":"digit = 1. res = 32*10 + 1 = 321. x = 0."}'::jsonb),
('reverse-integer', 8, 'Loop ends (x==0)', '{"type":"array","array":[3,2,1],"highlights":[0,1,2],"pointers":{},"hashmap":{"res":"321"},"status":"x = 0 → exit."}'::jsonb),
('reverse-integer', 9, 'Overflow check each step', '{"type":"array","array":[3,2,1],"highlights":[],"pointers":{},"status":"Before each res = res*10 + digit, assert res < INT_MAX/10 (and handle equality). 321 is safe."}'::jsonb),
('reverse-integer', 10, 'Negative case e.g. -123', '{"type":"array","array":[3,2,1],"highlights":[],"pointers":{},"status":"Sign preserved: take abs, reverse, reapply sign → -321."}'::jsonb),
('reverse-integer', 11, 'Overflow example', '{"type":"array","array":[],"highlights":[],"pointers":{},"status":"x = 1534236469 would produce 9646324351 > 2^31-1 → return 0."}'::jsonb),
('reverse-integer', 12, 'Result: 321', '{"type":"array","array":[3,2,1],"highlights":[0,1,2],"pointers":{},"status":"Return 321. Time O(log₁₀ x), Space O(1)."}'::jsonb);

-- ═══════════════════════════════════════════════════════════════
-- END OF BATCH 7
-- ═══════════════════════════════════════════════════════════════
