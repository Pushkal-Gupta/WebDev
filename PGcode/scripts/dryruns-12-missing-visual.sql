-- ═══════════════════════════════════════════════════════════════
-- Dry Runs — Geometry topic (Batch 4, Visual Walkthroughs)
-- ───────────────────────────────────────────────────────────────
-- Covers 6 geometry PGcode problems with multi-step visual dry runs:
--   check-if-straight-line, k-closest-origin, max-points-on-line,
--   minimum-area-rectangle, rectangle-overlap, valid-square.
--
-- REQUIRES: the new GeometryRenderer
-- (src/components/renderers/GeometryRenderer.jsx), which consumes a
-- JSONB payload of the shape:
--   { type: "geometry", points: [...], lines: [...],
--     rectangles: [...], bounds?: {...}, status: "..." }
--
-- Point state  : default | current | highlighted | visited | match | reject
-- Line state   : default | highlighted | current | match | reject
-- Rect state   : default | current | highlighted | match | reject
--
-- Safe to re-run: each section DELETEs existing steps first.
-- ═══════════════════════════════════════════════════════════════


-- ── CHECK IF STRAIGHT LINE ────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'check-if-straight-line';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('check-if-straight-line', 1, 'Problem Setup', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 2, "label": "P0", "state": "default"},
    {"x": 2, "y": 3, "label": "P1", "state": "default"},
    {"x": 3, "y": 4, "label": "P2", "state": "default"},
    {"x": 4, "y": 5, "label": "P3", "state": "default"},
    {"x": 5, "y": 6, "label": "P4", "state": "default"},
    {"x": 6, "y": 7, "label": "P5", "state": "default"}
  ],
  "lines": [],
  "bounds": {"minX": 0, "maxX": 8, "minY": 0, "maxY": 8},
  "status": "Given 6 points P0..P5. Return true if they all lie on a single straight line in the XY-plane."
}'::jsonb),

('check-if-straight-line', 2, 'Approach: Use a Reference Slope', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 2, "label": "P0", "state": "default"},
    {"x": 2, "y": 3, "label": "P1", "state": "default"},
    {"x": 3, "y": 4, "label": "P2", "state": "default"},
    {"x": 4, "y": 5, "label": "P3", "state": "default"},
    {"x": 5, "y": 6, "label": "P4", "state": "default"},
    {"x": 6, "y": 7, "label": "P5", "state": "default"}
  ],
  "lines": [],
  "bounds": {"minX": 0, "maxX": 8, "minY": 0, "maxY": 8},
  "status": "Take the first two points as the reference line. For every other point Pi, verify the slope (Pi − P0) matches (P1 − P0). Use cross-product form dx1*dy2 == dx2*dy1 to avoid division."
}'::jsonb),

('check-if-straight-line', 3, 'Anchor the Reference Line P0→P1', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 2, "label": "P0", "state": "highlighted"},
    {"x": 2, "y": 3, "label": "P1", "state": "highlighted"},
    {"x": 3, "y": 4, "label": "P2", "state": "default"},
    {"x": 4, "y": 5, "label": "P3", "state": "default"},
    {"x": 5, "y": 6, "label": "P4", "state": "default"},
    {"x": 6, "y": 7, "label": "P5", "state": "default"}
  ],
  "lines": [
    {"x1": 1, "y1": 2, "x2": 2, "y2": 3, "state": "highlighted"}
  ],
  "bounds": {"minX": 0, "maxX": 8, "minY": 0, "maxY": 8},
  "status": "Reference segment drawn from P0(1,2) to P1(2,3). dx = 1, dy = 1, so the reference slope is 1/1."
}'::jsonb),

('check-if-straight-line', 4, 'Check P2: extend the line', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 2, "label": "P0", "state": "highlighted"},
    {"x": 2, "y": 3, "label": "P1", "state": "highlighted"},
    {"x": 3, "y": 4, "label": "P2", "state": "current"},
    {"x": 4, "y": 5, "label": "P3", "state": "default"},
    {"x": 5, "y": 6, "label": "P4", "state": "default"},
    {"x": 6, "y": 7, "label": "P5", "state": "default"}
  ],
  "lines": [
    {"x1": 1, "y1": 2, "x2": 3, "y2": 4, "state": "current"}
  ],
  "bounds": {"minX": 0, "maxX": 8, "minY": 0, "maxY": 8},
  "status": "Check P2(3,4). dx2 = 2, dy2 = 2. Cross-check: 1*2 == 1*2 → true. P2 lies on the line. Mark as visited."
}'::jsonb),

('check-if-straight-line', 5, 'P2 Confirmed, Check P3', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 2, "label": "P0", "state": "match"},
    {"x": 2, "y": 3, "label": "P1", "state": "match"},
    {"x": 3, "y": 4, "label": "P2", "state": "match"},
    {"x": 4, "y": 5, "label": "P3", "state": "current"},
    {"x": 5, "y": 6, "label": "P4", "state": "default"},
    {"x": 6, "y": 7, "label": "P5", "state": "default"}
  ],
  "lines": [
    {"x1": 1, "y1": 2, "x2": 4, "y2": 5, "state": "current"}
  ],
  "bounds": {"minX": 0, "maxX": 8, "minY": 0, "maxY": 8},
  "status": "Check P3(4,5). dx = 3, dy = 3. 1*3 == 1*3 → true. P3 lies on the line."
}'::jsonb),

