// Verify the claimed expected values for my hand-written samples by running the
// canonical Python through the actual real driver (matching driverCode.js's python wrap).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(URL, SVC);

const isListNodeType = (t) => /ListNode/.test(t || '');
const isTreeNodeType = (t) => /TreeNode/.test(t || '');
const isListReturn = (t) => /^List/.test(t || '');
const isTreeReturn = (t) => isTreeNodeType(t);

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
    head = ListNode(arr[0])
    cur = head
    for v in arr[1:]:
        cur.next = ListNode(v)
        cur = cur.next
    return head

def _from_list(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out

def _to_list_cycle(arr, pos):
    if not arr:
        return None
    nodes = [ListNode(v) for v in arr]
    for i in range(len(nodes)-1):
        nodes[i].next = nodes[i+1]
    if pos >= 0 and pos < len(nodes):
        nodes[-1].next = nodes[pos]
    return nodes[0]

def _to_tree(arr):
    if not arr:
        return None
    root = TreeNode(arr[0])
    q = [root]
    i = 1
    while q and i < len(arr):
        node = q.pop(0)
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            q.append(node.right)
        i += 1
    return root

def _from_tree(root):
    if not root:
        return []
    out = []
    q = [root]
    while q:
        node = q.pop(0)
        if node is None:
            out.append(None)
        else:
            out.append(node.val)
            q.append(node.left)
            q.append(node.right)
    while out and out[-1] is None:
        out.pop()
    return out
`;

function buildPyDriver(userCode, methodName, params, returnType) {
  const cycledInput = params.length === 2 && params[0].name === 'values' && params[1].name === 'pos';
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
  const args = cycledInput ? 'head' : params.map(p => p.name).join(', ');
  let outputBlock;
  if (isListReturn(returnType) && !returnType.includes('Optional')) {
    if (returnType === 'Optional[ListNode]' || returnType === 'ListNode' ) {
      outputBlock = 'print(json.dumps(_from_list(_result)))';
    } else {
      outputBlock = [
        'if isinstance(_result, bool):',
        '    print(str(_result).lower())',
        'elif _result is None:',
        '    print("null")',
        'elif isinstance(_result, str):',
        '    print(_result)',
        'else:',
        '    print(json.dumps(_result))',
      ].join('\n');
    }
  } else if (returnType === 'Optional[ListNode]' || returnType === 'ListNode') {
    outputBlock = 'print(json.dumps(_from_list(_result)))';
  } else if (isTreeReturn(returnType)) {
    outputBlock = 'print(json.dumps(_from_tree(_result)))';
  } else {
    outputBlock = [
      'if isinstance(_result, bool):',
      '    print(str(_result).lower())',
      'elif _result is None:',
      '    print("null")',
      'elif isinstance(_result, str):',
      '    print(_result)',
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

async function runOnce(source, stdin) {
  const res = await fetch(`${URL}/functions/v1/run-code`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${ANON}` },
    body: JSON.stringify({ language: 'python', code: source, stdins: [stdin] }),
  });
  if (!res.ok) throw new Error(`run-code ${res.status}: ${await res.text().then(t => t.slice(0, 200))}`);
  const data = await res.json();
  const first = (data.results || [])[0];
  if (!first) throw new Error('no result');
  if (first.status && first.status !== 'success' && first.status !== 'Accepted') {
    throw new Error(`${first.status}: ${(first.output || '').slice(0, 200)}`);
  }
  return (first.output || '').trim();
}

