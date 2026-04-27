// era-siege-content-manifest — returns the active balance overrides.
//
// GET /functions/v1/era-siege-content-manifest
// Returns: { version: string, overrides: object, releasedAt: string }
//
// The client merges `overrides` over its baked content/balance.js values
// so live balance tweaks land without a redeploy.
//
// Cache: 60 seconds. Tunable per how aggressively you want overrides
// to propagate. The client cache + edge cache combine to about a 90-s
// window for any single tab.
//
// Deploy:
//   supabase functions deploy era-siege-content-manifest

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, preflight } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const headers = {
    ...corsHeaders(req),
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60',
  };

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
  }

  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Active row only. There can be 0 or 1 active rows (unique partial index).
  const { data: bal, error: balErr } = await client
    .from('era_siege_balance_overrides')
    .select('version, overrides_json, created_at')
    .eq('is_active', true)
    .maybeSingle();
  if (balErr) {
    console.warn('balance overrides read failed', balErr);
  }

  const { data: ver, error: verErr } = await client
    .from('era_siege_content_versions')
    .select('version, manifest_json, released_at')
    .eq('is_active', true)
    .maybeSingle();
  if (verErr) {
    console.warn('content version read failed', verErr);
  }

  return new Response(JSON.stringify({
    version:    ver?.version    || null,
    manifest:   ver?.manifest_json || {},
    overrides:  bal?.overrides_json || {},
    releasedAt: ver?.released_at  || null,
    overridesVersion: bal?.version || null,
  }), { status: 200, headers });
});
