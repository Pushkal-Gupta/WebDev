#!/usr/bin/env node
// Atomic splice: verifying-an-alien-dictionary, most-common-word, goat-latin.
// Inline viz frames (15 each), 6-language solutions, full grading metadata.

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

const COMPANIES = ['amazon', 'meta', 'microsoft', 'google', 'apple'];

const ALIEN_SOLUTIONS = {
  python: `class Solution:
    def isAlienSorted(self, words: List[str], order: str) -> bool:
        rank = {c: i for i, c in enumerate(order)}
        def key(w): return [rank[c] for c in w]
        for a, b in zip(words, words[1:]):
            if key(a) > key(b):
                return False
        return True`,
  javascript: `var isAlienSorted = function(words, order) {
    const rank = new Map();
    for (let i = 0; i < order.length; i++) rank.set(order[i], i);
    const key = w => [...w].map(c => rank.get(c));
    const cmp = (a, b) => {
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            if (a[i] !== b[i]) return a[i] - b[i];
        }
        return a.length - b.length;
    };
    for (let i = 0; i + 1 < words.length; i++) {
        if (cmp(key(words[i]), key(words[i + 1])) > 0) return false;
    }
    return true;
};`,
  java: `class Solution {
    public boolean isAlienSorted(String[] words, String order) {
        int[] rank = new int[26];
        for (int i = 0; i < order.length(); i++) rank[order.charAt(i) - 'a'] = i;
        for (int i = 0; i + 1 < words.length; i++) {
            String a = words[i], b = words[i + 1];
            int j = 0;
            while (j < a.length() && j < b.length() && a.charAt(j) == b.charAt(j)) j++;
            if (j == a.length()) continue;
            if (j == b.length()) return false;
            if (rank[a.charAt(j) - 'a'] > rank[b.charAt(j) - 'a']) return false;
        }
        return true;
    }
}`,
  cpp: `class Solution {
public:
    bool isAlienSorted(vector<string>& words, string order) {
        int rank[26];
        for (int i = 0; i < 26; i++) rank[order[i] - 'a'] = i;
        for (int i = 0; i + 1 < (int)words.size(); i++) {
            const string& a = words[i]; const string& b = words[i + 1];
            int j = 0;
            while (j < (int)a.size() && j < (int)b.size() && a[j] == b[j]) j++;
            if (j == (int)a.size()) continue;
            if (j == (int)b.size()) return false;
            if (rank[a[j] - 'a'] > rank[b[j] - 'a']) return false;
        }
        return true;
    }
};`,
  typescript: `function isAlienSorted(words: string[], order: string): boolean {
    const rank = new Map<string, number>();
    for (let i = 0; i < order.length; i++) rank.set(order[i], i);
    const key = (w: string) => [...w].map(c => rank.get(c)!);
    for (let i = 0; i + 1 < words.length; i++) {
        const a = key(words[i]), b = key(words[i + 1]);
        let j = 0;
        while (j < a.length && j < b.length && a[j] === b[j]) j++;
        if (j === a.length) continue;
        if (j === b.length) return false;
        if (a[j] > b[j]) return false;
    }
    return true;
}`,
  go: `func isAlienSorted(words []string, order string) bool {
    rank := [26]int{}
    for i := 0; i < len(order); i++ { rank[order[i]-'a'] = i }
    for i := 0; i+1 < len(words); i++ {
        a, b := words[i], words[i+1]
        j := 0
        for j < len(a) && j < len(b) && a[j] == b[j] { j++ }
        if j == len(a) { continue }
        if j == len(b) { return false }
        if rank[a[j]-'a'] > rank[b[j]-'a'] { return false }
    }
    return true
}`,
};

