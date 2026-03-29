import { createClient } from '@supabase/supabase-js';

// ─── Auth Supabase — shared across all PG projects ────────────────────────────
// Used exclusively for user authentication (login / signup / session)
const AUTH_URL = 'https://ykpjmvoyatcrlqyqbgfu.supabase.co';
const AUTH_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcGptdm95YXRjcmxxeXFiZ2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzgyNTEsImV4cCI6MjA4OTk1NDI1MX0.LgSbUHB93i5S61jp5d_0sAUWosZzDWWWv7jwoU6X-3Q';
export const supabase = createClient(AUTH_URL, AUTH_KEY);

// ─── Chess Supabase — game data, rooms, stats ─────────────────────────────────
// Separate project: "Pushkal Gupta Chess" (yzrhvdyvvplimcwfiorh)
// Cross-project note: JWTs from auth Supabase are NOT valid here.
// RLS policies on these tables use `true` (open read/write with anon key).
// user_id is stored as a plain text/uuid column, enforced on the client side.
const CHESS_URL = 'https://yzrhvdyvvplimcwfiorh.supabase.co';
const CHESS_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cmh2ZHl2dnBsaW1jd2Zpb3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NzQ2MTgsImV4cCI6MjA5MDM1MDYxOH0.JbICwrXR5q0r1NwY2AemVdm2D7GIkTz-JQEQaZNL1lM';
export const supabaseChess = createClient(CHESS_URL, CHESS_KEY);
