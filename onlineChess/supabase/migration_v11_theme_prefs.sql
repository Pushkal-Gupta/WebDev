-- ============================================================
-- Migration v11: Theme Preferences
-- Project: ykpjmvoyatcrlqyqbgfu
-- ============================================================

-- Store user's theme mode and background preference for cross-device sync
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS theme_mode text DEFAULT 'dark';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bg_theme text DEFAULT 'default';