const ALIEN_VIZ = Array.from({ length: 15 }, (_, i) => {
  const steps = [
    { caption: 'Two words to compare: "hello" vs "leetcode". Build rank map from order.', state: 'init' },
    { caption: 'order = "hlabcdefgijkmnopqrstuvwxyz" — h:0, l:1, a:2 ...', state: 'rank-built' },
    { caption: 'Pair 1: ("hello", "leetcode"). Walk indices while chars match.', state: 'pair-1' },
    { caption: 'i=0: h vs l. rank[h]=0, rank[l]=1. 0 < 1, so "hello" < "leetcode". Pair OK.', state: 'pair-1-resolved' },
    { caption: 'No more pairs. Return true.', state: 'done-true' },
    { caption: 'Example 2: words = ["word","world","row"], order = "worldabc...".', state: 'init-2' },
    { caption: 'Pair 1: ("word","world"). Match w,o,r,d. "word" exhausts first → prefix wins.', state: 'pair-1-2' },
    { caption: 'Pair 2: ("world","row"). i=0: w vs r. rank[w]=0, rank[r]=2. 0 < 2 → "world" < "row".', state: 'pair-2-2' },
    { caption: 'Wait — recheck pair ("word","world") under THIS order: rank[d]=4, rank[blank]=-inf.', state: 'recheck' },
    { caption: 'Example 3: ["apple","app"], standard order. Match a,p,p — "app" exhausts second.', state: 'prefix-violation' },
    { caption: 'Second word is shorter prefix of first → unsorted. Return false.', state: 'done-false' },
    { caption: 'Key invariant: shorter-as-prefix is OK only when it appears FIRST.', state: 'invariant' },
    { caption: 'Complexity: O(C) where C is total characters across all words.', state: 'complexity' },
    { caption: 'Space: O(1) — rank map is fixed 26 entries.', state: 'space' },
    { caption: 'Done.', state: 'final' },
  ];
  return steps[i];
});

const MCW_SOLUTIONS = {
  python: `class Solution:
    def mostCommonWord(self, paragraph: str, banned: List[str]) -> str:
        import re
        from collections import Counter
        banset = set(banned)
        words = re.findall(r"[a-z]+", paragraph.lower())
        counts = Counter(w for w in words if w not in banset)
        return counts.most_common(1)[0][0]`,
  javascript: `var mostCommonWord = function(paragraph, banned) {
    const banset = new Set(banned);
    const words = paragraph.toLowerCase().match(/[a-z]+/g) || [];
    const counts = new Map();
    let best = '', bestCount = 0;
    for (const w of words) {
        if (banset.has(w)) continue;
        const c = (counts.get(w) || 0) + 1;
        counts.set(w, c);
        if (c > bestCount) { bestCount = c; best = w; }
    }
    return best;
};`,
  java: `class Solution {
    public String mostCommonWord(String paragraph, String[] banned) {
        Set<String> banset = new HashSet<>(Arrays.asList(banned));
        Map<String, Integer> counts = new HashMap<>();
        String best = ""; int bestCount = 0;
        for (String w : paragraph.toLowerCase().split("[^a-z]+")) {
            if (w.isEmpty() || banset.contains(w)) continue;
            int c = counts.getOrDefault(w, 0) + 1;
            counts.put(w, c);
            if (c > bestCount) { bestCount = c; best = w; }
        }
        return best;
    }
}`,
  cpp: `class Solution {
public:
    string mostCommonWord(string paragraph, vector<string>& banned) {
        unordered_set<string> banset(banned.begin(), banned.end());
        unordered_map<string, int> counts;
        string best, cur, bestStr;
        int bestCount = 0;
        for (char& c : paragraph) c = isalpha(c) ? tolower(c) : ' ';
        stringstream ss(paragraph);
        while (ss >> cur) {
            if (banset.count(cur)) continue;
            int c = ++counts[cur];
            if (c > bestCount) { bestCount = c; bestStr = cur; }
        }
        return bestStr;
    }
};`,
  typescript: `function mostCommonWord(paragraph: string, banned: string[]): string {
    const banset = new Set(banned);
    const words = paragraph.toLowerCase().match(/[a-z]+/g) || [];
    const counts = new Map<string, number>();
    let best = '', bestCount = 0;
    for (const w of words) {
        if (banset.has(w)) continue;
        const c = (counts.get(w) || 0) + 1;
        counts.set(w, c);
        if (c > bestCount) { bestCount = c; best = w; }
    }
    return best;
}`,
  go: `func mostCommonWord(paragraph string, banned []string) string {
    banset := map[string]bool{}
    for _, b := range banned { banset[b] = true }
    counts := map[string]int{}
    best, bestCount := "", 0
    cur := []byte{}
    flush := func() {
        if len(cur) == 0 { return }
        w := string(cur); cur = cur[:0]
        if banset[w] { return }
        counts[w]++
        if counts[w] > bestCount { bestCount = counts[w]; best = w }
    }
    for i := 0; i < len(paragraph); i++ {
        c := paragraph[i]
        if c >= 'A' && c <= 'Z' { cur = append(cur, c+32) } else if c >= 'a' && c <= 'z' { cur = append(cur, c) } else { flush() }
    }
    flush()
    return best
}`,
};

