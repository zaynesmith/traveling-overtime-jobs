import { useEffect, useState } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import SupportContact from "@/components/SupportContact";
import TOTJEmploymentCard from "@/components/jobseeker/TOTJEmploymentCard";

const PHASE_II_EMAIL = "zayne.smith18@gmail.com";

function DashboardCard({ href, title, description, children, cta = "Open" }) {
  return (
    <Link
      href={href}
      className="group block h-full rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
    >
      <div className="flex h-full flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        {children}
        <span className="mt-auto inline-flex items-center justify-center gap-2 self-start rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition-colors duration-300 group-hover:bg-slate-700">
          {cta}
          <svg
            aria-hidden="true"
            className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

export default function JobseekerDashboard({ greetingName, showTotjEmploymentCard }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-100" />;
  }

  const heading = greetingName ? `Welcome back, ${greetingName}` : "Welcome back";

  return (
    <main className="bg-slate-100">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 text-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.25),transparent_55%)]" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Jobseeker Dashboard</p>
          <h1 className="text-3xl font-bold sm:text-4xl">{heading}</h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Keep your profile updated, explore new assignments, and stay on top of every application.
          </p>
        </div>
      </div>

      <section className="relative z-10 -mt-12 pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <DashboardCard
              href="/dashboard/jobseeker/profile"
              title="Keep Your Profile Updated"
              description="Fine-tune your skills, certifications, and travel preferences to stand out."
              cta="Update"
            >
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Upload licenses, references, and availability</li>
                <li>• Showcase recent assignments and specialties</li>
                <li>• Ensure employers see the most current details</li>
              </ul>
            </DashboardCard>

            <DashboardCard
              href="/dashboard/jobseeker/jobs"
              title="Search Jobs"
              description="Discover traveling assignments that match your goals and experience."
              cta="Search"
            >
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Filter by trade, pay, per diem, and location</li>
                <li>• Save roles that catch your eye for later review</li>
                <li>• Set alerts to get notified of fresh postings</li>
              </ul>
            </DashboardCard>

            <DashboardCard
              href="/dashboard/jobseeker/applications"
              title="Track Applications"
              description="Monitor statuses, interview requests, and employer messages."
              cta="Review"
            >
              <p className="text-sm text-slate-600">
                Keep tabs on pending, accepted, and declined applications so you never miss an update or next step.
              </p>
            </DashboardCard>

            <DashboardCard
              href="/dashboard/jobseeker/activity"
              title="Recent Activity"
              description="Revisit saved jobs and follow up on leads from your dashboard history."
              cta="Open"
            >
              <p className="text-sm text-slate-600">
                Review searches, saved postings, and profile views to stay informed about what employers are exploring.
              </p>
            </DashboardCard>

            <DashboardCard
              href="/dashboard/jobseeker/settings"
              title="Account Settings"
              description="Control alerts, privacy, and communication preferences in one place."
              cta="Manage"
            >
              <p className="text-sm text-slate-600">
                Update login details, manage notifications, and tailor how employers can reach out.
              </p>
            </DashboardCard>

            {/* Phase II – gated to a specific user email until general release. TODO: replace with feature flag/role gate. */}
            {showTotjEmploymentCard ? <TOTJEmploymentCard /> : null}
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-6xl px-4 pb-2 sm:px-6 lg:px-8">
          <SupportContact className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-center text-sm text-slate-600 shadow-sm [&_a]:font-semibold [&_a]:text-slate-900" />
        </div>
      </section>
    </main>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/jobseeker/login",
        permanent: false,
      },
    };
  }

  if (session.user?.role !== "jobseeker") {
    const destination = session.user?.role === "employer" ? "/dashboard/employer" : "/";
    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  try {
    const { default: prisma } = await import("@/lib/prisma");

    const userRecord = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        jobseekerprofile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const profile = userRecord?.jobseekerprofile;
    const primaryGreeting = profile?.firstName?.trim?.();
    const fallbackGreeting = [profile?.firstName, profile?.lastName]
      .map((value) => (value ? String(value).trim() : ""))
      .filter(Boolean)
      .join(" ");

    const showTotjEmploymentCard = String(session.user?.email || "").toLowerCase() === PHASE_II_EMAIL;

    return {
      props: {
        greetingName:
          primaryGreeting ||
          fallbackGreeting ||
          session.user?.name?.trim?.() ||
          "",
        showTotjEmploymentCard,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        greetingName: session.user?.name?.trim?.() || "",
        showTotjEmploymentCard: String(session.user?.email || "").toLowerCase() === PHASE_II_EMAIL,
      },
    };
  }
}
