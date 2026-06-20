-- 51: LeetCode handle on the profile.
-- Stores a user's LeetCode username so the shareable card can pull live
-- contest + solve stats via the lc-user edge function. Idempotent.

ALTER TABLE "PGcode_profiles"
  ADD COLUMN IF NOT EXISTS leetcode_handle TEXT;
