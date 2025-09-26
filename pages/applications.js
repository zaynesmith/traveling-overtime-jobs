// pages/applications.js
import { useEffect, useState } from "react";

export default function MyApplicationsPage() {
  const [apps, setApps] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("myApplications");
      setApps(raw ? JSON.parse(raw) : []);
    } catch {
      setApps([]);
    }
  }, []);

  function removeOne(id) {
    setApps((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("myApplications", JSON.stringify(next));
      }
      return next;
    });
  }

  function clearAll() {
    if (!confirm("Remove all applications saved in this browser?")) return;
    if (typeof window !== "undefined") window.localStorage.removeItem("myApplications");
    setApps([]);
  }

  return (
    <main style={wrap}>
      <header style={header}>
        <h1 style={{ margin: 0 }}>My Applications</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/search" style={pillLight}>← Back to Search</a>
          {apps.length > 0 && (
            <button onClick={clearAll} style={btnOutline}>Clear All</button>
          )}
        </div>
      </header>

      {apps.length === 0 ? (
        <section style={emptyCard}>
          You haven’t submitted any applications (in this browser) yet.
          Go to <a href="/search">Search</a>, open a job, and click <strong>Apply</strong>.
        </section>
      ) : (
        <section style={grid}>
          {apps
            .slice()
            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
            .map((a) => (
              <article key={a.id} style={card}>
                <header style={{ marginBottom: 8 }}>
                  <h3 style={{ margin: "0 0 6px" }}>{a.jobTitle}</h3>
                  <div style={{ color: "#666", fontSize: 14 }}>
                    {a.company} • {a.location}
                  </div>
                </header>

                <div style={{ color: "#666", fontSize: 12, marginBottom: 10 }}>
                  Submitted: {new Date(a.submittedAt).toLocaleString()}
                </div>

                <dl style={dl}>
                  <dt>Full Name</dt><dd>{a.applicant.fullName}</dd>
                  <dt>Email</dt><dd>{a.applicant.email}</dd>
                  {a.applicant.phone && (<><dt>Phone</dt><dd>{a.applicant.phone}</dd></>)}
                  <dt>Resume</dt>
                  <dd>
                    <a href={a.applicant.resumeUrl} target="_blank" rel="noreferrer">
                      {a.applicant.resumeUrl}
                    </a>
                  </dd>
                  {a.applicant.message && (<><dt>Message</dt><dd>{a.applicant.message}</dd></>)}
                </dl>

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <a href={`/jobs/${a.jobId}`} style={btnDark}>View Job</a>
                  <button onClick={() => removeOne(a.id)} style={btnOutline}>Remove</button>
                </div>
              </article>
            ))}
        </section>
      )}
    </main>
  );
}

/* ---- tiny styles ---- */
const wrap = {
  maxWidth: 1000,
  margin: "32px auto",
  padding: "0 16px",
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};

const card = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};

const emptyCard = {
  background: "#fff",
  border: "1px dashed rgba(0,0,0,0.2)",
  borderRadius: 12,
  padding: 24,
  textAlign: "center",
  color: "#666",
};

const dl = {
  display: "grid",
  gridTemplateColumns: "140px 1fr",
  gap: "6px 12px",
  alignItems: "baseline",
  margin: 0,
};

const btnDark = {
  textDecoration: "none",
  background: "#111",
  color: "#fff",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
};

const pillLight = {
  display: "inline-block",
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 999,
  padding: "10px 14px",
  fontWeight: 600,
  textDecoration: "none",
};

const btnOutline = {
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};
