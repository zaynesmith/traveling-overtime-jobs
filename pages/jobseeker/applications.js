// pages/jobseeker/applications.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
} from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

// Small demo so page isn't empty initially
const DEMO_APPS = [
  {
    id: "app-demo-1",
    jobId: "demo-001",
    title: "Journeyman Electrician",
    company: "ACME Industrial",
    location: "Houston, TX",
    submittedAt: "2025-10-05T12:30:00Z",
    status: "Submitted",
    note: "Demo application",
  },
];

export default function JobseekerApplications() {
  const [apps, setApps] = useState([]);

  // Load locally saved applications (we'll add a real "Apply" later)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("applications");
      const parsed = raw ? JSON.parse(raw) : [];
      // Merge demo + local (newest first)
      const merged = [...parsed, ...DEMO_APPS].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      setApps(merged);
    } catch {
      setApps([...DEMO_APPS]);
    }
  }, []);

  function withdraw(id) {
    setApps((prev) => {
      const next = prev.filter((a) => a.id !== id);
      // Persist removal only for real (non-demo) ones
      try {
        const raw = localStorage.getItem("applications");
        const real = raw ? JSON.parse(raw) : [];
        const updated = real.filter((a) => a.id !== id);
        localStorage.setItem("applications", JSON.stringify(updated));
      } catch {}
      return next;
    });
  }

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/jobseeker/applications" />
      </SignedOut>

      <SignedIn>
        <main style={wrap}>
          <header style={header}>
            <h1 style={{ margin: 0 }}>My Applications</h1>
            <UserButton afterSignOutUrl="/" />
          </header>

          <section style={card}>
            {apps.length === 0 ? (
              <div style={{ color: "#666" }}>
                You haven’t applied to any jobs yet.{" "}
                <a href="/jobseeker/search" style={link}>Browse jobs</a> to get started.
              </div>
            ) : (
              <table style={table}>
                <thead>
                  <tr>
                    <th align="left">Job</th>
                    <th align="left">Company</th>
                    <th align="left">Location</th>
                    <th align="left">Submitted</th>
                    <th align="left">Status</th>
                    <th align="left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <a href={`/employer/listings/${a.jobId}`} style={link}>
                          {a.title}
                        </a>
                      </td>
                      <td>{a.company}</td>
                      <td>{a.location}</td>
                      <td>{new Date(a.submittedAt).toLocaleString()}</td>
                      <td>
                        <span style={badge(a.status)}>{a.status}</span>
                      </td>
                      <td>
                        {a.id.startsWith("app-demo-") ? (
                          <span style={{ color: "#888" }}>Demo</span>
                        ) : (
                          <button onClick={() => withdraw(a.id)} style={btn}>
                            Withdraw
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
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
  maxWidth: 1100,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const card = {
  width: "100%",
  maxWidth: 1100,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};
const table = {
  width: "100%",
  borderCollapse: "collapse",
};
const link = { color: "#111", textDecoration: "underline" };
const btn = {
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};
function badge(status) {
  const open = status === "Submitted" || status === "In Review";
  return {
    display: "inline-block",
    fontSize: 12,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: open ? "#eef6ff" : "#f8fafc",
  };
}