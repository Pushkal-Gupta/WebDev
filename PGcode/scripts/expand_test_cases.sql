-- Expand test cases for all 62 PGcode problems
-- Each problem now has 5-8 test cases covering edge cases
-- Run against: PGcode_problems table

-- 1. two-sum
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[2,7,11,15]","9"],"expected":"[0,1]"},
  {"inputs":["[3,2,4]","6"],"expected":"[1,2]"},
  {"inputs":["[3,3]","6"],"expected":"[0,1]"},
  {"inputs":["[-1,-2,-3,-4,-5]","-8"],"expected":"[2,4]"},
  {"inputs":["[1,2,3,4,5,6,7,8,9,10]","19"],"expected":"[8,9]"},
  {"inputs":["[0,4,3,0]","0"],"expected":"[0,3]"},
  {"inputs":["[-3,4,3,90]","0"],"expected":"[0,2]"}
]'::jsonb WHERE id = 'two-sum';

-- 2. contains-duplicate
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[1,2,3,1]"],"expected":"true"},
  {"inputs":["[1,2,3,4]"],"expected":"false"},
  {"inputs":["[1,1,1,3,3,4,3,2,4,2]"],"expected":"true"},
  {"inputs":["[]"],"expected":"false"},
  {"inputs":["[1]"],"expected":"false"},
  {"inputs":["[7,7]"],"expected":"true"},
  {"inputs":["[-1,0,1,-1]"],"expected":"true"}
]'::jsonb WHERE id = 'contains-duplicate';

-- 3. valid-anagram
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["\"anagram\"","\"nagaram\""],"expected":"true"},
  {"inputs":["\"rat\"","\"car\""],"expected":"false"},
  {"inputs":["\"\"","\"\""],"expected":"true"},
  {"inputs":["\"a\"","\"a\""],"expected":"true"},
  {"inputs":["\"a\"","\"b\""],"expected":"false"},
  {"inputs":["\"ab\"","\"a\""],"expected":"false"},
  {"inputs":["\"aab\"","\"aba\""],"expected":"true"},
  {"inputs":["\"aacc\"","\"ccac\""],"expected":"false"}
]'::jsonb WHERE id = 'valid-anagram';

-- 4. valid-palindrome
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["\"A man, a plan, a canal: Panama\""],"expected":"true"},
  {"inputs":["\"race a car\""],"expected":"false"},
  {"inputs":["\" \""],"expected":"true"},
  {"inputs":["\"a\""],"expected":"true"},
  {"inputs":["\".,\""],"expected":"true"},
  {"inputs":["\"0P\""],"expected":"false"},
  {"inputs":["\"abcba\""],"expected":"true"},
  {"inputs":["\"AbBa\""],"expected":"true"}
]'::jsonb WHERE id = 'valid-palindrome';

-- 5. best-time-to-buy-sell-stock
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[7,1,5,3,6,4]"],"expected":"5"},
  {"inputs":["[7,6,4,3,1]"],"expected":"0"},
  {"inputs":["[1]"],"expected":"0"},
  {"inputs":["[1,2]"],"expected":"1"},
  {"inputs":["[2,1]"],"expected":"0"},
  {"inputs":["[3,3,3,3]"],"expected":"0"},
  {"inputs":["[1,4,2,7]"],"expected":"6"}
]'::jsonb WHERE id = 'best-time-to-buy-sell-stock';

-- 6. valid-parentheses
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["\"()\""],"expected":"true"},
  {"inputs":["\"()[]{}\""],"expected":"true"},
  {"inputs":["\"(]\""],"expected":"false"},
  {"inputs":["\"([{}])\""],"expected":"true"},
  {"inputs":["\"\""],"expected":"true"},
  {"inputs":["\"(\""],"expected":"false"},
  {"inputs":["\"({[)]}\""],"expected":"false"},
  {"inputs":["\"(((())))\""],"expected":"true"}
]'::jsonb WHERE id = 'valid-parentheses';

-- 7. max-subarray (maximum subarray / Kadane's)
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[-2,1,-3,4,-1,2,1,-5,4]"],"expected":"6"},
  {"inputs":["[1]"],"expected":"1"},
  {"inputs":["[5,4,-1,7,8]"],"expected":"23"},
  {"inputs":["[-1]"],"expected":"-1"},
  {"inputs":["[-2,-1,-3]"],"expected":"-1"},
  {"inputs":["[1,2,3,4,5]"],"expected":"15"},
  {"inputs":["[-1,2,-1,2,-1]"],"expected":"3"}
]'::jsonb WHERE id = 'max-subarray';

-- 8. group-anagrams
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]"],"expected":"[[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]"},
  {"inputs":["[\"\"]"],"expected":"[[\"\"]]"},
  {"inputs":["[\"a\"]"],"expected":"[[\"a\"]]"},
  {"inputs":["[]"],"expected":"[]"},
  {"inputs":["[\"abc\",\"abc\",\"abc\"]"],"expected":"[[\"abc\",\"abc\",\"abc\"]]"},
  {"inputs":["[\"ab\",\"cd\",\"ef\"]"],"expected":"[[\"ab\"],[\"cd\"],[\"ef\"]]"}
]'::jsonb WHERE id = 'group-anagrams';

