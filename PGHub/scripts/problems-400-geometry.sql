-- Grow catalog 300 → 400: geometry topic (+10 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'k-closest-points-origin','valid-triangle-number','max-points-line','rectangle-area',
  'min-area-rectangle-ii','line-reflection','robot-bounded-in-circle','erect-the-fence',
  'largest-triangle-area','surface-area-3d-shapes'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'k-closest-points-origin','valid-triangle-number','max-points-line','rectangle-area',
  'min-area-rectangle-ii','line-reflection','robot-bounded-in-circle','erect-the-fence',
  'largest-triangle-area','surface-area-3d-shapes'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'k-closest-points-origin','valid-triangle-number','max-points-line','rectangle-area',
  'min-area-rectangle-ii','line-reflection','robot-bounded-in-circle','erect-the-fence',
  'largest-triangle-area','surface-area-3d-shapes'
);

-- 1) k-closest-points-origin (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('k-closest-points-origin','geometry','K Closest Points to Origin','Easy',
$$<p>Given an array of <code>points</code> where <code>points[i] = [x, y]</code>, return the <code>k</code> closest points to the origin <code>(0, 0)</code>. The answer may be in any order.</p>$$,
'',ARRAY['Sort by squared distance — no need for sqrt.','A max-heap of size k also works in O(n log k).','Squared distance avoids floating-point issues.'],
'400','https://leetcode.com/problems/k-closest-points-to-origin/',
'kClosest','[{"name":"points","type":"List[List[int]]"},{"name":"k","type":"int"}]'::jsonb,'List[List[int]]',
'[{"inputs":["[[1,3],[-2,2]]","1"],"expected":"[[-2,2]]"},{"inputs":["[[3,3],[5,-1],[-2,4]]","2"],"expected":"[[3,3],[-2,4]]"},{"inputs":["[[0,1],[1,0]]","2"],"expected":"[[0,1],[1,0]]"},{"inputs":["[[1,1]]","1"],"expected":"[[1,1]]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('k-closest-points-origin','python',$PY$class Solution:
    def kClosest(self, points: List[List[int]], k: int) -> List[List[int]]:
        $PY$),
('k-closest-points-origin','javascript',$JS$var kClosest = function(points, k) {

};$JS$),
('k-closest-points-origin','java',$JAVA$class Solution {
    public int[][] kClosest(int[][] points, int k) {

    }
}$JAVA$),
('k-closest-points-origin','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('k-closest-points-origin',1,'Sort by Distance',
'Sort points by x*x + y*y and take the first k.',
'["Sort points by squared distance from origin.","Return the first k elements."]'::jsonb,
$PY$class Solution:
    def kClosest(self, points: List[List[int]], k: int) -> List[List[int]]:
        points.sort(key=lambda p: p[0]*p[0] + p[1]*p[1])
        return points[:k]
$PY$,
$JS$var kClosest = function(points, k) {
    points.sort((a, b) => (a[0]*a[0] + a[1]*a[1]) - (b[0]*b[0] + b[1]*b[1]));
    return points.slice(0, k);
};
$JS$,
$JAVA$class Solution {
    public int[][] kClosest(int[][] points, int k) {
        Arrays.sort(points, (a, b) -> (a[0]*a[0]+a[1]*a[1]) - (b[0]*b[0]+b[1]*b[1]));
        return Arrays.copyOfRange(points, 0, k);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {
        sort(points.begin(), points.end(), [](const vector<int>& a, const vector<int>& b) {
            return a[0]*a[0]+a[1]*a[1] < b[0]*b[0]+b[1]*b[1];
        });
        return vector<vector<int>>(points.begin(), points.begin() + k);
    }
};
$CPP$,'O(n log n)','O(1) extra');

-- 2) valid-triangle-number (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('valid-triangle-number','geometry','Valid Triangle Number','Medium',
$$<p>Given an array of non-negative integers <code>nums</code>, return the number of triplets that can form a valid triangle (sum of any two sides > the third).</p>$$,
'',ARRAY['Sort the array first. For a sorted triple (a, b, c), the only constraint that can fail is a + b > c.','Fix c (largest side) and use two pointers for a and b.','If nums[lo] + nums[hi] > nums[i], all pairs from lo to hi-1 work with hi.'],
'400','https://leetcode.com/problems/valid-triangle-number/',
'triangleNumber','[{"name":"nums","type":"List[int]"}]'::jsonb,'int',
'[{"inputs":["[2,2,3,4]"],"expected":"3"},{"inputs":["[4,2,3,4]"],"expected":"4"},{"inputs":["[0,0,0]"],"expected":"0"},{"inputs":["[1,1,1,1]"],"expected":"4"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('valid-triangle-number','python',$PY$class Solution:
    def triangleNumber(self, nums: List[int]) -> int:
        $PY$),
('valid-triangle-number','javascript',$JS$var triangleNumber = function(nums) {

};$JS$),
('valid-triangle-number','java',$JAVA$class Solution {
    public int triangleNumber(int[] nums) {

    }
}$JAVA$),
('valid-triangle-number','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int triangleNumber(vector<int>& nums) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('valid-triangle-number',1,'Sort + Two Pointers',
'Sort so only a+b>c needs checking. Fix the largest side and sweep pairs.',
'["Sort nums ascending.","For i from n-1 down to 2 (c = nums[i]): lo=0, hi=i-1.","While lo < hi: if nums[lo]+nums[hi] > nums[i], count += hi-lo, hi--; else lo++."]'::jsonb,
$PY$class Solution:
    def triangleNumber(self, nums: List[int]) -> int:
        nums.sort()
        count = 0
        for i in range(len(nums) - 1, 1, -1):
            lo, hi = 0, i - 1
            while lo < hi:
                if nums[lo] + nums[hi] > nums[i]:
                    count += hi - lo
                    hi -= 1
                else:
                    lo += 1
        return count
$PY$,
$JS$var triangleNumber = function(nums) {
    nums.sort((a, b) => a - b);
    let count = 0;
    for (let i = nums.length - 1; i >= 2; i--) {
        let lo = 0, hi = i - 1;
        while (lo < hi) {
            if (nums[lo] + nums[hi] > nums[i]) { count += hi - lo; hi--; }
            else lo++;
        }
    }
    return count;
};
$JS$,
$JAVA$class Solution {
    public int triangleNumber(int[] nums) {
        Arrays.sort(nums);
        int count = 0;
        for (int i = nums.length - 1; i >= 2; i--) {
            int lo = 0, hi = i - 1;
            while (lo < hi) {
                if (nums[lo] + nums[hi] > nums[i]) { count += hi - lo; hi--; }
                else lo++;
            }
        }
        return count;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int triangleNumber(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        int count = 0;
        for (int i = (int)nums.size() - 1; i >= 2; i--) {
            int lo = 0, hi = i - 1;
            while (lo < hi) {
                if (nums[lo] + nums[hi] > nums[i]) { count += hi - lo; hi--; }
                else lo++;
            }
        }
        return count;
    }
};
$CPP$,'O(n^2)','O(1) extra');

-- 3) rectangle-area (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('rectangle-area','geometry','Rectangle Area','Medium',
$$<p>Given the coordinates of two rectilinear rectangles in a 2D plane, return the total area covered by the two rectangles. The first rectangle is defined by its bottom-left <code>(ax1, ay1)</code> and top-right <code>(ax2, ay2)</code>; the second by <code>(bx1, by1)</code> and <code>(bx2, by2)</code>.</p>$$,
'',ARRAY['Total area = area1 + area2 - overlap.','Overlap width = max(0, min(ax2,bx2) - max(ax1,bx1)); similarly for height.','If either overlap dimension is <= 0, there is no overlap.'],
'400','https://leetcode.com/problems/rectangle-area/',
'computeArea','[{"name":"ax1","type":"int"},{"name":"ay1","type":"int"},{"name":"ax2","type":"int"},{"name":"ay2","type":"int"},{"name":"bx1","type":"int"},{"name":"by1","type":"int"},{"name":"bx2","type":"int"},{"name":"by2","type":"int"}]'::jsonb,'int',
'[{"inputs":["-3","0","3","4","0","-1","9","2"],"expected":"45"},{"inputs":["-2","-2","2","2","-2","-2","2","2"],"expected":"16"},{"inputs":["0","0","1","1","2","2","3","3"],"expected":"2"},{"inputs":["-2","-2","2","2","3","3","4","4"],"expected":"17"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('rectangle-area','python',$PY$class Solution:
    def computeArea(self, ax1: int, ay1: int, ax2: int, ay2: int, bx1: int, by1: int, bx2: int, by2: int) -> int:
        $PY$),
('rectangle-area','javascript',$JS$var computeArea = function(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {

};$JS$),
('rectangle-area','java',$JAVA$class Solution {
    public int computeArea(int ax1, int ay1, int ax2, int ay2, int bx1, int by1, int bx2, int by2) {

    }
}$JAVA$),
('rectangle-area','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int computeArea(int ax1, int ay1, int ax2, int ay2, int bx1, int by1, int bx2, int by2) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('rectangle-area',1,'Area Sum Minus Overlap',
'Compute each rectangle area, then subtract the overlap (if any).',
'["area1 = (ax2-ax1)*(ay2-ay1), area2 = (bx2-bx1)*(by2-by1).","overlapW = max(0, min(ax2,bx2) - max(ax1,bx1)); overlapH = max(0, min(ay2,by2) - max(ay1,by1)).","Return area1 + area2 - overlapW * overlapH."]'::jsonb,
$PY$class Solution:
    def computeArea(self, ax1: int, ay1: int, ax2: int, ay2: int, bx1: int, by1: int, bx2: int, by2: int) -> int:
        area1 = (ax2 - ax1) * (ay2 - ay1)
        area2 = (bx2 - bx1) * (by2 - by1)
        ow = max(0, min(ax2, bx2) - max(ax1, bx1))
        oh = max(0, min(ay2, by2) - max(ay1, by1))
        return area1 + area2 - ow * oh
$PY$,
$JS$var computeArea = function(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
    const area1 = (ax2 - ax1) * (ay2 - ay1);
    const area2 = (bx2 - bx1) * (by2 - by1);
    const ow = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1));
    const oh = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1));
    return area1 + area2 - ow * oh;
};
$JS$,
$JAVA$class Solution {
    public int computeArea(int ax1, int ay1, int ax2, int ay2, int bx1, int by1, int bx2, int by2) {
        int area1 = (ax2 - ax1) * (ay2 - ay1);
        int area2 = (bx2 - bx1) * (by2 - by1);
        int ow = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1));
        int oh = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1));
        return area1 + area2 - ow * oh;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int computeArea(int ax1, int ay1, int ax2, int ay2, int bx1, int by1, int bx2, int by2) {
        int area1 = (ax2 - ax1) * (ay2 - ay1);
        int area2 = (bx2 - bx1) * (by2 - by1);
        int ow = max(0, min(ax2, bx2) - max(ax1, bx1));
        int oh = max(0, min(ay2, by2) - max(ay1, by1));
        return area1 + area2 - ow * oh;
    }
};
$CPP$,'O(1)','O(1)');

