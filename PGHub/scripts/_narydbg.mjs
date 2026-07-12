import fs from 'node:fs'; import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin, compareOutput } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
for(const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data:p}=await sb.from('PGcode_problems').select('*').eq('id','n-ary-tree-preorder-traversal').single();
const code=`class Solution:
    def preorder(self, root: 'Node') -> List[int]:
        res=[]
        def dfs(n):
            if not n: return
            res.append(n.val)
            for c in n.children: dfs(c)
        dfs(root)
        return res`;
const w=wrapWithDriver(code,'python',p.method_name,[{name:'root',type:'Node'}],p.return_type);
for(const c of p.test_cases){const r=runLocal('python',w,buildStdin(c.inputs.map(String))+'\n',{timeoutMs:6000});const out=(r?.stdout||'').replace(/\n$/,'');console.log('inputs',JSON.stringify(c.inputs),'exp',JSON.stringify(c.expected),'got',JSON.stringify(out),compareOutput(out,c.expected)?'OK':'FAIL');}
