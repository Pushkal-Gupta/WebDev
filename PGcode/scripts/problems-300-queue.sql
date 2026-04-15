-- Grow catalog 200 → 300: queue topic (+8 problems).
-- Each problem ships with metadata + test cases + 4-language starter templates
-- + one reference approach with Python/JS/Java/C++ code and complexity.
BEGIN;

-- Idempotent: drop any prior rows for these IDs so the file can be re-applied.
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'first-unique-character','time-needed-to-buy-tickets','count-students-unable-to-eat-lunch',
  'reveal-cards-in-increasing-order','open-the-lock','zero-one-matrix',
  'minimum-genetic-mutation','shortest-subarray-sum-k'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'first-unique-character','time-needed-to-buy-tickets','count-students-unable-to-eat-lunch',
  'reveal-cards-in-increasing-order','open-the-lock','zero-one-matrix',
  'minimum-genetic-mutation','shortest-subarray-sum-k'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'first-unique-character','time-needed-to-buy-tickets','count-students-unable-to-eat-lunch',
  'reveal-cards-in-increasing-order','open-the-lock','zero-one-matrix',
  'minimum-genetic-mutation','shortest-subarray-sum-k'
);

-- ============================================================
-- 1) first-unique-character (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('first-unique-character', 'queue', 'First Unique Character in a String', 'Easy',
$$<p>Given a string <code>s</code>, return the index of the <strong>first non-repeating character</strong> in it. If it does not exist, return <code>-1</code>.</p><p>The string contains only lowercase English letters.</p>$$,
'', ARRAY[
  'Build a frequency map of the characters first — you need to know which chars are unique before you can find the earliest one.',
  'Alternatively stream a queue of candidate indices; evict the front while it points to a now-duplicated char.',
  'Both approaches are O(n) time and O(1) extra space because the alphabet is bounded.'
], '300', 'https://leetcode.com/problems/first-unique-character-in-a-string/',
'firstUniqChar',
'[{"name":"s","type":"str"}]'::jsonb,
'int',
'[
  {"inputs":["\"leetcode\""],"expected":"0"},
  {"inputs":["\"loveleetcode\""],"expected":"2"},
  {"inputs":["\"aabb\""],"expected":"-1"},
  {"inputs":["\"z\""],"expected":"0"},
  {"inputs":["\"dddccdbba\""],"expected":"8"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('first-unique-character', 'python',
$PY$class Solution:
    def firstUniqChar(self, s: str) -> int:
        $PY$),
('first-unique-character', 'javascript',
$JS$/**
 * @param {string} s
 * @return {number}
 */
var firstUniqChar = function(s) {

};$JS$),
('first-unique-character', 'java',
$JAVA$class Solution {
    public int firstUniqChar(String s) {

    }
}$JAVA$),
('first-unique-character', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int firstUniqChar(string& s) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('first-unique-character', 1, 'Frequency Count + Scan',
'The first unique character is the leftmost character whose total count in the string is exactly one. Counting in one pass and scanning in a second pass is O(n) and trivial to reason about.',
'["Count every character of s into a hash map / 26-int array.","Walk s left to right; return the first index whose character has count 1.","If nothing has count 1, return -1."]'::jsonb,
$PY$class Solution:
    def firstUniqChar(self, s: str) -> int:
        count = {}
        for ch in s:
            count[ch] = count.get(ch, 0) + 1
        for i, ch in enumerate(s):
            if count[ch] == 1:
                return i
        return -1
$PY$,
$JS$var firstUniqChar = function(s) {
    const count = new Array(26).fill(0);
    for (const ch of s) count[ch.charCodeAt(0) - 97]++;
    for (let i = 0; i < s.length; i++) {
        if (count[s.charCodeAt(i) - 97] === 1) return i;
    }
    return -1;
};
$JS$,
$JAVA$class Solution {
    public int firstUniqChar(String s) {
        int[] count = new int[26];
        for (int i = 0; i < s.length(); i++) count[s.charAt(i) - 'a']++;
        for (int i = 0; i < s.length(); i++) {
            if (count[s.charAt(i) - 'a'] == 1) return i;
        }
        return -1;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int firstUniqChar(string& s) {
        int count[26] = {0};
        for (char ch : s) count[ch - 'a']++;
        for (int i = 0; i < (int)s.size(); i++) {
            if (count[s[i] - 'a'] == 1) return i;
        }
        return -1;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 2) time-needed-to-buy-tickets (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('time-needed-to-buy-tickets', 'queue', 'Time Needed to Buy Tickets', 'Easy',
$$<p><code>n</code> people are in a queue, each needing to buy <code>tickets[i]</code> tickets. Each second, the person at the front of the queue buys exactly one ticket; if they still need more they re-join the back of the queue. Return the total seconds for the person at index <code>k</code> to finish buying all of their tickets.</p>$$,
'', ARRAY[
  'Simulate the queue literally: pop the front, decrement their tickets, push them back if they still need more. Stop when person k has zero tickets left.',
  'The simulation is O(sum(tickets)); for small constraints that is fine.',
  'For a closed form: every person contributes min(tickets[i], tickets[k]) seconds, except those strictly after k who contribute only min(tickets[i], tickets[k] - 1).'
], '300', 'https://leetcode.com/problems/time-needed-to-buy-tickets/',
'timeRequiredToBuy',
'[{"name":"tickets","type":"List[int]"},{"name":"k","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[2,3,2]","2"],"expected":"6"},
  {"inputs":["[5,1,1,1]","0"],"expected":"8"},
  {"inputs":["[1,1,1]","1"],"expected":"2"},
  {"inputs":["[84,49,5,24,70,77,87,8]","3"],"expected":"154"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('time-needed-to-buy-tickets', 'python',
$PY$class Solution:
    def timeRequiredToBuy(self, tickets: List[int], k: int) -> int:
        $PY$),
('time-needed-to-buy-tickets', 'javascript',
$JS$/**
 * @param {number[]} tickets
 * @param {number} k
 * @return {number}
 */
var timeRequiredToBuy = function(tickets, k) {

};$JS$),
('time-needed-to-buy-tickets', 'java',
$JAVA$class Solution {
    public int timeRequiredToBuy(int[] tickets, int k) {

    }
}$JAVA$),
('time-needed-to-buy-tickets', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int timeRequiredToBuy(vector<int>& tickets, int k) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('time-needed-to-buy-tickets', 1, 'Closed-Form Count',
'Nobody needs more seconds than person k does. For people before k (inclusive of k) every one of their tickets up to tickets[k] is a second we must wait. For people after k we only wait for their first tickets[k] - 1 tickets because k finishes on their tickets[k]-th second.',
'["Let t = tickets[k]. Initialize total = 0.","For each i from 0 to n - 1: if i <= k, add min(tickets[i], t) to total; else add min(tickets[i], t - 1).","Return total."]'::jsonb,
$PY$class Solution:
    def timeRequiredToBuy(self, tickets: List[int], k: int) -> int:
        t = tickets[k]
        total = 0
        for i, v in enumerate(tickets):
            total += min(v, t) if i <= k else min(v, t - 1)
        return total
$PY$,
$JS$var timeRequiredToBuy = function(tickets, k) {
    const t = tickets[k];
    let total = 0;
    for (let i = 0; i < tickets.length; i++) {
        total += i <= k ? Math.min(tickets[i], t) : Math.min(tickets[i], t - 1);
    }
    return total;
};
$JS$,
$JAVA$class Solution {
    public int timeRequiredToBuy(int[] tickets, int k) {
        int t = tickets[k];
        int total = 0;
        for (int i = 0; i < tickets.length; i++) {
            total += i <= k ? Math.min(tickets[i], t) : Math.min(tickets[i], t - 1);
        }
        return total;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int timeRequiredToBuy(vector<int>& tickets, int k) {
        int t = tickets[k];
        int total = 0;
        for (int i = 0; i < (int)tickets.size(); i++) {
            total += (i <= k) ? min(tickets[i], t) : min(tickets[i], t - 1);
        }
        return total;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 3) count-students-unable-to-eat-lunch (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('count-students-unable-to-eat-lunch', 'queue', 'Number of Students Unable to Eat Lunch', 'Easy',
$$<p>Students form a queue and sandwiches form a stack, both containing circular (0) or square (1) preferences. At each step the student at the front takes the top sandwich if it matches their preference; otherwise they move to the back. The process stops when no student in the queue wants the top sandwich. Return how many students are unable to eat.</p>$$,
'', ARRAY[
  'The order of students in the queue never matters for the termination condition — only how many of each type remain.',
  'Walk the sandwich stack from the top. For each sandwich, if at least one student still wants that type, consume one; otherwise nobody ever will, so stop.',
  'Return the total remaining students when the walk stops.'
], '300', 'https://leetcode.com/problems/number-of-students-unable-to-eat-lunch/',
'countStudents',
'[{"name":"students","type":"List[int]"},{"name":"sandwiches","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["[1,1,0,0]","[0,1,0,1]"],"expected":"0"},
  {"inputs":["[1,1,1,0,0,1]","[1,0,0,0,1,1]"],"expected":"3"},
  {"inputs":["[0]","[1]"],"expected":"1"},
  {"inputs":["[0,0,0]","[0,0,0]"],"expected":"0"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('count-students-unable-to-eat-lunch', 'python',
$PY$class Solution:
    def countStudents(self, students: List[int], sandwiches: List[int]) -> int:
        $PY$),
('count-students-unable-to-eat-lunch', 'javascript',
$JS$/**
 * @param {number[]} students
 * @param {number[]} sandwiches
 * @return {number}
 */
var countStudents = function(students, sandwiches) {

};$JS$),
('count-students-unable-to-eat-lunch', 'java',
$JAVA$class Solution {
    public int countStudents(int[] students, int[] sandwiches) {

    }
}$JAVA$),
('count-students-unable-to-eat-lunch', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countStudents(vector<int>& students, vector<int>& sandwiches) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('count-students-unable-to-eat-lunch', 1, 'Count and Walk',
'Only the counts of each preference matter. Walk the sandwich stack: as long as at least one student still wants the top sandwich, consume it; the first time nobody wants the top, every remaining student is stuck.',
'["Count zeros and ones in students.","For each sandwich s in order: if count[s] > 0, decrement and continue; else return count[0] + count[1] (everyone left is stuck).","If the loop finishes, everyone ate — return 0."]'::jsonb,
$PY$class Solution:
    def countStudents(self, students: List[int], sandwiches: List[int]) -> int:
        count = [0, 0]
        for v in students:
            count[v] += 1
        for s in sandwiches:
            if count[s] == 0:
                return count[0] + count[1]
            count[s] -= 1
        return 0
$PY$,
$JS$var countStudents = function(students, sandwiches) {
    const count = [0, 0];
    for (const v of students) count[v]++;
    for (const s of sandwiches) {
        if (count[s] === 0) return count[0] + count[1];
        count[s]--;
    }
    return 0;
};
$JS$,
$JAVA$class Solution {
    public int countStudents(int[] students, int[] sandwiches) {
        int[] count = new int[2];
        for (int v : students) count[v]++;
        for (int s : sandwiches) {
            if (count[s] == 0) return count[0] + count[1];
            count[s]--;
        }
        return 0;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int countStudents(vector<int>& students, vector<int>& sandwiches) {
        int count[2] = {0, 0};
        for (int v : students) count[v]++;
        for (int s : sandwiches) {
            if (count[s] == 0) return count[0] + count[1];
            count[s]--;
        }
        return 0;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 4) reveal-cards-in-increasing-order (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('reveal-cards-in-increasing-order', 'queue', 'Reveal Cards In Increasing Order', 'Medium',
$$<p>Given a deck of unique integers, return an ordering of the deck such that the following process reveals them in increasing order: repeatedly take the top card (reveal it), then if any cards remain, move the new top card to the bottom of the deck.</p>$$,
'', ARRAY[
  'Work backwards: simulate the reveal process with a queue of slot indices [0, 1, ..., n-1] and the sorted cards.',
  'For each sorted card value: pop the front slot index, write the card there, then move the next front index to the back of the queue.',
  'When the queue is empty you have filled the correct original deck order.'
], '300', 'https://leetcode.com/problems/reveal-cards-in-increasing-order/',
'deckRevealedIncreasing',
'[{"name":"deck","type":"List[int]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[17,13,11,2,3,5,7]"],"expected":"[2,13,3,11,5,17,7]"},
  {"inputs":["[1,1000]"],"expected":"[1,1000]"},
  {"inputs":["[1]"],"expected":"[1]"},
  {"inputs":["[1,2,3,4,5,6,7,8]"],"expected":"[1,6,2,8,3,7,4,5]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('reveal-cards-in-increasing-order', 'python',
$PY$class Solution:
    def deckRevealedIncreasing(self, deck: List[int]) -> List[int]:
        $PY$),
('reveal-cards-in-increasing-order', 'javascript',
$JS$/**
 * @param {number[]} deck
 * @return {number[]}
 */
var deckRevealedIncreasing = function(deck) {

};$JS$),
('reveal-cards-in-increasing-order', 'java',
$JAVA$class Solution {
    public int[] deckRevealedIncreasing(int[] deck) {

    }
}$JAVA$),
('reveal-cards-in-increasing-order', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> deckRevealedIncreasing(vector<int>& deck) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('reveal-cards-in-increasing-order', 1, 'Slot Queue Simulation',
'The reveal process is deterministic given the deck order, so we simulate it in reverse. Maintain a queue of output slots 0..n-1 and walk the sorted cards in increasing order — each card claims the front slot and then the next front slot gets rotated to the back, exactly mirroring the reveal rule.',
'["Sort deck ascending.","Initialize a queue of indices [0, 1, ..., n-1] and a result array of size n.","For each card in the sorted deck: popleft an index i, set result[i] = card; if the queue is non-empty, popleft and append (rotate)."]'::jsonb,
$PY$class Solution:
    def deckRevealedIncreasing(self, deck: List[int]) -> List[int]:
        from collections import deque
        deck.sort()
        n = len(deck)
        q = deque(range(n))
        result = [0] * n
        for card in deck:
            result[q.popleft()] = card
            if q:
                q.append(q.popleft())
        return result
$PY$,
$JS$var deckRevealedIncreasing = function(deck) {
    deck.sort((a, b) => a - b);
    const n = deck.length;
    const q = [];
    for (let i = 0; i < n; i++) q.push(i);
    const result = new Array(n);
    for (const card of deck) {
        result[q.shift()] = card;
        if (q.length) q.push(q.shift());
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public int[] deckRevealedIncreasing(int[] deck) {
        Arrays.sort(deck);
        int n = deck.length;
        Deque<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < n; i++) q.offer(i);
        int[] result = new int[n];
        for (int card : deck) {
            result[q.poll()] = card;
            if (!q.isEmpty()) q.offer(q.poll());
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> deckRevealedIncreasing(vector<int>& deck) {
        sort(deck.begin(), deck.end());
        int n = deck.size();
        deque<int> q;
        for (int i = 0; i < n; i++) q.push_back(i);
        vector<int> result(n);
        for (int card : deck) {
            result[q.front()] = card; q.pop_front();
            if (!q.empty()) { q.push_back(q.front()); q.pop_front(); }
        }
        return result;
    }
};
$CPP$,
'O(n log n)', 'O(n)');

-- ============================================================
-- 5) open-the-lock (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('open-the-lock', 'queue', 'Open the Lock', 'Medium',
$$<p>A 4-wheel lock starts at <code>"0000"</code>. Each move turns one wheel one step forward or back (with wrap-around between 0 and 9). Given a list of <code>deadends</code> the lock must not land on, return the minimum number of moves to reach <code>target</code>, or <code>-1</code> if impossible.</p>$$,
'', ARRAY[
  'Each lock state is a node; each move is an edge to one of 8 neighbors. Shortest path on an unweighted graph → BFS.',
  'Seed a visited set with the deadends and the starting state. Pop level by level; the level count when you first pop target is the answer.',
  'If the queue drains without visiting target, return -1.'
], '300', 'https://leetcode.com/problems/open-the-lock/',
'openLock',
'[{"name":"deadends","type":"List[str]"},{"name":"target","type":"str"}]'::jsonb,
'int',
'[
  {"inputs":["[\"0201\",\"0101\",\"0102\",\"1212\",\"2002\"]","\"0202\""],"expected":"6"},
  {"inputs":["[\"8888\"]","\"0009\""],"expected":"1"},
  {"inputs":["[\"8887\",\"8889\",\"8878\",\"8898\",\"8788\",\"8988\",\"7888\",\"9888\"]","\"8888\""],"expected":"-1"},
  {"inputs":["[\"0000\"]","\"8888\""],"expected":"-1"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('open-the-lock', 'python',
$PY$class Solution:
    def openLock(self, deadends: List[str], target: str) -> int:
        $PY$),
('open-the-lock', 'javascript',
$JS$/**
 * @param {string[]} deadends
 * @param {string} target
 * @return {number}
 */
var openLock = function(deadends, target) {

};$JS$),
('open-the-lock', 'java',
$JAVA$class Solution {
    public int openLock(String[] deadends, String target) {

    }
}$JAVA$),
('open-the-lock', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int openLock(vector<string>& deadends, string& target) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('open-the-lock', 1, 'BFS Over Wheel States',
'Treat every 4-digit combination as a graph node with 8 outgoing edges (one per wheel × direction). Dead ends and visited states are blocked. BFS from "0000" gives the minimum move count — or -1 if the target is unreachable.',
'["Add all deadends to a visited set; if \"0000\" is in it, return -1.","Push (\"0000\", 0) into a FIFO queue and add \"0000\" to visited.","Pop (state, moves). If state == target, return moves. Otherwise generate all 8 neighbors (each wheel ± 1 mod 10); push each unvisited non-deadend neighbor with moves+1 and mark visited.","If the queue empties, return -1."]'::jsonb,
$PY$class Solution:
    def openLock(self, deadends: List[str], target: str) -> int:
        from collections import deque
        visited = set(deadends)
        if "0000" in visited:
            return -1
        if target == "0000":
            return 0
        queue = deque([("0000", 0)])
        visited.add("0000")
        while queue:
            state, moves = queue.popleft()
            for i in range(4):
                d = int(state[i])
                for step in (-1, 1):
                    nd = (d + step) % 10
                    nxt = state[:i] + str(nd) + state[i+1:]
                    if nxt == target:
                        return moves + 1
                    if nxt not in visited:
                        visited.add(nxt)
                        queue.append((nxt, moves + 1))
        return -1
$PY$,
$JS$var openLock = function(deadends, target) {
    const visited = new Set(deadends);
    if (visited.has("0000")) return -1;
    if (target === "0000") return 0;
    const queue = [["0000", 0]];
    visited.add("0000");
    while (queue.length) {
        const [state, moves] = queue.shift();
        for (let i = 0; i < 4; i++) {
            const d = state.charCodeAt(i) - 48;
            for (const step of [-1, 1]) {
                const nd = (d + step + 10) % 10;
                const nxt = state.slice(0, i) + nd + state.slice(i + 1);
                if (nxt === target) return moves + 1;
                if (!visited.has(nxt)) {
                    visited.add(nxt);
                    queue.push([nxt, moves + 1]);
                }
            }
        }
    }
    return -1;
};
$JS$,
$JAVA$class Solution {
    public int openLock(String[] deadends, String target) {
        Set<String> visited = new HashSet<>(Arrays.asList(deadends));
        if (visited.contains("0000")) return -1;
        if (target.equals("0000")) return 0;
        Deque<String> queue = new ArrayDeque<>();
        queue.offer("0000");
        visited.add("0000");
        int moves = 0;
        while (!queue.isEmpty()) {
            moves++;
            int size = queue.size();
            for (int k = 0; k < size; k++) {
                String state = queue.poll();
                char[] chars = state.toCharArray();
                for (int i = 0; i < 4; i++) {
                    char original = chars[i];
                    for (int step : new int[]{-1, 1}) {
                        chars[i] = (char) ('0' + ((original - '0' + step + 10) % 10));
                        String nxt = new String(chars);
                        if (nxt.equals(target)) return moves;
                        if (!visited.contains(nxt)) {
                            visited.add(nxt);
                            queue.offer(nxt);
                        }
                    }
                    chars[i] = original;
                }
            }
        }
        return -1;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int openLock(vector<string>& deadends, string& target) {
        unordered_set<string> visited(deadends.begin(), deadends.end());
        if (visited.count("0000")) return -1;
        if (target == "0000") return 0;
        queue<pair<string,int>> q;
        q.push({"0000", 0});
        visited.insert("0000");
        while (!q.empty()) {
            auto [state, moves] = q.front(); q.pop();
            for (int i = 0; i < 4; i++) {
                int d = state[i] - '0';
                for (int step : {-1, 1}) {
                    int nd = (d + step + 10) % 10;
                    string nxt = state;
                    nxt[i] = char('0' + nd);
                    if (nxt == target) return moves + 1;
                    if (!visited.count(nxt)) {
                        visited.insert(nxt);
                        q.push({nxt, moves + 1});
                    }
                }
            }
        }
        return -1;
    }
};
$CPP$,
'O(10000)', 'O(10000)');

-- ============================================================
-- 6) zero-one-matrix (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('zero-one-matrix', 'queue', '01 Matrix', 'Medium',
$$<p>Given an <code>m x n</code> binary matrix <code>mat</code>, return a matrix of the same shape where each cell stores the distance to the nearest <code>0</code>. The distance between two adjacent cells is 1.</p>$$,
'', ARRAY[
  'Flipping the problem around is the key trick: instead of asking "where is the closest 0?" for every 1, let all 0s expand outward simultaneously.',
  'Multi-source BFS — seed the queue with every 0 at distance 0 and every 1 at infinity.',
  'When you pop a cell, relax its 4 neighbors if you can improve their distance; each cell is relaxed at most once.'
], '300', 'https://leetcode.com/problems/01-matrix/',
'updateMatrix',
'[{"name":"mat","type":"List[List[int]]"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["[[0,0,0],[0,1,0],[0,0,0]]"],"expected":"[[0,0,0],[0,1,0],[0,0,0]]"},
  {"inputs":["[[0,0,0],[0,1,0],[1,1,1]]"],"expected":"[[0,0,0],[0,1,0],[1,2,1]]"},
  {"inputs":["[[0]]"],"expected":"[[0]]"},
  {"inputs":["[[1,0,1],[0,0,0],[1,0,1]]"],"expected":"[[1,0,1],[0,0,0],[1,0,1]]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('zero-one-matrix', 'python',
$PY$class Solution:
    def updateMatrix(self, mat: List[List[int]]) -> List[List[int]]:
        $PY$),
('zero-one-matrix', 'javascript',
$JS$/**
 * @param {number[][]} mat
 * @return {number[][]}
 */
var updateMatrix = function(mat) {

};$JS$),
('zero-one-matrix', 'java',
$JAVA$class Solution {
    public int[][] updateMatrix(int[][] mat) {

    }
}$JAVA$),
('zero-one-matrix', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> updateMatrix(vector<vector<int>>& mat) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('zero-one-matrix', 1, 'Multi-Source BFS',
'Start BFS from every 0 simultaneously. Because all edges have weight 1 and every 0 starts at distance 0, the first time BFS visits a 1 it is via its shortest path — exactly the nearest-zero distance.',
'["Seed a queue with every (r, c) where mat[r][c] == 0; leave those distances at 0 and mark every 1 as unvisited (e.g. set to -1 or use a separate visited matrix).","Pop cells in FIFO order. For each of the 4 neighbors (nr, nc): if it has not yet been assigned a distance, set dist[nr][nc] = dist[r][c] + 1 and enqueue.","Return the distance matrix once the queue is empty."]'::jsonb,
$PY$class Solution:
    def updateMatrix(self, mat: List[List[int]]) -> List[List[int]]:
        from collections import deque
        m, n = len(mat), len(mat[0])
        dist = [[-1] * n for _ in range(m)]
        queue = deque()
        for r in range(m):
            for c in range(n):
                if mat[r][c] == 0:
                    dist[r][c] = 0
                    queue.append((r, c))
        while queue:
            r, c = queue.popleft()
            for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < m and 0 <= nc < n and dist[nr][nc] == -1:
                    dist[nr][nc] = dist[r][c] + 1
                    queue.append((nr, nc))
        return dist
$PY$,
$JS$var updateMatrix = function(mat) {
    const m = mat.length, n = mat[0].length;
    const dist = Array.from({ length: m }, () => new Array(n).fill(-1));
    const queue = [];
    for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
        if (mat[r][c] === 0) { dist[r][c] = 0; queue.push([r, c]); }
    }
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    while (queue.length) {
        const [r, c] = queue.shift();
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < m && nc >= 0 && nc < n && dist[nr][nc] === -1) {
                dist[nr][nc] = dist[r][c] + 1;
                queue.push([nr, nc]);
            }
        }
    }
    return dist;
};
$JS$,
$JAVA$class Solution {
    public int[][] updateMatrix(int[][] mat) {
        int m = mat.length, n = mat[0].length;
        int[][] dist = new int[m][n];
        for (int[] row : dist) Arrays.fill(row, -1);
        Deque<int[]> queue = new ArrayDeque<>();
        for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) {
            if (mat[r][c] == 0) { dist[r][c] = 0; queue.offer(new int[]{r, c}); }
        }
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!queue.isEmpty()) {
            int[] cell = queue.poll();
            for (int[] d : dirs) {
                int nr = cell[0] + d[0], nc = cell[1] + d[1];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n && dist[nr][nc] == -1) {
                    dist[nr][nc] = dist[cell[0]][cell[1]] + 1;
                    queue.offer(new int[]{nr, nc});
                }
            }
        }
        return dist;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<int>> updateMatrix(vector<vector<int>>& mat) {
        int m = mat.size(), n = mat[0].size();
        vector<vector<int>> dist(m, vector<int>(n, -1));
        queue<pair<int,int>> q;
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++)
                if (mat[r][c] == 0) { dist[r][c] = 0; q.push({r, c}); }
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        while (!q.empty()) {
            auto [r, c] = q.front(); q.pop();
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n && dist[nr][nc] == -1) {
                    dist[nr][nc] = dist[r][c] + 1;
                    q.push({nr, nc});
                }
            }
        }
        return dist;
    }
};
$CPP$,
'O(m * n)', 'O(m * n)');

-- ============================================================
-- 7) minimum-genetic-mutation (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('minimum-genetic-mutation', 'queue', 'Minimum Genetic Mutation', 'Medium',
$$<p>A gene string is 8 characters long drawn from {A, C, G, T}. A mutation changes exactly one character. Given <code>startGene</code>, <code>endGene</code>, and a <code>bank</code> of allowed intermediate strings, return the minimum number of mutations to reach <code>endGene</code>, or <code>-1</code> if impossible.</p>$$,
'', ARRAY[
  'Single-character mutations on an alphabet of 4 make each gene a graph node with up to 24 neighbors (8 positions × 3 other chars).',
  'BFS from startGene and return the depth at which you first pop endGene.',
  'Keep a set of allowed strings (the bank) for O(1) membership checks; mark nodes visited as you enqueue to avoid revisits.'
], '300', 'https://leetcode.com/problems/minimum-genetic-mutation/',
'minMutation',
'[{"name":"startGene","type":"str"},{"name":"endGene","type":"str"},{"name":"bank","type":"List[str]"}]'::jsonb,
'int',
'[
  {"inputs":["\"AACCGGTT\"","\"AACCGGTA\"","[\"AACCGGTA\"]"],"expected":"1"},
  {"inputs":["\"AACCGGTT\"","\"AAACGGTA\"","[\"AACCGGTA\",\"AACCGCTA\",\"AAACGGTA\"]"],"expected":"2"},
  {"inputs":["\"AAAAACCC\"","\"AACCCCCC\"","[\"AAAACCCC\",\"AAACCCCC\",\"AACCCCCC\"]"],"expected":"3"},
  {"inputs":["\"AACCGGTT\"","\"AAACGGTA\"","[]"],"expected":"-1"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('minimum-genetic-mutation', 'python',
$PY$class Solution:
    def minMutation(self, startGene: str, endGene: str, bank: List[str]) -> int:
        $PY$),
('minimum-genetic-mutation', 'javascript',
$JS$/**
 * @param {string} startGene
 * @param {string} endGene
 * @param {string[]} bank
 * @return {number}
 */
var minMutation = function(startGene, endGene, bank) {

};$JS$),
('minimum-genetic-mutation', 'java',
$JAVA$class Solution {
    public int minMutation(String startGene, String endGene, String[] bank) {

    }
}$JAVA$),
('minimum-genetic-mutation', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minMutation(string& startGene, string& endGene, vector<string>& bank) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('minimum-genetic-mutation', 1, 'BFS Over Gene Strings',
'Treat each gene as a vertex and connect vertices that differ by exactly one character (provided the neighbor is in the bank). The shortest unweighted path from startGene to endGene is the minimum mutation count — classic BFS territory.',
'["If endGene is not in the bank, return -1 immediately.","Seed a FIFO queue with (startGene, 0) and a visited set containing startGene.","Pop (gene, steps). If gene == endGene, return steps. Otherwise generate every one-character mutation that is in the bank and not yet visited; enqueue with steps+1.","If the queue drains, return -1."]'::jsonb,
$PY$class Solution:
    def minMutation(self, startGene: str, endGene: str, bank: List[str]) -> int:
        from collections import deque
        bank_set = set(bank)
        if endGene not in bank_set:
            return -1
        queue = deque([(startGene, 0)])
        visited = {startGene}
        while queue:
            gene, steps = queue.popleft()
            if gene == endGene:
                return steps
            for i in range(8):
                for ch in "ACGT":
                    if ch == gene[i]:
                        continue
                    nxt = gene[:i] + ch + gene[i+1:]
                    if nxt in bank_set and nxt not in visited:
                        visited.add(nxt)
                        queue.append((nxt, steps + 1))
        return -1
$PY$,
$JS$var minMutation = function(startGene, endGene, bank) {
    const bankSet = new Set(bank);
    if (!bankSet.has(endGene)) return -1;
    const queue = [[startGene, 0]];
    const visited = new Set([startGene]);
    while (queue.length) {
        const [gene, steps] = queue.shift();
        if (gene === endGene) return steps;
        for (let i = 0; i < 8; i++) {
            for (const ch of 'ACGT') {
                if (ch === gene[i]) continue;
                const nxt = gene.slice(0, i) + ch + gene.slice(i + 1);
                if (bankSet.has(nxt) && !visited.has(nxt)) {
                    visited.add(nxt);
                    queue.push([nxt, steps + 1]);
                }
            }
        }
    }
    return -1;
};
$JS$,
$JAVA$class Solution {
    public int minMutation(String startGene, String endGene, String[] bank) {
        Set<String> bankSet = new HashSet<>(Arrays.asList(bank));
        if (!bankSet.contains(endGene)) return -1;
        Deque<String> queue = new ArrayDeque<>();
        Set<String> visited = new HashSet<>();
        queue.offer(startGene);
        visited.add(startGene);
        int steps = 0;
        char[] letters = {'A', 'C', 'G', 'T'};
        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int k = 0; k < size; k++) {
                String gene = queue.poll();
                if (gene.equals(endGene)) return steps;
                char[] chars = gene.toCharArray();
                for (int i = 0; i < 8; i++) {
                    char original = chars[i];
                    for (char ch : letters) {
                        if (ch == original) continue;
                        chars[i] = ch;
                        String nxt = new String(chars);
                        if (bankSet.contains(nxt) && !visited.contains(nxt)) {
                            visited.add(nxt);
                            queue.offer(nxt);
                        }
                    }
                    chars[i] = original;
                }
            }
            steps++;
        }
        return -1;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minMutation(string& startGene, string& endGene, vector<string>& bank) {
        unordered_set<string> bankSet(bank.begin(), bank.end());
        if (!bankSet.count(endGene)) return -1;
        queue<pair<string,int>> q;
        q.push({startGene, 0});
        unordered_set<string> visited = {startGene};
        string letters = "ACGT";
        while (!q.empty()) {
            auto [gene, steps] = q.front(); q.pop();
            if (gene == endGene) return steps;
            for (int i = 0; i < 8; i++) {
                char original = gene[i];
                for (char ch : letters) {
                    if (ch == original) continue;
                    gene[i] = ch;
                    if (bankSet.count(gene) && !visited.count(gene)) {
                        visited.insert(gene);
                        q.push({gene, steps + 1});
                    }
                }
                gene[i] = original;
            }
        }
        return -1;
    }
};
$CPP$,
'O(|bank| * 8 * 4)', 'O(|bank|)');

-- ============================================================
-- 8) shortest-subarray-sum-k (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('shortest-subarray-sum-k', 'queue', 'Shortest Subarray with Sum at Least K', 'Hard',
$$<p>Given an integer array <code>nums</code> (which may contain negatives) and an integer <code>k</code>, return the length of the shortest contiguous subarray whose sum is <code>&gt;= k</code>. If no such subarray exists, return <code>-1</code>.</p>$$,
'', ARRAY[
  'Sliding window by itself breaks in the presence of negatives — the sum is not monotonic in the window size.',
  'Switch to prefix sums P[i]. Every candidate subarray corresponds to a pair (i, j) with P[j] - P[i] >= k and j > i.',
  'Maintain a monotonically increasing deque of indices into P. When P[j] - P[front] >= k, front is a valid left endpoint — record its length and pop it. Before pushing j, pop any back with P[back] >= P[j] (they are strictly worse).'
], '300', 'https://leetcode.com/problems/shortest-subarray-with-sum-at-least-k/',
'shortestSubarray',
'[{"name":"nums","type":"List[int]"},{"name":"k","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[1]","1"],"expected":"1"},
  {"inputs":["[1,2]","4"],"expected":"-1"},
  {"inputs":["[2,-1,2]","3"],"expected":"3"},
  {"inputs":["[84,-37,32,40,95]","167"],"expected":"3"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('shortest-subarray-sum-k', 'python',
$PY$class Solution:
    def shortestSubarray(self, nums: List[int], k: int) -> int:
        $PY$),
('shortest-subarray-sum-k', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
var shortestSubarray = function(nums, k) {

};$JS$),
('shortest-subarray-sum-k', 'java',
$JAVA$class Solution {
    public int shortestSubarray(int[] nums, int k) {

    }
}$JAVA$),
('shortest-subarray-sum-k', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int shortestSubarray(vector<int>& nums, int k) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('shortest-subarray-sum-k', 1, 'Prefix Sums + Monotonic Deque',
'Build prefix sums P so any subarray sum is a difference P[j] - P[i]. We want the smallest j - i such that the difference is at least k. Two invariants collapse the search to O(n): (1) once a front index satisfies the condition for the current j we never need it again, so we pop it; (2) if a new prefix is <= some index already in the deque, that older index can never beat the new one, so we pop it off the back before pushing.',
'["Compute prefix sums P of length n + 1 with P[0] = 0.","Initialize an empty deque of indices and best = infinity.","For j from 0 to n: while the deque is non-empty and P[j] - P[front] >= k: best = min(best, j - front); popleft.","While the deque is non-empty and P[back] >= P[j]: pop back.","Push j onto the deque. After the loop, return best if finite else -1."]'::jsonb,
$PY$class Solution:
    def shortestSubarray(self, nums: List[int], k: int) -> int:
        from collections import deque
        n = len(nums)
        prefix = [0] * (n + 1)
        for i, v in enumerate(nums):
            prefix[i + 1] = prefix[i] + v
        dq = deque()
        best = n + 1
        for j in range(n + 1):
            while dq and prefix[j] - prefix[dq[0]] >= k:
                best = min(best, j - dq.popleft())
            while dq and prefix[dq[-1]] >= prefix[j]:
                dq.pop()
            dq.append(j)
        return best if best <= n else -1
$PY$,
$JS$var shortestSubarray = function(nums, k) {
    const n = nums.length;
    const prefix = new Array(n + 1).fill(0);
    for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
    const dq = [];
    let best = n + 1;
    for (let j = 0; j <= n; j++) {
        while (dq.length && prefix[j] - prefix[dq[0]] >= k) best = Math.min(best, j - dq.shift());
        while (dq.length && prefix[dq[dq.length - 1]] >= prefix[j]) dq.pop();
        dq.push(j);
    }
    return best <= n ? best : -1;
};
$JS$,
$JAVA$class Solution {
    public int shortestSubarray(int[] nums, int k) {
        int n = nums.length;
        long[] prefix = new long[n + 1];
        for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
        Deque<Integer> dq = new ArrayDeque<>();
        int best = n + 1;
        for (int j = 0; j <= n; j++) {
            while (!dq.isEmpty() && prefix[j] - prefix[dq.peekFirst()] >= k) {
                best = Math.min(best, j - dq.pollFirst());
            }
            while (!dq.isEmpty() && prefix[dq.peekLast()] >= prefix[j]) dq.pollLast();
            dq.offerLast(j);
        }
        return best <= n ? best : -1;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int shortestSubarray(vector<int>& nums, int k) {
        int n = nums.size();
        vector<long long> prefix(n + 1, 0);
        for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
        deque<int> dq;
        int best = n + 1;
        for (int j = 0; j <= n; j++) {
            while (!dq.empty() && prefix[j] - prefix[dq.front()] >= k) {
                best = min(best, j - dq.front());
                dq.pop_front();
            }
            while (!dq.empty() && prefix[dq.back()] >= prefix[j]) dq.pop_back();
            dq.push_back(j);
        }
        return best <= n ? best : -1;
    }
};
$CPP$,
'O(n)', 'O(n)');

COMMIT;
