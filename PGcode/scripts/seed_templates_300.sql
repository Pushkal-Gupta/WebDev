-- Code templates for PGcode 300 real problems
INSERT INTO public."PGcode_problem_templates" (problem_id, language, code)
VALUES
-- Arrays
('group-anagrams', 'python', 'class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        pass'),
('group-anagrams', 'javascript', 'var groupAnagrams = function(strs) {

};'),
('top-k-frequent', 'python', 'class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        pass'),
('product-except-self', 'python', 'class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        pass'),
('longest-consecutive', 'python', 'class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        pass'),

-- Two Pointers
('three-sum', 'python', 'class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        pass'),
('container-most-water', 'python', 'class Solution:
    def maxArea(self, height: List[int]) -> int:
        pass'),
('trapping-rain-water', 'python', 'class Solution:
    def trap(self, height: List[int]) -> int:
        pass'),

-- Stack
('min-stack', 'python', 'class MinStack:
    def __init__(self):
        pass
    def push(self, val: int) -> None:
        pass
    def pop(self) -> None:
        pass
    def top(self) -> int:
        pass
    def getMin(self) -> int:
        pass'),
('daily-temperatures', 'python', 'class Solution:
    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
        pass'),

-- Binary Search
('search-rotated', 'python', 'class Solution:
    def search(self, nums: List[int], target: int) -> int:
        pass'),
('koko-bananas', 'python', 'class Solution:
    def minEatingSpeed(self, piles: List[int], h: int) -> int:
        pass'),

-- Sliding Window
('longest-substr-no-repeat', 'python', 'class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        pass'),
('min-window-substring', 'python', 'class Solution:
    def minWindow(self, s: str, t: str) -> str:
        pass'),

-- Trees
('invert-binary-tree', 'python', 'class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        pass'),
('max-depth-binary-tree', 'python', 'class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        pass'),
('level-order-traversal', 'python', 'class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:
        pass'),

-- Graphs
('num-islands', 'python', 'class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        pass'),
('course-schedule', 'python', 'class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        pass'),

-- DP
('climbing-stairs', 'python', 'class Solution:
    def climbStairs(self, n: int) -> int:
        pass'),
('house-robber', 'python', 'class Solution:
    def rob(self, nums: List[int]) -> int:
        pass'),
('coin-change', 'python', 'class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        pass'),

-- Backtracking
('subsets', 'python', 'class Solution:
    def subsets(self, nums: List[int]) -> List[List[int]]:
        pass'),
('combination-sum', 'python', 'class Solution:
    def combinationSum(self, candidates: List[int], target: int) -> List[List[int]]:
        pass'),
('permutations', 'python', 'class Solution:
    def permute(self, nums: List[int]) -> List[List[int]]:
        pass'),

-- Greedy
('max-subarray', 'python', 'class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        pass'),
('jump-game', 'python', 'class Solution:
    def canJump(self, nums: List[int]) -> bool:
        pass'),

-- Intervals
('merge-intervals', 'python', 'class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        pass'),

-- Heap
('kth-largest-element', 'python', 'class KthLargest:
    def __init__(self, k: int, nums: List[int]):
        pass
    def add(self, val: int) -> int:
        pass'),
('task-scheduler', 'python', 'class Solution:
    def leastInterval(self, tasks: List[str], n: int) -> int:
        pass'),

-- Tries
('implement-trie', 'python', 'class Trie:
    def __init__(self):
        pass
    def insert(self, word: str) -> None:
        pass
    def search(self, word: str) -> bool:
        pass
    def startsWith(self, prefix: str) -> bool:
        pass'),

-- 2D DP
('longest-common-subseq', 'python', 'class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        pass'),
('edit-distance', 'python', 'class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        pass'),

-- Advanced Graphs
('network-delay', 'python', 'class Solution:
    def networkDelayTime(self, times: List[List[int]], n: int, k: int) -> int:
        pass'),
('cheapest-flights', 'python', 'class Solution:
    def findCheapestPrice(self, n: int, flights: List[List[int]], src: int, dst: int, k: int) -> int:
        pass'),

-- Linked List
('reverse-linked-list', 'python', 'class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        pass'),
('merge-two-sorted', 'python', 'class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        pass'),
('linked-list-cycle', 'python', 'class Solution:
    def hasCycle(self, head: Optional[ListNode]) -> bool:
        pass'),

-- Math & Bit
('rotate-image', 'python', 'class Solution:
    def rotate(self, matrix: List[List[int]]) -> None:
        pass'),
('single-number', 'python', 'class Solution:
    def singleNumber(self, nums: List[int]) -> int:
        pass')
ON CONFLICT DO NOTHING;
