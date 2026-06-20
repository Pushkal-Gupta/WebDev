-- C++ reference solutions for linkedlist + trees + tries + heap (16 problems).
-- Assumes LeetCode-style ListNode/TreeNode struct definitions are available
-- (our driver provides them for run/submit; the Solutions tab just displays).
BEGIN;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr) {
            ListNode* nxt = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
};
$CPP$ WHERE problem_id = 'reverse-linked-list' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        ListNode dummy(0);
        ListNode* tail = &dummy;
        while (list1 && list2) {
            if (list1->val <= list2->val) { tail->next = list1; list1 = list1->next; }
            else { tail->next = list2; list2 = list2->next; }
            tail = tail->next;
        }
        tail->next = list1 ? list1 : list2;
        return dummy.next;
    }
};
$CPP$ WHERE problem_id = 'merge-two-sorted' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool hasCycle(ListNode* head) {
        ListNode* slow = head;
        ListNode* fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
            if (slow == fast) return true;
        }
        return false;
    }
};
$CPP$ WHERE problem_id = 'linked-list-cycle' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    void reorderList(ListNode* head) {
        if (!head || !head->next) return;
        // 1) find middle
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
        // 2) reverse second half
        ListNode* prev = nullptr;
        ListNode* curr = slow->next;
        slow->next = nullptr;
        while (curr) {
            ListNode* nxt = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nxt;
        }
        // 3) interleave
        ListNode *first = head, *second = prev;
        while (second) {
            ListNode *t1 = first->next, *t2 = second->next;
            first->next = second;
            second->next = t1;
            first = t1;
            second = t2;
        }
    }
};
$CPP$ WHERE problem_id = 'reorder-list' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (!root) return nullptr;
        TreeNode* left = invertTree(root->right);
        TreeNode* right = invertTree(root->left);
        root->left = left;
        root->right = right;
        return root;
    }
};
$CPP$ WHERE problem_id = 'invert-binary-tree' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int maxDepth(TreeNode* root) {
        if (!root) return 0;
        return 1 + max(maxDepth(root->left), maxDepth(root->right));
    }
};
$CPP$ WHERE problem_id = 'max-depth-binary-tree' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool isSameTree(TreeNode* p, TreeNode* q) {
        if (!p && !q) return true;
        if (!p || !q || p->val != q->val) return false;
        return isSameTree(p->left, q->left) && isSameTree(p->right, q->right);
    }
};
$CPP$ WHERE problem_id = 'same-tree' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool isSubtree(TreeNode* root, TreeNode* subRoot) {
        if (!root) return false;
        if (sameTree(root, subRoot)) return true;
        return isSubtree(root->left, subRoot) || isSubtree(root->right, subRoot);
    }
private:
    bool sameTree(TreeNode* a, TreeNode* b) {
        if (!a && !b) return true;
        if (!a || !b || a->val != b->val) return false;
        return sameTree(a->left, b->left) && sameTree(a->right, b->right);
    }
};
$CPP$ WHERE problem_id = 'subtree-of-another' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        vector<vector<int>> result;
        if (!root) return result;
        queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            int size = q.size();
            vector<int> level;
            for (int i = 0; i < size; i++) {
                TreeNode* node = q.front(); q.pop();
                level.push_back(node->val);
                if (node->left) q.push(node->left);
                if (node->right) q.push(node->right);
            }
            result.push_back(move(level));
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'level-order-traversal' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Trie {
    struct Node {
        unordered_map<char, Node*> children;
        bool end = false;
    };
    Node root;

    Node* walk(const string& s) {
        Node* node = &root;
        for (char ch : s) {
            auto it = node->children.find(ch);
            if (it == node->children.end()) return nullptr;
            node = it->second;
        }
        return node;
    }
public:
    Trie() {}

    void insert(string word) {
        Node* node = &root;
        for (char ch : word) {
            if (!node->children.count(ch)) node->children[ch] = new Node();
            node = node->children[ch];
        }
        node->end = true;
    }
    bool search(string word) {
        Node* node = walk(word);
        return node != nullptr && node->end;
    }
    bool startsWith(string prefix) {
        return walk(prefix) != nullptr;
    }
};
$CPP$ WHERE problem_id = 'implement-trie' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class WordDictionary {
    struct Node {
        unordered_map<char, Node*> children;
        bool end = false;
    };
    Node root;

    bool dfs(const string& word, int i, Node* node) {
        if (i == (int)word.size()) return node->end;
        char ch = word[i];
        if (ch == '.') {
            for (auto& [k, child] : node->children) {
                if (dfs(word, i + 1, child)) return true;
            }
            return false;
        }
        auto it = node->children.find(ch);
        return it != node->children.end() && dfs(word, i + 1, it->second);
    }
public:
    WordDictionary() {}

    void addWord(string word) {
        Node* node = &root;
        for (char ch : word) {
            if (!node->children.count(ch)) node->children[ch] = new Node();
            node = node->children[ch];
        }
        node->end = true;
    }
    bool search(string word) { return dfs(word, 0, &root); }
};
$CPP$ WHERE problem_id = 'design-add-search' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
    struct Node {
        unordered_map<char, Node*> children;
        string word;
    };
