-- ============================================================
-- Migration v3: User Profiles — Run in the AUTH Supabase project
-- Project: ykpjmvoyatcrlqyqbgfu
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id      uuid PRIMARY KEY,          -- mirrors auth.users.id
  username     text UNIQUE,               -- chosen display name
  display_name text,
  bio          text,
  country      text,                      -- ISO 3166-1 alpha-2 (e.g. 'IN', 'US')
  avatar_url   text,
  joined_at    timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read profiles
CREATE POLICY "profiles_select_all" ON user_profiles
  FOR SELECT USING (true);

-- Users can only write their own profile
CREATE POLICY "profiles_upsert_own" ON user_profiles
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
