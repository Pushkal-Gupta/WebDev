-- ═══════════════════════════════════════════════════════════════
-- Dry Runs — Sliding-Window topic (Phase B, Session 4)
-- ───────────────────────────────────────────────────────────────
-- Covers the 4 sliding-window problems without dry runs.
-- best-time-to-buy-sell-stock already has a dry run in enhance_dry_runs.sql.
-- ═══════════════════════════════════════════════════════════════


-- ── LONGEST SUBSTRING WITHOUT REPEATING CHARACTERS ──────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-substr-no-repeat';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-substr-no-repeat', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [],
  "pointers": {},
  "hashset": [],
  "hashmap": {"best":"0"},
  "status": "Given s = \"abcabcbb\". Return the length of the longest substring with all unique characters. Expected: 3 (\"abc\")."
}'::jsonb),

('longest-substr-no-repeat', 2, 'Approach: Sliding Window + Set', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [],
  "pointers": {"l": 0, "r": 0},
  "hashset": [],
  "hashmap": {"best":"0"},
  "status": "Maintain a window [l..r] where every character is unique (a hash set tracks the window). Expand r; if a duplicate arrives, shrink l until the duplicate is removed. Track best length seen."
}'::jsonb),

('longest-substr-no-repeat', 3, 'r=0: add a', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"l": 0, "r": 0},
  "hashset": ["a"],
  "hashmap": {"best":"1"},
  "status": "\"a\" not in set. Add. window = \"a\", len = 1."
}'::jsonb),

('longest-substr-no-repeat', 4, 'r=1: add b', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"l": 0, "r": 1},
  "hashset": ["a","b"],
  "hashmap": {"best":"2"},
  "status": "window = \"ab\", len = 2."
}'::jsonb),

('longest-substr-no-repeat', 5, 'r=2: add c', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {"l": 0, "r": 2},
  "hashset": ["a","b","c"],
  "hashmap": {"best":"3"},
  "status": "window = \"abc\", len = 3. New best!"
}'::jsonb),

('longest-substr-no-repeat', 6, 'r=3: dup a → shrink', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [1,2,3],
  "highlightColor": "yellow",
  "pointers": {"l": 1, "r": 3},
  "hashset": ["b","c","a"],
  "hashmap": {"best":"3"},
  "status": "\"a\" already in set. Shrink l: remove s[0]=''a'', l=1. Now add s[3]=''a''. window = \"bca\", len = 3."
}'::jsonb),

('longest-substr-no-repeat', 7, 'r=4,5: more dup shrinks', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [3,4,5],
  "pointers": {"l": 3, "r": 5},
  "hashset": ["a","b","c"],
  "hashmap": {"best":"3"},
  "status": "Each new char collides and forces l to advance. Windows \"cab\" then \"abc\" keep length 3."
}'::jsonb),

('longest-substr-no-repeat', 8, 'r=6: dup b → big shrink', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [5,6],
  "pointers": {"l": 5, "r": 6},
  "hashset": ["c","b"],
  "hashmap": {"best":"3"},
  "status": "s[6]=''b''. Shrink l past the previous b at index 4. Window = \"cb\", len 2."
}'::jsonb),

('longest-substr-no-repeat', 9, 'r=7: dup b again', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [7],
  "pointers": {"l": 7, "r": 7},
  "hashset": ["b"],
  "hashmap": {"best":"3"},
  "status": "Shrink until old ''b'' gone → l=7. Window = \"b\". Best unchanged."
}'::jsonb),

('longest-substr-no-repeat', 10, 'Result', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"best":"3"},
  "status": "Return 3. Each character enters and leaves the set at most once → O(n) total."
}'::jsonb);


-- ── LONGEST REPEATING CHARACTER REPLACEMENT ─────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-repeating-char';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-repeating-char', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["A","A","B","A","B","B","A"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"k":"1", "best":"0"},
  "status": "Given s = \"AABABBA\", k = 1. Find the longest substring where at most k characters can be replaced so all characters become the same. Expected: 4."
}'::jsonb),

('longest-repeating-char', 2, 'Approach: Window + maxFreq', '{
  "type": "array",
  "array": ["A","A","B","A","B","B","A"],
  "highlights": [],
  "pointers": {"l": 0, "r": 0},
  "hashmap": {"maxFreq":"0"},
  "status": "A window of length L is valid iff L - maxFreq <= k (we replace everything except the most common char). Grow r, update counts and maxFreq; if invalid, shrink l by one — we don''t need to decrement maxFreq because any smaller window with a lower maxFreq can''t beat our current best anyway."
}'::jsonb),

('longest-repeating-char', 3, 'r=0: A', '{
  "type": "array",
  "array": ["A","A","B","A","B","B","A"],
  "highlights": [0],
  "pointers": {"l": 0, "r": 0},
  "hashmap": {"A":"1","maxFreq":"1","best":"1"},
  "status": "len 1, 1−1 = 0 ≤ 1. Valid. best = 1."
}'::jsonb),

