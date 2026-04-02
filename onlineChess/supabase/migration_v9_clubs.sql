-- ============================================================
-- Migration v9: Clubs / Groups
-- Project: ykpjmvoyatcrlqyqbgfu
-- ============================================================

-- ─── 1. Clubs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clubs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  slug         text UNIQUE,                        -- url-friendly short name
  description  text,
  owner_id     uuid NOT NULL REFERENCES auth.users(id),
  is_public    boolean NOT NULL DEFAULT true,
  member_count integer NOT NULL DEFAULT 1,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clubs_public ON clubs (is_public);

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clubs_select_public" ON clubs
  FOR SELECT USING (is_public = true OR auth.uid() = owner_id);

CREATE POLICY "clubs_insert_auth" ON clubs
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "clubs_update_owner" ON clubs
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "clubs_delete_owner" ON clubs
  FOR DELETE USING (auth.uid() = owner_id);

-- ─── 2. Club members ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS club_members (
  club_id    uuid REFERENCES clubs(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL,
  username   text,
  role       text NOT NULL DEFAULT 'member',      -- 'owner'|'admin'|'member'
  joined_at  timestamptz DEFAULT now(),
  PRIMARY KEY (club_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cm_user ON club_members (user_id);

ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cm_select_all"  ON club_members FOR SELECT USING (true);
CREATE POLICY "cm_insert_own"  ON club_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cm_delete_own"  ON club_members
  FOR DELETE USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM clubs WHERE id = club_id AND owner_id = auth.uid()
  ));

-- ─── 3. Link tournaments to clubs ────────────────────────────
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES clubs(id) ON DELETE SET NULL;

-- ─── 4. Trigger: keep member_count in sync ───────────────────
CREATE OR REPLACE FUNCTION sync_club_member_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE clubs SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.club_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_cm_count ON club_members;
CREATE TRIGGER trg_cm_count
  AFTER INSERT OR DELETE ON club_members
  FOR EACH ROW EXECUTE FUNCTION sync_club_member_count();

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE clubs;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE club_members;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
