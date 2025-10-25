import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import { normalizeTrade } from "@/lib/trades";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

function JobCard({ job, onEdit, onDelete, isEditing, formData, onFormChange, onSave, savingId }) {
  const location = job.city || job.state ? [job.city, job.state].filter(Boolean).join(", ") : job.location || job.zip || "";
  const totalApplicants = job.applicants?.length || 0;
  const newApplicants = job.applicants?.filter((app) => app.status === "pending").length || 0;

  return (
    <article
      id={`job-${job.id}`}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{job.title}</h2>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{normalizeTrade(job.trade) || "General"}</p>
          {location ? <p className="text-sm text-slate-600">{location}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-2 text-right text-sm text-slate-600">
          {job.posted_at ? <span>Posted {formatDate(job.posted_at)}</span> : null}
          <span>
            {totalApplicants} applicant{totalApplicants === 1 ? "" : "s"}
            {newApplicants > 0 ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {newApplicants} new
              </span>
            ) : null}
          </span>
        </div>
      </div>

      {isEditing ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor={`title-${job.id}`}>
                Job Title
              </label>
              <input
                id={`title-${job.id}`}
                name="title"
                value={formData.title}
                onChange={onFormChange}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor={`hourlyPay-${job.id}`}>
                Hourly Pay
              </label>
              <input
                id={`hourlyPay-${job.id}`}
                name="hourlyPay"
                value={formData.hourlyPay || ""}
                onChange={onFormChange}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor={`perDiem-${job.id}`}>
                Per Diem
              </label>
              <input
                id={`perDiem-${job.id}`}
                name="perDiem"
                value={formData.perDiem || ""}
                onChange={onFormChange}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor={`city-${job.id}`}>
                City
              </label>
              <input
                id={`city-${job.id}`}
                name="city"
                value={formData.city || ""}
                onChange={onFormChange}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor={`state-${job.id}`}>
                State
              </label>
              <input
                id={`state-${job.id}`}
                name="state"
                value={formData.state || ""}
                onChange={onFormChange}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor={`zip-${job.id}`}>
                ZIP
              </label>
              <input
                id={`zip-${job.id}`}
                name="zip"
                value={formData.zip || ""}
                onChange={onFormChange}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor={`description-${job.id}`}>
              Description
            </label>
            <textarea
              id={`description-${job.id}`}
              name="description"
              value={formData.description || ""}
              onChange={onFormChange}
              rows={5}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor={`additionalRequirements-${job.id}`}>
              Additional Requirements
            </label>
            <textarea
              id={`additionalRequirements-${job.id}`}
              name="additionalRequirements"
              value={formData.additionalRequirements || ""}
              onChange={onFormChange}
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onEdit(null)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(job.id)}
              disabled={savingId === job.id}
              className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingId === job.id ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <div className="flex items-center gap-4">
            <Link className="font-semibold text-sky-600 hover:text-sky-500" href={`/jobs/${job.id}`}>
              View public listing
            </Link>
            <button
              type="button"
              onClick={() => onEdit(job.id)}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Edit
            </button>
          </div>
          <button
            type="button"
            onClick={() => onDelete(job.id)}
            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      )}
    </article>
  );
}

export default function PostedJobsPage({ initialJobs, highlightId }) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState(null);

  const orderedJobs = useMemo(
    () =>
      [...jobs].sort((a, b) => {
        const dateA = a.posted_at ? new Date(a.posted_at).getTime() : 0;
        const dateB = b.posted_at ? new Date(b.posted_at).getTime() : 0;
        return dateB - dateA;
      }),
    [jobs],
  );

  useEffect(() => {
    if (highlightId) {
      const el = document.getElementById(`job-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-4", "ring-emerald-200");
        const timeout = setTimeout(() => {
          el.classList.remove("ring-4", "ring-emerald-200");
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }
    return undefined;
  }, [highlightId]);

  const handleEdit = (jobId) => {
    if (!jobId) {
      setEditingId(null);
      setFormState({});
      return;
    }

    const job = jobs.find((item) => item.id === jobId);
    if (!job) return;
    setEditingId(jobId);
    setFormState({
      title: job.title,
      hourlyPay: job.hourlyPay || "",
      perDiem: job.perDiem || "",
      city: job.city || "",
      state: job.state || "",
      zip: job.zip || "",
      description: job.description || "",
      additionalRequirements: job.additionalRequirements || "",
    });
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async (jobId) => {
    setSavingId(jobId);
    setMessage(null);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to update job");
      }

      setJobs((current) => current.map((job) => (job.id === jobId ? { ...job, ...payload } : job)));
      setEditingId(null);
      setFormState({});
      setMessage({ type: "success", text: "Job updated successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Unable to update job" });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm("Delete this job listing?")) return;
    setMessage(null);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to delete job");
      }

      setJobs((current) => current.filter((job) => job.id !== jobId));
      setMessage({ type: "success", text: "Job deleted." });
      if (router.query.created === jobId) {
        const nextQuery = { ...router.query };
        delete nextQuery.created;
        router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Unable to delete job" });
    }
  };

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Posted Jobs</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Manage your listings</h1>
          <p className="text-sm text-slate-600">
            Edit details, track applicants, and keep your job board up to date. Newly created jobs appear at the top of the list.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            href="/dashboard/employer/post-job"
          >
            Post another job
          </Link>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{jobs.length} active listing{jobs.length === 1 ? "" : "s"}</span>
        </div>

        {message ? (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <div className="space-y-6">
          {orderedJobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              You haven&apos;t posted any jobs yet. <Link className="font-semibold text-sky-600" href="/dashboard/employer/post-job">Create your first listing.</Link>
            </div>
          ) : (
            orderedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isEditing={editingId === job.id}
                formData={formState}
                onFormChange={handleFormChange}
                onSave={handleSave}
                savingId={savingId}
              />
            ))
          )}
        </div>
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
              include: {
                jobseekerprofile: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    const initialJobs = (employerProfile?.jobs || []).map((job) => ({
      id: job.id,
      title: job.title,
      trade: job.trade,
      description: job.description,
      city: job.city,
      state: job.state,
      zip: job.zip,
      location: job.location,
      hourlyPay: job.hourlyPay,
      perDiem: job.perDiem,
      posted_at: job.posted_at?.toISOString?.() ?? job.posted_at,
      additionalRequirements: job.additionalRequirements,
      applicants: job.applications.map((application) => ({
        id: application.id,
        status: application.status,
        applied_at: application.applied_at?.toISOString?.() ?? application.applied_at,
        jobseeker: {
          firstName: application.jobseekerprofile?.firstName || "",
          lastName: application.jobseekerprofile?.lastName || "",
          email: application.jobseekerprofile?.email || "",
        },
      })),
    }));

    return {
      props: {
        initialJobs,
        highlightId: context.query?.created || null,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        initialJobs: [],
        highlightId: context.query?.created || null,
      },
    };
  }
}
