import { useEffect, useMemo, useState } from "react";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

const TABS = ["Profile", "Job Search", "Applications", "Activity", "Settings"];
const profileFields = [
  { name: "firstName", label: "First Name" },
  { name: "lastName", label: "Last Name" },
  { name: "email", label: "Email" },
  { name: "trade", label: "Primary Trade" },
  { name: "address1", label: "Address Line 1" },
  { name: "address2", label: "Address Line 2" },
  { name: "city", label: "City" },
  { name: "state", label: "State" },
  { name: "zip", label: "ZIP" },
];

const defaultJobFilters = {
  keyword: "",
  trade: "",
  zip: "",
  radius: "50",
};

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

export default function JobseekerDashboard({ initialProfile, applications, lastActive, bumpEligible }) {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [profile, setProfile] = useState(() => ({
    ...initialProfile,
    resumeUrl: initialProfile?.resumeUrl || initialProfile?.resumeurl || initialProfile?.resumeURL || "",
  }));
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);

  const [jobFilters, setJobFilters] = useState(defaultJobFilters);
  const [jobResults, setJobResults] = useState([]);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState(null);

  const [applicationList, setApplicationList] = useState(applications);
  const [lastActiveDate, setLastActiveDate] = useState(lastActive);
  const [canBump, setCanBump] = useState(bumpEligible);
  const [bumpMessage, setBumpMessage] = useState(null);
  const [bumpLoading, setBumpLoading] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (jobFilters.keyword) params.set("keyword", jobFilters.keyword);
    if (jobFilters.trade) params.set("trade", jobFilters.trade);
    if (jobFilters.zip) {
      params.set("zip", jobFilters.zip);
      if (jobFilters.radius) params.set("radius", jobFilters.radius);
    }
    return params.toString();
  }, [jobFilters]);

  useEffect(() => {
    async function loadJobs() {
      setJobLoading(true);
      setJobError(null);
      try {
        const response = await fetch(`/api/jobs/list${queryString ? `?${queryString}` : ""}`);
        if (!response.ok) throw new Error("Unable to load jobs");
        const data = await response.json();
        setJobResults(Array.isArray(data) ? data : []);
      } catch (error) {
        setJobError(error.message || "Unable to load jobs");
        setJobResults([]);
      } finally {
        setJobLoading(false);
      }
    }

    if (activeTab === "Job Search") {
      loadJobs();
    }
  }, [activeTab, queryString]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setResumeFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setResumeFile({
        fileName: file.name,
        fileType: file.type,
        base64: reader.result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const response = await fetch("/api/profile/jobseeker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, resume: resumeFile }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to save profile");
      }
      setProfile((current) => {
        const next = { ...current, ...payload };
        if (payload?.resumeUrl || payload?.resumeurl || payload?.resumeURL) {
          next.resumeUrl = payload.resumeUrl || payload.resumeurl || payload.resumeURL;
        }
        return next;
      });
      setResumeFile(null);
      setProfileMessage({ type: "success", text: "Profile updated successfully." });
    } catch (error) {
      setProfileMessage({ type: "error", text: error.message || "Failed to save profile" });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleJobFilterChange = (event) => {
    const { name, value } = event.target;
    setJobFilters((current) => ({ ...current, [name]: value }));
  };

  const handleApply = async (jobId) => {
    try {
      const response = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to apply");
      }
      setApplicationList((current) => {
        const exists = current.find((item) => item.job_id === payload.job_id);
        if (exists) return current;
        return [payload, ...current];
      });
      alert("Application submitted!");
    } catch (error) {
      alert(error.message || "Unable to apply");
    }
  };

  const handleBump = async () => {
    setBumpLoading(true);
    setBumpMessage(null);
    try {
      const response = await fetch("/api/profile/bump", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to bump resume");
      }
      setLastActiveDate(payload.lastActive || new Date().toISOString());
      setCanBump(false);
      setBumpMessage({ type: "success", text: "Resume bumped! You're back on top." });
    } catch (error) {
      setBumpMessage({ type: "error", text: error.message || "Unable to bump resume" });
    } finally {
      setBumpLoading(false);
    }
  };

  const renderProfileTab = () => (
    <form onSubmit={handleProfileSave} className="space-y-6 rounded-lg border border-slate-700 bg-slate-800 p-6 shadow">
      <div>
        <h2 className="text-2xl font-semibold text-white">Your Profile</h2>
        <p className="text-sm text-slate-400">
          Keep your contact details and trade information up to date so employers can reach you fast.
        </p>
      </div>

      {profileMessage ? (
        <div
          className={`rounded-md px-4 py-2 text-sm font-semibold ${
            profileMessage.type === "success"
              ? "bg-emerald-500/20 text-emerald-200"
              : "bg-red-500/20 text-red-200"
          }`}
        >
          {profileMessage.text}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {profileFields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-semibold text-slate-200">{field.label}</label>
            <input
              name={field.name}
              value={profile[field.name] || ""}
              onChange={handleProfileChange}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-200">Resume File</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleResumeChange}
            className="mt-1 w-full rounded-md border border-dashed border-slate-600 bg-slate-900 p-2 text-sm text-slate-200"
          />
          {resumeFile ? (
            <p className="mt-2 text-xs text-amber-300">Selected: {resumeFile.fileName}</p>
          ) : profile.resumeUrl ? (
            <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-amber-300">
              View current resume
            </a>
          ) : (
            <p className="mt-2 text-xs text-slate-500">No resume uploaded yet.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={profileSaving}
          className="rounded-md bg-amber-500 px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {profileSaving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </form>
  );

  const renderJobSearch = () => (
    <div className="space-y-6">
      <form
        onSubmit={(event) => event.preventDefault()}
        className="grid gap-4 rounded-lg border border-slate-700 bg-slate-800 p-6 shadow md:grid-cols-4"
      >
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-200">Keyword</label>
          <input
            name="keyword"
            value={jobFilters.keyword}
            onChange={handleJobFilterChange}
            placeholder="Job title or contractor"
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-slate-100 focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-200">Trade</label>
          <input
            name="trade"
            value={jobFilters.trade}
            onChange={handleJobFilterChange}
            placeholder="e.g. Millwright"
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-slate-100 focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-200">ZIP</label>
          <input
            name="zip"
            value={jobFilters.zip}
            onChange={handleJobFilterChange}
            placeholder="Near ZIP"
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
            value={jobFilters.radius}
            onChange={handleJobFilterChange}
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-slate-100 focus:border-amber-400 focus:outline-none"
          />
        </div>
      </form>

      {jobLoading ? (
        <div className="rounded border border-slate-700 bg-slate-800 p-6 text-center text-slate-300">Searching…</div>
      ) : jobError ? (
        <div className="rounded border border-red-500 bg-red-900/30 p-6 text-center text-red-200">{jobError}</div>
      ) : jobResults.length === 0 ? (
        <div className="rounded border border-slate-700 bg-slate-800 p-6 text-center text-slate-400">
          No matching jobs yet. Adjust your filters and try again.
        </div>
      ) : (
        <div className="space-y-4">
          {jobResults.map((job) => (
            <article key={job.id} className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-semibold text-white">{job.title}</h3>
                {job.payrate ? (
                  <span className="rounded bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-300">
                    {job.payrate}
                  </span>
                ) : null}
              </div>
              <p className="text-sm uppercase tracking-wide text-amber-400">{job.trade || "General"}</p>
              <p className="mt-1 text-slate-300">{job.location || job.zip || "Location TBD"}</p>
              <p className="mt-3 text-sm text-slate-400 line-clamp-2">
                {job.description || "No description provided."}
              </p>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleApply(job.id)}
                  className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
                >
                  Apply
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const renderApplications = () => (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Your Applications</h2>
      {applicationList.length === 0 ? (
        <div className="rounded border border-slate-700 bg-slate-800 p-6 text-center text-slate-400">
          You haven't applied to any jobs yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {applicationList.map((app) => (
            <li key={app.id} className="rounded border border-slate-700 bg-slate-800 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-white">{app.jobs?.title || "Job"}</p>
                  <p className="text-sm text-slate-300">{app.jobs?.trade || "General"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-amber-300 capitalize">{app.status || "pending"}</p>
                  {app.applied_at ? (
                    <p className="text-xs text-slate-500">Applied {formatDate(app.applied_at)}</p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  const renderActivity = () => (
    <section className="space-y-4 rounded-lg border border-slate-700 bg-slate-800 p-6 shadow">
      <h2 className="text-xl font-semibold text-white">Stay Active</h2>
      <p className="text-sm text-slate-300">
        Boost your visibility by bumping your resume. Employers see the freshest profiles first.
      </p>
      <div className="rounded border border-slate-700 bg-slate-900/60 p-4 text-slate-200">
        <p className="text-sm">Last Active: {lastActiveDate ? formatDate(lastActiveDate) : "No activity yet"}</p>
      </div>
      {bumpMessage ? (
        <div
          className={`rounded-md px-4 py-2 text-sm font-semibold ${
            bumpMessage.type === "success"
              ? "bg-emerald-500/20 text-emerald-200"
              : "bg-red-500/20 text-red-200"
          }`}
        >
          {bumpMessage.text}
        </div>
      ) : null}
      <button
        onClick={handleBump}
        disabled={!canBump || bumpLoading}
        className="rounded-md bg-amber-500 px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {bumpLoading ? "Bumping…" : canBump ? "Bump Resume" : "Available again soon"}
      </button>
      {!canBump ? (
        <p className="text-xs text-slate-400">
          Resume bumps unlock every 7 days. Check back soon to stay on top of searches.
        </p>
      ) : null}
    </section>
  );

  const renderSettings = () => (
    <section className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow">
      <h2 className="text-xl font-semibold text-white">Account Settings</h2>
      <p className="mt-2 text-sm text-slate-300">
        Password updates and account deletion tools are coming soon. For now, contact support for assistance.
      </p>
    </section>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case "Profile":
        return renderProfileTab();
      case "Job Search":
        return renderJobSearch();
      case "Applications":
        return renderApplications();
      case "Activity":
        return renderActivity();
      case "Settings":
        return renderSettings();
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 py-12 px-4 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="text-white">
          <h1 className="text-3xl font-bold tracking-wide">Jobseeker HQ</h1>
          <p className="mt-2 text-slate-300">
            Polish your profile, track applications, and snag the next traveling overtime gig.
          </p>
        </header>

        <nav className="flex flex-wrap gap-3">
          {TABS.map((tab) => (
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
      include: { jobs: true },
      orderBy: { applied_at: "desc" },
    });

    const lastActive = profile?.lastActive ? profile.lastActive.toISOString?.() ?? profile.lastActive : null;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const bumpEligible = !lastActive || Date.now() - new Date(lastActive).getTime() >= sevenDaysMs;

    return {
      props: {
        initialProfile: JSON.parse(JSON.stringify(profile || {})),
        applications: JSON.parse(JSON.stringify(applications)),
        lastActive: lastActive,
        bumpEligible,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        initialProfile: {},
        applications: [],
        lastActive: null,
        bumpEligible: true,
      },
    };
  }
}
