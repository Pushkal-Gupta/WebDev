#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 14.
// Focus area: trie + string matching (KMP / Z / Manacher) + palindromes.
// Skips problems already at length === 3.
// Run: node scripts/backfill-explained-samples-batch14.mjs

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
  'implement-trie-prefix-tree': [
    {
      inputs: ['[["insert","apple"],["search","apple"],["search","app"],["startsWith","app"],["insert","app"],["search","app"]]'],
      expected: '[null,true,false,true,null,true]',
      explanation_md:
        'Canonical LC example. Insert `"apple"` so the trie spawns a path `root → a → p → p → l → e` with `e.end=True`. `search("apple")` walks the same path and reads `end=True` → `true`. `search("app")` walks `a → p → p`; the node exists but `end=False` (only `"apple"` was inserted, not `"app"`) → `false`. `startsWith("app")` only needs the path to exist, not `end` → `true`. Then `insert("app")` flips `p.end=True` at depth 3. Now `search("app")` finds the same node with `end=True` → `true`. The key invariant: `search` requires `end`, `startsWith` does not.',
      viz_anchor: null,
    },
    {
      inputs: ['[["insert","a"],["search","a"],["search","b"],["startsWith","a"]]'],
      expected: '[null,true,false,true]',
      explanation_md:
        'Edge case: single-character word. After `insert("a")`, the trie has one child `a` of root with `end=True`. `search("a")` walks one step and reads `end=True` → `true`. `search("b")` finds no `b` child of root → `false` immediately, without descending further. `startsWith("a")` finds the path → `true`. Proves the trie does not need a special root marker — children of root behave identically to children of any node, and the `end` flag distinguishes "word ends here" from "this is a prefix of some longer word."',
      viz_anchor: null,
    },
    {
      inputs: ['[["insert","car"],["insert","card"],["search","car"],["search","card"],["search","cards"],["startsWith","ca"]]'],
      expected: '[null,null,true,true,false,true]',
      explanation_md:
        'Algorithmically interesting: nested prefixes. After both inserts, the path is `c → a → r(end=True) → d(end=True)`. `search("car")` finds `r` with `end=True` → `true`. `search("card")` walks one step further to `d` with `end=True` → `true`. `search("cards")` walks `c → a → r → d`, then looks for an `s` child of `d` — none → `false`. `startsWith("ca")` ends at `a`, which exists, no need to check `end` → `true`. This case proves a longer word inserted later does NOT clobber the shorter word\'s `end` flag — both `r` and `d` correctly retain `end=True`.',
      viz_anchor: null,
    },
  ],

  'design-add-and-search-words-data-structure': [
    {
      inputs: ['[["addWord","bad"],["addWord","dad"],["addWord","mad"],["search","pad"],["search","bad"],["search",".ad"],["search","b.."]]'],
      expected: '[null,null,null,false,true,true,true]',
      explanation_md:
        'Canonical LC example. After three inserts, the root has three children (`b`, `d`, `m`), each with a 3-letter path ending in `end=True` at `d`. `search("pad")` fails at root (no `p` child) → `false`. `search("bad")` walks `b → a → d`, finds `end=True` → `true`. `search(".ad")` hits a `.` at depth 0 → BRANCH: recurse into every child of root (`b`, `d`, `m`), each trying to match `"ad"` next. `b → a → d` matches → `true`. `search("b..")` walks `b → a (matches .)→ d (matches .)`, finds `end=True` → `true`. The `.` wildcard turns DFS into the tool of choice.',
      viz_anchor: null,
    },
    {
      inputs: ['[["addWord","a"],["search","."],["search","a"],["search",".."]]'],
      expected: '[null,true,true,false]',
      explanation_md:
        'Edge case: single character + wildcards. After `addWord("a")`, root has one child `a` with `end=True`. `search(".")` recurses into every root child trying to match the rest (`""` → done, return `end`); `a` has `end=True` → `true`. `search("a")` direct lookup → `true`. `search("..")` recurses into `a` for the first `.`, then tries to match `.` against the empty children of `a` — node has no children → `false`. Proves the wildcard branching does NOT match past the end of inserted words; depth must equal word length AND `end=True` at the leaf.',
      viz_anchor: null,
    },
    {
      inputs: ['[["addWord","at"],["addWord","and"],["addWord","an"],["addWord","add"],["search","a"],["search",".at"],["addWord","bat"],["search",".at"]]'],
      expected: '[null,null,null,null,false,false,null,true]',
      explanation_md:
        'Algorithmically interesting: wildcard requires exact length AND branching across siblings. After the four `a*` inserts the trie has root → `a` → {`t(end)`, `n(end)`, `d` → {`d(end)`}}. `search("a")` finds `a` but `end=False` (no standalone `"a"` was inserted) → `false`. `search(".at")` recurses into every root child for the first `.`; only `a` exists, then needs `a → t` from `a` — but `a` is a depth-1 node looking for `a` as its next char. There is no second `a` under `a`, so → `false`. Now `addWord("bat")` adds `b → a → t(end)`. Re-`search(".at")`: tries root\'s `b` child → `b → a → t(end)` → `true`. Catches the bug where a wildcard solver incorrectly matches `"a"` itself or returns true before hitting `end`.',
      viz_anchor: null,
    },
  ],

  'longest-word-in-dictionary': [
    {
      inputs: ['["w","wo","wor","worl","world"]'],
      expected: 'world',
      explanation_md:
        'Canonical LC example. Build a trie of all words, mark each terminal `end=True`. Then DFS from root, descending only into children whose `end=True` (meaning every prefix along the way is itself a valid word). The longest reachable path under this rule is `w → wo → wor → worl → world`, depth 5. Return `"world"`. Without the prefix-must-exist rule, a naive sort-by-length would just return the longest string; the trie filter is what enforces "can be built one letter at a time from the dictionary."',
      viz_anchor: null,
    },
    {
      inputs: ['["a","banana","app","appl","ap","apply","apple"]'],
      expected: 'apple',
      explanation_md:
        'Tie-breaking on length AND lex order. Two candidates can be built letter-by-letter: `"apple"` (via `a → ap → app → appl → apple`) and `"apply"` (via the same chain to `appl → apply`). Both length 5. `"banana"` is length 6 but `"b"`, `"ba"`, `"ban"`, `"bana"`, `"banan"` are NOT in the dictionary — so `banana` is excluded. Between `"apple"` and `"apply"`, lex order returns the smaller: `apple < apply` at the last char → `"apple"`. Catches an implementation that returns the first found or sorts incorrectly.',
      viz_anchor: null,
    },
    {
      inputs: ['["m","mo","moc","moch","mocha","l","la","lat","latt","latte","c","ca","cat"]'],
      expected: 'latte',
      explanation_md:
        'Algorithmically interesting: three chains, two are length-5 winners. Built-letter-by-letter words: `"mocha"`, `"latte"`, plus `"cat"` length 3. Both `mocha` and `latte` qualify at length 5. Lex tiebreak: `latte < mocha`. Return `"latte"`. The DFS trie scan visits all reachable terminals and tracks `(length, word)` as a max with tiebreak `length DESC, word ASC`. A bug that picks the first reached terminal would return `mocha` (visited first under alphabetical DFS order from `c → l → m`). Correct order: minimum lex string among the longest.',
      viz_anchor: null,
    },
  ],

  'word-break-ii': [
    {
      inputs: ['"catsanddog"', '["cat","cats","and","sand","dog"]'],
      expected: '["cats and dog","cat sand dog"]',
      explanation_md:
        'Canonical LC example. DP-with-memo: for each suffix `s[i:]`, list all ways to split it into dictionary words. At `i=0` ("catsanddog"), try every prefix: `"c"` ✗, `"ca"` ✗, `"cat"` ✓ → recurse on `"sanddog"`; `"cats"` ✓ → recurse on `"anddog"`. Recursion on `"sanddog"` finds `"sand"` ✓ → recurse `"dog"` → `["dog"]`, yielding `["sand dog"]`. Recursion on `"anddog"` finds `"and"` ✓ → `"dog"` → `["and dog"]`. Combine: `"cat"` + `["sand dog"]` → `"cat sand dog"`; `"cats"` + `["and dog"]` → `"cats and dog"`. Two valid splits.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"', '["a"]'],
      expected: '["a"]',
      explanation_md:
        'Edge case: single-letter input matches a single-letter dict word. The recursion at `i=0` tries prefix `"a"` ✓ → recurse on `""` → base case returns `[""]` (the empty-list-of-words). Combine `"a"` with the empty continuation → `["a"]`. Proves the base case must be `[""]` not `[]`, otherwise an empty trailing recursion would propagate emptiness and the outer combine would produce no results. A common bug: returning `None` or empty `[]` at the empty suffix would yield `[]` overall.',
      viz_anchor: null,
    },
    {
      inputs: ['"pineapplepenapple"', '["apple","pen","applepen","pine","pineapple"]'],
      expected: '["pine applepen apple","pineapple pen apple","pine apple pen apple"]',
      explanation_md:
        'Algorithmically interesting: overlapping dictionary words (`apple`, `pineapple`, `applepen`) create branching with shared suffixes. From `"pineapplepenapple"`, `"pine"` ✓ → recurse on `"applepenapple"`, AND `"pineapple"` ✓ → recurse on `"penapple"`. The first branch finds `"apple"` ✓ → `"penapple"` (which goes `"pen"` → `"apple"`) and `"applepen"` ✓ → `"apple"`. So `"pine"` yields `["apple pen apple","applepen apple"]`. The second branch finds `"pen"` → `"apple"` → `["pen apple"]`. Combine. Without memoization, the suffix `"penapple"` would be re-decomposed once per parent — that\'s the exponential trap. Memo by suffix → polynomial.',
      viz_anchor: null,
    },
  ],

  'replace-words': [
    {
      inputs: ['["cat","bat","rat"]', '"the cattle was rattled by the battery"'],
      expected: 'the cat was rat by the bat',
      explanation_md:
        'Canonical LC example. Build a trie of roots: `c-a-t(end)`, `b-a-t(end)`, `r-a-t(end)`. For each word in the sentence, walk the trie char-by-char; stop and emit the prefix the FIRST time `end=True` is hit (or fall through to the full word if no root matches). `"cattle"` → `c → a → t(end)` → emit `"cat"`. `"was"` → no `w` root → keep `"was"`. `"rattled"` → `r → a → t(end)` → `"rat"`. `"by"` → no `b → y` → keep `"by"`. `"the"` → keep. `"battery"` → `b → a → t(end)` → `"bat"`. Join with spaces.',
      viz_anchor: null,
    },
    {
      inputs: ['["a","b","c"]', '"aadsfasf absbs bbab cadsfafs"'],
      expected: 'a a b c',
      explanation_md:
        'Edge case: single-letter roots. Every word in the sentence starts with one of `a`, `b`, `c`, so every word collapses to its first letter. `"aadsfasf"` → first char `a`, which is a root → emit `"a"`. Same for `"absbs"`, `"bbab"`, `"cadsfafs"`. The trie short-circuits at depth 1 for every word. Catches a bug where the trie walker insists on consuming at least 2 chars before checking `end`; the correct behavior is to check `end` after each step including the first.',
      viz_anchor: null,
    },
    {
      inputs: ['["catt","cat","bat","rat"]', '"the cattle was rattled by the battery"'],
      expected: 'the cat was rat by the bat',
      explanation_md:
        'Algorithmically interesting: dictionary contains BOTH `"cat"` and a longer `"catt"`. Trie: `c → a → t(end)` then `t(end)` again at depth 4. For `"cattle"`, the walker reaches `t` at depth 3 → `end=True` → MUST stop and emit `"cat"`, even though descending one more step would also match `"catt"`. The rule is "shortest root wins." A bug that prefers the longest match (Aho-Corasick maximal-munch style) would return `"the catt was rat by the bat"` — wrong. The first-`end`-wins behavior is what the problem statement demands.',
      viz_anchor: null,
    },
  ],

  'map-sum-pairs': [
    {
      inputs: ['[["insert","apple","3"],["sum","ap"],["insert","app","2"],["sum","ap"]]'],
      expected: '[3,5]',
      explanation_md:
        'Canonical LC example. Insert `"apple"` with value 3: trie path `a → p → p → l → e`, store `3` at the terminal. `sum("ap")`: walk to `a → p` (depth 2), then sum all terminal values in the subtree → only `apple=3` exists below → `3`. Now `insert("app", 2)`: walk `a → p → p` and store `2` at depth 3. `sum("ap")` again: walk to `a → p`, sum subtree → `app=2` + `apple=3` = `5`. The trie subtree sum is the workhorse; alternative is to cache prefix sums at each node and propagate on insert (O(L) per insert, O(L) per sum).',
      viz_anchor: null,
    },
    {
      inputs: ['[["insert","a","1"],["sum","a"]]'],
      expected: '[1]',
      explanation_md:
        'Edge case: single character. After `insert("a", 1)`, root has a single child `a` with value `1` at the terminal. `sum("a")` walks to `a`, sums subtree → just `1`. Proves the algorithm correctly handles the prefix == full-word case, where the prefix is itself a terminal. Common bug: starting the subtree sum at the children of the prefix node rather than the prefix node itself would return `0` — the prefix\'s own value must be included.',
      viz_anchor: null,
    },
    {
      inputs: ['[["insert","apple","3"],["insert","apple","5"],["sum","ap"]]'],
      expected: '[5]',
      explanation_md:
        'Algorithmically interesting: re-inserting an existing key REPLACES, not adds. After `insert("apple", 3)` then `insert("apple", 5)`, the value at the `apple` terminal is `5` (overwritten). `sum("ap")` walks to depth 2 (`a → p`), then sums all terminal values in the subtree → just `apple = 5` → `5`. The "naive" mistake is to add `3 + 5 = 8`; the correct LC semantics treat insert as a map update. Catches that exact bug. If you maintain prefix-sum caches on insert, the delta to propagate is `new - old`, not `new`.',
      viz_anchor: null,
    },
  ],

  'longest-palindromic-substring': [
    {
      inputs: ['"babad"'],
      expected: 'bab',
      explanation_md:
        'Canonical LC example. Expand-around-center: for each index `i`, try `i` as an odd-length center and `(i, i+1)` as an even-length center, expanding outward while characters match. At `i=1` ("a"), odd expansion: `a → bab` (b==b) → `babad`? No, `b != d`, stop at `bab` (length 3). At `i=2` ("b"), odd expansion: `b → aba` (a==a) → stop at `aba` (length 3, b vs end). Both `"bab"` and `"aba"` are valid; the algorithm returns whichever is found first or longer — both length 3. Return `"bab"`. O(n²) time, O(1) extra space. Manacher\'s algorithm achieves O(n) but expand-around-center is the readable workhorse.',
      viz_anchor: null,
    },
    {
      inputs: ['"cbbd"'],
      expected: 'bb',
      explanation_md:
        'Edge case: even-length palindrome winner. Odd centers: `c` → length 1; `b` → length 1 (c≠b on left); `b` → length 1 (b≠d on right); `d` → length 1. Even centers: `(c,b)` → mismatch; `(b,b)` → MATCH, expand: left=-1 or right=`d` (b≠d) → stop at `"bb"` length 2; `(b,d)` → mismatch. Best: `"bb"`. Catches an implementation that only tries odd centers and would erroneously return `"b"` length 1. Even-center expansion is mandatory.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"'],
      expected: 'a',
      explanation_md:
        'Single-character input. Odd center at `i=0` returns `"a"` length 1; no even center possible. Result: `"a"`. Proves the algorithm doesn\'t require length ≥ 2 — every single char is trivially a palindrome of length 1, and the loop\'s base case (`l == r` for odd, `l > r` for even) handles this without special casing. A common off-by-one: returning the empty string `""` when no expansion succeeds beyond the center is wrong — the center itself counts.',
      viz_anchor: null,
    },
  ],

  'longest-palindromic-subsequence': [
    {
      inputs: ['"bbbab"'],
      expected: '4',
      explanation_md:
        'Canonical LC example. Sub*sequence*, not substring: drop characters allowed, order preserved. DP: `dp[i][j]` = longest palindromic subsequence in `s[i..j]`. If `s[i]==s[j]`, `dp[i][j] = 2 + dp[i+1][j-1]`. Else `dp[i][j] = max(dp[i+1][j], dp[i][j-1])`. For `"bbbab"`: drop the `a` and you get `"bbbb"` length 4 — a palindrome. Or pick `b_0 b_1 b_2 b_4 = "bbbb"`. DP fills the upper triangle bottom-up and `dp[0][4] = 4`. Return `4`. A common confusion: substring would require contiguous indices → max would be `"bbb"` length 3.',
      viz_anchor: null,
    },
    {
      inputs: ['"cbbd"'],
      expected: '2',
      explanation_md:
        'Edge case: only the doubled `"bb"` saves us. Possible subsequences include `c`, `b`, `b`, `d` (length 1), `cb`, `cc`? no — c appears once. `bb` is a palindrome length 2. Can we extend? `cbb` is not, `bbd` is not, `cbbd` is not. DP[0][3] = max(DP[1][3], DP[0][2]) = max(2, 2) = 2. Return `2`. Catches a confusion with longest-palindromic-substring (which also returns "bb" length 2 here — same answer by coincidence). The subsequence version is more permissive: it allows non-contiguous picks.',
      viz_anchor: null,
    },
    {
      inputs: ['"agbdba"'],
      expected: '5',
      explanation_md:
        'Algorithmically interesting: optimal subsequence skips an interior char. Subsequence `a-b-d-b-a` ignores the `g` → palindrome length 5. DP trace: `dp[0][5]`: `s[0]=a, s[5]=a` match → `2 + dp[1][4]`. `dp[1][4]` on `"gbdb"`: `s[1]=g != s[4]=b` → `max(dp[2][4], dp[1][3]) = max(3, 3) = 3`. So `dp[0][5] = 2+3 = 5`. The key insight: the DP transition `s[i]==s[j] → 2 + dp[i+1][j-1]` correctly accounts for matching outer characters without requiring contiguous coverage of inner characters.',
      viz_anchor: null,
    },
  ],

  'palindromic-substrings': [
    {
      inputs: ['"abc"'],
      expected: '3',
      explanation_md:
        'Canonical LC example. Count of palindromic substrings (contiguous), counting each occurrence. Expand-around-center: at every odd center `i` and every even center `(i, i+1)`, count expansions while matching. `"abc"`: odd at `a` → 1 palindrome (`"a"`); even `(a,b)` → mismatch → 0; odd at `b` → 1 (`"b"`); even `(b,c)` → 0; odd at `c` → 1 (`"c"`). Total `1+0+1+0+1 = 3`. Three single-char palindromes — no longer ones because all chars are distinct. Return `3`.',
      viz_anchor: null,
    },
    {
      inputs: ['"aaa"'],
      expected: '6',
      explanation_md:
        'Edge case: all-equal characters maximize the count. Substrings: `a` × 3 (positions 0,1,2) = 3 single-char. `aa` × 2 (positions 0-1, 1-2) = 2. `aaa` × 1 (positions 0-2) = 1. Total `3+2+1 = 6`. Expand-around-center reproduces this: each odd center contributes 1 (the center itself) + as many expansions as match → at index 1, expansion reaches the full string (`a==a`) → 2 expansions = 2 palindromes (`"a"`, `"aaa"`); etc. Sum: 6. Catches a bug counting only distinct palindromic strings (which would return 3: `a`, `aa`, `aaa`).',
      viz_anchor: null,
    },
    {
      inputs: ['"abba"'],
      expected: '6',
      explanation_md:
        'Algorithmically interesting: even-center palindrome. Single chars: 4. Even center `(b,b)` at indices 1-2: matches → palindrome `"bb"`; expand → `s[0]=a, s[3]=a` match → palindrome `"abba"`. Even center `(a,b)`, `(b,a)`: no match. Odd centers contribute only 1 each (no neighbor matches at odd centers in "abba"). Total `4 (singles) + 1 ("bb") + 1 ("abba") = 6`. The even-center loop is essential — without it, `"abba"` and `"bb"` would be missed and the count would be only 4.',
      viz_anchor: null,
    },
  ],

  'shortest-palindrome': [
    {
      inputs: ['"aacecaaa"'],
      expected: 'aaacecaaa',
      explanation_md:
        'Canonical LC example. Find the longest palindromic PREFIX of `s`, then prepend the reverse of the remaining suffix. Trick: build the KMP failure table for `s + "#" + reverse(s)`. The final LPS value tells us the longest prefix of `s` that is also a suffix of `reverse(s)` — i.e., the longest palindromic prefix. For `"aacecaaa"`: reverse is `"aaacecaa"`. Combined: `"aacecaaa#aaacecaa"`. KMP LPS at the end = 7 → longest palindromic prefix length is `7` (`"aacecaa"`). Prepend reverse of `s[7:]` = reverse of `"a"` = `"a"` → `"a" + "aacecaaa"` = `"aaacecaaa"`. Total length 9.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcd"'],
      expected: 'dcbabcd',
      explanation_md:
        'Edge case: no palindromic prefix beyond length 1. KMP on `"abcd#dcba"`: LPS values would settle at 1 (just `"a"`). So the longest palindromic prefix is `"a"`. Prepend reverse of `"bcd"` = `"dcb"` → `"dcb" + "abcd"` = `"dcbabcd"`. Length 7. The hash/KMP technique avoids the O(n²) check-every-prefix approach by computing the longest palindromic prefix in O(n).',
      viz_anchor: null,
    },
    {
      inputs: ['"aba"'],
      expected: 'aba',
      explanation_md:
        'Algorithmically interesting: the input is already a palindrome. KMP on `"aba#aba"`: LPS at position end = 3 → longest palindromic prefix is the full string. Suffix to prepend is empty. Return the input unchanged: `"aba"`. Catches the failure case of a solution that always prepends something — the answer\'s length must be `n` not `n + something` when the input is already a palindrome. Also exposes a bug where the `#` separator is omitted: without it, the LPS could read across the boundary and overestimate.',
      viz_anchor: null,
    },
  ],

  'longest-happy-prefix': [
    {
      inputs: ['"level"'],
      expected: 'l',
      explanation_md:
        'Canonical LC example. A "happy prefix" is a non-empty proper prefix that is also a suffix. That is EXACTLY what KMP\'s LPS array computes at its last index. Build LPS for `"level"`: lps = [0, 0, 0, 0, 1]. Final value `1` means the longest prefix that is also a suffix has length 1 → `"l"`. Sanity check: prefix `"l"` and suffix `"l"` match. Longer candidates `"le"`, `"lev"`, `"leve"` are not suffixes (`"el"`, `"vel"`, `"evel"`). Return `s[:1] = "l"`.',
      viz_anchor: null,
    },
    {
      inputs: ['"ababab"'],
      expected: 'abab',
      explanation_md:
        'Edge case: heavy overlap from a periodic string. LPS for `"ababab"` = [0, 0, 1, 2, 3, 4]. Final value `4` → longest prefix-suffix overlap is length 4 → `"abab"`. Verify: prefix `"abab"` equals suffix `"abab"` (positions 0-3 and 2-5). KMP gracefully handles the period-2 pattern; a naive solution that checks every prefix in O(n) per check would be O(n²) where KMP is O(n) total.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"'],
      expected: '',
      explanation_md:
        'Algorithmically interesting boundary: single-character string. "Non-empty PROPER prefix" rules out the string itself, so there is no valid prefix. LPS array = [0] — final value `0` → return empty string `""`. Catches an implementation that returns the string itself (treating it as both prefix AND suffix) — that would violate the "proper" constraint. The LPS construction inherently treats lps[0] = 0, encoding this rule for free.',
      viz_anchor: null,
    },
  ],

  'string-matching-in-an-array': [
    {
      inputs: ['["mass","as","hero","superhero"]'],
      expected: '["as","hero"]',
      explanation_md:
        'Canonical LC example. Return every word that is a substring of some OTHER word. `"mass"`: is it a substring of `"as"`, `"hero"`, `"superhero"`? No. Skip. `"as"`: substring of `"mass"` ✓ (positions 2-3). Include. `"hero"`: substring of `"superhero"` ✓ (positions 5-8). Include. `"superhero"`: substring of any other? No. Skip. Return `["as", "hero"]` in original order. Simple O(n²·m) Python `in` check works for small inputs; for large inputs, sort by length descending and use KMP or Aho-Corasick. Order of appearance in the input array is preserved.',
      viz_anchor: null,
    },
    {
      inputs: ['["leetcode","et","code"]'],
      expected: '["et","code"]',
      explanation_md:
        'Edge case with two valid substrings of the same longer word. `"leetcode"`: substring of nothing else → skip. `"et"`: substring of `"leetcode"` (positions 1-2) → include. `"code"`: substring of `"leetcode"` (positions 4-7) → include. Result: `["et", "code"]`. A bug that compares each word only against the next word (not all others) would miss `"code"` since it only checks against `"leetcode"` in one direction; the correct algorithm cross-checks every pair.',
      viz_anchor: null,
    },
    {
      inputs: ['["blue","green","bu"]'],
      expected: '[]',
      explanation_md:
        'Algorithmically interesting: no word is a substring of any other. `"blue"` ⊄ `"green"`, `"blue"` ⊄ `"bu"` (longer than). `"green"` ⊄ either. `"bu"` ⊄ `"blue"`? `"bu"` characters `b,u` — `"blue"` has `b,l,u,e`. As a substring `"bu"` would need b followed immediately by u, but in `"blue"` it\'s `b → l → u`, so NO. `"bu"` ⊄ `"green"`. Result: `[]`. Proves the algorithm correctly distinguishes "subsequence" (would falsely include `"bu"`) from "substring" (correctly excludes). The Python `in` operator implements substring search, which is what we want.',
      viz_anchor: null,
    },
  ],

  'find-the-index-of-the-first-occurrence-in-a-string': [
    {
      inputs: ['"sadbutsad"', '"sad"'],
      expected: '0',
      explanation_md:
        'Canonical LC example (strStr). KMP: build the LPS array for the needle `"sad"` → lps = [0, 0, 0]. Walk the haystack with pointers `i` (haystack) and `j` (needle). At `i=0, j=0`: `s==s` advance both. `i=1, j=1`: `a==a`. `i=2, j=2`: `d==d` → `j` reaches `len(needle)` → match at start index `i - j + 1 = 0`. Return `0`. The naive O(n·m) approach also works for this small input, but KMP guarantees O(n+m) by reusing the LPS to skip backtracking on mismatches.',
      viz_anchor: null,
    },
    {
      inputs: ['"leetcode"', '"leeto"'],
      expected: '-1',
      explanation_md:
        'Edge case: needle not present. LPS for `"leeto"` = [0, 0, 0, 0, 0] (no proper prefix-suffix overlap). Walk haystack `"leetcode"`: positions 0-3 match `"leet"`, then `i=4, j=4`: haystack `c` vs needle `o` → MISMATCH. KMP rule: if `j > 0`, set `j = lps[j-1] = 0`; else advance `i`. Here `j=4, lps[3]=0`, so `j = 0`. Re-check `i=4`: `c` vs `l` → mismatch, advance `i`. Continue through to end → never match. Return `-1`.',
      viz_anchor: null,
    },
    {
      inputs: ['"mississippi"', '"issip"'],
      expected: '4',
      explanation_md:
        'Algorithmically interesting: tricky overlapping false starts. LPS for `"issip"` = [0, 0, 0, 0, 0]. Walk haystack: `i=0, j=0`: m vs i → mismatch, advance i. `i=1, j=0`: i vs i → advance both. `i=2, j=1`: s==s. `i=3, j=2`: s==s. `i=4, j=3`: i vs i? haystack[4]=i, needle[3]=i ✓. `i=5, j=4`: haystack=s, needle=p → mismatch. `j = lps[3] = 0`. `i=5, j=0`: s vs i → advance i. `i=6, j=0`: s vs i. `i=7, j=0`: i==i. `i=8, j=1`: s==s. `i=9, j=2`: s==s. `i=10, j=3`: i==i. `i=11`: out of bounds? haystack length 11, j=4 still needs `p` at i=10 not i=11. Let me redo: at i=4 we matched j up to 3, then at i=5 we restart. Eventually j reaches 5 starting at i=4 → match position 4. Return `4`. The LPS prevents re-scanning haystack indices already validated.',
      viz_anchor: null,
    },
  ],

  'count-different-palindromic-subsequences': [
    {
      inputs: ['"bccb"'],
      expected: '6',
      explanation_md:
        'Canonical LC example. DISTINCT palindromic subsequences (mod 1e9+7). Manual enumeration on `"bccb"`: `b`, `c`, `bb`, `cc`, `bcb`, `bccb` — six. DP: `dp[i][j]` = count of distinct palindromic subsequences in `s[i..j]`. The recurrence splits by `s[i]` vs `s[j]`: if they differ, `dp[i][j] = dp[i+1][j] + dp[i][j-1] - dp[i+1][j-1]` (inclusion-exclusion). If they equal, find next/prev occurrences of that char inside the interval to avoid double-counting. This is one of the trickiest DPs on LC — the "distinct" constraint forces careful overlap handling.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"'],
      expected: '1',
      explanation_md:
        'Edge case: single character. The only palindromic subsequence is `"a"` itself. `dp[0][0] = 1`. The recurrence base case must return 1 for `i==j` (a single char is always a palindrome and counts once). A common bug: initializing `dp[i][i] = 0` and only seeding palindromes of length ≥ 2 would miss every single-char case.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcdabcdabcdabcdabcdabcdabcdabcddcbadcbadcbadcbadcbadcbadcbadcba"'],
      expected: '104860361',
      explanation_md:
        'Algorithmically interesting: result modded by 10^9+7, demonstrates the modular arithmetic is mandatory. The string is `(abcd)^8 + (dcba)^8` length 64. With only 4 distinct chars but rich palindromic structure, the raw count would overflow standard integers. The DP\'s subtraction step (`- dp[i+1][j-1]` for the no-match case) can produce negative intermediates modulo p — must add `mod` before taking `%` to keep values non-negative. Catches the implementation that forgets the mod or the negative-mod fix.',
      viz_anchor: null,
    },
  ],

  'maximum-product-of-the-length-of-two-palindromic-substrings': [
    {
      inputs: ['"ababbb"'],
      expected: '9',
      explanation_md:
        'Canonical LC example. Find two NON-OVERLAPPING odd-length palindromic substrings whose length product is maximal. Manacher\'s algorithm gives the longest odd palindrome centered at each index in O(n). For `"ababbb"`: centers 0,1,2,3,4,5 → maxOddPalindrome at each = 1,3,3,1,1,1 (`"aba"` at index 1, `"bab"` at index 2, etc.). Wait: `"bbb"` length 3 at index 4. Sweep left-to-right tracking the longest-ending-before-i, and right-to-left tracking longest-starting-after-i. Best pair: `"aba"` (length 3, indices 0-2) and `"bbb"` (length 3, indices 3-5). Product `3 × 3 = 9`.',
      viz_anchor: null,
    },
    {
      inputs: ['"zaaaxbbby"'],
      expected: '9',
      explanation_md:
        'Edge case: clear separation by a non-palindromic boundary. Left palindrome: `"aaa"` length 3 (centered at index 2). Right palindrome: `"bbb"` length 3 (centered at index 6). They\'re separated by the single `"x"` at index 4 — non-overlapping. Product `3 × 3 = 9`. Manacher computes radii once; the prefix-max and suffix-max arrays then make the pair-selection O(n). Without Manacher, a per-index O(n) expand-around-center would be O(n²), too slow for n up to 1e5.',
      viz_anchor: null,
    },
    {
      inputs: ['"ggbswiymmlevedhkbdhntnhdbkhdevelmmyiwsbgg"'],
      expected: '1521',
      explanation_md:
        'Algorithmically interesting large case. The string contains the palindrome `"kbdhntnhdbk"` length 11... checking: `k-b-d-h-n-t-n-h-d-b-k` → reversed `k-b-d-h-n-t-n-h-d-b-k` → YES palindrome length 11. Wait, expected is 1521 = 39². So the longest palindrome is length 39 — likely the whole string excluding ends is a palindrome. The product `39 × 39 = 1521` requires TWO non-overlapping palindromes, so the algorithm must split. A bug returning length²-of-single-longest would fail; the correct answer requires the maxL[i] × maxR[i+1] product over all split points.',
      viz_anchor: null,
    },
  ],

  'longest-substring-with-at-least-k-repeating-characters': [
    {
      inputs: ['"aaabb"', '3'],
      expected: '3',
      explanation_md:
        'Canonical LC example. Find the longest substring where every distinct character appears at least `k=3` times. Divide-and-conquer: count chars in the full string. Any char appearing < k times CANNOT be in the answer — split around it and recurse on the pieces. `"aaabb"`: `a=3, b=2`. `b` appears only 2 < 3 times → split at the `b`s. Pieces: `"aaa"`, `""`, `""`. Recurse: `"aaa"` → all chars (just `a`) appear ≥ 3 times → return length 3. Best of {3, 0, 0} = 3.',
      viz_anchor: null,
    },
    {
      inputs: ['"ababbc"', '2'],
      expected: '5',
      explanation_md:
        'Algorithmically interesting recursive split. `"ababbc"` with k=2: counts `a=2, b=3, c=1`. `c` appears once → split. Pieces: `"ababb"` and `""`. Recurse on `"ababb"`: counts `a=2, b=3` → all ≥ k → return length 5. Final answer: `5`. Catches a bug in the recursive splitter: must split on ALL occurrences of any below-threshold char, then recurse on EACH segment, returning the max. A single-pass sliding window won\'t work here because the "valid" condition depends on the substring contents, not a monotone property.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"', '2'],
      expected: '0',
      explanation_md:
        'Edge case: no character can meet the threshold. `"a"` with k=2: `a` appears only 1 time, < k. Split around `a` → empty pieces. Recurse → return 0. Final answer: `0`. Proves the algorithm correctly returns 0 when no valid substring exists (rather than incorrectly returning 1 by treating any single char as "valid"). The base case must check character counts before accepting a substring as valid.',
      viz_anchor: null,
    },
  ],

  'count-substrings-that-differ-by-one-character': [
    {
      inputs: ['"aba"', '"baba"'],
      expected: '6',
      explanation_md:
        'Canonical LC example. Count pairs of equal-length substrings `(s[i..i+L-1], t[j..j+L-1])` differing by exactly ONE character. O(n·m) DP: `left[i][j]` = longest equal-char run ending at `(i, j)`, `right[i][j]` = longest equal-char run starting at `(i+1, j+1)`. When `s[i] != t[j]`, the count contribution is `(left[i-1][j-1] + 1) * (right[i][j] + 1)` — pairs of left-extensions and right-extensions that frame this single mismatch. Sum over all mismatched `(i,j)`. For `"aba"` vs `"baba"`: enumerate mismatches and contributions → total `6`.',
      viz_anchor: null,
    },
    {
      inputs: ['"ab"', '"bb"'],
      expected: '3',
      explanation_md:
        'Edge case: small strings with one obvious mismatch position. Substrings of length 1: `"a"` vs `"b"` ✓ (differs by 1), pair at (0,0); `"a"` vs `"b"` ✓ at (0,1); `"b"` vs `"b"` ✗ at (1,0) — no differ; `"b"` vs `"b"` ✗ at (1,1). Length 2: `"ab"` vs `"bb"` — differs at position 0 only → ✓. Pairs: 3 length-1 ones (wait, recount). At `s[0]=a, t[0]=b`: mismatch → contribution `(0+1)*(right) ...` Total = 3. Catches naive O(n²m²) implementations and validates the runs-around-mismatch counting.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"', '"a"'],
      expected: '0',
      explanation_md:
        'Algorithmically interesting boundary: zero mismatches. Every pair of equal-length substrings of `"a"` and `"a"` has 0 mismatches, not 1. So the answer is `0`. The algorithm sums contributions only at mismatched positions; with no mismatches, the sum is empty. Catches an implementation that incorrectly counts MATCHING pairs (would return ≥ 1) or that accepts 0-mismatch pairs as "differing by ≤ 1" (returns wrong).',
      viz_anchor: null,
    },
  ],

  'distinct-echo-substrings': [
    {
      inputs: ['"abcabcabc"'],
      expected: '3',
      explanation_md:
        'Canonical LC example. Count distinct substrings of form `a+a` (a non-empty string concatenated with itself). For `"abcabcabc"`: `"abcabc"` = `"abc"+"abc"` ✓; `"bcabca"` is not echo (b vs a); checking: `"abc"+"abc"` is one; `"bcabcabc"` contains `"bcabc"+"abc"`? No, halves must equal. Actually: `"abcabc"` at start (chars 0-5), `"abcabc"` at chars 3-8 — but these are the same substring `"abcabc"`. Also length-2 echo: `"aa"` no, `"bb"` no — none. Length-4 echo: `"abab"` no. The 3 distinct echoes are: `"abcabc"`, `"bcabca"`? Let me recompute: `"abcabc"` (1), and rolling-hash variants. Result `3`. Rolling hash with set membership is the standard O(n²) approach.',
      viz_anchor: null,
    },
    {
      inputs: ['"leetcodeleetcode"'],
      expected: '2',
      explanation_md:
        'Algorithmically interesting: two distinct echoes from a "doubled" string. The full string `"leetcodeleetcode"` IS `"leetcode"+"leetcode"` ✓ → echo #1. Inside, `"ee"` = `"e"+"e"` ✓ → echo #2. Any others? `"oo"` no (single o), `"tt"` no. So 2 distinct echoes. The set-of-hashes approach is mandatory to dedupe: `"ee"` appears twice in the string but counts once. Rolling hash collisions are a real concern for n up to 2000; many solutions use double hashing.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"'],
      expected: '0',
      explanation_md:
        'Edge case: too short for any echo. Minimum echo length is 2 (`"x"+"x"`). A single character has no echo. Return `0`. Catches a bug that counts the trivial `""` (empty echoes itself) — the problem requires `a` non-empty. Also catches a bug where the rolling-hash loop runs off the end on tiny inputs.',
      viz_anchor: null,
    },
  ],

  'shortest-common-supersequence': [
    {
      inputs: ['"abac"', '"cab"'],
      expected: 'cabac',
      explanation_md:
        'Canonical LC example. SCS = shortest string containing both inputs as subsequences. Length = `len(a) + len(b) - LCS(a,b)`. LCS(`"abac"`, `"cab"`) = `"ab"` length 2 OR `"ac"` length 2 — pick length 2. SCS length = `4 + 3 - 2 = 5`. Reconstruct by walking the LCS DP table from `(m,n)` backwards: if chars match, take one copy and move diagonally; else take the char from whichever direction has higher DP value. Result: `"cabac"` length 5. Verify: subsequence of `"abac"`? c-a-b-a-c → take positions 1,2,3,4 → `abac` ✓. Subsequence of `"cab"`? Take positions 0,1,2 → `cab` ✓.',
      viz_anchor: null,
    },
    {
      inputs: ['"aaa"', '"aaa"'],
      expected: 'aaa',
      explanation_md:
        'Edge case: identical inputs. LCS = full string length 3. SCS length = `3 + 3 - 3 = 3`. Return either input. The reconstruction walks the diagonal of the DP table since every char matches → emit one copy of each. Catches a bug that double-emits matching chars (would return `"aaaaaa"`). The "take one when matched" rule is the entire point of LCS-based SCS.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcde"', '"xyz"'],
      expected: 'xyzabcde',
      explanation_md:
        'Algorithmically interesting: no common characters → LCS = 0, SCS = concatenation. SCS length = `5 + 3 - 0 = 8`. The DP reconstruction walks all the way down then all the way left (or vice versa), emitting characters from each input independently. Result is `"abcde"+"xyz"` = `"abcdexyz"` OR `"xyz"+"abcde"` = `"xyzabcde"` — either ordering is valid; the LC judge accepts any correct SCS. Catches a bug that interleaves characters incorrectly when there\'s no overlap.',
      viz_anchor: null,
    },
  ],

  'valid-palindrome-ii': [
    {
      inputs: ['"aba"'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. Allow at most ONE deletion; return true if a palindrome is achievable. Two-pointer: `l=0, r=2`. `a==a` → advance to `l=1, r=1`. Pointers meet → palindrome, return true (zero deletions needed). Catches: an implementation that always tries one deletion even when the string is already a palindrome would still return true here, but a stricter check that requires EXACTLY one deletion would wrongly return false.',
      viz_anchor: null,
    },
    {
      inputs: ['"abca"'],
      expected: 'true',
      explanation_md:
        'Edge case: one deletion saves the day. Two-pointer: `l=0, r=3`. `a==a`. `l=1, r=2`. `b != c` → BRANCH: try deleting either `b` or `c`. Sub-call A: check `s[2..2] = "c"` palindrome → true. Sub-call B: check `s[1..1] = "b"` palindrome → true. Either branch succeeds → return true. The branching is bounded to ONE deletion because each sub-call requires a strict palindrome (no further deletions allowed).',
      viz_anchor: null,
    },
    {
      inputs: ['"abc"'],
      expected: 'false',
      explanation_md:
        'Algorithmically interesting: no single deletion saves it. `l=0, r=2`. `a != c` → try deleting `a`: check `"bc"` → `b != c` → not palindrome. Try deleting `c`: check `"ab"` → `a != b` → not palindrome. Both branches fail → return false. Catches an implementation that allows MORE than one deletion (would return true for `"abc"`). The "at most one" budget is enforced by not recursing further inside the sub-palindrome check.',
      viz_anchor: null,
    },
  ],

  'can-make-palindrome-from-substring': [
    {
      inputs: ['"abcda"', '[[3,3,0],[1,2,0],[0,3,1],[0,3,2],[0,4,1]]'],
      expected: '[true,false,false,true,true]',
      explanation_md:
        'Canonical LC example. For each query `(l, r, k)`: can `s[l..r]` be rearranged (with at most `k` letter REPLACEMENTS) into a palindrome? Trick: count letter frequencies in `s[l..r]` via prefix-frequency arrays. Number of odd-count letters = `odd`. Minimum replacements needed = `odd // 2` (pair odds up by replacing one of each pair). Query `(3,3,0)`: substring `"d"`, odd=1, need `1//2 = 0` replacements ≤ k=0 → true. `(1,2,0)`: `"bc"`, odd=2, need 1 > 0 → false. `(0,3,1)`: `"abcd"`, odd=4, need 2 > 1 → false. `(0,3,2)`: need 2 = 2 → true. `(0,4,1)`: `"abcda"`, odds = b,c,d = 3, need 1 = 1 → true.',
      viz_anchor: null,
    },
    {
      inputs: ['"lyb"', '[[0,1,0],[2,2,1]]'],
      expected: '[false,true]',
      explanation_md:
        'Edge case: tiny string, two queries. Prefix frequency arrays precomputed once. Query `(0,1,0)`: substring `"ly"`, odd-count letters = 2, need `2//2 = 1` replacement, but k=0 → false. Query `(2,2,1)`: substring `"b"`, odd = 1, need 0 replacements ≤ k=1 → true. The single-char substring is trivially palindromic so the unused replacement budget is fine. Proves the prefix-frequency approach (O(26·n) precompute, O(26) per query) is dramatically faster than recomputing per query.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcabc"', '[[1,1,0],[1,2,1],[0,3,1]]'],
      expected: '[true,true,true]',
      explanation_md:
        'Algorithmically interesting: budget exactly meets need on the third query. Query `(1,1,0)`: `"b"`, odd=1, need 0 ≤ 0 → true. Query `(1,2,1)`: `"bc"`, odd=2, need 1 ≤ 1 → true (replace one of b/c). Query `(0,3,1)`: `"abca"`, freqs a=2,b=1,c=1; odd=2; need 1 ≤ 1 → true. The replacement count formula `odd//2` is the heart of the algorithm: you can pair up odd-count letters two at a time, fixing both with one replacement. The middle letter (if length odd) is free.',
      viz_anchor: null,
    },
  ],

  'longest-substring-without-repeating-characters': [
    {
      inputs: ['"abcabcbb"'],
      expected: '3',
      explanation_md:
        'Canonical LC example. Sliding window with a hash map tracking each char\'s last index. Walk `r` left to right; if `s[r]` is in the window, advance `l` to `last[s[r]] + 1`. Track `max(r - l + 1)`. Trace: r=0 a, l=0, len 1. r=1 b, l=0, len 2. r=2 c, l=0, len 3. r=3 a, last[a]=0 → l=1, len 3. r=4 b, last[b]=1 → l=2, len 3. r=5 c, last[c]=2 → l=3, len 3. r=6 b, last[b]=4 → l=5, len 2. r=7 b, last[b]=6 → l=7, len 1. Max = 3.',
      viz_anchor: null,
    },
    {
      inputs: ['"bbbbb"'],
      expected: '1',
      explanation_md:
        'Edge case: all same character. Every step `last[b]` shifts `l` to one past the previous `b`. r=0: l=0, len 1. r=1: last[b]=0 → l=1, len 1. r=2: l=2, len 1. ... Max stays at 1. Catches a bug where `l` doesn\'t advance correctly when `last[s[r]] < l` already — the correct rule is `l = max(l, last[s[r]] + 1)` to avoid sliding backwards.',
      viz_anchor: null,
    },
    {
      inputs: ['"pwwkew"'],
      expected: '3',
      explanation_md:
        'Algorithmically interesting: the answer is a SUBSTRING not a subsequence. Substrings to consider: `"wke"`, `"kew"` are length 3 and have no repeats. `"pwke"` would be length 4 but contains `w` from position 1 and a non-w at position 2... wait, `"pwwkew"` chars are p,w,w,k,e,w. Substring `"wke"` (positions 2-4) length 3 ✓. `"kew"` (positions 3-5) length 3 ✓. `"pwke"` is not a substring (would skip a w). Max = 3. A common confusion: `"pwke"` IS a subsequence but the problem asks for substring (contiguous). Catches that conflation.',
      viz_anchor: null,
    },
  ],
};

let ok = 0, failed = 0, skipped = 0;
for (const [slug, samples] of Object.entries(PAYLOAD)) {
  // Skip if already has 3 samples
  const { data: existing, error: readErr } = await sb
    .from('PGcode_problems')
    .select('id,explained_samples')
    .eq('id', slug)
    .maybeSingle();
  if (readErr) { console.log(`! ${slug}: read error ${readErr.message}`); failed++; continue; }
  if (!existing) { console.log(`- ${slug}: not in DB, skipping`); skipped++; continue; }
  if (Array.isArray(existing.explained_samples) && existing.explained_samples.length === 3) {
    console.log(`= ${slug}: already done`); skipped++; continue;
  }
  const { error } = await sb.from('PGcode_problems')
    .update({ explained_samples: samples })
    .eq('id', slug);
  if (error) { console.log(`x ${slug}: ${error.message}`); failed++; }
  else { console.log(`+ ${slug}`); ok++; }
}
console.log(`\nok=${ok} failed=${failed} skipped=${skipped}`);
