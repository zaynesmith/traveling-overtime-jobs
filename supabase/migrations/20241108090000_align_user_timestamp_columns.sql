-- Align timestamp column names with Prisma mappings and Supabase expectations.
-- Mirrors Prisma migration 20251108090000_align_user_timestamp_columns.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user'
      AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE public."user"
      RENAME COLUMN "createdAt" TO "created_at";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user'
      AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE public."user"
      RENAME COLUMN "updatedAt" TO "updated_at";
  END IF;
END;
$$;

-- Ensure the renamed columns exist even if a manual change previously occurred.
ALTER TABLE public."user"
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public."user"
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