-- 9. top-k-frequent
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[1,1,1,2,2,3]","2"],"expected":"[1,2]"},
  {"inputs":["[1]","1"],"expected":"[1]"},
  {"inputs":["[1,2,3,4]","4"],"expected":"[1,2,3,4]"},
  {"inputs":["[-1,-1,2,2,3]","2"],"expected":"[-1,2]"},
  {"inputs":["[5,5,5,5]","1"],"expected":"[5]"},
  {"inputs":["[1,1,2,2,3,3]","3"],"expected":"[1,2,3]"}
]'::jsonb WHERE id = 'top-k-frequent';

-- 10. product-except-self
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[1,2,3,4]"],"expected":"[24,12,8,6]"},
  {"inputs":["[-1,1,0,-3,3]"],"expected":"[0,0,9,0,0]"},
  {"inputs":["[2,3]"],"expected":"[3,2]"},
  {"inputs":["[1,1,1,1]"],"expected":"[1,1,1,1]"},
  {"inputs":["[0,0]"],"expected":"[0,0]"},
  {"inputs":["[-2,-3,4]"],"expected":"[-12,-8,6]"},
  {"inputs":["[1,2,0,4]"],"expected":"[0,0,8,0]"}
]'::jsonb WHERE id = 'product-except-self';

-- 11. longest-consecutive
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[100,4,200,1,3,2]"],"expected":"4"},
  {"inputs":["[0,3,7,2,5,8,4,6,0,1]"],"expected":"9"},
  {"inputs":["[]"],"expected":"0"},
  {"inputs":["[1]"],"expected":"1"},
  {"inputs":["[10,20,30]"],"expected":"1"},
  {"inputs":["[5,5,5,5]"],"expected":"1"},
  {"inputs":["[1,2,0,1]"],"expected":"3"}
]'::jsonb WHERE id = 'longest-consecutive';

-- 12. three-sum
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[-1,0,1,2,-1,-4]"],"expected":"[[-1,-1,2],[-1,0,1]]"},
  {"inputs":["[0,1,1]"],"expected":"[]"},
  {"inputs":["[0,0,0]"],"expected":"[[0,0,0]]"},
  {"inputs":["[0,0,0,0]"],"expected":"[[0,0,0]]"},
  {"inputs":["[1,2,-2,-1]"],"expected":"[]"},
  {"inputs":["[-2,0,1,1,2]"],"expected":"[[-2,0,2],[-2,1,1]]"}
]'::jsonb WHERE id = 'three-sum';

-- 13. container-most-water
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[1,8,6,2,5,4,8,3,7]"],"expected":"49"},
  {"inputs":["[1,1]"],"expected":"1"},
  {"inputs":["[1,2,3,4,5]"],"expected":"6"},
  {"inputs":["[5,4,3,2,1]"],"expected":"6"},
  {"inputs":["[1,3,2,5,25,24,5]"],"expected":"24"},
  {"inputs":["[2,3,4,5,18,17,6]"],"expected":"17"}
]'::jsonb WHERE id = 'container-most-water';

-- 14. trapping-rain-water
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[0,1,0,2,1,0,1,3,2,1,2,1]"],"expected":"6"},
  {"inputs":["[4,2,0,3,2,5]"],"expected":"9"},
  {"inputs":["[1,2,3,4,5]"],"expected":"0"},
  {"inputs":["[5,4,3,2,1]"],"expected":"0"},
  {"inputs":["[1]"],"expected":"0"},
  {"inputs":["[3,3,3,3]"],"expected":"0"},
  {"inputs":["[5,2,1,2,1,5]"],"expected":"14"}
]'::jsonb WHERE id = 'trapping-rain-water';

-- 15. two-sum-ii (1-indexed output)
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[2,7,11,15]","9"],"expected":"[1,2]"},
  {"inputs":["[2,3,4]","6"],"expected":"[1,3]"},
  {"inputs":["[-1,0]","-1"],"expected":"[1,2]"},
  {"inputs":["[1,2,3,4,5,6,7,8,9,10]","19"],"expected":"[9,10]"},
  {"inputs":["[1,3,5,7]","8"],"expected":"[1,4]"},
  {"inputs":["[1,2]","3"],"expected":"[1,2]"},
  {"inputs":["[-3,-1,0,1,5]","4"],"expected":"[2,5]"}
]'::jsonb WHERE id = 'two-sum-ii';

