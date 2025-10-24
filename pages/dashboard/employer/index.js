import { useCallback, useRef, useState } from "react";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import Link from "next/link";
import TRADES from "@/lib/trades";

const defaultJobForm = {
  title: "",
  trade: "",
  description: "",
  location: "",
  zip: "",
  payrate: "",
};

const defaultResumeFilters = {
  trade: "",
  zip: "",
  radius: "50",
  keyword: "",
};

const cardContainer =
  "bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg p-6 transition";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

function formatLastActive(value) {
  if (!value) return { label: "No recent activity", isFresh: false };
  const last = new Date(value).getTime();
  if (Number.isNaN(last)) return { label: "No recent activity", isFresh: false };
  const now = Date.now();
  const diffMs = Math.max(now - last, 0);
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return {
    label: days === 0 ? "Active today" : `Active ${days} day${days === 1 ? "" : "s"} ago`,
    isFresh: diffMs <= 7 * 24 * 60 * 60 * 1000,
  };
}

export default function EmployerDashboard({ initialJobs, initialSaved, subscription }) {
  const [jobForm, setJobForm] = useState(defaultJobForm);
  const [jobs, setJobs] = useState(initialJobs);
  const [jobMessage, setJobMessage] = useState(null);
  const [jobLoading, setJobLoading] = useState(false);

  const [resumeFilters, setResumeFilters] = useState(defaultResumeFilters);
  const [resumeResults, setResumeResults] = useState([]);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState(null);

  const [savedCandidates, setSavedCandidates] = useState(initialSaved);
  const [savedLoading, setSavedLoading] = useState(false);

  const postJobRef = useRef(null);
  const resumeRef = useRef(null);
  const savedRef = useRef(null);

  const fetchEmployerJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/jobs/list?employer=mine");
      if (!response.ok) throw new Error("Unable to fetch jobs");
      const data = await response.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const refreshSavedCandidates = useCallback(async () => {
    setSavedLoading(true);
    try {
      const response = await fetch("/api/candidates/save");
      if (!response.ok) throw new Error("Unable to load saved candidates");
      const payload = await response.json();
      setSavedCandidates(Array.isArray(payload?.saved) ? payload.saved : []);
    } catch (error) {
      console.error(error);
    } finally {
      setSavedLoading(false);
    }
  }, []);

  const handleJobChange = (event) => {
    const { name, value } = event.target;
    setJobForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateJob = async (event) => {
    event.preventDefault();
    setJobLoading(true);
    setJobMessage(null);
    try {
      const response = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobForm),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to create job");
      }
      setJobMessage({ type: "success", text: "Job posted successfully." });
      setJobForm(defaultJobForm);
      await fetchEmployerJobs();
    } catch (error) {
      setJobMessage({ type: "error", text: error.message || "Unable to create job" });
    } finally {
      setJobLoading(false);
    }
  };

  const handleResumeFilterChange = (event) => {
    const { name, value } = event.target;
    setResumeFilters((current) => ({ ...current, [name]: value }));
  };

  const handleResumeSearch = async (event) => {
    event.preventDefault();
    setResumeLoading(true);
    setResumeError(null);
    try {
      const params = new URLSearchParams();
      if (resumeFilters.trade) params.set("trade", resumeFilters.trade);
      if (resumeFilters.zip) params.set("zip", resumeFilters.zip);
      if (resumeFilters.radius) params.set("radius", resumeFilters.radius);
      if (resumeFilters.keyword) params.set("keyword", resumeFilters.keyword);

      const response = await fetch(`/api/resumes/search?${params.toString()}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Resume search failed");
      }
      const data = await response.json();
      setResumeResults(Array.isArray(data) ? data : []);
    } catch (error) {
      setResumeError(error.message || "Resume search failed");
      setResumeResults([]);
    } finally {
      setResumeLoading(false);
    }
  };

  const handleSaveCandidate = async (jobseekerId) => {
    if (!jobseekerId) return;
    try {
      const response = await fetch("/api/candidates/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobseekerId }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Unable to save candidate");
      }
      await refreshSavedCandidates();
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to save candidate");
    }
  };

  const renderPostJobCard = () => {
    return (
      <section id="post-job" ref={postJobRef} className={cardContainer}>
        <div className="flex h-full flex-col">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Post a Job</h2>
            <p className="mb-4 text-sm text-gray-600">
              Share your next traveling overtime opportunity with our community.
            </p>
          </div>

          {jobMessage ? (
            <div
              className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${
                jobMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {jobMessage.text}
            </div>
          ) : null}

          <form onSubmit={handleCreateJob} className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700">Title</label>
                <input
                  name="title"
                  value={jobForm.title}
                  onChange={handleJobChange}
                  required
                  className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700">Trade</label>
                <select
                  name="trade"
                  value={jobForm.trade}
                  onChange={handleJobChange}
                  required
                  className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                >
                  <option value="" disabled>
                    Select a trade
                  </option>
                  {TRADES.map((trade) => (
                    <option key={trade} value={trade}>
                      {trade}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700">Location</label>
                <input
                  name="location"
                  value={jobForm.location}
                  onChange={handleJobChange}
                  className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700">ZIP</label>
                <input
                  name="zip"
                  value={jobForm.zip}
                  onChange={handleJobChange}
                  className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700">Pay Rate</label>
                <input
                  name="payrate"
                  value={jobForm.payrate}
                  onChange={handleJobChange}
                  className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  name="description"
                  value={jobForm.description}
                  onChange={handleJobChange}
                  required
                  rows={6}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={jobLoading}
                className="rounded-lg bg-sky-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {jobLoading ? "Posting…" : "Post Job"}
              </button>
            </div>
          </form>
        </div>
      </section>
    );
  };

  const renderPostedJobsCard = () => {
    const previewJobs = jobs.slice(0, 4);
    return (
      <section className={cardContainer}>
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Posted Jobs</h2>
              <p className="mb-4 text-sm text-gray-600">Quick snapshot of your most recent listings.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                postJobRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="text-sm font-semibold text-sky-600 hover:text-sky-500"
            >
              See all
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
              You haven&apos;t posted any jobs yet.
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {previewJobs.map((job) => (
                <li
                  key={job.id}
                  className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/70"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-slate-900">{job.title}</h3>
                    <span className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                      {job.trade || "General"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{job.location || job.zip || "Location TBD"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {job.payrate ? <span>{job.payrate}</span> : null}
                    {job.posted_at ? <span>Posted {formatDate(job.posted_at)}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    );
  };

  const renderResumeCard = () => {
    const resumePreview = resumeResults.slice(0, 3);
    return (
      <section id="resume-search" ref={resumeRef} className={cardContainer}>
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Resume Search</h2>
              <p className="mb-4 text-sm text-gray-600">Filter by trade and distance to find your next hire.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                resumeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="text-sm font-semibold text-sky-600 hover:text-sky-500"
            >
              See all
            </button>
          </div>

          <form onSubmit={handleResumeSearch} className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700">Trade</label>
              <select
                name="trade"
                value={resumeFilters.trade}
                onChange={handleResumeFilterChange}
                className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              >
                <option value="">Any trade</option>
                {TRADES.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700">ZIP</label>
              <input
                name="zip"
                value={resumeFilters.zip}
                onChange={handleResumeFilterChange}
                placeholder="Search radius origin"
                className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700">Distance</label>
              <select
                name="radius"
                value={resumeFilters.radius}
                onChange={handleResumeFilterChange}
                className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              >
                {[25, 50, 100, 250, 500].map((distance) => (
                  <option key={distance} value={distance}>
                    Within {distance} miles
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700">Keyword</label>
              <input
                name="keyword"
                value={resumeFilters.keyword}
                onChange={handleResumeFilterChange}
                placeholder="Name, city, or trade"
                className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={resumeLoading}
                className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resumeLoading ? "Searching…" : "Search"}
              </button>
            </div>
          </form>

          {resumeError ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{resumeError}</div>
          ) : null}

          <div className="mt-6 space-y-4">
            {resumeResults.length === 0 && !resumeLoading ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                No resumes match your filters yet. Try broadening your search.
              </div>
            ) : (
              resumePreview.map((resume) => {
                const activity = formatLastActive(resume.lastActive);
                const cityState = [resume.city, resume.state].filter(Boolean).join(", ");
                const resumeUrl = resume.resumeUrl || resume.resumeurl;
                return (
                  <article
                    key={resume.id}
                    className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/70"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {[resume.firstName, resume.lastName].filter(Boolean).join(" ") || "Unnamed Candidate"}
                        </h3>
                        <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                          {resume.trade || "Various trades"}
                        </p>
                        <p className="text-sm text-slate-600">{cityState || "Location not provided"}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-xs text-slate-500">
                        <span className="font-medium text-slate-600">{activity.label}</span>
                        {activity.isFresh ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                            Active within 7 days
                          </span>
                        ) : null}
                        {resumeUrl ? (
                          <a
                            href={resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-sky-600 hover:text-sky-500"
                          >
                            View Resume
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => handleSaveCandidate(resume.id)}
                        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
                      >
                        ⭐ Save Candidate
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>
    );
  };

  const renderSavedCandidatesCard = () => {
    const previewCandidates = savedCandidates.slice(0, 4);
    return (
      <section id="saved-candidates" ref={savedRef} className={cardContainer}>
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Saved Candidates</h2>
              <p className="mb-4 text-sm text-gray-600">Keep track of prospects you want to revisit.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={refreshSavedCandidates}
                className="text-sm font-semibold text-slate-500 hover:text-slate-700"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() =>
                  savedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="text-sm font-semibold text-sky-600 hover:text-sky-500"
              >
                See all
              </button>
            </div>
          </div>

          {savedLoading ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
              Loading…
            </div>
          ) : previewCandidates.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
              You haven&apos;t saved any candidates yet.
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {previewCandidates.map((item) => {
                const profile = item.jobseekerprofile || {};
                const resumeUrl = profile.resumeUrl || profile.resumeurl;
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/70"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-900">
                          {[profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Unnamed Candidate"}
                        </p>
                        <p className="text-sm text-slate-600">{profile.trade || "Various trades"}</p>
                        <p className="text-xs text-slate-500">Saved {formatDate(item.saved_at)}</p>
                      </div>
                      <div>
                        {resumeUrl ? (
                          <a
                            href={resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
                          >
                            Quick View
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">No resume uploaded</span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    );
  };

  const renderBillingCard = () => {
    const tier = subscription?.tier || "basic";
    const status = subscription?.status || "free";
    const formatLabel = (value) => value.charAt(0).toUpperCase() + value.slice(1);

    return (
      <section className={cardContainer}>
        <div className="flex h-full flex-col">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Billing &amp; Tier Info</h2>
          <p className="mb-4 text-sm text-gray-600">
            Review your current plan and update payment details anytime.
          </p>

          <dl className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current Tier</dt>
              <dd className="text-lg font-semibold text-gray-800">{formatLabel(tier)}</dd>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</dt>
              <dd className="text-lg font-semibold text-gray-800">{formatLabel(status)}</dd>
            </div>
          </dl>

          <Link
            href="/dashboard/employer/billing"
            className="inline-flex w-fit items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
          >
            Manage Billing
          </Link>
        </div>
      </section>
    );
  };

  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold text-slate-900">Employer Dashboard</h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Manage job postings, scout resumes, and keep tabs on billing in one streamlined workspace.
          </p>
        </header>

        <div className="mt-6 flex justify-center">
          <Link
            href="/dashboard/employer"
            className="inline-flex items-center justify-center rounded-lg border border-sky-600 px-5 py-2 text-sm font-semibold text-sky-600 shadow-sm transition hover:bg-sky-50"
          >
            Dashboard
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {renderPostJobCard()}
          {renderPostedJobsCard()}
          {renderResumeCard()}
          {renderSavedCandidatesCard()}
          {renderBillingCard()}
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
        },
        savedCandidates: {
          orderBy: { saved_at: "desc" },
          include: {
            jobseekerprofile: true,
          },
        },
      },
    });

    return {
      props: {
        initialJobs: JSON.parse(JSON.stringify(employerProfile?.jobs ?? [])),
        initialSaved: JSON.parse(JSON.stringify(employerProfile?.savedCandidates ?? [])),
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
        initialJobs: [],
        initialSaved: [],
        subscription: { status: "free", tier: "basic" },
      },
    };
  }
}
