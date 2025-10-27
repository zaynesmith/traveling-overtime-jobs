ALTER TABLE jobseekerprofile
  ADD COLUMN IF NOT EXISTS "certifications" text,
  ADD COLUMN IF NOT EXISTS "certFiles" text[] DEFAULT '{}'::text[] NOT NULL,
  ADD COLUMN IF NOT EXISTS "last_bump" timestamp(6);

COMMENT ON COLUMN jobseekerprofile."certFiles" IS 'Supabase storage paths for certification documents';
