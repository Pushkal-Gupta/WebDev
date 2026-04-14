-- ═══════════════════════════════════════════════════════════════
-- Enhanced Dry Run Data — NeetCode-style detailed walkthroughs
-- ═══════════════════════════════════════════════════════════════

-- ── TWO SUM (arrays/two-sum) ──────────────────────────────────
-- Delete old steps
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'two-sum';

-- Insert comprehensive 13-frame walkthrough
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES

('two-sum', 1, 'Problem Setup', '{
  "type": "array",
  "array": [2, 7, 11, 15],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given: nums = [2, 7, 11, 15], target = 9. Find two numbers that add up to target and return their indices."
}'),

('two-sum', 2, 'Approach: Hash Map', '{
  "type": "array",
  "array": [2, 7, 11, 15],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Brute force would check all pairs → O(n²). Instead, use a Hash Map: for each number, check if its complement (target - num) was seen before. O(n) time."
}'),

('two-sum', 3, 'Initialize', '{
  "type": "array",
  "array": [2, 7, 11, 15],
  "highlights": [],
  "pointers": {"i": 0},
  "hashmap": {},
  "status": "Create an empty Hash Map. Set pointer i = 0. We will store {value → index} as we iterate."
}'),

('two-sum', 4, 'i=0: Read nums[0]', '{
  "type": "array",
  "array": [2, 7, 11, 15],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashmap": {},
  "status": "Current element: nums[0] = 2."
}'),

('two-sum', 5, 'i=0: Compute Complement', '{
  "type": "array",
  "array": [2, 7, 11, 15],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashmap": {},
  "status": "complement = target - nums[0] = 9 - 2 = 7. Is 7 in our Hash Map? NO (map is empty)."
}'),

('two-sum', 6, 'i=0: Store in Map', '{
  "type": "array",
  "array": [2, 7, 11, 15],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"i": 0},
  "hashmap": {"2": "0"},
  "status": "Complement not found. Store current value and index: map[2] = 0. Move to next element."
}'),

('two-sum', 7, 'i=1: Read nums[1]', '{
  "type": "array",
  "array": [2, 7, 11, 15],
  "highlights": [1],
  "pointers": {"i": 1},
  "hashmap": {"2": "0"},
  "status": "Current element: nums[1] = 7."
}'),

('two-sum', 8, 'i=1: Compute Complement', '{
  "type": "array",
  "array": [2, 7, 11, 15],
  "highlights": [1],
  "pointers": {"i": 1},
  "hashmap": {"2": "0"},
  "status": "complement = target - nums[1] = 9 - 7 = 2. Is 2 in our Hash Map?"
}'),

('two-sum', 9, 'i=1: Complement Found!', '{
  "type": "array",
  "array": [2, 7, 11, 15],
  "highlights": [0, 1],
  "highlightColor": "green",
  "pointers": {"i": 1},
  "hashmap": {"2": "0"},
  "status": "YES! map[2] = 0. The complement 2 was stored at index 0. We found our pair!"
}'),

('two-sum', 10, 'Return Result', '{
  "type": "array",
  "array": [2, 7, 11, 15],
  "highlights": [0, 1],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"2": "0"},
  "status": "Return [map[complement], i] = [0, 1]. nums[0] + nums[1] = 2 + 7 = 9 = target. ✓"
}'),

('two-sum', 11, 'Why This Works', '{
  "type": "array",
  "array": [2, 7, 11, 15],
  "highlights": [0, 1],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"2": "0"},
  "status": "Key insight: Instead of asking \"which two numbers sum to target?\", we ask \"have I already seen the number that completes the current one?\" The HashMap stores previously seen values for O(1) lookup."
}'),

('two-sum', 12, 'Edge Case: Duplicates', '{
  "type": "array",
  "array": [3, 3],
  "highlights": [0, 1],
  "highlightColor": "green",
  "pointers": {"i": 1},
  "hashmap": {"3": "0"},
  "status": "Edge case: nums = [3, 3], target = 6. i=0: store map[3]=0. i=1: complement=3, found at index 0! Return [0, 1]. Works because we check BEFORE storing."
}'),

