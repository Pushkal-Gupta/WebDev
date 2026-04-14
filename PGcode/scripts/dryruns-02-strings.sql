-- ═══════════════════════════════════════════════════════════════
-- Dry Runs — Strings topic (Phase B, Session 2)
-- ───────────────────────────────────────────────────────────────
-- Covers all 10 strings problems seeded in seed_real_200_pilot.sql.
-- All use ArrayRenderer with character cells.
-- Safe to re-run: each section DELETEs existing steps first.
-- ═══════════════════════════════════════════════════════════════


-- ── LENGTH OF LAST WORD ───────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'length-of-last-word';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('length-of-last-word', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["l","u","f","f","y"," ","i","s"," ","s","t","i","l","l"," ","j","o","y","b","o","y"],
  "highlights": [],
  "pointers": {},
  "status": "Given s = \"luffy is still joyboy\". Return the length of the last word (6 for \"joyboy\"). Words are separated by spaces."
}'::jsonb),

('length-of-last-word', 2, 'Approach: Scan From Right', '{
  "type": "array",
  "array": ["l","u","f","f","y"," ","i","s"," ","s","t","i","l","l"," ","j","o","y","b","o","y"],
  "highlights": [],
  "pointers": {},
  "status": "Walk backward from the end. First skip any trailing spaces, then count characters until the next space or the string start."
}'::jsonb),

('length-of-last-word', 3, 'Skip Trailing Spaces', '{
  "type": "array",
  "array": ["l","u","f","f","y"," ","i","s"," ","s","t","i","l","l"," ","j","o","y","b","o","y"],
  "highlights": [20],
  "pointers": {"i": 20},
  "status": "i = len(s)-1 = 20. s[20] = ''y'' is not a space, so there are no trailing spaces. Begin counting."
}'::jsonb),

('length-of-last-word', 4, 'Count: y, o, b', '{
  "type": "array",
  "array": ["l","u","f","f","y"," ","i","s"," ","s","t","i","l","l"," ","j","o","y","b","o","y"],
  "highlights": [20,19,18],
  "highlightColor": "yellow",
  "pointers": {"i": 18},
  "status": "Walk left while s[i] is not a space. Counted y, o, b → length = 3."
}'::jsonb),

('length-of-last-word', 5, 'Count: y, o, j', '{
  "type": "array",
  "array": ["l","u","f","f","y"," ","i","s"," ","s","t","i","l","l"," ","j","o","y","b","o","y"],
  "highlights": [15,16,17,18,19,20],
  "highlightColor": "yellow",
  "pointers": {"i": 15},
  "status": "Continue through y, o, j. length = 6. i = 15."
}'::jsonb),

('length-of-last-word', 6, 'Hit Space', '{
  "type": "array",
  "array": ["l","u","f","f","y"," ","i","s"," ","s","t","i","l","l"," ","j","o","y","b","o","y"],
  "highlights": [14],
  "highlightColor": "red",
  "pointers": {"i": 14},
  "status": "s[14] is a space → stop. The last word is \"joyboy\" with length 6."
}'::jsonb),

('length-of-last-word', 7, 'Result', '{
  "type": "array",
  "array": ["l","u","f","f","y"," ","i","s"," ","s","t","i","l","l"," ","j","o","y","b","o","y"],
  "highlights": [15,16,17,18,19,20],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return 6. Time O(n), space O(1)."
}'::jsonb);


-- ── LONGEST COMMON PREFIX ─────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-common-prefix';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-common-prefix', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["flower","flow","flight"],
  "highlights": [],
  "pointers": {},
  "status": "Given strs = [\"flower\",\"flow\",\"flight\"]. Find the longest string prefix common to every word."
}'::jsonb),

('longest-common-prefix', 2, 'Approach: Vertical Scan', '{
  "type": "array",
  "array": ["flower","flow","flight"],
  "highlights": [],
  "pointers": {},
  "status": "Compare character col-by-col. At each column, every string must have the same character; the first mismatch (or the shortest string ending) stops us."
}'::jsonb),

