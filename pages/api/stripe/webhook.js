// Force redeploy trigger ${Date.now()}
import { buffer } from "micro";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

export const config = {
  api: {
    bodyParser: false, // ✅ Required for Stripe signature verification
  },
};

// Automatically choose test or live keys
const isTest = process.env.NODE_ENV !== "production";

const stripe = new Stripe(
  isTest
    ? process.env.STRIPE_SECRET_KEY_TEST
    : process.env.STRIPE_SECRET_KEY_LIVE,
  { apiVersion: "2022-11-15" }
);

const employerPriceIds = [
  process.env.STRIPE_PROMO_PRICE_ID,
  process.env.STRIPE_BASIC_PRICE_ID,
  process.env.STRIPE_PRO_PRICE_ID,
].filter(Boolean);

const webhookSecret =
  (isTest
    ? process.env.STRIPE_WEBHOOK_SECRET_TEST
    : process.env.STRIPE_WEBHOOK_SECRET_LIVE) ||
  process.env.STRIPE_WEBHOOK_SECRET; // fallback for older setups

if (!webhookSecret) {
  console.error("❌ Missing STRIPE_WEBHOOK_SECRET environment variable!");
}

function getPlanKeyFromSubscription(subscription) {
  const metadataPlan = subscription?.metadata?.plan;
  if (metadataPlan) {
    return metadataPlan.toLowerCase();
  }

  const priceId = subscription?.items?.data?.[0]?.price?.id;
  if (!priceId) return null;

  if (priceId === process.env.STRIPE_PROMO_PRICE_ID) return "promo";
  if (priceId === process.env.STRIPE_BASIC_PRICE_ID) return "basic";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";

  return null;
}

function isEmployerSubscription(subscription) {
  if (employerPriceIds.length === 0) return true;

  return subscription?.items?.data?.some((item) =>
    employerPriceIds.includes(item?.price?.id)
  );
}

function isSubscriptionActive(subscription) {
  return ["active", "trialing"].includes(subscription?.status);
}

async function findEmployerProfile({
  employerProfileId,
  customerId,
  customerEmail,
}) {
  if (employerProfileId) {
    const profile = await prisma.employerProfile.findUnique({
      where: { id: employerProfileId },
      select: { id: true, stripe_customer_id: true, stripecustomerid: true },
    });

    if (profile) return profile;
  }

  if (!customerId) return null;

  const profile = await prisma.employerProfile.findFirst({
    where: {
      OR: [
        { stripe_customer_id: customerId },
        { stripecustomerid: customerId },
      ],
    },
    select: { id: true, stripe_customer_id: true, stripecustomerid: true },
  });

  if (profile) return profile;

  const email = customerEmail?.toLowerCase();
  if (!email) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer?.email) {
        return findEmployerProfile({
          customerId,
          customerEmail: customer.email,
        });
      }
    } catch (error) {
      console.error("Failed to retrieve Stripe customer email", error);
    }

    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { employerProfile: { select: { id: true } } },
  });

  if (!user?.employerProfile) return null;

  return {
    id: user.employerProfile.id,
    stripe_customer_id: null,
    stripecustomerid: null,
  };
}

async function handleSubscriptionEvent(subscription, employerProfileId) {
  if (!subscription?.customer) {
    console.warn("Subscription event missing customer", subscription?.id);
    return;
  }

  if (!isEmployerSubscription(subscription)) {
    return;
  }

  const planKey = getPlanKeyFromSubscription(subscription);
  const isActive = isSubscriptionActive(subscription);

  const employerProfile = await findEmployerProfile({
    employerProfileId,
    customerId: subscription.customer,
    customerEmail: subscription.customer_email,
  });

  if (!employerProfile?.id) {
    console.warn(
      "No employer profile found for Stripe customer",
      subscription.customer
    );
    return;
  }

  const updateData = {
    issubscribed: isActive,
    subscription_status: subscription.status || null,
    stripe_subscription_id: subscription.id,
  };

  if (planKey) {
    updateData.plan = planKey;
    updateData.subscription_tier = planKey;
  }

  if (!employerProfile.stripe_customer_id) {
    updateData.stripe_customer_id = subscription.customer;
  }

  if (!employerProfile.stripecustomerid) {
    updateData.stripecustomerid = subscription.customer;
  }

  await prisma.employerProfile.update({
    where: { id: employerProfile.id },
    data: updateData,
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);

    console.log("✅ Stripe event received:", event.type);

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(
          event.data.object,
          event.data.object.metadata?.employerProfileId || null
        );
        break;
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session?.mode === "subscription" && session.subscription) {
          const employerProfileId =
            event.data.object.metadata?.employerProfileId || null;
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription
          );
          await handleSubscriptionEvent(subscription, employerProfileId);
        }
        break;
      }
      default:
        break;
    }

    res.status(200).send({ received: true });
  } catch (err) {
    console.error("❌ Webhook Error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
