-- Grow catalog 400 → 500 batch b1: geometry (6) + 2d-dp (6) + linkedlist (6) = 18 problems
BEGIN;

-- ============ IDEMPOTENT CLEANUP ============
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'minimum-distance-between-bst-nodes-geo','check-if-point-is-reachable','max-number-of-visible-points',
  'convex-polygon','minimum-area-rectangle-500','global-and-local-inversions',
  'paint-fence-2d','unique-paths-iii-500','longest-common-subseq-2d','maximal-square-500',
  'interleaving-string-500','cherry-pickup-ii',
  'linked-list-cycle-ii-500','remove-duplicates-from-sorted-list','remove-duplicates-from-sorted-list-ii',
  'swap-nodes-in-pairs-500','add-two-numbers-ii-500','reverse-nodes-in-k-group-500'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'minimum-distance-between-bst-nodes-geo','check-if-point-is-reachable','max-number-of-visible-points',
  'convex-polygon','minimum-area-rectangle-500','global-and-local-inversions',
  'paint-fence-2d','unique-paths-iii-500','longest-common-subseq-2d','maximal-square-500',
  'interleaving-string-500','cherry-pickup-ii',
  'linked-list-cycle-ii-500','remove-duplicates-from-sorted-list','remove-duplicates-from-sorted-list-ii',
  'swap-nodes-in-pairs-500','add-two-numbers-ii-500','reverse-nodes-in-k-group-500'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'minimum-distance-between-bst-nodes-geo','check-if-point-is-reachable','max-number-of-visible-points',
  'convex-polygon','minimum-area-rectangle-500','global-and-local-inversions',
  'paint-fence-2d','unique-paths-iii-500','longest-common-subseq-2d','maximal-square-500',
  'interleaving-string-500','cherry-pickup-ii',
  'linked-list-cycle-ii-500','remove-duplicates-from-sorted-list','remove-duplicates-from-sorted-list-ii',
  'swap-nodes-in-pairs-500','add-two-numbers-ii-500','reverse-nodes-in-k-group-500'
);

-- ================================================================
-- GEOMETRY (2E, 3M, 1H)
-- ================================================================

