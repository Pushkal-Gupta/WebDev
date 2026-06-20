#!/usr/bin/env node
// Atomic splice: 3 reservoir-sampling / shuffle design problems with inline viz + 6-lang solutions.
// Re-runnable: detects already-spliced state and exits cleanly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'src', 'content', 'problemContent.js');

const src = fs.readFileSync(FILE, 'utf8');

if (src.includes('function linkedListRandomNodeViz(')
  || src.includes("'linked-list-random-node':")
  || src.includes('"linked-list-random-node":')
  || src.includes("'linked-list-random':")) {
  console.log('Already spliced — nothing to do.');
  process.exit(0);
}

const VIZ_BLOCK = `function linkedListRandomNodeViz() {
  const frames = [];
  const values = [7, 3, 9, 5, 1, 8, 6];

  frames.push({
    array: values.map((v, i) => 'n' + i + '=' + v),
    chip: [
      { label: 'algo', value: 'reservoir sampling k=1', tone: 'violet' },
      { label: 'invariant', value: 'every node has prob 1/seen', tone: 'violet' },
    ],
    caption: 'Linked list with unknown length. We cannot count first then index — that would be two passes. Reservoir sampling does it in one pass: at node i (1-indexed), keep it with probability 1/i, otherwise keep the current pick. Inductive proof: when we reach node n, every earlier node has survived with prob (1/i) * (i/(i+1)) * ((i+1)/(i+2)) * ... * ((n-1)/n) = 1/n, and node n itself is taken with 1/n.',
  });

  // Use a deterministic pseudo-random sequence so frames are reproducible.
  // Seed picked so the pick actually moves a few times across the walk.
  let seed = 1337;
  const rand = (mod) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % mod; };

  let pick = null;
  let pickIdx = -1;

  for (let i = 0; i < values.length; i++) {
    const r = rand(i + 1);
    const take = r === 0; // probability 1/(i+1)
    const prev = pick;
    if (take) { pick = values[i]; pickIdx = i; }

    const row = values.map((v, j) => {
      if (j < i) return 'n' + j + '=' + v;
      if (j === i) return '[n' + j + '=' + v + ']';
      return 'n' + j + '=' + v;
    });

    frames.push({
      array: row,
      pointers: [
        { index: i, label: 'walk' },
        ...(pickIdx >= 0 ? [{ index: pickIdx, label: 'kept' }] : []),
      ],
      chip: [
        { label: 'i', value: String(i + 1), tone: 'violet' },
        { label: 'prob', value: '1/' + (i + 1), tone: 'pink' },
        { label: 'roll', value: r + '/' + (i + 1), tone: take ? 'mint' : 'sky' },
        { label: 'pick', value: pick === null ? 'null' : String(pick), tone: 'violet' },
      ],
      caption: take
        ? 'At node ' + i + ' (value ' + values[i] + '): roll r=' + r + ' against ' + (i + 1) + '. r === 0 fires with probability 1/' + (i + 1) + ' — REPLACE the kept value' + (prev === null ? '' : ' (was ' + prev + ')') + ' with ' + values[i] + '. The previous pick has been silently dropped; the invariant holds because its survival path multiplies down to 1/n at the end.'
        : 'At node ' + i + ' (value ' + values[i] + '): roll r=' + r + ' against ' + (i + 1) + '. r !== 0 means KEEP the current pick ' + pick + '. Each earlier node was kept with probability 1/(i+1) and now survives this step with probability i/(i+1).',
    });
  }

  frames.push({
    array: ['final pick: ' + pick],
    chip: [
      { label: 'returned', value: String(pick), tone: 'mint' },
      { label: 'space', value: 'O(1) — one variable', tone: 'violet' },
      { label: 'time', value: 'O(n) per call', tone: 'violet' },
    ],
    caption: 'One pass, O(1) extra memory, every node returned with probability exactly 1/n. The constructor stores the head pointer only — no precomputed array, no length count. For the follow-up (very large list, you cannot afford O(n) per call), precompute the values into an array once and serve calls in O(1), trading space for amortised call cost.',
  });

  return { renderer: 'array', title: 'Linked List Random Node — reservoir sampling k=1', frames };
}

function randomPickIndexViz() {
  const frames = [];
  const nums = [1, 2, 3, 3, 3, 2, 3, 1, 3];
  const target = 3;
  const matches = [];
  for (let i = 0; i < nums.length; i++) if (nums[i] === target) matches.push(i);

  frames.push({
    array: nums.map((v, i) => (v === target ? '[' + i + ':' + v + ']' : i + ':' + v)),
    chip: [
      { label: 'target', value: String(target), tone: 'pink' },
      { label: 'matches', value: matches.length + ' indices', tone: 'violet' },
      { label: 'goal', value: 'pick one uniformly', tone: 'violet' },
    ],
    caption: 'Reservoir sampling for "pick a random index whose value equals target". Naive would scan once to collect matches into a list, then index uniformly — O(n) space per call. Reservoir does it in one pass with O(1) extra space: count matches as we go, and at the kth match, replace the kept index with probability 1/k.',
  });

  let seed = 424242;
  const rand = (mod) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % mod; };

  let k = 0;
  let pick = -1;

  for (let i = 0; i < nums.length; i++) {
    const isMatch = nums[i] === target;
    if (!isMatch) {
      frames.push({
        array: nums.map((v, j) => {
          if (j === i) return '<' + j + ':' + v + '>';
          if (v === target) return '[' + j + ':' + v + ']';
          return j + ':' + v;
        }),
        pointers: [
          { index: i, label: 'i' },
          ...(pick >= 0 ? [{ index: pick, label: 'pick' }] : []),
        ],
        chip: [
          { label: 'i', value: String(i), tone: 'violet' },
          { label: 'val', value: String(nums[i]), tone: 'sky' },
          { label: 'k', value: String(k), tone: 'violet' },
          { label: 'pick', value: pick === -1 ? '—' : String(pick), tone: 'violet' },
        ],
        caption: 'Index ' + i + ' has value ' + nums[i] + ' which is not ' + target + ' — skip. The match counter k stays at ' + k + '; the kept index does not change.',
      });
      continue;
    }
    k += 1;
    const r = rand(k);
    const take = r === 0; // prob 1/k
    const prev = pick;
    if (take) pick = i;
    frames.push({
      array: nums.map((v, j) => {
        if (j === i) return '<' + j + ':' + v + '>';
        if (v === target) return '[' + j + ':' + v + ']';
        return j + ':' + v;
      }),
      pointers: [
        { index: i, label: 'i' },
        { index: pick, label: 'pick' },
      ],
      chip: [
        { label: 'i', value: String(i), tone: 'violet' },
        { label: 'val', value: String(nums[i]), tone: 'mint' },
        { label: 'k', value: String(k), tone: 'pink' },
        { label: 'roll', value: r + '/' + k, tone: take ? 'mint' : 'sky' },
        { label: 'pick', value: String(pick), tone: 'violet' },
      ],
      caption: take
        ? 'Match #' + k + ' at index ' + i + '. Roll r=' + r + ' against k=' + k + '; r === 0 fires with probability 1/' + k + ' — REPLACE the kept index ' + (prev === -1 ? '(none)' : prev) + ' with ' + i + '.'
        : 'Match #' + k + ' at index ' + i + '. Roll r=' + r + ' against k=' + k + '; r !== 0 means KEEP the current pick ' + pick + '. Earlier matches survive with probability (k-1)/k each step.',
    });
  }

  frames.push({
    array: ['final picked index: ' + pick + ' (nums[' + pick + ']=' + nums[pick] + ')'],
    chip: [
      { label: 'returned', value: String(pick), tone: 'mint' },
      { label: 'matches seen', value: String(k), tone: 'violet' },
      { label: 'uniform', value: '1/' + k + ' per match', tone: 'violet' },
    ],
    caption: 'Every matching index ended up returned with probability exactly 1/k where k is the total count of matches — without ever materialising the list of matches. O(n) time per call, O(1) extra space. If pick is called many times, precompute a Map<value, indices[]> in the constructor and answer each call in O(1) — that is the standard space/time trade.',
  });

  return { renderer: 'array', title: 'Random Pick Index — reservoir over matches', frames };
}

function shuffleAnArrayViz() {
  const frames = [];
  const original = [1, 2, 3, 4, 5, 6];

  frames.push({
    array: original.map((v, i) => i + ':' + v),
    chip: [
      { label: 'algo', value: 'Fisher–Yates (Knuth) shuffle', tone: 'violet' },
      { label: 'invariant', value: 'every permutation equally likely (n!)', tone: 'violet' },
    ],
    caption: 'Two operations: reset() returns the original array, shuffle() returns a uniformly random permutation. The naive shuffle (sort by random keys) is biased and O(n log n); Fisher–Yates is unbiased and O(n). Idea: walk from i=0 to n-1, swap a[i] with a[rand(i..n-1)]. After the loop, every one of the n! permutations has probability exactly 1/n!.',
  });

  // First pass: shuffle.
  let seed = 90210;
  const rand = (mod) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % mod; };

  const arr = original.slice();
  const n = arr.length;

  for (let i = 0; i < n; i++) {
    const span = n - i;
    const r = rand(span);
    const j = i + r;
    const before = arr.slice();
    if (j !== i) { const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; }
    frames.push({
      array: arr.map((v, k) => {
        if (k === i) return '*' + v + '*';
        if (k === j && j !== i) return '<' + v + '>';
        if (k < i) return v + '_';
        return String(v);
      }),
      pointers: [
        { index: i, label: 'i' },
        ...(j !== i ? [{ index: j, label: 'j' }] : []),
      ],
      chip: [
        { label: 'i', value: String(i), tone: 'violet' },
        { label: 'range', value: '[' + i + '..' + (n - 1) + ']', tone: 'sky' },
        { label: 'roll', value: r + '/' + span, tone: 'pink' },
        { label: 'j', value: String(j), tone: 'violet' },
        { label: 'op', value: j === i ? 'no-op' : 'swap(' + i + ',' + j + ')', tone: j === i ? 'sky' : 'mint' },
      ],
      caption: j === i
        ? 'Slot ' + i + ': pick j uniformly from [' + i + '..' + (n - 1) + '] (span ' + span + '). Drew j=' + j + ', same as i — no swap needed. The element ' + before[i] + ' is now LOCKED at index ' + i + '.'
        : 'Slot ' + i + ': pick j uniformly from [' + i + '..' + (n - 1) + '] (span ' + span + '). Drew j=' + j + ', swap a[' + i + ']=' + before[i] + ' with a[' + j + ']=' + before[j] + '. The chosen value ' + arr[i] + ' is now LOCKED at index ' + i + '; the displaced ' + arr[j] + ' goes back into the unprocessed suffix.',
    });
  }

  frames.push({
    array: arr.map((v, k) => k + ':' + v),
    chip: [
      { label: 'shuffle()', value: '[' + arr.join(',') + ']', tone: 'mint' },
      { label: 'time', value: 'O(n)', tone: 'violet' },
      { label: 'space', value: 'O(n) for the shuffled copy', tone: 'violet' },
    ],
    caption: 'Shuffle complete. Each of the 6! = 720 permutations was equally likely. Common bug: picking j from [0..n-1] every step instead of [i..n-1] — that gives n^n equally likely outcomes which do not divide n! evenly, so some permutations end up over-represented (the classic "naive shuffle bias").',
  });

  frames.push({
    array: original.map((v, k) => k + ':' + v),
    chip: [
      { label: 'reset()', value: '[' + original.join(',') + ']', tone: 'pink' },
      { label: 'stored', value: 'original kept verbatim in ctor', tone: 'violet' },
    ],
    caption: 'reset() returns the original configuration. The constructor keeps a separate copy (or stores the reference and shuffles into a fresh array each time) so reset is always O(n) and independent of how many shuffles happened in between.',
  });

  return { renderer: 'array', title: 'Shuffle an Array — Fisher–Yates in place', frames };
}

`;

