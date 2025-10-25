import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

function Card({ href, title, description, children }) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
    >
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        {children}
        <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-sky-600">
          Manage
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

export default function EmployerDashboard({ previewJobs, savedCount, subscription }) {
  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <header className="space-y-3 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Employer Dashboard</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Welcome back</h1>
          <p className="max-w-3xl text-base text-slate-600">
            Navigate between your hiring tools. Post new listings, review applicants, and manage your subscription in just a
            couple of clicks.
          </p>
        </header>

        <section>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <Card href="/dashboard/employer/post-job" title="Post a Job" description="Share a new travel assignment in minutes.">
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Guided form with required fields</li>
                <li>• Preview pay, per diem, and requirements</li>
                <li>• Auto-redirect to manage applicants</li>
              </ul>
            </Card>

            <Card href="/dashboard/employer/posted-jobs" title="Posted Jobs" description="See your latest listings and applicant activity.">
              {previewJobs.length === 0 ? (
                <p className="text-sm font-medium text-slate-500">No jobs posted yet. Create your first listing to see it here.</p>
              ) : (
                <ul className="space-y-3">
                  {previewJobs.map((job) => (
                    <li key={job.id} className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-700 line-clamp-1">{job.title}</span>
                      {job.newApplicants > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          {job.newApplicants} new applicant{job.newApplicants === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card href="/dashboard/employer/resume-search" title="Resume Search" description="Filter the candidate pool by trade and location.">
              <p className="text-sm text-slate-600">
                Search by trade, radius, and keywords to find traveling professionals that match your open assignments.
              </p>
            </Card>

            <Card href="/dashboard/employer/saved" title="Saved Candidates" description="Revisit the talent you bookmarked for later.">
              <p className="text-sm text-slate-600">
                You have <span className="font-semibold text-slate-900">{savedCount}</span> saved candidate{savedCount === 1 ? "" : "s"}
                ready for follow-up.
              </p>
            </Card>

            <Card href="/dashboard/employer/billing" title="Billing &amp; Tier Info" description="Review your subscription and plan details.">
              <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Current tier: {subscription.tier || "Basic"}</p>
                <p className="mt-1 capitalize">Status: {subscription.status || "active"}</p>
                <p className="mt-2 text-xs text-slate-500">Manage invoices, upgrade tiers, and update payment methods.</p>
              </div>
            </Card>
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
        savedCandidates: {
          select: { id: true },
        },
      },
    });

    const previewJobs = (employerProfile?.jobs || []).map((job) => ({
      id: job.id,
      title: job.title,
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
