// era-siege-leaderboard — per-difficulty top-N for Era Siege.
//
// GET /functions/v1/era-siege-leaderboard?difficulty=standard&limit=10
// Returns: { rows: [{ display_name, score, era, time_sec, daily_date, created_at }] }
//
// Reads `era_siege_leaderboard` (security_invoker view), so RLS rules
// apply on read. The view itself filters out null scores and orders by
// score then created_at.
//
// Deploy:
//   supabase functions deploy era-siege-leaderboard

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, preflight } from '../_shared/cors.ts';

const VALID_DIFFICULTY = new Set(['skirmish', 'standard', 'conquest', 'daily']);

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const headers = {
    ...corsHeaders(req),
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=15',
  };

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
  }

  const url = new URL(req.url);
  const difficulty = url.searchParams.get('difficulty') || 'standard';
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') || '10')));
  const dailyDate = url.searchParams.get('daily_date'); // optional filter for the daily board

  if (!VALID_DIFFICULTY.has(difficulty)) {
    return new Response(JSON.stringify({ error: 'unknown_difficulty' }), { status: 422, headers });
  }

  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  let q = client
    .from('era_siege_leaderboard')
    .select('display_name, score, era, time_sec, daily_date, created_at')
    .eq('difficulty', difficulty)
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (dailyDate) q = q.eq('daily_date', dailyDate);

  const { data, error } = await q;
  if (error) {
    console.error('era-siege-leaderboard read failed', error);
    return new Response(JSON.stringify({ error: 'read_failed' }), { status: 500, headers });
  }

  return new Response(JSON.stringify({ rows: data || [] }), { status: 200, headers });
});
