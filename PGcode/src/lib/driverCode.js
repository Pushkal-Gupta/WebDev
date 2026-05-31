// ─── Type mappings: Python canonical → JS/Java/C++ ───

const TYPE_MAP = {
  'int':                { jsdoc: 'number',     java: 'int',       cpp: 'int',                       go: 'int',        c: 'int',     swift: 'Int',        kotlin: 'Int',           rust: 'i64',                       typescript: 'number' },
  'float':              { jsdoc: 'number',     java: 'double',    cpp: 'double',                    go: 'float64',    c: 'double',  swift: 'Double',     kotlin: 'Double',        rust: 'f64',                       typescript: 'number' },
  'str':                { jsdoc: 'string',     java: 'String',    cpp: 'string',                    go: 'string',     c: 'char*',   swift: 'String',     kotlin: 'String',        rust: 'String',                    typescript: 'string' },
  'bool':               { jsdoc: 'boolean',    java: 'boolean',   cpp: 'bool',                      go: 'bool',       c: 'bool',    swift: 'Bool',       kotlin: 'Boolean',       rust: 'bool',                      typescript: 'boolean' },
  'List[int]':          { jsdoc: 'number[]',   java: 'int[]',     cpp: 'vector<int>',               go: '[]int',      c: 'int*',    swift: '[Int]',      kotlin: 'IntArray',      rust: 'Vec<i64>',                  typescript: 'number[]' },
  'List[str]':          { jsdoc: 'string[]',   java: 'String[]',  cpp: 'vector<string>',            go: '[]string',   c: 'char**',  swift: '[String]',   kotlin: 'Array<String>', rust: 'Vec<String>',               typescript: 'string[]' },
  'List[List[int]]':    { jsdoc: 'number[][]', java: 'int[][]',   cpp: 'vector<vector<int>>',       go: '[][]int',    c: 'int**',   swift: '[[Int]]',    kotlin: 'Array<IntArray>', rust: 'Vec<Vec<i64>>',           typescript: 'number[][]' },
  'List[List[str]]':    { jsdoc: 'string[][]', java: 'String[][]', cpp: 'vector<vector<string>>',   go: '[][]string', c: 'char***', swift: '[[String]]', kotlin: 'Array<Array<String>>', rust: 'Vec<Vec<String>>',    typescript: 'string[][]' },
  'List[bool]':         { jsdoc: 'boolean[]',  java: 'boolean[]', cpp: 'vector<bool>',              go: '[]bool',     c: 'bool*',   swift: '[Bool]',     kotlin: 'BooleanArray',  rust: 'Vec<bool>',                 typescript: 'boolean[]' },
  'ListNode':           { jsdoc: 'ListNode',   java: 'ListNode',  cpp: 'ListNode*',                 go: '*ListNode',  c: 'struct ListNode*', swift: 'ListNode?', kotlin: 'ListNode?', rust: 'Option<Box<ListNode>>',     typescript: 'ListNode | null' },
  'Optional[ListNode]': { jsdoc: 'ListNode',   java: 'ListNode',  cpp: 'ListNode*',                 go: '*ListNode',  c: 'struct ListNode*', swift: 'ListNode?', kotlin: 'ListNode?', rust: 'Option<Box<ListNode>>',     typescript: 'ListNode | null' },
  'TreeNode':           { jsdoc: 'TreeNode',   java: 'TreeNode',  cpp: 'TreeNode*',                 go: '*TreeNode',  c: 'struct TreeNode*', swift: 'TreeNode?', kotlin: 'TreeNode?', rust: 'Option<Rc<RefCell<TreeNode>>>', typescript: 'TreeNode | null' },
  'Optional[TreeNode]': { jsdoc: 'TreeNode',   java: 'TreeNode',  cpp: 'TreeNode*',                 go: '*TreeNode',  c: 'struct TreeNode*', swift: 'TreeNode?', kotlin: 'TreeNode?', rust: 'Option<Rc<RefCell<TreeNode>>>', typescript: 'TreeNode | null' },
};

const jt = (pyType) => TYPE_MAP[pyType]?.java || pyType;
const jd = (pyType) => TYPE_MAP[pyType]?.jsdoc || pyType;
const ct = (pyType) => TYPE_MAP[pyType]?.cpp || pyType;
const gct = (pyType) => TYPE_MAP[pyType]?.go || pyType;
const cct = (pyType) => TYPE_MAP[pyType]?.c || pyType;
const swt = (pyType) => TYPE_MAP[pyType]?.swift || pyType;
const ktt = (pyType) => TYPE_MAP[pyType]?.kotlin || pyType;
const rst = (pyType) => TYPE_MAP[pyType]?.rust || pyType;
const tst = (pyType) => TYPE_MAP[pyType]?.typescript || pyType;

const isListNodeType = (t) => t === 'ListNode' || t === 'Optional[ListNode]';
const isTreeNodeType = (t) => t === 'TreeNode' || t === 'Optional[TreeNode]';

const camelToSnake = (s) => s.replace(/[A-Z]/g, (m, i) => (i === 0 ? m.toLowerCase() : '_' + m.toLowerCase()));

// ─── Template generation (what user sees in editor) ───

const PY_LISTNODE_COMMENT = `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
`;

const PY_TREENODE_COMMENT = `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
`;

const JS_LISTNODE_COMMENT = `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
`;

const JS_TREENODE_COMMENT = `/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
`;

const CPP_LISTNODE_COMMENT = `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
`;

const CPP_TREENODE_COMMENT = `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
`;

const C_LISTNODE_COMMENT = `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     struct ListNode *next;
 * };
 */
`;

const C_TREENODE_COMMENT = `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     struct TreeNode *left;
 *     struct TreeNode *right;
 * };
 */
`;

const GO_LISTNODE_COMMENT = `/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
`;

const GO_TREENODE_COMMENT = `/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
`;

export function generateTemplate(language, methodName, params, returnType) {
  if (!methodName || !params) return null;

  // Cycled-list spec: DB stores (values, pos) but the user writes a single-arg
  // hasCycle(head: ListNode) function — the harness collapses (values, pos)
  // into a pre-wired ListNode head. Reshape params for template generation
  // so the editor surface matches what the user actually authors.
  const cycledInput = params.length === 2
    && params[0]?.type === 'List[int]' && params[0]?.name === 'values'
    && params[1]?.type === 'int' && params[1]?.name === 'pos';
  if (cycledInput) {
    params = [{ name: 'head', type: 'Optional[ListNode]' }];
  }

  const typesUsed = [...params.map(p => p.type), returnType || ''];
  const needsList = typesUsed.some(isListNodeType);
  const needsTree = typesUsed.some(isTreeNodeType);

  if (language === 'python') {
    const sig = params.map(p => `${p.name}: ${p.type}`).join(', ');
    let prefix = '';
    if (needsList) prefix += PY_LISTNODE_COMMENT;
    if (needsTree) prefix += PY_TREENODE_COMMENT;
    return `${prefix}class Solution:\n    def ${methodName}(self, ${sig}) -> ${returnType}:\n        `;
  }

  if (language === 'javascript') {
    const jsdoc = params.map(p => ` * @param {${jd(p.type)}} ${p.name}`).join('\n');
    const args = params.map(p => p.name).join(', ');
    let prefix = '';
    if (needsList) prefix += JS_LISTNODE_COMMENT;
    if (needsTree) prefix += JS_TREENODE_COMMENT;
    return `${prefix}/**\n${jsdoc}\n * @return {${jd(returnType)}}\n */\nvar ${methodName} = function(${args}) {\n    \n};`;
  }

  if (language === 'java') {
    const javaParams = params.map(p => `${jt(p.type)} ${p.name}`).join(', ');
    return `class Solution {\n    public ${jt(returnType)} ${methodName}(${javaParams}) {\n        \n    }\n}`;
  }

  if (language === 'cpp') {
    // Pass vectors and strings by const-ref where the Java driver uses arrays —
    // keeps signatures idiomatic LeetCode-style and avoids accidental copies.
    const cppParams = params.map(p => {
      const base = ct(p.type);
      const isContainer = base.startsWith('vector<') || base === 'string';
      return isContainer ? `${base}& ${p.name}` : `${base} ${p.name}`;
    }).join(', ');
    let prefix = '';
    if (needsList) prefix += CPP_LISTNODE_COMMENT;
    if (needsTree) prefix += CPP_TREENODE_COMMENT;
    return `${prefix}#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    ${ct(returnType)} ${methodName}(${cppParams}) {\n        \n    }\n};`;
  }

  if (language === 'c') {
    // LeetCode-style C signatures: arrays decompose into pointer + size, return
    // arrays append `int* returnSize` (and `int** returnColumnSizes` for 2D).
    const cParamParts = [];
    params.forEach(p => {
      if (p.type === 'List[int]' || p.type === 'List[bool]') {
        const base = p.type === 'List[bool]' ? 'bool' : 'int';
        cParamParts.push(`${base}* ${p.name}`, `int ${p.name}Size`);
      } else if (p.type === 'List[str]') {
        cParamParts.push(`char** ${p.name}`, `int ${p.name}Size`);
      } else if (p.type === 'List[List[int]]') {
        cParamParts.push(`int** ${p.name}`, `int ${p.name}Size`, `int* ${p.name}ColSize`);
      } else if (p.type === 'List[List[str]]') {
        cParamParts.push(`char*** ${p.name}`, `int ${p.name}Size`, `int* ${p.name}ColSize`);
      } else {
        cParamParts.push(`${cct(p.type)} ${p.name}`);
      }
    });

    const retIsIntList = returnType === 'List[int]' || returnType === 'List[bool]';
    const retIsStrList = returnType === 'List[str]';
    const retIs2DInt = returnType === 'List[List[int]]';
    const retIs2DStr = returnType === 'List[List[str]]';
    if (retIsIntList || retIsStrList) cParamParts.push('int* returnSize');
    if (retIs2DInt || retIs2DStr) cParamParts.push('int* returnSize', 'int** returnColumnSizes');

    let cReturnType;
    if (retIsIntList) cReturnType = returnType === 'List[bool]' ? 'bool*' : 'int*';
    else if (retIsStrList) cReturnType = 'char**';
    else if (retIs2DInt) cReturnType = 'int**';
    else if (retIs2DStr) cReturnType = 'char***';
    else cReturnType = cct(returnType);

    let body;
    if (cReturnType === 'int' || cReturnType === 'double') body = '    return 0;';
    else if (cReturnType === 'bool') body = '    return false;';
    else if (retIsIntList || retIsStrList) body = '    *returnSize = 0;\n    return NULL;';
    else if (retIs2DInt || retIs2DStr) body = '    *returnSize = 0;\n    *returnColumnSizes = NULL;\n    return NULL;';
    else if (cReturnType.endsWith('*')) body = '    return NULL;';
    else body = '    ';

    let prefix = '';
    if (needsList) prefix += C_LISTNODE_COMMENT;
    if (needsTree) prefix += C_TREENODE_COMMENT;
    return `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdbool.h>\n\n${prefix}${cReturnType} ${methodName}(${cParamParts.join(', ')}) {\n${body}\n}`;
  }

  if (language === 'go') {
    const goParams = params.map(p => `${p.name} ${gct(p.type)}`).join(', ');
    let prefix = '';
    if (needsList) prefix += GO_LISTNODE_COMMENT;
    if (needsTree) prefix += GO_TREENODE_COMMENT;

    const goRet = gct(returnType);
    let zero;
    if (goRet === 'int' || goRet === 'float64') zero = '0';
    else if (goRet === 'bool') zero = 'false';
    else if (goRet === 'string') zero = '""';
    else if (goRet.startsWith('[]')) zero = `${goRet}{}`;
    else if (goRet.startsWith('*')) zero = 'nil';
    else zero = 'nil';

    return `${prefix}func ${methodName}(${goParams}) ${goRet} {\n    return ${zero}\n}`;
  }

  if (language === 'swift') {
    // LC convention: underscore unnamed params; ListNode/TreeNode are class types.
    const swiftParams = params.map(p => `_ ${p.name}: ${swt(p.type)}`).join(', ');
    return `class Solution {\n    func ${methodName}(${swiftParams}) -> ${swt(returnType)} {\n        \n    }\n}`;
  }

  if (language === 'kotlin') {
    const kotlinParams = params.map(p => `${p.name}: ${ktt(p.type)}`).join(', ');
    return `class Solution {\n    fun ${methodName}(${kotlinParams}): ${ktt(returnType)} {\n        \n    }\n}`;
  }

  if (language === 'rust') {
    // Rust convention is snake_case; method_name comes in camelCase from the catalog.
    const rustName = camelToSnake(methodName);
    const rustParams = params.map(p => `${camelToSnake(p.name)}: ${rst(p.type)}`).join(', ');
    return `impl Solution {\n    pub fn ${rustName}(${rustParams}) -> ${rst(returnType)} {\n        \n    }\n}`;
  }

  if (language === 'typescript') {
    const tsParams = params.map(p => `${p.name}: ${tst(p.type)}`).join(', ');
    return `function ${methodName}(${tsParams}): ${tst(returnType)} {\n    \n};`;
  }

  return null;
}

// ─── Driver code (wraps user code for execution) ───

const PY_HELPERS = `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def _to_list(arr):
    if not arr:
        return None
    _head = ListNode(arr[0])
    _curr = _head
    for _v in arr[1:]:
        _curr.next = ListNode(_v)
        _curr = _curr.next
    return _head

def _to_list_cycle(arr, pos):
    if not arr:
        return None
    _nodes = [ListNode(arr[0])]
    for _v in arr[1:]:
        _nodes.append(ListNode(_v))
        _nodes[-2].next = _nodes[-1]
    if pos is not None and pos >= 0 and pos < len(_nodes):
        _nodes[-1].next = _nodes[pos]
    return _nodes[0]

def _from_list(head):
    _result = []
    while head:
        _result.append(head.val)
        head = head.next
    return _result

def _to_tree(arr):
    if not arr:
        return None
    _root = TreeNode(arr[0])
    _q = [_root]
    _i = 1
    while _q and _i < len(arr):
        _node = _q.pop(0)
        if _i < len(arr) and arr[_i] is not None:
            _node.left = TreeNode(arr[_i])
            _q.append(_node.left)
        _i += 1
        if _i < len(arr) and arr[_i] is not None:
            _node.right = TreeNode(arr[_i])
            _q.append(_node.right)
        _i += 1
    return _root

def _from_tree(root):
    if not root:
        return []
    _result = []
    _q = [root]
    while _q:
        _node = _q.pop(0)
        if _node is None:
            _result.append(None)
        else:
            _result.append(_node.val)
            _q.append(_node.left)
            _q.append(_node.right)
    while _result and _result[-1] is None:
        _result.pop()
    return _result
`;