const MCW_VIZ = [
  { caption: 'paragraph = "Bob hit a ball, the hit BALL flew far after it was hit." banned = ["hit"]', state: 'init' },
  { caption: 'Step 1: lowercase + split on non-letters → tokens.', state: 'lowercase' },
  { caption: 'tokens = [bob, hit, a, ball, the, hit, ball, flew, far, after, it, was, hit]', state: 'tokens' },
  { caption: 'banset = {hit}. Drop every "hit" from the stream.', state: 'filter' },
  { caption: 'Remaining: [bob, a, ball, the, ball, flew, far, after, it, was]', state: 'remaining' },
  { caption: 'Count: bob=1', state: 'count-1' },
  { caption: 'Count: bob=1, a=1', state: 'count-2' },
  { caption: 'Count: bob=1, a=1, ball=1 — track best=ball.', state: 'count-3' },
  { caption: 'Count: ..., the=1', state: 'count-4' },
  { caption: 'Count: ..., ball=2 — best=ball (count 2).', state: 'count-5' },
  { caption: 'Continue: flew, far, after, it, was each at 1. None overtake ball.', state: 'count-rest' },
  { caption: 'Return "ball".', state: 'done' },
  { caption: 'Edge: punctuation handled by non-letter split (commas, periods, !).', state: 'edge-punct' },
  { caption: 'Complexity: O(P + B) — paragraph length + banned size.', state: 'complexity' },
  { caption: 'Space: O(W) for unique words.', state: 'space' },
];

const GOAT_SOLUTIONS = {
  python: `class Solution:
    def toGoatLatin(self, sentence: str) -> str:
        vowels = set("aeiouAEIOU")
        out = []
        for i, w in enumerate(sentence.split(), 1):
            w = w if w[0] in vowels else w[1:] + w[0]
            out.append(w + "ma" + "a" * i)
        return " ".join(out)`,
  javascript: `var toGoatLatin = function(sentence) {
    const vowels = new Set('aeiouAEIOU');
    return sentence.split(' ').map((w, i) => {
        const transformed = vowels.has(w[0]) ? w : w.slice(1) + w[0];
        return transformed + 'ma' + 'a'.repeat(i + 1);
    }).join(' ');
};`,
  java: `class Solution {
    public String toGoatLatin(String sentence) {
        Set<Character> vowels = new HashSet<>(Arrays.asList('a','e','i','o','u','A','E','I','O','U'));
        String[] words = sentence.split(" ");
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < words.length; i++) {
            String w = words[i];
            String t = vowels.contains(w.charAt(0)) ? w : w.substring(1) + w.charAt(0);
            out.append(t).append("ma");
            for (int k = 0; k <= i; k++) out.append('a');
            if (i + 1 < words.length) out.append(' ');
        }
        return out.toString();
    }
}`,
  cpp: `class Solution {
public:
    string toGoatLatin(string sentence) {
        string vowels = "aeiouAEIOU";
        auto isVowel = [&](char c) { return vowels.find(c) != string::npos; };
        stringstream ss(sentence);
        string w, out;
        int i = 1;
        while (ss >> w) {
            string t = isVowel(w[0]) ? w : w.substr(1) + w[0];
            out += t + "ma" + string(i, 'a');
            i++;
            if (ss.peek() != EOF) out += ' ';
        }
        return out;
    }
};`,
  typescript: `function toGoatLatin(sentence: string): string {
    const vowels = new Set('aeiouAEIOU');
    return sentence.split(' ').map((w, i) => {
        const t = vowels.has(w[0]) ? w : w.slice(1) + w[0];
        return t + 'ma' + 'a'.repeat(i + 1);
    }).join(' ');
}`,
  go: `func toGoatLatin(sentence string) string {
    vowels := "aeiouAEIOU"
    isVowel := func(c byte) bool { return strings.IndexByte(vowels, c) >= 0 }
    words := strings.Split(sentence, " ")
    var out strings.Builder
    for i, w := range words {
        var t string
        if isVowel(w[0]) { t = w } else { t = w[1:] + string(w[0]) }
        out.WriteString(t)
        out.WriteString("ma")
        out.WriteString(strings.Repeat("a", i+1))
        if i+1 < len(words) { out.WriteByte(' ') }
    }
    return out.String()
}`,
};

