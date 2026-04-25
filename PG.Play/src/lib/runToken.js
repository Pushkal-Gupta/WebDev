// Run-token helper: every game session opens with a server-issued run_id
// that submit-score will require to accept the eventual score. We hold one
// token per gameId in memory; it expires server-side after 30 minutes, and
// we silently re-fetch if a stale token comes back invalid.

import { supabase } from '../supabase.js';

const tokens = new Map(); // gameId → { run_id, expires_at }

export async function startRun(gameId) {
  if (!gameId) return null;
  const { data, error } = await supabase.functions.invoke('start-run', {
    body: { game_id: gameId },
  });
  if (error || !data?.run_id) {
    // Anonymous play has no JWT; that's fine — scores just stay local.
    if (error?.context?.status === 401) return null;
    console.warn('start-run failed', error);
    return null;
  }
  tokens.set(gameId, data);
  return data.run_id;
}

export function getRunId(gameId) {
  const tok = tokens.get(gameId);
  if (!tok) return null;
  if (new Date(tok.expires_at).getTime() < Date.now()) {
    tokens.delete(gameId);
    return null;
  }
  return tok.run_id;
}

export function clearRun(gameId) {
  tokens.delete(gameId);
}
