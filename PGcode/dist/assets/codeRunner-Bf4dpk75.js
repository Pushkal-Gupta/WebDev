import{s as k}from"./index-Dp7y8ppH.js";const L={int:{jsdoc:"number",java:"int",cpp:"int"},float:{jsdoc:"number",java:"double",cpp:"double"},str:{jsdoc:"string",java:"String",cpp:"string"},bool:{jsdoc:"boolean",java:"boolean",cpp:"bool"},"List[int]":{jsdoc:"number[]",java:"int[]",cpp:"vector<int>"},"List[str]":{jsdoc:"string[]",java:"String[]",cpp:"vector<string>"},"List[List[int]]":{jsdoc:"number[][]",java:"int[][]",cpp:"vector<vector<int>>"},"List[List[str]]":{jsdoc:"string[][]",java:"String[][]",cpp:"vector<vector<string>>"},"List[bool]":{jsdoc:"boolean[]",java:"boolean[]",cpp:"vector<bool>"},ListNode:{jsdoc:"ListNode",java:"ListNode",cpp:"ListNode*"},"Optional[ListNode]":{jsdoc:"ListNode",java:"ListNode",cpp:"ListNode*"},TreeNode:{jsdoc:"TreeNode",java:"TreeNode",cpp:"TreeNode*"},"Optional[TreeNode]":{jsdoc:"TreeNode",java:"TreeNode",cpp:"TreeNode*"}},w=e=>{var n;return((n=L[e])==null?void 0:n.java)||e},j=e=>{var n;return((n=L[e])==null?void 0:n.jsdoc)||e},y=e=>{var n;return((n=L[e])==null?void 0:n.cpp)||e},m=e=>e==="ListNode"||e==="Optional[ListNode]",b=e=>e==="TreeNode"||e==="Optional[TreeNode]",E=`# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
`,O=`# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
`,q=`/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
`,P=`/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
`,B=`/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
`,C=`/**
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
`;function M(e,n,i,r){if(!n||!i)return null;const s=[...i.map(_=>_.type),r||""],c=s.some(m),u=s.some(b);if(e==="python"){const _=i.map(f=>`${f.name}: ${f.type}`).join(", ");let l="";return c&&(l+=E),u&&(l+=O),`${l}class Solution:
    def ${n}(self, ${_}) -> ${r}:
        `}if(e==="javascript"){const _=i.map(p=>` * @param {${j(p.type)}} ${p.name}`).join(`
`),l=i.map(p=>p.name).join(", ");let f="";return c&&(f+=q),u&&(f+=P),`${f}/**
${_}
 * @return {${j(r)}}
 */
var ${n} = function(${l}) {
    
};`}if(e==="java"){const _=i.map(l=>`${w(l.type)} ${l.name}`).join(", ");return`class Solution {
    public ${w(r)} ${n}(${_}) {
        
    }
}`}if(e==="cpp"){const _=i.map(f=>{const p=y(f.type);return p.startsWith("vector<")||p==="string"?`${p}& ${f.name}`:`${p} ${f.name}`}).join(", ");let l="";return c&&(l+=B),u&&(l+=C),`${l}#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    ${y(r)} ${n}(${_}) {
        
    }
};`}return null}const T=`
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
`,z=`
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
`,A="###CASE###",S="###END###",N="###ERR###",D=`
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
`;function U(e,n,i,r,s,c={}){if(!i||!r)return e;const u=r.map(p=>p.name).join(", "),_=m(s),l=b(s),f=Math.max(1,Number(c.multiCaseCount)||1);if(n==="python"){if(r.length===1&&r[0].name==="operations"&&r[0].type&&r[0].type.startsWith("List[List"))return["import sys, json","from typing import List, Optional, Dict, Tuple, Set",T,e,"","_ops = json.loads(sys.stdin.read().strip())","_results = []","_instance = None","for _op in _ops:","    _name = _op[0]","    _args = _op[1:]","    if _instance is None:","        _cls = globals()[_name]","        _instance = _cls(*_args)","        _results.append(None)","    else:","        _ret = getattr(_instance, _name)(*_args)","        _results.append(_ret)","print(json.dumps(_results))"].join(`
`);const g=r.map((t,d)=>m(t.type)?`${t.name} = _to_list(json.loads(_lines[${d}]))`:b(t.type)?`${t.name} = _to_tree(json.loads(_lines[${d}]))`:`${t.name} = json.loads(_lines[${d}])`).join(`
`);let o;return _?o="print(json.dumps(_from_list(_result)))":l?o="print(json.dumps(_from_tree(_result)))":o=["if isinstance(_result, bool):","    print(str(_result).lower())","elif _result is None:",'    print("null")',"else:","    print(json.dumps(_result))"].join(`
`),["from __future__ import annotations","import sys, json","from typing import List, Optional, Dict, Tuple, Set",T,e,"",'_lines = sys.stdin.read().strip().split("\\n")',g,"_sol = Solution()",`_result = _sol.${i}(${u})`,o].join(`
`)}if(n==="javascript"){const p=r.map((o,t)=>m(o.type)?`const ${o.name} = _toList(JSON.parse(_lines[${t}]));`:b(o.type)?`const ${o.name} = _toTree(JSON.parse(_lines[${t}]));`:`const ${o.name} = JSON.parse(_lines[${t}]);`).join(`
`);let g;return _?g="console.log(JSON.stringify(_fromList(_result)));":l?g="console.log(JSON.stringify(_fromTree(_result)));":g="console.log(JSON.stringify(_result));",[z,e,"","const _lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');",p,`const _result = ${i}(${u});`,g].join(`
`)}if(n==="java"){if(r.some(t=>m(t.type)||b(t.type))||_||l)return e;const g=r.map(t=>{const d=`String _raw_${t.name} = br.readLine().trim();`;return t.type==="int"?`${d}
        int ${t.name} = Integer.parseInt(_raw_${t.name});`:t.type==="str"?`${d}
        String ${t.name} = _raw_${t.name}.startsWith("\\"") ? _raw_${t.name}.substring(1, _raw_${t.name}.length()-1) : _raw_${t.name};`:t.type==="bool"?`${d}
        boolean ${t.name} = Boolean.parseBoolean(_raw_${t.name});`:t.type==="List[int]"?[d,`        String _s_${t.name} = _raw_${t.name}.substring(1, _raw_${t.name}.length()-1);`,`        String[] _p_${t.name} = _s_${t.name}.isEmpty() ? new String[0] : _s_${t.name}.split(",");`,`        int[] ${t.name} = new int[_p_${t.name}.length];`,`        for(int i=0;i<_p_${t.name}.length;i++) ${t.name}[i]=Integer.parseInt(_p_${t.name}[i].trim());`].join(`
        `):t.type==="List[str]"?[d,`        String _s_${t.name} = _raw_${t.name}.substring(1, _raw_${t.name}.length()-1);`,`        String[] ${t.name} = _s_${t.name}.isEmpty() ? new String[0] : _s_${t.name}.split(",");`,`        for(int i=0;i<${t.name}.length;i++) ${t.name}[i]=${t.name}[i].trim().replace("\\"","");`].join(`
        `):t.type==="List[List[int]]"?[d,`        int[][] ${t.name} = _parseIntIntArr(_raw_${t.name});`].join(`
        `):t.type==="List[List[str]]"?[d,`        String[][] ${t.name} = _parseStrStrArr(_raw_${t.name});`].join(`
        `):`${d}
        // TODO: parse ${t.type}`}).join(`
        `),o=f>1?["        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));","        Solution sol = new Solution();",`        int _N = ${f};`,"        StringBuilder _out = new StringBuilder();","        for (int _c = 0; _c < _N; _c++) {","            try {",`                ${g}`,`                Object _result = (Object) sol.${i}(${u});`,"                _out.append(_jsonify(_result));","            } catch (Throwable _t) {",`                _out.append("${N}").append(_t.getClass().getSimpleName()).append(": ").append(String.valueOf(_t.getMessage()));`,"            }",`            _out.append('\\n').append("${S}").append('\\n');`,"            if (_c < _N - 1) {","                // Consume the case separator line from stdin","                String _sep = br.readLine();","                // tolerate missing separator silently","            }","        }","        System.out.print(_out.toString());"].join(`
`):["        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));",`        ${g}`,"        Solution sol = new Solution();",`        Object _result = (Object) sol.${i}(${u});`,"        System.out.println(_jsonify(_result));"].join(`
`);return["import java.util.*;","import java.io.*;","",e,"","class Main {","    public static void main(String[] _args) throws Exception {",o,"    }","","    static int[][] _parseIntIntArr(String s) {","        if (s.length() < 2) return new int[0][];","        String inner = s.substring(1, s.length()-1);","        if (inner.isEmpty()) return new int[0][];","        List<int[]> rows = new ArrayList<>();","        int depth = 0, start = 0;","        for (int i = 0; i < inner.length(); i++) {","            char c = inner.charAt(i);","            if (c == '[') depth++;","            else if (c == ']') {","                depth--;","                if (depth == 0) {","                    String row = inner.substring(start, i+1);","                    String ri = row.substring(1, row.length()-1);","                    if (ri.isEmpty()) rows.add(new int[0]);","                    else {",'                        String[] parts = ri.split(",");',"                        int[] arr = new int[parts.length];","                        for (int k = 0; k < parts.length; k++) arr[k] = Integer.parseInt(parts[k].trim());","                        rows.add(arr);","                    }","                    i++; // skip comma","                    start = i + 1;","                }","            }","        }","        return rows.toArray(new int[0][]);","    }","","    static String[][] _parseStrStrArr(String s) {","        if (s.length() < 2) return new String[0][];","        String inner = s.substring(1, s.length()-1);","        if (inner.isEmpty()) return new String[0][];","        List<String[]> rows = new ArrayList<>();","        int depth = 0, start = 0;","        for (int i = 0; i < inner.length(); i++) {","            char c = inner.charAt(i);","            if (c == '[') depth++;","            else if (c == ']') {","                depth--;","                if (depth == 0) {","                    String row = inner.substring(start, i+1);","                    String ri = row.substring(1, row.length()-1);","                    if (ri.isEmpty()) rows.add(new String[0]);","                    else {",'                        String[] parts = ri.split(",");','                        for (int k = 0; k < parts.length; k++) parts[k] = parts[k].trim().replace("\\"","");',"                        rows.add(parts);","                    }","                    i++;","                    start = i + 1;","                }","            }","        }","        return rows.toArray(new String[0][]);","    }","","    static String _jsonify(Object o) {",'        if (o == null) return "null";',"        if (o instanceof Boolean || o instanceof Integer || o instanceof Long || o instanceof Double || o instanceof Float) return o.toString();",'        if (o instanceof Character) return "\\"" + o + "\\"";','        if (o instanceof String) return "\\"" + o + "\\"";',"        if (o instanceof int[]) {",'            StringBuilder sb = new StringBuilder("[");',"            int[] a = (int[]) o;",'            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }','            sb.append("]"); return sb.toString();',"        }","        if (o instanceof long[]) {",'            StringBuilder sb = new StringBuilder("[");',"            long[] a = (long[]) o;",'            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }','            sb.append("]"); return sb.toString();',"        }","        if (o instanceof boolean[]) {",'            StringBuilder sb = new StringBuilder("[");',"            boolean[] a = (boolean[]) o;",'            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }','            sb.append("]"); return sb.toString();',"        }","        if (o instanceof int[][]) {",'            StringBuilder sb = new StringBuilder("[");',"            int[][] a = (int[][]) o;",'            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(_jsonify(a[i])); }','            sb.append("]"); return sb.toString();',"        }","        if (o instanceof String[]) {",'            StringBuilder sb = new StringBuilder("[");',"            String[] a = (String[]) o;",'            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append("\\"").append(a[i]).append("\\""); }','            sb.append("]"); return sb.toString();',"        }","        if (o instanceof String[][]) {",'            StringBuilder sb = new StringBuilder("[");',"            String[][] a = (String[][]) o;",'            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(_jsonify(a[i])); }','            sb.append("]"); return sb.toString();',"        }","        if (o instanceof java.util.List) {",'            StringBuilder sb = new StringBuilder("[");',"            java.util.List<?> l = (java.util.List<?>) o;",'            for (int i = 0; i < l.size(); i++) { if (i > 0) sb.append(","); sb.append(_jsonify(l.get(i))); }','            sb.append("]"); return sb.toString();',"        }","        return o.toString();","    }","}"].join(`
`)}if(n==="cpp"){if(r.length===1&&r[0].name==="operations"&&r[0].type&&r[0].type.startsWith("List[List"))return e;const g=(a,h)=>{const v=`_raw_${a}`;return h==="int"?`long long ${a}_ll = stoll(_pgc_trim(${v})); int ${a} = (int)${a}_ll;`:h==="float"?`double ${a} = stod(_pgc_trim(${v}));`:h==="bool"?`bool ${a} = (_pgc_trim(${v}) == "true");`:h==="str"?`string ${a} = _pgc_strip_quotes(${v});`:h==="List[int]"?`vector<int> ${a} = _pgc_parse_vi(${v});`:h==="List[str]"?`vector<string> ${a} = _pgc_parse_vs(${v});`:h==="List[bool]"?`vector<bool> ${a} = _pgc_parse_vb(${v});`:h==="List[List[int]]"?`vector<vector<int>> ${a} = _pgc_parse_vvi(${v});`:h==="List[List[str]]"?`vector<vector<string>> ${a} = _pgc_parse_vvs(${v});`:m(h)?`ListNode* ${a} = _pgc_to_list(_pgc_parse_vi(${v}));`:b(h)?`TreeNode* ${a} = _pgc_to_tree(_pgc_parse_tree_tokens(${v}));`:`string ${a} = ${v}; // TODO: unsupported type ${h}`};let o;s==="int"?o="_pgc_ser_int((long long)_result)":s==="float"?o="_pgc_ser_double(_result)":s==="bool"?o="_pgc_ser_bool(_result)":s==="str"?o="_pgc_ser_str(_result)":s==="List[int]"?o="_pgc_ser_vi(_result)":s==="List[str]"?o="_pgc_ser_vs(_result)":s==="List[bool]"?o="_pgc_ser_vb(_result)":s==="List[List[int]]"?o="_pgc_ser_vvi(_result)":s==="List[List[str]]"?o="_pgc_ser_vvs(_result)":_?o="_pgc_ser_vi(_pgc_from_list(_result))":l?o="_pgc_from_tree(_result)":o="([&]{ ostringstream _o; _o << _result; return _o.str(); })()";const t=[...r.map(a=>`    string _raw_${a.name}; getline(cin, _raw_${a.name});`),...r.map(a=>`    ${g(a.name,a.type)}`),`    auto _result = sol.${i}(${r.map(a=>a.name).join(", ")});`,`    _out << ${o};`].join(`
`),d=f>1?["    Solution sol;","    ostringstream _out;",`    int _N = ${f};`,"    for (int _c = 0; _c < _N; _c++) {","        try {",t.split(`
`).map(a=>"        "+a).join(`
`),"        } catch (const std::exception& _e) {",`            _out << "${N}" << _e.what();`,"        } catch (...) {",`            _out << "${N}" << "unknown";`,"        }",`        _out << '\\n' << "${S}" << '\\n';`,"        if (_c < _N - 1) {","            string _sep; getline(cin, _sep); // consume case separator","        }","    }","    cout << _out.str();"].join(`
`):["    Solution sol;","    ostringstream _out;",t,"    _out << '\\n';","    cout << _out.str();"].join(`
`);return[D,e,"","int main() {","    ios_base::sync_with_stdio(false);","    cin.tie(nullptr);",d,"    return 0;","}"].join(`
`)}return e}function G(e){return(e||[]).join(`
`)}function W(e,n){const i=(e||"").trim(),r=(n||"").trim();if(i===r)return!0;try{return JSON.stringify(JSON.parse(i))===JSON.stringify(JSON.parse(r))}catch{return i.toLowerCase()===r.toLowerCase()}}const I="https://ce.judge0.com/submissions?base64_encoded=false&wait=true",$={python:{id:71,name:"Python 3",monaco:"python",harness:!0},javascript:{id:63,name:"JavaScript",monaco:"javascript",harness:!0},java:{id:62,name:"Java",monaco:"java",harness:!0},cpp:{id:54,name:"C++",monaco:"cpp",harness:!0},c:{id:50,name:"C",monaco:"c",harness:!1},go:{id:60,name:"Go",monaco:"go",harness:!1},rust:{id:73,name:"Rust",monaco:"rust",harness:!1},typescript:{id:74,name:"TypeScript",monaco:"typescript",harness:!1},csharp:{id:51,name:"C#",monaco:"csharp",harness:!1},ruby:{id:72,name:"Ruby",monaco:"ruby",harness:!1},kotlin:{id:78,name:"Kotlin",monaco:"kotlin",harness:!1},swift:{id:83,name:"Swift",monaco:"swift",harness:!1},php:{id:68,name:"PHP",monaco:"php",harness:!1},bash:{id:46,name:"Bash",monaco:"shell",harness:!1}},Y=Object.entries($).map(([e,n])=>({value:e,label:n.name,monaco:n.monaco}));Object.entries($).filter(([,e])=>e.harness).map(([e,n])=>({value:e,label:n.name,monaco:n.monaco}));async function x(e,n,i){if(!$[n])throw new Error(`Unsupported language: ${n}`);if(!Array.isArray(i)||i.length===0)return[];const{data:r,error:s}=await k.functions.invoke("run-code",{body:{code:e,language:n,stdins:i}});if(s){console.warn("run-code edge function failed, falling back to direct Judge0:",s.message);const c=[];for(const u of i)c.push(await R(e,n,u));return c}if(r!=null&&r.error)throw new Error(r.error);return r.results}async function F(e,n,i){if(!Array.isArray(i)||i.length===0)return[];const r=i.join(`
${A}
`),[s]=await x(e,n,[r]);if(s.status!=="success")return i.map(()=>({status:s.status,output:s.output}));const c=(s.output||"").split(`${S}
`).map(_=>_.replace(/\n$/,"")),u=[];for(let _=0;_<i.length;_++){const l=c[_];if(l===void 0){u.push({status:"runtime_error",output:"Execution aborted before this case ran"});continue}if(l.startsWith(N)){u.push({status:"runtime_error",output:l.slice(N.length)});continue}u.push({status:"success",output:l})}return u}async function H(e,n,i=""){return(await x(e,n,[i]))[0]}async function R(e,n,i=""){var _;const r=$[n],s=await fetch(I,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({language_id:r.id,source_code:e,stdin:i})});if(!s.ok)throw new Error(`Execution service returned ${s.status}`);const c=await s.json(),u=(_=c.status)==null?void 0:_.id;return u===6?{status:"compile_error",output:c.compile_output||"Compilation failed"}:u===5?{status:"time_limit",output:"Time Limit Exceeded (5s)"}:u===3?{status:"success",output:c.stdout||"(No output)"}:{status:"runtime_error",output:c.stderr||c.compile_output||c.message||"Runtime error"}}export{Y as P,F as a,G as b,x as c,W as d,M as g,H as r,U as w};
