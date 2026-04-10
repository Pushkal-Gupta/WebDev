-- Solution approaches: sliding-window (5) + stack (6)
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'best-time-to-buy-sell-stock','longest-substr-no-repeat','longest-repeating-char','min-window-substring','permutation-in-string',
  'valid-parentheses','min-stack','eval-rpn','daily-temperatures','largest-rect-histogram','car-fleet'
);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES

('best-time-to-buy-sell-stock', 1, 'Track Running Minimum',
'The best profit ending on day i is prices[i] minus the lowest price seen so far. A single left-to-right scan tracking min_price and the best profit is sufficient.',
'["min_price = infinity, best = 0.","For each price: min_price = min(min_price, price).","profit = price - min_price; best = max(best, profit).","Return best."]'::jsonb,
$PY$class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        min_price = float('inf')
        best = 0
        for price in prices:
            if price < min_price:
                min_price = price
            elif price - min_price > best:
                best = price - min_price
        return best
$PY$,
$JS$var maxProfit = function(prices) {
    let minPrice = Infinity, best = 0;
    for (const price of prices) {
        if (price < minPrice) minPrice = price;
        else if (price - minPrice > best) best = price - minPrice;
    }
    return best;
};
$JS$,
$JAVA$class Solution {
    public int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE, best = 0;
        for (int price : prices) {
            if (price < minPrice) minPrice = price;
            else if (price - minPrice > best) best = price - minPrice;
        }
        return best;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('longest-substr-no-repeat', 1, 'Sliding Window with Hash Set',
'Maintain a window of unique characters. Expand right; if the new character is already in the window, shrink from the left until the duplicate leaves.',
'["Use a set window and pointers l = 0.","For r in range(n): while s[r] in window, remove s[l] and advance l.","Add s[r] to window.","Track max(r - l + 1)."]'::jsonb,
$PY$class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        window = set()
        l = 0
        best = 0
        for r in range(len(s)):
            while s[r] in window:
                window.remove(s[l])
                l += 1
            window.add(s[r])
            if r - l + 1 > best:
                best = r - l + 1
        return best
$PY$,
$JS$var lengthOfLongestSubstring = function(s) {
    const window = new Set();
    let l = 0, best = 0;
    for (let r = 0; r < s.length; r++) {
        while (window.has(s[r])) {
            window.delete(s[l]);
            l++;
        }
        window.add(s[r]);
        if (r - l + 1 > best) best = r - l + 1;
    }
    return best;
};
$JS$,
$JAVA$class Solution {
    public int lengthOfLongestSubstring(String s) {
        Set<Character> window = new HashSet<>();
        int l = 0, best = 0;
        for (int r = 0; r < s.length(); r++) {
            while (window.contains(s.charAt(r))) {
                window.remove(s.charAt(l++));
            }
            window.add(s.charAt(r));
            if (r - l + 1 > best) best = r - l + 1;
        }
        return best;
    }
}
$JAVA$,
'O(n)', 'O(min(n, charset))'),

('longest-repeating-char', 1, 'Sliding Window with Max Frequency',
'A window is valid if (window length - count of most frequent char) <= k because we can convert the non-majority characters. Slide right; when invalid, shrink left.',
'["freq = 26-int array, l = 0, maxCount = 0, best = 0.","For r from 0 to n - 1: increment freq[s[r]]; update maxCount.","While (r - l + 1) - maxCount > k: decrement freq[s[l]]; l += 1.","best = max(best, r - l + 1)."]'::jsonb,
$PY$class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        freq = {}
        l = 0
        maxCount = 0
        best = 0
        for r in range(len(s)):
            freq[s[r]] = freq.get(s[r], 0) + 1
            maxCount = max(maxCount, freq[s[r]])
            while (r - l + 1) - maxCount > k:
                freq[s[l]] -= 1
                l += 1
            best = max(best, r - l + 1)
        return best
$PY$,
$JS$var characterReplacement = function(s, k) {
    const freq = new Array(26).fill(0);
    let l = 0, maxCount = 0, best = 0;
    for (let r = 0; r < s.length; r++) {
        freq[s.charCodeAt(r) - 65]++;
        maxCount = Math.max(maxCount, freq[s.charCodeAt(r) - 65]);
        while ((r - l + 1) - maxCount > k) {
            freq[s.charCodeAt(l) - 65]--;
            l++;
        }
        best = Math.max(best, r - l + 1);
    }
    return best;
};
$JS$,
$JAVA$class Solution {
    public int characterReplacement(String s, int k) {
        int[] freq = new int[26];
        int l = 0, maxCount = 0, best = 0;
        for (int r = 0; r < s.length(); r++) {
            freq[s.charAt(r) - 'A']++;
            maxCount = Math.max(maxCount, freq[s.charAt(r) - 'A']);
            while ((r - l + 1) - maxCount > k) {
                freq[s.charAt(l) - 'A']--;
                l++;
            }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('min-window-substring', 1, 'Sliding Window with Required Counter',
'Track how many distinct target chars are still missing from the window. Expand right until all are satisfied, then shrink left while the window stays valid to find the smallest such window.',
'["Build need[] counts from t. required = number of distinct chars in t.","have = 0; formed = 0. Sliding pointers l = 0; best = (inf, 0, 0).","For each r, add s[r] to the window; if its count reaches need[s[r]], formed += 1.","While formed == required, record/update best, then remove s[l] and advance l."]'::jsonb,
$PY$class Solution:
    def minWindow(self, s: str, t: str) -> str:
        if not t or not s:
            return ""
        need = {}
        for ch in t:
            need[ch] = need.get(ch, 0) + 1
        required = len(need)
        have = {}
        formed = 0
        best = (float('inf'), 0, 0)
        l = 0
        for r in range(len(s)):
            ch = s[r]
            have[ch] = have.get(ch, 0) + 1
            if ch in need and have[ch] == need[ch]:
                formed += 1
            while formed == required:
                if r - l + 1 < best[0]:
                    best = (r - l + 1, l, r)
                have[s[l]] -= 1
                if s[l] in need and have[s[l]] < need[s[l]]:
                    formed -= 1
                l += 1
        return "" if best[0] == float('inf') else s[best[1]:best[2] + 1]
$PY$,
$JS$var minWindow = function(s, t) {
    if (!s || !t) return "";
    const need = {};
    for (const ch of t) need[ch] = (need[ch] || 0) + 1;
    const required = Object.keys(need).length;
    const have = {};
    let formed = 0, l = 0;
    let best = [Infinity, 0, 0];
    for (let r = 0; r < s.length; r++) {
        const ch = s[r];
        have[ch] = (have[ch] || 0) + 1;
        if (need[ch] !== undefined && have[ch] === need[ch]) formed++;
        while (formed === required) {
            if (r - l + 1 < best[0]) best = [r - l + 1, l, r];
            have[s[l]]--;
            if (need[s[l]] !== undefined && have[s[l]] < need[s[l]]) formed--;
            l++;
        }
    }
    return best[0] === Infinity ? "" : s.slice(best[1], best[2] + 1);
};
$JS$,
$JAVA$class Solution {
    public String minWindow(String s, String t) {
        if (s.isEmpty() || t.isEmpty()) return "";
        Map<Character, Integer> need = new HashMap<>();
        for (char ch : t.toCharArray()) need.merge(ch, 1, Integer::sum);
        int required = need.size();
        Map<Character, Integer> have = new HashMap<>();
        int formed = 0, l = 0;
        int[] best = {Integer.MAX_VALUE, 0, 0};
        for (int r = 0; r < s.length(); r++) {
            char ch = s.charAt(r);
            have.merge(ch, 1, Integer::sum);
            if (need.containsKey(ch) && have.get(ch).intValue() == need.get(ch).intValue()) formed++;
            while (formed == required) {
                if (r - l + 1 < best[0]) best = new int[]{r - l + 1, l, r};
                char lc = s.charAt(l);
                have.merge(lc, -1, Integer::sum);
                if (need.containsKey(lc) && have.get(lc) < need.get(lc)) formed--;
                l++;
            }
        }
        return best[0] == Integer.MAX_VALUE ? "" : s.substring(best[1], best[2] + 1);
    }
}
$JAVA$,
'O(n + m)', 'O(n + m)'),

('permutation-in-string', 1, 'Fixed-Size Sliding Window with Frequency Arrays',
'A permutation of s1 inside s2 is a window of length |s1| with matching character counts. Slide a fixed-size window across s2, maintain counts, and compare to s1''s counts at each step.',
'["If len(s1) > len(s2), return false.","Build 26-int counts for s1 and for the first len(s1) chars of s2.","If arrays match, return true.","Slide: add s2[r], remove s2[l]. Re-check equality after each slide."]'::jsonb,
$PY$class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        if len(s1) > len(s2):
            return False
        need = [0] * 26
        have = [0] * 26
        for ch in s1:
            need[ord(ch) - 97] += 1
        for i in range(len(s1)):
            have[ord(s2[i]) - 97] += 1
        if have == need:
            return True
        for i in range(len(s1), len(s2)):
            have[ord(s2[i]) - 97] += 1
            have[ord(s2[i - len(s1)]) - 97] -= 1
            if have == need:
                return True
        return False
$PY$,
$JS$var checkInclusion = function(s1, s2) {
    if (s1.length > s2.length) return false;
    const need = new Array(26).fill(0);
    const have = new Array(26).fill(0);
    for (const ch of s1) need[ch.charCodeAt(0) - 97]++;
    for (let i = 0; i < s1.length; i++) have[s2.charCodeAt(i) - 97]++;
    const match = () => need.every((v, i) => v === have[i]);
    if (match()) return true;
    for (let i = s1.length; i < s2.length; i++) {
        have[s2.charCodeAt(i) - 97]++;
        have[s2.charCodeAt(i - s1.length) - 97]--;
        if (match()) return true;
    }
    return false;
};
$JS$,
$JAVA$class Solution {
    public boolean checkInclusion(String s1, String s2) {
        if (s1.length() > s2.length()) return false;
        int[] need = new int[26];
        int[] have = new int[26];
        for (char ch : s1.toCharArray()) need[ch - 'a']++;
        for (int i = 0; i < s1.length(); i++) have[s2.charAt(i) - 'a']++;
        if (Arrays.equals(need, have)) return true;
        for (int i = s1.length(); i < s2.length(); i++) {
            have[s2.charAt(i) - 'a']++;
            have[s2.charAt(i - s1.length()) - 'a']--;
            if (Arrays.equals(need, have)) return true;
        }
        return false;
    }
}
$JAVA$,
'O(n + m)', 'O(1)'),

('valid-parentheses', 1, 'Stack of Expected Closers',
'Push an open bracket, and on a close bracket verify the top of the stack matches. At the end the stack must be empty.',
'["Map each close bracket to its matching open: '')'':''('' etc.","For each char: if it''s an open bracket, push.","If close: if stack is empty or stack.pop() != expected open, return false.","Return stack.empty()."]'::jsonb,
$PY$class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        pairs = {')': '(', ']': '[', '}': '{'}
        for ch in s:
            if ch in pairs:
                if not stack or stack.pop() != pairs[ch]:
                    return False
            else:
                stack.append(ch)
        return not stack
$PY$,
$JS$var isValid = function(s) {
    const stack = [];
    const pairs = { ')': '(', ']': '[', '}': '{' };
    for (const ch of s) {
        if (pairs[ch]) {
            if (stack.pop() !== pairs[ch]) return false;
        } else {
            stack.push(ch);
        }
    }
    return stack.length === 0;
};
$JS$,
$JAVA$class Solution {
    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
        for (char ch : s.toCharArray()) {
            if (pairs.containsKey(ch)) {
                if (stack.isEmpty() || stack.pop() != pairs.get(ch)) return false;
            } else {
                stack.push(ch);
            }
        }
        return stack.isEmpty();
    }
}
$JAVA$,
'O(n)', 'O(n)'),

('min-stack', 1, 'Two-Stack Design',
'Maintain a main stack for values and a parallel min stack whose top is always the current minimum. Push the smaller of val and current min onto the min stack on every push.',
'["push(val): append to main; min_stack.append(val if empty else min(val, min_stack[-1])).","pop(): pop both stacks.","top(): return main[-1].","getMin(): return min_stack[-1]. All operations O(1)."]'::jsonb,
$PY$class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []

    def push(self, val: int) -> None:
        self.stack.append(val)
        if not self.min_stack or val <= self.min_stack[-1]:
            self.min_stack.append(val)
        else:
            self.min_stack.append(self.min_stack[-1])

    def pop(self) -> None:
        self.stack.pop()
        self.min_stack.pop()

    def top(self) -> int:
        return self.stack[-1]

    def getMin(self) -> int:
        return self.min_stack[-1]
$PY$,
$JS$var MinStack = function() {
    this.stack = [];
    this.minStack = [];
};
MinStack.prototype.push = function(val) {
    this.stack.push(val);
    this.minStack.push(this.minStack.length === 0 ? val : Math.min(val, this.minStack[this.minStack.length - 1]));
};
MinStack.prototype.pop = function() {
    this.stack.pop();
    this.minStack.pop();
};
MinStack.prototype.top = function() {
    return this.stack[this.stack.length - 1];
};
MinStack.prototype.getMin = function() {
    return this.minStack[this.minStack.length - 1];
};
$JS$,
$JAVA$class MinStack {
    private Deque<Integer> stack = new ArrayDeque<>();
    private Deque<Integer> minStack = new ArrayDeque<>();

    public void push(int val) {
        stack.push(val);
        minStack.push(minStack.isEmpty() ? val : Math.min(val, minStack.peek()));
    }
    public void pop() { stack.pop(); minStack.pop(); }
    public int top() { return stack.peek(); }
    public int getMin() { return minStack.peek(); }
}
$JAVA$,
'O(1) per op', 'O(n)'),

('eval-rpn', 1, 'Stack of Operands',
'Push numbers onto a stack. On an operator pop the two most recent operands — second pop is the left operand — apply the op, and push the result.',
'["Create an empty stack.","For each token: if it is a number, push it.","If it is an operator, pop b then a; compute a op b; push result.","Use int(a / b) for division to truncate toward zero.","Return stack[-1]."]'::jsonb,
$PY$class Solution:
    def evalRPN(self, tokens: List[str]) -> int:
        stack = []
        for tok in tokens:
            if tok in '+-*/' and len(tok) == 1:
                b = stack.pop()
                a = stack.pop()
                if tok == '+': stack.append(a + b)
                elif tok == '-': stack.append(a - b)
                elif tok == '*': stack.append(a * b)
                else: stack.append(int(a / b))
            else:
                stack.append(int(tok))
        return stack[-1]
$PY$,
$JS$var evalRPN = function(tokens) {
    const stack = [];
    for (const tok of tokens) {
        if ('+-*/'.includes(tok) && tok.length === 1) {
            const b = stack.pop(), a = stack.pop();
            if (tok === '+') stack.push(a + b);
            else if (tok === '-') stack.push(a - b);
            else if (tok === '*') stack.push(a * b);
            else stack.push(Math.trunc(a / b));
        } else {
            stack.push(parseInt(tok));
        }
    }
    return stack[0];
};
$JS$,
$JAVA$class Solution {
    public int evalRPN(String[] tokens) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (String tok : tokens) {
            if (tok.length() == 1 && "+-*/".contains(tok)) {
                int b = stack.pop(), a = stack.pop();
                switch (tok) {
                    case "+" -> stack.push(a + b);
                    case "-" -> stack.push(a - b);
                    case "*" -> stack.push(a * b);
                    default  -> stack.push(a / b);
                }
            } else {
                stack.push(Integer.parseInt(tok));
            }
        }
        return stack.peek();
    }
}
$JAVA$,
'O(n)', 'O(n)'),

('daily-temperatures', 1, 'Monotonic Decreasing Stack of Indices',
'Keep a stack of indices waiting for a warmer day. When the current temperature beats the top, pop and write (current_index - popped_index) into the answer.',
'["answer = [0] * n, stack = [].","For i in range(n): while stack and temperatures[stack[-1]] < temperatures[i]: popped = stack.pop(); answer[popped] = i - popped.","Push i onto the stack.","Indices left on the stack keep answer value 0."]'::jsonb,
$PY$class Solution:
    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
        n = len(temperatures)
        answer = [0] * n
        stack = []
        for i in range(n):
            while stack and temperatures[stack[-1]] < temperatures[i]:
                popped = stack.pop()
                answer[popped] = i - popped
            stack.append(i)
        return answer
$PY$,
$JS$var dailyTemperatures = function(temperatures) {
    const n = temperatures.length;
    const answer = new Array(n).fill(0);
    const stack = [];
    for (let i = 0; i < n; i++) {
        while (stack.length && temperatures[stack[stack.length - 1]] < temperatures[i]) {
            const popped = stack.pop();
            answer[popped] = i - popped;
        }
        stack.push(i);
    }
    return answer;
};
$JS$,
$JAVA$class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] answer = new int[n];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && temperatures[stack.peek()] < temperatures[i]) {
                int popped = stack.pop();
                answer[popped] = i - popped;
            }
            stack.push(i);
        }
        return answer;
    }
}
$JAVA$,
'O(n)', 'O(n)'),