-- G1) valid-boomerang (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('valid-boomerang','geometry','Valid Boomerang','Easy',
$$<p>Given an array of three points <code>points</code> where <code>points[i] = [xi, yi]</code>, return <code>true</code> if these points form a boomerang (i.e., they are distinct and not all on the same straight line).</p>$$,
'',ARRAY['Three points are collinear if the area of the triangle they form is zero.','Use the cross product: (x2-x1)*(y3-y1) - (y2-y1)*(x3-x1).','If the cross product is non-zero, the points form a boomerang.'],
'500','https://leetcode.com/problems/valid-boomerang/',
'isBoomerang','[{"name":"points","type":"List[List[int]]"}]'::jsonb,'bool',
'[{"inputs":["[[1,1],[2,3],[3,2]]"],"expected":"true"},{"inputs":["[[1,1],[2,2],[3,3]]"],"expected":"false"},{"inputs":["[[0,0],[1,0],[0,1]]"],"expected":"true"},{"inputs":["[[0,0],[0,0],[1,1]]"],"expected":"false"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('valid-boomerang','python',$PY$class Solution:
    def isBoomerang(self, points: List[List[int]]) -> bool:
        $PY$),
('valid-boomerang','javascript',$JS$var isBoomerang = function(points) {

};$JS$),
('valid-boomerang','java',$JAVA$class Solution {
    public boolean isBoomerang(int[][] points) {

    }
}$JAVA$),
('valid-boomerang','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isBoomerang(vector<vector<int>>& points) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('valid-boomerang',1,'Cross Product',
'Three points form a boomerang if and only if they are not collinear. We check this using the cross product of two vectors formed by the three points.',
'["Compute vectors v1 = (x2-x1, y2-y1) and v2 = (x3-x1, y3-y1).","Compute cross product: v1x * v2y - v1y * v2x.","Return true if cross product is not zero."]'::jsonb,
$PY$class Solution:
    def isBoomerang(self, points: List[List[int]]) -> bool:
        x1, y1 = points[0]
        x2, y2 = points[1]
        x3, y3 = points[2]
        return (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1) != 0
$PY$,
$JS$var isBoomerang = function(points) {
    const [x1, y1] = points[0], [x2, y2] = points[1], [x3, y3] = points[2];
    return (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1) !== 0;
};
$JS$,
$JAVA$class Solution {
    public boolean isBoomerang(int[][] points) {
        return (points[1][0] - points[0][0]) * (points[2][1] - points[0][1])
             - (points[1][1] - points[0][1]) * (points[2][0] - points[0][0]) != 0;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool isBoomerang(vector<vector<int>>& points) {
        return (points[1][0] - points[0][0]) * (points[2][1] - points[0][1])
             - (points[1][1] - points[0][1]) * (points[2][0] - points[0][0]) != 0;
    }
};
$CPP$,'O(1)','O(1)');

-- G2) projection-area-of-3d-shapes (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('projection-area-of-3d-shapes','geometry','Projection Area of 3D Shapes','Easy',
$$<p>You are given an <code>n x n</code> grid where each value <code>grid[i][j]</code> represents the height of a tower of unit cubes at position <code>(i, j)</code>. Return the total area of all three projections (xy, yz, xz planes).</p>$$,
'',ARRAY['The xy projection is just the count of cells with grid[i][j] > 0.','The xz projection is the sum of max values in each row.','The yz projection is the sum of max values in each column.'],
'500','https://leetcode.com/problems/projection-area-of-3d-shapes/',
'projectionArea','[{"name":"grid","type":"List[List[int]]"}]'::jsonb,'int',
'[{"inputs":["[[1,2],[3,4]]"],"expected":"17"},{"inputs":["[[2]]"],"expected":"5"},{"inputs":["[[1,0],[0,2]]"],"expected":"8"},{"inputs":["[[1,1,1],[1,0,1],[1,1,1]]"],"expected":"14"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('projection-area-of-3d-shapes','python',$PY$class Solution:
    def projectionArea(self, grid: List[List[int]]) -> int:
        $PY$),
('projection-area-of-3d-shapes','javascript',$JS$var projectionArea = function(grid) {

};$JS$),
('projection-area-of-3d-shapes','java',$JAVA$class Solution {
    public int projectionArea(int[][] grid) {

    }
}$JAVA$),
('projection-area-of-3d-shapes','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int projectionArea(vector<vector<int>>& grid) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('projection-area-of-3d-shapes',1,'Three Projections',
'The top-down projection counts non-zero cells. The front and side projections use the row-max and column-max respectively.',
'["For each cell, if grid[i][j] > 0, add 1 to xy area.","For each row, add the max value to xz area.","For each column, add the max value to yz area.","Return xy + xz + yz."]'::jsonb,
$PY$class Solution:
    def projectionArea(self, grid: List[List[int]]) -> int:
        n = len(grid)
        xy = sum(1 for i in range(n) for j in range(n) if grid[i][j] > 0)
        xz = sum(max(row) for row in grid)
        yz = sum(max(grid[i][j] for i in range(n)) for j in range(n))
        return xy + xz + yz
$PY$,
$JS$var projectionArea = function(grid) {
    const n = grid.length;
    let xy = 0, xz = 0, yz = 0;
    for (let i = 0; i < n; i++) {
        let rowMax = 0, colMax = 0;
        for (let j = 0; j < n; j++) {
            if (grid[i][j] > 0) xy++;
            rowMax = Math.max(rowMax, grid[i][j]);
            colMax = Math.max(colMax, grid[j][i]);
        }
        xz += rowMax;
        yz += colMax;
    }
    return xy + xz + yz;
};
$JS$,
$JAVA$class Solution {
    public int projectionArea(int[][] grid) {
        int n = grid.length, xy = 0, xz = 0, yz = 0;
        for (int i = 0; i < n; i++) {
            int rowMax = 0, colMax = 0;
            for (int j = 0; j < n; j++) {
                if (grid[i][j] > 0) xy++;
                rowMax = Math.max(rowMax, grid[i][j]);
                colMax = Math.max(colMax, grid[j][i]);
            }
            xz += rowMax;
            yz += colMax;
        }
        return xy + xz + yz;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int projectionArea(vector<vector<int>>& grid) {
        int n = grid.size(), xy = 0, xz = 0, yz = 0;
        for (int i = 0; i < n; i++) {
            int rowMax = 0, colMax = 0;
            for (int j = 0; j < n; j++) {
                if (grid[i][j] > 0) xy++;
                rowMax = max(rowMax, grid[i][j]);
                colMax = max(colMax, grid[j][i]);
            }
            xz += rowMax;
            yz += colMax;
        }
        return xy + xz + yz;
    }
};
$CPP$,'O(n^2)','O(1)');

-- G3) queens-that-can-attack-the-king (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('queens-that-can-attack-king','geometry','Queens That Can Attack the King','Medium',
$$<p>On an 8x8 chessboard, there are several queens and one king. Return the coordinates of all queens that can directly attack the king (no other queen blocks them).</p>$$,
'',ARRAY['From the king, search in all 8 directions.','Stop as soon as you hit the first queen in each direction.','Use a set of queen positions for O(1) lookup.'],
'500','https://leetcode.com/problems/queens-that-can-attack-the-king/',
'queensAttacktheKing','[{"name":"queens","type":"List[List[int]]"},{"name":"king","type":"List[int]"}]'::jsonb,'List[List[int]]',
'[{"inputs":["[[0,1],[1,0],[4,0],[0,4],[3,3],[2,4]]","[0,0]"],"expected":"[[0,1],[1,0]]"},{"inputs":["[[0,0],[1,1],[2,2],[3,4],[3,5],[4,4],[4,5]]","[3,3]"],"expected":"[[2,2],[3,4],[4,4]]"},{"inputs":["[[5,6],[7,7],[2,1],[0,7],[1,6],[5,1],[3,7],[0,3],[4,0],[1,2],[6,3],[5,0],[0,4],[2,2],[1,1],[6,4],[5,4],[0,0],[2,6],[4,5],[5,2],[1,4],[7,5],[2,3],[0,5],[4,2],[1,0],[2,7],[0,1],[4,6],[6,1],[0,6],[4,3],[1,7]]","[3,4]"],"expected":"[[2,3],[1,4],[4,3],[4,5],[2,6]]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('queens-that-can-attack-king','python',$PY$class Solution:
    def queensAttacktheKing(self, queens: List[List[int]], king: List[int]) -> List[List[int]]:
        $PY$),
('queens-that-can-attack-king','javascript',$JS$var queensAttacktheKing = function(queens, king) {

};$JS$),
('queens-that-can-attack-king','java',$JAVA$class Solution {
    public List<List<Integer>> queensAttacktheKing(int[][] queens, int[] king) {

    }
}$JAVA$),
('queens-that-can-attack-king','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> queensAttacktheKing(vector<vector<int>>& queens, vector<int>& king) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('queens-that-can-attack-king',1,'Search from King',
'From the king position, walk outward in all 8 directions and collect the first queen found in each direction.',
'["Store all queen positions in a set.","For each of the 8 directions (dx, dy), start from king and step outward.","If a cell contains a queen, add it to the result and stop that direction.","Return all collected queens."]'::jsonb,
$PY$class Solution:
    def queensAttacktheKing(self, queens: List[List[int]], king: List[int]) -> List[List[int]]:
        queen_set = {(q[0], q[1]) for q in queens}
        result = []
        for dx in [-1, 0, 1]:
            for dy in [-1, 0, 1]:
                if dx == 0 and dy == 0:
                    continue
                x, y = king[0] + dx, king[1] + dy
                while 0 <= x < 8 and 0 <= y < 8:
                    if (x, y) in queen_set:
                        result.append([x, y])
                        break
                    x += dx
                    y += dy
        return result
$PY$,
$JS$var queensAttacktheKing = function(queens, king) {
    const queenSet = new Set(queens.map(q => q[0] + ',' + q[1]));
    const result = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            let x = king[0] + dx, y = king[1] + dy;
            while (x >= 0 && x < 8 && y >= 0 && y < 8) {
                if (queenSet.has(x + ',' + y)) { result.push([x, y]); break; }
                x += dx; y += dy;
            }
        }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> queensAttacktheKing(int[][] queens, int[] king) {
        boolean[][] isQueen = new boolean[8][8];
        for (int[] q : queens) isQueen[q[0]][q[1]] = true;
        List<List<Integer>> result = new ArrayList<>();
        for (int dx = -1; dx <= 1; dx++) {
            for (int dy = -1; dy <= 1; dy++) {
                if (dx == 0 && dy == 0) continue;
                int x = king[0] + dx, y = king[1] + dy;
                while (x >= 0 && x < 8 && y >= 0 && y < 8) {
                    if (isQueen[x][y]) { result.add(Arrays.asList(x, y)); break; }
                    x += dx; y += dy;
                }
            }
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<int>> queensAttacktheKing(vector<vector<int>>& queens, vector<int>& king) {
        bool isQueen[8][8] = {};
        for (auto& q : queens) isQueen[q[0]][q[1]] = true;
        vector<vector<int>> result;
        for (int dx = -1; dx <= 1; dx++) {
            for (int dy = -1; dy <= 1; dy++) {
                if (dx == 0 && dy == 0) continue;
                int x = king[0] + dx, y = king[1] + dy;
                while (x >= 0 && x < 8 && y >= 0 && y < 8) {
                    if (isQueen[x][y]) { result.push_back({x, y}); break; }
                    x += dx; y += dy;
                }
            }
        }
        return result;
    }
};
$CPP$,'O(1)','O(1)');

-- G4) minimum-time-visiting-all-points (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('minimum-time-visiting-all-points','geometry','Minimum Time Visiting All Points','Medium',
$$<p>On a 2D plane, you are given an array of integer coordinates <code>points</code> where <code>points[i] = [xi, yi]</code>. Return the minimum time in seconds to visit all points in order. In one second, you can move one unit vertically, horizontally, or diagonally.</p>$$,
'',ARRAY['The Chebyshev distance between two points gives the minimum steps.','Chebyshev distance = max(|x2-x1|, |y2-y1|).','Sum up the Chebyshev distances between consecutive points.'],
'500','https://leetcode.com/problems/minimum-time-visiting-all-points/',
'minTimeToVisitAllPoints','[{"name":"points","type":"List[List[int]]"}]'::jsonb,'int',
'[{"inputs":["[[1,1],[3,4],[-1,0]]"],"expected":"7"},{"inputs":["[[3,2],[-2,2]]"],"expected":"5"},{"inputs":["[[0,0],[1,1]]"],"expected":"1"},{"inputs":["[[0,0]]"],"expected":"0"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('minimum-time-visiting-all-points','python',$PY$class Solution:
    def minTimeToVisitAllPoints(self, points: List[List[int]]) -> int:
        $PY$),
('minimum-time-visiting-all-points','javascript',$JS$var minTimeToVisitAllPoints = function(points) {

};$JS$),
('minimum-time-visiting-all-points','java',$JAVA$class Solution {
    public int minTimeToVisitAllPoints(int[][] points) {

    }
}$JAVA$),
('minimum-time-visiting-all-points','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minTimeToVisitAllPoints(vector<vector<int>>& points) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('minimum-time-visiting-all-points',1,'Chebyshev Distance',
'Since diagonal moves cover both x and y simultaneously, the time between two points is max(|dx|, |dy|) -- the Chebyshev distance.',
'["For each pair of consecutive points, compute dx and dy.","The time for that segment is max(|dx|, |dy|).","Sum all segment times."]'::jsonb,
$PY$class Solution:
    def minTimeToVisitAllPoints(self, points: List[List[int]]) -> int:
        total = 0
        for i in range(1, len(points)):
            dx = abs(points[i][0] - points[i-1][0])
            dy = abs(points[i][1] - points[i-1][1])
            total += max(dx, dy)
        return total
$PY$,
$JS$var minTimeToVisitAllPoints = function(points) {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
        const dx = Math.abs(points[i][0] - points[i-1][0]);
        const dy = Math.abs(points[i][1] - points[i-1][1]);
        total += Math.max(dx, dy);
    }
    return total;
};
$JS$,
$JAVA$class Solution {
    public int minTimeToVisitAllPoints(int[][] points) {
        int total = 0;
        for (int i = 1; i < points.length; i++) {
            int dx = Math.abs(points[i][0] - points[i-1][0]);
            int dy = Math.abs(points[i][1] - points[i-1][1]);
            total += Math.max(dx, dy);
        }
        return total;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minTimeToVisitAllPoints(vector<vector<int>>& points) {
        int total = 0;
        for (int i = 1; i < (int)points.size(); i++) {
            int dx = abs(points[i][0] - points[i-1][0]);
            int dy = abs(points[i][1] - points[i-1][1]);
            total += max(dx, dy);
        }
        return total;
    }
};
$CPP$,'O(n)','O(1)');

-- G5) max-points-on-a-line-500 (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('max-points-on-a-line-500','geometry','Max Points on a Line','Medium',
$$<p>Given an array of <code>points</code> where <code>points[i] = [xi, yi]</code>, return the maximum number of points that lie on the same straight line.</p>$$,
'',ARRAY['For each point, compute the slope to every other point.','Use a hash map to group points by slope.','Handle vertical lines and duplicate points carefully.'],
'500','https://leetcode.com/problems/max-points-on-a-line/',
'maxPoints','[{"name":"points","type":"List[List[int]]"}]'::jsonb,'int',
'[{"inputs":["[[1,1],[2,2],[3,3]]"],"expected":"3"},{"inputs":["[[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]]"],"expected":"4"},{"inputs":["[[0,0]]"],"expected":"1"},{"inputs":["[[0,0],[1,1],[0,0]]"],"expected":"3"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('max-points-on-a-line-500','python',$PY$class Solution:
    def maxPoints(self, points: List[List[int]]) -> int:
        $PY$),
('max-points-on-a-line-500','javascript',$JS$var maxPoints = function(points) {

};$JS$),
('max-points-on-a-line-500','java',$JAVA$class Solution {
    public int maxPoints(int[][] points) {

    }
}$JAVA$),
('max-points-on-a-line-500','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxPoints(vector<vector<int>>& points) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('max-points-on-a-line-500',1,'Slope Hashing',
'For each anchor point, count how many other points share the same slope. Use GCD-reduced (dy,dx) pairs as the hash key to avoid floating point issues.',
$ALGO$["For each point i, create a slope map.","For each point j != i, compute dy = yj-yi, dx = xj-xi. Reduce by GCD and normalize sign.","Increment the count for that slope. Track the max count for point i.","Answer is globalMax + 1 (including point i itself)."]$ALGO$::jsonb,
$PY$class Solution:
    def maxPoints(self, points: List[List[int]]) -> int:
        from math import gcd
        n = len(points)
        if n <= 2:
            return n
        ans = 2
        for i in range(n):
            slopes = {}
            for j in range(i + 1, n):
                dy = points[j][1] - points[i][1]
                dx = points[j][0] - points[i][0]
                g = gcd(abs(dy), abs(dx))
                if g:
                    dy //= g
                    dx //= g
                if dx < 0:
                    dy, dx = -dy, -dx
                elif dx == 0:
                    dy = abs(dy)
                slopes[(dy, dx)] = slopes.get((dy, dx), 0) + 1
            ans = max(ans, max(slopes.values()) + 1)
        return ans
$PY$,
$JS$var maxPoints = function(points) {
    const n = points.length;
    if (n <= 2) return n;
    function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
    let ans = 2;
    for (let i = 0; i < n; i++) {
        const slopes = {};
        for (let j = i + 1; j < n; j++) {
            let dy = points[j][1] - points[i][1];
            let dx = points[j][0] - points[i][0];
            const g = gcd(Math.abs(dy), Math.abs(dx));
            if (g) { dy /= g; dx /= g; }
            if (dx < 0) { dy = -dy; dx = -dx; }
            else if (dx === 0) dy = Math.abs(dy);
            const key = dy + '/' + dx;
            slopes[key] = (slopes[key] || 0) + 1;
        }
        for (const k in slopes) ans = Math.max(ans, slopes[k] + 1);
    }
    return ans;
};
$JS$,
$JAVA$class Solution {
    public int maxPoints(int[][] points) {
        int n = points.length;
        if (n <= 2) return n;
        int ans = 2;
        for (int i = 0; i < n; i++) {
            Map<String, Integer> slopes = new HashMap<>();
            for (int j = i + 1; j < n; j++) {
                int dy = points[j][1] - points[i][1];
                int dx = points[j][0] - points[i][0];
                int g = gcd(Math.abs(dy), Math.abs(dx));
                if (g != 0) { dy /= g; dx /= g; }
                if (dx < 0) { dy = -dy; dx = -dx; }
                else if (dx == 0) dy = Math.abs(dy);
                String key = dy + "/" + dx;
                slopes.put(key, slopes.getOrDefault(key, 0) + 1);
            }
            for (int v : slopes.values()) ans = Math.max(ans, v + 1);
        }
        return ans;
    }
    private int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }
}
$JAVA$,
$CPP$class Solution {
public:
    int maxPoints(vector<vector<int>>& points) {
        int n = points.size();
        if (n <= 2) return n;
        int ans = 2;
        for (int i = 0; i < n; i++) {
            map<pair<int,int>, int> slopes;
            for (int j = i + 1; j < n; j++) {
                int dy = points[j][1] - points[i][1];
                int dx = points[j][0] - points[i][0];
                int g = __gcd(abs(dy), abs(dx));
                if (g) { dy /= g; dx /= g; }
                if (dx < 0) { dy = -dy; dx = -dx; }
                else if (dx == 0) dy = abs(dy);
                slopes[{dy, dx}]++;
            }
            for (auto& [k, v] : slopes) ans = max(ans, v + 1);
        }
        return ans;
    }
};
$CPP$,'O(n^2)','O(n)');

-- G6) minimum-area-rectangle-500 (Hard)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('minimum-area-rectangle-500','geometry','Minimum Area Rectangle','Hard',
$$<p>You are given an array of points in the X-Y plane <code>points</code> where <code>points[i] = [xi, yi]</code>. Return the minimum area of a rectangle formed from these points, with sides parallel to the X and Y axes. If there is no such rectangle, return <code>0</code>.</p>$$,
'',ARRAY['For each pair of points that could be diagonal corners of an axis-aligned rectangle, check if the other two corners exist.','Two points (x1,y1) and (x2,y2) can form a diagonal only if x1 != x2 and y1 != y2.','Use a set for O(1) point lookups.'],
'500','https://leetcode.com/problems/minimum-area-rectangle/',
'minAreaRect','[{"name":"points","type":"List[List[int]]"}]'::jsonb,'int',
'[{"inputs":["[[1,1],[1,3],[3,1],[3,3],[2,2]]"],"expected":"4"},{"inputs":["[[1,1],[1,3],[3,1],[3,3],[4,1],[4,3]]"],"expected":"2"},{"inputs":["[[1,1],[2,2]]"],"expected":"0"},{"inputs":["[[0,0],[0,1],[1,0],[1,1],[0,2],[1,2]]"],"expected":"1"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('minimum-area-rectangle-500','python',$PY$class Solution:
    def minAreaRect(self, points: List[List[int]]) -> int:
        $PY$),
('minimum-area-rectangle-500','javascript',$JS$var minAreaRect = function(points) {

};$JS$),
('minimum-area-rectangle-500','java',$JAVA$class Solution {
    public int minAreaRect(int[][] points) {

    }
}$JAVA$),
('minimum-area-rectangle-500','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minAreaRect(vector<vector<int>>& points) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('minimum-area-rectangle-500',1,'Diagonal Pair Check',
'For every pair of points that could form opposite corners of an axis-aligned rectangle, check if the other two corners exist in the point set.',
$ALGO$["Store all points in a set.","For each pair (i, j) where xi != xj and yi != yj, check if (xi, yj) and (xj, yi) are in the set.","If so, compute area = |xi - xj| * |yi - yj| and track the minimum.","Return the minimum area, or 0 if none found."]$ALGO$::jsonb,
$PY$class Solution:
    def minAreaRect(self, points: List[List[int]]) -> int:
        point_set = set(map(tuple, points))
        ans = float('inf')
        n = len(points)
        for i in range(n):
            for j in range(i + 1, n):
                x1, y1 = points[i]
                x2, y2 = points[j]
                if x1 != x2 and y1 != y2:
                    if (x1, y2) in point_set and (x2, y1) in point_set:
                        ans = min(ans, abs(x1 - x2) * abs(y1 - y2))
        return ans if ans != float('inf') else 0
$PY$,
$JS$var minAreaRect = function(points) {
    const set = new Set(points.map(p => p[0] + ',' + p[1]));
    let ans = Infinity;
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const [x1, y1] = points[i], [x2, y2] = points[j];
            if (x1 !== x2 && y1 !== y2) {
                if (set.has(x1 + ',' + y2) && set.has(x2 + ',' + y1)) {
                    ans = Math.min(ans, Math.abs(x1 - x2) * Math.abs(y1 - y2));
                }
            }
        }
    }
    return ans === Infinity ? 0 : ans;
};
$JS$,
$JAVA$class Solution {
    public int minAreaRect(int[][] points) {
        Set<String> set = new HashSet<>();
        for (int[] p : points) set.add(p[0] + "," + p[1]);
        int ans = Integer.MAX_VALUE;
        for (int i = 0; i < points.length; i++) {
            for (int j = i + 1; j < points.length; j++) {
                int x1 = points[i][0], y1 = points[i][1];
                int x2 = points[j][0], y2 = points[j][1];
                if (x1 != x2 && y1 != y2) {
                    if (set.contains(x1 + "," + y2) && set.contains(x2 + "," + y1)) {
                        ans = Math.min(ans, Math.abs(x1 - x2) * Math.abs(y1 - y2));
                    }
                }
            }
        }
        return ans == Integer.MAX_VALUE ? 0 : ans;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minAreaRect(vector<vector<int>>& points) {
        set<pair<int,int>> ps;
        for (auto& p : points) ps.insert({p[0], p[1]});
        int ans = INT_MAX;
        for (int i = 0; i < (int)points.size(); i++) {
            for (int j = i + 1; j < (int)points.size(); j++) {
                int x1 = points[i][0], y1 = points[i][1];
                int x2 = points[j][0], y2 = points[j][1];
                if (x1 != x2 && y1 != y2) {
                    if (ps.count({x1, y2}) && ps.count({x2, y1})) {
                        ans = min(ans, abs(x1 - x2) * abs(y1 - y2));
                    }
                }
            }
        }
        return ans == INT_MAX ? 0 : ans;
    }
};
$CPP$,'O(n^2)','O(n)');

-- ================================================================
-- 2D-DP (1E, 3M, 2H)
-- ================================================================

-- D1) range-sum-query-2d (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('range-sum-query-2d','2d-dp','Range Sum Query 2D - Immutable','Easy',
$$<p>Given a 2D matrix <code>matrix</code>, handle multiple queries of the form: find the sum of elements inside the rectangle defined by its upper left corner <code>(row1, col1)</code> and lower right corner <code>(row2, col2)</code>. Implement the <code>sumRegion</code> method that returns this sum.</p><p>For simplicity, given a matrix, row1, col1, row2, col2 as separate parameters, return the region sum.</p>$$,
'',ARRAY['Precompute a prefix sum matrix.','prefix[i][j] = sum of all elements in matrix[0..i-1][0..j-1].','Use inclusion-exclusion to answer each query in O(1).'],
'500','https://leetcode.com/problems/range-sum-query-2d-immutable/',
'sumRegion','[{"name":"matrix","type":"List[List[int]]"},{"name":"row1","type":"int"},{"name":"col1","type":"int"},{"name":"row2","type":"int"},{"name":"col2","type":"int"}]'::jsonb,'int',
'[{"inputs":["[[3,0,1,4,2],[5,6,3,2,1],[1,2,0,1,5],[4,1,0,1,7],[1,0,3,0,5]]","2","1","4","3"],"expected":"8"},{"inputs":["[[3,0,1,4,2],[5,6,3,2,1],[1,2,0,1,5],[4,1,0,1,7],[1,0,3,0,5]]","1","1","2","2"],"expected":"11"},{"inputs":["[[3,0,1,4,2],[5,6,3,2,1],[1,2,0,1,5],[4,1,0,1,7],[1,0,3,0,5]]","1","2","2","4"],"expected":"12"},{"inputs":["[[1,2],[3,4]]","0","0","1","1"],"expected":"10"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('range-sum-query-2d','python',$PY$class Solution:
    def sumRegion(self, matrix: List[List[int]], row1: int, col1: int, row2: int, col2: int) -> int:
        $PY$),
('range-sum-query-2d','javascript',$JS$var sumRegion = function(matrix, row1, col1, row2, col2) {

};$JS$),
('range-sum-query-2d','java',$JAVA$class Solution {
    public int sumRegion(int[][] matrix, int row1, int col1, int row2, int col2) {

    }
}$JAVA$),
('range-sum-query-2d','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int sumRegion(vector<vector<int>>& matrix, int row1, int col1, int row2, int col2) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('range-sum-query-2d',1,'2D Prefix Sum',
'Build a 2D prefix sum array so each query can be answered in O(1) using inclusion-exclusion.',
$ALGO$["Build prefix[i+1][j+1] = matrix[i][j] + prefix[i][j+1] + prefix[i+1][j] - prefix[i][j].","For query (r1,c1,r2,c2): return prefix[r2+1][c2+1] - prefix[r1][c2+1] - prefix[r2+1][c1] + prefix[r1][c1]."]$ALGO$::jsonb,
$PY$class Solution:
    def sumRegion(self, matrix: List[List[int]], row1: int, col1: int, row2: int, col2: int) -> int:
        m, n = len(matrix), len(matrix[0])
        prefix = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(m):
            for j in range(n):
                prefix[i+1][j+1] = matrix[i][j] + prefix[i][j+1] + prefix[i+1][j] - prefix[i][j]
        return prefix[row2+1][col2+1] - prefix[row1][col2+1] - prefix[row2+1][col1] + prefix[row1][col1]
$PY$,
$JS$var sumRegion = function(matrix, row1, col1, row2, col2) {
    const m = matrix.length, n = matrix[0].length;
    const prefix = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
    for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++)
            prefix[i+1][j+1] = matrix[i][j] + prefix[i][j+1] + prefix[i+1][j] - prefix[i][j];
    return prefix[row2+1][col2+1] - prefix[row1][col2+1] - prefix[row2+1][col1] + prefix[row1][col1];
};
$JS$,
$JAVA$class Solution {
    public int sumRegion(int[][] matrix, int row1, int col1, int row2, int col2) {
        int m = matrix.length, n = matrix[0].length;
        int[][] prefix = new int[m + 1][n + 1];
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                prefix[i+1][j+1] = matrix[i][j] + prefix[i][j+1] + prefix[i+1][j] - prefix[i][j];
        return prefix[row2+1][col2+1] - prefix[row1][col2+1] - prefix[row2+1][col1] + prefix[row1][col1];
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int sumRegion(vector<vector<int>>& matrix, int row1, int col1, int row2, int col2) {
        int m = matrix.size(), n = matrix[0].size();
        vector<vector<int>> prefix(m + 1, vector<int>(n + 1, 0));
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                prefix[i+1][j+1] = matrix[i][j] + prefix[i][j+1] + prefix[i+1][j] - prefix[i][j];
        return prefix[row2+1][col2+1] - prefix[row1][col2+1] - prefix[row2+1][col1] + prefix[row1][col1];
    }
};
$CPP$,'O(m*n) preprocess, O(1) query','O(m*n)');

-- D2) longest-palindromic-substring-2d (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('longest-palindromic-substring-2d','2d-dp','Longest Palindromic Substring','Medium',
$$<p>Given a string <code>s</code>, return the longest palindromic substring in <code>s</code>.</p>$$,
'',ARRAY['Use a 2D DP table where dp[i][j] indicates s[i..j] is a palindrome.','Base cases: single characters and two equal adjacent characters.','Expand lengths from 3 upward.'],
'500','https://leetcode.com/problems/longest-palindromic-substring/',
'longestPalindrome','[{"name":"s","type":"str"}]'::jsonb,'str',
'[{"inputs":["\"babad\""],"expected":"\"bab\""},{"inputs":["\"cbbd\""],"expected":"\"bb\""},{"inputs":["\"a\""],"expected":"\"a\""},{"inputs":["\"racecar\""],"expected":"\"racecar\""}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('longest-palindromic-substring-2d','python',$PY$class Solution:
    def longestPalindrome(self, s: str) -> str:
        $PY$),
('longest-palindromic-substring-2d','javascript',$JS$var longestPalindrome = function(s) {

};$JS$),
('longest-palindromic-substring-2d','java',$JAVA$class Solution {
    public String longestPalindrome(String s) {

    }
}$JAVA$),
('longest-palindromic-substring-2d','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string longestPalindrome(string s) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('longest-palindromic-substring-2d',1,'2D DP Table',
'Build a boolean table dp[i][j] where True means s[i..j] is a palindrome. Fill shorter lengths first.',
'["Initialize dp[i][i] = true for all i.","For length 2: dp[i][i+1] = (s[i] == s[i+1]).","For length L from 3 to n: dp[i][j] = dp[i+1][j-1] and s[i] == s[j].","Track the start and max length whenever dp[i][j] is true."]'::jsonb,
$PY$class Solution:
    def longestPalindrome(self, s: str) -> str:
        n = len(s)
        dp = [[False] * n for _ in range(n)]
        start, maxLen = 0, 1
        for i in range(n):
            dp[i][i] = True
        for i in range(n - 1):
            if s[i] == s[i + 1]:
                dp[i][i + 1] = True
                start, maxLen = i, 2
        for length in range(3, n + 1):
            for i in range(n - length + 1):
                j = i + length - 1
                if s[i] == s[j] and dp[i + 1][j - 1]:
                    dp[i][j] = True
                    start, maxLen = i, length
        return s[start:start + maxLen]
$PY$,
$JS$var longestPalindrome = function(s) {
    const n = s.length;
    const dp = Array.from({length: n}, () => new Array(n).fill(false));
    let start = 0, maxLen = 1;
    for (let i = 0; i < n; i++) dp[i][i] = true;
    for (let i = 0; i < n - 1; i++) {
        if (s[i] === s[i+1]) { dp[i][i+1] = true; start = i; maxLen = 2; }
    }
    for (let len = 3; len <= n; len++) {
        for (let i = 0; i <= n - len; i++) {
            const j = i + len - 1;
            if (s[i] === s[j] && dp[i+1][j-1]) { dp[i][j] = true; start = i; maxLen = len; }
        }
    }
    return s.substring(start, start + maxLen);
};
$JS$,
$JAVA$class Solution {
    public String longestPalindrome(String s) {
        int n = s.length();
        boolean[][] dp = new boolean[n][n];
        int start = 0, maxLen = 1;
        for (int i = 0; i < n; i++) dp[i][i] = true;
        for (int i = 0; i < n - 1; i++) {
            if (s.charAt(i) == s.charAt(i+1)) { dp[i][i+1] = true; start = i; maxLen = 2; }
        }
        for (int len = 3; len <= n; len++) {
            for (int i = 0; i <= n - len; i++) {
                int j = i + len - 1;
                if (s.charAt(i) == s.charAt(j) && dp[i+1][j-1]) { dp[i][j] = true; start = i; maxLen = len; }
            }
        }
        return s.substring(start, start + maxLen);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    string longestPalindrome(string s) {
        int n = s.size(), start = 0, maxLen = 1;
        vector<vector<bool>> dp(n, vector<bool>(n, false));
        for (int i = 0; i < n; i++) dp[i][i] = true;
        for (int i = 0; i < n - 1; i++) {
            if (s[i] == s[i+1]) { dp[i][i+1] = true; start = i; maxLen = 2; }
        }
        for (int len = 3; len <= n; len++) {
            for (int i = 0; i <= n - len; i++) {
                int j = i + len - 1;
                if (s[i] == s[j] && dp[i+1][j-1]) { dp[i][j] = true; start = i; maxLen = len; }
            }
        }
        return s.substr(start, maxLen);
    }
};
$CPP$,'O(n^2)','O(n^2)');

-- D3) maximal-square-2d (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('maximal-square-2d','2d-dp','Maximal Square','Medium',
$$<p>Given an <code>m x n</code> binary matrix <code>matrix</code> filled with <code>0</code>s and <code>1</code>s, find the largest square containing only <code>1</code>s and return its area.</p>$$,
'',ARRAY['dp[i][j] = side length of largest square with bottom-right corner at (i,j).','If matrix[i][j] == 1: dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1.','Track the maximum side length.'],
'500','https://leetcode.com/problems/maximal-square/',
'maximalSquare','[{"name":"matrix","type":"List[List[str]]"}]'::jsonb,'int',
'[{"inputs":["[[\"1\",\"0\",\"1\",\"0\",\"0\"],[\"1\",\"0\",\"1\",\"1\",\"1\"],[\"1\",\"1\",\"1\",\"1\",\"1\"],[\"1\",\"0\",\"0\",\"1\",\"0\"]]"],"expected":"4"},{"inputs":["[[\"0\",\"1\"],[\"1\",\"0\"]]"],"expected":"1"},{"inputs":["[[\"0\"]]"],"expected":"0"},{"inputs":["[[\"1\",\"1\"],[\"1\",\"1\"]]"],"expected":"4"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('maximal-square-2d','python',$PY$class Solution:
    def maximalSquare(self, matrix: List[List[str]]) -> int:
        $PY$),
('maximal-square-2d','javascript',$JS$var maximalSquare = function(matrix) {

};$JS$),
('maximal-square-2d','java',$JAVA$class Solution {
    public int maximalSquare(char[][] matrix) {

    }
}$JAVA$),
('maximal-square-2d','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maximalSquare(vector<vector<char>>& matrix) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('maximal-square-2d',1,'2D DP',
'Each cell stores the side length of the largest all-1 square ending at that cell. The recurrence looks at the top, left, and top-left neighbors.',
'["Create a DP table of size (m+1) x (n+1) initialized to 0.","For each cell (i,j) with matrix[i-1][j-1] == 1: dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1.","Track the maximum value in dp.","Return maxSide * maxSide."]'::jsonb,
$PY$class Solution:
    def maximalSquare(self, matrix: List[List[str]]) -> int:
        m, n = len(matrix), len(matrix[0])
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        maxSide = 0
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if matrix[i-1][j-1] == '1':
                    dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1
                    maxSide = max(maxSide, dp[i][j])
        return maxSide * maxSide
$PY$,
$JS$var maximalSquare = function(matrix) {
    const m = matrix.length, n = matrix[0].length;
    const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
    let maxSide = 0;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (matrix[i-1][j-1] === '1') {
                dp[i][j] = Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1;
                maxSide = Math.max(maxSide, dp[i][j]);
            }
        }
    }
    return maxSide * maxSide;
};
$JS$,
$JAVA$class Solution {
    public int maximalSquare(char[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        int[][] dp = new int[m + 1][n + 1];
        int maxSide = 0;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (matrix[i-1][j-1] == '1') {
                    dp[i][j] = Math.min(Math.min(dp[i-1][j], dp[i][j-1]), dp[i-1][j-1]) + 1;
                    maxSide = Math.max(maxSide, dp[i][j]);
                }
            }
        }
        return maxSide * maxSide;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int maximalSquare(vector<vector<char>>& matrix) {
        int m = matrix.size(), n = matrix[0].size(), maxSide = 0;
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (matrix[i-1][j-1] == '1') {
                    dp[i][j] = min({dp[i-1][j], dp[i][j-1], dp[i-1][j-1]}) + 1;
                    maxSide = max(maxSide, dp[i][j]);
                }
            }
        }
        return maxSide * maxSide;
    }
};
$CPP$,'O(m*n)','O(m*n)');

