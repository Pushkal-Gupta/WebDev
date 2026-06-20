-- ═══════════════════════════════════════════════════════════════
-- Dry Runs — Arrays topic (Phase B, Session 1)
-- ───────────────────────────────────────────────────────────────
-- Covers the 6 real arrays problems that don't yet have dry runs.
-- Already covered in enhance_dry_runs.sql: two-sum, contains-duplicate.
--
-- Renderers used: ArrayRenderer (supports array, highlights,
-- pointers, hashmap, hashset, labels, highlightColor).
--
-- Safe to re-run: each section DELETEs existing steps first.
-- ═══════════════════════════════════════════════════════════════


-- ── VALID ANAGRAM ─────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'valid-anagram';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('valid-anagram', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["a","n","a","g","r","a","m"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given s = \"anagram\", t = \"nagaram\". Return true if t is an anagram of s (same letters, any order)."
}'::jsonb),

('valid-anagram', 2, 'Approach: Frequency Map', '{
  "type": "array",
  "array": ["a","n","a","g","r","a","m"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Count how often each character appears in s. Then decrement counts as we scan t. If every count is zero at the end, they are anagrams. O(n) time."
}'::jsonb),

('valid-anagram', 3, 'Length Check', '{
  "type": "array",
  "array": ["a","n","a","g","r","a","m"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "len(s) = 7, len(t) = 7. Lengths match, so continue. If they differed we could return false immediately."
}'::jsonb),

('valid-anagram', 4, 's: count ''a''', '{
  "type": "array",
  "array": ["a","n","a","g","r","a","m"],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashmap": {"a": "1"},
  "status": "Read s[0] = ''a''. count[''a''] = 1."
}'::jsonb),

('valid-anagram', 5, 's: count ''n''', '{
  "type": "array",
  "array": ["a","n","a","g","r","a","m"],
  "highlights": [1],
  "pointers": {"i": 1},
  "hashmap": {"a": "1", "n": "1"},
  "status": "Read s[1] = ''n''. count[''n''] = 1."
}'::jsonb),

('valid-anagram', 6, 's: finish counting', '{
  "type": "array",
  "array": ["a","n","a","g","r","a","m"],
  "highlights": [0,1,2,3,4,5,6],
  "pointers": {},
  "hashmap": {"a": "3", "n": "1", "g": "1", "r": "1", "m": "1"},
  "status": "Full pass through s done. Final frequency map: a=3, n=1, g=1, r=1, m=1."
}'::jsonb),

('valid-anagram', 7, 't: decrement ''n''', '{
  "type": "array",
  "array": ["n","a","g","a","r","a","m"],
  "highlights": [0],
  "pointers": {"j": 0},
  "hashmap": {"a": "3", "n": "0", "g": "1", "r": "1", "m": "1"},
  "status": "Now scan t. Read t[0] = ''n''. count[''n''] → 0. Still non-negative, keep going."
}'::jsonb),

('valid-anagram', 8, 't: decrement ''a'' x3', '{
  "type": "array",
  "array": ["n","a","g","a","r","a","m"],
  "highlights": [1,3,5],
  "pointers": {"j": 5},
  "hashmap": {"a": "0", "n": "0", "g": "1", "r": "1", "m": "1"},
  "status": "Decrement ''a'' each time we see it in t. After positions 1, 3, 5: count[''a''] = 0."
}'::jsonb),

('valid-anagram', 9, 't: finish', '{
  "type": "array",
  "array": ["n","a","g","a","r","a","m"],
  "highlights": [0,1,2,3,4,5,6],
  "pointers": {},
  "hashmap": {"a": "0", "n": "0", "g": "0", "r": "0", "m": "0"},
  "status": "All of t processed. Every count is exactly zero → every char in s matched a char in t."
}'::jsonb),

('valid-anagram', 10, 'Result', '{
  "type": "array",
  "array": ["n","a","g","a","r","a","m"],
  "highlights": [0,1,2,3,4,5,6],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"a": "0", "n": "0", "g": "0", "r": "0", "m": "0"},
  "status": "Return true. \"nagaram\" is an anagram of \"anagram\". Time O(n), space O(1) since only 26 letters."
}'::jsonb);


-- ── GROUP ANAGRAMS ─────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'group-anagrams';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('group-anagrams', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]. Group the anagrams together (each group in the output is one anagram family)."
}'::jsonb),

('group-anagrams', 2, 'Approach: Sorted Key', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Two strings are anagrams iff their sorted letters are identical. Use the sorted string as a hash map key; group members under that key."
}'::jsonb),

('group-anagrams', 3, 'Process \"eat\"', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashmap": {"aet": "[eat]"},
  "status": "Sort \"eat\" → \"aet\". map[\"aet\"] does not exist, create entry with [\"eat\"]."
}'::jsonb),

('group-anagrams', 4, 'Process \"tea\"', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [1],
  "pointers": {"i": 1},
  "hashmap": {"aet": "[eat, tea]"},
  "status": "Sort \"tea\" → \"aet\". map[\"aet\"] already exists, append \"tea\"."
}'::jsonb),

('group-anagrams', 5, 'Process \"tan\"', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [2],
  "pointers": {"i": 2},
  "hashmap": {"aet": "[eat, tea]", "ant": "[tan]"},
  "status": "Sort \"tan\" → \"ant\". New key, create entry [\"tan\"]."
}'::jsonb),

('group-anagrams', 6, 'Process \"ate\"', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [3],
  "pointers": {"i": 3},
  "hashmap": {"aet": "[eat, tea, ate]", "ant": "[tan]"},
  "status": "Sort \"ate\" → \"aet\". Append to existing group."
}'::jsonb),

('group-anagrams', 7, 'Process \"nat\"', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [4],
  "pointers": {"i": 4},
  "hashmap": {"aet": "[eat, tea, ate]", "ant": "[tan, nat]"},
  "status": "Sort \"nat\" → \"ant\". Append to ant group."
}'::jsonb),

('group-anagrams', 8, 'Process \"bat\"', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [5],
  "pointers": {"i": 5},
  "hashmap": {"aet": "[eat, tea, ate]", "ant": "[tan, nat]", "abt": "[bat]"},
  "status": "Sort \"bat\" → \"abt\". New group."
}'::jsonb),

('group-anagrams', 9, 'Result', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [0,1,2,3,4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"aet": "[eat, tea, ate]", "ant": "[tan, nat]", "abt": "[bat]"},
  "status": "Return map.values() → [[eat,tea,ate],[tan,nat],[bat]]. Time O(n · k log k) where k is max word length."
}'::jsonb);


-- ── TOP K FREQUENT ELEMENTS ────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'top-k-frequent';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('top-k-frequent', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,1,1,2,2,3],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given nums = [1,1,1,2,2,3], k = 2. Return the 2 most frequent elements."
}'::jsonb),

