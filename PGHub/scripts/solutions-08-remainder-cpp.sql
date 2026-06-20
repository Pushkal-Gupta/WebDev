-- C++ reference solutions for the 103 remaining approaches (seeded via
-- various later batch migrations). Translated from the existing code_python.
BEGIN;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<vector<string>> accountsMerge(vector<vector<string>>& accounts) {
        int n = accounts.size();
        vector<int> parent(n), rank_(n, 0);
        iota(parent.begin(), parent.end(), 0);
        function<int(int)> find = [&](int x) {
            while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
            return x;
        };
        auto unite = [&](int x, int y) {
            int px = find(x), py = find(y);
            if (px == py) return;
            if (rank_[px] < rank_[py]) swap(px, py);
            parent[py] = px;
            if (rank_[px] == rank_[py]) rank_[px]++;
        };
        unordered_map<string, int> emailToAccount;
        for (int i = 0; i < n; i++) {
            for (int j = 1; j < (int)accounts[i].size(); j++) {
                const string& email = accounts[i][j];
                auto it = emailToAccount.find(email);
                if (it != emailToAccount.end()) unite(i, it->second);
                else emailToAccount[email] = i;
            }
        }
        unordered_map<int, vector<string>> groups;
        for (auto& [email, idx] : emailToAccount) groups[find(idx)].push_back(email);
        vector<vector<string>> result;
        for (auto& [idx, emails] : groups) {
            sort(emails.begin(), emails.end());
            vector<string> row = {accounts[idx][0]};
            row.insert(row.end(), emails.begin(), emails.end());
            result.push_back(move(row));
        }
        sort(result.begin(), result.end());
        return result;
    }
};
$CPP$ WHERE problem_id = 'accounts-merge' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        ListNode dummy(0);
        ListNode* current = &dummy;
        int carry = 0;
        while (l1 || l2 || carry) {
            int v1 = l1 ? l1->val : 0;
            int v2 = l2 ? l2->val : 0;
            int total = v1 + v2 + carry;
            carry = total / 10;
            current->next = new ListNode(total % 10);
            current = current->next;
            if (l1) l1 = l1->next;
            if (l2) l2 = l2->next;
        }
        return dummy.next;
    }
};
$CPP$ WHERE problem_id = 'add-two-numbers' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<int> asteroidCollision(vector<int>& asteroids) {
        vector<int> stack;
        for (int ast : asteroids) {
            bool alive = true;
            while (alive && ast < 0 && !stack.empty() && stack.back() > 0) {
                if (stack.back() < -ast) {
                    stack.pop_back();
                } else if (stack.back() == -ast) {
                    stack.pop_back();
                    alive = false;
                } else {
                    alive = false;
                }
            }
            if (alive) stack.push_back(ast);
        }
        return stack;
    }
};
$CPP$ WHERE problem_id = 'asteroid-collision' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool isBalanced(TreeNode* root) {
        return height(root) != -1;
    }
