import fs from 'fs';
const data=JSON.parse(fs.readFileSync('/tmp/slice_data.json','utf8'));
function clean(s){return (s||'').replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\n{3,}/g,'\n\n').trim();}
let buf='';
for(const p of data){
  if(p.err){buf+=`\n##### ${p.id} ERROR ${p.err}\n`;continue;}
  const tc=Array.isArray(p.test_cases)?p.test_cases:[];
  buf+=`\n\n##### ${p.id}\nmethod: ${p.method_name} | ret: ${p.return_type}\nparams: ${JSON.stringify(p.params)}\nconstraints: ${clean(p.constraints).slice(0,300)}\nDESC: ${clean(p.description).slice(0,1400)}\nTESTS (${tc.length}):\n`;
  tc.slice(0,6).forEach((t,i)=>{buf+=`  [${i}] inputs=${JSON.stringify(t.inputs)} => expected=${JSON.stringify(t.expected)}\n`;});
}
fs.writeFileSync('/tmp/slice_detail.txt',buf);
console.log('wrote',buf.length,'chars');
