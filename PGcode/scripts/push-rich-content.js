#!/usr/bin/env node
// Read src/content/problemContent.js (RICH_CONTENT, COMPLETE_PROBLEMS), pluck
// the per-language solutions + viz frames + tags + companies, and push them
// into PGcode_problems.solutions / viz_steps / tags columns.
//
// Existing rows are UPDATED (not inserted) — this never creates a new problem.
// Idempotent: re-runs overwrite with the latest source-of-truth from the file.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SVC) { console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const sb = createClient(URL, SVC);

// Dynamically import the ESM file. Vite alias-free here.
const { RICH_CONTENT } = await import(path.join(__dirname, '..', 'src', 'content', 'problemContent.js'));

const slugs = Object.keys(RICH_CONTENT);
console.log(`Pushing ${slugs.length} problems' rich content to DB...`);

let ok = 0, fail = 0;
for (const slug of slugs) {
  const c = RICH_CONTENT[slug];
  const update = {
    solutions: c.solutions || null,
    viz_steps: c.viz || null,
    tags: c.tags || null,
  };
  const { error } = await sb.from('PGcode_problems').update(update).eq('id', slug);
  if (error) { console.log(`  ${slug}: ${error.message.slice(0, 120)}`); fail++; }
  else { console.log(`  ${slug}: ok`); ok++; }
}
console.log(`\nDone: ${ok} updated, ${fail} failed.`);

// === wave9q entries (appended) ===
export const WAVE9Q_ENTRIES = [
  {
    "slug": "kids-with-the-greatest-number-of-candies",
    "method_name": "kidsWithCandies",
    "params": [
      {
        "name": "candies",
        "type": "List[int]"
      },
      {
        "name": "extraCandies",
        "type": "int"
      }
    ],
    "return_type": "List[bool]",
    "hints": [
      "Find the current maximum across the candies array first — single pass.",
      "For each kid, check whether candies[i] + extraCandies >= max.",
      "You do not need to give the extras out then take them back — comparing is enough.",
      "Two linear passes total; O(n) time, O(n) output, O(1) extra besides the output.",
      "Watch the off-by-one: equal counts also share the title; use >=, not >."
    ],
    "tags": [
      "arrays",
      "simulation",
      "easy"
    ],
    "companies": [
      "amazon",
      "microsoft",
      "google",
      "adobe"
    ],
    "constraints": "n == candies.length\n2 <= n <= 100\n1 <= candies[i] <= 100\n1 <= extraCandies <= 50",
    "follow_up": "What if the array streams in and you must answer queries online? Track the max as you go and re-check older kids on each update.",
    "pattern": "prepass-then-compare",
    "test_cases": [
      {
        "inputs": [
          "[2,3,5,1,3]",
          "3"
        ],
        "expected": "[true,true,true,false,true]"
      },
      {
        "inputs": [
          "[4,2,1,1,2]",
          "1"
        ],
        "expected": "[true,false,false,false,false]"
      },
      {
        "inputs": [
          "[12,1,12]",
          "10"
        ],
        "expected": "[true,false,true]"
      },
      {
        "inputs": [
          "[1,1,1,1]",
          "0"
        ],
        "expected": "[true,true,true,true]"
      },
      {
        "inputs": [
          "[1,2]",
          "5"
        ],
        "expected": "[true,true]"
      },
      {
        "inputs": [
          "[5,5,5]",
          "0"
        ],
        "expected": "[true,true,true]"
      },
      {
        "inputs": [
          "[100,1]",
          "1"
        ],
        "expected": "[true,false]"
      },
      {
        "inputs": [
          "[2,3,5,1,3]",
          "0"
        ],
        "expected": "[false,false,true,false,false]"
      },
      {
        "inputs": [
          "[3,3,3,3,3]",
          "2"
        ],
        "expected": "[true,true,true,true,true]"
      },
      {
        "inputs": [
          "[1,100]",
          "50"
        ],
        "expected": "[false,true]"
      },
      {
        "inputs": [
          "[7,7,7,7]",
          "1"
        ],
        "expected": "[true,true,true,true]"
      },
      {
        "inputs": [
          "[10,20,30,40]",
          "10"
        ],
        "expected": "[false,false,false,true]"
      }
    ],
    "viz_steps": [
      {
        "step": 1,
        "note": "Input candies=[2,3,5,1,3], extra=3. Scan once to find max."
      },
      {
        "step": 2,
        "note": "i=0: candies[0]=2 → running max = 2."
      },
      {
        "step": 3,
        "note": "i=1: candies[1]=3 > 2 → running max = 3."
      },
      {
        "step": 4,
        "note": "i=2: candies[2]=5 > 3 → running max = 5."
      },
      {
        "step": 5,
        "note": "i=3: candies[3]=1 < 5 → max stays 5."
      },
      {
        "step": 6,
        "note": "i=4: candies[4]=3 < 5 → max stays 5. Final max = 5."
      },
      {
        "step": 7,
        "note": "Second pass: kid 0 has 2+3=5 >= 5 → true."
      },
      {
        "step": 8,
        "note": "Kid 1: 3+3=6 >= 5 → true. Kid 2: 5+3=8 >= 5 → true."
      },
      {
        "step": 9,
        "note": "Kid 3: 1+3=4 < 5 → false. Kid 4: 3+3=6 >= 5 → true."
      },
      {
        "step": 10,
        "note": "Result [true,true,true,false,true]. Two passes, O(n) total."
      }
    ],
    "solutions": {
      "python": "class Solution:\n    def kidsWithCandies(self, candies, extraCandies):\n        m = max(candies)\n        return [c + extraCandies >= m for c in candies]",
      "javascript": "var kidsWithCandies = function(candies, extraCandies) {\n    const m = Math.max(...candies);\n    return candies.map(c => c + extraCandies >= m);\n};",
      "java": "class Solution {\n    public List<Boolean> kidsWithCandies(int[] candies, int extraCandies) {\n        int m = 0;\n        for (int c : candies) if (c > m) m = c;\n        List<Boolean> out = new ArrayList<>(candies.length);\n        for (int c : candies) out.add(c + extraCandies >= m);\n        return out;\n    }\n}",
      "cpp": "class Solution {\npublic:\n    vector<bool> kidsWithCandies(vector<int>& candies, int extraCandies) {\n        int m = *max_element(candies.begin(), candies.end());\n        vector<bool> out;\n        out.reserve(candies.size());\n        for (int c : candies) out.push_back(c + extraCandies >= m);\n        return out;\n    }\n};",
      "typescript": "function kidsWithCandies(candies: number[], extraCandies: number): boolean[] {\n    const m = Math.max(...candies);\n    return candies.map(c => c + extraCandies >= m);\n}",
      "go": "func kidsWithCandies(candies []int, extraCandies int) []bool {\n    m := 0\n    for _, c := range candies {\n        if c > m { m = c }\n    }\n    out := make([]bool, len(candies))\n    for i, c := range candies {\n        out[i] = c + extraCandies >= m\n    }\n    return out\n}"
    }
  },
  {
    "slug": "shuffle-the-array",
    "method_name": "shuffle",
    "params": [
      {
        "name": "nums",
        "type": "List[int]"
      },
      {
        "name": "n",
        "type": "int"
      }
    ],
    "return_type": "List[int]",
    "hints": [
      "The array splits cleanly: x = nums[0..n-1], y = nums[n..2n-1]. The answer interleaves x[i], y[i].",
      "Simplest version: allocate a new array of length 2n and fill out[2i]=nums[i], out[2i+1]=nums[i+n].",
      "In-place trick: pack pairs into the high bits of nums[i] since values fit in 10 bits — encode then decode.",
      "O(n) time either way; auxiliary array version is the one to mention first in an interview.",
      "Common bug: mixing up index 2*i versus i+n during the interleave."
    ],
    "tags": [
      "arrays",
      "simulation",
      "easy"
    ],
    "companies": [
      "amazon",
      "meta",
      "microsoft",
      "apple"
    ],
    "constraints": "1 <= n <= 500\nnums.length == 2 * n\n1 <= nums[i] <= 1000",
    "follow_up": "Do it in O(1) extra space: encode both halves into nums[i] using bit-packing since values fit in 10 bits.",
    "pattern": "two-pointer-interleave",
    "test_cases": [
      {
        "inputs": [
          "[2,5,1,3,4,7]",
          "3"
        ],
        "expected": "[2,3,5,4,1,7]"
      },
      {
        "inputs": [
          "[1,2,3,4,4,3,2,1]",
          "4"
        ],
        "expected": "[1,4,2,3,3,2,4,1]"
      },
      {
        "inputs": [
          "[1,1,2,2]",
          "2"
        ],
        "expected": "[1,2,1,2]"
      },
      {
        "inputs": [
          "[1,2]",
          "1"
        ],
        "expected": "[1,2]"
      },
      {
        "inputs": [
          "[5,5,5,5,5,5]",
          "3"
        ],
        "expected": "[5,5,5,5,5,5]"
      },
      {
        "inputs": [
          "[10,20,30,40]",
          "2"
        ],
        "expected": "[10,30,20,40]"
      },
      {
        "inputs": [
          "[1,3,5,7,2,4,6,8]",
          "4"
        ],
        "expected": "[1,2,3,4,5,6,7,8]"
      },
      {
        "inputs": [
          "[100,200,1,2]",
          "2"
        ],
        "expected": "[100,1,200,2]"
      },
      {
        "inputs": [
          "[1,2,3,4,5,6,7,8,9,10]",
          "5"
        ],
        "expected": "[1,6,2,7,3,8,4,9,5,10]"
      },
      {
        "inputs": [
          "[7,7,1,1]",
          "2"
        ],
        "expected": "[7,1,7,1]"
      },
      {
        "inputs": [
          "[1000,999,998,1,2,3]",
          "3"
        ],
        "expected": "[1000,1,999,2,998,3]"
      },
      {
        "inputs": [
          "[1,2,3,4]",
          "2"
        ],
        "expected": "[1,3,2,4]"
      }
    ],
    "viz_steps": [
      {
        "step": 1,
        "note": "Input nums=[2,5,1,3,4,7], n=3. Split into x=[2,5,1] and y=[3,4,7]."
      },
      {
        "step": 2,
        "note": "Allocate output of length 2n = 6, all slots empty."
      },
      {
        "step": 3,
        "note": "i=0: out[0]=x[0]=2. State: [2,_,_,_,_,_]."
      },
      {
        "step": 4,
        "note": "i=0: out[1]=y[0]=3. State: [2,3,_,_,_,_]."
      },
      {
        "step": 5,
        "note": "i=1: out[2]=x[1]=5. State: [2,3,5,_,_,_]."
      },
      {
        "step": 6,
        "note": "i=1: out[3]=y[1]=4. State: [2,3,5,4,_,_]."
      },
      {
        "step": 7,
        "note": "i=2: out[4]=x[2]=1. State: [2,3,5,4,1,_]."
      },
      {
        "step": 8,
        "note": "i=2: out[5]=y[2]=7. State: [2,3,5,4,1,7]."
      },
      {
        "step": 9,
        "note": "Loop ends after n=3 iterations. Every x slot paired with its y partner."
      },
      {
        "step": 10,
        "note": "Return [2,3,5,4,1,7]. Single linear pass, O(n) time and space."
      }
    ],
    "solutions": {
      "python": "class Solution:\n    def shuffle(self, nums, n):\n        out = [0] * (2 * n)\n        for i in range(n):\n            out[2 * i] = nums[i]\n            out[2 * i + 1] = nums[i + n]\n        return out",
      "javascript": "var shuffle = function(nums, n) {\n    const out = new Array(2 * n);\n    for (let i = 0; i < n; i++) {\n        out[2 * i] = nums[i];\n        out[2 * i + 1] = nums[i + n];\n    }\n    return out;\n};",
      "java": "class Solution {\n    public int[] shuffle(int[] nums, int n) {\n        int[] out = new int[2 * n];\n        for (int i = 0; i < n; i++) {\n            out[2 * i] = nums[i];\n            out[2 * i + 1] = nums[i + n];\n        }\n        return out;\n    }\n}",
      "cpp": "class Solution {\npublic:\n    vector<int> shuffle(vector<int>& nums, int n) {\n        vector<int> out(2 * n);\n        for (int i = 0; i < n; i++) {\n            out[2 * i] = nums[i];\n            out[2 * i + 1] = nums[i + n];\n        }\n        return out;\n    }\n};",
      "typescript": "function shuffle(nums: number[], n: number): number[] {\n    const out: number[] = new Array(2 * n);\n    for (let i = 0; i < n; i++) {\n        out[2 * i] = nums[i];\n        out[2 * i + 1] = nums[i + n];\n    }\n    return out;\n}",
      "go": "func shuffle(nums []int, n int) []int {\n    out := make([]int, 2*n)\n    for i := 0; i < n; i++ {\n        out[2*i] = nums[i]\n        out[2*i+1] = nums[i+n]\n    }\n    return out\n}"
    }
  }
];