const CHECKS = [
  ['two-sum', ['[2,7,11,15]','9'], '[0,1]'],
  ['two-sum', ['[3,3]','6'], '[0,1]'],
  ['two-sum', ['[-1,-2,-3,-4,-5]','-8'], '[2,4]'],
  ['add-two-numbers', ['[2,4,3]','[5,6,4]'], '[7,0,8]'],
  ['add-two-numbers', ['[0]','[0]'], '[0]'],
  ['add-two-numbers', ['[9,9,9,9,9,9,9]','[9,9,9,9]'], '[8,9,9,9,0,0,0,1]'],
  ['longest-substring-without-repeating-characters', ['"abcabcbb"'], '3'],
  ['longest-substring-without-repeating-characters', ['""'], '0'],
  ['longest-substring-without-repeating-characters', ['"abba"'], '2'],
  ['longest-palindromic-substring', ['"babad"'], '"bab"'],
  ['longest-palindromic-substring', ['"a"'], '"a"'],
  ['longest-palindromic-substring', ['"cbbd"'], '"bb"'],
  ['container-with-most-water', ['[1,8,6,2,5,4,8,3,7]'], '49'],
  ['container-with-most-water', ['[1,1]'], '1'],
  ['container-with-most-water', ['[4,3,2,1,4]'], '16'],
  ['three-sum', ['[-1,0,1,2,-1,-4]'], '[[-1,-1,2],[-1,0,1]]'],
  ['three-sum', ['[0,0,0,0]'], '[[0,0,0]]'],
  ['three-sum', ['[-2,0,1,1,2]'], '[[-2,0,2],[-2,1,1]]'],
  ['valid-parentheses', ['"()[]{}"'], 'true'],
  ['valid-parentheses', ['""'], 'true'],
  ['valid-parentheses', ['"([)]"'], 'false'],
  ['merge-two-sorted-lists', ['[1,2,4]','[1,3,4]'], '[1,1,2,3,4,4]'],
  ['merge-two-sorted-lists', ['[]','[0]'], '[0]'],
  ['merge-two-sorted-lists', ['[1,3,5]','[2,4,6]'], '[1,2,3,4,5,6]'],
  ['remove-nth-node-from-end-of-list', ['[1,2,3,4,5]','2'], '[1,2,3,5]'],
  ['remove-nth-node-from-end-of-list', ['[1]','1'], '[]'],
  ['remove-nth-node-from-end-of-list', ['[1,2]','1'], '[1]'],
  ['search-in-rotated-sorted-array', ['[4,5,6,7,0,1,2]','0'], '4'],
  ['search-in-rotated-sorted-array', ['[1]','0'], '-1'],
  ['search-in-rotated-sorted-array', ['[4,5,6,7,0,1,2]','3'], '-1'],
  ['valid-anagram', ['"anagram"','"nagaram"'], 'true'],
  ['valid-anagram', ['""','""'], 'true'],
  ['valid-anagram', ['"rat"','"car"'], 'false'],
  ['group-anagrams', ['["eat","tea","tan","ate","nat","bat"]'], '[["eat","tea","ate"],["tan","nat"],["bat"]]'],
  ['group-anagrams', ['[""]'], '[[""]]'],
  ['group-anagrams', ['["abc","bca","cab","xyz"]'], '[["abc","bca","cab"],["xyz"]]'],
  ['maximum-subarray', ['[-2,1,-3,4,-1,2,1,-5,4]'], '6'],
  ['maximum-subarray', ['[-1]'], '-1'],
  ['maximum-subarray', ['[5,4,-1,7,8]'], '23'],
  ['climbing-stairs', ['2'], '2'],
  ['climbing-stairs', ['1'], '1'],
  ['climbing-stairs', ['10'], '89'],
  ['best-time-to-buy-and-sell-stock', ['[7,1,5,3,6,4]'], '5'],
  ['best-time-to-buy-and-sell-stock', ['[7,6,4,3,1]'], '0'],
  ['best-time-to-buy-and-sell-stock', ['[2,4,1,7]'], '6'],
  ['single-number', ['[2,2,1]'], '1'],
  ['single-number', ['[1]'], '1'],
  ['single-number', ['[-1,-1,-2]'], '-2'],
  ['linked-list-cycle', ['[3,2,0,-4]', '1'], 'true'],
  ['linked-list-cycle', ['[1]', '-1'], 'false'],
  ['linked-list-cycle', ['[1,2]', '0'], 'true'],
  ['binary-tree-inorder-traversal', ['[1,null,2,3]'], '[1,3,2]'],
  ['binary-tree-inorder-traversal', ['[]'], '[]'],
  ['binary-tree-inorder-traversal', ['[1,2,3,4,5,6,7]'], '[4,2,5,1,6,3,7]'],
  ['symmetric-tree', ['[1,2,2,3,4,4,3]'], 'true'],
  ['symmetric-tree', ['[1]'], 'true'],
  ['symmetric-tree', ['[1,2,2,null,3,null,3]'], 'false'],
  ['validate-binary-search-tree', ['[2,1,3]'], 'true'],
  ['validate-binary-search-tree', ['[]'], 'true'],
  ['validate-binary-search-tree', ['[5,1,4,null,null,3,6]'], 'false'],
  ['number-of-islands', ['[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]'], '1'],
  ['number-of-islands', ['[["0","0"],["0","0"]]'], '0'],
  ['number-of-islands', ['[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]'], '3'],
  ['kth-largest-element-in-an-array', ['[3,2,1,5,6,4]','2'], '5'],
  ['kth-largest-element-in-an-array', ['[1]','1'], '1'],
  ['kth-largest-element-in-an-array', ['[3,2,3,1,2,4,5,5,6]','4'], '4'],
  ['course-schedule', ['2','[[1,0]]'], 'true'],
  ['course-schedule', ['1','[]'], 'true'],
  ['course-schedule', ['3','[[1,0],[2,1],[0,2]]'], 'false'],
  ['implement-trie', ['["insert","search","search","startsWith","insert","search"]', '["apple","apple","app","app","app","app"]'], '[true,false,true,true]'],
  ['implement-trie', ['["search"]','["x"]'], '[false]'],
  ['implement-trie', ['["insert","insert","startsWith","startsWith","search","search"]','["abc","abd","ab","abx","ab","abc"]'], '[true,false,false,true]'],
  ['longest-common-prefix', ['["flower","flow","flight"]'], '"fl"'],
  ['longest-common-prefix', ['[""]'], '""'],
  ['longest-common-prefix', ['["dog","racecar","car"]'], '""'],
];

