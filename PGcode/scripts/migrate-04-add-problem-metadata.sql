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

-- ════════════════════════════════════════
-- GROUP ANAGRAMS
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'groupAnagrams',
  params = '[{"name":"strs","type":"List[str]"}]'::jsonb,
  return_type = 'List[List[str]]',
  test_cases = '[
    {"inputs":["[\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]"],"expected":"[[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]"},
    {"inputs":["[\"\"]"],"expected":"[[\"\"]]"},
    {"inputs":["[\"a\"]"],"expected":"[[\"a\"]]"}
  ]'::jsonb
WHERE id = 'group-anagrams';

-- ════════════════════════════════════════
-- TOP K FREQUENT ELEMENTS
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'topKFrequent',
  params = '[{"name":"nums","type":"List[int]"},{"name":"k","type":"int"}]'::jsonb,
  return_type = 'List[int]',
  test_cases = '[
    {"inputs":["[1,1,1,2,2,3]","2"],"expected":"[1,2]"},
    {"inputs":["[1]","1"],"expected":"[1]"}
  ]'::jsonb
WHERE id = 'top-k-frequent';

-- ════════════════════════════════════════
-- PRODUCT OF ARRAY EXCEPT SELF
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'productExceptSelf',
  params = '[{"name":"nums","type":"List[int]"}]'::jsonb,
  return_type = 'List[int]',
  test_cases = '[
    {"inputs":["[1,2,3,4]"],"expected":"[24,12,8,6]"},
    {"inputs":["[-1,1,0,-3,3]"],"expected":"[0,0,9,0,0]"}
  ]'::jsonb
WHERE id = 'product-except-self';

-- ════════════════════════════════════════
-- LONGEST CONSECUTIVE SEQUENCE
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'longestConsecutive',
  params = '[{"name":"nums","type":"List[int]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[100,4,200,1,3,2]"],"expected":"4"},
    {"inputs":["[0,3,7,2,5,8,4,6,0,1]"],"expected":"9"}
  ]'::jsonb
WHERE id = 'longest-consecutive';

-- ════════════════════════════════════════
-- THREE SUM
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'threeSum',
  params = '[{"name":"nums","type":"List[int]"}]'::jsonb,
  return_type = 'List[List[int]]',
  test_cases = '[
    {"inputs":["[-1,0,1,2,-1,-4]"],"expected":"[[-1,-1,2],[-1,0,1]]"},
    {"inputs":["[0,1,1]"],"expected":"[]"},
    {"inputs":["[0,0,0]"],"expected":"[[0,0,0]]"}
  ]'::jsonb
WHERE id = 'three-sum';

-- ════════════════════════════════════════
-- CONTAINER WITH MOST WATER
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'maxArea',
  params = '[{"name":"height","type":"List[int]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[1,8,6,2,5,4,8,3,7]"],"expected":"49"},
    {"inputs":["[1,1]"],"expected":"1"}
  ]'::jsonb
WHERE id = 'container-most-water';

-- ════════════════════════════════════════
-- TRAPPING RAIN WATER
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'trap',
  params = '[{"name":"height","type":"List[int]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[0,1,0,2,1,0,1,3,2,1,2,1]"],"expected":"6"},
    {"inputs":["[4,2,0,3,2,5]"],"expected":"9"}
  ]'::jsonb
WHERE id = 'trapping-rain-water';

-- ════════════════════════════════════════
-- TWO SUM II
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'twoSum',
  params = '[{"name":"numbers","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb,
  return_type = 'List[int]',
  test_cases = '[
    {"inputs":["[2,7,11,15]","9"],"expected":"[1,2]"},
    {"inputs":["[2,3,4]","6"],"expected":"[1,3]"},
    {"inputs":["[-1,0]","-1"],"expected":"[1,2]"}
  ]'::jsonb
WHERE id = 'two-sum-ii';

-- ════════════════════════════════════════
-- EVALUATE REVERSE POLISH NOTATION
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'evalRPN',
  params = '[{"name":"tokens","type":"List[str]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[\"2\",\"1\",\"+\",\"3\",\"*\"]"],"expected":"9"},
    {"inputs":["[\"4\",\"13\",\"5\",\"/\",\"+\"]"],"expected":"6"},
    {"inputs":["[\"10\",\"6\",\"9\",\"3\",\"+\",\"-11\",\"*\",\"/\",\"*\",\"17\",\"+\",\"5\",\"+\"]"],"expected":"22"}
  ]'::jsonb
