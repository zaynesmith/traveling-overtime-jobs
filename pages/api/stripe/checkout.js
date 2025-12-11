import Stripe from "stripe";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2022-11-15",
    })
  : null;

const priceMap = {
  promo: process.env.STRIPE_PROMO_PRICE_ID,
  basic: process.env.STRIPE_BASIC_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { plan } = req.body || {};

  if (!stripe) {
    return res.status(500).json({ error: "Stripe is not configured" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id || session.user.role !== "employer") {
    return res.status(403).json({ error: "Employer authentication required" });
  }

  const employerProfile = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!employerProfile) {
    return res.status(400).json({ error: "Employer profile not found" });
  }

  const metadata = {
    employerProfileId: employerProfile.id?.toString(),
    userId: session.user.id?.toString(),
  };

  const price = priceMap[plan];

  if (!price) {
    return res.status(400).json({ error: "Invalid plan" });
  }

  try {
    const origin = req.headers.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${origin}/dashboard/employer?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/employer/subscription`,
      subscription_data: {
        metadata: {
          plan,
        },
      },
    });

    return res.status(200).json({ url: checkoutSession.url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to create checkout session" });
  }
}
