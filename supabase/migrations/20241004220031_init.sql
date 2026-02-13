-- Recreated from Prisma migration 20251004220031_init
-- Establish the base tables and relationships for users and profiles.

CREATE TABLE IF NOT EXISTS public."user" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'jobseeker',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.employerprofile (
  "id" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "officePhone" TEXT,
  "mobilePhone" TEXT,
  "address1" TEXT,
  "address2" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zip" TEXT,
  "website" TEXT,
  "timezone" TEXT,
  "userId" TEXT NOT NULL,
  CONSTRAINT "EmployerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.jobseekerprofile (
  "id" TEXT NOT NULL,
  "trade" TEXT,
  "resumeUrl" TEXT,
  "userId" TEXT NOT NULL,
  CONSTRAINT "JobseekerProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON public."user" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "EmployerProfile_userId_key" ON public.employerprofile ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "JobseekerProfile_userId_key" ON public.jobseekerprofile ("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'EmployerProfile_userId_fkey'
      AND table_name = 'employerprofile'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.employerprofile
      ADD CONSTRAINT "EmployerProfile_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES public."user" ("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'JobseekerProfile_userId_fkey'
      AND table_name = 'jobseekerprofile'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.jobseekerprofile
      ADD CONSTRAINT "JobseekerProfile_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES public."user" ("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END;
$$;