const JS_HELPERS = `
function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val);
    this.next = (next===undefined ? null : next);
}

function TreeNode(val, left, right) {
    this.val = (val===undefined ? 0 : val);
    this.left = (left===undefined ? null : left);
    this.right = (right===undefined ? null : right);
}

function _toList(arr) {
    if (!arr || arr.length === 0) return null;
    const _head = new ListNode(arr[0]);
    let _curr = _head;
    for (let _i = 1; _i < arr.length; _i++) {
        _curr.next = new ListNode(arr[_i]);
        _curr = _curr.next;
    }
    return _head;
}

function _toListCycle(arr, pos) {
    if (!arr || arr.length === 0) return null;
    const _nodes = [new ListNode(arr[0])];
    for (let _i = 1; _i < arr.length; _i++) {
        _nodes.push(new ListNode(arr[_i]));
        _nodes[_i - 1].next = _nodes[_i];
    }
    if (pos != null && pos >= 0 && pos < _nodes.length) {
        _nodes[_nodes.length - 1].next = _nodes[pos];
    }
    return _nodes[0];
}

function _fromList(head) {
    const _result = [];
    while (head) {
        _result.push(head.val);
        head = head.next;
    }
    return _result;
}

function _toTree(arr) {
    if (!arr || arr.length === 0) return null;
    const _root = new TreeNode(arr[0]);
    const _q = [_root];
    let _i = 1;
    while (_q.length > 0 && _i < arr.length) {
        const _node = _q.shift();
        if (_i < arr.length && arr[_i] !== null) {
            _node.left = new TreeNode(arr[_i]);
            _q.push(_node.left);
        }
        _i++;
        if (_i < arr.length && arr[_i] !== null) {
            _node.right = new TreeNode(arr[_i]);
            _q.push(_node.right);
        }
        _i++;
    }
    return _root;
}

function _fromTree(root) {
    if (!root) return [];
    const _result = [];
    const _q = [root];
    while (_q.length > 0) {
        const _node = _q.shift();
        if (_node === null) {
            _result.push(null);
        } else {
            _result.push(_node.val);
            _q.push(_node.left);
            _q.push(_node.right);
        }
    }
    while (_result.length > 0 && _result[_result.length - 1] === null) {
        _result.pop();
    }
    return _result;
}
`;

// Sentinel lines used by the Java multi-case driver. Stdins for each case are
// concatenated with JAVA_CASE_SEP between them; outputs are separated by
// JAVA_OUT_END so the client can split cleanly even if a case prints nothing
// or crashes (see JAVA_ERR_PREFIX).
export const JAVA_CASE_SEP = '###CASE###';
export const JAVA_OUT_END = '###END###';
export const JAVA_ERR_PREFIX = '###ERR###';

const CPP_HELPERS = `
#include <bits/stdc++.h>
using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *n) : val(x), next(n) {}
};

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *l, TreeNode *r) : val(x), left(l), right(r) {}
};

static const int _PGC_NULL = INT_MIN;

static string _pgc_trim(const string& s) {
    size_t a = s.find_first_not_of(" \\t\\r\\n");
    size_t b = s.find_last_not_of(" \\t\\r\\n");
    return (a == string::npos) ? string("") : s.substr(a, b - a + 1);
}

static string _pgc_strip_quotes(const string& s) {
    string t = _pgc_trim(s);
    if (t.size() >= 2 && t.front() == '"' && t.back() == '"')
        return t.substr(1, t.size() - 2);
    return t;
}

// Split comma-separated values at the top depth inside "[ ... ]" (handles nested [] and "…")
static vector<string> _pgc_split_top(const string& s) {
    vector<string> out;
    string t = _pgc_trim(s);
    if (t.size() < 2) return out;
    string inner = _pgc_trim(t.substr(1, t.size() - 2));
    if (inner.empty()) return out;
    int depth = 0;
    int start = 0;
    bool inStr = false;
    for (int i = 0; i < (int)inner.size(); i++) {
        char c = inner[i];
        if (c == '"' && (i == 0 || inner[i-1] != '\\\\')) inStr = !inStr;
        else if (!inStr && c == '[') depth++;
        else if (!inStr && c == ']') depth--;
        else if (!inStr && c == ',' && depth == 0) {
            out.push_back(_pgc_trim(inner.substr(start, i - start)));
            start = i + 1;
        }
    }
    out.push_back(_pgc_trim(inner.substr(start)));
    return out;
}

static vector<int> _pgc_parse_vi(const string& s) {
    vector<int> out;
    for (auto& p : _pgc_split_top(s)) out.push_back(stoi(p));
    return out;
}

static vector<string> _pgc_parse_vs(const string& s) {
    vector<string> out;
    for (auto& p : _pgc_split_top(s)) out.push_back(_pgc_strip_quotes(p));
    return out;
}

static vector<bool> _pgc_parse_vb(const string& s) {
    vector<bool> out;
    for (auto& p : _pgc_split_top(s)) out.push_back(p == "true");
    return out;
}

static vector<vector<int>> _pgc_parse_vvi(const string& s) {
    vector<vector<int>> out;
    for (auto& p : _pgc_split_top(s)) out.push_back(_pgc_parse_vi(p));
    return out;
}

static vector<vector<string>> _pgc_parse_vvs(const string& s) {
    vector<vector<string>> out;
    for (auto& p : _pgc_split_top(s)) out.push_back(_pgc_parse_vs(p));
    return out;
}

// Parse tree-shape tokens: ints or the literal "null"
static vector<int> _pgc_parse_tree_tokens(const string& s) {
    vector<int> out;
    for (auto& p : _pgc_split_top(s)) {
        string t = _pgc_trim(p);
        if (t == "null") out.push_back(_PGC_NULL);
        else out.push_back(stoi(t));
    }
    return out;
}

static ListNode* _pgc_to_list(const vector<int>& v) {
    if (v.empty()) return nullptr;
    ListNode* head = new ListNode(v[0]);
    ListNode* cur = head;
    for (size_t i = 1; i < v.size(); i++) {
        cur->next = new ListNode(v[i]);
        cur = cur->next;
    }
    return head;
}

static ListNode* _pgc_to_list_cycle(const vector<int>& v, int pos) {
    if (v.empty()) return nullptr;
    vector<ListNode*> nodes;
    nodes.push_back(new ListNode(v[0]));
    for (size_t i = 1; i < v.size(); i++) {
        nodes.push_back(new ListNode(v[i]));
        nodes[i - 1]->next = nodes[i];
    }
    if (pos >= 0 && pos < (int)nodes.size()) {
        nodes.back()->next = nodes[pos];
    }
    return nodes[0];
}

static vector<int> _pgc_from_list(ListNode* head) {
    vector<int> out;
    while (head) { out.push_back(head->val); head = head->next; }
    return out;
}

static TreeNode* _pgc_to_tree(const vector<int>& v) {
    if (v.empty() || v[0] == _PGC_NULL) return nullptr;
    TreeNode* root = new TreeNode(v[0]);
    queue<TreeNode*> q; q.push(root);
    size_t i = 1;
    while (!q.empty() && i < v.size()) {
        TreeNode* n = q.front(); q.pop();
        if (i < v.size() && v[i] != _PGC_NULL) {
            n->left = new TreeNode(v[i]);
            q.push(n->left);
        }
        i++;
        if (i < v.size() && v[i] != _PGC_NULL) {
            n->right = new TreeNode(v[i]);
            q.push(n->right);
        }
        i++;
    }
    return root;
}

static string _pgc_from_tree(TreeNode* root) {
    if (!root) return "[]";
    vector<string> toks;
    queue<TreeNode*> q; q.push(root);
    while (!q.empty()) {
        TreeNode* n = q.front(); q.pop();
        if (!n) { toks.push_back("null"); continue; }
        toks.push_back(to_string(n->val));
        q.push(n->left);
        q.push(n->right);
    }
    while (!toks.empty() && toks.back() == "null") toks.pop_back();
    string s = "[";
    for (size_t i = 0; i < toks.size(); i++) { if (i) s += ","; s += toks[i]; }
    return s + "]";
}

// --- Serializers keyed to the inferred return type ---
static string _pgc_ser_bool(bool b)       { return b ? "true" : "false"; }
static string _pgc_ser_int(long long x)   { return to_string(x); }
static string _pgc_ser_double(double x)   { ostringstream o; o << setprecision(15) << x; return o.str(); }
static string _pgc_ser_str(const string& s) {
    string r = "\\"";
    for (char c : s) { if (c == '"' || c == '\\\\') r += '\\\\'; r += c; }
    r += "\\""; return r;
}

static string _pgc_ser_vi(const vector<int>& v) {
    string s = "["; for (size_t i=0;i<v.size();i++){ if(i)s+=","; s+=to_string(v[i]); } return s+"]";
}
static string _pgc_ser_vb(const vector<bool>& v) {
    string s = "["; for (size_t i=0;i<v.size();i++){ if(i)s+=","; s+=(v[i]?"true":"false"); } return s+"]";
}
static string _pgc_ser_vs(const vector<string>& v) {
    string s = "["; for (size_t i=0;i<v.size();i++){ if(i)s+=","; s+=_pgc_ser_str(v[i]); } return s+"]";
}
static string _pgc_ser_vvi(const vector<vector<int>>& v) {
    string s = "["; for (size_t i=0;i<v.size();i++){ if(i)s+=","; s+=_pgc_ser_vi(v[i]); } return s+"]";
}
static string _pgc_ser_vvs(const vector<vector<string>>& v) {
    string s = "["; for (size_t i=0;i<v.size();i++){ if(i)s+=","; s+=_pgc_ser_vs(v[i]); } return s+"]";
}
`;