('longest-common-prefix', 3, 'Col 0: f,f,f', '{
  "type": "array",
  "array": ["f","l","o","w","e","r"],
  "labels": {"0":"col 0"},
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"col": 0},
  "status": "strs[0][0]=f, strs[1][0]=f, strs[2][0]=f. All match. prefix = \"f\"."
}'::jsonb),

('longest-common-prefix', 4, 'Col 1: l,l,l', '{
  "type": "array",
  "array": ["f","l","o","w","e","r"],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"col": 1},
  "status": "strs[0][1]=l, strs[1][1]=l, strs[2][1]=l. All match. prefix = \"fl\"."
}'::jsonb),

('longest-common-prefix', 5, 'Col 2: o,o,i', '{
  "type": "array",
  "array": ["f","l","o","w","e","r"],
  "highlights": [2],
  "highlightColor": "red",
  "pointers": {"col": 2},
  "status": "strs[0][2]=o, strs[1][2]=o, strs[2][2]=i → MISMATCH. Stop."
}'::jsonb),

('longest-common-prefix', 6, 'Result', '{
  "type": "array",
  "array": ["f","l"],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return \"fl\". Time O(n · m) where n = number of strings and m = length of shortest."
}'::jsonb);


-- ── ROMAN TO INTEGER ──────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'roman-to-integer';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('roman-to-integer', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"I":"1","V":"5","X":"10","L":"50","C":"100","D":"500","M":"1000"},
  "status": "Given s = \"MCMXCIV\". Convert to decimal. Expected: 1994."
}'::jsonb),

('roman-to-integer', 2, 'Approach: Compare Neighbours', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"I":"1","V":"5","X":"10","L":"50","C":"100","D":"500","M":"1000"},
  "status": "Walk left to right. If value[i] < value[i+1], subtract it (IV = 4, IX = 9). Otherwise add it. This captures all Roman subtraction pairs."
}'::jsonb),

('roman-to-integer', 3, 'i=0: M vs C', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashmap": {"total":"1000"},
  "status": "M(1000) vs next C(100). 1000 ≥ 100 → add. total = 1000."
}'::jsonb),

('roman-to-integer', 4, 'i=1: C vs M', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"i": 1},
  "hashmap": {"total":"900"},
  "status": "C(100) vs next M(1000). 100 < 1000 → SUBTRACT. total = 1000 − 100 = 900. (This is the CM = 900 pair.)"
}'::jsonb),

('roman-to-integer', 5, 'i=2: M vs X', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [2],
  "pointers": {"i": 2},
  "hashmap": {"total":"1900"},
  "status": "M(1000) ≥ X(10) → add. total = 1900."
}'::jsonb),

('roman-to-integer', 6, 'i=3: X vs C', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [3],
  "highlightColor": "yellow",
  "pointers": {"i": 3},
  "hashmap": {"total":"1890"},
  "status": "X(10) < C(100) → subtract. total = 1890. (XC = 90.)"
}'::jsonb),

('roman-to-integer', 7, 'i=4: C vs I', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [4],
  "pointers": {"i": 4},
  "hashmap": {"total":"1990"},
  "status": "C(100) ≥ I(1) → add. total = 1990."
}'::jsonb),

('roman-to-integer', 8, 'i=5: I vs V', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [5],
  "highlightColor": "yellow",
  "pointers": {"i": 5},
  "hashmap": {"total":"1989"},
  "status": "I(1) < V(5) → subtract. total = 1989. (IV = 4.)"
}'::jsonb),

('roman-to-integer', 9, 'i=6: V (last)', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [6],
  "pointers": {"i": 6},
  "hashmap": {"total":"1994"},
  "status": "Last char: always added. total = 1994."
}'::jsonb),

('roman-to-integer', 10, 'Result', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [0,1,2,3,4,5,6],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"total":"1994"},
  "status": "Return 1994. Time O(n), space O(1)."
}'::jsonb);


