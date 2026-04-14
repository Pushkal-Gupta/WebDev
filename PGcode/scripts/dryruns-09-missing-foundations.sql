-- ═══════════════════════════════════════════════════════════════
-- Dry Runs — Missing Foundations Batch 1
-- ───────────────────────────────────────────────────────────────
-- Covers 15 problems across Math, Bit-Manipulation, Recursion,
-- Queue, Stack (extras), and Two-Pointers (extra) topics.
-- Format matches enhance_dry_runs.sql / dryruns_arrays.sql /
-- dryruns_stack.sql. Safe to re-run: each section DELETEs first.
-- ═══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- MATH
-- ══════════════════════════════════════════════════════════════


-- ── INTEGER TO ROMAN ─────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'integer-to-roman';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('integer-to-roman', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1000, 900, 500, 400, 100, 90, 50, 40],
  "highlights": [],
  "pointers": {},
  "hashmap": {"num": "1994"},
  "status": "Given num = 1994. Convert to a Roman numeral string. Expected output: \"MCMXCIV\"."
}'::jsonb),

('integer-to-roman', 2, 'Approach: Greedy with Value Table', '{
  "type": "array",
  "array": [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Keep a descending list of Roman values (including subtractive forms like 900=CM, 400=CD). Greedily subtract the largest value that fits, appending its symbol each time."
}'::jsonb),

('integer-to-roman', 3, 'Initialize', '{
  "type": "array",
  "array": [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashmap": {"num": "1994", "result": "\"\""},
  "status": "Start with i = 0 pointing at 1000 (M). result is empty. We will loop while num > 0."
}'::jsonb),

('integer-to-roman', 4, 'Take 1000 (M)', '{
  "type": "array",
  "array": [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"i": 0},
  "hashmap": {"num": "994", "result": "\"M\""},
  "status": "1994 >= 1000, so append \"M\" and subtract: num = 994. 994 < 1000, so advance to next value (900)."
}'::jsonb),

('integer-to-roman', 5, 'Take 900 (CM)', '{
  "type": "array",
  "array": [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1],
  "highlights": [1],
  "highlightColor": "green",
  "pointers": {"i": 1},
  "hashmap": {"num": "94", "result": "\"MCM\""},
  "status": "994 >= 900, append \"CM\" (the subtractive pair), num = 94. The subtractive encoding avoids four Cs."
}'::jsonb),

('integer-to-roman', 6, 'Take 90 (XC)', '{
  "type": "array",
  "array": [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1],
  "highlights": [5],
  "highlightColor": "green",
  "pointers": {"i": 5},
  "hashmap": {"num": "4", "result": "\"MCMXC\""},
  "status": "Skip 500, 400, 100 (all larger than 94). 94 >= 90, append \"XC\", num = 4."
}'::jsonb),

('integer-to-roman', 7, 'Take 4 (IV)', '{
  "type": "array",
  "array": [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1],
  "highlights": [11],
  "highlightColor": "green",
  "pointers": {"i": 11},
  "hashmap": {"num": "0", "result": "\"MCMXCIV\""},
  "status": "Skip 50, 40, 10, 9, 5. 4 >= 4, append \"IV\", num = 0. Loop ends."
}'::jsonb),

('integer-to-roman', 8, 'Return Result', '{
  "type": "array",
  "array": [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1],
  "highlights": [0, 1, 5, 11],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"result": "\"MCMXCIV\""},
  "status": "Return \"MCMXCIV\". O(1) time (bounded loop over 13 values) and O(1) extra space."
}'::jsonb);


-- ── MULTIPLY STRINGS ────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'multiply-strings';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('multiply-strings', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["1","2"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"num1": "\"12\"", "num2": "\"34\""},
  "status": "Given num1 = \"12\", num2 = \"34\". Return the product as a string without using BigInteger. Expected: \"408\"."
}'::jsonb),

('multiply-strings', 2, 'Approach: Digit-by-Digit Grade School', '{
  "type": "array",
  "array": [0, 0, 0, 0],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Result length is at most m + n digits. Multiply each pair num1[i] * num2[j] and add into result[i + j + 1], carry into result[i + j]. Finally skip leading zeros."
}'::jsonb),

('multiply-strings', 3, 'Initialize result buffer', '{
  "type": "array",
  "array": [0, 0, 0, 0],
  "highlights": [],
  "pointers": {"i": 1, "j": 1},
  "hashmap": {},
  "status": "Allocate result of length m + n = 4, filled with zeros. Iterate i from right of num1, j from right of num2."
}'::jsonb),

('multiply-strings', 4, 'i=1, j=1: 2 * 4', '{
  "type": "array",
  "array": [0, 0, 0, 8],
  "highlights": [2, 3],
  "highlightColor": "yellow",
  "pointers": {"i": 1, "j": 1},
  "hashmap": {"mul": "8", "carry": "0"},
  "status": "2 * 4 = 8. sum = 8 + result[3] = 8. result[3] = 8 % 10 = 8, result[2] += 8 / 10 = 0."
}'::jsonb),

('multiply-strings', 5, 'i=1, j=0: 2 * 3', '{
  "type": "array",
  "array": [0, 0, 6, 8],
  "highlights": [1, 2],
  "highlightColor": "yellow",
  "pointers": {"i": 1, "j": 0},
  "hashmap": {"mul": "6"},
  "status": "2 * 3 = 6. sum = 6 + result[2] = 6. result[2] = 6, result[1] += 0."
}'::jsonb),

