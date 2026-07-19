// Test the rating predictor on 1,000 REAL participants of the most recent finalized
// weekly (WC510) — their actual LeetCode-finalized deltas are the ground truth that
// EntrantHub (and any predictor) is judged against. Fetches each user's history,
// extracts their WC510 point (old rating, rank, contests-played, actual delta), runs
// the CURRENT component model (SAT + tanh + field-bias correction) and reports
// rmse/bias overall + per rating band, then sweeps the bias correction for a better fit.
// Caches fetched points to scratchpad-wc510.json so re-tuning needs no re-scrape.
//   node scripts/validate-wc510-1k.mjs [maxUsers]
import fs from 'node:fs';
for (const l of fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const SB = process.env.VITE_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SLUG = 'weekly-contest-510';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── component model (keep in sync with LeetCodeAnalytics.jsx) ──
const SAMPLE = [125,174,222,267,311,354,395,436,475,514,552,589,626,662,697,733,768,803,838,873,908,943,978,1013,1049,1085,1122,1159,1197,1236,1276,1318,1361,1406,1453,1504,1558,1617,1681,1755,1841,1948,2095,2369];
const SAT = 166;
function expectedRank(R, N) { let s = 0; for (const rj of SAMPLE) s += 1 / (1 + Math.pow(10, (R - rj) / 400)); return 0.5 + (N / SAMPLE.length) * s; }
function ratingForRank(rank, N) { let lo = 0, hi = 4000; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (expectedRank(m, N) < rank) hi = m; else lo = m; } return (lo + hi) / 2; }
function damp(k) { k = Math.min(Math.max(k, 0), 100); return Math.min(Math.max(0.189 + 0.5 / (k + 2), 0.189), 0.5); }
function baseDelta(old, rank, k, N) { const tr = Math.max(1, Math.min(Math.round(rank), N)); return damp(k) * SAT * Math.tanh((ratingForRank(tr, N) - old) / SAT); }
function biasCorr(rating, CP) { if (!(rating > 0)) return 0; if (rating <= CP[0][0]) return CP[0][1]; for (let i = 1; i < CP.length; i++) { if (rating <= CP[i][0]) { const [x0, y0] = CP[i - 1], [x1, y1] = CP[i]; return y0 + ((y1 - y0) * (rating - x0)) / (x1 - x0); } } return CP[CP.length - 1][1]; }
const CURRENT_CP = [[1450,26],[1560,5],[1690,5],[1760,12],[1880,12],[1960,6],[2080,6],[2160,0],[2380,0],[2440,-3]];
const N_FIELD = 40300; // estN(weekly-contest-510)

const GQL = `query h($u:String!){userContestRankingHistory(username:$u){attended rating ranking problemsSolved totalProblems contest{titleSlug startTime}}}`;
async function history(user) {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch('https://leetcode.com/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' }, body: JSON.stringify({ query: GQL, variables: { u: user } }) });
      if (!r.ok) { await sleep(400 * (a + 1)); continue; }
      const j = await r.json(); return j?.data?.userContestRankingHistory || null;
    } catch { await sleep(400 * (a + 1)); }
  }
  return null;
}

// WC510 point for a user: old = rating BEFORE 510, delta = 510 rating - old, k = attended before 510.
function wc510Point(h) {
  if (!Array.isArray(h)) return null;
  let attendedBefore = 0, prev = null;
  for (const e of h) {
    const slug = e?.contest?.titleSlug;
    if (e.attended) {
      if (slug === SLUG && prev != null) return { old: prev, delta: e.rating - prev, rank: e.ranking, k: attendedBefore, solved: e.problemsSolved, total: e.totalProblems };
      attendedBefore++; prev = e.rating;
    } else if (e.rating != null) { prev = e.rating; }
  }
  return null;
}