('top-k-frequent', 2, 'Approach: Bucket Sort', '{
  "type": "array",
  "array": [1,1,1,2,2,3],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Step 1: count frequencies. Step 2: put each number in a bucket indexed by its frequency. Step 3: read buckets from high to low until we have k numbers. O(n) time, better than a heap''s O(n log k)."
}'::jsonb),

('top-k-frequent', 3, 'Count: see 1', '{
  "type": "array",
  "array": [1,1,1,2,2,3],
  "highlights": [0,1,2],
  "pointers": {},
  "hashmap": {"1": "3"},
  "status": "After scanning indices 0,1,2, the number 1 appears 3 times."
}'::jsonb),

('top-k-frequent', 4, 'Count: see 2', '{
  "type": "array",
  "array": [1,1,1,2,2,3],
  "highlights": [3,4],
  "pointers": {},
  "hashmap": {"1": "3", "2": "2"},
  "status": "Indices 3,4: number 2 appears 2 times."
}'::jsonb),

('top-k-frequent', 5, 'Count: finish', '{
  "type": "array",
  "array": [1,1,1,2,2,3],
  "highlights": [5],
  "pointers": {},
  "hashmap": {"1": "3", "2": "2", "3": "1"},
  "status": "Index 5: number 3 appears once. Frequency map complete."
}'::jsonb),