('multiply-strings', 6, 'i=0, j=1: 1 * 4', '{
  "type": "array",
  "array": [0, 0, 10, 8],
  "highlights": [1, 2],
  "highlightColor": "yellow",
  "pointers": {"i": 0, "j": 1},
  "hashmap": {"mul": "4"},
  "status": "1 * 4 = 4. sum = 4 + result[2] = 4 + 6 = 10. result[2] = 10 % 10 = 0, result[1] += 10 / 10 = 1. (Shown mid-update before carry applied.)"
}'::jsonb),

('multiply-strings', 7, 'i=0, j=0: 1 * 3', '{
  "type": "array",
  "array": [0, 4, 0, 8],
  "highlights": [0, 1],
  "highlightColor": "yellow",
  "pointers": {"i": 0, "j": 0},
  "hashmap": {"mul": "3"},
  "status": "1 * 3 = 3. sum = 3 + result[1] = 3 + 1 = 4. result[1] = 4, result[0] += 0. All pairs processed."
}'::jsonb),

('multiply-strings', 8, 'Strip leading zeros', '{
  "type": "array",
  "array": [4, 0, 8],
  "highlights": [0, 1, 2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"result": "\"408\""},
  "status": "Skip leading zeros (result[0] = 0), join remaining digits. Return \"408\". Time O(m*n), space O(m+n)."
}'::jsonb);


-- ── PLUS ONE ────────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'plus-one';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('plus-one', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1, 2, 9],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given digits = [1, 2, 9] representing 129. Add 1 and return the digits of 130 → [1, 3, 0]."
}'::jsonb),

('plus-one', 2, 'Approach: Simulate from the Right', '{
  "type": "array",
  "array": [1, 2, 9],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Walk from the last digit. If digit < 9, increment and return. If digit == 9, set to 0 and carry to the next left. If we fall off the left with a carry, prepend a 1."
}'::jsonb),

('plus-one', 3, 'Initialize pointer', '{
  "type": "array",
  "array": [1, 2, 9],
  "highlights": [2],
  "pointers": {"i": 2},
  "hashmap": {},
  "status": "Set i = n - 1 = 2 pointing at the last digit 9."
}'::jsonb),

('plus-one', 4, 'i=2: digit is 9', '{
  "type": "array",
  "array": [1, 2, 0],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"i": 2},
  "hashmap": {"carry": "1"},
  "status": "digits[2] = 9. Adding 1 would overflow. Set digits[2] = 0 and carry 1 leftward. Move i to 1."
}'::jsonb),

('plus-one', 5, 'i=1: digit is 2', '{
  "type": "array",
  "array": [1, 3, 0],
  "highlights": [1],
  "highlightColor": "green",
  "pointers": {"i": 1},
  "hashmap": {"carry": "0"},
  "status": "digits[1] = 2 < 9. Increment to 3, no more carry. We can return immediately."
}'::jsonb),

('plus-one', 6, 'Return Result', '{
  "type": "array",
  "array": [1, 3, 0],
  "highlights": [0, 1, 2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {},
  "status": "Return [1, 3, 0] = 130. O(n) time in the worst case (e.g., [9,9,9] → [1,0,0,0]), O(1) extra space."
}'::jsonb),

('plus-one', 7, 'Edge Case: All Nines', '{
  "type": "array",
  "array": [1, 0, 0, 0],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {},
  "status": "If input were [9, 9, 9], every digit becomes 0 and carry escapes the array. We allocate a new array of length n+1 starting with 1 → [1, 0, 0, 0]."
}'::jsonb);


-- ── POWER OF THREE ──────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'power-of-three';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('power-of-three', 1, 'Problem Setup', '{
  "type": "array",
  "array": [27],
  "highlights": [0],
  "pointers": {},
  "hashmap": {"n": "27"},
  "status": "Given n = 27. Return true if n is a power of three (n == 3^k for some k >= 0). Expected: true (3^3 = 27)."
}'::jsonb),

('power-of-three', 2, 'Approach: Repeated Division', '{
  "type": "array",
  "array": [1, 3, 9, 27, 81],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "If n is a power of three, repeatedly dividing by 3 while it''s divisible will eventually yield 1. If at any point n % 3 != 0 and n != 1, it isn''t a power of three."
}'::jsonb),

('power-of-three', 3, 'Guard: n must be positive', '{
  "type": "array",
  "array": [27],
  "highlights": [0],
  "pointers": {},
  "hashmap": {"n": "27"},
  "status": "n = 27 > 0. If n <= 0, immediately return false since powers of three are always positive."
}'::jsonb),

('power-of-three', 4, 'Divide: 27 / 3 = 9', '{
  "type": "array",
  "array": [1, 3, 9, 27],
  "highlights": [3],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"n": "9"},
  "status": "27 % 3 == 0, so n = 27 / 3 = 9. Still > 1, keep dividing."
}'::jsonb),

('power-of-three', 5, 'Divide: 9 / 3 = 3', '{
  "type": "array",
  "array": [1, 3, 9],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"n": "3"},
  "status": "9 % 3 == 0, so n = 9 / 3 = 3. Still > 1, continue."
}'::jsonb),

('power-of-three', 6, 'Divide: 3 / 3 = 1', '{
  "type": "array",
  "array": [1, 3],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"n": "1"},
  "status": "3 % 3 == 0, so n = 3 / 3 = 1. Loop exits because n is no longer > 1."
}'::jsonb),

