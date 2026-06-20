#!/usr/bin/env node
// Atomic splice: inject binary-search-on-answer trio viz fns before `export const RICH_CONTENT = {`
// and corresponding problem entries before its closing `};`.
//
// Slugs (user-confirmed not yet present; koko-eating-bananas was already covered
// so it was swapped for magnetic-force-between-two-balls per the original prompt):
//   1. magnetic-force-between-two-balls          — sort + binary search on min distance
//   2. divide-chocolate                          — binary search on min piece sweetness
//   3. capacity-to-ship-packages-within-d-days   — binary search on ship capacity
//
// Re-runnable: detects already-spliced state and exits cleanly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'src', 'content', 'problemContent.js');

const src = fs.readFileSync(FILE, 'utf8');

if (src.includes('function magneticForceViz(')
  || src.includes("'magnetic-force-between-two-balls':")
  || src.includes('"magnetic-force-between-two-balls":')
  || src.includes('function divideChocolateViz(')
  || src.includes("'divide-chocolate':")
  || src.includes('"divide-chocolate":')
  || src.includes('function shipWithinDaysViz(')
  || src.includes("'capacity-to-ship-packages-within-d-days':")
  || src.includes('"capacity-to-ship-packages-within-d-days":')) {
  console.log('Already spliced — nothing to do.');
  process.exit(0);
}