WHERE id = 'eval-rpn';

-- ════════════════════════════════════════
-- DAILY TEMPERATURES
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'dailyTemperatures',
  params = '[{"name":"temperatures","type":"List[int]"}]'::jsonb,
  return_type = 'List[int]',
  test_cases = '[
    {"inputs":["[73,74,75,71,69,72,76,73]"],"expected":"[1,1,4,2,1,1,0,0]"},
    {"inputs":["[30,40,50,60]"],"expected":"[1,1,1,0]"},
    {"inputs":["[30,60,90]"],"expected":"[1,1,0]"}
  ]'::jsonb
WHERE id = 'daily-temperatures';

-- ════════════════════════════════════════
-- LARGEST RECTANGLE IN HISTOGRAM
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'largestRectangleArea',
  params = '[{"name":"heights","type":"List[int]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[2,1,5,6,2,3]"],"expected":"10"},
    {"inputs":["[2,4]"],"expected":"4"}
  ]'::jsonb
WHERE id = 'largest-rect-histogram';

-- ════════════════════════════════════════
-- CAR FLEET
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'carFleet',
  params = '[{"name":"target","type":"int"},{"name":"position","type":"List[int]"},{"name":"speed","type":"List[int]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["12","[10,8,0,5,3]","[2,4,1,1,3]"],"expected":"3"},
    {"inputs":["10","[3]","[3]"],"expected":"1"},
    {"inputs":["100","[0,2,4]","[4,2,1]"],"expected":"1"}
  ]'::jsonb
WHERE id = 'car-fleet';

-- ════════════════════════════════════════
-- SEARCH IN ROTATED SORTED ARRAY
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'search',
  params = '[{"name":"nums","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[4,5,6,7,0,1,2]","0"],"expected":"4"},
    {"inputs":["[4,5,6,7,0,1,2]","3"],"expected":"-1"},
    {"inputs":["[1]","0"],"expected":"-1"}
  ]'::jsonb
WHERE id = 'search-rotated';

-- ════════════════════════════════════════
-- FIND MINIMUM IN ROTATED SORTED ARRAY
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'findMin',
  params = '[{"name":"nums","type":"List[int]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[3,4,5,1,2]"],"expected":"1"},
    {"inputs":["[4,5,6,7,0,1,2]"],"expected":"0"},
    {"inputs":["[11,13,15,17]"],"expected":"11"}
  ]'::jsonb
WHERE id = 'find-min-rotated';

-- ════════════════════════════════════════
-- KOKO EATING BANANAS
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'minEatingSpeed',
  params = '[{"name":"piles","type":"List[int]"},{"name":"h","type":"int"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[3,6,7,11]","8"],"expected":"4"},
    {"inputs":["[30,11,23,4,20]","5"],"expected":"30"},
    {"inputs":["[30,11,23,4,20]","6"],"expected":"23"}
  ]'::jsonb
WHERE id = 'koko-bananas';

-- ════════════════════════════════════════
-- SEARCH A 2D MATRIX
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'searchMatrix',
  params = '[{"name":"matrix","type":"List[List[int]]"},{"name":"target","type":"int"}]'::jsonb,
  return_type = 'bool',
  test_cases = '[
    {"inputs":["[[1,3,5,7],[10,11,16,20],[23,30,34,60]]","3"],"expected":"true"},
    {"inputs":["[[1,3,5,7],[10,11,16,20],[23,30,34,60]]","13"],"expected":"false"}
  ]'::jsonb
WHERE id = 'search-2d-matrix';

-- ════════════════════════════════════════
-- LONGEST SUBSTRING WITHOUT REPEATING CHARACTERS
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'lengthOfLongestSubstring',
  params = '[{"name":"s","type":"str"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["\"abcabcbb\""],"expected":"3"},
    {"inputs":["\"bbbbb\""],"expected":"1"},
    {"inputs":["\"pwwkew\""],"expected":"3"}
  ]'::jsonb
WHERE id = 'longest-substr-no-repeat';

-- ════════════════════════════════════════
-- LONGEST REPEATING CHARACTER REPLACEMENT
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'characterReplacement',
  params = '[{"name":"s","type":"str"},{"name":"k","type":"int"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["\"ABAB\"","2"],"expected":"4"},
    {"inputs":["\"AABABBA\"","1"],"expected":"4"}
  ]'::jsonb