-- ── FIND NEEDLE IN HAYSTACK ──────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'find-needle-haystack';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('find-needle-haystack', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["h","e","l","l","o"],
  "highlights": [],
  "pointers": {},
  "status": "haystack = \"hello\", needle = \"ll\". Return the index of the first occurrence of needle in haystack, or -1."
}'::jsonb),

('find-needle-haystack', 2, 'Approach: Sliding Window', '{
  "type": "array",
  "array": ["h","e","l","l","o"],
  "highlights": [],
  "pointers": {},
  "status": "Slide a window of length len(needle)=2 across haystack. At each start index i, compare haystack[i..i+2] to \"ll\"."
}'::jsonb),

('find-needle-haystack', 3, 'i=0: \"he\" vs \"ll\"', '{
  "type": "array",
  "array": ["h","e","l","l","o"],
  "highlights": [0,1],
  "highlightColor": "red",
  "pointers": {"i": 0},
  "status": "haystack[0..2] = \"he\" ≠ \"ll\". Move on."
}'::jsonb),

('find-needle-haystack', 4, 'i=1: \"el\" vs \"ll\"', '{
  "type": "array",
  "array": ["h","e","l","l","o"],
  "highlights": [1,2],
  "highlightColor": "red",
  "pointers": {"i": 1},
  "status": "haystack[1..3] = \"el\" ≠ \"ll\"."
}'::jsonb),

('find-needle-haystack', 5, 'i=2: \"ll\" vs \"ll\"', '{
  "type": "array",
  "array": ["h","e","l","l","o"],
  "highlights": [2,3],
  "highlightColor": "green",
  "pointers": {"i": 2},
  "status": "haystack[2..4] = \"ll\" = needle! Return i = 2."
}'::jsonb),

('find-needle-haystack', 6, 'Result', '{
  "type": "array",
  "array": ["h","e","l","l","o"],
  "highlights": [2,3],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return 2. Time O((n−m+1) · m) in the worst case; optimal is KMP at O(n+m)."
}'::jsonb);


-- ── REVERSE WORDS IN A STRING ─────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'reverse-words-in-string';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('reverse-words-in-string', 1, 'Problem Setup', '{
  "type": "array",
  "array": [" "," ","h","e","l","l","o"," ","w","o","r","l","d"," "," "],
  "highlights": [],
  "pointers": {},
  "status": "Given s = \"  hello world  \". Reverse the order of words. Strip leading/trailing spaces and collapse multiple spaces into one."
}'::jsonb),

('reverse-words-in-string', 2, 'Approach: Split, Reverse, Join', '{
  "type": "array",
  "array": [" "," ","h","e","l","l","o"," ","w","o","r","l","d"," "," "],
  "highlights": [],
  "pointers": {},
  "status": "Easiest: split on whitespace (language built-ins drop empties), reverse the resulting list, join with a single space."
}'::jsonb),

('reverse-words-in-string', 3, 'Split', '{
  "type": "array",
  "array": ["hello","world"],
  "highlights": [0,1],
  "pointers": {},
  "status": "Tokens after split: [\"hello\", \"world\"]. All the stray spaces vanished."
}'::jsonb),

('reverse-words-in-string', 4, 'Reverse List', '{
  "type": "array",
  "array": ["world","hello"],
  "highlights": [0,1],
  "highlightColor": "yellow",
  "pointers": {},
  "status": "Reverse the token list → [\"world\", \"hello\"]."
}'::jsonb),

('reverse-words-in-string', 5, 'Join', '{
  "type": "array",
  "array": ["w","o","r","l","d"," ","h","e","l","l","o"],
  "highlights": [0,1,2,3,4,5,6,7,8,9,10],
  "highlightColor": "green",
  "pointers": {},
  "status": "Join with a single space: \"world hello\"."
}'::jsonb),

('reverse-words-in-string', 6, 'Result', '{
  "type": "array",
  "array": ["w","o","r","l","d"," ","h","e","l","l","o"],
  "highlights": [0,1,2,3,4,5,6,7,8,9,10],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return \"world hello\". Time O(n), space O(n)."
}'::jsonb);


