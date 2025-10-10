-- Align timestamp column names with Prisma mappings and Supabase expectations
-- by renaming camelCase columns to snake_case. The guards allow re-running the
-- migration safely even if the columns were already renamed manually.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user'
      AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE "user"
      RENAME COLUMN "createdAt" TO "created_at";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user'
      AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE "user"
      RENAME COLUMN "updatedAt" TO "updated_at";
  END IF;
END;
$$;
