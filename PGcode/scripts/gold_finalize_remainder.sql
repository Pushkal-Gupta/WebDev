-- Final gold-bar fixes:
--   1) Top up hints to 3 for the 3 already-rich array rows
--   2) Add method_name/params/return_type + test_cases for the 11 problems missing them
BEGIN;

-- ===== Hints top-up (descriptions already have Examples + Constraints) =====

UPDATE public."PGcode_problems" SET hints = ARRAY[
  'Brute force is O(n^2): two nested loops. Acceptable on small n but too slow when n is large.',
  'Use a hash map { value : index } as you scan left to right.',
  'For each num, check if (target - num) is already in the map — if so, you have your pair in O(n) total.'
] WHERE id = 'two-sum';

UPDATE public."PGcode_problems" SET hints = ARRAY[
  'Sort the array first — duplicates land next to each other and you can spot them in one pass. O(n log n).',
  'Hash set: scan once, return true the moment you see a value already in the set. O(n) time, O(n) space.',
  'Pick the hash set version unless space is a hard constraint — it''s strictly faster.'
] WHERE id = 'contains-duplicate';

UPDATE public."PGcode_problems" SET hints = ARRAY[
  'Lengths must match — if not, return false immediately.',
  'Count the frequency of each character in s, then decrement for each character in t. If any count goes negative, return false.',
  'A 26-int array works for lowercase English; a hash map handles arbitrary characters.'
] WHERE id = 'valid-anagram';

-- ===== Add test cases + signature for 11 problems =====

UPDATE public."PGcode_problems" SET
  method_name = 'kthLargest',
  params = '[{"name":"nums","type":"List[int]"},{"name":"k","type":"int"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[3,2,1,5,6,4]","2"],"expected":"5"},
    {"inputs":["[3,2,3,1,2,4,5,5,6]","4"],"expected":"4"},
    {"inputs":["[1]","1"],"expected":"1"},
    {"inputs":["[7,7,7,7]","2"],"expected":"7"},
    {"inputs":["[-1,-2,-3,-4]","2"],"expected":"-2"},
    {"inputs":["[5,4,3,2,1]","5"],"expected":"1"}
  ]'::jsonb
WHERE id = 'kth-largest-element';

UPDATE public."PGcode_problems" SET
  method_name = 'hasCycle',
  params = '[{"name":"head","type":"ListNode"},{"name":"pos","type":"int"}]'::jsonb,
  return_type = 'bool',
  test_cases = '[
    {"inputs":["[3,2,0,-4]","1"],"expected":"true"},
    {"inputs":["[1,2]","0"],"expected":"true"},
    {"inputs":["[1]","-1"],"expected":"false"},
    {"inputs":["[]","-1"],"expected":"false"},
    {"inputs":["[1,2,3,4,5]","-1"],"expected":"false"},
    {"inputs":["[1,2,3,4,5]","2"],"expected":"true"}
  ]'::jsonb
WHERE id = 'linked-list-cycle';

UPDATE public."PGcode_problems" SET
  method_name = 'reorderList',
  params = '[{"name":"head","type":"ListNode"}]'::jsonb,
  return_type = 'void',
  test_cases = '[
    {"inputs":["[1,2,3,4]"],"expected":"[1,4,2,3]"},
    {"inputs":["[1,2,3,4,5]"],"expected":"[1,5,2,4,3]"},
    {"inputs":["[1]"],"expected":"[1]"},
    {"inputs":["[1,2]"],"expected":"[1,2]"},
    {"inputs":["[1,2,3]"],"expected":"[1,3,2]"},
    {"inputs":["[1,2,3,4,5,6]"],"expected":"[1,6,2,5,3,4]"}
  ]'::jsonb
WHERE id = 'reorder-list';

UPDATE public."PGcode_problems" SET
  method_name = 'cloneGraph',
  params = '[{"name":"adjList","type":"List[List[int]]"}]'::jsonb,
  return_type = 'List[List[int]]',
  test_cases = '[
    {"inputs":["[[2,4],[1,3],[2,4],[1,3]]"],"expected":"[[2,4],[1,3],[2,4],[1,3]]"},
    {"inputs":["[[]]"],"expected":"[[]]"},
    {"inputs":["[]"],"expected":"[]"},
    {"inputs":["[[2],[1]]"],"expected":"[[2],[1]]"},
    {"inputs":["[[2,3],[1,3],[1,2]]"],"expected":"[[2,3],[1,3],[1,2]]"},
    {"inputs":["[[2],[1,3],[2]]"],"expected":"[[2],[1,3],[2]]"}
  ]'::jsonb
