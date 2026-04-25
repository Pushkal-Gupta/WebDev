// leaderboard — public top-N read for a given game.
//
// GET /functions/v1/leaderboard?game_id=slither&limit=10
// Returns: { rows: [{ display_name, color, best, last_played }] }
//
// Anonymous-readable. We cache for 15 seconds at the edge — leaderboards
// don't need second-level freshness.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, preflight } from '../_shared/cors.ts';
import { isKnownGame } from '../_shared/scoreRules.ts';

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
  const gameId = url.searchParams.get('game_id') || '';
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') || '10')));

  if (!gameId || !isKnownGame(gameId)) {
    return new Response(JSON.stringify({ error: 'unknown_game' }), { status: 422, headers });
  }

  // Read with the anon key — the leaderboard view is publicly selectable.
  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await client
    .from('pgplay_leaderboard')
    .select('display_name, color, best, last_played')
    .eq('game_id', gameId)
    .order('best', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('leaderboard read failed', error);
    return new Response(JSON.stringify({ error: 'read_failed' }), { status: 500, headers });
  }

  return new Response(JSON.stringify({ rows: data || [] }), { status: 200, headers });
});
