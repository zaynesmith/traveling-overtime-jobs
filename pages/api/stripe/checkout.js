import Stripe from "stripe";

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

  const price = priceMap[plan];

  if (!price) {
    return res.status(400).json({ error: "Invalid plan" });
  }

  try {
    const origin = req.headers.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard/employer?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/employer/subscription`,
      subscription_data: {
        metadata: {
          plan,
        },
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to create checkout session" });
  }
}
