-- Ensure the `user` table exposes `created_at`/`updated_at` columns expected by Prisma
-- and the application code. The guards allow re-running safely.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE "user" ADD COLUMN "created_at" TIMESTAMP WITH TIME ZONE;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'user' AND column_name = 'createdAt'
    ) THEN
      EXECUTE 'UPDATE "user" SET "created_at" = "createdAt"';
      ALTER TABLE "user" DROP COLUMN "createdAt";
    ELSE
      EXECUTE 'UPDATE "user" SET "created_at" = NOW() WHERE "created_at" IS NULL';
    END IF;

    ALTER TABLE "user"
      ALTER COLUMN "created_at" SET DEFAULT NOW(),
      ALTER COLUMN "created_at" SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE "user" ADD COLUMN "updated_at" TIMESTAMP WITH TIME ZONE;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'user' AND column_name = 'updatedAt'
    ) THEN
      EXECUTE 'UPDATE "user" SET "updated_at" = "updatedAt"';
      ALTER TABLE "user" DROP COLUMN "updatedAt";
    ELSE
      EXECUTE 'UPDATE "user" SET "updated_at" = NOW() WHERE "updated_at" IS NULL';
    END IF;

    ALTER TABLE "user"
      ALTER COLUMN "updated_at" SET DEFAULT NOW(),
      ALTER COLUMN "updated_at" SET NOT NULL;
  END IF;
END;
$$;