private:
    int height(TreeNode* node) {
        if (!node) return 0;
        int left = height(node->left);
        if (left == -1) return -1;
        int right = height(node->right);
        if (right == -1) return -1;
        if (abs(left - right) > 1) return -1;
        return 1 + max(left, right);
    }
};
$CPP$ WHERE problem_id = 'balanced-binary-tree' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int search(vector<int>& nums, int target) {
        int left = 0, right = nums.size() - 1;
        while (left <= right) {
            int mid = (left + right) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
};
$CPP$ WHERE problem_id = 'binary-search' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<int> rightSideView(TreeNode* root) {
        vector<int> result;
        if (!root) return result;
        queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            int size = q.size();
            for (int i = 0; i < size; i++) {
                TreeNode* node = q.front(); q.pop();
                if (i == size - 1) result.push_back(node->val);
                if (node->left) q.push(node->left);
                if (node->right) q.push(node->right);
            }
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'binary-tree-right-side' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int maxCoins(vector<int>& nums) {
        vector<int> arr = {1};
        arr.insert(arr.end(), nums.begin(), nums.end());
        arr.push_back(1);
        int n = arr.size();
        vector<vector<int>> dp(n, vector<int>(n, 0));
        for (int length = 2; length < n; length++) {
            for (int i = 0; i < n - length; i++) {
                int j = i + length;
                for (int k = i + 1; k < j; k++) {
                    dp[i][j] = max(dp[i][j], dp[i][k] + dp[k][j] + arr[i] * arr[k] * arr[j]);
                }
            }
        }
        return dp[0][n - 1];
    }
};
$CPP$ WHERE problem_id = 'burst-balloons' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool checkStraightLine(vector<vector<int>>& coordinates) {
        int x0 = coordinates[0][0], y0 = coordinates[0][1];
        int x1 = coordinates[1][0], y1 = coordinates[1][1];
        int dx = x1 - x0, dy = y1 - y0;
        for (int i = 2; i < (int)coordinates.size(); i++) {
            int x = coordinates[i][0], y = coordinates[i][1];
            if ((long long)dx * (y - y0) != (long long)dy * (x - x0)) return false;
        }
        return true;
    }
};
$CPP$ WHERE problem_id = 'check-if-straight-line' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int climbStairs(int n, int k) {
        vector<int> dp(n + 1, 0);
        dp[0] = 1;
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= min(k, i); j++) {
                dp[i] += dp[i - j];
            }
        }
        return dp[n];
    }
};
$CPP$ WHERE problem_id = 'climbing-stairs-k' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int change(int amount, vector<int>& coins) {
        vector<int> dp(amount + 1, 0);
        dp[0] = 1;
        for (int coin : coins) {
            for (int j = coin; j <= amount; j++) {
                dp[j] += dp[j - coin];
            }
        }
        return dp[amount];
    }
};
$CPP$ WHERE problem_id = 'coin-change-2' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<vector<int>> combinationSum2(vector<int>& candidates, int target) {
        sort(candidates.begin(), candidates.end());
        vector<vector<int>> result;
        vector<int> path;
        function<void(int, int)> backtrack = [&](int start, int remaining) {
            if (remaining == 0) { result.push_back(path); return; }
            for (int i = start; i < (int)candidates.size(); i++) {
                if (i > start && candidates[i] == candidates[i - 1]) continue;
                if (candidates[i] > remaining) break;
                path.push_back(candidates[i]);
                backtrack(i + 1, remaining - candidates[i]);
                path.pop_back();
            }
        };
        backtrack(0, target);
        return result;
    }
};
$CPP$ WHERE problem_id = 'combination-sum-ii' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int countComponents(int n, vector<vector<int>>& edges) {
        vector<int> parent(n), rank_(n, 0);
        iota(parent.begin(), parent.end(), 0);
        int components = n;
        function<int(int)> find = [&](int x) {
            while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
            return x;
        };
        for (auto& e : edges) {
            int pa = find(e[0]), pb = find(e[1]);
            if (pa != pb) {
                if (rank_[pa] < rank_[pb]) swap(pa, pb);
                parent[pb] = pa;
                if (rank_[pa] == rank_[pb]) rank_[pa]++;
                components--;
            }
        }
        return components;
    }
};
$CPP$ WHERE problem_id = 'connected-components' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {
        unordered_map<int, int> inorderMap;
        for (int i = 0; i < (int)inorder.size(); i++) inorderMap[inorder[i]] = i;
        function<TreeNode*(int, int, int, int)> build = [&](int preStart, int preEnd, int inStart, int inEnd) -> TreeNode* {
            if (preStart > preEnd) return nullptr;
            int rootVal = preorder[preStart];
            TreeNode* root = new TreeNode(rootVal);
            int rootIdx = inorderMap[rootVal];
            int leftSize = rootIdx - inStart;
            root->left = build(preStart + 1, preStart + leftSize, inStart, rootIdx - 1);
            root->right = build(preStart + leftSize + 1, preEnd, rootIdx + 1, inEnd);
            return root;
        };
        return build(0, preorder.size() - 1, 0, inorder.size() - 1);
    }
};
$CPP$ WHERE problem_id = 'construct-from-preorder-inorder' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int countVowelStrings(int n) {
        vector<int> dp(5, 1);
        for (int i = 1; i < n; i++) {
            for (int j = 1; j < 5; j++) dp[j] += dp[j - 1];
        }
        int sum = 0;
        for (int v : dp) sum += v;
        return sum;
    }
};
$CPP$ WHERE problem_id = 'count-sorted-vowel-strings' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<int> findOrder(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> graph(numCourses);
        vector<int> indeg(numCourses, 0);
        for (auto& p : prerequisites) {
            graph[p[1]].push_back(p[0]);
            indeg[p[0]]++;
        }
        priority_queue<int, vector<int>, greater<int>> heap;
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) heap.push(i);
        vector<int> result;
        while (!heap.empty()) {
            int node = heap.top(); heap.pop();
            result.push_back(node);
            for (int n : graph[node]) {
                if (--indeg[n] == 0) heap.push(n);
            }
        }
        return (int)result.size() == numCourses ? result : vector<int>();
    }
};
$CPP$ WHERE problem_id = 'course-schedule-ii' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    string decodeString(string& s) {
        stack<pair<string, int>> st;
        string current;
        int num = 0;
        for (char c : s) {
            if (isdigit(c)) {
                num = num * 10 + (c - '0');
            } else if (c == '[') {
                st.push({current, num});
                current = "";
                num = 0;
            } else if (c == ']') {
                auto [prev, k] = st.top(); st.pop();
                string repeated;
                for (int i = 0; i < k; i++) repeated += current;
                current = prev + repeated;
            } else {
                current += c;
            }
        }
        return current;
    }
};
$CPP$ WHERE problem_id = 'decode-string' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int numDecodings(string& s) {
        if (s.empty() || s[0] == '0') return 0;
        int n = s.size();
        vector<int> dp(n + 1, 0);
        dp[0] = 1; dp[1] = 1;
        for (int i = 2; i <= n; i++) {
            if (s[i - 1] != '0') dp[i] += dp[i - 1];
            int two = stoi(s.substr(i - 2, 2));
            if (two >= 10 && two <= 26) dp[i] += dp[i - 2];
        }
        return dp[n];
    }
};
$CPP$ WHERE problem_id = 'decode-ways' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class MyCircularQueue {
    vector<int> data;
    int head = 0, count = 0, capacity;
public:
    MyCircularQueue(int k) : data(k), capacity(k) {}
    bool enQueue(int value) {
        if (count == capacity) return false;
        data[(head + count) % capacity] = value;
        count++;
        return true;
    }
    bool deQueue() {
        if (count == 0) return false;
        head = (head + 1) % capacity;
        count--;
        return true;
    }
    int Front() { return count == 0 ? -1 : data[head]; }
    int Rear() { return count == 0 ? -1 : data[(head + count - 1) % capacity]; }
    bool isEmpty() { return count == 0; }
    bool isFull() { return count == capacity; }
};
$CPP$ WHERE problem_id = 'design-circular-queue' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
    int diameter = 0;
    int depth(TreeNode* node) {
        if (!node) return 0;
        int left = depth(node->left);
        int right = depth(node->right);
        diameter = max(diameter, left + right);
        return 1 + max(left, right);
    }
public:
    int diameterOfBinaryTree(TreeNode* root) {
        depth(root);
        return diameter;
    }
};
$CPP$ WHERE problem_id = 'diameter-binary-tree' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int numDistinct(string& s, string& t) {
        int m = s.size(), n = t.size();
        vector<vector<long long>> dp(m + 1, vector<long long>(n + 1, 0));
        for (int i = 0; i <= m; i++) dp[i][0] = 1;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                dp[i][j] = dp[i - 1][j];
                if (s[i - 1] == t[j - 1]) dp[i][j] += dp[i - 1][j - 1];
            }
        }
        return (int)dp[m][n];
    }
};
$CPP$ WHERE problem_id = 'distinct-subsequences' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    string predictPartyVictory(string& senate) {
        int n = senate.size();
        queue<int> radiant, dire;
        for (int i = 0; i < n; i++) {
            if (senate[i] == 'R') radiant.push(i);
            else dire.push(i);
        }
        while (!radiant.empty() && !dire.empty()) {
            int r = radiant.front(); radiant.pop();
            int d = dire.front(); dire.pop();
            if (r < d) radiant.push(r + n);
            else dire.push(d + n);
        }
        return !radiant.empty() ? "Radiant" : "Dire";
    }
};
$CPP$ WHERE problem_id = 'dota2-senate' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int fib(int n) {
        if (n <= 1) return n;
        int a = 0, b = 1;
        for (int i = 2; i <= n; i++) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }
};
$CPP$ WHERE problem_id = 'fibonacci-number' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class MedianFinder {
    priority_queue<int> small;                                    // max-heap
    priority_queue<int, vector<int>, greater<int>> large;         // min-heap
public:
    MedianFinder() {}
    void addNum(int num) {
        small.push(num);
        large.push(small.top()); small.pop();
        if (large.size() > small.size()) {
            small.push(large.top()); large.pop();
        }
    }
    double findMedian() {
        if (small.size() > large.size()) return small.top();
        return (small.top() + large.top()) / 2.0;
    }
};
$CPP$ WHERE problem_id = 'find-median-data-stream' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<int> searchRange(vector<int>& nums, int target) {
        auto findBound = [&](bool isFirst) {
            int left = 0, right = (int)nums.size() - 1, bound = -1;
            while (left <= right) {
                int mid = (left + right) / 2;
                if (nums[mid] == target) {
                    bound = mid;
                    if (isFirst) right = mid - 1;
                    else left = mid + 1;
                } else if (nums[mid] < target) left = mid + 1;
                else right = mid - 1;
            }
            return bound;
        };
        return {findBound(true), findBound(false)};
    }
};
$CPP$ WHERE problem_id = 'first-last-position' AND approach_number = 1;

