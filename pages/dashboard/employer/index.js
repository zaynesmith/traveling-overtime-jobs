import { useCallback, useMemo, useState } from "react";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

const JOB_TABS = ["Post Job", "Search Resumes", "Saved Candidates", "Billing"];
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

export default function EmployerDashboard({ initialJobs, trades, initialSaved, subscription }) {
  const [activeTab, setActiveTab] = useState(JOB_TABS[0]);
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

  const tradeOptions = useMemo(() => trades.filter(Boolean), [trades]);

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

  const renderJobsSection = () => (
    <div className="space-y-6">
      <form onSubmit={handleCreateJob} className="space-y-4 rounded-lg border border-slate-700 bg-slate-800 p-6 shadow">
        <div>
          <h2 className="text-xl font-semibold text-white">Post a Job</h2>
          <p className="text-sm text-slate-400">
            Share your next traveling overtime opportunity with our community.
          </p>
        </div>

        {jobMessage ? (
          <div
            className={`rounded-md px-4 py-2 text-sm font-semibold ${
              jobMessage.type === "success"
                ? "bg-emerald-500/20 text-emerald-200"
                : "bg-red-500/20 text-red-200"
            }`}
          >
            {jobMessage.text}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-slate-200">Title</label>
            <input
              name="title"
              value={jobForm.title}
              onChange={handleJobChange}
              required
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-200">Trade</label>
            <input
              name="trade"
              value={jobForm.trade}
              onChange={handleJobChange}
              required
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-200">Location</label>
            <input
              name="location"
              value={jobForm.location}
              onChange={handleJobChange}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-200">ZIP</label>
            <input
              name="zip"
              value={jobForm.zip}
              onChange={handleJobChange}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-200">Pay Rate</label>
            <input
              name="payrate"
              value={jobForm.payrate}
              onChange={handleJobChange}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-200">Description</label>
            <textarea
              name="description"
              value={jobForm.description}
              onChange={handleJobChange}
              required
              rows={6}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-3 text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={jobLoading}
            className="rounded-md bg-amber-500 px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {jobLoading ? "Posting…" : "Post Job"}
          </button>
        </div>
      </form>

      <section className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow">
        <h2 className="text-xl font-semibold text-white">Your Job Listings</h2>
        <p className="text-sm text-slate-400">Recent postings appear here for quick reference.</p>
        {jobs.length === 0 ? (
          <div className="mt-6 rounded border border-slate-700 bg-slate-900/60 p-4 text-center text-slate-400">
            You haven&apos;t posted any jobs yet.
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {jobs.map((job) => (
              <li key={job.id} className="rounded border border-slate-700 bg-slate-900/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                  <span className="text-xs uppercase tracking-wide text-amber-400">{job.trade || "General"}</span>
                </div>
                <p className="text-sm text-slate-300">{job.location || job.zip || "Location TBD"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  {job.payrate ? <span>{job.payrate}</span> : null}
                  {job.posted_at ? <span>Posted {formatDate(job.posted_at)}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );

  const renderResumeSection = () => (
    <div className="space-y-6">
      <form onSubmit={handleResumeSearch} className="grid gap-4 rounded-lg border border-slate-700 bg-slate-800 p-6 shadow md:grid-cols-4">
        <div>
          <label className="block text-sm font-semibold text-slate-200">Trade</label>
          <select
            name="trade"
            value={resumeFilters.trade}
            onChange={handleResumeFilterChange}
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-slate-100 focus:border-amber-400 focus:outline-none"
          >
            <option value="">All Trades</option>
            {tradeOptions.map((trade) => (
              <option key={trade} value={trade}>
                {trade}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-200">ZIP</label>
          <input
            name="zip"
            value={resumeFilters.zip}
            onChange={handleResumeFilterChange}
            placeholder="Search radius origin"
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-slate-100 focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-200">Radius (miles)</label>
          <input
            type="number"
            name="radius"
            min="10"
            max="500"
            step="10"
            value={resumeFilters.radius}
            onChange={handleResumeFilterChange}
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-slate-100 focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-200">Keyword</label>
          <input
            name="keyword"
            value={resumeFilters.keyword}
            onChange={handleResumeFilterChange}
            placeholder="Name, city, or trade"
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-slate-100 focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div className="md:col-span-4 flex justify-end">
          <button
            type="submit"
            disabled={resumeLoading}
            className="rounded-md bg-amber-500 px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resumeLoading ? "Searching…" : "Search Resumes"}
          </button>
        </div>
      </form>

      {resumeError ? (
        <div className="rounded-md border border-red-500 bg-red-900/30 p-4 text-red-200">{resumeError}</div>
      ) : null}

      <section className="space-y-4">
        {resumeResults.length === 0 && !resumeLoading ? (
          <div className="rounded border border-slate-700 bg-slate-800 p-6 text-center text-slate-400">
            No resumes match your filters yet. Try broadening your search.
          </div>
        ) : (
          resumeResults.map((resume) => {
            const activity = formatLastActive(resume.lastActive);
            const cityState = [resume.city, resume.state].filter(Boolean).join(", ");
            const resumeUrl = resume.resumeUrl || resume.resumeurl;
            return (
              <article key={resume.id} className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {[resume.firstName, resume.lastName].filter(Boolean).join(" ") || "Unnamed Candidate"}
                    </h3>
                    <p className="text-sm uppercase tracking-wide text-amber-400">{resume.trade || "Various trades"}</p>
                    <p className="text-sm text-slate-300">{cityState || "Location not provided"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-semibold text-slate-200">{activity.label}</span>
                    {activity.isFresh ? (
                      <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-200">
                        Active within 7 days
                      </span>
                    ) : null}
                    {resumeUrl ? (
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-amber-300 hover:text-amber-200"
                      >
                        View Resume
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => handleSaveCandidate(resume.id)}
                    className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
                  >
                    ⭐ Save Candidate
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );

  const renderSavedCandidates = () => (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Saved Candidates</h2>
        <button
          onClick={refreshSavedCandidates}
          className="rounded-md border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-500/10"
        >
          Refresh
        </button>
      </div>
      {savedLoading ? (
        <div className="rounded border border-slate-700 bg-slate-800 p-4 text-center text-slate-300">Loading…</div>
      ) : savedCandidates.length === 0 ? (
        <div className="rounded border border-slate-700 bg-slate-800 p-6 text-center text-slate-400">
          You haven&apos;t saved any candidates yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {savedCandidates.map((item) => {
            const profile = item.jobseekerprofile || {};
            const resumeUrl = profile.resumeUrl || profile.resumeurl;
            return (
              <li key={item.id} className="rounded border border-slate-700 bg-slate-800 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {[profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Unnamed Candidate"}
                    </p>
                    <p className="text-sm text-slate-300">{profile.trade || "Various trades"}</p>
                    <p className="text-xs text-slate-400">Saved {formatDate(item.saved_at)}</p>
                  </div>
                  <div>
                    {resumeUrl ? (
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-amber-500 px-3 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-500/10"
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
    </section>
  );

  const renderBilling = () => (
    <section className="space-y-4 rounded-lg border border-slate-700 bg-slate-800 p-6 shadow">
      <h2 className="text-xl font-semibold text-white">Billing & Subscription</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-400">Current Tier</p>
          <p className="text-2xl font-bold text-white capitalize">{subscription.tier}</p>
        </div>
        <div className="rounded border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-400">Status</p>
          <p className="text-2xl font-bold text-white capitalize">{subscription.status}</p>
        </div>
      </div>
      <div className="rounded border border-dashed border-amber-500/40 bg-slate-900/60 p-4 text-center text-slate-300">
        Stripe-powered upgrades are coming soon. Stay tuned for premium analytics and boosted listings.
      </div>
      <div className="flex justify-end">
        <button className="rounded-md bg-amber-500 px-6 py-2 text-sm font-semibold text-slate-900 opacity-70" disabled>
          Upgrade (Coming Soon)
        </button>
      </div>
    </section>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case "Post Job":
        return renderJobsSection();
      case "Search Resumes":
        return renderResumeSection();
      case "Saved Candidates":
        return renderSavedCandidates();
      case "Billing":
        return renderBilling();
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 py-12 px-4 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-2 text-white">
          <h1 className="text-3xl font-bold tracking-wide">Employer Command Center</h1>
          <p className="text-slate-300">
            Manage your traveling crews, scout top resumes, and handle billing from one rugged dashboard.
          </p>
        </header>

        <nav className="flex flex-wrap gap-3">
          {JOB_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? "border-amber-500 bg-amber-500 text-slate-900"
                  : "border-slate-700 bg-slate-800 text-slate-200 hover:border-amber-500 hover:text-amber-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <section className="space-y-6 text-slate-200">{renderActiveTab()}</section>
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

    const trades = await prisma.jobseekerProfile.findMany({
      where: { trade: { not: null } },
      distinct: ["trade"],
      select: { trade: true },
    });

    return {
      props: {
        initialJobs: JSON.parse(JSON.stringify(employerProfile?.jobs ?? [])),
        trades: trades.map((item) => item.trade).filter(Boolean),
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
        trades: [],
        initialSaved: [],
        subscription: { status: "free", tier: "basic" },
      },
    };
  }
}
