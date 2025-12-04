import prisma from "@/lib/prisma";

export async function getEmployerSubscriptionStatus(userId) {
  if (!userId) {
    return { isSubscribed: false };
  }

  const profile = await prisma.employerProfile.findUnique({
    where: { userId },
    select: { issubscribed: true },
  });

  return { isSubscribed: profile?.issubscribed === true };
}
