import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

const plans = [
  {
    name: "Promo",
    key: "promo",
    price: "$99/mo unlimited",
    buttonClass: "bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded w-full mt-4",
    buttonLabel: "Subscribe $99/mo",
    features: [
      "Unlimited job posts",
      "Highlighted listings",
      "Email support",
    ],
  },
  {
    name: "Basic",
    key: "basic",
    price: "$99/mo limited",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded w-full mt-4",
    buttonLabel: "Subscribe $99/mo",
    features: [
      "Up to 5 active job posts",
      "Resume search with limited filters",
      "Email support",
    ],
  },
  {
    name: "Pro",
    key: "pro",
    price: "$199/mo unlimited",
    buttonClass: "bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded w-full mt-4",
    buttonLabel: "Subscribe $199/mo",
    features: [
      "Unlimited job posts",
      "Full resume search",
      "Saved candidate sync",
      "Priority support",
    ],
  },
  {
    name: "Custom",
    key: "custom",
    price: "Custom",
    features: [
      "Dedicated success manager",
      "ATS integrations",
      "Custom billing",
      "Onsite hiring events",
    ],
  },
];

export default function BillingPage({ subscription }) {
  async function startCheckout(plan) {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  const normalizedTier = subscription.tier?.toLowerCase();

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Billing &amp; Tier</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Manage your plan</h1>
          <p className="max-w-2xl text-base text-slate-600">
            Review your current subscription, explore upgrade options, and keep payment details current.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Current tier</p>
              <p className="text-2xl font-bold text-slate-900">{subscription.tier}</p>
              <p className="text-sm text-slate-600 capitalize">Status: {subscription.status}</p>
            </div>
            <button className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500">
              Update payment method
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Compare plans</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className="rounded-2xl bg-white p-6 shadow-lg">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{plan.name}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{plan.price}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {plan.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
                {plan.key === "custom" ? (
                  <button className="mt-6 w-full rounded-xl border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-600 transition hover:bg-sky-50">
                    {plan.name === subscription.tier ? "Current plan" : "Talk to sales"}
                  </button>
                ) : normalizedTier === plan.name.toLowerCase() ? (
                  <button className="mt-6 w-full rounded-xl border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-600 transition hover:bg-sky-50" disabled>
                    Current plan
                  </button>
                ) : (
                  <button
                    onClick={() => startCheckout(plan.key)}
                    className={plan.buttonClass}
                  >
                    {plan.buttonLabel}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/employer/login",
        permanent: false,
      },
    };
  }

  if (session.user?.role !== "employer") {
    const destination = session.user?.role === "jobseeker" ? "/dashboard/jobseeker" : "/";
    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  try {
    const { default: prisma } = await import("@/lib/prisma");
    const profile = await prisma.employerProfile.findUnique({
      where: { userId: session.user.id },
    });

    return {
      props: {
        subscription: {
          tier: profile?.subscription_tier || "Basic",
          status: profile?.subscription_status || "active",
        },
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        subscription: { tier: "Basic", status: "active" },
      },
    };
  }
}
