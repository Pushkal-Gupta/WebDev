-- 44: public profile fields.
-- Extends PGcode_profiles with the columns needed for the shareable
-- /u/:username page: display_name, bio, location, personal_links (JSONB
-- array of {label, url}), a unique username for the URL slug, and
-- profile_public to let users opt out of public visibility.
--
-- Adds a public-read RLS policy so anyone (including anon) can fetch a
-- profile flagged profile_public = true. Owners can always read their own
-- row regardless of the flag.

ALTER TABLE "PGcode_profiles"
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS personal_links JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS profile_public BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_pgcode_profiles_username ON "PGcode_profiles"(username);

-- Public-read policy: anyone can read public profiles
DROP POLICY IF EXISTS "Public profiles readable by all" ON "PGcode_profiles";
CREATE POLICY "Public profiles readable by all" ON "PGcode_profiles"
  FOR SELECT USING (profile_public = true OR auth.uid() = user_id);
