// pages/jobseeker/search.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
  SignInButton,
} from "@clerk/nextjs";
import { useRequireRole } from "../../lib/useRequireRole";
import { useEffect, useMemo, useState } from "react";

// Some demo jobs to start with (you can remove later)
const DEMO_JOBS = [
  {
    id: "demo-001",
    title: "Journeyman Electrician",
    company: "ACME Industrial",
    location: "Houston, TX",
    trade: "Electrical",
    payRate: "$38/hr",
    perDiem: "$100/day",
    postedAt: "2025-09-30",
    description:
      "Industrial electrical work at refinery. 6x10s, PPE required. Travel + per diem.",
  },
  {
    id: "demo-002",
    title: "Electrical Foreman",
    company: "Gulf Process",
    location: "Corpus Christi, TX",
    trade: "Electrical",
    payRate: "$45/hr",
    perDiem: "$120/day",
    postedAt: "2025-10-02",
    description: "Oversee crews at petrochemical site. Long-term project.",
  },
  {
    id: "demo-003",
    title: "Millwright",
    company: "SteelCo",
    location: "Lake Charles, LA",
    trade: "Millwright",
    payRate: "$34/hr",
    perDiem: "$90/day",
    postedAt: "2025-09-25",
    description: "Install/align equipment. Shutdown schedule. Tools required.",
  },
];

export default function JobSearch() {
  const [q, setQ] = useState("");
  const [jobs, setJobs] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [appliedIds, setAppliedIds] = useState([]);
  const canView = useRequireRole("jobseeker");

  // Load demo + locally posted employer jobs
  useEffect(() => {
    let localJobs = [];
    try {
      const raw = localStorage.getItem("myEmployerJobs");
      localJobs = raw ? JSON.parse(raw) : [];
    } catch {
      localJobs = [];
    }

    // Mark locally posted jobs so we can show a small badge
    const normalizedLocal = localJobs.map((j) => ({
      ...j,
      postedHere: true,
    }));

    const combined = [...normalizedLocal, ...DEMO_JOBS];

    // newest first if dates exist
    combined.sort((a, b) => {
      const ad = new Date(a.postedAt || 0).getTime();
      const bd = new Date(b.postedAt || 0).getTime();
      return bd - ad;
    });

    setJobs(combined);

    // Load saved/applied
    try {
      const rawSaved = localStorage.getItem("savedJobs");
      setSavedIds(rawSaved ? JSON.parse(rawSaved) : []);
    } catch {
      setSavedIds([]);
    }
    try {
      const rawApps = localStorage.getItem("applications");
      const apps = rawApps ? JSON.parse(rawApps) : [];
      setAppliedIds(apps.map((a) => String(a.jobId)));
    } catch {
      setAppliedIds([]);
    }
  }, []);

  // Save/unsave
  function toggleSave(id) {
    const sid = String(id);
    let next;
    if (savedIds.includes(sid)) {
      next = savedIds.filter((x) => x !== sid);
    } else {
      next = [sid, ...savedIds];
    }
    setSavedIds(next);
    try {
      localStorage.setItem("savedJobs", JSON.stringify(next));
    } catch {}
  }

  // Apply (demo)
  function applyNow(job) {
    try {
      const raw = localStorage.getItem("applications");
      const apps = raw ? JSON.parse(raw) : [];
      if (apps.some((a) => String(a.jobId) === String(job.id))) {
        alert("You already applied to this job (demo).");
        return;
      }
      const newApp = {
        id: "app-" + Date.now(),
        jobId: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        submittedAt: new Date().toISOString(),
        status: "Submitted",
      };
      const next = [newApp, ...apps];
      localStorage.setItem("applications", JSON.stringify(next));
      setAppliedIds([String(job.id), ...appliedIds]);
      alert("Application submitted (demo). Check My Applications.");
    } catch (e) {
      console.error(e);
      alert("Could not save your application. Try again.");
    }
  }

  // Filter results
  const results = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return jobs;
    return jobs.filter((j) =>
      [j.title, j.company, j.location, j.trade, j.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(kw)
    );
  }, [q, jobs]);

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/jobseeker/search" />
      </SignedOut>

      <SignedIn>
        {canView ? (
          <main className="container">
          <header className="max960" style={header}>
            <h1 style={{ margin: 0 }}>Search Jobs</h1>
            <UserButton afterSignOutUrl="/" />
          </header>

          {/* Filters */}
          <section className="card max960" style={{ display: "grid", gap: 12 }}>
            <input
              className="input"
              placeholder="Title, company, location, or trade…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div style={{ color: "#666", fontSize: 13 }}>
              Showing {results.length} result{results.length === 1 ? "" : "s"}
            </div>
          </section>

          {/* Results */}
          <section className="max960" style={{ display: "grid", gap: 12 }}>
            {results.map((j) => {
              const isSaved = savedIds.includes(String(j.id));
              const isApplied = appliedIds.includes(String(j.id));
              return (
                <div key={j.id} className="card" style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <strong style={{ fontSize: 16 }}>{j.title}</strong>
                        {j.postedHere ? (
                          <span style={badge}>Posted here</span>
                        ) : null}
                      </div>
                      <div style={{ color: "#555" }}>
                        {j.company} • {j.location}
                        {j.trade ? ` • ${j.trade}` : ""}
                      </div>
                      {(j.payRate || j.perDiem) && (
                        <div style={{ color: "#333" }}>
                          {j.payRate && <><strong>Pay:</strong> {j.payRate}</>}
                          {j.perDiem && <> • <strong>Per Diem:</strong> {j.perDiem}</>}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a href={`/jobs/${j.id}`} className="pill-light">View</a>

                      {/* Apply button (requires sign-in; we are already SignedIn here) */}
                      {isApplied ? (
                        <span style={{ ...badge, background: "#eaffea", borderColor: "#bfe6bf", color: "#225c22" }}>
                          Applied
                        </span>
                      ) : (
                        <button className="btn" onClick={() => applyNow(j)}>
                          Apply
                        </button>
                      )}

                      {/* Save/Unsave (works signed-in or signed-out since it's local) */}
                      <button
                        className="btn-outline"
                        onClick={() => toggleSave(j.id)}
                        title={isSaved ? "Remove from Saved" : "Save Job"}
                      >
                        {isSaved ? "Unsave" : "Save"}
                      </button>
                    </div>
                  </div>

                  {j.description ? (
                    <p style={{ margin: "4px 0 0 0", color: "#444" }}>
                      {j.description}
                    </p>
                  ) : null}
                </div>
              );
            })}

            {results.length === 0 && (
              <div className="card" style={{ color: "#666" }}>
                No results. Try a different keyword (e.g., “electrician”, “Houston”, or “foreman”).
              </div>
            )}
          </section>

          {/* Signed-out inline prompt (only shown if user signs out mid-session) */}
          <SignedOut>
            <section className="max960" style={{ marginTop: 16 }}>
              <SignInButton>
                <button className="btn">Sign in to apply</button>
              </SignInButton>
            </section>
          </SignedOut>
          </main>
        ) : null}
      </SignedIn>
    </>
  );
}

/* --- small styles used above --- */
const header = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const badge = {
  fontSize: 12,
  padding: "2px 8px",
  borderRadius: 999,
  background: "#f1f5ff",
  border: "1px solid #d5defa",
  color: "#1b3aa7",
};