-- 4) robot-bounded-in-circle (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('robot-bounded-in-circle','geometry','Robot Bounded In Circle','Medium',
$$<p>A robot at the origin facing north executes <code>instructions</code> repeatedly (G = go forward 1 unit, L = turn left, R = turn right). Return <code>true</code> iff the robot stays bounded in a circle (never goes infinitely far).</p>$$,
'',ARRAY['After one pass of instructions, if the robot is back at origin OR not facing north, it is bounded.','If facing north but displaced, it drifts further every cycle.','Simulate one pass and check position + direction.'],
'400','https://leetcode.com/problems/robot-bounded-in-circle/',
'isRobotBounded','[{"name":"instructions","type":"str"}]'::jsonb,'bool',
'[{"inputs":["\"GGLLGG\""],"expected":"true"},{"inputs":["\"GG\""],"expected":"false"},{"inputs":["\"GL\""],"expected":"true"},{"inputs":["\"GLGLGGLGL\""],"expected":"false"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('robot-bounded-in-circle','python',$PY$class Solution:
    def isRobotBounded(self, instructions: str) -> bool:
        $PY$),
('robot-bounded-in-circle','javascript',$JS$var isRobotBounded = function(instructions) {

};$JS$),
('robot-bounded-in-circle','java',$JAVA$class Solution {
    public boolean isRobotBounded(String instructions) {

    }
}$JAVA$),
('robot-bounded-in-circle','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isRobotBounded(string& instructions) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('robot-bounded-in-circle',1,'One-Pass Simulation',
'After one cycle, the robot is bounded iff it returned to origin OR it changed direction. A direction change means the trajectory closes within 2-4 cycles.',
'["dirs = [(0,1),(1,0),(0,-1),(-1,0)] — N,E,S,W.","x=y=0, d=0 (north).","For each char: G → move by dirs[d]; L → d=(d+3)%4; R → d=(d+1)%4.","Return (x==0 and y==0) or d != 0."]'::jsonb,
$PY$class Solution:
    def isRobotBounded(self, instructions: str) -> bool:
        dirs = [(0, 1), (1, 0), (0, -1), (-1, 0)]
        x, y, d = 0, 0, 0
        for c in instructions:
            if c == 'G':
                x += dirs[d][0]
                y += dirs[d][1]
            elif c == 'L':
                d = (d + 3) % 4
            else:
                d = (d + 1) % 4
        return (x == 0 and y == 0) or d != 0
$PY$,
$JS$var isRobotBounded = function(instructions) {
    const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
    let x = 0, y = 0, d = 0;
    for (const c of instructions) {
        if (c === 'G') { x += dirs[d][0]; y += dirs[d][1]; }
        else if (c === 'L') d = (d + 3) % 4;
        else d = (d + 1) % 4;
    }
    return (x === 0 && y === 0) || d !== 0;
};
$JS$,
$JAVA$class Solution {
    public boolean isRobotBounded(String instructions) {
        int[][] dirs = {{0,1},{1,0},{0,-1},{-1,0}};
        int x = 0, y = 0, d = 0;
        for (char c : instructions.toCharArray()) {
            if (c == 'G') { x += dirs[d][0]; y += dirs[d][1]; }
            else if (c == 'L') d = (d + 3) % 4;
            else d = (d + 1) % 4;
        }
        return (x == 0 && y == 0) || d != 0;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool isRobotBounded(string& instructions) {
        int dirs[4][2] = {{0,1},{1,0},{0,-1},{-1,0}};
        int x = 0, y = 0, d = 0;
        for (char c : instructions) {
            if (c == 'G') { x += dirs[d][0]; y += dirs[d][1]; }
            else if (c == 'L') d = (d + 3) % 4;
            else d = (d + 1) % 4;
        }
        return (x == 0 && y == 0) || d != 0;
    }
};
$CPP$,'O(n)','O(1)');

-- 5) largest-triangle-area (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('largest-triangle-area','geometry','Largest Triangle Area','Easy',
$$<p>Given an array of <code>points</code> on the X-Y plane, return the area of the largest triangle that can be formed by any three of these points. Answers within <code>10^-6</code> of the actual are accepted.</p>$$,
'',ARRAY['Use the shoelace formula: area = 0.5 * |x1(y2-y3) + x2(y3-y1) + x3(y1-y2)|.','Brute-force all O(n^3) triples; n is small.','Return the maximum area found.'],
'400','https://leetcode.com/problems/largest-triangle-area/',
'largestTriangleArea','[{"name":"points","type":"List[List[int]]"}]'::jsonb,'float',
'[{"inputs":["[[0,0],[0,1],[1,0],[0,2],[2,0]]"],"expected":"2"},{"inputs":["[[1,0],[0,0],[0,1]]"],"expected":"0.5"},{"inputs":["[[0,0],[1,0],[0,1],[1,1]]"],"expected":"0.5"},{"inputs":["[[4,6],[6,5],[3,1]]"],"expected":"5.5"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('largest-triangle-area','python',$PY$class Solution:
    def largestTriangleArea(self, points: List[List[int]]) -> float:
        $PY$),
('largest-triangle-area','javascript',$JS$var largestTriangleArea = function(points) {

};$JS$),
('largest-triangle-area','java',$JAVA$class Solution {
    public double largestTriangleArea(int[][] points) {

    }
}$JAVA$),
('largest-triangle-area','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    double largestTriangleArea(vector<vector<int>>& points) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('largest-triangle-area',1,'Brute Force Shoelace',
'Try every triple of points; compute triangle area via the shoelace formula; track the max.',
'["For i, j, k over all triples: area = 0.5 * abs(x1*(y2-y3) + x2*(y3-y1) + x3*(y1-y2)).","Return the maximum."]'::jsonb,
$PY$class Solution:
    def largestTriangleArea(self, points: List[List[int]]) -> float:
        best = 0
        n = len(points)
        for i in range(n):
            for j in range(i + 1, n):
                for k in range(j + 1, n):
                    x1, y1 = points[i]
                    x2, y2 = points[j]
                    x3, y3 = points[k]
                    area = abs(x1*(y2-y3) + x2*(y3-y1) + x3*(y1-y2)) / 2.0
                    if area > best:
                        best = area
        return best
$PY$,
$JS$var largestTriangleArea = function(points) {
    let best = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) for (let j = i+1; j < n; j++) for (let k = j+1; k < n; k++) {
        const [x1,y1] = points[i], [x2,y2] = points[j], [x3,y3] = points[k];
        const area = Math.abs(x1*(y2-y3) + x2*(y3-y1) + x3*(y1-y2)) / 2;
        if (area > best) best = area;
    }
    return best;
};
$JS$,
$JAVA$class Solution {
    public double largestTriangleArea(int[][] points) {
        double best = 0;
        int n = points.length;
        for (int i = 0; i < n; i++) for (int j = i+1; j < n; j++) for (int k = j+1; k < n; k++) {
            double area = Math.abs(points[i][0]*(points[j][1]-points[k][1]) + points[j][0]*(points[k][1]-points[i][1]) + points[k][0]*(points[i][1]-points[j][1])) / 2.0;
            if (area > best) best = area;
        }
        return best;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    double largestTriangleArea(vector<vector<int>>& points) {
        double best = 0;
        int n = points.size();
        for (int i = 0; i < n; i++) for (int j = i+1; j < n; j++) for (int k = j+1; k < n; k++) {
            double area = abs(points[i][0]*(points[j][1]-points[k][1]) + points[j][0]*(points[k][1]-points[i][1]) + points[k][0]*(points[i][1]-points[j][1])) / 2.0;
            if (area > best) best = area;
        }
        return best;
    }
};
$CPP$,'O(n^3)','O(1)');

-- 6) surface-area-3d-shapes (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('surface-area-3d-shapes','geometry','Surface Area of 3D Shapes','Easy',
$$<p>On a grid, we place <code>grid[i][j]</code> cubes stacked at cell <code>(i, j)</code>. Return the total surface area of the resulting 3D shape.</p>$$,
'',ARRAY['Each column of v cubes contributes 4*v + 2 (top, bottom, 4 sides) MINUS overlaps with neighbors.','Overlap with an adjacent column of u cubes is 2 * min(v, u) on the shared face.','Sum contributions minus pairwise overlaps.'],
'400','https://leetcode.com/problems/surface-area-of-3d-shapes/',
'surfaceArea','[{"name":"grid","type":"List[List[int]]"}]'::jsonb,'int',
'[{"inputs":["[[1,2],[3,4]]"],"expected":"34"},{"inputs":["[[1,1,1],[1,0,1],[1,1,1]]"],"expected":"32"},{"inputs":["[[2,2,2],[2,1,2],[2,2,2]]"],"expected":"46"},{"inputs":["[[1]]"],"expected":"6"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('surface-area-3d-shapes','python',$PY$class Solution:
    def surfaceArea(self, grid: List[List[int]]) -> int:
        $PY$),
('surface-area-3d-shapes','javascript',$JS$var surfaceArea = function(grid) {

};$JS$),
('surface-area-3d-shapes','java',$JAVA$class Solution {
    public int surfaceArea(int[][] grid) {

    }
}$JAVA$),
('surface-area-3d-shapes','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int surfaceArea(vector<vector<int>>& grid) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('surface-area-3d-shapes',1,'Column Contribution Minus Overlaps',
'Each column contributes top+bottom+sides; subtract 2*min(v,neighbor) for each adjacent pair.',
'["total = 0.","For each cell (i,j) with v = grid[i][j] > 0: total += 4*v + 2.","Subtract overlaps: if i > 0, total -= 2*min(v, grid[i-1][j]). If j > 0, total -= 2*min(v, grid[i][j-1]).","Return total."]'::jsonb,
$PY$class Solution:
    def surfaceArea(self, grid: List[List[int]]) -> int:
        m, n = len(grid), len(grid[0])
        total = 0
        for i in range(m):
            for j in range(n):
                v = grid[i][j]
                if v > 0:
                    total += 4 * v + 2
                if i > 0:
                    total -= 2 * min(v, grid[i-1][j])
                if j > 0:
                    total -= 2 * min(v, grid[i][j-1])
        return total
$PY$,
$JS$var surfaceArea = function(grid) {
    const m = grid.length, n = grid[0].length;
    let total = 0;
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
        const v = grid[i][j];
        if (v > 0) total += 4 * v + 2;
        if (i > 0) total -= 2 * Math.min(v, grid[i-1][j]);
        if (j > 0) total -= 2 * Math.min(v, grid[i][j-1]);
    }
    return total;
};
$JS$,
$JAVA$class Solution {
    public int surfaceArea(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        int total = 0;
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) {
            int v = grid[i][j];
            if (v > 0) total += 4 * v + 2;
            if (i > 0) total -= 2 * Math.min(v, grid[i-1][j]);
            if (j > 0) total -= 2 * Math.min(v, grid[i][j-1]);
        }
        return total;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int surfaceArea(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size();
        int total = 0;
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) {
            int v = grid[i][j];
            if (v > 0) total += 4 * v + 2;
            if (i > 0) total -= 2 * min(v, grid[i-1][j]);
            if (j > 0) total -= 2 * min(v, grid[i][j-1]);
        }
        return total;
    }
};
$CPP$,'O(m*n)','O(1)');