('check-if-straight-line', 6, 'Check P4', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 2, "label": "P0", "state": "match"},
    {"x": 2, "y": 3, "label": "P1", "state": "match"},
    {"x": 3, "y": 4, "label": "P2", "state": "match"},
    {"x": 4, "y": 5, "label": "P3", "state": "match"},
    {"x": 5, "y": 6, "label": "P4", "state": "current"},
    {"x": 6, "y": 7, "label": "P5", "state": "default"}
  ],
  "lines": [
    {"x1": 1, "y1": 2, "x2": 5, "y2": 6, "state": "current"}
  ],
  "bounds": {"minX": 0, "maxX": 8, "minY": 0, "maxY": 8},
  "status": "Check P4(5,6). dx = 4, dy = 4. Cross-product 1*4 == 1*4 → true. On the line."
}'::jsonb),

('check-if-straight-line', 7, 'Check P5', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 2, "label": "P0", "state": "match"},
    {"x": 2, "y": 3, "label": "P1", "state": "match"},
    {"x": 3, "y": 4, "label": "P2", "state": "match"},
    {"x": 4, "y": 5, "label": "P3", "state": "match"},
    {"x": 5, "y": 6, "label": "P4", "state": "match"},
    {"x": 6, "y": 7, "label": "P5", "state": "current"}
  ],
  "lines": [
    {"x1": 1, "y1": 2, "x2": 6, "y2": 7, "state": "current"}
  ],
  "bounds": {"minX": 0, "maxX": 8, "minY": 0, "maxY": 8},
  "status": "Check P5(6,7). dx = 5, dy = 5. 1*5 == 1*5 → true. All six points are collinear."
}'::jsonb),

('check-if-straight-line', 8, 'Result: true', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 2, "label": "P0", "state": "match"},
    {"x": 2, "y": 3, "label": "P1", "state": "match"},
    {"x": 3, "y": 4, "label": "P2", "state": "match"},
    {"x": 4, "y": 5, "label": "P3", "state": "match"},
    {"x": 5, "y": 6, "label": "P4", "state": "match"},
    {"x": 6, "y": 7, "label": "P5", "state": "match"}
  ],
  "lines": [
    {"x1": 1, "y1": 2, "x2": 6, "y2": 7, "state": "match"}
  ],
  "bounds": {"minX": 0, "maxX": 8, "minY": 0, "maxY": 8},
  "status": "Every point passed the cross-product test. Return true. Time: O(n), Space: O(1)."
}'::jsonb);


-- ── K CLOSEST TO ORIGIN ───────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'k-closest-origin';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('k-closest-origin', 1, 'Problem Setup', '{
  "type": "geometry",
  "points": [
    {"x": 0, "y": 0, "label": "O", "state": "highlighted"},
    {"x": 1, "y": 3, "label": "A", "state": "default"},
    {"x": -2, "y": 2, "label": "B", "state": "default"},
    {"x": 5, "y": 8, "label": "C", "state": "default"},
    {"x": 0, "y": 1, "label": "D", "state": "default"},
    {"x": -2, "y": 4, "label": "E", "state": "default"}
  ],
  "lines": [],
  "bounds": {"minX": -4, "maxX": 7, "minY": -1, "maxY": 9},
  "status": "Given 5 points A..E and origin O(0,0). Return the k = 2 points closest to O using Euclidean distance."
}'::jsonb),

('k-closest-origin', 2, 'Approach: Max-Heap of Size k', '{
  "type": "geometry",
  "points": [
    {"x": 0, "y": 0, "label": "O", "state": "highlighted"},
    {"x": 1, "y": 3, "label": "A", "state": "default"},
    {"x": -2, "y": 2, "label": "B", "state": "default"},
    {"x": 5, "y": 8, "label": "C", "state": "default"},
    {"x": 0, "y": 1, "label": "D", "state": "default"},
    {"x": -2, "y": 4, "label": "E", "state": "default"}
  ],
  "lines": [],
  "bounds": {"minX": -4, "maxX": 7, "minY": -1, "maxY": 9},
  "status": "Use a max-heap keyed by squared distance (x²+y²). Keep size ≤ k. If a new point is closer than the heap top, pop and push. O(n log k)."
}'::jsonb),

('k-closest-origin', 3, 'Measure A(1,3)', '{
  "type": "geometry",
  "points": [
    {"x": 0, "y": 0, "label": "O", "state": "highlighted"},
    {"x": 1, "y": 3, "label": "A", "state": "current"},
    {"x": -2, "y": 2, "label": "B", "state": "default"},
    {"x": 5, "y": 8, "label": "C", "state": "default"},
    {"x": 0, "y": 1, "label": "D", "state": "default"},
    {"x": -2, "y": 4, "label": "E", "state": "default"}
  ],
  "lines": [
    {"x1": 0, "y1": 0, "x2": 1, "y2": 3, "state": "highlighted"}
  ],
  "bounds": {"minX": -4, "maxX": 7, "minY": -1, "maxY": 9},
  "status": "d²(A) = 1² + 3² = 10. Heap has room (size 0 < 2) → push A. Heap = [A:10]."
}'::jsonb),

('k-closest-origin', 4, 'Measure B(-2,2)', '{
  "type": "geometry",
  "points": [
    {"x": 0, "y": 0, "label": "O", "state": "highlighted"},
    {"x": 1, "y": 3, "label": "A", "state": "highlighted"},
    {"x": -2, "y": 2, "label": "B", "state": "current"},
    {"x": 5, "y": 8, "label": "C", "state": "default"},
    {"x": 0, "y": 1, "label": "D", "state": "default"},
    {"x": -2, "y": 4, "label": "E", "state": "default"}
  ],
  "lines": [
    {"x1": 0, "y1": 0, "x2": 1, "y2": 3, "state": "highlighted"},
    {"x1": 0, "y1": 0, "x2": -2, "y2": 2, "state": "current"}
  ],
  "bounds": {"minX": -4, "maxX": 7, "minY": -1, "maxY": 9},
  "status": "d²(B) = 4 + 4 = 8. Heap has room → push B. Heap = [A:10, B:8]. Max on top is A(10)."
}'::jsonb),