const C_HELPERS = `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <ctype.h>

struct ListNode {
    int val;
    struct ListNode *next;
};

struct TreeNode {
    int val;
    struct TreeNode *left;
    struct TreeNode *right;
};

static char* _pgc_read_line(void) {
    size_t cap = 256, len = 0;
    char* buf = (char*)malloc(cap);
    if (!buf) return NULL;
    int c;
    while ((c = getchar()) != EOF && c != '\\n') {
        if (len + 1 >= cap) { cap *= 2; buf = (char*)realloc(buf, cap); }
        buf[len++] = (char)c;
    }
    if (c == EOF && len == 0) { free(buf); return NULL; }
    buf[len] = '\\0';
    return buf;
}

static char* _pgc_trim(char* s) {
    if (!s) return s;
    while (*s && isspace((unsigned char)*s)) s++;
    if (!*s) return s;
    char* end = s + strlen(s) - 1;
    while (end > s && isspace((unsigned char)*end)) { *end = '\\0'; end--; }
    return s;
}

// Split a "[a,b,[c,d],...]" string at top-level commas. Returns malloced array of
// strdup'd tokens; caller frees both. *outLen receives count.
static char** _pgc_split_top(const char* raw, int* outLen) {
    *outLen = 0;
    if (!raw) return NULL;
    const char* p = raw;
    while (*p && isspace((unsigned char)*p)) p++;
    if (*p != '[') return NULL;
    const char* end = raw + strlen(raw) - 1;
    while (end > p && isspace((unsigned char)*end)) end--;
    if (*end != ']') return NULL;
    const char* s = p + 1;
    int slen = (int)(end - s);
    if (slen <= 0) return NULL;
    int cap = 8;
    char** out = (char**)malloc(sizeof(char*) * cap);
    int depth = 0;
    int start = 0;
    bool inStr = false;
    for (int i = 0; i < slen; i++) {
        char c = s[i];
        if (c == '"' && (i == 0 || s[i-1] != '\\\\')) inStr = !inStr;
        else if (!inStr && c == '[') depth++;
        else if (!inStr && c == ']') depth--;
        else if (!inStr && c == ',' && depth == 0) {
            int n = i - start;
            char* tok = (char*)malloc(n + 1);
            memcpy(tok, s + start, n);
            tok[n] = '\\0';
            if (*outLen == cap) { cap *= 2; out = (char**)realloc(out, sizeof(char*) * cap); }
            out[(*outLen)++] = tok;
            start = i + 1;
        }
    }
    int n = slen - start;
    char* tok = (char*)malloc(n + 1);
    memcpy(tok, s + start, n);
    tok[n] = '\\0';
    if (*outLen == cap) { cap *= 2; out = (char**)realloc(out, sizeof(char*) * cap); }
    out[(*outLen)++] = tok;
    return out;
}

static void _pgc_free_tokens(char** toks, int n) {
    if (!toks) return;
    for (int i = 0; i < n; i++) free(toks[i]);
    free(toks);
}

static char* _pgc_strip_quotes(char* s) {
    char* t = _pgc_trim(s);
    int len = (int)strlen(t);
    if (len >= 2 && t[0] == '"' && t[len-1] == '"') {
        t[len-1] = '\\0';
        return t + 1;
    }
    return t;
}

static int* _pgc_parse_int_arr(const char* raw, int* outLen) {
    int n;
    char** toks = _pgc_split_top(raw, &n);
    *outLen = n;
    if (n == 0) { _pgc_free_tokens(toks, n); return (int*)malloc(sizeof(int)); }
    int* out = (int*)malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) out[i] = atoi(_pgc_trim(toks[i]));
    _pgc_free_tokens(toks, n);
    return out;
}

static bool* _pgc_parse_bool_arr(const char* raw, int* outLen) {
    int n;
    char** toks = _pgc_split_top(raw, &n);
    *outLen = n;
    if (n == 0) { _pgc_free_tokens(toks, n); return (bool*)malloc(sizeof(bool)); }
    bool* out = (bool*)malloc(sizeof(bool) * n);
    for (int i = 0; i < n; i++) out[i] = strcmp(_pgc_trim(toks[i]), "true") == 0;
    _pgc_free_tokens(toks, n);
    return out;
}

static char** _pgc_parse_str_arr(const char* raw, int* outLen) {
    int n;
    char** toks = _pgc_split_top(raw, &n);
    *outLen = n;
    if (n == 0) { _pgc_free_tokens(toks, n); return (char**)malloc(sizeof(char*)); }
    char** out = (char**)malloc(sizeof(char*) * n);
    for (int i = 0; i < n; i++) {
        char* inner = _pgc_strip_quotes(toks[i]);
        out[i] = strdup(inner);
    }
    _pgc_free_tokens(toks, n);
    return out;
}

static int** _pgc_parse_int_2d(const char* raw, int* outLen, int** outColSizes) {
    int n;
    char** toks = _pgc_split_top(raw, &n);
    *outLen = n;
    if (n == 0) {
        _pgc_free_tokens(toks, n);
        *outColSizes = (int*)malloc(sizeof(int));
        return (int**)malloc(sizeof(int*));
    }
    int** out = (int**)malloc(sizeof(int*) * n);
    *outColSizes = (int*)malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) {
        int cn;
        out[i] = _pgc_parse_int_arr(toks[i], &cn);
        (*outColSizes)[i] = cn;
    }
    _pgc_free_tokens(toks, n);
    return out;
}

static struct ListNode* _pgc_to_list(const char* raw) {
    int n;
    int* arr = _pgc_parse_int_arr(raw, &n);
    if (n == 0) { free(arr); return NULL; }
    struct ListNode* head = (struct ListNode*)malloc(sizeof(struct ListNode));
    head->val = arr[0]; head->next = NULL;
    struct ListNode* cur = head;
    for (int i = 1; i < n; i++) {
        cur->next = (struct ListNode*)malloc(sizeof(struct ListNode));
        cur->next->val = arr[i]; cur->next->next = NULL;
        cur = cur->next;
    }
    free(arr);
    return head;
}

static struct ListNode* _pgc_to_list_cycle(const char* raw, int pos) {
    int n;
    int* arr = _pgc_parse_int_arr(raw, &n);
    if (n == 0) { free(arr); return NULL; }
    struct ListNode** nodes = (struct ListNode**)malloc(sizeof(struct ListNode*) * n);
    for (int i = 0; i < n; i++) {
        nodes[i] = (struct ListNode*)malloc(sizeof(struct ListNode));
        nodes[i]->val = arr[i];
        nodes[i]->next = NULL;
    }
    for (int i = 0; i + 1 < n; i++) nodes[i]->next = nodes[i + 1];
    if (pos >= 0 && pos < n) nodes[n - 1]->next = nodes[pos];
    struct ListNode* head = nodes[0];
    free(nodes);
    free(arr);
    return head;
}

static struct TreeNode* _pgc_to_tree(const char* raw) {
    int n;
    char** toks = _pgc_split_top(raw, &n);
    if (n == 0 || strcmp(_pgc_trim(toks[0]), "null") == 0) {
        _pgc_free_tokens(toks, n);
        return NULL;
    }
    struct TreeNode* root = (struct TreeNode*)malloc(sizeof(struct TreeNode));
    root->val = atoi(_pgc_trim(toks[0])); root->left = root->right = NULL;
    struct TreeNode** q = (struct TreeNode**)malloc(sizeof(struct TreeNode*) * n);
    int qh = 0, qt = 0;
    q[qt++] = root;
    int i = 1;
    while (qh < qt && i < n) {
        struct TreeNode* node = q[qh++];
        if (i < n && strcmp(_pgc_trim(toks[i]), "null") != 0) {
            node->left = (struct TreeNode*)malloc(sizeof(struct TreeNode));
            node->left->val = atoi(_pgc_trim(toks[i])); node->left->left = node->left->right = NULL;
            q[qt++] = node->left;
        }
        i++;
        if (i < n && strcmp(_pgc_trim(toks[i]), "null") != 0) {
            node->right = (struct TreeNode*)malloc(sizeof(struct TreeNode));
            node->right->val = atoi(_pgc_trim(toks[i])); node->right->left = node->right->right = NULL;
            q[qt++] = node->right;
        }
        i++;
    }
    free(q);
    _pgc_free_tokens(toks, n);
    return root;
}

static void _pgc_print_int(int x) { printf("%d", x); }
static void _pgc_print_ll(long long x) { printf("%lld", x); }
static void _pgc_print_double(double x) { printf("%.15g", x); }
static void _pgc_print_bool(bool b) { printf("%s", b ? "true" : "false"); }
static void _pgc_print_str(const char* s) {
    if (!s) { printf("null"); return; }
    putchar('"');
    for (; *s; s++) {
        if (*s == '"' || *s == '\\\\') putchar('\\\\');
        putchar(*s);
    }
    putchar('"');
}

static void _pgc_print_int_arr(int* a, int n) {
    putchar('[');
    for (int i = 0; i < n; i++) { if (i) putchar(','); printf("%d", a[i]); }
    putchar(']');
}

static void _pgc_print_bool_arr(bool* a, int n) {
    putchar('[');
    for (int i = 0; i < n; i++) { if (i) putchar(','); printf("%s", a[i] ? "true" : "false"); }
    putchar(']');
}

static void _pgc_print_str_arr(char** a, int n) {
    putchar('[');
    for (int i = 0; i < n; i++) { if (i) putchar(','); _pgc_print_str(a[i]); }
    putchar(']');
}

static void _pgc_print_int_2d(int** a, int n, int* col) {
    putchar('[');
    for (int i = 0; i < n; i++) { if (i) putchar(','); _pgc_print_int_arr(a[i], col[i]); }
    putchar(']');
}

static void _pgc_print_list(struct ListNode* head) {
    putchar('[');
    int first = 1;
    while (head) { if (!first) putchar(','); printf("%d", head->val); first = 0; head = head->next; }
    putchar(']');
}

// Tree printer: level-order with trailing nulls trimmed.
static void _pgc_print_tree(struct TreeNode* root) {
    if (!root) { printf("[]"); return; }
    struct TreeNode** q = (struct TreeNode**)malloc(sizeof(struct TreeNode*) * 8);
    int cap = 8, qh = 0, qt = 0;
    int* vals = (int*)malloc(sizeof(int) * 8);
    int* is_null = (int*)malloc(sizeof(int) * 8);
    int n = 0, ncap = 8;
    q[qt++] = root;
    while (qh < qt) {
        struct TreeNode* node = q[qh++];
        if (n == ncap) { ncap *= 2; vals = (int*)realloc(vals, sizeof(int)*ncap); is_null = (int*)realloc(is_null, sizeof(int)*ncap); }
        if (!node) { is_null[n] = 1; vals[n] = 0; n++; continue; }
        is_null[n] = 0; vals[n] = node->val; n++;
        if (qt + 2 > cap) { cap *= 2; q = (struct TreeNode**)realloc(q, sizeof(struct TreeNode*) * cap); }
        q[qt++] = node->left;
        q[qt++] = node->right;
    }
    while (n > 0 && is_null[n-1]) n--;
    putchar('[');
    for (int i = 0; i < n; i++) {
        if (i) putchar(',');
        if (is_null[i]) printf("null"); else printf("%d", vals[i]);
    }
    putchar(']');
    free(q); free(vals); free(is_null);
}
`;

const GO_HELPERS = `
package main

import (
    "bufio"
    "encoding/json"
    "fmt"
    "os"
    "strconv"
    "strings"
)

type ListNode struct {
    Val  int
    Next *ListNode
}

type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func _pgc_arr_to_list(arr []int) *ListNode {
    if len(arr) == 0 {
        return nil
    }
    head := &ListNode{Val: arr[0]}
    cur := head
    for i := 1; i < len(arr); i++ {
        cur.Next = &ListNode{Val: arr[i]}
        cur = cur.Next
    }
    return head
}

func _pgc_arr_to_list_cycle(arr []int, pos int) *ListNode {
    if len(arr) == 0 {
        return nil
    }
    nodes := make([]*ListNode, len(arr))
    for i := range arr {
        nodes[i] = &ListNode{Val: arr[i]}
    }
    for i := 0; i+1 < len(nodes); i++ {
        nodes[i].Next = nodes[i+1]
    }
    if pos >= 0 && pos < len(nodes) {
        nodes[len(nodes)-1].Next = nodes[pos]
    }
    return nodes[0]
}

func _pgc_list_to_arr(head *ListNode) []int {
    out := []int{}
    for head != nil {
        out = append(out, head.Val)
        head = head.Next
    }
    return out
}

func _pgc_arr_to_tree(tokens []json.RawMessage) *TreeNode {
    if len(tokens) == 0 {
        return nil
    }
    if string(tokens[0]) == "null" {
        return nil
    }
    var rootVal int
    if err := json.Unmarshal(tokens[0], &rootVal); err != nil {
        return nil
    }
    root := &TreeNode{Val: rootVal}
    queue := []*TreeNode{root}
    i := 1
    for len(queue) > 0 && i < len(tokens) {
        node := queue[0]
        queue = queue[1:]
        if i < len(tokens) && string(tokens[i]) != "null" {
            var v int
            if err := json.Unmarshal(tokens[i], &v); err == nil {
                node.Left = &TreeNode{Val: v}
                queue = append(queue, node.Left)
            }
        }
        i++
        if i < len(tokens) && string(tokens[i]) != "null" {
            var v int
            if err := json.Unmarshal(tokens[i], &v); err == nil {
                node.Right = &TreeNode{Val: v}
                queue = append(queue, node.Right)
            }
        }
        i++
    }
    return root
}

func _pgc_tree_to_json(root *TreeNode) string {
    if root == nil {
        return "[]"
    }
    type item struct {
        n *TreeNode
    }
    toks := []string{}
    queue := []*TreeNode{root}
    for len(queue) > 0 {
        n := queue[0]
        queue = queue[1:]
        if n == nil {
            toks = append(toks, "null")
            continue
        }
        toks = append(toks, strconv.Itoa(n.Val))
        queue = append(queue, n.Left)
        queue = append(queue, n.Right)
    }
    for len(toks) > 0 && toks[len(toks)-1] == "null" {
        toks = toks[:len(toks)-1]
    }
    return "[" + strings.Join(toks, ",") + "]"
}

func _pgc_parse_tree_line(line string) *TreeNode {
    var tokens []json.RawMessage
    if err := json.Unmarshal([]byte(line), &tokens); err != nil {
        return nil
    }
    return _pgc_arr_to_tree(tokens)
}

func _pgc_jsonify(v interface{}) string {
    b, err := json.Marshal(v)
    if err != nil {
        return "null"
    }
    return string(b)
}
`;

// ─── Swift / Kotlin / Rust / TypeScript helpers ───

const SWIFT_HELPERS = `
import Foundation

class ListNode {
    var val: Int = 0
    var next: ListNode? = nil
    init(_ v: Int) { val = v }
}

class TreeNode {
    var val: Int = 0
    var left: TreeNode? = nil
    var right: TreeNode? = nil
    init(_ v: Int) { val = v }
}

func _pgcReadJSON(_ s: String) -> Any? {
    let data = s.data(using: .utf8) ?? Data()
    return try? JSONSerialization.jsonObject(with: data, options: [.allowFragments])
}

func _pgcAsInt(_ v: Any?) -> Int {
    if let n = v as? Int { return n }
    if let n = v as? Double { return Int(n) }
    if let n = v as? NSNumber { return n.intValue }
    if let s = v as? String { return Int(s) ?? 0 }
    return 0
}

func _pgcAsDouble(_ v: Any?) -> Double {
    if let n = v as? Double { return n }
    if let n = v as? Int { return Double(n) }
    if let n = v as? NSNumber { return n.doubleValue }
    if let s = v as? String { return Double(s) ?? 0 }
    return 0
}

func _pgcAsBool(_ v: Any?) -> Bool {
    if let b = v as? Bool { return b }
    if let n = v as? NSNumber { return n.boolValue }
    if let s = v as? String { return s == "true" }
    return false
}

func _pgcAsString(_ v: Any?) -> String {
    if let s = v as? String { return s }
    if v == nil { return "" }
    return String(describing: v!)
}

func _pgcIntArr(_ v: Any?) -> [Int] {
    guard let a = v as? [Any] else { return [] }
    return a.map { _pgcAsInt($0) }
}

func _pgcBoolArr(_ v: Any?) -> [Bool] {
    guard let a = v as? [Any] else { return [] }
    return a.map { _pgcAsBool($0) }
}

func _pgcStrArr(_ v: Any?) -> [String] {
    guard let a = v as? [Any] else { return [] }
    return a.map { _pgcAsString($0) }
}

func _pgcIntIntArr(_ v: Any?) -> [[Int]] {
    guard let a = v as? [Any] else { return [] }
    return a.map { _pgcIntArr($0) }
}

func _pgcStrStrArr(_ v: Any?) -> [[String]] {
    guard let a = v as? [Any] else { return [] }
    return a.map { _pgcStrArr($0) }
}

func _pgcArrToList(_ arr: [Int]) -> ListNode? {
    if arr.isEmpty { return nil }
    let head = ListNode(arr[0])
    var cur = head
    for i in 1..<arr.count {
        cur.next = ListNode(arr[i])
        cur = cur.next!
    }
    return head
}

func _pgcArrToListCycle(_ arr: [Int], _ pos: Int) -> ListNode? {
    if arr.isEmpty { return nil }
    var nodes: [ListNode] = []
    for v in arr { nodes.append(ListNode(v)) }
    for i in 0..<(nodes.count - 1) { nodes[i].next = nodes[i + 1] }
    if pos >= 0 && pos < nodes.count {
        nodes[nodes.count - 1].next = nodes[pos]
    }
    return nodes[0]
}

func _pgcListToArr(_ head: ListNode?) -> [Int] {
    var out: [Int] = []
    var cur = head
    while cur != nil { out.append(cur!.val); cur = cur!.next }
    return out
}

// Tree tokens: ints or nil (parsed from JSON-with-nulls).
func _pgcArrToTree(_ tokens: [Any?]) -> TreeNode? {
    if tokens.isEmpty { return nil }
    if tokens[0] == nil { return nil }
    let root = TreeNode(_pgcAsInt(tokens[0]))
    var queue: [TreeNode] = [root]
    var i = 1
    while !queue.isEmpty && i < tokens.count {
        let node = queue.removeFirst()
        if i < tokens.count, tokens[i] != nil {
            node.left = TreeNode(_pgcAsInt(tokens[i]))
            queue.append(node.left!)
        }
        i += 1
        if i < tokens.count, tokens[i] != nil {
            node.right = TreeNode(_pgcAsInt(tokens[i]))
            queue.append(node.right!)
        }
        i += 1
    }
    return root
}

func _pgcParseTreeLine(_ line: String) -> TreeNode? {
    let data = line.data(using: .utf8) ?? Data()
    guard let raw = try? JSONSerialization.jsonObject(with: data, options: [.allowFragments]) else { return nil }
    guard let arr = raw as? [Any] else { return nil }
    let mapped: [Any?] = arr.map { v -> Any? in
        if v is NSNull { return nil }
        return v
    }
    return _pgcArrToTree(mapped)
}

func _pgcTreeToArr(_ root: TreeNode?) -> String {
    guard let root = root else { return "[]" }
    var toks: [String] = []
    var queue: [TreeNode?] = [root]
    while !queue.isEmpty {
        let n = queue.removeFirst()
        if let n = n {
            toks.append(String(n.val))
            queue.append(n.left)
            queue.append(n.right)
        } else {
            toks.append("null")
        }
    }
    while !toks.isEmpty && toks.last == "null" { toks.removeLast() }
    return "[" + toks.joined(separator: ",") + "]"
}

func _pgcJsonify(_ v: Any) -> String {
    // Try Foundation first; fall back for bare scalars / Swift-native types.
    if let b = v as? Bool { return b ? "true" : "false" }
    if let n = v as? Int { return String(n) }
    if let n = v as? Double {
        if n == n.rounded() && abs(n) < 1e15 { return String(Int(n)) }
        return String(n)
    }
    if let s = v as? String {
        let esc = s.replacingOccurrences(of: "\\\\", with: "\\\\\\\\").replacingOccurrences(of: "\\"", with: "\\\\\\"")
        return "\\"" + esc + "\\""
    }
    if let a = v as? [Int] {
        return "[" + a.map { String($0) }.joined(separator: ",") + "]"
    }
    if let a = v as? [Bool] {
        return "[" + a.map { $0 ? "true" : "false" }.joined(separator: ",") + "]"
    }
    if let a = v as? [String] {
        return "[" + a.map { _pgcJsonify($0) }.joined(separator: ",") + "]"
    }
    if let a = v as? [[Int]] {
        return "[" + a.map { _pgcJsonify($0) }.joined(separator: ",") + "]"
    }
    if let a = v as? [[String]] {
        return "[" + a.map { _pgcJsonify($0) }.joined(separator: ",") + "]"
    }
    if let a = v as? [Any] {
        return "[" + a.map { _pgcJsonify($0) }.joined(separator: ",") + "]"
    }
    if let data = try? JSONSerialization.data(withJSONObject: v, options: []),
       let s = String(data: data, encoding: .utf8) {
        return s
    }
    return "null"
}
`;

