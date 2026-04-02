-- ============================================================
-- Migration v6: Friends + Notifications  (fully idempotent — safe to re-run)
-- Project: ykpjmvoyatcrlqyqbgfu
-- ============================================================

-- ─── 1. Friendships ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS friendships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  friend_id   uuid NOT NULL,
  status      text NOT NULL DEFAULT 'pending',
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friendships_select" ON friendships;
DROP POLICY IF EXISTS "friendships_insert" ON friendships;
DROP POLICY IF EXISTS "friendships_update" ON friendships;
DROP POLICY IF EXISTS "friendships_delete" ON friendships;

CREATE POLICY "friendships_select" ON friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "friendships_insert" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "friendships_update" ON friendships
  FOR UPDATE USING (auth.uid() = friend_id);

CREATE POLICY "friendships_delete" ON friendships
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 2. Notifications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  type       text NOT NULL,
  title      text NOT NULL,
  body       text,
  data       jsonb DEFAULT '{}',
  read       boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 3. Helper: insert notification bypassing RLS ────────────
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid, p_type text, p_title text, p_body text,
  p_data jsonb DEFAULT '{}'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_data);
END;
$$;

-- ─── 4. Trigger: friend request sent ─────────────────────────
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_name text;
BEGIN
  SELECT ur.username INTO v_name
  FROM user_ratings ur
  WHERE ur.user_id = NEW.user_id
  LIMIT 1;

  IF v_name IS NULL THEN
    SELECT up.display_name INTO v_name
    FROM user_profiles up
    WHERE up.user_id = NEW.user_id
    LIMIT 1;
  END IF;

  IF v_name IS NULL THEN v_name := 'Someone'; END IF;

  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.friend_id,
    'friend_request',
    'Friend Request',
    v_name || ' wants to be your friend.',
    jsonb_build_object(
      'from_user_id',  NEW.user_id,
      'from_username', v_name,
      'friendship_id', NEW.id
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_friend_request ON friendships;
CREATE TRIGGER trg_friend_request
  AFTER INSERT ON friendships
  FOR EACH ROW EXECUTE FUNCTION notify_friend_request();

-- ─── 5. Trigger: friend request accepted ─────────────────────
CREATE OR REPLACE FUNCTION notify_friend_accepted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_name text;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT ur.username INTO v_name
    FROM user_ratings ur
    WHERE ur.user_id = NEW.friend_id
    LIMIT 1;

    IF v_name IS NULL THEN
      SELECT up.display_name INTO v_name
      FROM user_profiles up
      WHERE up.user_id = NEW.friend_id
      LIMIT 1;
    END IF;

    IF v_name IS NULL THEN v_name := 'Someone'; END IF;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.user_id,
      'friend_accepted',
      'Friend Request Accepted',
      v_name || ' accepted your friend request.',
      jsonb_build_object(
        'from_user_id',  NEW.friend_id,
        'from_username', v_name
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_friend_accepted ON friendships;
CREATE TRIGGER trg_friend_accepted
  AFTER UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION notify_friend_accepted();

-- ─── 6. Player search view ────────────────────────────────────
-- A view avoids all RETURNS TABLE output-param name-collision issues.
-- user_ratings already has a public-read RLS policy so this is safe.
-- The client queries this view with .ilike() directly — no RPC needed.
CREATE INDEX IF NOT EXISTS idx_user_ratings_username
  ON user_ratings (username text_pattern_ops);

CREATE OR REPLACE VIEW player_search AS
  SELECT DISTINCT ON (ur.user_id)
    ur.user_id,
    ur.username,
    ur.rating,
    ur.games_played
  FROM user_ratings ur
  WHERE ur.username IS NOT NULL
  ORDER BY ur.user_id, ur.rating DESC;
