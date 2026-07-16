// Re-derive the accurate field from the saved (rank,rating) pairs, correctly.
// rating DECREASES with rank; field (ascending) quantile q maps to rating at
// rank (1-q)*N. Isotonic-smooth the noisy rank->rating curve first.
import fs from 'node:fs';
const { pairs, N_REAL } = JSON.parse(fs.readFileSync(new URL('../scratchpad-accfield.json', import.meta.url)));
pairs.sort((a, b) => a[0] - b[0]); // by rank asc

// Pool-adjacent-violators isotonic regression: rating must be NON-INCREASING in
// rank. Produces a clean monotone rank->rating curve from the noisy samples.
const xs = pairs.map(p => p[0]), ys = pairs.map(p => p[1]);
const val = ys.slice(), wt = ys.map(() => 1);
const idx = [];
for (let i = 0; i < val.length; i++) {
  idx.push(i);
  while (idx.length > 1) {
    const a = idx[idx.length - 2], b = idx[idx.length - 1];
    if (val[a] >= val[b]) break; // non-increasing OK
    const nv = (val[a] * wt[a] + val[b] * wt[b]) / (wt[a] + wt[b]);
    val[a] = nv; wt[a] += wt[b]; idx.pop();
  }
}
// expand pooled blocks back to a per-sample monotone curve
const mono = new Array(val.length);
let cur = 0;
for (let b = 0; b < idx.length; b++) {
  const start = idx[b], end = (b + 1 < idx.length) ? idx[b + 1] : val.length;
  for (let i = start; i < end; i++) mono[i] = val[start];
}
// curve: rankAt xs[i] -> mono[i] (non-increasing)
function ratingAtRank(r) {
  if (r <= xs[0]) return mono[0];
  if (r >= xs.at(-1)) return mono.at(-1);
  let i = 0; while (i < xs.length - 1 && xs[i + 1] < r) i++;
  const t = (r - xs[i]) / (xs[i + 1] - xs[i]);
  return mono[i] + (mono[i + 1] - mono[i]) * t;
}
const M = 256, FIELD = [];
for (let i = 0; i < M; i++) { const q = (i + 0.5) / M; FIELD.push(Math.round(ratingAtRank((1 - q) * N_REAL))); }
// guarantee ascending
for (let i = 1; i < FIELD.length; i++) if (FIELD[i] < FIELD[i - 1]) FIELD[i] = FIELD[i - 1];

const er = (R, N) => { let s = 0; for (const j of FIELD) s += 1 / (1 + 10 ** ((R - j) / 400)); return 0.5 + (N / FIELD.length) * s; };
const r4r = (rank, N) => { let lo = 0, hi = 4500; for (let i = 0; i < 64; i++) { const m = (lo + hi) / 2; if (er(m, N) < rank) hi = m; else lo = m; } return (lo + hi) / 2; };
console.log(`pairs ${pairs.length}  Field(256): min ${FIELD[0]} p10 ${FIELD[25]} p25 ${FIELD[64]} median ${FIELD[128]} p75 ${FIELD[192]} p90 ${FIELD[230]} p99 ${FIELD[253]} max ${FIELD.at(-1)}`);
console.log('SANITY perf() vs known-good targets:');
console.log(`  perf(346/40000)   = ${r4r(346, 40000).toFixed(0)}  (pushkal W509 want ~2560)`);
console.log(`  perf(1585/40113)  = ${r4r(1585, 40113).toFixed(0)}  (pushkal W510 want ~2130)`);
console.log(`  perf(2476/40113)  = ${r4r(2476, 40113).toFixed(0)}  (dahiya want ~1990)`);
console.log(`  perf(4438/40113)  = ${r4r(4438, 40113).toFixed(0)}  (abcd want ~1812)`);
console.log(`  perf(20000/40000) = ${r4r(20000, 40000).toFixed(0)}  (median finish want ~${FIELD[128]})`);
fs.writeFileSync(new URL('../scratchpad-accfield.json', import.meta.url), JSON.stringify({ FIELD, pairs, N_REAL }));
console.log('\nFIELD =', JSON.stringify(FIELD));