('top-k-frequent', 6, 'Build Buckets', '{
  "type": "array",
  "array": ["[]","[3]","[2]","[1]","[]","[]","[]"],
  "labels": {"0":"freq 0","1":"freq 1","2":"freq 2","3":"freq 3","4":"freq 4","5":"freq 5","6":"freq 6"},
  "highlights": [],
  "pointers": {},
  "status": "Create buckets indexed 0..n. Put each number into the bucket equal to its frequency. bucket[3] = [1], bucket[2] = [2], bucket[1] = [3]."
}'::jsonb),

('top-k-frequent', 7, 'Collect Top K', '{
  "type": "array",
  "array": ["[]","[3]","[2]","[1]","[]","[]","[]"],
  "labels": {"0":"freq 0","1":"freq 1","2":"freq 2","3":"freq 3","4":"freq 4","5":"freq 5","6":"freq 6"},
  "highlights": [3,2],
  "highlightColor": "green",
  "pointers": {"scan": 3},
  "status": "Walk from the highest bucket downward. bucket[3] → take 1. bucket[2] → take 2. We now have k = 2 elements."
}'::jsonb),

('top-k-frequent', 8, 'Result', '{
  "type": "array",
  "array": [1,2],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return [1, 2]. They are the two most frequent elements. Time O(n), Space O(n)."
}'::jsonb);


-- ── PRODUCT OF ARRAY EXCEPT SELF ──────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'product-except-self';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('product-except-self', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,2,3,4],
  "highlights": [],
  "pointers": {},
  "status": "Given nums = [1,2,3,4]. Return answer[i] = product of every element except nums[i]. Must run in O(n) without division."
}'::jsonb),

('product-except-self', 2, 'Approach: Prefix × Suffix', '{
  "type": "array",
  "array": [1,2,3,4],
  "highlights": [],
  "pointers": {},
  "status": "For each i: answer[i] = (product of nums to the left of i) × (product of nums to the right). Do this in two passes using the output array itself for prefix."
}'::jsonb),

('product-except-self', 3, 'Prefix pass: i=0', '{
  "type": "array",
  "array": [1,1,1,1],
  "labels": {"0":"answer"},
  "highlights": [0],
  "pointers": {"i": 0},
  "status": "answer[0] = 1 (nothing to the left of index 0). prefix product so far = 1."
}'::jsonb),

('product-except-self', 4, 'Prefix pass: i=1', '{
  "type": "array",
  "array": [1,1,1,1],
  "labels": {"0":"answer"},
  "highlights": [1],
  "pointers": {"i": 1},
  "status": "answer[1] = prefix = 1 (just nums[0]). Then prefix *= nums[1] → prefix = 2."
}'::jsonb),

('product-except-self', 5, 'Prefix pass: i=2', '{
  "type": "array",
  "array": [1,1,2,1],
  "labels": {"0":"answer"},
  "highlights": [2],
  "pointers": {"i": 2},
  "status": "answer[2] = prefix = 2 (nums[0]*nums[1]). Then prefix *= nums[2] → prefix = 6."
}'::jsonb),

('product-except-self', 6, 'Prefix pass: i=3', '{
  "type": "array",
  "array": [1,1,2,6],
  "labels": {"0":"answer"},
  "highlights": [3],
  "pointers": {"i": 3},
  "status": "answer[3] = prefix = 6. answer now holds the prefix products."
}'::jsonb),

('product-except-self', 7, 'Suffix pass: i=3', '{
  "type": "array",
  "array": [1,1,2,6],
  "labels": {"0":"answer"},
  "highlights": [3],
  "pointers": {"i": 3},
  "status": "Walk from the right. suffix starts at 1. answer[3] *= 1 → 6. Then suffix *= nums[3] → suffix = 4."
}'::jsonb),