const MAX = Number(process.argv[2] || 1000);
let points;
if (fs.existsSync(new URL('../scratchpad-wc510.json', import.meta.url))) {
  points = JSON.parse(fs.readFileSync(new URL('../scratchpad-wc510.json', import.meta.url), 'utf8'));
  console.log(`loaded ${points.length} cached WC510 points (delete scratchpad-wc510.json to re-scrape)`);
} else {
  const res = await fetch(`${SB}/rest/v1/PGcode_lc_contest_ranking?contest_slug=eq.${SLUG}&order=rank.asc&limit=${MAX}&select=user_slug,rank`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  const rows = await res.json();
  const users = [...new Set(rows.map((r) => r.user_slug))].slice(0, MAX);
  console.log(`fetching histories for ${users.length} WC510 participants...`);
  points = [];
  const CONC = 8;
  for (let i = 0; i < users.length; i += CONC) {
    const batch = users.slice(i, i + CONC);
    const hs = await Promise.all(batch.map((u) => history(u)));
    hs.forEach((h, j) => { const p = wc510Point(h); if (p && p.old > 0 && p.rank > 0) points.push({ u: batch[j], ...p }); });
    if ((i / CONC) % 5 === 0) console.log(`  ${Math.min(i + CONC, users.length)}/${users.length}, ${points.length} usable points`);
    await sleep(150);
  }
  fs.writeFileSync(new URL('../scratchpad-wc510.json', import.meta.url), JSON.stringify(points));
  console.log(`cached ${points.length} points -> scratchpad-wc510.json`);
}

const bands = [[0,1500],[1500,1700],[1700,1900],[1900,2100],[2100,2400],[2400,4000]];
function evalCP(CP) {
  let se = 0, sb = 0, n = 0, w5 = 0, w10 = 0; const bb = {};
  for (const p of points) {
    const d = baseDelta(p.old, p.rank, p.k, N_FIELD) + biasCorr(p.old, CP);
    const e = d - p.delta; se += e * e; sb += e; n++; if (Math.abs(e) <= 5) w5++; if (Math.abs(e) <= 10) w10++;
    const k = bands.findIndex(([l, h]) => p.old >= l && p.old < h); bb[k] = bb[k] || { sb: 0, n: 0 }; bb[k].sb += e; bb[k].n++;
  }
  return { rmse: Math.sqrt(se / n), bias: sb / n, w5: w5 / n, w10: w10 / n, n, bb };
}

console.log(`\n=== WC510 test on ${points.length} real participants ===`);
const raw = evalCP([[0,0],[4000,0]]);
console.log(`RAW model (no correction):  rmse ${raw.rmse.toFixed(2)}  bias ${raw.bias.toFixed(2)}`);
const cur = evalCP(CURRENT_CP);
console.log(`CURRENT (shipped correction): rmse ${cur.rmse.toFixed(2)}  bias ${cur.bias.toFixed(2)}  within5 ${(cur.w5*100).toFixed(0)}%  within10 ${(cur.w10*100).toFixed(0)}%`);
console.log('  per band (current):');
for (let i = 0; i < bands.length; i++) if (cur.bb[i]) console.log(`    ${bands[i].join('-')}  n=${cur.bb[i].n}  bias ${(cur.bb[i].sb / cur.bb[i].n).toFixed(2)}`);

// Re-tune: per-band target correction = current correction - band residual (drive bias->0).
const rawBands = evalCP([[0,0],[4000,0]]).bb;
const centers = [1400, 1600, 1800, 2000, 2250, 2600];
const tuned = bands.map((_, i) => [centers[i], rawBands[i] ? Math.round(-rawBands[i].sb / rawBands[i].n) : 0]);
const TUNED_CP = tuned.filter((x) => x);
console.log('\n=== RE-TUNED correction (per-band, from these 1k) ===');
console.log('  control points:', JSON.stringify(TUNED_CP));
const re = evalCP(TUNED_CP);
console.log(`  rmse ${re.rmse.toFixed(2)}  bias ${re.bias.toFixed(2)}  within5 ${(re.w5*100).toFixed(0)}%  within10 ${(re.w10*100).toFixed(0)}%`);
for (let i = 0; i < bands.length; i++) if (re.bb[i]) console.log(`    ${bands[i].join('-')}  n=${re.bb[i].n}  bias ${(re.bb[i].sb / re.bb[i].n).toFixed(2)}`);
process.exit(0);
