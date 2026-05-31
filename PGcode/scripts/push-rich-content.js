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
