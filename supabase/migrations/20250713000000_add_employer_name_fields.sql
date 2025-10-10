-- Add missing employer contact name columns required by the Prisma schema
ALTER TABLE employerprofile
  ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';

-- Drop the temporary defaults now that historical rows are populated
ALTER TABLE employerprofile
  ALTER COLUMN "firstName" DROP DEFAULT,
  ALTER COLUMN "lastName" DROP DEFAULT;
