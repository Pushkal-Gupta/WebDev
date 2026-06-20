#!/usr/bin/env node
// Generates SQL inserts for ~60 problem stubs across pattern templates.
// Output goes to scripts/migrate-23-seed-problems.sql for manual review +
// application in the Supabase SQL editor. Idempotent via ON CONFLICT.
//
// Each stub has:
//   - stable slug-style id
//   - canonical name
//   - topic_id (must match an existing PGcode_topics row)
//   - difficulty
//   - short description
//   - tags array
//   - method signature (method_name + params + return_type)
//   - 2 test_cases
//
// The generator is template-driven so re-running produces stable output.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, 'migrate-23-seed-problems.sql');

// Helper to escape SQL strings safely
const sq = (s) => `'${String(s).replace(/'/g, "''")}'`;
const jsonLit = (obj) => sq(JSON.stringify(obj));

// Postgres array literal for text[]
const textArrayLit = (arr) => `ARRAY[${arr.map(s => sq(s)).join(', ')}]::TEXT[]`;

// Problem templates per topic. Each entry:
//   { id, name, difficulty, description, tags, method_name, params, return_type, test_cases }
const STUBS = [
  // ── Arrays ──
  { id: 'two-sum-stub', name: 'Two Sum', topic: 'arrays', difficulty: 'Easy',
    description: 'Given an array of integers and a target, return the indices of the two numbers that add up to the target. Assume exactly one solution.',
    tags: ['array','hash-map'],
    method_name: 'twoSum', params: [{name:'nums',type:'int[]'},{name:'target',type:'int'}], return_type: 'int[]',
    tests: [{ inputs: ['[2,7,11,15]','9'], expected: '[0,1]' }, { inputs: ['[3,2,4]','6'], expected: '[1,2]' }] },
  { id: 'best-time-stock-stub', name: 'Best Time to Buy and Sell Stock', topic: 'arrays', difficulty: 'Easy',
    description: 'Given an array of prices where prices[i] is the price on day i, return the maximum profit from a single buy/sell.',
    tags: ['array','greedy'],
    method_name: 'maxProfit', params: [{name:'prices',type:'int[]'}], return_type: 'int',
    tests: [{ inputs: ['[7,1,5,3,6,4]'], expected: '5' }, { inputs: ['[7,6,4,3,1]'], expected: '0' }] },
  { id: 'contains-duplicate-stub', name: 'Contains Duplicate', topic: 'arrays', difficulty: 'Easy',
    description: 'Return true if any value appears at least twice in the array.',
    tags: ['array','hash-set'],
    method_name: 'containsDuplicate', params: [{name:'nums',type:'int[]'}], return_type: 'bool',
    tests: [{ inputs: ['[1,2,3,1]'], expected: 'true' }, { inputs: ['[1,2,3,4]'], expected: 'false' }] },
  { id: 'product-except-self-stub', name: 'Product of Array Except Self', topic: 'arrays', difficulty: 'Medium',
    description: 'Return an array where output[i] is the product of all elements of nums except nums[i]. Do it without division and in O(n).',
    tags: ['array','prefix-product'],
    method_name: 'productExceptSelf', params: [{name:'nums',type:'int[]'}], return_type: 'int[]',
    tests: [{ inputs: ['[1,2,3,4]'], expected: '[24,12,8,6]' }] },
  { id: 'max-subarray-stub', name: 'Maximum Subarray', topic: 'arrays', difficulty: 'Medium',
    description: 'Find the contiguous subarray with the largest sum and return its sum (Kadane).',
    tags: ['array','dp'],
    method_name: 'maxSubArray', params: [{name:'nums',type:'int[]'}], return_type: 'int',
    tests: [{ inputs: ['[-2,1,-3,4,-1,2,1,-5,4]'], expected: '6' }] },

  // ── Strings ──
  { id: 'valid-anagram-stub', name: 'Valid Anagram', topic: 'strings', difficulty: 'Easy',
    description: 'Return true if t is an anagram of s.',
    tags: ['string','hash-map','sort'],
    method_name: 'isAnagram', params: [{name:'s',type:'string'},{name:'t',type:'string'}], return_type: 'bool',
    tests: [{ inputs: ['"anagram"','"nagaram"'], expected: 'true' }, { inputs: ['"rat"','"car"'], expected: 'false' }] },
  { id: 'valid-palindrome-stub', name: 'Valid Palindrome', topic: 'strings', difficulty: 'Easy',
    description: 'Return true if a string is a palindrome after removing non-alphanumeric characters and lowercasing.',
    tags: ['string','two-pointers'],
    method_name: 'isPalindrome', params: [{name:'s',type:'string'}], return_type: 'bool',
    tests: [{ inputs: ['"A man, a plan, a canal: Panama"'], expected: 'true' }, { inputs: ['"race a car"'], expected: 'false' }] },
  { id: 'longest-substring-unique-stub', name: 'Longest Substring Without Repeating Characters', topic: 'strings', difficulty: 'Medium',
    description: 'Return the length of the longest substring without repeating characters.',
    tags: ['string','sliding-window'],
    method_name: 'lengthOfLongestSubstring', params: [{name:'s',type:'string'}], return_type: 'int',
    tests: [{ inputs: ['"abcabcbb"'], expected: '3' }, { inputs: ['"bbbbb"'], expected: '1' }] },
  { id: 'group-anagrams-stub', name: 'Group Anagrams', topic: 'strings', difficulty: 'Medium',
    description: 'Group a list of strings into anagram buckets. Return the groups in any order.',
    tags: ['string','hash-map'],
    method_name: 'groupAnagrams', params: [{name:'strs',type:'string[]'}], return_type: 'string[][]',
    tests: [{ inputs: ['["eat","tea","tan","ate","nat","bat"]'], expected: '[["eat","tea","ate"],["tan","nat"],["bat"]]' }] },

  // ── Two pointers ──
  { id: 'two-sum-sorted-stub', name: 'Two Sum II - Sorted Array', topic: 'two-pointers', difficulty: 'Medium',
    description: 'Given a 1-indexed sorted array, return the two indices that sum to target.',
    tags: ['two-pointers','binary-search'],
    method_name: 'twoSumSorted', params: [{name:'numbers',type:'int[]'},{name:'target',type:'int'}], return_type: 'int[]',
    tests: [{ inputs: ['[2,7,11,15]','9'], expected: '[1,2]' }] },
  { id: 'three-sum-stub', name: '3Sum', topic: 'two-pointers', difficulty: 'Medium',
    description: 'Find all unique triplets that sum to zero.',
    tags: ['two-pointers','sort'],
    method_name: 'threeSum', params: [{name:'nums',type:'int[]'}], return_type: 'int[][]',
    tests: [{ inputs: ['[-1,0,1,2,-1,-4]'], expected: '[[-1,-1,2],[-1,0,1]]' }] },
  { id: 'container-most-water-stub', name: 'Container With Most Water', topic: 'two-pointers', difficulty: 'Medium',
    description: 'Pick two indices that hold the most water given heights.',
    tags: ['two-pointers','greedy'],
    method_name: 'maxArea', params: [{name:'height',type:'int[]'}], return_type: 'int',
    tests: [{ inputs: ['[1,8,6,2,5,4,8,3,7]'], expected: '49' }] },

  // ── Sliding window ──
  { id: 'min-window-substring-stub', name: 'Minimum Window Substring', topic: 'sliding-window', difficulty: 'Hard',
    description: 'Return the smallest substring of s that contains every character of t (with multiplicity).',
    tags: ['sliding-window','hash-map'],
    method_name: 'minWindow', params: [{name:'s',type:'string'},{name:'t',type:'string'}], return_type: 'string',
    tests: [{ inputs: ['"ADOBECODEBANC"','"ABC"'], expected: '"BANC"' }] },
  { id: 'longest-repeating-replacement-stub', name: 'Longest Repeating Character Replacement', topic: 'sliding-window', difficulty: 'Medium',
    description: 'Given a string and an integer k, return the length of the longest substring that can be made of one character by replacing at most k characters.',
    tags: ['sliding-window'],
    method_name: 'characterReplacement', params: [{name:'s',type:'string'},{name:'k',type:'int'}], return_type: 'int',
    tests: [{ inputs: ['"ABAB"','2'], expected: '4' }, { inputs: ['"AABABBA"','1'], expected: '4' }] },

  // ── Stack ──
  { id: 'valid-parens-stub', name: 'Valid Parentheses', topic: 'stack', difficulty: 'Easy',
    description: 'Return true if the input string of brackets is correctly matched and nested.',
    tags: ['stack','string'],
    method_name: 'isValid', params: [{name:'s',type:'string'}], return_type: 'bool',
    tests: [{ inputs: ['"()"'], expected: 'true' }, { inputs: ['"(]"'], expected: 'false' }] },
  { id: 'min-stack-stub', name: 'Min Stack', topic: 'stack', difficulty: 'Medium',
    description: 'Design a stack that supports push, pop, top, getMin all in O(1).',
    tags: ['stack','design'],
    method_name: 'minStack', params: [{name:'ops',type:'string[]'},{name:'args',type:'int[]'}], return_type: 'int[]',
    tests: [{ inputs: ['["MinStack","push","push","push","getMin","pop","top","getMin"]','[null,-2,0,-3,null,null,null,null]'], expected: '[null,null,null,null,-3,null,0,-2]' }] },
  { id: 'daily-temperatures-stub', name: 'Daily Temperatures', topic: 'stack', difficulty: 'Medium',
    description: 'For each day, how many days until a warmer temperature? Return 0 if none.',
    tags: ['stack','monotonic'],
    method_name: 'dailyTemperatures', params: [{name:'temps',type:'int[]'}], return_type: 'int[]',
    tests: [{ inputs: ['[73,74,75,71,69,72,76,73]'], expected: '[1,1,4,2,1,1,0,0]' }] },

  // ── Binary search ──
  { id: 'binary-search-stub', name: 'Binary Search', topic: 'binary-search', difficulty: 'Easy',
    description: 'Return the index of target in a sorted array, or -1 if absent.',
    tags: ['binary-search'],
    method_name: 'search', params: [{name:'nums',type:'int[]'},{name:'target',type:'int'}], return_type: 'int',
    tests: [{ inputs: ['[-1,0,3,5,9,12]','9'], expected: '4' }, { inputs: ['[-1,0,3,5,9,12]','2'], expected: '-1' }] },
  { id: 'rotated-sorted-search-stub', name: 'Search in Rotated Sorted Array', topic: 'binary-search', difficulty: 'Medium',
    description: 'Search target in a rotated sorted array in O(log n).',
    tags: ['binary-search'],
    method_name: 'searchRotated', params: [{name:'nums',type:'int[]'},{name:'target',type:'int'}], return_type: 'int',
    tests: [{ inputs: ['[4,5,6,7,0,1,2]','0'], expected: '4' }, { inputs: ['[4,5,6,7,0,1,2]','3'], expected: '-1' }] },
  { id: 'find-peak-stub', name: 'Find Peak Element', topic: 'binary-search', difficulty: 'Medium',
    description: 'Find any index i where nums[i] > nums[i-1] and nums[i] > nums[i+1]. Return that index. O(log n).',
    tags: ['binary-search'],
    method_name: 'findPeakElement', params: [{name:'nums',type:'int[]'}], return_type: 'int',
    tests: [{ inputs: ['[1,2,3,1]'], expected: '2' }] },

  // ── Linked list ──
  { id: 'reverse-list-stub', name: 'Reverse Linked List', topic: 'linkedlist', difficulty: 'Easy',
    description: 'Return the head of the reversed linked list.',
    tags: ['linkedlist'],
    method_name: 'reverseList', params: [{name:'head',type:'ListNode'}], return_type: 'ListNode',
    tests: [{ inputs: ['[1,2,3,4,5]'], expected: '[5,4,3,2,1]' }] },
  { id: 'merge-two-lists-stub', name: 'Merge Two Sorted Lists', topic: 'linkedlist', difficulty: 'Easy',
    description: 'Merge two sorted linked lists into one sorted list.',
    tags: ['linkedlist'],
    method_name: 'mergeTwoLists', params: [{name:'l1',type:'ListNode'},{name:'l2',type:'ListNode'}], return_type: 'ListNode',
    tests: [{ inputs: ['[1,2,4]','[1,3,4]'], expected: '[1,1,2,3,4,4]' }] },
  { id: 'detect-cycle-stub', name: 'Linked List Cycle', topic: 'linkedlist', difficulty: 'Easy',
    description: 'Return true if the linked list has a cycle. Use O(1) extra space.',
    tags: ['linkedlist','two-pointers'],
    method_name: 'hasCycle', params: [{name:'head',type:'ListNode'},{name:'pos',type:'int'}], return_type: 'bool',
    tests: [{ inputs: ['[3,2,0,-4]','1'], expected: 'true' }, { inputs: ['[1,2]','-1'], expected: 'false' }] },

  // ── Trees ──
  { id: 'max-depth-stub', name: 'Maximum Depth of Binary Tree', topic: 'trees', difficulty: 'Easy',
    description: 'Return the maximum depth of a binary tree.',
    tags: ['tree','dfs'],
    method_name: 'maxDepth', params: [{name:'root',type:'TreeNode'}], return_type: 'int',
    tests: [{ inputs: ['[3,9,20,null,null,15,7]'], expected: '3' }] },
  { id: 'invert-tree-stub', name: 'Invert Binary Tree', topic: 'trees', difficulty: 'Easy',
    description: 'Return the mirror of the input tree.',
    tags: ['tree','dfs'],
    method_name: 'invertTree', params: [{name:'root',type:'TreeNode'}], return_type: 'TreeNode',
    tests: [{ inputs: ['[4,2,7,1,3,6,9]'], expected: '[4,7,2,9,6,3,1]' }] },
  { id: 'level-order-stub', name: 'Binary Tree Level Order Traversal', topic: 'trees', difficulty: 'Medium',
    description: 'Return the level-order (BFS) traversal of node values.',
    tags: ['tree','bfs'],
    method_name: 'levelOrder', params: [{name:'root',type:'TreeNode'}], return_type: 'int[][]',
    tests: [{ inputs: ['[3,9,20,null,null,15,7]'], expected: '[[3],[9,20],[15,7]]' }] },
  { id: 'validate-bst-stub', name: 'Validate Binary Search Tree', topic: 'trees', difficulty: 'Medium',
    description: 'Return true if the tree is a valid BST.',
    tags: ['tree','dfs','bst'],
    method_name: 'isValidBST', params: [{name:'root',type:'TreeNode'}], return_type: 'bool',
    tests: [{ inputs: ['[2,1,3]'], expected: 'true' }, { inputs: ['[5,1,4,null,null,3,6]'], expected: 'false' }] },

  // ── Graphs ──
  { id: 'number-islands-stub', name: 'Number of Islands', topic: 'graphs', difficulty: 'Medium',
    description: 'Count the number of distinct islands in a grid of "1"s and "0"s.',
    tags: ['graph','dfs','bfs'],
    method_name: 'numIslands', params: [{name:'grid',type:'char[][]'}], return_type: 'int',
    tests: [{ inputs: ['[["1","1","0"],["0","1","0"],["1","0","1"]]'], expected: '3' }] },
  { id: 'course-schedule-stub', name: 'Course Schedule', topic: 'graphs', difficulty: 'Medium',
    description: 'Given the number of courses and prerequisite pairs, return true if you can finish all.',
    tags: ['graph','topo-sort'],
    method_name: 'canFinish', params: [{name:'numCourses',type:'int'},{name:'prereqs',type:'int[][]'}], return_type: 'bool',
    tests: [{ inputs: ['2','[[1,0]]'], expected: 'true' }, { inputs: ['2','[[1,0],[0,1]]'], expected: 'false' }] },
  { id: 'clone-graph-stub', name: 'Clone Graph', topic: 'graphs', difficulty: 'Medium',
    description: 'Deep-clone an undirected graph.',
    tags: ['graph','dfs','bfs'],
    method_name: 'cloneGraph', params: [{name:'node',type:'Node'}], return_type: 'Node',
    tests: [{ inputs: ['[[2,4],[1,3],[2,4],[1,3]]'], expected: '[[2,4],[1,3],[2,4],[1,3]]' }] },
  { id: 'pacific-atlantic-stub', name: 'Pacific Atlantic Water Flow', topic: 'graphs', difficulty: 'Medium',
    description: 'Return the cells that can flow to both oceans.',
    tags: ['graph','bfs'],
    method_name: 'pacificAtlantic', params: [{name:'heights',type:'int[][]'}], return_type: 'int[][]',
    tests: [{ inputs: ['[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]'], expected: '[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]' }] },

  // ── DP ──
  { id: 'climbing-stairs-stub', name: 'Climbing Stairs', topic: 'dp', difficulty: 'Easy',
    description: 'Number of distinct ways to climb n stairs taking 1 or 2 at a time.',
    tags: ['dp','fibonacci'],
    method_name: 'climbStairs', params: [{name:'n',type:'int'}], return_type: 'int',
    tests: [{ inputs: ['2'], expected: '2' }, { inputs: ['3'], expected: '3' }] },
  { id: 'house-robber-stub', name: 'House Robber', topic: 'dp', difficulty: 'Medium',
    description: 'Maximum money you can rob without robbing two adjacent houses.',
    tags: ['dp'],
    method_name: 'rob', params: [{name:'nums',type:'int[]'}], return_type: 'int',
    tests: [{ inputs: ['[1,2,3,1]'], expected: '4' }, { inputs: ['[2,7,9,3,1]'], expected: '12' }] },
  { id: 'longest-inc-subseq-stub', name: 'Longest Increasing Subsequence', topic: 'dp', difficulty: 'Medium',
    description: 'Return the length of the longest strictly-increasing subsequence.',
    tags: ['dp','binary-search'],
    method_name: 'lengthOfLIS', params: [{name:'nums',type:'int[]'}], return_type: 'int',
    tests: [{ inputs: ['[10,9,2,5,3,7,101,18]'], expected: '4' }] },
  { id: 'word-break-stub', name: 'Word Break', topic: 'dp', difficulty: 'Medium',
    description: 'Return true if s can be segmented into a sequence of words from wordDict.',
    tags: ['dp','string'],
    method_name: 'wordBreak', params: [{name:'s',type:'string'},{name:'wordDict',type:'string[]'}], return_type: 'bool',
    tests: [{ inputs: ['"leetcode"','["leet","code"]'], expected: 'true' }, { inputs: ['"applepenapple"','["apple","pen"]'], expected: 'true' }] },
  { id: 'coin-change-stub', name: 'Coin Change', topic: 'dp', difficulty: 'Medium',
    description: 'Fewest coins to make amount, or -1 if impossible.',
    tags: ['dp'],
    method_name: 'coinChange', params: [{name:'coins',type:'int[]'},{name:'amount',type:'int'}], return_type: 'int',
    tests: [{ inputs: ['[1,2,5]','11'], expected: '3' }, { inputs: ['[2]','3'], expected: '-1' }] },

  // ── Heap ──
  { id: 'top-k-frequent-stub', name: 'Top K Frequent Elements', topic: 'heap', difficulty: 'Medium',
    description: 'Return the k most frequent elements.',
    tags: ['heap','hash-map','bucket-sort'],
    method_name: 'topKFrequent', params: [{name:'nums',type:'int[]'},{name:'k',type:'int'}], return_type: 'int[]',
    tests: [{ inputs: ['[1,1,1,2,2,3]','2'], expected: '[1,2]' }] },
  { id: 'merge-k-lists-stub', name: 'Merge k Sorted Lists', topic: 'heap', difficulty: 'Hard',
    description: 'Merge k sorted linked lists into one sorted list.',
    tags: ['heap','linkedlist'],
    method_name: 'mergeKLists', params: [{name:'lists',type:'ListNode[]'}], return_type: 'ListNode',
    tests: [{ inputs: ['[[1,4,5],[1,3,4],[2,6]]'], expected: '[1,1,2,3,4,4,5,6]' }] },
  { id: 'kth-largest-stub', name: 'Kth Largest Element in an Array', topic: 'heap', difficulty: 'Medium',
    description: 'Return the kth largest element. O(n log k) with a heap of size k.',
    tags: ['heap','quickselect'],
    method_name: 'findKthLargest', params: [{name:'nums',type:'int[]'},{name:'k',type:'int'}], return_type: 'int',
    tests: [{ inputs: ['[3,2,1,5,6,4]','2'], expected: '5' }] },

  // ── Backtracking ──
  { id: 'permutations-stub', name: 'Permutations', topic: 'backtracking', difficulty: 'Medium',
    description: 'Return all permutations of distinct integers.',
    tags: ['backtracking'],
    method_name: 'permute', params: [{name:'nums',type:'int[]'}], return_type: 'int[][]',
    tests: [{ inputs: ['[1,2,3]'], expected: '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]' }] },
  { id: 'subsets-stub', name: 'Subsets', topic: 'backtracking', difficulty: 'Medium',
    description: 'Return all possible subsets of a list of distinct integers.',
    tags: ['backtracking','bitmask'],
    method_name: 'subsets', params: [{name:'nums',type:'int[]'}], return_type: 'int[][]',
    tests: [{ inputs: ['[1,2,3]'], expected: '[[],[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3]]' }] },
  { id: 'combination-sum-stub', name: 'Combination Sum', topic: 'backtracking', difficulty: 'Medium',
    description: 'Return all unique combinations of candidates summing to target (numbers may be reused).',
    tags: ['backtracking','dp'],
    method_name: 'combinationSum', params: [{name:'candidates',type:'int[]'},{name:'target',type:'int'}], return_type: 'int[][]',
    tests: [{ inputs: ['[2,3,6,7]','7'], expected: '[[2,2,3],[7]]' }] },

  // ── Bit manipulation ──
  { id: 'single-number-stub', name: 'Single Number', topic: 'bit-manipulation', difficulty: 'Easy',
    description: 'Every element appears twice except one. Find it in O(n) time and O(1) space.',
    tags: ['bit-manipulation','xor'],
    method_name: 'singleNumber', params: [{name:'nums',type:'int[]'}], return_type: 'int',
    tests: [{ inputs: ['[2,2,1]'], expected: '1' }, { inputs: ['[4,1,2,1,2]'], expected: '4' }] },
  { id: 'counting-bits-stub', name: 'Counting Bits', topic: 'bit-manipulation', difficulty: 'Easy',
    description: 'Return an array ans[i] = the number of 1-bits in i, for i from 0..n.',
    tags: ['bit-manipulation','dp'],
    method_name: 'countBits', params: [{name:'n',type:'int'}], return_type: 'int[]',
    tests: [{ inputs: ['5'], expected: '[0,1,1,2,1,2]' }] },
  { id: 'missing-number-stub', name: 'Missing Number', topic: 'bit-manipulation', difficulty: 'Easy',
    description: 'Find the missing number in an array containing distinct numbers from 0 to n.',
    tags: ['bit-manipulation','math'],
    method_name: 'missingNumber', params: [{name:'nums',type:'int[]'}], return_type: 'int',
    tests: [{ inputs: ['[3,0,1]'], expected: '2' }, { inputs: ['[9,6,4,2,3,5,7,0,1]'], expected: '8' }] },

  // ── Intervals ──
  { id: 'merge-intervals-stub', name: 'Merge Intervals', topic: 'intervals', difficulty: 'Medium',
    description: 'Merge all overlapping intervals.',
    tags: ['intervals','sort'],
    method_name: 'merge', params: [{name:'intervals',type:'int[][]'}], return_type: 'int[][]',
    tests: [{ inputs: ['[[1,3],[2,6],[8,10],[15,18]]'], expected: '[[1,6],[8,10],[15,18]]' }] },
  { id: 'insert-interval-stub', name: 'Insert Interval', topic: 'intervals', difficulty: 'Medium',
    description: 'Insert a new interval into a sorted non-overlapping list, merging if needed.',
    tags: ['intervals'],
    method_name: 'insert', params: [{name:'intervals',type:'int[][]'},{name:'newInterval',type:'int[]'}], return_type: 'int[][]',
    tests: [{ inputs: ['[[1,3],[6,9]]','[2,5]'], expected: '[[1,5],[6,9]]' }] },
  { id: 'non-overlap-intervals-stub', name: 'Non-overlapping Intervals', topic: 'intervals', difficulty: 'Medium',
    description: 'Minimum number of intervals to remove so the rest do not overlap.',
    tags: ['intervals','greedy'],
    method_name: 'eraseOverlapIntervals', params: [{name:'intervals',type:'int[][]'}], return_type: 'int',
    tests: [{ inputs: ['[[1,2],[2,3],[3,4],[1,3]]'], expected: '1' }] },

  // ── Math ──
  { id: 'reverse-integer-stub', name: 'Reverse Integer', topic: 'math', difficulty: 'Medium',
    description: 'Reverse the digits of a signed 32-bit integer. Return 0 on overflow.',
    tags: ['math'],
    method_name: 'reverse', params: [{name:'x',type:'int'}], return_type: 'int',
    tests: [{ inputs: ['123'], expected: '321' }, { inputs: ['-123'], expected: '-321' }] },
  { id: 'palindrome-number-stub', name: 'Palindrome Number', topic: 'math', difficulty: 'Easy',
    description: 'Return true if an integer reads the same forwards and backwards.',
    tags: ['math'],
    method_name: 'isPalindrome', params: [{name:'x',type:'int'}], return_type: 'bool',
    tests: [{ inputs: ['121'], expected: 'true' }, { inputs: ['-121'], expected: 'false' }] },
  { id: 'pow-x-n-stub', name: 'Pow(x, n)', topic: 'math', difficulty: 'Medium',
    description: 'Compute x raised to the power n. O(log n).',
    tags: ['math','binary-exp'],
    method_name: 'myPow', params: [{name:'x',type:'double'},{name:'n',type:'int'}], return_type: 'double',
    tests: [{ inputs: ['2.0','10'], expected: '1024.0' }] },
];

