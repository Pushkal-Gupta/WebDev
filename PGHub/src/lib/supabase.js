import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surfaces a clear console error instead of silent auth failures when the
  // build was produced without the env vars.
  console.error('Supabase env vars missing — auth and data will not work. Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.');
}

// PKCE flow returns the OAuth result as a `?code=` query param instead of a
// `#access_token=` hash fragment. On a HashRouter app the hash form collides
// with the route (`#/...`) and the session is never picked up — PKCE avoids
// that. detectSessionInUrl completes the code exchange on the redirect back.
// Default storageKey is kept so the session stays shared with the PG hub.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
