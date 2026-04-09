-- Add LeetCode-style metadata + test cases to PGcode_problems
ALTER TABLE "PGcode_problems"
  ADD COLUMN IF NOT EXISTS method_name TEXT,
  ADD COLUMN IF NOT EXISTS params JSONB,
  ADD COLUMN IF NOT EXISTS return_type TEXT,
  ADD COLUMN IF NOT EXISTS test_cases JSONB;

-- ════════════════════════════════════════
-- Two Sum
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'twoSum',
  params = '[{"name":"nums","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb,
  return_type = 'List[int]',
  test_cases = '[
    {"inputs":["[2,7,11,15]","9"],"expected":"[0,1]"},
    {"inputs":["[3,2,4]","6"],"expected":"[1,2]"},
    {"inputs":["[3,3]","6"],"expected":"[0,1]"}
  ]'::jsonb
WHERE id = 'two-sum';

-- ════════════════════════════════════════
-- Contains Duplicate
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'containsDuplicate',
  params = '[{"name":"nums","type":"List[int]"}]'::jsonb,
  return_type = 'bool',
  test_cases = '[
    {"inputs":["[1,2,3,1]"],"expected":"true"},
    {"inputs":["[1,2,3,4]"],"expected":"false"},
    {"inputs":["[1,1,1,3,3,4,3,2,4,2]"],"expected":"true"}
  ]'::jsonb
WHERE id = 'contains-duplicate';

-- ════════════════════════════════════════
-- Valid Anagram
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'isAnagram',
  params = '[{"name":"s","type":"str"},{"name":"t","type":"str"}]'::jsonb,
  return_type = 'bool',
  test_cases = '[
    {"inputs":["\"anagram\"","\"nagaram\""],"expected":"true"},
    {"inputs":["\"rat\"","\"car\""],"expected":"false"}
  ]'::jsonb
WHERE id = 'valid-anagram';

-- ════════════════════════════════════════
-- Valid Palindrome
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'isPalindrome',
  params = '[{"name":"s","type":"str"}]'::jsonb,
  return_type = 'bool',
  test_cases = '[
    {"inputs":["\"A man, a plan, a canal: Panama\""],"expected":"true"},
    {"inputs":["\"race a car\""],"expected":"false"},
    {"inputs":["\" \""],"expected":"true"}
  ]'::jsonb
WHERE id = 'valid-palindrome';

-- ════════════════════════════════════════
-- Best Time to Buy and Sell Stock
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'maxProfit',
  params = '[{"name":"prices","type":"List[int]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[7,1,5,3,6,4]"],"expected":"5"},
    {"inputs":["[7,6,4,3,1]"],"expected":"0"}
  ]'::jsonb
WHERE id = 'best-time-to-buy-sell-stock';

-- ════════════════════════════════════════
-- Valid Parentheses
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'isValid',
  params = '[{"name":"s","type":"str"}]'::jsonb,
  return_type = 'bool',
  test_cases = '[
    {"inputs":["\"()\""],"expected":"true"},
    {"inputs":["\"()[]{}\""],"expected":"true"},
    {"inputs":["\"(]\""],"expected":"false"}
  ]'::jsonb
WHERE id = 'valid-parentheses';

-- ════════════════════════════════════════
-- Maximum Subarray
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'maxSubArray',
  params = '[{"name":"nums","type":"List[int]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[-2,1,-3,4,-1,2,1,-5,4]"],"expected":"6"},
    {"inputs":["[1]"],"expected":"1"},
    {"inputs":["[5,4,-1,7,8]"],"expected":"23"}
  ]'::jsonb
WHERE id = 'max-subarray';