WHERE id = 'longest-repeating-char';

-- ════════════════════════════════════════
-- MINIMUM WINDOW SUBSTRING
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'minWindow',
  params = '[{"name":"s","type":"str"},{"name":"t","type":"str"}]'::jsonb,
  return_type = 'str',
  test_cases = '[
    {"inputs":["\"ADOBECODEBANC\"","\"ABC\""],"expected":"\"BANC\""},
    {"inputs":["\"a\"","\"a\""],"expected":"\"a\""},
    {"inputs":["\"a\"","\"aa\""],"expected":"\"\""}
  ]'::jsonb
WHERE id = 'min-window-substring';

-- ════════════════════════════════════════
-- PERMUTATION IN STRING
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'checkInclusion',
  params = '[{"name":"s1","type":"str"},{"name":"s2","type":"str"}]'::jsonb,
  return_type = 'bool',
  test_cases = '[
    {"inputs":["\"ab\"","\"eidbaooo\""],"expected":"true"},
    {"inputs":["\"ab\"","\"eidboaoo\""],"expected":"false"}
  ]'::jsonb
WHERE id = 'permutation-in-string';

-- ════════════════════════════════════════
-- LAST STONE WEIGHT
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'lastStoneWeight',
  params = '[{"name":"stones","type":"List[int]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[2,7,4,1,8,1]"],"expected":"1"},
    {"inputs":["[1]"],"expected":"1"}
  ]'::jsonb
WHERE id = 'last-stone-weight';

-- ════════════════════════════════════════
-- K CLOSEST POINTS TO ORIGIN
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'kClosest',
  params = '[{"name":"points","type":"List[List[int]]"},{"name":"k","type":"int"}]'::jsonb,
  return_type = 'List[List[int]]',
  test_cases = '[
    {"inputs":["[[1,3],[-2,2]]","1"],"expected":"[[-2,2]]"},
    {"inputs":["[[3,3],[5,-1],[-2,4]]","2"],"expected":"[[3,3],[-2,4]]"}
  ]'::jsonb
WHERE id = 'k-closest-points';

-- ════════════════════════════════════════
-- TASK SCHEDULER
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'leastInterval',
  params = '[{"name":"tasks","type":"List[str]"},{"name":"n","type":"int"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[\"A\",\"A\",\"A\",\"B\",\"B\",\"B\"]","2"],"expected":"8"},
    {"inputs":["[\"A\",\"C\",\"A\",\"B\",\"D\",\"B\"]","1"],"expected":"6"},
    {"inputs":["[\"A\",\"A\",\"A\",\"B\",\"B\",\"B\"]","0"],"expected":"6"}
  ]'::jsonb
WHERE id = 'task-scheduler';

-- ════════════════════════════════════════
-- CLIMBING STAIRS
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'climbStairs',
  params = '[{"name":"n","type":"int"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["2"],"expected":"2"},
    {"inputs":["3"],"expected":"3"},
    {"inputs":["5"],"expected":"8"}
  ]'::jsonb
WHERE id = 'climbing-stairs';

-- ════════════════════════════════════════
-- HOUSE ROBBER
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'rob',
  params = '[{"name":"nums","type":"List[int]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[1,2,3,1]"],"expected":"4"},
    {"inputs":["[2,7,9,3,1]"],"expected":"12"}
  ]'::jsonb
WHERE id = 'house-robber';

-- ════════════════════════════════════════
-- COIN CHANGE
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'coinChange',
  params = '[{"name":"coins","type":"List[int]"},{"name":"amount","type":"int"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[1,5,10]","11"],"expected":"2"},
    {"inputs":["[2]","3"],"expected":"-1"},
    {"inputs":["[1]","0"],"expected":"0"}
  ]'::jsonb
WHERE id = 'coin-change';

-- ════════════════════════════════════════
-- LONGEST INCREASING SUBSEQUENCE
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'lengthOfLIS',
  params = '[{"name":"nums","type":"List[int]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[10,9,2,5,3,7,101,18]"],"expected":"4"},
    {"inputs":["[0,1,0,3,2,3]"],"expected":"4"},
    {"inputs":["[7,7,7,7,7,7,7]"],"expected":"1"}
  ]'::jsonb
WHERE id = 'longest-increasing-subseq';