const ids = [...new Set(CHECKS.map(c => c[0]))];
const { data, error } = await sb.from('PGcode_problems')
  .select('id, method_name, params, return_type, solutions')
  .in('id', ids);
if (error) { console.error(error); process.exit(1); }

const byId = new Map(data.map(r => [r.id, r]));

let pass = 0, fail = 0, err = 0;
const failures = [];
for (const [id, inputs, claim] of CHECKS) {
  const row = byId.get(id);
  if (!row) { console.log(`MISS ${id}`); err++; continue; }
  const py = typeof row.solutions?.python === 'string' ? row.solutions.python : row.solutions?.python?.code;
  if (!py) { console.log(`NO-PY ${id}`); err++; continue; }
  try {
    const harness = buildPyDriver(py, row.method_name, row.params, row.return_type);
    const stdin = inputs.join('\n') + '\n';
    const got = await runOnce(harness, stdin);
    const ok = got === claim;
    console.log(`${ok ? 'OK ' : 'NO '} ${id.padEnd(50)} inputs=${JSON.stringify(inputs).slice(0,60).padEnd(60)} claim=${claim.slice(0,30).padEnd(30)} got=${got.slice(0,30)}`);
    if (ok) pass++; else { fail++; failures.push({id, inputs, claim, got}); }
  } catch (e) {
    console.log(`ERR ${id} ${e.message.slice(0, 200)}`);
    err++;
  }
}

console.log(`\nDone. pass=${pass} fail=${fail} err=${err}`);
if (failures.length) {
  console.log('\nFAILURES:');
  for (const f of failures) console.log(`  ${f.id}  inputs=${JSON.stringify(f.inputs)}  claim=${f.claim}  got=${f.got}`);
}
