-- Enhanced Visual Dry Run Seed Data
-- Covers multiple data structure types: array, graph, tree, linked-list, stack, hashmap

-- =========================================
-- TWO SUM (Array + HashMap)
-- =========================================
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data)
VALUES
('two-sum', 1, 'Initialize', '{"type": "array", "array": [2, 7, 11, 15], "highlights": [], "pointers": {}, "hashmap": {}, "status": "Target = 9. We need two numbers that add up to 9. Initialize an empty hashmap."}'),
('two-sum', 2, 'Check index 0', '{"type": "array", "array": [2, 7, 11, 15], "highlights": [0], "pointers": {"i": 0}, "hashmap": {}, "status": "complement = 9 - 2 = 7. Is 7 in our map? No. Store {2: 0}."}'),
('two-sum', 3, 'Store and move', '{"type": "array", "array": [2, 7, 11, 15], "highlights": [1], "pointers": {"i": 1}, "hashmap": {"2": "0"}, "status": "complement = 9 - 7 = 2. Is 2 in our map? YES! Return [0, 1]."}'),
('two-sum', 4, 'Found!', '{"type": "array", "array": [2, 7, 11, 15], "highlights": [0, 1], "highlightColor": "green", "pointers": {"i": 1}, "hashmap": {"2": "0"}, "status": "Answer: [0, 1]. nums[0] + nums[1] = 2 + 7 = 9 = target."}')
ON CONFLICT DO NOTHING;

-- =========================================
-- CONTAINS DUPLICATE (Enhanced - Array + HashSet)
-- =========================================
-- First remove old data
DELETE FROM public."PGcode_interactive_dry_runs" WHERE problem_id = 'contains-duplicate';

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data)
VALUES
('contains-duplicate', 1, 'Initialize', '{"type": "array", "array": [1, 2, 3, 1], "highlights": [], "pointers": {}, "hashset": [], "status": "Check if any value appears at least twice. Use a HashSet for O(1) lookup."}'),
('contains-duplicate', 2, 'Check nums[0] = 1', '{"type": "array", "array": [1, 2, 3, 1], "highlights": [0], "pointers": {"i": 0}, "hashset": [], "status": "Is 1 in the set? No. Add 1 to the set."}'),
('contains-duplicate', 3, 'Check nums[1] = 2', '{"type": "array", "array": [1, 2, 3, 1], "highlights": [1], "pointers": {"i": 1}, "hashset": [1], "status": "Is 2 in the set? No. Add 2 to the set."}'),
('contains-duplicate', 4, 'Check nums[2] = 3', '{"type": "array", "array": [1, 2, 3, 1], "highlights": [2], "pointers": {"i": 2}, "hashset": [1, 2], "status": "Is 3 in the set? No. Add 3 to the set."}'),
('contains-duplicate', 5, 'Check nums[3] = 1', '{"type": "array", "array": [1, 2, 3, 1], "highlights": [0, 3], "highlightColor": "red", "pointers": {"i": 3}, "hashset": [1, 2, 3], "status": "Is 1 in the set? YES! Duplicate found. Return true."}')
ON CONFLICT DO NOTHING;

-- =========================================
-- VALID PARENTHESES (Array + Stack)
-- =========================================
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data)
VALUES
('valid-parentheses', 1, 'Initialize', '{"type": "stack", "items": [], "operation": "Input: ({[]})", "status": "Use a stack. Push open brackets, pop and match on close brackets."}'),
('valid-parentheses', 2, 'Read ''(''', '{"type": "stack", "items": ["("], "operation": "push ''(''", "status": "Open bracket ''('' found. Push onto stack."}'),
('valid-parentheses', 3, 'Read ''{''', '{"type": "stack", "items": ["(", "{"], "operation": "push ''{''", "status": "Open bracket ''{'' found. Push onto stack."}'),
('valid-parentheses', 4, 'Read ''[''', '{"type": "stack", "items": ["(", "{", "["], "operation": "push ''[''", "status": "Open bracket ''['' found. Push onto stack."}'),
('valid-parentheses', 5, 'Read '']''', '{"type": "stack", "items": ["(", "{"], "operation": "pop → ''['' matches '']''", "status": "Close bracket '']'' found. Pop ''['' from stack. It matches! Continue."}'),
('valid-parentheses', 6, 'Read ''}''', '{"type": "stack", "items": ["("], "operation": "pop → ''{'' matches ''}''", "status": "Close bracket ''}'' found. Pop ''{'' from stack. It matches! Continue."}'),
('valid-parentheses', 7, 'Read '')''', '{"type": "stack", "items": [], "operation": "pop → ''('' matches '')''", "status": "Close bracket '')'' found. Pop ''('' from stack. It matches! Stack is now empty."}'),
('valid-parentheses', 8, 'Valid!', '{"type": "stack", "items": [], "operation": "Stack empty → valid", "status": "All brackets matched. Stack is empty. Return true."}')
ON CONFLICT DO NOTHING;

