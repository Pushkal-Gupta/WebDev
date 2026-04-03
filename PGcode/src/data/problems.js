export const initialNodes = [
  { id: "arrays", type: "default", position: { x: 250, y: 0 }, data: { label: "Arrays & Hashing" } },
  { id: "two-pointers", type: "default", position: { x: 100, y: 100 }, data: { label: "Two Pointers" } },
  { id: "stack", type: "default", position: { x: 400, y: 100 }, data: { label: "Stack" } },
  { id: "binary-search", type: "default", position: { x: -50, y: 200 }, data: { label: "Binary Search" } },
  { id: "sliding-window", type: "default", position: { x: 100, y: 200 }, data: { label: "Sliding Window" } },
  { id: "linked-list", type: "default", position: { x: 250, y: 200 }, data: { label: "Linked List" } },
  { id: "trees", type: "default", position: { x: 250, y: 300 }, data: { label: "Trees" } },
  { id: "tries", type: "default", position: { x: 100, y: 400 }, data: { label: "Tries" } },
  { id: "heap", type: "default", position: { x: 400, y: 400 }, data: { label: "Heap / Priority Queue" } },
  { id: "backtracking", type: "default", position: { x: 250, y: 400 }, data: { label: "Backtracking" } },
  { id: "graphs", type: "default", position: { x: 150, y: 500 }, data: { label: "Graphs" } },
  { id: "1d-dp", type: "default", position: { x: 350, y: 500 }, data: { label: "1-D DP" } }
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