const GOAT_VIZ = [
  { caption: 'sentence = "I speak Goat Latin". Split into words.', state: 'init' },
  { caption: 'words = ["I", "speak", "Goat", "Latin"]. Each word gets an index-tied suffix.', state: 'split' },
  { caption: 'Word 1 "I": starts with vowel I → keep as-is.', state: 'w1-vowel' },
  { caption: 'Append "ma" + "a" × 1 → "Imaa".', state: 'w1-suffix' },
  { caption: 'Word 2 "speak": starts with s (consonant) → move s to end → "peaks".', state: 'w2-consonant' },
  { caption: 'Append "ma" + "a" × 2 → "peaksmaaa".', state: 'w2-suffix' },
  { caption: 'Word 3 "Goat": starts with G (consonant) → "oatG".', state: 'w3-consonant' },
  { caption: 'Append "ma" + "a" × 3 → "oatGmaaaa".', state: 'w3-suffix' },
  { caption: 'Word 4 "Latin": starts with L (consonant) → "atinL".', state: 'w4-consonant' },
  { caption: 'Append "ma" + "a" × 4 → "atinLmaaaaa".', state: 'w4-suffix' },
  { caption: 'Join with spaces.', state: 'join' },
  { caption: 'Result: "Imaa peaksmaaa oatGmaaaa atinLmaaaaa".', state: 'done' },
  { caption: 'Vowel check is case-insensitive: includes AEIOU and aeiou.', state: 'case' },
  { caption: 'Suffix length grows linearly with index → output is O(n²) in word count.', state: 'complexity' },
  { caption: 'Space: O(n²) for the concatenated output.', state: 'space' },
];