-- ════════════════════════════════════════
-- WORD BREAK
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'wordBreak',
  params = '[{"name":"s","type":"str"},{"name":"wordDict","type":"List[str]"}]'::jsonb,
  return_type = 'bool',
  test_cases = '[
    {"inputs":["\"leetcode\"","[\"leet\",\"code\"]"],"expected":"true"},
    {"inputs":["\"applepenapple\"","[\"apple\",\"pen\"]"],"expected":"true"},
    {"inputs":["\"catsandog\"","[\"cats\",\"dog\",\"sand\",\"and\",\"cat\"]"],"expected":"false"}
  ]'::jsonb
WHERE id = 'word-break';

-- ════════════════════════════════════════
-- UNIQUE PATHS
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'uniquePaths',
  params = '[{"name":"m","type":"int"},{"name":"n","type":"int"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["3","7"],"expected":"28"},
    {"inputs":["3","2"],"expected":"3"}
  ]'::jsonb
WHERE id = 'unique-paths';

-- ════════════════════════════════════════
-- SUBSETS
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'subsets',
  params = '[{"name":"nums","type":"List[int]"}]'::jsonb,
  return_type = 'List[List[int]]',
  test_cases = '[
    {"inputs":["[1,2,3]"],"expected":"[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]"},
    {"inputs":["[0]"],"expected":"[[],[0]]"}
  ]'::jsonb
WHERE id = 'subsets';

-- ════════════════════════════════════════
-- COMBINATION SUM
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'combinationSum',
  params = '[{"name":"candidates","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb,
  return_type = 'List[List[int]]',
  test_cases = '[
    {"inputs":["[2,3,6,7]","7"],"expected":"[[2,2,3],[7]]"},
    {"inputs":["[2,3,5]","8"],"expected":"[[2,2,2,2],[2,3,3],[3,5]]"},
    {"inputs":["[2]","1"],"expected":"[]"}
  ]'::jsonb
WHERE id = 'combination-sum';

-- ════════════════════════════════════════
-- PERMUTATIONS
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'permute',
  params = '[{"name":"nums","type":"List[int]"}]'::jsonb,
  return_type = 'List[List[int]]',
  test_cases = '[
    {"inputs":["[1,2,3]"],"expected":"[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]"},
    {"inputs":["[0,1]"],"expected":"[[0,1],[1,0]]"},
    {"inputs":["[1]"],"expected":"[[1]]"}
  ]'::jsonb
WHERE id = 'permutations';

-- ════════════════════════════════════════
-- WORD SEARCH
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'exist',
  params = '[{"name":"board","type":"List[List[str]]"},{"name":"word","type":"str"}]'::jsonb,
  return_type = 'bool',
  test_cases = '[
    {"inputs":["[[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]]","\"ABCCED\""],"expected":"true"},
    {"inputs":["[[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]]","\"SEE\""],"expected":"true"},
    {"inputs":["[[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]]","\"ABCB\""],"expected":"false"}
  ]'::jsonb
WHERE id = 'word-search';

-- ════════════════════════════════════════
-- JUMP GAME
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'canJump',
  params = '[{"name":"nums","type":"List[int]"}]'::jsonb,
  return_type = 'bool',
  test_cases = '[
    {"inputs":["[2,3,1,1,4]"],"expected":"true"},
    {"inputs":["[3,2,1,0,4]"],"expected":"false"}
  ]'::jsonb
WHERE id = 'jump-game';

-- ════════════════════════════════════════
-- GAS STATION
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'canCompleteCircuit',
  params = '[{"name":"gas","type":"List[int]"},{"name":"cost","type":"List[int]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[1,2,3,4,5]","[3,4,5,1,2]"],"expected":"3"},
    {"inputs":["[2,3,4]","[3,4,3]"],"expected":"-1"}
  ]'::jsonb
WHERE id = 'gas-station';

-- ════════════════════════════════════════
-- HAND OF STRAIGHTS
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'isNStraightHand',
  params = '[{"name":"hand","type":"List[int]"},{"name":"groupSize","type":"int"}]'::jsonb,
  return_type = 'bool',
  test_cases = '[
    {"inputs":["[1,2,3,6,2,3,4,7,8]","3"],"expected":"true"},
    {"inputs":["[1,2,3,4,5]","4"],"expected":"false"}
  ]'::jsonb