// === wave10c entries (appended) ===
export const WAVE10C_ENTRIES = [
  {
    "slug": "max-consecutive-ones",
    "method_name": "findMaxConsecutiveOnes",
    "params": [
      {
        "name": "nums",
        "type": "List[int]"
      }
    ],
    "return_type": "int",
    "hints": [
      "Sweep left to right maintaining a running count of consecutive 1s.",
      "Reset the running count to 0 the moment you hit a 0.",
      "After each step (or each reset) update the global max with the running count.",
      "O(n) time, O(1) extra space — no need for a second array or sliding-window data structure.",
      "Watch the end-of-array edge case: do not forget the final streak that never gets terminated by a 0."
    ],
    "tags": [
      "arrays",
      "counting",
      "easy"
    ],
    "companies": [
      "amazon",
      "microsoft",
      "google",
      "apple"
    ],
    "constraints": "1 <= nums.length <= 10^5\nnums[i] is either 0 or 1.",
    "follow_up": "What if at most one 0 can be flipped to 1? Track the previous run length and combine. Generalizes to \"at most k flips\" via sliding window (LC 1004).",
    "pattern": "running-count-with-reset",
    "test_cases": [
      {
        "inputs": [
          "[1,1,0,1,1,1]"
        ],
        "expected": "3"
      },
      {
        "inputs": [
          "[1,0,1,1,0,1]"
        ],
        "expected": "2"
      },
      {
        "inputs": [
          "[0,0,0]"
        ],
        "expected": "0"
      },
      {
        "inputs": [
          "[1,1,1,1]"
        ],
        "expected": "4"
      },
      {
        "inputs": [
          "[0]"
        ],
        "expected": "0"
      },
      {
        "inputs": [
          "[1]"
        ],
        "expected": "1"
      },
      {
        "inputs": [
          "[1,0,1,0,1,0,1]"
        ],
        "expected": "1"
      },
      {
        "inputs": [
          "[0,1,1,1,0,1,1,0,1,1,1,1]"
        ],
        "expected": "4"
      },
      {
        "inputs": [
          "[1,1,1,0,0,1,1]"
        ],
        "expected": "3"
      },
      {
        "inputs": [
          "[0,0,1,1,1,1,1]"
        ],
        "expected": "5"
      },
      {
        "inputs": [
          "[1,1,1,1,1,0]"
        ],
        "expected": "5"
      },
      {
        "inputs": [
          "[0,1,0,1,0,1,1,1,1,1,1]"
        ],
        "expected": "6"
      }
    ],
    "viz_steps": [
      {
        "step": 1,
        "note": "Input nums=[1,1,0,1,1,1]. Initialize run=0, best=0."
      },
      {
        "step": 2,
        "note": "i=0: nums[0]=1 → run=1, best=max(0,1)=1."
      },
      {
        "step": 3,
        "note": "i=1: nums[1]=1 → run=2, best=max(1,2)=2."
      },
      {
        "step": 4,
        "note": "i=2: nums[2]=0 → run resets to 0. best stays 2."
      },
      {
        "step": 5,
        "note": "i=3: nums[3]=1 → run=1, best stays 2."
      },
      {
        "step": 6,
        "note": "i=4: nums[4]=1 → run=2, best stays 2."
      },
      {
        "step": 7,
        "note": "i=5: nums[5]=1 → run=3, best=max(2,3)=3."
      },
      {
        "step": 8,
        "note": "End of array reached. Final streak of three 1s is captured."
      },
      {
        "step": 9,
        "note": "Return best=3. Single pass, O(n) time, O(1) extra space."
      },
      {
        "step": 10,
        "note": "Key invariant: best holds the longest run of 1s seen so far, run holds the current streak."
      }
    ],
    "solutions": {
      "python": "class Solution:\n    def findMaxConsecutiveOnes(self, nums):\n        best = run = 0\n        for x in nums:\n            if x == 1:\n                run += 1\n                if run > best:\n                    best = run\n            else:\n                run = 0\n        return best",
      "javascript": "var findMaxConsecutiveOnes = function(nums) {\n    let best = 0, run = 0;\n    for (const x of nums) {\n        if (x === 1) {\n            run++;\n            if (run > best) best = run;\n        } else {\n            run = 0;\n        }\n    }\n    return best;\n};",
      "java": "class Solution {\n    public int findMaxConsecutiveOnes(int[] nums) {\n        int best = 0, run = 0;\n        for (int x : nums) {\n            if (x == 1) {\n                run++;\n                if (run > best) best = run;\n            } else {\n                run = 0;\n            }\n        }\n        return best;\n    }\n}",
      "cpp": "class Solution {\npublic:\n    int findMaxConsecutiveOnes(vector<int>& nums) {\n        int best = 0, run = 0;\n        for (int x : nums) {\n            if (x == 1) {\n                run++;\n                if (run > best) best = run;\n            } else {\n                run = 0;\n            }\n        }\n        return best;\n    }\n};",
      "typescript": "function findMaxConsecutiveOnes(nums: number[]): number {\n    let best = 0, run = 0;\n    for (const x of nums) {\n        if (x === 1) {\n            run++;\n            if (run > best) best = run;\n        } else {\n            run = 0;\n        }\n    }\n    return best;\n}",
      "go": "func findMaxConsecutiveOnes(nums []int) int {\n    best, run := 0, 0\n    for _, x := range nums {\n        if x == 1 {\n            run++\n            if run > best {\n                best = run\n            }\n        } else {\n            run = 0\n        }\n    }\n    return best\n}"
    }
  },
  {
    "slug": "maximum-69-number",
    "method_name": "maximum69Number",
    "params": [
      {
        "name": "num",
        "type": "int"
      }
    ],
    "return_type": "int",
    "hints": [
      "Only digits 6 and 9 exist. Flipping a 6 to a 9 increases the number; flipping a 9 to a 6 decreases it.",
      "You may flip at most one digit, and you want the maximum — only ever flip a 6, never a 9.",
      "The most significant 6 (leftmost) contributes the biggest jump when promoted to 9.",
      "Trivial implementation: convert to string, replace the first 6, convert back.",
      "O(d) time and space where d is the digit count (≤ 4 for the LC constraint). No need to scan twice."
    ],
    "tags": [
      "math",
      "greedy",
      "easy"
    ],
    "companies": [
      "amazon",
      "microsoft",
      "adobe"
    ],
    "constraints": "1 <= num <= 10^4\nnum consists only of digits 6 and 9.",
    "follow_up": "What if you can flip at most k digits? Flip the k leftmost 6s. What if 0..9 were all allowed? Still greedy: leftmost digit you can increase the most.",
    "pattern": "greedy-leftmost-upgrade",
    "test_cases": [
      {
        "inputs": [
          "9669"
        ],
        "expected": "9969"
      },
      {
        "inputs": [
          "9996"
        ],
        "expected": "9999"
      },
      {
        "inputs": [
          "9999"
        ],
        "expected": "9999"
      },
      {
        "inputs": [
          "6"
        ],
        "expected": "9"
      },
      {
        "inputs": [
          "9"
        ],
        "expected": "9"
      },
      {
        "inputs": [
          "66"
        ],
        "expected": "96"
      },
      {
        "inputs": [
          "69"
        ],
        "expected": "99"
      },
      {
        "inputs": [
          "96"
        ],
        "expected": "99"
      },
      {
        "inputs": [
          "6666"
        ],
        "expected": "9666"
      },
      {
        "inputs": [
          "9666"
        ],
        "expected": "9966"
      },
      {
        "inputs": [
          "6969"
        ],
        "expected": "9969"
      },
      {
        "inputs": [
          "6996"
        ],
        "expected": "9996"
      }
    ],
    "viz_steps": [
      {
        "step": 1,
        "note": "Input num=9669. Convert to string s=\"9669\"."
      },
      {
        "step": 2,
        "note": "Scan left to right looking for the first 6."
      },
      {
        "step": 3,
        "note": "i=0: s[0]=9 → already 9, not a candidate."
      },
      {
        "step": 4,
        "note": "i=1: s[1]=6 → first 6 found. This is the most significant flip target."
      },
      {
        "step": 5,
        "note": "Flip s[1]: \"9669\" → \"9969\". Stop scanning."
      },
      {
        "step": 6,
        "note": "Parse \"9969\" back to integer 9969."
      },
      {
        "step": 7,
        "note": "Counter-example to consider: flipping s[2] would give \"9699\" < 9969."
      },
      {
        "step": 8,
        "note": "Why leftmost? Each position is worth 10× the next; promoting the highest 6 wins."
      },
      {
        "step": 9,
        "note": "Edge case num=9999: no 6 exists, return original num unchanged."
      },
      {
        "step": 10,
        "note": "Return 9969. Time O(d), space O(d) for the string buffer."
      }
    ],
    "solutions": {
      "python": "class Solution:\n    def maximum69Number(self, num):\n        return int(str(num).replace('6', '9', 1))",
      "javascript": "var maximum69Number = function(num) {\n    return parseInt(String(num).replace('6', '9'), 10);\n};",
      "java": "class Solution {\n    public int maximum69Number(int num) {\n        char[] c = String.valueOf(num).toCharArray();\n        for (int i = 0; i < c.length; i++) {\n            if (c[i] == '6') { c[i] = '9'; break; }\n        }\n        return Integer.parseInt(new String(c));\n    }\n}",
      "cpp": "class Solution {\npublic:\n    int maximum69Number(int num) {\n        string s = to_string(num);\n        for (char& c : s) {\n            if (c == '6') { c = '9'; break; }\n        }\n        return stoi(s);\n    }\n};",
      "typescript": "function maximum69Number(num: number): number {\n    return parseInt(String(num).replace('6', '9'), 10);\n}",
      "go": "func maximum69Number(num int) int {\n    s := []byte(strconv.Itoa(num))\n    for i, c := range s {\n        if c == '6' {\n            s[i] = '9'\n            break\n        }\n    }\n    n, _ := strconv.Atoi(string(s))\n    return n\n}"
    }
  }
];