WHERE id = 'clone-graph';

UPDATE public."PGcode_problems" SET
  method_name = 'pacificAtlantic',
  params = '[{"name":"heights","type":"List[List[int]]"}]'::jsonb,
  return_type = 'List[List[int]]',
  test_cases = '[
    {"inputs":["[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]"],"expected":"[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]"},
    {"inputs":["[[1]]"],"expected":"[[0,0]]"},
    {"inputs":["[[1,2],[4,3]]"],"expected":"[[0,1],[1,0],[1,1]]"},
    {"inputs":["[[3,3,3],[3,1,3],[3,3,3]]"],"expected":"[[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2]]"},
    {"inputs":["[[1,2,3],[8,9,4],[7,6,5]]"],"expected":"[[0,2],[1,2],[2,2],[2,1],[2,0],[1,0],[0,0]]"},
    {"inputs":["[[10,10,10],[10,1,10],[10,10,10]]"],"expected":"[[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2]]"}
  ]'::jsonb
WHERE id = 'pacific-atlantic';

UPDATE public."PGcode_problems" SET
  method_name = 'alienOrder',
  params = '[{"name":"words","type":"List[str]"}]'::jsonb,
  return_type = 'str',
  test_cases = '[
    {"inputs":["[\"wrt\",\"wrf\",\"er\",\"ett\",\"rftt\"]"],"expected":"\"wertf\""},
    {"inputs":["[\"z\",\"x\"]"],"expected":"\"zx\""},
    {"inputs":["[\"z\",\"x\",\"z\"]"],"expected":"\"\""},
    {"inputs":["[\"abc\",\"ab\"]"],"expected":"\"\""},
    {"inputs":["[\"a\",\"b\",\"c\"]"],"expected":"\"abc\""},
    {"inputs":["[\"ac\",\"ab\",\"zc\",\"zb\"]"],"expected":"\"acbz\""}
  ]'::jsonb
WHERE id = 'alien-dictionary';

UPDATE public."PGcode_problems" SET
  method_name = 'rotate',
  params = '[{"name":"matrix","type":"List[List[int]]"}]'::jsonb,
  return_type = 'void',
  test_cases = '[
    {"inputs":["[[1,2,3],[4,5,6],[7,8,9]]"],"expected":"[[7,4,1],[8,5,2],[9,6,3]]"},
    {"inputs":["[[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]"],"expected":"[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]"},
    {"inputs":["[[1]]"],"expected":"[[1]]"},
    {"inputs":["[[1,2],[3,4]]"],"expected":"[[3,1],[4,2]]"},
    {"inputs":["[[1,2,3,4,5],[6,7,8,9,10],[11,12,13,14,15],[16,17,18,19,20],[21,22,23,24,25]]"],"expected":"[[21,16,11,6,1],[22,17,12,7,2],[23,18,13,8,3],[24,19,14,9,4],[25,20,15,10,5]]"},
    {"inputs":["[[0,0],[0,0]]"],"expected":"[[0,0],[0,0]]"}
  ]'::jsonb
WHERE id = 'rotate-image';

UPDATE public."PGcode_problems" SET
  method_name = 'setZeroes',
  params = '[{"name":"matrix","type":"List[List[int]]"}]'::jsonb,
  return_type = 'void',
  test_cases = '[
    {"inputs":["[[1,1,1],[1,0,1],[1,1,1]]"],"expected":"[[1,0,1],[0,0,0],[1,0,1]]"},
    {"inputs":["[[0,1,2,0],[3,4,5,2],[1,3,1,5]]"],"expected":"[[0,0,0,0],[0,4,5,0],[0,3,1,0]]"},
    {"inputs":["[[1]]"],"expected":"[[1]]"},
    {"inputs":["[[0]]"],"expected":"[[0]]"},
    {"inputs":["[[1,2],[3,4]]"],"expected":"[[1,2],[3,4]]"},
    {"inputs":["[[1,0],[1,1]]"],"expected":"[[0,0],[1,0]]"}
  ]'::jsonb
WHERE id = 'set-matrix-zeroes';

