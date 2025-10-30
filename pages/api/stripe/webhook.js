import { buffer } from "micro";
import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false, // ✅ Required for Stripe signature verification
  },
};

// Automatically choose test or live keys
const isTest = process.env.NODE_ENV !== "production";

const stripe = new Stripe(
  isTest ? process.env.STRIPE_SECRET_KEY_TEST : process.env.STRIPE_SECRET_KEY_LIVE,
  { apiVersion: "2022-11-15" }
);

const webhookSecret = isTest
  ? process.env.STRIPE_WEBHOOK_SECRET_TEST
  : process.env.STRIPE_WEBHOOK_SECRET_LIVE;

// Redeploy trigger 1700000000000
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);

    console.log("✅ Stripe event received:", event.type);
    res.status(200).send({ received: true });
  } catch (err) {
    console.error("❌ Webhook Error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