('longest-repeating-char', 4, 'r=1: A', '{
  "type": "array",
  "array": ["A","A","B","A","B","B","A"],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"l": 0, "r": 1},
  "hashmap": {"A":"2","maxFreq":"2","best":"2"},
  "status": "len 2, 2−2 = 0. Valid."
}'::jsonb),

('longest-repeating-char', 5, 'r=2: B', '{
  "type": "array",
  "array": ["A","A","B","A","B","B","A"],
  "highlights": [0,1,2],
  "highlightColor": "yellow",
  "pointers": {"l": 0, "r": 2},
  "hashmap": {"A":"2","B":"1","maxFreq":"2","best":"3"},
  "status": "len 3, 3−2 = 1 ≤ 1. Still valid (replace the one B). best = 3."
}'::jsonb),

('longest-repeating-char', 6, 'r=3: A', '{
  "type": "array",
  "array": ["A","A","B","A","B","B","A"],
  "highlights": [0,1,2,3],
  "highlightColor": "yellow",
  "pointers": {"l": 0, "r": 3},
  "hashmap": {"A":"3","B":"1","maxFreq":"3","best":"4"},
  "status": "len 4, 4−3 = 1. Valid. best = 4."
}'::jsonb),

('longest-repeating-char', 7, 'r=4: B, invalid → shrink', '{
  "type": "array",
  "array": ["A","A","B","A","B","B","A"],
  "highlights": [1,2,3,4],
  "pointers": {"l": 1, "r": 4},
  "hashmap": {"A":"2","B":"2","maxFreq":"3","best":"4"},
  "status": "Add B → A=3,B=2, len 5, 5−3 = 2 > 1. Shrink once: remove s[0]=A → A=2. l=1. len 4, 4−3 = 1. Valid again. best unchanged."
}'::jsonb),

('longest-repeating-char', 8, 'r=5,6: rolls forward', '{
  "type": "array",
  "array": ["A","A","B","A","B","B","A"],
  "highlights": [3,4,5,6],
  "pointers": {"l": 3, "r": 6},
  "hashmap": {"maxFreq":"3","best":"4"},
  "status": "Each expansion that breaks the invariant triggers exactly one shrink, so the window slides forward with constant length 4. best stays 4."
}'::jsonb),

('longest-repeating-char', 9, 'Result', '{
  "type": "array",
  "array": ["A","A","B","A","B","B","A"],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"best":"4"},
  "status": "Return 4. One possible optimal window is \"AABA\" where the single B becomes A. Time O(n)."
}'::jsonb);


-- ── MINIMUM WINDOW SUBSTRING ────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'min-window-substring';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('min-window-substring', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["A","D","O","B","E","C","O","D","E","B","A","N","C"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"t":"ABC"},
  "status": "Given s = \"ADOBECODEBANC\", t = \"ABC\". Return the smallest substring of s containing every character of t (with multiplicity). Expected: \"BANC\"."
}'::jsonb),

('min-window-substring', 2, 'Approach: Expand + Contract', '{
  "type": "array",
  "array": ["A","D","O","B","E","C","O","D","E","B","A","N","C"],
  "highlights": [],
  "pointers": {"l": 0, "r": 0},
  "hashmap": {"need":"A:1 B:1 C:1", "matched":"0/3"},
  "status": "Track required counts. Extend r until the window contains all of t. Then contract l while the window stays valid, updating best on every valid state."
}'::jsonb),

('min-window-substring', 3, 'Grow to r=5: first valid', '{
  "type": "array",
  "array": ["A","D","O","B","E","C","O","D","E","B","A","N","C"],
  "highlights": [0,1,2,3,4,5],
  "highlightColor": "yellow",
  "pointers": {"l": 0, "r": 5},
  "hashmap": {"matched":"3/3", "best":"ADOBEC (len 6)"},
  "status": "Window \"ADOBEC\" contains A, B, C. First valid window, length 6."
}'::jsonb),

('min-window-substring', 4, 'Contract l=0', '{
  "type": "array",
  "array": ["A","D","O","B","E","C","O","D","E","B","A","N","C"],
  "highlights": [1,2,3,4,5],
  "pointers": {"l": 1, "r": 5},
  "hashmap": {"matched":"2/3"},
  "status": "Remove s[0]=A. A no longer matched → window broken. Can''t contract further; resume growing r."
}'::jsonb),

('min-window-substring', 5, 'Grow to r=10: A returns', '{
  "type": "array",
  "array": ["A","D","O","B","E","C","O","D","E","B","A","N","C"],
  "highlights": [1,2,3,4,5,6,7,8,9,10],
  "highlightColor": "yellow",
  "pointers": {"l": 1, "r": 10},
  "hashmap": {"matched":"3/3", "best":"ADOBEC (len 6)"},
  "status": "r walks through DOBECODEBA — at r=10 an A is added back. Window valid again. Length 10 > best, don''t update."
}'::jsonb),