WHERE id = 'hand-of-straights';

-- ════════════════════════════════════════
-- MERGE INTERVALS
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'merge',
  params = '[{"name":"intervals","type":"List[List[int]]"}]'::jsonb,
  return_type = 'List[List[int]]',
  test_cases = '[
    {"inputs":["[[1,3],[2,6],[8,10],[15,18]]"],"expected":"[[1,6],[8,10],[15,18]]"},
    {"inputs":["[[1,4],[4,5]]"],"expected":"[[1,5]]"}
  ]'::jsonb
WHERE id = 'merge-intervals';

-- ════════════════════════════════════════
-- INSERT INTERVAL
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'insert',
  params = '[{"name":"intervals","type":"List[List[int]]"},{"name":"newInterval","type":"List[int]"}]'::jsonb,
  return_type = 'List[List[int]]',
  test_cases = '[
    {"inputs":["[[1,3],[6,9]]","[2,5]"],"expected":"[[1,5],[6,9]]"},
    {"inputs":["[[1,2],[3,5],[6,7],[8,10],[12,16]]","[4,8]"],"expected":"[[1,2],[3,10],[12,16]]"}
  ]'::jsonb
WHERE id = 'insert-interval';

-- ════════════════════════════════════════
-- NON-OVERLAPPING INTERVALS
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'eraseOverlapIntervals',
  params = '[{"name":"intervals","type":"List[List[int]]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[[1,2],[2,3],[3,4],[1,3]]"],"expected":"1"},
    {"inputs":["[[1,2],[1,2],[1,2]]"],"expected":"2"},
    {"inputs":["[[1,2],[2,3]]"],"expected":"0"}
  ]'::jsonb
WHERE id = 'non-overlapping-intervals';

-- ════════════════════════════════════════
-- MEETING ROOMS II
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'minMeetingRooms',
  params = '[{"name":"intervals","type":"List[List[int]]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[[0,30],[5,10],[15,20]]"],"expected":"2"},
    {"inputs":["[[7,10],[2,4]]"],"expected":"1"}
  ]'::jsonb
WHERE id = 'meeting-rooms';

-- ════════════════════════════════════════
-- LONGEST COMMON SUBSEQUENCE
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'longestCommonSubsequence',
  params = '[{"name":"text1","type":"str"},{"name":"text2","type":"str"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["\"abcde\"","\"ace\""],"expected":"3"},
    {"inputs":["\"abc\"","\"abc\""],"expected":"3"},
    {"inputs":["\"abc\"","\"def\""],"expected":"0"}
  ]'::jsonb
WHERE id = 'longest-common-subseq';

-- ════════════════════════════════════════
-- EDIT DISTANCE
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'minDistance',
  params = '[{"name":"word1","type":"str"},{"name":"word2","type":"str"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["\"horse\"","\"ros\""],"expected":"3"},
    {"inputs":["\"intention\"","\"execution\""],"expected":"5"}
  ]'::jsonb
WHERE id = 'edit-distance';

-- ════════════════════════════════════════
-- TARGET SUM
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'findTargetSumWays',
  params = '[{"name":"nums","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[1,1,1,1,1]","3"],"expected":"5"},
    {"inputs":["[1]","1"],"expected":"1"}
  ]'::jsonb
WHERE id = 'target-sum';

-- ════════════════════════════════════════
-- COURSE SCHEDULE
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'canFinish',
  params = '[{"name":"numCourses","type":"int"},{"name":"prerequisites","type":"List[List[int]]"}]'::jsonb,
  return_type = 'bool',
  test_cases = '[
    {"inputs":["2","[[1,0]]"],"expected":"true"},
    {"inputs":["2","[[1,0],[0,1]]"],"expected":"false"}
  ]'::jsonb
WHERE id = 'course-schedule';

-- ════════════════════════════════════════
-- NUMBER OF ISLANDS
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'numIslands',
  params = '[{"name":"grid","type":"List[List[str]]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]"],"expected":"1"},
    {"inputs":["[[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]"],"expected":"3"}
  ]'::jsonb
WHERE id = 'num-islands';

-- ════════════════════════════════════════
-- ROTTING ORANGES
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'orangesRotting',
  params = '[{"name":"grid","type":"List[List[int]]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[[2,1,1],[1,1,0],[0,1,1]]"],"expected":"4"},
    {"inputs":["[[2,1,1],[0,1,1],[1,0,1]]"],"expected":"-1"},
    {"inputs":["[[0,2]]"],"expected":"0"}
  ]'::jsonb
