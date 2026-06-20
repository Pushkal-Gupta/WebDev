-- C++ reference solutions for sliding-window + stack (11 problems).
BEGIN;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int minPrice = INT_MAX, best = 0;
        for (int price : prices) {
            if (price < minPrice) minPrice = price;
            else if (price - minPrice > best) best = price - minPrice;
        }
        return best;
    }
};
$CPP$ WHERE problem_id = 'best-time-to-buy-sell-stock' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int lengthOfLongestSubstring(string& s) {
        unordered_set<char> window;
        int l = 0, best = 0, n = s.size();
        for (int r = 0; r < n; r++) {
            while (window.count(s[r])) {
                window.erase(s[l]);
                l++;
            }
            window.insert(s[r]);
            if (r - l + 1 > best) best = r - l + 1;
        }
        return best;
    }
};
$CPP$ WHERE problem_id = 'longest-substr-no-repeat' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int characterReplacement(string& s, int k) {
        int freq[26] = {0};
        int l = 0, maxCount = 0, best = 0, n = s.size();
        for (int r = 0; r < n; r++) {
            freq[s[r] - 'A']++;
            maxCount = max(maxCount, freq[s[r] - 'A']);
            while ((r - l + 1) - maxCount > k) {
                freq[s[l] - 'A']--;
                l++;
            }
            best = max(best, r - l + 1);
        }
        return best;
    }
};
$CPP$ WHERE problem_id = 'longest-repeating-char' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    string minWindow(string& s, string& t) {
        if (s.empty() || t.empty()) return "";
        unordered_map<char, int> need, have;
        for (char ch : t) need[ch]++;
        int required = need.size(), formed = 0, l = 0;
        int bestLen = INT_MAX, bestL = 0, bestR = 0;
        for (int r = 0; r < (int)s.size(); r++) {
            char ch = s[r];
            have[ch]++;
            if (need.count(ch) && have[ch] == need[ch]) formed++;
            while (formed == required) {
                if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; bestR = r; }
                char lc = s[l];
                have[lc]--;
                if (need.count(lc) && have[lc] < need[lc]) formed--;
                l++;
            }
        }
        return bestLen == INT_MAX ? "" : s.substr(bestL, bestR - bestL + 1);
    }
};
$CPP$ WHERE problem_id = 'min-window-substring' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool checkInclusion(string& s1, string& s2) {
        if (s1.size() > s2.size()) return false;
        int need[26] = {0}, have[26] = {0};
        for (char ch : s1) need[ch - 'a']++;
        int k = s1.size();
        for (int i = 0; i < k; i++) have[s2[i] - 'a']++;
        auto eq = [&]() {
            for (int i = 0; i < 26; i++) if (need[i] != have[i]) return false;
            return true;
        };
        if (eq()) return true;
        for (int i = k; i < (int)s2.size(); i++) {
            have[s2[i] - 'a']++;
            have[s2[i - k] - 'a']--;
            if (eq()) return true;
        }
        return false;
    }
};
$CPP$ WHERE problem_id = 'permutation-in-string' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool isValid(string& s) {
        stack<char> st;
        unordered_map<char, char> pairs = {{')','('},{']','['},{'}','{'}};
        for (char ch : s) {
            if (pairs.count(ch)) {
                if (st.empty() || st.top() != pairs[ch]) return false;
                st.pop();
            } else {
                st.push(ch);
            }
        }
        return st.empty();
    }
};
$CPP$ WHERE problem_id = 'valid-parentheses' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class MinStack {
    stack<int> st;
    stack<int> mins;
public:
    MinStack() {}

    void push(int val) {
        st.push(val);
        if (mins.empty() || val <= mins.top()) mins.push(val);
        else mins.push(mins.top());
    }
    void pop() { st.pop(); mins.pop(); }
    int top() { return st.top(); }
    int getMin() { return mins.top(); }
};
$CPP$ WHERE problem_id = 'min-stack' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int evalRPN(vector<string>& tokens) {
        stack<int> st;
        for (const string& tok : tokens) {
            if (tok.size() == 1 && string("+-*/").find(tok[0]) != string::npos) {
                int b = st.top(); st.pop();
                int a = st.top(); st.pop();
                if (tok == "+") st.push(a + b);
                else if (tok == "-") st.push(a - b);
                else if (tok == "*") st.push(a * b);
                else st.push(a / b);
            } else {
                st.push(stoi(tok));
            }
        }
        return st.top();
    }
};
$CPP$ WHERE problem_id = 'eval-rpn' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<int> dailyTemperatures(vector<int>& temperatures) {
        int n = temperatures.size();
        vector<int> answer(n, 0);
        stack<int> st;
        for (int i = 0; i < n; i++) {
            while (!st.empty() && temperatures[st.top()] < temperatures[i]) {
                int popped = st.top(); st.pop();
                answer[popped] = i - popped;
            }
            st.push(i);
        }
        return answer;
    }
};
$CPP$ WHERE problem_id = 'daily-temperatures' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int largestRectangleArea(vector<int>& heights) {
        stack<pair<int,int>> st; // (start_index, height)
        int best = 0, n = heights.size();
        for (int i = 0; i < n; i++) {
            int start = i;
            while (!st.empty() && st.top().second > heights[i]) {
                auto [idx, h] = st.top(); st.pop();
                best = max(best, h * (i - idx));
                start = idx;
            }
            st.push({start, heights[i]});
        }
        while (!st.empty()) {
            auto [i, h] = st.top(); st.pop();
            best = max(best, h * (n - i));
        }
        return best;
    }
};
$CPP$ WHERE problem_id = 'largest-rect-histogram' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int carFleet(int target, vector<int>& position, vector<int>& speed) {
        int n = position.size();
        vector<pair<int,int>> cars(n);
        for (int i = 0; i < n; i++) cars[i] = {position[i], speed[i]};
        sort(cars.begin(), cars.end(), greater<>());
        int fleets = 0;
        double prevTime = 0;
        for (auto& [pos, spd] : cars) {
            double arrival = (double)(target - pos) / spd;
            if (arrival > prevTime) {
                fleets++;
                prevTime = arrival;
            }
        }
        return fleets;
    }
};
$CPP$ WHERE problem_id = 'car-fleet' AND approach_number = 1;

COMMIT;