-- 16. eval-rpn (Evaluate Reverse Polish Notation)
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[\"2\",\"1\",\"+\",\"3\",\"*\"]"],"expected":"9"},
  {"inputs":["[\"4\",\"13\",\"5\",\"/\",\"+\"]"],"expected":"6"},
  {"inputs":["[\"10\",\"6\",\"9\",\"3\",\"+\",\"-11\",\"*\",\"/\",\"*\",\"17\",\"+\",\"5\",\"+\"]"],"expected":"22"},
  {"inputs":["[\"42\"]"],"expected":"42"},
  {"inputs":["[\"3\",\"4\",\"-\"]"],"expected":"-1"},
  {"inputs":["[\"7\",\"2\",\"/\"]"],"expected":"3"},
  {"inputs":["[\"10\",\"3\",\"/\"]"],"expected":"3"}
]'::jsonb WHERE id = 'eval-rpn';

-- 17. daily-temperatures
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[73,74,75,71,69,72,76,73]"],"expected":"[1,1,4,2,1,1,0,0]"},
  {"inputs":["[30,40,50,60]"],"expected":"[1,1,1,0]"},
  {"inputs":["[30,60,90]"],"expected":"[1,1,0]"},
  {"inputs":["[50,50,50,50]"],"expected":"[0,0,0,0]"},
  {"inputs":["[90,80,70,60]"],"expected":"[0,0,0,0]"},
  {"inputs":["[55]"],"expected":"[0]"},
  {"inputs":["[70,71,70,71,70]"],"expected":"[1,0,1,0,0]"}
]'::jsonb WHERE id = 'daily-temperatures';

-- 18. largest-rect-histogram
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[2,1,5,6,2,3]"],"expected":"10"},
  {"inputs":["[2,4]"],"expected":"4"},
  {"inputs":["[5]"],"expected":"5"},
  {"inputs":["[3,3,3,3]"],"expected":"12"},
  {"inputs":["[1,2,3,4,5]"],"expected":"9"},
  {"inputs":["[5,4,3,2,1]"],"expected":"9"},
  {"inputs":["[1]"],"expected":"1"}
]'::jsonb WHERE id = 'largest-rect-histogram';

-- 19. car-fleet
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["12","[10,8,0,5,3]","[2,4,1,1,3]"],"expected":"3"},
  {"inputs":["10","[3]","[3]"],"expected":"1"},
  {"inputs":["100","[0,2,4]","[4,2,1]"],"expected":"1"},
  {"inputs":["10","[6,8]","[3,2]"],"expected":"2"},
  {"inputs":["10","[0,4,2]","[2,1,3]"],"expected":"1"},
  {"inputs":["12","[10,8,0,5,3]","[2,4,1,1,3]"],"expected":"3"}
]'::jsonb WHERE id = 'car-fleet';

-- 20. search-rotated (search in rotated sorted array)
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[4,5,6,7,0,1,2]","0"],"expected":"4"},
  {"inputs":["[4,5,6,7,0,1,2]","3"],"expected":"-1"},
  {"inputs":["[1]","0"],"expected":"-1"},
  {"inputs":["[1,2,3,4,5]","3"],"expected":"2"},
  {"inputs":["[3,1]","1"],"expected":"1"},
  {"inputs":["[5,1,3]","5"],"expected":"0"},
  {"inputs":["[4,5,6,7,0,1,2]","4"],"expected":"0"}
]'::jsonb WHERE id = 'search-rotated';

-- 21. find-min-rotated (find minimum in rotated sorted array)
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[3,4,5,1,2]"],"expected":"1"},
  {"inputs":["[4,5,6,7,0,1,2]"],"expected":"0"},
  {"inputs":["[11,13,15,17]"],"expected":"11"},
  {"inputs":["[1]"],"expected":"1"},
  {"inputs":["[2,1]"],"expected":"1"},
  {"inputs":["[3,1,2]"],"expected":"1"},
  {"inputs":["[1,2,3,4,5]"],"expected":"1"}
]'::jsonb WHERE id = 'find-min-rotated';

-- 22. koko-bananas (Koko eating bananas)
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[3,6,7,11]","8"],"expected":"4"},
  {"inputs":["[30,11,23,4,20]","5"],"expected":"30"},
  {"inputs":["[30,11,23,4,20]","6"],"expected":"23"},
  {"inputs":["[10]","10"],"expected":"1"},
  {"inputs":["[5,5,5,5]","4"],"expected":"5"},
  {"inputs":["[1000000000]","2"],"expected":"500000000"}
]'::jsonb WHERE id = 'koko-bananas';

-- 23. search-2d-matrix
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[[1,3,5,7],[10,11,16,20],[23,30,34,60]]","3"],"expected":"true"},
  {"inputs":["[[1,3,5,7],[10,11,16,20],[23,30,34,60]]","13"],"expected":"false"},
  {"inputs":["[[1]]","1"],"expected":"true"},
  {"inputs":["[[1]]","2"],"expected":"false"},
  {"inputs":["[[1,3,5,7]]","7"],"expected":"true"},
  {"inputs":["[[1],[3],[5]]","3"],"expected":"true"},
  {"inputs":["[[1,3,5,7],[10,11,16,20],[23,30,34,60]]","1"],"expected":"true"}
]'::jsonb WHERE id = 'search-2d-matrix';

