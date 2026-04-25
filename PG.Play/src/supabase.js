import { createClient } from '@supabase/supabase-js';

// The Supabase URL and anon key are public values, but we still want them
// out of the bundle source. Read from env; throw loudly if missing so the
// build doesn't silently ship with no backend.
const URL  = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!URL || !ANON) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
    'Copy .env.example to .env.local and fill in your project values.'
  );
}

export const supabase = createClient(URL, ANON, {
  auth: { persistSession: true, autoRefreshToken: true },
  realtime: { params: { eventsPerSecond: 20 } },
});
