import { createClient } from '@supabase/supabase-js';

// ─── Single Supabase project — auth + all chess data ─────────────────────────
// Auth project (ykpjmvoyatcrlqyqbgfu) is the shared pushkalgupta.com auth.
// All chess tables (chess_rooms, chess_games, user_ratings, etc.) now live here
// so RLS policies can reference auth.uid() for proper server-side ownership.
const AUTH_URL = 'https://ykpjmvoyatcrlqyqbgfu.supabase.co';
const AUTH_KEY = 'sb_publishable__qbY0vXkNpH_rLhb4GYkAA_efhWihBH';
export const supabase = createClient(AUTH_URL, AUTH_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Legacy alias — kept so any code still referencing supabaseChess doesn't break
// during the transition. Both point to the same project.
export const supabaseChess = supabase;
