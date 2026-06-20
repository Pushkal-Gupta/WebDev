-- Starter templates for the 40 problems missing them.
-- python / javascript / java each.
BEGIN;

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES

-- two-sum
('two-sum','python',$$class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Write your code here
        pass
$$),
('two-sum','javascript',$$var twoSum = function(nums, target) {
    // Write your code here
};
$$),
('two-sum','java',$$class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
        return new int[0];
    }
}
$$),

-- contains-duplicate
('contains-duplicate','python',$$class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        # Write your code here
        pass
$$),
('contains-duplicate','javascript',$$var containsDuplicate = function(nums) {
    // Write your code here
};
$$),
('contains-duplicate','java',$$class Solution {
    public boolean containsDuplicate(int[] nums) {
        // Write your code here
        return false;
    }
}
$$),

-- valid-anagram
('valid-anagram','python',$$class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        # Write your code here
        pass
$$),
('valid-anagram','javascript',$$var isAnagram = function(s, t) {
    // Write your code here
};
$$),
('valid-anagram','java',$$class Solution {
    public boolean isAnagram(String s, String t) {
        // Write your code here
        return false;
    }
}
$$),

-- valid-palindrome
('valid-palindrome','python',$$class Solution:
    def isPalindrome(self, s: str) -> bool:
        # Write your code here
        pass
$$),
('valid-palindrome','javascript',$$var isPalindrome = function(s) {
    // Write your code here
};
$$),
('valid-palindrome','java',$$class Solution {
    public boolean isPalindrome(String s) {
        // Write your code here
        return false;
    }
}
$$),

-- two-sum-ii
('two-sum-ii','python',$$class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        # Write your code here
        pass
$$),
('two-sum-ii','javascript',$$var twoSum = function(numbers, target) {
    // Write your code here
};
$$),
('two-sum-ii','java',$$class Solution {
    public int[] twoSum(int[] numbers, int target) {
        // Write your code here
        return new int[0];
    }
}
$$),

-- valid-parentheses
('valid-parentheses','python',$$class Solution:
    def isValid(self, s: str) -> bool:
        # Write your code here
        pass
$$),
('valid-parentheses','javascript',$$var isValid = function(s) {
    // Write your code here
};
$$),
('valid-parentheses','java',$$class Solution {
    public boolean isValid(String s) {
        // Write your code here
        return false;
    }
}
$$),

-- car-fleet
('car-fleet','python',$$class Solution:
    def carFleet(self, target: int, position: List[int], speed: List[int]) -> int:
        # Write your code here
        pass
$$),
('car-fleet','javascript',$$var carFleet = function(target, position, speed) {
    // Write your code here
};
$$),
('car-fleet','java',$$class Solution {
    public int carFleet(int target, int[] position, int[] speed) {
        // Write your code here
        return 0;
    }
}
$$),

-- best-time-to-buy-sell-stock
('best-time-to-buy-sell-stock','python',$$class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        # Write your code here
        pass
$$),
('best-time-to-buy-sell-stock','javascript',$$var maxProfit = function(prices) {
    // Write your code here
};
$$),
('best-time-to-buy-sell-stock','java',$$class Solution {
    public int maxProfit(int[] prices) {
        // Write your code here
        return 0;
    }
}
$$),

-- longest-repeating-char
('longest-repeating-char','python',$$class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        # Write your code here
        pass
$$),
('longest-repeating-char','javascript',$$var characterReplacement = function(s, k) {
    // Write your code here
};
$$),
('longest-repeating-char','java',$$class Solution {
    public int characterReplacement(String s, int k) {
        // Write your code here
        return 0;
    }
}
$$),

-- permutation-in-string
('permutation-in-string','python',$$class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        # Write your code here
        pass
$$),
('permutation-in-string','javascript',$$var checkInclusion = function(s1, s2) {
    // Write your code here
};
$$),
('permutation-in-string','java',$$class Solution {
    public boolean checkInclusion(String s1, String s2) {
        // Write your code here
        return false;
    }
}
$$),

-- reorder-list
('reorder-list','python',$$class Solution:
    def reorderList(self, head: Optional[ListNode]) -> None:
        # Write your code here. Modify head in-place.
        pass
$$),
('reorder-list','javascript',$$var reorderList = function(head) {
    // Write your code here. Modify head in-place.
};
$$),
('reorder-list','java',$$class Solution {
    public void reorderList(ListNode head) {
        // Write your code here. Modify head in-place.
    }
}
$$),