('k-closest-origin', 5, 'Measure C(5,8) — reject', '{
  "type": "geometry",
  "points": [
    {"x": 0, "y": 0, "label": "O", "state": "highlighted"},
    {"x": 1, "y": 3, "label": "A", "state": "highlighted"},
    {"x": -2, "y": 2, "label": "B", "state": "highlighted"},
    {"x": 5, "y": 8, "label": "C", "state": "reject"},
    {"x": 0, "y": 1, "label": "D", "state": "default"},
    {"x": -2, "y": 4, "label": "E", "state": "default"}
  ],
  "lines": [
    {"x1": 0, "y1": 0, "x2": 1, "y2": 3, "state": "highlighted"},
    {"x1": 0, "y1": 0, "x2": -2, "y2": 2, "state": "highlighted"},
    {"x1": 0, "y1": 0, "x2": 5, "y2": 8, "state": "reject"}
  ],
  "bounds": {"minX": -4, "maxX": 7, "minY": -1, "maxY": 9},
  "status": "d²(C) = 25 + 64 = 89. Heap is full, top is 10 < 89. C is farther than current worst → discard C."
}'::jsonb),

('k-closest-origin', 6, 'Measure D(0,1) — swap in', '{
  "type": "geometry",
  "points": [
    {"x": 0, "y": 0, "label": "O", "state": "highlighted"},
    {"x": 1, "y": 3, "label": "A", "state": "reject"},
    {"x": -2, "y": 2, "label": "B", "state": "highlighted"},
    {"x": 5, "y": 8, "label": "C", "state": "reject"},
    {"x": 0, "y": 1, "label": "D", "state": "current"},
    {"x": -2, "y": 4, "label": "E", "state": "default"}
  ],
  "lines": [
    {"x1": 0, "y1": 0, "x2": -2, "y2": 2, "state": "highlighted"},
    {"x1": 0, "y1": 0, "x2": 0, "y2": 1, "state": "current"}
  ],
  "bounds": {"minX": -4, "maxX": 7, "minY": -1, "maxY": 9},
  "status": "d²(D) = 0 + 1 = 1. Heap top = A(10). 1 < 10, so pop A and push D. Heap = [B:8, D:1]."
}'::jsonb),

('k-closest-origin', 7, 'Measure E(-2,4) — reject', '{
  "type": "geometry",
  "points": [
    {"x": 0, "y": 0, "label": "O", "state": "highlighted"},
    {"x": 1, "y": 3, "label": "A", "state": "reject"},
    {"x": -2, "y": 2, "label": "B", "state": "highlighted"},
    {"x": 5, "y": 8, "label": "C", "state": "reject"},
    {"x": 0, "y": 1, "label": "D", "state": "highlighted"},
    {"x": -2, "y": 4, "label": "E", "state": "reject"}
  ],
  "lines": [
    {"x1": 0, "y1": 0, "x2": -2, "y2": 2, "state": "highlighted"},
    {"x1": 0, "y1": 0, "x2": 0, "y2": 1, "state": "highlighted"},
    {"x1": 0, "y1": 0, "x2": -2, "y2": 4, "state": "reject"}
  ],
  "bounds": {"minX": -4, "maxX": 7, "minY": -1, "maxY": 9},
  "status": "d²(E) = 4 + 16 = 20. Heap top = B(8). 20 > 8 → discard E."
}'::jsonb),

('k-closest-origin', 8, 'Result: {B, D}', '{
  "type": "geometry",
  "points": [
    {"x": 0, "y": 0, "label": "O", "state": "highlighted"},
    {"x": 1, "y": 3, "label": "A", "state": "reject"},
    {"x": -2, "y": 2, "label": "B", "state": "match"},
    {"x": 5, "y": 8, "label": "C", "state": "reject"},
    {"x": 0, "y": 1, "label": "D", "state": "match"},
    {"x": -2, "y": 4, "label": "E", "state": "reject"}
  ],
  "lines": [
    {"x1": 0, "y1": 0, "x2": -2, "y2": 2, "state": "match"},
    {"x1": 0, "y1": 0, "x2": 0, "y2": 1, "state": "match"}
  ],
  "bounds": {"minX": -4, "maxX": 7, "minY": -1, "maxY": 9},
  "status": "Final heap = {B(8), D(1)} → return [B(-2,2), D(0,1)] as the 2 closest to origin. Time O(n log k), Space O(k)."
}'::jsonb);


-- ── MAX POINTS ON A LINE ──────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'max-points-on-line';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('max-points-on-line', 1, 'Problem Setup', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 1, "label": "P0", "state": "default"},
    {"x": 2, "y": 2, "label": "P1", "state": "default"},
    {"x": 3, "y": 3, "label": "P2", "state": "default"},
    {"x": 4, "y": 1, "label": "P3", "state": "default"},
    {"x": 5, "y": 5, "label": "P4", "state": "default"},
    {"x": 2, "y": 4, "label": "P5", "state": "default"}
  ],
  "lines": [],
  "bounds": {"minX": 0, "maxX": 6, "minY": 0, "maxY": 6},
  "status": "Given 6 points. Return the maximum number that lie on the same straight line."
}'::jsonb),

('max-points-on-line', 2, 'Approach: Anchor + Slope Map', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 1, "label": "P0", "state": "default"},
    {"x": 2, "y": 2, "label": "P1", "state": "default"},
    {"x": 3, "y": 3, "label": "P2", "state": "default"},
    {"x": 4, "y": 1, "label": "P3", "state": "default"},
    {"x": 5, "y": 5, "label": "P4", "state": "default"},
    {"x": 2, "y": 4, "label": "P5", "state": "default"}
  ],
  "lines": [],
  "bounds": {"minX": 0, "maxX": 6, "minY": 0, "maxY": 6},
  "status": "For each anchor Pi, group every other point by the reduced (dx, dy) slope relative to Pi. The largest group +1 (for Pi) is the best line through Pi. Take the max over all anchors. O(n²)."
}'::jsonb),

