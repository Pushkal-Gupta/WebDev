export const initialNodes = [
  { id: "arrays", type: "custom", position: { x: 400, y: 0 }, data: { label: "Arrays & Hashing", category: 'structures' } },
  { id: "two-pointers", type: "custom", position: { x: 200, y: 150 }, data: { label: "Two Pointers", category: 'algorithms' } },
  { id: "stack", type: "custom", position: { x: 600, y: 150 }, data: { label: "Stack", category: 'structures' } },
  { id: "binary-search", type: "custom", position: { x: 50, y: 300 }, data: { label: "Binary Search", category: 'algorithms' } },
  { id: "sliding-window", type: "custom", position: { x: 350, y: 300 }, data: { label: "Sliding Window", category: 'algorithms' } },
  { id: "linked-list", type: "custom", position: { x: 650, y: 300 }, data: { label: "Linked List", category: 'structures' } },
  { id: "trees", type: "custom", position: { x: 400, y: 450 }, data: { label: "Trees", category: 'structures' } },
  { id: "tries", type: "custom", position: { x: 200, y: 600 }, data: { label: "Tries", category: 'structures' } },
  { id: "heap", type: "custom", position: { x: 600, y: 600 }, data: { label: "Heap / Priority Queue", category: 'structures' } },
  { id: "backtracking", type: "custom", position: { x: 400, y: 600 }, data: { label: "Backtracking", category: 'optimization' } },
  { id: "graphs", type: "custom", position: { x: 250, y: 750 }, data: { label: "Graphs", category: 'algorithms' } },
  { id: "1d-dp", type: "custom", position: { x: 550, y: 750 }, data: { label: "1-D DP", category: 'optimization' } }
];

export const initialEdges = [
  { id: "e1", source: "arrays", target: "two-pointers" },
  { id: "e2", source: "arrays", target: "stack" },
  { id: "e3", source: "two-pointers", target: "binary-search" },
  { id: "e4", source: "two-pointers", target: "sliding-window" },
  { id: "e5", source: "two-pointers", target: "linked-list" },
  { id: "e6", source: "linked-list", target: "trees" },
  { id: "e7", source: "trees", target: "tries" },
  { id: "e8", source: "trees", target: "backtracking" },
  { id: "e9", source: "trees", target: "heap" },
  { id: "e10", source: "backtracking", target: "graphs" },
  { id: "e11", source: "backtracking", target: "1d-dp" }
];

export const problemsData = {
  "arrays": {
    name: "Arrays & Hashing",
    problems: [
      {
        id: "contains-duplicate",
        name: "Contains Duplicate",
        difficulty: "Easy",
        videoEmbed: "https://www.youtube.com/embed/3OamzN90kPg",
        description: `Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.`,
        defaultCode: {
          python: `class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        # Write your code here
        pass`,
          javascript: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var containsDuplicate = function(nums) {
    // Write your code here
};`,
          java: `class Solution {
    public boolean containsDuplicate(int[] nums) {
        // Write your code here
        return false;
    }
}`
        }
      },
      {
        id: "valid-anagram",
        name: "Valid Anagram",
        difficulty: "Easy",
        videoEmbed: "https://www.youtube.com/embed/9UtInBqnCgA",
        description: `Given two strings s and t, return true if t is an anagram of s, and false otherwise.`,
        defaultCode: {
          python: "class Solution..."
        }
      }
    ]
  },
  "two-pointers": {
    name: "Two Pointers",
    problems: [
      {
        id: "valid-palindrome",
        name: "Valid Palindrome",
        difficulty: "Easy",
        videoEmbed: "https://www.youtube.com/embed/jJXJ16kPFWg",
        description: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.`,
        defaultCode: {
          python: "class Solution..."
        }
      }
    ]
  }
};
