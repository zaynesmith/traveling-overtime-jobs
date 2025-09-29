// pages/jobseeker/search/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from "@clerk/nextjs";

// Demo data — same as in search.js
const DEMO_JOBS = [
  {
    id: "demo-001",
    title: "Journeyman Electrician",
    company: "ACME Industrial",
    location: "Houston, TX",
    payRate: "$38/hr",
    perDiem: "$100/day",
    description:
      "Industrial electrical work at refinery. 6x10s, PPE required. Travel + per diem paid.",
    postedAt: "2025-09-30",
  },
  {
    id: "demo-002",
    title: "Electrical Foreman",
    company: "ACME Industrial",
    location: "Corpus Christi, TX",
    payRate: "$45/hr",
    perDiem: "$120/day",
    description: "Oversee crews at petrochemical site. Long-term project.",
    postedAt: "2025-10-02",
  },
];

export default function JobDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [job, setJob] = useState(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!id) return;
    const found = DEMO_JOBS.find((j) => j.id === id);
    setJob(found || null);

    // Check if already applied
    try {
      const raw = localStorage.getItem("applications");
      const apps = raw ? JSON.parse(raw) : [];
      if (apps.some((a) => a.jobId === id)) setApplied(true);
    } catch {}
  }, [id]);

  function applyNow() {
    if (!job) return;
    try {
      const raw = localStorage.getItem("applications");
      const apps = raw ? JSON.parse(raw) : [];
      const newApp = {
        id: "app-" + Date.now(),
        jobId: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        submittedAt: new Date().toISOString(),
        status: "Submitted",
      };
      localStorage.setItem("applications", JSON.stringify([...apps, newApp]));
      setApplied(true);
    } catch (err) {
      console.error("Save failed", err);
      alert("Could not save your application. Try again.");
    }
  }

  if (!job) return <div style={{ padding: 24 }}>Loading job…</div>;

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl={`/jobseeker/search/${id}`} />
      </SignedOut>

      <SignedIn>
        <main style={wrap}>
          <header style={header}>
            <h1 style={{ margin: 0 }}>{job.title}</h1>
            <UserButton afterSignOutUrl="/" />
          </header>

          <section style={card}>
            <p>
              <strong>Company:</strong> {job.company}
            </p>
            <p>
              <strong>Location:</strong> {job.location}
            </p>
            <p>
              <strong>Pay Rate:</strong> {job.payRate}
            </p>
            <p>
              <strong>Per Diem:</strong> {job.perDiem}
            </p>
            <p>{job.description}</p>

            {applied ? (
              <div style={{ marginTop: 16, color: "green", fontWeight: 600 }}>
                ✅ You applied to this job
              </div>
            ) : (
              <button onClick={applyNow} style={btn}>
                Apply Now
              </button>
            )}
          </section>

          <a href="/jobseeker/search" style={link}>
            ← Back to Search
          </a>
        </main>
      </SignedIn>
    </>
  );
}

/* ---- styles ---- */
const wrap = {
  minHeight: "100vh",
  padding: "40px 24px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 16,
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
};
const header = {
  width: "100%",
  maxWidth: 800,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const card = {
  width: "100%",
  maxWidth: 800,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 24,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};
const btn = {
  background: "#111",
  color: "#fff",
  border: "1px solid #111",
  borderRadius: 8,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};
const link = { marginTop: 20, textDecoration: "none", color: "#111" };