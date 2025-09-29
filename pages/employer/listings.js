// pages/employer/listings.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
} from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

export default function EmployerListings() {
  const [jobs, setJobs] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");

  // Load employer-posted jobs from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("myEmployerJobs");
      const parsed = raw ? JSON.parse(raw) : [];
      // ensure each job has a status (default Open)
      const normalized = parsed.map((j) => ({
        status: "Open",
        ...j,
        status: j.status || "Open",
      }));
      setJobs(normalized);
    } catch {
      setJobs([]);
    }
  }, []);

  // Persist helper
  function save(next) {
    setJobs(next);
    try {
      localStorage.setItem("myEmployerJobs", JSON.stringify(next));
    } catch {}
  }

  // Filters
  const filtered = useMemo(() => {
    let list = [...jobs];
    const kw = q.trim().toLowerCase();
    if (kw) {
      list = list.filter((j) =>
        [j.title, j.company, j.location, j.trade, j.description]
          .join(" ")
          .toLowerCase()
          .includes(kw)
      );
    }
    if (status !== "All") list = list.filter((j) => j.status === status);
    list.sort(
      (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    );
    return list;
  }, [jobs, q, status]);

  // Actions
  function toggleStatus(id) {
    const next = jobs.map((j) =>
      j.id === id ? { ...j, status: j.status === "Open" ? "Closed" : "Open" } : j
    );
    save(next);
  }
  function remove(id) {
    if (!confirm("Delete this job posting?")) return;
    const next = jobs.filter((j) => j.id !== id);
    save(next);
  }

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer/listings" />
      </SignedOut>

      <SignedIn>
        <main style={wrap}>
          <header style={header}>
            <h1 style={{ margin: 0 }}>Manage Listings</h1>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <a href="/employer/post" style={pillDark}>+ Post a Job</a>
              <UserButton afterSignOutUrl="/" />
            </div>
          </header>

          {/* Filters */}
          <section style={{ ...card, marginBottom: 12 }}>
            <div style={filters}>
              <input
                style={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title, company, trade, location…"
              />
              <select
                style={input}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>All</option>
                <option>Open</option>
                <option>Closed</option>
              </select>
            </div>
          </section>

          {/* Table */}
          <section style={card}>
            {filtered.length === 0 ? (
              <div style={{ color: "#666" }}>
                No listings. <a href="/employer/post" style={link}>Post your first job</a>.
              </div>
            ) : (
              <table style={table}>
                <thead>
                  <tr>
                    <th align="left">Title</th>
                    <th align="left">Company</th>
                    <th align="left">Location</th>
                    <th align="left">Status</th>
                    <th align="left">Posted</th>
                    <th align="left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((j) => (
                    <tr key={j.id}>
                      <td>{j.title}</td>
                      <td>{j.company}</td>
                      <td>{j.location}</td>
                      <td>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            background:
                              j.status === "Open" ? "#eaffea" : "#f4f4f4",
                            border: "1px solid #ddd",
                            fontSize: 12,
                          }}
                        >
                          {j.status}
                        </span>
                      </td>
                      <td>{j.postedAt || ""}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {/* View uses the jobseeker detail page for now */}
                          <a href={`/jobseeker/search/${j.id}`} style={linkBtn}>
                            View
                          </a>
                          <button onClick={() => toggleStatus(j.id)} style={outlineBtn}>
                            {j.status === "Open" ? "Close" : "Reopen"}
                          </button>
                          <button onClick={() => remove(j.id)} style={dangerBtn}>
                            Delete
                          </button>
                        </div>
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

/* ---------- styles ---------- */
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
const filters = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: 8,
};
const input = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
};
const table = {
  width: "100%",
  borderCollapse: "collapse",
};
const link = { color: "#111", textDecoration: "underline" };
const linkBtn = {
  display: "inline-block",
  textDecoration: "none",
  background: "#111",
  color: "#fff",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 700,
  fontSize: 13,
  textAlign: "center",
};
const outlineBtn = {
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};
const dangerBtn = {
  background: "#fff",
  color: "#b00020",
  border: "1px solid #f3c1c6",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};