('product-except-self', 8, 'Suffix pass: i=2', '{
  "type": "array",
  "array": [1,1,8,6],
  "labels": {"0":"answer"},
  "highlights": [2],
  "pointers": {"i": 2},
  "status": "answer[2] *= suffix(4) → 2*4 = 8. Then suffix *= nums[2] → suffix = 12."
}'::jsonb),

('product-except-self', 9, 'Suffix pass: i=1', '{
  "type": "array",
  "array": [1,12,8,6],
  "labels": {"0":"answer"},
  "highlights": [1],
  "pointers": {"i": 1},
  "status": "answer[1] *= suffix(12) → 1*12 = 12. Then suffix *= nums[1] → suffix = 24."
}'::jsonb),

('product-except-self', 10, 'Suffix pass: i=0', '{
  "type": "array",
  "array": [24,12,8,6],
  "labels": {"0":"answer"},
  "highlights": [0],
  "pointers": {"i": 0},
  "status": "answer[0] *= suffix(24) → 24."
}'::jsonb),

('product-except-self', 11, 'Result', '{
  "type": "array",
  "array": [24,12,8,6],
  "labels": {"0":"answer"},
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return [24,12,8,6]. Time O(n), extra space O(1) beyond the output array."
}'::jsonb);


-- ── LONGEST CONSECUTIVE SEQUENCE ──────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-consecutive';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-consecutive', 1, 'Problem Setup', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [],
  "pointers": {},
  "hashset": [],
  "status": "Given nums = [100,4,200,1,3,2]. Find the length of the longest run of consecutive integers (order in the array doesn''t matter). Must be O(n)."
}'::jsonb),

('longest-consecutive', 2, 'Approach: Sequence Starts', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [],
  "pointers": {},
  "hashset": [],
  "status": "Put all numbers in a hash set for O(1) lookup. A number num starts a sequence only if num-1 is NOT in the set. From each start, walk up while num+1, num+2, ... are in the set."
}'::jsonb),

('longest-consecutive', 3, 'Build Hash Set', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [0,1,2,3,4,5],
  "pointers": {},
  "hashset": [100,4,200,1,3,2],
  "status": "Insert every num into the set."
}'::jsonb),

('longest-consecutive', 4, 'Check 100', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashset": [100,4,200,1,3,2],
  "status": "Is 99 in set? No → 100 is a sequence start. Walk: 101? not in set. Length = 1. best = 1."
}'::jsonb),

('longest-consecutive', 5, 'Check 4', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [1],
  "pointers": {"i": 1},
  "hashset": [100,4,200,1,3,2],
  "status": "Is 3 in set? YES → 4 is NOT a start, skip (we''ll reach this sequence from its real start)."
}'::jsonb),

('longest-consecutive', 6, 'Check 200', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [2],
  "pointers": {"i": 2},
  "hashset": [100,4,200,1,3,2],
  "status": "Is 199 in set? No → start. Walk: 201? no. Length = 1. best still 1."
}'::jsonb),

('longest-consecutive', 7, 'Check 1: extend', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [3,5,4,1],
  "highlightColor": "yellow",
  "pointers": {"i": 3},
  "hashset": [100,4,200,1,3,2],
  "status": "Is 0 in set? No → 1 is a start. Walk up: 2? yes. 3? yes. 4? yes. 5? no. Length = 4 (1→2→3→4)."
}'::jsonb),

('longest-consecutive', 8, 'Skip 3 and 2', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [4,5],
  "pointers": {},
  "hashset": [100,4,200,1,3,2],
  "status": "Remaining iterations: 3 has 2 in set → skip. 2 has 1 in set → skip. Every element is visited at most twice → O(n) total."
}'::jsonb),

('longest-consecutive', 9, 'Result', '{
  "type": "array",
  "array": [1,2,3,4],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {},
  "status": "Longest consecutive sequence is 1,2,3,4. Return 4. Time O(n), Space O(n)."
}'::jsonb);