const ENTRY_BLOCK = `  'linked-list-random-node': {
    tags: ['design', 'linked-list', 'math', 'reservoir-sampling', 'randomized'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: linkedListRandomNodeViz(),
    solutions: {
      python: {
        code: \`import random
from typing import Optional

class ListNode:
    def __init__(self, val: int = 0, next: 'Optional[ListNode]' = None):
        self.val = val
        self.next = next

class Solution:
    def __init__(self, head: Optional[ListNode]):
        self.head = head

    def getRandom(self) -> int:
        pick = self.head.val
        node = self.head.next
        i = 2
        while node is not None:
            if random.randrange(i) == 0:
                pick = node.val
            node = node.next
            i += 1
        return pick\`,
        complexity: { time: 'O(n) per getRandom call', space: 'O(1) extra' },
        approach: 'Reservoir sampling k=1. Walk the list once; at the i-th node (1-indexed), replace the kept value with probability 1/i. By induction every node ends up returned with probability 1/n.',
      },
      javascript: {
        code: \`/**
 * @param {ListNode} head
 */
var Solution = function(head) {
  this.head = head;
};

Solution.prototype.getRandom = function() {
  let pick = this.head.val;
  let node = this.head.next;
  let i = 2;
  while (node !== null) {
    if (Math.floor(Math.random() * i) === 0) pick = node.val;
    node = node.next;
    i += 1;
  }
  return pick;
};\`,
        complexity: { time: 'O(n) per getRandom call', space: 'O(1) extra' },
        approach: 'Reservoir sampling. Math.floor(Math.random() * i) hits 0 with probability 1/i — that is the replace gate. One pass per call, no array allocation.',
      },
      java: {
        code: \`import java.util.Random;

class Solution {
    private final ListNode head;
    private final Random rng = new Random();

    public Solution(ListNode head) {
        this.head = head;
    }

    public int getRandom() {
        int pick = head.val;
        ListNode node = head.next;
        int i = 2;
        while (node != null) {
            if (rng.nextInt(i) == 0) pick = node.val;
            node = node.next;
            i++;
        }
        return pick;
    }
}\`,
        complexity: { time: 'O(n) per getRandom call', space: 'O(1) extra' },
        approach: 'Reuse a single Random instance across calls — re-seeding per call would burn entropy and slow things down. nextInt(i) returns [0..i-1] uniformly; equality with 0 fires with probability 1/i.',
      },
      cpp: {
        code: \`#include <cstdlib>

struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(nullptr) {}
};

class Solution {
    ListNode* head;
public:
    Solution(ListNode* head) : head(head) {}

    int getRandom() {
        int pick = head->val;
        ListNode* node = head->next;
        int i = 2;
        while (node != nullptr) {
            if (rand() % i == 0) pick = node->val;
            node = node->next;
            i++;
        }
        return pick;
    }
};\`,
        complexity: { time: 'O(n) per getRandom call', space: 'O(1) extra' },
        approach: 'rand() % i is fine here because the contract does not require cryptographic uniformity. For production code prefer std::mt19937 + std::uniform_int_distribution to dodge modulo bias on tight ranges.',
      },
      c: {
        code: \`#include <stdlib.h>

struct ListNode {
    int val;
    struct ListNode* next;
};

typedef struct {
    struct ListNode* head;
} Solution;

Solution* solutionCreate(struct ListNode* head) {
    Solution* s = (Solution*)malloc(sizeof(Solution));
    s->head = head;
    return s;
}

int solutionGetRandom(Solution* s) {
    int pick = s->head->val;
    struct ListNode* node = s->head->next;
    int i = 2;
    while (node != NULL) {
        if (rand() % i == 0) pick = node->val;
        node = node->next;
        i++;
    }
    return pick;
}

void solutionFree(Solution* s) { free(s); }\`,
        complexity: { time: 'O(n) per getRandom call', space: 'O(1) extra' },
        approach: 'Plain reservoir. Caller is expected to have srand()-ed once at program start; per-call seeding would destroy independence between successive picks.',
      },
      go: {
        code: \`package solution

import "math/rand"

type ListNode struct {
    Val  int
    Next *ListNode
}

type Solution struct {
    head *ListNode
}

func Constructor(head *ListNode) Solution {
    return Solution{head: head}
}

func (s *Solution) GetRandom() int {
    pick := s.head.Val
    node := s.head.Next
    i := 2
    for node != nil {
        if rand.Intn(i) == 0 {
            pick = node.Val
        }
        node = node.Next
        i++
    }
    return pick
}\`,
        complexity: { time: 'O(n) per getRandom call', space: 'O(1) extra' },
        approach: 'math/rand is fine for the problem contract. rand.Intn(i) returns [0..i-1] uniformly; the global source is seeded automatically in Go 1.20+.',
      },
    },
  },
  'random-pick-index': {
    tags: ['design', 'hash-table', 'math', 'reservoir-sampling', 'randomized'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: randomPickIndexViz(),
    solutions: {
      python: {
        code: \`import random
from typing import List

class Solution:
    def __init__(self, nums: List[int]):
        self.nums = nums

    def pick(self, target: int) -> int:
        chosen = -1
        count = 0
        for i, v in enumerate(self.nums):
            if v != target:
                continue
            count += 1
            if random.randrange(count) == 0:
                chosen = i
        return chosen\`,
        complexity: { time: 'O(n) per pick call', space: 'O(1) extra' },
        approach: 'Reservoir sampling over matches only. count is the running number of matches seen so far; at the kth match, replace the chosen index with probability 1/k. Induction gives uniform 1/K over the total K matches.',
      },
      javascript: {
        code: \`/**
 * @param {number[]} nums
 */
var Solution = function(nums) {
  this.nums = nums;
};

Solution.prototype.pick = function(target) {
  let chosen = -1;
  let count = 0;
  for (let i = 0; i < this.nums.length; i++) {
    if (this.nums[i] !== target) continue;
    count += 1;
    if (Math.floor(Math.random() * count) === 0) chosen = i;
  }
  return chosen;
};\`,
        complexity: { time: 'O(n) per pick call', space: 'O(1) extra' },
        approach: 'Single pass, no auxiliary list of matching indices. Trades memory for per-call CPU — exactly the spec when nums is huge but pick is called rarely.',
      },
      java: {
        code: \`import java.util.Random;

class Solution {
    private final int[] nums;
    private final Random rng = new Random();

    public Solution(int[] nums) {
        this.nums = nums;
    }

    public int pick(int target) {
        int chosen = -1;
        int count = 0;
        for (int i = 0; i < nums.length; i++) {
            if (nums[i] != target) continue;
            count++;
            if (rng.nextInt(count) == 0) chosen = i;
        }
        return chosen;
    }
}\`,
        complexity: { time: 'O(n) per pick call', space: 'O(1) extra' },
        approach: 'Reservoir over matches. If pick will be called many times with the same target, switch to a HashMap<Integer, List<Integer>> built in the constructor — O(1) per call after O(n) prebuild.',
      },
      cpp: {
        code: \`#include <vector>
#include <cstdlib>

class Solution {
    std::vector<int> nums;
public:
    Solution(std::vector<int>& nums) : nums(nums) {}

    int pick(int target) {
        int chosen = -1;
        int count = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            if (nums[i] != target) continue;
            count++;
            if (rand() % count == 0) chosen = i;
        }
        return chosen;
    }
};\`,
        complexity: { time: 'O(n) per pick call', space: 'O(1) extra' },
        approach: 'Store nums by value so the Solution outlives the caller-owned vector. For tighter uniformity swap rand() for std::mt19937.',
      },
      c: {
        code: \`#include <stdlib.h>
#include <string.h>

typedef struct {
    int* nums;
    int n;
} Solution;

Solution* solutionCreate(int* nums, int n) {
    Solution* s = (Solution*)malloc(sizeof(Solution));
    s->nums = (int*)malloc(sizeof(int) * n);
    memcpy(s->nums, nums, sizeof(int) * n);
    s->n = n;
    return s;
}

int solutionPick(Solution* s, int target) {
    int chosen = -1;
    int count = 0;
    for (int i = 0; i < s->n; i++) {
        if (s->nums[i] != target) continue;
        count++;
        if (rand() % count == 0) chosen = i;
    }
    return chosen;
}

void solutionFree(Solution* s) { free(s->nums); free(s); }\`,
        complexity: { time: 'O(n) per pick call', space: 'O(1) extra' },
        approach: 'Defensive copy of nums into the struct — the caller may free the input array between constructor and pick. count never wraps because n is bounded by the problem.',
      },
      go: {
        code: \`package solution

import "math/rand"

type Solution struct {
    nums []int
}

func Constructor(nums []int) Solution {
    return Solution{nums: nums}
}

func (s *Solution) Pick(target int) int {
    chosen := -1
    count := 0
    for i, v := range s.nums {
        if v != target {
            continue
        }
        count++
        if rand.Intn(count) == 0 {
            chosen = i
        }
    }
    return chosen
}\`,
        complexity: { time: 'O(n) per pick call', space: 'O(1) extra' },
        approach: 'Storing the slice header is enough — the underlying array is shared with the caller, which matches the problem spec where nums is immutable for the lifetime of Solution.',
      },
    },
  },
  'shuffle-an-array': {
    tags: ['design', 'array', 'math', 'randomized', 'fisher-yates'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: shuffleAnArrayViz(),
    solutions: {
      python: {
        code: \`import random
from typing import List

class Solution:
    def __init__(self, nums: List[int]):
        self.original = nums[:]
        self.arr = nums[:]

    def reset(self) -> List[int]:
        self.arr = self.original[:]
        return self.arr

    def shuffle(self) -> List[int]:
        a = self.original[:]
        n = len(a)
        for i in range(n):
            j = random.randrange(i, n)
            a[i], a[j] = a[j], a[i]
        self.arr = a
        return a\`,
        complexity: { time: 'reset O(n); shuffle O(n)', space: 'O(n) for the kept copy' },
        approach: 'Fisher–Yates: for each i in [0..n-1], swap a[i] with a uniformly random a[j] where j is drawn from [i..n-1]. Every permutation lands with probability exactly 1/n!. Keep the original array verbatim so reset is a single copy.',
      },
      javascript: {
        code: \`/**
 * @param {number[]} nums
 */
var Solution = function(nums) {
  this.original = nums.slice();
  this.arr = nums.slice();
};

Solution.prototype.reset = function() {
  this.arr = this.original.slice();
  return this.arr;
};

Solution.prototype.shuffle = function() {
  const a = this.original.slice();
  const n = a.length;
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (n - i));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  this.arr = a;
  return a;
};\`,
        complexity: { time: 'reset O(n); shuffle O(n)', space: 'O(n) for the kept copy' },
        approach: 'Critical: the random index j ranges over [i..n-1], not [0..n-1]. The naive version (j in [0..n-1]) gives n^n equally likely outcomes — biased because n^n is not divisible by n!.',
      },
      java: {
        code: \`import java.util.Random;

class Solution {
    private final int[] original;
    private int[] arr;
    private final Random rng = new Random();

    public Solution(int[] nums) {
        this.original = nums.clone();
        this.arr = nums.clone();
    }

    public int[] reset() {
        this.arr = original.clone();
        return arr;
    }

    public int[] shuffle() {
        int[] a = original.clone();
        int n = a.length;
        for (int i = 0; i < n; i++) {
            int j = i + rng.nextInt(n - i);
            int tmp = a[i]; a[i] = a[j]; a[j] = tmp;
        }
        this.arr = a;
        return a;
    }
}\`,
        complexity: { time: 'reset O(n); shuffle O(n)', space: 'O(n) for the kept copy' },
        approach: 'original.clone() in the constructor isolates us from caller mutations. nextInt(n - i) gives the correct [0..n-i-1] range, offset by i for the swap partner.',
      },
      cpp: {
        code: \`#include <vector>
#include <cstdlib>

class Solution {
    std::vector<int> original;
    std::vector<int> arr;
public:
    Solution(std::vector<int>& nums) : original(nums), arr(nums) {}

    std::vector<int> reset() {
        arr = original;
        return arr;
    }

    std::vector<int> shuffle() {
        std::vector<int> a = original;
        int n = (int)a.size();
        for (int i = 0; i < n; i++) {
            int j = i + rand() % (n - i);
            std::swap(a[i], a[j]);
        }
        arr = a;
        return a;
    }
};\`,
        complexity: { time: 'reset O(n); shuffle O(n)', space: 'O(n) for the kept copy' },
        approach: 'Copy-construct original from the input so the caller can free its vector. std::swap is the textbook fit; for tighter uniformity at small ranges, mt19937 + uniform_int_distribution would replace rand() % (n - i).',
      },
      c: {
        code: \`#include <stdlib.h>
#include <string.h>

typedef struct {
    int* original;
    int* arr;
    int n;
} Solution;

Solution* solutionCreate(int* nums, int n) {
    Solution* s = (Solution*)malloc(sizeof(Solution));
    s->original = (int*)malloc(sizeof(int) * n);
    s->arr = (int*)malloc(sizeof(int) * n);
    memcpy(s->original, nums, sizeof(int) * n);
    memcpy(s->arr, nums, sizeof(int) * n);
    s->n = n;
    return s;
}

int* solutionReset(Solution* s, int* returnSize) {
    memcpy(s->arr, s->original, sizeof(int) * s->n);
    *returnSize = s->n;
    return s->arr;
}

int* solutionShuffle(Solution* s, int* returnSize) {
    memcpy(s->arr, s->original, sizeof(int) * s->n);
    for (int i = 0; i < s->n; i++) {
        int j = i + rand() % (s->n - i);
        int tmp = s->arr[i]; s->arr[i] = s->arr[j]; s->arr[j] = tmp;
    }
    *returnSize = s->n;
    return s->arr;
}

void solutionFree(Solution* s) { free(s->original); free(s->arr); free(s); }\`,
        complexity: { time: 'reset O(n); shuffle O(n)', space: 'O(n) for the kept copy' },
        approach: 'Two persistent buffers (original + arr) avoid per-call malloc. Returning the same arr pointer is fine because LeetCode harnesses copy out before the next call.',
      },
      go: {
        code: \`package solution

import "math/rand"

type Solution struct {
    original []int
    arr      []int
}

func Constructor(nums []int) Solution {
    orig := make([]int, len(nums))
    copy(orig, nums)
    arr := make([]int, len(nums))
    copy(arr, nums)
    return Solution{original: orig, arr: arr}
}

func (s *Solution) Reset() []int {
    copy(s.arr, s.original)
    return s.arr
}

func (s *Solution) Shuffle() []int {
    copy(s.arr, s.original)
    n := len(s.arr)
    for i := 0; i < n; i++ {
        j := i + rand.Intn(n-i)
        s.arr[i], s.arr[j] = s.arr[j], s.arr[i]
    }
    return s.arr
}\`,
        complexity: { time: 'reset O(n); shuffle O(n)', space: 'O(n) for the kept copy' },
        approach: 'Defensive copy in the constructor so caller-side reuse of nums cannot leak into Solution. rand.Intn(n - i) gives [0..n-i-1]; offset by i to land on the swap partner inside the unprocessed suffix.',
      },
    },
  },
`;