-- 24. longest-substr-no-repeat
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["\"abcabcbb\""],"expected":"3"},
  {"inputs":["\"bbbbb\""],"expected":"1"},
  {"inputs":["\"pwwkew\""],"expected":"3"},
  {"inputs":["\"\""],"expected":"0"},
  {"inputs":["\"a\""],"expected":"1"},
  {"inputs":["\"abcdef\""],"expected":"6"},
  {"inputs":["\" \""],"expected":"1"},
  {"inputs":["\"dvdf\""],"expected":"3"}
]'::jsonb WHERE id = 'longest-substr-no-repeat';

-- 25. longest-repeating-char (longest repeating character replacement)
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["\"ABAB\"","2"],"expected":"4"},
  {"inputs":["\"AABABBA\"","1"],"expected":"4"},
  {"inputs":["\"A\"","0"],"expected":"1"},
  {"inputs":["\"ABCD\"","0"],"expected":"1"},
  {"inputs":["\"AAAA\"","2"],"expected":"4"},
  {"inputs":["\"ABBB\"","2"],"expected":"4"},
  {"inputs":["\"ABAB\"","0"],"expected":"1"}
]'::jsonb WHERE id = 'longest-repeating-char';

-- 26. min-window-substring
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["\"ADOBECODEBANC\"","\"ABC\""],"expected":"\"BANC\""},
  {"inputs":["\"a\"","\"a\""],"expected":"\"a\""},
  {"inputs":["\"a\"","\"aa\""],"expected":"\"\""},
  {"inputs":["\"aa\"","\"aa\""],"expected":"\"aa\""},
  {"inputs":["\"abc\"","\"b\""],"expected":"\"b\""},
  {"inputs":["\"ab\"","\"b\""],"expected":"\"b\""},
  {"inputs":["\"bba\"","\"ab\""],"expected":"\"ba\""}
]'::jsonb WHERE id = 'min-window-substring';

-- 27. permutation-in-string
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["\"ab\"","\"eidbaooo\""],"expected":"true"},
  {"inputs":["\"ab\"","\"eidboaoo\""],"expected":"false"},
  {"inputs":["\"abc\"","\"ab\""],"expected":"false"},
  {"inputs":["\"a\"","\"a\""],"expected":"true"},
  {"inputs":["\"adc\"","\"dcda\""],"expected":"true"},
  {"inputs":["\"ab\"","\"ab\""],"expected":"true"},
  {"inputs":["\"a\"","\"b\""],"expected":"false"}
]'::jsonb WHERE id = 'permutation-in-string';

-- 28. last-stone-weight
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[2,7,4,1,8,1]"],"expected":"1"},
  {"inputs":["[1]"],"expected":"1"},
  {"inputs":["[3,3]"],"expected":"0"},
  {"inputs":["[5,5,5,5]"],"expected":"0"},
  {"inputs":["[10,4,2,10]"],"expected":"2"},
  {"inputs":["[2,2]"],"expected":"0"},
  {"inputs":["[1,3]"],"expected":"2"}
]'::jsonb WHERE id = 'last-stone-weight';

-- 29. k-closest-points (k closest points to origin)
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[[1,3],[-2,2]]","1"],"expected":"[[-2,2]]"},
  {"inputs":["[[3,3],[5,-1],[-2,4]]","2"],"expected":"[[3,3],[-2,4]]"},
  {"inputs":["[[0,0]]","1"],"expected":"[[0,0]]"},
  {"inputs":["[[1,1],[-1,-1],[2,2]]","2"],"expected":"[[1,1],[-1,-1]]"},
  {"inputs":["[[1,0],[0,1]]","2"],"expected":"[[1,0],[0,1]]"},
  {"inputs":["[[2,2],[2,2],[3,3]]","2"],"expected":"[[2,2],[2,2]]"}
]'::jsonb WHERE id = 'k-closest-points';

-- 30. task-scheduler
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[\"A\",\"A\",\"A\",\"B\",\"B\",\"B\"]","2"],"expected":"8"},
  {"inputs":["[\"A\",\"A\",\"A\",\"B\",\"B\",\"B\"]","0"],"expected":"6"},
  {"inputs":["[\"A\",\"A\",\"A\",\"A\",\"A\",\"A\",\"B\",\"C\",\"D\",\"E\",\"F\",\"G\"]","2"],"expected":"16"},
  {"inputs":["[\"A\"]","2"],"expected":"1"},
  {"inputs":["[\"A\",\"B\",\"C\",\"D\"]","2"],"expected":"4"},
  {"inputs":["[\"A\",\"A\",\"A\"]","2"],"expected":"7"},
  {"inputs":["[\"A\",\"A\",\"B\",\"B\"]","1"],"expected":"4"}
]'::jsonb WHERE id = 'task-scheduler';