// === wave10b entries (appended) ===
export const WAVE10B_ENTRIES = [
  {
    "slug": "cells-with-odd-values-in-a-matrix",
    "method_name": "oddCells",
    "params": [
      {
        "name": "m",
        "type": "int"
      },
      {
        "name": "n",
        "type": "int"
      },
      {
        "name": "indices",
        "type": "List[List[int]]"
      }
    ],
    "return_type": "int",
    "hints": [
      "Brute force: maintain an m x n grid, apply each (ri, ci) by incrementing every cell in row ri and column ci, then count odd cells. O(L * (m + n)) where L = indices.length.",
      "Observation: a cell (r, c) gets incremented once per index whose row is r, plus once per index whose column is c. Final value = rows[r] + cols[c].",
      "Track only two arrays: rows[m] and cols[n]. For each [ri, ci] in indices, rows[ri]++ and cols[ci]++.",
      "Cell (r, c) is odd iff rows[r] + cols[c] is odd iff exactly one of rows[r], cols[c] is odd. Count odd rows and odd cols, then combine.",
      "Answer = oddRows * (n - oddCols) + (m - oddRows) * oddCols. O(L + m + n) time, O(m + n) space."
    ],
    "tags": [
      "arrays",
      "math",
      "simulation",
      "easy"
    ],
    "companies": [
      "amazon",
      "google",
      "microsoft",
      "adobe"
    ],
    "constraints": "1 <= m, n <= 50\n1 <= indices.length <= 100\n0 <= ri < m\n0 <= ci < n",
    "follow_up": "Could you solve it in O(L + m + n) time and O(m + n) space — without ever materializing the m*n grid?",
    "pattern": "parity-row-col-decomposition",
    "test_cases": [
      {
        "inputs": [
          "2",
          "3",
          "[[0,1],[1,1]]"
        ],
        "expected": "6"
      },
      {
        "inputs": [
          "2",
          "2",
          "[[1,1],[0,0]]"
        ],
        "expected": "0"
      },
      {
        "inputs": [
          "1",
          "1",
          "[[0,0]]"
        ],
        "expected": "1"
      },
      {
        "inputs": [
          "3",
          "3",
          "[[0,0],[1,1],[2,2]]"
        ],
        "expected": "6"
      },
      {
        "inputs": [
          "4",
          "4",
          "[[0,0],[0,1],[0,2],[0,3]]"
        ],
        "expected": "12"
      },
      {
        "inputs": [
          "5",
          "5",
          "[[2,3]]"
        ],
        "expected": "9"
      },
      {
        "inputs": [
          "2",
          "3",
          "[[1,2],[0,0],[1,1]]"
        ],
        "expected": "4"
      },
      {
        "inputs": [
          "3",
          "3",
          "[]"
        ],
        "expected": "0"
      },
      {
        "inputs": [
          "1",
          "5",
          "[[0,2],[0,2]]"
        ],
        "expected": "0"
      },
      {
        "inputs": [
          "50",
          "50",
          "[[0,0]]"
        ],
        "expected": "99"
      },
      {
        "inputs": [
          "2",
          "2",
          "[[0,0],[1,1],[0,1]]"
        ],
        "expected": "2"
      },
      {
        "inputs": [
          "4",
          "5",
          "[[1,2],[3,4],[0,0]]"
        ],
        "expected": "12"
      }
    ],
    "viz_steps": [
      {
        "step": 1,
        "note": "Input m=2, n=3, indices=[[0,1],[1,1]]. Initialise rows=[0,0], cols=[0,0,0]."
      },
      {
        "step": 2,
        "note": "Apply [0,1]: rows[0]++ → rows=[1,0]. cols[1]++ → cols=[0,1,0]."
      },
      {
        "step": 3,
        "note": "Apply [1,1]: rows[1]++ → rows=[1,1]. cols[1]++ → cols=[0,2,0]."
      },
      {
        "step": 4,
        "note": "All indices processed. rows=[1,1], cols=[0,2,0]."
      },
      {
        "step": 5,
        "note": "Build mental grid: cell (r,c) value = rows[r] + cols[c]. (0,0)=1, (0,1)=3, (0,2)=1."
      },
      {
        "step": 6,
        "note": "Row 1: (1,0)=1, (1,1)=3, (1,2)=1. Six cells total."
      },
      {
        "step": 7,
        "note": "Count odd rows: rows[0]=1 odd, rows[1]=1 odd → oddRows=2. Odd cols: cols[0]=0 even, cols[1]=2 even, cols[2]=0 even → oddCols=0."
      },
      {
        "step": 8,
        "note": "Formula: oddRows * (n - oddCols) + (m - oddRows) * oddCols = 2 * 3 + 0 * 0 = 6."
      },
      {
        "step": 9,
        "note": "Sanity check by direct count: all six cells are odd (1, 3, 1, 1, 3, 1). Matches."
      },
      {
        "step": 10,
        "note": "Return 6. Total work O(L + m + n) = O(2 + 2 + 3) operations — no grid materialised."
      }
    ],
    "solutions": {
      "python": "class Solution:\n    def oddCells(self, m, n, indices):\n        rows = [0] * m\n        cols = [0] * n\n        for r, c in indices:\n            rows[r] += 1\n            cols[c] += 1\n        odd_rows = sum(1 for x in rows if x & 1)\n        odd_cols = sum(1 for x in cols if x & 1)\n        return odd_rows * (n - odd_cols) + (m - odd_rows) * odd_cols",
      "javascript": "var oddCells = function(m, n, indices) {\n    const rows = new Array(m).fill(0);\n    const cols = new Array(n).fill(0);\n    for (const [r, c] of indices) {\n        rows[r]++;\n        cols[c]++;\n    }\n    let oddRows = 0, oddCols = 0;\n    for (const x of rows) if (x & 1) oddRows++;\n    for (const x of cols) if (x & 1) oddCols++;\n    return oddRows * (n - oddCols) + (m - oddRows) * oddCols;\n};",
      "java": "class Solution {\n    public int oddCells(int m, int n, int[][] indices) {\n        int[] rows = new int[m];\n        int[] cols = new int[n];\n        for (int[] ix : indices) {\n            rows[ix[0]]++;\n            cols[ix[1]]++;\n        }\n        int oddRows = 0, oddCols = 0;\n        for (int x : rows) if ((x & 1) == 1) oddRows++;\n        for (int x : cols) if ((x & 1) == 1) oddCols++;\n        return oddRows * (n - oddCols) + (m - oddRows) * oddCols;\n    }\n}",
      "cpp": "class Solution {\npublic:\n    int oddCells(int m, int n, vector<vector<int>>& indices) {\n        vector<int> rows(m, 0), cols(n, 0);\n        for (auto& ix : indices) {\n            rows[ix[0]]++;\n            cols[ix[1]]++;\n        }\n        int oddRows = 0, oddCols = 0;\n        for (int x : rows) if (x & 1) oddRows++;\n        for (int x : cols) if (x & 1) oddCols++;\n        return oddRows * (n - oddCols) + (m - oddRows) * oddCols;\n    }\n};",
      "typescript": "function oddCells(m: number, n: number, indices: number[][]): number {\n    const rows = new Array(m).fill(0);\n    const cols = new Array(n).fill(0);\n    for (const [r, c] of indices) {\n        rows[r]++;\n        cols[c]++;\n    }\n    let oddRows = 0, oddCols = 0;\n    for (const x of rows) if (x & 1) oddRows++;\n    for (const x of cols) if (x & 1) oddCols++;\n    return oddRows * (n - oddCols) + (m - oddRows) * oddCols;\n}",
      "go": "func oddCells(m int, n int, indices [][]int) int {\n    rows := make([]int, m)\n    cols := make([]int, n)\n    for _, ix := range indices {\n        rows[ix[0]]++\n        cols[ix[1]]++\n    }\n    oddRows, oddCols := 0, 0\n    for _, x := range rows {\n        if x&1 == 1 { oddRows++ }\n    }\n    for _, x := range cols {\n        if x&1 == 1 { oddCols++ }\n    }\n    return oddRows*(n-oddCols) + (m-oddRows)*oddCols\n}"
    }
  },
  {
    "slug": "count-pairs-whose-sum-is-less-than-target",
    "method_name": "countPairs",
    "params": [
      {
        "name": "nums",
        "type": "List[int]"
      },
      {
        "name": "target",
        "type": "int"
      }
    ],
    "return_type": "int",
    "hints": [
      "Brute force: nested loop over i < j, count when nums[i] + nums[j] < target. O(n^2) — fine for n <= 50 but the optimal is much nicer.",
      "Order does not matter for the sum, so sort the array in place. Now the sum problem becomes monotone over indices.",
      "Two pointers: left=0, right=n-1. If nums[left] + nums[right] < target, then every j in (left, right] also pairs with left to satisfy — add (right - left).",
      "Whether the inner sum is < target or not, advance the appropriate pointer: bump left up on success, drop right down on failure.",
      "Stop when left >= right. O(n log n) for the sort, O(n) for the two-pointer sweep. O(1) extra space if you can sort in place."
    ],
    "tags": [
      "arrays",
      "two-pointers",
      "sorting",
      "easy"
    ],
    "companies": [
      "amazon",
      "meta",
      "google",
      "microsoft"
    ],
    "constraints": "1 <= nums.length == n <= 50\n-50 <= nums[i], target <= 50",
    "follow_up": "What if you must answer many target queries against the same array? Sort once and binary-search the largest right index per left.",
    "pattern": "sort-plus-two-pointers",
    "test_cases": [
      {
        "inputs": [
          "[-1,1,2,3,1]",
          "2"
        ],
        "expected": "3"
      },
      {
        "inputs": [
          "[-6,2,5,-2,-7,-1,3]",
          "-2"
        ],
        "expected": "10"
      },
      {
        "inputs": [
          "[1,2,3,4,5]",
          "10"
        ],
        "expected": "10"
      },
      {
        "inputs": [
          "[1,2,3,4,5]",
          "3"
        ],
        "expected": "1"
      },
      {
        "inputs": [
          "[0,0,0,0]",
          "1"
        ],
        "expected": "6"
      },
      {
        "inputs": [
          "[5,5,5,5]",
          "10"
        ],
        "expected": "0"
      },
      {
        "inputs": [
          "[-50,-50,50,50]",
          "0"
        ],
        "expected": "4"
      },
      {
        "inputs": [
          "[1]",
          "5"
        ],
        "expected": "0"
      },
      {
        "inputs": [
          "[-1,-1,-1]",
          "-1"
        ],
        "expected": "3"
      },
      {
        "inputs": [
          "[10,20,30]",
          "25"
        ],
        "expected": "1"
      },
      {
        "inputs": [
          "[-5,0,5,10]",
          "5"
        ],
        "expected": "3"
      },
      {
        "inputs": [
          "[2,3,4,5,6,7]",
          "8"
        ],
        "expected": "4"
      }
    ],
    "viz_steps": [
      {
        "step": 1,
        "note": "Input nums=[-1,1,2,3,1], target=2. Sort in place → [-1,1,1,2,3]."
      },
      {
        "step": 2,
        "note": "Set left=0, right=4. count=0."
      },
      {
        "step": 3,
        "note": "sum = nums[0] + nums[4] = -1 + 3 = 2. NOT < 2, so drop right: right=3."
      },
      {
        "step": 4,
        "note": "sum = nums[0] + nums[3] = -1 + 2 = 1 < 2. Every j in (0, 3] pairs with left → count += 3 → count=3. left=1."
      },
      {
        "step": 5,
        "note": "sum = nums[1] + nums[3] = 1 + 2 = 3. NOT < 2, drop right: right=2."
      },
      {
        "step": 6,
        "note": "sum = nums[1] + nums[2] = 1 + 1 = 2. NOT < 2, drop right: right=1."
      },
      {
        "step": 7,
        "note": "left=1, right=1 → left >= right, loop exits."
      },
      {
        "step": 8,
        "note": "Result count=3. The three valid (i, j) pairs in the sorted array: (0,1), (0,2), (0,3)."
      },
      {
        "step": 9,
        "note": "Cross-check brute force: sums -1+1=0, -1+1=0, -1+2=1, -1+3=2, 1+1=2, 1+2=3, 1+3=4, 1+2=3, 1+3=4, 2+3=5. Three sums are < 2. Matches."
      },
      {
        "step": 10,
        "note": "Return 3. Two-pointer sweep ran 4 iterations after the O(n log n) sort."
      }
    ],
    "solutions": {
      "python": "class Solution:\n    def countPairs(self, nums, target):\n        nums.sort()\n        left, right = 0, len(nums) - 1\n        count = 0\n        while left < right:\n            if nums[left] + nums[right] < target:\n                count += right - left\n                left += 1\n            else:\n                right -= 1\n        return count",
      "javascript": "var countPairs = function(nums, target) {\n    nums.sort((a, b) => a - b);\n    let left = 0, right = nums.length - 1, count = 0;\n    while (left < right) {\n        if (nums[left] + nums[right] < target) {\n            count += right - left;\n            left++;\n        } else {\n            right--;\n        }\n    }\n    return count;\n};",
      "java": "class Solution {\n    public int countPairs(List<Integer> nums, int target) {\n        Collections.sort(nums);\n        int left = 0, right = nums.size() - 1, count = 0;\n        while (left < right) {\n            if (nums.get(left) + nums.get(right) < target) {\n                count += right - left;\n                left++;\n            } else {\n                right--;\n            }\n        }\n        return count;\n    }\n}",
      "cpp": "class Solution {\npublic:\n    int countPairs(vector<int>& nums, int target) {\n        sort(nums.begin(), nums.end());\n        int left = 0, right = (int)nums.size() - 1, count = 0;\n        while (left < right) {\n            if (nums[left] + nums[right] < target) {\n                count += right - left;\n                left++;\n            } else {\n                right--;\n            }\n        }\n        return count;\n    }\n};",
      "typescript": "function countPairs(nums: number[], target: number): number {\n    nums.sort((a, b) => a - b);\n    let left = 0, right = nums.length - 1, count = 0;\n    while (left < right) {\n        if (nums[left] + nums[right] < target) {\n            count += right - left;\n            left++;\n        } else {\n            right--;\n        }\n    }\n    return count;\n}",
      "go": "func countPairs(nums []int, target int) int {\n    sort.Ints(nums)\n    left, right, count := 0, len(nums)-1, 0\n    for left < right {\n        if nums[left]+nums[right] < target {\n            count += right - left\n            left++\n        } else {\n            right--\n        }\n    }\n    return count\n}"
    }
  }
];