const VIZ_ANCHOR = "export const RICH_CONTENT = {";
const vizIdx = src.indexOf(VIZ_ANCHOR);
if (vizIdx < 0) {
  console.error('Could not find RICH_CONTENT anchor.');
  process.exit(1);
}

const openBracePos = src.indexOf('{', vizIdx);
// String/template-literal aware brace matcher.
let depth = 0, closeIdx = -1;
let state = 'code'; // code | sq | dq | tpl | line-comment | block-comment
for (let p = openBracePos; p < src.length; p++) {
  const ch = src[p];
  const nx = src[p + 1];
  if (state === 'code') {
    if (ch === '/' && nx === '/') { state = 'line-comment'; p++; continue; }
    if (ch === '/' && nx === '*') { state = 'block-comment'; p++; continue; }
    if (ch === "'") { state = 'sq'; continue; }
    if (ch === '"') { state = 'dq'; continue; }
    if (ch === '`') { state = 'tpl'; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { closeIdx = p; break; }
    }
  } else if (state === 'line-comment') {
    if (ch === '\n') state = 'code';
  } else if (state === 'block-comment') {
    if (ch === '*' && nx === '/') { state = 'code'; p++; }
  } else if (state === 'sq') {
    if (ch === '\\') { p++; continue; }
    if (ch === "'") state = 'code';
  } else if (state === 'dq') {
    if (ch === '\\') { p++; continue; }
    if (ch === '"') state = 'code';
  } else if (state === 'tpl') {
    if (ch === '\\') { p++; continue; }
    if (ch === '`') state = 'code';
  }
}
if (closeIdx < 0) {
  console.error('Could not match RICH_CONTENT closing brace.');
  process.exit(1);
}

const before = src.slice(0, vizIdx);
const richBody = src.slice(openBracePos + 1, closeIdx);
const after = src.slice(closeIdx);

const out = before + VIZ_BLOCK + VIZ_ANCHOR + '{' + richBody + ENTRY_BLOCK + after.slice(0);

fs.writeFileSync(FILE, out, 'utf8');
console.log('Spliced 3 reservoir/shuffle viz fns + 3 entries into ' + path.basename(FILE));
console.log('  before: ' + src.length + ' bytes');
console.log('  after:  ' + out.length + ' bytes');