const KOTLIN_HELPERS = `
import java.io.*

class ListNode(var \`val\`: Int) {
    var next: ListNode? = null
}

class TreeNode(var \`val\`: Int) {
    var left: TreeNode? = null
    var right: TreeNode? = null
}

object PGC {
    fun splitTop(raw: String): List<String> {
        val t = raw.trim()
        if (t.length < 2) return emptyList()
        val inner = t.substring(1, t.length - 1).trim()
        if (inner.isEmpty()) return emptyList()
        val out = mutableListOf<String>()
        var depth = 0
        var start = 0
        var inStr = false
        var i = 0
        while (i < inner.length) {
            val c = inner[i]
            if (c == '"' && (i == 0 || inner[i - 1] != '\\\\')) inStr = !inStr
            else if (!inStr && c == '[') depth++
            else if (!inStr && c == ']') depth--
            else if (!inStr && c == ',' && depth == 0) {
                out.add(inner.substring(start, i).trim())
                start = i + 1
            }
            i++
        }
        out.add(inner.substring(start).trim())
        return out
    }

    fun stripQuotes(raw: String): String {
        val t = raw.trim()
        if (t.length >= 2 && t.startsWith("\\"") && t.endsWith("\\"")) {
            return t.substring(1, t.length - 1)
        }
        return t
    }

    fun parseIntArr(raw: String): IntArray = splitTop(raw).map { it.trim().toInt() }.toIntArray()
    fun parseBoolArr(raw: String): BooleanArray = splitTop(raw).map { it.trim() == "true" }.toBooleanArray()
    fun parseStrArr(raw: String): Array<String> = splitTop(raw).map { stripQuotes(it) }.toTypedArray()
    fun parseIntIntArr(raw: String): Array<IntArray> = splitTop(raw).map { parseIntArr(it) }.toTypedArray()
    fun parseStrStrArr(raw: String): Array<Array<String>> = splitTop(raw).map { parseStrArr(it) }.toTypedArray()

    fun arrToList(arr: IntArray): ListNode? {
        if (arr.isEmpty()) return null
        val head = ListNode(arr[0])
        var cur = head
        for (i in 1 until arr.size) {
            cur.next = ListNode(arr[i])
            cur = cur.next!!
        }
        return head
    }

    fun arrToListCycle(arr: IntArray, pos: Int): ListNode? {
        if (arr.isEmpty()) return null
        val nodes = Array(arr.size) { ListNode(arr[it]) }
        for (i in 0 until nodes.size - 1) {
            nodes[i].next = nodes[i + 1]
        }
        if (pos >= 0 && pos < nodes.size) {
            nodes[nodes.size - 1].next = nodes[pos]
        }
        return nodes[0]
    }

    fun listToStr(head: ListNode?): String {
        val sb = StringBuilder("[")
        var cur = head
        var first = true
        while (cur != null) {
            if (!first) sb.append(',')
            sb.append(cur.\`val\`)
            first = false
            cur = cur.next
        }
        sb.append(']')
        return sb.toString()
    }

    fun parseTreeTokens(raw: String): List<Int?> {
        return splitTop(raw).map { tok ->
            val t = tok.trim()
            if (t == "null") null else t.toInt()
        }
    }

    fun arrToTree(tokens: List<Int?>): TreeNode? {
        if (tokens.isEmpty() || tokens[0] == null) return null
        val root = TreeNode(tokens[0]!!)
        val q: java.util.ArrayDeque<TreeNode> = java.util.ArrayDeque()
        q.addLast(root)
        var i = 1
        while (q.isNotEmpty() && i < tokens.size) {
            val n = q.removeFirst()
            if (i < tokens.size && tokens[i] != null) {
                n.left = TreeNode(tokens[i]!!)
                q.addLast(n.left!!)
            }
            i++
            if (i < tokens.size && tokens[i] != null) {
                n.right = TreeNode(tokens[i]!!)
                q.addLast(n.right!!)
            }
            i++
        }
        return root
    }

    fun treeToStr(root: TreeNode?): String {
        if (root == null) return "[]"
        val toks = mutableListOf<String>()
        val q: java.util.ArrayDeque<TreeNode?> = java.util.ArrayDeque()
        q.addLast(root)
        while (q.isNotEmpty()) {
            val n = q.removeFirst()
            if (n == null) { toks.add("null"); continue }
            toks.add(n.\`val\`.toString())
            q.addLast(n.left)
            q.addLast(n.right)
        }
        while (toks.isNotEmpty() && toks.last() == "null") toks.removeAt(toks.size - 1)
        return "[" + toks.joinToString(",") + "]"
    }

    fun jsonifyStr(s: String): String {
        val esc = s.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"")
        return "\\"" + esc + "\\""
    }

    fun jsonify(v: Any?): String {
        if (v == null) return "null"
        return when (v) {
            is Boolean -> if (v) "true" else "false"
            is Int, is Long, is Short, is Byte -> v.toString()
            is Double, is Float -> v.toString()
            is String -> jsonifyStr(v)
            is IntArray -> "[" + v.joinToString(",") + "]"
            is LongArray -> "[" + v.joinToString(",") + "]"
            is DoubleArray -> "[" + v.joinToString(",") + "]"
            is BooleanArray -> "[" + v.joinToString(",") { if (it) "true" else "false" } + "]"
            is Array<*> -> "[" + v.joinToString(",") { jsonify(it) } + "]"
            is List<*> -> "[" + v.joinToString(",") { jsonify(it) } + "]"
            is ListNode -> listToStr(v)
            is TreeNode -> treeToStr(v)
            else -> v.toString()
        }
    }
}
`;

const RUST_HELPERS = `
use std::io::{self, Read};
use std::rc::Rc;
use std::cell::RefCell;

#[derive(Debug, PartialEq, Eq)]
pub struct ListNode {
    pub val: i32,
    pub next: Option<Box<ListNode>>,
}

impl ListNode {
    #[inline]
    pub fn new(val: i32) -> Self { ListNode { val, next: None } }
}

#[derive(Debug, PartialEq, Eq)]
pub struct TreeNode {
    pub val: i32,
    pub left: Option<Rc<RefCell<TreeNode>>>,
    pub right: Option<Rc<RefCell<TreeNode>>>,
}

impl TreeNode {
    #[inline]
    pub fn new(val: i32) -> Self { TreeNode { val, left: None, right: None } }
}

pub struct Solution;

// ── std-only JSON-ish parsing ──

fn _pgc_trim(s: &str) -> &str { s.trim() }

fn _pgc_strip_quotes(s: &str) -> String {
    let t = s.trim();
    if t.len() >= 2 && t.starts_with('"') && t.ends_with('"') {
        t[1..t.len() - 1].to_string()
    } else {
        t.to_string()
    }
}

// Split "[a,b,[c,d]]" at top-level commas (no quoted-string escape handling beyond \\").
fn _pgc_split_top(raw: &str) -> Vec<String> {
    let t = raw.trim();
    if t.len() < 2 { return Vec::new(); }
    let inner = t[1..t.len() - 1].trim().to_string();
    if inner.is_empty() { return Vec::new(); }
    let bytes = inner.as_bytes();
    let mut out: Vec<String> = Vec::new();
    let mut depth: i32 = 0;
    let mut start: usize = 0;
    let mut in_str = false;
    let mut i: usize = 0;
    while i < bytes.len() {
        let c = bytes[i] as char;
        if c == '"' && (i == 0 || bytes[i - 1] as char != '\\\\') {
            in_str = !in_str;
        } else if !in_str && c == '[' {
            depth += 1;
        } else if !in_str && c == ']' {
            depth -= 1;
        } else if !in_str && c == ',' && depth == 0 {
            out.push(inner[start..i].trim().to_string());
            start = i + 1;
        }
        i += 1;
    }
    out.push(inner[start..].trim().to_string());
    out
}

fn _pgc_parse_i64(raw: &str) -> i64 { raw.trim().parse::<i64>().unwrap_or(0) }
fn _pgc_parse_f64(raw: &str) -> f64 { raw.trim().parse::<f64>().unwrap_or(0.0) }
fn _pgc_parse_bool(raw: &str) -> bool { raw.trim() == "true" }
fn _pgc_parse_str(raw: &str) -> String { _pgc_strip_quotes(raw) }

fn _pgc_parse_vi(raw: &str) -> Vec<i64> {
    _pgc_split_top(raw).iter().map(|p| _pgc_parse_i64(p)).collect()
}
fn _pgc_parse_vb(raw: &str) -> Vec<bool> {
    _pgc_split_top(raw).iter().map(|p| _pgc_parse_bool(p)).collect()
}
fn _pgc_parse_vs(raw: &str) -> Vec<String> {
    _pgc_split_top(raw).iter().map(|p| _pgc_strip_quotes(p)).collect()
}
fn _pgc_parse_vvi(raw: &str) -> Vec<Vec<i64>> {
    _pgc_split_top(raw).iter().map(|p| _pgc_parse_vi(p)).collect()
}
fn _pgc_parse_vvs(raw: &str) -> Vec<Vec<String>> {
    _pgc_split_top(raw).iter().map(|p| _pgc_parse_vs(p)).collect()
}

// Tokens can be "null" or an integer.
fn _pgc_parse_tree_tokens(raw: &str) -> Vec<Option<i32>> {
    _pgc_split_top(raw).iter().map(|p| {
        let t = p.trim();
        if t == "null" { None } else { Some(t.parse::<i32>().unwrap_or(0)) }
    }).collect()
}

fn _pgc_arr_to_list(arr: &[i64]) -> Option<Box<ListNode>> {
    let mut head: Option<Box<ListNode>> = None;
    for &v in arr.iter().rev() {
        let mut node = Box::new(ListNode::new(v as i32));
        node.next = head;
        head = Some(node);
    }
    head
}

// Rust's owning Box<ListNode> can't model a true cycle without unsafe pointers.
// For cycle-input problems we instead leak Box'd nodes and rewire next ptrs raw,
// so the user code can traverse the cycled list via the public next field.
fn _pgc_arr_to_list_cycle(arr: &[i64], pos: i64) -> Option<Box<ListNode>> {
    if arr.is_empty() { return None; }
    let mut raw_nodes: Vec<*mut ListNode> = Vec::with_capacity(arr.len());
    for &v in arr.iter() {
        let b = Box::new(ListNode::new(v as i32));
        raw_nodes.push(Box::into_raw(b));
    }
    unsafe {
        for i in 0..(raw_nodes.len() - 1) {
            (*raw_nodes[i]).next = Some(Box::from_raw(raw_nodes[i + 1]));
        }
        if pos >= 0 && (pos as usize) < raw_nodes.len() {
            let target = raw_nodes[pos as usize];
            // Resurrect a Box from the target raw pointer — duplicate ownership
            // that will form the cycle when the tail's next is set.
            (*raw_nodes[raw_nodes.len() - 1]).next = Some(Box::from_raw(target));
        }
        Some(Box::from_raw(raw_nodes[0]))
    }
}

fn _pgc_list_to_vec(mut head: Option<Box<ListNode>>) -> Vec<i64> {
    let mut out: Vec<i64> = Vec::new();
    while let Some(node) = head {
        out.push(node.val as i64);
        head = node.next;
    }
    out
}

fn _pgc_arr_to_tree(tokens: &[Option<i32>]) -> Option<Rc<RefCell<TreeNode>>> {
    if tokens.is_empty() { return None; }
    let root_val = match tokens[0] { Some(v) => v, None => return None };
    let root = Rc::new(RefCell::new(TreeNode::new(root_val)));
    let mut q: std::collections::VecDeque<Rc<RefCell<TreeNode>>> = std::collections::VecDeque::new();
    q.push_back(root.clone());
    let mut i = 1usize;
    while let Some(node) = q.pop_front() {
        if i >= tokens.len() { break; }
        if let Some(v) = tokens[i] {
            let child = Rc::new(RefCell::new(TreeNode::new(v)));
            node.borrow_mut().left = Some(child.clone());
            q.push_back(child);
        }
        i += 1;
        if i >= tokens.len() { break; }
        if let Some(v) = tokens[i] {
            let child = Rc::new(RefCell::new(TreeNode::new(v)));
            node.borrow_mut().right = Some(child.clone());
            q.push_back(child);
        }
        i += 1;
    }
    Some(root)
}

fn _pgc_tree_to_str(root: Option<Rc<RefCell<TreeNode>>>) -> String {
    if root.is_none() { return "[]".to_string(); }
    let mut toks: Vec<String> = Vec::new();
    let mut q: std::collections::VecDeque<Option<Rc<RefCell<TreeNode>>>> = std::collections::VecDeque::new();
    q.push_back(root);
    while let Some(item) = q.pop_front() {
        match item {
            None => toks.push("null".to_string()),
            Some(n) => {
                let nb = n.borrow();
                toks.push(nb.val.to_string());
                q.push_back(nb.left.clone());
                q.push_back(nb.right.clone());
            }
        }
    }
    while toks.last().map(|s| s == "null").unwrap_or(false) {
        toks.pop();
    }
    let mut s = String::from("[");
    s.push_str(&toks.join(","));
    s.push(']');
    s
}

fn _pgc_ser_bool(b: bool) -> String { if b { "true".to_string() } else { "false".to_string() } }
fn _pgc_ser_i64(x: i64) -> String { x.to_string() }
fn _pgc_ser_f64(x: f64) -> String { x.to_string() }
fn _pgc_ser_str(s: &str) -> String {
    let mut out = String::from("\\"");
    for c in s.chars() {
        if c == '"' || c == '\\\\' { out.push('\\\\'); }
        out.push(c);
    }
    out.push('"');
    out
}

fn _pgc_ser_vi(v: &Vec<i64>) -> String {
    let mut s = String::from("[");
    for (i, x) in v.iter().enumerate() { if i > 0 { s.push(','); } s.push_str(&x.to_string()); }
    s.push(']'); s
}
fn _pgc_ser_vb(v: &Vec<bool>) -> String {
    let mut s = String::from("[");
    for (i, x) in v.iter().enumerate() { if i > 0 { s.push(','); } s.push_str(if *x { "true" } else { "false" }); }
    s.push(']'); s
}
fn _pgc_ser_vs(v: &Vec<String>) -> String {
    let mut s = String::from("[");
    for (i, x) in v.iter().enumerate() { if i > 0 { s.push(','); } s.push_str(&_pgc_ser_str(x)); }
    s.push(']'); s
}
fn _pgc_ser_vvi(v: &Vec<Vec<i64>>) -> String {
    let mut s = String::from("[");
    for (i, x) in v.iter().enumerate() { if i > 0 { s.push(','); } s.push_str(&_pgc_ser_vi(x)); }
    s.push(']'); s
}
fn _pgc_ser_vvs(v: &Vec<Vec<String>>) -> String {
    let mut s = String::from("[");
    for (i, x) in v.iter().enumerate() { if i > 0 { s.push(','); } s.push_str(&_pgc_ser_vs(x)); }
    s.push(']'); s
}
`;

