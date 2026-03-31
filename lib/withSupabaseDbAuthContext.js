import { Prisma } from "@prisma/client";

export async function withSupabaseDbAuthContext(prismaClient, userId, callback, options = {}) {
  const debugEnabled = options.debug === true;

  return await prismaClient.$transaction(async (tx) => {
    await tx.$executeRaw(
      Prisma.sql`SELECT set_config('request.jwt.claim.sub', ${String(userId)}::text, true)`,
    );

    let authUid = null;

    if (debugEnabled) {
      const rows = await tx.$queryRaw(Prisma.sql`SELECT auth.uid()::text AS uid`);
      authUid = rows?.[0]?.uid || null;
    }

    return await callback(tx, { authUid });
  });
}

export default withSupabaseDbAuthContext;