-- 7) line-reflection (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('line-reflection','geometry','Line Reflection','Medium',
$$<p>Given points on a 2D plane, determine whether there is a vertical line such that, after reflecting all points across it, the set of reflected points is the same as the original set.</p>$$,
'',ARRAY['The reflection line x = (minX + maxX) / 2 is the only candidate.','For each point (x, y), its reflection (minX + maxX - x, y) must also exist.','Use a set of (x, y) pairs for O(1) lookup.'],
'400','https://leetcode.com/problems/line-reflection/',
'isReflected','[{"name":"points","type":"List[List[int]]"}]'::jsonb,'bool',
'[{"inputs":["[[1,1],[-1,1]]"],"expected":"true"},{"inputs":["[[1,1],[-1,-1]]"],"expected":"false"},{"inputs":["[[0,0],[1,0]]"],"expected":"true"},{"inputs":["[[0,0]]"],"expected":"true"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('line-reflection','python',$PY$class Solution:
    def isReflected(self, points: List[List[int]]) -> bool:
        $PY$),
('line-reflection','javascript',$JS$var isReflected = function(points) {

};$JS$),
('line-reflection','java',$JAVA$class Solution {
    public boolean isReflected(int[][] points) {

    }
}$JAVA$),
('line-reflection','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isReflected(vector<vector<int>>& points) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('line-reflection',1,'Find Candidate Line + Set Check',
'The only possible vertical line is at x = (minX + maxX) / 2. Check every point has its mirror in the set.',
'["Find minX and maxX. Compute s = minX + maxX.","Put all (x, y) into a set.","For each point: if (s - x, y) is not in the set, return False.","Return True."]'::jsonb,
$PY$class Solution:
    def isReflected(self, points: List[List[int]]) -> bool:
        if not points:
            return True
        pts = set(map(tuple, points))
        s = min(x for x, y in pts) + max(x for x, y in pts)
        return all((s - x, y) in pts for x, y in pts)
$PY$,
$JS$var isReflected = function(points) {
    if (!points.length) return true;
    const pts = new Set(points.map(p => p[0] + ',' + p[1]));
    let minX = Infinity, maxX = -Infinity;
    for (const [x] of points) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
    const s = minX + maxX;
    for (const [x, y] of points) {
        if (!pts.has((s - x) + ',' + y)) return false;
    }
    return true;
};
$JS$,
$JAVA$class Solution {
    public boolean isReflected(int[][] points) {
        Set<String> pts = new HashSet<>();
        int minX = Integer.MAX_VALUE, maxX = Integer.MIN_VALUE;
        for (int[] p : points) { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); pts.add(p[0] + "," + p[1]); }
        int s = minX + maxX;
        for (int[] p : points) {
            if (!pts.contains((s - p[0]) + "," + p[1])) return false;
        }
        return true;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool isReflected(vector<vector<int>>& points) {
        set<pair<int,int>> pts;
        int minX = INT_MAX, maxX = INT_MIN;
        for (auto& p : points) { minX = min(minX, p[0]); maxX = max(maxX, p[0]); pts.insert({p[0], p[1]}); }
        int s = minX + maxX;
        for (auto& p : points) {
            if (!pts.count({s - p[0], p[1]})) return false;
        }
        return true;
    }
};
$CPP$,'O(n)','O(n)');

-- 8) min-area-rectangle-ii (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('min-area-rectangle-ii','geometry','Minimum Area Rectangle II','Medium',
$$<p>Given a set of points in the X-Y plane, return the minimum area of ANY rectangle formed from these points (sides need not be axis-aligned). If no rectangle exists, return 0.</p>$$,
'',ARRAY['Two points define a diagonal. The center and half-diagonal length uniquely determine the rectangle.','Group point-pairs by (center, half-diagonal-length-squared). Two pairs in the same group form a rectangle.','Compute cross-product for the area.'],
'400','https://leetcode.com/problems/minimum-area-rectangle-ii/',
'minAreaFreeRect','[{"name":"points","type":"List[List[int]]"}]'::jsonb,'float',
'[{"inputs":["[[1,2],[2,1],[1,0],[0,1]]"],"expected":"2"},{"inputs":["[[0,1],[2,1],[1,1],[1,0],[2,0]]"],"expected":"1"},{"inputs":["[[0,3],[1,2],[3,1],[1,3],[2,1]]"],"expected":"0"},{"inputs":["[[3,1],[1,1],[0,1],[2,1],[3,3],[3,2],[0,2],[2,3]]"],"expected":"2"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('min-area-rectangle-ii','python',$PY$class Solution:
    def minAreaFreeRect(self, points: List[List[int]]) -> float:
        $PY$),
('min-area-rectangle-ii','javascript',$JS$var minAreaFreeRect = function(points) {

};$JS$),
('min-area-rectangle-ii','java',$JAVA$class Solution {
    public double minAreaFreeRect(int[][] points) {

    }
}$JAVA$),
('min-area-rectangle-ii','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    double minAreaFreeRect(vector<vector<int>>& points) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('min-area-rectangle-ii',1,'Diagonal Center Grouping',
'Two points sharing the same midpoint and distance form a diagonal of some rectangle. Group diagonals; for each group with 2+ pairs, compute cross-product area.',
'["For all pairs (i, j), compute center = (xi+xj, yi+yj) and dist_sq = (xi-xj)^2 + (yi-yj)^2.","Group by (center, dist_sq) in a dict.","For each group with >= 2 diagonals, try all pairs and compute area via cross product: |v1 x v2| where v1, v2 are vectors from center to the two diagonal endpoints.","Return minimum nonzero area."]'::jsonb,
$PY$class Solution:
    def minAreaFreeRect(self, points: List[List[int]]) -> float:
        from collections import defaultdict
        import math
        pts = set(map(tuple, points))
        n = len(points)
        best = float('inf')
        diags = defaultdict(list)
        for i in range(n):
            for j in range(i + 1, n):
                cx = points[i][0] + points[j][0]
                cy = points[i][1] + points[j][1]
                d = (points[i][0]-points[j][0])**2 + (points[i][1]-points[j][1])**2
                diags[(cx, cy, d)].append((i, j))
        for key, pairs in diags.items():
            for a in range(len(pairs)):
                for b in range(a + 1, len(pairs)):
                    i, j = pairs[a]
                    k, l = pairs[b]
                    v1 = (points[i][0]-points[k][0], points[i][1]-points[k][1])
                    v2 = (points[i][0]-points[l][0], points[i][1]-points[l][1])
                    area = abs(v1[0]*v2[1] - v1[1]*v2[0])
                    if area > 0 and area < best:
                        best = area
        return best if best < float('inf') else 0
$PY$,
$JS$var minAreaFreeRect = function(points) {
    const n = points.length;
    const diags = new Map();
    for (let i = 0; i < n; i++) for (let j = i+1; j < n; j++) {
        const cx = points[i][0]+points[j][0], cy = points[i][1]+points[j][1];
        const d = (points[i][0]-points[j][0])**2 + (points[i][1]-points[j][1])**2;
        const key = cx+','+cy+','+d;
        if (!diags.has(key)) diags.set(key, []);
        diags.get(key).push([i, j]);
    }
    let best = Infinity;
    for (const pairs of diags.values()) {
        for (let a = 0; a < pairs.length; a++) for (let b = a+1; b < pairs.length; b++) {
            const [i,j] = pairs[a], [k,l] = pairs[b];
            const v1x = points[i][0]-points[k][0], v1y = points[i][1]-points[k][1];
            const v2x = points[i][0]-points[l][0], v2y = points[i][1]-points[l][1];
            const area = Math.abs(v1x*v2y - v1y*v2x);
            if (area > 0 && area < best) best = area;
        }
    }
    return best < Infinity ? best : 0;
};
$JS$,
$JAVA$class Solution {
    public double minAreaFreeRect(int[][] points) {
        int n = points.length;
        Map<String, List<int[]>> diags = new HashMap<>();
        for (int i = 0; i < n; i++) for (int j = i+1; j < n; j++) {
            long cx = points[i][0]+points[j][0], cy = points[i][1]+points[j][1];
            long d = (long)(points[i][0]-points[j][0])*(points[i][0]-points[j][0]) + (long)(points[i][1]-points[j][1])*(points[i][1]-points[j][1]);
            String key = cx+","+cy+","+d;
            diags.computeIfAbsent(key, k -> new ArrayList<>()).add(new int[]{i, j});
        }
        double best = Double.MAX_VALUE;
        for (List<int[]> pairs : diags.values()) {
            for (int a = 0; a < pairs.size(); a++) for (int b = a+1; b < pairs.size(); b++) {
                int i = pairs.get(a)[0], j = pairs.get(a)[1];
                int k = pairs.get(b)[0], l = pairs.get(b)[1];
                double v1x = points[i][0]-points[k][0], v1y = points[i][1]-points[k][1];
                double v2x = points[i][0]-points[l][0], v2y = points[i][1]-points[l][1];
                double area = Math.abs(v1x*v2y - v1y*v2x);
                if (area > 0 && area < best) best = area;
            }
        }
        return best < Double.MAX_VALUE ? best : 0;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    double minAreaFreeRect(vector<vector<int>>& points) {
        int n = points.size();
        map<tuple<int,int,long long>, vector<pair<int,int>>> diags;
        for (int i = 0; i < n; i++) for (int j = i+1; j < n; j++) {
            int cx = points[i][0]+points[j][0], cy = points[i][1]+points[j][1];
            long long d = (long long)(points[i][0]-points[j][0])*(points[i][0]-points[j][0]) + (long long)(points[i][1]-points[j][1])*(points[i][1]-points[j][1]);
            diags[{cx,cy,d}].push_back({i,j});
        }
        double best = 1e18;
        for (auto& [key, pairs] : diags) {
            for (int a = 0; a < (int)pairs.size(); a++) for (int b = a+1; b < (int)pairs.size(); b++) {
                auto [i,j] = pairs[a]; auto [k,l] = pairs[b];
                double v1x = points[i][0]-points[k][0], v1y = points[i][1]-points[k][1];
                double v2x = points[i][0]-points[l][0], v2y = points[i][1]-points[l][1];
                double area = abs(v1x*v2y - v1y*v2x);
                if (area > 0 && area < best) best = area;
            }
        }
        return best < 1e18 ? best : 0;
    }
};
$CPP$,'O(n^2 log n)','O(n^2)');

-- 9) erect-the-fence (Hard)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('erect-the-fence','geometry','Erect the Fence','Hard',
$$<p>Given tree positions as <code>trees[i] = [x, y]</code>, return the coordinates of trees on the fence (convex hull) in any order. Include points on the hull boundary.</p>$$,
'',ARRAY['Convex hull algorithm: Andrew monotone chain or Graham scan.','Sort by x (tie-break y). Build lower and upper hulls.','Include collinear points on the hull boundary.'],
'400','https://leetcode.com/problems/erect-the-fence/',
'outerTrees','[{"name":"trees","type":"List[List[int]]"}]'::jsonb,'List[List[int]]',
'[{"inputs":["[[1,1],[2,2],[2,0],[2,4],[3,3],[4,2]]"],"expected":"[[1,1],[2,0],[4,2],[3,3],[2,4]]"},{"inputs":["[[1,2],[2,2],[4,2]]"],"expected":"[[1,2],[2,2],[4,2]]"},{"inputs":["[[1,1]]"],"expected":"[[1,1]]"},{"inputs":["[[0,0],[0,1],[0,2],[1,2],[2,2],[2,1],[2,0],[1,0]]"],"expected":"[[0,0],[0,1],[0,2],[1,2],[2,2],[2,1],[2,0],[1,0]]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('erect-the-fence','python',$PY$class Solution:
    def outerTrees(self, trees: List[List[int]]) -> List[List[int]]:
        $PY$),
('erect-the-fence','javascript',$JS$var outerTrees = function(trees) {

};$JS$),
('erect-the-fence','java',$JAVA$class Solution {
    public int[][] outerTrees(int[][] trees) {

    }
}$JAVA$),
('erect-the-fence','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> outerTrees(vector<vector<int>>& trees) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('erect-the-fence',1,'Andrew Monotone Chain (with collinear)',
'Sort points, build lower then upper hulls. Use <= 0 cross-product (not < 0) to keep collinear boundary points.',
'["Sort trees by (x, y).","Lower hull: for each point, while hull has >=2 and cross(hull[-2], hull[-1], p) < 0, pop. Append p.","Upper hull: same but reverse iteration.","Deduplicate via set and return."]'::jsonb,
$PY$class Solution:
    def outerTrees(self, trees: List[List[int]]) -> List[List[int]]:
        def cross(o, a, b):
            return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])
        trees.sort()
        if len(trees) <= 1:
            return trees
        lower = []
        for p in trees:
            while len(lower) >= 2 and cross(lower[-2], lower[-1], p) < 0:
                lower.pop()
            lower.append(tuple(p))
        upper = []
        for p in reversed(trees):
            while len(upper) >= 2 and cross(upper[-2], upper[-1], p) < 0:
                upper.pop()
            upper.append(tuple(p))
        return [list(p) for p in set(lower + upper)]
