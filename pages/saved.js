// pages/saved.js
import { useEffect, useState } from "react";

export default function SavedJobsPage() {
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("savedJobs");
      setSaved(raw ? JSON.parse(raw) : []);
    } catch {
      setSaved([]);
    }
  }, []);

  function removeOne(id) {
    setSaved((prev) => {
      const next = prev.filter((j) => j.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("savedJobs", JSON.stringify(next));
      }
      return next;
    });
  }

  function clearAll() {
    if (!confirm("Clear all saved jobs in this browser?")) return;
    if (typeof window !== "undefined") localStorage.removeItem("savedJobs");
    setSaved([]);
  }

  return (
    <main style={wrap}>
      <header style={header}>
        <h1 style={{ margin: 0 }}>Saved Jobs</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/jobseeker/search" style={pillLight}>← Back to Search</a>
          {saved.length > 0 && (
            <button onClick={clearAll} style={btnOutline}>Clear All</button>
          )}
        </div>
      </header>

      {saved.length === 0 ? (
        <section style={emptyCard}>
          You haven’t saved any jobs (in this browser) yet.
          Go to <a href="/jobseeker/search">Search</a> and click <strong>Save</strong> on a job.
        </section>
      ) : (
        <section style={grid}>
          {saved
            .slice()
            .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
            .map((j) => (
              <article key={j.id} style={card}>
                <header style={{ marginBottom: 6 }}>
                  <h3 style={{ margin: "0 0 4px" }}>{j.title}</h3>
                  <div style={{ color: "#666", fontSize: 14 }}>
                    {j.company} • {j.location}
                  </div>
                </header>

                <div style={{ color: "#666", fontSize: 12, marginBottom: 8 }}>
                  Saved: {new Date(j.savedAt).toLocaleString()}
                </div>

                <div style={{ color: "#444", fontSize: 13, marginBottom: 8 }}>
                  {j.trade} • Pay {j.pay} • Per Diem {j.perDiem} • OT {j.overtime} • Travel {j.travel}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <a href={`/jobs/${j.id}`} style={btnDark}>View &amp; Apply</a>
                  <button onClick={() => removeOne(j.id)} style={btnOutline}>Remove</button>
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
