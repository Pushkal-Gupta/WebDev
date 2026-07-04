import{_ as G,s as W}from"./index-KPKUfE1T.js";const w={int:{jsdoc:"number",java:"int",cpp:"int",go:"int",c:"int",swift:"Int",kotlin:"Int",rust:"i64",typescript:"number"},float:{jsdoc:"number",java:"double",cpp:"double",go:"float64",c:"double",swift:"Double",kotlin:"Double",rust:"f64",typescript:"number"},str:{jsdoc:"string",java:"String",cpp:"string",go:"string",c:"char*",swift:"String",kotlin:"String",rust:"String",typescript:"string"},bool:{jsdoc:"boolean",java:"boolean",cpp:"bool",go:"bool",c:"bool",swift:"Bool",kotlin:"Boolean",rust:"bool",typescript:"boolean"},"List[int]":{jsdoc:"number[]",java:"int[]",cpp:"vector<int>",go:"[]int",c:"int*",swift:"[Int]",kotlin:"IntArray",rust:"Vec<i64>",typescript:"number[]"},"List[str]":{jsdoc:"string[]",java:"String[]",cpp:"vector<string>",go:"[]string",c:"char**",swift:"[String]",kotlin:"Array<String>",rust:"Vec<String>",typescript:"string[]"},"List[List[int]]":{jsdoc:"number[][]",java:"int[][]",cpp:"vector<vector<int>>",go:"[][]int",c:"int**",swift:"[[Int]]",kotlin:"Array<IntArray>",rust:"Vec<Vec<i64>>",typescript:"number[][]"},"List[List[str]]":{jsdoc:"string[][]",java:"String[][]",cpp:"vector<vector<string>>",go:"[][]string",c:"char***",swift:"[[String]]",kotlin:"Array<Array<String>>",rust:"Vec<Vec<String>>",typescript:"string[][]"},"List[bool]":{jsdoc:"boolean[]",java:"boolean[]",cpp:"vector<bool>",go:"[]bool",c:"bool*",swift:"[Bool]",kotlin:"BooleanArray",rust:"Vec<bool>",typescript:"boolean[]"},ListNode:{jsdoc:"ListNode",java:"ListNode",cpp:"ListNode*",go:"*ListNode",c:"struct ListNode*",swift:"ListNode?",kotlin:"ListNode?",rust:"Option<Box<ListNode>>",typescript:"ListNode | null"},"Optional[ListNode]":{jsdoc:"ListNode",java:"ListNode",cpp:"ListNode*",go:"*ListNode",c:"struct ListNode*",swift:"ListNode?",kotlin:"ListNode?",rust:"Option<Box<ListNode>>",typescript:"ListNode | null"},TreeNode:{jsdoc:"TreeNode",java:"TreeNode",cpp:"TreeNode*",go:"*TreeNode",c:"struct TreeNode*",swift:"TreeNode?",kotlin:"TreeNode?",rust:"Option<Rc<RefCell<TreeNode>>>",typescript:"TreeNode | null"},"Optional[TreeNode]":{jsdoc:"TreeNode",java:"TreeNode",cpp:"TreeNode*",go:"*TreeNode",c:"struct TreeNode*",swift:"TreeNode?",kotlin:"TreeNode?",rust:"Option<Rc<RefCell<TreeNode>>>",typescript:"TreeNode | null"}},q=r=>{var s;return((s=w[r])==null?void 0:s.java)||r},I=r=>{var s;return((s=w[r])==null?void 0:s.jsdoc)||r},O=r=>{var s;return((s=w[r])==null?void 0:s.cpp)||r},z=r=>{var s;return((s=w[r])==null?void 0:s.go)||r},E=r=>{var s;return((s=w[r])==null?void 0:s.c)||r},B=r=>{var s;return((s=w[r])==null?void 0:s.swift)||r},C=r=>{var s;return((s=w[r])==null?void 0:s.kotlin)||r},P=r=>{var s;return((s=w[r])==null?void 0:s.rust)||r},R=r=>{var s;return((s=w[r])==null?void 0:s.typescript)||r},N=r=>r==="ListNode"||r==="Optional[ListNode]",S=r=>r==="TreeNode"||r==="Optional[TreeNode]",k=r=>r.replace(/[A-Z]/g,(s,l)=>l===0?s.toLowerCase():"_"+s.toLowerCase()),H=`# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
`,Y=`# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
`,Q=`/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
`,K=`/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
`,X=`/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
`,Z=`/**
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
`,tt=`/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     struct ListNode *next;
 * };
 */
`,et=`/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     struct TreeNode *left;
 *     struct TreeNode *right;
 * };
 */
`,rt=`/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
`,nt=`/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
`;function Lt(r,s,l,n){var m,L,b,g;if(!s||!l)return null;l.length===2&&((m=l[0])==null?void 0:m.type)==="List[int]"&&((L=l[0])==null?void 0:L.name)==="values"&&((b=l[1])==null?void 0:b.type)==="int"&&((g=l[1])==null?void 0:g.name)==="pos"&&(l=[{name:"head",type:"Optional[ListNode]"}]);const h=[...l.map(o=>o.type),n||""],d=h.some(N),v=h.some(S);if(r==="python"){const o=l.map(c=>`${c.name}: ${c.type}`).join(", ");let a="";return d&&(a+=H),v&&(a+=Y),`${a}class Solution:
    def ${s}(self, ${o}) -> ${n}:
        `}if(r==="javascript"){const o=l.map(f=>` * @param {${I(f.type)}} ${f.name}`).join(`
`),a=l.map(f=>f.name).join(", ");let c="";return d&&(c+=Q),v&&(c+=K),`${c}/**
${o}
 * @return {${I(n)}}
 */
var ${s} = function(${a}) {
    
};`}if(r==="java"){const o=l.map(a=>`${q(a.type)} ${a.name}`).join(", ");return`class Solution {
    public ${q(n)} ${s}(${o}) {
        
    }
}`}if(r==="cpp"){const o=l.map(c=>{const f=O(c.type);return f.startsWith("vector<")||f==="string"?`${f}& ${c.name}`:`${f} ${c.name}`}).join(", ");let a="";return d&&(a+=X),v&&(a+=Z),`${a}#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    ${O(n)} ${s}(${o}) {
        
    }
};`}if(r==="c"){const o=[];l.forEach(_=>{if(_.type==="List[int]"||_.type==="List[bool]"){const $=_.type==="List[bool]"?"bool":"int";o.push(`${$}* ${_.name}`,`int ${_.name}Size`)}else _.type==="List[str]"?o.push(`char** ${_.name}`,`int ${_.name}Size`):_.type==="List[List[int]]"?o.push(`int** ${_.name}`,`int ${_.name}Size`,`int* ${_.name}ColSize`):_.type==="List[List[str]]"?o.push(`char*** ${_.name}`,`int ${_.name}Size`,`int* ${_.name}ColSize`):o.push(`${E(_.type)} ${_.name}`)});const a=n==="List[int]"||n==="List[bool]",c=n==="List[str]",f=n==="List[List[int]]",t=n==="List[List[str]]";(a||c)&&o.push("int* returnSize"),(f||t)&&o.push("int* returnSize","int** returnColumnSizes");let e;a?e=n==="List[bool]"?"bool*":"int*":c?e="char**":f?e="int**":t?e="char***":e=E(n);let p;e==="int"||e==="double"?p="    return 0;":e==="bool"?p="    return false;":a||c?p=`    *returnSize = 0;
    return NULL;`:f||t?p=`    *returnSize = 0;
    *returnColumnSizes = NULL;
    return NULL;`:e.endsWith("*")?p="    return NULL;":p="    ";let i="";return d&&(i+=tt),v&&(i+=et),`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

${i}${e} ${s}(${o.join(", ")}) {
${p}
}`}if(r==="go"){const o=l.map(t=>`${t.name} ${z(t.type)}`).join(", ");let a="";d&&(a+=rt),v&&(a+=nt);const c=z(n);let f;return c==="int"||c==="float64"?f="0":c==="bool"?f="false":c==="string"?f='""':c.startsWith("[]")?f=`${c}{}`:(c.startsWith("*"),f="nil"),`${a}func ${s}(${o}) ${c} {
    return ${f}
}`}if(r==="swift"){const o=l.map(a=>`_ ${a.name}: ${B(a.type)}`).join(", ");return`class Solution {
    func ${s}(${o}) -> ${B(n)} {
        
    }
}`}if(r==="kotlin"){const o=l.map(a=>`${a.name}: ${C(a.type)}`).join(", ");return`class Solution {
    fun ${s}(${o}): ${C(n)} {
        
    }
}`}if(r==="rust"){const o=k(s),a=l.map(c=>`${k(c.name)}: ${P(c.type)}`).join(", ");return`impl Solution {
    pub fn ${o}(${a}) -> ${P(n)} {
        
    }
}`}if(r==="typescript"){const o=l.map(a=>`${a.name}: ${R(a.type)}`).join(", ");return`function ${s}(${o}): ${R(n)} {
    
};`}return null}const D=`
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
`,it=`
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
`,st="###CASE###",x="###END###",T="###ERR###",ot=`
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
`,lt=`
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
`,at=`
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
`,ut=`
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
`,ct=`
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
`,_t=`
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
`,pt=`
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
`;function ft(r){var s,l,n,u;return Array.isArray(r)&&r.length===2&&((s=r[0])==null?void 0:s.type)==="List[int]"&&((l=r[0])==null?void 0:l.name)==="values"&&((n=r[1])==null?void 0:n.type)==="int"&&((u=r[1])==null?void 0:u.name)==="pos"}function Nt(r,s,l,n,u,h={}){if(!l||!n)return r;const d=ft(n),v=d?"head":n.map(g=>g.name).join(", "),m=N(u),L=S(u),b=Math.max(1,Number(h.multiCaseCount)||1);if(s==="python"){if(n.length===1&&n[0].name==="operations"&&n[0].type&&n[0].type.startsWith("List[List"))return["import sys, json","from typing import List, Optional, Dict, Tuple, Set",D,r,"","_ops = json.loads(sys.stdin.read().strip())","_results = []","_instance = None","for _op in _ops:","    _name = _op[0]","    _args = _op[1:]","    if _instance is None:","        _cls = globals()[_name]","        _instance = _cls(*_args)","        _results.append(None)","    else:","        _ret = getattr(_instance, _name)(*_args)","        _results.append(_ret)","print(json.dumps(_results))"].join(`
`);const o=d?["_values = json.loads(_lines[0])","_pos = int(_lines[1].strip())","head = _to_list_cycle(_values, _pos)"].join(`
`):n.map((c,f)=>N(c.type)?`${c.name} = _to_list(json.loads(_lines[${f}]))`:S(c.type)?`${c.name} = _to_tree(json.loads(_lines[${f}]))`:`${c.name} = json.loads(_lines[${f}])`).join(`
`);let a;return m?a="print(json.dumps(_from_list(_result)))":L?a="print(json.dumps(_from_tree(_result)))":a=["if isinstance(_result, bool):","    print(str(_result).lower())","elif _result is None:",'    print("null")',"elif isinstance(_result, str):","    print(_result)","else:","    print(json.dumps(_result))"].join(`
`),["from __future__ import annotations","import sys, json","from typing import List, Optional, Dict, Tuple, Set",D,r,"",'_lines = sys.stdin.read().strip().split("\\n")',o,"_sol = Solution()",`_result = _sol.${l}(${v})`,a].join(`
`)}if(s==="javascript"){const g=d?["const _values = JSON.parse(_lines[0]);","const _pos = parseInt(_lines[1].trim(), 10);","const head = _toListCycle(_values, _pos);"].join(`
`):n.map((a,c)=>N(a.type)?`const ${a.name} = _toList(JSON.parse(_lines[${c}]));`:S(a.type)?`const ${a.name} = _toTree(JSON.parse(_lines[${c}]));`:`const ${a.name} = JSON.parse(_lines[${c}]);`).join(`
`);let o;return m?o="console.log(JSON.stringify(_fromList(_result)));":L?o="console.log(JSON.stringify(_fromTree(_result)));":o="console.log(JSON.stringify(_result));",[it,r,"","const _lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');",g,`const _result = ${l}(${v});`,o].join(`
`)}if(s==="java"){const g=d?["String _raw_values = br.readLine().trim();","        String _raw_pos = br.readLine().trim();","        int[] _values = _parseIntArr(_raw_values);","        int _pos = Integer.parseInt(_raw_pos);","        ListNode head = _toListCycle(_values, _pos);"].join(`
`):n.map(t=>{const e=`String _raw_${t.name} = br.readLine().trim();`;return t.type==="int"?`${e}
        int ${t.name} = Integer.parseInt(_raw_${t.name});`:t.type==="str"?`${e}
        String ${t.name} = _raw_${t.name}.startsWith("\\"") ? _raw_${t.name}.substring(1, _raw_${t.name}.length()-1) : _raw_${t.name};`:t.type==="bool"?`${e}
        boolean ${t.name} = Boolean.parseBoolean(_raw_${t.name});`:t.type==="List[int]"?[e,`        int[] ${t.name} = _parseIntArr(_raw_${t.name});`].join(`
        `):t.type==="List[str]"?[e,`        String _s_${t.name} = _raw_${t.name}.substring(1, _raw_${t.name}.length()-1);`,`        String[] ${t.name} = _s_${t.name}.isEmpty() ? new String[0] : _s_${t.name}.split(",");`,`        for(int i=0;i<${t.name}.length;i++) ${t.name}[i]=${t.name}[i].trim().replace("\\"","");`].join(`
        `):t.type==="List[List[int]]"?[e,`        int[][] ${t.name} = _parseIntIntArr(_raw_${t.name});`].join(`
        `):t.type==="List[List[str]]"?[e,`        String[][] ${t.name} = _parseStrStrArr(_raw_${t.name});`].join(`
        `):N(t.type)?[e,`        ListNode ${t.name} = _toList(_parseIntArr(_raw_${t.name}));`].join(`
        `):S(t.type)?[e,`        TreeNode ${t.name} = _toTree(_parseIntegerArr(_raw_${t.name}));`].join(`
        `):`${e}
        // TODO: parse ${t.type}`}).join(`
        `),o=m?[`        ListNode _result = sol.${l}(${v});`,"        System.out.println(_jsonList(_result));"].join(`
`):L?[`        TreeNode _result = sol.${l}(${v});`,"        System.out.println(_jsonTree(_result));"].join(`
`):[`        Object _result = (Object) sol.${l}(${v});`,"        System.out.println(_jsonify(_result));"].join(`
`),a=m?[`                ListNode _result = sol.${l}(${v});`,"                _out.append(_jsonList(_result));"].join(`
`):L?[`                TreeNode _result = sol.${l}(${v});`,"                _out.append(_jsonTree(_result));"].join(`
`):[`                Object _result = (Object) sol.${l}(${v});`,"                _out.append(_jsonify(_result));"].join(`
`),c=b>1?["        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));","        Solution sol = new Solution();",`        int _N = ${b};`,"        StringBuilder _out = new StringBuilder();","        for (int _c = 0; _c < _N; _c++) {","            try {",`                ${g}`,a,"            } catch (Throwable _t) {",`                _out.append("${T}").append(_t.getClass().getSimpleName()).append(": ").append(String.valueOf(_t.getMessage()));`,"            }",`            _out.append('\\n').append("${x}").append('\\n');`,"            if (_c < _N - 1) {","                // Consume the case separator line from stdin","                String _sep = br.readLine();","                // tolerate missing separator silently","            }","        }","        System.out.print(_out.toString());"].join(`
`):["        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));",`        ${g}`,"        Solution sol = new Solution();",o].join(`
`);return["import java.util.*;","import java.io.*;","","class ListNode {","    int val;","    ListNode next;","    ListNode() {}","    ListNode(int val) { this.val = val; }","    ListNode(int val, ListNode next) { this.val = val; this.next = next; }","}","","class TreeNode {","    int val;","    TreeNode left;","    TreeNode right;","    TreeNode() {}","    TreeNode(int val) { this.val = val; }","    TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }","}","",String(r||"").replace(/^\s*import\s+[^;]+;\s*$/gm,"").replace(/^\s*package\s+[^;]+;\s*$/gm,""),"","class Main {","    public static void main(String[] _args) throws Exception {",c,"    }","","    static int[] _parseIntArr(String s) {","        if (s == null) return new int[0];","        String t = s.trim();","        if (t.length() < 2) return new int[0];","        String inner = t.substring(1, t.length()-1).trim();","        if (inner.isEmpty()) return new int[0];",'        String[] parts = inner.split(",");',"        int[] arr = new int[parts.length];","        for (int i = 0; i < parts.length; i++) arr[i] = Integer.parseInt(parts[i].trim());","        return arr;","    }","",'    // Parses "[1,null,3,null,null]" — uses Integer so null slots survive as nulls.',"    static Integer[] _parseIntegerArr(String s) {","        if (s == null) return new Integer[0];","        String t = s.trim();","        if (t.length() < 2) return new Integer[0];","        String inner = t.substring(1, t.length()-1).trim();","        if (inner.isEmpty()) return new Integer[0];",'        String[] parts = inner.split(",");',"        Integer[] arr = new Integer[parts.length];","        for (int i = 0; i < parts.length; i++) {","            String p = parts[i].trim();",'            arr[i] = p.equals("null") ? null : Integer.valueOf(p);',"        }","        return arr;","    }","","    static ListNode _toList(int[] arr) {","        if (arr == null || arr.length == 0) return null;","        ListNode head = new ListNode(arr[0]);","        ListNode cur = head;","        for (int i = 1; i < arr.length; i++) { cur.next = new ListNode(arr[i]); cur = cur.next; }","        return head;","    }","","    static ListNode _toListCycle(int[] arr, int pos) {","        if (arr == null || arr.length == 0) return null;","        ListNode[] nodes = new ListNode[arr.length];","        for (int i = 0; i < arr.length; i++) nodes[i] = new ListNode(arr[i]);","        for (int i = 0; i + 1 < arr.length; i++) nodes[i].next = nodes[i + 1];","        if (pos >= 0 && pos < arr.length) nodes[arr.length - 1].next = nodes[pos];","        return nodes[0];","    }","","    static TreeNode _toTree(Integer[] arr) {","        if (arr == null || arr.length == 0 || arr[0] == null) return null;","        TreeNode root = new TreeNode(arr[0]);","        Deque<TreeNode> q = new ArrayDeque<>();","        q.add(root);","        int i = 1;","        while (!q.isEmpty() && i < arr.length) {","            TreeNode n = q.poll();","            if (i < arr.length && arr[i] != null) { n.left = new TreeNode(arr[i]); q.add(n.left); }","            i++;","            if (i < arr.length && arr[i] != null) { n.right = new TreeNode(arr[i]); q.add(n.right); }","            i++;","        }","        return root;","    }","","    static String _jsonList(ListNode head) {",'        StringBuilder sb = new StringBuilder("[");',"        int n = 0;",'        for (ListNode c = head; c != null; c = c.next) { if (n++ > 0) sb.append(","); sb.append(c.val); }','        sb.append("]");',"        return sb.toString();","    }","","    // BFS serialization with trailing-null trim, matching LeetCode tree format.","    // LinkedList (not ArrayDeque) so the queue can hold null sentinels.","    static String _jsonTree(TreeNode root) {",'        if (root == null) return "[]";',"        List<String> out = new ArrayList<>();","        LinkedList<TreeNode> q = new LinkedList<>();","        q.add(root);","        while (!q.isEmpty()) {","            TreeNode n = q.poll();",'            if (n == null) { out.add("null"); continue; }',"            out.add(String.valueOf(n.val));","            q.add(n.left);","            q.add(n.right);","        }",'        while (!out.isEmpty() && out.get(out.size()-1).equals("null")) out.remove(out.size()-1);','        return "[" + String.join(",", out) + "]";',"    }","","    static int[][] _parseIntIntArr(String s) {","        if (s.length() < 2) return new int[0][];","        String inner = s.substring(1, s.length()-1);","        if (inner.isEmpty()) return new int[0][];","        List<int[]> rows = new ArrayList<>();","        int depth = 0, start = 0;","        for (int i = 0; i < inner.length(); i++) {","            char c = inner.charAt(i);","            if (c == '[') depth++;","            else if (c == ']') {","                depth--;","                if (depth == 0) {","                    String row = inner.substring(start, i+1).trim();","                    String ri = row.substring(1, row.length()-1);","                    if (ri.isEmpty()) rows.add(new int[0]);","                    else {",'                        String[] parts = ri.split(",");',"                        int[] arr = new int[parts.length];","                        for (int k = 0; k < parts.length; k++) arr[k] = Integer.parseInt(parts[k].trim());","                        rows.add(arr);","                    }","                    i++; // skip comma","                    start = i + 1;","                }","            }","        }","        return rows.toArray(new int[0][]);","    }","","    static String[][] _parseStrStrArr(String s) {","        if (s.length() < 2) return new String[0][];","        String inner = s.substring(1, s.length()-1);","        if (inner.isEmpty()) return new String[0][];","        List<String[]> rows = new ArrayList<>();","        int depth = 0, start = 0;","        for (int i = 0; i < inner.length(); i++) {","            char c = inner.charAt(i);","            if (c == '[') depth++;","            else if (c == ']') {","                depth--;","                if (depth == 0) {","                    String row = inner.substring(start, i+1).trim();","                    String ri = row.substring(1, row.length()-1);","                    if (ri.isEmpty()) rows.add(new String[0]);","                    else {",'                        String[] parts = ri.split(",");','                        for (int k = 0; k < parts.length; k++) parts[k] = parts[k].trim().replace("\\"","");',"                        rows.add(parts);","                    }","                    i++;","                    start = i + 1;","                }","            }","        }","        return rows.toArray(new String[0][]);","    }","","    static String _jsonify(Object o) {",'        if (o == null) return "null";',"        if (o instanceof Boolean || o instanceof Integer || o instanceof Long || o instanceof Double || o instanceof Float) return o.toString();",'        if (o instanceof Character) return "\\"" + o + "\\"";','        if (o instanceof String) return "\\"" + o + "\\"";',"        if (o instanceof ListNode) return _jsonList((ListNode) o);","        if (o instanceof TreeNode) return _jsonTree((TreeNode) o);","        if (o instanceof int[]) {",'            StringBuilder sb = new StringBuilder("[");',"            int[] a = (int[]) o;",'            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }','            sb.append("]"); return sb.toString();',"        }","        if (o instanceof long[]) {",'            StringBuilder sb = new StringBuilder("[");',"            long[] a = (long[]) o;",'            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }','            sb.append("]"); return sb.toString();',"        }","        if (o instanceof boolean[]) {",'            StringBuilder sb = new StringBuilder("[");',"            boolean[] a = (boolean[]) o;",'            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }','            sb.append("]"); return sb.toString();',"        }","        if (o instanceof int[][]) {",'            StringBuilder sb = new StringBuilder("[");',"            int[][] a = (int[][]) o;",'            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(_jsonify(a[i])); }','            sb.append("]"); return sb.toString();',"        }","        if (o instanceof String[]) {",'            StringBuilder sb = new StringBuilder("[");',"            String[] a = (String[]) o;",'            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append("\\"").append(a[i]).append("\\""); }','            sb.append("]"); return sb.toString();',"        }","        if (o instanceof String[][]) {",'            StringBuilder sb = new StringBuilder("[");',"            String[][] a = (String[][]) o;",'            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(_jsonify(a[i])); }','            sb.append("]"); return sb.toString();',"        }","        if (o instanceof java.util.List) {",'            StringBuilder sb = new StringBuilder("[");',"            java.util.List<?> l = (java.util.List<?>) o;",'            for (int i = 0; i < l.size(); i++) { if (i > 0) sb.append(","); sb.append(_jsonify(l.get(i))); }','            sb.append("]"); return sb.toString();',"        }","        return o.toString();","    }","}"].join(`
`)}if(s==="cpp"){if(n.length===1&&n[0].name==="operations"&&n[0].type&&n[0].type.startsWith("List[List"))return r;const o=(t,e)=>{const p=`_raw_${t}`;return e==="int"?`long long ${t}_ll = stoll(_pgc_trim(${p})); int ${t} = (int)${t}_ll;`:e==="float"?`double ${t} = stod(_pgc_trim(${p}));`:e==="bool"?`bool ${t} = (_pgc_trim(${p}) == "true");`:e==="str"?`string ${t} = _pgc_strip_quotes(${p});`:e==="List[int]"?`vector<int> ${t} = _pgc_parse_vi(${p});`:e==="List[str]"?`vector<string> ${t} = _pgc_parse_vs(${p});`:e==="List[bool]"?`vector<bool> ${t} = _pgc_parse_vb(${p});`:e==="List[List[int]]"?`vector<vector<int>> ${t} = _pgc_parse_vvi(${p});`:e==="List[List[str]]"?`vector<vector<string>> ${t} = _pgc_parse_vvs(${p});`:N(e)?`ListNode* ${t} = _pgc_to_list(_pgc_parse_vi(${p}));`:S(e)?`TreeNode* ${t} = _pgc_to_tree(_pgc_parse_tree_tokens(${p}));`:`string ${t} = ${p}; // TODO: unsupported type ${e}`};let a;u==="int"?a="_pgc_ser_int((long long)_result)":u==="float"?a="_pgc_ser_double(_result)":u==="bool"?a="_pgc_ser_bool(_result)":u==="str"?a="_pgc_ser_str(_result)":u==="List[int]"?a="_pgc_ser_vi(_result)":u==="List[str]"?a="_pgc_ser_vs(_result)":u==="List[bool]"?a="_pgc_ser_vb(_result)":u==="List[List[int]]"?a="_pgc_ser_vvi(_result)":u==="List[List[str]]"?a="_pgc_ser_vvs(_result)":m?a="_pgc_ser_vi(_pgc_from_list(_result))":L?a="_pgc_from_tree(_result)":a="([&]{ ostringstream _o; _o << _result; return _o.str(); })()";const c=d?["    string _raw_values; getline(cin, _raw_values);","    string _raw_pos; getline(cin, _raw_pos);","    vector<int> _values = _pgc_parse_vi(_raw_values);","    int _pos = stoi(_pgc_trim(_raw_pos));","    ListNode* head = _pgc_to_list_cycle(_values, _pos);",`    auto _result = sol.${l}(head);`,`    _out << ${a};`].join(`
`):[...n.map(t=>`    string _raw_${t.name}; getline(cin, _raw_${t.name});`),...n.map(t=>`    ${o(t.name,t.type)}`),`    auto _result = sol.${l}(${n.map(t=>t.name).join(", ")});`,`    _out << ${a};`].join(`
`),f=b>1?["    Solution sol;","    ostringstream _out;",`    int _N = ${b};`,"    for (int _c = 0; _c < _N; _c++) {","        try {",c.split(`
`).map(t=>"        "+t).join(`
`),"        } catch (const std::exception& _e) {",`            _out << "${T}" << _e.what();`,"        } catch (...) {",`            _out << "${T}" << "unknown";`,"        }",`        _out << '\\n' << "${x}" << '\\n';`,"        if (_c < _N - 1) {","            string _sep; getline(cin, _sep); // consume case separator","        }","    }","    cout << _out.str();"].join(`
`):["    Solution sol;","    ostringstream _out;",c,"    _out << '\\n';","    cout << _out.str();"].join(`
`);return[ot,r,"","int main() {","    ios_base::sync_with_stdio(false);","    cin.tie(nullptr);",f,"    return 0;","}"].join(`
`)}if(s==="c"){if(n.length===1&&n[0].name==="operations"&&n[0].type&&n[0].type.startsWith("List[List"))return r;const o=u==="List[int]",a=u==="List[bool]",c=u==="List[str]",f=u==="List[List[int]]",t=[],e=[];d?(t.push("    char* _raw_values = _pgc_read_line();"),t.push("    char* _raw_pos = _pgc_read_line();"),t.push("    int _pos = atoi(_pgc_trim(_raw_pos));"),t.push("    struct ListNode* head = _pgc_to_list_cycle(_raw_values, _pos);"),e.push("head")):n.forEach(i=>{const _=`_raw_${i.name}`;t.push(`    char* ${_} = _pgc_read_line();`),i.type==="int"?(t.push(`    int ${i.name} = atoi(_pgc_trim(${_}));`),e.push(i.name)):i.type==="float"?(t.push(`    double ${i.name} = atof(_pgc_trim(${_}));`),e.push(i.name)):i.type==="bool"?(t.push(`    bool ${i.name} = strcmp(_pgc_trim(${_}), "true") == 0;`),e.push(i.name)):i.type==="str"?(t.push(`    char* ${i.name} = strdup(_pgc_strip_quotes(${_}));`),e.push(i.name)):i.type==="List[int]"?(t.push(`    int ${i.name}Size; int* ${i.name} = _pgc_parse_int_arr(${_}, &${i.name}Size);`),e.push(i.name,`${i.name}Size`)):i.type==="List[bool]"?(t.push(`    int ${i.name}Size; bool* ${i.name} = _pgc_parse_bool_arr(${_}, &${i.name}Size);`),e.push(i.name,`${i.name}Size`)):i.type==="List[str]"?(t.push(`    int ${i.name}Size; char** ${i.name} = _pgc_parse_str_arr(${_}, &${i.name}Size);`),e.push(i.name,`${i.name}Size`)):i.type==="List[List[int]]"?(t.push(`    int ${i.name}Size; int* ${i.name}ColSize; int** ${i.name} = _pgc_parse_int_2d(${_}, &${i.name}Size, &${i.name}ColSize);`),e.push(i.name,`${i.name}Size`,`${i.name}ColSize`)):N(i.type)?(t.push(`    struct ListNode* ${i.name} = _pgc_to_list(${_});`),e.push(i.name)):S(i.type)?(t.push(`    struct TreeNode* ${i.name} = _pgc_to_tree(${_});`),e.push(i.name)):(t.push(`    char* ${i.name} = ${_}; // TODO: unsupported type ${i.type}`),e.push(i.name))});let p;if(o||a||c){const i=c?"char**":a?"bool*":"int*",_=c?"_pgc_print_str_arr":a?"_pgc_print_bool_arr":"_pgc_print_int_arr";p=["    int _retSize;",`    ${i} _result = ${l}(${e.join(", ")}, &_retSize);`,`    ${_}(_result, _retSize);`,"    putchar('\\n');"].join(`
`)}else f?p=["    int _retSize; int* _retColSizes;",`    int** _result = ${l}(${e.join(", ")}, &_retSize, &_retColSizes);`,"    _pgc_print_int_2d(_result, _retSize, _retColSizes);","    putchar('\\n');"].join(`
`):N(u)?p=[`    struct ListNode* _result = ${l}(${e.join(", ")});`,"    _pgc_print_list(_result);","    putchar('\\n');"].join(`
`):S(u)?p=[`    struct TreeNode* _result = ${l}(${e.join(", ")});`,"    _pgc_print_tree(_result);","    putchar('\\n');"].join(`
`):u==="int"?p=[`    int _result = ${l}(${e.join(", ")});`,"    _pgc_print_int(_result);","    putchar('\\n');"].join(`
`):u==="float"?p=[`    double _result = ${l}(${e.join(", ")});`,"    _pgc_print_double(_result);","    putchar('\\n');"].join(`
`):u==="bool"?p=[`    bool _result = ${l}(${e.join(", ")});`,"    _pgc_print_bool(_result);","    putchar('\\n');"].join(`
`):u==="str"?p=[`    char* _result = ${l}(${e.join(", ")});`,"    _pgc_print_str(_result);","    putchar('\\n');"].join(`
`):p=[`    ${l}(${e.join(", ")});`,"    putchar('\\n');"].join(`
`);return[lt,r,"","int main(void) {",...t,p,"    return 0;","}"].join(`
`)}if(s==="go"){if(n.length===1&&n[0].name==="operations"&&n[0].type&&n[0].type.startsWith("List[List"))return r;const o=[],a=d?["head"]:n.map(e=>e.name);d?(o.push("    var _values []int"),o.push("    json.Unmarshal([]byte(_lines[0]), &_values)"),o.push("    _pos, _ := strconv.Atoi(strings.TrimSpace(_lines[1]))"),o.push("    head := _pgc_arr_to_list_cycle(_values, _pos)")):n.forEach((e,p)=>{const i=`_lines[${p}]`;e.type==="int"?(o.push(`    var ${e.name} int`),o.push(`    json.Unmarshal([]byte(${i}), &${e.name})`)):e.type==="float"?(o.push(`    var ${e.name} float64`),o.push(`    json.Unmarshal([]byte(${i}), &${e.name})`)):e.type==="bool"?(o.push(`    var ${e.name} bool`),o.push(`    json.Unmarshal([]byte(${i}), &${e.name})`)):e.type==="str"?(o.push(`    var ${e.name} string`),o.push(`    json.Unmarshal([]byte(${i}), &${e.name})`)):e.type==="List[int]"?(o.push(`    var ${e.name} []int`),o.push(`    json.Unmarshal([]byte(${i}), &${e.name})`)):e.type==="List[bool]"?(o.push(`    var ${e.name} []bool`),o.push(`    json.Unmarshal([]byte(${i}), &${e.name})`)):e.type==="List[str]"?(o.push(`    var ${e.name} []string`),o.push(`    json.Unmarshal([]byte(${i}), &${e.name})`)):e.type==="List[List[int]]"?(o.push(`    var ${e.name} [][]int`),o.push(`    json.Unmarshal([]byte(${i}), &${e.name})`)):e.type==="List[List[str]]"?(o.push(`    var ${e.name} [][]string`),o.push(`    json.Unmarshal([]byte(${i}), &${e.name})`)):N(e.type)?(o.push(`    var ${e.name}Arr []int`),o.push(`    json.Unmarshal([]byte(${i}), &${e.name}Arr)`),o.push(`    ${e.name} := _pgc_arr_to_list(${e.name}Arr)`)):S(e.type)?o.push(`    ${e.name} := _pgc_parse_tree_line(${i})`):(o.push(`    var ${e.name} interface{}`),o.push(`    json.Unmarshal([]byte(${i}), &${e.name})`))});let c;N(u)?c=["    _arr := _pgc_list_to_arr(_result)","    fmt.Println(_pgc_jsonify(_arr))"].join(`
`):S(u)?c="    fmt.Println(_pgc_tree_to_json(_result))":c="    fmt.Println(_pgc_jsonify(_result))";const f=["func main() {","    scanner := bufio.NewScanner(os.Stdin)","    scanner.Buffer(make([]byte, 1024*1024), 1024*1024*16)","    var _lines []string","    for scanner.Scan() {","        _lines = append(_lines, scanner.Text())","    }","    _ = _lines",...o,`    _result := ${l}(${a.join(", ")})`,c,"}"].join(`
`);let t=r.replace(/^[\t ]*package\s+main[\t ]*\r?\n/m,"").replace(/^[\t ]*import\s*\([\s\S]*?\)\r?\n/m,"").replace(/^[\t ]*import\s+"[^"]+"\r?\n/gm,"");return[at,t,"",f].join(`
`)}if(s==="swift"){if(n.length===1&&n[0].name==="operations"&&n[0].type&&n[0].type.startsWith("List[List"))return r;const o=(t,e,p)=>{const i=`_v${p}`,_=`        let ${i}: Any? = _pgcReadJSON(_lines[${p}])`;return e==="int"?`${_}
        let ${t}: Int = _pgcAsInt(${i})`:e==="float"?`${_}
        let ${t}: Double = _pgcAsDouble(${i})`:e==="bool"?`${_}
        let ${t}: Bool = _pgcAsBool(${i})`:e==="str"?`${_}
        let ${t}: String = _pgcAsString(${i})`:e==="List[int]"?`${_}
        let ${t}: [Int] = _pgcIntArr(${i})`:e==="List[bool]"?`${_}
        let ${t}: [Bool] = _pgcBoolArr(${i})`:e==="List[str]"?`${_}
        let ${t}: [String] = _pgcStrArr(${i})`:e==="List[List[int]]"?`${_}
        let ${t}: [[Int]] = _pgcIntIntArr(${i})`:e==="List[List[str]]"?`${_}
        let ${t}: [[String]] = _pgcStrStrArr(${i})`:N(e)?`${_}
        let ${t}: ListNode? = _pgcArrToList(_pgcIntArr(${i}))`:S(e)?`        let ${t}: TreeNode? = _pgcParseTreeLine(_lines[${p}])`:`${_}
        let ${t}: Any? = ${i}`},a=d?["        let _values: [Int] = _pgcIntArr(_pgcReadJSON(_lines[0]))","        let _pos: Int = Int(_lines[1].trimmingCharacters(in: .whitespacesAndNewlines)) ?? -1","        let head: ListNode? = _pgcArrToListCycle(_values, _pos)"].join(`
`):n.map((t,e)=>o(t.name,t.type,e)).join(`
`),c=d?"head":n.map(t=>t.name).join(", ");let f;return m?f=`        let _arr = _pgcListToArr(_result)
        print(_pgcJsonify(_arr))`:L?f="        print(_pgcTreeToArr(_result))":u==="bool"?f='        print(_result ? "true" : "false")':u==="int"?f="        print(_result)":f="        print(_pgcJsonify(_result))",[ut,r,"","let _input = FileHandle.standardInput.availableData",'let _raw = String(data: _input, encoding: .utf8) ?? ""','let _lines = _raw.split(separator: "\\n", omittingEmptySubsequences: false).map { String($0) }',"","do {",a,`    let _result = Solution().${l}(${c})`,f,"}"].join(`
`)}if(s==="kotlin"){if(n.length===1&&n[0].name==="operations"&&n[0].type&&n[0].type.startsWith("List[List"))return r;const o=(t,e,p)=>{const i=`_lines[${p}]`;return e==="int"?`        val ${t}: Int = ${i}.trim().toInt()`:e==="float"?`        val ${t}: Double = ${i}.trim().toDouble()`:e==="bool"?`        val ${t}: Boolean = ${i}.trim() == "true"`:e==="str"?`        val ${t}: String = PGC.stripQuotes(${i})`:e==="List[int]"?`        val ${t}: IntArray = PGC.parseIntArr(${i})`:e==="List[bool]"?`        val ${t}: BooleanArray = PGC.parseBoolArr(${i})`:e==="List[str]"?`        val ${t}: Array<String> = PGC.parseStrArr(${i})`:e==="List[List[int]]"?`        val ${t}: Array<IntArray> = PGC.parseIntIntArr(${i})`:e==="List[List[str]]"?`        val ${t}: Array<Array<String>> = PGC.parseStrStrArr(${i})`:N(e)?`        val ${t}: ListNode? = PGC.arrToList(PGC.parseIntArr(${i}))`:S(e)?`        val ${t}: TreeNode? = PGC.arrToTree(PGC.parseTreeTokens(${i}))`:`        val ${t}: String = ${i}`},a=d?["        val _values: IntArray = PGC.parseIntArr(_lines[0])","        val _pos: Int = _lines[1].trim().toInt()","        val head: ListNode? = PGC.arrToListCycle(_values, _pos)"].join(`
`):n.map((t,e)=>o(t.name,t.type,e)).join(`
`),c=d?"head":n.map(t=>t.name).join(", ");let f;return m?f="    println(PGC.listToStr(_result))":L?f="    println(PGC.treeToStr(_result))":f="    println(PGC.jsonify(_result))",[ct,r,"","fun main() {","    val _lines = System.`in`.bufferedReader().readLines()",a,`    val _result = Solution().${l}(${c})`,f,"}"].join(`
`)}if(s==="rust"){if(n.length===1&&n[0].name==="operations"&&n[0].type&&n[0].type.startsWith("List[List"))return r;const o=k(l),a=(e,p,i)=>{const _=k(e),$=`&_lines[${i}]`;return p==="int"?`    let ${_}: i64 = _pgc_parse_i64(${$});`:p==="float"?`    let ${_}: f64 = _pgc_parse_f64(${$});`:p==="bool"?`    let ${_}: bool = _pgc_parse_bool(${$});`:p==="str"?`    let ${_}: String = _pgc_parse_str(${$});`:p==="List[int]"?`    let ${_}: Vec<i64> = _pgc_parse_vi(${$});`:p==="List[bool]"?`    let ${_}: Vec<bool> = _pgc_parse_vb(${$});`:p==="List[str]"?`    let ${_}: Vec<String> = _pgc_parse_vs(${$});`:p==="List[List[int]]"?`    let ${_}: Vec<Vec<i64>> = _pgc_parse_vvi(${$});`:p==="List[List[str]]"?`    let ${_}: Vec<Vec<String>> = _pgc_parse_vvs(${$});`:N(p)?`    let ${_}: Option<Box<ListNode>> = _pgc_arr_to_list(&_pgc_parse_vi(${$}));`:S(p)?`    let ${_}: Option<Rc<RefCell<TreeNode>>> = _pgc_arr_to_tree(&_pgc_parse_tree_tokens(${$}));`:`    let ${_}: String = _lines[${i}].clone();`},c=d?["    let _values: Vec<i64> = _pgc_parse_vi(&_lines[0]);","    let _pos: i64 = _pgc_parse_i64(&_lines[1]);","    let head: Option<Box<ListNode>> = _pgc_arr_to_list_cycle(&_values, _pos);"].join(`
`):n.map((e,p)=>a(e.name,e.type,p)).join(`
`),f=d?"head":n.map(e=>k(e.name)).join(", ");let t;return m?t=["    let _arr = _pgc_list_to_vec(_result);",'    println!("{}", _pgc_ser_vi(&_arr));'].join(`
`):L?t='    println!("{}", _pgc_tree_to_str(_result));':u==="int"?t='    println!("{}", _pgc_ser_i64(_result));':u==="float"?t='    println!("{}", _pgc_ser_f64(_result));':u==="bool"?t='    println!("{}", _pgc_ser_bool(_result));':u==="str"?t='    println!("{}", _pgc_ser_str(&_result));':u==="List[int]"?t='    println!("{}", _pgc_ser_vi(&_result));':u==="List[bool]"?t='    println!("{}", _pgc_ser_vb(&_result));':u==="List[str]"?t='    println!("{}", _pgc_ser_vs(&_result));':u==="List[List[int]]"?t='    println!("{}", _pgc_ser_vvi(&_result));':u==="List[List[str]]"?t='    println!("{}", _pgc_ser_vvs(&_result));':t='    println!("{:?}", _result);',[_t,r,"","fn main() {","    let mut _buf = String::new();","    io::stdin().read_to_string(&mut _buf).ok();","    let _lines: Vec<String> = _buf.lines().map(|s| s.to_string()).collect();",c,`    let _result = Solution::${o}(${f});`,t,"}"].join(`
`)}if(s==="typescript"){if(n.length===1&&n[0].name==="operations"&&n[0].type&&n[0].type.startsWith("List[List"))return r;const o=(t,e,p)=>{const i=`_lines[${p}]`;return N(e)?`const ${t}: ListNode | null = _pgcToList(JSON.parse(${i}));`:S(e)?`const ${t}: TreeNode | null = _pgcToTree(JSON.parse(${i}));`:`const ${t}: any = JSON.parse(${i});`},a=d?["const _values: any = JSON.parse(_lines[0]);","const _pos: number = parseInt(_lines[1].trim(), 10);","const head: ListNode | null = _pgcToListCycle(_values, _pos);"].join(`
`):n.map((t,e)=>o(t.name,t.type,e)).join(`
`),c=d?"head":n.map(t=>t.name).join(", ");let f;return m?f="console.log(JSON.stringify(_pgcFromList(_result as ListNode | null)));":L?f="console.log(JSON.stringify(_pgcFromTree(_result as TreeNode | null)));":f="console.log(JSON.stringify(_result));",[pt,r,"","const _raw = require('fs').readFileSync('/dev/stdin', 'utf8');","const _lines = _raw.split('\\n');",a,`const _result: any = ${l}(${c} as any);`,f].join(`
`)}return r}function St(r){return(r||[]).join(`
`)}function A(r,s){if(r===s)return!0;if(r===null||s===null)return r===s;if(typeof r!=typeof s)return!1;if(typeof r!="object")return r===s;if(Array.isArray(r)!==Array.isArray(s))return!1;if(Array.isArray(r)){if(r.length!==s.length)return!1;for(let u=0;u<r.length;u++)if(!A(r[u],s[u]))return!1;return!0}const l=Object.keys(r),n=Object.keys(s);if(l.length!==n.length)return!1;for(const u of l)if(!Object.prototype.hasOwnProperty.call(s,u)||!A(r[u],s[u]))return!1;return!0}function dt(r,s){const l=(s??"").toString().trim(),n=(r??"").toString().trim();if(l===n)return!0;let u,h,d=!1,v=!1;try{u=JSON.parse(l),d=!0}catch{}try{h=JSON.parse(n),v=!0}catch{}if(d&&v)return A(u,h);const m=l.replace(/\s+/g,"").toLowerCase(),L=n.replace(/\s+/g,"").toLowerCase();return m===L}function $t(r,s){return dt(s,r)}const gt="0.29.4",V=`https://cdn.jsdelivr.net/pyodide/v${gt}/full/`;let y=null;function U(){return y||(y=(async()=>await(await G(()=>import(`${V}pyodide.mjs`),[],import.meta.url)).loadPyodide({indexURL:V}))().catch(r=>{throw y=null,r}),y)}async function J(r,{onStdout:s,onStdin:l,onError:n,onDone:u}={}){const h=await U();try{await h.loadPackagesFromImports(r)}catch{}const d=g=>{try{s==null||s(String(g))}catch{}},v=g=>{try{n==null||n(String(g))}catch{}},m=async g=>{g&&d(String(g));const o=await Promise.resolve(l==null?void 0:l());return o==null?"":String(o)};h.setStdout({write:g=>{try{const o=new TextDecoder().decode(g);d(o)}catch{}return g.length},isatty:!1}),h.setStderr({write:g=>{try{const o=new TextDecoder().decode(g);v(o)}catch{}return g.length},isatty:!1}),h.globals.set("__pg_input",m),h.globals.set("__pg_user_code",r);const L=`
import builtins, sys, traceback
from pyodide.ffi import run_sync

def __pg_blocking_input(prompt=""):
    # Pyodide's batched stdout only flushes on newline. Force a flush so any
    # pending print(..., end="") (the classic "Enter input : " case) reaches
    # the UI before we block on the user.
    try:
        sys.stdout.flush()
    except Exception:
        pass
    return run_sync(__pg_input(prompt))

builtins.input = __pg_blocking_input

__pg_exit_code = 0
try:
    exec(compile(__pg_user_code, "<playground>", "exec"),
         {"__name__": "__main__", "input": __pg_blocking_input})
except SystemExit as __pg_e:
    __pg_exit_code = int(getattr(__pg_e, "code", 0) or 0)
except BaseException:
    sys.stderr.write(traceback.format_exc())
    __pg_exit_code = 1
finally:
    try:
        sys.stdout.flush()
    except Exception:
        pass
`;let b=0;try{await h.runPythonAsync(L);const g=h.globals.get("__pg_exit_code");b=typeof g=="number"?g:0}catch(g){v(g!=null&&g.message?`${g.message}
`:`${String(g)}
`),b=1}finally{try{h.globals.delete("__pg_input")}catch{}try{h.globals.delete("__pg_user_code")}catch{}try{h.globals.delete("__pg_exit_code")}catch{}}return u==null||u(b),b}async function F(r){let s="",l=!1;try{return{status:await J(r,{onStdout:h=>{s+=h},onError:h=>{s+=h,l=!0},onStdin:()=>""})!==0||l?"runtime_error":"success",output:s||"(No output)"}}catch(n){const u=n!=null&&n.message?String(n.message):String(n);return{status:"runtime_error",output:s?`${s}
${u}`:u}}}const bt=Object.freeze(Object.defineProperty({__proto__:null,loadPyodideOnce:U,runInteractive:J,runPythonInBrowser:F},Symbol.toStringTag,{value:"Module"})),ht="https://ce.judge0.com/submissions?base64_encoded=false&wait=true",j={python:{id:71,name:"Python 3",monaco:"python",harness:!0},javascript:{id:63,name:"JavaScript",monaco:"javascript",harness:!0},java:{id:62,name:"Java",monaco:"java",harness:!0},cpp:{id:54,name:"C++",monaco:"cpp",harness:!0},c:{id:50,name:"C",monaco:"c",harness:!0},go:{id:60,name:"Go",monaco:"go",harness:!0},rust:{id:73,name:"Rust",monaco:"rust",harness:!0},typescript:{id:74,name:"TypeScript",monaco:"typescript",harness:!0},csharp:{id:51,name:"C#",monaco:"csharp",harness:!1},ruby:{id:72,name:"Ruby",monaco:"ruby",harness:!1},kotlin:{id:78,name:"Kotlin",monaco:"kotlin",harness:!0},swift:{id:83,name:"Swift",monaco:"swift",harness:!0},php:{id:68,name:"PHP",monaco:"php",harness:!1},bash:{id:46,name:"Bash",monaco:"shell",harness:!1}},wt=Object.entries(j).map(([r,s])=>({value:r,label:s.name,monaco:s.monaco}));Object.entries(j).filter(([,r])=>r.harness).map(([r,s])=>({value:r,label:s.name,monaco:s.monaco}));async function M(r,s,l){if(!j[s])throw new Error(`Unsupported language: ${s}`);if(!Array.isArray(l)||l.length===0)return[];const{data:n,error:u}=await W.functions.invoke("run-code",{body:{code:r,language:s,stdins:l}});if(u){console.warn("run-code edge function failed, falling back to direct Judge0:",u.message);const h=[];for(const d of l)h.push(await vt(r,s,d));return h}if(n!=null&&n.error)throw new Error(n.error);return n.results}async function yt(r,s,l){if(!Array.isArray(l)||l.length===0)return[];const n=l.join(`
${st}
`),[u]=await M(r,s,[n]);if(u.status!=="success")return l.map(()=>({status:u.status,output:u.output}));const h=(u.output||"").split(`${x}
`).map(v=>v.replace(/\n$/,"")),d=[];for(let v=0;v<l.length;v++){const m=h[v];if(m===void 0){d.push({status:"runtime_error",output:"Execution aborted before this case ran"});continue}if(m.startsWith(T)){d.push({status:"runtime_error",output:m.slice(T.length)});continue}d.push({status:"success",output:m})}return d}async function kt(r,s,l=""){return s==="python"&&typeof window<"u"?F(r):(await M(r,s,[l]))[0]}async function vt(r,s,l=""){var v;const n=j[s],u=await fetch(ht,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({language_id:n.id,source_code:r,stdin:l})});if(!u.ok)throw new Error(`Execution service returned ${u.status}`);const h=await u.json(),d=(v=h.status)==null?void 0:v.id;return d===6?{status:"compile_error",output:h.compile_output||"Compilation failed"}:d===5?{status:"time_limit",output:"Time Limit Exceeded (5s)"}:d===3?{status:"success",output:h.stdout||"(No output)"}:{status:"runtime_error",output:h.stderr||h.compile_output||h.message||"Runtime error"}}export{j as L,wt as P,yt as a,St as b,M as c,$t as d,Lt as g,bt as p,kt as r,Nt as w};