$PY$,
$JS$var outerTrees = function(trees) {
    const cross = (o, a, b) => (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]);
    trees.sort((a, b) => a[0]-b[0] || a[1]-b[1]);
    if (trees.length <= 1) return trees;
    const lower = [];
    for (const p of trees) {
        while (lower.length >= 2 && cross(lower[lower.length-2], lower[lower.length-1], p) < 0) lower.pop();
        lower.push(p);
    }
    const upper = [];
    for (let i = trees.length-1; i >= 0; i--) {
        while (upper.length >= 2 && cross(upper[upper.length-2], upper[upper.length-1], trees[i]) < 0) upper.pop();
        upper.push(trees[i]);
    }
    const seen = new Set();
    const result = [];
    for (const p of [...lower, ...upper]) {
        const key = p[0]+','+p[1];
        if (!seen.has(key)) { seen.add(key); result.push(p); }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    private int cross(int[] o, int[] a, int[] b) {
        return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]);
    }
    public int[][] outerTrees(int[][] trees) {
        Arrays.sort(trees, (a, b) -> a[0] != b[0] ? a[0]-b[0] : a[1]-b[1]);
        int n = trees.length;
        if (n <= 1) return trees;
        List<int[]> lower = new ArrayList<>(), upper = new ArrayList<>();
        for (int[] p : trees) {
            while (lower.size() >= 2 && cross(lower.get(lower.size()-2), lower.get(lower.size()-1), p) < 0) lower.remove(lower.size()-1);
            lower.add(p);
        }
        for (int i = n-1; i >= 0; i--) {
            while (upper.size() >= 2 && cross(upper.get(upper.size()-2), upper.get(upper.size()-1), trees[i]) < 0) upper.remove(upper.size()-1);
            upper.add(trees[i]);
        }
        Set<String> seen = new HashSet<>();
        List<int[]> result = new ArrayList<>();
        for (int[] p : lower) { String k = p[0]+","+p[1]; if (seen.add(k)) result.add(p); }
        for (int[] p : upper) { String k = p[0]+","+p[1]; if (seen.add(k)) result.add(p); }
        return result.toArray(new int[0][]);
    }
}
$JAVA$,
$CPP$class Solution {
    int cross(vector<int>& o, vector<int>& a, vector<int>& b) {
        return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]);
    }