('largest-rect-histogram', 1, 'Monotonic Stack of (Start Index, Height)',
'For each bar, we want to extend it as far left and right as possible while staying no taller. A monotonic increasing stack tracks open rectangles; when we hit a shorter bar, we pop and close them.',
'["stack holds (start_index, height). best = 0.","For i, h in enumerate(heights): start = i.","While stack and stack[-1].height > h: popped_start, popped_h = stack.pop(); best = max(best, popped_h * (i - popped_start)); start = popped_start.","Push (start, h).","After the loop, flush: for each (i, h) left, best = max(best, h * (n - i))."]'::jsonb,
$PY$class Solution:
    def largestRectangleArea(self, heights: List[int]) -> int:
        stack = []
        best = 0
        n = len(heights)
        for i, h in enumerate(heights):
            start = i
            while stack and stack[-1][1] > h:
                idx, height = stack.pop()
                best = max(best, height * (i - idx))
                start = idx
            stack.append((start, h))
        for i, h in stack:
            best = max(best, h * (n - i))
        return best
$PY$,
$JS$var largestRectangleArea = function(heights) {
    const stack = [];
    let best = 0;
    const n = heights.length;
    for (let i = 0; i < n; i++) {
        let start = i;
        while (stack.length && stack[stack.length - 1][1] > heights[i]) {
            const [idx, height] = stack.pop();
            best = Math.max(best, height * (i - idx));
            start = idx;
        }
        stack.push([start, heights[i]]);
    }
    for (const [i, h] of stack) best = Math.max(best, h * (n - i));
    return best;
};
$JS$,
$JAVA$class Solution {
    public int largestRectangleArea(int[] heights) {
        Deque<int[]> stack = new ArrayDeque<>();
        int best = 0, n = heights.length;
        for (int i = 0; i < n; i++) {
            int start = i;
            while (!stack.isEmpty() && stack.peek()[1] > heights[i]) {
                int[] top = stack.pop();
                best = Math.max(best, top[1] * (i - top[0]));
                start = top[0];
            }
            stack.push(new int[]{start, heights[i]});
        }
        for (int[] top : stack) best = Math.max(best, top[1] * (n - top[0]));
        return best;
    }
}
$JAVA$,
'O(n)', 'O(n)'),