-- 31. climbing-stairs
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["2"],"expected":"2"},
  {"inputs":["3"],"expected":"3"},
  {"inputs":["5"],"expected":"8"},
  {"inputs":["1"],"expected":"1"},
  {"inputs":["4"],"expected":"5"},
  {"inputs":["10"],"expected":"89"},
  {"inputs":["6"],"expected":"13"}
]'::jsonb WHERE id = 'climbing-stairs';

-- 32. house-robber
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[1,2,3,1]"],"expected":"4"},
  {"inputs":["[2,7,9,3,1]"],"expected":"12"},
  {"inputs":["[5]"],"expected":"5"},
  {"inputs":["[2,1]"],"expected":"2"},
  {"inputs":["[100,1,1,100]"],"expected":"200"},
  {"inputs":["[1,2,3,4,5]"],"expected":"9"},
  {"inputs":["[0,0,0]"],"expected":"0"}
]'::jsonb WHERE id = 'house-robber';

-- 33. coin-change
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[1,5,10]","11"],"expected":"2"},
  {"inputs":["[2]","3"],"expected":"-1"},
  {"inputs":["[1]","0"],"expected":"0"},
  {"inputs":["[5]","5"],"expected":"1"},
  {"inputs":["[3,7]","2"],"expected":"-1"},
  {"inputs":["[1]","1"],"expected":"1"},
  {"inputs":["[1,2,5]","11"],"expected":"3"},
  {"inputs":["[186,419,83,408]","6249"],"expected":"20"}
]'::jsonb WHERE id = 'coin-change';

-- 34. longest-increasing-subseq (LIS)
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[10,9,2,5,3,7,101,18]"],"expected":"4"},
  {"inputs":["[0,1,0,3,2,3]"],"expected":"4"},
  {"inputs":["[7,7,7,7,7,7,7]"],"expected":"1"},
  {"inputs":["[1,2,3,4,5]"],"expected":"5"},
  {"inputs":["[5,4,3,2,1]"],"expected":"1"},
  {"inputs":["[3]"],"expected":"1"},
  {"inputs":["[1,3,6,7,9,4,10,5,6]"],"expected":"6"}
]'::jsonb WHERE id = 'longest-increasing-subseq';

-- 35. word-break
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["\"leetcode\"","[\"leet\",\"code\"]"],"expected":"true"},
  {"inputs":["\"applepenapple\"","[\"apple\",\"pen\"]"],"expected":"true"},
  {"inputs":["\"catsandog\"","[\"cats\",\"dog\",\"sand\",\"and\",\"cat\"]"],"expected":"false"},
  {"inputs":["\"a\"","[\"a\"]"],"expected":"true"},
  {"inputs":["\"ab\"","[\"a\",\"b\"]"],"expected":"true"},
  {"inputs":["\"cars\"","[\"car\",\"ca\",\"rs\"]"],"expected":"true"},
  {"inputs":["\"aaaaaaa\"","[\"aaa\",\"aaaa\"]"],"expected":"true"}
]'::jsonb WHERE id = 'word-break';

-- 36. unique-paths
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["3","7"],"expected":"28"},
  {"inputs":["3","2"],"expected":"3"},
  {"inputs":["1","1"],"expected":"1"},
  {"inputs":["1","5"],"expected":"1"},
  {"inputs":["5","1"],"expected":"1"},
  {"inputs":["2","2"],"expected":"2"},
  {"inputs":["4","4"],"expected":"20"}
]'::jsonb WHERE id = 'unique-paths';

-- 37. subsets
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[1,2,3]"],"expected":"[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]"},
  {"inputs":["[0]"],"expected":"[[],[0]]"},
  {"inputs":["[]"],"expected":"[[]]"},
  {"inputs":["[1,2]"],"expected":"[[],[1],[2],[1,2]]"},
  {"inputs":["[5,9]"],"expected":"[[],[5],[9],[5,9]]"}
]'::jsonb WHERE id = 'subsets';

-- 38. combination-sum
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[2,3,6,7]","7"],"expected":"[[2,2,3],[7]]"},
  {"inputs":["[2,3,5]","8"],"expected":"[[2,2,2,2],[2,3,3],[3,5]]"},
  {"inputs":["[2]","1"],"expected":"[]"},
  {"inputs":["[7]","7"],"expected":"[[7]]"},
  {"inputs":["[1]","3"],"expected":"[[1,1,1]]"},
  {"inputs":["[2,3]","6"],"expected":"[[2,2,2],[3,3]]"},
  {"inputs":["[3,5,8]","11"],"expected":"[[3,3,5],[3,8]]"}
]'::jsonb WHERE id = 'combination-sum';

-- 39. permutations
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[1,2,3]"],"expected":"[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]"},
  {"inputs":["[0,1]"],"expected":"[[0,1],[1,0]]"},
  {"inputs":["[1]"],"expected":"[[1]]"},
  {"inputs":["[1,2]"],"expected":"[[1,2],[2,1]]"},
  {"inputs":["[0]"],"expected":"[[0]]"}
]'::jsonb WHERE id = 'permutations';