-- ── ENCODE AND DECODE STRINGS ─────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'encode-decode-strings';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('encode-decode-strings', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["lint","code","love","you"],
  "highlights": [],
  "pointers": {},
  "status": "Design encode(List[str]) → str and decode(str) → List[str]. The tricky part: strings may contain ANY characters, including delimiters you''d naively use."
}'::jsonb),

('encode-decode-strings', 2, 'Approach: Length Prefix', '{
  "type": "array",
  "array": ["lint","code","love","you"],
  "highlights": [],
  "pointers": {},
  "status": "For each word w, append len(w) + ''#'' + w. The # is just a separator between the length digits and the word; the length tells the decoder exactly how many chars to read, so the word itself can contain # without ambiguity."
}'::jsonb),

('encode-decode-strings', 3, 'Encode: \"lint\"', '{
  "type": "array",
  "array": ["4","#","l","i","n","t"],
  "highlights": [0,1,2,3,4,5],
  "pointers": {},
  "status": "len(\"lint\") = 4. Emit \"4#lint\"."
}'::jsonb),

('encode-decode-strings', 4, 'Encode: all words', '{
  "type": "array",
  "array": ["4","#","l","i","n","t","4","#","c","o","d","e","4","#","l","o","v","e","3","#","y","o","u"],
  "highlights": [],
  "pointers": {},
  "status": "Concatenate all: \"4#lint4#code4#love3#you\". This string is the encoding."
}'::jsonb),

('encode-decode-strings', 5, 'Decode: read length', '{
  "type": "array",
  "array": ["4","#","l","i","n","t","4","#","c","o","d","e","4","#","l","o","v","e","3","#","y","o","u"],
  "highlights": [0,1],
  "pointers": {"i": 0},
  "status": "Scan forward from i=0 until ''#''. Digits collected: \"4\" → length = 4. Advance past ''#'' to i=2."
}'::jsonb),

('encode-decode-strings', 6, 'Decode: take 4 chars', '{
  "type": "array",
  "array": ["4","#","l","i","n","t","4","#","c","o","d","e","4","#","l","o","v","e","3","#","y","o","u"],
  "highlights": [2,3,4,5],
  "highlightColor": "green",
  "pointers": {"i": 2},
  "status": "Take 4 characters starting at i=2: \"lint\". Advance i past them to i=6."
}'::jsonb),

('encode-decode-strings', 7, 'Decode: next word', '{
  "type": "array",
  "array": ["4","#","l","i","n","t","4","#","c","o","d","e","4","#","l","o","v","e","3","#","y","o","u"],
  "highlights": [6,7,8,9,10,11],
  "highlightColor": "yellow",
  "pointers": {"i": 6},
  "status": "Read \"4\" at i=6, skip ''#'', take \"code\". Append to result."
}'::jsonb),

('encode-decode-strings', 8, 'Decode: continue', '{
  "type": "array",
  "array": ["4","#","l","i","n","t","4","#","c","o","d","e","4","#","l","o","v","e","3","#","y","o","u"],
  "highlights": [12,13,14,15,16,17,18,19,20,21,22],
  "highlightColor": "yellow",
  "pointers": {"i": 12},
  "status": "Same loop: \"4#love\" then \"3#you\". After the last word, i == len(s), stop."
}'::jsonb),

('encode-decode-strings', 9, 'Result', '{
  "type": "array",
  "array": ["lint","code","love","you"],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return [\"lint\",\"code\",\"love\",\"you\"]. Works for ANY characters in the input because we never rely on the word contents as delimiters."
}'::jsonb);


-- ── Sanity ────────────────────────────────────────────────────
SELECT problem_id, COUNT(*) AS step_count
FROM "PGcode_interactive_dry_runs"
WHERE problem_id IN ('valid-anagram','group-anagrams','top-k-frequent','product-except-self','longest-consecutive','encode-decode-strings')
GROUP BY problem_id
ORDER BY problem_id;
