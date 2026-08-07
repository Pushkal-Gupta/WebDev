import fs from 'node:fs';
const out=[];
// absolute-difference-between-maximum-and-minimum-k-elements: [1,4,7,2] k=2 -> sorted [1,2,4,7]
{ const a=[1,2,4,7],k=2; const lo=a.slice(0,k),hi=a.slice(-k); const ls=lo.reduce((x,y)=>x+y,0),hs=hi.reduce((x,y)=>x+y,0);
  const frames=[
    {array:a,caption:`Sort the array: [${a}]. We compare the k=${k} smallest and k=${k} largest.`},
    {array:a,highlights:{'0':'low','1':'low'},chip:{label:'sum of k smallest',value:ls,tone:'sky'},caption:`The ${k} smallest are ${lo.join(', ')} — their sum is ${ls}.`},
    {array:a,highlights:{'2':'high','3':'high'},chip:[{label:'sum of k smallest',value:ls,tone:'sky'},{label:'sum of k largest',value:hs,tone:'accent'}],caption:`The ${k} largest are ${hi.join(', ')} — their sum is ${hs}.`},
    {array:a,highlights:{'0':'done','1':'done','2':'done','3':'done'},chip:{label:'result',value:Math.abs(hs-ls),tone:'mint'},caption:`Answer = |${hs} - ${ls}| = ${Math.abs(hs-ls)}.`}];
  out.push({id:'absolute-difference-between-maximum-and-minimum-k-elements',viz_steps:{title:'Absolute Difference of k Elements',renderer:'array',frames}}); }
// concatenate-array-with-reverse: [1,2,3] -> [1,2,3,3,2,1]
{ const nums=[1,2,3]; const full=nums.concat([...nums].reverse());
  const frames=[{array:full,highlights:Object.fromEntries(nums.map((_,i)=>[i,'done'])),caption:`Start with nums = [${nums}] (left half). Append its reverse to the right, element by element.`}];
  for(let i=0;i<nums.length;i++){ const hl={}; nums.forEach((_,j)=>hl[j]='done'); for(let j=0;j<=i;j++)hl[nums.length+j]=j===i?'current':'match';
    frames.push({array:full,pointers:{[String(nums.length+i)]:'rev'},highlights:hl,caption:`Append ${full[nums.length+i]} (nums read backwards). Result so far length ${nums.length+i+1}.`}); }
  frames.push({array:full,highlights:Object.fromEntries(full.map((_,i)=>[i,'done'])),chip:{label:'result',value:JSON.stringify(full),tone:'mint'},caption:`Final: [${full}].`});
  out.push({id:'concatenate-array-with-reverse',viz_steps:{title:'Concatenate Array with Reverse',renderer:'array',frames}}); }
// count-collisions-of-monkeys-on-a-polygon: 2^n - 2, n=3 -> 6
{ const n=3, p=2**n, r=p-2;
  const frames=[
    {array:[n,p,r].map(String),caption:`Each of the n=${n} monkeys moves left or right: 2^n total move-combinations.`},
    {array:[n,p,r].map(String),pointers:{'0':'n'},highlights:{'0':'current'},chip:{label:'n',value:n,tone:'accent'},caption:`n = ${n} vertices/monkeys.`},
    {array:[n,p,r].map(String),pointers:{'1':'2^n'},highlights:{'0':'done','1':'current'},chip:{label:'2^n',value:p,tone:'sky'},caption:`2^${n} = ${p} total ways the monkeys can move.`},
    {array:[n,p,r].map(String),pointers:{'2':'ans'},highlights:{'0':'done','1':'done','2':'current'},chip:{label:'2^n - 2',value:r,tone:'mint'},caption:`Subtract the 2 non-colliding ways (all clockwise / all counter-clockwise): ${p} - 2 = ${r}.`}];
  out.push({id:'count-collisions-of-monkeys-on-a-polygon',viz_steps:{title:'Monkey Collisions on a Polygon',renderer:'array',frames}}); }
// count-total-number-of-colored-cells: 2n^2-2n+1, n=2 -> 5
{ const n=2, t1=2*n*n, t2=2*n, r=t1-t2+1;
  const frames=[
    {array:[n,t1,t2,r].map(String),caption:`After n=${n} minutes the colored region is a diamond. Count = 2n^2 - 2n + 1.`},
    {array:[n,t1,t2,r].map(String),pointers:{'0':'n'},highlights:{'0':'current'},chip:{label:'n',value:n,tone:'accent'},caption:`n = ${n} minutes.`},
    {array:[n,t1,t2,r].map(String),pointers:{'1':'2n^2'},highlights:{'0':'done','1':'current'},chip:{label:'2n^2',value:t1,tone:'sky'},caption:`2 * ${n}^2 = ${t1}.`},
    {array:[n,t1,t2,r].map(String),pointers:{'2':'2n'},highlights:{'0':'done','1':'done','2':'current'},chip:{label:'2n',value:t2,tone:'violet'},caption:`2 * ${n} = ${t2} (subtract).`},
    {array:[n,t1,t2,r].map(String),pointers:{'3':'ans'},highlights:{'0':'done','1':'done','2':'done','3':'current'},chip:{label:'result',value:r,tone:'mint'},caption:`${t1} - ${t2} + 1 = ${r} colored cells.`}];
  out.push({id:'count-total-number-of-colored-cells',viz_steps:{title:'Total Number of Colored Cells',renderer:'array',frames}}); }
// distributed-candies: min(len//2, distinct), [1,1,2,2,3,3] -> 3
{ const c=[1,1,2,2,3,3]; const distinct=new Set(c).size, half=Math.floor(c.length/2), r=Math.min(distinct,half);
  const frames=[
    {array:c,caption:`Sister can eat at most half the candies: len/2 = ${half}. But only ${distinct} distinct types exist.`},
    {array:c,highlights:Object.fromEntries(c.map((_,i)=>[i,'compared'])),chip:{label:'total / 2',value:half,tone:'accent'},caption:`She may eat ${half} candies (half of ${c.length}).`},
    {array:c,highlights:{'0':'match','2':'match','4':'match'},chip:[{label:'total / 2',value:half,tone:'accent'},{label:'distinct types',value:distinct,tone:'sky'}],caption:`Distinct types: ${[...new Set(c)].join(', ')} = ${distinct}.`},
    {array:c,highlights:Object.fromEntries(c.map((_,i)=>[i,'done'])),chip:{label:'result',value:r,tone:'mint'},caption:`Max distinct she can eat = min(${half}, ${distinct}) = ${r}.`}];
  out.push({id:'distributed-candies',viz_steps:{title:'Distribute Candies',renderer:'array',frames}}); }
fs.writeFileSync('/tmp/authored/out-1.json',JSON.stringify(out));
console.log('hand-authored:',out.length); out.forEach(p=>console.log('  '+p.id+' — '+p.viz_steps.frames.length+' frames'));