('max-points-on-line', 3, 'Anchor P0: probe P1', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 1, "label": "P0", "state": "current"},
    {"x": 2, "y": 2, "label": "P1", "state": "highlighted"},
    {"x": 3, "y": 3, "label": "P2", "state": "default"},
    {"x": 4, "y": 1, "label": "P3", "state": "default"},
    {"x": 5, "y": 5, "label": "P4", "state": "default"},
    {"x": 2, "y": 4, "label": "P5", "state": "default"}
  ],
  "lines": [
    {"x1": 1, "y1": 1, "x2": 2, "y2": 2, "state": "highlighted"}
  ],
  "bounds": {"minX": 0, "maxX": 6, "minY": 0, "maxY": 6},
  "status": "Anchor = P0(1,1). P1 gives slope (1,1). slopes = { (1,1): 1 }."
}'::jsonb),

('max-points-on-line', 4, 'Anchor P0: P2 same slope', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 1, "label": "P0", "state": "current"},
    {"x": 2, "y": 2, "label": "P1", "state": "match"},
    {"x": 3, "y": 3, "label": "P2", "state": "match"},
    {"x": 4, "y": 1, "label": "P3", "state": "default"},
    {"x": 5, "y": 5, "label": "P4", "state": "default"},
    {"x": 2, "y": 4, "label": "P5", "state": "default"}
  ],
  "lines": [
    {"x1": 1, "y1": 1, "x2": 3, "y2": 3, "state": "match"}
  ],
  "bounds": {"minX": 0, "maxX": 6, "minY": 0, "maxY": 6},
  "status": "P2(3,3): dx=2, dy=2 → reduce by gcd(2,2)=2 → (1,1). Same slope as P1. slopes = { (1,1): 2 }."
}'::jsonb),

('max-points-on-line', 5, 'Anchor P0: P4 also on y=x', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 1, "label": "P0", "state": "current"},
    {"x": 2, "y": 2, "label": "P1", "state": "match"},
    {"x": 3, "y": 3, "label": "P2", "state": "match"},
    {"x": 4, "y": 1, "label": "P3", "state": "default"},
    {"x": 5, "y": 5, "label": "P4", "state": "match"},
    {"x": 2, "y": 4, "label": "P5", "state": "default"}
  ],
  "lines": [
    {"x1": 1, "y1": 1, "x2": 5, "y2": 5, "state": "match"}
  ],
  "bounds": {"minX": 0, "maxX": 6, "minY": 0, "maxY": 6},
  "status": "P4(5,5): dx=4, dy=4 → gcd 4 → (1,1). Yet another point on y=x. slopes = { (1,1): 3 }."
}'::jsonb),

('max-points-on-line', 6, 'Anchor P0: P3 different slope', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 1, "label": "P0", "state": "current"},
    {"x": 2, "y": 2, "label": "P1", "state": "match"},
    {"x": 3, "y": 3, "label": "P2", "state": "match"},
    {"x": 4, "y": 1, "label": "P3", "state": "reject"},
    {"x": 5, "y": 5, "label": "P4", "state": "match"},
    {"x": 2, "y": 4, "label": "P5", "state": "default"}
  ],
  "lines": [
    {"x1": 1, "y1": 1, "x2": 5, "y2": 5, "state": "match"},
    {"x1": 1, "y1": 1, "x2": 4, "y2": 1, "state": "reject"}
  ],
  "bounds": {"minX": 0, "maxX": 6, "minY": 0, "maxY": 6},
  "status": "P3(4,1): dx=3, dy=0 → (1,0). Different slope bucket. slopes = { (1,1): 3, (1,0): 1 }."
}'::jsonb),

('max-points-on-line', 7, 'Anchor P0: P5 different slope', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 1, "label": "P0", "state": "current"},
    {"x": 2, "y": 2, "label": "P1", "state": "match"},
    {"x": 3, "y": 3, "label": "P2", "state": "match"},
    {"x": 4, "y": 1, "label": "P3", "state": "reject"},
    {"x": 5, "y": 5, "label": "P4", "state": "match"},
    {"x": 2, "y": 4, "label": "P5", "state": "reject"}
  ],
  "lines": [
    {"x1": 1, "y1": 1, "x2": 5, "y2": 5, "state": "match"},
    {"x1": 1, "y1": 1, "x2": 2, "y2": 4, "state": "reject"}
  ],
  "bounds": {"minX": 0, "maxX": 6, "minY": 0, "maxY": 6},
  "status": "P5(2,4): dx=1, dy=3 → (1,3). slopes = { (1,1): 3, (1,0): 1, (1,3): 1 }. Best through P0 = 3 + 1 = 4."
}'::jsonb),

('max-points-on-line', 8, 'Try other anchors (no better line)', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 1, "label": "P0", "state": "match"},
    {"x": 2, "y": 2, "label": "P1", "state": "match"},
    {"x": 3, "y": 3, "label": "P2", "state": "match"},
    {"x": 4, "y": 1, "label": "P3", "state": "default"},
    {"x": 5, "y": 5, "label": "P4", "state": "match"},
    {"x": 2, "y": 4, "label": "P5", "state": "default"}
  ],
  "lines": [
    {"x1": 1, "y1": 1, "x2": 5, "y2": 5, "state": "match"}
  ],
  "bounds": {"minX": 0, "maxX": 6, "minY": 0, "maxY": 6},
  "status": "Repeating the process for P1, P2, … never yields a line with more than 4 points (all recover the diagonal y=x). Running max stays at 4."
}'::jsonb),

