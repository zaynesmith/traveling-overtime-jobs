import { useEffect, useState } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import SupportContact from "@/components/SupportContact";
import { normalizeTrade } from "@/lib/trades";

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

function JobPreview({ job }) {
  const location = [job.city, job.state].filter(Boolean).join(", ") || job.location || job.zip || "";
  const trade = normalizeTrade(job.trade) || "General";

  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-800">{job.title}</p>
        <p className="truncate text-slate-500">{trade}{location ? ` • ${location}` : ""}</p>
      </div>
      {job.newApplicants > 0 ? (
        <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          {job.newApplicants} new
        </span>
      ) : null}
    </li>
  );
}

export default function EmployerDashboard({ previewJobs, savedCount, subscription, greetingName }) {
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
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Employer Dashboard</p>
          <h1 className="text-3xl font-bold sm:text-4xl">{heading}</h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Keep your hiring pipeline in motion with quick access to posting tools, candidate insights, and billing controls tailored for traveling trades teams.
          </p>
        </div>
      </div>

      <section className="relative z-10 -mt-12 pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <DashboardCard
              href="/dashboard/employer/post-job"
              title="Post a Job"
              description="Launch a new assignment with guided fields and instant confirmation."
              cta="Create"
            >
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Share pay, per diem, and schedule details</li>
                <li>• Highlight trades, locations, and certifications</li>
                <li>• Publish in minutes and start receiving applicants</li>
              </ul>
            </DashboardCard>

            <DashboardCard
              href="/dashboard/employer/posted-jobs"
              title="Posted Jobs"
              description="Review live listings and monitor fresh applicant activity."
              cta="View"
            >
              {previewJobs.length === 0 ? (
                <p className="text-sm font-medium text-slate-500">No active listings yet—post your first job to see it here.</p>
              ) : (
                <ul className="space-y-3">
                  {previewJobs.map((job) => (
                    <JobPreview key={job.id} job={job} />
                  ))}
                </ul>
              )}
            </DashboardCard>

            <DashboardCard
              href="/dashboard/employer/resume-search"
              title="Resume Search"
              description="Explore the talent pool by trade, experience, and travel readiness."
              cta="Search"
            >
              <p className="text-sm text-slate-600">
                Dial in the right traveling professionals using filters for trade focus, proximity, and certifications.
              </p>
            </DashboardCard>

            <DashboardCard
              href="/dashboard/employer/saved"
              title="Saved Candidates"
              description="Revisit high-potential talent you bookmarked for outreach."
              cta="Review"
            >
              <p className="text-sm text-slate-600">
                You have <span className="font-semibold text-slate-900">{savedCount}</span> saved candidate
                {savedCount === 1 ? "" : "s"} ready for follow-up.
              </p>
            </DashboardCard>

            <DashboardCard
              href="/dashboard/employer/billing"
              title="Billing &amp; Tier Info"
              description="Manage your subscription tier, invoices, and payment methods."
              cta="Manage"
            >
              <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Current tier: {subscription.tier || "Basic"}</p>
                <p className="mt-1 capitalize">Status: {subscription.status || "active"}</p>
                <p className="mt-2 text-xs text-slate-500">Update payment preferences or upgrade plans without leaving this hub.</p>
              </div>
            </DashboardCard>
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

    const userRecord = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        employerProfile: {
          include: {
            jobs: {
              orderBy: { posted_at: "desc" },
              take: 3,
              include: {
                applications: {
                  where: { status: "pending" },
                  select: { id: true },
                },
              },
            },
            savedCandidates: { select: { id: true } },
          },
        },
      },
    });

    const employerProfile = userRecord?.employerProfile;
    const previewJobs = (employerProfile?.jobs || []).map((job) => ({
      id: job.id,
      title: job.title,
      city: job.city,
      state: job.state,
      location: job.location,
      zip: job.zip,
      trade: job.trade,
      newApplicants: job.applications?.length || 0,
    }));

    return {
      props: {
        previewJobs,
        savedCount: employerProfile?.savedCandidates?.length || 0,
        subscription: {
          status: employerProfile?.subscription_status || "free",
          tier: employerProfile?.subscription_tier || "basic",
        },
        greetingName:
          employerProfile?.companyName?.trim() ||
          session.user?.companyName?.trim?.() ||
          session.user?.name?.split?.(" ")?.[0] ||
          "",
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        previewJobs: [],
        savedCount: 0,
        subscription: { status: "free", tier: "basic" },
        greetingName:
          session.user?.companyName?.trim?.() ||
          session.user?.name?.split?.(" ")?.[0] ||
          "",
      },
    };
  }
}
