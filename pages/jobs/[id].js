// pages/jobs/[id].js
import { useRouter } from "next/router";
import { SignedIn, SignedOut, RedirectToSignIn, UserButton, SignInButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

/** Demo + locally posted jobs loader */
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
    company: "Gulf Process",
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

  // Load job by id from demo + localStorage (jobs employers posted via /employer/post)
  useEffect(() => {
    if (!id) return;

    let localJobs = [];
    try {
      const raw = localStorage.getItem("myEmployerJobs");
      localJobs = raw ? JSON.parse(raw) : [];
    } catch {
      localJobs = [];
    }

    const all = [...DEMO_JOBS, ...localJobs];
    const found = all.find((j) => String(j.id) === String(id));
    setJob(found || null);

    // mark if already applied
    try {
      const rawApps = localStorage.getItem("applications");
      const apps = rawApps ? JSON.parse(rawApps) : [];
      if (apps.some((a) => String(a.jobId) === String(id))) setApplied(true);
    } catch {}
  }, [id]);

  function applyNow() {
    if (!job) return;
    try {
      const raw = localStorage.getItem("applications");
      const apps = raw ? JSON.parse(raw) : [];
      if (apps.some((a) => String(a.jobId) === String(job.id))) {
        setApplied(true);
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
      localStorage.setItem("applications", JSON.stringify([newApp, ...apps]));
      setApplied(true);
      alert("Application submitted (demo). Check My Applications.");
    } catch (e) {
      console.error(e);
      alert("Could not save your application. Try again.");
    }
  }

  if (!job) {
    return (
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Job Details</h1>
          <UserButton afterSignOutUrl="/" />
        </header>
        <section style={card}>Loading or job not found.</section>
        <a href="/jobseeker/search" style={link}>← Back to Search</a>
      </main>
    );
  }

  return (
    <main style={wrap}>
      <header style={header}>
        <h1 style={{ margin: 0 }}>{job.title}</h1>
        <UserButton afterSignOutUrl="/" />
      </header>

      <section style={card}>
        <p><strong>Company:</strong> {job.company}</p>
        <p><strong>Location:</strong> {job.location}</p>
        {job.payRate || job.perDiem ? (
          <p>
            {job.payRate && <><strong>Pay:</strong> {job.payRate} </>}
            {job.perDiem && <> • <strong>Per Diem:</strong> {job.perDiem}</>}
          </p>
        ) : null}
        {job.postedAt && <p><strong>Posted:</strong> {job.postedAt}</p>}
        {job.description && <p style={{ marginTop: 12 }}>{job.description}</p>}

        <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <SignedIn>
            {applied ? (
              <div style={{ color: "green", fontWeight: 700 }}>✅ You applied to this job</div>
            ) : (
              <button onClick={applyNow} style={btn}>Apply Now</button>
            )}
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button style={btn}>Sign in to Apply</button>
            </SignInButton>
          </SignedOut>

          <a href="/jobseeker/search" style={link}>← Back to Search</a>
        </div>
      </section>
    </main>
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
const link = { textDecoration: "none", color: "#111" };