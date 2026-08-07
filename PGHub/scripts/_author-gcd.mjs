import fs from 'node:fs';
function euclid(a,b,title){
  const frames=[{array:[a,b],caption:`${title}: Euclidean algorithm on ${a} and ${b}. Each step replaces (a, b) with (b, a mod b) — the bars shrink toward the gcd.`}];
  let x=a,y=b,guard=0;
  while(y>0 && guard++<13){
    const r=x%y;
    frames.push({array:[x,y],pointers:{'0':'a','1':'b'},highlights:{'0':'compared','1':'current'},
      chip:{label:'a mod b',value:r,tone:'sky'},caption:`${x} mod ${y} = ${r}, so gcd(${x}, ${y}) = gcd(${y}, ${r}).`});
    x=y;y=r;
  }
  frames.push({array:[x,0],highlights:{'0':'match','1':'done'},chip:{label:'gcd',value:x,tone:'mint'},caption:`Remainder is 0 — the gcd is ${x}.`});
  return {g:x,frames};
}
const out=[];
// gcd(48,18)
{ const {frames}=euclid(48,18,'gcd'); out.push({id:'gcd',viz_steps:{title:'Greatest Common Divisor',renderer:'array',frames}}); }
// pghub-b53-gear-ratio(12,18) -> [2,3]
{ const {g,frames}=euclid(12,18,'reduceRatio'); frames.push({array:[12,18],highlights:{'0':'done','1':'done'},chip:[{label:'a/g',value:12/g,tone:'accent'},{label:'b/g',value:18/g,tone:'mint'}],caption:`Divide both by gcd ${g}: 12/${g} : 18/${g} = ${12/g} : ${18/g}.`}); out.push({id:'pghub-b53-gear-ratio',viz_steps:{title:'Reduce a Gear Ratio',renderer:'array',frames}}); }
// water-jug / water-and-jug (3,5,4)
for(const id of ['water-jug','water-and-jug']){ const {g,frames}=euclid(3,5,'canMeasureWater'); const ok=(4%g===0 && 4<=3+5);
  frames.push({array:[3,5],highlights:{'0':'done','1':'done'},chip:{label:'target',value:4,tone:'accent'},caption:`Any amount that is a multiple of gcd ${g} (and <= x+y = 8) is measurable.`});
  frames.push({array:[3,5],highlights:{'0':'done','1':'done'},chip:{label:'result',value:ok,tone:'mint'},caption:`4 mod ${g} = ${4%g} and 4 <= 8 -> ${ok ? 'measurable' : 'not measurable'}.`});
  out.push({id,viz_steps:{title:'Water and Jug Problem',renderer:'array',frames}}); }
// check-if-point-is-reachable (6,9): reachable iff gcd is a power of 2
{ const {g,frames}=euclid(6,9,'isReachable'); const pow2=(g & (g-1))===0;
  frames.push({array:[6,9],highlights:{'0':'done','1':'done'},chip:{label:'gcd',value:g,tone:'accent'},caption:`Reachable only if the gcd is a power of two.`});
  frames.push({array:[6,9],highlights:{'0':'done','1':'done'},chip:{label:'result',value:pow2,tone:'mint'},caption:`${g} in binary is ${g.toString(2)} — ${pow2?'a power of two -> reachable':'not a power of two -> not reachable'}.`});
  out.push({id:'check-if-point-is-reachable',viz_steps:{title:'Check if Point is Reachable',renderer:'array',frames}}); }
// gcd-of-odd-and-even-sums (n=4): sum_odd = n*n = 16, sum_even = n*(n+1) = 20
{ const n=4, so=n*n, se=n*(n+1); const {g,frames}=euclid(so,se,'gcdOfOddEvenSums');
  frames.unshift({array:[so,se],chip:[{label:'sum of first n odds',value:so,tone:'accent'},{label:'sum of first n evens',value:se,tone:'sky'}],caption:`For n = ${n}: sum of first n odd numbers = n^2 = ${so}; sum of first n even numbers = n(n+1) = ${se}.`});
  out.push({id:'gcd-of-odd-and-even-sums',viz_steps:{title:'GCD of Odd and Even Sums',renderer:'array',frames}}); }
fs.writeFileSync('/tmp/authored/out-0.json',JSON.stringify(out));
console.log('hand-authored GCD-family viz:',out.length);
out.forEach(p=>console.log('  '+p.id+' — '+p.viz_steps.frames.length+' frames'));