-- D4) dungeon-game-2d (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('dungeon-game-2d','2d-dp','Dungeon Game','Medium',
$$<p>A knight starts at the top-left corner of a <code>m x n</code> grid <code>dungeon</code> and must reach the bottom-right princess. Each cell has an integer that increases (positive) or decreases (negative) the knight''s health. The knight dies if his health drops to 0 or below at any point. Return the minimum initial health needed so the knight can reach the princess.</p>$$,
'',ARRAY['Work backwards from the bottom-right corner.','dp[i][j] = minimum health needed at (i,j) to reach the princess.','At each cell, the knight needs at least 1 HP after applying the cell value.'],
'500','https://leetcode.com/problems/dungeon-game/',
'calculateMinimumHP','[{"name":"dungeon","type":"List[List[int]]"}]'::jsonb,'int',
'[{"inputs":["[[-2,-3,3],[-5,-10,1],[10,30,-5]]"],"expected":"7"},{"inputs":["[[0]]"],"expected":"1"},{"inputs":["[[100]]"],"expected":"1"},{"inputs":["[[-3,5],[-10,1]]"],"expected":"8"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('dungeon-game-2d','python',$PY$class Solution:
    def calculateMinimumHP(self, dungeon: List[List[int]]) -> int:
        $PY$),
('dungeon-game-2d','javascript',$JS$var calculateMinimumHP = function(dungeon) {

};$JS$),
('dungeon-game-2d','java',$JAVA$class Solution {
    public int calculateMinimumHP(int[][] dungeon) {

    }
}$JAVA$),
('dungeon-game-2d','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int calculateMinimumHP(vector<vector<int>>& dungeon) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('dungeon-game-2d',1,'Bottom-Up DP',
'Process from princess back to start. At each cell, compute the minimum HP needed to survive that cell and still reach the end.',
$ALGO$["Initialize dp[m-1][n-1] = max(1, 1 - dungeon[m-1][n-1]).","Fill last row and last column: dp[i][j] = max(1, dp[next] - dungeon[i][j]).","For other cells: dp[i][j] = max(1, min(dp[i+1][j], dp[i][j+1]) - dungeon[i][j]).","Return dp[0][0]."]$ALGO$::jsonb,
$PY$class Solution:
    def calculateMinimumHP(self, dungeon: List[List[int]]) -> int:
        m, n = len(dungeon), len(dungeon[0])
        dp = [[0] * n for _ in range(m)]
        dp[m-1][n-1] = max(1, 1 - dungeon[m-1][n-1])
        for i in range(m - 2, -1, -1):
            dp[i][n-1] = max(1, dp[i+1][n-1] - dungeon[i][n-1])
        for j in range(n - 2, -1, -1):
            dp[m-1][j] = max(1, dp[m-1][j+1] - dungeon[m-1][j])
        for i in range(m - 2, -1, -1):
            for j in range(n - 2, -1, -1):
                dp[i][j] = max(1, min(dp[i+1][j], dp[i][j+1]) - dungeon[i][j])
        return dp[0][0]
$PY$,
$JS$var calculateMinimumHP = function(dungeon) {
    const m = dungeon.length, n = dungeon[0].length;
    const dp = Array.from({length: m}, () => new Array(n).fill(0));
    dp[m-1][n-1] = Math.max(1, 1 - dungeon[m-1][n-1]);
    for (let i = m - 2; i >= 0; i--) dp[i][n-1] = Math.max(1, dp[i+1][n-1] - dungeon[i][n-1]);
    for (let j = n - 2; j >= 0; j--) dp[m-1][j] = Math.max(1, dp[m-1][j+1] - dungeon[m-1][j]);
    for (let i = m - 2; i >= 0; i--)
        for (let j = n - 2; j >= 0; j--)
            dp[i][j] = Math.max(1, Math.min(dp[i+1][j], dp[i][j+1]) - dungeon[i][j]);
    return dp[0][0];
};
$JS$,
$JAVA$class Solution {
    public int calculateMinimumHP(int[][] dungeon) {
        int m = dungeon.length, n = dungeon[0].length;
        int[][] dp = new int[m][n];
        dp[m-1][n-1] = Math.max(1, 1 - dungeon[m-1][n-1]);
        for (int i = m - 2; i >= 0; i--) dp[i][n-1] = Math.max(1, dp[i+1][n-1] - dungeon[i][n-1]);
        for (int j = n - 2; j >= 0; j--) dp[m-1][j] = Math.max(1, dp[m-1][j+1] - dungeon[m-1][j]);
        for (int i = m - 2; i >= 0; i--)
            for (int j = n - 2; j >= 0; j--)
                dp[i][j] = Math.max(1, Math.min(dp[i+1][j], dp[i][j+1]) - dungeon[i][j]);
        return dp[0][0];
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int calculateMinimumHP(vector<vector<int>>& dungeon) {
        int m = dungeon.size(), n = dungeon[0].size();
        vector<vector<int>> dp(m, vector<int>(n, 0));
        dp[m-1][n-1] = max(1, 1 - dungeon[m-1][n-1]);
        for (int i = m - 2; i >= 0; i--) dp[i][n-1] = max(1, dp[i+1][n-1] - dungeon[i][n-1]);
        for (int j = n - 2; j >= 0; j--) dp[m-1][j] = max(1, dp[m-1][j+1] - dungeon[m-1][j]);
        for (int i = m - 2; i >= 0; i--)
            for (int j = n - 2; j >= 0; j--)
                dp[i][j] = max(1, min(dp[i+1][j], dp[i][j+1]) - dungeon[i][j]);
        return dp[0][0];
    }
};
$CPP$,'O(m*n)','O(m*n)');

-- D5) cherry-pickup-ii (Hard)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('cherry-pickup-ii','2d-dp','Cherry Pickup II','Hard',
$$<p>You are given a <code>rows x cols</code> grid representing a field of cherries where <code>grid[i][j]</code> represents the number of cherries. You have two robots starting at <code>(0, 0)</code> and <code>(0, cols-1)</code>. Each robot moves down one row per step and can go left-down, straight-down, or right-down. Both robots move simultaneously. If both robots are at the same cell, only one collects. Return the maximum cherries collected by both robots.</p>$$,
'',ARRAY['Use DP with state (row, col1, col2) for positions of both robots.','At each row, each robot has 3 choices, giving 9 transitions.','If col1 == col2, only count cherries once.'],
'500','https://leetcode.com/problems/cherry-pickup-ii/',
'cherryPickup','[{"name":"grid","type":"List[List[int]]"}]'::jsonb,'int',
'[{"inputs":["[[3,1,1],[2,5,1],[1,5,5],[2,1,1]]"],"expected":"24"},{"inputs":["[[1,0,0,0,0,0,1],[2,0,0,0,0,3,0],[2,0,9,0,0,0,0],[0,3,0,5,4,0,0],[1,0,2,3,0,0,6]]"],"expected":"28"},{"inputs":["[[1,1],[1,1]]"],"expected":"4"},{"inputs":["[[0]]"],"expected":"0"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('cherry-pickup-ii','python',$PY$class Solution:
    def cherryPickup(self, grid: List[List[int]]) -> int:
        $PY$),
('cherry-pickup-ii','javascript',$JS$var cherryPickup = function(grid) {

};$JS$),
('cherry-pickup-ii','java',$JAVA$class Solution {
    public int cherryPickup(int[][] grid) {

    }
}$JAVA$),
('cherry-pickup-ii','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int cherryPickup(vector<vector<int>>& grid) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('cherry-pickup-ii',1,'3D DP',
'Track both robots simultaneously. State is (row, col1, col2). Process row by row, trying all 9 combinations of moves.',
$ALGO$["Initialize dp[0][c1][c2] for c1=0, c2=cols-1.","For each subsequent row, for each (c1, c2) pair, try all 9 move combos.","Cherries = grid[r][c1] + (grid[r][c2] if c1 != c2 else 0).","Return the max value in the last row of dp."]$ALGO$::jsonb,
$PY$class Solution:
    def cherryPickup(self, grid: List[List[int]]) -> int:
        rows, cols = len(grid), len(grid[0])
        dp = [[[-1] * cols for _ in range(cols)] for _ in range(rows)]
        dp[0][0][cols - 1] = grid[0][0] + grid[0][cols - 1] if cols > 1 else grid[0][0]
        for r in range(1, rows):
            for c1 in range(min(r + 1, cols)):
                for c2 in range(max(0, cols - 1 - r), cols):
                    best = -1
                    for dc1 in [-1, 0, 1]:
                        for dc2 in [-1, 0, 1]:
                            pc1, pc2 = c1 - dc1, c2 - dc2
                            if 0 <= pc1 < cols and 0 <= pc2 < cols and dp[r-1][pc1][pc2] >= 0:
                                best = max(best, dp[r-1][pc1][pc2])
                    if best >= 0:
                        cherries = grid[r][c1] + (grid[r][c2] if c1 != c2 else 0)
                        dp[r][c1][c2] = best + cherries
        ans = 0
        for c1 in range(cols):
            for c2 in range(cols):
                ans = max(ans, dp[rows-1][c1][c2])
        return ans
$PY$,
$JS$var cherryPickup = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let prev = Array.from({length: cols}, () => new Array(cols).fill(-1));
    prev[0][cols - 1] = cols > 1 ? grid[0][0] + grid[0][cols - 1] : grid[0][0];
    for (let r = 1; r < rows; r++) {
        const curr = Array.from({length: cols}, () => new Array(cols).fill(-1));
        for (let c1 = 0; c1 < cols; c1++) {
            for (let c2 = 0; c2 < cols; c2++) {
                let best = -1;
                for (let d1 = -1; d1 <= 1; d1++) {
                    for (let d2 = -1; d2 <= 1; d2++) {
                        const p1 = c1 - d1, p2 = c2 - d2;
                        if (p1 >= 0 && p1 < cols && p2 >= 0 && p2 < cols && prev[p1][p2] >= 0)
                            best = Math.max(best, prev[p1][p2]);
                    }
                }
                if (best >= 0) {
                    const ch = grid[r][c1] + (c1 !== c2 ? grid[r][c2] : 0);
                    curr[c1][c2] = best + ch;
                }
            }
        }
        prev = curr;
    }
    let ans = 0;
    for (let c1 = 0; c1 < cols; c1++)
        for (let c2 = 0; c2 < cols; c2++)
            ans = Math.max(ans, prev[c1][c2]);
    return ans;
};
$JS$,
$JAVA$class Solution {
    public int cherryPickup(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        int[][] prev = new int[cols][cols];
        for (int[] row : prev) Arrays.fill(row, -1);
        prev[0][cols - 1] = cols > 1 ? grid[0][0] + grid[0][cols - 1] : grid[0][0];
        for (int r = 1; r < rows; r++) {
            int[][] curr = new int[cols][cols];
            for (int[] row : curr) Arrays.fill(row, -1);
            for (int c1 = 0; c1 < cols; c1++) {
                for (int c2 = 0; c2 < cols; c2++) {
                    int best = -1;
                    for (int d1 = -1; d1 <= 1; d1++) {
                        for (int d2 = -1; d2 <= 1; d2++) {
                            int p1 = c1 - d1, p2 = c2 - d2;
                            if (p1 >= 0 && p1 < cols && p2 >= 0 && p2 < cols && prev[p1][p2] >= 0)
                                best = Math.max(best, prev[p1][p2]);
                        }
                    }
                    if (best >= 0) {
                        int ch = grid[r][c1] + (c1 != c2 ? grid[r][c2] : 0);
                        curr[c1][c2] = best + ch;
                    }
                }
            }
            prev = curr;
        }
        int ans = 0;
        for (int c1 = 0; c1 < cols; c1++)
            for (int c2 = 0; c2 < cols; c2++)
                ans = Math.max(ans, prev[c1][c2]);
        return ans;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int cherryPickup(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        vector<vector<int>> prev(cols, vector<int>(cols, -1));
        prev[0][cols - 1] = cols > 1 ? grid[0][0] + grid[0][cols - 1] : grid[0][0];
        for (int r = 1; r < rows; r++) {
            vector<vector<int>> curr(cols, vector<int>(cols, -1));
            for (int c1 = 0; c1 < cols; c1++) {
                for (int c2 = 0; c2 < cols; c2++) {
                    int best = -1;
                    for (int d1 = -1; d1 <= 1; d1++) {
                        for (int d2 = -1; d2 <= 1; d2++) {
                            int p1 = c1 - d1, p2 = c2 - d2;
                            if (p1 >= 0 && p1 < cols && p2 >= 0 && p2 < cols && prev[p1][p2] >= 0)
                                best = max(best, prev[p1][p2]);
                        }
                    }
                    if (best >= 0) {
                        int ch = grid[r][c1] + (c1 != c2 ? grid[r][c2] : 0);
                        curr[c1][c2] = best + ch;
                    }
                }
            }
            prev = curr;
        }
        int ans = 0;
        for (int c1 = 0; c1 < cols; c1++)
            for (int c2 = 0; c2 < cols; c2++)
                ans = max(ans, prev[c1][c2]);
        return ans;
    }
};
$CPP$,'O(rows * cols^2 * 9)','O(cols^2)');

-- D6) edit-distance-2d (Hard)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('edit-distance-2d','2d-dp','Edit Distance','Hard',
$$<p>Given two strings <code>word1</code> and <code>word2</code>, return the minimum number of operations required to convert <code>word1</code> to <code>word2</code>. You have three operations: insert a character, delete a character, or replace a character.</p>$$,
'',ARRAY['Use a 2D DP table where dp[i][j] is the edit distance between word1[:i] and word2[:j].','If characters match, dp[i][j] = dp[i-1][j-1].','Otherwise, dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]).'],
'500','https://leetcode.com/problems/edit-distance/',
'minDistance','[{"name":"word1","type":"str"},{"name":"word2","type":"str"}]'::jsonb,'int',
'[{"inputs":["\"horse\"","\"ros\""],"expected":"3"},{"inputs":["\"intention\"","\"execution\""],"expected":"5"},{"inputs":["\"\"","\"abc\""],"expected":"3"},{"inputs":["\"abc\"","\"abc\""],"expected":"0"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('edit-distance-2d','python',$PY$class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        $PY$),
('edit-distance-2d','javascript',$JS$var minDistance = function(word1, word2) {

};$JS$),
('edit-distance-2d','java',$JAVA$class Solution {
    public int minDistance(String word1, String word2) {

    }
}$JAVA$),
('edit-distance-2d','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minDistance(string word1, string word2) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('edit-distance-2d',1,'2D DP Table',
'Build a table where dp[i][j] represents the minimum edits to transform word1[:i] into word2[:j]. Each cell depends on three neighbors.',
'["Initialize dp[i][0] = i and dp[0][j] = j (base cases: all inserts or deletes).","For each (i,j): if word1[i-1] == word2[j-1], dp[i][j] = dp[i-1][j-1].","Else dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]).","Return dp[m][n]."]'::jsonb,
$PY$class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        m, n = len(word1), len(word2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(m + 1):
            dp[i][0] = i
        for j in range(n + 1):
            dp[0][j] = j
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if word1[i-1] == word2[j-1]:
                    dp[i][j] = dp[i-1][j-1]
                else:
                    dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
        return dp[m][n]
$PY$,
$JS$var minDistance = function(word1, word2) {
    const m = word1.length, n = word2.length;
    const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (word1[i-1] === word2[j-1]) dp[i][j] = dp[i-1][j-1];
            else dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
        }
    }
    return dp[m][n];
};
$JS$,
$JAVA$class Solution {
    public int minDistance(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1.charAt(i-1) == word2.charAt(j-1)) dp[i][j] = dp[i-1][j-1];
                else dp[i][j] = 1 + Math.min(Math.min(dp[i-1][j], dp[i][j-1]), dp[i-1][j-1]);
            }
        }
        return dp[m][n];
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minDistance(string word1, string word2) {
        int m = word1.size(), n = word2.size();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1[i-1] == word2[j-1]) dp[i][j] = dp[i-1][j-1];
                else dp[i][j] = 1 + min({dp[i-1][j], dp[i][j-1], dp[i-1][j-1]});
            }
        }
        return dp[m][n];
    }
};
$CPP$,'O(m*n)','O(m*n)');