const FLAGSHIPS = [
  {
    id: 'verifying-an-alien-dictionary',
    method_name: 'isAlienSorted',
    params: [{ name: 'words', type: 'List[str]' }, { name: 'order', type: 'str' }],
    return_type: 'bool',
    hints: [
      'Brute force: write a custom comparator and call sort, then check sort == original. O(n log n).',
      'Better: only adjacent pairs matter — if every (w[i], w[i+1]) is in order, the whole list is sorted.',
      'Build a rank map order[c] → position so character comparison becomes integer comparison.',
      'For each adjacent pair, walk indices while chars match; first differing char decides the pair.',
      'If one word is a prefix of the next, the shorter must come first — otherwise return false.',
      'O(C) time where C = total characters; O(1) space (26-entry rank).',
    ],
    tags: ['array', 'hash-table', 'string'],
    companies: COMPANIES,
    constraints: '1 ≤ words.length ≤ 100\n1 ≤ words[i].length ≤ 20\norder.length == 26\nAll chars in words[i] and order are lowercase English letters.',
    follow_up: 'What if order can change mid-stream? Re-precompute the rank table in O(26) and recheck. What about Unicode? Replace the fixed-26 array with a hash map.',
    pattern: 'custom-comparator',
    test_cases: [
      { inputs: ['["hello","leetcode"]', '"hlabcdefgijkmnopqrstuvwxyz"'], expected: 'true' },
      { inputs: ['["word","world","row"]', '"worldabcefghijkmnpqstuvxyz"'], expected: 'false' },
      { inputs: ['["apple","app"]', '"abcdefghijklmnopqrstuvwxyz"'], expected: 'false' },
      { inputs: ['["app","apple"]', '"abcdefghijklmnopqrstuvwxyz"'], expected: 'true' },
      { inputs: ['["a"]', '"abcdefghijklmnopqrstuvwxyz"'], expected: 'true' },
      { inputs: ['["a","b","c"]', '"abcdefghijklmnopqrstuvwxyz"'], expected: 'true' },
      { inputs: ['["c","b","a"]', '"abcdefghijklmnopqrstuvwxyz"'], expected: 'false' },
      { inputs: ['["c","b","a"]', '"cbadefghijklmnopqrstuvwxyz"'], expected: 'true' },
      { inputs: ['["zebra","zoo"]', '"abcdefghijklmnopqrstuvwxyz"'], expected: 'true' },
      { inputs: ['["zoo","zebra"]', '"abcdefghijklmnopqrstuvwxyz"'], expected: 'false' },
      { inputs: ['["abc","abc"]', '"abcdefghijklmnopqrstuvwxyz"'], expected: 'true' },
      { inputs: ['["abc","abd"]', '"abcdefghijklmnopqrstuvwxyz"'], expected: 'true' },
      { inputs: ['["abd","abc"]', '"abcdefghijklmnopqrstuvwxyz"'], expected: 'false' },
      { inputs: ['["hello","hello","hello"]', '"abcdefghijklmnopqrstuvwxyz"'], expected: 'true' },
      { inputs: ['["kuvp","q"]', '"ngxlkthsjuoqcpavbfdermiywz"'], expected: 'true' },
      { inputs: ['["fxasxpc","dfbdrifhp","nwzgs","cmwqriv","ebulyfyve","miracx","sxckgwzu","rxhvluhrz","yenrsbdmi","gnfpotzvg"]', '"zkgwaverfimqxbnctdplsjyohu"'], expected: 'false' },
      { inputs: ['["ab","abc"]', '"abcdefghijklmnopqrstuvwxyz"'], expected: 'true' },
      { inputs: ['["abc","ab"]', '"abcdefghijklmnopqrstuvwxyz"'], expected: 'false' },
      { inputs: ['["z","z"]', '"zabcdefghijklmnopqrstuvwxy"'], expected: 'true' },
      { inputs: ['["aaa","aab","aac"]', '"abcdefghijklmnopqrstuvwxyz"'], expected: 'true' },
    ],
    solutions: ALIEN_SOLUTIONS,
    viz_steps: ALIEN_VIZ,
  },
  {
    id: 'most-common-word',
    method_name: 'mostCommonWord',
    params: [{ name: 'paragraph', type: 'str' }, { name: 'banned', type: 'List[str]' }],
    return_type: 'str',
    hints: [
      'Tokenize: lowercase the paragraph then split on any non-letter run (regex [a-z]+).',
      'Build a hash set of banned words for O(1) membership.',
      'Stream tokens, increment a counter only for non-banned words.',
      'Track the running max in the same pass — no need to sort at the end.',
      'Guaranteed one answer per the problem, so no tie-break logic required.',
      'O(P + B) time, O(W) space for unique words.',
    ],
    tags: ['hash-table', 'string', 'counting'],
    companies: COMPANIES,
    constraints: '1 ≤ paragraph.length ≤ 1000\n0 ≤ banned.length ≤ 100\n1 ≤ banned[i].length ≤ 10\nparagraph consists of letters and punctuation. banned[i] is lowercase.',
    follow_up: 'What if you needed the top-k words? Use a heap of size k while streaming, or a Counter + nlargest. What about streaming infinite text? Approximate with Count-Min Sketch or Misra-Gries.',
    pattern: 'frequency-count',
    test_cases: [
      { inputs: ['"Bob hit a ball, the hit BALL flew far after it was hit."', '["hit"]'], expected: '"ball"' },
      { inputs: ['"a."', '[]'], expected: '"a"' },
      { inputs: ['"Bob. hIt, baLl"', '["bob","hit"]'], expected: '"ball"' },
      { inputs: ['"a, a, a, a, b,b,b,c, c"', '["a"]'], expected: '"b"' },
      { inputs: ['"L, P! X! C; u! P? w! P. G, S? r? G, r! i! V, V! F! e?"', '["m","i","s","w","y","d","q","l","a","p","n","t","u","b","o","e","f","g","c","x"]'], expected: '"r"' },
      { inputs: ['"Jon,Jon,Jon,Bob,Bob,Mary"', '["mary"]'], expected: '"jon"' },
      { inputs: ['"one one two two two three"', '["two"]'], expected: '"one"' },
      { inputs: ['"hello world hello"', '[]'], expected: '"hello"' },
      { inputs: ['"Cat. Cat? Dog!"', '[]'], expected: '"cat"' },
      { inputs: ['"Bob! Bob. Bob, Bob; Bob"', '[]'], expected: '"bob"' },
      { inputs: ['"unique"', '[]'], expected: '"unique"' },
      { inputs: ['"Apple apple APPLE banana"', '["banana"]'], expected: '"apple"' },
      { inputs: ['"to be or not to be"', '["to"]'], expected: '"be"' },
      { inputs: ['"red,red,red,blue,blue"', '[]'], expected: '"red"' },
      { inputs: ['"a a a b b b c"', '["a","b"]'], expected: '"c"' },
      { inputs: ['"Now is the time, NOW is the time"', '["is","the"]'], expected: '"now"' },
      { inputs: ['"hello, hello, world"', '[]'], expected: '"hello"' },
      { inputs: ['"x y z x y x"', '[]'], expected: '"x"' },
      { inputs: ['"foo. bar! baz? foo, foo"', '[]'], expected: '"foo"' },
      { inputs: ['"This is a TEST. this Is a test!"', '["a"]'], expected: '"this"' },
    ],
    solutions: MCW_SOLUTIONS,
    viz_steps: MCW_VIZ,
  },
  {
    id: 'goat-latin',
    method_name: 'toGoatLatin',
    params: [{ name: 'sentence', type: 'str' }],
    return_type: 'str',
    hints: [
      'Split on space — words are separated by single spaces per constraints.',
      'For each word, check if first char is a vowel (aeiou, both cases).',
      'Vowel words: keep as-is. Consonant words: rotate first char to the end.',
      'Append "ma" then "a" repeated (index + 1) times.',
      'Join the transformed words with single spaces.',
      'Total time O(n²) in word count due to growing suffix; output dominates.',
    ],
    tags: ['string'],
    companies: COMPANIES,
    constraints: '1 ≤ sentence.length ≤ 150\nsentence consists of English letters and spaces.\nWords are separated by single spaces, no leading/trailing spaces.',
    follow_up: 'What if the input has multiple spaces or punctuation? Pre-normalize. What if you needed reversibility (Goat-Latin → English)? Strip the m+a* suffix, then rotate consonant words back.',
    pattern: 'string-transform',
    test_cases: [
      { inputs: ['"I speak Goat Latin"'], expected: '"Imaa peaksmaaa oatGmaaaa atinLmaaaaa"' },
      { inputs: ['"The quick brown fox jumped over the lazy dog"'], expected: '"heTmaa uickqmaaa rownbmaaaa oxfmaaaaa umpedjmaaaaaa overmaaaaaaa hetmaaaaaaaa azylmaaaaaaaaa ogdmaaaaaaaaaa"' },
      { inputs: ['"a"'], expected: '"amaa"' },
      { inputs: ['"b"'], expected: '"bmaa"' },
      { inputs: ['"Each word consists of lowercase and uppercase letters only"'], expected: '"Eachmaa ordwmaaa onsistscmaaaa ofmaaaaa owercaselmaaaaaa andmaaaaaaa uppercasemaaaaaaaa etterslmaaaaaaaaa onlymaaaaaaaaaa"' },
      { inputs: ['"hello world"'], expected: '"ellohmaa orldwmaaa"' },
      { inputs: ['"apple banana"'], expected: '"applemaa ananabmaaa"' },
      { inputs: ['"I am happy"'], expected: '"Imaa ammaaa appyhmaaaa"' },
      { inputs: ['"go"'], expected: '"oGmaa"' },
      { inputs: ['"oh"'], expected: '"ohmaa"' },
      { inputs: ['"A B C D E"'], expected: '"Amaa Bmaaa Cmaaaa Dmaaaaa Emaaaaaa"' },
      { inputs: ['"i e a o u"'], expected: '"imaa emaaa amaaaa omaaaaa umaaaaaa"' },
      { inputs: ['"b c d f g"'], expected: '"bmaa cmaaa dmaaaa fmaaaaa gmaaaaaa"' },
      { inputs: ['"Zoo"'], expected: '"ooZmaa"' },
      { inputs: ['"car"'], expected: '"arcmaa"' },
      { inputs: ['"Each Word"'], expected: '"Eachmaa ordWmaaa"' },
      { inputs: ['"goat"'], expected: '"oatgmaa"' },
      { inputs: ['"Apple"'], expected: '"Applemaa"' },
      { inputs: ['"x y z"'], expected: '"xmaa ymaaa zmaaaa"' },
      { inputs: ['"Hello Goat"'], expected: '"elloHmaa oatGmaaa"' },
    ],
    solutions: GOAT_SOLUTIONS,
    viz_steps: GOAT_VIZ,
  },
];

