import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

function formatLocation(job) {
  if (!job) return "";
  const parts = [job.city, job.state].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return job.location || job.zip || "";
}

export default function EmployerPostedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const selectedJobId = useMemo(() => {
    const { job } = router.query || {};
    return typeof job === "string" ? job : null;
  }, [router.query]);

  useEffect(() => {
    let isMounted = true;
    async function loadJobs() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/employer/applications");
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || "Unable to load posted jobs");
        }
        const payload = await response.json();
        if (isMounted) {
          setJobs(Array.isArray(payload) ? payload : []);
        }
      } catch (err) {
        if (isMounted) {
          setJobs([]);
          setError(err.message || "Unable to load posted jobs");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadJobs();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    return jobs.find((job) => job.id === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  const renderApplicants = () => {
    if (!selectedJob) return null;
    const applicants = Array.isArray(selectedJob.applications)
      ? selectedJob.applications.filter((application) => application.jobseeker)
      : [];

    return (
      <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Applicants for {selectedJob.title}
            </h2>
            <p className="text-sm text-gray-500">Review each applicant&apos;s details below.</p>
          </div>
          <Link
            href="/dashboard/employer/posted-jobs"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Close
          </Link>
        </div>

        {applicants.length === 0 ? (
          <p className="text-sm text-gray-600">No applicants have applied to this job yet.</p>
        ) : (
          <ul className="space-y-4">
            {applicants.map((application) => {
              const jobseeker = application.jobseeker;
              const name = [jobseeker.firstName, jobseeker.lastName].filter(Boolean).join(" ");
              return (
                <li
                  key={application.id}
                  className="rounded-xl border border-gray-200 p-4 hover:border-gray-300"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800">
                        {name || "Unnamed Applicant"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {[jobseeker.trade, jobseeker.city, jobseeker.state]
                          .filter(Boolean)
                          .join(" · ") || "Details not available"}
                      </p>
                    </div>
                    {jobseeker.resumeUrl ? (
                      <a
                        href={jobseeker.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-blue-600 hover:text-blue-500"
                      >
                        View Resume
                      </a>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wide text-gray-500">
                    Status: {application.status || "Pending"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Posted Jobs</h1>
        <p className="mt-2 text-sm text-gray-600">
          Track your active job postings and review applicants in one place.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-gray-600">Loading posted jobs…</p>
      ) : error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-600">
          You haven&apos;t posted any jobs yet.
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const applicantCount = Array.isArray(job.applications)
              ? job.applications.filter((application) => application.jobseeker).length
              : 0;
            return (
              <article
                key={job.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-300"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">{job.title}</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {formatLocation(job) || "Location not specified"}
                    </p>
                    {job.trade ? (
                      <p className="mt-1 text-sm text-gray-500">Trade: {job.trade}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                      {applicantCount} applicant{applicantCount === 1 ? "" : "s"}
                    </span>
                    <Link
                      href={{
                        pathname: "/dashboard/employer/posted-jobs",
                        query: { job: job.id },
                      }}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-500"
                    >
                      View applicants
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {renderApplicants()}
    </div>
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
    const destination =
      session.user?.role === "jobseeker" ? "/dashboard/jobseeker" : "/";

    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
