// start-run — issued at the moment a player launches a game.
//
// Returns a run_id (uuid) the client must echo back when calling
// submit-score. Without a fresh, unconsumed run_id no score lands on the
// leaderboard. Tokens expire after 30 minutes (column default in the
// pgplay_runs table).
//
// Auth: requires a Supabase JWT (config.toml verify_jwt = true).
// Body: { game_id: string }

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, preflight } from '../_shared/cors.ts';
import { isKnownGame } from '../_shared/scoreRules.ts';

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

  let body: { game_id?: string } = {};
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'bad_json' }), { status: 400, headers }); }

  const gameId = body.game_id;
  if (!gameId || !isKnownGame(gameId)) {
    return new Response(JSON.stringify({ error: 'unknown_game' }), { status: 422, headers });
  }

  // User identity: Supabase forwards the JWT; we look up the user with the
  // anon key client and the request's auth header.
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers });
  }

  // Use the service role to insert into pgplay_runs (RLS prevents direct client writes).
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const nonce = crypto.randomUUID();
  const { data, error } = await adminClient
    .from('pgplay_runs')
    .insert({ user_id: user.id, game_id: gameId, nonce })
    .select('run_id, expires_at')
    .single();

  if (error) {
    console.error('start-run insert failed', error);
    return new Response(JSON.stringify({ error: 'insert_failed' }), { status: 500, headers });
  }

  return new Response(
    JSON.stringify({ run_id: data.run_id, expires_at: data.expires_at }),
    { status: 200, headers },
  );
});
