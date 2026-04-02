import { createClient } from '@supabase/supabase-js';

// ─── Single Supabase project — auth + all chess data ─────────────────────────
// Auth project (ykpjmvoyatcrlqyqbgfu) is the shared pushkalgupta.com auth.
// All chess tables (chess_rooms, chess_games, user_ratings, etc.) now live here
// so RLS policies can reference auth.uid() for proper server-side ownership.
const AUTH_URL = 'https://ykpjmvoyatcrlqyqbgfu.supabase.co';
const AUTH_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcGptdm95YXRjcmxxeXFiZ2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzgyNTEsImV4cCI6MjA4OTk1NDI1MX0.LgSbUHB93i5S61jp5d_0sAUWosZzDWWWv7jwoU6X-3Q';
export const supabase = createClient(AUTH_URL, AUTH_KEY);

// Legacy alias — kept so any code still referencing supabaseChess doesn't break
// during the transition. Both point to the same project.
export const supabaseChess = supabase;
