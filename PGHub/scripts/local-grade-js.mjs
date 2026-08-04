import { createClient } from '@supabase/supabase-js';
import vm from 'node:vm';
import fs from 'node:fs';
for (const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const js = (s) => { const p = s?.javascript; if (!p) return null; if (typeof p === 'string') return p; if (p && typeof p === 'object' && typeof p.code === 'string') return p.code; return null; };
const STRUCT = /TreeNode|ListNode|\bNode\b/;
const IDSF = process.argv.includes('--ids') ? process.argv[process.argv.indexOf('--ids')+1] : null;
const ONLY = IDSF ? new Set(JSON.parse(fs.readFileSync(IDSF,'utf8'))) : null;

function parseInput(s){ if(typeof s!=='string') return s; try{ return JSON.parse(s);}catch{} try{ return JSON.parse(s.replace(/'/g,'"')); }catch{} return s.replace(/^"|"$/g,''); }
function parseExpected(s){ if(typeof s!=='string') return s; try{ return JSON.parse(s);}catch{} return s; }

const DEEPEQ = `function __deepEq(a,b){
  if(typeof a==='boolean'||typeof b==='boolean') return a===b;
  if(typeof a==='number'&&typeof b==='number'){ if(!Number.isInteger(a)||!Number.isInteger(b)) return Math.abs(a-b)<=1e-5*Math.max(1,Math.abs(a),Math.abs(b)); return a===b; }
  if(Array.isArray(a)&&Array.isArray(b)){ if(a.length!==b.length)return false; for(let i=0;i<a.length;i++) if(!__deepEq(a[i],b[i]))return false; return true; }
  if(a&&b&&typeof a==='object'&&typeof b==='object'){ const ka=Object.keys(a),kb=Object.keys(b); if(ka.length!==kb.length)return false; for(const k of ka) if(!__deepEq(a[k],b[k]))return false; return true; }
  return a===b;
}`;

function gradeProblem(code, method, cases, isStr){
  const casesJson = JSON.stringify(cases);
  const harness = `${DEEPEQ}
${code}
;(function(){
  const __fn = (typeof ${method}==='function') ? ${method} : (typeof module!=='undefined'&&module.exports&&typeof module.exports==='function'?module.exports:null);
  const __cases = ${casesJson};
  const __res = {pass:0,fail:0,error:0,skip:0,fails:[]};
  if(!__fn){ __res.skip=1; __res.reason='no-fn'; __OUT__=__res; return; }
  for(let __i=0;__i<__cases.length;__i++){
    try{
      const __a = __cases[__i].args.map(x=>Array.isArray(x)?JSON.parse(JSON.stringify(x)):x);
      let __o = __fn.apply(null,__a);
      if(__o===undefined){ for(const __x of __a){ if(Array.isArray(__x)){__o=__x;break;} } }
      const __exp = __cases[__i].expected;
      let __ok;
      if(${isStr?'true':'false'}) __ok = String(__o)===String(__exp);
      else __ok = __deepEq(__o,__exp);
      if(!__ok && Array.isArray(__o) && Array.isArray(__exp)){
        const sa=[...__o].map(x=>JSON.stringify(x)).sort(), sb=[...__exp].map(x=>JSON.stringify(x)).sort();
        __ok = sa.length===sb.length && sa.every((x,k)=>x===sb[k]);
      }
      if(__ok) __res.pass++;
      else { __res.fail++; if(__res.fails.length<4) __res.fails.push({i:__i,got:String(JSON.stringify(__o)).slice(0,45),want:String(JSON.stringify(__exp)).slice(0,45)}); }
    }catch(e){ __res.error++; if(__res.fails.length<4) __res.fails.push({i:__i,err:String(e&&e.message||e).slice(0,55)}); }
  }
  __OUT__=__res;
})();`;
  const sandbox = { __OUT__: null, module: { exports: {} }, require: ()=>({}), console: { log(){}, error(){} } };
  try { vm.runInNewContext(harness, sandbox, { timeout: 5000 }); }
  catch(e){ return { pass:0, fail:0, error:cases.length, skip:0, fails:[{err:'vm:'+String(e&&e.message||e).slice(0,50)}], vmfail:true }; }
  return sandbox.__OUT__ || { pass:0,fail:0,error:cases.length,skip:0,fails:[{err:'no-output'}] };
}

const summary = { total:0, noJs:0, noTests:0, allPass:0, someFail:0, structural:0, vmfail:0 };
const problemFails = [];
let scanned = 0;
for (let from=0;;from+=300){
  let data, error;
  for (let a=0;a<4;a++){ ({data,error} = await sb.from('PGcode_problems').select('id,name,method_name,params,return_type,solutions,test_cases').order('id').range(from,from+299)); if(!error) break; }
  if (error){ console.error('ERR',error.message); break; }
  for (const r of data){
    if (ONLY && !ONLY.has(r.id)) continue;
    scanned++; summary.total++;
    const code = js(r.solutions);
    const tcs = Array.isArray(r.test_cases) ? r.test_cases.filter(t=>Array.isArray(t?.inputs)) : [];
    if (!code || !r.method_name){ summary.noJs++; continue; }
    if (!tcs.length){ summary.noTests++; continue; }
    const ptypes = (r.params||[]).map(p=>p.type).join(',');
    if (STRUCT.test(ptypes) || STRUCT.test(r.return_type||'')){ summary.structural++; continue; }
    const rt = (r.return_type||'').trim();
    const isStr = rt==='str' || rt==='string';
    const cases = tcs.map(t=>({ args: t.inputs.map(parseInput), expected: isStr ? (typeof t.expected==='string'?t.expected:String(t.expected)) : parseExpected(typeof t.expected==='string'?t.expected:JSON.stringify(t.expected)) }));
    const g = gradeProblem(code, r.method_name, cases, isStr);
    if (g.skip){ summary.structural++; continue; }
    if (g.vmfail) summary.vmfail++;
    const nbad = (g.fail||0)+(g.error||0);
    if (nbad===0 && (g.pass||0)>0){ summary.allPass++; }
    else { summary.someFail++; problemFails.push({ id:r.id, name:r.name, pass:g.pass||0, fail:g.fail||0, error:g.error||0, ntests:tcs.length, samples:g.fails }); }
  }
  process.stderr.write(`\rscanned ${scanned} | allPass ${summary.allPass} someFail ${summary.someFail} noJs ${summary.noJs} struct ${summary.structural}`);
  if (data.length<300) break;
}
fs.writeFileSync('/tmp/grade-js-report.json', JSON.stringify({ summary, problemFails }, null, 0));
console.error('\n\n=== JS LOCAL GRADE REPORT ===');
console.error(JSON.stringify(summary, null, 2));
console.error('problems with failing JS cases:', problemFails.length, '-> /tmp/grade-js-report.json');
