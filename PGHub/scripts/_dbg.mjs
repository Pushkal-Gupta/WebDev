import fs from 'fs';
const d=JSON.parse(fs.readFileSync('/tmp/slice250_data.json','utf8'));
const p=d.find(x=>x.id==='count-negative-numbers-in-a-sorted-matrix');
let bad=[];
p.test_cases.forEach((c,i)=>{ const m=JSON.parse(c.inputs[0]); const neg=m.flat().filter(v=>v<0).length; const sortedRows=m.every(r=>r.every((v,j)=>j===0||r[j-1]>=v)); let sortedCols=true; for(let col=0;col<m[0].length;col++) for(let row=1;row<m.length;row++) if(m[row-1][col]<m[row][col]) sortedCols=false; if(String(neg)!==String(c.expected)) bad.push({i,real:neg,exp:c.expected,sortedRows,sortedCols}); });
console.log('total',p.test_cases.length,'mismatches',bad.length);
bad.slice(0,12).forEach(b=>console.log(JSON.stringify(b)));