('two-sum', 13, 'Complexity Analysis', '{
  "type": "array",
  "array": [2, 7, 11, 15],
  "highlights": [],
  "pointers": {},
  "hashmap": {"2": "0"},
  "status": "Time: O(n) — single pass through the array. Space: O(n) — Hash Map stores up to n elements. Compare to brute force O(n²) time, O(1) space."
}');


-- ── CONTAINS DUPLICATE (arrays/contains-duplicate) ────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'contains-duplicate';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES

('contains-duplicate', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1, 2, 3, 1],
  "highlights": [],
  "pointers": {},
  "hashset": [],
  "status": "Given: nums = [1, 2, 3, 1]. Return true if any value appears at least twice."
}'),

('contains-duplicate', 2, 'Approach: Hash Set', '{
  "type": "array",
  "array": [1, 2, 3, 1],
  "highlights": [],
  "pointers": {},
  "hashset": [],
  "status": "Use a Hash Set to track seen elements. For each element: if already in set → duplicate found. Otherwise, add to set. O(n) time."
}'),

('contains-duplicate', 3, 'i=0: Check 1', '{
  "type": "array",
  "array": [1, 2, 3, 1],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashset": [],
  "status": "nums[0] = 1. Is 1 in the set? NO (set is empty)."
}'),

('contains-duplicate', 4, 'i=0: Add 1 to Set', '{
  "type": "array",
  "array": [1, 2, 3, 1],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"i": 0},
  "hashset": [1],
  "status": "Add 1 to the set. Set = {1}. Move to next."
}'),

('contains-duplicate', 5, 'i=1: Check 2', '{
  "type": "array",
  "array": [1, 2, 3, 1],
  "highlights": [1],
  "pointers": {"i": 1},
  "hashset": [1],
  "status": "nums[1] = 2. Is 2 in the set? NO."
}'),

('contains-duplicate', 6, 'i=1: Add 2 to Set', '{
  "type": "array",
  "array": [1, 2, 3, 1],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"i": 1},
  "hashset": [1, 2],
  "status": "Add 2 to the set. Set = {1, 2}. Move to next."
}'),

('contains-duplicate', 7, 'i=2: Check 3', '{
  "type": "array",
  "array": [1, 2, 3, 1],
  "highlights": [2],
  "pointers": {"i": 2},
  "hashset": [1, 2],
  "status": "nums[2] = 3. Is 3 in the set? NO."
}'),

('contains-duplicate', 8, 'i=2: Add 3 to Set', '{
  "type": "array",
  "array": [1, 2, 3, 1],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"i": 2},
  "hashset": [1, 2, 3],
  "status": "Add 3 to the set. Set = {1, 2, 3}. Move to next."
}'),

('contains-duplicate', 9, 'i=3: Check 1', '{
  "type": "array",
  "array": [1, 2, 3, 1],
  "highlights": [3],
  "pointers": {"i": 3},
  "hashset": [1, 2, 3],
  "status": "nums[3] = 1. Is 1 in the set? YES! Duplicate found!"
}'),

('contains-duplicate', 10, 'Duplicate Found!', '{
  "type": "array",
  "array": [1, 2, 3, 1],
  "highlights": [0, 3],
  "highlightColor": "green",
  "pointers": {},
  "hashset": [1, 2, 3],
  "status": "1 appears at index 0 and index 3. Return true."
}'),

('contains-duplicate', 11, 'Complexity', '{
  "type": "array",
  "array": [1, 2, 3, 1],
  "highlights": [],
  "pointers": {},
  "hashset": [1, 2, 3],
  "status": "Time: O(n) — single pass. Space: O(n) — Hash Set stores up to n elements. Sorting approach would be O(n log n) time, O(1) space."
}');


-- ── VALID PALINDROME (strings/valid-palindrome) ───────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'valid-palindrome';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES

('valid-palindrome', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["r","a","c","e","c","a","r"],
  "highlights": [],
  "pointers": {},
  "status": "Given: s = \"racecar\". After removing non-alphanumeric and lowering, check if it reads the same forward and backward."
}'),

