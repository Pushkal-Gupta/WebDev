// verify-admin — server-side admin password check.
//
// POST /functions/v1/verify-admin
// Body: { password: string }
// Returns: { ok: boolean }
//
// The expected password lives in `Deno.env.get('ADMIN_PASSWORD')`. NEVER
// hardcode it in client code. Set it once with the Supabase CLI:
//
//   supabase secrets set ADMIN_PASSWORD='<your password>'
//
// Constant-time string compare prevents timing-based password probing.
//
// Deploy:
//   supabase functions deploy verify-admin

import { corsHeaders, preflight } from '../_shared/cors.ts';

// Constant-time compare. Returns true only if both strings match in
// length AND every byte. The XOR-accumulator pattern keeps the loop
// duration independent of where the first mismatch occurs.
function constantTimeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const headers = {
    ...corsHeaders(req),
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), { status: 405, headers });
  }

  const expected = Deno.env.get('ADMIN_PASSWORD');
  if (!expected) {
    // Deliberately surface a misconfiguration so the operator notices
    // rather than silently letting every attempt through.
    return new Response(JSON.stringify({ ok: false, error: 'admin_password_not_configured' }), { status: 500, headers });
  }

  let body: { password?: unknown };
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ ok: false, error: 'bad_json' }), { status: 400, headers }); }

  const submitted = typeof body?.password === 'string' ? body.password : '';
  // Cap input length to prevent obvious abuse — the real password is
  // short, so anything past 256 chars is noise.
  if (submitted.length === 0 || submitted.length > 256) {
    return new Response(JSON.stringify({ ok: false }), { status: 200, headers });
  }

  const ok = constantTimeEqual(submitted, expected);
  return new Response(JSON.stringify({ ok }), { status: 200, headers });
});
