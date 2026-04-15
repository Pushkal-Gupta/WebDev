-- Grow catalog 200 → 300: greedy topic (+6 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'assign-cookies','lemonade-change','queue-reconstruction-height',
  'min-add-parens-valid','boats-to-save-people','candy'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'assign-cookies','lemonade-change','queue-reconstruction-height',
  'min-add-parens-valid','boats-to-save-people','candy'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'assign-cookies','lemonade-change','queue-reconstruction-height',
  'min-add-parens-valid','boats-to-save-people','candy'
);

-- ============================================================
-- 1) assign-cookies (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('assign-cookies', 'greedy', 'Assign Cookies', 'Easy',
$$<p>Given children''s greed factors <code>g</code> and cookie sizes <code>s</code>, return the maximum number of children that can be content. A child is content iff they receive exactly one cookie whose size is at least their greed factor.</p>$$,
'', ARRAY[
  'Sort both arrays. Assign the smallest cookie large enough to the least greedy remaining child.',
  'Two pointers — child pointer i, cookie pointer j. Advance j every iteration; advance i only when the current cookie satisfies that child.',
  'The final content count equals i when we run out of cookies or children.'
], '300', 'https://leetcode.com/problems/assign-cookies/',
'findContentChildren',
'[{"name":"g","type":"List[int]"},{"name":"s","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["[1,2,3]","[1,1]"],"expected":"1"},
  {"inputs":["[1,2]","[1,2,3]"],"expected":"2"},
  {"inputs":["[10,9,8,7]","[5,6,7,8]"],"expected":"2"},
  {"inputs":["[]","[1,2,3]"],"expected":"0"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('assign-cookies', 'python',
$PY$class Solution:
    def findContentChildren(self, g: List[int], s: List[int]) -> int:
        $PY$),
('assign-cookies', 'javascript',
$JS$var findContentChildren = function(g, s) {

};$JS$),
('assign-cookies', 'java',
$JAVA$class Solution {
    public int findContentChildren(int[] g, int[] s) {

    }
}$JAVA$),
('assign-cookies', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findContentChildren(vector<int>& g, vector<int>& s) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('assign-cookies', 1, 'Sort + Two Pointers',
'Sorting lets us always give the smallest cookie that still satisfies the least-greedy remaining child. This greedy pairing is optimal because a larger cookie given to a less greedy child can never unlock more pairings than a larger cookie given later to a greedier child it still satisfies.',
'["Sort g and s ascending.","i = 0 (children pointer). For each cookie s[j]: if i < len(g) and s[j] >= g[i], i += 1 (content +1).","Return i."]'::jsonb,
$PY$class Solution:
    def findContentChildren(self, g: List[int], s: List[int]) -> int:
        g.sort()
        s.sort()
        i = 0
        for cookie in s:
            if i < len(g) and cookie >= g[i]:
                i += 1
        return i
$PY$,
$JS$var findContentChildren = function(g, s) {
    g.sort((a, b) => a - b);
    s.sort((a, b) => a - b);
    let i = 0;
    for (const cookie of s) {
        if (i < g.length && cookie >= g[i]) i++;
    }
    return i;
};
$JS$,
$JAVA$class Solution {
    public int findContentChildren(int[] g, int[] s) {
        Arrays.sort(g);
        Arrays.sort(s);
        int i = 0;
        for (int cookie : s) {
            if (i < g.length && cookie >= g[i]) i++;
        }
        return i;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int findContentChildren(vector<int>& g, vector<int>& s) {
        sort(g.begin(), g.end());
        sort(s.begin(), s.end());
        int i = 0;
        for (int cookie : s) {
            if (i < (int)g.size() && cookie >= g[i]) i++;
        }
        return i;
    }
};
$CPP$,
'O(n log n + m log m)', 'O(1) extra');

-- ============================================================
-- 2) lemonade-change (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('lemonade-change', 'greedy', 'Lemonade Change', 'Easy',
$$<p>Each lemonade costs $5. Customers pay with $5, $10, or $20 bills (given in order in <code>bills</code>), and you start with no change. Return <code>true</code> iff you can give correct change to every customer.</p>$$,
'', ARRAY[
  'Track counts of $5 and $10 bills. The $20 is never used for change.',
  'For $10 payments, you need one $5. For $20 payments, prefer paying with one $10 + one $5; fall back to three $5s.',
  'Any customer you cannot give change to means return false.'
], '300', 'https://leetcode.com/problems/lemonade-change/',
'lemonadeChange',
'[{"name":"bills","type":"List[int]"}]'::jsonb,
'bool',
'[
  {"inputs":["[5,5,5,10,20]"],"expected":"true"},
  {"inputs":["[5,5,10,10,20]"],"expected":"false"},
  {"inputs":["[5,5,5,5,20]"],"expected":"true"},
  {"inputs":["[10,10]"],"expected":"false"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('lemonade-change', 'python',
$PY$class Solution:
    def lemonadeChange(self, bills: List[int]) -> bool:
        $PY$),
('lemonade-change', 'javascript',
$JS$var lemonadeChange = function(bills) {

};$JS$),
('lemonade-change', 'java',
$JAVA$class Solution {
    public boolean lemonadeChange(int[] bills) {

    }
}$JAVA$),
('lemonade-change', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool lemonadeChange(vector<int>& bills) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('lemonade-change', 1, 'Greedy Change-Making',
'$10 bills can only be used to change a $20, so prefer using them whenever possible — that saves $5s for future $10 customers (who can only be changed with $5s).',
'["five = 0, ten = 0.","For each bill: 5 → five += 1. 10 → if five == 0 return False; five -= 1; ten += 1. 20 → if ten > 0 and five > 0, consume one of each; else if five >= 3, consume three fives; else return False.","Return True after the loop."]'::jsonb,
$PY$class Solution:
    def lemonadeChange(self, bills: List[int]) -> bool:
        five = ten = 0
        for b in bills:
            if b == 5:
                five += 1
            elif b == 10:
                if five == 0:
                    return False
                five -= 1
                ten += 1
            else:
                if ten > 0 and five > 0:
                    ten -= 1
                    five -= 1
                elif five >= 3:
                    five -= 3
                else:
                    return False
        return True
$PY$,
$JS$var lemonadeChange = function(bills) {
    let five = 0, ten = 0;
    for (const b of bills) {
        if (b === 5) five++;
        else if (b === 10) {
            if (five === 0) return false;
            five--; ten++;
        } else {
            if (ten > 0 && five > 0) { ten--; five--; }
            else if (five >= 3) five -= 3;
            else return false;
        }
    }
    return true;
};
$JS$,
$JAVA$class Solution {
    public boolean lemonadeChange(int[] bills) {
        int five = 0, ten = 0;
        for (int b : bills) {
            if (b == 5) five++;
            else if (b == 10) {
                if (five == 0) return false;
                five--; ten++;
            } else {
                if (ten > 0 && five > 0) { ten--; five--; }
                else if (five >= 3) five -= 3;
                else return false;
            }
        }
        return true;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool lemonadeChange(vector<int>& bills) {
        int five = 0, ten = 0;
        for (int b : bills) {
            if (b == 5) five++;
            else if (b == 10) {
                if (five == 0) return false;
                five--; ten++;
            } else {
                if (ten > 0 && five > 0) { ten--; five--; }
                else if (five >= 3) five -= 3;
                else return false;
            }
        }
        return true;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 3) queue-reconstruction-height (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('queue-reconstruction-height', 'greedy', 'Queue Reconstruction by Height', 'Medium',
$$<p>Given an array <code>people</code> where <code>people[i] = [h, k]</code> means person <code>i</code> has height <code>h</code> and exactly <code>k</code> people with height &gt;= <code>h</code> stand in front of them, reconstruct and return the queue.</p>$$,
'', ARRAY[
  'Sort by height descending; ties broken by k ascending. This way taller people are placed first, and shorter insertions later cannot disturb their k-counts.',
  'Insert each person at index k of a growing output list.',
  'After processing every person, the list is the reconstructed queue.'
], '300', 'https://leetcode.com/problems/queue-reconstruction-by-height/',
'reconstructQueue',
'[{"name":"people","type":"List[List[int]]"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["[[7,0],[4,4],[7,1],[5,0],[6,1],[5,2]]"],"expected":"[[5,0],[7,0],[5,2],[6,1],[4,4],[7,1]]"},
  {"inputs":["[[6,0],[5,0],[4,0],[3,2],[2,2],[1,4]]"],"expected":"[[4,0],[5,0],[2,2],[3,2],[1,4],[6,0]]"},
  {"inputs":["[[1,0]]"],"expected":"[[1,0]]"},
  {"inputs":["[[7,0],[7,1]]"],"expected":"[[7,0],[7,1]]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('queue-reconstruction-height', 'python',
$PY$class Solution:
    def reconstructQueue(self, people: List[List[int]]) -> List[List[int]]:
        $PY$),
('queue-reconstruction-height', 'javascript',
$JS$var reconstructQueue = function(people) {

};$JS$),
('queue-reconstruction-height', 'java',
$JAVA$class Solution {
    public int[][] reconstructQueue(int[][] people) {

    }
}$JAVA$),
('queue-reconstruction-height', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> reconstructQueue(vector<vector<int>>& people) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('queue-reconstruction-height', 1, 'Tall-First Insertion',
'A shorter person inserted later cannot change the k-count of a taller person already placed, because a shorter person is invisible to the taller one''s "k taller-or-equal in front" condition. So we greedily place tallest first and insert each later person at their k index in the growing list.',
'["Sort people: height descending, ties by k ascending.","Initialize result = [].","For each person [h, k] in sorted order: insert at index k of result.","Return result."]'::jsonb,
$PY$class Solution:
    def reconstructQueue(self, people: List[List[int]]) -> List[List[int]]:
        people.sort(key=lambda p: (-p[0], p[1]))
        result = []
        for h, k in people:
            result.insert(k, [h, k])
        return result
$PY$,
$JS$var reconstructQueue = function(people) {
    people.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    const result = [];
    for (const [h, k] of people) {
        result.splice(k, 0, [h, k]);
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public int[][] reconstructQueue(int[][] people) {
        Arrays.sort(people, (a, b) -> a[0] != b[0] ? b[0] - a[0] : a[1] - b[1]);
        List<int[]> result = new ArrayList<>();
        for (int[] p : people) result.add(p[1], p);
        return result.toArray(new int[0][]);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<int>> reconstructQueue(vector<vector<int>>& people) {
        sort(people.begin(), people.end(), [](const vector<int>& a, const vector<int>& b) {
            if (a[0] != b[0]) return a[0] > b[0];
            return a[1] < b[1];
        });
        vector<vector<int>> result;
        for (auto& p : people) result.insert(result.begin() + p[1], p);
        return result;
    }
};
$CPP$,
'O(n^2)', 'O(n)');

-- ============================================================
-- 4) min-add-parens-valid (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('min-add-parens-valid', 'greedy', 'Minimum Add to Make Parentheses Valid', 'Medium',
$$<p>Given a string <code>s</code> of <code>(</code> and <code>)</code>, return the minimum number of parentheses to insert so that the resulting string is valid.</p>$$,
'', ARRAY[
  'Track running balance. Scan left to right: +1 for "(", -1 for ")".',
  'If balance drops below zero, that unmatched ")" needs a "(" to be added — increment the answer and reset balance to 0.',
  'Every remaining positive balance at the end is an unmatched "(" that needs a ")" appended.'
], '300', 'https://leetcode.com/problems/minimum-add-to-make-parentheses-valid/',
'minAddToMakeValid',
'[{"name":"s","type":"str"}]'::jsonb,
'int',
'[
  {"inputs":["\"())\""],"expected":"1"},
  {"inputs":["\"(((\""],"expected":"3"},
  {"inputs":["\"()\""],"expected":"0"},
  {"inputs":["\"()))((\""],"expected":"4"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('min-add-parens-valid', 'python',
$PY$class Solution:
    def minAddToMakeValid(self, s: str) -> int:
        $PY$),
('min-add-parens-valid', 'javascript',
$JS$var minAddToMakeValid = function(s) {

};$JS$),
('min-add-parens-valid', 'java',
$JAVA$class Solution {
    public int minAddToMakeValid(String s) {

    }
}$JAVA$),
('min-add-parens-valid', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minAddToMakeValid(string& s) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('min-add-parens-valid', 1, 'Balance Sweep',
'Track a running open-count. Every unmatched close parenthesis (balance about to go negative) forces one insertion of "(" and resets the balance; every unmatched open parenthesis at the end forces one insertion of ")". The sum of these two counts is the minimum.',
'["opens = 0, inserts = 0.","For each c in s: if c == \"(\", opens += 1. Else: if opens > 0, opens -= 1; else inserts += 1.","Return inserts + opens."]'::jsonb,
$PY$class Solution:
    def minAddToMakeValid(self, s: str) -> int:
        opens = 0
        inserts = 0
        for c in s:
            if c == '(':
                opens += 1
            elif opens > 0:
                opens -= 1
            else:
                inserts += 1
        return inserts + opens
$PY$,
$JS$var minAddToMakeValid = function(s) {
    let opens = 0, inserts = 0;
    for (const c of s) {
        if (c === '(') opens++;
        else if (opens > 0) opens--;
        else inserts++;
    }
    return inserts + opens;
};
$JS$,
$JAVA$class Solution {
    public int minAddToMakeValid(String s) {
        int opens = 0, inserts = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '(') opens++;
            else if (opens > 0) opens--;
            else inserts++;
        }
        return inserts + opens;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minAddToMakeValid(string& s) {
        int opens = 0, inserts = 0;
        for (char c : s) {
            if (c == '(') opens++;
            else if (opens > 0) opens--;
            else inserts++;
        }
        return inserts + opens;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 5) boats-to-save-people (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('boats-to-save-people', 'greedy', 'Boats to Save People', 'Medium',
$$<p>Each boat can hold at most 2 people whose combined weight is at most <code>limit</code>. Given an array <code>people</code> of weights, return the minimum number of boats required.</p>$$,
'', ARRAY[
  'Sort weights. Pair the lightest remaining person with the heaviest remaining person.',
  'If they fit together, advance both pointers; otherwise the heaviest goes alone and you advance only the right pointer.',
  'Count boats used — one per iteration.'
], '300', 'https://leetcode.com/problems/boats-to-save-people/',
'numRescueBoats',
'[{"name":"people","type":"List[int]"},{"name":"limit","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[1,2]","3"],"expected":"1"},
  {"inputs":["[3,2,2,1]","3"],"expected":"3"},
  {"inputs":["[3,5,3,4]","5"],"expected":"4"},
  {"inputs":["[5,1,4,2]","6"],"expected":"2"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('boats-to-save-people', 'python',
$PY$class Solution:
    def numRescueBoats(self, people: List[int], limit: int) -> int:
        $PY$),
('boats-to-save-people', 'javascript',
$JS$var numRescueBoats = function(people, limit) {

};$JS$),
('boats-to-save-people', 'java',
$JAVA$class Solution {
    public int numRescueBoats(int[] people, int limit) {

    }
}$JAVA$),
('boats-to-save-people', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numRescueBoats(vector<int>& people, int limit) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('boats-to-save-people', 1, 'Sort + Two Pointers',
'Pairing the lightest remaining person with the heaviest remaining person never makes things worse: if they fit together you remove two people per boat, otherwise the heavy one must go alone no matter what pairing you try.',
'["Sort people ascending.","lo = 0, hi = n - 1, boats = 0.","While lo <= hi: boats += 1. If people[lo] + people[hi] <= limit, lo += 1. hi -= 1 unconditionally.","Return boats."]'::jsonb,
$PY$class Solution:
    def numRescueBoats(self, people: List[int], limit: int) -> int:
        people.sort()
        lo, hi = 0, len(people) - 1
        boats = 0
        while lo <= hi:
            boats += 1
            if people[lo] + people[hi] <= limit:
                lo += 1
            hi -= 1
        return boats
$PY$,
$JS$var numRescueBoats = function(people, limit) {
    people.sort((a, b) => a - b);
    let lo = 0, hi = people.length - 1, boats = 0;
    while (lo <= hi) {
        boats++;
        if (people[lo] + people[hi] <= limit) lo++;
        hi--;
    }
    return boats;
};
$JS$,
$JAVA$class Solution {
    public int numRescueBoats(int[] people, int limit) {
        Arrays.sort(people);
        int lo = 0, hi = people.length - 1, boats = 0;
        while (lo <= hi) {
            boats++;
            if (people[lo] + people[hi] <= limit) lo++;
            hi--;
        }
        return boats;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int numRescueBoats(vector<int>& people, int limit) {
        sort(people.begin(), people.end());
        int lo = 0, hi = people.size() - 1, boats = 0;
        while (lo <= hi) {
            boats++;
            if (people[lo] + people[hi] <= limit) lo++;
            hi--;
        }
        return boats;
    }
};
$CPP$,
'O(n log n)', 'O(1)');

-- ============================================================
-- 6) candy (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('candy', 'greedy', 'Candy', 'Hard',
$$<p><code>n</code> children stand in a line with ratings <code>ratings[i]</code>. Each child gets at least one candy, and a child with a strictly higher rating than an immediate neighbor must get more candy than that neighbor. Return the minimum total candies.</p>$$,
'', ARRAY[
  'One pass is not enough because a rating can rise from either side.',
  'Two passes: left-to-right to enforce the left-neighbor rule; right-to-left to enforce the right-neighbor rule. Store the running max at each index.',
  'Sum the per-child maxes for the answer.'
], '300', 'https://leetcode.com/problems/candy/',
'candy',
'[{"name":"ratings","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["[1,0,2]"],"expected":"5"},
  {"inputs":["[1,2,2]"],"expected":"4"},
  {"inputs":["[1]"],"expected":"1"},
  {"inputs":["[1,3,4,5,2]"],"expected":"11"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('candy', 'python',
$PY$class Solution:
    def candy(self, ratings: List[int]) -> int:
        $PY$),
('candy', 'javascript',
$JS$var candy = function(ratings) {

};$JS$),
('candy', 'java',
$JAVA$class Solution {
    public int candy(int[] ratings) {

    }
}$JAVA$),
('candy', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int candy(vector<int>& ratings) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('candy', 1, 'Two Sweeps',
'Each child has two neighbor constraints to respect. Sweeping once left-to-right fixes the left constraint (raise candy when rating increases from the left); a second right-to-left sweep fixes the right constraint. Per-child we take the maximum of the two sweeps.',
'["Allocate candies[n] = 1.","Left sweep: for i from 1 to n - 1: if ratings[i] > ratings[i - 1], candies[i] = candies[i - 1] + 1.","Right sweep: for i from n - 2 down to 0: if ratings[i] > ratings[i + 1] and candies[i] <= candies[i + 1], candies[i] = candies[i + 1] + 1.","Return sum(candies)."]'::jsonb,
$PY$class Solution:
    def candy(self, ratings: List[int]) -> int:
        n = len(ratings)
        candies = [1] * n
        for i in range(1, n):
            if ratings[i] > ratings[i - 1]:
                candies[i] = candies[i - 1] + 1
        for i in range(n - 2, -1, -1):
            if ratings[i] > ratings[i + 1] and candies[i] <= candies[i + 1]:
                candies[i] = candies[i + 1] + 1
        return sum(candies)
$PY$,
$JS$var candy = function(ratings) {
    const n = ratings.length;
    const candies = new Array(n).fill(1);
    for (let i = 1; i < n; i++) {
        if (ratings[i] > ratings[i - 1]) candies[i] = candies[i - 1] + 1;
    }
    for (let i = n - 2; i >= 0; i--) {
        if (ratings[i] > ratings[i + 1] && candies[i] <= candies[i + 1]) candies[i] = candies[i + 1] + 1;
    }
    return candies.reduce((a, b) => a + b, 0);
};
$JS$,
$JAVA$class Solution {
    public int candy(int[] ratings) {
        int n = ratings.length;
        int[] candies = new int[n];
        Arrays.fill(candies, 1);
        for (int i = 1; i < n; i++) {
            if (ratings[i] > ratings[i - 1]) candies[i] = candies[i - 1] + 1;
        }
        for (int i = n - 2; i >= 0; i--) {
            if (ratings[i] > ratings[i + 1] && candies[i] <= candies[i + 1]) candies[i] = candies[i + 1] + 1;
        }
        int total = 0;
        for (int c : candies) total += c;
        return total;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int candy(vector<int>& ratings) {
        int n = ratings.size();
        vector<int> candies(n, 1);
        for (int i = 1; i < n; i++) {
            if (ratings[i] > ratings[i - 1]) candies[i] = candies[i - 1] + 1;
        }
        for (int i = n - 2; i >= 0; i--) {
            if (ratings[i] > ratings[i + 1] && candies[i] <= candies[i + 1]) candies[i] = candies[i + 1] + 1;
        }
        int total = 0;
        for (int c : candies) total += c;
        return total;
    }
};
$CPP$,
'O(n)', 'O(n)');

COMMIT;