-- flatten-nested-list-iterator: the Python uses isinstance to detect nested
-- lists, which has no direct analogue with vector<string> input; a faithful
-- reference requires the LeetCode NestedInteger interface.
UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$/**
 * // This is the interface that allows for creating nested lists.
 * class NestedInteger {
 *   public:
 *     bool isInteger() const;
 *     int getInteger() const;
 *     const vector<NestedInteger> &getList() const;
 * };
 */
class NestedIterator {
    vector<int> flat;
    int idx = 0;

    void flatten(const vector<NestedInteger>& list) {
        for (const auto& item : list) {
            if (item.isInteger()) flat.push_back(item.getInteger());
            else flatten(item.getList());
        }
    }
public:
    NestedIterator(vector<NestedInteger>& nestedList) { flatten(nestedList); }
    int next()   { return flat[idx++]; }
    bool hasNext() { return idx < (int)flat.size(); }
};
$CPP$ WHERE problem_id = 'flatten-nested-list-iterator' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int totalFruit(vector<int>& fruits) {
        unordered_map<int, int> count;
        int left = 0, maxLen = 0;
        for (int right = 0; right < (int)fruits.size(); right++) {
            count[fruits[right]]++;
            while ((int)count.size() > 2) {
                if (--count[fruits[left]] == 0) count.erase(fruits[left]);
                left++;
            }
            maxLen = max(maxLen, right - left + 1);
        }
        return maxLen;
    }
};
$CPP$ WHERE problem_id = 'fruit-into-baskets' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<string> generateParenthesis(int n) {
        vector<string> result;
        function<void(string, int, int)> backtrack = [&](string current, int o, int c) {
            if ((int)current.size() == 2 * n) { result.push_back(current); return; }
            if (o < n) backtrack(current + '(', o + 1, c);
            if (c < o) backtrack(current + ')', o, c + 1);
        };
        backtrack("", 0, 0);
        sort(result.begin(), result.end());
        return result;
    }
};
$CPP$ WHERE problem_id = 'generate-parentheses' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool validTree(int n, vector<vector<int>>& edges) {
        if ((int)edges.size() != n - 1) return false;
        vector<int> parent(n), rank_(n, 0);
        iota(parent.begin(), parent.end(), 0);
        function<int(int)> find = [&](int x) {
            while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
            return x;
        };
        for (auto& e : edges) {
            int pa = find(e[0]), pb = find(e[1]);
            if (pa == pb) return false;
            if (rank_[pa] < rank_[pb]) swap(pa, pb);
            parent[pb] = pa;
            if (rank_[pa] == rank_[pb]) rank_[pa]++;
        }
        return true;
    }
};
$CPP$ WHERE problem_id = 'graph-valid-tree' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
    int robLinear(const vector<int>& houses) {
        int prev2 = 0, prev1 = 0;
        for (int h : houses) {
            int curr = max(prev1, prev2 + h);
            prev2 = prev1;
            prev1 = curr;
        }
        return prev1;
    }
public:
    int rob(vector<int>& nums) {
        if (nums.size() == 1) return nums[0];
        vector<int> a(nums.begin(), nums.end() - 1);
        vector<int> b(nums.begin() + 1, nums.end());
        return max(robLinear(a), robLinear(b));
    }
};
$CPP$ WHERE problem_id = 'house-robber-ii' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class MyQueue {
    stack<int> inS, outS;
    void move() {
        if (outS.empty()) {
            while (!inS.empty()) { outS.push(inS.top()); inS.pop(); }
        }
    }
public:
    MyQueue() {}
    void push(int x) { inS.push(x); }
    int pop() { move(); int v = outS.top(); outS.pop(); return v; }
    int peek() { move(); return outS.top(); }
    bool empty() { return inS.empty() && outS.empty(); }
};
$CPP$ WHERE problem_id = 'implement-queue-stacks' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class MyStack {
    queue<int> q;
public:
    MyStack() {}
    void push(int x) {
        q.push(x);
        for (int i = 0; i < (int)q.size() - 1; i++) {
            q.push(q.front()); q.pop();
        }
    }
    int pop() { int v = q.front(); q.pop(); return v; }
    int top() { return q.front(); }
    bool empty() { return q.empty(); }
};
$CPP$ WHERE problem_id = 'implement-stack-queues' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    string intToRoman(int num) {
        vector<pair<int, string>> pairs = {
            {1000, "M"}, {900, "CM"}, {500, "D"}, {400, "CD"},
            {100, "C"}, {90, "XC"}, {50, "L"}, {40, "XL"},
            {10, "X"}, {9, "IX"}, {5, "V"}, {4, "IV"}, {1, "I"}
        };
        string result;
        for (auto& [value, symbol] : pairs) {
            while (num >= value) {
                result += symbol;
                num -= value;
            }
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'integer-to-roman' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool isInterleave(string& s1, string& s2, string& s3) {
        int m = s1.size(), n = s2.size();
        if (m + n != (int)s3.size()) return false;
        vector<vector<bool>> dp(m + 1, vector<bool>(n + 1, false));
        dp[0][0] = true;
        for (int i = 1; i <= m; i++) dp[i][0] = dp[i - 1][0] && s1[i - 1] == s3[i - 1];
        for (int j = 1; j <= n; j++) dp[0][j] = dp[0][j - 1] && s2[j - 1] == s3[j - 1];
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                dp[i][j] = (dp[i - 1][j] && s1[i - 1] == s3[i + j - 1])
                        || (dp[i][j - 1] && s2[j - 1] == s3[i + j - 1]);
            }
        }
        return dp[m][n];
    }
};
$CPP$ WHERE problem_id = 'interleaving-string' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<vector<int>> intervalIntersection(vector<vector<int>>& firstList, vector<vector<int>>& secondList) {
        vector<vector<int>> result;
        int i = 0, j = 0;
        while (i < (int)firstList.size() && j < (int)secondList.size()) {
            int lo = max(firstList[i][0], secondList[j][0]);
            int hi = min(firstList[i][1], secondList[j][1]);
            if (lo <= hi) result.push_back({lo, hi});
            if (firstList[i][1] < secondList[j][1]) i++;
            else j++;
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'interval-list-intersections' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int maxEvents(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[1] < b[1]; });
        int count = 0, end = INT_MIN;
        for (auto& iv : intervals) {
            if (iv[0] >= end) { count++; end = iv[1]; }
        }
        return count;
    }
};
$CPP$ WHERE problem_id = 'interval-scheduling-maximization' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int jump(vector<int>& nums) {
        int jumps = 0, curEnd = 0, farthest = 0;
        for (int i = 0; i < (int)nums.size() - 1; i++) {
            farthest = max(farthest, i + nums[i]);
            if (i == curEnd) {
                jumps++;
                curEnd = farthest;
            }
        }
        return jumps;
    }
};
$CPP$ WHERE problem_id = 'jump-game-ii' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {
        sort(points.begin(), points.end(),
             [](const vector<int>& a, const vector<int>& b) {
                 int da = a[0]*a[0] + a[1]*a[1];
                 int db = b[0]*b[0] + b[1]*b[1];
                 if (da != db) return da < db;
                 if (a[0] != b[0]) return a[0] < b[0];
                 return a[1] < b[1];
             });
        return vector<vector<int>>(points.begin(), points.begin() + k);
    }
};
$CPP$ WHERE problem_id = 'k-closest-origin' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int kthSmallest(TreeNode* root, int k) {
        stack<TreeNode*> st;
        TreeNode* current = root;
        while (current || !st.empty()) {
            while (current) { st.push(current); current = current->left; }
            current = st.top(); st.pop();
            if (--k == 0) return current->val;
            current = current->right;
        }
        return -1;
    }
};
$CPP$ WHERE problem_id = 'kth-smallest-bst' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<string> letterCombinations(string& digits) {
        if (digits.empty()) return {};
        vector<string> phone = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
        vector<string> result;
        string path;
        function<void(int)> backtrack = [&](int idx) {
            if (idx == (int)digits.size()) { result.push_back(path); return; }
            for (char letter : phone[digits[idx] - '0']) {
                path.push_back(letter);
                backtrack(idx + 1);
                path.pop_back();
            }
        };
        backtrack(0);
        sort(result.begin(), result.end());
        return result;
    }
};
$CPP$ WHERE problem_id = 'letter-combinations' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    string longestDiverseString(int a, int b, int c) {
        priority_queue<pair<int, char>> heap;
        if (a > 0) heap.push({a, 'a'});
        if (b > 0) heap.push({b, 'b'});
        if (c > 0) heap.push({c, 'c'});
        string result;
        while (!heap.empty()) {
            auto [cnt1, ch1] = heap.top(); heap.pop();
            int n = result.size();
            if (n >= 2 && result[n - 1] == ch1 && result[n - 2] == ch1) {
                if (heap.empty()) break;
                auto [cnt2, ch2] = heap.top(); heap.pop();
                result += ch2;
                cnt2--;
                if (cnt2 > 0) heap.push({cnt2, ch2});
                heap.push({cnt1, ch1});
            } else {
                result += ch1;
                cnt1--;
                if (cnt1 > 0) heap.push({cnt1, ch1});
            }
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'longest-happy-string' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int longestPalindromeSubseq(string& s) {
        int n = s.size();
        vector<vector<int>> dp(n, vector<int>(n, 0));
        for (int i = 0; i < n; i++) dp[i][i] = 1;
        for (int length = 2; length <= n; length++) {
            for (int i = 0; i <= n - length; i++) {
                int j = i + length - 1;
                if (s[i] == s[j]) dp[i][j] = dp[i + 1][j - 1] + 2;
                else dp[i][j] = max(dp[i + 1][j], dp[i][j - 1]);
            }
        }
        return dp[0][n - 1];
    }
};
$CPP$ WHERE problem_id = 'longest-palindromic-subseq' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int longestSubarray(vector<int>& nums) {
        int left = 0, zeros = 0, best = 0;
        for (int right = 0; right < (int)nums.size(); right++) {
            if (nums[right] == 0) zeros++;
            while (zeros > 1) {
                if (nums[left] == 0) zeros--;
                left++;
            }
            best = max(best, right - left);
        }
        return best;
    }
};
$CPP$ WHERE problem_id = 'longest-subarray-ones-deletion' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    string longestWord(vector<string>& words) {
        sort(words.begin(), words.end());
        unordered_set<string> built = {""};
        string answer;
        for (const string& word : words) {
            if (built.count(word.substr(0, word.size() - 1))) {
                built.insert(word);
                if (word.size() > answer.size()) answer = word;
            }
        }
        return answer;
    }
};
$CPP$ WHERE problem_id = 'longest-word-dictionary' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
    TreeNode* dfs(TreeNode* node, int p, int q) {
        if (!node) return nullptr;
        if (node->val == p || node->val == q) return node;
        TreeNode* left = dfs(node->left, p, q);
        TreeNode* right = dfs(node->right, p, q);
        if (left && right) return node;
        return left ? left : right;
    }
