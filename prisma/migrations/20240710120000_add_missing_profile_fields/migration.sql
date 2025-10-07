-- Add missing employer profile fields expected by application logic
ALTER TABLE employerprofile
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "location" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "completedAt" TIMESTAMP(3);

-- Add missing jobseeker profile fields expected by application logic
ALTER TABLE jobseekerprofile
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "lastName" TEXT,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "address1" TEXT,
  ADD COLUMN "address2" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "state" TEXT,
  ADD COLUMN "zip" TEXT;