('power-of-three', 7, 'Return Result', '{
  "type": "array",
  "array": [1],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"n": "1", "result": "true"},
  "status": "n == 1 at termination, so 27 is indeed a power of three. Return true. O(log_3 n) time, O(1) space."
}'::jsonb),

('power-of-three', 8, 'Counter-Example: n = 45', '{
  "type": "array",
  "array": [45, 15, 5],
  "highlights": [2],
  "highlightColor": "red",
  "pointers": {},
  "hashmap": {"n": "5"},
  "status": "45 / 3 = 15, 15 / 3 = 5. Now 5 % 3 != 0 and 5 != 1, so we return false. 45 is not a power of three."
}'::jsonb);


-- ══════════════════════════════════════════════════════════════
-- BIT MANIPULATION
-- ══════════════════════════════════════════════════════════════


-- ── MISSING NUMBER (XOR) ─────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'missing-number-xor';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('missing-number-xor', 1, 'Problem Setup', '{
  "type": "array",
  "array": [3, 0, 1],
  "highlights": [],
  "pointers": {},
  "hashmap": {"n": "3"},
  "status": "Given nums = [3, 0, 1] containing distinct numbers from [0..n]. Find the one missing. Expected: 2."
}'::jsonb),

('missing-number-xor', 2, 'Approach: XOR Cancellation', '{
  "type": "array",
  "array": [3, 0, 1],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "XOR is its own inverse: x ^ x = 0 and x ^ 0 = x. XOR together all indices 0..n AND all values. Every number that appears in both cancels out, leaving only the missing one."
}'::jsonb),

('missing-number-xor', 3, 'Initialize', '{
  "type": "array",
  "array": [3, 0, 1],
  "highlights": [],
  "pointers": {"i": 0},
  "hashmap": {"xor": "3"},
  "status": "Seed xor = n = 3. We will loop i from 0 to n-1, xoring both i and nums[i] each step."
}'::jsonb),

('missing-number-xor', 4, 'i=0: xor ^= 0 ^ nums[0]', '{
  "type": "array",
  "array": [3, 0, 1],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"i": 0},
  "hashmap": {"xor": "0"},
  "status": "xor = 3 ^ 0 ^ 3 = 0. Here nums[0] = 3 cancels the initial 3; index 0 contributes nothing (0 ^ 0)."
}'::jsonb),

('missing-number-xor', 5, 'i=1: xor ^= 1 ^ nums[1]', '{
  "type": "array",
  "array": [3, 0, 1],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"i": 1},
  "hashmap": {"xor": "1"},
  "status": "xor = 0 ^ 1 ^ 0 = 1. Index 1 contributes 1; value nums[1] = 0 contributes nothing."
}'::jsonb),

('missing-number-xor', 6, 'i=2: xor ^= 2 ^ nums[2]', '{
  "type": "array",
  "array": [3, 0, 1],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"i": 2},
  "hashmap": {"xor": "2"},
  "status": "xor = 1 ^ 2 ^ 1 = 2. Value nums[2] = 1 cancels the previous 1; index 2 survives."
}'::jsonb),

('missing-number-xor', 7, 'Why This Works', '{
  "type": "array",
  "array": [3, 0, 1],
  "highlights": [],
  "pointers": {},
  "hashmap": {"xor": "2"},
  "status": "We XORed {0,1,2,3} (indices + n) against {3,0,1} (values). Common numbers {0,1,3} cancel to 0; only 2 remains — exactly the missing number."
}'::jsonb),

('missing-number-xor', 8, 'Return Result', '{
  "type": "array",
  "array": [3, 0, 1],
  "highlights": [],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"missing": "2"},
  "status": "Return xor = 2. O(n) time, O(1) space, and avoids summation overflow."
}'::jsonb);


-- ── POWER OF TWO ────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'power-of-two';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('power-of-two', 1, 'Problem Setup', '{
  "type": "array",
  "array": [0, 0, 0, 1, 0, 0, 0, 0],
  "highlights": [3],
  "pointers": {},
  "hashmap": {"n": "16"},
  "status": "Given n = 16. Return true if n is a power of two. 16 in binary = 00010000. Expected: true."
}'::jsonb),

('power-of-two', 2, 'Approach: n & (n-1) Trick', '{
  "type": "array",
  "array": [0, 0, 0, 1, 0, 0, 0, 0],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "A power of two has exactly one set bit. Subtracting 1 flips that bit to 0 and turns all lower bits to 1. Thus n & (n-1) == 0 iff n is a power of two (and n > 0)."
}'::jsonb),

('power-of-two', 3, 'Guard: n > 0', '{
  "type": "array",
  "array": [0, 0, 0, 1, 0, 0, 0, 0],
  "highlights": [3],
  "pointers": {},
  "hashmap": {"n": "16"},
  "status": "n = 16 > 0, so continue. If n <= 0 return false (zero and negatives are not powers of two)."
}'::jsonb),

('power-of-two', 4, 'Compute n - 1', '{
  "type": "array",
  "array": [0, 0, 0, 0, 1, 1, 1, 1],
  "highlights": [4, 5, 6, 7],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"n-1": "15"},
  "status": "n - 1 = 15 → 00001111. The single 1 in n moved down and everything below it flipped to 1 — a classic borrow cascade."
}'::jsonb),

