-- Seed data for PGcode

-- 1. Insert Topics
INSERT INTO public."PGcode_topics" (id, name, topic_video_url, position_x, position_y)
VALUES
('arrays', 'Arrays & Hashing', '3OamzN90kPg', 250, 0),
('two-pointers', 'Two Pointers', 'jJXJ16kPFWg', 100, 100),
('stack', 'Stack', 'rW4vm0-DLYc', 400, 100)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Edges (We lookup the auto-generated UUIDs loosely, or just assume the frontend draws based on source/target)
INSERT INTO public."PGcode_roadmap_edges" (source, target)
VALUES
('arrays', 'two-pointers'),
('arrays', 'stack')
ON CONFLICT DO NOTHING;

-- 3. Insert Problems
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints)
VALUES
('contains-duplicate', 'arrays', 'Contains Duplicate', 'Easy', 
'<p>Given an integer array <code>nums</code>, return <code>true</code> if any value appears <strong>at least twice</strong> in the array, and return <code>false</code> if every element is distinct.</p>',
'3OamzN90kPg', 
ARRAY['Utilize a Hash Set to track seen numbers.', 'If a number is already in the set, return true.']
),
('valid-anagram', 'arrays', 'Valid Anagram', 'Easy',
'<p>Given two strings <code>s</code> and <code>t</code>, return <code>true</code> if <code>t</code> is an anagram of <code>s</code>, and <code>false</code> otherwise.</p>',
'9UtInBqnCgA',
ARRAY['Count the frequencies of each character in both strings.', 'If the counts match perfectly, it is an anagram.']
),
('valid-palindrome', 'two-pointers', 'Valid Palindrome', 'Easy',
'<p>A phrase is a <strong>palindrome</strong> if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.</p>',
'jJXJ16kPFWg',
ARRAY['Use two pointers: one starting from the left, one from the right.', 'Skip non-alphanumeric characters and compare lowercase versions.']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Problem Templates
INSERT INTO public."PGcode_problem_templates" (problem_id, language, code)
VALUES
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
('valid-anagram', 'python', 'class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        # Write your code here
        pass')
ON CONFLICT DO NOTHING;

-- 5. Insert Sample Interactive Dry Run for Contains Duplicate
-- Use a generic UUID generation here for Postgres by fetching the newly created problem, but for simplicity we can insert explicitly if we manage UUIDs, 
-- Since `id` is a UUID DEFAULT gen_random_uuid(), we will just insert data.
WITH problem AS (SELECT id FROM public."PGcode_problems" WHERE id = 'contains-duplicate')
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data)
VALUES 
('contains-duplicate', 1, 'Initial Array', '{"array": [1, 2, 3, 1], "hashset": [], "pointer": 0}'),
('contains-duplicate', 2, 'First Element', '{"array": [1, 2, 3, 1], "hashset": [1], "pointer": 1}'),
('contains-duplicate', 3, 'Second Element', '{"array": [1, 2, 3, 1], "hashset": [1, 2], "pointer": 2}'),
('contains-duplicate', 4, 'Condition Met', '{"array": [1, 2, 3, 1], "hashset": [1, 2, 3], "pointer": 3, "status": "duplicate found (1)"}');

-- 6. Insert Interactive Question for Step 2
DO $$
DECLARE
    dry_run_id_val UUID;
BEGIN
    SELECT id INTO dry_run_id_val FROM public."PGcode_interactive_dry_runs" WHERE problem_id = 'contains-duplicate' AND step_number = 2 LIMIT 1;
    
    IF dry_run_id_val IS NOT NULL THEN
        INSERT INTO public."PGcode_interactive_questions" (dry_run_step_id, question_text, options, correct_answer, hint, explanation)
        VALUES (
            dry_run_id_val, 
            'What happens when the pointer reaches the 1 again at the end of the array?', 
            '["It gets added to the hashset", "It triggers a true return because it is already in the hashset", "The loop crashes"]', 
            'It triggers a true return because it is already in the hashset',
            'Think about the purpose of a hashset.',
            'A hashset provides O(1) lookup. Since 1 is already inside, the duplicate is instantly caught!'
        );
    END IF;
END $$;