// Judge0's TypeScript ships with an old default tsconfig — declare globals we
// rely on (Map, require, process) and disable strict checking so user code
// using newer ES features still compiles.
const TS_HELPERS = `
// @ts-nocheck
declare var require: any;
declare var process: any;

class ListNode {
    val: number;
    next: ListNode | null;
    constructor(val?: number, next?: ListNode | null) {
        this.val = val ?? 0;
        this.next = next ?? null;
    }
}

class TreeNode {
    val: number;
    left: TreeNode | null;
    right: TreeNode | null;
    constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
        this.val = val ?? 0;
        this.left = left ?? null;
        this.right = right ?? null;
    }
}

function _pgcToList(arr: any): ListNode | null {
    if (!arr || arr.length === 0) return null;
    const head = new ListNode(arr[0]);
    let cur = head;
    for (let i = 1; i < arr.length; i++) {
        cur.next = new ListNode(arr[i]);
        cur = cur.next;
    }
    return head;
}

function _pgcToListCycle(arr: any, pos: number): ListNode | null {
    if (!arr || arr.length === 0) return null;
    const nodes: ListNode[] = [new ListNode(arr[0])];
    for (let i = 1; i < arr.length; i++) {
        nodes.push(new ListNode(arr[i]));
        nodes[i - 1].next = nodes[i];
    }
    if (pos != null && pos >= 0 && pos < nodes.length) {
        nodes[nodes.length - 1].next = nodes[pos];
    }
    return nodes[0];
}

function _pgcFromList(head: ListNode | null): number[] {
    const out: number[] = [];
    while (head) { out.push(head.val); head = head.next; }
    return out;
}

function _pgcToTree(arr: any): TreeNode | null {
    if (!arr || arr.length === 0) return null;
    if (arr[0] === null) return null;
    const root = new TreeNode(arr[0]);
    const q: (TreeNode | null)[] = [root];
    let i = 1;
    while (q.length > 0 && i < arr.length) {
        const node = q.shift()!;
        if (i < arr.length && arr[i] !== null) {
            node.left = new TreeNode(arr[i]);
            q.push(node.left);
        }
        i++;
        if (i < arr.length && arr[i] !== null) {
            node.right = new TreeNode(arr[i]);
            q.push(node.right);
        }
        i++;
    }
    return root;
}

function _pgcFromTree(root: TreeNode | null): (number | null)[] {
    if (!root) return [];
    const out: (number | null)[] = [];
    const q: (TreeNode | null)[] = [root];
    while (q.length > 0) {
        const node = q.shift();
        if (!node) { out.push(null); continue; }
        out.push(node.val);
        q.push(node.left);
        q.push(node.right);
    }
    while (out.length > 0 && out[out.length - 1] === null) out.pop();
    return out;
}
`;

// Detect the (List[int] "values", int "pos") convention used for LC 141-style
// cycled-list problems. When true, the harness reads two stdin lines but the
// user function receives a single ListNode head (with the cycle pre-wired).
function isCycledListInput(params) {
  return Array.isArray(params)
    && params.length === 2
    && params[0]?.type === 'List[int]' && params[0]?.name === 'values'
    && params[1]?.type === 'int' && params[1]?.name === 'pos';
}