UPDATE public."PGcode_problems" SET
  method_name = 'Trie',
  params = '[{"name":"operations","type":"List[List]"}]'::jsonb,
  return_type = 'List',
  test_cases = '[
    {"inputs":["[[\"Trie\"],[\"insert\",\"apple\"],[\"search\",\"apple\"],[\"search\",\"app\"],[\"startsWith\",\"app\"],[\"insert\",\"app\"],[\"search\",\"app\"]]"],"expected":"[null,null,true,false,true,null,true]"},
    {"inputs":["[[\"Trie\"],[\"insert\",\"a\"],[\"search\",\"a\"]]"],"expected":"[null,null,true]"},
    {"inputs":["[[\"Trie\"],[\"search\",\"a\"]]"],"expected":"[null,false]"},
    {"inputs":["[[\"Trie\"],[\"insert\",\"hello\"],[\"search\",\"hell\"],[\"startsWith\",\"hell\"]]"],"expected":"[null,null,false,true]"},
    {"inputs":["[[\"Trie\"],[\"insert\",\"abc\"],[\"insert\",\"abd\"],[\"startsWith\",\"ab\"],[\"search\",\"ab\"]]"],"expected":"[null,null,null,true,false]"},
    {"inputs":["[[\"Trie\"],[\"insert\",\"ab\"],[\"insert\",\"abc\"],[\"search\",\"ab\"],[\"search\",\"abc\"]]"],"expected":"[null,null,null,true,true]"}
  ]'::jsonb
WHERE id = 'implement-trie';

UPDATE public."PGcode_problems" SET
  method_name = 'WordDictionary',
  params = '[{"name":"operations","type":"List[List]"}]'::jsonb,
  return_type = 'List',
  test_cases = '[
    {"inputs":["[[\"WordDictionary\"],[\"addWord\",\"bad\"],[\"addWord\",\"dad\"],[\"addWord\",\"mad\"],[\"search\",\"pad\"],[\"search\",\"bad\"],[\"search\",\".ad\"],[\"search\",\"b..\"]]"],"expected":"[null,null,null,null,false,true,true,true]"},
    {"inputs":["[[\"WordDictionary\"],[\"addWord\",\"a\"],[\"search\",\"a\"]]"],"expected":"[null,null,true]"},
    {"inputs":["[[\"WordDictionary\"],[\"search\",\"abc\"]]"],"expected":"[null,false]"},
    {"inputs":["[[\"WordDictionary\"],[\"addWord\",\"at\"],[\"addWord\",\"and\"],[\"addWord\",\"an\"],[\"search\",\"a\"],[\"search\",\".at\"]]"],"expected":"[null,null,null,null,false,false]"},
    {"inputs":["[[\"WordDictionary\"],[\"addWord\",\"hello\"],[\"search\",\"h.llo\"],[\"search\",\".....\"]]"],"expected":"[null,null,true,true]"},
    {"inputs":["[[\"WordDictionary\"],[\"addWord\",\"a\"],[\"addWord\",\"ab\"],[\"search\",\".\"],[\"search\",\".b\"]]"],"expected":"[null,null,null,true,true]"}
  ]'::jsonb
WHERE id = 'design-add-search';

UPDATE public."PGcode_problems" SET
  method_name = 'findWords',
  params = '[{"name":"board","type":"List[List[str]]"},{"name":"words","type":"List[str]"}]'::jsonb,
  return_type = 'List[str]',
  test_cases = '[
    {"inputs":["[[\"o\",\"a\",\"a\",\"n\"],[\"e\",\"t\",\"a\",\"e\"],[\"i\",\"h\",\"k\",\"r\"],[\"i\",\"f\",\"l\",\"v\"]]","[\"oath\",\"pea\",\"eat\",\"rain\"]"],"expected":"[\"eat\",\"oath\"]"},
    {"inputs":["[[\"a\",\"b\"],[\"c\",\"d\"]]","[\"abcb\"]"],"expected":"[]"},
    {"inputs":["[[\"a\"]]","[\"a\"]"],"expected":"[\"a\"]"},
    {"inputs":["[[\"a\",\"b\"],[\"a\",\"a\"]]","[\"aba\",\"baa\",\"bab\",\"aaab\",\"aaa\"]"],"expected":"[\"aaa\",\"aaab\",\"aba\",\"baa\"]"},
    {"inputs":["[[\"a\"]]","[\"b\"]"],"expected":"[]"},
    {"inputs":["[[\"a\",\"a\"],[\"a\",\"a\"]]","[\"aaaa\"]"],"expected":"[\"aaaa\"]"}
  ]'::jsonb
WHERE id = 'word-search-ii';

COMMIT;

SELECT
  COUNT(*) FILTER (WHERE position('Example' in description) > 0 AND array_length(hints,1) >= 3) AS gold_descriptions,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE test_cases IS NULL OR jsonb_array_length(test_cases)=0) AS no_tests,
  COUNT(*) FILTER (WHERE method_name IS NULL) AS no_signature
FROM public."PGcode_problems";