-- same-tree
('same-tree','python',$$class Solution:
    def isSameTree(self, p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:
        # Write your code here
        pass
$$),
('same-tree','javascript',$$var isSameTree = function(p, q) {
    // Write your code here
};
$$),
('same-tree','java',$$class Solution {
    public boolean isSameTree(TreeNode p, TreeNode q) {
        // Write your code here
        return false;
    }
}
$$),

-- subtree-of-another
('subtree-of-another','python',$$class Solution:
    def isSubtree(self, root: Optional[TreeNode], subRoot: Optional[TreeNode]) -> bool:
        # Write your code here
        pass
$$),
('subtree-of-another','javascript',$$var isSubtree = function(root, subRoot) {
    // Write your code here
};
$$),
('subtree-of-another','java',$$class Solution {
    public boolean isSubtree(TreeNode root, TreeNode subRoot) {
        // Write your code here
        return false;
    }
}
$$),

-- design-add-search
('design-add-search','python',$$class WordDictionary:
    def __init__(self):
        # Write your code here
        pass

    def addWord(self, word: str) -> None:
        # Write your code here
        pass

    def search(self, word: str) -> bool:
        # Write your code here
        pass
$$),
('design-add-search','javascript',$$var WordDictionary = function() {
    // Write your code here
};

WordDictionary.prototype.addWord = function(word) {
    // Write your code here
};

WordDictionary.prototype.search = function(word) {
    // Write your code here
};
$$),
('design-add-search','java',$$class WordDictionary {
    public WordDictionary() {
        // Write your code here
    }

    public void addWord(String word) {
        // Write your code here
    }

    public boolean search(String word) {
        // Write your code here
        return false;
    }
}
$$),

-- word-search-ii
('word-search-ii','python',$$class Solution:
    def findWords(self, board: List[List[str]], words: List[str]) -> List[str]:
        # Write your code here
        pass
$$),
('word-search-ii','javascript',$$var findWords = function(board, words) {
    // Write your code here
};
$$),
('word-search-ii','java',$$class Solution {
    public List<String> findWords(char[][] board, String[] words) {
        // Write your code here
        return new ArrayList<>();
    }
}
$$),

-- find-min-rotated
('find-min-rotated','python',$$class Solution:
    def findMin(self, nums: List[int]) -> int:
        # Write your code here
        pass
$$),
('find-min-rotated','javascript',$$var findMin = function(nums) {
    // Write your code here
};
$$),
('find-min-rotated','java',$$class Solution {
    public int findMin(int[] nums) {
        // Write your code here
        return 0;
    }
}
$$),

-- search-2d-matrix
('search-2d-matrix','python',$$class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        # Write your code here
        pass
$$),
('search-2d-matrix','javascript',$$var searchMatrix = function(matrix, target) {
    // Write your code here
};
$$),
('search-2d-matrix','java',$$class Solution {
    public boolean searchMatrix(int[][] matrix, int target) {
        // Write your code here
        return false;
    }
}
$$),

-- counting-bits
('counting-bits','python',$$class Solution:
    def countBits(self, n: int) -> List[int]:
        # Write your code here
        pass
$$),
('counting-bits','javascript',$$var countBits = function(n) {
    // Write your code here
};
$$),
('counting-bits','java',$$class Solution {
    public int[] countBits(int n) {
        // Write your code here
        return new int[0];
    }
}
$$),

-- number-of-1-bits
('number-of-1-bits','python',$$class Solution:
    def hammingWeight(self, n: int) -> int:
        # Write your code here
        pass
$$),
('number-of-1-bits','javascript',$$var hammingWeight = function(n) {
    // Write your code here
};
$$),
('number-of-1-bits','java',$$public class Solution {
    public int hammingWeight(int n) {
        // Write your code here
        return 0;
    }
}
$$),

-- reverse-bits
('reverse-bits','python',$$class Solution:
    def reverseBits(self, n: int) -> int:
        # Write your code here
        pass
$$),
('reverse-bits','javascript',$$var reverseBits = function(n) {
    // Write your code here
};
$$),
('reverse-bits','java',$$public class Solution {
    public int reverseBits(int n) {
        // Write your code here
        return 0;
    }
}
$$),

-- longest-increasing-subseq
('longest-increasing-subseq','python',$$class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        # Write your code here
        pass
$$),
('longest-increasing-subseq','javascript',$$var lengthOfLIS = function(nums) {
    // Write your code here
};
$$),
('longest-increasing-subseq','java',$$class Solution {
    public int lengthOfLIS(int[] nums) {
        // Write your code here
        return 0;
    }
}
$$),

-- unique-paths
('unique-paths','python',$$class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        # Write your code here
        pass
$$),
('unique-paths','javascript',$$var uniquePaths = function(m, n) {
    // Write your code here
};
$$),
('unique-paths','java',$$class Solution {
    public int uniquePaths(int m, int n) {
        // Write your code here
        return 0;
    }
}
$$),

-- word-break
('word-break','python',$$class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        # Write your code here
        pass
$$),
('word-break','javascript',$$var wordBreak = function(s, wordDict) {
    // Write your code here
};
$$),
('word-break','java',$$class Solution {
    public boolean wordBreak(String s, List<String> wordDict) {
        // Write your code here
        return false;
    }
}
$$),

-- target-sum
('target-sum','python',$$class Solution:
    def findTargetSumWays(self, nums: List[int], target: int) -> int:
        # Write your code here
        pass
$$),
('target-sum','javascript',$$var findTargetSumWays = function(nums, target) {
    // Write your code here
};
$$),
('target-sum','java',$$class Solution {
    public int findTargetSumWays(int[] nums, int target) {
        // Write your code here
        return 0;
    }
}
$$),

-- word-search
('word-search','python',$$class Solution:
    def exist(self, board: List[List[str]], word: str) -> bool:
        # Write your code here
        pass
$$),
('word-search','javascript',$$var exist = function(board, word) {
    // Write your code here
};
$$),
('word-search','java',$$class Solution {
    public boolean exist(char[][] board, String word) {
        // Write your code here
        return false;
    }
}
$$),

-- clone-graph
('clone-graph','python',$$class Solution:
    def cloneGraph(self, node: 'Optional[Node]') -> 'Optional[Node]':
        # Write your code here
        pass
$$),
('clone-graph','javascript',$$var cloneGraph = function(node) {
    // Write your code here
};
$$),
('clone-graph','java',$$class Solution {
    public Node cloneGraph(Node node) {
        // Write your code here
        return null;
    }
}
$$),

-- pacific-atlantic
('pacific-atlantic','python',$$class Solution:
    def pacificAtlantic(self, heights: List[List[int]]) -> List[List[int]]:
        # Write your code here
        pass
$$),
('pacific-atlantic','javascript',$$var pacificAtlantic = function(heights) {
    // Write your code here
};
$$),
('pacific-atlantic','java',$$class Solution {
    public List<List<Integer>> pacificAtlantic(int[][] heights) {
        // Write your code here
        return new ArrayList<>();
    }
}
$$),

-- rotting-oranges
('rotting-oranges','python',$$class Solution:
    def orangesRotting(self, grid: List[List[int]]) -> int:
        # Write your code here
        pass
$$),
('rotting-oranges','javascript',$$var orangesRotting = function(grid) {
    // Write your code here
};
$$),
('rotting-oranges','java',$$class Solution {
    public int orangesRotting(int[][] grid) {
        // Write your code here
        return 0;
    }
}
$$),

-- alien-dictionary
('alien-dictionary','python',$$class Solution:
    def alienOrder(self, words: List[str]) -> str:
        # Write your code here
        pass
$$),
('alien-dictionary','javascript',$$var alienOrder = function(words) {
    // Write your code here
};
$$),
('alien-dictionary','java',$$class Solution {
    public String alienOrder(String[] words) {
        // Write your code here
        return "";
    }
}
$$),

-- swim-in-water
('swim-in-water','python',$$class Solution:
    def swimInWater(self, grid: List[List[int]]) -> int:
        # Write your code here
        pass
$$),
('swim-in-water','javascript',$$var swimInWater = function(grid) {
    // Write your code here
};
$$),
('swim-in-water','java',$$class Solution {
    public int swimInWater(int[][] grid) {
        // Write your code here
        return 0;
    }
}
$$),

-- gas-station
('gas-station','python',$$class Solution:
    def canCompleteCircuit(self, gas: List[int], cost: List[int]) -> int:
        # Write your code here
        pass
$$),
('gas-station','javascript',$$var canCompleteCircuit = function(gas, cost) {
    // Write your code here
};
$$),
('gas-station','java',$$class Solution {
    public int canCompleteCircuit(int[] gas, int[] cost) {
        // Write your code here
        return 0;
    }
}
$$),

-- hand-of-straights
('hand-of-straights','python',$$class Solution:
    def isNStraightHand(self, hand: List[int], groupSize: int) -> bool:
        # Write your code here
        pass
$$),
('hand-of-straights','javascript',$$var isNStraightHand = function(hand, groupSize) {
    // Write your code here
};
$$),
('hand-of-straights','java',$$class Solution {
    public boolean isNStraightHand(int[] hand, int groupSize) {
        // Write your code here
        return false;
    }
}
$$),

-- k-closest-points
('k-closest-points','python',$$class Solution:
    def kClosest(self, points: List[List[int]], k: int) -> List[List[int]]:
        # Write your code here
        pass
$$),
('k-closest-points','javascript',$$var kClosest = function(points, k) {
    // Write your code here
};
$$),
('k-closest-points','java',$$class Solution {
    public int[][] kClosest(int[][] points, int k) {
        // Write your code here
        return new int[0][0];
    }
}
$$),

-- last-stone-weight
('last-stone-weight','python',$$class Solution:
    def lastStoneWeight(self, stones: List[int]) -> int:
        # Write your code here
        pass
$$),
('last-stone-weight','javascript',$$var lastStoneWeight = function(stones) {
    // Write your code here
};
$$),
('last-stone-weight','java',$$class Solution {
    public int lastStoneWeight(int[] stones) {
        // Write your code here
        return 0;
    }
}
$$),

-- insert-interval
('insert-interval','python',$$class Solution:
    def insert(self, intervals: List[List[int]], newInterval: List[int]) -> List[List[int]]:
        # Write your code here
        pass
$$),
('insert-interval','javascript',$$var insert = function(intervals, newInterval) {
    // Write your code here
};
$$),
('insert-interval','java',$$class Solution {
    public int[][] insert(int[][] intervals, int[] newInterval) {
        // Write your code here
        return new int[0][0];
    }
}
$$),

-- meeting-rooms
('meeting-rooms','python',$$class Solution:
    def canAttendMeetings(self, intervals: List[List[int]]) -> bool:
        # Write your code here
        pass
$$),
('meeting-rooms','javascript',$$var canAttendMeetings = function(intervals) {
    // Write your code here
};
$$),
('meeting-rooms','java',$$class Solution {
    public boolean canAttendMeetings(int[][] intervals) {
        // Write your code here
        return false;
    }
}
$$),

-- non-overlapping-intervals
('non-overlapping-intervals','python',$$class Solution:
    def eraseOverlapIntervals(self, intervals: List[List[int]]) -> int:
        # Write your code here
        pass
$$),
('non-overlapping-intervals','javascript',$$var eraseOverlapIntervals = function(intervals) {
    // Write your code here
};
$$),
('non-overlapping-intervals','java',$$class Solution {
    public int eraseOverlapIntervals(int[][] intervals) {
        // Write your code here
        return 0;
    }
}
$$),

-- happy-number
('happy-number','python',$$class Solution:
    def isHappy(self, n: int) -> bool:
        # Write your code here
        pass
$$),
('happy-number','javascript',$$var isHappy = function(n) {
    // Write your code here
};
$$),
('happy-number','java',$$class Solution {
    public boolean isHappy(int n) {
        // Write your code here
        return false;
    }
}
$$),

-- set-matrix-zeroes
('set-matrix-zeroes','python',$$class Solution:
    def setZeroes(self, matrix: List[List[int]]) -> None:
        # Write your code here. Modify matrix in-place.
        pass
$$),
('set-matrix-zeroes','javascript',$$var setZeroes = function(matrix) {
    // Write your code here. Modify matrix in-place.
};
$$),
('set-matrix-zeroes','java',$$class Solution {
    public void setZeroes(int[][] matrix) {
        // Write your code here. Modify matrix in-place.
    }
}
$$),

-- spiral-matrix
('spiral-matrix','python',$$class Solution:
    def spiralOrder(self, matrix: List[List[int]]) -> List[int]:
        # Write your code here
        pass
$$),
('spiral-matrix','javascript',$$var spiralOrder = function(matrix) {
    // Write your code here
};
$$),
('spiral-matrix','java',$$class Solution {
    public List<Integer> spiralOrder(int[][] matrix) {
        // Write your code here
        return new ArrayList<>();
    }
}
$$),

-- rotate-image (math, may already have? add anyway with ON CONFLICT-style guard via NOT EXISTS handled below)
('rotate-image','python',$$class Solution:
    def rotate(self, matrix: List[List[int]]) -> None:
        # Write your code here. Modify matrix in-place.
        pass
$$),
('rotate-image','javascript',$$var rotate = function(matrix) {
    // Write your code here. Modify matrix in-place.
};
$$),
('rotate-image','java',$$class Solution {
    public void rotate(int[][] matrix) {
        // Write your code here. Modify matrix in-place.
    }
}
$$)
ON CONFLICT (problem_id, language) DO NOTHING;

COMMIT;

SELECT
  (SELECT COUNT(*) FROM public."PGcode_problems") AS total_problems,
  (SELECT COUNT(DISTINCT problem_id) FROM public."PGcode_problem_templates") AS problems_with_templates,
  (SELECT COUNT(*) FROM public."PGcode_problems"
    WHERE NOT EXISTS (SELECT 1 FROM public."PGcode_problem_templates" t WHERE t.problem_id = "PGcode_problems".id)) AS still_missing;