-- ── LONGEST PALINDROMIC SUBSTRING ─────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-palindromic-substring';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-palindromic-substring', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [],
  "pointers": {},
  "status": "Given s = \"babad\". Return the longest substring that is a palindrome. Expected: \"bab\" (or \"aba\" — both valid)."
}'::jsonb),

('longest-palindromic-substring', 2, 'Approach: Expand Around Center', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [],
  "pointers": {},
  "status": "A palindrome mirrors around its center. Try every possible center (2n−1 of them: n odd-length, n−1 even-length) and expand outward while s[l]==s[r]."
}'::jsonb),

('longest-palindromic-substring', 3, 'Center i=0 ''b''', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [0],
  "pointers": {"l": 0, "r": 0},
  "status": "Odd expand from (0,0): s[0]=b. Expand → l=-1, out of bounds. Palindrome \"b\", length 1. best = \"b\"."
}'::jsonb),

('longest-palindromic-substring', 4, 'Center i=1 ''a''', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [0,1,2],
  "highlightColor": "yellow",
  "pointers": {"l": 0, "r": 2},
  "status": "Odd expand from (1,1). s[0]=b, s[2]=b → match. Expand → l=-1 out of bounds. Palindrome \"bab\", length 3. best = \"bab\"."
}'::jsonb),

('longest-palindromic-substring', 5, 'Center i=2 ''b''', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [1,2,3],
  "highlightColor": "yellow",
  "pointers": {"l": 1, "r": 3},
  "status": "Odd expand from (2,2). s[1]=a, s[3]=a → match. Expand: s[0]=b, s[4]=d → mismatch. Palindrome \"aba\", length 3. Tie with best (keep first)."
}'::jsonb),

('longest-palindromic-substring', 6, 'Centers i=3, i=4', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [3,4],
  "pointers": {},
  "status": "Odd expands from (3,3) and (4,4) each give length 1. Even centers (i, i+1) all fail instantly because adjacent chars differ."
}'::jsonb),

('longest-palindromic-substring', 7, 'Result', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return \"bab\". Time O(n²), space O(1)."
}'::jsonb);


-- ── PALINDROMIC SUBSTRINGS ────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'palindromic-substrings';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('palindromic-substrings', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"count": "0"},
  "status": "Given s = \"aaa\". Count the number of palindromic substrings (overlaps count as distinct). Expected: 6."
}'::jsonb),

('palindromic-substrings', 2, 'Approach: Expand Around Center', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"count": "0"},
  "status": "Same idea as longest palindrome, but we INCREMENT count for every successful expansion instead of tracking a best."
}'::jsonb),

('palindromic-substrings', 3, 'Odd center 0', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [0],
  "pointers": {"l": 0, "r": 0},
  "hashmap": {"count": "1"},
  "status": "\"a\" at index 0. count = 1."
}'::jsonb),

('palindromic-substrings', 4, 'Odd center 1 → expand', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [0,1,2],
  "highlightColor": "yellow",
  "pointers": {"l": 0, "r": 2},
  "hashmap": {"count": "3"},
  "status": "\"a\" at index 1 (count=2), then expand to \"aaa\" (count=3). Two palindromes from this center."
}'::jsonb),

('palindromic-substrings', 5, 'Odd center 2', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [2],
  "pointers": {"l": 2, "r": 2},
  "hashmap": {"count": "4"},
  "status": "\"a\" at index 2. count = 4."
}'::jsonb),

('palindromic-substrings', 6, 'Even center (0,1)', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [0,1],
  "highlightColor": "yellow",
  "pointers": {"l": 0, "r": 1},
  "hashmap": {"count": "5"},
  "status": "\"aa\" from (0,1). count = 5. Cannot expand further (l-1 out of bounds)."
}'::jsonb),

('palindromic-substrings', 7, 'Even center (1,2)', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [1,2],
  "highlightColor": "yellow",
  "pointers": {"l": 1, "r": 2},
  "hashmap": {"count": "6"},
  "status": "\"aa\" from (1,2). count = 6."
}'::jsonb),

