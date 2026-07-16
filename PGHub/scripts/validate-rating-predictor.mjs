// Scale-validate the LeetCode rating predictor against REAL finalized deltas.
// Pulls ~150 WC510 participants (spread across ranks), fetches each user's
// finalized contest history from LeetCode GraphQL, and for every attended
// finalized contest builds a ground-truth point (old->new delta, rank, solved,
// attended-count). Then tests the model — including the contests-played
// off-by-one (k vs k+1) — across all points at once.
import fs from 'node:fs';

const ENV = Object.fromEntries(
  fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=')).map(l => {
      const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);
const SB_URL = ENV.VITE_SUPABASE_URL, ANON = ENV.VITE_SUPABASE_ANON_KEY;

// ── model (ported verbatim from LeetCodeAnalytics.jsx) ──────────────────────
const SAMPLE_FIELD = [
  125,174,222,267,311,354,395,436,475,514,552,589,626,662,697,733,768,803,838,873,908,943,
  978,1013,1049,1085,1122,1159,1197,1236,1276,1318,1361,1406,1453,1504,1558,1617,1681,1755,1841,1948,2095,2369];
function expectedRank(R, field, N) {
  let s = 0; for (const j of field) s += 1 / (1 + 10 ** ((R - j) / 400));
  return 0.5 + (N / field.length) * s;
}
function ratingForRank(rank, field, N) {
  let lo = 0, hi = 4000;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (expectedRank(m, field, N) < rank) hi = m; else lo = m; }
  return (lo + hi) / 2;
}
function predictDelta(rating, rank, k, N, { SAT = 172, a = 0.19, b = 0.5 } = {}) {
  const kk = Math.min(Math.max(k, 0), 100);
  const f = Math.min(Math.max(a + b / (kk + 2), a), 0.5);
  const target = ratingForRank(Math.max(1, Math.min(Math.round(rank), N)), field(N), N);
  return f * SAT * Math.tanh((target - rating) / SAT);
}
const field = () => SAMPLE_FIELD;

// Per-contest participant estimate (recent weeklies ~38-40k, biweeklies ~24k).
function estN(slug) {
  const bi = /biweekly/.test(slug);
  const m = /(\d+)/.exec(slug); const num = m ? +m[1] : 500;
  if (bi) return 22000 + Math.max(0, num - 120) * 40;      // biweekly grew ~ to 24-26k
  return 26000 + Math.max(0, num - 380) * 110;             // weekly ~ 26k@380 -> ~40k@510
}

const GQL = `query h($u:String!){userContestRankingHistory(username:$u){attended rating ranking problemsSolved totalProblems contest{titleSlug startTime}}}`;
async function history(user) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch('https://leetcode.com/graphql', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com' },
        body: JSON.stringify({ query: GQL, variables: { u: user } }),
      });
      if (!r.ok) { await sleep(400 * (attempt + 1)); continue; }
      const j = await r.json();
      return j?.data?.userContestRankingHistory || null;
    } catch { await sleep(400 * (attempt + 1)); }
  }
  return null;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// A contest is "finalized" if it started > 2 days ago (ratings settled).
const NOW = Date.now() / 1000;
const SETTLED_BEFORE = NOW - 2 * 86400;

