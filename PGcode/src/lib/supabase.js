import { createClient } from '@supabase/supabase-js';

// The user mentioned: authentication is already working with https://supabase.com/dashboard/project/ykpjmvoyatcrlqyqbgfu
// These values should be replaced with the actual ENV vars by the user
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ykpjmvoyatcrkqyxbgfu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
