-- C++ reference solutions for strings (10 problems).
BEGIN;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int lengthOfLastWord(string& s) {
        int i = s.size() - 1;
        while (i >= 0 && s[i] == ' ') i--;
        int length = 0;
        while (i >= 0 && s[i] != ' ') { length++; i--; }
        return length;
    }
};
$CPP$ WHERE problem_id = 'length-of-last-word' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    string longestCommonPrefix(vector<string>& strs) {
        if (strs.empty()) return "";
        for (int i = 0; i < (int)strs[0].size(); i++) {
            char c = strs[0][i];
            for (int j = 1; j < (int)strs.size(); j++) {
                if (i >= (int)strs[j].size() || strs[j][i] != c) {
                    return strs[0].substr(0, i);
                }
            }
        }
        return strs[0];
    }
};
$CPP$ WHERE problem_id = 'longest-common-prefix' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int romanToInt(string& s) {
        unordered_map<char, int> value = {
            {'I',1},{'V',5},{'X',10},{'L',50},{'C',100},{'D',500},{'M',1000}
        };
        int total = 0, n = s.size();
        for (int i = 0; i < n; i++) {
            int v = value[s[i]];
            if (i + 1 < n && v < value[s[i+1]]) total -= v;
            else total += v;
        }
        return total;
    }
};
$CPP$ WHERE problem_id = 'roman-to-integer' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int strStr(string& haystack, string& needle) {
        if (needle.empty()) return 0;
        int n = haystack.size(), m = needle.size();
        for (int i = 0; i <= n - m; i++) {
            if (haystack.compare(i, m, needle) == 0) return i;
        }
        return -1;
    }
};
$CPP$ WHERE problem_id = 'find-needle-haystack' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    string reverseWords(string& s) {
        vector<string> words;
        int i = 0, n = s.size();
        while (i < n) {
            while (i < n && s[i] == ' ') i++;
            int j = i;
            while (j < n && s[j] != ' ') j++;
            if (j > i) words.push_back(s.substr(i, j - i));
            i = j;
        }
        string out;
        for (int k = (int)words.size() - 1; k >= 0; k--) {
            out += words[k];
            if (k > 0) out += ' ';
        }
        return out;
    }
};
$CPP$ WHERE problem_id = 'reverse-words-in-string' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    string longestPalindrome(string& s) {
        int start = 0, best = 0, n = s.size();
        auto expand = [&](int l, int r) {
            while (l >= 0 && r < n && s[l] == s[r]) {
                if (r - l + 1 > best) { start = l; best = r - l + 1; }
                l--; r++;
            }
        };
        for (int i = 0; i < n; i++) {
            expand(i, i);
            expand(i, i + 1);
        }
        return s.substr(start, best);
    }
};
$CPP$ WHERE problem_id = 'longest-palindromic-substring' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int countSubstrings(string& s) {
        int count = 0, n = s.size();
        auto expand = [&](int l, int r) {
            while (l >= 0 && r < n && s[l] == s[r]) { count++; l--; r++; }
        };
        for (int i = 0; i < n; i++) {
            expand(i, i);
            expand(i, i + 1);
        }
        return count;
    }
};
$CPP$ WHERE problem_id = 'palindromic-substrings' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int myAtoi(string& s) {
        int i = 0, n = s.size();
        while (i < n && s[i] == ' ') i++;
        int sign = 1;
        if (i < n && (s[i] == '+' || s[i] == '-')) {
            sign = (s[i] == '-') ? -1 : 1;
            i++;
        }
        long long result = 0;
        while (i < n && isdigit(s[i])) {
            result = result * 10 + (s[i] - '0');
            if (sign * result > INT_MAX) return INT_MAX;
            if (sign * result < INT_MIN) return INT_MIN;
            i++;
        }
        return (int)(sign * result);
    }
};
$CPP$ WHERE problem_id = 'string-to-integer-atoi' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    string addBinary(string& a, string& b) {
        int i = a.size() - 1, j = b.size() - 1, carry = 0;
        string result;
        while (i >= 0 || j >= 0 || carry) {
            int total = carry;
            if (i >= 0) total += a[i--] - '0';
            if (j >= 0) total += b[j--] - '0';
            result += char('0' + (total % 2));
            carry = total / 2;
        }
        reverse(result.begin(), result.end());
        return result;
    }
};
$CPP$ WHERE problem_id = 'add-binary' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    string countAndSay(int n) {
        string term = "1";
        for (int k = 1; k < n; k++) {
            string next;
            int i = 0, m = term.size();
            while (i < m) {
                int j = i;
                while (j < m && term[j] == term[i]) j++;
                next += to_string(j - i);
                next += term[i];
                i = j;
            }
            term = move(next);
        }
        return term;
    }
};
$CPP$ WHERE problem_id = 'count-and-say' AND approach_number = 1;

COMMIT;