('power-of-two', 5, 'Bitwise AND', '{
  "type": "array",
  "array": [0, 0, 0, 0, 0, 0, 0, 0],
  "highlights": [],
  "pointers": {},
  "hashmap": {"n & (n-1)": "0"},
  "status": "16 & 15 = 00010000 & 00001111 = 00000000. No bit position is set in both, so the AND is zero."
}'::jsonb),

('power-of-two', 6, 'Return Result', '{
  "type": "array",
  "array": [0, 0, 0, 1, 0, 0, 0, 0],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"result": "true"},
  "status": "Since n > 0 and n & (n-1) == 0, return true. O(1) time and space — a single bit trick."
}'::jsonb),

('power-of-two', 7, 'Counter-Example: n = 12', '{
  "type": "array",
  "array": [0, 0, 0, 0, 1, 1, 0, 0],
  "highlights": [4, 5],
  "highlightColor": "red",
  "pointers": {},
  "hashmap": {"n": "12", "n-1": "11", "n & (n-1)": "8"},
  "status": "12 = 00001100 has two set bits. 12 & 11 = 00001100 & 00001011 = 00001000 = 8 != 0, so return false."
}'::jsonb);


-- ── REVERSE INTEGER ─────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'reverse-integer';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('reverse-integer', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1, 2, 3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"x": "123"},
  "status": "Given signed 32-bit integer x = 123. Return its digits reversed (321). If the reversed value overflows 32-bit, return 0."
}'::jsonb),

('reverse-integer', 2, 'Approach: Pop & Push Digits', '{
  "type": "array",
  "array": [1, 2, 3],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Extract the last digit with x % 10, drop it with x /= 10, and build result = result * 10 + digit. Before each push, check for overflow against INT_MAX / 10."
}'::jsonb),

('reverse-integer', 3, 'Initialize', '{
  "type": "array",
  "array": [1, 2, 3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"x": "123", "result": "0"},
  "status": "Set result = 0. We will iterate while x != 0, peeling off one digit per step."
}'::jsonb),

('reverse-integer', 4, 'Pop 3, push into result', '{
  "type": "array",
  "array": [1, 2],
  "highlights": [],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"x": "12", "digit": "3", "result": "3"},
  "status": "digit = 123 % 10 = 3. x = 123 / 10 = 12. result = 0 * 10 + 3 = 3."
}'::jsonb),

('reverse-integer', 5, 'Pop 2, push into result', '{
  "type": "array",
  "array": [1],
  "highlights": [],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"x": "1", "digit": "2", "result": "32"},
  "status": "digit = 12 % 10 = 2. x = 12 / 10 = 1. result = 3 * 10 + 2 = 32."
}'::jsonb),

('reverse-integer', 6, 'Pop 1, push into result', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"x": "0", "digit": "1", "result": "321"},
  "status": "digit = 1 % 10 = 1. x = 1 / 10 = 0. result = 32 * 10 + 1 = 321. Loop ends because x == 0."
}'::jsonb),

('reverse-integer', 7, 'Overflow Check', '{
  "type": "array",
  "array": [3, 2, 1],
  "highlights": [0, 1, 2],
  "pointers": {},
  "hashmap": {"INT_MAX": "2147483647", "result": "321"},
  "status": "Before each push we verify result < INT_MAX / 10, or (result == INT_MAX/10 AND digit <= 7). 321 is safely inside 32-bit range."
}'::jsonb),

('reverse-integer', 8, 'Return Result', '{
  "type": "array",
  "array": [3, 2, 1],
  "highlights": [0, 1, 2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"result": "321"},
  "status": "Return 321. O(log10 x) time, O(1) space. Negative inputs carry their sign through integer division in most languages."
}'::jsonb);


-- ── SUM OF TWO INTEGERS ─────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'sum-of-two-integers';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('sum-of-two-integers', 1, 'Problem Setup', '{
  "type": "array",
  "array": [0, 1, 0, 1],
  "highlights": [],
  "pointers": {},
  "hashmap": {"a": "5", "b": "3"},
  "status": "Given a = 5 (0101), b = 3 (0011). Return a + b without using the + or - operators. Expected: 8."
}'::jsonb),

('sum-of-two-integers', 2, 'Approach: XOR + AND + Shift', '{
  "type": "array",
  "array": [0, 1, 0, 1],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "XOR performs addition without carry. AND then left-shift-by-1 captures the carry. Repeat until carry is zero. When b (the carry) becomes 0, a holds the sum."
}'::jsonb),

('sum-of-two-integers', 3, 'Iter 1: compute sum & carry', '{
  "type": "array",
  "array": [0, 1, 1, 0],
  "highlights": [1, 2],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"a^b": "6 (0110)", "(a&b)<<1": "2 (0010)"},
  "status": "a ^ b = 0101 ^ 0011 = 0110 = 6 (partial sum). a & b = 0001, shifted left = 0010 = 2 (the carry)."
}'::jsonb),

('sum-of-two-integers', 4, 'Iter 1: update a and b', '{
  "type": "array",
  "array": [0, 1, 1, 0],
  "highlights": [1, 2],
  "pointers": {},
  "hashmap": {"a": "6", "b": "2"},
  "status": "a = 6, b = 2. b is still non-zero, so we loop again."
}'::jsonb),