-- =========================================
-- VALID PALINDROME (Array + Two Pointers)
-- =========================================
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data)
VALUES
('valid-palindrome', 1, 'Initialize', '{"type": "array", "array": ["r","a","c","e","c","a","r"], "highlights": [], "pointers": {"L": 0, "R": 6}, "status": "Two pointers: L starts at 0, R starts at end. Compare characters moving inward."}'),
('valid-palindrome', 2, 'Compare r == r', '{"type": "array", "array": ["r","a","c","e","c","a","r"], "highlights": [0, 6], "highlightColor": "green", "pointers": {"L": 0, "R": 6}, "status": "arr[L]=''r'' == arr[R]=''r''. Match! Move both pointers inward."}'),
('valid-palindrome', 3, 'Compare a == a', '{"type": "array", "array": ["r","a","c","e","c","a","r"], "highlights": [1, 5], "highlightColor": "green", "pointers": {"L": 1, "R": 5}, "status": "arr[L]=''a'' == arr[R]=''a''. Match! Move both pointers inward."}'),
('valid-palindrome', 4, 'Compare c == c', '{"type": "array", "array": ["r","a","c","e","c","a","r"], "highlights": [2, 4], "highlightColor": "green", "pointers": {"L": 2, "R": 4}, "status": "arr[L]=''c'' == arr[R]=''c''. Match! Move both pointers inward."}'),
('valid-palindrome', 5, 'Pointers meet', '{"type": "array", "array": ["r","a","c","e","c","a","r"], "highlights": [3], "highlightColor": "green", "pointers": {"L": 3, "R": 3}, "status": "L >= R. Pointers have met. All characters matched. It IS a palindrome! Return true."}')
ON CONFLICT DO NOTHING;

-- =========================================
-- BEST TIME TO BUY AND SELL STOCK (Sliding Window)
-- =========================================
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data)
VALUES
('best-time-to-buy-sell-stock', 1, 'Initialize', '{"type": "array", "array": [7, 1, 5, 3, 6, 4], "highlights": [], "pointers": {"buy": 0, "sell": 1}, "status": "Track minimum price (buy) and maximum profit. minPrice=7, maxProfit=0."}'),
('best-time-to-buy-sell-stock', 2, 'Day 1: price=1', '{"type": "array", "array": [7, 1, 5, 3, 6, 4], "highlights": [1], "pointers": {"buy": 1, "sell": 1}, "status": "price[1]=1 < minPrice=7. Update minPrice=1. maxProfit=0."}'),
('best-time-to-buy-sell-stock', 3, 'Day 2: price=5', '{"type": "array", "array": [7, 1, 5, 3, 6, 4], "highlights": [1, 2], "highlightColor": "green", "pointers": {"buy": 1, "sell": 2}, "status": "profit = 5 - 1 = 4 > maxProfit=0. Update maxProfit=4."}'),
('best-time-to-buy-sell-stock', 4, 'Day 3: price=3', '{"type": "array", "array": [7, 1, 5, 3, 6, 4], "highlights": [1, 3], "pointers": {"buy": 1, "sell": 3}, "status": "profit = 3 - 1 = 2. Not better than maxProfit=4. No update."}'),
('best-time-to-buy-sell-stock', 5, 'Day 4: price=6', '{"type": "array", "array": [7, 1, 5, 3, 6, 4], "highlights": [1, 4], "highlightColor": "green", "pointers": {"buy": 1, "sell": 4}, "status": "profit = 6 - 1 = 5 > maxProfit=4. Update maxProfit=5!"}'),
('best-time-to-buy-sell-stock', 6, 'Day 5: price=4', '{"type": "array", "array": [7, 1, 5, 3, 6, 4], "highlights": [1, 5], "pointers": {"buy": 1, "sell": 5}, "status": "profit = 4 - 1 = 3. Not better. Final answer: maxProfit = 5 (buy at 1, sell at 6)."}')
ON CONFLICT DO NOTHING;