('valid-palindrome', 2, 'Approach: Two Pointers', '{
  "type": "array",
  "array": ["r","a","c","e","c","a","r"],
  "highlights": [],
  "pointers": {"L": 0, "R": 6},
  "status": "Use two pointers: L at start, R at end. Compare characters moving inward. If all match → palindrome."
}'),

('valid-palindrome', 3, 'Compare L=0, R=6', '{
  "type": "array",
  "array": ["r","a","c","e","c","a","r"],
  "highlights": [0, 6],
  "highlightColor": "green",
  "pointers": {"L": 0, "R": 6},
  "status": "s[0] = \"r\", s[6] = \"r\". Match! ✓ Move L right, R left."
}'),

('valid-palindrome', 4, 'Compare L=1, R=5', '{
  "type": "array",
  "array": ["r","a","c","e","c","a","r"],
  "highlights": [1, 5],
  "highlightColor": "green",
  "pointers": {"L": 1, "R": 5},
  "status": "s[1] = \"a\", s[5] = \"a\". Match! ✓ Move L right, R left."
}'),

('valid-palindrome', 5, 'Compare L=2, R=4', '{
  "type": "array",
  "array": ["r","a","c","e","c","a","r"],
  "highlights": [2, 4],
  "highlightColor": "green",
  "pointers": {"L": 2, "R": 4},
  "status": "s[2] = \"c\", s[4] = \"c\". Match! ✓ Move L right, R left."
}'),

('valid-palindrome', 6, 'L meets R', '{
  "type": "array",
  "array": ["r","a","c","e","c","a","r"],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {"L": 3, "R": 3},
  "status": "L = R = 3. Pointers have crossed. All characters matched!"
}'),

('valid-palindrome', 7, 'Result: Palindrome!', '{
  "type": "array",
  "array": ["r","a","c","e","c","a","r"],
  "highlights": [0,1,2,3,4,5,6],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return true. \"racecar\" is a valid palindrome. Time: O(n), Space: O(1)."
}'),

('valid-palindrome', 8, 'Counter-example', '{
  "type": "array",
  "array": ["r","a","c","e","b","a","r"],
  "highlights": [2, 4],
  "highlightColor": "red",
  "pointers": {"L": 2, "R": 4},
  "status": "Counter-example: \"racebar\". At L=2, R=4: s[2]=\"c\" ≠ s[4]=\"b\". Mismatch → return false."
}');


-- ── BEST TIME TO BUY AND SELL STOCK ──────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'best-time-to-buy-sell-stock';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES

('best-time-to-buy-sell-stock', 1, 'Problem Setup', '{
  "type": "array",
  "array": [7, 1, 5, 3, 6, 4],
  "highlights": [],
  "pointers": {},
  "status": "Given: prices = [7, 1, 5, 3, 6, 4]. Find the maximum profit from one buy and one sell (buy before sell)."
}'),

('best-time-to-buy-sell-stock', 2, 'Approach: Track Minimum', '{
  "type": "array",
  "array": [7, 1, 5, 3, 6, 4],
  "highlights": [],
  "pointers": {},
  "status": "Key insight: As we scan left to right, track the minimum price seen so far. At each day, the best profit is current_price - min_price_so_far."
}'),

('best-time-to-buy-sell-stock', 3, 'Day 0: Price = 7', '{
  "type": "array",
  "array": [7, 1, 5, 3, 6, 4],
  "highlights": [0],
  "pointers": {"i": 0},
  "labels": {"0": "buy?"},
  "status": "Day 0: price = 7. min_price = 7, max_profit = 0. First day, can only buy."
}'),

('best-time-to-buy-sell-stock', 4, 'Day 1: Price = 1', '{
  "type": "array",
  "array": [7, 1, 5, 3, 6, 4],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"i": 1},
  "labels": {"1": "new min!"},
  "status": "Day 1: price = 1 < min_price (7). Update min_price = 1. Profit = 1 - 1 = 0. max_profit = 0."
}'),

('best-time-to-buy-sell-stock', 5, 'Day 2: Price = 5', '{
  "type": "array",
  "array": [7, 1, 5, 3, 6, 4],
  "highlights": [1, 2],
  "pointers": {"i": 2},
  "labels": {"1": "buy"},
  "status": "Day 2: price = 5. Profit = 5 - 1 = 4. max_profit = max(0, 4) = 4."
}'),

