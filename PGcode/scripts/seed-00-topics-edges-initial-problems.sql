-- 1. Augment Schema to support tags/categories
ALTER TABLE public."PGcode_topics" ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public."PGcode_topics" ADD COLUMN IF NOT EXISTS group_name text;

-- Clear previous roadmap data to insert the fresh, massive tree
TRUNCATE TABLE public."PGcode_interactive_questions" RESTART IDENTITY CASCADE;
TRUNCATE TABLE public."PGcode_interactive_dry_runs" RESTART IDENTITY CASCADE;
TRUNCATE TABLE public."PGcode_problem_templates" RESTART IDENTITY CASCADE;
TRUNCATE TABLE public."PGcode_problems" RESTART IDENTITY CASCADE;
TRUNCATE TABLE public."PGcode_roadmap_edges" RESTART IDENTITY CASCADE;
TRUNCATE TABLE public."PGcode_topics" RESTART IDENTITY CASCADE;

-- 2. Insert Complete DSA Roadmap List
INSERT INTO public."PGcode_topics" (id, name, group_name, category, topic_video_url, position_x, position_y)
VALUES
-- Foundation
('arrays', 'Arrays & HashMaps\nTwo-sum, freq counts', 'Foundation', 'Structures', '3OamzN90kPg', 200, 0),
('strings', 'Strings\nManipulation, parsing', 'Foundation', 'Algorithms', '3OamzN90kPg', 600, 0),

-- Structures
('stack', 'Stack\nLIFO, monotonic', 'Structures', 'Structures', '3OamzN90kPg', 200, 150),
('queue', 'Queue\nFIFO, deque', 'Structures', 'Structures', '3OamzN90kPg', 600, 150),
('linkedlist', 'Linked List\nSingly, doubly, fast-slow', 'Structures', 'Structures', '3OamzN90kPg', 400, 250),

-- Algorithms
('recursion', 'Recursion\nBase cases, stack', 'Algorithms', 'Algorithms', '3OamzN90kPg', 0, 350),
('two-pointers', 'Two Pointers\nOpposite ends, same dir', 'Algorithms', 'Algorithms', '3OamzN90kPg', 200, 350),
('binary-search', 'Binary Search\nSorted arrays, bounds', 'Algorithms', 'Algorithms', '3OamzN90kPg', 400, 350),
('sliding-window', 'Sliding Window\nSubarray, substring', 'Algorithms', 'Algorithms', '3OamzN90kPg', 600, 350),

-- Advanced
('trees', 'Trees\nBST, DFS, BFS, traversal', 'Advanced', 'Structures', '3OamzN90kPg', 200, 550),
('graphs', 'Graphs\nDFS, BFS, union-find', 'Advanced', 'Structures', '3OamzN90kPg', 500, 550),
('heap', 'Heap\nPriority queue', 'Advanced', 'Optimization', '3OamzN90kPg', 800, 550),

-- Optimization
('tries', 'Tries\nPrefix tree', 'Optimization', 'Structures', '3OamzN90kPg', 200, 700),
('dp', 'DP ★\nMemoization, tabulation', 'Optimization', 'Optimization', '3OamzN90kPg', 450, 750),
('backtracking', 'Backtracking ★\nPermutations, subsets', 'Optimization', 'Optimization', '3OamzN90kPg', 800, 750),
('greedy', 'Greedy\nLocal optimal choice', 'Optimization', 'Optimization', '3OamzN90kPg', 600, 850),
('intervals', 'Intervals\nMerge, sweep line', 'Optimization', 'Optimization', '3OamzN90kPg', 900, 850),

-- Expert
('2d-dp', '2D DP\nGrid, sequence DP', 'Expert', 'Optimization', '3OamzN90kPg', 400, 1000),
('advanced-graphs', 'Advanced Graphs\nDijkstra, topo sort', 'Expert', 'Structures', '3OamzN90kPg', 700, 1000),

-- Synthesis
('first-order', 'First-order thinking\nPattern recognition', 'Synthesis', 'Synthesis', '3OamzN90kPg', 500, 1150),
('math', 'Math\nPrimes, GCD, modulo', 'Synthesis', 'Math', '3OamzN90kPg', 300, 1250),
('bit-manipulation', 'Bit Manipulation\nAND, OR, XOR tricks', 'Synthesis', 'Math', '3OamzN90kPg', 550, 1250),
('geometry', 'Geometry\nCoordinate systems', 'Synthesis', 'Math', '3OamzN90kPg', 800, 1250)
ON CONFLICT (id) DO NOTHING;

-- 3. Map all roadmap edges
INSERT INTO public."PGcode_roadmap_edges" (source, target)
VALUES
-- Structure Forks
('arrays', 'stack'),
('strings', 'queue'),
('stack', 'linkedlist'),
('queue', 'linkedlist'),
('queue', 'two-pointers'),

-- Algorithm forks
('two-pointers', 'binary-search'),
('two-pointers', 'sliding-window'),

-- Advanced Integrations
('linkedlist', 'trees'),
('binary-search', 'trees'),
('binary-search', 'graphs'),
('sliding-window', 'graphs'),
('sliding-window', 'heap'),

-- Optimization Branches
('trees', 'tries'),
('graphs', 'dp'),
('graphs', 'backtracking'),
('heap', 'backtracking'),
('heap', 'intervals'),
('heap', 'greedy'),
('backtracking', 'intervals'),

