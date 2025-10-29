import Stripe from 'stripe';
import { buffer } from 'micro';
import prisma from '@/lib/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerEmail = session.customer_email;
        const plan = session.metadata?.plan || 'promo';

        if (!customerEmail) break;

        await prisma.employerProfile.updateMany({
          where: {
            user: {
              email: customerEmail,
            },
          },
          data: {
            plan,
            isSubscribed: true,
          },
        });

        break;
      }

      case 'invoice.payment_failed': {
        const session = event.data.object;
        const customerEmail = session.customer_email;

        if (customerEmail) {
          await prisma.employerProfile.updateMany({
            where: {
              user: {
                email: customerEmail,
              },
            },
            data: {
              isSubscribed: false,
            },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).send({ received: true });
  } catch (err) {
    console.error('Error handling webhook:', err);
    res.status(500).send('Webhook handler failed.');
  }
}