const VIZ_BLOCK = `function magneticForceViz() {
  const position = [1, 2, 3, 4, 7];
  const m = 3;
  const frames = [];

  frames.push({
    array: position.slice(),
    chip: [
      { label: 'position', value: '[' + position.join(',') + ']' },
      { label: 'm (balls)', value: String(m) },
      { label: 'goal', value: 'maximize min |a - b|', tone: 'violet' },
    ],
    caption: 'Place m=3 balls into baskets at positions [1,2,3,4,7] so that the minimum pairwise distance between any two chosen baskets is as large as possible. Brute force tries every C(n, m) placement, scores each, takes the best — O(C(n,m) * m) which explodes. Binary-search the answer: guess a minimum distance d, greedily test if m balls fit, narrow the range.',
  });

  const sorted = position.slice().sort((a, b) => a - b);
  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'sorted', value: '[' + sorted.join(',') + ']', tone: 'violet' },
      { label: 'min gap', value: '1' },
      { label: 'max possible d', value: '(7 - 1) / (3 - 1) = 3', tone: 'pink' },
    ],
    caption: 'Sort first — greedy placement only makes sense on a sorted line. The upper bound on the answer is (max - min) / (m - 1) since m balls spread across [min, max] cannot beat that spacing on average. Search space for d: [1, (7-1)/(3-1)] = [1, 3]. Monotone predicate: if d works, so does every smaller d.',
  });

  // Helper: can we place m balls with min spacing >= d? Greedy: place first at sorted[0],
  // then place next at the first position >= last + d.
  const canPlace = (d) => {
    let count = 1, last = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - last >= d) { count++; last = sorted[i]; }
    }
    return count >= m;
  };

  // ---------- iteration 1: lo=1, hi=3, mid=2 ----------
  let lo = 1, hi = 3;
  let mid = Math.floor((lo + hi + 1) / 2); // 2
  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'lo', value: String(lo) },
      { label: 'hi', value: String(hi) },
      { label: 'mid (try d)', value: String(mid), tone: 'pink' },
    ],
    caption: 'Iteration 1: lo=1, hi=3, mid=2. Test if 3 balls can be placed with pairwise min distance >= 2. Use ceil mid (lo + hi + 1) / 2 because we want the largest feasible value — without the +1, lo could stick at a feasible value and the loop would spin forever.',
  });

  // Greedy walk at d=2
  frames.push({
    array: sorted.slice(),
    highlights: { 0: 'match' },
    chip: [
      { label: 'd = 2', value: 'place at index 0' },
      { label: 'placed', value: '1' },
      { label: 'last', value: String(sorted[0]) },
    ],
    caption: 'Greedy placement at d=2: always anchor the first ball at the smallest position (sorted[0]=1). Why smallest? Leaves the most room rightward for the rest. Placed=1, last=1.',
  });

  frames.push({
    array: sorted.slice(),
    highlights: { 0: 'match', 2: 'match' },
    chip: [
      { label: 'check', value: 'sorted[2]=3, 3-1=2 >= 2' },
      { label: 'placed', value: '2', tone: 'violet' },
      { label: 'last', value: '3' },
    ],
    caption: 'Skip sorted[1]=2 (2-1=1, too close). sorted[2]=3 gives gap 2 >= d, place it. Placed=2, last=3. The greedy keeps stepping right looking for the next slot >= last + d.',
  });

  frames.push({
    array: sorted.slice(),
    highlights: { 0: 'match', 2: 'match', 4: 'match' },
    chip: [
      { label: 'check', value: 'sorted[4]=7, 7-3=4 >= 2' },
      { label: 'placed', value: '3 = m', tone: 'pink' },
      { label: 'verdict', value: 'd=2 FEASIBLE' },
    ],
    caption: 'Skip sorted[3]=4 (4-3=1, too close). sorted[4]=7 gives gap 4 >= d, place. Placed=3 = m, so d=2 works. Move lo up: lo = mid = 2. We want the largest d, so we ratchet lo toward hi.',
  });

  // ---------- iteration 2: lo=2, hi=3, mid=3 ----------
  lo = 2;
  mid = Math.floor((lo + hi + 1) / 2); // 3
  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'lo', value: String(lo) },
      { label: 'hi', value: String(hi) },
      { label: 'mid (try d)', value: String(mid), tone: 'pink' },
    ],
    caption: 'Iteration 2: lo=2, hi=3, mid=3. Test d=3. Same greedy: anchor at index 0, hop rightward to the first position >= last + 3.',
  });

  frames.push({
    array: sorted.slice(),
    highlights: { 0: 'match' },
    chip: [
      { label: 'd = 3', value: 'place at index 0' },
      { label: 'placed', value: '1' },
      { label: 'last', value: '1' },
    ],
    caption: 'Anchor at sorted[0]=1. Now we need the next position >= 1 + 3 = 4. Scan: sorted[1]=2 (no), sorted[2]=3 (no), sorted[3]=4 (yes — 4 >= 4).',
  });

  frames.push({
    array: sorted.slice(),
    highlights: { 0: 'match', 3: 'match' },
    chip: [
      { label: 'check', value: 'sorted[3]=4, 4-1=3 >= 3' },
      { label: 'placed', value: '2' },
      { label: 'last', value: '4' },
    ],
    caption: 'Place at sorted[3]=4. Now need >= 4 + 3 = 7. Scan: sorted[4]=7 (yes — 7 >= 7).',
  });

  frames.push({
    array: sorted.slice(),
    highlights: { 0: 'match', 3: 'match', 4: 'match' },
    chip: [
      { label: 'check', value: 'sorted[4]=7, 7-4=3 >= 3' },
      { label: 'placed', value: '3 = m', tone: 'pink' },
      { label: 'verdict', value: 'd=3 FEASIBLE' },
    ],
    caption: 'Place at sorted[4]=7. Placed=3 = m. d=3 works too. lo = mid = 3. Now lo == hi == 3, loop exits.',
  });

  // ---------- final ----------
  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'lo', value: '3' },
      { label: 'hi', value: '3' },
      { label: 'answer', value: '3', tone: 'pink' },
    ],
    caption: 'Loop exit: lo = hi = 3. Maximum minimum distance = 3. The chosen baskets are {1, 4, 7}. Any larger d (say 4) would fail since (7-1)/2 = 3 is the ceiling.',
  });

  // ---------- counter-example: why greedy is optimal ----------
  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'why greedy?', value: 'anchor leftmost = optimal' },
      { label: 'exchange argument', value: 'shift left never hurts', tone: 'violet' },
    ],
    caption: 'Why does anchoring the first ball at the smallest position never lose feasibility? Exchange argument: if any optimal placement starts later, shifting the first ball leftward only opens more room for the rest. So leftmost anchoring is at least as good as any optimal — induction handles the recursive subproblem.',
  });

  // ---------- predicate monotonicity ----------
  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'predicate', value: 'canPlace(d)' },
      { label: 'monotone', value: 'd=1 T, d=2 T, d=3 T, d=4 F', tone: 'violet' },
      { label: 'binary-search', value: 'last True', tone: 'pink' },
    ],
    caption: 'Predicate canPlace(d) is monotone decreasing: easier spacing always works if harder spacing did. That monotonicity is the entire reason binary search applies — we are searching for the boundary between True and False, which is the answer.',
  });

  // ---------- complexity ----------
  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'sort', value: 'O(n log n)' },
      { label: 'bsearch iters', value: 'O(log V), V = max - min' },
      { label: 'per iter', value: 'O(n) greedy' },
      { label: 'total', value: 'O(n log n + n log V)', tone: 'pink' },
    ],
    caption: 'Cost: sort is O(n log n), then O(log V) binary-search iterations, each running an O(n) greedy. V can be up to 10^9 — log2(10^9) ~ 30, so the search adds a small constant on top of the sort. Brute force C(10^5, 10^3) is astronomical; this finishes in milliseconds.',
  });

  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'pitfall', value: 'mid = floor — infinite loop', tone: 'pink' },
      { label: 'fix', value: 'mid = (lo + hi + 1) / 2 (ceil)' },
      { label: 'when', value: 'lo = mid update branch', tone: 'violet' },
    ],
    caption: 'Classic trap: with lo = mid on feasible and hi = mid - 1 on infeasible, use ceil-mid. Floor-mid with lo=mid loops forever when lo and hi are adjacent and the predicate holds. Pair the rounding direction with the update branch — that mismatch causes most "binary search hangs forever" bugs.',
  });

  return { renderer: 'array', title: 'Magnetic Force — sort + binary-search on min distance', frames };
}

function divideChocolateViz() {
  const sweetness = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const k = 5;
  const frames = [];

  frames.push({
    array: sweetness.slice(),
    chip: [
      { label: 'sweetness', value: '[' + sweetness.join(',') + ']' },
      { label: 'k (friends)', value: String(k) },
      { label: 'pieces', value: String(k + 1) + ' contiguous chunks', tone: 'violet' },
    ],
    caption: 'Cut the chocolate bar into k+1=6 contiguous pieces. Each piece is the sum of its chunks. You give k pieces to friends and keep the worst — minimum-sweetness — piece for yourself. Maximize that minimum. The "you take the worst" twist is what makes this a maximin problem ripe for binary search on the answer.',
  });

  frames.push({
    array: sweetness.slice(),
    chip: [
      { label: 'total sum', value: String(sweetness.reduce((a, b) => a + b, 0)) },
      { label: 'lo', value: String(Math.min(...sweetness)) },
      { label: 'hi', value: String(Math.floor(sweetness.reduce((a, b) => a + b, 0) / (k + 1))), tone: 'pink' },
    ],
    caption: 'Search range for the answer x: lo = min(sweetness) = 1 (any piece is at least a single chunk), hi = sum / (k+1) = 45/6 = 7 (if you could split evenly, you cannot beat the average). The k+1 pieces with min >= x exists iff a greedy left-to-right partition produces at least k+1 such pieces.',
  });

  // Helper: can we form >= k+1 pieces each with sum >= x?
  const canPartition = (x) => {
    let pieces = 0, running = 0;
    for (const s of sweetness) {
      running += s;
      if (running >= x) { pieces++; running = 0; }
    }
    return pieces >= k + 1;
  };

  // ---------- iteration 1: lo=1, hi=7, mid=4 ----------
  let lo = 1, hi = 7;
  let mid = Math.floor((lo + hi + 1) / 2); // 4
  frames.push({
    array: sweetness.slice(),
    chip: [
      { label: 'lo', value: String(lo) },
      { label: 'hi', value: String(hi) },
      { label: 'mid (try x)', value: String(mid), tone: 'pink' },
    ],
    caption: 'Iteration 1: lo=1, hi=7, mid=4. Predicate: can we form >= 6 pieces each summing to >= 4? Greedy: walk left to right, accumulate until we hit >= x, snip, reset.',
  });

  // greedy at x=4
  // 1+2+3=6 >= 4 (piece1), 4 >= 4 (piece2), 5 >= 4 (piece3), 6 (p4), 7 (p5), 8 (p6), 9 (p7) = 7 pieces
  frames.push({
    array: sweetness.slice(),
    highlights: { 0: 'match', 1: 'match', 2: 'match' },
    chip: [
      { label: 'x = 4', value: 'piece 1: 1+2+3=6' },
      { label: 'pieces', value: '1' },
    ],
    caption: 'Accumulate 1, then 1+2=3 (< 4, continue), then 1+2+3=6 (>= 4, snip). First piece sums to 6. Reset running total.',
  });

  frames.push({
    array: sweetness.slice(),
    highlights: { 3: 'match' },
    chip: [
      { label: 'piece 2', value: '4 alone' },
      { label: 'piece 3', value: '5 alone' },
      { label: 'pieces', value: '3', tone: 'violet' },
    ],
    caption: 'Index 3 is 4 — hits >= x immediately, snip. Index 4 is 5 — also snip. Three pieces so far. Each later element is also >= 4, so each becomes its own piece.',
  });

  frames.push({
    array: sweetness.slice(),
    highlights: { 5: 'match', 6: 'match', 7: 'match', 8: 'match' },
    chip: [
      { label: 'pieces formed', value: '7' },
      { label: 'needed', value: String(k + 1) },
      { label: 'verdict', value: '7 >= 6: FEASIBLE', tone: 'pink' },
    ],
    caption: 'Total pieces formed: 7 (one for indices [0..2], then one each for 4..9). 7 >= k+1 = 6, so x=4 is achievable. Push lo upward: lo = mid = 4.',
  });

  // ---------- iteration 2: lo=4, hi=7, mid=6 ----------
  lo = 4;
  mid = Math.floor((lo + hi + 1) / 2); // 6
  frames.push({
    array: sweetness.slice(),
    chip: [
      { label: 'lo', value: '4' },
      { label: 'hi', value: '7' },
      { label: 'mid (try x)', value: String(mid), tone: 'pink' },
    ],
    caption: 'Iteration 2: try x=6. Greedy: 1+2+3=6 snip (piece 1), 4+5=9 snip (piece 2), 6 snip (piece 3), 7 snip (piece 4), 8 snip (piece 5), 9 snip (piece 6).',
  });

  frames.push({
    array: sweetness.slice(),
    highlights: { 0: 'match', 1: 'match', 2: 'match' },
    chip: [
      { label: 'x = 6', value: 'piece 1: 1+2+3=6' },
      { label: 'pieces', value: '1' },
    ],
    caption: 'First piece exactly hits 6 — the snip is tight. Reset.',
  });

  frames.push({
    array: sweetness.slice(),
    highlights: { 3: 'match', 4: 'match' },
    chip: [
      { label: 'piece 2', value: '4+5=9' },
      { label: 'pieces', value: '2' },
    ],
    caption: 'Need 6: 4 alone is not enough, 4+5=9 >= 6, snip. Then 6, 7, 8, 9 each form their own piece since they are individually >= 6.',
  });

  frames.push({
    array: sweetness.slice(),
    highlights: { 5: 'match', 6: 'match', 7: 'match', 8: 'match' },
    chip: [
      { label: 'pieces formed', value: '6' },
      { label: 'needed', value: '6' },
      { label: 'verdict', value: 'FEASIBLE', tone: 'pink' },
    ],
    caption: '6 pieces, exactly what we need. x=6 works. lo = mid = 6. Range tightens to [6, 7].',
  });

  // ---------- iteration 3: lo=6, hi=7, mid=7 ----------
  lo = 6;
  mid = Math.floor((lo + hi + 1) / 2); // 7
  frames.push({
    array: sweetness.slice(),
    chip: [
      { label: 'lo', value: '6' },
      { label: 'hi', value: '7' },
      { label: 'mid (try x)', value: '7', tone: 'pink' },
    ],
    caption: 'Try x=7: 1+2+3+4=10 snip (piece 1), 5+6=11 snip (piece 2), 7 snip (piece 3), 8 snip (piece 4), 9 snip (piece 5). Only 5 pieces — need 6.',
  });

  frames.push({
    array: sweetness.slice(),
    chip: [
      { label: 'pieces formed', value: '5' },
      { label: 'needed', value: '6' },
      { label: 'verdict', value: 'INFEASIBLE', tone: 'pink' },
    ],
    caption: '5 < 6, x=7 fails. Tighten hi: hi = mid - 1 = 6. Now lo == hi == 6, loop exits.',
  });

  frames.push({
    array: sweetness.slice(),
    chip: [
      { label: 'answer', value: '6', tone: 'pink' },
      { label: 'min piece kept', value: '6' },
      { label: 'cuts', value: 'after idx 2 and 4', tone: 'violet' },
    ],
    caption: 'Done. The optimal cut yields pieces [6, 9, 6, 7, 8, 9] — the worst (your share) is 6. Cuts after index 2 and 4 (and trivial cuts isolating 6/7/8/9).',
  });

  // ---------- contrast frame ----------
  frames.push({
    array: sweetness.slice(),
    chip: [
      { label: 'why not DP?', value: 'O(n^2 * k) states' },
      { label: 'binary search', value: 'O(n log V)', tone: 'pink' },
    ],
    caption: 'A DP "best min-sum using j cuts ending at i" would be O(n^2 * k) and miss this in interview time. Binary-search on the answer collapses it to O(n log V) — log2(10^9) iterations of an O(n) greedy. Same trick as Split Array Largest Sum, mirrored: that one minimizes the max, this one maximizes the min.',
  });

  return { renderer: 'array', title: 'Divide Chocolate — binary-search on min piece value', frames };
}

function shipWithinDaysViz() {
  const weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const days = 5;
  const frames = [];

  frames.push({
    array: weights.slice(),
    chip: [
      { label: 'weights', value: '[' + weights.join(',') + ']' },
      { label: 'days', value: String(days) },
      { label: 'goal', value: 'min ship capacity', tone: 'violet' },
    ],
    caption: 'Ship 10 packages in order over 5 days. Each day load packages in sequence — no reordering — until the next package would exceed capacity. Find the smallest capacity that finishes in <= 5 days. Brute-force testing every capacity from 1 to sum is wasteful; binary-search the answer.',
  });

  const total = weights.reduce((a, b) => a + b, 0);
  const maxW = Math.max(...weights);
  frames.push({
    array: weights.slice(),
    chip: [
      { label: 'lo (max single)', value: String(maxW) },
      { label: 'hi (ship in 1 day)', value: String(total) },
      { label: 'range', value: '[' + maxW + ', ' + total + ']', tone: 'pink' },
    ],
    caption: 'Range bounds: capacity must be >= max weight (10) — anything smaller cannot fit that single package. Capacity sum (55) trivially ships in 1 day. So the answer lives in [10, 55]. Monotone: any feasible capacity stays feasible when increased.',
  });

  // Helper: days needed at capacity c
  const daysNeeded = (c) => {
    let d = 1, load = 0;
    for (const w of weights) {
      if (load + w > c) { d++; load = 0; }
      load += w;
    }
    return d;
  };

  // ---------- iteration 1: lo=10, hi=55, mid=32 ----------
  let lo = maxW, hi = total;
  let mid = Math.floor((lo + hi) / 2); // 32
  frames.push({
    array: weights.slice(),
    chip: [
      { label: 'lo', value: String(lo) },
      { label: 'hi', value: String(hi) },
      { label: 'mid (try cap)', value: String(mid), tone: 'pink' },
    ],
    caption: 'Iteration 1: lo=10, hi=55, mid=32. Simulate: load packages in order, opening a new day each time load + next > 32. Count total days used.',
  });

  // At cap=32: day1 1+2+3+4+5+6+7=28 (8 would make 36 >32), day2 8+9+10=27. 2 days.
  frames.push({
    array: weights.slice(),
    highlights: { 0: 'match', 1: 'match', 2: 'match', 3: 'match', 4: 'match', 5: 'match', 6: 'match' },
    chip: [
      { label: 'cap = 32', value: 'day 1: 1..7 = 28' },
      { label: 'next', value: '28 + 8 = 36 > 32 — new day' },
    ],
    caption: 'Day 1 at cap=32: load 1,2,3,4,5,6,7 totaling 28. Next is 8: 28+8 = 36 > 32, close day, start day 2.',
  });

  frames.push({
    array: weights.slice(),
    highlights: { 7: 'high', 8: 'high', 9: 'high' },
    chip: [
      { label: 'day 2', value: '8+9+10 = 27' },
      { label: 'days used', value: '2', tone: 'violet' },
      { label: 'verdict', value: '2 <= 5: FEASIBLE' },
    ],
    caption: 'Day 2: 8+9+10 = 27 <= 32. Done in 2 days, well under the 5-day budget. Capacity 32 is overkill — shrink hi: hi = mid = 32. We want the smallest feasible capacity, so we ratchet hi downward when feasible.',
  });

  // ---------- iteration 2: lo=10, hi=32, mid=21 ----------
  hi = 32;
  mid = Math.floor((lo + hi) / 2); // 21
  frames.push({
    array: weights.slice(),
    chip: [
      { label: 'lo', value: '10' },
      { label: 'hi', value: '32' },
      { label: 'mid (try cap)', value: '21', tone: 'pink' },
    ],
    caption: 'Iteration 2: try cap=21. Simulate: day1 1+2+3+4+5=15 (+6=21 ok, +7=28 >21 new day), so day1 carries 1..6 = 21. Day 2: 7+8=15 (+9=24 >21 new day), 7+8 = 15. Day 3: 9 (+10=19 ok), 9+10=19. Total 3 days.',
  });

  frames.push({
    array: weights.slice(),
    highlights: { 0: 'match', 1: 'match', 2: 'match', 3: 'match', 4: 'match', 5: 'match' },
    chip: [
      { label: 'cap = 21', value: 'day 1: 1..6 = 21' },
      { label: 'days used', value: '1' },
    ],
    caption: 'Day 1 packs exactly to the limit: 1+2+3+4+5+6 = 21. Tight fit.',
  });

  frames.push({
    array: weights.slice(),
    highlights: { 6: 'match', 7: 'match' },
    chip: [
      { label: 'day 2', value: '7+8 = 15' },
      { label: 'next', value: '15+9 = 24 > 21 — new day' },
    ],
    caption: 'Day 2: 7+8 = 15. Cannot fit 9 (would be 24). Close day 2.',
  });

  frames.push({
    array: weights.slice(),
    highlights: { 8: 'high', 9: 'high' },
    chip: [
      { label: 'day 3', value: '9+10 = 19' },
      { label: 'days used', value: '3', tone: 'violet' },
      { label: 'verdict', value: '3 <= 5: FEASIBLE', tone: 'pink' },
    ],
    caption: 'Day 3: 9+10 = 19. Total 3 days <= 5. cap=21 works. hi = mid = 21.',
  });

  // ---------- iteration 3: lo=10, hi=21, mid=15 ----------
  hi = 21;
  mid = Math.floor((lo + hi) / 2); // 15
  frames.push({
    array: weights.slice(),
    chip: [
      { label: 'lo', value: '10' },
      { label: 'hi', value: '21' },
      { label: 'mid (try cap)', value: '15', tone: 'pink' },
    ],
    caption: 'Iteration 3: cap=15. day1 1+2+3+4+5=15 (close); day2 6+7=13 (+8=21>15); day3 8 (+9=17>15); day4 9 (+10=19>15); day5 10. Total 5 days. Just barely.',
  });

  frames.push({
    array: weights.slice(),
    chip: [
      { label: 'cap = 15', value: 'days: 5' },
      { label: 'needed', value: '<= 5' },
      { label: 'verdict', value: 'FEASIBLE', tone: 'pink' },
    ],
    caption: '5 days exactly meets the deadline. cap=15 works. hi = mid = 15.',
  });

  // ---------- iteration 4: lo=10, hi=15, mid=12 ----------
  hi = 15;
  mid = Math.floor((lo + hi) / 2); // 12
  frames.push({
    array: weights.slice(),
    chip: [
      { label: 'lo', value: '10' },
      { label: 'hi', value: '15' },
      { label: 'mid (try cap)', value: '12', tone: 'pink' },
    ],
    caption: 'Iteration 4: cap=12. day1 1+2+3+4=10 (+5=15>12); day2 5+6=11 (+7=18>12); day3 7 (+8=15>12); day4 8 (+9=17>12); day5 9 (+10=19>12); day6 10. Total 6 days > 5. Fails.',
  });

  frames.push({
    array: weights.slice(),
    chip: [
      { label: 'cap = 12', value: 'days: 6' },
      { label: 'verdict', value: 'INFEASIBLE', tone: 'pink' },
    ],
    caption: '6 > 5. Tighten lo: lo = mid + 1 = 13. Range now [13, 15].',
  });

  // ---------- final iterations collapse to 15 ----------
  frames.push({
    array: weights.slice(),
    chip: [
      { label: 'continuing', value: 'try 14 (fail, 6 days)' },
      { label: 'try 13', value: 'fail, 6 days' },
      { label: 'answer', value: '15', tone: 'pink' },
    ],
    caption: 'Skipping ahead: 13 and 14 both need 6 days (cannot squeeze 1+2+3+4+5 into one day, the partition gets stuck). Loop settles at lo=hi=15 — the minimum capacity that finishes in 5 days.',
  });

  // ---------- complexity / framing ----------
  frames.push({
    array: weights.slice(),
    chip: [
      { label: 'range', value: '[max(w), sum(w)]' },
      { label: 'iters', value: 'O(log sum)' },
      { label: 'per iter', value: 'O(n) simulation' },
      { label: 'total', value: 'O(n log sum)', tone: 'pink' },
    ],
    caption: 'Cost: O(n log sum). With n=5*10^4 and sum up to 5*10^8, log2(5*10^8) ~ 29. About 1.5M operations — well under any time limit. Linear-time DP would be O(n * days) which beats this only when days is tiny; binary search wins on the realistic range.',
  });

  frames.push({
    array: weights.slice(),
    chip: [
      { label: 'pitfall', value: 'lo = 1 wrong', tone: 'pink' },
      { label: 'fix', value: 'lo = max(weights)' },
      { label: 'why', value: 'capacity below max blocks any day' },
    ],
    caption: 'Critical pitfall: starting lo at 1 (or below max(weights)) means the simulation hits a package it cannot load on any day — infinite loop or wrong answer. Always seed lo to max(weights) so the predicate is well-defined across the search range.',
  });

  frames.push({
    array: weights.slice(),
    chip: [
      { label: 'sibling problems', value: 'split-array-largest-sum' },
      { label: 'same template', value: 'minimize-max via bsearch', tone: 'violet' },
      { label: 'mirror', value: 'divide-chocolate (maximize-min)' },
    ],
    caption: 'This is the canonical "minimize the maximum" template: binary-search the answer, predicate = "does a greedy left-to-right partition use <= k chunks?". Split Array Largest Sum is the same problem with array elements instead of weights and groups instead of days. Divide Chocolate flips it to maximize-min — mirror image, same machinery.',
  });

  return { renderer: 'array', title: 'Ship Within Days — binary-search on capacity', frames };
}

`;