('sum-of-two-integers', 5, 'Iter 2: compute sum & carry', '{
  "type": "array",
  "array": [0, 1, 0, 0],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"a^b": "4 (0100)", "(a&b)<<1": "4 (0100)"},
  "status": "a ^ b = 0110 ^ 0010 = 0100 = 4. a & b = 0010, shifted left = 0100 = 4. Carry is still non-zero."
}'::jsonb),

('sum-of-two-integers', 6, 'Iter 2: update a and b', '{
  "type": "array",
  "array": [0, 1, 0, 0],
  "highlights": [1],
  "pointers": {},
  "hashmap": {"a": "4", "b": "4"},
  "status": "a = 4, b = 4. Keep going; the carry has to fully propagate."
}'::jsonb),

('sum-of-two-integers', 7, 'Iter 3: carry collapses', '{
  "type": "array",
  "array": [1, 0, 0, 0],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"a^b": "0", "(a&b)<<1": "8", "a": "8", "b": "0"},
  "status": "a ^ b = 0100 ^ 0100 = 0 (the two 1s cancel). a & b = 0100, shifted = 1000 = 8. So a = 8, b = 0. Loop ends."
}'::jsonb),

('sum-of-two-integers', 8, 'Return Result', '{
  "type": "array",
  "array": [1, 0, 0, 0],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"result": "8"},
  "status": "Return a = 8 = 5 + 3. Each iteration pushes the carry one bit left, so runtime is O(bits) = O(32). O(1) space."
}'::jsonb);


-- ══════════════════════════════════════════════════════════════
-- RECURSION
-- ══════════════════════════════════════════════════════════════


-- ── CLIMBING STAIRS (K STEPS) ───────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'climbing-stairs-k';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('climbing-stairs-k', 1, 'Problem Setup', '{
  "type": "array",
  "array": [0, 0, 0, 0, 0],
  "highlights": [4],
  "pointers": {},
  "hashmap": {"n": "4", "k": "3"},
  "status": "Given n = 4 stairs and k = 3. You may take 1, 2, or 3 steps at a time. Count distinct ways to reach step n."
}'::jsonb),

('climbing-stairs-k', 2, 'Approach: Recursion with Memo', '{
  "type": "array",
  "array": [0, 0, 0, 0, 0],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "ways(i) = ways(i-1) + ways(i-2) + ... + ways(i-k), with ways(0) = 1 (one way to stand still). Memoize to reuse subproblem results — O(n*k) time instead of exponential."
}'::jsonb),

('climbing-stairs-k', 3, 'Base: memo[0] = 1', '{
  "type": "array",
  "array": [1, 0, 0, 0, 0],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"i": 0},
  "hashmap": {"memo": "{0: 1}"},
  "status": "memo[0] = 1. There is exactly one way to be at step 0 — take no steps at all."
}'::jsonb),

('climbing-stairs-k', 4, 'Compute memo[1]', '{
  "type": "array",
  "array": [1, 1, 0, 0, 0],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"i": 1},
  "hashmap": {"memo": "{0:1, 1:1}"},
  "status": "memo[1] = memo[0] = 1. Only one way: take a single 1-step from step 0. (memo[-1], memo[-2] are out of range.)"
}'::jsonb),

('climbing-stairs-k', 5, 'Compute memo[2]', '{
  "type": "array",
  "array": [1, 1, 2, 0, 0],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"i": 2},
  "hashmap": {"memo": "{0:1, 1:1, 2:2}"},
  "status": "memo[2] = memo[1] + memo[0] = 1 + 1 = 2. Ways: (1,1) and (2)."
}'::jsonb),

('climbing-stairs-k', 6, 'Compute memo[3]', '{
  "type": "array",
  "array": [1, 1, 2, 4, 0],
  "highlights": [3],
  "highlightColor": "yellow",
  "pointers": {"i": 3},
  "hashmap": {"memo": "{0:1, 1:1, 2:2, 3:4}"},
  "status": "memo[3] = memo[2] + memo[1] + memo[0] = 2 + 1 + 1 = 4. Ways: (1,1,1), (1,2), (2,1), (3)."
}'::jsonb),

('climbing-stairs-k', 7, 'Compute memo[4]', '{
  "type": "array",
  "array": [1, 1, 2, 4, 7],
  "highlights": [4],
  "highlightColor": "yellow",
  "pointers": {"i": 4},
  "hashmap": {"memo": "{0:1, 1:1, 2:2, 3:4, 4:7}"},
  "status": "memo[4] = memo[3] + memo[2] + memo[1] = 4 + 2 + 1 = 7. We only take k = 3 predecessors."
}'::jsonb),

('climbing-stairs-k', 8, 'Return Result', '{
  "type": "array",
  "array": [1, 1, 2, 4, 7],
  "highlights": [4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "7"},
  "status": "Return memo[n] = memo[4] = 7 distinct ways to climb 4 stairs using steps of size 1, 2, or 3. Time O(n*k), space O(n)."
}'::jsonb);


-- ── POWER SET (ITERATIVE) ───────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'power-set-iterative';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('power-set-iterative', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1, 2, 3],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given nums = [1, 2, 3]. Return all 2^n = 8 subsets (the power set), iteratively — no recursion."
}'::jsonb),

('power-set-iterative', 2, 'Approach: Bitmask Enumeration', '{
  "type": "array",
  "array": [1, 2, 3],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Every subset maps to an n-bit mask: bit j set means nums[j] is included. Loop mask from 0 to 2^n - 1 and build the subset from the set bits."
}'::jsonb),

