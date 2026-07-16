// With the accurate field, find the best predictor: test BOTH the tanh surrogate
// and LeetCode's real geometric-mean-seed formula against the 740 finalized-delta
// points, and report mass bias + the known anchors for each. Winner ships.
import fs from 'node:fs';
const { FIELD } = JSON.parse(fs.readFileSync(new URL('../scratchpad-accfield.json', import.meta.url)));
const PTS = JSON.parse(fs.readFileSync(new URL('../scratchpad-points.json', import.meta.url)));
const er = (R, N) => { let s = 0; for (const j of FIELD) s += 1 / (1 + 10 ** ((R - j) / 400)); return 0.5 + (N / FIELD.length) * s; };
const r4r = (rank, N) => { let lo = 0, hi = 4500; for (let i = 0; i < 64; i++) { const m = (lo + hi) / 2; if (er(m, N) < rank) hi = m; else lo = m; } return (lo + hi) / 2; };
const bands = [[0,1500],[1500,1700],[1700,1900],[1900,2100],[2100,2400],[2400,4000]];
const ANCH = [['abcd',1732.73,4438,40113,13,17.77],['pW510',2220.90,1585,40113,16,-8.12],['pW509',2184.39,346,40000,15,36.52],['dahiya',1806.47,2476,40113,21,26.53],['murali',1783.25,2481,40113,59,29.75]];

// ── Model A: tanh surrogate  delta = K(k)*SAT*tanh((perf(rank)-old)/SAT) ──
const predT = (old, rank, k, N, { SAT, a, b }) => { const kk = Math.min(Math.max(k, 0), 100); const f = Math.min(Math.max(a + b / (kk + 2), a), 0.6); const t = r4r(Math.max(1, Math.min(Math.round(rank), N)), N); return f * SAT * Math.tanh((t - old) / SAT); };
// ── Model B: LeetCode geometric-mean seed. ER=expected rank, M=sqrt(ER*AR),
//    perf=ratingForRank(M), delta=(perf-old)*factor(k) ──
const predG = (old, rank, k, N, { a, b, c }) => { const ER = er(old, N); const AR = Math.max(1, Math.min(Math.round(rank), N)); const M = Math.sqrt(ER * AR); const perf = r4r(M, N); const f = a + b / (k + c); return (perf - old) * f; };

function report(name, predFn, best) {
  let se = 0, sb = 0, w5 = 0, w10 = 0;
  for (const p of PTS) { const e = predFn(p.old, p.rank, p.k, p.N, best) - p.delta; se += e*e; sb += e; if (Math.abs(e) <= 5) w5++; if (Math.abs(e) <= 10) w10++; }
  console.log(`\n=== ${name}  ${JSON.stringify(best)} ===`);
  console.log(`  overall rmse ${Math.sqrt(se/PTS.length).toFixed(2)} bias ${(sb/PTS.length).toFixed(2)} w5 ${(w5/PTS.length*100).toFixed(0)}% w10 ${(w10/PTS.length*100).toFixed(0)}%`);
  for (const [lo, hi] of bands) { const pts = PTS.filter(p => p.old >= lo && p.old < hi); if (!pts.length) continue; let s = 0, bb = 0; for (const p of pts) { const e = predFn(p.old, p.rank, p.k, p.N, best) - p.delta; s += e*e; bb += e; } console.log(`    ${lo}-${hi}: n=${String(pts.length).padStart(3)} rmse ${Math.sqrt(s/pts.length).toFixed(1)} bias ${(bb/pts.length>=0?'+':'')}${(bb/pts.length).toFixed(1)}`); }
  let amax = 0; console.log('  anchors:');
  for (const [n, o, rk, N, k, want] of ANCH) { const p = predFn(o, rk, k, N, best); amax = Math.max(amax, Math.abs(p - want)); console.log(`    ${n.padEnd(7)} new ${(o+p).toFixed(0)} want ${(o+want).toFixed(0)} diff ${(p-want>=0?'+':'')}${(p-want).toFixed(1)}`); }
  return { rmse: Math.sqrt(se/PTS.length), bias: sb/PTS.length, amax };
}

// fit tanh (objective: overall rmse, but require anchors reasonable)
let bT = null;
for (const SAT of [140,160,180,200,220,250,280,320])
  for (const a of [0.08,0.10,0.12,0.14,0.16,0.18,0.20,0.24])
    for (const b of [0,0.3,0.5,0.8,1.2,1.8,2.5]) {
      let se = 0; for (const p of PTS) { const e = predT(p.old, p.rank, p.k, p.N, { SAT, a, b }) - p.delta; se += e*e; }
      let ap = 0; for (const [,o,rk,N,k,w] of ANCH) { const e = predT(o, rk, k, N, { SAT, a, b }) - w; ap += e*e; }
      const score = Math.sqrt(se/PTS.length) + 0.7 * Math.sqrt(ap/ANCH.length);
      if (!bT || score < bT.score) bT = { score, SAT, a, b };
    }
// fit geomean
let bG = null;
for (const a of [0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,1.0])
  for (const b of [0,0.5,1,2,3,5,8])
    for (const c of [1,2,3,5,8,12,20]) {
      let se = 0; for (const p of PTS) { const e = predG(p.old, p.rank, p.k, p.N, { a, b, c }) - p.delta; se += e*e; }
      let ap = 0; for (const [,o,rk,N,k,w] of ANCH) { const e = predG(o, rk, k, N, { a, b, c }) - w; ap += e*e; }
      const score = Math.sqrt(se/PTS.length) + 0.7 * Math.sqrt(ap/ANCH.length);
      if (!bG || score < bG.score) bG = { score, a, b, c };
    }
const rT = report('MODEL A tanh', predT, { SAT: bT.SAT, a: bT.a, b: bT.b });
const rG = report('MODEL B geomean', predG, { a: bG.a, b: bG.b, c: bG.c });
console.log(`\nWINNER: ${rT.rmse + rT.amax < rG.rmse + rG.amax ? 'tanh (A)' : 'geomean (B)'}  (by rmse+anchorMax)`);
fs.writeFileSync(new URL('../scratchpad-winner.json', import.meta.url), JSON.stringify({ tanh: { ...bT }, geo: { ...bG }, rT, rG }));