-- Expert Level
('dp', '2d-dp'),
('greedy', '2d-dp'),
('backtracking', 'advanced-graphs'),
('intervals', 'advanced-graphs'),

-- Synthesis Convergence
('2d-dp', 'first-order'),
('advanced-graphs', 'first-order'),
('first-order', 'math'),
('first-order', 'bit-manipulation'),
('first-order', 'geometry')
ON CONFLICT DO NOTHING;

-- 4. Map Problems to Topics
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints)
VALUES
-- Arrays
('two-sum', 'arrays', 'Two Sum', 'Easy', '<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>', 'KLlXCFG5TnA', ARRAY['Use a hash map to store elements you have seen and their indices.']),
('contains-duplicate', 'arrays', 'Contains Duplicate', 'Easy', '<p>Given an integer array <code>nums</code>, return <code>true</code> if any value appears <strong>at least twice</strong> in the array, and return <code>false</code> if every element is distinct.</p>', '3OamzN90kPg', ARRAY['Utilize a Hash Set to track seen numbers.', 'If a number is already in the set, return true.']),
('valid-anagram', 'arrays', 'Valid Anagram', 'Easy', '<p>Given two strings <code>s</code> and <code>t</code>, return <code>true</code> if <code>t</code> is an anagram of <code>s</code>, and <code>false</code> otherwise.</p>', '9UtInBqnCgA', ARRAY['Count the frequencies of each character in both strings.', 'If the counts match perfectly, it is an anagram.']),

-- Two Pointers
('valid-palindrome', 'two-pointers', 'Valid Palindrome', 'Easy', '<p>A phrase is a <strong>palindrome</strong> if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.</p>', 'jJXJ16kPFWg', ARRAY['Use two pointers: one starting from the left, one from the right.', 'Skip non-alphanumeric characters and compare lowercase versions.']),

-- Stack
('valid-parentheses', 'stack', 'Valid Parentheses', 'Easy', '<p>Given a string <code>s</code> containing just the characters <code>''(, )'', ''{, }'', ''[, ]''</code>, determine if the input string is valid.</p>', 'WTzjTpzBMut', ARRAY['Use a stack. Push open brackets, and when you see a close bracket, pop the stack and make sure it matches.']),

-- Sliding Window
('best-time-to-buy-sell-stock', 'sliding-window', 'Best Time to Buy and Sell Stock', 'Easy', '<p>You are given an array <code>prices</code> where <code>prices[i]</code> is the price of a given stock on the <code>i</code>th day.</p><p>You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.</p>', '1pkOgXD63yU', ARRAY['Track the minimum price seen so far.', 'The max profit is the maximum of current price minus minimum price.'])
ON CONFLICT DO NOTHING;

-- 5. Code Templates
INSERT INTO public."PGcode_problem_templates" (problem_id, language, code)
VALUES
('two-sum', 'python', 'class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Write your code here
        pass'),
('two-sum', 'javascript', '/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Write your code here
};'),
('two-sum', 'java', 'class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
    }
}'),
('contains-duplicate', 'python', 'class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        # Write your code here
        pass'),
('contains-duplicate', 'javascript', '/**
 * @param {number[]} nums
 * @return {boolean}
 */
var containsDuplicate = function(nums) {
    // Write your code here
};'),
('valid-parentheses', 'python', 'class Solution:
    def isValid(self, s: str) -> bool:
        # Write your code here
        pass')
ON CONFLICT DO NOTHING;

-- 6. Interactive Visual Dry-Run Scenarios (For Contains Duplicate)
WITH problem AS (SELECT id FROM public."PGcode_problems" WHERE id = 'contains-duplicate')
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data)
VALUES 
('contains-duplicate', 1, 'Initial Array', '{"array": [1, 2, 3, 1], "hashset": [], "pointer": 0}'),
('contains-duplicate', 2, 'First Element', '{"array": [1, 2, 3, 1], "hashset": [1], "pointer": 1}'),
('contains-duplicate', 3, 'Second Element', '{"array": [1, 2, 3, 1], "hashset": [1, 2], "pointer": 2}'),
('contains-duplicate', 4, 'Condition Met!', '{"array": [1, 2, 3, 1], "hashset": [1, 2, 3], "pointer": 3, "status": "Duplicate Found! 1 already in hashset"}');

-- 7. Interactive Quiz
DO $$
DECLARE
    dry_run_id_val UUID;
BEGIN
    SELECT id INTO dry_run_id_val FROM public."PGcode_interactive_dry_runs" WHERE problem_id = 'contains-duplicate' AND step_number = 2 LIMIT 1;
    
    IF dry_run_id_val IS NOT NULL THEN
        INSERT INTO public."PGcode_interactive_questions" (dry_run_step_id, question_text, options, correct_answer, hint, explanation)
        VALUES (
            dry_run_id_val, 
            'What happens when the pointer reaches the final 1 at the end of the array?', 
            '["It gets added to the hashset", "It triggers a true return because 1 is already in the hashset", "The loop crashes"]', 
            'It triggers a true return because 1 is already in the hashset',
            'Think about the purpose of a hashset.',
            'A hashset provides O(1) lookup. Since 1 is already inside, the duplicate is instantly caught!'
        );
    END IF;
END $$;
