// Build an ACCURATE reusable rating field from real LeetCode data. The old
// SAMPLE_FIELD was hand-fit to a few high-rated anchors: mis-centered (median
// ~950 vs the real ~1520) and tail-starved, so perf(rank) was wrong for everyone
// but the top. We densely sample the true rank->rating curve of WC510 (dense at
// the TAIL where resolution matters most, sparse in the body) and reconstruct a
// 256-point quantile field: field[i] = rating at rank ((i+0.5)/256)*N. Because
// the contestant population is stable week-to-week, this field is REUSABLE across
// contests (each contest supplies its own N from the scrape table).
import fs from 'node:fs';
const ENV = Object.fromEntries(fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }));
const SB = ENV.VITE_SUPABASE_URL, ANON = ENV.VITE_SUPABASE_ANON_KEY;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function targetRanks() {
  const s = new Set();
  for (let r = 1; r <= 1500; r++) s.add(r);            // dense tail
  for (let r = 1500; r <= 6000; r += 8) s.add(r);       // upper-mid
  for (let r = 6000; r <= 40100; r += 55) s.add(r);     // body
  return [...s].sort((a, b) => a - b);
}
// Bulk-fetch user_slug for many ranks at once (rank=in.(...)).
async function slugsForRanks(ranks) {
  const out = new Map();
  for (let i = 0; i < ranks.length; i += 200) {
    const chunk = ranks.slice(i, i + 200);
    const url = `${SB}/rest/v1/PGcode_lc_contest_ranking?contest_slug=eq.weekly-contest-510&rank=in.(${chunk.join(',')})&select=user_slug,rank`;
    const r = await fetch(url, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
    const rows = await r.json();
    if (Array.isArray(rows)) for (const row of rows) out.set(row.rank, row.user_slug);
    await sleep(40);
  }
  return out;
}
async function ratingOf(user) {
  const q = `query u($u:String!){userContestRanking(username:$u){rating}}`;
  for (let a = 0; a < 3; a++) { try { const r = await fetch('https://leetcode.com/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' }, body: JSON.stringify({ query: q, variables: { u: user } }) }); if (!r.ok) { await sleep(250); continue; } const j = await r.json(); return j?.data?.userContestRanking?.rating || null; } catch { await sleep(250); } }
  return null;
}

(async () => {
  const ranks = targetRanks();
  console.log(`Target ${ranks.length} ranks. Resolving usernames...`);
  const slugMap = await slugsForRanks(ranks);
  console.log(`Resolved ${slugMap.size} usernames. Fetching ratings (parallel batches)...`);

  const entries = [...slugMap.entries()];
  const pairs = [];
  const BATCH = 12;
  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    const res = await Promise.all(batch.map(([rank, slug]) => ratingOf(slug).then(rt => [rank, rt])));
    for (const [rank, rt] of res) if (rt && rt > 0) pairs.push([rank, rt]);
    if ((i / BATCH) % 20 === 0) console.log(`  ${i}/${entries.length}, ${pairs.length} pairs`);
    await sleep(60);
  }
  pairs.sort((a, b) => a[0] - b[0]);
  // De-noise the tail: enforce weak monotonicity via a light isotonic pass on a
  // rank-sorted running max-of-window is overkill; instead smooth with a small
  // rolling median so a single mis-fetched rating doesn't spike the curve.
  const rm = [];
  for (let i = 0; i < pairs.length; i++) {
    const w = pairs.slice(Math.max(0, i - 2), Math.min(pairs.length, i + 3)).map(p => p[1]).sort((a, b) => a - b);
    rm.push([pairs[i][0], w[w[Math.floor(w.length / 2)] ? Math.floor(w.length / 2) : 0]]);
  }
  console.log(`\nGot ${pairs.length} (rank,rating) pairs. top: ${JSON.stringify(pairs.slice(0,4))} bottom: ${JSON.stringify(pairs.slice(-3))}`);

  const N_REAL = 40113;
  function ratingAtRank(r) {
    if (r <= rm[0][0]) return rm[0][1];
    if (r >= rm.at(-1)[0]) return rm.at(-1)[1];
    let i = 0; while (i < rm.length - 1 && rm[i + 1][0] < r) i++;
    const [r0, v0] = rm[i], [r1, v1] = rm[i + 1];
    return v0 + (v1 - v0) * (r - r0) / (r1 - r0);
  }
  const M = 256, FIELD = [];
  for (let i = 0; i < M; i++) FIELD.push(Math.round(ratingAtRank(((i + 0.5) / M) * N_REAL)));
  // ensure monotonic non-decreasing (quantile field)
  for (let i = 1; i < FIELD.length; i++) if (FIELD[i] < FIELD[i - 1]) FIELD[i] = FIELD[i - 1];

  const er = (R, f, N) => { let s = 0; for (const j of f) s += 1 / (1 + 10 ** ((R - j) / 400)); return 0.5 + (N / f.length) * s; };
  const r4r = (rank, f, N) => { let lo = 0, hi = 4500; for (let i = 0; i < 64; i++) { const m = (lo + hi) / 2; if (er(m, f, N) < rank) hi = m; else lo = m; } return (lo + hi) / 2; };
  console.log(`\nField(256): p1 ${FIELD[2]} p10 ${FIELD[25]} median ${FIELD[128]} p90 ${FIELD[230]} p99 ${FIELD[253]} max ${FIELD.at(-1)}`);
  console.log(`SANITY perf() vs known:`);
  console.log(`  perf(346/40000)   = ${r4r(346, FIELD, 40000).toFixed(0)}  (pushkal W509, want ~2560)`);
  console.log(`  perf(1585/40113)  = ${r4r(1585, FIELD, 40113).toFixed(0)}  (pushkal W510, want ~2130)`);
  console.log(`  perf(2476/40113)  = ${r4r(2476, FIELD, 40113).toFixed(0)}  (dahiya, want ~1990)`);
  console.log(`  perf(4438/40113)  = ${r4r(4438, FIELD, 40113).toFixed(0)}  (abcd, want ~1812)`);
  console.log(`  perf(20000/40000) = ${r4r(20000, FIELD, 40000).toFixed(0)}  (median finish, want ~median ${FIELD[128]})`);
  fs.writeFileSync(new URL('../scratchpad-accfield.json', import.meta.url), JSON.stringify({ FIELD, pairs, N_REAL }));
  console.log('\nFIELD =', JSON.stringify(FIELD));
})();