public:
    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {
        Node root;
        for (const string& w : words) {
            Node* node = &root;
            for (char ch : w) {
                if (!node->children.count(ch)) node->children[ch] = new Node();
                node = node->children[ch];
            }
            node->word = w;
        }
        vector<string> result;
        int rows = board.size(), cols = board[0].size();
        function<void(int, int, Node*)> dfs = [&](int r, int c, Node* node) {
            char ch = board[r][c];
            auto it = node->children.find(ch);
            if (it == node->children.end()) return;
            Node* child = it->second;
            if (!child->word.empty()) {
                result.push_back(child->word);
                child->word.clear();
            }
            board[r][c] = '#';
            int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] != '#') {
                    dfs(nr, nc, child);
                }
            }
            board[r][c] = ch;
        };
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                dfs(r, c, &root);
        return result;
    }
};
$CPP$ WHERE problem_id = 'word-search-ii' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int findKthLargest(vector<int>& nums, int k) {
        priority_queue<int, vector<int>, greater<int>> heap;
        for (int num : nums) {
            heap.push(num);
            if ((int)heap.size() > k) heap.pop();
        }
        return heap.top();
    }
};
$CPP$ WHERE problem_id = 'kth-largest-element' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int lastStoneWeight(vector<int>& stones) {
        priority_queue<int> heap(stones.begin(), stones.end());
        while (heap.size() > 1) {
            int a = heap.top(); heap.pop();
            int b = heap.top(); heap.pop();
            if (a != b) heap.push(a - b);
        }
        return heap.empty() ? 0 : heap.top();
    }
};
$CPP$ WHERE problem_id = 'last-stone-weight' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {
        auto cmp = [](const vector<int>& a, const vector<int>& b) {
            return (a[0]*a[0] + a[1]*a[1]) < (b[0]*b[0] + b[1]*b[1]);
        };
        priority_queue<vector<int>, vector<vector<int>>, decltype(cmp)> heap(cmp);
        for (auto& p : points) {
            heap.push(p);
            if ((int)heap.size() > k) heap.pop();
        }
        vector<vector<int>> result;
        result.reserve(k);
        while (!heap.empty()) { result.push_back(heap.top()); heap.pop(); }
        return result;
    }
};
$CPP$ WHERE problem_id = 'k-closest-points' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int leastInterval(vector<string>& tasks, int n) {
        unordered_map<string, int> freq;
        for (const string& t : tasks) freq[t]++;
        int maxFreq = 0, countMax = 0;
        for (auto& [k, v] : freq) if (v > maxFreq) maxFreq = v;
        for (auto& [k, v] : freq) if (v == maxFreq) countMax++;
        int formula = (maxFreq - 1) * (n + 1) + countMax;
        return max(formula, (int)tasks.size());
    }
};
$CPP$ WHERE problem_id = 'task-scheduler' AND approach_number = 1;

COMMIT;