('power-set-iterative', 3, 'mask = 000 → []', '{
  "type": "array",
  "array": [1, 2, 3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"mask": "000", "subset": "[]"},
  "status": "No bits set. Subset is the empty set []. Append to result."
}'::jsonb),

('power-set-iterative', 4, 'mask = 001 → [1]', '{
  "type": "array",
  "array": [1, 2, 3],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"mask": "001", "subset": "[1]"},
  "status": "Bit 0 set → include nums[0] = 1. Subset = [1]."
}'::jsonb),

('power-set-iterative', 5, 'mask = 010 → [2]', '{
  "type": "array",
  "array": [1, 2, 3],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"mask": "010", "subset": "[2]"},
  "status": "Bit 1 set → include nums[1] = 2. Subset = [2]."
}'::jsonb),

('power-set-iterative', 6, 'mask = 011 → [1,2]', '{
  "type": "array",
  "array": [1, 2, 3],
  "highlights": [0, 1],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"mask": "011", "subset": "[1,2]"},
  "status": "Bits 0 and 1 set → include nums[0]=1 and nums[1]=2. Subset = [1, 2]."
}'::jsonb),

('power-set-iterative', 7, 'mask = 101 → [1,3]', '{
  "type": "array",
  "array": [1, 2, 3],
  "highlights": [0, 2],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"mask": "101", "subset": "[1,3]"},
  "status": "Bits 0 and 2 set → Subset = [1, 3]. (Masks 100 and 110 similarly produce [3] and [2,3].)"
}'::jsonb),

('power-set-iterative', 8, 'mask = 111 → [1,2,3]', '{
  "type": "array",
  "array": [1, 2, 3],
  "highlights": [0, 1, 2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"mask": "111", "subset": "[1,2,3]"},
  "status": "All bits set → full set [1, 2, 3]. Final mask; the loop terminates."
}'::jsonb),

('power-set-iterative', 9, 'Return Result', '{
  "type": "array",
  "array": [1, 2, 3],
  "highlights": [0, 1, 2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"result_size": "8"},
  "status": "Return [[], [1], [2], [1,2], [3], [1,3], [2,3], [1,2,3]] — 2^3 = 8 subsets. Time O(n * 2^n), space O(n * 2^n) for the output."
}'::jsonb);


-- ══════════════════════════════════════════════════════════════
-- QUEUE
-- ══════════════════════════════════════════════════════════════


-- ── IMPLEMENT STACK USING QUEUES ────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'implement-stack-queues';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('implement-stack-queues', 1, 'Problem Setup', '{
  "type": "queue",
  "items": [],
  "operation": "Design a LIFO stack using only FIFO queue operations (push to back, pop from front, peek front, size, empty)."
}'::jsonb),

('implement-stack-queues', 2, 'Approach: Rotate on Push', '{
  "type": "queue",
  "items": [],
  "operation": "On each push(x): enqueue x, then rotate the queue by moving every earlier element to the back. This puts the newest element at the front, so pop() becomes a direct dequeue. push O(n), pop/top O(1)."
}'::jsonb),

('implement-stack-queues', 3, 'push(1)', '{
  "type": "queue",
  "items": [1],
  "operation": "Enqueue 1. Queue = [1]. Nothing to rotate. Front = 1 — which is also the stack top."
}'::jsonb),

('implement-stack-queues', 4, 'push(2) — before rotation', '{
  "type": "queue",
  "items": [1, 2],
  "operation": "Enqueue 2. Queue momentarily = [1, 2] (front → back). The stack top should be 2, but currently the front is 1."
}'::jsonb),

('implement-stack-queues', 5, 'push(2) — after rotation', '{
  "type": "queue",
  "items": [2, 1],
  "operation": "Rotate: dequeue 1 and re-enqueue it. Queue = [2, 1]. Now front = 2 = stack top."
}'::jsonb),

('implement-stack-queues', 6, 'push(3) — after rotation', '{
  "type": "queue",
  "items": [3, 2, 1],
  "operation": "Enqueue 3 to get [2, 1, 3], then rotate 2 elements to the back → [3, 2, 1]. Front = 3 = new stack top."
}'::jsonb),

('implement-stack-queues', 7, 'top()', '{
  "type": "queue",
  "items": [3, 2, 1],
  "operation": "Return front = 3. O(1) since the rotation already positioned the newest item at the front."
}'::jsonb),

('implement-stack-queues', 8, 'pop()', '{
  "type": "queue",
  "items": [2, 1],
  "operation": "Dequeue front = 3 and return it. Queue = [2, 1]. Next top is 2, which is already at the front."
}'::jsonb),

('implement-stack-queues', 9, 'pop() again', '{
  "type": "queue",
  "items": [1],
  "operation": "Dequeue front = 2 and return it. Queue = [1]. All LIFO invariants hold using only a single queue."
}'::jsonb);


-- ── ROTATE ARRAY ────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'rotate-array';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('rotate-array', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1, 2, 3, 4, 5, 6, 7],
  "highlights": [],
  "pointers": {},
  "hashmap": {"k": "3"},
  "status": "Given nums = [1,2,3,4,5,6,7], k = 3. Rotate the array to the right by k in-place. Expected: [5,6,7,1,2,3,4]."
}'::jsonb),

('rotate-array', 2, 'Approach: Three Reversals', '{
  "type": "array",
  "array": [1, 2, 3, 4, 5, 6, 7],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Key insight: right-rotation by k is equivalent to (1) reverse the whole array, (2) reverse the first k elements, (3) reverse the remaining n - k elements. O(n) time, O(1) space."
}'::jsonb),

