// ─── Type mappings: Python canonical → JS/Java/C++ ───

const TYPE_MAP = {
  'int':                { jsdoc: 'number',     java: 'int',       cpp: 'int' },
  'float':              { jsdoc: 'number',     java: 'double',    cpp: 'double' },
  'str':                { jsdoc: 'string',     java: 'String',    cpp: 'string' },
  'bool':               { jsdoc: 'boolean',    java: 'boolean',   cpp: 'bool' },
  'List[int]':          { jsdoc: 'number[]',   java: 'int[]',     cpp: 'vector<int>' },
  'List[str]':          { jsdoc: 'string[]',   java: 'String[]',  cpp: 'vector<string>' },
  'List[List[int]]':    { jsdoc: 'number[][]', java: 'int[][]',   cpp: 'vector<vector<int>>' },
  'List[List[str]]':    { jsdoc: 'string[][]', java: 'String[][]', cpp: 'vector<vector<string>>' },
  'List[bool]':         { jsdoc: 'boolean[]',  java: 'boolean[]', cpp: 'vector<bool>' },
  'ListNode':           { jsdoc: 'ListNode',   java: 'ListNode',  cpp: 'ListNode*' },
  'Optional[ListNode]': { jsdoc: 'ListNode',   java: 'ListNode',  cpp: 'ListNode*' },
  'TreeNode':           { jsdoc: 'TreeNode',   java: 'TreeNode',  cpp: 'TreeNode*' },
  'Optional[TreeNode]': { jsdoc: 'TreeNode',   java: 'TreeNode',  cpp: 'TreeNode*' },
};

const jt = (pyType) => TYPE_MAP[pyType]?.java || pyType;
const jd = (pyType) => TYPE_MAP[pyType]?.jsdoc || pyType;
const ct = (pyType) => TYPE_MAP[pyType]?.cpp || pyType;

const isListNodeType = (t) => t === 'ListNode' || t === 'Optional[ListNode]';
const isTreeNodeType = (t) => t === 'TreeNode' || t === 'Optional[TreeNode]';

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

export function generateTemplate(language, methodName, params, returnType) {
  if (!methodName || !params) return null;

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

export function wrapWithDriver(userCode, language, methodName, params, returnType, opts = {}) {
  if (!methodName || !params) return userCode;

  const args = params.map(p => p.name).join(', ');
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

    const parsing = params.map((p, i) => {
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
    const parsing = params.map((p, i) => {
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
    // Java doesn't support ListNode/TreeNode types — fall back to raw user code for those
    const hasNodeType = params.some(p => isListNodeType(p.type) || isTreeNodeType(p.type)) || retIsList || retIsTree;
    if (hasNodeType) return userCode;

    const javaParsing = params.map(p => {
      const line = `String _raw_${p.name} = br.readLine().trim();`;
      if (p.type === 'int') return `${line}\n        int ${p.name} = Integer.parseInt(_raw_${p.name});`;
      if (p.type === 'str') return `${line}\n        String ${p.name} = _raw_${p.name}.startsWith("\\"") ? _raw_${p.name}.substring(1, _raw_${p.name}.length()-1) : _raw_${p.name};`;
      if (p.type === 'bool') return `${line}\n        boolean ${p.name} = Boolean.parseBoolean(_raw_${p.name});`;
      if (p.type === 'List[int]') return [
        line,
        `        String _s_${p.name} = _raw_${p.name}.substring(1, _raw_${p.name}.length()-1);`,
        `        String[] _p_${p.name} = _s_${p.name}.isEmpty() ? new String[0] : _s_${p.name}.split(",");`,
        `        int[] ${p.name} = new int[_p_${p.name}.length];`,
        `        for(int i=0;i<_p_${p.name}.length;i++) ${p.name}[i]=Integer.parseInt(_p_${p.name}[i].trim());`,
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
      return `${line}\n        // TODO: parse ${p.type}`;
    }).join('\n        ');

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
      `                Object _result = (Object) sol.${methodName}(${args});`,
      '                _out.append(_jsonify(_result));',
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
      `        Object _result = (Object) sol.${methodName}(${args});`,
      '        System.out.println(_jsonify(_result));',
    ].join('\n');

    return [
      'import java.util.*;',
      'import java.io.*;',
      '',
      userCode,
      '',
      'class Main {',
      '    public static void main(String[] _args) throws Exception {',
      mainBody,
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
    const caseBody = [
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

  return userCode;
}

// ─── Test case helpers ───

export function buildStdin(inputs) {
  return (inputs || []).join('\n');
}

export function compareOutput(actual, expected) {
  const a = (actual || '').trim();
  const e = (expected || '').trim();
  if (a === e) return true;
  try {
    return JSON.stringify(JSON.parse(a)) === JSON.stringify(JSON.parse(e));
  } catch {
    return a.toLowerCase() === e.toLowerCase();
  }
}
