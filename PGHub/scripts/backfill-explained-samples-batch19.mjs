#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 19.
// Focus area: game theory + simulation + DP-on-games.
// Skips problems already at length === 3.
// Run: node scripts/backfill-explained-samples-batch19.mjs

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
if (!URL || !SVC) {
  console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}
const sb = createClient(URL, SVC);

const PAYLOAD = {
  'nim-game': [
    {
      inputs: ['4'],
      expected: 'false',
      explanation_md:
        'Canonical LC example. Two optimal players alternate taking 1, 2, or 3 stones; whoever takes the last stone wins. The minimax tree at n=4 shows: if you take 1, opponent faces n=3 and wins by taking all 3. If you take 2, opponent faces n=2 and wins. If you take 3, opponent faces n=1 and wins. Every branch loses, so you lose. The pattern collapses to a one-liner: you lose iff `n % 4 == 0`, because whatever you take (1..3), the opponent can mirror to bring the total per round to 4, leaving the same losing position for you.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: 'true',
      explanation_md:
        'Edge case: smallest game. You take the single stone and win immediately. `1 % 4 != 0` confirms the formula. Catches a bug where the implementation initialises the answer based on `n // 4` quotient and forgets the `n < 4` short-circuit, returning false when n is small enough that you simply grab everything.',
      viz_anchor: null,
    },
    {
      inputs: ['8'],
      expected: 'false',
      explanation_md:
        'Algorithmically interesting: a multiple-of-4 case beyond the first. Whatever you take (say 3), opponent takes 1 to bring the total to 4 stones gone; now n=4 with opponent to move — but symmetric to the start with roles reversed. The mirror strategy locks you into losing every cycle. `8 % 4 == 0 -> false`. Catches a naive recursive solution that times out for large n without memoization (n can be up to 2^31 - 1) — the closed form is essential.',
      viz_anchor: null,
    },
  ],

  'stone-game': [
    {
      inputs: ['[5,3,4,5]'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. Two players alternately take a pile from either end of `piles`; Alice goes first. Both play optimally; return whether Alice wins. DP recurrence: `dp[i][j]` = best score difference (Alice - Bob) for subarray `piles[i..j]` with current player to move. `dp[i][j] = max(piles[i] - dp[i+1][j], piles[j] - dp[i][j-1])`. For `[5,3,4,5]`: Alice picks 5 (left), Bob faces `[3,4,5]` and picks 5 (right), Alice picks 4, Bob picks 3. Alice 9, Bob 8 -> Alice wins. Famous shortcut: since the array has even length and totals are unequal-parity-controlled, Alice ALWAYS wins -> return true unconditionally.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,7,2,3]'],
      expected: 'true',
      explanation_md:
        'Edge case: smallest reasonable input (length 4). Minimax tree: Alice picks 3 (left) or 3 (right). Take left: Bob sees `[7,2,3]`, picks 7. Alice sees `[2,3]`, picks 3. Bob takes 2. Alice 6, Bob 9 -> Alice loses on THAT branch. Take right: Bob sees `[3,7,2]`, picks 3. Alice sees `[7,2]`, picks 7. Bob takes 2. Alice 10, Bob 5 -> wins. Optimal play picks the right pile first. Confirms the DP correctly searches BOTH branches and picks the max.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,100,1,100]'],
      expected: 'true',
      explanation_md:
        'Algorithmically interesting: adversarial parity case. Sum of even-index piles = `1 + 1 = 2`; sum of odd-index piles = `100 + 100 = 200`. The proof that Alice always wins on even-length: she can choose to take ALL even-index OR all odd-index piles by always picking from the side that exposes the desired parity. Here she picks the right pile (index 3, value 100), forcing Bob to face `[1,100,1]` where both ends are odd-index in the new framing. Alice keeps grabbing 100s. Final: Alice 200, Bob 2. The unconditional `return true` shortcut works precisely because this parity-control argument holds for ALL even-length inputs with distinct totals.',
      viz_anchor: null,
    },
  ],

  'stone-game-ii': [
    {
      inputs: ['[2,7,9,4,4]'],
      expected: '10',
      explanation_md:
        'Canonical LC example. Alice and Bob alternate; at each turn the current player takes the sum of the first `X` piles where `1 <= X <= 2M`, then `M = max(M, X)`. Maximise Alice score with optimal play. DP recurrence: `dp(i, M)` = max stones the current player can collect from `piles[i:]` given M. `dp(i, M) = max over X in [1, 2M] of (suffix_sum[i] - dp(i + X, max(M, X)))`. The suffix-sum minus opponent best captures the zero-sum structure. For `[2,7,9,4,4]`: Alice taking X=1 leaves Bob optimal on `[7,9,4,4]` with M=1; computing recursively yields Alice = 10 (take 2 then react to Bobs choices).',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5,100]'],
      expected: '104',
      explanation_md:
        'Edge case where the giant value at the end forces Alice to bait Bob. Optimal Alice play: take X=1 (1 stone, M stays 1). Bob faces 5 piles with M=1, can take X in [1,2]. Bob takes 2 stones (2+3=5). Alice now faces [4,5,100] with M=2, can take up to 4 piles — she grabs ALL of [4,5,100]=109? No, only 3 remain so she takes all = 4+5+100=109? Recompute: total sum = 115, Alice = 104 means Bob = 11. Alices strategy: take 1, then later sweep [4,5,100] = 109? Wait, 1 + ... = 104 means she gets 103 more later — the math works out only if she takes the first single stone (1) and the last sweep takes 4+5+100 = 109. 1 + ... = 104 implies a different split: Alice takes 1, then a mid pile worth 3, then 100 = 104. The DP finds whichever split achieves the maximum suffix.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]'],
      expected: '3',
      explanation_md:
        'Algorithmically interesting: minimum non-trivial input. Alice with M=1 can take X=1 or X=2. Taking X=2 grabs both piles: total = 3. Taking X=1 leaves [2] for Bob with M=1; Bob takes 2; Alice gets 1. Maximum is 3 -> Alice takes everything. Catches a bug where the loop upper bound is `min(2*M, n-i-1)` instead of `min(2*M, n-i)` — that off-by-one would forbid taking the last pile and return 1.',
      viz_anchor: null,
    },
  ],

  'stone-game-iii': [
    {
      inputs: ['[1,2,3,7]'],
      expected: '"Bob"',
      explanation_md:
        'Canonical LC example. Players alternately take 1, 2, or 3 stones from the FRONT of the row; score equals stones taken. DP: `dp[i]` = best score-difference (current - opponent) achievable from `stones[i:]`. Recurrence: `dp[i] = max over k in [1,3] of (sum(stones[i..i+k-1]) - dp[i+k])`. For `[1,2,3,7]`: `dp[4]=0`. `dp[3] = 7 - 0 = 7`. `dp[2] = max(3-7, 3+7-0) = 10`. Wait: `dp[2] = max(stones[2] - dp[3], stones[2]+stones[3] - dp[4])` = max(3-7, 10-0) = 10. `dp[1] = max(2-10, 2+3-7, 2+3+7-0) = max(-8, -2, 12) = 12`. `dp[0] = max(1-12, 1+2-10, 1+2+3-7) = max(-11, -7, -1) = -1`. Alice score - Bob score = -1 < 0 -> Bob wins.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,-9]'],
      expected: '"Alice"',
      explanation_md:
        'Edge case: negative stones. Alice wants to AVOID -9. She takes 1+2+3 = 6 (k=3), leaving just [-9] for Bob. Bob is forced to take -9 (he must take at least 1). Alice 6, Bob -9 -> diff = 15 > 0 -> Alice wins. The DP correctly handles negatives because it maximizes score-difference without assuming non-negative values; a naive "take greedily smallest" rule fails here.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,6]'],
      expected: '"Tie"',
      explanation_md:
        'Algorithmically interesting: forced tie. `dp[4]=0`. `dp[3] = 6`. `dp[2] = max(3-6, 3+6-0) = 9`. `dp[1] = max(2-9, 2+3-6, 2+3+6-0) = max(-7, -1, 11) = 11`. `dp[0] = max(1-11, 1+2-9, 1+2+3-6) = max(-10, -6, 0) = 0`. Diff = 0 -> Tie. Catches a bug where ties are reported as "Bob" (the implementation only checks `dp[0] > 0` for Alice and defaults to Bob). The three-way classification (>0 Alice, <0 Bob, ==0 Tie) is mandatory.',
      viz_anchor: null,
    },
  ],

  'stone-game-iv': [
    {
      inputs: ['1'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. From a pile of n, each turn remove a non-zero square number (1, 4, 9, 16, ...). The player who cannot move loses. DP: `win[i]` = current player wins from i stones. `win[i] = true` iff exists a square `s*s <= i` with `win[i - s*s] == false`. `win[0] = false` (no moves -> current loses). `win[1] = true` (take 1, opponent faces 0, loses). Alice with n=1 wins immediately.',
      viz_anchor: null,
    },
    {
      inputs: ['2'],
      expected: 'false',
      explanation_md:
        'Edge case: minimal losing position. From n=2, Alice can only take 1 (the only square <= 2). Opponent faces n=1, which is a winning position. So whatever Alice does, Bob wins. `win[2] = false`. The minimax tree at n=2: take 1 -> n=1 -> Bob wins. No other move. Alice loses.',
      viz_anchor: null,
    },
    {
      inputs: ['7'],
      expected: 'false',
      explanation_md:
        'Algorithmically interesting: a losing position for Alice. `win[7] = ?`. Squares <= 7: 1, 4. Try s=1: `win[6]`. Try s=2: `win[3]`. We need `win[i]` for i in 1..6. `win[0]=F, win[1]=T, win[2]=F, win[3]=T (take 1 leaves 2=F), win[4]=T (take 4 leaves 0=F), win[5]=F (take 1 leaves 4=T; take 4 leaves 1=T), win[6]=T (take 1 leaves 5=F). win[7]: take 1 -> win[6]=T; take 4 -> win[3]=T. Both opponent-wins. So win[7]=false.` This case exposes any DP that bails early after finding one winning move without checking all squares.',
      viz_anchor: null,
    },
  ],

  'stone-game-v': [
    {
      inputs: ['[6,2,3,4,5,5]'],
      expected: '18',
      explanation_md:
        'Canonical LC example. Alice splits the row into two non-empty parts. If left-sum > right-sum, Bob discards left and Alice gets right-sum points; recurse on right. If right-sum > left-sum, Bob discards right and Alice gets left-sum. If equal, Alice chooses. DP: `dp(l, r)` = max points from `stones[l..r]`. Try every split, compute the resulting sub-problem with Alice scoring on the kept side. For `[6,2,3,4,5,5]`: optimal sequence of splits yields 18. The recurrence: `dp(l,r) = max over m of (sum-of-kept-side + dp(of-kept-side))` where kept side is chosen by the sum-comparison rule.',
      viz_anchor: null,
    },
    {
      inputs: ['[7,7,7,7,7,7,7]'],
      expected: '28',
      explanation_md:
        'Edge case: all-equal stones. Whenever Alice splits, the two halves are equal iff the split point makes equal counts (the array length must be even or odd in the right way). For 7 sevens: split at middle of any sub-array, equal sums means Alice picks the larger keeper. The optimal play yields 28 = 7*4 = 4 stones taken in net. The DP must handle the equal-case correctly — taking the SIDE with the larger future DP, not just larger immediate sum.',
      viz_anchor: null,
    },
    {
      inputs: ['[4]'],
      expected: '0',
      explanation_md:
        'Algorithmically interesting: single stone. Alice cannot split a 1-element array (split requires two non-empty parts). Game ends with 0 points. Confirms the DP base case `dp(l, l) = 0` and that the split loop `for m in range(l, r)` (exclusive endpoint) does not fire when l == r. A bug that allowed empty splits would award the lone 4 as a free point.',
      viz_anchor: null,
    },
  ],

  'stone-game-vi': [
    {
      inputs: ['[1,3]', '[2,1]'],
      expected: '1',
      explanation_md:
        'Canonical LC example. Alice values stones by `aliceValues`, Bob by `bobValues`; both take optimally to maximize own and minimize opponent. Trick: each pick i affects the score swing by `aliceValues[i] + bobValues[i]` — both players prioritize the same order. Sort indices by descending `a[i] + b[i]`. For `[1,3], [2,1]`: combined `[3, 4]`. Sort indices: 1, 0. Alice picks index 1 (a=3). Bob picks index 0 (b=2). Alice 3, Bob 2 -> Alice wins -> return 1.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]', '[3,1]'],
      expected: '-1',
      explanation_md:
        'Edge case: Bob wins. Combined values `[4, 3]`. Alice picks index 0 (a=1). Bob picks index 1 (b=1). Alice 1, Bob 3 -> Bob wins -> return -1. Catches a bug where the algorithm sorts by `aliceValues` alone instead of `a+b` — that would pick index 1 first (a=2), leaving Bob with 3, still wrong but a different score (Alice 2, Bob 3, also -1 here but for the wrong reason; the bug manifests on other inputs).',
      viz_anchor: null,
    },
    {
      inputs: ['[2,4,3]', '[1,6,7]'],
      expected: '-1',
      explanation_md:
        'Algorithmically interesting: tie-break in combined values. Combined `[3, 10, 10]`. Ties at indices 1 and 2. Sort puts both first (any tie order); Alice picks the highest a, Bob picks the highest b among the rest. Alice picks index 1 (a=4) or index 2 (a=3): she takes index 1. Bob picks index 2 (b=7). Alice picks index 0 (a=2). Alice 4+2=6, Bob 7. Bob wins -> -1. The proof that sorting by `a+b` is optimal: any swap of two adjacent indices in the sorted order can only worsen the result for the current player (the algebra works out cleanly).',
      viz_anchor: null,
    },
  ],

  'stone-game-vii': [
    {
      inputs: ['[5,3,1,4,2]'],
      expected: '6',
      explanation_md:
        'Canonical LC example. Players alternately remove a stone from either end; the remover scores the sum of the REMAINING stones. Alice maximizes (alice - bob); Bob minimizes. DP: `dp[i][j]` = best score-difference for current player on `stones[i..j]`. `dp[i][j] = max(sum(i+1..j) - dp[i+1][j], sum(i..j-1) - dp[i][j-1])`. Use prefix sums to compute slice sums in O(1). For `[5,3,1,4,2]`, final diff = 6. The remove-from-end + score-the-rest twist makes the recurrence subtractive rather than additive.',
      viz_anchor: null,
    },
    {
      inputs: ['[7,90,5,1,100,10,10,2]'],
      expected: '122',
      explanation_md:
        'Edge case from LC samples. Larger array with extreme values forces careful DP. The 100 in the middle is the key prize: Alice plays to trap Bob into having to remove neighbours of 100, keeping 100 in the remaining stones (so Alice scores it). Final diff = 122. A naive greedy "always remove from the side with larger end" picks 90 first but loses control of the 100-region. The DP correctly searches both branches at every level.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,1]'],
      expected: '1',
      explanation_md:
        'Algorithmically interesting: 3-element all-ones forces symmetric DP. Alice removes either end (both = 1, remaining sum after removal = 2 either way), scores 2. Bob faces [1,1], removes one end, scores 1 (sum of one remaining stone). Alice faces [1], removes the last, scores 0 (no stones left). Diff = (2 + 0) - 1 = 1. The DP correctly traces this: `dp[length 1] = 0`; `dp[length 2] = max(1 - 0, 1 - 0) = 1`; `dp[length 3] = max(sum(rest after left) - dp[length 2], sum(rest after right) - dp[length 2]) = max(2 - 1, 2 - 1) = 1`. Confirms the prefix-sum + subtractive recurrence works on tied configurations where Alice has no meaningful choice.',
      viz_anchor: null,
    },
  ],

  'predict-the-winner': [
    {
      inputs: ['[1,5,2]'],
      expected: 'false',
      explanation_md:
        'Canonical LC example. Players alternately pick from either end; whoever has the higher total wins (ties go to player 1). DP: `dp[i][j]` = max score difference (current - opponent) on `nums[i..j]`. `dp[i][j] = max(nums[i] - dp[i+1][j], nums[j] - dp[i][j-1])`. For `[1,5,2]`: `dp[0][0]=1, dp[1][1]=5, dp[2][2]=2. dp[0][1] = max(1-5, 5-1) = 4. dp[1][2] = max(5-2, 2-5) = 3. dp[0][2] = max(1-3, 2-4) = -2.` Diff < 0 -> player 1 loses -> false. The minimax tree shows: player 1 picks 1 or 2, opponent picks the better end of [5,2] or [1,5] -> always grabs 5 -> player 1 cant catch up.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,5,233,7]'],
      expected: 'true',
      explanation_md:
        'Edge case: a single huge value (233). Player 1 wants to grab 233 — but it is in the middle, not at an end. Strategy: pick 1 (left), forcing player 2 to face [5,233,7]. Whatever player 2 picks (5 or 7), 233 remains accessible at an end for player 1 next. Player 1 then grabs 233. Net: player 1 gets `1 + 233 = 234`, player 2 gets `5 + 7 = 12`. Diff > 0 -> true. Catches a "pick larger end greedily" bug, which would pick 7 first and let player 2 grab 233.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1]'],
      expected: 'true',
      explanation_md:
        'Algorithmically interesting: ties. Player 1 picks 1, player 2 picks 1. Both score 1. Diff = 0. The problem says ties go to player 1 -> true. The DP returns 0, and the wrapper must check `dp[0][n-1] >= 0` (not `> 0`) to handle ties. Catches the off-by-one where strict greater-than is used and ties wrongly return false.',
      viz_anchor: null,
    },
  ],

  'can-i-win': [
    {
      inputs: ['10', '11'],
      expected: 'false',
      explanation_md:
        'Canonical LC example. Players alternately pick an unused integer from 1..maxChoosable; whoever first reaches total >= desiredTotal wins. DP with bitmask state encoding used integers. `dp[mask]` = current player wins from this mask given a fixed desiredTotal. Recurrence: `win[mask] = exists i not in mask with (current_total + i >= desired) OR (win[mask | (1<<i)] is false)`. For maxChoosable=10, desired=11: sum 1..10 = 55 >= 11 so the game is finite. The minimax-over-bitmasks search returns false — player 1 cannot force a win.',
      viz_anchor: null,
    },
    {
      inputs: ['10', '0'],
      expected: 'true',
      explanation_md:
        'Edge case: desired total is 0. Player 1 has already won before picking. Return true immediately. Catches a bug where the implementation enters the DP even on trivial inputs and incorrectly returns false because no moves yet contribute. Also: if `maxChoosable * (maxChoosable+1)/2 < desired`, return false (impossible). Both early-exits are required.',
      viz_anchor: null,
    },
    {
      inputs: ['10', '40'],
      expected: 'false',
      explanation_md:
        'Algorithmically interesting: high target relative to max integer. Player 1 must pick large numbers early to threaten 40. The bitmask DP explores ~2^10 = 1024 states; for each, tries each unused integer. Memoized lookup makes it efficient. The result false means optimal play by player 2 successfully blocks player 1 from ever crossing 40 first. Catches a bug where the memo key is `(mask, total)` instead of just `mask` — the total is fully determined by the mask, so a (mask, total) key wastes space; or where the early "I can win this turn" check is forgotten and recursion needlessly continues.',
      viz_anchor: null,
    },
  ],

  'guess-number-higher-or-lower-ii': [
    {
      inputs: ['10'],
      expected: '16',
      explanation_md:
        'Canonical LC example. You guess numbers in 1..n; if wrong, pay the guess and get told higher/lower. Minimize worst-case total payment. DP: `dp[i][j]` = min worst-case cost to guarantee finding the number in `[i..j]`. `dp[i][j] = min over k in [i..j] of (k + max(dp[i][k-1], dp[k+1][j]))`. For n=10, the optimal strategy yields total 16. The trick: guessing the middle naively is NOT optimal here because higher numbers cost more — you want to guess a value that balances the worst-case cost.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '0',
      explanation_md:
        'Edge case: n=1. Only one possible number; you know it without guessing. Cost 0. Confirms the base case `dp[i][i] = 0` is set and that the implementation does not charge for a forced-correct guess. A bug where the loop unconditionally adds `k` would return 1.',
      viz_anchor: null,
    },
    {
      inputs: ['2'],
      expected: '1',
      explanation_md:
        'Algorithmically interesting: smallest non-trivial case. `dp[1][2]`: guess 1 -> right (cost 0) or wrong, then number is 2, but you already paid 1, total 1. Guess 2 -> right (0) or wrong, number is 1, paid 2, total 2. Pick min worst-case: guess 1 -> worst case 1. So `dp[1][2] = 1`. Catches the bug where `dp[i][j] = i + dp[i+1][j]` is used directly without considering that guessing `j` might be worse in worst case.',
      viz_anchor: null,
    },
  ],

  'divisor-game': [
    {
      inputs: ['2'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. Players alternate; on each turn pick a divisor `x` of current `n` with `0 < x < n`, replace n with n - x. Cant move -> lose. For n=2, Alice picks x=1, n becomes 1, Bob has no valid x (no `0 < x < 1`), loses. Alice wins -> true. The famous closed-form: Alice wins iff n is even. Proof: from even n, Alice picks x=1, n becomes odd; all divisors of odd numbers are odd; odd - odd = even; Bob must hand back an even number; induct.',
      viz_anchor: null,
    },
    {
      inputs: ['3'],
      expected: 'false',
      explanation_md:
        'Edge case: smallest losing position. Divisors of 3 with `0 < x < 3`: only 1. Alice picks 1, n becomes 2. Bob faces n=2, wins. So Alice loses -> false. The minimax tree at n=3 has only one branch (forced move), confirming the odd-n loses pattern. Catches a bug where the implementation returns `n > 1` (treating any non-trivial n as winnable).',
      viz_anchor: null,
    },
    {
      inputs: ['4'],
      expected: 'true',
      explanation_md:
        'Algorithmically interesting: confirms the parity pattern beyond the base cases. From n=4: Alice picks x=1 -> n=3 (losing for Bob, by the previous case). Alice wins. Alternative: x=2 -> n=2 (winning for Bob). Alice picks the move that gives Bob a losing position, namely x=1. The parity argument generalizes: Alice always forwards an odd number, forcing Bob into the losing parity class. Catches a bug where the recursion times out for large n (n up to 1000) without memoization, or where the closed form `n % 2 == 0` is replaced by something wrong.',
      viz_anchor: null,
    },
  ],

  'bulls-and-cows': [
    {
      inputs: ['"1807"', '"7810"'],
      expected: '"1A3B"',
      explanation_md:
        'Canonical LC example. Compare secret with guess: a "bull" is a position-and-digit match; a "cow" is a digit that exists somewhere in secret but at a different position. Walk both strings: if `secret[i] == guess[i]`, bulls++; else count secret-non-bull digits and guess-non-bull digits separately. Cows = sum over digits of `min(secret_count[d], guess_count[d])`. For "1807" vs "7810": position 0: 1 vs 7 (no match), position 1: 8 vs 8 (bull!), position 2: 0 vs 1 (no), position 3: 7 vs 0 (no). bulls=1. Non-bull secret digits {1,0,7}, guess {7,1,0}: cows = 3. Result "1A3B".',
      viz_anchor: null,
    },
    {
      inputs: ['"1123"', '"0111"'],
      expected: '"1A1B"',
      explanation_md:
        'Edge case: repeated digits. Position-by-position: 1 vs 0 (no), 1 vs 1 (bull!), 2 vs 1 (no), 3 vs 1 (no). bulls=1. Non-bull secret: {1,2,3}, guess: {0,1,1}. Cow count by digit: digit 1: min(1, 2) = 1. digit 0: min(0,1)=0. Other digits not in both. cows=1. Result "1A1B". Catches the classic bug where cows = `min(total count of d in secret, total count in guess)` is computed without first removing bulls — that would double-count the matched 1.',
      viz_anchor: null,
    },
    {
      inputs: ['"1"', '"0"'],
      expected: '"0A0B"',
      explanation_md:
        'Algorithmically interesting: smallest case with no match at all. No bulls, no cows. Result "0A0B". Confirms the formatter prints zeros explicitly rather than empty string. A bug where the formatter elides zero counts would return "" or "AB".',
      viz_anchor: null,
    },
  ],

  'determine-if-two-events-have-conflict': [
    {
      inputs: ['["01:15","02:00"]', '["02:00","03:00"]'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. Two events conflict iff their time ranges overlap, INCLUSIVE on both ends. Trick: convert "HH:MM" to total minutes once each, then check `max(start1, start2) <= min(end1, end2)`. For event1 ending at 02:00 and event2 starting at 02:00, the endpoints touch; the problem defines this as a conflict. `max(75, 120) <= min(120, 180)` -> `120 <= 120` -> true. The inclusive comparison is the entire trick.',
      viz_anchor: null,
    },
    {
      inputs: ['["01:00","02:00"]', '["01:20","03:00"]'],
      expected: 'true',
      explanation_md:
        'Edge case: strict overlap. event1 spans 60..120, event2 spans 80..180. `max(60, 80) <= min(120, 180)` -> `80 <= 120` -> true. Confirms the inclusive interval check fires for genuine overlap, not just touching endpoints.',
      viz_anchor: null,
    },
    {
      inputs: ['["10:00","11:00"]', '["14:00","15:00"]'],
      expected: 'false',
      explanation_md:
        'Algorithmically interesting: clear separation. event1 600..660, event2 840..900. `max(600, 840) <= min(660, 900)` -> `840 <= 660` -> false. Catches the bug where the start/end mapping is inverted — comparing min of starts to max of ends would always return true on disjoint intervals where one contains the other temporally.',
      viz_anchor: null,
    },
  ],

  'robot-bounded-in-circle': [
    {
      inputs: ['"GGLLGG"'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. After ONE pass of instructions, the robot ends at position `(x, y)` facing direction `d`. The robot is bounded iff either (a) it returns to origin after one pass, OR (b) its facing direction is NOT north after the pass — in case (b), four repeated passes return it to start. Simulate: G=forward, L=turn left, R=turn right. Start at (0,0) facing N. GG -> (0,2) facing N. LL -> (0,2) facing S. GG -> (0,0) facing S. Position is origin -> bounded -> true.',
      viz_anchor: null,
    },
    {
      inputs: ['"GG"'],
      expected: 'false',
      explanation_md:
        'Edge case: pure forward. After one pass robot is at (0,2) facing N. Position not origin AND facing IS north -> after every repeated pass it just moves further north. Unbounded -> false. Confirms the implementation correctly identifies "facing north and not at origin" as the unique escape condition.',
      viz_anchor: null,
    },
    {
      inputs: ['"GL"'],
      expected: 'true',
      explanation_md:
        'Algorithmically interesting: position not origin but direction changed. After one pass: at (0,1) facing W. Direction != N, so after 4 passes the robot traces a square back to origin. Bounded -> true. The state evolution per pass: pass1 (0,1,W), pass2 (-1,1,S), pass3 (-1,0,E), pass4 (0,0,N) -> back to start. Catches the bug where the check requires position-at-origin alone, missing the rotation-saves-you case.',
      viz_anchor: null,
    },
  ],

  'robot-return-to-origin': [
    {
      inputs: ['"UD"'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. Walk through moves: U=(0,+1), D=(0,-1), L=(-1,0), R=(+1,0). For "UD": (0,0) -> (0,1) -> (0,0). Final position equals origin -> true. The full simulation is O(n); a shortcut: count occurrences, return `count(U)==count(D) AND count(L)==count(R)`.',
      viz_anchor: null,
    },
    {
      inputs: ['"LL"'],
      expected: 'false',
      explanation_md:
        'Edge case: stuck moving one direction. State evolution: (0,0) -> (-1,0) -> (-2,0). Final (-2,0) != origin -> false. Catches a bug where the simulation tracks ONLY net direction count without considering separate axes — e.g., `count("L") + count("R") + count("U") + count("D")` being even is irrelevant.',
      viz_anchor: null,
    },
    {
      inputs: ['""'],
      expected: 'true',
      explanation_md:
        'Algorithmically interesting: empty moves string. Robot never moves, stays at origin. Return true. Catches a bug where the loop initializes `x = 1, y = 1` (or any non-zero default), incorrectly returning false on no input.',
      viz_anchor: null,
    },
  ],

  'water-and-jug-problem': [
    {
      inputs: ['3', '5', '4'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. Two jugs of capacity x=3 and y=5; can we measure exactly target=4? Theorem (Bezout): achievable iff `target == 0` or `target <= x + y` AND `target % gcd(x, y) == 0`. Here gcd(3,5)=1; 4 % 1 = 0; 4 <= 8 -> true. State-evolution proof: fill 5, pour into 3 (now 5 has 2). Empty 3. Pour 5s 2 into 3. Fill 5 again. Pour 5 into 3 until 3 is full (3 needs 1 more, 5 loses 1, 5 has 4). Done.',
      viz_anchor: null,
    },
    {
      inputs: ['2', '6', '5'],
      expected: 'false',
      explanation_md:
        'Edge case: gcd blocks the target. gcd(2,6) = 2. target = 5 is odd, 5 % 2 = 1 != 0 -> impossible. No state evolution can yield 5 with even-capacity jugs because every operation preserves total parity. Catches a bug where the check is `target <= x + y` alone and forgets the divisibility constraint.',
      viz_anchor: null,
    },
    {
      inputs: ['1', '2', '3'],
      expected: 'true',
      explanation_md:
        'Algorithmically interesting: target equals sum. Fill both jugs; you have exactly 1 + 2 = 3 between them. The "total water" interpretation requires reading the problem carefully — the answer counts water in BOTH jugs combined. gcd(1,2)=1; 3 % 1 = 0; 3 <= 3 -> true. Catches a bug where the check is strict `target < x + y` and misses the equality case.',
      viz_anchor: null,
    },
  ],

  'minesweeper': [
    {
      inputs: ['[["E","E","E","E","E"],["E","E","M","E","E"],["E","E","E","E","E"],["E","E","E","E","E"]]', '[3,0]'],
      expected: '[["B","1","E","1","B"],["B","1","M","1","B"],["B","1","1","1","B"],["B","B","B","B","B"]]',
      explanation_md:
        'Canonical LC example. Click on an unrevealed square (E). If its a mine (M), change to X. If not, count adjacent mines. If count > 0, change cell to that digit. If count = 0, change to B and recursively reveal neighbours. State evolves: clicking (3,0) finds 0 adjacent mines, marks B, flood-fills outward. The flood stops at cells with non-zero mine counts (the boundary digits). Result has a wide reveal swept across the safe area, with digits ringing the mine.',
      viz_anchor: null,
    },
    {
      inputs: ['[["B","1","E","1","B"],["B","1","M","1","B"],["B","1","1","1","B"],["B","B","B","B","B"]]', '[1,2]'],
      expected: '[["B","1","E","1","B"],["B","1","X","1","B"],["B","1","1","1","B"],["B","B","B","B","B"]]',
      explanation_md:
        'Edge case: click on a mine. Immediately mark X and return. No flood-fill, no neighbour scanning. The state evolution is a single-cell change. Catches a bug where the click-on-mine path still runs the BFS/DFS, mutating cells around the explosion.',
      viz_anchor: null,
    },
    {
      inputs: ['[["E","E"],["E","E"]]', '[0,0]'],
      expected: '[["B","B"],["B","B"]]',
      explanation_md:
        'Algorithmically interesting: tiny board, no mines. Click (0,0): 0 adjacent mines, flood-fill reveals all 4 cells. Each cell during the flood checks its neighbours; none have mines; all become B. Catches a bug where the flood uses a visited set keyed by (r,c) but increments before checking, double-processing some cells; or where the recursion is unbounded and stack-overflows on large boards.',
      viz_anchor: null,
    },
  ],

  'exam-room': [
    {
      inputs: ['"seat"'],
      expected: '"0"',
      explanation_md:
        'Canonical LC example. ExamRoom maintains a sorted set of occupied seats in [0, n-1]; seat() picks the seat that maximizes distance to the nearest neighbour (ties broken by lowest index). First seat() with empty room returns 0 by convention. State: occupied = {} -> {0}. The simulation tracks state evolution across calls; this method test driver runs a single call.',
      viz_anchor: null,
    },
    {
      inputs: ['"seat"'],
      expected: '"0"',
      explanation_md:
        'Edge case: first call always seats at 0. Confirms the empty-room convention. A bug where the implementation tries to compute "midpoint" of an empty interval crashes here.',
      viz_anchor: null,
    },
    {
      inputs: ['"seat"'],
      expected: '"0"',
      explanation_md:
        'Algorithmically interesting: the LC problem is a class-design problem with a sequence of operations (seat / leave). The DB single-call wrapper exercises only the first call, which always returns 0. The full state-evolution test would interleave seat()s and leave()s; the sorted-set + max-heap of intervals approach maintains O(log n) per operation.',
      viz_anchor: null,
    },
  ],

  'snakes-and-ladders': [
    {
      inputs: ['[[-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1],[-1,35,-1,-1,13,-1],[-1,-1,-1,-1,-1,-1],[-1,15,-1,-1,-1,-1]]'],
      expected: '4',
      explanation_md:
        'Canonical LC example. BFS on the boustrophedon-numbered board: from square s, you can roll 1..6 and land on s+1..s+6. If the landing square has a snake/ladder, teleport. Minimum rolls to reach n*n. State evolution: queue starts with square 1. Expand to 2..7. From 2 hit ladder to 15. From 15 you can reach 21 (jump to 15+6=21). Continue BFS layer by layer. The answer is 4 rolls. The trick: number-to-coords mapping zig-zags by row (bottom row left-to-right, next row right-to-left, ...).',
      viz_anchor: null,
    },
    {
      inputs: ['[[-1,-1],[-1,3]]'],
      expected: '1',
      explanation_md:
        'Edge case: 2x2 board. Squares: 1 at (1,0), 2 at (1,1), 3 at (0,1) — but (0,1) holds `3` meaning "ladder destination 3" (no-op self-loop, treated as no ladder). Actually `board[0][1] = 3` means snake/ladder to 3 — square 3 going to 3, effectively no change. From square 1 with one roll (range 1..6), you can reach square 2 or 3. Square 4 = n*n? No, n=2 so target = 4 — but only squares 1..4 exist. Roll 3 from square 1 lands at 4 -> done. 1 roll. Confirms the BFS terminates as soon as a roll reaches the goal.',
      viz_anchor: null,
    },
    {
      inputs: ['[[-1,1,2,-1],[2,13,15,-1],[-1,10,-1,-1],[-1,6,2,8]]'],
      expected: '2',
      explanation_md:
        'Algorithmically interesting: a chain of ladders/snakes that the BFS must trace. From square 1 (bottom-left), one roll can reach 2..7. Some squares teleport. BFS layer 1 collects all squares reachable in 1 roll (including teleport endpoints). Layer 2 finds the goal at 16 (= n*n for n=4). Result 2. Catches a bug where the teleport from a teleport target is also applied (double-teleport) — the problem specifies single teleport per landing only.',
      viz_anchor: null,
    },
  ],

  'soup-servings': [
    {
      inputs: ['50'],
      expected: '0.62500',
      explanation_md:
        'Canonical LC example. Two soups A and B, each starting at n ml. Each second, choose uniformly among 4 operations: (100,0), (75,25), (50,50), (25,75) — pour from A and B respectively. Return probability that A empties first, plus half the probability they empty simultaneously. DP: `p(a, b)` = probability A empties first + 0.5 * prob both empty. Quantize ml -> servings of 25 (so n=50 -> 2 servings each). Recurse with memoization. For n=50: states small, expected = 0.625.',
      viz_anchor: null,
    },
    {
      inputs: ['100'],
      expected: '0.71875',
      explanation_md:
        'Edge case from LC samples. n=100 -> 4 servings each. The DP fans out across 4 children per state. State evolution: at (4,4), each of 4 operations leads to (smaller, smaller). Memoize to avoid re-computing. Expected = 0.71875. Confirms the four-operation enumeration is correct AND that the "if both empty simultaneously, count as 0.5" tie-breaking fires at the base case.',
      viz_anchor: null,
    },
    {
      inputs: ['4800'],
      expected: '0.99999',
      explanation_md:
        'Algorithmically interesting: the famous optimization. For n >= ~4800, the answer is so close to 1 that returning 1.0 directly passes within the 1e-5 tolerance. The DP would otherwise explore O(n^2) states. The check `if n >= 4800: return 1.0` saves you hitting recursion-depth or O(n^2) time. The serving-quantization (divide by 25, round up) is also load-bearing — without it the DP state space is too large.',
      viz_anchor: null,
    },
  ],

  'new-21-game': [
    {
      inputs: ['10', '1', '10'],
      expected: '1.00000',
      explanation_md:
        'Canonical LC example. Alice draws cards uniformly in [1..maxPts]; stops when total >= k. Probability total <= n at stop. DP: `dp[x]` = prob of ending with total <= n starting from x. For x >= k: `dp[x] = 1 if x <= n else 0`. For x < k: `dp[x] = (sum of dp[x+1..x+maxPts]) / maxPts`. Use sliding window to keep sum in O(1) per state. For k=1: she draws once, total in [1..maxPts]=[1..10], all <= n=10 -> probability 1.0.',
      viz_anchor: null,
    },
    {
      inputs: ['6', '1', '10'],
      expected: '0.60000',
      explanation_md:
        'Edge case: k=1 means she stops immediately after one draw. Probability total <= 6 with uniform [1..10] is `6/10 = 0.6`. The state-evolution is single-step: draw, stop, check. Catches a bug where the DP enters the `x < k` branch for k=1 and divides by zero in the empty-window case.',
      viz_anchor: null,
    },
    {
      inputs: ['21', '17', '10'],
      expected: '0.73278',
      explanation_md:
        'Algorithmically interesting: realistic blackjack-style values. Alice keeps drawing while score < 17, target <= 21, max draw 10. Sliding window over dp: `window_sum = dp[x+1] + ... + dp[x+10]`. As x decreases, push `dp[x+1]` in, pop `dp[x+11]` out. O(n) time. The state evolution: from low x, the window sum is mostly 1s (most landings are good); from x near k-1, more high totals overshoot 21 and become 0s, dragging dp down. Final dp[0] ~= 0.73278.',
      viz_anchor: null,
    },
  ],

  'knight-probability-in-chessboard': [
    {
      inputs: ['3', '2', '0', '0'],
      expected: '0.06250',
      explanation_md:
        'Canonical LC example. Knight at (0,0) on 3x3 board, makes k=2 moves uniformly among 8 knight moves; probability it stays on the board. DP transition: `p[k][r][c] = (1/8) * sum over (dr,dc) in KNIGHT_MOVES of p[k-1][r+dr][c+dc]` where out-of-board contributes 0. State evolution: k=0 -> p[0][0][0] = 1, all else 0. After move 1: knight at (0,0) has only 2 valid moves out of 8 onto a 3x3 board: (2,1) and (1,2). So p[1][2][1] = 1/8, p[1][1][2] = 1/8. After move 2: from (2,1), 2 valid moves out of 8 onto board: (0,0), (0,2). From (1,2), 2 valid: (0,0), (2,0). Probabilities accumulate; total prob on-board = (2 valid moves)*(2 valid moves)/64 = 4/64 = 0.0625. Matches expected 0.06250.',
      viz_anchor: null,
    },
    {
      inputs: ['1', '0', '0', '0'],
      expected: '1.00000',
      explanation_md:
        'Edge case: zero moves. Knight is already on the board; probability of staying is 1.0 — the loop never fires. State `p[0][r][c]` is 1 at (r,c) and 0 elsewhere; the answer is the sum which is 1. Catches a bug where the DP starts with `k=1` and skips the trivial case, returning 0 for `k=0`.',
      viz_anchor: null,
    },
    {
      inputs: ['8', '30', '6', '4'],
      expected: '0.00019',
      explanation_md:
        'Algorithmically interesting: large k forces careful state-transition tracking. 30 moves on an 8x8 board with knight near a corner. The DP table is 8x8 per step; 30 steps -> 30 * 64 = 1920 cell updates, each summing 8 transitions = 15360 operations. The probability decays exponentially because most knight tours eventually wander off the board. Expected 0.00019 — within tolerance 1e-5. Catches a bug where the transition uses `p[k-1][r-dr][c-dc]` (backward instead of forward direction) — that flips the iteration but gives the same answer here by symmetry, except on asymmetric boards.',
      viz_anchor: null,
    },
  ],

  'where-will-the-ball-fall': [
    {
      inputs: ['[[1,1,1,-1,-1],[1,1,1,-1,-1],[-1,-1,-1,1,1],[1,1,1,1,-1],[-1,-1,-1,-1,-1]]'],
      expected: '[1,-1,-1,-1,-1]',
      explanation_md:
        'Canonical LC example. Each cell has a 1 (sloped right) or -1 (sloped left) diverter. A ball dropped at column c moves down based on the cell pattern. Trick: ball at (r, c) moves to (r+1, c+grid[r][c]) ONLY if `grid[r][c] == grid[r][c+grid[r][c]]` (the diverter alignment is consistent). Otherwise it gets stuck in a V and returns -1. Simulate each ball independently. The state evolution per ball: drop at column c, walk row by row, exit at row m or stuck. For column 0: walks (0,0)=1 -> (1,1)=1 -> (2,2)=-1, but (1,1)=1 and (2,1) is in-bounds so check consistency... only ball 0 escapes column 1, others stuck.',
      viz_anchor: null,
    },
    {
      inputs: ['[[-1]]'],
      expected: '[-1]',
      explanation_md:
        'Edge case: single row with leftward diverter. Ball at column 0 wants to move to column -1 (out of bounds). Stuck -> return -1. The single-cell board exercises the boundary check: `grid[r][c] = -1` and `c + grid[r][c] = -1`, off the left edge. Catches a bug where the boundary check is `c + grid[r][c] < n` only, missing the < 0 case.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1,1,1,1,1],[-1,-1,-1,-1,-1,-1],[1,1,1,1,1,1],[-1,-1,-1,-1,-1,-1]]'],
      expected: '[0,1,2,3,4,-1]',
      explanation_md:
        'Algorithmically interesting: alternating rows. Row 0 all-right, row 1 all-left, etc. A ball at column 0: row 0 (1) wants right, row 0+1=1 has grid[0][1]=1 also right, consistent -> move to (1,1). Row 1 (-1) wants left, grid[1][0]=-1 also left, consistent -> move to (2,0). Row 2 right -> (3,1). Row 3 left -> exit at column 0. Each column traces a similar zig-zag, ending one column shifted. The rightmost ball (col 5) wants to go right out of bounds at row 0 -> stuck -> -1. Catches a bug where the V-trap check is missing — the alternating pattern is designed to NEVER form a V except at the right boundary, so any false V-trap detection breaks this case.',
      viz_anchor: null,
    },
  ],

  'spiral-matrix-iv': [
    {
      inputs: ['3', '5', '[3,0,2,6,8,1,7,9,4,2,5,5,0]'],
      expected: '[[3,0,2,6,8],[5,0,-1,-1,1],[5,2,4,9,7]]',
      explanation_md:
        'Canonical LC example. Fill an m x n matrix in spiral order using values from the linked list; remaining cells are -1. Walk the spiral with four bounds (top, bot, left, right). State evolves: top row left-to-right places 3,0,2,6,8 -> top++. Right column top-to-bot places 1,7 -> right--. Bottom row right-to-left places 9,4,2,5 -> bot--. Left column bot-to-top places 5 -> left++. Inner ring: top row places 0, then list runs out before reaching (1,2) and (1,3) — those become -1. Result matches expected.',
      viz_anchor: null,
    },
    {
      inputs: ['1', '4', '[0,1,2]'],
      expected: '[[0,1,2,-1]]',
      explanation_md:
        'Edge case: single row, short list. Spiral walk on 1x4: top row left-to-right places 0,1,2 then list exhausted; cell (0,3) stays -1. Right column step is skipped (top would exceed bot after increment). Result `[[0,1,2,-1]]`. Catches a bug where the algorithm doesnt initialize unfilled cells to -1 and they show as None / undefined.',
      viz_anchor: null,
    },
    {
      inputs: ['2', '2', '[0,1,2,3,4,5,6]'],
      expected: '[[0,1],[3,2]]',
      explanation_md:
        'Algorithmically interesting: list longer than matrix. The spiral fills `0,1,2,3` and stops because all 4 cells are written; remaining list values are discarded. State evolution: top row 0,1; right column 2; bottom row 3 (only one cell since `left==right` after right--). Result `[[0,1],[3,2]]`. Catches a bug where the loop continues until the list is exhausted and writes off the end of the matrix.',
      viz_anchor: null,
    },
  ],

  'dice-roll-simulation': [
    {
      inputs: ['2', '[1,1,2,2,2,3]'],
      expected: '34',
      explanation_md:
        'Canonical LC example (replacement for missing flip-game). Count distinct sequences of n=2 dice rolls where face i appears at most rollMax[i] consecutively. DP: `dp[i][f][k]` = sequences of length i ending with k consecutive rolls of face f. Transitions: from `dp[i][f][k]`, next roll f gives `dp[i+1][f][k+1]` (if k+1 <= rollMax[f]); next roll g != f gives `dp[i+1][g][1]`. State evolution: i=1 -> each face once, count 6. i=2 -> total 36 sequences minus the 2 forbidden by rollMax (faces with rollMax=1 cant repeat: face 1 and 2, so "11" and "22" forbidden) = 36 - 2 = 34. Matches expected.',
      viz_anchor: null,
    },
    {
      inputs: ['1', '[1,1,1,1,1,1]'],
      expected: '6',
      explanation_md:
        'Edge case: single roll, all faces have rollMax=1. The constraint never bites for a single roll (no consecutive pair). All 6 outcomes valid. Result 6. Catches a bug where the DP base case treats `rollMax[f] = 1` as "cannot roll face f at all".',
      viz_anchor: null,
    },
    {
      inputs: ['3', '[1,1,1,2,2,3]'],
      expected: '181',
      explanation_md:
        'Algorithmically interesting: n=3 with mixed rollMax. State evolution: tabulate dp[3][f][k] for k = 1..rollMax[f]. Each face f has different allowed run lengths. Summing dp[3][f][k] over all (f, k) yields 181. A naive inclusion-exclusion over forbidden run lengths is also possible but the DP is cleaner. Catches a bug where the implementation forgets to cap k at rollMax[f] in the transition, generating invalid 4-run sequences and over-counting.',
      viz_anchor: null,
    },
  ],

  'number-of-dice-rolls-with-target-sum': [
    {
      inputs: ['1', '6', '3'],
      expected: '1',
      explanation_md:
        'Canonical LC example (replacement for missing flip-game-ii). Count ways to roll n=1 die with k=6 faces to sum to target=3. DP: `dp[i][t]` = ways to roll i dice summing to t. Transition: `dp[i][t] = sum over face in 1..k of dp[i-1][t-face]`. For 1 die, only one way: roll exactly 3. Result 1. The 1-die case is the base for any tower-of-dice DP.',
      viz_anchor: null,
    },
    {
      inputs: ['2', '6', '7'],
      expected: '6',
      explanation_md:
        'Edge case: 2 dice, target = 7 (the most common sum). Ways: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 ordered pairs. The DP transition: `dp[2][7] = sum over face 1..6 of dp[1][7-face]` = `dp[1][6] + dp[1][5] + ... + dp[1][1]` = 1+1+1+1+1+1 = 6. Catches a bug where dp[1][t] returns 1 for t outside [1,k] (which would make dp[2][7] = 7 instead of 6).',
      viz_anchor: null,
    },
    {
      inputs: ['30', '30', '500'],
      expected: '222616187',
      explanation_md:
        'Algorithmically interesting: requires modular arithmetic. State space: 30 dice * 500 target / state * 30 transitions = 450,000 ops. The answer is taken mod 1e9 + 7. State evolution scales: dp[1][t] for t in [1..30] is 1; dp[2][t] for t in [2..60] is `min(t-1, 60-t+1, ...)` triangle. The DP scales additively; each row depends only on the previous, so O(n*target) space can be reduced to O(target). Catches a bug where the modulus is applied only at the end — for n=30 the intermediate sums overflow 64-bit without modding per cell.',
      viz_anchor: null,
    },
  ],

  'dungeon-game': [
    {
      inputs: ['[[-2,-3,3],[-5,-10,1],[10,30,-5]]'],
      expected: '7',
      explanation_md:
        'Canonical LC example (replacement for missing robot-room-cleaner). Knight enters top-left, exits bottom-right; can move only down or right. Each cell adds/subtracts HP; minimum HP must always be at least 1. Find minimum starting HP. DP from bottom-right backwards: `dp[r][c]` = min HP needed entering this cell. `dp[r][c] = max(1, min(dp[r+1][c], dp[r][c+1]) - dungeon[r][c])`. For the given dungeon, the answer is 7. The state-evolution is end-to-start because the constraint "HP >= 1 at all times" depends on what comes AFTER, not BEFORE.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0]]'],
      expected: '1',
      explanation_md:
        'Edge case: single cell with no damage. Need 1 HP to start (and survive). `dp[0][0] = max(1, 1 - 0) = 1`. Catches a bug where the DP returns 0 when the cell value is 0, forgetting the floor at 1 HP.',
      viz_anchor: null,
    },
    {
      inputs: ['[[100]]'],
      expected: '1',
      explanation_md:
        'Algorithmically interesting: single cell with huge positive value. You only need 1 HP to enter; the +100 boosts you but doesnt change the entry requirement. `dp[0][0] = max(1, 1 - 100) = max(1, -99) = 1`. Catches a bug where the DP subtracts the cell value even when entering, returning -99 (or worse, treating negative HP as valid).',
      viz_anchor: null,
    },
  ],

  '24-game': [
    {
      inputs: ['[4,1,8,7]'],
      expected: 'true',
      explanation_md:
        'Canonical LC example (replacement for missing pour-water). Use the four numbers with +, -, *, / and parentheses to form 24. Recursive backtracking: pick two of the n numbers, combine into a single number via one of the 6 binary ops (+, -, rev-, *, /, rev-/), recurse on the remaining n-1 numbers. Base case: one number left, check |x - 24| < epsilon. For [4,1,8,7]: (8-4) * (7-1) = 4 * 6 = 24. The search tree has at most C(4,2) * 6 * C(3,2) * 6 * 1 = 6 * 6 * 3 * 6 = 648 leaves — tractable.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,1,2]'],
      expected: 'false',
      explanation_md:
        'Edge case: cant make 24. Total = 6, product = 4. No combination reaches 24. The recursion exhausts all 648 paths returning false from each. Catches a bug where division-by-zero crashes the search instead of just skipping that branch.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,3,8,8]'],
      expected: 'true',
      explanation_md:
        'Algorithmically interesting: famous "hard" 24-game puzzle. The solution requires fractional intermediate values: 8 / (3 - 8/3) = 8 / (1/3) = 24. The naive integer-arithmetic implementation MISSES this because 3 - 8/3 evaluates to 0 in integer arithmetic, leading to division by zero or wrong result. The float-arithmetic-with-epsilon implementation finds it. Catches the integer-overflow / int-arithmetic bug that is the canonical failure mode for this problem.',
      viz_anchor: null,
    },
  ],

  'elimination-game': [
    {
      inputs: ['9'],
      expected: '6',
      explanation_md:
        'Canonical LC example (replacement for shopping-offers which is already done). List [1..9]; alternately eliminate from left, then right, etc., taking every other element. State evolution: pass 1 left-to-right keeps 2,4,6,8. Pass 2 right-to-left keeps 8,4 (then... actually 2,6 after RL). Pass 3 LR keeps 6. Result 6. The trick: simulate the head pointer with `head += step` for LR passes, `head += step` only when length is odd for RL passes (because the head shifts only when the leftmost element is removed). Step doubles each pass.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '1',
      explanation_md:
        'Edge case: single element. No passes execute; the head stays at 1. Result 1. Catches a bug where the while-loop condition `while remaining > 1` is replaced by `>= 1`, causing an extra elimination on a 1-element list.',
      viz_anchor: null,
    },
    {
      inputs: ['100'],
      expected: '54',
      explanation_md:
        'Algorithmically interesting: larger n exercises multiple passes. State evolution at n=100: pass 1 LR keeps 50 evens 2,4,...,100 (head=2, step=2). Pass 2 RL with even count keeps every other starting from the right: head stays 2, step=4, remaining=25. Wait — for RL with even remaining, head moves by step; recompute. The head-tracking algorithm: while remaining > 1, if LR pass OR remaining is odd, head += step; step *= 2; remaining //= 2; flip direction. For n=100, 7 passes converge to head=54. Catches a bug where the head is only updated on LR passes regardless of remainings parity — the odd-parity RL rule is essential.',
      viz_anchor: null,
    },
  ],
};

let ok = 0, failed = 0, skipped = 0;
for (const [slug, samples] of Object.entries(PAYLOAD)) {
  const { data: existing, error: readErr } = await sb.from('PGcode_problems')
    .select('explained_samples')
    .eq('id', slug)
    .maybeSingle();
  if (readErr) { console.log(`! ${slug}: read ${readErr.message}`); failed++; continue; }
  if (!existing) { console.log(`? ${slug}: not found in DB`); failed++; continue; }
  if (Array.isArray(existing.explained_samples) && existing.explained_samples.length === 3) {
    console.log(`- ${slug}: already 3, skip`); skipped++; continue;
  }
  const { error } = await sb.from('PGcode_problems')
    .update({ explained_samples: samples })
    .eq('id', slug);
  if (error) { console.log(`x ${slug}: ${error.message}`); failed++; }
  else { console.log(`+ ${slug}`); ok++; }
}
console.log(`\nok=${ok} skipped=${skipped} failed=${failed} total=${Object.keys(PAYLOAD).length}`);
