-- Grow catalog 400 → 500: tries topic (+10 problems: 2E, 6M, 2H).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'longest-common-prefix-500','index-pairs-of-a-string',
  'map-sum-pairs','stream-of-characters','short-encoding-words','vowel-spellchecker','prefix-and-suffix-search','remove-sub-folders',
  'palindrome-pairs','word-search-ii-500'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'longest-common-prefix-500','index-pairs-of-a-string',
  'map-sum-pairs','stream-of-characters','short-encoding-words','vowel-spellchecker','prefix-and-suffix-search','remove-sub-folders',
  'palindrome-pairs','word-search-ii-500'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'longest-common-prefix-500','index-pairs-of-a-string',
  'map-sum-pairs','stream-of-characters','short-encoding-words','vowel-spellchecker','prefix-and-suffix-search','remove-sub-folders',
  'palindrome-pairs','word-search-ii-500'
);

-- ============================================================
-- 1) longest-common-prefix-500 (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('longest-common-prefix-500', 'tries', 'Longest Common Prefix (Trie)', 'Easy',
$$<p>Write a function to find the longest common prefix string amongst an array of strings using a Trie. If there is no common prefix, return an empty string.</p>$$,
'', ARRAY[
  'Insert all strings into a Trie.',
  'Walk the Trie from root: as long as there is exactly one child and no word ends, continue.',
  'The path traversed is the longest common prefix.'
], '500', 'https://leetcode.com/problems/longest-common-prefix/',
'longestCommonPrefix',
'[{"name":"strs","type":"List[str]"}]'::jsonb,
'str',
'[
  {"inputs":["[\"flower\",\"flow\",\"flight\"]"],"expected":"\"fl\""},
  {"inputs":["[\"dog\",\"racecar\",\"car\"]"],"expected":"\"\""},
  {"inputs":["[\"abc\",\"abc\",\"abc\"]"],"expected":"\"abc\""},
  {"inputs":["[\"a\"]"],"expected":"\"a\""}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('longest-common-prefix-500', 'python',
$PY$class Solution:
    def longestCommonPrefix(self, strs: List[str]) -> str:
        $PY$),
('longest-common-prefix-500', 'javascript',
$JS$var longestCommonPrefix = function(strs) {

};$JS$),
('longest-common-prefix-500', 'java',
$JAVA$class Solution {
    public String longestCommonPrefix(String[] strs) {

    }
}$JAVA$),
('longest-common-prefix-500', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string longestCommonPrefix(vector<string>& strs) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('longest-common-prefix-500', 1, 'Trie Walk',
'Insert all strings into a Trie. Then walk from root: the longest common prefix is the path where each node has exactly one child and is not an end-of-word node (except possibly at the end).',
$ALGO$["Build a Trie from all strings.","Walk from root. While current node has exactly 1 child and is not end-of-word: follow that child, append its character.","Return the accumulated prefix."]$ALGO$::jsonb,
$PY$class Solution:
    def longestCommonPrefix(self, strs: List[str]) -> str:
        if not strs:
            return ""
        trie = {}
        for s in strs:
            node = trie
            for c in s:
                if c not in node:
                    node[c] = {}
                node = node[c]
            node['#'] = True
        prefix = []
        node = trie
        while len(node) == 1 and '#' not in node:
            c = next(iter(node))
            prefix.append(c)
            node = node[c]
        return "".join(prefix)
$PY$,
$JS$var longestCommonPrefix = function(strs) {
    if (strs.length === 0) return "";
    const trie = {};
    for (const s of strs) {
        let node = trie;
        for (const c of s) {
            if (!node[c]) node[c] = {};
            node = node[c];
        }
        node['#'] = true;
    }
    let prefix = "";
    let node = trie;
    while (Object.keys(node).length === 1 && !node['#']) {
        const c = Object.keys(node)[0];
        prefix += c;
        node = node[c];
    }
    return prefix;
};
$JS$,
$JAVA$class Solution {
    public String longestCommonPrefix(String[] strs) {
        if (strs.length == 0) return "";
        // Simple vertical scan approach
        StringBuilder prefix = new StringBuilder();
        for (int i = 0; i < strs[0].length(); i++) {
            char c = strs[0].charAt(i);
            for (int j = 1; j < strs.length; j++) {
                if (i >= strs[j].length() || strs[j].charAt(i) != c) {
                    return prefix.toString();
                }
            }
            prefix.append(c);
        }
        return prefix.toString();
    }
}
$JAVA$,
$CPP$class Solution {
public:
    string longestCommonPrefix(vector<string>& strs) {
        if (strs.empty()) return "";
        string prefix;
        for (int i = 0; i < (int)strs[0].size(); i++) {
            char c = strs[0][i];
            for (int j = 1; j < (int)strs.size(); j++) {
                if (i >= (int)strs[j].size() || strs[j][i] != c) {
                    return prefix;
                }
            }
            prefix += c;
        }
        return prefix;
    }
};
$CPP$,
'O(S) where S = sum of all string lengths', 'O(S)');

-- ============================================================
-- 2) index-pairs-of-a-string (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('index-pairs-of-a-string', 'tries', 'Index Pairs of a String', 'Easy',
$$<p>Given a string <code>text</code> and an array of strings <code>words</code>, return all index pairs <code>[i, j]</code> such that the substring <code>text[i..j]</code> is in <code>words</code>. Return the pairs sorted by <code>i</code>, then by <code>j</code>.</p>$$,
'', ARRAY[
  'Build a Trie from all words.',
  'For each starting position in text, walk the Trie and record matches.',
  'Output pairs sorted by (i, j).'
], '500', 'https://leetcode.com/problems/index-pairs-of-a-string/',
'indexPairs',
'[{"name":"text","type":"str"},{"name":"words","type":"List[str]"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["\"thestoryofleetcodeandme\"","[\"story\",\"fleet\",\"leetcode\"]"],"expected":"[[3,7],[9,13],[10,17]]"},
  {"inputs":["\"ababa\"","[\"aba\",\"ab\"]"],"expected":"[[0,1],[0,2],[2,3],[2,4]]"},
  {"inputs":["\"hello\"","[\"world\"]"],"expected":"[]"},
  {"inputs":["\"aa\"","[\"a\"]"],"expected":"[[0,0],[1,1]]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('index-pairs-of-a-string', 'python',
$PY$class Solution:
    def indexPairs(self, text: str, words: List[str]) -> List[List[int]]:
        $PY$),
('index-pairs-of-a-string', 'javascript',
$JS$var indexPairs = function(text, words) {

};$JS$),
('index-pairs-of-a-string', 'java',
$JAVA$class Solution {
    public int[][] indexPairs(String text, String[] words) {

    }
}$JAVA$),
('index-pairs-of-a-string', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> indexPairs(string text, vector<string>& words) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('index-pairs-of-a-string', 1, 'Trie Search',
'Build a Trie from words. For each starting index in text, walk the Trie. Whenever we reach a word-end node, record [start, current_index] as a match.',
$ALGO$["Build Trie from words.","For each i from 0 to len(text)-1: walk Trie from root matching text[i], text[i+1], etc.","When a word-end is reached, add [i, j] to results.","Return sorted results."]$ALGO$::jsonb,
$PY$class Solution:
    def indexPairs(self, text: str, words: List[str]) -> List[List[int]]:
        trie = {}
        for w in words:
            node = trie
            for c in w:
                if c not in node:
                    node[c] = {}
                node = node[c]
            node['#'] = True
        result = []
        for i in range(len(text)):
            node = trie
            for j in range(i, len(text)):
                if text[j] not in node:
                    break
                node = node[text[j]]
                if '#' in node:
                    result.append([i, j])
        return result
$PY$,
$JS$var indexPairs = function(text, words) {
    const trie = {};
    for (const w of words) {
        let node = trie;
        for (const c of w) {
            if (!node[c]) node[c] = {};
            node = node[c];
        }
        node['#'] = true;
    }
    const result = [];
    for (let i = 0; i < text.length; i++) {
        let node = trie;
        for (let j = i; j < text.length; j++) {
            if (!node[text[j]]) break;
            node = node[text[j]];
            if (node['#']) result.push([i, j]);
        }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public int[][] indexPairs(String text, String[] words) {
        Map<Character, Object>[] trie = new Map[]{new HashMap<>()};
        // Build trie
        for (String w : words) {
            Map<Character, Object> node = (Map<Character, Object>) trie[0];
            for (char c : w.toCharArray()) {
                node.putIfAbsent(c, new HashMap<>());
                node = (Map<Character, Object>) node.get(c);
            }
            node.put('#', null);
        }
        List<int[]> result = new ArrayList<>();
        for (int i = 0; i < text.length(); i++) {
            Map<Character, Object> node = (Map<Character, Object>) trie[0];
            for (int j = i; j < text.length(); j++) {
                if (!node.containsKey(text.charAt(j))) break;
                node = (Map<Character, Object>) node.get(text.charAt(j));
                if (node.containsKey('#')) result.add(new int[]{i, j});
            }
        }
        return result.toArray(new int[0][]);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<int>> indexPairs(string text, vector<string>& words) {
        struct TrieNode {
            unordered_map<char, TrieNode*> children;
            bool end = false;
        };
        TrieNode* root = new TrieNode();
        for (auto& w : words) {
            TrieNode* node = root;
            for (char c : w) {
                if (!node->children[c]) node->children[c] = new TrieNode();
                node = node->children[c];
            }
            node->end = true;
        }
        vector<vector<int>> result;
        for (int i = 0; i < (int)text.size(); i++) {
            TrieNode* node = root;
            for (int j = i; j < (int)text.size(); j++) {
                if (!node->children.count(text[j])) break;
                node = node->children[text[j]];
                if (node->end) result.push_back({i, j});
            }
        }
        return result;
    }
};
$CPP$,
'O(n^2 + S) where S = total word length', 'O(S)');

-- ============================================================
-- 3) map-sum-pairs (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('map-sum-pairs', 'tries', 'Map Sum Pairs', 'Medium',
$$<p>Design a map that supports inserting a key-value pair and returning the sum of values whose key starts with a given prefix. Given a list of operations <code>["insert", key, val]</code> or <code>["sum", prefix]</code>, return the results of sum operations.</p>$$,
'', ARRAY[
  'Use a Trie where each node stores the sum of values of all keys passing through it.',
  'On insert, walk the Trie and update each node''s sum.',
  'On sum, just return the value at the prefix node.'
], '500', 'https://leetcode.com/problems/map-sum-pairs/',
'mapSum',
'[{"name":"ops","type":"List[List[str]]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[[\"insert\",\"apple\",\"3\"],[\"sum\",\"ap\"],[\"insert\",\"app\",\"2\"],[\"sum\",\"ap\"]]"],"expected":"[3,5]"},
  {"inputs":["[[\"insert\",\"a\",\"1\"],[\"sum\",\"a\"],[\"insert\",\"a\",\"5\"],[\"sum\",\"a\"]]"],"expected":"[1,5]"},
  {"inputs":["[[\"sum\",\"x\"]]"],"expected":"[0]"},
  {"inputs":["[[\"insert\",\"abc\",\"10\"],[\"insert\",\"abd\",\"20\"],[\"sum\",\"ab\"]]"],"expected":"[30]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('map-sum-pairs', 'python',
$PY$class Solution:
    def mapSum(self, ops: List[List[str]]) -> List[int]:
        $PY$),
('map-sum-pairs', 'javascript',
$JS$var mapSum = function(ops) {

};$JS$),
('map-sum-pairs', 'java',
$JAVA$class Solution {
    public List<Integer> mapSum(String[][] ops) {

    }
}$JAVA$),
('map-sum-pairs', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> mapSum(vector<vector<string>>& ops) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('map-sum-pairs', 1, 'Trie with Sum Tracking',
'Each Trie node stores the sum of values for all keys passing through it. On insert, if the key already exists, compute the delta and update all nodes along the path. On sum query, return the sum at the prefix node.',
$ALGO$["Build Trie where each node has sum field.","Insert: walk path, add delta (new_val - old_val) to each node.","Sum: walk to prefix node, return its sum (or 0 if prefix not found)."]$ALGO$::jsonb,
$PY$class Solution:
    def mapSum(self, ops: List[List[str]]) -> List[int]:
        trie = {'sum': 0}
        keys = {}
        result = []
        for op in ops:
            if op[0] == "insert":
                key, val = op[1], int(op[2])
                delta = val - keys.get(key, 0)
                keys[key] = val
                node = trie
                node['sum'] += delta
                for c in key:
                    if c not in node:
                        node[c] = {'sum': 0}
                    node = node[c]
                    node['sum'] += delta
            else:
                prefix = op[1]
                node = trie
                found = True
                for c in prefix:
                    if c not in node:
                        found = False
                        break
                    node = node[c]
                result.append(node['sum'] if found else 0)
        return result
$PY$,
$JS$var mapSum = function(ops) {
    const trie = {sum: 0};
    const keys = {};
    const result = [];
    for (const op of ops) {
        if (op[0] === "insert") {
            const key = op[1], val = Number(op[2]);
            const delta = val - (keys[key] || 0);
            keys[key] = val;
            let node = trie;
            node.sum += delta;
            for (const c of key) {
                if (!node[c]) node[c] = {sum: 0};
                node = node[c];
                node.sum += delta;
            }
        } else {
            let node = trie;
            let found = true;
            for (const c of op[1]) {
                if (!node[c]) { found = false; break; }
                node = node[c];
            }
            result.push(found ? node.sum : 0);
        }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<Integer> mapSum(String[][] ops) {
        Map<String, Integer> keys = new HashMap<>();
        int[][] trie = new int[100000][26];
        int[] sums = new int[100000];
        int cnt = 1;
        List<Integer> result = new ArrayList<>();
        for (String[] op : ops) {
            if (op[0].equals("insert")) {
                String key = op[1];
                int val = Integer.parseInt(op[2]);
                int delta = val - keys.getOrDefault(key, 0);
                keys.put(key, val);
                int node = 0;
                sums[node] += delta;
                for (char c : key.toCharArray()) {
                    int idx = c - 'a';
                    if (trie[node][idx] == 0) trie[node][idx] = cnt++;
                    node = trie[node][idx];
                    sums[node] += delta;
                }
            } else {
                String prefix = op[1];
                int node = 0;
                boolean found = true;
                for (char c : prefix.toCharArray()) {
                    int idx = c - 'a';
                    if (trie[node][idx] == 0) { found = false; break; }
                    node = trie[node][idx];
                }
                result.add(found ? sums[node] : 0);
            }
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> mapSum(vector<vector<string>>& ops) {
        struct TrieNode {
            int sum = 0;
            unordered_map<char, TrieNode*> children;
        };
        TrieNode* root = new TrieNode();
        unordered_map<string, int> keys;
        vector<int> result;
        for (auto& op : ops) {
            if (op[0] == "insert") {
                string key = op[1];
                int val = stoi(op[2]);
                int delta = val - keys[key];
                keys[key] = val;
                TrieNode* node = root;
                node->sum += delta;
                for (char c : key) {
                    if (!node->children[c]) node->children[c] = new TrieNode();
                    node = node->children[c];
                    node->sum += delta;
                }
            } else {
                TrieNode* node = root;
                bool found = true;
                for (char c : op[1]) {
                    if (!node->children.count(c)) { found = false; break; }
                    node = node->children[c];
                }
                result.push_back(found ? node->sum : 0);
            }
        }
        return result;
    }
};
$CPP$,
'O(L) per operation where L = key/prefix length', 'O(S) total characters');

-- ============================================================
-- 4) short-encoding-words (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('short-encoding-words', 'tries', 'Short Encoding of Words', 'Medium',
$$<p>A valid encoding of an array of words is any reference string <code>s</code> and array of indices such that for each word, the word is a suffix of the substring starting at its index and ending at the next <code>#</code>. Return the length of the shortest reference string <code>s</code>.</p><p>In other words, a word can be "encoded" by being a suffix of another word in the encoding. Find the minimum length encoding that covers all words.</p>$$,
'', ARRAY[
  'A word that is a suffix of another word does not need its own encoding.',
  'Build a reverse Trie (insert words reversed). Only leaf nodes need encoding.',
  'The total length is sum of (depth + 1) for each leaf node.'
], '500', 'https://leetcode.com/problems/short-encoding-of-words/',
'minimumLengthEncoding',
'[{"name":"words","type":"List[str]"}]'::jsonb,
'int',
'[
  {"inputs":["[\"time\",\"me\",\"bell\"]"],"expected":"10"},
  {"inputs":["[\"t\"]"],"expected":"2"},
  {"inputs":["[\"me\",\"time\"]"],"expected":"5"},
  {"inputs":["[\"abc\",\"bc\",\"c\"]"],"expected":"4"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('short-encoding-words', 'python',
$PY$class Solution:
    def minimumLengthEncoding(self, words: List[str]) -> int:
        $PY$),
('short-encoding-words', 'javascript',
$JS$var minimumLengthEncoding = function(words) {

};$JS$),
('short-encoding-words', 'java',
$JAVA$class Solution {
    public int minimumLengthEncoding(String[] words) {

    }
}$JAVA$),
('short-encoding-words', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minimumLengthEncoding(vector<string>& words) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('short-encoding-words', 1, 'Reverse Trie / Suffix Set',
'A word that is a suffix of another does not need separate encoding. Remove all words that are suffixes of other words. The total length is sum(len(word) + 1) for remaining words.',
$ALGO$["Deduplicate words into a set.","For each word, remove all suffixes (word[1:], word[2:], ...) from the set.","Sum len(word) + 1 for all remaining words."]$ALGO$::jsonb,
$PY$class Solution:
    def minimumLengthEncoding(self, words: List[str]) -> int:
        good = set(words)
        for word in words:
            for k in range(1, len(word)):
                good.discard(word[k:])
        return sum(len(w) + 1 for w in good)
$PY$,
$JS$var minimumLengthEncoding = function(words) {
    const good = new Set(words);
    for (const word of words) {
        for (let k = 1; k < word.length; k++) {
            good.delete(word.substring(k));
        }
    }
    let total = 0;
    for (const w of good) total += w.length + 1;
    return total;
};
$JS$,
$JAVA$class Solution {
    public int minimumLengthEncoding(String[] words) {
        Set<String> good = new HashSet<>(Arrays.asList(words));
        for (String word : words) {
            for (int k = 1; k < word.length(); k++) {
                good.remove(word.substring(k));
            }
        }
        int total = 0;
        for (String w : good) total += w.length() + 1;
        return total;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minimumLengthEncoding(vector<string>& words) {
        unordered_set<string> good(words.begin(), words.end());
        for (auto& word : words) {
            for (int k = 1; k < (int)word.size(); k++) {
                good.erase(word.substr(k));
            }
        }
        int total = 0;
        for (auto& w : good) total += w.size() + 1;
        return total;
    }
};
$CPP$,
'O(sum of word_length^2)', 'O(S)');

-- ============================================================
-- 5) stream-of-characters (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('stream-of-characters', 'tries', 'Stream of Characters', 'Medium',
$$<p>Design an algorithm that accepts a stream of characters and checks if a suffix of the characters so far matches any word in a given dictionary. Given <code>words</code> and a list of <code>chars</code> to query, return a boolean for each character indicating whether any word is a suffix match.</p>$$,
'', ARRAY[
  'Build a reverse Trie: insert each word reversed.',
  'Maintain a buffer of streamed characters.',
  'For each new character, search the reverse Trie from the latest character backward.'
], '500', 'https://leetcode.com/problems/stream-of-characters/',
'streamChecker',
'[{"name":"words","type":"List[str]"},{"name":"chars","type":"List[str]"}]'::jsonb,
'List[bool]',
'[
  {"inputs":["[\"cd\",\"f\",\"kl\"]","[\"a\",\"b\",\"c\",\"d\",\"e\",\"f\",\"g\",\"h\",\"i\",\"j\",\"k\",\"l\"]"],"expected":"[false,false,false,true,false,true,false,false,false,false,false,true]"},
  {"inputs":["[\"ab\"]","[\"a\",\"b\"]"],"expected":"[false,true]"},
  {"inputs":["[\"a\"]","[\"a\",\"b\",\"a\"]"],"expected":"[true,false,true]"},
  {"inputs":["[\"xyz\"]","[\"x\",\"y\",\"z\"]"],"expected":"[false,false,true]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('stream-of-characters', 'python',
$PY$class Solution:
    def streamChecker(self, words: List[str], chars: List[str]) -> List[bool]:
        $PY$),
('stream-of-characters', 'javascript',
$JS$var streamChecker = function(words, chars) {

};$JS$),
('stream-of-characters', 'java',
$JAVA$class Solution {
    public List<Boolean> streamChecker(String[] words, String[] chars) {

    }
}$JAVA$),
('stream-of-characters', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<bool> streamChecker(vector<string>& words, vector<string>& chars) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('stream-of-characters', 1, 'Reverse Trie',
'Insert all words reversed into a Trie. Maintain a buffer of streamed chars. For each new character, search the Trie from the latest character backward. If we hit a word-end, the answer is true.',
$ALGO$["Build reverse Trie from words.","Maintain stream buffer.","For each new char: append to buffer. Walk Trie matching buffer from end to start.","If word-end found, return true; else false."]$ALGO$::jsonb,
$PY$class Solution:
    def streamChecker(self, words: List[str], chars: List[str]) -> List[bool]:
        trie = {}
        for w in words:
            node = trie
            for c in reversed(w):
                if c not in node:
                    node[c] = {}
                node = node[c]
            node['#'] = True
        max_len = max(len(w) for w in words)
        buffer = []
        result = []
        for ch in chars:
            buffer.append(ch)
            node = trie
            found = False
            for i in range(len(buffer) - 1, max(len(buffer) - max_len - 1, -1), -1):
                if buffer[i] not in node:
                    break
                node = node[buffer[i]]
                if '#' in node:
                    found = True
                    break
            result.append(found)
        return result
$PY$,
$JS$var streamChecker = function(words, chars) {
    const trie = {};
    let maxLen = 0;
    for (const w of words) {
        maxLen = Math.max(maxLen, w.length);
        let node = trie;
        for (let i = w.length - 1; i >= 0; i--) {
            if (!node[w[i]]) node[w[i]] = {};
            node = node[w[i]];
        }
        node['#'] = true;
    }
    const buffer = [];
    const result = [];
    for (const ch of chars) {
        buffer.push(ch);
        let node = trie;
        let found = false;
        for (let i = buffer.length - 1; i >= Math.max(0, buffer.length - maxLen); i--) {
            if (!node[buffer[i]]) break;
            node = node[buffer[i]];
            if (node['#']) { found = true; break; }
        }
        result.push(found);
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<Boolean> streamChecker(String[] words, String[] chars) {
        Map<Character, Object>[] root = new Map[]{new HashMap<>()};
        int maxLen = 0;
        for (String w : words) {
            maxLen = Math.max(maxLen, w.length());
            Map node = (Map) root[0];
            for (int i = w.length() - 1; i >= 0; i--) {
                char c = w.charAt(i);
                node.putIfAbsent(c, new HashMap<>());
                node = (Map) node.get(c);
            }
            node.put('#', null);
        }
        List<Character> buffer = new ArrayList<>();
        List<Boolean> result = new ArrayList<>();
        for (String ch : chars) {
            buffer.add(ch.charAt(0));
            Map node = (Map) root[0];
            boolean found = false;
            for (int i = buffer.size() - 1; i >= Math.max(0, buffer.size() - maxLen); i--) {
                char c = buffer.get(i);
                if (!node.containsKey(c)) break;
                node = (Map) node.get(c);
                if (node.containsKey('#')) { found = true; break; }
            }
            result.add(found);
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<bool> streamChecker(vector<string>& words, vector<string>& chars) {
        struct TrieNode {
            unordered_map<char, TrieNode*> children;
            bool end = false;
        };
        TrieNode* root = new TrieNode();
        int maxLen = 0;
        for (auto& w : words) {
            maxLen = max(maxLen, (int)w.size());
            TrieNode* node = root;
            for (int i = w.size() - 1; i >= 0; i--) {
                if (!node->children[w[i]]) node->children[w[i]] = new TrieNode();
                node = node->children[w[i]];
            }
            node->end = true;
        }
        string buffer;
        vector<bool> result;
        for (auto& ch : chars) {
            buffer += ch[0];
            TrieNode* node = root;
            bool found = false;
            for (int i = buffer.size() - 1; i >= max(0, (int)buffer.size() - maxLen); i--) {
                if (!node->children.count(buffer[i])) break;
                node = node->children[buffer[i]];
                if (node->end) { found = true; break; }
            }
            result.push_back(found);
        }
        return result;
    }
};
$CPP$,
'O(Q * L) where Q = queries, L = max word length', 'O(S)');

-- ============================================================
-- 6) vowel-spellchecker (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('vowel-spellchecker', 'tries', 'Vowel Spellchecker', 'Medium',
$$<p>Given a wordlist, implement a spellchecker. For each query, find a match using these priorities: (1) exact match, (2) case-insensitive match, (3) vowel-error match (vowels are interchangeable). Return the first match found, or empty string if none.</p>$$,
'', ARRAY[
  'Use a set for exact match, a map for case-insensitive match (lowercase key).',
  'For vowel match, replace all vowels with a wildcard character and use a map.',
  'Process queries in priority order: exact, case-insensitive, vowel.'
], '500', 'https://leetcode.com/problems/vowel-spellchecker/',
'spellchecker',
'[{"name":"wordlist","type":"List[str]"},{"name":"queries","type":"List[str]"}]'::jsonb,
'List[str]',
'[
  {"inputs":["[\"KiTe\",\"kite\",\"hare\",\"Hare\"]","[\"kite\",\"Kite\",\"KiTe\",\"Hare\",\"HARE\",\"Hear\",\"hear\",\"keti\",\"keet\",\"keto\"]"],"expected":"[\"kite\",\"KiTe\",\"KiTe\",\"Hare\",\"hare\",\"\",\"\",\"KiTe\",\"\",\"KiTe\"]"},
  {"inputs":["[\"hello\"]","[\"hello\",\"HELLO\",\"hxllo\"]"],"expected":"[\"hello\",\"hello\",\"\"]"},
  {"inputs":["[\"a\"]","[\"e\"]"],"expected":"[\"a\"]"},
  {"inputs":["[\"abc\"]","[\"xyz\"]"],"expected":"[\"\"]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('vowel-spellchecker', 'python',
$PY$class Solution:
    def spellchecker(self, wordlist: List[str], queries: List[str]) -> List[str]:
        $PY$),
('vowel-spellchecker', 'javascript',
$JS$var spellchecker = function(wordlist, queries) {

};$JS$),
('vowel-spellchecker', 'java',
$JAVA$class Solution {
    public String[] spellchecker(String[] wordlist, String[] queries) {

    }
}$JAVA$),
('vowel-spellchecker', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> spellchecker(vector<string>& wordlist, vector<string>& queries) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('vowel-spellchecker', 1, 'Hash Maps with Three Levels',
'Build three lookup structures: exact set, lowercase map (first match), and devoweled map (vowels replaced with *). Check each query against all three in priority order.',
$ALGO$["Build exact_set from wordlist.","Build cap_map: lowercase(word) -> first word (only store first occurrence).","Build vowel_map: devowel(lowercase(word)) -> first word.","For each query: check exact, then cap_map[lower], then vowel_map[devowel(lower)], else empty string."]$ALGO$::jsonb,
$PY$class Solution:
    def spellchecker(self, wordlist: List[str], queries: List[str]) -> List[str]:
        def devowel(w):
            return "".join('*' if c in 'aeiou' else c for c in w)
        exact = set(wordlist)
        cap_map = {}
        vowel_map = {}
        for w in wordlist:
            low = w.lower()
            if low not in cap_map:
                cap_map[low] = w
            dv = devowel(low)
            if dv not in vowel_map:
                vowel_map[dv] = w
        result = []
        for q in queries:
            if q in exact:
                result.append(q)
            elif q.lower() in cap_map:
                result.append(cap_map[q.lower()])
            elif devowel(q.lower()) in vowel_map:
                result.append(vowel_map[devowel(q.lower())])
            else:
                result.append("")
        return result
$PY$,
$JS$var spellchecker = function(wordlist, queries) {
    const devowel = (w) => w.replace(/[aeiou]/g, '*');
    const exact = new Set(wordlist);
    const capMap = {}, vowelMap = {};
    for (const w of wordlist) {
        const low = w.toLowerCase();
        if (!(low in capMap)) capMap[low] = w;
        const dv = devowel(low);
        if (!(dv in vowelMap)) vowelMap[dv] = w;
    }
    return queries.map(q => {
        if (exact.has(q)) return q;
        const low = q.toLowerCase();
        if (low in capMap) return capMap[low];
        const dv = devowel(low);
        if (dv in vowelMap) return vowelMap[dv];
        return "";
    });
};
$JS$,
$JAVA$class Solution {
    public String[] spellchecker(String[] wordlist, String[] queries) {
        Set<String> exact = new HashSet<>(Arrays.asList(wordlist));
        Map<String, String> capMap = new HashMap<>(), vowelMap = new HashMap<>();
        for (String w : wordlist) {
            String low = w.toLowerCase();
            capMap.putIfAbsent(low, w);
            vowelMap.putIfAbsent(devowel(low), w);
        }
        String[] result = new String[queries.length];
        for (int i = 0; i < queries.length; i++) {
            String q = queries[i], low = q.toLowerCase();
            if (exact.contains(q)) result[i] = q;
            else if (capMap.containsKey(low)) result[i] = capMap.get(low);
            else if (vowelMap.containsKey(devowel(low))) result[i] = vowelMap.get(devowel(low));
            else result[i] = "";
        }
        return result;
    }
    private String devowel(String s) {
        return s.replaceAll("[aeiou]", "*");
    }
}
$JAVA$,
$CPP$class Solution {
    string devowel(const string& s) {
        string r = s;
        for (char& c : r) if (c=='a'||c=='e'||c=='i'||c=='o'||c=='u') c = '*';
        return r;
    }
public:
    vector<string> spellchecker(vector<string>& wordlist, vector<string>& queries) {
        unordered_set<string> exact(wordlist.begin(), wordlist.end());
        unordered_map<string, string> capMap, vowelMap;
        for (auto& w : wordlist) {
            string low = w;
            transform(low.begin(), low.end(), low.begin(), ::tolower);
            capMap.emplace(low, w);
            vowelMap.emplace(devowel(low), w);
        }
        vector<string> result;
        for (auto& q : queries) {
            if (exact.count(q)) { result.push_back(q); continue; }
            string low = q;
            transform(low.begin(), low.end(), low.begin(), ::tolower);
            auto it = capMap.find(low);
            if (it != capMap.end()) { result.push_back(it->second); continue; }
            auto it2 = vowelMap.find(devowel(low));
            if (it2 != vowelMap.end()) { result.push_back(it2->second); continue; }
            result.push_back("");
        }
        return result;
    }
};
$CPP$,
'O(W * L + Q * L)', 'O(W * L)');

-- ============================================================
-- 7) prefix-and-suffix-search (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('prefix-and-suffix-search', 'tries', 'Prefix and Suffix Search', 'Medium',
$$<p>Design a data structure that is initialized with a list of words. Given a <code>prefix</code> and a <code>suffix</code>, find the word with the highest index that has the given prefix and suffix. Return -1 if none. Given a list of [prefix, suffix] queries, return the answer for each.</p>$$,
'', ARRAY[
  'For each word, insert all possible "{suffix}#{word}" combinations into a Trie.',
  'To query, search for "{suffix}#{prefix}" in the Trie.',
  'Store the highest index at each Trie node.'
], '500', 'https://leetcode.com/problems/prefix-and-suffix-search/',
'prefixSuffixSearch',
'[{"name":"words","type":"List[str]"},{"name":"queries","type":"List[List[str]]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[\"apple\"]","[[\"a\",\"e\"]]"],"expected":"[0]"},
  {"inputs":["[\"apple\",\"app\"]","[[\"ap\",\"le\"],[\"ap\",\"p\"]]"],"expected":"[0,1]"},
  {"inputs":["[\"test\"]","[[\"xyz\",\"abc\"]]"],"expected":"[-1]"},
  {"inputs":["[\"ab\",\"abc\",\"abd\"]","[[\"a\",\"b\"],[\"a\",\"d\"]]"],"expected":"[0,2]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('prefix-and-suffix-search', 'python',
$PY$class Solution:
    def prefixSuffixSearch(self, words: List[str], queries: List[List[str]]) -> List[int]:
        $PY$),
('prefix-and-suffix-search', 'javascript',
$JS$var prefixSuffixSearch = function(words, queries) {

};$JS$),
('prefix-and-suffix-search', 'java',
$JAVA$class Solution {
    public int[] prefixSuffixSearch(String[] words, String[][] queries) {

    }
}$JAVA$),
('prefix-and-suffix-search', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> prefixSuffixSearch(vector<string>& words, vector<vector<string>>& queries) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('prefix-and-suffix-search', 1, 'Wrapped Trie',
'For each word at index i, insert all strings of the form suffix[j:] + "#" + word into a Trie (for each suffix starting position j). At each node, store the word index. To query (prefix, suffix), search for suffix + "#" + prefix in the Trie.',
$ALGO$["For each word i, for each j from 0 to len(word): insert word[j:] + \"#\" + word into Trie. Store index i at each node.","Query (prefix, suffix): search for suffix + \"#\" + prefix. Return stored index at final node, or -1."]$ALGO$::jsonb,
$PY$class Solution:
    def prefixSuffixSearch(self, words: List[str], queries: List[List[str]]) -> List[int]:
        trie = {}
        for i, word in enumerate(words):
            wrapped = word + '#' + word
            for j in range(len(word) + 1):
                node = trie
                for c in wrapped[j:]:
                    if c not in node:
                        node[c] = {}
                    node = node[c]
                    node['$'] = i
        result = []
        for prefix, suffix in queries:
            node = trie
            search = suffix + '#' + prefix
            found = True
            for c in search:
                if c not in node:
                    found = False
                    break
                node = node[c]
            result.append(node.get('$', -1) if found else -1)
        return result
$PY$,
$JS$var prefixSuffixSearch = function(words, queries) {
    const trie = {};
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wrapped = word + '#' + word;
        for (let j = 0; j <= word.length; j++) {
            let node = trie;
            for (let k = j; k < wrapped.length; k++) {
                const c = wrapped[k];
                if (!node[c]) node[c] = {};
                node = node[c];
                node['$'] = i;
            }
        }
    }
    return queries.map(([prefix, suffix]) => {
        let node = trie;
        const search = suffix + '#' + prefix;
        for (const c of search) {
            if (!node[c]) return -1;
            node = node[c];
        }
        return node['$'] !== undefined ? node['$'] : -1;
    });
};
$JS$,
$JAVA$class Solution {
    public int[] prefixSuffixSearch(String[] words, String[][] queries) {
        Map<String, Integer> map = new HashMap<>();
        for (int i = 0; i < words.length; i++) {
            String word = words[i];
            for (int j = 0; j <= word.length(); j++) {
                for (int k = 0; k <= word.length(); k++) {
                    map.put(word.substring(0, k) + "#" + word.substring(j), i);
                }
            }
        }
        int[] result = new int[queries.length];
        for (int q = 0; q < queries.length; q++) {
            result[q] = map.getOrDefault(queries[q][0] + "#" + queries[q][1], -1);
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> prefixSuffixSearch(vector<string>& words, vector<vector<string>>& queries) {
        unordered_map<string, int> mp;
        for (int i = 0; i < (int)words.size(); i++) {
            string& w = words[i];
            for (int j = 0; j <= (int)w.size(); j++) {
                for (int k = 0; k <= (int)w.size(); k++) {
                    mp[w.substr(0, k) + "#" + w.substr(j)] = i;
                }
            }
        }
        vector<int> result;
        for (auto& q : queries) {
            string key = q[0] + "#" + q[1];
            auto it = mp.find(key);
            result.push_back(it != mp.end() ? it->second : -1);
        }
        return result;
    }
};
$CPP$,
'O(N * L^2 + Q * L)', 'O(N * L^2)');

-- ============================================================
-- 8) remove-sub-folders (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('remove-sub-folders', 'tries', 'Remove Sub-Folders from the Filesystem', 'Medium',
$$<p>Given a list of folders in a filesystem, remove all sub-folders and return the folders after removing. A folder is a sub-folder if it starts with another folder path followed by <code>/</code>.</p>$$,
'', ARRAY[
  'Sort folders lexicographically.',
  'After sorting, a sub-folder will immediately follow its parent.',
  'Track the last added folder; skip any folder that starts with it followed by /.'
], '500', 'https://leetcode.com/problems/remove-sub-folders-from-the-filesystem/',
'removeSubfolders',
'[{"name":"folder","type":"List[str]"}]'::jsonb,
'List[str]',
'[
  {"inputs":["[\"/a\",\"/a/b\",\"/c/d\",\"/c/d/e\",\"/c/f\"]"],"expected":"[\"/a\",\"/c/d\",\"/c/f\"]"},
  {"inputs":["[\"/a\",\"/a/b/c\",\"/a/b/d\"]"],"expected":"[\"/a\"]"},
  {"inputs":["[\"/a/b/c\",\"/a/b/ca\",\"/a/b/d\"]"],"expected":"[\"/a/b/c\",\"/a/b/ca\",\"/a/b/d\"]"},
  {"inputs":["[\"/a\"]"],"expected":"[\"/a\"]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('remove-sub-folders', 'python',
$PY$class Solution:
    def removeSubfolders(self, folder: List[str]) -> List[str]:
        $PY$),
('remove-sub-folders', 'javascript',
$JS$var removeSubfolders = function(folder) {

};$JS$),
('remove-sub-folders', 'java',
$JAVA$class Solution {
    public List<String> removeSubfolders(String[] folder) {

    }
}$JAVA$),
('remove-sub-folders', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> removeSubfolders(vector<string>& folder) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('remove-sub-folders', 1, 'Sort and Skip',
'Sort folders. After sorting, any sub-folder immediately follows its parent. We track the last kept folder and skip any folder that starts with it followed by "/".',
$ALGO$["Sort folders lexicographically.","Initialize result with first folder as last.","For each subsequent folder: if it does not start with last + \"/\", add to result and update last.","Return result."]$ALGO$::jsonb,
$PY$class Solution:
    def removeSubfolders(self, folder: List[str]) -> List[str]:
        folder.sort()
        result = [folder[0]]
        for i in range(1, len(folder)):
            if not folder[i].startswith(result[-1] + '/'):
                result.append(folder[i])
        return result
$PY$,
$JS$var removeSubfolders = function(folder) {
    folder.sort();
    const result = [folder[0]];
    for (let i = 1; i < folder.length; i++) {
        if (!folder[i].startsWith(result[result.length - 1] + '/')) {
            result.push(folder[i]);
        }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<String> removeSubfolders(String[] folder) {
        Arrays.sort(folder);
        List<String> result = new ArrayList<>();
        result.add(folder[0]);
        for (int i = 1; i < folder.length; i++) {
            String last = result.get(result.size() - 1);
            if (!folder[i].startsWith(last + "/")) {
                result.add(folder[i]);
            }
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<string> removeSubfolders(vector<string>& folder) {
        sort(folder.begin(), folder.end());
        vector<string> result = {folder[0]};
        for (int i = 1; i < (int)folder.size(); i++) {
            string last = result.back() + "/";
            if (folder[i].substr(0, last.size()) != last) {
                result.push_back(folder[i]);
            }
        }
        return result;
    }
};
$CPP$,
'O(n * L * log n)', 'O(n * L)');

-- ============================================================
-- 9) palindrome-pairs (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('palindrome-pairs', 'tries', 'Palindrome Pairs', 'Hard',
$$<p>Given a list of <strong>unique</strong> words, find all pairs of distinct indices <code>(i, j)</code> such that the concatenation of <code>words[i] + words[j]</code> is a palindrome. Return the pairs.</p>$$,
'', ARRAY[
  'Build a Trie of reversed words.',
  'For each word, search the Trie. If we finish the word in the Trie and the remaining Trie path is a palindrome, or if we finish the Trie path and the remaining word is a palindrome, it is a valid pair.',
  'Hash map approach: for each word, check if any prefix/suffix is in the reversed-word map and the remaining part is a palindrome.'
], '500', 'https://leetcode.com/problems/palindrome-pairs/',
'palindromePairs',
'[{"name":"words","type":"List[str]"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["[\"abcd\",\"dcba\",\"lls\",\"s\",\"sssll\"]"],"expected":"[[0,1],[1,0],[2,4],[3,2]]"},
  {"inputs":["[\"bat\",\"tab\",\"cat\"]"],"expected":"[[0,1],[1,0]]"},
  {"inputs":["[\"a\",\"\"]"],"expected":"[[0,1],[1,0]]"},
  {"inputs":["[\"abc\",\"def\"]"],"expected":"[]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('palindrome-pairs', 'python',
$PY$class Solution:
    def palindromePairs(self, words: List[str]) -> List[List[int]]:
        $PY$),
('palindrome-pairs', 'javascript',
$JS$var palindromePairs = function(words) {

};$JS$),
('palindrome-pairs', 'java',
$JAVA$class Solution {
    public List<List<Integer>> palindromePairs(String[] words) {

    }
}$JAVA$),
('palindrome-pairs', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> palindromePairs(vector<string>& words) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('palindrome-pairs', 1, 'Hash Map with Prefix/Suffix Check',
'Build a map from reversed word to index. For each word, check all splits: if the left half''s reverse is in the map and the right half is a palindrome, or the right half''s reverse is in the map and the left half is a palindrome, we have a valid pair.',
$ALGO$["Build reverse_map: reversed(word) -> index for all words.","For each word i, for each split point k from 0 to len(word):","Left = word[:k], right = word[k:].","If left is a palindrome and reversed(right) is in map (and index != i), add [map[reversed(right)], i].","If right is a palindrome and reversed(left) is in map (and index != i), add [i, map[reversed(left)]].","Deduplicate results."]$ALGO$::jsonb,
$PY$class Solution:
    def palindromePairs(self, words: List[str]) -> List[List[int]]:
        def is_palindrome(s):
            return s == s[::-1]
        word_map = {w: i for i, w in enumerate(words)}
        result = set()
        for i, word in enumerate(words):
            for k in range(len(word) + 1):
                left, right = word[:k], word[k:]
                if is_palindrome(left):
                    rev_right = right[::-1]
                    if rev_right in word_map and word_map[rev_right] != i:
                        result.add((word_map[rev_right], i))
                if is_palindrome(right):
                    rev_left = left[::-1]
                    if rev_left in word_map and word_map[rev_left] != i:
                        result.add((i, word_map[rev_left]))
        return [list(p) for p in result]
$PY$,
$JS$var palindromePairs = function(words) {
    const isPalin = (s) => { let l = 0, r = s.length - 1; while (l < r) { if (s[l++] !== s[r--]) return false; } return true; };
    const wordMap = {};
    for (let i = 0; i < words.length; i++) wordMap[words[i]] = i;
    const result = new Set();
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        for (let k = 0; k <= word.length; k++) {
            const left = word.substring(0, k), right = word.substring(k);
            if (isPalin(left)) {
                const revRight = right.split("").reverse().join("");
                if (revRight in wordMap && wordMap[revRight] !== i) {
                    result.add(wordMap[revRight] + "," + i);
                }
            }
            if (isPalin(right)) {
                const revLeft = left.split("").reverse().join("");
                if (revLeft in wordMap && wordMap[revLeft] !== i) {
                    result.add(i + "," + wordMap[revLeft]);
                }
            }
        }
    }
    return [...result].map(s => s.split(",").map(Number));
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> palindromePairs(String[] words) {
        Map<String, Integer> wordMap = new HashMap<>();
        for (int i = 0; i < words.length; i++) wordMap.put(words[i], i);
        Set<List<Integer>> result = new HashSet<>();
        for (int i = 0; i < words.length; i++) {
            String word = words[i];
            for (int k = 0; k <= word.length(); k++) {
                String left = word.substring(0, k), right = word.substring(k);
                if (isPalin(left)) {
                    String revRight = new StringBuilder(right).reverse().toString();
                    if (wordMap.containsKey(revRight) && wordMap.get(revRight) != i) {
                        result.add(Arrays.asList(wordMap.get(revRight), i));
                    }
                }
                if (isPalin(right)) {
                    String revLeft = new StringBuilder(left).reverse().toString();
                    if (wordMap.containsKey(revLeft) && wordMap.get(revLeft) != i) {
                        result.add(Arrays.asList(i, wordMap.get(revLeft)));
                    }
                }
            }
        }
        return new ArrayList<>(result);
    }
    private boolean isPalin(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) { if (s.charAt(l++) != s.charAt(r--)) return false; }
        return true;
    }
}
$JAVA$,
$CPP$class Solution {
    bool isPalin(const string& s) {
        int l = 0, r = s.size() - 1;
        while (l < r) { if (s[l++] != s[r--]) return false; }
        return true;
    }
public:
    vector<vector<int>> palindromePairs(vector<string>& words) {
        unordered_map<string, int> wordMap;
        for (int i = 0; i < (int)words.size(); i++) wordMap[words[i]] = i;
        set<vector<int>> result;
        for (int i = 0; i < (int)words.size(); i++) {
            string& word = words[i];
            for (int k = 0; k <= (int)word.size(); k++) {
                string left = word.substr(0, k), right = word.substr(k);
                if (isPalin(left)) {
                    string revRight(right.rbegin(), right.rend());
                    auto it = wordMap.find(revRight);
                    if (it != wordMap.end() && it->second != i) {
                        result.insert({it->second, i});
                    }
                }
                if (isPalin(right)) {
                    string revLeft(left.rbegin(), left.rend());
                    auto it = wordMap.find(revLeft);
                    if (it != wordMap.end() && it->second != i) {
                        result.insert({i, it->second});
                    }
                }
            }
        }
        return vector<vector<int>>(result.begin(), result.end());
    }
};
$CPP$,
'O(n * L^2)', 'O(n * L)');

-- ============================================================
-- 10) word-search-ii-500 (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('word-search-ii-500', 'tries', 'Word Search II', 'Hard',
$$<p>Given an <code>m x n</code> board of characters and a list of strings <code>words</code>, return all words on the board. Each word must be constructed from letters of sequentially adjacent cells (horizontal or vertical), where the same cell cannot be used more than once in a word.</p>$$,
'', ARRAY[
  'Build a Trie from the word list.',
  'For each cell on the board, start a DFS guided by the Trie.',
  'When a word-end node is reached, add the word to results. Prune explored Trie branches.'
], '500', 'https://leetcode.com/problems/word-search-ii/',
'findWords',
'[{"name":"board","type":"List[List[str]]"},{"name":"words","type":"List[str]"}]'::jsonb,
'List[str]',
'[
  {"inputs":["[[\"o\",\"a\",\"a\",\"n\"],[\"e\",\"t\",\"a\",\"e\"],[\"i\",\"h\",\"k\",\"r\"],[\"i\",\"f\",\"l\",\"v\"]]","[\"oath\",\"pea\",\"eat\",\"rain\"]"],"expected":"[\"eat\",\"oath\"]"},
  {"inputs":["[[\"a\",\"b\"],[\"c\",\"d\"]]","[\"abcb\"]"],"expected":"[]"},
  {"inputs":["[[\"a\"]]","[\"a\"]"],"expected":"[\"a\"]"},
  {"inputs":["[[\"a\",\"a\"]]","[\"aaa\"]"],"expected":"[]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('word-search-ii-500', 'python',
$PY$class Solution:
    def findWords(self, board: List[List[str]], words: List[str]) -> List[str]:
        $PY$),
('word-search-ii-500', 'javascript',
$JS$var findWords = function(board, words) {

};$JS$),
('word-search-ii-500', 'java',
$JAVA$class Solution {
    public List<String> findWords(char[][] board, String[] words) {

    }
}$JAVA$),
('word-search-ii-500', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('word-search-ii-500', 1, 'Trie + DFS Backtracking',
'Build a Trie from all words. DFS from each cell guided by the Trie. When we reach a word-end, record it. Prune Trie branches that have been fully explored to avoid redundant work.',
$ALGO$["Build Trie from words, storing the word at end nodes.","For each cell (i,j): if board[i][j] is in Trie root, start DFS.","DFS: mark cell visited. If node has word, add to result. Explore 4 neighbors if they match Trie children.","Unmark cell. Remove empty Trie children (pruning)."]$ALGO$::jsonb,
$PY$class Solution:
    def findWords(self, board: List[List[str]], words: List[str]) -> List[str]:
        trie = {}
        for w in words:
            node = trie
            for c in w:
                if c not in node:
                    node[c] = {}
                node = node[c]
            node['$'] = w
        m, n = len(board), len(board[0])
        result = []
        def dfs(i, j, node):
            c = board[i][j]
            if c not in node:
                return
            child = node[c]
            if '$' in child:
                result.append(child.pop('$'))
            board[i][j] = '#'
            for di, dj in [(0,1),(0,-1),(1,0),(-1,0)]:
                ni, nj = i + di, j + dj
                if 0 <= ni < m and 0 <= nj < n and board[ni][nj] != '#':
                    dfs(ni, nj, child)
            board[i][j] = c
            if not child:
                del node[c]
        for i in range(m):
            for j in range(n):
                dfs(i, j, trie)
        return result
$PY$,
$JS$var findWords = function(board, words) {
    const trie = {};
    for (const w of words) {
        let node = trie;
        for (const c of w) {
            if (!node[c]) node[c] = {};
            node = node[c];
        }
        node['$'] = w;
    }
    const m = board.length, n = board[0].length;
    const result = [];
    const dfs = (i, j, node) => {
        const c = board[i][j];
        if (!node[c]) return;
        const child = node[c];
        if (child['$']) { result.push(child['$']); delete child['$']; }
        board[i][j] = '#';
        for (const [di, dj] of [[0,1],[0,-1],[1,0],[-1,0]]) {
            const ni = i+di, nj = j+dj;
            if (ni >= 0 && ni < m && nj >= 0 && nj < n && board[ni][nj] !== '#') {
                dfs(ni, nj, child);
            }
        }
        board[i][j] = c;
        if (Object.keys(child).length === 0) delete node[c];
    };
    for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++)
            dfs(i, j, trie);
    return result;
};
$JS$,
$JAVA$class Solution {
    int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};
    public List<String> findWords(char[][] board, String[] words) {
        Map<Character, Object>[] root = new Map[]{new HashMap<>()};
        for (String w : words) {
            Map node = (Map) root[0];
            for (char c : w.toCharArray()) {
                node.putIfAbsent(c, new HashMap<>());
                node = (Map) node.get(c);
            }
            node.put('$', w);
        }
        List<String> result = new ArrayList<>();
        int m = board.length, n = board[0].length;
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                dfs(board, i, j, (Map) root[0], result, m, n);
        return result;
    }
    void dfs(char[][] board, int i, int j, Map node, List<String> result, int m, int n) {
        char c = board[i][j];
        if (!node.containsKey(c)) return;
        Map child = (Map) node.get(c);
        if (child.containsKey('$')) { result.add((String) child.remove('$')); }
        board[i][j] = '#';
        for (int[] d : dirs) {
            int ni = i+d[0], nj = j+d[1];
            if (ni >= 0 && ni < m && nj >= 0 && nj < n && board[ni][nj] != '#') {
                dfs(board, ni, nj, child, result, m, n);
            }
        }
        board[i][j] = c;
        if (child.isEmpty()) node.remove(c);
    }
}
$JAVA$,
$CPP$class Solution {
    struct TrieNode {
        unordered_map<char, TrieNode*> children;
        string word;
    };
    int dirs[4][2] = {{0,1},{0,-1},{1,0},{-1,0}};
public:
    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {
        TrieNode* root = new TrieNode();
        for (auto& w : words) {
            TrieNode* node = root;
            for (char c : w) {
                if (!node->children[c]) node->children[c] = new TrieNode();
                node = node->children[c];
            }
            node->word = w;
        }
        int m = board.size(), n = board[0].size();
        vector<string> result;
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                dfs(board, i, j, root, result, m, n);
        return result;
    }
    void dfs(vector<vector<char>>& board, int i, int j, TrieNode* node, vector<string>& result, int m, int n) {
        char c = board[i][j];
        if (!node->children.count(c)) return;
        TrieNode* child = node->children[c];
        if (!child->word.empty()) { result.push_back(child->word); child->word.clear(); }
        board[i][j] = '#';
        for (auto& d : dirs) {
            int ni = i+d[0], nj = j+d[1];
            if (ni >= 0 && ni < m && nj >= 0 && nj < n && board[ni][nj] != '#') {
                dfs(board, ni, nj, child, result, m, n);
            }
        }
        board[i][j] = c;
        if (child->children.empty()) node->children.erase(c);
    }
};
$CPP$,
'O(m * n * 4^L) where L = max word length', 'O(S) Trie space');

COMMIT;