// === wave10k entries (appended) ===
export const WAVE10K_ENTRIES = [
  {
    "slug": "largest-component-size-by-common-factor",
    "method_name": "largestComponentSize",
    "params": [
      {
        "name": "nums",
        "type": "List[int]"
      }
    ],
    "return_type": "int",
    "hints": [
      "Two numbers belong to the same component iff they share a prime factor — so the relation is \"shares a prime\".",
      "Naïvely checking gcd for every pair is O(n² log V). Instead, factor each number once and union it with each of its prime factors.",
      "Use Union-Find keyed by either values or primes. Easier: key by the value itself, then union value ↔ each of its primes.",
      "After unioning, walk every num and count component sizes via Counter(find(x)); return the max.",
      "Edge case: nums[i] == 1 has no prime factors, it stays its own component of size 1."
    ],
    "tags": [
      "union-find",
      "math",
      "number-theory",
      "hard",
      "graph"
    ],
    "companies": [
      "google",
      "amazon",
      "meta",
      "microsoft",
      "apple"
    ],
    "constraints": "1 <= nums.length <= 2*10^4\n1 <= nums[i] <= 10^5\nAll values of nums are unique.",
    "follow_up": "What if values reach 10^9? Trial division up to sqrt(V) still works (≈ 31623 per number) but Pollard-rho gets you under a millisecond. The Union-Find skeleton is unchanged — only the factorisation routine grows.",
    "pattern": "union-find-via-prime-factors",
    "test_cases": [
      {
        "inputs": [
          "[4,6,15,35]"
        ],
        "expected": "4"
      },
      {
        "inputs": [
          "[20,50,9,63]"
        ],
        "expected": "2"
      },
      {
        "inputs": [
          "[2,3,6,7,4,12,21,39]"
        ],
        "expected": "8"
      },
      {
        "inputs": [
          "[1,2,3,4,5,6,7,8,9]"
        ],
        "expected": "6"
      },
      {
        "inputs": [
          "[1]"
        ],
        "expected": "1"
      },
      {
        "inputs": [
          "[2,3,5,7,11,13]"
        ],
        "expected": "1"
      },
      {
        "inputs": [
          "[6,10,15]"
        ],
        "expected": "3"
      },
      {
        "inputs": [
          "[4,8,16,32]"
        ],
        "expected": "4"
      },
      {
        "inputs": [
          "[2,3]"
        ],
        "expected": "1"
      },
      {
        "inputs": [
          "[100,200,300,400,500]"
        ],
        "expected": "5"
      },
      {
        "inputs": [
          "[97,89,83,79,73,71]"
        ],
        "expected": "1"
      },
      {
        "inputs": [
          "[35,77,55,11,5,7]"
        ],
        "expected": "6"
      }
    ],
    "viz_steps": [
      {
        "step": 1,
        "note": "Input nums=[4,6,15,35]. We want the largest connected component where edges = \"share a prime factor\"."
      },
      {
        "step": 2,
        "note": "Naïve gcd-pairs is O(n² log V) — too slow. Instead: factor each num into primes, then union(num, prime)."
      },
      {
        "step": 3,
        "note": "DSU over a single namespace: every value in nums plus every prime we touch is a node. find/union compress paths and rank."
      },
      {
        "step": 4,
        "note": "Factor 4 = 2·2. Primes:{2}. Union(4,2). Components: {4,2} | {6} | {15} | {35}."
      },
      {
        "step": 5,
        "note": "Factor 6 = 2·3. Primes:{2,3}. Union(6,2) merges {6} with {4,2}. Then union(6,3) brings 3 in. Components: {4,2,6,3} | {15} | {35}."
      },
      {
        "step": 6,
        "note": "Factor 15 = 3·5. Union(15,3) merges {15} into {4,2,6,3}. Union(15,5) adds 5. Components: {4,2,6,3,15,5} | {35}."
      },
      {
        "step": 7,
        "note": "Factor 35 = 5·7. Union(35,5) merges {35} into the big one. Union(35,7) adds 7. One component contains everything."
      },
      {
        "step": 8,
        "note": "Sweep nums again: Counter(find(x)) over [4,6,15,35] → every root is the same → count=4."
      },
      {
        "step": 9,
        "note": "Return 4. Even though no two of {4,6,15,35} share a prime pairwise visible, the chain 4-6-15-35 wires through 2→3→5."
      },
      {
        "step": 10,
        "note": "Complexity: O(N · sqrt(maxV) · α(N)). For nums up to 1e5, sqrt ≈ 316, totally fine for N=2e4."
      }
    ],
    "solutions": {
      "python": "class Solution:\n    def largestComponentSize(self, nums):\n        parent = {}\n        def find(x):\n            parent.setdefault(x, x)\n            while parent[x] != x:\n                parent[x] = parent[parent[x]]\n                x = parent[x]\n            return x\n        def union(a, b):\n            ra, rb = find(a), find(b)\n            if ra != rb: parent[ra] = rb\n        for n in nums:\n            x = n\n            p = 2\n            while p * p <= x:\n                if x % p == 0:\n                    union(n, p)\n                    while x % p == 0: x //= p\n                p += 1\n            if x > 1: union(n, x)\n        from collections import Counter\n        c = Counter(find(n) for n in nums)\n        return max(c.values())",
      "javascript": "var largestComponentSize = function(nums) {\n    const parent = new Map();\n    const find = (x) => {\n        if (!parent.has(x)) parent.set(x, x);\n        while (parent.get(x) !== x) {\n            parent.set(x, parent.get(parent.get(x)));\n            x = parent.get(x);\n        }\n        return x;\n    };\n    const union = (a, b) => {\n        const ra = find(a), rb = find(b);\n        if (ra !== rb) parent.set(ra, rb);\n    };\n    for (const n of nums) {\n        let x = n;\n        for (let p = 2; p * p <= x; p++) {\n            if (x % p === 0) {\n                union(n, p);\n                while (x % p === 0) x = Math.floor(x / p);\n            }\n        }\n        if (x > 1) union(n, x);\n    }\n    const count = new Map();\n    let best = 0;\n    for (const n of nums) {\n        const r = find(n);\n        count.set(r, (count.get(r) || 0) + 1);\n        if (count.get(r) > best) best = count.get(r);\n    }\n    return best;\n};",
      "java": "class Solution {\n    private Map<Integer,Integer> parent = new HashMap<>();\n    private int find(int x) {\n        parent.putIfAbsent(x, x);\n        while (parent.get(x) != x) {\n            parent.put(x, parent.get(parent.get(x)));\n            x = parent.get(x);\n        }\n        return x;\n    }\n    private void union(int a, int b) {\n        int ra = find(a), rb = find(b);\n        if (ra != rb) parent.put(ra, rb);\n    }\n    public int largestComponentSize(int[] nums) {\n        for (int n : nums) {\n            int x = n;\n            for (int p = 2; (long)p * p <= x; p++) {\n                if (x % p == 0) {\n                    union(n, p);\n                    while (x % p == 0) x /= p;\n                }\n            }\n            if (x > 1) union(n, x);\n        }\n        Map<Integer,Integer> count = new HashMap<>();\n        int best = 0;\n        for (int n : nums) {\n            int r = find(n);\n            int c = count.getOrDefault(r, 0) + 1;\n            count.put(r, c);\n            if (c > best) best = c;\n        }\n        return best;\n    }\n}",
      "cpp": "class Solution {\npublic:\n    unordered_map<int,int> parent;\n    int find(int x) {\n        if (!parent.count(x)) parent[x] = x;\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    }\n    void unite(int a, int b) {\n        int ra = find(a), rb = find(b);\n        if (ra != rb) parent[ra] = rb;\n    }\n    int largestComponentSize(vector<int>& nums) {\n        for (int n : nums) {\n            int x = n;\n            for (int p = 2; (long long)p * p <= x; p++) {\n                if (x % p == 0) {\n                    unite(n, p);\n                    while (x % p == 0) x /= p;\n                }\n            }\n            if (x > 1) unite(n, x);\n        }\n        unordered_map<int,int> count;\n        int best = 0;\n        for (int n : nums) {\n            int r = find(n);\n            best = max(best, ++count[r]);\n        }\n        return best;\n    }\n};",
      "typescript": "function largestComponentSize(nums: number[]): number {\n    const parent = new Map<number, number>();\n    const find = (x: number): number => {\n        if (!parent.has(x)) parent.set(x, x);\n        while (parent.get(x)! !== x) {\n            parent.set(x, parent.get(parent.get(x)!)!);\n            x = parent.get(x)!;\n        }\n        return x;\n    };\n    const union = (a: number, b: number): void => {\n        const ra = find(a), rb = find(b);\n        if (ra !== rb) parent.set(ra, rb);\n    };\n    for (const n of nums) {\n        let x = n;\n        for (let p = 2; p * p <= x; p++) {\n            if (x % p === 0) {\n                union(n, p);\n                while (x % p === 0) x = Math.floor(x / p);\n            }\n        }\n        if (x > 1) union(n, x);\n    }\n    const count = new Map<number, number>();\n    let best = 0;\n    for (const n of nums) {\n        const r = find(n);\n        const c = (count.get(r) || 0) + 1;\n        count.set(r, c);\n        if (c > best) best = c;\n    }\n    return best;\n}",
      "go": "func largestComponentSize(nums []int) int {\n    parent := map[int]int{}\n    var find func(int) int\n    find = func(x int) int {\n        if _, ok := parent[x]; !ok { parent[x] = x }\n        for parent[x] != x {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    union := func(a, b int) {\n        ra, rb := find(a), find(b)\n        if ra != rb { parent[ra] = rb }\n    }\n    for _, n := range nums {\n        x := n\n        for p := 2; p*p <= x; p++ {\n            if x % p == 0 {\n                union(n, p)\n                for x % p == 0 { x /= p }\n            }\n        }\n        if x > 1 { union(n, x) }\n    }\n    count := map[int]int{}\n    best := 0\n    for _, n := range nums {\n        r := find(n)\n        count[r]++\n        if count[r] > best { best = count[r] }\n    }\n    return best\n}"
    }
  },
  {
    "slug": "bricks-falling-when-hit",
    "method_name": "hitBricks",
    "params": [
      {
        "name": "grid",
        "type": "List[List[int]]"
      },
      {
        "name": "hits",
        "type": "List[List[int]]"
      }
    ],
    "return_type": "List[int]",
    "hints": [
      "Forward simulation is brutal: each hit forces a flood-fill to see what dropped. Reverse the process instead.",
      "Knock out every hit in advance (mark them 0). Compute the connected-to-top component using Union-Find with a virtual \"roof\" node.",
      "Now play the hits in reverse: each restored brick reconnects to its 4 neighbours and possibly the roof. The number of bricks newly attached to the roof is the answer for that hit.",
      "A brick that was already 0 in the original grid is not a real hit — its answer is 0; do not actually add it back.",
      "Use 1 extra cell as the roof (index rows*cols). All cells in row 0 union with the roof when present."
    ],
    "tags": [
      "union-find",
      "matrix",
      "hard",
      "graph",
      "simulation"
    ],
    "companies": [
      "google",
      "amazon",
      "meta",
      "microsoft",
      "apple"
    ],
    "constraints": "m == grid.length, n == grid[i].length\n1 <= m, n <= 200\ngrid[i][j] is 0 or 1\n1 <= hits.length <= 4*10^4\nhits[i].length == 2\n0 <= xi <= m - 1, 0 <= yi <= n - 1\nAll (xi, yi) are unique.",
    "follow_up": "What if bricks weigh different amounts and you care about total mass dropped? Track weight per component (sum on union). What about diagonal connectivity? Use 8-neighbour union — the reverse-time trick still applies.",
    "pattern": "reverse-time-union-find-with-virtual-roof",
    "test_cases": [
      {
        "inputs": [
          "[[1,0,0,0],[1,1,1,0]]",
          "[[1,0]]"
        ],
        "expected": "[2]"
      },
      {
        "inputs": [
          "[[1,0,0,0],[1,1,0,0]]",
          "[[1,1],[1,0]]"
        ],
        "expected": "[0,0]"
      },
      {
        "inputs": [
          "[[1,0,0,0],[1,1,1,0]]",
          "[[1,1],[1,0]]"
        ],
        "expected": "[0,2]"
      },
      {
        "inputs": [
          "[[1]]",
          "[[0,0]]"
        ],
        "expected": "[0]"
      },
      {
        "inputs": [
          "[[1,1,1],[0,1,0],[0,0,0]]",
          "[[0,2],[2,0],[0,1],[1,2]]"
        ],
        "expected": "[1,0,1,0]"
      },
      {
        "inputs": [
          "[[1,0,1],[1,1,1]]",
          "[[0,0],[0,2],[1,1]]"
        ],
        "expected": "[0,0,2]"
      },
      {
        "inputs": [
          "[[0,0,0],[0,0,0]]",
          "[[0,0],[1,1]]"
        ],
        "expected": "[0,0]"
      },
      {
        "inputs": [
          "[[1,1,1],[1,1,1],[1,1,1]]",
          "[[0,1]]"
        ],
        "expected": "[0]"
      },
      {
        "inputs": [
          "[[1],[1],[1],[1]]",
          "[[3,0],[2,0],[1,0]]"
        ],
        "expected": "[0,0,0]"
      },
      {
        "inputs": [
          "[[1],[1],[1],[1]]",
          "[[1,0],[2,0],[3,0]]"
        ],
        "expected": "[2,0,0]"
      }
    ],
    "viz_steps": [
      {
        "step": 1,
        "note": "Setup: grid is m×n with 1=brick, 0=empty. A brick \"stays\" iff it is in row 0 OR 4-adjacent to a brick that stays. After each hit at (r,c), every brick that loses its support drops."
      },
      {
        "step": 2,
        "note": "Forward is painful because a single hit can chain-drop arbitrarily many bricks. Reverse trick: pretend every hit already happened, then re-add bricks one at a time backwards."
      },
      {
        "step": 3,
        "note": "Phase A — zero out the grid at every hit position. Skip hits where grid[r][c] was already 0 (we still record them; their answer will be 0)."
      },
      {
        "step": 4,
        "note": "Phase B — build initial DSU on the zeroed grid. Add a virtual \"roof\" node = m*n. Union every surviving brick in row 0 with roof; union all 4-adjacent surviving bricks."
      },
      {
        "step": 5,
        "note": "Now process hits in REVERSE. For each hit (r,c) that was a real brick: re-set grid[r][c]=1."
      },
      {
        "step": 6,
        "note": "Snapshot size_before = size of roof component. Union the restored brick with each 4-neighbour that is currently a brick; if r==0 also union with roof."
      },
      {
        "step": 7,
        "note": "Snapshot size_after = size of roof component. Answer for this hit = max(0, size_after - size_before - 1) — the -1 strips the brick we just added (it did not \"fall\", it returned)."
      },
      {
        "step": 8,
        "note": "Why this works: in forward time those size_after-size_before-1 bricks lost their roof connection exactly at this hit, so they fall here."
      },
      {
        "step": 9,
        "note": "Hits where the original cell was 0 contribute 0 and are skipped entirely — adding back a non-brick mustn't change roof size."
      },
      {
        "step": 10,
        "note": "Reverse the answer array. Complexity: O((m·n + h)·α) — basically linear. The α comes from union-find with path compression + union by size."
      }
    ],
    "solutions": {
      "python": "class Solution:\n    def hitBricks(self, grid, hits):\n        m, n = len(grid), len(grid[0])\n        ROOF = m * n\n        parent = list(range(m * n + 1))\n        size = [1] * (m * n + 1)\n        def find(x):\n            while parent[x] != x:\n                parent[x] = parent[parent[x]]\n                x = parent[x]\n            return x\n        def union(a, b):\n            ra, rb = find(a), find(b)\n            if ra == rb: return\n            if size[ra] < size[rb]: ra, rb = rb, ra\n            parent[rb] = ra\n            size[ra] += size[rb]\n        def idx(r, c): return r * n + c\n        g = [row[:] for row in grid]\n        for r, c in hits:\n            g[r][c] = 0\n        for r in range(m):\n            for c in range(n):\n                if g[r][c] == 1:\n                    if r == 0: union(idx(r, c), ROOF)\n                    if r > 0 and g[r-1][c] == 1: union(idx(r,c), idx(r-1,c))\n                    if c > 0 and g[r][c-1] == 1: union(idx(r,c), idx(r,c-1))\n        ans = [0] * len(hits)\n        for i in range(len(hits) - 1, -1, -1):\n            r, c = hits[i]\n            if grid[r][c] == 0: continue\n            before = size[find(ROOF)]\n            g[r][c] = 1\n            if r == 0: union(idx(r, c), ROOF)\n            for dr, dc in ((-1,0),(1,0),(0,-1),(0,1)):\n                nr, nc = r+dr, c+dc\n                if 0 <= nr < m and 0 <= nc < n and g[nr][nc] == 1:\n                    union(idx(r,c), idx(nr,nc))\n            after = size[find(ROOF)]\n            ans[i] = max(0, after - before - 1)\n        return ans",
      "javascript": "var hitBricks = function(grid, hits) {\n    const m = grid.length, n = grid[0].length, ROOF = m * n;\n    const parent = new Int32Array(m * n + 1);\n    const size = new Int32Array(m * n + 1);\n    for (let i = 0; i < parent.length; i++) { parent[i] = i; size[i] = 1; }\n    const find = (x) => {\n        while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }\n        return x;\n    };\n    const union = (a, b) => {\n        let ra = find(a), rb = find(b);\n        if (ra === rb) return;\n        if (size[ra] < size[rb]) [ra, rb] = [rb, ra];\n        parent[rb] = ra;\n        size[ra] += size[rb];\n    };\n    const idx = (r, c) => r * n + c;\n    const g = grid.map(row => row.slice());\n    for (const [r, c] of hits) g[r][c] = 0;\n    for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (g[r][c] === 1) {\n        if (r === 0) union(idx(r, c), ROOF);\n        if (r > 0 && g[r-1][c] === 1) union(idx(r,c), idx(r-1,c));\n        if (c > 0 && g[r][c-1] === 1) union(idx(r,c), idx(r,c-1));\n    }\n    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];\n    const ans = new Array(hits.length).fill(0);\n    for (let i = hits.length - 1; i >= 0; i--) {\n        const [r, c] = hits[i];\n        if (grid[r][c] === 0) continue;\n        const before = size[find(ROOF)];\n        g[r][c] = 1;\n        if (r === 0) union(idx(r, c), ROOF);\n        for (const [dr, dc] of dirs) {\n            const nr = r + dr, nc = c + dc;\n            if (nr >= 0 && nr < m && nc >= 0 && nc < n && g[nr][nc] === 1) union(idx(r,c), idx(nr,nc));\n        }\n        const after = size[find(ROOF)];\n        ans[i] = Math.max(0, after - before - 1);\n    }\n    return ans;\n};",
      "java": "class Solution {\n    int[] parent, size;\n    int n;\n    int find(int x) {\n        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }\n        return x;\n    }\n    void union(int a, int b) {\n        int ra = find(a), rb = find(b);\n        if (ra == rb) return;\n        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }\n        parent[rb] = ra;\n        size[ra] += size[rb];\n    }\n    int idx(int r, int c) { return r * n + c; }\n    public int[] hitBricks(int[][] grid, int[][] hits) {\n        int m = grid.length; n = grid[0].length;\n        int ROOF = m * n;\n        parent = new int[m * n + 1];\n        size = new int[m * n + 1];\n        for (int i = 0; i < parent.length; i++) { parent[i] = i; size[i] = 1; }\n        int[][] g = new int[m][n];\n        for (int r = 0; r < m; r++) g[r] = grid[r].clone();\n        for (int[] h : hits) g[h[0]][h[1]] = 0;\n        for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) if (g[r][c] == 1) {\n            if (r == 0) union(idx(r, c), ROOF);\n            if (r > 0 && g[r-1][c] == 1) union(idx(r,c), idx(r-1,c));\n            if (c > 0 && g[r][c-1] == 1) union(idx(r,c), idx(r,c-1));\n        }\n        int[][] dirs = {{-1,0},{1,0},{0,-1},{0,1}};\n        int[] ans = new int[hits.length];\n        for (int i = hits.length - 1; i >= 0; i--) {\n            int r = hits[i][0], c = hits[i][1];\n            if (grid[r][c] == 0) continue;\n            int before = size[find(ROOF)];\n            g[r][c] = 1;\n            if (r == 0) union(idx(r, c), ROOF);\n            for (int[] d : dirs) {\n                int nr = r + d[0], nc = c + d[1];\n                if (nr >= 0 && nr < m && nc >= 0 && nc < n && g[nr][nc] == 1) union(idx(r,c), idx(nr,nc));\n            }\n            int after = size[find(ROOF)];\n            ans[i] = Math.max(0, after - before - 1);\n        }\n        return ans;\n    }\n}",
      "cpp": "class Solution {\npublic:\n    vector<int> parent, sz;\n    int n;\n    int find(int x) {\n        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }\n        return x;\n    }\n    void unite(int a, int b) {\n        int ra = find(a), rb = find(b);\n        if (ra == rb) return;\n        if (sz[ra] < sz[rb]) swap(ra, rb);\n        parent[rb] = ra;\n        sz[ra] += sz[rb];\n    }\n    int idx(int r, int c) { return r * n + c; }\n    vector<int> hitBricks(vector<vector<int>>& grid, vector<vector<int>>& hits) {\n        int m = grid.size(); n = grid[0].size();\n        int ROOF = m * n;\n        parent.assign(m * n + 1, 0);\n        sz.assign(m * n + 1, 1);\n        for (int i = 0; i < (int)parent.size(); i++) parent[i] = i;\n        auto g = grid;\n        for (auto& h : hits) g[h[0]][h[1]] = 0;\n        for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) if (g[r][c] == 1) {\n            if (r == 0) unite(idx(r, c), ROOF);\n            if (r > 0 && g[r-1][c] == 1) unite(idx(r,c), idx(r-1,c));\n            if (c > 0 && g[r][c-1] == 1) unite(idx(r,c), idx(r,c-1));\n        }\n        vector<pair<int,int>> dirs = {{-1,0},{1,0},{0,-1},{0,1}};\n        vector<int> ans(hits.size(), 0);\n        for (int i = (int)hits.size() - 1; i >= 0; i--) {\n            int r = hits[i][0], c = hits[i][1];\n            if (grid[r][c] == 0) continue;\n            int before = sz[find(ROOF)];\n            g[r][c] = 1;\n            if (r == 0) unite(idx(r, c), ROOF);\n            for (auto& d : dirs) {\n                int nr = r + d.first, nc = c + d.second;\n                if (nr >= 0 && nr < m && nc >= 0 && nc < n && g[nr][nc] == 1) unite(idx(r,c), idx(nr,nc));\n            }\n            int after = sz[find(ROOF)];\n            ans[i] = max(0, after - before - 1);\n        }\n        return ans;\n    }\n};",
      "typescript": "function hitBricks(grid: number[][], hits: number[][]): number[] {\n    const m = grid.length, n = grid[0].length, ROOF = m * n;\n    const parent = new Int32Array(m * n + 1);\n    const size = new Int32Array(m * n + 1);\n    for (let i = 0; i < parent.length; i++) { parent[i] = i; size[i] = 1; }\n    const find = (x: number): number => {\n        while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }\n        return x;\n    };\n    const union = (a: number, b: number): void => {\n        let ra = find(a), rb = find(b);\n        if (ra === rb) return;\n        if (size[ra] < size[rb]) [ra, rb] = [rb, ra];\n        parent[rb] = ra;\n        size[ra] += size[rb];\n    };\n    const idx = (r: number, c: number) => r * n + c;\n    const g = grid.map(row => row.slice());\n    for (const [r, c] of hits) g[r][c] = 0;\n    for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (g[r][c] === 1) {\n        if (r === 0) union(idx(r, c), ROOF);\n        if (r > 0 && g[r-1][c] === 1) union(idx(r,c), idx(r-1,c));\n        if (c > 0 && g[r][c-1] === 1) union(idx(r,c), idx(r,c-1));\n    }\n    const dirs: [number,number][] = [[-1,0],[1,0],[0,-1],[0,1]];\n    const ans: number[] = new Array(hits.length).fill(0);\n    for (let i = hits.length - 1; i >= 0; i--) {\n        const [r, c] = hits[i];\n        if (grid[r][c] === 0) continue;\n        const before = size[find(ROOF)];\n        g[r][c] = 1;\n        if (r === 0) union(idx(r, c), ROOF);\n        for (const [dr, dc] of dirs) {\n            const nr = r + dr, nc = c + dc;\n            if (nr >= 0 && nr < m && nc >= 0 && nc < n && g[nr][nc] === 1) union(idx(r,c), idx(nr,nc));\n        }\n        const after = size[find(ROOF)];\n        ans[i] = Math.max(0, after - before - 1);\n    }\n    return ans;\n}",
      "go": "func hitBricks(grid [][]int, hits [][]int) []int {\n    m, n := len(grid), len(grid[0])\n    ROOF := m * n\n    parent := make([]int, m*n+1)\n    size := make([]int, m*n+1)\n    for i := range parent { parent[i] = i; size[i] = 1 }\n    var find func(int) int\n    find = func(x int) int {\n        for parent[x] != x { parent[x] = parent[parent[x]]; x = parent[x] }\n        return x\n    }\n    union := func(a, b int) {\n        ra, rb := find(a), find(b)\n        if ra == rb { return }\n        if size[ra] < size[rb] { ra, rb = rb, ra }\n        parent[rb] = ra\n        size[ra] += size[rb]\n    }\n    idx := func(r, c int) int { return r*n + c }\n    g := make([][]int, m)\n    for i := range grid { g[i] = append([]int{}, grid[i]...) }\n    for _, h := range hits { g[h[0]][h[1]] = 0 }\n    for r := 0; r < m; r++ {\n        for c := 0; c < n; c++ {\n            if g[r][c] == 1 {\n                if r == 0 { union(idx(r,c), ROOF) }\n                if r > 0 && g[r-1][c] == 1 { union(idx(r,c), idx(r-1,c)) }\n                if c > 0 && g[r][c-1] == 1 { union(idx(r,c), idx(r,c-1)) }\n            }\n        }\n    }\n    dirs := [4][2]int{{-1,0},{1,0},{0,-1},{0,1}}\n    ans := make([]int, len(hits))\n    for i := len(hits) - 1; i >= 0; i-- {\n        r, c := hits[i][0], hits[i][1]\n        if grid[r][c] == 0 { continue }\n        before := size[find(ROOF)]\n        g[r][c] = 1\n        if r == 0 { union(idx(r,c), ROOF) }\n        for _, d := range dirs {\n            nr, nc := r+d[0], c+d[1]\n            if nr >= 0 && nr < m && nc >= 0 && nc < n && g[nr][nc] == 1 { union(idx(r,c), idx(nr,nc)) }\n        }\n        after := size[find(ROOF)]\n        if a := after - before - 1; a > 0 { ans[i] = a }\n    }\n    return ans\n}"
    }
  }
];

