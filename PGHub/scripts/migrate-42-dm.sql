-- Direct messages between friends (PGBattle social layer). Persisted for history;
-- live delivery rides a Realtime broadcast on the recipient's dm channel.
CREATE TABLE IF NOT EXISTS public."PGcode_dm" (
  id           BIGSERIAL PRIMARY KEY,
  sender_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body         TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pgcode_dm_pair ON public."PGcode_dm" (sender_id, recipient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pgcode_dm_recipient ON public."PGcode_dm" (recipient_id, created_at);

ALTER TABLE public."PGcode_dm" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "DM parties can read" ON public."PGcode_dm";
CREATE POLICY "DM parties can read" ON public."PGcode_dm"
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users send their own DMs" ON public."PGcode_dm";
CREATE POLICY "Users send their own DMs" ON public."PGcode_dm"
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Senders delete their own DMs" ON public."PGcode_dm";
CREATE POLICY "Senders delete their own DMs" ON public."PGcode_dm"
  FOR DELETE USING (auth.uid() = sender_id);