('min-window-substring', 6, 'Contract past junk', '{
  "type": "array",
  "array": ["A","D","O","B","E","C","O","D","E","B","A","N","C"],
  "highlights": [3,4,5,6,7,8,9,10],
  "pointers": {"l": 3, "r": 10},
  "hashmap": {"matched":"3/3", "best":"ADOBEC (len 6)"},
  "status": "Shrink l through D, O (not required). Window \"BECODEBA\" still valid, length 8. Still not better than 6."
}'::jsonb),

('min-window-substring', 7, 'l=4: removing B breaks', '{
  "type": "array",
  "array": ["A","D","O","B","E","C","O","D","E","B","A","N","C"],
  "highlights": [4,5,6,7,8,9,10],
  "pointers": {"l": 4, "r": 10},
  "hashmap": {"matched":"3/3", "best":"BECODEBA (len 7? tied)"},
  "status": "Removing s[3]=B would drop B count to 0 → stop. Actually there''s still a B at index 9, so matched stays 3/3. Keep shrinking."
}'::jsonb),

('min-window-substring', 8, 'Grow r=11, r=12', '{
  "type": "array",
  "array": ["A","D","O","B","E","C","O","D","E","B","A","N","C"],
  "highlights": [9,10,11,12],
  "highlightColor": "yellow",
  "pointers": {"l": 9, "r": 12},
  "hashmap": {"matched":"3/3", "best":"BANC (len 4)"},
  "status": "After more shrinking + growing, the window lands on [9..12] = \"BANC\" which contains B, A, C. Length 4. New best!"
}'::jsonb),

('min-window-substring', 9, 'Try shrink BANC', '{
  "type": "array",
  "array": ["A","D","O","B","E","C","O","D","E","B","A","N","C"],
  "highlights": [10,11,12],
  "pointers": {"l": 10, "r": 12},
  "hashmap": {"matched":"2/3"},
  "status": "Remove s[9]=B → B drops to 0, invalid. We already captured len 4 as the minimum."
}'::jsonb),

('min-window-substring', 10, 'Result', '{
  "type": "array",
  "array": ["A","D","O","B","E","C","O","D","E","B","A","N","C"],
  "highlights": [9,10,11,12],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"best":"BANC (4)"},
  "status": "Return \"BANC\". Time O(|s| + |t|); every index visited at most twice (once by r, once by l)."
}'::jsonb);


-- ── PERMUTATION IN STRING ───────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'permutation-in-string';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('permutation-in-string', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"s1":"ab"},
  "status": "Given s1 = \"ab\", s2 = \"eidbaooo\". Return true iff some contiguous substring of s2 is a permutation of s1."
}'::jsonb),

('permutation-in-string', 2, 'Approach: Fixed Window', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [],
  "pointers": {"l": 0, "r": 1},
  "hashmap": {"need":"a:1 b:1"},
  "status": "A permutation of s1 has the exact same character counts as s1 and the same length. Slide a fixed window of size |s1| across s2; at every position, check if counts match."
}'::jsonb),

('permutation-in-string', 3, '[0,1]: \"ei\"', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [0,1],
  "highlightColor": "red",
  "pointers": {"l": 0, "r": 1},
  "hashmap": {"window":"e:1 i:1"},
  "status": "Counts don''t match (need a,b). Slide: remove s[0]=e, add s[2]=d."
}'::jsonb),

('permutation-in-string', 4, '[1,2]: \"id\"', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [1,2],
  "highlightColor": "red",
  "pointers": {"l": 1, "r": 2},
  "hashmap": {"window":"i:1 d:1"},
  "status": "Still no match. Slide."
}'::jsonb),

('permutation-in-string', 5, '[2,3]: \"db\"', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [2,3],
  "highlightColor": "red",
  "pointers": {"l": 2, "r": 3},
  "hashmap": {"window":"d:1 b:1"},
  "status": "Has b but also d (not needed)."
}'::jsonb),

('permutation-in-string', 6, '[3,4]: \"ba\" ✓', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [3,4],
  "highlightColor": "green",
  "pointers": {"l": 3, "r": 4},
  "hashmap": {"window":"b:1 a:1"},
  "status": "window counts {a:1,b:1} == need. Return true immediately."
}'::jsonb),

('permutation-in-string', 7, 'Result', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [3,4],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return true. \"ba\" is a permutation of \"ab\". Time O(|s2|) using an incremental 26-slot count array; constant work per slide."
}'::jsonb);


-- ── Sanity ────────────────────────────────────────────────────
SELECT problem_id, COUNT(*) AS step_count
FROM "PGcode_interactive_dry_runs"
WHERE problem_id IN (
  'longest-substr-no-repeat','longest-repeating-char','min-window-substring','permutation-in-string'
)
GROUP BY problem_id
ORDER BY problem_id;