('rotate-array', 3, 'Normalize k', '{
  "type": "array",
  "array": [1, 2, 3, 4, 5, 6, 7],
  "highlights": [],
  "pointers": {},
  "hashmap": {"k": "3", "n": "7"},
  "status": "k = k % n = 3 % 7 = 3. This guards against k >= n where full-array rotations collapse."
}'::jsonb),

('rotate-array', 4, 'Step 1: reverse entire array', '{
  "type": "array",
  "array": [7, 6, 5, 4, 3, 2, 1],
  "highlights": [0, 1, 2, 3, 4, 5, 6],
  "highlightColor": "yellow",
  "pointers": {"l": 0, "r": 6},
  "hashmap": {},
  "status": "Reverse nums[0..6]. The last k elements are now at the front (in reverse order), and the first n-k are at the back (also reversed)."
}'::jsonb),

('rotate-array', 5, 'Step 2: reverse first k', '{
  "type": "array",
  "array": [5, 6, 7, 4, 3, 2, 1],
  "highlights": [0, 1, 2],
  "highlightColor": "yellow",
  "pointers": {"l": 0, "r": 2},
  "hashmap": {},
  "status": "Reverse nums[0..k-1] = nums[0..2]: [7,6,5] → [5,6,7]. The front block is now the correct post-rotation prefix."
}'::jsonb),

('rotate-array', 6, 'Step 3: reverse last n-k', '{
  "type": "array",
  "array": [5, 6, 7, 1, 2, 3, 4],
  "highlights": [3, 4, 5, 6],
  "highlightColor": "yellow",
  "pointers": {"l": 3, "r": 6},
  "hashmap": {},
  "status": "Reverse nums[k..n-1] = nums[3..6]: [4,3,2,1] → [1,2,3,4]. The back block is now the correct post-rotation suffix."
}'::jsonb),

('rotate-array', 7, 'Verify', '{
  "type": "array",
  "array": [5, 6, 7, 1, 2, 3, 4],
  "highlights": [0, 1, 2, 3, 4, 5, 6],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {},
  "status": "Final array matches [5,6,7,1,2,3,4]. Each element was touched at most twice across the three reversals."
}'::jsonb),

('rotate-array', 8, 'Return Result', '{
  "type": "array",
  "array": [5, 6, 7, 1, 2, 3, 4],
  "highlights": [],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {},
  "status": "Rotation complete in place. O(n) time, O(1) auxiliary space — beats the naive O(n*k) shifting approach."
}'::jsonb);


-- ══════════════════════════════════════════════════════════════
-- STACK EXTRAS
-- ══════════════════════════════════════════════════════════════


-- ── NEXT GREATER ELEMENT ────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'next-greater-element';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('next-greater-element', 1, 'Problem Setup', '{
  "type": "stack",
  "items": [],
  "operation": "Given nums1 = [4,1,2], nums2 = [1,3,4,2]. For each x in nums1, return the next greater element to its right in nums2, or -1."
}'::jsonb),

('next-greater-element', 2, 'Approach: Monotonic Decreasing Stack', '{
  "type": "stack",
  "items": [],
  "operation": "Walk nums2 left→right. Keep a stack of values waiting for their next greater. When the current value exceeds the stack top, pop and record mapping[popped] = current. Finally look up each nums1[i]."
}'::jsonb),

('next-greater-element', 3, 'Process 1', '{
  "type": "stack",
  "items": [1],
  "operation": "Stack empty — just push 1. Stack = [1] (bottom → top). No element has been resolved yet."
}'::jsonb),

('next-greater-element', 4, 'Process 3 — pops 1', '{
  "type": "stack",
  "items": [3],
  "operation": "3 > top(1): pop 1, set map[1] = 3. Stack now empty; push 3. Stack = [3]. map = {1: 3}."
}'::jsonb),

('next-greater-element', 5, 'Process 4 — pops 3', '{
  "type": "stack",
  "items": [4],
  "operation": "4 > top(3): pop 3, set map[3] = 4. Stack empty; push 4. Stack = [4]. map = {1:3, 3:4}."
}'::jsonb),

('next-greater-element', 6, 'Process 2', '{
  "type": "stack",
  "items": [4, 2],
  "operation": "2 < top(4), so 4 has not yet found its greater. Push 2. Stack = [4, 2]. These two are still waiting."
}'::jsonb),

('next-greater-element', 7, 'End of nums2 — assign -1', '{
  "type": "stack",
  "items": [],
  "operation": "Drain the stack: anything still inside never finds a greater value. map[4] = -1, map[2] = -1. Final map = {1:3, 3:4, 4:-1, 2:-1}."
}'::jsonb),

('next-greater-element', 8, 'Look Up nums1', '{
  "type": "stack",
  "items": [],
  "operation": "For nums1 = [4,1,2]: map[4]=-1, map[1]=3, map[2]=-1. Answer = [-1, 3, -1]. Total time O(n2 + n1) — each value is pushed and popped at most once."
}'::jsonb);


-- ── REMOVE K DIGITS ─────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'remove-k-digits';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('remove-k-digits', 1, 'Problem Setup', '{
  "type": "stack",
  "items": [],
  "operation": "Given num = \"1432219\", k = 3. Remove k digits so the remaining number is smallest possible. Expected: \"1219\"."
}'::jsonb),

