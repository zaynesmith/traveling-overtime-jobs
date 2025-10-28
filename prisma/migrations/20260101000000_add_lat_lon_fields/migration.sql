-- Add missing latitude/longitude columns for Prisma models.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobseekerprofile' AND column_name = 'lat'
  ) THEN
    ALTER TABLE "jobseekerprofile" ADD COLUMN "lat" DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobseekerprofile' AND column_name = 'lon'
  ) THEN
    ALTER TABLE "jobseekerprofile" ADD COLUMN "lon" DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'lat'
  ) THEN
    ALTER TABLE "jobs" ADD COLUMN "lat" DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'lon'
  ) THEN
    ALTER TABLE "jobs" ADD COLUMN "lon" DOUBLE PRECISION;
  END IF;
END;
$$;
