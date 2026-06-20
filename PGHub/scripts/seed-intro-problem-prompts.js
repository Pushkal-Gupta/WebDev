#!/usr/bin/env node
// Replace placeholder descriptions on the 443 skeleton problems with proper
// prompts for the 30+ most-common Tutorial intro exercises. The skeleton
// seeder created stubs with a generic "open the solver to write code"
// description; this fills in real problem statements + examples + hints
// for the highest-traffic intro problems so users land on something useful.

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

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PROMPTS = [
  { id: 'print-1-to-n', difficulty: 'Easy', topic_id: 'recursion',
    description: '<p>Given a positive integer <code>n</code>, print integers from <code>1</code> to <code>n</code>, each on its own line.</p><p><strong>Example:</strong> n = 5 → <code>1\\n2\\n3\\n4\\n5</code></p><p><strong>Constraint:</strong> 1 ≤ n ≤ 1000. The recursive version is the interesting one — figure out where to place the print before vs. after the recursive call.</p>',
    hints: ['Try a loop first.', 'Then write it recursively: recurse(1, n).', 'For the recursive version, print before the recursive call to go 1→n; print after to go n→1.'] },
  { id: 'print-n-to-1', difficulty: 'Easy', topic_id: 'recursion',
    description: '<p>Given <code>n</code>, print integers from <code>n</code> down to <code>1</code>, each on its own line.</p><p><strong>Recursive twist:</strong> if you wrote <code>print-1-to-n</code> recursively by printing before recursion, this version is the same code with the print AFTER the recursive call.</p>',
    hints: ['Loop version: trivial.', 'Recursive: place the print statement after recurse(i+1, n).'] },
  { id: 'sum-of-naturals', difficulty: 'Easy', topic_id: 'math',
    description: '<p>Return the sum <code>1 + 2 + … + n</code>.</p><p>Closed form: <code>n * (n + 1) / 2</code>. Loop version: accumulate. Recursive: <code>sum(n) = n + sum(n-1)</code>.</p>',
    hints: ['The closed form is O(1).', 'Watch out for overflow when n is large (use long).'] },
  { id: 'factorial', difficulty: 'Easy', topic_id: 'recursion',
    description: '<p>Return <code>n!</code> = 1 * 2 * 3 * … * n. By convention <code>0! = 1</code>.</p><p>This is the canonical recursion example.</p>',
    hints: ['Base case: n ≤ 1 returns 1.', 'Recursive case: n * factorial(n-1).', 'For n > 20, return BigInt / long — factorial overflows fast.'] },
  { id: 'gcd', difficulty: 'Easy', topic_id: 'math',
    description: '<p>Greatest Common Divisor of two non-negative integers <code>a</code> and <code>b</code>. Use Euclid\'s algorithm: <code>gcd(a, b) = gcd(b, a mod b)</code>, base case <code>gcd(x, 0) = x</code>.</p><p><strong>Example:</strong> gcd(48, 18) = 6.</p>',
    hints: ['Euclidean algorithm — no need for a loop checking every number.', 'Iterative: while (b) { [a, b] = [b, a % b] }; return a.'] },
  { id: 'power', difficulty: 'Easy', topic_id: 'math',
    description: '<p>Compute <code>x^n</code> efficiently. The naïve loop is O(n); fast exponentiation by squaring is O(log n).</p><p><strong>Idea:</strong> if n is even, x^n = (x^(n/2))²; if odd, x * x^(n-1).</p>',
    hints: ['Watch for n negative — handle by computing 1 / x^|n|.', 'Fast pow can overflow for big n; mod where needed.'] },
  { id: 'fibonacci', difficulty: 'Easy', topic_id: 'dp',
    description: '<p>Return the n-th Fibonacci number. <code>F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2)</code> for n ≥ 2.</p><p>Naïve recursion is O(2^n) — visit the call tree on /visualize/fibonacci-recursion to see why. Memoization or iterative bottom-up makes it O(n).</p>',
    hints: ['Iterative with two variables uses O(1) space.', 'Memoization cuts the call tree dramatically.', 'Matrix exponentiation gets it to O(log n).'] },
  { id: 'prime-testing', difficulty: 'Easy', topic_id: 'math',
    description: '<p>Given <code>n</code>, return whether <code>n</code> is prime.</p><p>Trial division up to <code>√n</code> is O(√n).</p>',
    hints: ['Return false for n ≤ 1; true for 2; false for any other even.', 'Loop i from 3 to √n step 2 — skip evens.'] },
  { id: 'count-digits', difficulty: 'Easy', topic_id: 'math',
    description: '<p>Given a non-negative integer <code>n</code>, return the count of digits.</p><p>Both <code>floor(log10(n)) + 1</code> and repeated <code>n / 10</code> work.</p>',
    hints: ['Edge case: n = 0 → 1 digit.', 'Loop: count = 0; while n > 0 { count++; n /= 10 }.'] },
  { id: 'all-divisors', difficulty: 'Easy', topic_id: 'math',
    description: '<p>Return all positive divisors of <code>n</code> in ascending order.</p><p>Loop i = 1 to √n; if n % i == 0, both i and n/i are divisors.</p>',
    hints: ['Don\'t double-count when i == n/i (perfect square).', 'Collect smaller half ascending, larger half descending, then merge — or push to two arrays.'] },
  { id: 'prime-factors', difficulty: 'Easy', topic_id: 'math',
    description: '<p>Return the prime-factor decomposition of <code>n</code>.</p><p><strong>Example:</strong> 60 → [2, 2, 3, 5].</p>',
    hints: ['Trial-divide by 2 first, then odd i from 3.', 'After the loop, if n > 1, n itself is a remaining prime factor.'] },
  { id: 'even-or-odd', difficulty: 'Easy', topic_id: 'bit-manipulation',
    description: '<p>Given an integer <code>n</code>, return "even" or "odd".</p><p>Either <code>n % 2 == 0</code> or bit-test <code>(n & 1) == 0</code>.</p>',
    hints: ['Negative numbers: % can return -1 in some languages; bit-test is safer.'] },
  { id: 'leap-year', difficulty: 'Easy', topic_id: 'math',
    description: '<p>Return whether year <code>y</code> is a leap year.</p><p>Rule: divisible by 4 AND (not divisible by 100 OR divisible by 400).</p>',
    hints: ['Test years 2000, 1900, 2024, 2023.'] },
  { id: 'armstrong-number', difficulty: 'Easy', topic_id: 'math',
    description: '<p>An <em>Armstrong number</em> (narcissistic) of length d equals the sum of its digits each raised to the d-th power.</p><p><strong>Example:</strong> 153 = 1³ + 5³ + 3³ ✓</p>',
    hints: ['First count digits, then iterate digits raising each to that count.'] },
  { id: 'trailing-zeros', difficulty: 'Medium', topic_id: 'math',
    description: '<p>Return the number of trailing zeros in <code>n!</code>.</p><p>Each zero comes from a factor of 10 = 2 × 5. There are always more 2s than 5s, so count the number of times 5 divides into n!: <code>n/5 + n/25 + n/125 + …</code></p>',
    hints: ['Don\'t actually compute n! — overflow before n=20.', 'Loop dividing by 5 until n hits 0.'] },
  { id: 'reverse-a-number', difficulty: 'Easy', topic_id: 'math',
    description: '<p>Given an integer <code>n</code>, return <code>n</code> with its digits reversed. Preserve sign.</p>',
    hints: ['Build result = result*10 + n%10; n /= 10.', 'Watch for 32-bit overflow on reversal.'] },
  { id: 'palindrome-number', difficulty: 'Easy', topic_id: 'math',
    description: '<p>Return whether integer <code>n</code> is a palindrome (reads the same forward and backward).</p><p>Negative numbers are NOT palindromes.</p>',
    hints: ['Reverse half of the number — when reverse ≥ remaining, you\'ve passed the midpoint.', 'Easier: cast to string and compare to its reverse.'] },
  { id: 'happy-number', difficulty: 'Easy', topic_id: 'math',
    description: '<p>Replace n by the sum of squares of its digits; repeat. n is "happy" if this eventually reaches 1. Detect cycles to avoid infinite loops.</p><p><strong>Example:</strong> 19 → 82 → 68 → 100 → 1 ✓</p>',
    hints: ['Use a set to detect cycles.', 'Or Floyd\'s tortoise-and-hare — same trick as linked list cycle detection.'] },
  { id: 'reverse-string', difficulty: 'Easy', topic_id: 'two-pointers',
    description: '<p>Reverse the given string <strong>in place</strong> (don\'t allocate a new array).</p>',
    hints: ['Two pointers from both ends, swap, move inward.', 'Stop when they meet.'] },
  { id: 'check-anagram', difficulty: 'Easy', topic_id: 'strings',
    description: '<p>Given two strings, return whether they are anagrams (same letters, possibly reordered).</p>',
    hints: ['Count character frequencies and compare.', 'Or sort both and compare — O(n log n) instead of O(n).'] },
  { id: 'valid-parentheses', difficulty: 'Easy', topic_id: 'stack',
    description: '<p>Given a string of <code>()[]{}</code>, return whether the brackets are balanced and properly nested.</p>',
    hints: ['Use a stack — push opens, pop on closes and check the match.', 'Empty stack at the end = valid.'] },
  { id: 'reverse-linked-list', difficulty: 'Easy', topic_id: 'linkedlist',
    description: '<p>Reverse a singly linked list. Return the new head.</p>',
    hints: ['Iterative: maintain prev, cur, next.', 'Recursive: reverse(head.next), then point head.next.next = head, head.next = null.'] },
  { id: 'find-middle-of-linked-list', difficulty: 'Easy', topic_id: 'linkedlist',
    description: '<p>Return the middle node of a singly linked list (for even length, return the second middle).</p>',
    hints: ['Fast + slow pointer. Fast moves 2 steps, slow moves 1. When fast reaches end, slow is at middle.'] },
  { id: 'detect-cycle-in-linked-list', difficulty: 'Medium', topic_id: 'linkedlist',
    description: '<p>Return whether a singly linked list contains a cycle.</p><p>See /visualize/loop-detection for the Floyd\'s tortoise-and-hare walkthrough.</p>',
    hints: ['Floyd\'s tortoise & hare: two pointers, one moves 2x. If they meet, cycle exists.', 'O(1) space — no hashset needed.'] },
  { id: 'inorder-traversal', difficulty: 'Easy', topic_id: 'trees',
    description: '<p>Return the in-order traversal of a binary tree as a list of values.</p>',
    hints: ['Recursive: in-order(left), visit, in-order(right).', 'Iterative: use a stack, push lefts until null, pop + visit + go right.'] },
  { id: 'level-order-traversal', difficulty: 'Medium', topic_id: 'trees',
    description: '<p>Return the level-order traversal of a binary tree as a list of lists (one list per level).</p>',
    hints: ['BFS with a queue. Process one level at a time by capturing queue.length at start.'] },
  { id: 'height-of-binary-tree', difficulty: 'Easy', topic_id: 'trees',
    description: '<p>Return the height (max depth) of a binary tree. Empty tree has height 0.</p>',
    hints: ['Recursive: 1 + max(height(left), height(right)).', 'Base case: null → 0.'] },
  { id: 'check-bst', difficulty: 'Medium', topic_id: 'trees',
    description: '<p>Return whether the given binary tree is a valid BST. Each node\'s value must lie within (min, max) bounds derived from ancestors.</p>',
    hints: ['Pass min/max bounds down recursively.', 'Easy mistake: only checking left.val < node.val < right.val is NOT enough (need ancestor bounds).'] },
  { id: 'binary-search-iterative', difficulty: 'Easy', topic_id: 'binary-search',
    description: '<p>Given a sorted array and target, return the index of target or -1 if not present. Iterative binary search.</p><p>See /visualize/binary-search for the walkthrough.</p>',
    hints: ['lo, hi = 0, n-1. While lo ≤ hi, mid = (lo+hi)/2.', 'Use lo + (hi-lo)/2 to avoid integer overflow.'] },
  { id: 'bfs-traversal', difficulty: 'Medium', topic_id: 'graphs',
    description: '<p>Given a graph and a starting node, return the BFS traversal order.</p><p>See /visualize/bfs-dfs for the walkthrough.</p>',
    hints: ['Use a queue + visited set.', 'For unweighted graphs, BFS gives shortest path in terms of edge count.'] },
  { id: 'dfs-traversal', difficulty: 'Medium', topic_id: 'graphs',
    description: '<p>Given a graph and a starting node, return the DFS traversal order.</p>',
    hints: ['Recursive: visited set + recursive helper.', 'Iterative: stack instead of queue.'] },
];

// Fetch existing names so the upsert keeps them (NOT NULL column).
const ids = PROMPTS.map(p => p.id);
const { data: existing } = await sb.from('PGcode_problems').select('id,name').in('id', ids);
const nameById = Object.fromEntries((existing || []).map(r => [r.id, r.name]));

const rows = PROMPTS.map(p => {
  const fallbackName = p.id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  return {
    id: p.id,
    name: nameById[p.id] || fallbackName,
    topic_id: p.topic_id,
    difficulty: p.difficulty,
    description: p.description,
    hints: p.hints,
    roadmap_set: '200', // surface in default browse mode now that they have content
  };
});

const { error } = await sb.from('PGcode_problems').upsert(rows, { onConflict: 'id' });
if (error) { console.error(error.message); process.exit(1); }
console.log(`Authored ${rows.length} intro problem prompts.`);
