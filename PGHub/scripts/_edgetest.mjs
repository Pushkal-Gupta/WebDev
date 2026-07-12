import fs from 'node:fs'; import { execSync } from 'node:child_process'; import { createClient } from '@supabase/supabase-js';
for(const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
// Replicate the edge function's buildPythonDriver exactly:
const PY_IMPORTS=`import sys, json, math, re, bisect, heapq, random, functools, itertools, collections, string, operator
from typing import List, Optional, Dict, Tuple, Set
from collections import deque, defaultdict, Counter, OrderedDict
from functools import lru_cache, reduce
from math import inf, gcd`;
const PY_HELPERS=fs.readFileSync('supabase/functions/grade-submission/index.ts','utf8').match(/const PY_HELPERS = `([\s\S]*?)`;/)[1];
const isTreeT=t=>t==='TreeNode'||t==='Optional[TreeNode]', isListT=t=>t==='ListNode'||t==='Optional[ListNode]', isNaryT=t=>t==='Node'||t==='Optional[Node]';
function build(code,methodName,params,returnType){
  const reads=params.map(p=>{
    if(p.type==='bool')return `    args.append(input().strip() == 'true')`;
    if(p.type==='str')return `    _l = input()\n    try:\n        _v = json.loads(_l)\n        args.append(_v if isinstance(_v, str) else _l)\n    except Exception:\n        args.append(_l)`;
    if(isTreeT(p.type))return `    args.append(_to_tree(json.loads(input())))`;
    if(isListT(p.type))return `    args.append(_to_list(json.loads(input())))`;
    if(isNaryT(p.type))return `    args.append(_to_nary(json.loads(input())))`;
    return `    args.append(json.loads(input()))`;
  }).join("\n");
  const out=isTreeT(returnType)?`    print(json.dumps(_from_tree(r)))`:isListT(returnType)?`    print(json.dumps(_from_list(r)))`:isNaryT(returnType)?`    print(json.dumps(_from_nary(r)))`:`    print(_fmt(r))`;
  return `${PY_IMPORTS}\n${PY_HELPERS}\n${code}\n\ndef _fmt(v):\n    if isinstance(v, bool): return 'true' if v else 'false'\n    if v is None: return 'null'\n    if isinstance(v, (list, tuple)): return '[' + ','.join(_fmt(x) for x in v) + ']'\n    if isinstance(v, str): return v\n    return str(v)\n\nif __name__ == '__main__':\n    args = []\n${reads}\n    sol = Solution()\n    r = sol.${methodName}(*args)\n${out}\n`;
}
const norm=s=>{try{return JSON.stringify(JSON.parse(s))}catch{return (s||'').trim().replace(/\s+/g,'')}};
// test: n-ary (Node), invert-tree with STANDARD TreeNode user code, two-sum plain
const tests=[
 {id:'n-ary-tree-level-order-traversal',ptype:'Node',user:`class Solution:
    def levelOrder(self, root):
        if not root: return []
        res,q=[],deque([root])
        while q:
            lv=[]
            for _ in range(len(q)):
                n=q.popleft(); lv.append(n.val)
                for c in n.children: q.append(c)
            res.append(lv)
        return res`},
];
for(const t of tests){
  const {data:p}=await sb.from('PGcode_problems').select('*').eq('id',t.id).single();
  const params=[{name:'root',type:t.ptype}];
  const drv=build(t.user,p.method_name,params,p.return_type);
  fs.writeFileSync('/tmp/edrv.py',drv);
  let pass=0,tot=0;
  for(const c of p.test_cases){tot++;let out;try{out=execSync('python3 /tmp/edrv.py',{input:c.inputs.join('\n')+'\n',timeout:6000}).toString().replace(/\n$/,'');}catch(e){out='ERR:'+(e.stderr?.toString()||'').slice(0,80);}if(norm(out)===norm(c.expected))pass++;else if(tot<=1)console.log('  fail exp',c.expected,'got',out);}
  console.log(`${t.id} (edge-driver, Node type, no-import user code): ${pass}/${tot}`);
}