// === wave11b entries (appended) ===
export const WAVE11B_ENTRIES = [
  {
    "slug": "count-substrings-with-only-one-distinct-letter",
    "method_name": "countLetters",
    "params": [
      {
        "name": "s",
        "type": "str"
      }
    ],
    "return_type": "int",
    "hints": [
      "Brute force: enumerate every substring (i, j) and check whether every character in s[i..j] equals s[i]. That is O(n^3) overall and unnecessary work.",
      "Reframe: a substring with only one distinct letter must lie inside a maximal run of identical characters. So decompose s into maximal runs first.",
      "For a run of length k, the substrings sitting entirely inside it are determined by picking a start and an end within the run. The count is k * (k + 1) / 2.",
      "Sweep s with two indices: hold the start of the current run, and when s[i] differs from s[start], close the previous run and accumulate k*(k+1)/2.",
      "Total time O(n), space O(1). Do not forget to close the final run after the loop — that is the most common bug."
    ],
    "tags": [
      "strings",
      "math",
      "two-pointers",
      "easy"
    ],
    "companies": [
      "amazon",
      "google",
      "microsoft",
      "bloomberg"
    ],
    "constraints": "1 <= s.length <= 1000\ns[i] consists of only lowercase English letters.",
    "follow_up": "What if you stream characters in one at a time and must report the running count after each character — can you keep a running total in O(1) per character?",
    "pattern": "run-length-decomposition",
    "test_cases": [
      {
        "inputs": [
          "\"aaaba\""
        ],
        "expected": "8"
      },
      {
        "inputs": [
          "\"aaaaaaaaaa\""
        ],
        "expected": "55"
      },
      {
        "inputs": [
          "\"a\""
        ],
        "expected": "1"
      },
      {
        "inputs": [
          "\"ab\""
        ],
        "expected": "2"
      },
      {
        "inputs": [
          "\"abcdef\""
        ],
        "expected": "6"
      },
      {
        "inputs": [
          "\"aabbcc\""
        ],
        "expected": "9"
      },
      {
        "inputs": [
          "\"aaabbb\""
        ],
        "expected": "12"
      },
      {
        "inputs": [
          "\"zzzzz\""
        ],
        "expected": "15"
      },
      {
        "inputs": [
          "\"abba\""
        ],
        "expected": "5"
      },
      {
        "inputs": [
          "\"aabbaabb\""
        ],
        "expected": "12"
      },
      {
        "inputs": [
          "\"aaabbbccc\""
        ],
        "expected": "18"
      },
      {
        "inputs": [
          "\"xyz\""
        ],
        "expected": "3"
      }
    ],
    "viz_steps": [
      {
        "step": 1,
        "note": "Input s = \"aaaba\". Goal: count substrings whose characters are all equal. Initialise total = 0, run = 1 (one character seen)."
      },
      {
        "step": 2,
        "note": "i=1: s[1]=\"a\" equals s[0]=\"a\". Same run — extend it. run becomes 2."
      },
      {
        "step": 3,
        "note": "i=2: s[2]=\"a\" equals previous. run extends to 3. We are inside the long \"aaa\" run."
      },
      {
        "step": 4,
        "note": "i=3: s[3]=\"b\" differs from \"a\". Close the \"aaa\" run of length 3 → add 3*4/2 = 6 to total. total = 6. Reset run = 1."
      },
      {
        "step": 5,
        "note": "Substrings counted from \"aaa\": \"a\",\"a\",\"a\",\"aa\",\"aa\",\"aaa\" — six in total. Matches."
      },
      {
        "step": 6,
        "note": "i=4: s[4]=\"a\" differs from \"b\". Close the \"b\" run of length 1 → add 1*2/2 = 1. total = 7. Reset run = 1."
      },
      {
        "step": 7,
        "note": "Loop ends. The trailing run of \"a\" (length 1) is still open — must close it."
      },
      {
        "step": 8,
        "note": "Close final run: add 1*2/2 = 1. total = 8."
      },
      {
        "step": 9,
        "note": "Sanity check by hand: \"aaaba\" has runs [aaa, b, a] of lengths 3,1,1 → 6+1+1 = 8. Matches."
      },
      {
        "step": 10,
        "note": "Return 8. One linear pass, constant extra memory."
      }
    ],
    "solutions": {
      "python": "class Solution:\n    def countLetters(self, s):\n        total = 0\n        run = 1\n        for i in range(1, len(s)):\n            if s[i] == s[i - 1]:\n                run += 1\n            else:\n                total += run * (run + 1) // 2\n                run = 1\n        total += run * (run + 1) // 2\n        return total",
      "javascript": "var countLetters = function(s) {\n    let total = 0, run = 1;\n    for (let i = 1; i < s.length; i++) {\n        if (s[i] === s[i - 1]) {\n            run++;\n        } else {\n            total += (run * (run + 1)) / 2;\n            run = 1;\n        }\n    }\n    total += (run * (run + 1)) / 2;\n    return total;\n};",
      "java": "class Solution {\n    public int countLetters(String s) {\n        int total = 0, run = 1;\n        for (int i = 1; i < s.length(); i++) {\n            if (s.charAt(i) == s.charAt(i - 1)) {\n                run++;\n            } else {\n                total += run * (run + 1) / 2;\n                run = 1;\n            }\n        }\n        total += run * (run + 1) / 2;\n        return total;\n    }\n}",
      "cpp": "class Solution {\npublic:\n    int countLetters(string s) {\n        int total = 0, run = 1;\n        for (int i = 1; i < (int)s.size(); i++) {\n            if (s[i] == s[i - 1]) {\n                run++;\n            } else {\n                total += run * (run + 1) / 2;\n                run = 1;\n            }\n        }\n        total += run * (run + 1) / 2;\n        return total;\n    }\n};",
      "typescript": "function countLetters(s: string): number {\n    let total = 0, run = 1;\n    for (let i = 1; i < s.length; i++) {\n        if (s[i] === s[i - 1]) {\n            run++;\n        } else {\n            total += (run * (run + 1)) / 2;\n            run = 1;\n        }\n    }\n    total += (run * (run + 1)) / 2;\n    return total;\n}",
      "go": "func countLetters(s string) int {\n    total, run := 0, 1\n    for i := 1; i < len(s); i++ {\n        if s[i] == s[i-1] {\n            run++\n        } else {\n            total += run * (run + 1) / 2\n            run = 1\n        }\n    }\n    total += run * (run + 1) / 2\n    return total\n}"
    }
  },
  {
    "slug": "unique-number-of-occurrences",
    "method_name": "uniqueOccurrences",
    "params": [
      {
        "name": "arr",
        "type": "List[int]"
      }
    ],
    "return_type": "bool",
    "hints": [
      "Brute force: for every value v in arr, count its occurrences, then for every other value u also count its occurrences and check equality. O(n^3) of pointless rescanning — do it in one pass.",
      "Step 1: build a frequency map value -> count. A single linear pass over arr suffices.",
      "Step 2: the question reduces to \"are all values in the frequency map distinct?\" — i.e. do any two keys share the same count?",
      "Collect the counts into a set as you iterate. If a count is already in the set, return false immediately.",
      "If the loop finishes with no collision, return true. O(n) time, O(n) extra space for the two maps."
    ],
    "tags": [
      "arrays",
      "hash-table",
      "counting",
      "easy"
    ],
    "companies": [
      "amazon",
      "google",
      "microsoft",
      "adobe"
    ],
    "constraints": "1 <= arr.length <= 1000\n-1000 <= arr[i] <= 1000",
    "follow_up": "Could you answer this online as elements stream in — supporting add(x), remove(x), and isUnique() each in O(1) amortised?",
    "pattern": "count-then-dedupe-counts",
    "test_cases": [
      {
        "inputs": [
          "[1,2,2,1,1,3]"
        ],
        "expected": "true"
      },
      {
        "inputs": [
          "[1,2]"
        ],
        "expected": "false"
      },
      {
        "inputs": [
          "[-3,0,1,-3,1,1,1,-3,10,0]"
        ],
        "expected": "true"
      },
      {
        "inputs": [
          "[1]"
        ],
        "expected": "true"
      },
      {
        "inputs": [
          "[1,1,2,2]"
        ],
        "expected": "false"
      },
      {
        "inputs": [
          "[1,1,1,2,2,3]"
        ],
        "expected": "true"
      },
      {
        "inputs": [
          "[5,5,5,5,5]"
        ],
        "expected": "true"
      },
      {
        "inputs": [
          "[1,2,3,4,5]"
        ],
        "expected": "false"
      },
      {
        "inputs": [
          "[0,0,0,1,1,2]"
        ],
        "expected": "true"
      },
      {
        "inputs": [
          "[-1,-1,2,2,3,3]"
        ],
        "expected": "false"
      },
      {
        "inputs": [
          "[1000,-1000,1000]"
        ],
        "expected": "false"
      },
      {
        "inputs": [
          "[7,7,7,8,8,9]"
        ],
        "expected": "true"
      }
    ],
    "viz_steps": [
      {
        "step": 1,
        "note": "Input arr = [1,2,2,1,1,3]. Goal: are the per-value occurrence counts all distinct?"
      },
      {
        "step": 2,
        "note": "Pass 1: build a frequency map. Start with empty map."
      },
      {
        "step": 3,
        "note": "Walk arr. After processing 1,2,2: counts = {1:1, 2:2}."
      },
      {
        "step": 4,
        "note": "Continue with 1,1: counts = {1:3, 2:2}."
      },
      {
        "step": 5,
        "note": "Last element 3: counts = {1:3, 2:2, 3:1}. Linear pass done."
      },
      {
        "step": 6,
        "note": "Pass 2: gather the values of counts and check for duplicates. Initialise seen = {}."
      },
      {
        "step": 7,
        "note": "Insert count 3 (from key 1). seen = {3}. No collision."
      },
      {
        "step": 8,
        "note": "Insert count 2 (from key 2). seen = {2,3}. No collision."
      },
      {
        "step": 9,
        "note": "Insert count 1 (from key 3). seen = {1,2,3}. No collision."
      },
      {
        "step": 10,
        "note": "All counts distinct. Return true. Total work O(n) time, O(k) extra space where k = distinct values."
      }
    ],
    "solutions": {
      "python": "class Solution:\n    def uniqueOccurrences(self, arr):\n        counts = {}\n        for x in arr:\n            counts[x] = counts.get(x, 0) + 1\n        seen = set()\n        for c in counts.values():\n            if c in seen:\n                return False\n            seen.add(c)\n        return True",
      "javascript": "var uniqueOccurrences = function(arr) {\n    const counts = new Map();\n    for (const x of arr) {\n        counts.set(x, (counts.get(x) || 0) + 1);\n    }\n    const seen = new Set();\n    for (const c of counts.values()) {\n        if (seen.has(c)) return false;\n        seen.add(c);\n    }\n    return true;\n};",
      "java": "class Solution {\n    public boolean uniqueOccurrences(int[] arr) {\n        Map<Integer, Integer> counts = new HashMap<>();\n        for (int x : arr) {\n            counts.merge(x, 1, Integer::sum);\n        }\n        Set<Integer> seen = new HashSet<>();\n        for (int c : counts.values()) {\n            if (!seen.add(c)) return false;\n        }\n        return true;\n    }\n}",
      "cpp": "class Solution {\npublic:\n    bool uniqueOccurrences(vector<int>& arr) {\n        unordered_map<int, int> counts;\n        for (int x : arr) counts[x]++;\n        unordered_set<int> seen;\n        for (auto& kv : counts) {\n            if (!seen.insert(kv.second).second) return false;\n        }\n        return true;\n    }\n};",
      "typescript": "function uniqueOccurrences(arr: number[]): boolean {\n    const counts = new Map<number, number>();\n    for (const x of arr) {\n        counts.set(x, (counts.get(x) || 0) + 1);\n    }\n    const seen = new Set<number>();\n    for (const c of counts.values()) {\n        if (seen.has(c)) return false;\n        seen.add(c);\n    }\n    return true;\n}",
      "go": "func uniqueOccurrences(arr []int) bool {\n    counts := make(map[int]int)\n    for _, x := range arr {\n        counts[x]++\n    }\n    seen := make(map[int]bool)\n    for _, c := range counts {\n        if seen[c] {\n            return false\n        }\n        seen[c] = true\n    }\n    return true\n}"
    }
  }
];