public:
    int lowestCommonAncestor(TreeNode* root, int p, int q) {
        return dfs(root, p, q)->val;
    }
};
$CPP$ WHERE problem_id = 'lowest-common-ancestor' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class LRUCache {
    int cap;
    list<pair<int, int>> items;                                       // (key, value), front = MRU
    unordered_map<int, list<pair<int, int>>::iterator> index;
public:
    LRUCache(int capacity) : cap(capacity) {}
    int get(int key) {
        auto it = index.find(key);
        if (it == index.end()) return -1;
        items.splice(items.begin(), items, it->second);
        return it->second->second;
    }
    void put(int key, int value) {
        auto it = index.find(key);
        if (it != index.end()) {
            it->second->second = value;
            items.splice(items.begin(), items, it->second);
            return;
        }
        if ((int)items.size() == cap) {
            index.erase(items.back().first);
            items.pop_back();
        }
        items.push_front({key, value});
        index[key] = items.begin();
    }
};
$CPP$ WHERE problem_id = 'lru-cache' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int majorityElement(vector<int>& nums) {
        int candidate = 0, count = 0;
        for (int num : nums) {
            if (count == 0) candidate = num;
            count += (num == candidate) ? 1 : -1;
        }
        return candidate;
    }
};
$CPP$ WHERE problem_id = 'majority-element' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int longestOnes(vector<int>& nums, int k) {
        int left = 0, zeros = 0, maxLen = 0;
        for (int right = 0; right < (int)nums.size(); right++) {
            if (nums[right] == 0) zeros++;
            while (zeros > k) {
                if (nums[left] == 0) zeros--;
                left++;
            }
            maxLen = max(maxLen, right - left + 1);
        }
        return maxLen;
    }
};
$CPP$ WHERE problem_id = 'max-consecutive-ones-iii' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int maxPoints(vector<vector<int>>& points) {
        int n = points.size();
        if (n <= 2) return n;
        int best = 2;
        for (int i = 0; i < n; i++) {
            unordered_map<long long, int> slopes;
            for (int j = i + 1; j < n; j++) {
                int dx = points[j][0] - points[i][0];
                int dy = points[j][1] - points[i][1];
                int g = __gcd(abs(dx), abs(dy));
                if (g != 0) { dx /= g; dy /= g; }
                if (dx < 0) { dx = -dx; dy = -dy; }
                else if (dx == 0) dy = abs(dy);
                long long key = (long long)dx * 100001 + dy;
                best = max(best, ++slopes[key] + 1);
            }
        }
        return best;
    }
};
$CPP$ WHERE problem_id = 'max-points-on-line' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int maxProduct(vector<int>& nums) {
        int curMax = nums[0], curMin = nums[0], result = nums[0];
        for (int i = 1; i < (int)nums.size(); i++) {
            int num = nums[i];
            if (num < 0) swap(curMax, curMin);
            curMax = max(num, curMax * num);
            curMin = min(num, curMin * num);
            result = max(result, curMax);
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'max-product-subarray' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        if (nums1.size() > nums2.size()) swap(nums1, nums2);
        int m = nums1.size(), n = nums2.size();
        int left = 0, right = m;
        while (left <= right) {
            int i = (left + right) / 2;
            int j = (m + n + 1) / 2 - i;
            int maxLeft1 = (i == 0) ? INT_MIN : nums1[i - 1];
            int minRight1 = (i == m) ? INT_MAX : nums1[i];
            int maxLeft2 = (j == 0) ? INT_MIN : nums2[j - 1];
            int minRight2 = (j == n) ? INT_MAX : nums2[j];
            if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
                if ((m + n) % 2 == 1) return max(maxLeft1, maxLeft2);
                return (max(maxLeft1, maxLeft2) + min(minRight1, minRight2)) / 2.0;
            } else if (maxLeft1 > minRight2) right = i - 1;
            else left = i + 1;
        }
        return 0.0;
    }
};
$CPP$ WHERE problem_id = 'median-two-sorted' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool canAttendMeetings(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        for (int i = 1; i < (int)intervals.size(); i++) {
            if (intervals[i][0] < intervals[i - 1][1]) return false;
        }
        return true;
    }
};
$CPP$ WHERE problem_id = 'meeting-rooms-i' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<int> mergeKLists(vector<vector<int>>& lists) {
        priority_queue<tuple<int,int,int>, vector<tuple<int,int,int>>, greater<>> heap;
        for (int i = 0; i < (int)lists.size(); i++) {
            if (!lists[i].empty()) heap.push({lists[i][0], i, 0});
        }
        vector<int> result;
        while (!heap.empty()) {
            auto [val, listIdx, elemIdx] = heap.top(); heap.pop();
            result.push_back(val);
            if (elemIdx + 1 < (int)lists[listIdx].size()) {
                heap.push({lists[listIdx][elemIdx + 1], listIdx, elemIdx + 1});
            }
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'merge-k-sorted-lists' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<int> sortArray(vector<int>& nums) {
        if (nums.size() <= 1) return nums;
        int mid = nums.size() / 2;
        vector<int> left(nums.begin(), nums.begin() + mid);
        vector<int> right(nums.begin() + mid, nums.end());
        left = sortArray(left);
        right = sortArray(right);
        vector<int> result;
        result.reserve(nums.size());
        int i = 0, j = 0;
        while (i < (int)left.size() && j < (int)right.size()) {
            if (left[i] <= right[j]) result.push_back(left[i++]);
            else result.push_back(right[j++]);
        }
        while (i < (int)left.size()) result.push_back(left[i++]);
        while (j < (int)right.size()) result.push_back(right[j++]);
        return result;
    }
};
$CPP$ WHERE problem_id = 'merge-sort-array' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int minCostClimbingStairs(vector<int>& cost) {
        int prev2 = 0, prev1 = 0;
        for (int i = 2; i <= (int)cost.size(); i++) {
            int curr = min(prev1 + cost[i - 1], prev2 + cost[i - 2]);
            prev2 = prev1;
            prev1 = curr;
        }
        return prev1;
    }
};
$CPP$ WHERE problem_id = 'min-cost-climbing-stairs' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int minCostConnectPoints(vector<vector<int>>& points) {
        int n = points.size();
        vector<bool> visited(n, false);
        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> heap;
        heap.push({0, 0});
        int total = 0, connected = 0;
        while (connected < n) {
            auto [cost, i] = heap.top(); heap.pop();
            if (visited[i]) continue;
            visited[i] = true;
            total += cost;
            connected++;
            for (int j = 0; j < n; j++) {
                if (!visited[j]) {
                    int dist = abs(points[i][0] - points[j][0]) + abs(points[i][1] - points[j][1]);
                    heap.push({dist, j});
                }
            }
        }
        return total;
    }
};
$CPP$ WHERE problem_id = 'min-cost-connect-points' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int minAreaRect(vector<vector<int>>& points) {
        set<pair<int,int>> pts;
        for (auto& p : points) pts.insert({p[0], p[1]});
        int minArea = INT_MAX;
        int n = points.size();
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                int x1 = points[i][0], y1 = points[i][1];
                int x2 = points[j][0], y2 = points[j][1];
                if (x1 != x2 && y1 != y2) {
                    if (pts.count({x1, y2}) && pts.count({x2, y1})) {
                        minArea = min(minArea, abs(x1 - x2) * abs(y1 - y2));
                    }
                }
            }
        }
        return minArea == INT_MAX ? 0 : minArea;
    }
};
$CPP$ WHERE problem_id = 'minimum-area-rectangle' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int findMinArrowShots(vector<vector<int>>& points) {
        sort(points.begin(), points.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[1] < b[1]; });
        int arrows = 1;
        long long arrowPos = points[0][1];
        for (int i = 1; i < (int)points.size(); i++) {
            if (points[i][0] > arrowPos) {
                arrows++;
                arrowPos = points[i][1];
            }
        }
        return arrows;
    }
};
$CPP$ WHERE problem_id = 'minimum-arrows' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int findPlatform(vector<int>& arrival, vector<int>& departure) {
        sort(arrival.begin(), arrival.end());
        sort(departure.begin(), departure.end());
        int n = arrival.size(), i = 0, j = 0;
        int platforms = 0, maxPlatforms = 0;
        while (i < n) {
            if (arrival[i] <= departure[j]) {
                platforms++;
                maxPlatforms = max(maxPlatforms, platforms);
                i++;
            } else {
                platforms--;
                j++;
            }
        }
        return maxPlatforms;
    }
};
$CPP$ WHERE problem_id = 'minimum-number-of-platforms' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int minSubArrayLen(int target, vector<int>& nums) {
        int left = 0, currentSum = 0, minLen = INT_MAX;
        for (int right = 0; right < (int)nums.size(); right++) {
            currentSum += nums[right];
            while (currentSum >= target) {
                minLen = min(minLen, right - left + 1);
                currentSum -= nums[left++];
            }
        }
        return minLen == INT_MAX ? 0 : minLen;
    }
};
$CPP$ WHERE problem_id = 'minimum-size-subarray' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int missingNumber(vector<int>& nums) {
        int n = nums.size();
        long long sum = (long long)n * (n + 1) / 2;
        for (int x : nums) sum -= x;
        return (int)sum;
    }
};
$CPP$ WHERE problem_id = 'missing-number' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int missingNumber(vector<int>& nums) {
        int result = nums.size();
        for (int i = 0; i < (int)nums.size(); i++) {
            result ^= i ^ nums[i];
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'missing-number-xor' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class MovingAverage {
    queue<int> q;
    int size;
    long long total = 0;
public:
    MovingAverage(int size_) : size(size_) {}
    double next(int val) {
        q.push(val);
        total += val;
        if ((int)q.size() > size) {
            total -= q.front();
            q.pop();
        }
        return (double)total / q.size();
    }
};
$CPP$ WHERE problem_id = 'moving-average' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    string multiply(string& num1, string& num2) {
        int m = num1.size(), n = num2.size();
        vector<int> result(m + n, 0);
        for (int i = m - 1; i >= 0; i--) {
            for (int j = n - 1; j >= 0; j--) {
                int mul = (num1[i] - '0') * (num2[j] - '0');
                int p1 = i + j, p2 = i + j + 1;
                int total = mul + result[p2];
                result[p2] = total % 10;
                result[p1] += total / 10;
            }
        }
        string s;
        for (int d : result) s += char('0' + d);
        size_t start = s.find_first_not_of('0');
        return start == string::npos ? "0" : s.substr(start);
    }
};
$CPP$ WHERE problem_id = 'multiply-strings' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
    int count = 0;
    void backtrack(int row, int n, unordered_set<int>& cols, unordered_set<int>& diags, unordered_set<int>& antiDiags) {
        if (row == n) { count++; return; }
        for (int col = 0; col < n; col++) {
            if (cols.count(col) || diags.count(row - col) || antiDiags.count(row + col)) continue;
            cols.insert(col);
            diags.insert(row - col);
            antiDiags.insert(row + col);
            backtrack(row + 1, n, cols, diags, antiDiags);
            cols.erase(col);
            diags.erase(row - col);
            antiDiags.erase(row + col);
        }
    }
public:
    int totalNQueens(int n) {
        unordered_set<int> cols, diags, antiDiags;
        backtrack(0, n, cols, diags, antiDiags);
        return count;
    }
};
$CPP$ WHERE problem_id = 'n-queens' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<int> nextGreaterElement(vector<int>& nums1, vector<int>& nums2) {
        stack<int> st;
        unordered_map<int, int> nge;
        for (int num : nums2) {
            while (!st.empty() && st.top() < num) {
                nge[st.top()] = num;
                st.pop();
            }
            st.push(num);
        }
        vector<int> result;
        result.reserve(nums1.size());
        for (int x : nums1) result.push_back(nge.count(x) ? nge[x] : -1);
        return result;
    }
};
$CPP$ WHERE problem_id = 'next-greater-element' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class RecentCounter {
    queue<int> q;
public:
    RecentCounter() {}
    int ping(int t) {
        q.push(t);
        while (q.front() < t - 3000) q.pop();
        return q.size();
    }
};
$CPP$ WHERE problem_id = 'number-recent-calls' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
    bool isPalindrome(const string& sub) {
        int l = 0, r = sub.size() - 1;
        while (l < r) { if (sub[l++] != sub[r--]) return false; }
        return true;
    }
