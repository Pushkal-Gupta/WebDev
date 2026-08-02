-- Codolio-style linked external accounts + resume upload.
-- linked_accounts: JSONB array on the profile. Each entry { id, handle, stats?, synced_at }.
-- resume_url: public URL of the uploaded PDF resume.
-- Public-read + owner-write RLS already covers PGcode_profiles (migrate-31 / migrate-32).
ALTER TABLE "PGcode_profiles"
  ADD COLUMN IF NOT EXISTS linked_accounts JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- Public `resumes` storage bucket (read-public; files namespaced by user-id folder).
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "resumes public read" ON storage.objects;
CREATE POLICY "resumes public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'resumes');

DROP POLICY IF EXISTS "resumes owner insert" ON storage.objects;
CREATE POLICY "resumes owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "resumes owner update" ON storage.objects;
CREATE POLICY "resumes owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "resumes owner delete" ON storage.objects;
CREATE POLICY "resumes owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