-- ================================================================
-- LINKED LIST (2E, 3M, 1H)
-- ================================================================

-- L1) remove-duplicates-from-sorted-list (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('remove-duplicates-from-sorted-list','linkedlist','Remove Duplicates from Sorted List','Easy',
$$<p>Given the <code>head</code> of a sorted linked list, delete all duplicates such that each element appears only once. Return the linked list sorted as well.</p>$$,
'',ARRAY['Since the list is sorted, duplicates are adjacent.','Compare each node with its next node.','Skip over duplicate nodes by updating pointers.'],
'500','https://leetcode.com/problems/remove-duplicates-from-sorted-list/',
'deleteDuplicates','[{"name":"head","type":"Optional[ListNode]"}]'::jsonb,'Optional[ListNode]',
'[{"inputs":["[1,1,2]"],"expected":"[1,2]"},{"inputs":["[1,1,2,3,3]"],"expected":"[1,2,3]"},{"inputs":["[1]"],"expected":"[1]"},{"inputs":["[1,1,1]"],"expected":"[1]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('remove-duplicates-from-sorted-list','python',$PY$class Solution:
    def deleteDuplicates(self, head: Optional[ListNode]) -> Optional[ListNode]:
        $PY$),
('remove-duplicates-from-sorted-list','javascript',$JS$var deleteDuplicates = function(head) {

};$JS$),
('remove-duplicates-from-sorted-list','java',$JAVA$class Solution {
    public ListNode deleteDuplicates(ListNode head) {

    }
}$JAVA$),
('remove-duplicates-from-sorted-list','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    ListNode* deleteDuplicates(ListNode* head) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('remove-duplicates-from-sorted-list',1,'Single Pass',
'Walk through the sorted list. Whenever current.val == current.next.val, skip the next node.',
'["Start with current = head.","While current and current.next exist: if values match, skip next node; else advance current.","Return head."]'::jsonb,
$PY$class Solution:
    def deleteDuplicates(self, head: Optional[ListNode]) -> Optional[ListNode]:
        curr = head
        while curr and curr.next:
            if curr.val == curr.next.val:
                curr.next = curr.next.next
            else:
                curr = curr.next
        return head
$PY$,
$JS$var deleteDuplicates = function(head) {
    let curr = head;
    while (curr && curr.next) {
        if (curr.val === curr.next.val) curr.next = curr.next.next;
        else curr = curr.next;
    }
    return head;
};
$JS$,
$JAVA$class Solution {
    public ListNode deleteDuplicates(ListNode head) {
        ListNode curr = head;
        while (curr != null && curr.next != null) {
            if (curr.val == curr.next.val) curr.next = curr.next.next;
            else curr = curr.next;
        }
        return head;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    ListNode* deleteDuplicates(ListNode* head) {
        ListNode* curr = head;
        while (curr && curr->next) {
            if (curr->val == curr->next->val) curr->next = curr->next->next;
            else curr = curr->next;
        }
        return head;
    }
};
$CPP$,'O(n)','O(1)');

-- L2) linked-list-cycle-detection (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('linked-list-cycle-detection','linkedlist','Linked List Cycle','Easy',
$$<p>Given the <code>head</code> of a linked list, determine if the linked list has a cycle in it. Return <code>true</code> if there is a cycle, <code>false</code> otherwise.</p><p>For this problem, the input is a regular list (no cycle) and you should return false. Cycle detection is tested via the algorithm logic.</p>$$,
'',ARRAY['Use two pointers: slow moves one step, fast moves two steps.','If they meet, there is a cycle.','If fast reaches null, there is no cycle.'],
'500','https://leetcode.com/problems/linked-list-cycle/',
'hasCycle','[{"name":"head","type":"Optional[ListNode]"}]'::jsonb,'bool',
'[{"inputs":["[3,2,0,-4]"],"expected":"false"},{"inputs":["[1,2]"],"expected":"false"},{"inputs":["[1]"],"expected":"false"},{"inputs":["[]"],"expected":"false"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('linked-list-cycle-detection','python',$PY$class Solution:
    def hasCycle(self, head: Optional[ListNode]) -> bool:
        $PY$),
('linked-list-cycle-detection','javascript',$JS$var hasCycle = function(head) {

};$JS$),
('linked-list-cycle-detection','java',$JAVA$class Solution {
    public boolean hasCycle(ListNode head) {

    }
}$JAVA$),
('linked-list-cycle-detection','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool hasCycle(ListNode* head) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('linked-list-cycle-detection',1,'Floyd Cycle Detection',
'Use slow and fast pointers. If they meet, a cycle exists. If fast reaches the end, no cycle.',
'["Initialize slow and fast to head.","Move slow by 1, fast by 2.","If slow == fast, return true.","If fast reaches null, return false."]'::jsonb,
$PY$class Solution:
    def hasCycle(self, head: Optional[ListNode]) -> bool:
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow == fast:
                return True
        return False
$PY$,
$JS$var hasCycle = function(head) {
    let slow = head, fast = head;
    while (fast && fast.next) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow === fast) return true;
    }
    return false;
};
$JS$,
$JAVA$class Solution {
    public boolean hasCycle(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool hasCycle(ListNode* head) {
        ListNode* slow = head;
        ListNode* fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
            if (slow == fast) return true;
        }
        return false;
    }
};
$CPP$,'O(n)','O(1)');