('max-points-on-line', 9, 'Result: 4', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 1, "label": "P0", "state": "match"},
    {"x": 2, "y": 2, "label": "P1", "state": "match"},
    {"x": 3, "y": 3, "label": "P2", "state": "match"},
    {"x": 4, "y": 1, "label": "P3", "state": "reject"},
    {"x": 5, "y": 5, "label": "P4", "state": "match"},
    {"x": 2, "y": 4, "label": "P5", "state": "reject"}
  ],
  "lines": [
    {"x1": 1, "y1": 1, "x2": 5, "y2": 5, "state": "match"}
  ],
  "bounds": {"minX": 0, "maxX": 6, "minY": 0, "maxY": 6},
  "status": "Line y = x contains P0, P1, P2, P4 → 4 points. Return 4. Time O(n²), Space O(n)."
}'::jsonb);


-- ── MINIMUM AREA RECTANGLE ────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'minimum-area-rectangle';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('minimum-area-rectangle', 1, 'Problem Setup', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 1, "label": "A", "state": "default"},
    {"x": 1, "y": 3, "label": "B", "state": "default"},
    {"x": 3, "y": 1, "label": "C", "state": "default"},
    {"x": 3, "y": 3, "label": "D", "state": "default"},
    {"x": 4, "y": 1, "label": "E", "state": "default"},
    {"x": 4, "y": 3, "label": "F", "state": "default"}
  ],
  "lines": [],
  "bounds": {"minX": 0, "maxX": 5, "minY": 0, "maxY": 4},
  "status": "Given 6 points. Find the minimum-area axis-aligned rectangle with all 4 corners in the set. Return 0 if none exists."
}'::jsonb),

('minimum-area-rectangle', 2, 'Approach: Diagonal Pairs', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 1, "label": "A", "state": "default"},
    {"x": 1, "y": 3, "label": "B", "state": "default"},
    {"x": 3, "y": 1, "label": "C", "state": "default"},
    {"x": 3, "y": 3, "label": "D", "state": "default"},
    {"x": 4, "y": 1, "label": "E", "state": "default"},
    {"x": 4, "y": 3, "label": "F", "state": "default"}
  ],
  "lines": [],
  "bounds": {"minX": 0, "maxX": 5, "minY": 0, "maxY": 4},
  "status": "Store all points in a set. For every pair (p1, p2) with different x and y, treat them as a diagonal; the other two corners must be (p1.x, p2.y) and (p2.x, p1.y). If both are present, update min area."
}'::jsonb),

('minimum-area-rectangle', 3, 'Try diagonal A–D', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 1, "label": "A", "state": "current"},
    {"x": 1, "y": 3, "label": "B", "state": "match"},
    {"x": 3, "y": 1, "label": "C", "state": "match"},
    {"x": 3, "y": 3, "label": "D", "state": "current"},
    {"x": 4, "y": 1, "label": "E", "state": "default"},
    {"x": 4, "y": 3, "label": "F", "state": "default"}
  ],
  "lines": [],
  "rectangles": [
    {"x1": 1, "y1": 1, "x2": 3, "y2": 3, "label": "R1", "state": "current"}
  ],
  "bounds": {"minX": 0, "maxX": 5, "minY": 0, "maxY": 4},
  "status": "Diagonal A(1,1)–D(3,3). Other corners (1,3)=B and (3,1)=C. Both exist → valid rectangle. Area = 2 × 2 = 4. best = 4."
}'::jsonb),

('minimum-area-rectangle', 4, 'Try diagonal A–F', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 1, "label": "A", "state": "current"},
    {"x": 1, "y": 3, "label": "B", "state": "match"},
    {"x": 3, "y": 1, "label": "C", "state": "default"},
    {"x": 3, "y": 3, "label": "D", "state": "default"},
    {"x": 4, "y": 1, "label": "E", "state": "match"},
    {"x": 4, "y": 3, "label": "F", "state": "current"}
  ],
  "lines": [],
  "rectangles": [
    {"x1": 1, "y1": 1, "x2": 4, "y2": 3, "label": "R2", "state": "current"}
  ],
  "bounds": {"minX": 0, "maxX": 5, "minY": 0, "maxY": 4},
  "status": "Diagonal A(1,1)–F(4,3). Other corners (1,3)=B and (4,1)=E. Both exist → rectangle valid. Area = 3 × 2 = 6. 6 > 4, so best stays at 4."
}'::jsonb),

('minimum-area-rectangle', 5, 'Try diagonal C–F', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 1, "label": "A", "state": "default"},
    {"x": 1, "y": 3, "label": "B", "state": "default"},
    {"x": 3, "y": 1, "label": "C", "state": "current"},
    {"x": 3, "y": 3, "label": "D", "state": "match"},
    {"x": 4, "y": 1, "label": "E", "state": "match"},
    {"x": 4, "y": 3, "label": "F", "state": "current"}
  ],
  "lines": [],
  "rectangles": [
    {"x1": 3, "y1": 1, "x2": 4, "y2": 3, "label": "R3", "state": "current"}
  ],
  "bounds": {"minX": 0, "maxX": 5, "minY": 0, "maxY": 4},
  "status": "Diagonal C(3,1)–F(4,3). Other corners (3,3)=D and (4,1)=E. Both present → area = 1 × 2 = 2. 2 < 4 → best = 2."
}'::jsonb),

