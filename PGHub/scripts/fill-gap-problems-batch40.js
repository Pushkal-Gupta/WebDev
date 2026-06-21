#!/usr/bin/env node
// Batch 40 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   2803,2804,2805,2814,2819,2820,2821,2822,2823,2832,2837,2838,2847,2852,2853
//
//   node scripts/fill-gap-problems-batch40.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch40.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch40.js --verify  # re-run stored solutions vs stored cases
//
// Every test-case `expected` is produced by ACTUALLY RUNNING the canonical Python here,
// so each inserted problem passes its own cases by construction.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const VERIFY = args.includes('--verify');
const cliNums = args.filter((a) => /^\d+$/.test(a)).map(Number);

const BATCH = [2803, 2804, 2805, 2814, 2819, 2820, 2821, 2822, 2823, 2832, 2837, 2838, 2847, 2852, 2853];

const PY_SERIALIZER = `
import json, sys, math
from collections import defaultdict, Counter, deque
import heapq
def _ser(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, str):
        return v
    return json.dumps(v, separators=(",", ":"))
`;

const PROBLEMS = [
  {
    n: 2803,
    id: 'pghub-b40-elevator-stops',
    name: 'Elevator Energy Stops',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'energyUsed',
    params: [{ name: 'floors', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'An elevator visits the floors in <code>floors</code> in order, starting from the first floor in the list. Moving between two consecutive requested floors costs energy equal to the absolute difference of their floor numbers. Return the total energy consumed over the whole trip.',
    examples: [
      ['[1,5,2]', '7', 'Move 1 to 5 costs 4, then 5 to 2 costs 3, total 7.'],
      ['[3]', '0', 'A single floor requires no movement.'],
    ],
    constraints: ['1 <= floors.length <= 10^5', '0 <= floors[i] <= 10^4'],
    tags: ['arrays', 'math'],
    py: `def energyUsed(floors):
    total = 0
    for i in range(1, len(floors)):
        total += abs(floors[i] - floors[i - 1])
    return total`,
    approach:
      'Each leg of the trip moves the elevator between two consecutive requested floors, and its cost is the absolute difference of those floor numbers. Sum the absolute differences across every adjacent pair in a single pass; a trip of one floor contributes nothing.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,5,2]'],
      ['[3]'],
      ['[0,10]'],
      ['[5,5,5]'],
      ['[1,2,3,4,5]'],
      ['[10,1,10,1]'],
      ['[0]'],
      ['[7,3]'],
      ['[2,8,4,9,1]'],
      ['[100,0,100]'],
    ],
  },
  {
    n: 2804,
    id: 'pghub-b40-receipt-rounding',
    name: 'Receipt Cash Rounding',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'roundedTotal',
    params: [{ name: 'cents', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A shop sums all line-item prices in <code>cents</code>, then rounds the grand total to the nearest multiple of 5 cents for cash payment, rounding halves (a remainder of exactly 2 or 3 toward the nearer multiple) the standard way: remainders 1 and 2 round down, remainders 3 and 4 round up. Return the rounded total in cents.',
    examples: [
      ['[12,13]', '25', 'Sum is 25, already a multiple of 5.'],
      ['[12,11]', '25', 'Sum is 23; remainder 3 rounds up to 25.'],
    ],
    constraints: ['1 <= cents.length <= 10^5', '0 <= cents[i] <= 10^6'],
    tags: ['math', 'arrays'],
    py: `def roundedTotal(cents):
    total = sum(cents)
    rem = total % 5
    if rem == 0:
        return total
    if rem <= 2:
        return total - rem
    return total + (5 - rem)`,
    approach:
      'Add up every line item, then look at the total modulo five. A remainder of zero is already aligned; remainders of one or two are closer to the lower multiple so they round down, while three or four are closer to the upper multiple so they round up. Adjust the total accordingly.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[12,13]'],
      ['[12,11]'],
      ['[1]'],
      ['[2]'],
      ['[3]'],
      ['[4]'],
      ['[0]'],
      ['[100,100,100]'],
      ['[7,7,7,7]'],
      ['[1000000,3]'],
    ],
  },
  {
    n: 2805,
    id: 'pghub-b40-keypad-letters',
    name: 'Old Phone Keypad Letters',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'keyPresses',
    params: [{ name: 'word', type: 'str' }],
    return_type: 'int',
    statement:
      'On an old phone keypad each lowercase letter requires a number of presses equal to its position within its key group: a=1, b=2, c=3, d=1, e=2, f=3, and so on in groups of three through x, then y=1, z=2 (the last group has only y and z). Given a lowercase <code>word</code>, return the total number of key presses needed to type it.',
    examples: [
      ['abc', '6', 'a=1, b=2, c=3, total 6.'],
      ['zy', '3', 'z=2 and y=1.'],
    ],
    constraints: ['1 <= word.length <= 10^5', 'word consists of lowercase English letters'],
    tags: ['strings', 'simulation'],
    py: `def keyPresses(word):
    total = 0
    for ch in word:
        total += (ord(ch) - ord('a')) % 3 + 1
    return total`,
    approach:
      'The letters are laid out three to a key, so a letter taken modulo three within the alphabet gives its offset inside the group; adding one converts the zero-based offset into a press count. Because the pattern repeats cleanly every three letters all the way through z, summing this per character yields the total presses.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ["'abc'"],
      ["'zy'"],
      ["'a'"],
      ["'z'"],
      ["'def'"],
      ["'hello'"],
      ["'xyz'"],
      ["'aaaa'"],
      ["'abcdefghi'"],
      ["'thequickbrownfox'"],
    ],
  },
  {
    n: 2814,
    id: 'pghub-b40-water-tanks',
    name: 'Balance Water Tanks',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minPours',
    params: [{ name: 'tanks', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Several water <code>tanks</code> hold the given litres. In one pour you may move any whole number of litres from one tank to another. The total volume is guaranteed to divide evenly among the tanks. Return the minimum number of pours needed so every tank holds the same amount.',
    examples: [
      ['[4,0,0,0]', '3', 'Pour from the full tank into each of the three empty ones.'],
      ['[2,2,2]', '0', 'Already balanced.'],
    ],
    constraints: ['1 <= tanks.length <= 10^5', '0 <= tanks[i] <= 10^9', 'sum(tanks) is divisible by tanks.length'],
    tags: ['greedy', 'arrays'],
    py: `def minPours(tanks):
    avg = sum(tanks) // len(tanks)
    return sum(1 for t in tanks if t != avg)`,
    approach:
      'Each tank must end at the common average. Any tank already at the average needs no pour, while every tank that is above or below it must be touched by at least one pour, and a single pour per off-target tank also suffices because surplus can always be routed to fill deficits. So the answer is simply the count of tanks not already at the average.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[4,0,0,0]'],
      ['[2,2,2]'],
      ['[5]'],
      ['[1,3]'],
      ['[0,0,0,0]'],
      ['[10,0]'],
      ['[3,3,0,6]'],
      ['[1,1,1,1,1,1]'],
      ['[9,0,0]'],
      ['[7,1,4,8]'],
    ],
  },
  {
    n: 2819,
    id: 'pghub-b40-meeting-rooms-peak',
    name: 'Peak Concurrent Meetings',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'maxConcurrent',
    params: [{ name: 'meetings', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Each entry <code>[start, end]</code> in <code>meetings</code> is a half-open time interval (a meeting occupies times <code>t</code> with <code>start <= t < end</code>). Return the largest number of meetings that are in progress at the same instant.',
    examples: [
      ['[[0,5],[5,10],[3,7]]', '2', 'At time 3 to 5 the first and third meetings overlap.'],
      ['[[1,2]]', '1', 'A single meeting.'],
    ],
    constraints: ['1 <= meetings.length <= 10^5', '0 <= start < end <= 10^9'],
    tags: ['intervals', 'sweep-line'],
    py: `def maxConcurrent(meetings):
    events = []
    for s, e in meetings:
        events.append((s, 1))
        events.append((e, -1))
    events.sort()
    cur = 0
    best = 0
    for _, delta in events:
        cur += delta
        if cur > best:
            best = cur
    return best`,
    approach:
      'Turn each meeting into two timeline events: a plus-one at its start and a minus-one at its end. Sorting all events by time, with ends processed before equal-timed starts (so a meeting ending exactly when another begins does not overlap), and scanning while tracking the running count gives the peak occupancy. The maximum value of that running count is the answer.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[0,5],[5,10],[3,7]]'],
      ['[[1,2]]'],
      ['[[0,10],[1,9],[2,8]]'],
      ['[[0,1],[1,2],[2,3]]'],
      ['[[0,2],[1,3],[2,4],[3,5]]'],
      ['[[5,6],[5,6],[5,6]]'],
      ['[[0,100]]'],
      ['[[0,3],[1,4],[2,5],[6,7]]'],
      ['[[10,20],[15,25],[18,30],[22,28]]'],
      ['[[0,1],[0,1],[1,2],[1,2]]'],
    ],
  },
  {
    n: 2820,
    id: 'pghub-b40-rotate-deck',
    name: 'Rotate Card Deck',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'rotateDeck',
    params: [
      { name: 'cards', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'List[int]',
    statement:
      'You hold a deck of <code>cards</code> from top to bottom. Cutting the deck means taking the top <code>k</code> cards and moving them, in order, to the bottom. Return the deck after a single cut of size <code>k</code>. Note <code>k</code> may exceed the deck size, in which case it wraps around.',
    examples: [
      ['[1,2,3,4,5]\n2', '[3,4,5,1,2]', 'The top two cards 1,2 move below 3,4,5.'],
      ['[1,2,3]\n0', '[1,2,3]', 'Cutting zero cards leaves the deck unchanged.'],
    ],
    constraints: ['1 <= cards.length <= 10^5', '0 <= k <= 10^9'],
    tags: ['arrays', 'two-pointers'],
    py: `def rotateDeck(cards, k):
    n = len(cards)
    k %= n
    return cards[k:] + cards[:k]`,
    approach:
      'Cutting the top k cards to the bottom is a left rotation by k. Because moving the whole deck around returns it to its start, reduce k modulo the deck size first. Then the result is everything from index k onward followed by the first k cards.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '2'],
      ['[1,2,3]', '0'],
      ['[1,2,3]', '3'],
      ['[1,2,3,4]', '5'],
      ['[7]', '100'],
      ['[1,2]', '1'],
      ['[5,4,3,2,1]', '4'],
      ['[10,20,30,40]', '2'],
      ['[1,1,1,1]', '2'],
      ['[9,8,7,6,5,4]', '3'],
    ],
  },
  {
    n: 2821,
    id: 'pghub-b40-signal-decay',
    name: 'Signal Strength Decay',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'firstWeakDay',
    params: [
      { name: 'start', type: 'int' },
      { name: 'threshold', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A signal begins at integer strength <code>start</code> on day 0 and each subsequent day its strength becomes the floor of half the previous day\'s strength. Return the index of the first day on which the strength is strictly less than <code>threshold</code>. If the strength is already below the threshold on day 0, return 0.',
    examples: [
      ['[8,3]', '2', 'Strengths are 8,4,2; day 2 is the first below 3.'],
      ['[5,9]', '0', 'Already below 9 on day 0.'],
    ],
    constraints: ['0 <= start <= 10^9', '1 <= threshold <= 10^9'],
    tags: ['binary-search', 'math'],
    py: `def firstWeakDay(start, threshold):
    day = 0
    s = start
    while s >= threshold:
        s //= 2
        day += 1
    return day`,
    approach:
      'The strength halves with a floor each day, so it strictly decreases until it reaches zero, meaning it must eventually fall below any positive threshold. Repeatedly halve while the current strength is at or above the threshold, counting days; the loop count when it first drops below is the answer. This runs in time proportional to the number of bits in the start value.',
    complexity: { time: 'O(log start)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['8', '3'],
      ['5', '9'],
      ['0', '1'],
      ['1', '1'],
      ['1024', '1'],
      ['100', '100'],
      ['100', '101'],
      ['1000000000', '2'],
      ['7', '4'],
      ['16', '16'],
    ],
  },
  {
    n: 2822,
    id: 'pghub-b40-warehouse-restock',
    name: 'Warehouse Restock Plan',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'maxFulfilled',
    params: [
      { name: 'stock', type: 'List[int]' },
      { name: 'trucks', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A warehouse has shelves with the units given in <code>stock</code>. You have <code>trucks</code> deliveries; each delivery doubles the units on one shelf of your choice (rounding is not needed, it is an exact doubling). After all deliveries, return the maximum possible total units across all shelves.',
    examples: [
      ['[1,5]\n2', '21', 'Doubling the 5 twice gives 20, plus the 1, total 21.'],
      ['[3]\n0', '3', 'No deliveries available.'],
    ],
    constraints: ['1 <= stock.length <= 10^5', '0 <= stock[i] <= 10^6', '0 <= trucks <= 30'],
    tags: ['heap', 'greedy'],
    py: `def maxFulfilled(stock, trucks):
    heap = [-x for x in stock]
    heapq.heapify(heap)
    for _ in range(trucks):
        top = -heapq.heappop(heap)
        heapq.heappush(heap, -(top * 2))
    return -sum(heap)`,
    approach:
      'Each doubling adds an amount equal to the current value of the chosen shelf, so to gain the most you should always double whichever shelf currently holds the most units. A max-heap surfaces that largest shelf in logarithmic time; pop it, double it, and push it back for each truck. The negated sum of the heap is the final total.',
    complexity: { time: 'O((n + trucks) log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,5]', '2'],
      ['[3]', '0'],
      ['[1,1,1]', '3'],
      ['[10,20,30]', '1'],
      ['[0,0]', '5'],
      ['[2,4,8]', '2'],
      ['[100]', '3'],
      ['[1,2,3,4,5]', '0'],
      ['[5,5,5,5]', '4'],
      ['[7,3]', '5'],
    ],
  },
  {
    n: 2823,
    id: 'pghub-b40-tree-leaf-depths',
    name: 'Deepest Leaf Sum',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'deepestLeafSum',
    params: [{ name: 'values', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A binary tree is given in level order as <code>values</code>, where <code>null</code> marks an absent node (use <code>-1</code> in the input list to represent an absent node, and all real node values are non-negative). Return the sum of the values of all leaves that lie at the maximum depth of the tree. The first element is the root; for a node at index <code>i</code> its children, when present in the list, are at indices <code>2i+1</code> and <code>2i+2</code>.',
    examples: [
      ['[1,2,3,4,5,-1,6]', '15', 'Deepest level holds 4,5,6 which sum to 15.'],
      ['[7]', '7', 'The root is the only and deepest leaf.'],
    ],
    constraints: ['1 <= values.length <= 10^4', 'values[0] != -1', '-1 represents an absent node'],
    tags: ['trees', 'bfs'],
    py: `def deepestLeafSum(values):
    n = len(values)
    best_depth = -1
    best_sum = 0
    # iterative over a complete-array layout; compute depth of each present node
    for i in range(n):
        if values[i] == -1:
            continue
        depth = 0
        j = i
        while j > 0:
            j = (j - 1) // 2
            depth += 1
        if depth > best_depth:
            best_depth = depth
            best_sum = values[i]
        elif depth == best_depth:
            best_sum += values[i]
    return best_sum`,
    approach:
      'In the complete-array layout the depth of a node equals how many times you can step from its index up to the parent at (i-1)//2 before reaching the root. Scan every present node, derive its depth, and track the greatest depth seen along with the running sum of node values at that depth. Whenever a deeper node appears the running sum restarts; ties accumulate.',
    complexity: { time: 'O(n log n)', space: 'O(1)' },
    cases: [
      ['[1,2,3,4,5,-1,6]'],
      ['[7]'],
      ['[1,2,3]'],
      ['[1,2,3,-1,-1,-1,4]'],
      ['[5,4,3,2,1]'],
      ['[10,20,30,40,50,60,70]'],
      ['[0,0,0,0]'],
      ['[1,-1,2,-1,-1,-1,3]'],
      ['[9,8,7,6,-1,-1,5]'],
      ['[100,1,1]'],
    ],
  },
  {
    n: 2832,
    id: 'pghub-b40-paint-fence-runs',
    name: 'Longest Single-Color Run',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'longestRun',
    params: [
      { name: 'fence', type: 'str' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A <code>fence</code> is a string of lowercase letters, each a plank color. You may repaint at most <code>k</code> planks to any colors you like. Return the length of the longest contiguous stretch of planks that can all share one color after repainting.',
    examples: [
      ['aabba\n1', '4', 'Repaint one plank to make four in a row equal.'],
      ['abc\n0', '1', 'With no repaints the longest equal run is a single plank.'],
    ],
    constraints: ['1 <= fence.length <= 10^5', '0 <= k <= fence.length', 'fence is lowercase English letters'],
    tags: ['sliding-window', 'strings'],
    py: `def longestRun(fence, k):
    from collections import Counter
    counts = Counter()
    left = 0
    best = 0
    max_freq = 0
    for right, ch in enumerate(fence):
        counts[ch] += 1
        max_freq = max(max_freq, counts[ch])
        while (right - left + 1) - max_freq > k:
            counts[fence[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best`,
    approach:
      'For any window the cheapest way to make it uniform is to keep the most frequent color and repaint the rest, costing window length minus that top frequency. Slide a window expanding to the right; while the repaint cost exceeds k, shrink from the left. The widest window ever kept valid is the answer; the most-frequent count need only ever grow for this windowing to stay correct.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ["'aabba'", '1'],
      ["'abc'", '0'],
      ["'aaaa'", '0'],
      ["'abcde'", '2'],
      ["'aabbcc'", '2'],
      ["'a'", '0'],
      ["'abab'", '1'],
      ["'zzzzz'", '3'],
      ["'abcabcabc'", '3'],
      ["'aaabbbaaa'", '2'],
    ],
  },
  {
    n: 2837,
    id: 'pghub-b40-dna-complement',
    name: 'DNA Strand Complement',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'complement',
    params: [{ name: 'strand', type: 'str' }],
    return_type: 'str',
    statement:
      'A DNA <code>strand</code> is a string over the letters A, C, G, T. Its complement replaces A with T, T with A, C with G, and G with C, and then the whole complemented string is reversed (to read the partner strand in its natural direction). Return the resulting partner strand.',
    examples: [
      ['ATGC', 'GCAT', 'Complement gives TACG, then reverse to GCAT.'],
      ['A', 'T', 'A pairs with T.'],
    ],
    constraints: ['1 <= strand.length <= 10^5', 'strand consists only of A, C, G, T'],
    tags: ['strings', 'two-pointers'],
    py: `def complement(strand):
    pair = {'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C'}
    return ''.join(pair[ch] for ch in reversed(strand))`,
    approach:
      'Each base maps to its Watson-Crick partner through a fixed lookup. Building the partner strand in natural reading direction means complementing the bases while traversing the original from end to start, equivalent to complementing then reversing. A single pass over the reversed string with the lookup produces the answer.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ["'ATGC'"],
      ["'A'"],
      ["'T'"],
      ["'AATT'"],
      ["'GGCC'"],
      ["'ACGTACGT'"],
      ["'AAAA'"],
      ["'CGCGCG'"],
      ["'TACG'"],
      ["'GATTACA'"],
    ],
  },
  {
    n: 2838,
    id: 'pghub-b40-toggle-switches',
    name: 'Light Switch Toggles',
    topic_id: 'bit-manipulation',
    difficulty: 'Medium',
    method_name: 'litCount',
    params: [
      { name: 'n', type: 'int' },
      { name: 'toggles', type: 'List[int]' },
    ],
    return_type: 'int',
    statement:
      'There are <code>n</code> lights numbered <code>1..n</code>, all initially off. Each value <code>d</code> in <code>toggles</code> flips every light whose number is a multiple of <code>d</code>. After applying all the toggles in order, return how many lights are on.',
    examples: [
      ['[5,[1,2]]', '3', 'Toggle 1 turns all on; toggle 2 turns off 2 and 4; lights 1,3,5 remain on.'],
      ['[3,[]]', '0', 'No toggles, everything stays off.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= toggles.length <= 10^4', '1 <= toggles[i] <= n'],
    tags: ['bit-manipulation', 'math'],
    py: `def litCount(n, toggles):
    flips = [0] * (n + 1)
    for d in toggles:
        for x in range(d, n + 1, d):
            flips[x] ^= 1
    return sum(flips[1:])`,
    approach:
      'A light ends up on exactly when it is flipped an odd number of times. Track a parity bit per light; for each toggle value step through its multiples and flip the parity with an exclusive-or. Counting the lights whose parity is one gives how many are lit at the end.',
    complexity: { time: 'O(n log n) over divisor sweeps', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['5', '[1,2]'],
      ['3', '[]'],
      ['1', '[1]'],
      ['10', '[1,2,3]'],
      ['6', '[2,3]'],
      ['7', '[1,1]'],
      ['12', '[2,4,6]'],
      ['10', '[1,2,5,10]'],
      ['4', '[1,2,3,4]'],
      ['20', '[3,5]'],
    ],
  },
  {
    n: 2847,
    id: 'pghub-b40-courier-routes',
    name: 'Courier Shortest Detour',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'shortestRoute',
    params: [
      { name: 'n', type: 'int' },
      { name: 'roads', type: 'List[List[int]]' },
      { name: 'src', type: 'int' },
      { name: 'dst', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A city has <code>n</code> junctions numbered <code>0..n-1</code> connected by bidirectional <code>roads</code>, each entry <code>[u, v, w]</code> giving a road between <code>u</code> and <code>v</code> of length <code>w</code>. Return the length of the shortest route from <code>src</code> to <code>dst</code>, or <code>-1</code> if no route exists.',
    examples: [
      ['[4,[[0,1,1],[1,2,2],[0,2,5]],0,2]', '3', 'Path 0-1-2 costs 3, beating the direct road of 5.'],
      ['[2,[],0,1]', '-1', 'No roads, so junction 1 is unreachable.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= roads.length <= 5*10^4', '1 <= w <= 10^6', '0 <= src, dst < n'],
    tags: ['graphs', 'dijkstra'],
    py: `def shortestRoute(n, roads, src, dst):
    adj = defaultdict(list)
    for u, v, w in roads:
        adj[u].append((v, w))
        adj[v].append((u, w))
    dist = [float('inf')] * n
    dist[src] = 0
    pq = [(0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        if u == dst:
            return d
        for v, w in adj[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return dist[dst] if dist[dst] != float('inf') else -1`,
    approach:
      'With non-negative road lengths the shortest route is found by Dijkstra\'s algorithm. Build an adjacency list, then repeatedly extract the closest unsettled junction from a min-heap and relax its neighbours, updating any shorter tentative distance. Returning when the destination is popped (or reporting minus one if it stays unreachable) yields the shortest route length.',
    complexity: { time: 'O((n + e) log n)', space: 'O(n + e)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1,1],[1,2,2],[0,2,5]]', '0', '2'],
      ['2', '[]', '0', '1'],
      ['1', '[]', '0', '0'],
      ['3', '[[0,1,4],[1,2,6]]', '0', '2'],
      ['5', '[[0,1,2],[1,2,2],[2,3,2],[3,4,2],[0,4,100]]', '0', '4'],
      ['4', '[[0,1,1],[2,3,1]]', '0', '3'],
      ['6', '[[0,1,7],[0,2,9],[1,2,1],[2,5,2],[0,5,14]]', '0', '5'],
      ['3', '[[0,1,1],[1,2,1],[0,2,1]]', '0', '2'],
      ['2', '[[0,1,5]]', '1', '0'],
      ['5', '[[0,1,1],[1,2,1],[1,3,1],[3,4,1]]', '0', '4'],
    ],
  },
  {
    n: 2852,
    id: 'pghub-b40-stair-tickets',
    name: 'Minimum Stair Tickets',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'minCost',
    params: [
      { name: 'cost', type: 'List[int]' },
      { name: 'maxStep', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A staircase has steps indexed <code>0..n-1</code> with an entry toll <code>cost[i]</code> for stepping on step <code>i</code>. You start on the ground just before step 0 and may climb by 1 up to <code>maxStep</code> steps at a time. You must reach the top, which is just beyond the last step (landing past index n-1). Return the minimum total toll paid. Stepping on a step always pays its toll.',
    examples: [
      ['[10,15,20]\n2', '15', 'Climb to step 1 (15) then step over the rest to the top.'],
      ['[1,100,1,100]\n2', '2', 'Land on steps 0 and 2 only.'],
    ],
    constraints: ['1 <= cost.length <= 10^5', '1 <= maxStep <= cost.length', '0 <= cost[i] <= 10^4'],
    tags: ['dp', 'sliding-window'],
    py: `def minCost(cost, maxStep):
    n = len(cost)
    INF = float('inf')
    # dp[i] = min toll to be standing on step i
    dp = [INF] * n
    dq = deque()  # indices of candidate previous steps, increasing dp
    for i in range(n):
        # ground is reachable to steps 0..maxStep-1 at zero prior cost
        ground = 0 if i < maxStep else INF
        best_prev = dp[dq[0]] if dq else INF
        dp[i] = cost[i] + min(ground, best_prev)
        while dq and dp[dq[-1]] >= dp[i]:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - maxStep:
            dq.popleft()
    # top reachable from steps n-maxStep .. n-1, plus from ground if n<=maxStep
    ans = 0 if n <= maxStep else INF
    for i in range(max(0, n - maxStep), n):
        ans = min(ans, dp[i])
    return ans`,
    approach:
      'Let dp[i] be the least toll to stand on step i; it is that step\'s toll plus the cheapest reachable predecessor within the last maxStep steps (or the ground for the earliest steps). A monotonic deque maintains the minimum dp over the sliding predecessor window in amortized constant time. The top is reachable from any of the final maxStep steps, so the answer is the smallest dp among them.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[10,15,20]', '2'],
      ['[1,100,1,100]', '2'],
      ['[5]', '1'],
      ['[1,2,3,4,5]', '1'],
      ['[0,0,0,0]', '3'],
      ['[3,2,1,4,5]', '2'],
      ['[10,10,10,10]', '4'],
      ['[7,1,7,1,7]', '2'],
      ['[2,3,1,1,5,2]', '3'],
      ['[9,8,7,6,5,4,3]', '2'],
    ],
  },
  {
    n: 2853,
    id: 'pghub-b40-bracket-pairs',
    name: 'Valid Multi-Bracket Check',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'isBalanced',
    params: [{ name: 's', type: 'str' }],
    return_type: 'bool',
    statement:
      'A string <code>s</code> contains only the bracket characters <code>()[]{}</code>. Return <code>true</code> if every opening bracket is closed by the matching closing bracket in the correct order, and <code>false</code> otherwise. The empty string is valid.',
    examples: [
      ['([])', 'true', 'Brackets nest correctly.'],
      ['([)]', 'false', 'The pairs interleave incorrectly.'],
    ],
    constraints: ['0 <= s.length <= 10^5', 's consists only of the characters ()[]{}'],
    tags: ['stack', 'strings'],
    py: `def isBalanced(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in s:
        if ch in '([{':
            stack.append(ch)
        else:
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
    return not stack`,
    approach:
      'Push every opening bracket onto a stack. On a closing bracket the top of the stack must be its matching opener, otherwise the string is invalid; pop it when it matches. After scanning, a non-empty stack means some openers were never closed, so the string is balanced exactly when the stack ends empty.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ["'([])'"],
      ["'([)]'"],
      ["''"],
      ["'()'"],
      ["'()[]{}'"],
      ["'('"],
      ["')'"],
      ["'{[()]}'"],
      ["'((()))'"],
      ["'([]{})['"],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B40>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b40-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B40>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B40>>'.length, -'<<END>>'.length)
  );
  if (outputs.length !== inputs.length) {
    throw new Error(`#${prob.n}: expected ${inputs.length} outputs, got ${outputs.length}\n${res.stdout}`);
  }
  return inputs.map((c, idx) => {
    const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
    return { inputs: argStrs, expected: outputs[idx], is_sample: idx < 2 };
  });
}

function buildDescription(prob) {
  const ex = prob.examples
    .map(
      (e, i) =>
        `<p><strong>Example ${i + 1}:</strong></p>\n<pre>Input: ${escapeHtml(
          e[0].replace(/\n/g, ', ')
        )}\nOutput: ${escapeHtml(e[1])}${e[2] ? `\nExplanation: ${escapeHtml(e[2])}` : ''}</pre>`
    )
    .join('\n');
  const cons = `<p><strong>Constraints:</strong></p>\n<ul>${prob.constraints
    .map((c) => `<li><code>${escapeHtml(c)}</code></li>`)
    .join('')}</ul>`;
  return `<p>${prob.statement}</p>\n${ex}\n${cons}`;
}
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function skeleton(prob) {
  return { python: { code: pythonClassWrap(prob), approach: prob.approach, complexity: prob.complexity } };
}
function pythonClassWrap(prob) {
  const sig = prob.params.map((p) => p.name).join(', ');
  const lines = prob.py.split('\n');
  const entryHeader = `def ${prob.method_name}(`;
  const idx = lines.findIndex((l) => l.startsWith(entryHeader));
  const preamble = idx > 0 ? lines.slice(0, idx).join('\n').replace(/\n+$/, '') : '';
  const fnLines = lines.slice(idx);
  const bodyLines = fnLines.slice(1);
  const body = bodyLines.map((l) => (l ? '        ' + l : l)).join('\n');
  const cls = `class Solution:\n    def ${prob.method_name}(self, ${sig}):\n${body}`;
  return preamble ? `${preamble}\n\n\n${cls}` : cls;
}

function buildRow(prob) {
  const test_cases = runPythonExpected(prob);
  const tags = Array.from(new Set(['PGHub', ...prob.tags]));
  return {
    row: {
      id: prob.id,
      topic_id: prob.topic_id,
      name: prob.name,
      difficulty: prob.difficulty,
      description: buildDescription(prob),
      method_name: prob.method_name,
      params: prob.params,
      return_type: prob.return_type,
      test_cases,
      constraints: prob.constraints.join('\n'),
      tags,
      topics: [],
      solutions: skeleton(prob),
      leetcode_number: prob.n,
      frequency_score: 0,
    },
    test_cases,
  };
}

// Re-run the STORED solution code against the STORED test cases (independent grade).
function gradeStored(prob, row) {
  const code = row.solutions.python.code;
  const calls = row.test_cases
    .map((tc, idx) => {
      const argLiterals = tc.inputs.join(', ');
      return `    _out = _ser(_sol.${prob.method_name}(${argLiterals}))\n    _exp = ${JSON.stringify(tc.expected)}\n    print("<<G>>" + ("PASS" if _out == _exp else ("FAIL idx=${idx} got="+repr(_out)+" exp="+repr(_exp))) + "<<E>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${code}\n\n_sol = Solution()\nif True:\n${calls}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b40-grade-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) throw new Error(`Grade run failed #${prob.n}:\n${res.stderr}`);
  const lines = (res.stdout.match(/<<G>>([\s\S]*?)<<E>>/g) || []).map((m) =>
    m.slice('<<G>>'.length, -'<<E>>'.length)
  );
  const pass = lines.filter((l) => l === 'PASS').length;
  const fails = lines.filter((l) => l.startsWith('FAIL'));
  return { pass, total: lines.length, fails };
}

async function main() {
  const wanted = cliNums.length ? cliNums : BATCH;
  const targets = PROBLEMS.filter((p) => wanted.includes(p.n)).sort((a, b) => a.n - b.n);

  if (VERIFY) {
    const { data: stored } = await sb
      .from('PGcode_problems')
      .select('leetcode_number,name,tags,test_cases,solutions,method_name')
      .in('leetcode_number', wanted)
      .order('leetcode_number');
    let allPass = 0, allTotal = 0, ok = 0;
    for (const r of stored || []) {
      const g = gradeStored({ method_name: r.method_name }, r);
      allPass += g.pass; allTotal += g.total;
      const tagged = (r.tags || []).includes('PGHub');
      if (g.pass === g.total && tagged) ok++;
      console.log(`  #${r.leetcode_number} ${r.name}: ${g.pass}/${g.total} pass, PGHub=${tagged}${g.fails.length ? ' ' + g.fails.join('; ') : ''}`);
    }
    console.log(`\nVERIFY: ${allPass}/${allTotal} cases pass across ${(stored || []).length} rows; ${ok} fully-green PGHub rows.`);
    return;
  }

  console.log(`Authoring ${targets.length} problems for gaps: ${targets.map((t) => t.n).join(', ')}`);

  const { data: existing, error: exErr } = await sb
    .from('PGcode_problems')
    .select('leetcode_number,id')
    .in('leetcode_number', wanted);
  if (exErr) throw exErr;
  const haveNums = new Set((existing || []).map((e) => e.leetcode_number));
  const { data: existIds } = await sb.from('PGcode_problems').select('id').in('id', targets.map((t) => t.id));
  const haveIds = new Set((existIds || []).map((e) => e.id));

  const rows = [];
  for (const prob of targets) {
    if (haveNums.has(prob.n)) { console.log(`  skip #${prob.n} (${prob.id}) — number already present`); continue; }
    if (haveIds.has(prob.id)) { console.log(`  skip #${prob.n} (${prob.id}) — id already present`); continue; }
    const { row, test_cases } = buildRow(prob);
    const g = gradeStored(prob, row);
    if (g.pass !== g.total) {
      throw new Error(`P0: #${prob.n} ${prob.name} stored solution fails ${g.total - g.pass} cases: ${g.fails.join('; ')}`);
    }
    rows.push(row);
    console.log(`  ok   #${prob.n} ${prob.name} [${prob.topic_id}/${prob.difficulty}] — ${test_cases.length} cases, ${g.pass}/${g.total} pass`);
  }

  if (!rows.length) { console.log('Nothing new to insert.'); return; }
  if (DRY) { console.log(`\n[DRY] Would insert ${rows.length} rows. Skipping write.`); return; }

  const { error: insErr } = await sb.from('PGcode_problems').insert(rows);
  if (insErr) throw insErr;
  console.log(`\nInserted ${rows.length} rows.`);

  const { data: check } = await sb
    .from('PGcode_problems')
    .select('leetcode_number,name,tags')
    .in('leetcode_number', wanted)
    .order('leetcode_number');
  const pghub = (check || []).filter((c) => (c.tags || []).includes('PGHub'));
  console.log(`\nVerify: ${pghub.length}/${wanted.length} target numbers now present & tagged PGHub.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