-- L3) remove-duplicates-from-sorted-list-ii (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('remove-duplicates-from-sorted-list-ii','linkedlist','Remove Duplicates from Sorted List II','Medium',
$$<p>Given the <code>head</code> of a sorted linked list, delete all nodes that have duplicate numbers, leaving only distinct numbers from the original list. Return the linked list sorted as well.</p>$$,
'',ARRAY['Use a dummy node before head to handle edge cases.','When you find duplicates, skip all nodes with that value.','Use a prev pointer to reconnect the list.'],
'500','https://leetcode.com/problems/remove-duplicates-from-sorted-list-ii/',
'deleteDuplicatesII','[{"name":"head","type":"Optional[ListNode]"}]'::jsonb,'Optional[ListNode]',
'[{"inputs":["[1,2,3,3,4,4,5]"],"expected":"[1,2,5]"},{"inputs":["[1,1,1,2,3]"],"expected":"[2,3]"},{"inputs":["[1,1]"],"expected":"[]"},{"inputs":["[1,2,3]"],"expected":"[1,2,3]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('remove-duplicates-from-sorted-list-ii','python',$PY$class Solution:
    def deleteDuplicatesII(self, head: Optional[ListNode]) -> Optional[ListNode]:
        $PY$),
('remove-duplicates-from-sorted-list-ii','javascript',$JS$var deleteDuplicatesII = function(head) {

};$JS$),
('remove-duplicates-from-sorted-list-ii','java',$JAVA$class Solution {
    public ListNode deleteDuplicatesII(ListNode head) {

    }
}$JAVA$),
('remove-duplicates-from-sorted-list-ii','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    ListNode* deleteDuplicatesII(ListNode* head) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('remove-duplicates-from-sorted-list-ii',1,'Dummy Node + Skip',
'Use a dummy head. For each group of duplicate values, skip the entire group. Only keep nodes that appear exactly once.',
'["Create a dummy node pointing to head. Set prev = dummy.","While prev.next and prev.next.next exist: if values are equal, skip all nodes with that value; else advance prev.","Return dummy.next."]'::jsonb,
$PY$class Solution:
    def deleteDuplicatesII(self, head: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0, head)
        prev = dummy
        while prev.next and prev.next.next:
            if prev.next.val == prev.next.next.val:
                dup = prev.next.val
                while prev.next and prev.next.val == dup:
                    prev.next = prev.next.next
            else:
                prev = prev.next
        return dummy.next
$PY$,
$JS$var deleteDuplicatesII = function(head) {
    const dummy = {val: 0, next: head};
    let prev = dummy;
    while (prev.next && prev.next.next) {
        if (prev.next.val === prev.next.next.val) {
            const dup = prev.next.val;
            while (prev.next && prev.next.val === dup) prev.next = prev.next.next;
        } else {
            prev = prev.next;
        }
    }
    return dummy.next;
};
$JS$,
$JAVA$class Solution {
    public ListNode deleteDuplicatesII(ListNode head) {
        ListNode dummy = new ListNode(0, head);
        ListNode prev = dummy;
        while (prev.next != null && prev.next.next != null) {
            if (prev.next.val == prev.next.next.val) {
                int dup = prev.next.val;
                while (prev.next != null && prev.next.val == dup) prev.next = prev.next.next;
            } else {
                prev = prev.next;
            }
        }
        return dummy.next;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    ListNode* deleteDuplicatesII(ListNode* head) {
        ListNode dummy(0, head);
        ListNode* prev = &dummy;
        while (prev->next && prev->next->next) {
            if (prev->next->val == prev->next->next->val) {
                int dup = prev->next->val;
                while (prev->next && prev->next->val == dup) prev->next = prev->next->next;
            } else {
                prev = prev->next;
            }
        }
        return dummy.next;
    }
};
$CPP$,'O(n)','O(1)');

-- L4) insertion-sort-list (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('insertion-sort-list','linkedlist','Insertion Sort List','Medium',
$$<p>Given the <code>head</code> of a singly linked list, sort the list using insertion sort, and return the sorted list''s head.</p>$$,
'',ARRAY['Use a dummy node to build the sorted portion.','For each node in the original list, find the correct position in the sorted list.','Insert the node there and continue.'],
'500','https://leetcode.com/problems/insertion-sort-list/',
'insertionSortList','[{"name":"head","type":"Optional[ListNode]"}]'::jsonb,'Optional[ListNode]',
'[{"inputs":["[4,2,1,3]"],"expected":"[1,2,3,4]"},{"inputs":["[-1,5,3,4,0]"],"expected":"[-1,0,3,4,5]"},{"inputs":["[1]"],"expected":"[1]"},{"inputs":["[3,1]"],"expected":"[1,3]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('insertion-sort-list','python',$PY$class Solution:
    def insertionSortList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        $PY$),
('insertion-sort-list','javascript',$JS$var insertionSortList = function(head) {

};$JS$),
('insertion-sort-list','java',$JAVA$class Solution {
    public ListNode insertionSortList(ListNode head) {

    }
}$JAVA$),
('insertion-sort-list','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    ListNode* insertionSortList(ListNode* head) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('insertion-sort-list',1,'Dummy Head Insertion',
'Maintain a sorted portion using a dummy head. For each unsorted node, scan the sorted portion to find where it belongs and insert it.',
'["Create a dummy node as the start of the sorted list.","For each node in the original list, detach it.","Walk the sorted list to find the insertion point.","Insert the node and continue with the next unsorted node."]'::jsonb,
$PY$class Solution:
    def insertionSortList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0)
        curr = head
        while curr:
            nxt = curr.next
            prev = dummy
            while prev.next and prev.next.val < curr.val:
                prev = prev.next
            curr.next = prev.next
            prev.next = curr
            curr = nxt
        return dummy.next
$PY$,
$JS$var insertionSortList = function(head) {
    const dummy = {val: 0, next: null};
    let curr = head;
    while (curr) {
        const nxt = curr.next;
        let prev = dummy;
        while (prev.next && prev.next.val < curr.val) prev = prev.next;
        curr.next = prev.next;
        prev.next = curr;
        curr = nxt;
    }
    return dummy.next;
};
$JS$,
$JAVA$class Solution {
    public ListNode insertionSortList(ListNode head) {
        ListNode dummy = new ListNode(0);
        ListNode curr = head;
        while (curr != null) {
            ListNode nxt = curr.next;
            ListNode prev = dummy;
            while (prev.next != null && prev.next.val < curr.val) prev = prev.next;
            curr.next = prev.next;
            prev.next = curr;
            curr = nxt;
        }
        return dummy.next;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    ListNode* insertionSortList(ListNode* head) {
        ListNode dummy(0);
        ListNode* curr = head;
        while (curr) {
            ListNode* nxt = curr->next;
            ListNode* prev = &dummy;
            while (prev->next && prev->next->val < curr->val) prev = prev->next;
            curr->next = prev->next;
            prev->next = curr;
            curr = nxt;
        }
        return dummy.next;
    }
};
$CPP$,'O(n^2)','O(1)');

-- L5) split-linked-list-in-parts (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('split-linked-list-in-parts','linkedlist','Split Linked List in Parts','Medium',
$$<p>Given the <code>head</code> of a singly linked list and an integer <code>k</code>, split the linked list into <code>k</code> consecutive parts. The length of each part should be as equal as possible: no two parts should have a size differing by more than one. Earlier parts should be larger. Return an array of the <code>k</code> parts as lists.</p><p>For this version, return a list of lists of integers representing each part.</p>$$,
'',ARRAY['First count the total length n.','Each part has base size n/k, and the first n%k parts get one extra node.','Iterate through, cutting the list at each boundary.'],
'500','https://leetcode.com/problems/split-linked-list-in-parts/',
'splitListToParts','[{"name":"head","type":"Optional[ListNode]"},{"name":"k","type":"int"}]'::jsonb,'List[List[int]]',
'[{"inputs":["[1,2,3]","5"],"expected":"[[1],[2],[3],[],[]]"},{"inputs":["[1,2,3,4,5,6,7,8,9,10]","3"],"expected":"[[1,2,3,4],[5,6,7],[8,9,10]]"},{"inputs":["[1,2,3]","3"],"expected":"[[1],[2],[3]]"},{"inputs":["[1,2,3,4]","2"],"expected":"[[1,2],[3,4]]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('split-linked-list-in-parts','python',$PY$class Solution:
    def splitListToParts(self, head: Optional[ListNode], k: int) -> List[List[int]]:
        $PY$),
('split-linked-list-in-parts','javascript',$JS$var splitListToParts = function(head, k) {

};$JS$),
('split-linked-list-in-parts','java',$JAVA$class Solution {
    public List<List<Integer>> splitListToParts(ListNode head, int k) {

    }
}$JAVA$),
('split-linked-list-in-parts','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> splitListToParts(ListNode* head, int k) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('split-linked-list-in-parts',1,'Count and Split',
'Count the total length, then compute base size and remainder. Each of the first remainder parts gets one extra element.',
'["Count the total length n.","base = n // k, remainder = n % k.","For each of the k parts, take base + (1 if i < remainder else 0) nodes.","Collect node values into a list for each part."]'::jsonb,
$PY$class Solution:
    def splitListToParts(self, head: Optional[ListNode], k: int) -> List[List[int]]:
        n = 0
        curr = head
        while curr:
            n += 1
            curr = curr.next
        base, remainder = divmod(n, k)
        result = []
        curr = head
        for i in range(k):
            part = []
            size = base + (1 if i < remainder else 0)
            for _ in range(size):
                part.append(curr.val)
                curr = curr.next
            result.append(part)
        return result
$PY$,
$JS$var splitListToParts = function(head, k) {
    let n = 0, curr = head;
    while (curr) { n++; curr = curr.next; }
    const base = Math.floor(n / k), remainder = n % k;
    const result = [];
    curr = head;
    for (let i = 0; i < k; i++) {
        const part = [];
        const size = base + (i < remainder ? 1 : 0);
        for (let j = 0; j < size; j++) {
            part.push(curr.val);
            curr = curr.next;
        }
        result.push(part);
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> splitListToParts(ListNode head, int k) {
        int n = 0;
        ListNode curr = head;
        while (curr != null) { n++; curr = curr.next; }
        int base = n / k, remainder = n % k;
        List<List<Integer>> result = new ArrayList<>();
        curr = head;
        for (int i = 0; i < k; i++) {
            List<Integer> part = new ArrayList<>();
            int size = base + (i < remainder ? 1 : 0);
            for (int j = 0; j < size; j++) {
                part.add(curr.val);
                curr = curr.next;
            }
            result.add(part);
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<int>> splitListToParts(ListNode* head, int k) {
        int n = 0;
        ListNode* curr = head;
        while (curr) { n++; curr = curr->next; }
        int base = n / k, remainder = n % k;
        vector<vector<int>> result;
        curr = head;
        for (int i = 0; i < k; i++) {
            vector<int> part;
            int size = base + (i < remainder ? 1 : 0);
            for (int j = 0; j < size; j++) {
                part.push_back(curr->val);
                curr = curr->next;
            }
            result.push_back(part);
        }
        return result;
    }
};
$CPP$,'O(n + k)','O(k)');

-- L6) reverse-nodes-in-k-group-500 (Hard)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('reverse-nodes-in-k-group-500','linkedlist','Reverse Nodes in k-Group','Hard',
$$<p>Given the <code>head</code> of a linked list, reverse the nodes of the list <code>k</code> at a time, and return the modified list. <code>k</code> is a positive integer and is less than or equal to the length of the linked list. If the number of nodes is not a multiple of <code>k</code>, the remaining nodes at the end should stay as-is.</p>$$,
'',ARRAY['First check if there are at least k nodes remaining.','Reverse the next k nodes.','Recursively process the rest and connect.'],
'500','https://leetcode.com/problems/reverse-nodes-in-k-group/',
'reverseKGroup','[{"name":"head","type":"Optional[ListNode]"},{"name":"k","type":"int"}]'::jsonb,'Optional[ListNode]',
'[{"inputs":["[1,2,3,4,5]","2"],"expected":"[2,1,4,3,5]"},{"inputs":["[1,2,3,4,5]","3"],"expected":"[3,2,1,4,5]"},{"inputs":["[1,2,3,4,5]","1"],"expected":"[1,2,3,4,5]"},{"inputs":["[1,2]","2"],"expected":"[2,1]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('reverse-nodes-in-k-group-500','python',$PY$class Solution:
    def reverseKGroup(self, head: Optional[ListNode], k: int) -> Optional[ListNode]:
        $PY$),
('reverse-nodes-in-k-group-500','javascript',$JS$var reverseKGroup = function(head, k) {

};$JS$),
('reverse-nodes-in-k-group-500','java',$JAVA$class Solution {
    public ListNode reverseKGroup(ListNode head, int k) {

    }
}$JAVA$),
('reverse-nodes-in-k-group-500','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    ListNode* reverseKGroup(ListNode* head, int k) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('reverse-nodes-in-k-group-500',1,'Iterative Reversal',
'Check if k nodes remain. If yes, reverse them in-place and connect the reversed group to the result of processing the rest.',
'["Count k nodes from current position. If fewer than k remain, return head as-is.","Reverse the k nodes.","The original head becomes the tail of this group; connect it to the result of recursing on the rest.","Return the new head of the reversed group."]'::jsonb,
$PY$class Solution:
    def reverseKGroup(self, head: Optional[ListNode], k: int) -> Optional[ListNode]:
        count = 0
        node = head
        while node and count < k:
            node = node.next
            count += 1
        if count < k:
            return head
        prev = self.reverseKGroup(node, k)
        curr = head
        for _ in range(k):
            nxt = curr.next
            curr.next = prev
            prev = curr
            curr = nxt
        return prev
$PY$,
$JS$var reverseKGroup = function(head, k) {
    let count = 0, node = head;
    while (node && count < k) { node = node.next; count++; }
    if (count < k) return head;
    let prev = reverseKGroup(node, k);
    let curr = head;
    for (let i = 0; i < k; i++) {
        const nxt = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nxt;
    }
    return prev;
};
$JS$,
$JAVA$class Solution {
    public ListNode reverseKGroup(ListNode head, int k) {
        int count = 0;
        ListNode node = head;
        while (node != null && count < k) { node = node.next; count++; }
        if (count < k) return head;
        ListNode prev = reverseKGroup(node, k);
        ListNode curr = head;
        for (int i = 0; i < k; i++) {
            ListNode nxt = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    ListNode* reverseKGroup(ListNode* head, int k) {
        int count = 0;
        ListNode* node = head;
        while (node && count < k) { node = node->next; count++; }
        if (count < k) return head;
        ListNode* prev = reverseKGroup(node, k);
        ListNode* curr = head;
        for (int i = 0; i < k; i++) {
            ListNode* nxt = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
};
$CPP$,'O(n)','O(n/k) recursion stack');

COMMIT;