('minimum-area-rectangle', 6, 'Try diagonal B–E (larger)', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 1, "label": "A", "state": "match"},
    {"x": 1, "y": 3, "label": "B", "state": "current"},
    {"x": 3, "y": 1, "label": "C", "state": "default"},
    {"x": 3, "y": 3, "label": "D", "state": "default"},
    {"x": 4, "y": 1, "label": "E", "state": "current"},
    {"x": 4, "y": 3, "label": "F", "state": "match"}
  ],
  "lines": [],
  "rectangles": [
    {"x1": 1, "y1": 1, "x2": 4, "y2": 3, "label": "R4", "state": "reject"}
  ],
  "bounds": {"minX": 0, "maxX": 5, "minY": 0, "maxY": 4},
  "status": "Diagonal B(1,3)–E(4,1). Corners (1,1)=A, (4,3)=F. Both exist → area = 3 × 2 = 6. Larger than best(2); reject."
}'::jsonb),

('minimum-area-rectangle', 7, 'Remaining pairs do not improve', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 1, "label": "A", "state": "default"},
    {"x": 1, "y": 3, "label": "B", "state": "default"},
    {"x": 3, "y": 1, "label": "C", "state": "default"},
    {"x": 3, "y": 3, "label": "D", "state": "default"},
    {"x": 4, "y": 1, "label": "E", "state": "default"},
    {"x": 4, "y": 3, "label": "F", "state": "default"}
  ],
  "lines": [],
  "rectangles": [
    {"x1": 3, "y1": 1, "x2": 4, "y2": 3, "label": "best", "state": "match"}
  ],
  "bounds": {"minX": 0, "maxX": 5, "minY": 0, "maxY": 4},
  "status": "All remaining diagonals either reuse the same rectangles or have no matching corners. Running minimum stays at 2."
}'::jsonb),

('minimum-area-rectangle', 8, 'Result: 2', '{
  "type": "geometry",
  "points": [
    {"x": 1, "y": 1, "label": "A", "state": "default"},
    {"x": 1, "y": 3, "label": "B", "state": "default"},
    {"x": 3, "y": 1, "label": "C", "state": "match"},
    {"x": 3, "y": 3, "label": "D", "state": "match"},
    {"x": 4, "y": 1, "label": "E", "state": "match"},
    {"x": 4, "y": 3, "label": "F", "state": "match"}
  ],
  "lines": [],
  "rectangles": [
    {"x1": 3, "y1": 1, "x2": 4, "y2": 3, "label": "MIN", "state": "match"}
  ],
  "bounds": {"minX": 0, "maxX": 5, "minY": 0, "maxY": 4},
  "status": "Smallest axis-aligned rectangle uses C, D, E, F with area 2. Return 2. Time O(n²), Space O(n)."
}'::jsonb);


-- ── RECTANGLE OVERLAP ─────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'rectangle-overlap';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('rectangle-overlap', 1, 'Problem Setup', '{
  "type": "geometry",
  "points": [],
  "lines": [],
  "rectangles": [
    {"x1": 0, "y1": 0, "x2": 4, "y2": 3, "label": "R1", "state": "default"},
    {"x1": 2, "y1": 1, "x2": 6, "y2": 5, "label": "R2", "state": "default"}
  ],
  "bounds": {"minX": -1, "maxX": 7, "minY": -1, "maxY": 6},
  "status": "rec1 = [0,0,4,3], rec2 = [2,1,6,5]. Return true if they overlap (share area greater than zero), false otherwise."
}'::jsonb),

('rectangle-overlap', 2, 'Approach: Interval Overlap', '{
  "type": "geometry",
  "points": [],
  "lines": [],
  "rectangles": [
    {"x1": 0, "y1": 0, "x2": 4, "y2": 3, "label": "R1", "state": "default"},
    {"x1": 2, "y1": 1, "x2": 6, "y2": 5, "label": "R2", "state": "default"}
  ],
  "bounds": {"minX": -1, "maxX": 7, "minY": -1, "maxY": 6},
  "status": "Two axis-aligned rectangles overlap iff their X projections overlap AND their Y projections overlap. X overlap: max(x1a,x1b) < min(x2a,x2b). Same for Y."
}'::jsonb),

('rectangle-overlap', 3, 'Highlight R1', '{
  "type": "geometry",
  "points": [],
  "lines": [],
  "rectangles": [
    {"x1": 0, "y1": 0, "x2": 4, "y2": 3, "label": "R1", "state": "current"},
    {"x1": 2, "y1": 1, "x2": 6, "y2": 5, "label": "R2", "state": "default"}
  ],
  "bounds": {"minX": -1, "maxX": 7, "minY": -1, "maxY": 6},
  "status": "R1 spans X: [0,4], Y: [0,3]."
}'::jsonb),

('rectangle-overlap', 4, 'Highlight R2', '{
  "type": "geometry",
  "points": [],
  "lines": [],
  "rectangles": [
    {"x1": 0, "y1": 0, "x2": 4, "y2": 3, "label": "R1", "state": "default"},
    {"x1": 2, "y1": 1, "x2": 6, "y2": 5, "label": "R2", "state": "current"}
  ],
  "bounds": {"minX": -1, "maxX": 7, "minY": -1, "maxY": 6},
  "status": "R2 spans X: [2,6], Y: [1,5]."
}'::jsonb),

('rectangle-overlap', 5, 'Test X overlap', '{
  "type": "geometry",
  "points": [
    {"x": 2, "y": 0, "label": "xL", "state": "highlighted"},
    {"x": 4, "y": 0, "label": "xR", "state": "highlighted"}
  ],
  "lines": [
    {"x1": 2, "y1": 0, "x2": 4, "y2": 0, "state": "highlighted"}
  ],
  "rectangles": [
    {"x1": 0, "y1": 0, "x2": 4, "y2": 3, "label": "R1", "state": "highlighted"},
    {"x1": 2, "y1": 1, "x2": 6, "y2": 5, "label": "R2", "state": "highlighted"}
  ],
  "bounds": {"minX": -1, "maxX": 7, "minY": -1, "maxY": 6},
  "status": "max(0,2)=2, min(4,6)=4. Since 2 < 4, X intervals overlap on [2,4]."
}'::jsonb),

