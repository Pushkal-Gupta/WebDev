// Functional smoke test for the PGBattle match flow — runs the create→join→configure→
// start→solve→finish sequence N times and asserts both players would see the SAME
// questions. Uses the service role (tests columns + flow logic, not RLS).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// a real user id to satisfy the host_id FK
const { data: prof } = await sb.from('PGcode_profiles').select('user_id').limit(2);
const hostId = prof?.[0]?.user_id, guestId = prof?.[1]?.user_id || prof?.[0]?.user_id;
if (!hostId) { console.log('no profiles to use as host'); process.exit(1); }

async function pickProblems(difficulty, n) {
  let q = sb.from('PGcode_problems').select('id,method_name,test_cases').not('method_name', 'is', null).limit(600);
  if (difficulty && difficulty !== 'Any') q = q.eq('difficulty', difficulty);
  const { data } = await q;
  const pool = (data || []).filter((p) => Array.isArray(p.test_cases) && p.test_cases.length >= 3);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, n).map((p) => p.id);
}

const genCode = () => 'T' + Math.random().toString(36).slice(2, 7).toUpperCase();
let pass = 0;
for (let run = 1; run <= 5; run++) {
  const id = genCode();
  const numQ = [1, 2, 3, 4][run % 4];
  const errs = [];
  try {
    // host creates
    const { error: ce } = await sb.from('PGcode_versus_matches').insert({ id, status: 'waiting', difficulty: 'Any', language: 'python', host_language: 'python', num_questions: numQ, time_limit_sec: 900, host_id: hostId, host_name: 'Host' });
    if (ce) throw new Error('create: ' + ce.message);
    // guest joins + sets language
    const { error: je } = await sb.from('PGcode_versus_matches').update({ guest_id: guestId, guest_name: 'Guest', guest_language: 'cpp' }).eq('id', id);
    if (je) throw new Error('join: ' + je.message);
    // host starts — pick N problems, persist
    const ids = await pickProblems('Any', numQ);
    if (ids.length !== numQ) errs.push(`picked ${ids.length}, wanted ${numQ}`);
    const { error: se } = await sb.from('PGcode_versus_matches').update({ problem_ids: ids, problem_id: ids[0], status: 'active', started_at: new Date().toISOString() }).eq('id', id);
    if (se) throw new Error('start: ' + se.message);
    // BOTH players read the row — assert identical problem list
    const { data: asHost } = await sb.from('PGcode_versus_matches').select('problem_ids,guest_language,host_language,num_questions,status').eq('id', id).single();
    const { data: asGuest } = await sb.from('PGcode_versus_matches').select('problem_ids,guest_language').eq('id', id).single();
    const sameQ = JSON.stringify(asHost.problem_ids) === JSON.stringify(asGuest.problem_ids) && asHost.problem_ids.length === numQ;
    if (!sameQ) errs.push('players see DIFFERENT questions');
    if (asHost.host_language !== 'python' || asHost.guest_language !== 'cpp') errs.push('per-player langs not stored');
    if (asHost.status !== 'active') errs.push('status not active');
    // guest solves all → finish
    const solved = [...Array(numQ).keys()];
    await sb.from('PGcode_versus_matches').update({ guest_solved: solved, status: 'finished', winner: 'guest', winner_id: guestId, finished_at: new Date().toISOString() }).eq('id', id);
    const { data: fin } = await sb.from('PGcode_versus_matches').select('status,winner').eq('id', id).single();
    if (fin.status !== 'finished' || fin.winner !== 'guest') errs.push('finish/winner not recorded');
  } catch (e) { errs.push(e.message); }
  await sb.from('PGcode_versus_matches').delete().eq('id', id);
  if (errs.length) console.log(`run ${run} (numQ=${numQ}): FAIL — ${errs.join('; ')}`);
  else { console.log(`run ${run} (numQ=${numQ}): PASS — same questions, per-player langs, finish all OK`); pass++; }
}
console.log(`\n${pass}/5 runs passed`);
