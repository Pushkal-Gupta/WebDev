// Hybrid: M = expectedRank^p * actualRank^(1-p), perf = ratingForRank(M),
// delta = K(k)*SAT*tanh((perf-old)/SAT). p=0 -> pure actual-rank (tanh), p=0.5 ->
// geometric mean (LC-like). Fit p to reconcile the low-band over-prediction with
// the mid anchors. This is the principled generalization of both prior models.
import fs from 'node:fs';
const { FIELD } = JSON.parse(fs.readFileSync(new URL('../scratchpad-accfield.json', import.meta.url)));
const PTS = JSON.parse(fs.readFileSync(new URL('../scratchpad-points.json', import.meta.url)));
const er = (R, N) => { let s = 0; for (const j of FIELD) s += 1 / (1 + 10 ** ((R - j) / 400)); return 0.5 + (N / FIELD.length) * s; };
const r4r = (rank, N) => { let lo = 0, hi = 4500; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (er(m, N) < rank) hi = m; else lo = m; } return (lo + hi) / 2; };
const bands = [[0,1500],[1500,1700],[1700,1900],[1900,2100],[2100,2400],[2400,4000]];
const ANCH = [['abcd',1732.73,4438,40113,13,17.77],['pW510',2220.90,1585,40113,16,-8.12],['pW509',2184.39,346,40000,15,36.52],['dahiya',1806.47,2476,40113,21,26.53],['murali',1783.25,2481,40113,59,29.75]];
function pred(old, rank, k, N, { SAT, a, b, p }) {
  const ER = er(old, N);
  const AR = Math.max(1, Math.min(Math.round(rank), N));
  const M = Math.max(1, Math.pow(ER, p) * Math.pow(AR, 1 - p));
  const perf = r4r(M, N);
  const kk = Math.min(Math.max(k, 0), 100);
  const f = Math.min(Math.max(a + b / (kk + 2), a), 0.6);
  return f * SAT * Math.tanh((perf - old) / SAT);
}
// cache ER per point (depends only on old,N)
let best = null;
for (const p of [0,0.08,0.12,0.16,0.20,0.25,0.30,0.40])
  for (const SAT of [180,220,260,300,340,400])
    for (const a of [0.10,0.12,0.14,0.16,0.18,0.20,0.24])
      for (const b of [0,0.4,0.8,1.4,2.2]) {
        let se = 0; for (const pt of PTS) { const e = pred(pt.old, pt.rank, pt.k, pt.N, { SAT, a, b, p }) - pt.delta; se += e*e; }
        let ap = 0; for (const [,o,rk,N,k,w] of ANCH) { const e = pred(o, rk, k, N, { SAT, a, b, p }) - w; ap += e*e; }
        const score = Math.sqrt(se/PTS.length) + 0.9 * Math.sqrt(ap/ANCH.length);
        if (!best || score < best.score) best = { score, SAT, a, b, p };
      }
const cfg = { SAT: best.SAT, a: best.a, b: best.b, p: best.p };
let se = 0, sb = 0, w5 = 0, w10 = 0;
for (const pt of PTS) { const e = pred(pt.old, pt.rank, pt.k, pt.N, cfg) - pt.delta; se += e*e; sb += e; if (Math.abs(e) <= 5) w5++; if (Math.abs(e) <= 10) w10++; }
console.log(`BLEND best: p=${cfg.p} SAT=${cfg.SAT} K=${cfg.a}+${cfg.b}/(k+2)`);
console.log(`  overall rmse ${Math.sqrt(se/PTS.length).toFixed(2)} bias ${(sb/PTS.length).toFixed(2)} w5 ${(w5/PTS.length*100).toFixed(0)}% w10 ${(w10/PTS.length*100).toFixed(0)}%`);
for (const [lo, hi] of bands) { const pts = PTS.filter(pp => pp.old >= lo && pp.old < hi); if (!pts.length) continue; let s = 0, bb = 0; for (const pp of pts) { const e = pred(pp.old, pp.rank, pp.k, pp.N, cfg) - pp.delta; s += e*e; bb += e; } console.log(`    ${lo}-${hi}: n=${String(pts.length).padStart(3)} rmse ${Math.sqrt(s/pts.length).toFixed(1)} bias ${(bb/pts.length>=0?'+':'')}${(bb/pts.length).toFixed(1)}`); }
console.log('  ANCHORS:');
for (const [n, o, rk, N, k, want] of ANCH) { const pp = pred(o, rk, k, N, cfg); console.log(`    ${n.padEnd(7)} new ${(o+pp).toFixed(0)} want ${(o+want).toFixed(0)} diff ${(pp-want>=0?'+':'')}${(pp-want).toFixed(1)}`); }
fs.writeFileSync(new URL('../scratchpad-blend.json', import.meta.url), JSON.stringify({ cfg }));