('rectangle-overlap', 6, 'Test Y overlap', '{
  "type": "geometry",
  "points": [
    {"x": 0, "y": 1, "label": "yB", "state": "highlighted"},
    {"x": 0, "y": 3, "label": "yT", "state": "highlighted"}
  ],
  "lines": [
    {"x1": 0, "y1": 1, "x2": 0, "y2": 3, "state": "highlighted"}
  ],
  "rectangles": [
    {"x1": 0, "y1": 0, "x2": 4, "y2": 3, "label": "R1", "state": "highlighted"},
    {"x1": 2, "y1": 1, "x2": 6, "y2": 5, "label": "R2", "state": "highlighted"}
  ],
  "bounds": {"minX": -1, "maxX": 7, "minY": -1, "maxY": 6},
  "status": "max(0,1)=1, min(3,5)=3. Since 1 < 3, Y intervals overlap on [1,3]."
}'::jsonb),

('rectangle-overlap', 7, 'Highlight Overlap Region', '{
  "type": "geometry",
  "points": [],
  "lines": [],
  "rectangles": [
    {"x1": 0, "y1": 0, "x2": 4, "y2": 3, "label": "R1", "state": "highlighted"},
    {"x1": 2, "y1": 1, "x2": 6, "y2": 5, "label": "R2", "state": "highlighted"},
    {"x1": 2, "y1": 1, "x2": 4, "y2": 3, "label": "∩", "state": "match"}
  ],
  "bounds": {"minX": -1, "maxX": 7, "minY": -1, "maxY": 6},
  "status": "Intersection rectangle is [2,1,4,3] — non-empty area = 2 × 2 = 4. Rectangles overlap."
}'::jsonb),

('rectangle-overlap', 8, 'Result: true', '{
  "type": "geometry",
  "points": [],
  "lines": [],
  "rectangles": [
    {"x1": 0, "y1": 0, "x2": 4, "y2": 3, "label": "R1", "state": "match"},
    {"x1": 2, "y1": 1, "x2": 6, "y2": 5, "label": "R2", "state": "match"},
    {"x1": 2, "y1": 1, "x2": 4, "y2": 3, "label": "∩", "state": "match"}
  ],
  "bounds": {"minX": -1, "maxX": 7, "minY": -1, "maxY": 6},
  "status": "Both projections overlap → return true. Time O(1), Space O(1)."
}'::jsonb);


-- ── VALID SQUARE ──────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'valid-square';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('valid-square', 1, 'Problem Setup', '{
  "type": "geometry",
  "points": [
    {"x": 0, "y": 0, "label": "P1", "state": "default"},
    {"x": 2, "y": 0, "label": "P2", "state": "default"},
    {"x": 0, "y": 2, "label": "P3", "state": "default"},
    {"x": 2, "y": 2, "label": "P4", "state": "default"}
  ],
  "lines": [],
  "bounds": {"minX": -1, "maxX": 3, "minY": -1, "maxY": 3},
  "status": "Given four points P1..P4. Determine if they form a valid (non-degenerate) square in any orientation."
}'::jsonb),

('valid-square', 2, 'Approach: 6 Pairwise Squared Distances', '{
  "type": "geometry",
  "points": [
    {"x": 0, "y": 0, "label": "P1", "state": "default"},
    {"x": 2, "y": 0, "label": "P2", "state": "default"},
    {"x": 0, "y": 2, "label": "P3", "state": "default"},
    {"x": 2, "y": 2, "label": "P4", "state": "default"}
  ],
  "lines": [],
  "bounds": {"minX": -1, "maxX": 3, "minY": -1, "maxY": 3},
  "status": "Compute all C(4,2)=6 squared distances. A square must have exactly 2 distinct values: 4 equal sides and 2 equal diagonals, with diagonal = 2 × side, and the smaller must be > 0."
}'::jsonb),

('valid-square', 3, 'Draw all 6 edges', '{
  "type": "geometry",
  "points": [
    {"x": 0, "y": 0, "label": "P1", "state": "highlighted"},
    {"x": 2, "y": 0, "label": "P2", "state": "highlighted"},
    {"x": 0, "y": 2, "label": "P3", "state": "highlighted"},
    {"x": 2, "y": 2, "label": "P4", "state": "highlighted"}
  ],
  "lines": [
    {"x1": 0, "y1": 0, "x2": 2, "y2": 0, "state": "highlighted"},
    {"x1": 0, "y1": 0, "x2": 0, "y2": 2, "state": "highlighted"},
    {"x1": 0, "y1": 0, "x2": 2, "y2": 2, "state": "highlighted"},
    {"x1": 2, "y1": 0, "x2": 0, "y2": 2, "state": "highlighted"},
    {"x1": 2, "y1": 0, "x2": 2, "y2": 2, "state": "highlighted"},
    {"x1": 0, "y1": 2, "x2": 2, "y2": 2, "state": "highlighted"}
  ],
  "bounds": {"minX": -1, "maxX": 3, "minY": -1, "maxY": 3},
  "status": "Draw every pairwise segment. We now evaluate their squared lengths."
}'::jsonb),

