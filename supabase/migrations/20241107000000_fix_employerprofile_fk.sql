-- Guarantee the employer profile foreign key references the user table with cascading deletes.
-- Mirrors Prisma migration 20251107000000_fix_employerprofile_fk.

DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'employerprofile'
      AND constraint_name IN ('EmployerProfile_userId_fkey', 'employerprofile_userid_fkey')
  )
  INTO constraint_exists;

  IF constraint_exists THEN
    BEGIN
      ALTER TABLE public.employerprofile
        DROP CONSTRAINT IF EXISTS "EmployerProfile_userId_fkey";
    EXCEPTION
      WHEN undefined_object THEN
        NULL;
    END;

    BEGIN
      ALTER TABLE public.employerprofile
        DROP CONSTRAINT IF EXISTS employerprofile_userid_fkey;
    EXCEPTION
      WHEN undefined_object THEN
        NULL;
    END;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'employerprofile'
      AND constraint_name = 'employerprofile_userid_fkey'
  ) THEN
    ALTER TABLE public.employerprofile
      ADD CONSTRAINT employerprofile_userid_fkey
      FOREIGN KEY ("userId") REFERENCES public."user" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END;
$$;
