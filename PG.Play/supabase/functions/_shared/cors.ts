// Shared CORS headers for PG.Play edge functions.
// In prod, lock origin to the deployed site; for now we allow the dev
// server and the github-pages host.

export const ALLOWED_ORIGINS = [
  'http://localhost:5180',
  'http://127.0.0.1:5180',
  'https://pushkalgupta.com',
];

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  };
}

export function preflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }
  return null;
}