('valid-square', 4, 'Sides = 4', '{
  "type": "geometry",
  "points": [
    {"x": 0, "y": 0, "label": "P1", "state": "match"},
    {"x": 2, "y": 0, "label": "P2", "state": "match"},
    {"x": 0, "y": 2, "label": "P3", "state": "match"},
    {"x": 2, "y": 2, "label": "P4", "state": "match"}
  ],
  "lines": [
    {"x1": 0, "y1": 0, "x2": 2, "y2": 0, "state": "match"},
    {"x1": 0, "y1": 0, "x2": 0, "y2": 2, "state": "match"},
    {"x1": 2, "y1": 0, "x2": 2, "y2": 2, "state": "match"},
    {"x1": 0, "y1": 2, "x2": 2, "y2": 2, "state": "match"},
    {"x1": 0, "y1": 0, "x2": 2, "y2": 2, "state": "highlighted"},
    {"x1": 2, "y1": 0, "x2": 0, "y2": 2, "state": "highlighted"}
  ],
  "bounds": {"minX": -1, "maxX": 3, "minY": -1, "maxY": 3},
  "status": "P1P2, P1P3, P2P4, P3P4 each have squared distance 4. Four equal sides — good so far."
}'::jsonb),

('valid-square', 5, 'Diagonals = 8', '{
  "type": "geometry",
  "points": [
    {"x": 0, "y": 0, "label": "P1", "state": "match"},
    {"x": 2, "y": 0, "label": "P2", "state": "match"},
    {"x": 0, "y": 2, "label": "P3", "state": "match"},
    {"x": 2, "y": 2, "label": "P4", "state": "match"}
  ],
  "lines": [
    {"x1": 0, "y1": 0, "x2": 2, "y2": 0, "state": "match"},
    {"x1": 0, "y1": 0, "x2": 0, "y2": 2, "state": "match"},
    {"x1": 2, "y1": 0, "x2": 2, "y2": 2, "state": "match"},
    {"x1": 0, "y1": 2, "x2": 2, "y2": 2, "state": "match"},
    {"x1": 0, "y1": 0, "x2": 2, "y2": 2, "state": "match"},
    {"x1": 2, "y1": 0, "x2": 0, "y2": 2, "state": "match"}
  ],
  "bounds": {"minX": -1, "maxX": 3, "minY": -1, "maxY": 3},
  "status": "P1P4 and P2P3 both have squared distance 8. Two equal diagonals."
}'::jsonb),

('valid-square', 6, 'Check 2 Distinct Values', '{
  "type": "geometry",
  "points": [
    {"x": 0, "y": 0, "label": "P1", "state": "match"},
    {"x": 2, "y": 0, "label": "P2", "state": "match"},
    {"x": 0, "y": 2, "label": "P3", "state": "match"},
    {"x": 2, "y": 2, "label": "P4", "state": "match"}
  ],
  "lines": [
    {"x1": 0, "y1": 0, "x2": 2, "y2": 0, "state": "match"},
    {"x1": 0, "y1": 0, "x2": 0, "y2": 2, "state": "match"},
    {"x1": 2, "y1": 0, "x2": 2, "y2": 2, "state": "match"},
    {"x1": 0, "y1": 2, "x2": 2, "y2": 2, "state": "match"},
    {"x1": 0, "y1": 0, "x2": 2, "y2": 2, "state": "match"},
    {"x1": 2, "y1": 0, "x2": 0, "y2": 2, "state": "match"}
  ],
  "bounds": {"minX": -1, "maxX": 3, "minY": -1, "maxY": 3},
  "status": "Distances = {4,4,4,4,8,8}. Exactly two distinct values (4 and 8) — pattern matches a square."
}'::jsonb),

('valid-square', 7, 'Verify diagonal = 2 × side, side > 0', '{
  "type": "geometry",
  "points": [
    {"x": 0, "y": 0, "label": "P1", "state": "match"},
    {"x": 2, "y": 0, "label": "P2", "state": "match"},
    {"x": 0, "y": 2, "label": "P3", "state": "match"},
    {"x": 2, "y": 2, "label": "P4", "state": "match"}
  ],
  "lines": [
    {"x1": 0, "y1": 0, "x2": 2, "y2": 0, "state": "match"},
    {"x1": 0, "y1": 0, "x2": 0, "y2": 2, "state": "match"},
    {"x1": 2, "y1": 0, "x2": 2, "y2": 2, "state": "match"},
    {"x1": 0, "y1": 2, "x2": 2, "y2": 2, "state": "match"},
    {"x1": 0, "y1": 0, "x2": 2, "y2": 2, "state": "match"},
    {"x1": 2, "y1": 0, "x2": 0, "y2": 2, "state": "match"}
  ],
  "bounds": {"minX": -1, "maxX": 3, "minY": -1, "maxY": 3},
  "status": "Smaller squared distance = 4 > 0 (non-degenerate). Larger = 8 = 2 × 4 (Pythagoras). Every condition holds."
}'::jsonb),

('valid-square', 8, 'Result: true', '{
  "type": "geometry",
  "points": [
    {"x": 0, "y": 0, "label": "P1", "state": "match"},
    {"x": 2, "y": 0, "label": "P2", "state": "match"},
    {"x": 0, "y": 2, "label": "P3", "state": "match"},
    {"x": 2, "y": 2, "label": "P4", "state": "match"}
  ],
  "lines": [
    {"x1": 0, "y1": 0, "x2": 2, "y2": 0, "state": "match"},
    {"x1": 0, "y1": 0, "x2": 0, "y2": 2, "state": "match"},
    {"x1": 2, "y1": 0, "x2": 2, "y2": 2, "state": "match"},
    {"x1": 0, "y1": 2, "x2": 2, "y2": 2, "state": "match"}
  ],
  "bounds": {"minX": -1, "maxX": 3, "minY": -1, "maxY": 3},
  "status": "The four points form a valid square of side 2. Return true. Time O(1), Space O(1)."
}'::jsonb);