function buildSql() {
  const rows = STUBS.map(s => {
    // tags is TEXT[] in the schema (per migrate-03), not JSONB. Use a Postgres array literal.
    return `('${s.id}', ${sq(s.name)}, ${sq(s.topic)}, ${sq(s.difficulty)}, ${sq(s.description)}, ${textArrayLit(s.tags)}, ${sq(s.method_name)}, ${jsonLit(s.params)}::jsonb, ${sq(s.return_type)}, ${jsonLit(s.tests.map(t => ({ inputs: t.inputs, expected: t.expected })))}::jsonb, 'both')`;
  }).join(',\n  ');

  return `-- Auto-generated by scripts/generate-problem-stubs.js — do not hand-edit; re-run the script.
-- ${STUBS.length} problem stubs spanning common interview patterns. Idempotent.
-- Self-contained: re-runs even if earlier metadata migrations weren't applied.

ALTER TABLE public."PGcode_problems"
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS method_name TEXT,
  ADD COLUMN IF NOT EXISTS params JSONB,
  ADD COLUMN IF NOT EXISTS return_type TEXT,
  ADD COLUMN IF NOT EXISTS test_cases JSONB,
  ADD COLUMN IF NOT EXISTS roadmap_set TEXT;

CREATE INDEX IF NOT EXISTS idx_problems_tags ON public."PGcode_problems" USING GIN (tags);

INSERT INTO public."PGcode_problems"
  (id, name, topic_id, difficulty, description, tags, method_name, params, return_type, test_cases, roadmap_set)
VALUES
  ${rows}
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  topic_id = EXCLUDED.topic_id,
  difficulty = EXCLUDED.difficulty,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  method_name = EXCLUDED.method_name,
  params = EXCLUDED.params,
  return_type = EXCLUDED.return_type,
  test_cases = EXCLUDED.test_cases;
`;
}

fs.writeFileSync(OUT, buildSql());
console.log(`✓ Wrote ${STUBS.length} problem stubs to ${path.relative(process.cwd(), OUT)}`);
console.log('Review then apply in the Supabase SQL editor.');
