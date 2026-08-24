-- Align employer and jobseeker profile columns with application expectations.
-- Based on Prisma migration 20240710120000_add_missing_profile_fields.

ALTER TABLE public.employerprofile
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "location" TEXT,
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

ALTER TABLE public.jobseekerprofile
  ADD COLUMN IF NOT EXISTS "firstName" TEXT,
  ADD COLUMN IF NOT EXISTS "lastName" TEXT,
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "address1" TEXT,
  ADD COLUMN IF NOT EXISTS "address2" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "state" TEXT,
  ADD COLUMN IF NOT EXISTS "zip" TEXT;
