import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import { normalizeTrade } from "@/lib/trades";

function DashboardCard({ href, title, description, children, cta = "Open" }) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
    >
      <div className="flex h-full flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        {children}
        <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-sky-600">
          {cta}
          <svg
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
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

export default function EmployerDashboard({ previewJobs, savedCount, subscription }) {
  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <header className="space-y-3 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Employer Dashboard</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Welcome back</h1>
          <p className="max-w-3xl text-base text-slate-600">
            Quickly jump to hiring tasks, monitor recent postings, and keep an eye on your subscription in one polished hub.
          </p>
        </header>

        <section>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <DashboardCard
              href="/dashboard/employer/post-job"
              title="Post a Job"
              description="Publish a new assignment with guided fields and instant confirmation."
              cta="Create"
            >
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Add pay, per diem, and requirements</li>
                <li>• Preview trade and location details</li>
                <li>• Redirects to manage applicants</li>
              </ul>
            </DashboardCard>

            <DashboardCard
              href="/dashboard/employer/posted-jobs"
              title="Posted Jobs"
              description="Review your latest listings and applicant activity."
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
              description="Explore the candidate pool by trade, location, and keywords."
            >
              <p className="text-sm text-slate-600">
                Dial in the right traveling professionals using filters for trade, proximity, and experience.
              </p>
            </DashboardCard>

            <DashboardCard
              href="/dashboard/employer/saved"
              title="Saved Candidates"
              description="Revisit talent you bookmarked for quick follow-up."
            >
              <p className="text-sm text-slate-600">
                You have <span className="font-semibold text-slate-900">{savedCount}</span> saved candidate
                {savedCount === 1 ? "" : "s"} ready for outreach.
              </p>
            </DashboardCard>

            <DashboardCard
              href="/dashboard/employer/billing"
              title="Billing &amp; Tier Info"
              description="Manage your subscription and invoices."
              cta="Manage"
            >
              <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Current tier: {subscription.tier || "Basic"}</p>
                <p className="mt-1 capitalize">Status: {subscription.status || "active"}</p>
                <p className="mt-2 text-xs text-slate-500">Update payment methods or upgrade plans with a few clicks.</p>
              </div>
            </DashboardCard>
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
    });

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
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        previewJobs: [],
        savedCount: 0,
        subscription: { status: "free", tier: "basic" },
      },
    };
  }
}
