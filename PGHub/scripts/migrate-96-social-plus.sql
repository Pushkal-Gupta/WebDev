-- migrate-96: PGConnect "everything" expansion — notifications, bookmarks, profile extras.
-- Idempotent. RLS: owner-scoped. Notification rows are inserted by SECURITY DEFINER
-- triggers (so no public INSERT policy is needed / allowed).

-- ============ Notifications ============
CREATE TABLE IF NOT EXISTS "PGcode_notifications" (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,                 -- recipient
  actor_id UUID,                         -- who caused it
  type TEXT NOT NULL,                    -- follow | like | reply
  post_id BIGINT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pgcode_notif_user ON "PGcode_notifications"(user_id, created_at DESC);
ALTER TABLE "PGcode_notifications" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notif owner read" ON "PGcode_notifications";
CREATE POLICY "notif owner read" ON "PGcode_notifications" FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif owner update" ON "PGcode_notifications";
CREATE POLICY "notif owner update" ON "PGcode_notifications" FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif owner delete" ON "PGcode_notifications";
CREATE POLICY "notif owner delete" ON "PGcode_notifications" FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION pgcode_notify_follow() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO "PGcode_notifications"(user_id, actor_id, type)
  VALUES (NEW.followee_id, NEW.follower_id, 'follow');
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_follow ON "PGcode_follows";
CREATE TRIGGER trg_notify_follow AFTER INSERT ON "PGcode_follows"
  FOR EACH ROW EXECUTE FUNCTION pgcode_notify_follow();

CREATE OR REPLACE FUNCTION pgcode_notify_like() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE author UUID;
BEGIN
  SELECT author_id INTO author FROM "PGcode_posts" WHERE id = NEW.post_id;
  IF author IS NOT NULL AND author <> NEW.user_id THEN
    INSERT INTO "PGcode_notifications"(user_id, actor_id, type, post_id)
    VALUES (author, NEW.user_id, 'like', NEW.post_id);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_like ON "PGcode_post_likes";
CREATE TRIGGER trg_notify_like AFTER INSERT ON "PGcode_post_likes"
  FOR EACH ROW EXECUTE FUNCTION pgcode_notify_like();

CREATE OR REPLACE FUNCTION pgcode_notify_reply() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE parent_author UUID;
BEGIN
  IF NEW.reply_to IS NOT NULL THEN
    SELECT author_id INTO parent_author FROM "PGcode_posts" WHERE id = NEW.reply_to;
    IF parent_author IS NOT NULL AND parent_author <> NEW.author_id THEN
      INSERT INTO "PGcode_notifications"(user_id, actor_id, type, post_id)
      VALUES (parent_author, NEW.author_id, 'reply', NEW.reply_to);
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_reply ON "PGcode_posts";
CREATE TRIGGER trg_notify_reply AFTER INSERT ON "PGcode_posts"
  FOR EACH ROW EXECUTE FUNCTION pgcode_notify_reply();

-- ============ Bookmarks ============
CREATE TABLE IF NOT EXISTS "PGcode_post_bookmarks" (
  user_id UUID NOT NULL,
  post_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
ALTER TABLE "PGcode_post_bookmarks" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bm owner all" ON "PGcode_post_bookmarks";
CREATE POLICY "bm owner all" ON "PGcode_post_bookmarks"
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ Profile extras ============
ALTER TABLE "PGcode_profiles"
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT[],
  ADD COLUMN IF NOT EXISTS pinned_post_id BIGINT;