('best-time-to-buy-sell-stock', 6, 'Day 3: Price = 3', '{
  "type": "array",
  "array": [7, 1, 5, 3, 6, 4],
  "highlights": [1, 3],
  "pointers": {"i": 3},
  "labels": {"1": "buy"},
  "status": "Day 3: price = 3. Profit = 3 - 1 = 2. max_profit = max(4, 2) = 4. No improvement."
}'),

('best-time-to-buy-sell-stock', 7, 'Day 4: Price = 6', '{
  "type": "array",
  "array": [7, 1, 5, 3, 6, 4],
  "highlights": [1, 4],
  "highlightColor": "green",
  "pointers": {"i": 4},
  "labels": {"1": "buy", "4": "sell!"},
  "status": "Day 4: price = 6. Profit = 6 - 1 = 5. max_profit = max(4, 5) = 5! New best!"
}'),

('best-time-to-buy-sell-stock', 8, 'Day 5: Price = 4', '{
  "type": "array",
  "array": [7, 1, 5, 3, 6, 4],
  "highlights": [1, 5],
  "pointers": {"i": 5},
  "labels": {"1": "buy"},
  "status": "Day 5: price = 4. Profit = 4 - 1 = 3. max_profit stays 5."
}'),

('best-time-to-buy-sell-stock', 9, 'Result', '{
  "type": "array",
  "array": [7, 1, 5, 3, 6, 4],
  "highlights": [1, 4],
  "highlightColor": "green",
  "pointers": {},
  "labels": {"1": "buy @1", "4": "sell @6"},
  "status": "Maximum profit = 5. Buy at day 1 (price=1), sell at day 4 (price=6). Time: O(n), Space: O(1)."
}');


-- ── VALID PARENTHESES (stack/valid-parentheses) ──────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'valid-parentheses';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES

('valid-parentheses', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["(", "[", "{", "}", "]", ")"],
  "highlights": [],
  "pointers": {},
  "status": "Given: s = \"([{}])\". Check if brackets are valid: every open bracket has a matching close in correct order."
}'),

('valid-parentheses', 2, 'Approach: Stack', '{
  "type": "stack",
  "items": [],
  "operation": "",
  "status": "Use a Stack. For open brackets → push. For close brackets → pop and check if it matches. If stack is empty at end → valid."
}'),

('valid-parentheses', 3, 'i=0: Read \"(\"', '{
  "type": "stack",
  "items": ["("],
  "operation": "push \"(\"",
  "status": "s[0] = \"(\". Open bracket → push onto stack."
}'),

('valid-parentheses', 4, 'i=1: Read \"[\"', '{
  "type": "stack",
  "items": ["(", "["],
  "operation": "push \"[\"",
  "status": "s[1] = \"[\". Open bracket → push onto stack."
}'),

('valid-parentheses', 5, 'i=2: Read \"{\"', '{
  "type": "stack",
  "items": ["(", "[", "{"],
  "operation": "push \"{\"",
  "status": "s[2] = \"{\". Open bracket → push onto stack. Stack now has 3 items."
}'),

('valid-parentheses', 6, 'i=3: Read \"}\"', '{
  "type": "stack",
  "items": ["(", "["],
  "operation": "pop → \"{\" matches \"}\" ✓",
  "status": "s[3] = \"}\". Close bracket → pop top: \"{\". Does \"{\" match \"}\"? YES! ✓"
}'),

('valid-parentheses', 7, 'i=4: Read \"]\"', '{
  "type": "stack",
  "items": ["("],
  "operation": "pop → \"[\" matches \"]\" ✓",
  "status": "s[4] = \"]\". Close bracket → pop top: \"[\". Does \"[\" match \"]\"? YES! ✓"
}'),

('valid-parentheses', 8, 'i=5: Read \")\"', '{
  "type": "stack",
  "items": [],
  "operation": "pop → \"(\" matches \")\" ✓",
  "status": "s[5] = \")\". Close bracket → pop top: \"(\". Does \"(\" match \")\"? YES! ✓"
}'),

