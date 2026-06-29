import fs from 'fs';
const data = JSON.parse(fs.readFileSync('/tmp/slice250_data.json','utf8'));
for (const p of data) {
  if (p.skip) continue;
  console.log('\n===== '+p.id+' =====');
  console.log('method:', p.method_name, '| return:', p.return_type);
  console.log('params:', JSON.stringify(p.params));
  const desc = (p.description||'').replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\n{3,}/g,'\n\n').trim();
  console.log('DESC:', desc.slice(0,700));
  const tc = Array.isArray(p.test_cases)?p.test_cases:[];
  console.log('CASES('+tc.length+'):');
  tc.slice(0,4).forEach((c,i)=>console.log('  ['+i+'] in='+JSON.stringify(c.inputs)+' exp='+JSON.stringify(c.expected)));
  if (tc.length>4) console.log('  ...last: in='+JSON.stringify(tc[tc.length-1].inputs)+' exp='+JSON.stringify(tc[tc.length-1].expected));
}
