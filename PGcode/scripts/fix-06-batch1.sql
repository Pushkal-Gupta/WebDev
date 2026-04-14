-- Fix Batch 1 issues: deque imports + wrong test expectations
BEGIN;

-- Fix 1: Add 'from collections import deque' to 4 Python solutions
UPDATE public."PGcode_solution_approaches"
   SET code_python = 'from collections import deque
' || code_python
 WHERE problem_id IN ('dota2-senate', 'sliding-window-maximum')
   AND code_python NOT LIKE '%from collections import deque%';

UPDATE public."PGcode_solution_approaches"
   SET code_python = 'from collections import deque

' || code_python
 WHERE problem_id IN ('moving-average', 'number-recent-calls')
   AND code_python NOT LIKE '%from collections import deque%';

-- Fix 2: design-circular-queue test #9 — Front should be 3, not 4
-- Trace: MyCircularQueue(2), enQ(1), enQ(2), isFull, deQ, enQ(3), deQ, enQ(4)
-- After: queue contains [3, 4], head points to 3. Front=3, Rear=4
UPDATE public."PGcode_problems"
   SET test_cases = jsonb_set(test_cases, '{8,expected}',
       '"[null,true,true,true,true,true,true,true,3,4]"'::jsonb)
 WHERE id = 'design-circular-queue';

-- Fix 3: valid-palindrome-ii test #12 — "abcbxa" IS a valid palindrome-ii
-- a=a match, b≠x mismatch, try skip: s[2:5]="cbx" no, s[1:4]="bcb" yes → true
UPDATE public."PGcode_problems"
   SET test_cases = jsonb_set(test_cases, '{11,expected}', '"true"'::jsonb)
 WHERE id = 'valid-palindrome-ii';

COMMIT;