('valid-parentheses', 9, 'Result: Valid!', '{
  "type": "stack",
  "items": [],
  "operation": "stack is empty ✓",
  "status": "All characters processed. Stack is empty → all brackets matched correctly. Return true. Time: O(n), Space: O(n)."
}'),

('valid-parentheses', 10, 'Counter-example', '{
  "type": "stack",
  "items": ["("],
  "operation": "pop → \"(\" does NOT match \"]\" ✗",
  "status": "Counter-example: \"(]\". Push \"(\". Then \"]\": pop gets \"(\", but ( ≠ ]. Mismatch! Return false."
}');


-- ── MAXIMUM SUBARRAY (arrays/max-subarray) ───────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'max-subarray';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES

('max-subarray', 1, 'Problem Setup', '{
  "type": "array",
  "array": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  "highlights": [],
  "pointers": {},
  "status": "Given: nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]. Find the contiguous subarray with the largest sum."
}'),

('max-subarray', 2, 'Approach: Kadane''s Algorithm', '{
  "type": "array",
  "array": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  "highlights": [],
  "pointers": {},
  "status": "Kadane''s Algorithm: Track current_sum. At each element: current_sum = max(nums[i], current_sum + nums[i]). If adding the element makes sum worse than starting fresh, start a new subarray."
}'),

('max-subarray', 3, 'i=0: nums[0] = -2', '{
  "type": "array",
  "array": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  "highlights": [0],
  "pointers": {"i": 0},
  "status": "current_sum = max(-2, 0 + (-2)) = -2. max_sum = -2."
}'),

('max-subarray', 4, 'i=1: nums[1] = 1', '{
  "type": "array",
  "array": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  "highlights": [1],
  "pointers": {"i": 1},
  "status": "current_sum = max(1, -2 + 1) = max(1, -1) = 1. Start fresh! max_sum = max(-2, 1) = 1."
}'),

('max-subarray', 5, 'i=2: nums[2] = -3', '{
  "type": "array",
  "array": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  "highlights": [1, 2],
  "pointers": {"i": 2},
  "status": "current_sum = max(-3, 1 + (-3)) = max(-3, -2) = -2. Continue subarray. max_sum = 1."
}'),

('max-subarray', 6, 'i=3: nums[3] = 4', '{
  "type": "array",
  "array": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  "highlights": [3],
  "highlightColor": "yellow",
  "pointers": {"i": 3},
  "status": "current_sum = max(4, -2 + 4) = max(4, 2) = 4. Start fresh! max_sum = max(1, 4) = 4."
}'),

('max-subarray', 7, 'i=4: nums[4] = -1', '{
  "type": "array",
  "array": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  "highlights": [3, 4],
  "pointers": {"i": 4},
  "status": "current_sum = max(-1, 4 + (-1)) = max(-1, 3) = 3. Continue. max_sum = 4."
}'),

('max-subarray', 8, 'i=5: nums[5] = 2', '{
  "type": "array",
  "array": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  "highlights": [3, 4, 5],
  "pointers": {"i": 5},
  "status": "current_sum = max(2, 3 + 2) = 5. Continue. max_sum = max(4, 5) = 5."
}'),

('max-subarray', 9, 'i=6: nums[6] = 1', '{
  "type": "array",
  "array": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  "highlights": [3, 4, 5, 6],
  "highlightColor": "green",
  "pointers": {"i": 6},
  "status": "current_sum = max(1, 5 + 1) = 6. Continue. max_sum = max(5, 6) = 6! New best!"
}'),

('max-subarray', 10, 'i=7: nums[7] = -5', '{
  "type": "array",
  "array": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  "highlights": [3, 4, 5, 6, 7],
  "pointers": {"i": 7},
  "status": "current_sum = max(-5, 6 + (-5)) = 1. Continue. max_sum = 6."
}'),

('max-subarray', 11, 'i=8: nums[8] = 4', '{
  "type": "array",
  "array": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  "highlights": [3, 4, 5, 6, 7, 8],
  "pointers": {"i": 8},
  "status": "current_sum = max(4, 1 + 4) = 5. Continue. max_sum = 6."
}'),

