import { createClient } from '@supabase/supabase-js';

// These are the *public* project URL and anon key — safe to ship in a browser
// bundle. The service-role key and DB password must never appear in client code.
const URL = import.meta.env.VITE_SUPABASE_URL || 'https://ykpjmvoyatcrlqyqbgfu.supabase.co';
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcGptdm95YXRjcmxxeXFiZ2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzgyNTEsImV4cCI6MjA4OTk1NDI1MX0.LgSbUHB93i5S61jp5d_0sAUWosZzDWWWv7jwoU6X-3Q';

export const supabase = createClient(URL, ANON, {
  auth: { persistSession: true, autoRefreshToken: true },
  realtime: { params: { eventsPerSecond: 20 } },
});
