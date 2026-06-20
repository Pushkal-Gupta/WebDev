-- Add per-user appearance + preferred-language settings to PGcode_profiles.
-- theme_preset: one of 'dark', 'light', 'midnight', 'solarized', 'dracula'
-- preferred_lang: one of 'python', 'javascript', 'java', 'cpp'
-- Run once in the Supabase SQL editor.

ALTER TABLE public."PGcode_profiles"
  ADD COLUMN IF NOT EXISTS theme_preset TEXT DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS preferred_lang TEXT DEFAULT 'python';

-- Backfill nulls in case the columns existed without defaults
UPDATE public."PGcode_profiles"
  SET theme_preset = COALESCE(theme_preset, 'dark'),
      preferred_lang = COALESCE(preferred_lang, 'python');
