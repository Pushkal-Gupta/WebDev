// Build the field as the WEIGHTED RATING DISTRIBUTION (not a rank->rating curve).
// Each sampled participant's rating is weighted by the rank interval it stands
// for (dense-sampled tail -> small weights, sparse body -> big weights), so the
// population rating distribution is reconstructed correctly and single-contest
// rank noise (a 1414 who fluked rank 1) doesn't distort it.
import fs from 'node:fs';
const { pairs, N_REAL } = JSON.parse(fs.readFileSync(new URL('../scratchpad-accfield.json', import.meta.url)));
pairs.sort((a, b) => a[0] - b[0]);
// weight_i = span of ranks this sample represents
const W = [];
for (let i = 0; i < pairs.length; i++) {
  const rank = pairs[i][0];
  const nextRank = i + 1 < pairs.length ? pairs[i + 1][0] : N_REAL;
  const prevMid = i > 0 ? (pairs[i - 1][0] + rank) / 2 : 0;
  const nextMid = (rank + nextRank) / 2;
  W.push([pairs[i][1], Math.max(1, nextMid - prevMid)]); // [rating, weight]
}
// weighted quantiles of rating
W.sort((a, b) => a[0] - b[0]);
const total = W.reduce((s, x) => s + x[1], 0);
function wq(q) {
  const target = q * total; let acc = 0;
  for (let i = 0; i < W.length; i++) { acc += W[i][1]; if (acc >= target) return W[i][0]; }
  return W.at(-1)[0];
}
const M = 256, FIELD = [];
for (let i = 0; i < M; i++) FIELD.push(Math.round(wq((i + 0.5) / M)));
for (let i = 1; i < FIELD.length; i++) if (FIELD[i] < FIELD[i - 1]) FIELD[i] = FIELD[i - 1];

const er = (R, N) => { let s = 0; for (const j of FIELD) s += 1 / (1 + 10 ** ((R - j) / 400)); return 0.5 + (N / FIELD.length) * s; };
const r4r = (rank, N) => { let lo = 0, hi = 4500; for (let i = 0; i < 64; i++) { const m = (lo + hi) / 2; if (er(m, N) < rank) hi = m; else lo = m; } return (lo + hi) / 2; };
console.log(`Field(256): min ${FIELD[0]} p10 ${FIELD[25]} p25 ${FIELD[64]} median ${FIELD[128]} p75 ${FIELD[192]} p90 ${FIELD[230]} p97 ${FIELD[248]} p99 ${FIELD[253]} max ${FIELD.at(-1)}`);
console.log('perf() checks (independent of any old field):');
console.log(`  perf(346/40000)  = ${r4r(346, 40000).toFixed(0)}`);
console.log(`  perf(1585/40113) = ${r4r(1585, 40113).toFixed(0)}`);
console.log(`  perf(2476/40113) = ${r4r(2476, 40113).toFixed(0)}`);
console.log(`  perf(4438/40113) = ${r4r(4438, 40113).toFixed(0)}`);
console.log(`  perf(20000/40k)  = ${r4r(20000, 40000).toFixed(0)}  (median finish ~ field median ${FIELD[128]})`);
fs.writeFileSync(new URL('../scratchpad-accfield.json', import.meta.url), JSON.stringify({ FIELD, pairs, N_REAL }));
console.log('\nFIELD =', JSON.stringify(FIELD));
