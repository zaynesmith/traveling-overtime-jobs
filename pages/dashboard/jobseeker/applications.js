import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import Link from "next/link";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

function formatJobLocation(job) {
  if (!job) return "";
  const cityState = [job.city, job.state].filter(Boolean).join(", ");
  return cityState || job.location || job.zip || "";
}

export default function ApplicationsPage({ applications }) {
  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Applications</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Track your submissions</h1>
          <p className="text-sm text-slate-600">Stay organized and follow up on roles that matter most.</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          {applications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              You haven&apos;t applied to any jobs yet. Explore the <Link className="font-semibold text-sky-600" href="/dashboard/jobseeker/jobs">job board</Link> to get started.
            </div>
          ) : (
            <ul className="space-y-5">
              {applications.map((application) => (
                <li key={application.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{application.jobs?.title || "Job title unavailable"}</h2>
                      <p className="text-sm text-slate-600">{formatJobLocation(application.jobs)}</p>
                      <p className="text-xs text-slate-500">Applied {formatDate(application.applied_at)}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {application.status || "pending"}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <Link className="text-sm font-semibold text-sky-600 hover:text-sky-500" href={`/jobs/${application.job_id}`}>
                      View listing
                    </Link>
                    <span className="text-xs text-slate-500">Application ID: {application.id}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
      select: { id: true },
    });

    const applications = await prisma.applications.findMany({
      where: { jobseeker_id: profile?.id || "" },
      include: { jobs: true },
      orderBy: { applied_at: "desc" },
    });

    return {
      props: {
        applications: JSON.parse(JSON.stringify(applications)),
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        applications: [],
      },
    };
  }
}
