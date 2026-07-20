// Build + store a contest's field rating distribution for the dense-field predictor.
// Samples usernames spread across ALL ranks (ranking API), fetches each PRE-contest
// rating via GraphQL (unrated -> 1500), upserts into PGcode_lc_contest_field.
//   node scripts/build-contest-field.mjs <contest-slug> [samplePages]
import fs from 'node:fs';
for (const l of fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const SB = process.env.VITE_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JINA_KEY = process.env.JINA_KEY || process.env.VITE_JINA_KEY || '';
const SLUG = process.argv[2];
if (!SLUG) { console.error('usage: build-contest-field.mjs <contest-slug> [samplePages]'); process.exit(1); }
const SAMPLE_PAGES = Number(process.argv[3] || 64);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractRanking(s) {
  const t = s.trim();
  try { const j = JSON.parse(t); if (Array.isArray(j.total_rank)) return j; if (j?.data?.text) { const inner = JSON.parse(j.data.text); if (Array.isArray(inner.total_rank)) return inner; } } catch { /**/ }
  const i = t.indexOf('{"time"'); if (i >= 0) { try { return JSON.parse(t.slice(i)); } catch { /**/ } }
  return null;
}
async function fetchPage(page) {
  const target = `https://leetcode.com/contest/api/ranking/${SLUG}/?pagination=${page}&region=global`;
  for (let a = 0; a < 3; a++) {
    try {
      const headers = { 'X-Return-Format': 'text', Accept: 'text/plain, application/json' };
      if (JINA_KEY) headers.Authorization = `Bearer ${JINA_KEY}`;
      let r = await fetch(`https://r.jina.ai/${target}`, { headers }); let text = await r.text();
      if (r.status === 402 || text.includes('InsufficientBalance')) { r = await fetch(`https://r.jina.ai/${target}`, { headers: { 'X-Return-Format': 'text' } }); text = await r.text(); }
      const p = extractRanking(text); if (p) return { rows: p.total_rank || [], userNum: Number(p.user_num || 0) };
      await sleep(600 * (a + 1));
    } catch { await sleep(600 * (a + 1)); }
  }
  return { rows: [], userNum: 0 };
}
const GQLR = `query h($u:String!){userContestRankingHistory(username:$u){attended rating contest{titleSlug}}}`;
async function preRating(user) {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch('https://leetcode.com/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' }, body: JSON.stringify({ query: GQLR, variables: { u: user } }) });
      if (!r.ok) { await sleep(400 * (a + 1)); continue; }
      const h = (await r.json())?.data?.userContestRankingHistory; if (!Array.isArray(h)) return 1500;
      let prev = 1500; for (const e of h) { if (e?.contest?.titleSlug === SLUG) return prev; if (e.rating != null) prev = e.rating; }
      return prev;
    } catch { await sleep(400 * (a + 1)); }
  }
  return 1500;
}

// reuse a local scratchpad cache if present (e.g. from validation)
const cacheUrl = new URL(`../scratchpad-${SLUG}-field.json`, import.meta.url);
let field, fieldSize;
if (fs.existsSync(cacheUrl)) {
  ({ field, fieldSize } = JSON.parse(fs.readFileSync(cacheUrl, 'utf8')));
  console.log(`using cached field for ${SLUG}: ${field.length} ratings`);
} else {
  const first = await fetchPage(1); fieldSize = first.userNum || 40000;
  const totalPages = Math.ceil(fieldSize / 25); const step = Math.max(1, Math.floor(totalPages / SAMPLE_PAGES));
  const slugs = [];
  for (let p = 1; p <= totalPages; p += step) { const { rows } = await fetchPage(p); for (const r of rows) if (r.user_slug) slugs.push(r.user_slug); await sleep(200); }
  const uniq = [...new Set(slugs)];
  console.log(`${SLUG}: ${uniq.length} spread usernames, fetching ratings...`);
  field = []; const CONC = 8;
  for (let i = 0; i < uniq.length; i += CONC) { const rs = await Promise.all(uniq.slice(i, i + CONC).map(preRating)); for (const rt of rs) if (rt > 0) field.push(Math.round(rt)); await sleep(140); if ((i / CONC) % 20 === 0) console.log(`  ${i}/${uniq.length}, ${field.length}`); }
  fs.writeFileSync(cacheUrl, JSON.stringify({ field, fieldSize }));
}
const res = await fetch(`${SB}/rest/v1/PGcode_lc_contest_field`, {
  method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
  body: JSON.stringify({ contest_slug: SLUG, ratings: field.map(Math.round), field_size: fieldSize, sampled: field.length }),
});
console.log(`stored ${SLUG}: ${field.length} ratings, field_size ${fieldSize} -> status ${res.status}`);
process.exit(0);