const ENTRIES_BLOCK = `  'magnetic-force-between-two-balls': {
    tags: ['array', 'binary-search', 'greedy', 'sorting'],
    companies: ['amazon', 'google', 'meta', 'microsoft', 'apple', 'uber'],
    viz: magneticForceViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def maxDistance(self, position, m):
        position.sort()
        n = len(position)

        def can_place(d):
            count, last = 1, position[0]
            for i in range(1, n):
                if position[i] - last >= d:
                    count += 1
                    last = position[i]
                    if count >= m:
                        return True
            return count >= m

        lo, hi = 1, position[-1] - position[0]
        while lo < hi:
            mid = (lo + hi + 1) // 2
            if can_place(mid):
                lo = mid
            else:
                hi = mid - 1
        return lo\`,
        complexity: { time: 'O(n log n + n log V)', space: 'O(1) extra' },
        approach: 'Sort positions, then binary-search the largest spacing d in [1, max - min]. For each d, greedily place balls: anchor at the smallest position, then walk rightward placing whenever the gap >= d. The predicate is monotone (larger d means harder), so binary search converges on the boundary — the answer.',
      },
      javascript: {
        code: \`function maxDistance(position, m) {
  position.sort((a, b) => a - b);
  const n = position.length;
  const canPlace = (d) => {
    let count = 1, last = position[0];
    for (let i = 1; i < n; i++) {
      if (position[i] - last >= d) {
        count++;
        last = position[i];
        if (count >= m) return true;
      }
    }
    return count >= m;
  };
  let lo = 1, hi = position[n - 1] - position[0];
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (canPlace(mid)) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}\`,
        complexity: { time: 'O(n log n + n log V)', space: 'O(1) extra' },
        approach: 'Ceil mid via (lo + hi + 1) >> 1 — required because lo = mid on the feasible branch, and floor-mid would spin forever when lo and hi are adjacent. JS sort defaults to lexicographic; the (a, b) => a - b comparator is mandatory for numeric inputs.',
      },
      java: {
        code: \`import java.util.Arrays;

class Solution {
    public int maxDistance(int[] position, int m) {
        Arrays.sort(position);
        int n = position.length;
        int lo = 1, hi = position[n - 1] - position[0];
        while (lo < hi) {
            int mid = lo + (hi - lo + 1) / 2;
            if (canPlace(position, mid, m)) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }

    private boolean canPlace(int[] pos, int d, int m) {
        int count = 1, last = pos[0];
        for (int i = 1; i < pos.length; i++) {
            if (pos[i] - last >= d) {
                count++;
                last = pos[i];
                if (count >= m) return true;
            }
        }
        return count >= m;
    }
}\`,
        complexity: { time: 'O(n log n + n log V)', space: 'O(1) extra' },
        approach: 'lo + (hi - lo + 1) / 2 instead of (lo + hi + 1) / 2 to avoid overflow on positions up to 10^9 (the classic Java binary-search trap). Helper kept private so the main method stays focused on the search loop.',
      },
      cpp: {
        code: \`#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxDistance(vector<int>& position, int m) {
        sort(position.begin(), position.end());
        int n = position.size();
        auto canPlace = [&](int d) {
            int count = 1, last = position[0];
            for (int i = 1; i < n; i++) {
                if (position[i] - last >= d) {
                    count++;
                    last = position[i];
                    if (count >= m) return true;
                }
            }
            return count >= m;
        };
        int lo = 1, hi = position.back() - position.front();
        while (lo < hi) {
            int mid = lo + (hi - lo + 1) / 2;
            if (canPlace(mid)) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }
};\`,
        complexity: { time: 'O(n log n + n log V)', space: 'O(1) extra' },
        approach: 'Capture-by-reference lambda keeps position/n addressable without re-passing. std::sort uses introsort — guaranteed O(n log n) worst case, important on adversarial inputs that defeat plain quicksort.',
      },
      c: {
        code: \`#include <stdlib.h>
#include <stdbool.h>

static int cmp(const void* a, const void* b) {
    int x = *(const int*)a, y = *(const int*)b;
    return (x > y) - (x < y);
}

static bool canPlace(int* pos, int n, int d, int m) {
    int count = 1, last = pos[0];
    for (int i = 1; i < n; i++) {
        if (pos[i] - last >= d) {
            count++;
            last = pos[i];
            if (count >= m) return true;
        }
    }
    return count >= m;
}

int maxDistance(int* position, int positionSize, int m) {
    qsort(position, positionSize, sizeof(int), cmp);
    int lo = 1, hi = position[positionSize - 1] - position[0];
    while (lo < hi) {
        int mid = lo + (hi - lo + 1) / 2;
        if (canPlace(position, positionSize, mid, m)) lo = mid;
        else hi = mid - 1;
    }
    return lo;
}\`,
        complexity: { time: 'O(n log n + n log V)', space: 'O(1) extra' },
        approach: 'qsort with a branchless comparator (the classic a - b form overflows on INT_MIN). Greedy helper short-circuits as soon as count hits m — cuts worst-case constant factor roughly in half on satisfiable inputs.',
      },
      go: {
        code: \`import "sort"

func maxDistance(position []int, m int) int {
    sort.Ints(position)
    n := len(position)
    canPlace := func(d int) bool {
        count, last := 1, position[0]
        for i := 1; i < n; i++ {
            if position[i]-last >= d {
                count++
                last = position[i]
                if count >= m {
                    return true
                }
            }
        }
        return count >= m
    }
    lo, hi := 1, position[n-1]-position[0]
    for lo < hi {
        mid := lo + (hi-lo+1)/2
        if canPlace(mid) {
            lo = mid
        } else {
            hi = mid - 1
        }
    }
    return lo
}\`,
        complexity: { time: 'O(n log n + n log V)', space: 'O(1) extra' },
        approach: 'sort.Ints sorts in place. Closure captures position and n by reference (Go closures capture variables, not values), so the helper always sees the sorted slice. Ceil-mid pattern same as the other languages.',
      },
    },
  },
  'divide-chocolate': {
    tags: ['array', 'binary-search', 'greedy', 'prefix-sum'],
    companies: ['google', 'amazon', 'meta', 'microsoft', 'apple', 'bloomberg'],
    viz: divideChocolateViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def maximizeSweetness(self, sweetness, k):
        def can_partition(x):
            pieces, running = 0, 0
            for s in sweetness:
                running += s
                if running >= x:
                    pieces += 1
                    running = 0
            return pieces >= k + 1

        lo, hi = min(sweetness), sum(sweetness) // (k + 1)
        while lo < hi:
            mid = (lo + hi + 1) // 2
            if can_partition(mid):
                lo = mid
            else:
                hi = mid - 1
        return lo\`,
        complexity: { time: 'O(n log V)', space: 'O(1) extra' },
        approach: 'Binary-search the kept-piece minimum x in [min(sweetness), sum/(k+1)]. Predicate: greedy left-to-right partition into chunks of running-sum >= x produces at least k+1 chunks. Monotone: larger x means harder to chunk, so the answer is the largest feasible x.',
      },
      javascript: {
        code: \`function maximizeSweetness(sweetness, k) {
  const canPartition = (x) => {
    let pieces = 0, running = 0;
    for (const s of sweetness) {
      running += s;
      if (running >= x) { pieces++; running = 0; }
    }
    return pieces >= k + 1;
  };
  let lo = Math.min(...sweetness);
  let hi = Math.floor(sweetness.reduce((a, b) => a + b, 0) / (k + 1));
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (canPartition(mid)) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}\`,
        complexity: { time: 'O(n log V)', space: 'O(1) extra' },
        approach: 'Math.min(...arr) spreads — fine for the typical n <= 10^4 here, but use a loop if n grows large enough to overflow the call stack. Ceil mid + lo = mid pairing avoids the infinite-loop trap when lo and hi are adjacent.',
      },
      java: {
        code: \`class Solution {
    public int maximizeSweetness(int[] sweetness, int k) {
        int lo = Integer.MAX_VALUE, sum = 0;
        for (int s : sweetness) { lo = Math.min(lo, s); sum += s; }
        int hi = sum / (k + 1);
        while (lo < hi) {
            int mid = lo + (hi - lo + 1) / 2;
            if (canPartition(sweetness, mid, k)) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }

    private boolean canPartition(int[] sweetness, int x, int k) {
        int pieces = 0, running = 0;
        for (int s : sweetness) {
            running += s;
            if (running >= x) { pieces++; running = 0; }
        }
        return pieces >= k + 1;
    }
}\`,
        complexity: { time: 'O(n log V)', space: 'O(1) extra' },
        approach: 'Single pass computes both min and sum — saves a second loop. lo + (hi - lo + 1) / 2 form dodges overflow; sweetness sums can reach ~10^9, well inside int but two-line caution costs nothing.',
      },
      cpp: {
        code: \`#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;

class Solution {
public:
    int maximizeSweetness(vector<int>& sweetness, int k) {
        auto canPartition = [&](int x) {
            int pieces = 0, running = 0;
            for (int s : sweetness) {
                running += s;
                if (running >= x) { pieces++; running = 0; }
            }
            return pieces >= k + 1;
        };
        int lo = *min_element(sweetness.begin(), sweetness.end());
        int hi = accumulate(sweetness.begin(), sweetness.end(), 0) / (k + 1);
        while (lo < hi) {
            int mid = lo + (hi - lo + 1) / 2;
            if (canPartition(mid)) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }
};\`,
        complexity: { time: 'O(n log V)', space: 'O(1) extra' },
        approach: 'min_element + accumulate from <algorithm>/<numeric> — clearer than hand-rolling. Capture-by-reference lambda lets the predicate see sweetness without copying. Standard ceil-mid pairing.',
      },
      c: {
        code: \`#include <stdbool.h>
#include <limits.h>

static bool canPartition(int* sweetness, int n, int x, int k) {
    int pieces = 0, running = 0;
    for (int i = 0; i < n; i++) {
        running += sweetness[i];
        if (running >= x) { pieces++; running = 0; }
    }
    return pieces >= k + 1;
}

int maximizeSweetness(int* sweetness, int sweetnessSize, int k) {
    int lo = INT_MAX, sum = 0;
    for (int i = 0; i < sweetnessSize; i++) {
        if (sweetness[i] < lo) lo = sweetness[i];
        sum += sweetness[i];
    }
    int hi = sum / (k + 1);
    while (lo < hi) {
        int mid = lo + (hi - lo + 1) / 2;
        if (canPartition(sweetness, sweetnessSize, mid, k)) lo = mid;
        else hi = mid - 1;
    }
    return lo;
}\`,
        complexity: { time: 'O(n log V)', space: 'O(1) extra' },
        approach: 'Compute lo and hi in a single sweep — no library imports needed. Predicate is a tight loop with no allocations, ideal for the inner binary-search hot path.',
      },
      go: {
        code: \`func maximizeSweetness(sweetness []int, k int) int {
    lo, sum := sweetness[0], 0
    for _, s := range sweetness {
        if s < lo {
            lo = s
        }
        sum += s
    }
    hi := sum / (k + 1)
    canPartition := func(x int) bool {
        pieces, running := 0, 0
        for _, s := range sweetness {
            running += s
            if running >= x {
                pieces++
                running = 0
            }
        }
        return pieces >= k+1
    }
    for lo < hi {
        mid := lo + (hi-lo+1)/2
        if canPartition(mid) {
            lo = mid
        } else {
            hi = mid - 1
        }
    }
    return lo
}\`,
        complexity: { time: 'O(n log V)', space: 'O(1) extra' },
        approach: 'Initialize lo from sweetness[0] (problem guarantees non-empty) then refine — saves importing math for MaxInt. Closure captures sweetness by reference; standard ceil-mid pairing.',
      },
    },
  },
  'capacity-to-ship-packages-within-d-days': {
    tags: ['array', 'binary-search', 'greedy'],
    companies: ['amazon', 'google', 'meta', 'microsoft', 'apple', 'goldman-sachs'],
    viz: shipWithinDaysViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def shipWithinDays(self, weights, days):
        def days_needed(cap):
            d, load = 1, 0
            for w in weights:
                if load + w > cap:
                    d += 1
                    load = 0
                load += w
            return d

        lo, hi = max(weights), sum(weights)
        while lo < hi:
            mid = (lo + hi) // 2
            if days_needed(mid) <= days:
                hi = mid
            else:
                lo = mid + 1
        return lo\`,
        complexity: { time: 'O(n log sum)', space: 'O(1) extra' },
        approach: 'Binary-search the capacity in [max(w), sum(w)]. Predicate: simulate left-to-right loading, opening a new day each time the next package would overflow; if total days <= deadline, the capacity is feasible. Monotone (larger cap = fewer days), so the smallest feasible cap is the answer. Use floor-mid here because we update hi = mid on feasible.',
      },
      javascript: {
        code: \`function shipWithinDays(weights, days) {
  const daysNeeded = (cap) => {
    let d = 1, load = 0;
    for (const w of weights) {
      if (load + w > cap) { d++; load = 0; }
      load += w;
    }
    return d;
  };
  let lo = Math.max(...weights);
  let hi = weights.reduce((a, b) => a + b, 0);
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (daysNeeded(mid) <= days) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}\`,
        complexity: { time: 'O(n log sum)', space: 'O(1) extra' },
        approach: 'Floor mid via (lo + hi) >> 1 — pairs with hi = mid on feasible / lo = mid + 1 on infeasible, the standard "smallest feasible" template. Math.max spread works for typical inputs; switch to a loop if n > 10^5 to avoid stack-frame limits.',
      },
      java: {
        code: \`class Solution {
    public int shipWithinDays(int[] weights, int days) {
        int lo = 0, hi = 0;
        for (int w : weights) { lo = Math.max(lo, w); hi += w; }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (daysNeeded(weights, mid) <= days) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    private int daysNeeded(int[] weights, int cap) {
        int d = 1, load = 0;
        for (int w : weights) {
            if (load + w > cap) { d++; load = 0; }
            load += w;
        }
        return d;
    }
}\`,
        complexity: { time: 'O(n log sum)', space: 'O(1) extra' },
        approach: 'Compute lo (max weight) and hi (sum) in a single pass — both needed and a single iteration sets them. lo + (hi - lo) / 2 avoids the integer-overflow trap when hi approaches Integer.MAX_VALUE / 2 with large weights.',
      },
      cpp: {
        code: \`#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;

class Solution {
public:
    int shipWithinDays(vector<int>& weights, int days) {
        auto daysNeeded = [&](int cap) {
            int d = 1, load = 0;
            for (int w : weights) {
                if (load + w > cap) { d++; load = 0; }
                load += w;
            }
            return d;
        };
        int lo = *max_element(weights.begin(), weights.end());
        int hi = accumulate(weights.begin(), weights.end(), 0);
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (daysNeeded(mid) <= days) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};\`,
        complexity: { time: 'O(n log sum)', space: 'O(1) extra' },
        approach: 'max_element + accumulate keep intent visible. Lambda captures weights by reference so the predicate stays a one-liner at the call site. Standard floor-mid + hi = mid pairing for "smallest feasible".',
      },
      c: {
        code: \`int shipWithinDays(int* weights, int weightsSize, int days) {
    int lo = 0, hi = 0;
    for (int i = 0; i < weightsSize; i++) {
        if (weights[i] > lo) lo = weights[i];
        hi += weights[i];
    }
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        int d = 1, load = 0;
        for (int i = 0; i < weightsSize; i++) {
            if (load + weights[i] > mid) { d++; load = 0; }
            load += weights[i];
        }
        if (d <= days) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}\`,
        complexity: { time: 'O(n log sum)', space: 'O(1) extra' },
        approach: 'Inlined predicate keeps the call hot in cache — no function-call overhead in the binary-search inner loop. Same monotone-feasibility template; overflow-safe mid calculation.',
      },
      go: {
        code: \`func shipWithinDays(weights []int, days int) int {
    lo, hi := 0, 0
    for _, w := range weights {
        if w > lo {
            lo = w
        }
        hi += w
    }
    daysNeeded := func(cap int) int {
        d, load := 1, 0
        for _, w := range weights {
            if load+w > cap {
                d++
                load = 0
            }
            load += w
        }
        return d
    }
    for lo < hi {
        mid := lo + (hi-lo)/2
        if daysNeeded(mid) <= days {
            hi = mid
        } else {
            lo = mid + 1
        }
    }
    return lo
}\`,
        complexity: { time: 'O(n log sum)', space: 'O(1) extra' },
        approach: 'One pass sets both lo (max) and hi (sum). Closure captures weights — Go closures capture variables, not values, so the predicate always sees the current slice. Floor-mid pattern paired with hi = mid on feasible.',
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

// Find the matching closing brace of the RICH_CONTENT object, skipping
// strings ('", `) and // /* */ comments so braces in template literals
// do not throw off the count.
const openBracePos = src.indexOf('{', vizIdx);
let depth = 0, closeIdx = -1;
let p = openBracePos;
while (p < src.length) {
  const ch = src[p];
  const ch2 = src[p + 1];
  if (ch === '/' && ch2 === '/') {
    const nl = src.indexOf('\n', p + 2);
    p = nl < 0 ? src.length : nl + 1;
    continue;
  }
  if (ch === '/' && ch2 === '*') {
    const end = src.indexOf('*/', p + 2);
    p = end < 0 ? src.length : end + 2;
    continue;
  }
  if (ch === "'" || ch === '"') {
    const quote = ch;
    p++;
    while (p < src.length) {
      if (src[p] === '\\') { p += 2; continue; }
      if (src[p] === quote) { p++; break; }
      p++;
    }
    continue;
  }
  if (ch === '`') {
    p++;
    while (p < src.length) {
      if (src[p] === '\\') { p += 2; continue; }
      if (src[p] === '$' && src[p + 1] === '{') {
        // walk a single template expression depth
        p += 2;
        let td = 1;
        while (p < src.length && td > 0) {
          if (src[p] === '{') td++;
          else if (src[p] === '}') td--;
          p++;
        }
        continue;
      }
      if (src[p] === '`') { p++; break; }
      p++;
    }
    continue;
  }
  if (ch === '{') { depth++; p++; continue; }
  if (ch === '}') {
    depth--;
    if (depth === 0) { closeIdx = p; break; }
    p++;
    continue;
  }
  p++;
}

if (closeIdx < 0) {
  console.error('Could not find RICH_CONTENT closing brace.');
  process.exit(1);
}

const before = src.slice(0, vizIdx);
const middle = src.slice(vizIdx, closeIdx);
const after = src.slice(closeIdx);

const out = before + VIZ_BLOCK + middle + ENTRIES_BLOCK + after;

fs.writeFileSync(FILE, out, 'utf8');
console.log('Spliced 3 problems + viz fns into', FILE);
console.log('  - magnetic-force-between-two-balls');
console.log('  - divide-chocolate');
console.log('  - capacity-to-ship-packages-within-d-days');