('palindromic-substrings', 8, 'Result', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"count": "6"},
  "status": "Return 6. Time O(n²), space O(1)."
}'::jsonb);


-- ── STRING TO INTEGER (atoi) ──────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'string-to-integer-atoi';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('string-to-integer-atoi', 1, 'Problem Setup', '{
  "type": "array",
  "array": [" "," "," ","-","4","2"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"sign":"+", "result":"0"},
  "status": "Given s = \"   -42\". Parse a signed 32-bit integer following the atoi rules. Expected: -42."
}'::jsonb),

('string-to-integer-atoi', 2, 'Approach: Four Phases', '{
  "type": "array",
  "array": [" "," "," ","-","4","2"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"sign":"+", "result":"0"},
  "status": "Phase 1: skip leading whitespace. Phase 2: optional +/− sign. Phase 3: consume digits. Phase 4: clamp to INT32 range."
}'::jsonb),

('string-to-integer-atoi', 3, 'Skip Whitespace', '{
  "type": "array",
  "array": [" "," "," ","-","4","2"],
  "highlights": [0,1,2],
  "highlightColor": "red",
  "pointers": {"i": 3},
  "hashmap": {"sign":"+", "result":"0"},
  "status": "Skip indices 0,1,2 (all spaces). i = 3."
}'::jsonb),

('string-to-integer-atoi', 4, 'Read Sign', '{
  "type": "array",
  "array": [" "," "," ","-","4","2"],
  "highlights": [3],
  "highlightColor": "yellow",
  "pointers": {"i": 4},
  "hashmap": {"sign":"−", "result":"0"},
  "status": "s[3] = ''-'' → sign = negative. Advance i to 4."
}'::jsonb),

('string-to-integer-atoi', 5, 'Digit: 4', '{
  "type": "array",
  "array": [" "," "," ","-","4","2"],
  "highlights": [4],
  "highlightColor": "green",
  "pointers": {"i": 4},
  "hashmap": {"sign":"−", "result":"4"},
  "status": "s[4] = ''4''. result = result * 10 + 4 = 4."
}'::jsonb),

('string-to-integer-atoi', 6, 'Digit: 2', '{
  "type": "array",
  "array": [" "," "," ","-","4","2"],
  "highlights": [5],
  "highlightColor": "green",
  "pointers": {"i": 5},
  "hashmap": {"sign":"−", "result":"42"},
  "status": "s[5] = ''2''. result = 4 * 10 + 2 = 42."
}'::jsonb),

('string-to-integer-atoi', 7, 'Apply Sign + Clamp', '{
  "type": "array",
  "array": [" "," "," ","-","4","2"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"final":"-42"},
  "status": "Apply sign: -42. Check overflow: -42 is within [−2^31, 2^31−1], no clamping needed."
}'::jsonb),

('string-to-integer-atoi', 8, 'Result', '{
  "type": "array",
  "array": ["-","4","2"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return -42. Time O(n), space O(1)."
}'::jsonb);


-- ── ADD BINARY ───────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'add-binary';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('add-binary', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["1","0","1","0"],
  "labels": {"0":"a"},
  "highlights": [],
  "pointers": {},
  "hashmap": {"b":"1011"},
  "status": "Given a = \"1010\", b = \"1011\". Return their sum as a binary string. Expected: \"10101\"."
}'::jsonb),

('add-binary', 2, 'Approach: Column Addition', '{
  "type": "array",
  "array": ["1","0","1","0"],
  "labels": {"0":"a"},
  "highlights": [],
  "pointers": {},
  "hashmap": {"b":"1011","carry":"0","result":""},
  "status": "Walk both strings from the right, just like grade-school addition. At each column: sum = a[i] + b[j] + carry. Write sum%2, carry = sum/2."
}'::jsonb),

('add-binary', 3, 'Col 3 (rightmost)', '{
  "type": "array",
  "array": ["1","0","1","0"],
  "labels": {"0":"a"},
  "highlights": [3],
  "highlightColor": "yellow",
  "pointers": {"i": 3, "j": 3},
  "hashmap": {"b":"1011","carry":"0","result":"1"},
  "status": "a[3]=0, b[3]=1, carry=0. sum = 1. Write ''1''. carry = 0."
}'::jsonb),

('add-binary', 4, 'Col 2', '{
  "type": "array",
  "array": ["1","0","1","0"],
  "labels": {"0":"a"},
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"i": 2, "j": 2},
  "hashmap": {"b":"1011","carry":"1","result":"01"},
  "status": "a[2]=1, b[2]=1, carry=0. sum = 2. Write ''0'', carry = 1."
}'::jsonb),

