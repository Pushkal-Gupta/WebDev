import { createClient } from '@supabase/supabase-js';

// The Supabase URL and anon key are public values, read from env at build time.
const URL  = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

// The games are entirely client-side; Supabase only backs leaderboards, auth,
// and profile sync. If the env is missing (e.g. a build made without .env.local),
// we must NOT throw at module load — a top-level throw takes the whole app down to
// a blank screen. Instead build a placeholder client so the app still mounts and
// plays; every backend call rejects harmlessly and each caller's error path handles it.
export const hasSupabase = Boolean(URL && ANON);

if (!hasSupabase) {
  // eslint-disable-next-line no-console
  console.warn('PG.Play: Supabase env missing — leaderboards, sign-in and cloud sync are disabled. Games still work.');
}

export const supabase = createClient(
  URL || 'https://placeholder.invalid',
  ANON || 'placeholder-anon-key',
  {
    auth: { persistSession: hasSupabase, autoRefreshToken: hasSupabase },
    realtime: { params: { eventsPerSecond: 20 } },
  },
);