-- 40. word-search
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]]","\"ABCCED\""],"expected":"true"},
  {"inputs":["[[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]]","\"SEE\""],"expected":"true"},
  {"inputs":["[[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]]","\"ABCB\""],"expected":"false"},
  {"inputs":["[[\"A\"]]","\"A\""],"expected":"true"},
  {"inputs":["[[\"A\"]]","\"B\""],"expected":"false"},
  {"inputs":["[[\"a\",\"b\"],[\"c\",\"d\"]]","\"abdc\""],"expected":"true"},
  {"inputs":["[[\"a\",\"b\"],[\"c\",\"d\"]]","\"abcd\""],"expected":"false"}
]'::jsonb WHERE id = 'word-search';

-- 41. jump-game
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[2,3,1,1,4]"],"expected":"true"},
  {"inputs":["[3,2,1,0,4]"],"expected":"false"},
  {"inputs":["[0]"],"expected":"true"},
  {"inputs":["[0,1]"],"expected":"false"},
  {"inputs":["[5,0,0,0,0]"],"expected":"true"},
  {"inputs":["[1,1,1,1,1]"],"expected":"true"},
  {"inputs":["[2,0,0]"],"expected":"true"}
]'::jsonb WHERE id = 'jump-game';

-- 42. gas-station
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[1,2,3,4,5]","[3,4,5,1,2]"],"expected":"3"},
  {"inputs":["[2,3,4]","[3,4,3]"],"expected":"-1"},
  {"inputs":["[5]","[4]"],"expected":"0"},
  {"inputs":["[3,3,3]","[3,3,3]"],"expected":"0"},
  {"inputs":["[5,8,2,8]","[6,5,6,6]"],"expected":"3"},
  {"inputs":["[1,2,3,4,5]","[1,2,3,4,5]"],"expected":"0"}
]'::jsonb WHERE id = 'gas-station';

-- 43. hand-of-straights
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[1,2,3,6,2,3,4,7,8]","3"],"expected":"true"},
  {"inputs":["[1,2,3,4,5]","4"],"expected":"false"},
  {"inputs":["[1,2,3]","1"],"expected":"true"},
  {"inputs":["[1,2,3,4,5,6]","3"],"expected":"true"},
  {"inputs":["[1,1,2,2,3,3]","3"],"expected":"true"},
  {"inputs":["[1,2,3,4,5,6]","2"],"expected":"true"},
  {"inputs":["[8,10,12]","3"],"expected":"false"}
]'::jsonb WHERE id = 'hand-of-straights';

-- 44. merge-intervals
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[[1,3],[2,6],[8,10],[15,18]]"],"expected":"[[1,6],[8,10],[15,18]]"},
  {"inputs":["[[1,4],[4,5]]"],"expected":"[[1,5]]"},
  {"inputs":["[[1,4],[0,4]]"],"expected":"[[0,4]]"},
  {"inputs":["[[1,2]]"],"expected":"[[1,2]]"},
  {"inputs":["[[1,10],[2,3],[4,5]]"],"expected":"[[1,10]]"},
  {"inputs":["[[1,2],[3,4],[5,6]]"],"expected":"[[1,2],[3,4],[5,6]]"}
]'::jsonb WHERE id = 'merge-intervals';

-- 45. insert-interval
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[[1,3],[6,9]]","[2,5]"],"expected":"[[1,5],[6,9]]"},
  {"inputs":["[[1,2],[3,5],[6,7],[8,10],[12,16]]","[4,8]"],"expected":"[[1,2],[3,10],[12,16]]"},
  {"inputs":["[]","[5,7]"],"expected":"[[5,7]]"},
  {"inputs":["[[1,5]]","[0,0]"],"expected":"[[0,0],[1,5]]"},
  {"inputs":["[[1,5]]","[6,8]"],"expected":"[[1,5],[6,8]]"},
  {"inputs":["[[3,5],[12,15]]","[6,6]"],"expected":"[[3,5],[6,6],[12,15]]"},
  {"inputs":["[[1,5]]","[2,3]"],"expected":"[[1,5]]"}
]'::jsonb WHERE id = 'insert-interval';

-- 46. non-overlapping-intervals
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[[1,2],[2,3],[3,4],[1,3]]"],"expected":"1"},
  {"inputs":["[[1,2],[1,2],[1,2]]"],"expected":"2"},
  {"inputs":["[[1,2],[2,3]]"],"expected":"0"},
  {"inputs":["[[1,100],[11,22],[1,11],[2,12]]"],"expected":"2"},
  {"inputs":["[[0,1]]"],"expected":"0"},
  {"inputs":["[[0,2],[1,3],[2,4],[3,5]]"],"expected":"2"}
]'::jsonb WHERE id = 'non-overlapping-intervals';