('add-binary', 5, 'Col 1', '{
  "type": "array",
  "array": ["1","0","1","0"],
  "labels": {"0":"a"},
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"i": 1, "j": 1},
  "hashmap": {"b":"1011","carry":"0","result":"101"},
  "status": "a[1]=0, b[1]=0, carry=1. sum = 1. Write ''1'', carry = 0."
}'::jsonb),

('add-binary', 6, 'Col 0', '{
  "type": "array",
  "array": ["1","0","1","0"],
  "labels": {"0":"a"},
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"i": 0, "j": 0},
  "hashmap": {"b":"1011","carry":"1","result":"0101"},
  "status": "a[0]=1, b[0]=1, carry=0. sum = 2. Write ''0'', carry = 1."
}'::jsonb),

('add-binary', 7, 'Leftover Carry', '{
  "type": "array",
  "array": ["1","0","1","0"],
  "labels": {"0":"a"},
  "highlights": [],
  "pointers": {},
  "hashmap": {"carry":"0","result":"10101"},
  "status": "Both strings consumed. carry = 1 → prepend ''1''. result = \"10101\"."
}'::jsonb),

('add-binary', 8, 'Result', '{
  "type": "array",
  "array": ["1","0","1","0","1"],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return \"10101\" (= 21 decimal, which is 10 + 11). Time O(max(|a|,|b|))."
}'::jsonb);


-- ── COUNT AND SAY ────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'count-and-say';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('count-and-say', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["1"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"n":"4"},
  "status": "Given n = 4. Return the 4th term of the count-and-say sequence. term 1 = \"1\"."
}'::jsonb),

('count-and-say', 2, 'Approach: Run-Length Describe', '{
  "type": "array",
  "array": ["1"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"n":"4"},
  "status": "Each term describes the previous one by listing runs of identical digits: count then the digit. Iterate term = f(term) n-1 times."
}'::jsonb),

('count-and-say', 3, 'term 1 → term 2', '{
  "type": "array",
  "array": ["1"],
  "highlights": [0],
  "pointers": {},
  "hashmap": {"term":"1"},
  "status": "Describe \"1\": one ''1'' → \"11\". term 2 = \"11\"."
}'::jsonb),

('count-and-say', 4, 'term 2 → term 3', '{
  "type": "array",
  "array": ["1","1"],
  "highlights": [0,1],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"term":"11"},
  "status": "Describe \"11\": two ''1''s → \"21\". term 3 = \"21\"."
}'::jsonb),

('count-and-say', 5, 'term 3 → term 4', '{
  "type": "array",
  "array": ["2","1"],
  "highlights": [0,1],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"term":"21"},
  "status": "Describe \"21\": one ''2'', one ''1'' → \"1211\". term 4 = \"1211\"."
}'::jsonb),

('count-and-say', 6, 'Result', '{
  "type": "array",
  "array": ["1","2","1","1"],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return \"1211\". Each term can up to double in length, so the series grows quickly."
}'::jsonb);


-- ── Sanity ────────────────────────────────────────────────────
SELECT problem_id, COUNT(*) AS step_count
FROM "PGcode_interactive_dry_runs"
WHERE problem_id IN (
  'length-of-last-word','longest-common-prefix','roman-to-integer',
  'find-needle-haystack','reverse-words-in-string','longest-palindromic-substring',
  'palindromic-substrings','string-to-integer-atoi','add-binary','count-and-say'
)
GROUP BY problem_id
ORDER BY problem_id;