let updated = 0;
for (const f of FLAGSHIPS) {
  const { data: existing, error: selErr } = await sb.from('PGcode_problems').select('*').eq('id', f.id).maybeSingle();
  if (selErr) { console.error(`  ERROR select ${f.id}: ${selErr.message}`); continue; }
  if (!existing) { console.log(`  SKIP ${f.id} (not in DB)`); continue; }
  const row = {
    id: f.id,
    name: existing.name,
    topic_id: existing.topic_id,
    difficulty: existing.difficulty,
    description: existing.description,
    roadmap_set: existing.roadmap_set || '100',
    method_name: f.method_name,
    params: f.params,
    return_type: f.return_type,
    hints: f.hints,
    tags: f.tags,
    companies: f.companies,
    constraints: f.constraints,
    follow_up: f.follow_up,
    pattern: f.pattern,
    test_cases: f.test_cases,
    solutions: f.solutions,
    viz_steps: f.viz_steps,
  };
  const { error } = await sb.from('PGcode_problems').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error(`  ERROR upsert ${f.id}: ${error.message}`);
    const slim = { ...row };
    delete slim.companies;
    delete slim.solutions;
    delete slim.viz_steps;
    const { error: e2 } = await sb.from('PGcode_problems').upsert(slim, { onConflict: 'id' });
    if (e2) { console.error(`  ERROR slim ${f.id}: ${e2.message}`); continue; }
    console.log(`  ok ${f.id}  — slim upsert (companies/solutions/viz_steps columns missing)`);
  } else {
    console.log(`  ok ${f.id}  — ${f.test_cases.length} tests, ${f.hints.length} hints, ${Object.keys(f.solutions).length} langs, ${f.viz_steps.length} frames`);
  }
  updated += 1;
}
console.log(`\nDone. ${updated}/${FLAGSHIPS.length} flagships spliced.`);