public:
    vector<vector<string>> partition(string& s) {
        vector<vector<string>> result;
        vector<string> path;
        function<void(int)> backtrack = [&](int start) {
            if (start == (int)s.size()) { result.push_back(path); return; }
            for (int end = start + 1; end <= (int)s.size(); end++) {
                string sub = s.substr(start, end - start);
                if (isPalindrome(sub)) {
                    path.push_back(sub);
                    backtrack(end);
                    path.pop_back();
                }
            }
        };
        backtrack(0);
        sort(result.begin(), result.end());
        return result;
    }
};
$CPP$ WHERE problem_id = 'palindrome-partitioning' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool canPartition(vector<int>& nums) {
        int total = 0;
        for (int n : nums) total += n;
        if (total % 2 != 0) return false;
        int target = total / 2;
        vector<bool> dp(target + 1, false);
        dp[0] = true;
        for (int num : nums) {
            for (int s = target; s >= num; s--) {
                dp[s] = dp[s] || dp[s - num];
            }
        }
        return dp[target];
    }
};
$CPP$ WHERE problem_id = 'partition-equal-subset' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<int> partitionLabels(string& s) {
        int last[26] = {0};
        for (int i = 0; i < (int)s.size(); i++) last[s[i] - 'a'] = i;
        vector<int> result;
        int start = 0, end = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            end = max(end, last[s[i] - 'a']);
            if (i == end) {
                result.push_back(end - start + 1);
                start = i + 1;
            }
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'partition-labels' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<vector<int>> generate(int numRows) {
        vector<vector<int>> result = {{1}};
        for (int i = 1; i < numRows; i++) {
            const vector<int>& prev = result.back();
            vector<int> row = {1};
            for (int j = 1; j < i; j++) row.push_back(prev[j - 1] + prev[j]);
            row.push_back(1);
            result.push_back(move(row));
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'pascals-triangle' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<int> plusOne(vector<int>& digits) {
        for (int i = digits.size() - 1; i >= 0; i--) {
            if (digits[i] < 9) {
                digits[i]++;
                return digits;
            }
            digits[i] = 0;
        }
        digits.insert(digits.begin(), 1);
        return digits;
    }
};
$CPP$ WHERE problem_id = 'plus-one' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
    double helper(double x, long long n) {
        if (n == 0) return 1.0;
        double half = helper(x, n / 2);
        if (n % 2 == 0) return half * half;
        return half * half * x;
    }
public:
    double myPow(double x, int n) {
        long long N = n;
        if (N < 0) { x = 1 / x; N = -N; }
        return helper(x, N);
    }
};
$CPP$ WHERE problem_id = 'pow-x-n' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool isPowerOfThree(int n) {
        if (n <= 0) return false;
        while (n > 1) {
            if (n % 3 != 0) return false;
            n /= 3;
        }
        return true;
    }
};
$CPP$ WHERE problem_id = 'power-of-three' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }
};
$CPP$ WHERE problem_id = 'power-of-two' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<vector<int>> subsets(vector<int>& nums) {
        int n = nums.size();
        vector<vector<int>> result;
        for (int i = 0; i < (1 << n); i++) {
            vector<int> subset;
            for (int j = 0; j < n; j++) {
                if (i & (1 << j)) subset.push_back(nums[j]);
            }
            sort(subset.begin(), subset.end());
            result.push_back(move(subset));
        }
        sort(result.begin(), result.end());
        return result;
    }
};
$CPP$ WHERE problem_id = 'power-set-iterative' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<string> findItinerary(vector<vector<string>>& tickets) {
        map<string, vector<string>, greater<string>> graph;
        {
            vector<vector<string>> sorted_tickets = tickets;
            sort(sorted_tickets.rbegin(), sorted_tickets.rend());
            for (auto& t : sorted_tickets) graph[t[0]].push_back(t[1]);
        }
        vector<string> stack = {"JFK"}, result;
        while (!stack.empty()) {
            while (!graph[stack.back()].empty()) {
                string nxt = graph[stack.back()].back();
                graph[stack.back()].pop_back();
                stack.push_back(nxt);
            }
            result.push_back(stack.back());
            stack.pop_back();
        }
        reverse(result.begin(), result.end());
        return result;
    }
};
$CPP$ WHERE problem_id = 'reconstruct-itinerary' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool isRectangleOverlap(vector<int>& rec1, vector<int>& rec2) {
        return max(rec1[0], rec2[0]) < min(rec1[2], rec2[2])
            && max(rec1[1], rec2[1]) < min(rec1[3], rec2[3]);
    }
};
$CPP$ WHERE problem_id = 'rectangle-overlap' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<int> findRedundantConnection(vector<vector<int>>& edges) {
        int n = edges.size();
        vector<int> parent(n + 1), rank_(n + 1, 0);
        iota(parent.begin(), parent.end(), 0);
        function<int(int)> find = [&](int x) {
            while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
            return x;
        };
        for (auto& e : edges) {
            int pa = find(e[0]), pb = find(e[1]);
            if (pa == pb) return e;
            if (rank_[pa] < rank_[pb]) swap(pa, pb);
            parent[pb] = pa;
            if (rank_[pa] == rank_[pb]) rank_[pa]++;
        }
        return {};
    }
};
$CPP$ WHERE problem_id = 'redundant-connection' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool isMatch(string& s, string& p) {
        int m = s.size(), n = p.size();
        vector<vector<bool>> dp(m + 1, vector<bool>(n + 1, false));
        dp[0][0] = true;
        for (int j = 1; j <= n; j++) {
            if (p[j - 1] == '*') dp[0][j] = dp[0][j - 2];
        }
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (p[j - 1] == s[i - 1] || p[j - 1] == '.') {
                    dp[i][j] = dp[i - 1][j - 1];
                } else if (p[j - 1] == '*') {
                    dp[i][j] = dp[i][j - 2];
                    if (p[j - 2] == s[i - 1] || p[j - 2] == '.') {
                        dp[i][j] = dp[i][j] || dp[i - 1][j];
                    }
                }
            }
        }
        return dp[m][n];
    }
};
$CPP$ WHERE problem_id = 'regular-expression-matching' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    string removeDuplicates(string& s) {
        string stack;
        for (char c : s) {
            if (!stack.empty() && stack.back() == c) stack.pop_back();
            else stack += c;
        }
        return stack;
    }
};
$CPP$ WHERE problem_id = 'remove-all-adjacent-duplicates' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int removeElement(vector<int>& nums, int val) {
        int k = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            if (nums[i] != val) nums[k++] = nums[i];
        }
        return k;
    }
};
$CPP$ WHERE problem_id = 'remove-element' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    string removeKdigits(string& num, int k) {
        string stack;
        for (char d : num) {
            while (k > 0 && !stack.empty() && stack.back() > d) {
                stack.pop_back();
                k--;
            }
            stack += d;
        }
        while (k > 0) { stack.pop_back(); k--; }
        size_t start = stack.find_first_not_of('0');
        if (start == string::npos) return "0";
        return stack.substr(start);
    }
};
$CPP$ WHERE problem_id = 'remove-k-digits' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    ListNode* removeNthFromEnd(ListNode* head, int n) {
        ListNode dummy(0, head);
        ListNode* first = &dummy;
        ListNode* second = &dummy;
        for (int i = 0; i < n + 1; i++) first = first->next;
        while (first) { first = first->next; second = second->next; }
        second->next = second->next->next;
        return dummy.next;
    }
};
$CPP$ WHERE problem_id = 'remove-nth-from-end' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    string reorganizeString(string& s) {
        unordered_map<char, int> count;
        for (char c : s) count[c]++;
        int maxFreq = 0;
        for (auto& [c, f] : count) maxFreq = max(maxFreq, f);
        if (maxFreq > ((int)s.size() + 1) / 2) return "";
        priority_queue<pair<int, char>> heap;
        for (auto& [c, f] : count) heap.push({f, c});
        string result;
        int prevFreq = 0; char prevCh = 0;
        while (!heap.empty()) {
            auto [freq, ch] = heap.top(); heap.pop();
            result += ch;
            if (prevFreq > 0) heap.push({prevFreq, prevCh});
            prevFreq = freq - 1;
            prevCh = ch;
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'reorganize-string' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
    struct TrieNode { unordered_map<char, TrieNode*> children; bool end = false; };
public:
    string replaceWords(vector<string>& dictionary, string& sentence) {
        TrieNode root;
        for (const string& rt : dictionary) {
            TrieNode* node = &root;
            for (char ch : rt) {
                if (!node->children.count(ch)) node->children[ch] = new TrieNode();
                node = node->children[ch];
            }
            node->end = true;
        }
        stringstream ss(sentence);
        string word, result;
        bool first = true;
        while (ss >> word) {
            string replaced = word;
            TrieNode* node = &root;
            for (int i = 0; i < (int)word.size(); i++) {
                char ch = word[i];
                if (!node->children.count(ch)) break;
                node = node->children[ch];
                if (node->end) { replaced = word.substr(0, i + 1); break; }
            }
            if (!first) result += ' ';
            result += replaced;
            first = false;
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'replace-words' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int reverse(int x) {
        int result = 0;
        int sign = (x >= 0) ? 1 : -1;
        long long ax = (long long)abs((long long)x);
        while (ax != 0) {
            int digit = ax % 10;
            ax /= 10;
            if (result > INT_MAX / 10 || (result == INT_MAX / 10 && digit > 7)) return 0;
            result = result * 10 + digit;
        }
        return sign * result;
    }
};
$CPP$ WHERE problem_id = 'reverse-integer' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
    void helper(vector<string>& s, int left, int right) {
        if (left >= right) return;
        swap(s[left], s[right]);
        helper(s, left + 1, right - 1);
    }
public:
    vector<string> reverseString(vector<string>& s) {
        helper(s, 0, s.size() - 1);
        return s;
    }
};
$CPP$ WHERE problem_id = 'reverse-string' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<int> rotate(vector<int>& nums, int k) {
        int n = nums.size();
        k %= n;
        reverse(nums.begin(), nums.end());
        reverse(nums.begin(), nums.begin() + k);
        reverse(nums.begin() + k, nums.end());
        return nums;
    }
};
$CPP$ WHERE problem_id = 'rotate-array' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<vector<string>> suggestedProducts(vector<string>& products, string& searchWord) {
        sort(products.begin(), products.end());
        vector<vector<string>> result;
        string prefix;
        auto start = products.begin();
        for (char ch : searchWord) {
            prefix += ch;
            start = lower_bound(start, products.end(), prefix);
            vector<string> suggestions;
            for (auto it = start; it != products.end() && (int)suggestions.size() < 3; ++it) {
                if (it->compare(0, prefix.size(), prefix) == 0) suggestions.push_back(*it);
                else break;
            }
            result.push_back(move(suggestions));
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'search-suggestions-system' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        deque<int> dq;
        vector<int> result;
        for (int i = 0; i < (int)nums.size(); i++) {
            while (!dq.empty() && nums[dq.back()] <= nums[i]) dq.pop_back();
            dq.push_back(i);
            if (dq.front() <= i - k) dq.pop_front();
            if (i >= k - 1) result.push_back(nums[dq.front()]);
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'sliding-window-maximum' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    string frequencySort(string& s) {
        unordered_map<char, int> count;
        for (char c : s) count[c]++;
        vector<pair<char,int>> pairs(count.begin(), count.end());
        sort(pairs.begin(), pairs.end(), [](const pair<char,int>& a, const pair<char,int>& b) {
            if (a.second != b.second) return a.second > b.second;
            return a.first < b.first;
        });
        string result;
        for (auto& [c, k] : pairs) result.append(k, c);
        return result;
    }
};
$CPP$ WHERE problem_id = 'sort-characters-by-frequency' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int numSubarrayProductLessThanK(vector<int>& nums, int k) {
        if (k <= 1) return 0;
        int left = 0, count = 0;
        long long product = 1;
        for (int right = 0; right < (int)nums.size(); right++) {
            product *= nums[right];
            while (product >= k) {
                product /= nums[left++];
            }
            count += right - left + 1;
        }
        return count;
    }
};
$CPP$ WHERE problem_id = 'subarray-product-less-than-k' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int getSum(int a, int b) {
        while (b != 0) {
            unsigned int carry = ((unsigned int)a & (unsigned int)b) << 1;
            a = a ^ b;
            b = carry;
        }
        return a;
    }
};
$CPP$ WHERE problem_id = 'sum-of-two-integers' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    ListNode* swapPairs(ListNode* head) {
        ListNode dummy(0, head);
        ListNode* prev = &dummy;
        while (prev->next && prev->next->next) {
            ListNode* first = prev->next;
            ListNode* second = first->next;
            prev->next = second;
            first->next = second->next;
            second->next = first;
            prev = first;
        }
        return dummy.next;
    }
};
$CPP$ WHERE problem_id = 'swap-nodes-pairs' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class TimeMap {
    unordered_map<string, vector<pair<int, string>>> store;
public:
    TimeMap() {}
    void set(string key, string value, int timestamp) {
        store[key].push_back({timestamp, value});
    }
    string get(string key, int timestamp) {
        auto it = store.find(key);
        if (it == store.end()) return "";
        auto& pairs = it->second;
        auto pos = upper_bound(pairs.begin(), pairs.end(), make_pair(timestamp, string("\xff")));
        if (pos == pairs.begin()) return "";
        return prev(pos)->second;
    }
};
$CPP$ WHERE problem_id = 'time-based-key-value' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<string> topKFrequent(vector<string>& words, int k) {
        unordered_map<string, int> count;
        for (const string& w : words) count[w]++;
        vector<pair<string, int>> candidates(count.begin(), count.end());
        sort(candidates.begin(), candidates.end(),
             [](const pair<string,int>& a, const pair<string,int>& b) {
                 if (a.second != b.second) return a.second > b.second;
                 return a.first < b.first;
             });
        vector<string> result;
        for (int i = 0; i < k && i < (int)candidates.size(); i++) result.push_back(candidates[i].first);
        return result;
    }
};
$CPP$ WHERE problem_id = 'top-k-frequent-words' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
    bool isPalin(const string& s, int lo, int hi) {
        while (lo < hi) { if (s[lo++] != s[hi--]) return false; }
        return true;
    }
