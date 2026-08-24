-- Ensure employer contact name fields exist while preserving historical data.
-- Mirrors Prisma migration 20250713000000_add_employer_name_fields.

ALTER TABLE public.employerprofile
  ADD COLUMN IF NOT EXISTS "firstName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "lastName" TEXT NOT NULL DEFAULT '';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'employerprofile'
      AND column_name = 'firstName'
  ) THEN
    ALTER TABLE public.employerprofile ALTER COLUMN "firstName" DROP DEFAULT;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'employerprofile'
      AND column_name = 'lastName'
  ) THEN
    ALTER TABLE public.employerprofile ALTER COLUMN "lastName" DROP DEFAULT;
  END IF;
END;
$$;