WHERE id = 'rotting-oranges';

-- ════════════════════════════════════════
-- NETWORK DELAY TIME
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'networkDelayTime',
  params = '[{"name":"times","type":"List[List[int]]"},{"name":"n","type":"int"},{"name":"k","type":"int"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[[2,1,1],[2,3,1],[3,4,1]]","4","2"],"expected":"2"},
    {"inputs":["[[1,2,1]]","2","1"],"expected":"1"},
    {"inputs":["[[1,2,1]]","2","2"],"expected":"-1"}
  ]'::jsonb
WHERE id = 'network-delay';

-- ════════════════════════════════════════
-- SWIM IN RISING WATER
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'swimInWater',
  params = '[{"name":"grid","type":"List[List[int]]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[[0,2],[1,3]]"],"expected":"3"},
    {"inputs":["[[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]"],"expected":"16"}
  ]'::jsonb
WHERE id = 'swim-in-water';

-- ════════════════════════════════════════
-- CHEAPEST FLIGHTS WITHIN K STOPS
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'findCheapestPrice',
  params = '[{"name":"n","type":"int"},{"name":"flights","type":"List[List[int]]"},{"name":"src","type":"int"},{"name":"dst","type":"int"},{"name":"k","type":"int"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["4","[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]]","0","3","1"],"expected":"700"},
    {"inputs":["3","[[0,1,100],[1,2,100],[0,2,500]]","0","2","1"],"expected":"200"},
    {"inputs":["3","[[0,1,100],[1,2,100],[0,2,500]]","0","2","0"],"expected":"500"}
  ]'::jsonb
WHERE id = 'cheapest-flights';

-- ════════════════════════════════════════
-- SPIRAL MATRIX
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'spiralOrder',
  params = '[{"name":"matrix","type":"List[List[int]]"}]'::jsonb,
  return_type = 'List[int]',
  test_cases = '[
    {"inputs":["[[1,2,3],[4,5,6],[7,8,9]]"],"expected":"[1,2,3,6,9,8,7,4,5]"},
    {"inputs":["[[1,2,3,4],[5,6,7,8],[9,10,11,12]]"],"expected":"[1,2,3,4,8,12,11,10,9,5,6,7]"}
  ]'::jsonb
WHERE id = 'spiral-matrix';

-- ════════════════════════════════════════
-- HAPPY NUMBER
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'isHappy',
  params = '[{"name":"n","type":"int"}]'::jsonb,
  return_type = 'bool',
  test_cases = '[
    {"inputs":["19"],"expected":"true"},
    {"inputs":["2"],"expected":"false"}
  ]'::jsonb
WHERE id = 'happy-number';

-- ════════════════════════════════════════
-- SINGLE NUMBER
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'singleNumber',
  params = '[{"name":"nums","type":"List[int]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[2,2,1]"],"expected":"1"},
    {"inputs":["[4,1,2,1,2]"],"expected":"4"},
    {"inputs":["[1]"],"expected":"1"}
  ]'::jsonb
WHERE id = 'single-number';

-- ════════════════════════════════════════
-- NUMBER OF 1 BITS
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'hammingWeight',
  params = '[{"name":"n","type":"int"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["11"],"expected":"3"},
    {"inputs":["128"],"expected":"1"},
    {"inputs":["2147483645"],"expected":"30"}
  ]'::jsonb
WHERE id = 'number-of-1-bits';

-- ════════════════════════════════════════
-- COUNTING BITS
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'countBits',
  params = '[{"name":"n","type":"int"}]'::jsonb,
  return_type = 'List[int]',
  test_cases = '[
    {"inputs":["2"],"expected":"[0,1,1]"},
    {"inputs":["5"],"expected":"[0,1,1,2,1,2]"}
  ]'::jsonb
WHERE id = 'counting-bits';

-- ════════════════════════════════════════
-- REVERSE BITS
-- ════════════════════════════════════════
UPDATE "PGcode_problems" SET
  method_name = 'reverseBits',
  params = '[{"name":"n","type":"int"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["43261596"],"expected":"964176192"},
    {"inputs":["4294967293"],"expected":"3221225471"}
  ]'::jsonb
WHERE id = 'reverse-bits';
