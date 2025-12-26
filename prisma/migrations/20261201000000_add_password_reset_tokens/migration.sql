-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL,
  "tokenHash" text NOT NULL,
  "expiresAt" timestamp(6) NOT NULL,
  "usedAt" timestamp(6) NULL,
  "createdAt" timestamp(6) NOT NULL DEFAULT now(),
  CONSTRAINT password_reset_tokens_userid_fkey
    FOREIGN KEY ("userId") REFERENCES public."user"(id)
    ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX IF NOT EXISTS password_reset_tokens_tokenhash_key
  ON public.password_reset_tokens("tokenHash");

CREATE INDEX IF NOT EXISTS password_reset_tokens_userid_idx
  ON public.password_reset_tokens("userId");
