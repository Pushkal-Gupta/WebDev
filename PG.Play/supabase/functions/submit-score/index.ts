// submit-score — the gate between client games and the public leaderboard.
//
// Validates: JWT, run_id (must belong to this user, not expired, not yet
// consumed), score range per game, meta sanity, rate limit. Inserts into
// pgplay_scores using the service role (RLS now blocks direct client writes).
//
// Auth: requires Supabase JWT.
// Body: { game_id: string, score: number, run_id: string, meta?: object }

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, preflight } from '../_shared/cors.ts';
import { validateScore, isKnownGame } from '../_shared/scoreRules.ts';

const RATE_LIMIT_PER_MIN = 6;

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const headers = { ...corsHeaders(req), 'Content-Type': 'application/json' };

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
  }

  const auth = req.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers });
  }

  let body: { game_id?: string; score?: number; run_id?: string; meta?: Record<string, unknown> } = {};
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'bad_json' }), { status: 400, headers }); }

  const { game_id, score, run_id, meta = {} } = body;
  if (!game_id || !isKnownGame(game_id)) {
    return new Response(JSON.stringify({ error: 'unknown_game' }), { status: 422, headers });
  }
  if (typeof score !== 'number') {
    return new Response(JSON.stringify({ error: 'bad_score' }), { status: 422, headers });
  }
  if (!run_id || typeof run_id !== 'string') {
    return new Response(JSON.stringify({ error: 'missing_run_id' }), { status: 422, headers });
  }

  const validation = validateScore(game_id, score, meta);
  if (!validation.ok) {
    return new Response(JSON.stringify({ error: 'validation_failed', reason: validation.reason }), { status: 422, headers });
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Look up the run. Must belong to this user, this game, not consumed, not expired.
  const { data: run, error: runErr } = await admin
    .from('pgplay_runs')
    .select('run_id, user_id, game_id, expires_at, consumed_at')
    .eq('run_id', run_id)
    .single();

  if (runErr || !run) {
    return new Response(JSON.stringify({ error: 'invalid_run' }), { status: 401, headers });
  }
  if (run.user_id !== user.id || run.game_id !== game_id) {
    return new Response(JSON.stringify({ error: 'run_mismatch' }), { status: 401, headers });
  }
  if (run.consumed_at) {
    return new Response(JSON.stringify({ error: 'run_already_used' }), { status: 409, headers });
  }
  if (new Date(run.expires_at).getTime() < Date.now()) {
    return new Response(JSON.stringify({ error: 'run_expired' }), { status: 410, headers });
  }

  // Rate limit: how many submits has this user made in the last minute?
  const { data: rate } = await admin
    .from('pgplay_recent_submission_count')
    .select('submissions_last_minute')
    .eq('user_id', user.id)
    .eq('game_id', game_id)
    .maybeSingle();
  if (rate && (rate.submissions_last_minute ?? 0) >= RATE_LIMIT_PER_MIN) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429, headers });
  }

  // Insert score, mark run consumed.
  const { error: insertErr } = await admin.from('pgplay_scores').insert({
    user_id: user.id,
    game_id,
    score,
    meta,
    run_id,
  });
  if (insertErr) {
    console.error('submit-score insert failed', insertErr);
    return new Response(JSON.stringify({ error: 'insert_failed' }), { status: 500, headers });
  }

  await admin
    .from('pgplay_runs')
    .update({ consumed_at: new Date().toISOString() })
    .eq('run_id', run_id);

  return new Response(JSON.stringify({ ok: true, score }), { status: 200, headers });
});