-- 47. meeting-rooms (minimum meeting rooms / meeting rooms II)
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[[0,30],[5,10],[15,20]]"],"expected":"2"},
  {"inputs":["[[7,10],[2,4]]"],"expected":"1"},
  {"inputs":["[]"],"expected":"0"},
  {"inputs":["[[1,5]]"],"expected":"1"},
  {"inputs":["[[1,5],[2,6],[3,7]]"],"expected":"3"},
  {"inputs":["[[1,2],[2,3],[3,4]]"],"expected":"1"},
  {"inputs":["[[0,5],[0,5],[0,5]]"],"expected":"3"}
]'::jsonb WHERE id = 'meeting-rooms';

-- 48. longest-common-subseq (LCS)
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["\"abcde\"","\"ace\""],"expected":"3"},
  {"inputs":["\"abc\"","\"abc\""],"expected":"3"},
  {"inputs":["\"abc\"","\"def\""],"expected":"0"},
  {"inputs":["\"\"","\"abc\""],"expected":"0"},
  {"inputs":["\"a\"","\"a\""],"expected":"1"},
  {"inputs":["\"a\"","\"b\""],"expected":"0"},
  {"inputs":["\"oxcpqrsvwf\"","\"shmtulqrypy\""],"expected":"2"}
]'::jsonb WHERE id = 'longest-common-subseq';

-- 49. edit-distance
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["\"horse\"","\"ros\""],"expected":"3"},
  {"inputs":["\"intention\"","\"execution\""],"expected":"5"},
  {"inputs":["\"\"","\"\""],"expected":"0"},
  {"inputs":["\"\"","\"abc\""],"expected":"3"},
  {"inputs":["\"abc\"","\"abc\""],"expected":"0"},
  {"inputs":["\"a\"","\"b\""],"expected":"1"},
  {"inputs":["\"kitten\"","\"sitting\""],"expected":"3"}
]'::jsonb WHERE id = 'edit-distance';

-- 50. target-sum
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[1,1,1,1,1]","3"],"expected":"5"},
  {"inputs":["[1]","1"],"expected":"1"},
  {"inputs":["[1]","2"],"expected":"0"},
  {"inputs":["[0,0,0,0,0]","0"],"expected":"32"},
  {"inputs":["[1,0]","1"],"expected":"2"},
  {"inputs":["[2,1]","1"],"expected":"1"},
  {"inputs":["[1,2,1]","0"],"expected":"2"}
]'::jsonb WHERE id = 'target-sum';

-- 51. course-schedule
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["2","[[1,0]]"],"expected":"true"},
  {"inputs":["2","[[1,0],[0,1]]"],"expected":"false"},
  {"inputs":["3","[]"],"expected":"true"},
  {"inputs":["4","[[1,0],[2,1],[3,2]]"],"expected":"true"},
  {"inputs":["3","[[0,1],[1,2],[2,0]]"],"expected":"false"},
  {"inputs":["1","[]"],"expected":"true"},
  {"inputs":["5","[[1,4],[2,4],[3,1],[3,2]]"],"expected":"true"}
]'::jsonb WHERE id = 'course-schedule';

-- 52. num-islands
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]"],"expected":"1"},
  {"inputs":["[[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]"],"expected":"3"},
  {"inputs":["[[\"0\",\"0\"],[\"0\",\"0\"]]"],"expected":"0"},
  {"inputs":["[[\"1\",\"1\"],[\"1\",\"1\"]]"],"expected":"1"},
  {"inputs":["[[\"1\"]]"],"expected":"1"},
  {"inputs":["[[\"0\"]]"],"expected":"0"},
  {"inputs":["[[\"1\",\"0\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"0\",\"1\"]]"],"expected":"5"}
]'::jsonb WHERE id = 'num-islands';

-- 53. rotting-oranges
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[[2,1,1],[1,1,0],[0,1,1]]"],"expected":"4"},
  {"inputs":["[[2,1,1],[0,1,1],[1,0,1]]"],"expected":"-1"},
  {"inputs":["[[0,2]]"],"expected":"0"},
  {"inputs":["[[2,2,2],[2,2,2]]"],"expected":"0"},
  {"inputs":["[[0]]"],"expected":"0"},
  {"inputs":["[[1,2]]"],"expected":"1"},
  {"inputs":["[[2,1,1],[1,1,1],[0,1,2]]"],"expected":"2"}
]'::jsonb WHERE id = 'rotting-oranges';

-- 54. network-delay (network delay time / Dijkstra)
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[[2,1,1],[2,3,1],[3,4,1]]","4","2"],"expected":"2"},
  {"inputs":["[[1,2,1]]","2","1"],"expected":"1"},
  {"inputs":["[[1,2,1]]","2","2"],"expected":"-1"},
  {"inputs":["[[1,2,1],[2,1,1]]","2","1"],"expected":"1"},
  {"inputs":["[[1,2,5],[1,3,2],[2,3,1]]","3","1"],"expected":"5"},
  {"inputs":["[[1,2,1],[2,3,2],[1,3,4]]","3","1"],"expected":"3"}
]'::jsonb WHERE id = 'network-delay';

