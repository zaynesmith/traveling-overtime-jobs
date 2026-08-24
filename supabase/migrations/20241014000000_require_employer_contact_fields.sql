-- Require key employer profile contact fields to be populated when possible.
-- Ported from Prisma migration 20250714000000_require_employer_contact_fields.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'employerprofile'
      AND column_name = 'firstName'
      AND is_nullable = 'YES'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.employerprofile WHERE "firstName" IS NULL
    ) THEN
      ALTER TABLE public.employerprofile ALTER COLUMN "firstName" SET NOT NULL;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'employerprofile'
      AND column_name = 'lastName'
      AND is_nullable = 'YES'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.employerprofile WHERE "lastName" IS NULL
    ) THEN
      ALTER TABLE public.employerprofile ALTER COLUMN "lastName" SET NOT NULL;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'employerprofile'
      AND column_name = 'phone'
      AND is_nullable = 'YES'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.employerprofile WHERE "phone" IS NULL
    ) THEN
      ALTER TABLE public.employerprofile ALTER COLUMN "phone" SET NOT NULL;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'employerprofile'
      AND column_name = 'address1'
      AND is_nullable = 'YES'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.employerprofile WHERE "address1" IS NULL
    ) THEN
      ALTER TABLE public.employerprofile ALTER COLUMN "address1" SET NOT NULL;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'employerprofile'
      AND column_name = 'city'
      AND is_nullable = 'YES'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.employerprofile WHERE "city" IS NULL
    ) THEN
      ALTER TABLE public.employerprofile ALTER COLUMN "city" SET NOT NULL;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'employerprofile'
      AND column_name = 'state'
      AND is_nullable = 'YES'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.employerprofile WHERE "state" IS NULL
    ) THEN
      ALTER TABLE public.employerprofile ALTER COLUMN "state" SET NOT NULL;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'employerprofile'
      AND column_name = 'zip'
      AND is_nullable = 'YES'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.employerprofile WHERE "zip" IS NULL
    ) THEN
      ALTER TABLE public.employerprofile ALTER COLUMN "zip" SET NOT NULL;
    END IF;
  END IF;
END;
$$;