public:
    vector<vector<int>> outerTrees(vector<vector<int>>& trees) {
        sort(trees.begin(), trees.end());
        int n = trees.size();
        if (n <= 1) return trees;
        vector<vector<int>> lower, upper;
        for (auto& p : trees) {
            while (lower.size() >= 2 && cross(lower[lower.size()-2], lower[lower.size()-1], p) < 0) lower.pop_back();
            lower.push_back(p);
        }
        for (int i = n-1; i >= 0; i--) {
            while (upper.size() >= 2 && cross(upper[upper.size()-2], upper[upper.size()-1], trees[i]) < 0) upper.pop_back();
            upper.push_back(trees[i]);
        }
        set<pair<int,int>> seen;
        vector<vector<int>> result;
        auto add = [&](vector<int>& p) { if (seen.insert({p[0],p[1]}).second) result.push_back(p); };
        for (auto& p : lower) add(p);
        for (auto& p : upper) add(p);
        return result;
    }
};
$CPP$,'O(n log n)','O(n)');

-- 10) max-points-on-a-line (Hard)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('max-points-on-a-line','geometry','Max Points on a Line','Hard',
$$<p>Given <code>points</code> on a 2D plane, return the maximum number of points that lie on the same straight line.</p>$$,
'',ARRAY['For each point, compute the slope to every other point. Group by slope — the largest group + 1 is the max collinear count through that point.','Represent slope as a reduced fraction (dx/gcd, dy/gcd) to avoid floating-point.','Handle vertical lines (dx=0) and horizontal lines (dy=0) as special cases of the fraction.'],
'400','https://leetcode.com/problems/max-points-on-a-line/',
'maxPoints','[{"name":"points","type":"List[List[int]]"}]'::jsonb,'int',
'[{"inputs":["[[1,1],[2,2],[3,3]]"],"expected":"3"},{"inputs":["[[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]]"],"expected":"4"},{"inputs":["[[0,0]]"],"expected":"1"},{"inputs":["[[0,0],[1,0]]"],"expected":"2"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('max-points-on-a-line','python',$PY$class Solution:
    def maxPoints(self, points: List[List[int]]) -> int:
        $PY$),
