// pages/saved.js
import { useEffect, useState } from "react";

export default function SavedJobsPage() {
  const [saved, setSaved] = useState([]);

  // load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("savedJobs");
      setSaved(raw ? JSON.parse(raw) : []);
    } catch {
      setSaved([]);
    }
  }, []);

  function removeOne(id) {
    setSaved((prev) => {
      const next = prev.filter((j) => j.id !== id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("savedJobs", JSON.stringify(next));
      }
      return next;
    });
  }

  function clearAll() {
    if (!confirm("Remove all saved jobs?")) return;
    if (typeof window !== "undefined") window.localStorage.removeItem("savedJobs");
    setSaved([]);
  }

  return (
    <main style={wrap}>
      <header style={header}>
        <h1 style={{ margin: 0 }}>Saved Jobs</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/search" style={pillLight}>← Back to Search</a>
          {saved.length > 0 && (
            <button onClick={clearAll} style={btnOutline}>Clear All</button>
          )}
        </div>
      </header>

      <section style={grid}>
        {saved.length === 0 ? (
          <div style={emptyCard}>
            You haven’t saved any jobs yet. Go to <a href="/search">Search</a> and click **Save**.
          </div>
        ) : (
          saved.map((j) => (
            <article key={j.id} style={card}>
              <header style={{ marginBottom: 8 }}>
                <h3 style={{ margin: "0 0 6px" }}>{j.title}</h3>
                <div style={{ color: "#666", fontSize: 14 }}>
                  {j.company} • {j.trade} • {j.location}
                </div>
              </header>

              <p style={{ margin: "8px 0 12px", color: "#333" }}>{j.description}</p>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <a href={`/jobs/${j.id}`} style={btnDark}>View</a>
                <a href={`/jobs/${j.id}/apply`} style={btnLight}>Apply</a>
                <button onClick={() => removeOne(j.id)} style={btnOutline}>Remove</button>
              </div>
            </article>
          ))
        )}
      </section>
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

const btnDark = {
  textDecoration: "none",
  background: "#111",
  color: "#fff",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
};

const btnLight = {
  textDecoration: "none",
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
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