('remove-k-digits', 2, 'Approach: Monotonic Increasing Stack', '{
  "type": "stack",
  "items": [],
  "operation": "Scan digits left→right. While the stack top is greater than the current digit AND k > 0, pop (each pop consumes one deletion budget). Push current. This enforces non-decreasing order where possible."
}'::jsonb),

('remove-k-digits', 3, 'Push 1', '{
  "type": "stack",
  "items": ["1"],
  "operation": "Stack empty → push \"1\". Stack = [1]. k = 3."
}'::jsonb),

('remove-k-digits', 4, 'Push 4', '{
  "type": "stack",
  "items": ["1", "4"],
  "operation": "top(1) <= 4, so no pop. Push 4. Stack = [1, 4]. k = 3."
}'::jsonb),

('remove-k-digits', 5, 'Push 3 — pop 4', '{
  "type": "stack",
  "items": ["1", "3"],
  "operation": "top(4) > 3 and k > 0: pop 4, k = 2. top(1) <= 3: stop popping. Push 3. Stack = [1, 3]."
}'::jsonb),

('remove-k-digits', 6, 'Push 2 — pop 3', '{
  "type": "stack",
  "items": ["1", "2"],
  "operation": "top(3) > 2, k = 1. top(1) <= 2: stop. Push 2. Stack = [1, 2]."
}'::jsonb),

('remove-k-digits', 7, 'Push 2, 1 — pop 2', '{
  "type": "stack",
  "items": ["1", "1", "9"],
  "operation": "Next digit 2: top(2) == 2, no pop, push → [1,2,2]. Next digit 1: top(2) > 1 and k > 0 → pop 2, k = 0. Push 1 → [1,2,1]. Then 9: k = 0 so no more pops, push → [1,2,1,9]. Wait — we have budget exactly consumed now; stack shown is [1,1,9] after the full process."
}'::jsonb),

('remove-k-digits', 8, 'Trim leading zeros and return', '{
  "type": "stack",
  "items": ["1", "2", "1", "9"],
  "operation": "Final stack bottom→top = \"1219\". No leading zeros to strip. If stack were empty after trimming, we would return \"0\". Answer: \"1219\". Time O(n), space O(n)."
}'::jsonb);


-- ══════════════════════════════════════════════════════════════
-- TWO POINTERS EXTRA
-- ══════════════════════════════════════════════════════════════


-- ── REMOVE ELEMENT ──────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'remove-element';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('remove-element', 1, 'Problem Setup', '{
  "type": "array",
  "array": [3, 2, 2, 3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"val": "3"},
  "status": "Given nums = [3, 2, 2, 3], val = 3. Remove every occurrence of val in-place and return the new length k. The first k elements must be the survivors (order among them doesn''t matter)."
}'::jsonb),

('remove-element', 2, 'Approach: Fast/Slow Two Pointers', '{
  "type": "array",
  "array": [3, 2, 2, 3],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "slow marks the next write position. fast scans the whole array. When nums[fast] != val we copy it into nums[slow] and advance slow. O(n) time, O(1) space."
}'::jsonb),

('remove-element', 3, 'Initialize', '{
  "type": "array",
  "array": [3, 2, 2, 3],
  "highlights": [],
  "pointers": {"slow": 0, "fast": 0},
  "hashmap": {},
  "status": "Both pointers start at 0. slow = 0 (next write), fast = 0 (next read)."
}'::jsonb),

('remove-element', 4, 'fast=0: nums[0]=3 equals val — skip', '{
  "type": "array",
  "array": [3, 2, 2, 3],
  "highlights": [0],
  "highlightColor": "red",
  "pointers": {"slow": 0, "fast": 0},
  "hashmap": {},
  "status": "nums[0] == val, so we do NOT write. Advance fast only; slow stays so the slot can be overwritten later."
}'::jsonb),

('remove-element', 5, 'fast=1: nums[1]=2 — keep', '{
  "type": "array",
  "array": [2, 2, 2, 3],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"slow": 1, "fast": 1},
  "hashmap": {},
  "status": "nums[1] = 2 != val. Write nums[slow=0] = 2. Increment slow to 1, fast to 2."
}'::jsonb),

('remove-element', 6, 'fast=2: nums[2]=2 — keep', '{
  "type": "array",
  "array": [2, 2, 2, 3],
  "highlights": [1],
  "highlightColor": "green",
  "pointers": {"slow": 2, "fast": 2},
  "hashmap": {},
  "status": "nums[2] = 2 != val. Write nums[slow=1] = 2 (self-write is harmless). slow = 2, fast = 3."
}'::jsonb),

('remove-element', 7, 'fast=3: nums[3]=3 equals val — skip', '{
  "type": "array",
  "array": [2, 2, 2, 3],
  "highlights": [3],
  "highlightColor": "red",
  "pointers": {"slow": 2, "fast": 3},
  "hashmap": {},
  "status": "nums[3] == val, skip. Advance fast to 4, which exits the loop. slow remains 2."
}'::jsonb),

('remove-element', 8, 'Return Result', '{
  "type": "array",
  "array": [2, 2, 2, 3],
  "highlights": [0, 1],
  "highlightColor": "green",
  "pointers": {"k": 2},
  "hashmap": {},
  "status": "Return k = slow = 2. The first 2 elements [2, 2] are the retained values; positions beyond k are considered garbage and need not match."
}'::jsonb);
