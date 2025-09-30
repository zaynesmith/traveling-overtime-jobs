// pages/jobseeker/saved.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { RoleGateDenied, RoleGateLoading } from "../../components/RoleGateFeedback";
import { useRequireRole } from "../../lib/useRequireRole";
import { useRequireProfileCompletion } from "../../lib/useRequireProfileCompletion";
import { useEffect, useState } from "react";

export default function SavedJobs() {
  const { user } = useUser();
  const [savedIds, setSavedIds] = useState([]);
  const [jobs, setJobs] = useState([]);
  const { status, canView, error } = useRequireRole("jobseeker");
  const { status: profileStatus } = useRequireProfileCompletion(
    status === "authorized" ? "jobseeker" : null
  );

  // Load saved IDs and stitch them to job data (demo + locally posted)
  useEffect(() => {
    let ids = [];
    try {
      const rawSaved = localStorage.getItem("savedJobs");
      ids = rawSaved ? JSON.parse(rawSaved) : [];
    } catch {}
    setSavedIds(ids.map(String));

    let localJobs = [];
    try {
      const rawLocal = localStorage.getItem("myEmployerJobs");
      localJobs = rawLocal ? JSON.parse(rawLocal) : [];
    } catch {}

    // same demo list used elsewhere
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
      },
    ];

    const all = [...localJobs, ...DEMO_JOBS];
    const byId = new Map(all.map((j) => [String(j.id), j]));
    const savedJobs = ids
      .map((sid) => byId.get(String(sid)))
      .filter(Boolean);

    setJobs(savedJobs);
  }, []);

  function unsave(id) {
    const sid = String(id);
    const nextIds = savedIds.filter((x) => x !== sid);
    setSavedIds(nextIds);
    setJobs((prev) => prev.filter((j) => String(j.id) !== sid));
    try {
      localStorage.setItem("savedJobs", JSON.stringify(nextIds));
    } catch {}
  }

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/jobseeker/saved" />
      </SignedOut>

      <SignedIn>
        {status === "checking" || profileStatus === "loading" || profileStatus === "incomplete" ? (
          <RoleGateLoading role="jobseeker" />
        ) : canView ? (
          <main className="container">
            <header className="max960" style={header}>
              <h1 style={{ margin: 0 }}>Saved Jobs</h1>
              <UserButton afterSignOutUrl="/" />
            </header>

            <section className="max960" style={{ display: "grid", gap: 12 }}>
              {jobs.length === 0 ? (
                <div className="card" style={{ color: "#666" }}>
                  No saved jobs yet. Go to <a href="/jobseeker/search">Search</a> and click “Save”.
                </div>
              ) : (
                jobs.map((j) => (
                  <div key={j.id} className="card" style={{ display: "grid", gap: 6 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 16 }}>{j.title}</strong>
                        <div style={{ color: "#555" }}>
                          {j.company} • {j.location}
                          {j.trade ? ` • ${j.trade}` : ""}
                        </div>
                        {(j.payRate || j.perDiem) && (
                          <div style={{ color: "#333" }}>
                            {j.payRate && (
                              <>
                                <strong>Pay:</strong> {j.payRate}
                              </>
                            )}
                            {j.perDiem && (
                              <>
                                {" "}• <strong>Per Diem:</strong> {j.perDiem}
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <a href={`/jobs/${j.id}`} className="pill-light">
                          View
                        </a>
                        <button className="btn-outline" onClick={() => unsave(j.id)}>
                          Unsave
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          </main>
        ) : (
          <RoleGateDenied
            expectedRole="jobseeker"
            status={status}
            error={error}
            currentRole={user?.publicMetadata?.role}
          />
        )}
      </SignedIn>
    </>
  );
}

const header = { display: "flex", justifyContent: "space-between", alignItems: "center" };
