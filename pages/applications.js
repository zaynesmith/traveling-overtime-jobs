// pages/applications.js
import { useEffect, useState } from "react";

export default function MyApplications() {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("myApplications");
      setApps(raw ? JSON.parse(raw) : []);
    } catch {
      setApps([]);
    }
  }, []);

  function removeOne(id) {
    setApps((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("myApplications", JSON.stringify(next));
      }
      return next;
    });
  }

  function clearAll() {
    if (!confirm("Remove all locally saved applications?")) return;
    if (typeof window !== "undefined") localStorage.removeItem("myApplications");
    setApps([]);
  }

  return (
    <main style={wrap}>
      <header style={header}>
        <h1 style={{ margin: 0 }}>My Applications</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/jobseeker/search" style={pillLight}>← Back to Search</a>
          {apps.length > 0 && (
            <button onClick={clearAll} style={btnOutline}>Clear All</button>
          )}
        </div>
      </header>

      {apps.length === 0 ? (
        <section style={emptyCard}>
          No applications saved on this device yet.
          Go to <a href="/jobseeker/search">Search</a>, open a job, and click <strong>Apply</strong>.
        </section>
      ) : (
        <section style={list}>
          {apps
            .slice()
            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
            .map((a) => (
              <article key={a.id} style={card}>
                <header style={{ marginBottom: 6 }}>
                  <h3 style={{ margin: "0 0 4px" }}>{a.jobTitle}</h3>
                  <div style={{ color: "#666", fontSize: 14 }}>
                    {a.company} • {a.location}
                  </div>
                </header>

                <div style={{ color: "#666", fontSize: 12, marginBottom: 8 }}>
                  Submitted: {new Date(a.submittedAt).toLocaleString()}
                </div>

                <div style={gridTwo}>
                  <div>
                    <Label>Full Name</Label>
                    <div>{a.applicant.fullName || "—"}</div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <div>{a.applicant.email || "—"}</div>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <div>{a.applicant.phone || "—"}</div>
                  </div>
                  <div>
                    <Label>Resume</Label>
                    {a.applicant.resumeUrl ? (
                      <a href={a.applicant.resumeUrl} target="_blank" rel="noreferrer" style={link}>
                        Open
                      </a>
                    ) : (
                      <div>—</div>
                    )}
                  </div>
                </div>

                {a.applicant.message && (
                  <div style={{ marginTop: 8 }}>
                    <Label>Message</Label>
                    <div style={{ whiteSpace: "pre-wrap" }}>{a.applicant.message}</div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
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

function Label({ children }) {
  return <div style={{ fontSize: 12, color: "#555", marginBottom: 2 }}>{children}</div>;
}

/* ---- styles ---- */
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

const list = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};

const gridTwo = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
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

const btnDark = {
  textDecoration: "none",
  background: "#111",
  color: "#fff",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
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

const link = { color: "#111", textDecoration: "underline" };