-- 55. swim-in-water (swim in rising water)
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[[0,2],[1,3]]"],"expected":"3"},
  {"inputs":["[[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]"],"expected":"16"},
  {"inputs":["[[0]]"],"expected":"0"},
  {"inputs":["[[0,1],[2,3]]"],"expected":"3"},
  {"inputs":["[[3,2],[0,1]]"],"expected":"3"},
  {"inputs":["[[0,2,4],[1,3,5],[8,7,6]]"],"expected":"6"}
]'::jsonb WHERE id = 'swim-in-water';

-- 56. cheapest-flights (cheapest flights within k stops)
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["4","[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]]","0","3","1"],"expected":"700"},
  {"inputs":["3","[[0,1,100],[1,2,100],[0,2,500]]","0","2","1"],"expected":"200"},
  {"inputs":["3","[[0,1,100],[1,2,100],[0,2,500]]","0","2","0"],"expected":"500"},
  {"inputs":["3","[[0,1,100],[1,2,100]]","0","2","1"],"expected":"200"},
  {"inputs":["3","[[0,1,100]]","0","2","1"],"expected":"-1"},
  {"inputs":["2","[[0,1,50]]","0","1","0"],"expected":"50"},
  {"inputs":["4","[[0,1,1],[0,2,5],[1,2,1],[2,3,1]]","0","3","1"],"expected":"6"}
]'::jsonb WHERE id = 'cheapest-flights';

-- 57. spiral-matrix
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[[1,2,3],[4,5,6],[7,8,9]]"],"expected":"[1,2,3,6,9,8,7,4,5]"},
  {"inputs":["[[1,2,3,4],[5,6,7,8],[9,10,11,12]]"],"expected":"[1,2,3,4,8,12,11,10,9,5,6,7]"},
  {"inputs":["[[1]]"],"expected":"[1]"},
  {"inputs":["[[1,2,3]]"],"expected":"[1,2,3]"},
  {"inputs":["[[1],[2],[3]]"],"expected":"[1,2,3]"},
  {"inputs":["[[1,2],[3,4]]"],"expected":"[1,2,4,3]"},
  {"inputs":["[[1,2,3,4]]"],"expected":"[1,2,3,4]"}
]'::jsonb WHERE id = 'spiral-matrix';

-- 58. happy-number
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["19"],"expected":"true"},
  {"inputs":["2"],"expected":"false"},
  {"inputs":["1"],"expected":"true"},
  {"inputs":["7"],"expected":"true"},
  {"inputs":["4"],"expected":"false"},
  {"inputs":["100"],"expected":"true"},
  {"inputs":["116"],"expected":"false"}
]'::jsonb WHERE id = 'happy-number';

-- 59. single-number
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["[2,2,1]"],"expected":"1"},
  {"inputs":["[4,1,2,1,2]"],"expected":"4"},
  {"inputs":["[1]"],"expected":"1"},
  {"inputs":["[-1,2,2]"],"expected":"-1"},
  {"inputs":["[0,1,0]"],"expected":"1"},
  {"inputs":["[5,3,5,3,9]"],"expected":"9"}
]'::jsonb WHERE id = 'single-number';

-- 60. number-of-1-bits (Hamming weight)
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["11"],"expected":"3"},
  {"inputs":["128"],"expected":"1"},
  {"inputs":["2147483645"],"expected":"30"},
  {"inputs":["0"],"expected":"0"},
  {"inputs":["1"],"expected":"1"},
  {"inputs":["255"],"expected":"8"},
  {"inputs":["7"],"expected":"3"}
]'::jsonb WHERE id = 'number-of-1-bits';

-- 61. counting-bits
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["2"],"expected":"[0,1,1]"},
  {"inputs":["5"],"expected":"[0,1,1,2,1,2]"},
  {"inputs":["0"],"expected":"[0]"},
  {"inputs":["1"],"expected":"[0,1]"},
  {"inputs":["8"],"expected":"[0,1,1,2,1,2,2,3,1]"},
  {"inputs":["3"],"expected":"[0,1,1,2]"},
  {"inputs":["4"],"expected":"[0,1,1,2,1]"}
]'::jsonb WHERE id = 'counting-bits';

-- 62. reverse-bits
UPDATE "PGcode_problems" SET test_cases = '[
  {"inputs":["43261596"],"expected":"964176192"},
  {"inputs":["4294967293"],"expected":"3221225471"},
  {"inputs":["0"],"expected":"0"},
  {"inputs":["1"],"expected":"2147483648"},
  {"inputs":["2147483648"],"expected":"1"},
  {"inputs":["4294967295"],"expected":"4294967295"},
  {"inputs":["2"],"expected":"1073741824"}
]'::jsonb WHERE id = 'reverse-bits';
