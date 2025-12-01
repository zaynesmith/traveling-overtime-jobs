import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import { US_STATES } from "@/lib/constants/states";

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
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [modalJobId, setModalJobId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [stateFilter, setStateFilter] = useState("all");
  const [dateSort, setDateSort] = useState("desc");
  const [applicantSort, setApplicantSort] = useState("default");
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const { success, ...rest } = router.query || {};
    if (success === "updated") {
      setSuccessMessage("Job updated successfully");
      setActionError(null);
      router.replace(
        {
          pathname: router.pathname,
          query: Object.keys(rest).length ? rest : undefined,
        },
        undefined,
        { shallow: true }
      );
    }
  }, [router, router.isReady, router.query]);

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

  const openDeleteModal = (jobId) => {
    setModalJobId(jobId);
    setActionError(null);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setModalJobId(null);
  };

  const handleDelete = async () => {
    if (!modalJobId) return;
    setDeleting(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/jobs/${modalJobId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Unable to delete job");
      }
      setJobs((current) => current.filter((job) => job.id !== modalJobId));
      setSuccessMessage("Job deleted successfully");
      setModalJobId(null);
    } catch (err) {
      setActionError(err.message || "Unable to delete job");
    } finally {
      setDeleting(false);
    }
  };

  const filteredAndSortedJobs = jobs
    .filter((job) => {
      if (stateFilter === "all") return true;
      const jobState = (job.state || "").toUpperCase();
      return jobState === stateFilter.toUpperCase();
    })
    .sort((a, b) => {
      const aTotal =
        typeof a.totalApplicants === "number"
          ? a.totalApplicants
          : Array.isArray(a.applications)
          ? a.applications.filter((application) => application.jobseeker).length
          : 0;
      const bTotal =
        typeof b.totalApplicants === "number"
          ? b.totalApplicants
          : Array.isArray(b.applications)
          ? b.applications.filter((application) => application.jobseeker).length
          : 0;

      const aNew =
        typeof a.newApplicantsCount === "number"
          ? a.newApplicantsCount
          : 0;
      const bNew =
        typeof b.newApplicantsCount === "number"
          ? b.newApplicantsCount
          : 0;

      const aDate = a.posted_at ? new Date(a.posted_at).getTime() : 0;
      const bDate = b.posted_at ? new Date(b.posted_at).getTime() : 0;
      const dateComparison = dateSort === "desc" ? bDate - aDate : aDate - bDate;

      if (applicantSort === "most") {
        if (bTotal !== aTotal) return bTotal - aTotal;
        return dateComparison;
      }

      if (applicantSort === "fewest") {
        if (aTotal !== bTotal) return aTotal - bTotal;
        return dateComparison;
      }

      if (applicantSort === "new-first") {
        if (aNew > 0 && bNew === 0) return -1;
        if (bNew > 0 && aNew === 0) return 1;
        return dateComparison;
      }

      return dateComparison;
    });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Posted Jobs</h1>
        <p className="mt-2 text-sm text-gray-600">
          Track your active job postings and review applicants in one place.
        </p>
      </header>

      {successMessage ? (
        <p className="mb-4 rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700">
          {successMessage}
        </p>
      ) : null}
      {actionError ? (
        <p className="mb-4 rounded-xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700">
          {actionError}
        </p>
      ) : null}

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
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800">Sort by</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                <span className="text-xs uppercase tracking-wide text-gray-500">State</span>
                <select
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  value={stateFilter}
                  onChange={(event) => setStateFilter(event.target.value)}
                >
                  <option value="all">All states</option>
                  {US_STATES.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                <span className="text-xs uppercase tracking-wide text-gray-500">Date posted</span>
                <button
                  type="button"
                  onClick={() => setDateSort((current) => (current === "desc" ? "asc" : "desc"))}
                  className="inline-flex items-center justify-between rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-gray-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
                >
                  {dateSort === "desc" ? "Newest to oldest" : "Oldest to newest"}
                  <span className="ml-2 text-gray-500">↕</span>
                </button>
              </div>

              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                <span className="text-xs uppercase tracking-wide text-gray-500">Applicants</span>
                <select
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  value={applicantSort}
                  onChange={(event) => setApplicantSort(event.target.value)}
                >
                  <option value="default">Default</option>
                  <option value="most">Most applicants to fewest</option>
                  <option value="fewest">Fewest applicants to most</option>
                  <option value="new-first">Jobs with new applicants first</option>
                </select>
              </label>
            </div>
          </section>

          {filteredAndSortedJobs.map((job) => {
            const applicantCount =
              typeof job.totalApplicants === "number"
                ? job.totalApplicants
                : Array.isArray(job.applications)
                ? job.applications.filter((application) => application.jobseeker).length
                : 0;
            const newApplicants =
              typeof job.newApplicantsCount === "number" ? job.newApplicantsCount : 0;
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                        {applicantCount} applicant{applicantCount === 1 ? "" : "s"}
                      </span>
                      {newApplicants > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          {newApplicants} NEW
                        </span>
                      ) : null}
                    </div>
                    <Link
                      href={`/dashboard/employer/applicants/${job.id}`}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-500"
                    >
                      View applicants
                    </Link>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/dashboard/employer/edit-job/${job.id}`}
                    className="inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => openDeleteModal(job.id)}
                    className="inline-flex items-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalJobId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Are you sure you want to delete this job?
            </h2>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                disabled={deleting}
              >
                No
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Yes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
