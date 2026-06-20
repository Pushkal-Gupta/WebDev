-- Phase 10: lightweight admin role on PGcode_profiles + RLS policy so non-admins
-- can't read content drafts.

ALTER TABLE public."PGcode_profiles"
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','editor','admin'));

-- Optionally grant yourself admin (uncomment and replace UUID):
-- UPDATE public."PGcode_profiles" SET role = 'admin' WHERE user_id = '<your-auth-uid>';
