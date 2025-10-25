import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

const statusStyles = {
  pending: "text-amber-600 bg-amber-100",
  accepted: "text-emerald-600 bg-emerald-100",
  rejected: "text-rose-600 bg-rose-100",
};

export default function ApplicationsPage({ applications }) {
  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Applications</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Track your submissions</h1>
          <p className="max-w-2xl text-base text-slate-600">
            Monitor the status of each job you&apos;ve applied to and jump back into the listing for details.
          </p>
        </header>

        {applications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-lg">
            <p className="text-lg font-semibold text-slate-900">You haven&apos;t applied to any jobs yet.</p>
            <p className="mt-2 text-sm text-slate-600">Browse the job board and submit your first application.</p>
            <Link
              href="/dashboard/jobseeker/jobs"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
            >
              Find jobs
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {applications.map((application) => {
              const badge = statusStyles[application.status] || "text-slate-600 bg-slate-100";
              return (
                <li key={application.id} className="rounded-2xl bg-white p-5 shadow-lg">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{application.jobTitle}</p>
                      <p className="text-sm text-slate-600">Applied {application.appliedAt}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>
                      {application.statusLabel}
                    </span>
                  </div>
                  <Link
                    href={`/jobs/${application.jobId}`}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-sky-600"
                  >
                    View job
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

function formatDate(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString();
}

const statusLabels = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Not selected",
};

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

    const profile = await prisma.jobseekerProfile.findUnique({
      where: { userId: session.user.id },
    });

    const applications = await prisma.applications.findMany({
      where: { jobseeker_id: profile?.id || "" },
      orderBy: { applied_at: "desc" },
      include: {
        jobs: { select: { id: true, title: true } },
      },
    });

    const formatted = applications.map((application) => ({
      id: application.id,
      jobId: application.jobs?.id || "",
      jobTitle: application.jobs?.title || "Untitled job",
      appliedAt: formatDate(application.applied_at),
      status: application.status || "pending",
      statusLabel: statusLabels[application.status] || "Pending",
    }));

    return {
      props: { applications: formatted },
    };
  } catch (error) {
    console.error(error);
    return {
      props: { applications: [] },
    };
  }
}
