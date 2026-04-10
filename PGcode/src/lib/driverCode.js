// ─── Type mappings: Python canonical → JS/Java ───

const TYPE_MAP = {
  'int':                { jsdoc: 'number',     java: 'int' },
  'float':              { jsdoc: 'number',     java: 'double' },
  'str':                { jsdoc: 'string',     java: 'String' },
  'bool':               { jsdoc: 'boolean',    java: 'boolean' },
  'List[int]':          { jsdoc: 'number[]',   java: 'int[]' },
  'List[str]':          { jsdoc: 'string[]',   java: 'String[]' },
  'List[List[int]]':    { jsdoc: 'number[][]', java: 'int[][]' },
  'List[List[str]]':    { jsdoc: 'string[][]', java: 'String[][]' },
  'List[bool]':         { jsdoc: 'boolean[]',  java: 'boolean[]' },
  'ListNode':           { jsdoc: 'ListNode',   java: 'ListNode' },
  'Optional[ListNode]': { jsdoc: 'ListNode',   java: 'ListNode' },
  'TreeNode':           { jsdoc: 'TreeNode',   java: 'TreeNode' },
  'Optional[TreeNode]': { jsdoc: 'TreeNode',   java: 'TreeNode' },
};

const jt = (pyType) => TYPE_MAP[pyType]?.java || pyType;
const jd = (pyType) => TYPE_MAP[pyType]?.jsdoc || pyType;

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

export function wrapWithDriver(userCode, language, methodName, params) {
  if (!methodName || !params) return userCode;

  const args = params.map(p => p.name).join(', ');

  if (language === 'python') {
    const parsing = params.map((p, i) => {
      if (isListNodeType(p.type)) return `${p.name} = _to_list(json.loads(_lines[${i}]))`;
      if (isTreeNodeType(p.type)) return `${p.name} = _to_tree(json.loads(_lines[${i}]))`;
      return `${p.name} = json.loads(_lines[${i}])`;
    }).join('\n');

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
      'if isinstance(_result, ListNode):',
      '    print(json.dumps(_from_list(_result)))',
      'elif isinstance(_result, TreeNode):',
      '    print(json.dumps(_from_tree(_result)))',
      'elif isinstance(_result, bool):',
      '    print(str(_result).lower())',
      'elif _result is None:',
      '    print("null")',
      'else:',
      '    print(json.dumps(_result))',
    ].join('\n');
  }

  if (language === 'javascript') {
    const parsing = params.map((p, i) => {
      if (isListNodeType(p.type)) return `const ${p.name} = _toList(JSON.parse(_lines[${i}]));`;
      if (isTreeNodeType(p.type)) return `const ${p.name} = _toTree(JSON.parse(_lines[${i}]));`;
      return `const ${p.name} = JSON.parse(_lines[${i}]);`;
    }).join('\n');

    return [
      JS_HELPERS,
      userCode,
      '',
      "const _lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');",
      parsing,
      `const _result = ${methodName}(${args});`,
      'if (_result instanceof ListNode) {',
      '    console.log(JSON.stringify(_fromList(_result)));',
      '} else if (_result instanceof TreeNode) {',
      '    console.log(JSON.stringify(_fromTree(_result)));',
      '} else {',
      '    console.log(JSON.stringify(_result));',
      '}',
    ].join('\n');
  }

  if (language === 'java') {
    // Java doesn't support ListNode/TreeNode types — fall back to raw user code for those
    const hasNodeType = params.some(p => isListNodeType(p.type) || isTreeNodeType(p.type));
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
      return `${line}\n        // TODO: parse ${p.type}`;
    }).join('\n        ');

    const resultPrint = generateJavaResultPrint(methodName, args);

    return [
      'import java.util.*;',
      'import java.io.*;',
      '',
      userCode,
      '',
      'class Main {',
      '    public static void main(String[] _args) throws Exception {',
      '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
      `        ${javaParsing}`,
      '        Solution sol = new Solution();',
      `        ${resultPrint}`,
      '    }',
      '}',
    ].join('\n');
  }

  return userCode;
}

function generateJavaResultPrint(methodName, args) {
  // Generic: call method, convert to string
  return [
    `var _result = sol.${methodName}(${args});`,
    'if (_result instanceof int[]) {',
    '    StringBuilder sb = new StringBuilder("[");',
    '    for(int i=0;i<((int[])_result).length;i++){if(i>0)sb.append(",");sb.append(((int[])_result)[i]);}',
    '    sb.append("]"); System.out.println(sb);',
    '} else if (_result instanceof boolean[]) {',
    '    StringBuilder sb = new StringBuilder("[");',
    '    for(int i=0;i<((boolean[])_result).length;i++){if(i>0)sb.append(",");sb.append(((boolean[])_result)[i]);}',
    '    sb.append("]"); System.out.println(sb);',
    '} else { System.out.println(_result); }',
  ].join('\n        ');
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
