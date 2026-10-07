-- Signup and resume search share this catalog and selection table.
-- Preserve catalog IDs and selections in databases provisioned outside Prisma.
CREATE TABLE IF NOT EXISTS public.certifications_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jobseekerprofile_certifications (
  jobseekerprofile_id uuid NOT NULL,
  certification_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.certifications_catalog'::regclass
      AND conname = 'certifications_catalog_pkey'
  ) THEN
    ALTER TABLE public.certifications_catalog
      ADD CONSTRAINT certifications_catalog_pkey PRIMARY KEY (id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.certifications_catalog'::regclass
      AND conname = 'certifications_catalog_name_key'
  ) THEN
    ALTER TABLE public.certifications_catalog
      ADD CONSTRAINT certifications_catalog_name_key UNIQUE (name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.jobseekerprofile_certifications'::regclass
      AND conname = 'jobseekerprofile_certifications_pkey'
  ) THEN
    ALTER TABLE public.jobseekerprofile_certifications
      ADD CONSTRAINT jobseekerprofile_certifications_pkey PRIMARY KEY (jobseekerprofile_id, certification_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.jobseekerprofile_certifications'::regclass
      AND conname = 'jobseekerprofile_certifications_jobseekerprofile_id_fkey'
  ) THEN
    ALTER TABLE public.jobseekerprofile_certifications
      ADD CONSTRAINT jobseekerprofile_certifications_jobseekerprofile_id_fkey FOREIGN KEY (jobseekerprofile_id) REFERENCES public.jobseekerprofile(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.jobseekerprofile_certifications'::regclass
      AND conname = 'jobseekerprofile_certifications_certification_id_fkey'
  ) THEN
    ALTER TABLE public.jobseekerprofile_certifications
      ADD CONSTRAINT jobseekerprofile_certifications_certification_id_fkey FOREIGN KEY (certification_id) REFERENCES public.certifications_catalog(id);
  END IF;

END
$$;