public:
    bool validPalindrome(string& s) {
        int lo = 0, hi = s.size() - 1;
        while (lo < hi) {
            if (s[lo] != s[hi]) return isPalin(s, lo + 1, hi) || isPalin(s, lo, hi - 1);
            lo++; hi--;
        }
        return true;
    }
};
$CPP$ WHERE problem_id = 'valid-palindrome-ii' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool checkValidString(string& s) {
        int low = 0, high = 0;
        for (char c : s) {
            if (c == '(') { low++; high++; }
            else if (c == ')') { low--; high--; }
            else { low--; high++; }
            if (high < 0) return false;
            if (low < 0) low = 0;
        }
        return low == 0;
    }
};
$CPP$ WHERE problem_id = 'valid-parenthesis-string' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
    int distSq(vector<int>& a, vector<int>& b) {
        int dx = a[0] - b[0], dy = a[1] - b[1];
        return dx * dx + dy * dy;
    }
public:
    bool validSquare(vector<int>& p1, vector<int>& p2, vector<int>& p3, vector<int>& p4) {
        vector<vector<int>> pts = {p1, p2, p3, p4};
        vector<int> dists;
        for (int i = 0; i < 4; i++)
            for (int j = i + 1; j < 4; j++)
                dists.push_back(distSq(pts[i], pts[j]));
        sort(dists.begin(), dists.end());
        return dists[0] > 0
            && dists[0] == dists[1] && dists[1] == dists[2] && dists[2] == dists[3]
            && dists[4] == dists[5]
            && dists[4] == 2 * dists[0];
    }
};
$CPP$ WHERE problem_id = 'valid-square' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool isValidSudoku(vector<vector<string>>& board) {
        vector<unordered_set<string>> rows(9), cols(9), boxes(9);
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                const string& val = board[r][c];
                if (val == ".") continue;
                int boxIdx = (r / 3) * 3 + (c / 3);
                if (rows[r].count(val) || cols[c].count(val) || boxes[boxIdx].count(val)) return false;
                rows[r].insert(val);
                cols[c].insert(val);
                boxes[boxIdx].insert(val);
            }
        }
        return true;
    }
};
$CPP$ WHERE problem_id = 'valid-sudoku' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
    bool validate(TreeNode* node, long long low, long long high) {
        if (!node) return true;
        if (node->val <= low || node->val >= high) return false;
        return validate(node->left, low, node->val)
            && validate(node->right, node->val, high);
    }
