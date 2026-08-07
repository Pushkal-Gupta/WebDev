import fs from 'node:fs';
const out=[];
// equalize-towers [1,2,3]: raise every tower to the max, sum the additions -> 3
{ const h=[1,2,3], mx=Math.max(...h); let tot=0;
  const frames=[{array:h,caption:`Each bar is a tower. To equalize, raise every tower to the tallest one (height ${mx}).`},
    {array:h,highlights:Object.fromEntries(h.map((_,i)=>[i,'high'])),chip:{label:'target height',value:mx,tone:'accent'},caption:`The tallest tower has height ${mx} — every tower must reach it.`}];
  for(let i=0;i<h.length;i++){ const add=mx-h[i]; tot+=add;
    frames.push({array:h,pointers:{[String(i)]:'i'},highlights:{...Object.fromEntries(h.map((_,j)=>[j,j<i?'done':'tree'])),[i]:'current'},chip:[{label:'add',value:add,tone:'sky'},{label:'total',value:tot,tone:'mint'}],caption:`Tower ${i} (height ${h[i]}) needs ${mx} - ${h[i]} = ${add} blocks. Total = ${tot}.`}); }
  frames.push({array:h,highlights:Object.fromEntries(h.map((_,i)=>[i,'done'])),chip:{label:'result',value:tot,tone:'mint'},caption:`Total blocks added = ${tot}.`});
  out.push({id:'equalize-towers',viz_steps:{title:'Equalize Towers',renderer:'array',frames}}); }
// divide-array-min-cost [1,2,3,12] -> 1 + two smallest of the rest = 1+2+3 = 6
{ const a=[1,2,3,12]; const rest=[...a.slice(1)].sort((x,y)=>x-y); const r=a[0]+rest[0]+rest[1];
  const frames=[
    {array:a,caption:`Split into 3 subarrays. The first subarray always starts at index 0, so its cost is nums[0] = ${a[0]}.`},
    {array:a,pointers:{'0':'fixed'},highlights:{'0':'current'},chip:{label:'nums[0]',value:a[0],tone:'accent'},caption:`nums[0] = ${a[0]} is fixed (start of subarray 1).`},
    {array:a,highlights:{'0':'done','1':'match','2':'match','3':'compared'},chip:{label:'rest sorted',value:JSON.stringify(rest),tone:'sky'},caption:`For the other two subarray-starts, pick the two smallest of the rest: ${rest[0]} and ${rest[1]}.`},
    {array:a,highlights:{'0':'done','1':'done','2':'done','3':'done'},chip:{label:'result',value:r,tone:'mint'},caption:`Minimum cost = ${a[0]} + ${rest[0]} + ${rest[1]} = ${r}.`}];
  out.push({id:'divide-an-array-into-subarrays-with-minimum-cost-i',viz_steps:{title:'Divide Array — Minimum Cost',renderer:'array',frames}}); }
// gcd-strings "ABCABC","ABC" -> gcd(6,3)=3 -> "ABC"
{ const s1='ABCABC',s2='ABC'; function g(a,b){while(b){[a,b]=[b,a%b];}return a;} const gl=g(s1.length,s2.length); const base=s1.slice(0,gl);
  const arr=s1.split('');
  const frames=[
    {array:arr,caption:`Both "${s1}" and "${s2}" are repetitions of one base string. Its length is gcd of the two lengths.`},
    {array:arr,chip:[{label:'len(str1)',value:s1.length,tone:'accent'},{label:'len(str2)',value:s2.length,tone:'sky'}],caption:`len("${s1}") = ${s1.length}, len("${s2}") = ${s2.length}.`},
    {array:arr,chip:{label:'gcd of lengths',value:gl,tone:'violet'},caption:`gcd(${s1.length}, ${s2.length}) = ${gl} — the base string has length ${gl}.`},
    {array:arr,highlights:Object.fromEntries(base.split('').map((_,i)=>[i,'current'])),chip:{label:'base',value:base,tone:'mint'},caption:`The base string is the first ${gl} characters: "${base}".`},
    {array:arr,highlights:Object.fromEntries(arr.map((_,i)=>[i,'done'])),chip:{label:'result',value:base,tone:'mint'},caption:`Answer: "${base}".`}];
  out.push({id:'gcd-strings',viz_steps:{title:'Greatest Common Divisor of Strings',renderer:'array',frames}}); }
fs.writeFileSync('/tmp/authored/out-2.json',JSON.stringify(out));
console.log('authored:',out.length); out.forEach(p=>console.log('  '+p.id+' — '+p.viz_steps.frames.length+' frames'));
