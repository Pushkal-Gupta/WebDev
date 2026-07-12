import fs from 'node:fs'; import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin, compareOutput } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
for(const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data:p}=await sb.from('PGcode_problems').select('*').eq('id','n-ary-tree-level-order-traversal').single();
// user's solution WITHOUT any import (auto-import must supply deque):
const userSol=`class Solution:
    def levelOrder(self, root: 'Node') -> List[List[int]]:
        if not root: return []
        q = deque([root])
        soln = []
        while q:
            level = []
            for _ in range(len(q)):
                node = q.popleft()
                level.append(node.val)
                for c in node.children:
                    q.append(c)
            soln.append(level)
        return soln`;
const params=[{name:'root',type:'Node'}];
const w=wrapWithDriver(userSol,'python',p.method_name,params,'List[List[int]]');
let allPass=0,total=0;
for(const c of p.test_cases){total++;const r=runLocal('python',w,buildStdin(c.inputs.map(String))+'\n',{timeoutMs:6000});const out=(r?.stdout||'').replace(/\n$/,'');if(r?.ok&&compareOutput(out,c.expected))allPass++;else if(total<=2)console.log('  FAIL inputs',JSON.stringify(c.inputs),'exp',JSON.stringify(c.expected),'got',JSON.stringify(out),'err',JSON.stringify((r?.stderr||'').slice(0,80)));}
console.log(`user Node-solution (no import) vs current List[int] cases: ${allPass}/${total} pass`);