export function wrapWithDriver(userCode, language, methodName, params, returnType, opts = {}) {
  if (!methodName || !params) return userCode;

  const cycledInput = isCycledListInput(params);
  const args = cycledInput ? 'head' : params.map(p => p.name).join(', ');
  const retIsList = isListNodeType(returnType);
  const retIsTree = isTreeNodeType(returnType);
  const multiCaseCount = Math.max(1, Number(opts.multiCaseCount) || 1);

  if (language === 'python') {
    // Operations runner: design-class problems whose tests are [["ClassName"],[op,args...],...]
    const isOps = params.length === 1 && params[0].name === 'operations'
                  && params[0].type && params[0].type.startsWith('List[List');
    if (isOps) {
      return [
        'import sys, json',
        'from typing import List, Optional, Dict, Tuple, Set',
        PY_HELPERS,
        userCode,
        '',
        '_ops = json.loads(sys.stdin.read().strip())',
        '_results = []',
        '_instance = None',
        'for _op in _ops:',
        '    _name = _op[0]',
        '    _args = _op[1:]',
        '    if _instance is None:',
        '        _cls = globals()[_name]',
        '        _instance = _cls(*_args)',
        '        _results.append(None)',
        '    else:',
        '        _ret = getattr(_instance, _name)(*_args)',
        '        _results.append(_ret)',
        'print(json.dumps(_results))',
      ].join('\n');
    }

    const parsing = cycledInput
      ? [
          '_values = json.loads(_lines[0])',
          '_pos = int(_lines[1].strip())',
          'head = _to_list_cycle(_values, _pos)',
        ].join('\n')
      : params.map((p, i) => {
          if (isListNodeType(p.type)) return `${p.name} = _to_list(json.loads(_lines[${i}]))`;
          if (isTreeNodeType(p.type)) return `${p.name} = _to_tree(json.loads(_lines[${i}]))`;
          return `${p.name} = json.loads(_lines[${i}])`;
        }).join('\n');

    // Output block — use returnType to force correct serialization even when result is None
    let outputBlock;
    if (retIsList) {
      outputBlock = 'print(json.dumps(_from_list(_result)))';
    } else if (retIsTree) {
      outputBlock = 'print(json.dumps(_from_tree(_result)))';
    } else {
      outputBlock = [
        'if isinstance(_result, bool):',
        '    print(str(_result).lower())',
        'elif _result is None:',
        '    print("null")',
        'else:',
        '    print(json.dumps(_result))',
      ].join('\n');
    }

    return [
      'from __future__ import annotations',
      'import sys, json',
      'from typing import List, Optional, Dict, Tuple, Set',
      PY_HELPERS,
      userCode,
      '',
      '_lines = sys.stdin.read().strip().split("\\n")',
      parsing,
      '_sol = Solution()',
      `_result = _sol.${methodName}(${args})`,
      outputBlock,
    ].join('\n');
  }

  if (language === 'javascript') {
    const parsing = cycledInput
      ? [
          'const _values = JSON.parse(_lines[0]);',
          'const _pos = parseInt(_lines[1].trim(), 10);',
          'const head = _toListCycle(_values, _pos);',
        ].join('\n')
      : params.map((p, i) => {
          if (isListNodeType(p.type)) return `const ${p.name} = _toList(JSON.parse(_lines[${i}]));`;
          if (isTreeNodeType(p.type)) return `const ${p.name} = _toTree(JSON.parse(_lines[${i}]));`;
          return `const ${p.name} = JSON.parse(_lines[${i}]);`;
        }).join('\n');

    // Output block — use returnType to force correct serialization even when result is null
    let outputBlock;
    if (retIsList) {
      outputBlock = 'console.log(JSON.stringify(_fromList(_result)));';
    } else if (retIsTree) {
      outputBlock = 'console.log(JSON.stringify(_fromTree(_result)));';
    } else {
      outputBlock = 'console.log(JSON.stringify(_result));';
    }

    return [
      JS_HELPERS,
      userCode,
      '',
      "const _lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');",
      parsing,
      `const _result = ${methodName}(${args});`,
      outputBlock,
    ].join('\n');
  }

  if (language === 'java') {
    const javaParsing = cycledInput
      ? [
          'String _raw_values = br.readLine().trim();',
          '        String _raw_pos = br.readLine().trim();',
          '        int[] _values = _parseIntArr(_raw_values);',
          '        int _pos = Integer.parseInt(_raw_pos);',
          '        ListNode head = _toListCycle(_values, _pos);',
        ].join('\n')
      : params.map(p => {
      const line = `String _raw_${p.name} = br.readLine().trim();`;
      if (p.type === 'int') return `${line}\n        int ${p.name} = Integer.parseInt(_raw_${p.name});`;
      if (p.type === 'str') return `${line}\n        String ${p.name} = _raw_${p.name}.startsWith("\\"") ? _raw_${p.name}.substring(1, _raw_${p.name}.length()-1) : _raw_${p.name};`;
      if (p.type === 'bool') return `${line}\n        boolean ${p.name} = Boolean.parseBoolean(_raw_${p.name});`;
      if (p.type === 'List[int]') return [
        line,
        `        int[] ${p.name} = _parseIntArr(_raw_${p.name});`,
      ].join('\n        ');
      if (p.type === 'List[str]') return [
        line,
        `        String _s_${p.name} = _raw_${p.name}.substring(1, _raw_${p.name}.length()-1);`,
        `        String[] ${p.name} = _s_${p.name}.isEmpty() ? new String[0] : _s_${p.name}.split(",");`,
        `        for(int i=0;i<${p.name}.length;i++) ${p.name}[i]=${p.name}[i].trim().replace("\\"","");`,
      ].join('\n        ');
      if (p.type === 'List[List[int]]') return [
        line,
        `        int[][] ${p.name} = _parseIntIntArr(_raw_${p.name});`,
      ].join('\n        ');
      if (p.type === 'List[List[str]]') return [
        line,
        `        String[][] ${p.name} = _parseStrStrArr(_raw_${p.name});`,
      ].join('\n        ');
      if (isListNodeType(p.type)) return [
        line,
        `        ListNode ${p.name} = _toList(_parseIntArr(_raw_${p.name}));`,
      ].join('\n        ');
      if (isTreeNodeType(p.type)) return [
        line,
        `        TreeNode ${p.name} = _toTree(_parseIntegerArr(_raw_${p.name}));`,
      ].join('\n        ');
      return `${line}\n        // TODO: parse ${p.type}`;
    }).join('\n        ');

    // Pick the serialization expression for the call result. When the return is
    // a node type, we serialize via _jsonList / _jsonTree to match LC formatting.
    const callAndSerializeSingle = retIsList
      ? [
          `        ListNode _result = sol.${methodName}(${args});`,
          '        System.out.println(_jsonList(_result));',
        ].join('\n')
      : retIsTree
      ? [
          `        TreeNode _result = sol.${methodName}(${args});`,
          '        System.out.println(_jsonTree(_result));',
        ].join('\n')
      : [
          `        Object _result = (Object) sol.${methodName}(${args});`,
          '        System.out.println(_jsonify(_result));',
        ].join('\n');

    // Multi-case body uses _jsonify which dispatches on runtime type — that path
    // now recognizes ListNode and TreeNode too, so node-returning problems work
    // in batched mode without special casing.
    const multiCallAndSerialize = retIsList
      ? [
          `                ListNode _result = sol.${methodName}(${args});`,
          '                _out.append(_jsonList(_result));',
        ].join('\n')
      : retIsTree
      ? [
          `                TreeNode _result = sol.${methodName}(${args});`,
          '                _out.append(_jsonTree(_result));',
        ].join('\n')
      : [
          `                Object _result = (Object) sol.${methodName}(${args});`,
          '                _out.append(_jsonify(_result));',
        ].join('\n');

    // Multi-case mode: one compile, N runs. Each case reads params.length lines,
    // then consumes exactly one separator line (JAVA_CASE_SEP). On exception we
    // print an error line so the client can mark that single case as failed
    // without losing subsequent cases.
    const mainBody = multiCaseCount > 1 ? [
      '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
      '        Solution sol = new Solution();',
      `        int _N = ${multiCaseCount};`,
      '        StringBuilder _out = new StringBuilder();',
      '        for (int _c = 0; _c < _N; _c++) {',
      '            try {',
      `                ${javaParsing}`,
      multiCallAndSerialize,
      '            } catch (Throwable _t) {',
      `                _out.append("${JAVA_ERR_PREFIX}").append(_t.getClass().getSimpleName()).append(": ").append(String.valueOf(_t.getMessage()));`,
      '            }',
      `            _out.append('\\n').append("${JAVA_OUT_END}").append('\\n');`,
      '            if (_c < _N - 1) {',
      '                // Consume the case separator line from stdin',
      '                String _sep = br.readLine();',
      '                // tolerate missing separator silently',
      '            }',
      '        }',
      '        System.out.print(_out.toString());',
    ].join('\n') : [
      '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
      `        ${javaParsing}`,
      '        Solution sol = new Solution();',
      callAndSerializeSingle,
    ].join('\n');

    // Strip user-supplied import statements — we already provide java.util.* and
    // java.io.*, and Java requires imports to precede class declarations (which
    // the harness injects above the user's Solution).
    const cleanedJava = String(userCode || '').replace(/^\s*import\s+[^;]+;\s*$/gm, '').replace(/^\s*package\s+[^;]+;\s*$/gm, '');

    return [
      'import java.util.*;',
      'import java.io.*;',
      '',
      'class ListNode {',
      '    int val;',
      '    ListNode next;',
      '    ListNode() {}',
      '    ListNode(int val) { this.val = val; }',
      '    ListNode(int val, ListNode next) { this.val = val; this.next = next; }',
      '}',
      '',
      'class TreeNode {',
      '    int val;',
      '    TreeNode left;',
      '    TreeNode right;',
      '    TreeNode() {}',
      '    TreeNode(int val) { this.val = val; }',
      '    TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }',
      '}',
      '',
      cleanedJava,
      '',
      'class Main {',
      '    public static void main(String[] _args) throws Exception {',
      mainBody,
      '    }',
      '',
      '    static int[] _parseIntArr(String s) {',
      '        if (s == null) return new int[0];',
      '        String t = s.trim();',
      '        if (t.length() < 2) return new int[0];',
      '        String inner = t.substring(1, t.length()-1).trim();',
      '        if (inner.isEmpty()) return new int[0];',
      '        String[] parts = inner.split(",");',
      '        int[] arr = new int[parts.length];',
      '        for (int i = 0; i < parts.length; i++) arr[i] = Integer.parseInt(parts[i].trim());',
      '        return arr;',
      '    }',
      '',
      '    // Parses "[1,null,3,null,null]" — uses Integer so null slots survive as nulls.',
      '    static Integer[] _parseIntegerArr(String s) {',
      '        if (s == null) return new Integer[0];',
      '        String t = s.trim();',
      '        if (t.length() < 2) return new Integer[0];',
      '        String inner = t.substring(1, t.length()-1).trim();',
      '        if (inner.isEmpty()) return new Integer[0];',
      '        String[] parts = inner.split(",");',
      '        Integer[] arr = new Integer[parts.length];',
      '        for (int i = 0; i < parts.length; i++) {',
      '            String p = parts[i].trim();',
      '            arr[i] = p.equals("null") ? null : Integer.valueOf(p);',
      '        }',
      '        return arr;',
      '    }',
      '',
      '    static ListNode _toList(int[] arr) {',
      '        if (arr == null || arr.length == 0) return null;',
      '        ListNode head = new ListNode(arr[0]);',
      '        ListNode cur = head;',
      '        for (int i = 1; i < arr.length; i++) { cur.next = new ListNode(arr[i]); cur = cur.next; }',
      '        return head;',
      '    }',
      '',
      '    static ListNode _toListCycle(int[] arr, int pos) {',
      '        if (arr == null || arr.length == 0) return null;',
      '        ListNode[] nodes = new ListNode[arr.length];',
      '        for (int i = 0; i < arr.length; i++) nodes[i] = new ListNode(arr[i]);',
      '        for (int i = 0; i + 1 < arr.length; i++) nodes[i].next = nodes[i + 1];',
      '        if (pos >= 0 && pos < arr.length) nodes[arr.length - 1].next = nodes[pos];',
      '        return nodes[0];',
      '    }',
      '',
      '    static TreeNode _toTree(Integer[] arr) {',
      '        if (arr == null || arr.length == 0 || arr[0] == null) return null;',
      '        TreeNode root = new TreeNode(arr[0]);',
      '        Deque<TreeNode> q = new ArrayDeque<>();',
      '        q.add(root);',
      '        int i = 1;',
      '        while (!q.isEmpty() && i < arr.length) {',
      '            TreeNode n = q.poll();',
      '            if (i < arr.length && arr[i] != null) { n.left = new TreeNode(arr[i]); q.add(n.left); }',
      '            i++;',
      '            if (i < arr.length && arr[i] != null) { n.right = new TreeNode(arr[i]); q.add(n.right); }',
      '            i++;',
      '        }',
      '        return root;',
      '    }',
      '',
      '    static String _jsonList(ListNode head) {',
      '        StringBuilder sb = new StringBuilder("[");',
      '        int n = 0;',
      '        for (ListNode c = head; c != null; c = c.next) { if (n++ > 0) sb.append(","); sb.append(c.val); }',
      '        sb.append("]");',
      '        return sb.toString();',
      '    }',
      '',
      '    // BFS serialization with trailing-null trim, matching LeetCode tree format.',
      '    // LinkedList (not ArrayDeque) so the queue can hold null sentinels.',
      '    static String _jsonTree(TreeNode root) {',
      '        if (root == null) return "[]";',
      '        List<String> out = new ArrayList<>();',
      '        LinkedList<TreeNode> q = new LinkedList<>();',
      '        q.add(root);',
      '        while (!q.isEmpty()) {',
      '            TreeNode n = q.poll();',
      '            if (n == null) { out.add("null"); continue; }',
      '            out.add(String.valueOf(n.val));',
      '            q.add(n.left);',
      '            q.add(n.right);',
      '        }',
      '        while (!out.isEmpty() && out.get(out.size()-1).equals("null")) out.remove(out.size()-1);',
      '        return "[" + String.join(",", out) + "]";',
      '    }',
      '',
      '    static int[][] _parseIntIntArr(String s) {',
      '        if (s.length() < 2) return new int[0][];',
      '        String inner = s.substring(1, s.length()-1);',
      '        if (inner.isEmpty()) return new int[0][];',
      '        List<int[]> rows = new ArrayList<>();',
      '        int depth = 0, start = 0;',
      '        for (int i = 0; i < inner.length(); i++) {',
      '            char c = inner.charAt(i);',
      '            if (c == \'[\') depth++;',
      '            else if (c == \']\') {',
      '                depth--;',
      '                if (depth == 0) {',
      '                    String row = inner.substring(start, i+1);',
      '                    String ri = row.substring(1, row.length()-1);',
      '                    if (ri.isEmpty()) rows.add(new int[0]);',
      '                    else {',
      '                        String[] parts = ri.split(",");',
      '                        int[] arr = new int[parts.length];',
      '                        for (int k = 0; k < parts.length; k++) arr[k] = Integer.parseInt(parts[k].trim());',
      '                        rows.add(arr);',
      '                    }',
      '                    i++; // skip comma',
      '                    start = i + 1;',
      '                }',
      '            }',
      '        }',
      '        return rows.toArray(new int[0][]);',
      '    }',
      '',
      '    static String[][] _parseStrStrArr(String s) {',
      '        if (s.length() < 2) return new String[0][];',
      '        String inner = s.substring(1, s.length()-1);',
      '        if (inner.isEmpty()) return new String[0][];',
      '        List<String[]> rows = new ArrayList<>();',
      '        int depth = 0, start = 0;',
      '        for (int i = 0; i < inner.length(); i++) {',
      '            char c = inner.charAt(i);',
      '            if (c == \'[\') depth++;',
      '            else if (c == \']\') {',
      '                depth--;',
      '                if (depth == 0) {',
      '                    String row = inner.substring(start, i+1);',
      '                    String ri = row.substring(1, row.length()-1);',
      '                    if (ri.isEmpty()) rows.add(new String[0]);',
      '                    else {',
      '                        String[] parts = ri.split(",");',
      '                        for (int k = 0; k < parts.length; k++) parts[k] = parts[k].trim().replace("\\"","");',
      '                        rows.add(parts);',
      '                    }',
      '                    i++;',
      '                    start = i + 1;',
      '                }',
      '            }',
      '        }',
      '        return rows.toArray(new String[0][]);',
      '    }',
      '',
      '    static String _jsonify(Object o) {',
      '        if (o == null) return "null";',
      '        if (o instanceof Boolean || o instanceof Integer || o instanceof Long || o instanceof Double || o instanceof Float) return o.toString();',
      '        if (o instanceof Character) return "\\"" + o + "\\"";',
      '        if (o instanceof String) return "\\"" + o + "\\"";',
      '        if (o instanceof ListNode) return _jsonList((ListNode) o);',
      '        if (o instanceof TreeNode) return _jsonTree((TreeNode) o);',
      '        if (o instanceof int[]) {',
      '            StringBuilder sb = new StringBuilder("[");',
      '            int[] a = (int[]) o;',
      '            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }',
      '            sb.append("]"); return sb.toString();',
      '        }',
      '        if (o instanceof long[]) {',
      '            StringBuilder sb = new StringBuilder("[");',
      '            long[] a = (long[]) o;',
      '            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }',
      '            sb.append("]"); return sb.toString();',
      '        }',
      '        if (o instanceof boolean[]) {',
      '            StringBuilder sb = new StringBuilder("[");',
      '            boolean[] a = (boolean[]) o;',
      '            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }',
      '            sb.append("]"); return sb.toString();',
      '        }',
      '        if (o instanceof int[][]) {',
      '            StringBuilder sb = new StringBuilder("[");',
      '            int[][] a = (int[][]) o;',
      '            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(_jsonify(a[i])); }',
      '            sb.append("]"); return sb.toString();',
      '        }',
      '        if (o instanceof String[]) {',
      '            StringBuilder sb = new StringBuilder("[");',
      '            String[] a = (String[]) o;',
      '            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append("\\"").append(a[i]).append("\\""); }',
      '            sb.append("]"); return sb.toString();',
      '        }',
      '        if (o instanceof String[][]) {',
      '            StringBuilder sb = new StringBuilder("[");',
      '            String[][] a = (String[][]) o;',
      '            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(_jsonify(a[i])); }',
      '            sb.append("]"); return sb.toString();',
      '        }',
      '        if (o instanceof java.util.List) {',
      '            StringBuilder sb = new StringBuilder("[");',
      '            java.util.List<?> l = (java.util.List<?>) o;',
      '            for (int i = 0; i < l.size(); i++) { if (i > 0) sb.append(","); sb.append(_jsonify(l.get(i))); }',
      '            sb.append("]"); return sb.toString();',
      '        }',
      '        return o.toString();',
      '    }',
      '}',
    ].join('\n');
  }

  if (language === 'cpp') {
    // Design-class "operations" problems need runtime class lookup — out of scope for C++;
    // fall back to raw user code so the user can write their own driver if they must.
    const isOps = params.length === 1 && params[0].name === 'operations'
                  && params[0].type && params[0].type.startsWith('List[List');
    if (isOps) return userCode;

    // Parse one param from a raw line into the typed variable.
    const parseForType = (name, type) => {
      const raw = `_raw_${name}`;
      if (type === 'int')   return `long long ${name}_ll = stoll(_pgc_trim(${raw})); int ${name} = (int)${name}_ll;`;
      if (type === 'float') return `double ${name} = stod(_pgc_trim(${raw}));`;
      if (type === 'bool')  return `bool ${name} = (_pgc_trim(${raw}) == "true");`;
      if (type === 'str')   return `string ${name} = _pgc_strip_quotes(${raw});`;
      if (type === 'List[int]')        return `vector<int> ${name} = _pgc_parse_vi(${raw});`;
      if (type === 'List[str]')        return `vector<string> ${name} = _pgc_parse_vs(${raw});`;
      if (type === 'List[bool]')       return `vector<bool> ${name} = _pgc_parse_vb(${raw});`;
      if (type === 'List[List[int]]')  return `vector<vector<int>> ${name} = _pgc_parse_vvi(${raw});`;
      if (type === 'List[List[str]]')  return `vector<vector<string>> ${name} = _pgc_parse_vvs(${raw});`;
      if (isListNodeType(type))        return `ListNode* ${name} = _pgc_to_list(_pgc_parse_vi(${raw}));`;
      if (isTreeNodeType(type))        return `TreeNode* ${name} = _pgc_to_tree(_pgc_parse_tree_tokens(${raw}));`;
      return `string ${name} = ${raw}; // TODO: unsupported type ${type}`;
    };

    // Serialize the method's return value. Falls back to `<< _result` if type isn't recognized.
    let serializeExpr;
    if (returnType === 'int')                serializeExpr = '_pgc_ser_int((long long)_result)';
    else if (returnType === 'float')         serializeExpr = '_pgc_ser_double(_result)';
    else if (returnType === 'bool')          serializeExpr = '_pgc_ser_bool(_result)';
    else if (returnType === 'str')           serializeExpr = '_pgc_ser_str(_result)';
    else if (returnType === 'List[int]')     serializeExpr = '_pgc_ser_vi(_result)';
    else if (returnType === 'List[str]')     serializeExpr = '_pgc_ser_vs(_result)';
    else if (returnType === 'List[bool]')    serializeExpr = '_pgc_ser_vb(_result)';
    else if (returnType === 'List[List[int]]') serializeExpr = '_pgc_ser_vvi(_result)';
    else if (returnType === 'List[List[str]]') serializeExpr = '_pgc_ser_vvs(_result)';
    else if (retIsList)                      serializeExpr = '_pgc_ser_vi(_pgc_from_list(_result))';
    else if (retIsTree)                      serializeExpr = '_pgc_from_tree(_result)';
    else                                     serializeExpr = '([&]{ ostringstream _o; _o << _result; return _o.str(); })()';

    // Per-case body: read params.length lines, parse, call, serialize.
    // Cycled-list path: read two lines (values, pos) and synthesize a single ListNode* head.
    const caseBody = cycledInput ? [
      '    string _raw_values; getline(cin, _raw_values);',
      '    string _raw_pos; getline(cin, _raw_pos);',
      '    vector<int> _values = _pgc_parse_vi(_raw_values);',
      '    int _pos = stoi(_pgc_trim(_raw_pos));',
      '    ListNode* head = _pgc_to_list_cycle(_values, _pos);',
      `    auto _result = sol.${methodName}(head);`,
      `    _out << ${serializeExpr};`,
    ].join('\n') : [
      ...params.map(p => `    string _raw_${p.name}; getline(cin, _raw_${p.name});`),
      ...params.map(p => `    ${parseForType(p.name, p.type)}`),
      `    auto _result = sol.${methodName}(${params.map(p => p.name).join(', ')});`,
      `    _out << ${serializeExpr};`,
    ].join('\n');

    const mainBody = multiCaseCount > 1 ? [
      '    Solution sol;',
      '    ostringstream _out;',
      `    int _N = ${multiCaseCount};`,
      '    for (int _c = 0; _c < _N; _c++) {',
      '        try {',
      caseBody.split('\n').map(l => '        ' + l).join('\n'),
      '        } catch (const std::exception& _e) {',
      `            _out << "${JAVA_ERR_PREFIX}" << _e.what();`,
      '        } catch (...) {',
      `            _out << "${JAVA_ERR_PREFIX}" << "unknown";`,
      '        }',
      `        _out << '\\n' << "${JAVA_OUT_END}" << '\\n';`,
      '        if (_c < _N - 1) {',
      '            string _sep; getline(cin, _sep); // consume case separator',
      '        }',
      '    }',
      '    cout << _out.str();',
    ].join('\n') : [
      '    Solution sol;',
      '    ostringstream _out;',
      caseBody,
      '    _out << \'\\n\';',
      '    cout << _out.str();',
    ].join('\n');

    return [
      CPP_HELPERS,
      userCode,
      '',
      'int main() {',
      '    ios_base::sync_with_stdio(false);',
      '    cin.tie(nullptr);',
      mainBody,
      '    return 0;',
      '}',
    ].join('\n');
  }

  if (language === 'c') {
    // Single-case only — Workspace multi-case batches activate for java/cpp.
    // Operations-class problems are out of scope for C; fall back to raw user code.
    const isOps = params.length === 1 && params[0].name === 'operations'
                  && params[0].type && params[0].type.startsWith('List[List');
    if (isOps) return userCode;

    const retIsIntList = returnType === 'List[int]';
    const retIsBoolList = returnType === 'List[bool]';
    const retIsStrList = returnType === 'List[str]';
    const retIs2DInt = returnType === 'List[List[int]]';

    // Each param maps to: declarations + lines that read & parse one stdin line.
    const parseLines = [];
    const callArgs = [];
    if (cycledInput) {
      parseLines.push('    char* _raw_values = _pgc_read_line();');
      parseLines.push('    char* _raw_pos = _pgc_read_line();');
      parseLines.push('    int _pos = atoi(_pgc_trim(_raw_pos));');
      parseLines.push('    struct ListNode* head = _pgc_to_list_cycle(_raw_values, _pos);');
      callArgs.push('head');
    } else {
    params.forEach(p => {
      const raw = `_raw_${p.name}`;
      parseLines.push(`    char* ${raw} = _pgc_read_line();`);
      if (p.type === 'int') {
        parseLines.push(`    int ${p.name} = atoi(_pgc_trim(${raw}));`);
        callArgs.push(p.name);
      } else if (p.type === 'float') {
        parseLines.push(`    double ${p.name} = atof(_pgc_trim(${raw}));`);
        callArgs.push(p.name);
      } else if (p.type === 'bool') {
        parseLines.push(`    bool ${p.name} = strcmp(_pgc_trim(${raw}), "true") == 0;`);
        callArgs.push(p.name);
      } else if (p.type === 'str') {
        parseLines.push(`    char* ${p.name} = strdup(_pgc_strip_quotes(${raw}));`);
        callArgs.push(p.name);
      } else if (p.type === 'List[int]') {
        parseLines.push(`    int ${p.name}Size; int* ${p.name} = _pgc_parse_int_arr(${raw}, &${p.name}Size);`);
        callArgs.push(p.name, `${p.name}Size`);
      } else if (p.type === 'List[bool]') {
        parseLines.push(`    int ${p.name}Size; bool* ${p.name} = _pgc_parse_bool_arr(${raw}, &${p.name}Size);`);
        callArgs.push(p.name, `${p.name}Size`);
      } else if (p.type === 'List[str]') {
        parseLines.push(`    int ${p.name}Size; char** ${p.name} = _pgc_parse_str_arr(${raw}, &${p.name}Size);`);
        callArgs.push(p.name, `${p.name}Size`);
      } else if (p.type === 'List[List[int]]') {
        parseLines.push(`    int ${p.name}Size; int* ${p.name}ColSize; int** ${p.name} = _pgc_parse_int_2d(${raw}, &${p.name}Size, &${p.name}ColSize);`);
        callArgs.push(p.name, `${p.name}Size`, `${p.name}ColSize`);
      } else if (isListNodeType(p.type)) {
        parseLines.push(`    struct ListNode* ${p.name} = _pgc_to_list(${raw});`);
        callArgs.push(p.name);
      } else if (isTreeNodeType(p.type)) {
        parseLines.push(`    struct TreeNode* ${p.name} = _pgc_to_tree(${raw});`);
        callArgs.push(p.name);
      } else {
        parseLines.push(`    char* ${p.name} = ${raw}; // TODO: unsupported type ${p.type}`);
        callArgs.push(p.name);
      }
    });
    }

    // Decide how to capture the call return + print it.
    let callAndPrint;
    if (retIsIntList || retIsBoolList || retIsStrList) {
      const elemType = retIsStrList ? 'char**' : (retIsBoolList ? 'bool*' : 'int*');
      const printFn = retIsStrList ? '_pgc_print_str_arr'
                    : (retIsBoolList ? '_pgc_print_bool_arr' : '_pgc_print_int_arr');
      callAndPrint = [
        `    int _retSize;`,
        `    ${elemType} _result = ${methodName}(${callArgs.join(', ')}, &_retSize);`,
        `    ${printFn}(_result, _retSize);`,
        `    putchar('\\n');`,
      ].join('\n');
    } else if (retIs2DInt) {
      callAndPrint = [
        `    int _retSize; int* _retColSizes;`,
        `    int** _result = ${methodName}(${callArgs.join(', ')}, &_retSize, &_retColSizes);`,
        `    _pgc_print_int_2d(_result, _retSize, _retColSizes);`,
        `    putchar('\\n');`,
      ].join('\n');
    } else if (isListNodeType(returnType)) {
      callAndPrint = [
        `    struct ListNode* _result = ${methodName}(${callArgs.join(', ')});`,
        `    _pgc_print_list(_result);`,
        `    putchar('\\n');`,
      ].join('\n');
    } else if (isTreeNodeType(returnType)) {
      callAndPrint = [
        `    struct TreeNode* _result = ${methodName}(${callArgs.join(', ')});`,
        `    _pgc_print_tree(_result);`,
        `    putchar('\\n');`,
      ].join('\n');
    } else if (returnType === 'int') {
      callAndPrint = [
        `    int _result = ${methodName}(${callArgs.join(', ')});`,
        `    _pgc_print_int(_result);`,
        `    putchar('\\n');`,
      ].join('\n');
    } else if (returnType === 'float') {
      callAndPrint = [
        `    double _result = ${methodName}(${callArgs.join(', ')});`,
        `    _pgc_print_double(_result);`,
        `    putchar('\\n');`,
      ].join('\n');
    } else if (returnType === 'bool') {
      callAndPrint = [
        `    bool _result = ${methodName}(${callArgs.join(', ')});`,
        `    _pgc_print_bool(_result);`,
        `    putchar('\\n');`,
      ].join('\n');
    } else if (returnType === 'str') {
      callAndPrint = [
        `    char* _result = ${methodName}(${callArgs.join(', ')});`,
        `    _pgc_print_str(_result);`,
        `    putchar('\\n');`,
      ].join('\n');
    } else {
      callAndPrint = [
        `    ${methodName}(${callArgs.join(', ')});`,
        `    putchar('\\n');`,
      ].join('\n');
    }

    return [
      C_HELPERS,
      userCode,
      '',
      'int main(void) {',
      ...parseLines,
      callAndPrint,
      '    return 0;',
      '}',
    ].join('\n');
  }

  if (language === 'go') {
    // Operations-class problems require runtime dispatch in Go — out of scope here.
    const isOps = params.length === 1 && params[0].name === 'operations'
                  && params[0].type && params[0].type.startsWith('List[List');
    if (isOps) return userCode;

    // Build per-param parse + call expression. Each line of stdin is JSON.
    const parseStmts = [];
    const callArgs = cycledInput ? ['head'] : params.map(p => p.name);
    if (cycledInput) {
      parseStmts.push('    var _values []int');
      parseStmts.push('    json.Unmarshal([]byte(_lines[0]), &_values)');
      parseStmts.push('    _pos, _ := strconv.Atoi(strings.TrimSpace(_lines[1]))');
      parseStmts.push('    head := _pgc_arr_to_list_cycle(_values, _pos)');
    } else {
    params.forEach((p, i) => {
      const lineExpr = `_lines[${i}]`;
      if (p.type === 'int') {
        parseStmts.push(`    var ${p.name} int`);
        parseStmts.push(`    json.Unmarshal([]byte(${lineExpr}), &${p.name})`);
      } else if (p.type === 'float') {
        parseStmts.push(`    var ${p.name} float64`);
        parseStmts.push(`    json.Unmarshal([]byte(${lineExpr}), &${p.name})`);
      } else if (p.type === 'bool') {
        parseStmts.push(`    var ${p.name} bool`);
        parseStmts.push(`    json.Unmarshal([]byte(${lineExpr}), &${p.name})`);
      } else if (p.type === 'str') {
        parseStmts.push(`    var ${p.name} string`);
        parseStmts.push(`    json.Unmarshal([]byte(${lineExpr}), &${p.name})`);
      } else if (p.type === 'List[int]') {
        parseStmts.push(`    var ${p.name} []int`);
        parseStmts.push(`    json.Unmarshal([]byte(${lineExpr}), &${p.name})`);
      } else if (p.type === 'List[bool]') {
        parseStmts.push(`    var ${p.name} []bool`);
        parseStmts.push(`    json.Unmarshal([]byte(${lineExpr}), &${p.name})`);
      } else if (p.type === 'List[str]') {
        parseStmts.push(`    var ${p.name} []string`);
        parseStmts.push(`    json.Unmarshal([]byte(${lineExpr}), &${p.name})`);
      } else if (p.type === 'List[List[int]]') {
        parseStmts.push(`    var ${p.name} [][]int`);
        parseStmts.push(`    json.Unmarshal([]byte(${lineExpr}), &${p.name})`);
      } else if (p.type === 'List[List[str]]') {
        parseStmts.push(`    var ${p.name} [][]string`);
        parseStmts.push(`    json.Unmarshal([]byte(${lineExpr}), &${p.name})`);
      } else if (isListNodeType(p.type)) {
        parseStmts.push(`    var ${p.name}Arr []int`);
        parseStmts.push(`    json.Unmarshal([]byte(${lineExpr}), &${p.name}Arr)`);
        parseStmts.push(`    ${p.name} := _pgc_arr_to_list(${p.name}Arr)`);
      } else if (isTreeNodeType(p.type)) {
        parseStmts.push(`    ${p.name} := _pgc_parse_tree_line(${lineExpr})`);
      } else {
        parseStmts.push(`    var ${p.name} interface{}`);
        parseStmts.push(`    json.Unmarshal([]byte(${lineExpr}), &${p.name})`);
      }
    });
    }

    // Serialize the return value back to JSON.
    let outputBlock;
    if (isListNodeType(returnType)) {
      outputBlock = [
        `    _arr := _pgc_list_to_arr(_result)`,
        `    fmt.Println(_pgc_jsonify(_arr))`,
      ].join('\n');
    } else if (isTreeNodeType(returnType)) {
      outputBlock = `    fmt.Println(_pgc_tree_to_json(_result))`;
    } else {
      outputBlock = `    fmt.Println(_pgc_jsonify(_result))`;
    }

    const body = [
      'func main() {',
      '    scanner := bufio.NewScanner(os.Stdin)',
      '    scanner.Buffer(make([]byte, 1024*1024), 1024*1024*16)',
      '    var _lines []string',
      '    for scanner.Scan() {',
      '        _lines = append(_lines, scanner.Text())',
      '    }',
      '    _ = _lines',
      ...parseStmts,
      `    _result := ${methodName}(${callArgs.join(', ')})`,
      outputBlock,
      '}',
    ].join('\n');

    // The user's Go code is written as a package-less snippet (LeetCode style) —
    // we strip any leading `package main` / common imports they may have added so
    // we don't duplicate. The harness header already declares `package main` and
    // the imports we need.
    let cleaned = userCode
      .replace(/^[\t ]*package\s+main[\t ]*\r?\n/m, '')
      .replace(/^[\t ]*import\s*\([\s\S]*?\)\r?\n/m, '')
      .replace(/^[\t ]*import\s+"[^"]+"\r?\n/gm, '');

    return [
      GO_HELPERS,
      cleaned,
      '',
      body,
    ].join('\n');
  }

  if (language === 'swift') {
    // Design-class problems use runtime dispatch — not in scope. Falls back to raw.
    const isOps = params.length === 1 && params[0].name === 'operations'
                  && params[0].type && params[0].type.startsWith('List[List');
    if (isOps) return userCode;

    const parseFor = (name, type, i) => {
      const v = `_v${i}`;
      const decl = `        let ${v}: Any? = _pgcReadJSON(_lines[${i}])`;
      if (type === 'int')               return `${decl}\n        let ${name}: Int = _pgcAsInt(${v})`;
      if (type === 'float')             return `${decl}\n        let ${name}: Double = _pgcAsDouble(${v})`;
      if (type === 'bool')              return `${decl}\n        let ${name}: Bool = _pgcAsBool(${v})`;
      if (type === 'str')               return `${decl}\n        let ${name}: String = _pgcAsString(${v})`;
      if (type === 'List[int]')         return `${decl}\n        let ${name}: [Int] = _pgcIntArr(${v})`;
      if (type === 'List[bool]')        return `${decl}\n        let ${name}: [Bool] = _pgcBoolArr(${v})`;
      if (type === 'List[str]')         return `${decl}\n        let ${name}: [String] = _pgcStrArr(${v})`;
      if (type === 'List[List[int]]')   return `${decl}\n        let ${name}: [[Int]] = _pgcIntIntArr(${v})`;
      if (type === 'List[List[str]]')   return `${decl}\n        let ${name}: [[String]] = _pgcStrStrArr(${v})`;
      if (isListNodeType(type))         return `${decl}\n        let ${name}: ListNode? = _pgcArrToList(_pgcIntArr(${v}))`;
      if (isTreeNodeType(type))         return `        let ${name}: TreeNode? = _pgcParseTreeLine(_lines[${i}])`;
      return `${decl}\n        let ${name}: Any? = ${v}`;
    };

    const parseBlock = cycledInput
      ? [
          '        let _values: [Int] = _pgcIntArr(_pgcReadJSON(_lines[0]))',
          '        let _pos: Int = Int(_lines[1].trimmingCharacters(in: .whitespacesAndNewlines)) ?? -1',
          '        let head: ListNode? = _pgcArrToListCycle(_values, _pos)',
        ].join('\n')
      : params.map((p, i) => parseFor(p.name, p.type, i)).join('\n');
    const callArgs = cycledInput ? 'head' : params.map(p => p.name).join(', ');

    let outputBlock;
    if (retIsList) {
      outputBlock = `        let _arr = _pgcListToArr(_result)\n        print(_pgcJsonify(_arr))`;
    } else if (retIsTree) {
      outputBlock = `        print(_pgcTreeToArr(_result))`;
    } else if (returnType === 'bool') {
      outputBlock = `        print(_result ? "true" : "false")`;
    } else if (returnType === 'int') {
      outputBlock = `        print(_result)`;
    } else if (returnType === 'float') {
      outputBlock = `        print(_pgcJsonify(_result))`;
    } else if (returnType === 'str') {
      outputBlock = `        print(_pgcJsonify(_result))`;
    } else {
      outputBlock = `        print(_pgcJsonify(_result))`;
    }

    return [
      SWIFT_HELPERS,
      userCode,
      '',
      'let _input = FileHandle.standardInput.availableData',
      'let _raw = String(data: _input, encoding: .utf8) ?? ""',
      'let _lines = _raw.split(separator: "\\n", omittingEmptySubsequences: false).map { String($0) }',
      '',
      'do {',
      parseBlock,
      `    let _result = Solution().${methodName}(${callArgs})`,
      outputBlock,
      '}',
    ].join('\n');
  }

  if (language === 'kotlin') {
    const isOps = params.length === 1 && params[0].name === 'operations'
                  && params[0].type && params[0].type.startsWith('List[List');
    if (isOps) return userCode;

    const parseFor = (name, type, i) => {
      const raw = `_lines[${i}]`;
      if (type === 'int')             return `        val ${name}: Int = ${raw}.trim().toInt()`;
      if (type === 'float')           return `        val ${name}: Double = ${raw}.trim().toDouble()`;
      if (type === 'bool')            return `        val ${name}: Boolean = ${raw}.trim() == "true"`;
      if (type === 'str')             return `        val ${name}: String = PGC.stripQuotes(${raw})`;
      if (type === 'List[int]')       return `        val ${name}: IntArray = PGC.parseIntArr(${raw})`;
      if (type === 'List[bool]')      return `        val ${name}: BooleanArray = PGC.parseBoolArr(${raw})`;
      if (type === 'List[str]')       return `        val ${name}: Array<String> = PGC.parseStrArr(${raw})`;
      if (type === 'List[List[int]]') return `        val ${name}: Array<IntArray> = PGC.parseIntIntArr(${raw})`;
      if (type === 'List[List[str]]') return `        val ${name}: Array<Array<String>> = PGC.parseStrStrArr(${raw})`;
      if (isListNodeType(type))       return `        val ${name}: ListNode? = PGC.arrToList(PGC.parseIntArr(${raw}))`;
      if (isTreeNodeType(type))       return `        val ${name}: TreeNode? = PGC.arrToTree(PGC.parseTreeTokens(${raw}))`;
      return `        val ${name}: String = ${raw}`;
    };

    const parseBlock = cycledInput
      ? [
          '        val _values: IntArray = PGC.parseIntArr(_lines[0])',
          '        val _pos: Int = _lines[1].trim().toInt()',
          '        val head: ListNode? = PGC.arrToListCycle(_values, _pos)',
        ].join('\n')
      : params.map((p, i) => parseFor(p.name, p.type, i)).join('\n');
    const callArgs = cycledInput ? 'head' : params.map(p => p.name).join(', ');

    let outputBlock;
    if (retIsList) {
      outputBlock = `    println(PGC.listToStr(_result))`;
    } else if (retIsTree) {
      outputBlock = `    println(PGC.treeToStr(_result))`;
    } else {
      outputBlock = `    println(PGC.jsonify(_result))`;
    }

    return [
      KOTLIN_HELPERS,
      userCode,
      '',
      'fun main() {',
      '    val _lines = System.`in`.bufferedReader().readLines()',
      parseBlock,
      `    val _result = Solution().${methodName}(${callArgs})`,
      outputBlock,
      '}',
    ].join('\n');
  }

  if (language === 'rust') {
    const isOps = params.length === 1 && params[0].name === 'operations'
                  && params[0].type && params[0].type.startsWith('List[List');
    if (isOps) return userCode;

    const rustName = camelToSnake(methodName);

    const parseFor = (name, type, i) => {
      const snake = camelToSnake(name);
      const raw = `&_lines[${i}]`;
      if (type === 'int')             return `    let ${snake}: i64 = _pgc_parse_i64(${raw});`;
      if (type === 'float')           return `    let ${snake}: f64 = _pgc_parse_f64(${raw});`;
      if (type === 'bool')            return `    let ${snake}: bool = _pgc_parse_bool(${raw});`;
      if (type === 'str')             return `    let ${snake}: String = _pgc_parse_str(${raw});`;
      if (type === 'List[int]')       return `    let ${snake}: Vec<i64> = _pgc_parse_vi(${raw});`;
      if (type === 'List[bool]')      return `    let ${snake}: Vec<bool> = _pgc_parse_vb(${raw});`;
      if (type === 'List[str]')       return `    let ${snake}: Vec<String> = _pgc_parse_vs(${raw});`;
      if (type === 'List[List[int]]') return `    let ${snake}: Vec<Vec<i64>> = _pgc_parse_vvi(${raw});`;
      if (type === 'List[List[str]]') return `    let ${snake}: Vec<Vec<String>> = _pgc_parse_vvs(${raw});`;
      if (isListNodeType(type))       return `    let ${snake}: Option<Box<ListNode>> = _pgc_arr_to_list(&_pgc_parse_vi(${raw}));`;
      if (isTreeNodeType(type))       return `    let ${snake}: Option<Rc<RefCell<TreeNode>>> = _pgc_arr_to_tree(&_pgc_parse_tree_tokens(${raw}));`;
      return `    let ${snake}: String = _lines[${i}].clone();`;
    };

    const parseBlock = cycledInput
      ? [
          '    let _values: Vec<i64> = _pgc_parse_vi(&_lines[0]);',
          '    let _pos: i64 = _pgc_parse_i64(&_lines[1]);',
          '    let head: Option<Box<ListNode>> = _pgc_arr_to_list_cycle(&_values, _pos);',
        ].join('\n')
      : params.map((p, i) => parseFor(p.name, p.type, i)).join('\n');
    const callArgs = cycledInput ? 'head' : params.map(p => camelToSnake(p.name)).join(', ');

    let outputBlock;
    if (retIsList) {
      outputBlock = [
        `    let _arr = _pgc_list_to_vec(_result);`,
        `    println!("{}", _pgc_ser_vi(&_arr));`,
      ].join('\n');
    } else if (retIsTree) {
      outputBlock = `    println!("{}", _pgc_tree_to_str(_result));`;
    } else if (returnType === 'int')             outputBlock = `    println!("{}", _pgc_ser_i64(_result));`;
    else if (returnType === 'float')             outputBlock = `    println!("{}", _pgc_ser_f64(_result));`;
    else if (returnType === 'bool')              outputBlock = `    println!("{}", _pgc_ser_bool(_result));`;
    else if (returnType === 'str')               outputBlock = `    println!("{}", _pgc_ser_str(&_result));`;
    else if (returnType === 'List[int]')         outputBlock = `    println!("{}", _pgc_ser_vi(&_result));`;
    else if (returnType === 'List[bool]')        outputBlock = `    println!("{}", _pgc_ser_vb(&_result));`;
    else if (returnType === 'List[str]')         outputBlock = `    println!("{}", _pgc_ser_vs(&_result));`;
    else if (returnType === 'List[List[int]]')   outputBlock = `    println!("{}", _pgc_ser_vvi(&_result));`;
    else if (returnType === 'List[List[str]]')   outputBlock = `    println!("{}", _pgc_ser_vvs(&_result));`;
    else                                         outputBlock = `    println!("{:?}", _result);`;

    return [
      RUST_HELPERS,
      userCode,
      '',
      'fn main() {',
      '    let mut _buf = String::new();',
      '    io::stdin().read_to_string(&mut _buf).ok();',
      '    let _lines: Vec<String> = _buf.lines().map(|s| s.to_string()).collect();',
      parseBlock,
      `    let _result = Solution::${rustName}(${callArgs});`,
      outputBlock,
      '}',
    ].join('\n');
  }

  if (language === 'typescript') {
    const isOps = params.length === 1 && params[0].name === 'operations'
                  && params[0].type && params[0].type.startsWith('List[List');
    if (isOps) return userCode;

    const parseFor = (name, type, i) => {
      const raw = `_lines[${i}]`;
      if (isListNodeType(type)) return `const ${name}: ListNode | null = _pgcToList(JSON.parse(${raw}));`;
      if (isTreeNodeType(type)) return `const ${name}: TreeNode | null = _pgcToTree(JSON.parse(${raw}));`;
      return `const ${name}: any = JSON.parse(${raw});`;
    };

    const parseBlock = cycledInput
      ? [
          'const _values: any = JSON.parse(_lines[0]);',
          'const _pos: number = parseInt(_lines[1].trim(), 10);',
          'const head: ListNode | null = _pgcToListCycle(_values, _pos);',
        ].join('\n')
      : params.map((p, i) => parseFor(p.name, p.type, i)).join('\n');
    const callArgs = cycledInput ? 'head' : params.map(p => p.name).join(', ');

    let outputBlock;
    if (retIsList) {
      outputBlock = 'console.log(JSON.stringify(_pgcFromList(_result as ListNode | null)));';
    } else if (retIsTree) {
      outputBlock = 'console.log(JSON.stringify(_pgcFromTree(_result as TreeNode | null)));';
    } else {
      outputBlock = 'console.log(JSON.stringify(_result));';
    }

    return [
      TS_HELPERS,
      userCode,
      '',
      "const _raw = require('fs').readFileSync('/dev/stdin', 'utf8');",
      "const _lines = _raw.split('\\n');",
      parseBlock,
      `const _result: any = ${methodName}(${callArgs} as any);`,
      outputBlock,
    ].join('\n');
  }

  return userCode;
}

