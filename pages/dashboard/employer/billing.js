import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

const BENEFITS = {
  basic: ["Post jobs and track applicants", "Save up to 25 candidates", "Email support"],
  pro: ["Unlimited job postings", "Advanced resume search filters", "Priority support"],
  enterprise: ["Dedicated account manager", "Custom integrations", "Bulk applicant messaging"],
};

export default function BillingPage({ subscription }) {
  const tierKey = (subscription?.tier || "basic").toLowerCase();
  const benefits = BENEFITS[tierKey] || BENEFITS.basic;

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Billing &amp; Tier Info</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Manage your plan</h1>
          <p className="text-sm text-slate-600">
            Review the benefits of your current subscription and reach out to upgrade when you&apos;re ready.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">Current tier</p>
              <h2 className="mt-2 text-2xl font-bold capitalize">{subscription?.tier || "basic"}</h2>
              <p className="mt-4 text-sm text-slate-200/80">
                Status: <span className="font-semibold capitalize">{subscription?.status || "free"}</span>
              </p>
              <p className="mt-4 text-xs text-slate-300">
                Need to adjust billing? Contact support and we&apos;ll handle updates within one business day.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Included benefits</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {benefits.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-sky-500" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <a
              href="mailto:support@travelingovertimejobs.com"
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
            >
              Contact support
            </a>
            <p className="text-xs text-slate-500">
              Next invoice details will appear once billing is connected to your workspace.
            </p>
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
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        subscription_status: true,
        subscription_tier: true,
      },
    });

    return {
      props: {
        subscription: {
          status: employerProfile?.subscription_status || "free",
          tier: employerProfile?.subscription_tier || "basic",
        },
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        subscription: { status: "free", tier: "basic" },
      },
    };
  }
}
