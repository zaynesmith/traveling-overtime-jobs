import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import { normalizeTrade } from "@/lib/trades";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

function JobRow({ job, onDelete }) {
  const router = useRouter();
  const location = [job.city, job.state].filter(Boolean).join(", ") || job.location || job.zip || "";
  const trade = normalizeTrade(job.trade) || "General";

  return (
    <li
      id={`job-${job.id}`}
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl ${
        job.highlight ? "ring-4 ring-sky-200" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">{job.title}</h2>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{trade}</p>
          {location ? <p className="text-sm text-slate-600">{location}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-1 text-sm text-slate-600">
          {job.posted_at ? <span>Posted {formatDate(job.posted_at)}</span> : null}
          <span>
            {job.totalApplicants} applicant{job.totalApplicants === 1 ? "" : "s"}
            {job.newApplicants > 0 ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {job.newApplicants} new
              </span>
            ) : null}
          </span>
        </div>
      </div>

      {job.description ? (
        <p className="mt-4 text-sm text-slate-600 line-clamp-3">{job.description}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/employer/post-job?id=${job.id}`)}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(job.id)}
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
        >
          Delete
        </button>
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
        >
          View listing
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </li>
  );
}

export default function PostedJobsPage({ initialJobs }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [removing, setRemoving] = useState(null);

  const deleteJob = useCallback(
    async (id) => {
      if (!id || removing) return;
      const confirmDelete = window.confirm("Remove this job listing?");
      if (!confirmDelete) return;
      setRemoving(id);
      try {
        const response = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Unable to delete job");
        setJobs((current) => current.filter((job) => job.id !== id));
      } catch (error) {
        console.error(error);
        alert("We couldn\'t delete that job. Try again.");
      } finally {
        setRemoving(null);
      }
    },
    [removing]
  );

  const summary = useMemo(() => {
    if (jobs.length === 0) return { total: 0, applicants: 0 };
    return jobs.reduce(
      (acc, job) => ({
        total: acc.total + 1,
        applicants: acc.applicants + job.totalApplicants,
      }),
      { total: 0, applicants: 0 }
    );
  }, [jobs]);

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Posted Jobs</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Manage your active listings</h1>
          <p className="max-w-2xl text-base text-slate-600">
            Keep tabs on applicants, edit details, or remove listings once roles are filled.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-600">{summary.total} active job{summary.total === 1 ? "" : "s"}</p>
              <p className="text-xs text-slate-500">
                {summary.applicants} total applicant{summary.applicants === 1 ? "" : "s"} across all listings
              </p>
            </div>
            <Link
              href="/dashboard/employer/post-job"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
            >
              Post new job
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 5v14m-7-7h14" />
              </svg>
            </Link>
          </div>
        </section>

        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-lg">
            <p className="text-lg font-semibold text-slate-900">You haven&apos;t posted any jobs yet.</p>
            <p className="mt-2 text-sm text-slate-600">Create your first listing to start receiving applicants.</p>
            <Link
              href="/dashboard/employer/post-job"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
            >
              Post a job
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 5v14m-7-7h14" />
              </svg>
            </Link>
          </div>
        ) : (
          <ul className="space-y-6">
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} onDelete={deleteJob} />
            ))}
          </ul>
        )}
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
          include: {
            applications: {
              select: { id: true, status: true },
            },
          },
        },
      },
    });

    const highlightId = context.query?.highlight || null;

    const jobs = (employerProfile?.jobs || []).map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      city: job.city,
      state: job.state,
      location: job.location,
      zip: job.zip,
      trade: job.trade,
      posted_at: job.posted_at?.toISOString?.() ?? job.posted_at,
      totalApplicants: job.applications?.length || 0,
      newApplicants: job.applications?.filter((app) => app.status === "pending").length || 0,
      highlight: highlightId === job.id,
    }));

    return {
      props: {
        initialJobs: jobs,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        initialJobs: [],
      },
    };
  }
}
