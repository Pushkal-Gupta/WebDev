// era-siege-daily-seed — returns today's daily-challenge seed.
//
// GET /functions/v1/era-siege-daily-seed
// Returns: { date: 'YYYY-MM-DD', seed: number, modifier: object }
//
// Strategy:
//   1. If a row exists for today's UTC date, return it as-is.
//   2. Otherwise compute a deterministic seed from the date string
//      (FNV-1a 32-bit) so every client sees the same value even before
//      the row is materialised.
//
// Cache: 5 minutes. UTC roll-over still hits within 5 minutes which is
// fine — the seed is deterministic regardless of who computes it.
//
// Deploy:
//   supabase functions deploy era-siege-daily-seed

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, preflight } from '../_shared/cors.ts';

function todayUtcDate(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function fallbackSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const headers = {
    ...corsHeaders(req),
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300',
  };

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
  }

  const date = todayUtcDate();
  let seed: number;
  let modifier = {};

  try {
    const client = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await client
      .from('era_siege_daily_challenge')
      .select('seed, modifier_json')
      .eq('challenge_date', date)
      .maybeSingle();
    if (error) {
      console.warn('daily-seed read failed, falling back to deterministic seed', error);
    }
    if (data && data.seed != null) {
      seed = Number(data.seed) >>> 0;
      modifier = data.modifier_json || {};
    } else {
      seed = fallbackSeed(date);
    }
  } catch (err) {
    console.warn('daily-seed db unreachable, falling back', err);
    seed = fallbackSeed(date);
  }

  return new Response(JSON.stringify({ date, seed, modifier }), { status: 200, headers });
});
