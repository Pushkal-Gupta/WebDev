-- ============================================================
-- Migration v6: Friends + Notifications
-- Project: ykpjmvoyatcrlqyqbgfu
-- ============================================================

-- ─── 1. Friendships ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS friendships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,     -- who sent the request
  friend_id   uuid NOT NULL,     -- who received the request
  status      text DEFAULT 'pending', -- 'pending' | 'accepted'
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Either party can read their friendship rows
CREATE POLICY "friendships_select" ON friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Only the requester can insert
CREATE POLICY "friendships_insert" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only the recipient can accept/decline (UPDATE), either party can unfriend (DELETE)
CREATE POLICY "friendships_update" ON friendships
  FOR UPDATE USING (auth.uid() = friend_id);

CREATE POLICY "friendships_delete" ON friendships
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Enable realtime on friendships
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;

-- ─── 2. Notifications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,   -- recipient
  type       text NOT NULL,   -- 'friend_request' | 'friend_accepted'
  title      text NOT NULL,
  body       text,
  data       jsonb DEFAULT '{}',
  read       boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Only the recipient can read/update their notifications
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Use a SECURITY DEFINER function for inserting (so any auth'd user can notify another)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id   uuid,
  p_type      text,
  p_title     text,
  p_body      text,
  p_data      jsonb DEFAULT '{}'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_data);
END;
$$;

-- Enable realtime on notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ─── 3. Auto-notification triggers ───────────────────────────

-- Trigger: notify recipient when a friend request is sent
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  sender_name text;
BEGIN
  -- Get sender's username from user_ratings or user_profiles
  SELECT username INTO sender_name FROM user_ratings
  WHERE user_id = NEW.user_id LIMIT 1;

  IF sender_name IS NULL THEN
    SELECT display_name INTO sender_name FROM user_profiles
    WHERE user_id = NEW.user_id LIMIT 1;
  END IF;

  IF sender_name IS NULL THEN sender_name := 'Someone'; END IF;

  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.friend_id,
    'friend_request',
    'Friend Request',
    sender_name || ' wants to be your friend.',
    jsonb_build_object('from_user_id', NEW.user_id, 'from_username', sender_name, 'friendship_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_friend_request ON friendships;
CREATE TRIGGER trg_friend_request
  AFTER INSERT ON friendships
  FOR EACH ROW EXECUTE FUNCTION notify_friend_request();

-- Trigger: notify requester when request is accepted
CREATE OR REPLACE FUNCTION notify_friend_accepted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  accepter_name text;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT username INTO accepter_name FROM user_ratings
    WHERE user_id = NEW.friend_id LIMIT 1;

    IF accepter_name IS NULL THEN
      SELECT display_name INTO accepter_name FROM user_profiles
      WHERE user_id = NEW.friend_id LIMIT 1;
    END IF;

    IF accepter_name IS NULL THEN accepter_name := 'Someone'; END IF;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.user_id,
      'friend_accepted',
      'Friend Request Accepted',
      accepter_name || ' accepted your friend request.',
      jsonb_build_object('from_user_id', NEW.friend_id, 'from_username', accepter_name)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_friend_accepted ON friendships;
CREATE TRIGGER trg_friend_accepted
  AFTER UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION notify_friend_accepted();

-- ─── 4. Player search helper ─────────────────────────────────
-- Search users by username (case-insensitive prefix match)
CREATE OR REPLACE FUNCTION search_players(p_query text, p_limit int DEFAULT 10)
RETURNS TABLE (user_id uuid, username text, rating integer, games_played integer)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT DISTINCT ON (ur.user_id)
    ur.user_id,
    ur.username,
    ur.rating,
    ur.games_played
  FROM user_ratings ur
  WHERE ur.username ILIKE p_query || '%'
    AND ur.user_id != auth.uid()
    AND ur.username IS NOT NULL
  ORDER BY ur.user_id, ur.rating DESC
  LIMIT p_limit;
$$;