// ─── Test case helpers ───

export function buildStdin(inputs) {
  return (inputs || []).join('\n');
}

// Deep structural equality for JSON-shaped values. Required because Judge0
// returns canonical Python-formatted output ("[0, 7]") while seed test cases
// store the compact form ("[0,7]") — a strict string compare flags WA on every
// array/object result. Compares parsed shapes when both sides are valid JSON.
function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  const ak = Object.keys(a), bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!deepEqual(a[k], b[k])) return false;
  }
  return true;
}

export function equalsNormalized(expected, actual) {
  const a = (actual ?? '').toString().trim();
  const e = (expected ?? '').toString().trim();
  if (a === e) return true;
  // Try JSON-parse both. If both succeed, deep-compare the shapes — this
  // handles whitespace, key order, and nested arrays/objects.
  let pa, pe, parsedA = false, parsedE = false;
  try { pa = JSON.parse(a); parsedA = true; } catch { /* not JSON */ }
  try { pe = JSON.parse(e); parsedE = true; } catch { /* not JSON */ }
  if (parsedA && parsedE) return deepEqual(pa, pe);
  // Fallback: whitespace-stripped, case-insensitive string compare.
  const sa = a.replace(/\s+/g, '').toLowerCase();
  const se = e.replace(/\s+/g, '').toLowerCase();
  return sa === se;
}

export function compareOutput(actual, expected) {
  return equalsNormalized(expected, actual);
}
