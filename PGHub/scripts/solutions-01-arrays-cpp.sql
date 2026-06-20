-- C++ reference solutions for arrays (8 problems × 1 approach each).
-- Applies code_cpp to rows already created by scripts/solutions-01-arrays.sql.
BEGIN;

-- ============ two-sum ============
UPDATE public."PGcode_solution_approaches"
SET code_cpp = $CPP$class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); i++) {
            int complement = target - nums[i];
            auto it = seen.find(complement);
            if (it != seen.end()) return {it->second, i};
            seen[nums[i]] = i;
        }
        return {};
    }
};
$CPP$
WHERE problem_id = 'two-sum' AND approach_number = 1;

-- ============ contains-duplicate ============
UPDATE public."PGcode_solution_approaches"
SET code_cpp = $CPP$class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        unordered_set<int> seen;
        for (int num : nums) {
            if (!seen.insert(num).second) return true;
        }
        return false;
    }
};
$CPP$
WHERE problem_id = 'contains-duplicate' AND approach_number = 1;

-- ============ valid-anagram ============
UPDATE public."PGcode_solution_approaches"
SET code_cpp = $CPP$class Solution {
public:
    bool isAnagram(string& s, string& t) {
        if (s.size() != t.size()) return false;
        int count[26] = {0};
        for (int i = 0; i < (int)s.size(); i++) {
            count[s[i] - 'a']++;
            count[t[i] - 'a']--;
        }
        for (int c : count) if (c != 0) return false;
        return true;
    }
};
$CPP$
WHERE problem_id = 'valid-anagram' AND approach_number = 1;

-- ============ group-anagrams ============
UPDATE public."PGcode_solution_approaches"
SET code_cpp = $CPP$class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string, vector<string>> groups;
        for (const string& word : strs) {
            string key(26, '0');
            for (char ch : word) key[ch - 'a']++;
            groups[key].push_back(word);
        }
        vector<vector<string>> result;
        result.reserve(groups.size());
        for (auto& kv : groups) result.push_back(move(kv.second));
        return result;
    }
};
$CPP$
WHERE problem_id = 'group-anagrams' AND approach_number = 1;

-- ============ top-k-frequent ============
UPDATE public."PGcode_solution_approaches"
SET code_cpp = $CPP$class Solution {
public:
    vector<int> topKFrequent(vector<int>& nums, int k) {
        unordered_map<int, int> freq;
        for (int n : nums) freq[n]++;
        vector<vector<int>> buckets(nums.size() + 1);
        for (auto& [num, f] : freq) buckets[f].push_back(num);
        vector<int> result;
        for (int i = (int)buckets.size() - 1; i > 0 && (int)result.size() < k; i--) {
            for (int num : buckets[i]) {
                result.push_back(num);
                if ((int)result.size() == k) return result;
            }
        }
        return result;
    }
};
$CPP$
WHERE problem_id = 'top-k-frequent' AND approach_number = 1;

-- ============ product-except-self ============
UPDATE public."PGcode_solution_approaches"
SET code_cpp = $CPP$class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        int n = nums.size();
        vector<int> answer(n, 1);
        int left = 1;
        for (int i = 0; i < n; i++) {
            answer[i] = left;
            left *= nums[i];
        }
        int right = 1;
        for (int i = n - 1; i >= 0; i--) {
            answer[i] *= right;
            right *= nums[i];
        }
        return answer;
    }
};
$CPP$
WHERE problem_id = 'product-except-self' AND approach_number = 1;

-- ============ longest-consecutive ============
UPDATE public."PGcode_solution_approaches"
SET code_cpp = $CPP$class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        unordered_set<int> s(nums.begin(), nums.end());
        int best = 0;
        for (int num : s) {
            if (s.count(num - 1)) continue;
            int current = num, length = 1;
            while (s.count(current + 1)) { current++; length++; }
            best = max(best, length);
        }
        return best;
    }
};
$CPP$
WHERE problem_id = 'longest-consecutive' AND approach_number = 1;

-- ============ encode-decode-strings ============
UPDATE public."PGcode_solution_approaches"
SET code_cpp = $CPP$class Solution {
public:
    string encode(vector<string>& strs) {
        string out;
        for (const string& w : strs) {
            out += to_string(w.size()) + "#" + w;
        }
        return out;
    }

    vector<string> decode(string& s) {
        vector<string> result;
        int i = 0, n = s.size();
        while (i < n) {
            int j = i;
            while (s[j] != '#') j++;
            int length = stoi(s.substr(i, j - i));
            result.push_back(s.substr(j + 1, length));
            i = j + 1 + length;
        }
        return result;
    }
};
$CPP$
WHERE problem_id = 'encode-decode-strings' AND approach_number = 1;

COMMIT;
