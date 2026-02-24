import prisma from "@/lib/prisma";

export async function getEmployerSubscriptionStatus(userId) {
  if (!userId) {
    return { isSubscribed: false };
  }

  const profile = await prisma.employerProfile.findUnique({
    where: { userId },
    select: {
      issubscribed: true,
      subscription_status: true,
      stripe_customer_id: true,
      stripecustomerid: true,
    },
  });

  const status = profile?.subscription_status?.toLowerCase?.() || null;
  const isCanceled = ["canceled", "cancelled", "unpaid"].includes(status);
  const hasStripeCustomer = Boolean(
    profile?.stripe_customer_id || profile?.stripecustomerid
  );

  return {
    isSubscribed:
      !isCanceled && (profile?.issubscribed === true || hasStripeCustomer),
  };
}
