// De-risk the dense-field predictor: scrape a REPRESENTATIVE field of real WC510
// ratings (spread across all ranks), then run LeetCode's exact algorithm
//   E_i = 0.5 + Σ_j 1/(1+10^((R_i-R_j)/400));  seed = √(E_i·rank);
//   perf = rating whose expected rank = seed;  delta = (perf - R_i)/2
// against the 648 real WC510 deltas (scratchpad-wc510.json). If this nails them,
// the dense-field approach is proven and worth productionizing.
//   node scripts/validate-exact-formula.mjs
import fs from 'node:fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SLUG = 'weekly-contest-510';
const test = JSON.parse(fs.readFileSync(new URL('../scratchpad-wc510.json', import.meta.url), 'utf8'));

// ── scrape a representative field via Jina (mirrors the proven edge-fn logic) ──
for (const l of fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const JINA_KEY = process.env.JINA_KEY || process.env.VITE_JINA_KEY || '';
function extractRanking(s) {
  const t = s.trim();
  try {
    const j = JSON.parse(t);
    if (j && Array.isArray(j.total_rank)) return j;
    if (j?.data?.text) { const inner = JSON.parse(j.data.text); if (Array.isArray(inner.total_rank)) return inner; }
  } catch { /* fall through */ }
  const i = t.indexOf('{"time"');
  if (i >= 0) { try { return JSON.parse(t.slice(i)); } catch { /* noop */ } }
  return null;
}
async function fetchPage(page) {
  const target = `https://leetcode.com/contest/api/ranking/${SLUG}/?pagination=${page}&region=global`;
  for (let a = 0; a < 3; a++) {
    try {
      const headers = { 'X-Return-Format': 'text', Accept: 'text/plain, application/json' };
      if (JINA_KEY) headers.Authorization = `Bearer ${JINA_KEY}`;
      let r = await fetch(`https://r.jina.ai/${target}`, { headers });
      let text = await r.text();
      if (r.status === 402 || text.includes('InsufficientBalance')) { r = await fetch(`https://r.jina.ai/${target}`, { headers: { 'X-Return-Format': 'text' } }); text = await r.text(); }
      const payload = extractRanking(text);
      if (payload) return { rows: Array.isArray(payload.total_rank) ? payload.total_rank : [], userNum: Number(payload.user_num || 0) };
      await sleep(600 * (a + 1));
    } catch { await sleep(600 * (a + 1)); }
  }
  return { rows: [], userNum: 0 };
}

// The ranking API gives usernames per rank but NOT ratings — so sample usernames
// spread across ALL ranks, then GraphQL each user's current rating to build a
// representative field rating distribution.
const GQLR = `query h($u:String!){userContestRankingHistory(username:$u){attended rating contest{titleSlug}}}`;
// PRE-WC510 rating for a field participant: the rating going INTO WC510. Unrated /
// first-timers seed at 1500 (LeetCode's default) — INCLUDING them is essential or
// the field skews high. Returns 1500 when the user has no prior rating.
async function preRating(user) {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch('https://leetcode.com/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' }, body: JSON.stringify({ query: GQLR, variables: { u: user } }) });
      if (!r.ok) { await sleep(400 * (a + 1)); continue; }
      const j = await r.json(); const h = j?.data?.userContestRankingHistory;
      if (!Array.isArray(h)) return 1500;
      let prev = 1500;
      for (const e of h) {
        if (e?.contest?.titleSlug === SLUG) return prev;
        if (e.attended && e.rating != null) prev = e.rating;
        else if (e.rating != null) prev = e.rating;
      }
      return prev;
    } catch { await sleep(400 * (a + 1)); }
  }
  return 1500;
}

