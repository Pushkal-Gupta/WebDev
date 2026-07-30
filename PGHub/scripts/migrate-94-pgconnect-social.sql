-- 94: PGConnect social layer — posts (feed), likes, follows, and profile customization
-- (bio/username already exist from migrate-44; add custom background + banner).
-- Idempotent. Public-read so a feed/profile is visible to anyone; owner-write only.

-- ---- Tables ----
CREATE TABLE IF NOT EXISTS "PGcode_posts" (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body        text NOT NULL,
  like_count  integer NOT NULL DEFAULT 0,
  reply_count integer NOT NULL DEFAULT 0,
  reply_to    uuid REFERENCES "PGcode_posts"(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pgcode_posts_created ON "PGcode_posts"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pgcode_posts_author ON "PGcode_posts"(author_id);
CREATE INDEX IF NOT EXISTS idx_pgcode_posts_reply_to ON "PGcode_posts"(reply_to);

CREATE TABLE IF NOT EXISTS "PGcode_post_likes" (
  post_id    uuid NOT NULL REFERENCES "PGcode_posts"(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS "PGcode_follows" (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id)
);

-- ---- Profile customization ----
ALTER TABLE "PGcode_profiles"
  ADD COLUMN IF NOT EXISTS background_preset text,
  ADD COLUMN IF NOT EXISTS background_url text,
  ADD COLUMN IF NOT EXISTS banner_url text;

-- ---- Keep counters in sync (likes / replies) ----
CREATE OR REPLACE FUNCTION pgcode_post_like_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "PGcode_posts" SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "PGcode_posts" SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_pgcode_post_like_count ON "PGcode_post_likes";
CREATE TRIGGER trg_pgcode_post_like_count
  AFTER INSERT OR DELETE ON "PGcode_post_likes"
  FOR EACH ROW EXECUTE FUNCTION pgcode_post_like_count();

CREATE OR REPLACE FUNCTION pgcode_post_reply_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.reply_to IS NOT NULL THEN
    UPDATE "PGcode_posts" SET reply_count = reply_count + 1 WHERE id = NEW.reply_to;
  ELSIF TG_OP = 'DELETE' AND OLD.reply_to IS NOT NULL THEN
    UPDATE "PGcode_posts" SET reply_count = GREATEST(0, reply_count - 1) WHERE id = OLD.reply_to;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_pgcode_post_reply_count ON "PGcode_posts";
CREATE TRIGGER trg_pgcode_post_reply_count
  AFTER INSERT OR DELETE ON "PGcode_posts"
  FOR EACH ROW EXECUTE FUNCTION pgcode_post_reply_count();

-- ---- RLS ----
ALTER TABLE "PGcode_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PGcode_post_likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PGcode_follows" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- posts: public read; author writes
  DROP POLICY IF EXISTS "posts public read" ON "PGcode_posts";
  CREATE POLICY "posts public read" ON "PGcode_posts" FOR SELECT USING (true);
  DROP POLICY IF EXISTS "posts author insert" ON "PGcode_posts";
  CREATE POLICY "posts author insert" ON "PGcode_posts" FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
  DROP POLICY IF EXISTS "posts author update" ON "PGcode_posts";
  CREATE POLICY "posts author update" ON "PGcode_posts" FOR UPDATE TO authenticated USING (author_id = auth.uid());
  DROP POLICY IF EXISTS "posts author delete" ON "PGcode_posts";
  CREATE POLICY "posts author delete" ON "PGcode_posts" FOR DELETE TO authenticated USING (author_id = auth.uid());

  -- likes: public read; owner writes
  DROP POLICY IF EXISTS "likes public read" ON "PGcode_post_likes";
  CREATE POLICY "likes public read" ON "PGcode_post_likes" FOR SELECT USING (true);
  DROP POLICY IF EXISTS "likes owner insert" ON "PGcode_post_likes";
  CREATE POLICY "likes owner insert" ON "PGcode_post_likes" FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  DROP POLICY IF EXISTS "likes owner delete" ON "PGcode_post_likes";
  CREATE POLICY "likes owner delete" ON "PGcode_post_likes" FOR DELETE TO authenticated USING (user_id = auth.uid());

  -- follows: public read; follower writes
  DROP POLICY IF EXISTS "follows public read" ON "PGcode_follows";
  CREATE POLICY "follows public read" ON "PGcode_follows" FOR SELECT USING (true);
  DROP POLICY IF EXISTS "follows owner insert" ON "PGcode_follows";
  CREATE POLICY "follows owner insert" ON "PGcode_follows" FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
  DROP POLICY IF EXISTS "follows owner delete" ON "PGcode_follows";
  CREATE POLICY "follows owner delete" ON "PGcode_follows" FOR DELETE TO authenticated USING (follower_id = auth.uid());
END $$;