('max-subarray', 12, 'Result', '{
  "type": "array",
  "array": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  "highlights": [3, 4, 5, 6],
  "highlightColor": "green",
  "pointers": {},
  "status": "Maximum subarray sum = 6. Subarray: [4, -1, 2, 1] (indices 3-6). Time: O(n), Space: O(1)."
}');


-- ── UPDATE TWO SUM DESCRIPTION TO LEETCODE FORMAT ────────────
UPDATE "PGcode_problems" SET description = '<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to <code>target</code></em>.</p>
<p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p>
<p>You can return the answer in any order.</p>

<p><strong>Example 1:</strong></p>
<pre>
<strong>Input:</strong> nums = [2,7,11,15], target = 9
<strong>Output:</strong> [0,1]
<strong>Explanation:</strong> Because nums[0] + nums[1] == 9, we return [0, 1].
</pre>

<p><strong>Example 2:</strong></p>
<pre>
<strong>Input:</strong> nums = [3,2,4], target = 6
<strong>Output:</strong> [1,2]
</pre>

<p><strong>Example 3:</strong></p>
<pre>
<strong>Input:</strong> nums = [3,3], target = 6
<strong>Output:</strong> [0,1]
</pre>

<p><strong>Constraints:</strong></p>
<ul>
<li>2 &lt;= nums.length &lt;= 10<sup>4</sup></li>
<li>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></li>
<li>-10<sup>9</sup> &lt;= target &lt;= 10<sup>9</sup></li>
<li>Only one valid answer exists.</li>
</ul>

<p><strong>Follow-up:</strong> Can you come up with an algorithm that is less than O(n<sup>2</sup>) time complexity?</p>'
WHERE id = 'two-sum';


-- ── UPDATE CONTAINS DUPLICATE DESCRIPTION ────────────────────
UPDATE "PGcode_problems" SET description = '<p>Given an integer array <code>nums</code>, return <code>true</code> if any value appears <strong>at least twice</strong> in the array, and return <code>false</code> if every element is distinct.</p>

<p><strong>Example 1:</strong></p>
<pre>
<strong>Input:</strong> nums = [1,2,3,1]
<strong>Output:</strong> true
<strong>Explanation:</strong> The element 1 occurs at indices 0 and 3.
</pre>

<p><strong>Example 2:</strong></p>
<pre>
<strong>Input:</strong> nums = [1,2,3,4]
<strong>Output:</strong> false
<strong>Explanation:</strong> All elements are distinct.
</pre>

<p><strong>Example 3:</strong></p>
<pre>
<strong>Input:</strong> nums = [1,1,1,3,3,4,3,2,4,2]
<strong>Output:</strong> true
</pre>

<p><strong>Constraints:</strong></p>
<ul>
<li>1 &lt;= nums.length &lt;= 10<sup>5</sup></li>
<li>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></li>
</ul>'
WHERE id = 'contains-duplicate';


-- ── UPDATE VALID ANAGRAM DESCRIPTION ─────────────────────────
UPDATE "PGcode_problems" SET description = '<p>Given two strings <code>s</code> and <code>t</code>, return <code>true</code> if <code>t</code> is an <strong>anagram</strong> of <code>s</code>, and <code>false</code> otherwise.</p>
<p>An <strong>Anagram</strong> is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.</p>

<p><strong>Example 1:</strong></p>
<pre>
<strong>Input:</strong> s = "anagram", t = "nagaram"
<strong>Output:</strong> true
</pre>

<p><strong>Example 2:</strong></p>
<pre>
<strong>Input:</strong> s = "rat", t = "car"
<strong>Output:</strong> false
</pre>

<p><strong>Constraints:</strong></p>
<ul>
<li>1 &lt;= s.length, t.length &lt;= 5 * 10<sup>4</sup></li>
<li><code>s</code> and <code>t</code> consist of lowercase English letters.</li>
</ul>

<p><strong>Follow-up:</strong> What if the inputs contain Unicode characters? How would you adapt your solution?</p>'
WHERE id = 'valid-anagram';