('max-points-on-a-line','javascript',$JS$var maxPoints = function(points) {

};$JS$),
('max-points-on-a-line','java',$JAVA$class Solution {
    public int maxPoints(int[][] points) {

    }
}$JAVA$),
('max-points-on-a-line','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxPoints(vector<vector<int>>& points) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('max-points-on-a-line',1,'Slope Counting with GCD',
'For each anchor point, compute the canonical slope (reduced fraction) to every other point. The most frequent slope + 1 = most collinear through that anchor.',
'["For each point i: build a slope map.","For each j != i: dx = xj-xi, dy = yj-yi. Reduce by GCD; normalize sign.","Increment slope count. Track max across all anchors."]'::jsonb,
$PY$class Solution:
    def maxPoints(self, points: List[List[int]]) -> int:
        from math import gcd
        n = len(points)
        if n <= 2:
            return n
        best = 2
        for i in range(n):
            slopes = {}
            for j in range(i + 1, n):
                dx = points[j][0] - points[i][0]
                dy = points[j][1] - points[i][1]
                g = gcd(abs(dx), abs(dy))
                if g:
                    dx //= g
                    dy //= g
                if dx < 0:
                    dx, dy = -dx, -dy
                elif dx == 0:
                    dy = abs(dy)
                slopes[(dx, dy)] = slopes.get((dx, dy), 0) + 1
                best = max(best, slopes[(dx, dy)] + 1)
        return best
$PY$,
$JS$var maxPoints = function(points) {
    const n = points.length;
    if (n <= 2) return n;
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    let best = 2;
    for (let i = 0; i < n; i++) {
        const slopes = new Map();
        for (let j = i+1; j < n; j++) {
            let dx = points[j][0]-points[i][0], dy = points[j][1]-points[i][1];
            const g = gcd(Math.abs(dx), Math.abs(dy));
            if (g) { dx /= g; dy /= g; }
            if (dx < 0) { dx = -dx; dy = -dy; }
            else if (dx === 0) dy = Math.abs(dy);
            const key = dx+','+dy;
            slopes.set(key, (slopes.get(key)||0)+1);
            best = Math.max(best, slopes.get(key)+1);
        }
    }
    return best;
};
$JS$,
$JAVA$class Solution {
    public int maxPoints(int[][] points) {
        int n = points.length;
        if (n <= 2) return n;
        int best = 2;
        for (int i = 0; i < n; i++) {
            Map<String, Integer> slopes = new HashMap<>();
            for (int j = i+1; j < n; j++) {
                int dx = points[j][0]-points[i][0], dy = points[j][1]-points[i][1];
                int g = gcd(Math.abs(dx), Math.abs(dy));
                if (g != 0) { dx /= g; dy /= g; }
                if (dx < 0) { dx = -dx; dy = -dy; }
                else if (dx == 0) dy = Math.abs(dy);
                String key = dx+","+dy;
                int c = slopes.merge(key, 1, Integer::sum);
                best = Math.max(best, c+1);
            }
        }
        return best;
    }
    private int gcd(int a, int b) { return b == 0 ? a : gcd(b, a%b); }
}
$JAVA$,
$CPP$class Solution {
public:
    int maxPoints(vector<vector<int>>& points) {
        int n = points.size();
        if (n <= 2) return n;
        int best = 2;
        for (int i = 0; i < n; i++) {
            map<pair<int,int>, int> slopes;
            for (int j = i+1; j < n; j++) {
                int dx = points[j][0]-points[i][0], dy = points[j][1]-points[i][1];
                int g = __gcd(abs(dx), abs(dy));
                if (g) { dx /= g; dy /= g; }
                if (dx < 0) { dx = -dx; dy = -dy; }
                else if (dx == 0) dy = abs(dy);
                best = max(best, ++slopes[{dx, dy}] + 1);
            }
        }
        return best;
    }
};
$CPP$,'O(n^2)','O(n)');

-- Update filter: add '400' to the roadmap cascade
-- (This will be done in the React components separately)

COMMIT;