const fieldCacheUrl = new URL('../scratchpad-wc510-field.json', import.meta.url);
let field, fieldSize;
if (fs.existsSync(fieldCacheUrl)) {
  ({ field, fieldSize } = JSON.parse(fs.readFileSync(fieldCacheUrl, 'utf8')));
  console.log(`loaded cached field: ${field.length} ratings, fieldSize ${fieldSize}`);
} else {
  console.log('sampling usernames spread across ALL ranks, then fetching their ratings...');
  fieldSize = 40113;
  const first = await fetchPage(1); if (first.userNum) fieldSize = first.userNum;
  const totalPages = Math.ceil(fieldSize / 25);
  const step = Math.max(1, Math.floor(totalPages / 64)); // ~64 pages spread across the field
  const slugs = [];
  for (let p = 1; p <= totalPages; p += step) {
    const { rows } = await fetchPage(p);
    for (const r of rows) if (r.user_slug) slugs.push(r.user_slug);
    if (((p - 1) / step) % 10 === 0) console.log(`  ranking page ${p}/${totalPages}, ${slugs.length} usernames`);
    await sleep(200);
  }
  const uniq = [...new Set(slugs)];
  console.log(`got ${uniq.length} spread usernames; fetching ratings...`);
  field = [];
  const CONC = 8;
  for (let i = 0; i < uniq.length; i += CONC) {
    const rs = await Promise.all(uniq.slice(i, i + CONC).map(preRating));
    for (const rt of rs) if (rt > 0) field.push(rt); // preRating returns 1500 for unrated (included on purpose)
    if ((i / CONC) % 10 === 0) console.log(`  ${i}/${uniq.length}, ${field.length} ratings`);
    await sleep(140);
  }
  fs.writeFileSync(fieldCacheUrl, JSON.stringify({ field, fieldSize }));
  console.log(`cached ${field.length} field ratings (fieldSize ${fieldSize}) -> scratchpad-wc510-field.json`);
}

// scale factor: the sampled field represents the whole field
const scale = fieldSize / field.length;
function expectedRank(R) { let s = 0.5; for (const rj of field) s += 1 / (1 + Math.pow(10, (R - rj) / 400)); return s * scale; }
function ratingForRank(rank) { let lo = 0, hi = 4000; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (expectedRank(m) < rank) hi = m; else lo = m; } return (lo + hi) / 2; }
function exactDelta(old, rank) { const E = expectedRank(old); const seed = Math.sqrt(E * Math.max(1, rank)); const perf = ratingForRank(seed); return (perf - old) / 2; }

const bands = [[0,1500],[1500,1700],[1700,1900],[1900,2100],[2100,2400],[2400,4000]];
let se = 0, sb = 0, n = 0, w5 = 0, w10 = 0, w20 = 0; const bb = {};
for (const p of test) {
  const d = exactDelta(p.old, p.rank); const e = d - p.delta;
  se += e * e; sb += e; n++; if (Math.abs(e) <= 5) w5++; if (Math.abs(e) <= 10) w10++; if (Math.abs(e) <= 20) w20++;
  const b = bands.findIndex(([l, h]) => p.old >= l && p.old < h); bb[b] = bb[b] || { sb: 0, n: 0 }; bb[b].sb += e; bb[b].n++;
}
console.log(`\n=== EXACT LeetCode formula on ${n} real WC510 deltas ===`);
console.log(`rmse ${Math.sqrt(se / n).toFixed(1)}  bias ${(sb / n).toFixed(1)}  within5 ${(w5/n*100).toFixed(0)}%  within10 ${(w10/n*100).toFixed(0)}%  within20 ${(w20/n*100).toFixed(0)}%`);
for (let i = 0; i < bands.length; i++) if (bb[i]) console.log(`  ${bands[i].join('-')}  n=${bb[i].n}  bias ${(bb[i].sb / bb[i].n).toFixed(1)}`);
// spot check the extreme overperformers
console.log('\nspot-check overperformers:');
for (const p of test.filter((x) => x.delta > 200).slice(0, 6)) console.log(`  old ${Math.round(p.old)} rank ${p.rank}: REAL ${Math.round(p.delta)}  EXACT ${Math.round(exactDelta(p.old, p.rank))}`);
process.exit(0);
