// Versus — real-time 1v1 coding race. Match state lives in PGcode_versus_matches;
// live progress (tests passed, typing) rides Supabase Realtime broadcast so it never
// touches the DB and never carries the opponent's code.
import { supabase } from './supabase';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no ambiguous chars
export function genCode(len = 6) {
  let s = '';
  const a = new Uint32Array(len);
  (globalThis.crypto || window.crypto).getRandomValues(a);
  for (let i = 0; i < len; i++) s += CODE_ALPHABET[a[i] % CODE_ALPHABET.length];
  return s;
}

export const POWERUPS = [
  { id: 'none',    label: 'None',       icon: 'Minus',    desc: 'A fair fight — no edge.' },
  { id: 'radar',   label: 'Radar',      icon: 'Radar',    desc: "See your rival's exact test count, not just their bar." },
  { id: 'hint',    label: 'Head Start', icon: 'Lightbulb',desc: 'Reveal the first hint the moment the match begins.' },
  { id: 'freeze',  label: 'Cold Open',  icon: 'Snowflake',desc: 'Your rival starts 15 seconds after you do.' },
];

export async function createMatch({ difficulty = 'Any', language = 'python', timeLimit = 1500, powerup = 'none', numQuestions = 1, topic = null, hostId, hostName }) {
  const id = genCode();
  const { data, error } = await supabase.from('PGcode_versus_matches').insert({
    id, status: 'waiting', difficulty, language, host_language: language, time_limit_sec: timeLimit, powerup,
    num_questions: Math.max(1, Math.min(4, numQuestions)), topic,
    host_id: hostId, host_name: hostName || 'Host',
  }).select().single();
  if (error) throw error;
  return data;
}

// Guest picks their OWN language when they join — the two players can code in different langs.
export async function setGuestLanguage(code, language) {
  const { data, error } = await supabase.from('PGcode_versus_matches')
    .update({ guest_language: language }).eq('id', code).select().maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMatch(code) {
  const { data, error } = await supabase.from('PGcode_versus_matches').select('*').eq('id', code).maybeSingle();
  if (error) throw error;
  return data;
}

export async function joinMatch(code, guestId, guestName) {
  // claim the guest slot if empty (or re-take it if it's already us)
  const { data, error } = await supabase.from('PGcode_versus_matches')
    .update({ guest_id: guestId, guest_name: guestName || 'Guest' })
    .eq('id', code)
    .or(`guest_id.is.null,guest_id.eq.${guestId}`)
    .select().maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateMatch(code, patch) {
  const { data, error } = await supabase.from('PGcode_versus_matches').update(patch).eq('id', code).select().maybeSingle();
  if (error) throw error;
  return data;
}

// Pick a random gradeable problem (has method_name + >=3 test cases) of the difficulty.
export async function pickRandomProblem(difficulty) {
  const ids = await pickRandomProblems(difficulty, 1);
  return ids[0] || null;
}

// Pick N DISTINCT gradeable problems of the difficulty (for multi-question races).
export async function pickRandomProblems(difficulty, n = 1) {
  let q = supabase.from('PGcode_problems')
    .select('id, name, difficulty, method_name, test_cases')
    .not('method_name', 'is', null)
    .limit(600);
  if (difficulty && difficulty !== 'Any') q = q.eq('difficulty', difficulty);
  const { data, error } = await q;
  if (error) throw error;
  const pool = (data || []).filter((p) => Array.isArray(p.test_cases) && p.test_cases.length >= 3);
  if (!pool.length) return [];
  // shuffle (Fisher-Yates) and take n distinct
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, Math.max(1, n)).map((p) => p.id);
}

// A player's head-to-head record — finished matches they hosted or joined, split into
// wins / losses so the lobby can render a real record instead of empty space.
export async function getMyRecord(userId) {
  if (!userId) return { wins: 0, losses: 0, total: 0, recent: [] };
  const { data, error } = await supabase.from('PGcode_versus_matches')
    .select('id, difficulty, language, host_id, guest_id, host_name, guest_name, winner_id, status, finished_at')
    .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
    .eq('status', 'finished')
    .order('finished_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  const rows = data || [];
  let wins = 0, losses = 0;
  const recent = rows.map((m) => {
    const won = m.winner_id === userId;
    if (m.winner_id) { won ? wins++ : losses++; }
    const oppName = m.host_id === userId ? (m.guest_name || 'Rival') : (m.host_name || 'Host');
    return { id: m.id, won, oppName, difficulty: m.difficulty, language: m.language };
  });
  return { wins, losses, total: wins + losses, recent: recent.slice(0, 6) };
}

// One realtime channel per match: presence tells us who's in the room; broadcast carries
// progress/typing/win. Returns the channel (caller subscribes + wires handlers).
export function matchChannel(code, selfKey) {
  return supabase.channel(`versus:${code}`, {
    config: { presence: { key: selfKey || 'anon' }, broadcast: { self: false } },
  });
}