('car-fleet', 1, 'Sort by Position, Stack of Arrival Times',
'Sort cars by starting position descending (closest to target first) and compute each one''s arrival time. A car joins the fleet ahead of it if its arrival time <= that fleet''s arrival time; otherwise it starts a new fleet.',
'["Pair up (position, speed) and sort by position descending.","fleets = 0, prev_time = 0.","For each car in order: arrival = (target - position) / speed.","If arrival > prev_time, this car is a new fleet; fleets += 1; prev_time = arrival.","Return fleets."]'::jsonb,
$PY$class Solution:
    def carFleet(self, target: int, position: List[int], speed: List[int]) -> int:
        cars = sorted(zip(position, speed), reverse=True)
        fleets = 0
        prev_time = 0
        for pos, spd in cars:
            arrival = (target - pos) / spd
            if arrival > prev_time:
                fleets += 1
                prev_time = arrival
        return fleets
$PY$,
$JS$var carFleet = function(target, position, speed) {
    const cars = position.map((p, i) => [p, speed[i]]).sort((a, b) => b[0] - a[0]);
    let fleets = 0, prevTime = 0;
    for (const [pos, spd] of cars) {
        const arrival = (target - pos) / spd;
        if (arrival > prevTime) {
            fleets++;
            prevTime = arrival;
        }
    }
    return fleets;
};
$JS$,
$JAVA$class Solution {
    public int carFleet(int target, int[] position, int[] speed) {
        int n = position.length;
        double[][] cars = new double[n][2];
        for (int i = 0; i < n; i++) {
            cars[i][0] = position[i];
            cars[i][1] = speed[i];
        }
        Arrays.sort(cars, (a, b) -> Double.compare(b[0], a[0]));
        int fleets = 0;
        double prevTime = 0;
        for (double[] car : cars) {
            double arrival = (target - car[0]) / car[1];
            if (arrival > prevTime) {
                fleets++;
                prevTime = arrival;
            }
        }
        return fleets;
    }
}
$JAVA$,
'O(n log n)', 'O(n)');

COMMIT;

SELECT (SELECT COUNT(*) FROM public."PGcode_solution_approaches") AS total_solutions;
