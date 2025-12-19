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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!stripe) {
    return res.status(500).json({ error: "Stripe is not configured" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id || session.user.role !== "employer") {
    return res.status(403).json({ error: "Employer authentication required" });
  }

  const employerProfile = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
    select: { stripe_customer_id: true, stripecustomerid: true },
  });

  const customerId =
    employerProfile?.stripe_customer_id || employerProfile?.stripecustomerid;

  if (!customerId) {
    return res.status(400).json({
      error:
        "We could not find your Stripe customer record. Please contact support or re-subscribe to continue.",
    });
  }

  try {
    const origin =
      req.headers.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard/employer/billing`,
    });

    // Stripe Dashboard > Customer Portal must allow payment method updates and cancellations.
    return res.status(200).json({ url: portalSession.url });
  } catch (error) {
    console.error("Unable to create billing portal session", error);
    return res.status(500).json({ error: "Unable to create billing portal session" });
  }
}