async function usernames(n) {
  // spread across the field: sample every ~ (40113/n) ranks
  const out = [];
  const step = Math.floor(40113 / n);
  for (let rank = 5; rank < 40113 && out.length < n; rank += step) {
    const url = `${SB_URL}/rest/v1/PGcode_lc_contest_ranking?contest_slug=eq.weekly-contest-510&rank=gte.${rank}&order=rank.asc&limit=1&select=user_slug,rank`;
    const r = await fetch(url, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
    const rows = await r.json();
    if (rows?.[0]?.user_slug) out.push(rows[0].user_slug);
  }
  return [...new Set(out)];
}

(async () => {
  const N_USERS = Number(process.argv[2] || 150);
  console.log(`Sampling ${N_USERS} WC510 participants across the field...`);
  const users = await usernames(N_USERS);
  console.log(`Got ${users.length} usernames. Fetching histories...`);

  const points = [];
  let done = 0;
  for (const u of users) {
    const h = await history(u);
    done++;
    if (Array.isArray(h)) {
      // attended, finalized entries in chronological order
      let attendedBefore = 0, prevRating = null;
      for (const e of h) {
        const started = Number(e?.contest?.startTime) || 0;
        if (e.attended) {
          if (prevRating != null && started > 0 && started < SETTLED_BEFORE) {
            points.push({
              u, slug: e.contest.titleSlug, old: prevRating, neu: e.rating,
              delta: e.rating - prevRating, rank: e.ranking, k: attendedBefore,
              solved: e.problemsSolved, total: e.totalProblems, N: estN(e.contest.titleSlug),
            });
          }
          attendedBefore++;
          prevRating = e.rating;
        } else if (prevRating != null) {
          prevRating = e.rating; // carries forward
        } else {
          prevRating = e.rating;
        }
      }
    }
    if (done % 20 === 0) console.log(`  ${done}/${users.length} users, ${points.length} points`);
    await sleep(120);
  }
  // keep only the last 4 finalized contests per user (recent field sizes ~ stable)
  const recent = points.filter(p => {
    const m = /(\d+)/.exec(p.slug); return m && +m[1] >= 480;
  });
  console.log(`\nCollected ${points.length} finalized points (${recent.length} from contests >=480).`);
  fs.writeFileSync(new URL('../scratchpad-points.json', import.meta.url), JSON.stringify(recent));

  // ── off-by-one test + constant sweep ──
  function evalCfg(cfg, koff) {
    let se = 0, sb = 0, n = 0, within3 = 0, within5 = 0;
    for (const p of recent) {
      const pred = predictDelta(p.old, p.rank, p.k + koff, p.N, cfg);
      const err = pred - p.delta; se += err * err; sb += err; n++;
      if (Math.abs(err) <= 3) within3++; if (Math.abs(err) <= 5) within5++;
    }
    return { rmse: Math.sqrt(se / n), bias: sb / n, within3: within3 / n, within5: within5 / n, n };
  }
  const base = { SAT: 172, a: 0.19, b: 0.5 };
  console.log('\n=== CURRENT model (SAT=172, K=0.19+0.5/(k+2)) ===');
  for (const koff of [0, 1]) {
    const r = evalCfg(base, koff);
    console.log(`  k+${koff}: rmse ${r.rmse.toFixed(2)}  bias ${r.bias >= 0 ? '+' : ''}${r.bias.toFixed(2)}  within3 ${(r.within3 * 100).toFixed(0)}%  within5 ${(r.within5 * 100).toFixed(0)}%  (n=${r.n})`);
  }
  // grid search best cfg over the LARGE set
  let best = null;
  for (const SAT of [150,155,160,165,170,172,175,180,185,190,200,220,250,280,320,400]) {
    for (const a of [0.10,0.12,0.14,0.16,0.18,0.19,0.20,0.22,0.24]) {
      for (const b of [0,0.2,0.4,0.5,0.6,0.8,1.0]) {
        for (const koff of [0,1]) {
          const r = evalCfg({ SAT, a, b }, koff);
          if (!best || r.rmse < best.rmse) best = { ...r, SAT, a, b, koff };
        }
      }
    }
  }
  console.log(`\n=== BEST fit over ${recent.length} real points ===`);
  console.log(`  SAT=${best.SAT}  K=${best.a}+${best.b}/(k+2)  k-offset=+${best.koff}`);
  console.log(`  rmse ${best.rmse.toFixed(2)}  bias ${best.bias.toFixed(2)}  within3 ${(best.within3*100).toFixed(0)}%  within5 ${(best.within5*100).toFixed(0)}%`);

  // error by rating band for the best cfg
  console.log('\n=== residual by rating band (best cfg) ===');
  const bands = [[0,1500],[1500,1700],[1700,1900],[1900,2100],[2100,2400],[2400,4000]];
  for (const [lo, hi] of bands) {
    const pts = recent.filter(p => p.old >= lo && p.old < hi);
    if (!pts.length) continue;
    let se = 0, sb = 0;
    for (const p of pts) { const e = predictDelta(p.old, p.rank, p.k + best.koff, p.N, best) - p.delta; se += e*e; sb += e; }
    console.log(`  ${lo}-${hi}: n=${String(pts.length).padStart(3)}  rmse ${Math.sqrt(se/pts.length).toFixed(2)}  bias ${(sb/pts.length>=0?'+':'')}${(sb/pts.length).toFixed(2)}`);
  }
})();