public:
    bool isValidBST(TreeNode* root) {
        return validate(root, LLONG_MIN, LLONG_MAX);
    }
};
$CPP$ WHERE problem_id = 'validate-bst' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<vector<int>> wallsAndGates(vector<vector<int>>& rooms) {
        if (rooms.empty()) return rooms;
        int m = rooms.size(), n = rooms[0].size();
        queue<pair<int,int>> q;
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                if (rooms[i][j] == 0) q.push({i, j});
        int dr[] = {0, 0, 1, -1}, dc[] = {1, -1, 0, 0};
        while (!q.empty()) {
            auto [r, c] = q.front(); q.pop();
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n && rooms[nr][nc] == 2147483647) {
                    rooms[nr][nc] = rooms[r][c] + 1;
                    q.push({nr, nc});
                }
            }
        }
        return rooms;
    }
};
$CPP$ WHERE problem_id = 'walls-and-gates' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int ladderLength(string& beginWord, string& endWord, vector<string>& wordList) {
        unordered_set<string> wordSet(wordList.begin(), wordList.end());
        if (!wordSet.count(endWord)) return 0;
        queue<pair<string,int>> q;
        q.push({beginWord, 1});
        unordered_set<string> visited = {beginWord};
        while (!q.empty()) {
            auto [word, length] = q.front(); q.pop();
            for (int i = 0; i < (int)word.size(); i++) {
                char original = word[i];
                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == original) continue;
                    word[i] = c;
                    if (word == endWord) return length + 1;
                    if (wordSet.count(word) && !visited.count(word)) {
                        visited.insert(word);
                        q.push({word, length + 1});
                    }
                }
                word[i] = original;
            }
        }
        return 0;
    }
};
$CPP$ WHERE problem_id = 'word-ladder' AND approach_number = 1;

COMMIT;
