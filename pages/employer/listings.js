// pages/employer/listings.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
  UserButton,
} from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

// Demo: pretend these are existing jobs you posted earlier (static)
const DEMO_MY_LISTINGS = [
  {
    id: "acme-001",
    title: "Journeyman Electrician",
    company: "ACME Industrial",
    location: "Houston, TX",
    status: "Open",
    applicants: 12,
    postedAt: "2025-09-30",
    _source: "demo",
  },
  {
    id: "acme-002",
    title: "Electrical Foreman",
    company: "ACME Industrial",
    location: "Corpus Christi, TX",
    status: "Open",
    applicants: 4,
    postedAt: "2025-10-02",
    _source: "demo",
  },
  {
    id: "acme-003",
    title: "Industrial Instrument Tech",
    company: "ACME Industrial",
    location: "Baton Rouge, LA",
    status: "Closed",
    applicants: 23,
    postedAt: "2025-08-20",
    _source: "demo",
  },
];

export default function EmployerListings() {
  const { user, isLoaded } = useUser();
  const role = user?.publicMetadata?.role;

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");

  // This state will hold BOTH demo & your locally saved jobs
  const [list, setList] = useState([]);

  // Load from localStorage and merge with demo on mount
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);

    // read your posted jobs from localStorage
    let mine = [];
    try {
      const raw = localStorage.getItem("myEmployerJobs");
      mine = raw ? JSON.parse(raw) : [];
    } catch {
      mine = [];
    }

    // normalize mine and mark as "local"
    const myNormalized = (mine || []).map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      status: j.status || "Open",
      applicants: j.applicants ?? 0,
      postedAt: j.postedAt || new Date().toISOString().slice(0, 10),
      _source: "local", // mark as yours
    }));

    setList([...DEMO_MY_LISTINGS, ...myNormalized]);
  }, []);

  // Filters + sort
  const filtered = useMemo(() => {
    let out = [...list];

    // text filter
    const kw = q.trim().toLowerCase();
    if (kw) {
      out = out.filter((j) =>
        [j.title, j.company, j.location, j.status]
          .join(" ")
          .toLowerCase()
          .includes(kw)
      );
    }

    // status filter
    if (status !== "All") {
      out = out.filter((j) => j.status === status);
    }

    // newest first
    out.sort(
      (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    );

    return out;
  }, [q, status, list]);

  if (!isLoaded) return null;

  // If not signed in, force sign-in and come back
  if (!user) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer/listings" />
      </SignedOut>
    );
  }

  // If signed in but not employer, show hint
  if (role !== "employer") {
    return (
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Manage Listings</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Employer access required</h2>
          <p>
            Your current role is <strong>{role || "not set"}</strong>. Switch to
            the Employer role from your <a href="/dashboard">Dashboard</a> or the{" "}
            <a href="/employer">Employer Area</a>.
          </p>
        </section>
      </main>
    );
  }

  // Helper: toggle status; if item is from local storage, persist change
  function toggleStatus(jobId) {
    setList((prev) => {
      const next = prev.map((x) =>
        x.id === jobId ? { ...x, status: x.status === "Open" ? "Closed" : "Open" } : x
      );

      // persist back to localStorage for "local" jobs
      try {
        const localOnly = next.filter((x) => x._source === "local");
        localStorage.setItem("myEmployerJobs", JSON.stringify(localOnly));
      } catch {}
      return next;
    });
  }

  return (
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
        <section style={{ ...card, marginBottom: 16 }}>
          <div style={filters}>
            <input
              placeholder="Search title, location, status…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={input}
            />
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={input}>
              <option>All</option>
              <option>Open</option>
              <option>Closed</option>
            </select>
          </div>
        </section>

        {/* Table */}
        <section style={card}>
          {filtered.length === 0 ? (
            <div style={{ color: "#666" }}>No listings found.</div>
          ) : (
            <table style={table}>
              <thead>
                <tr>
                  <th align="left">Title</th>
                  <th align="left">Location</th>
                  <th align="left">Status</th>
                  <th align="right">Applicants</th>
                  <th align="left">Posted</th>
                  <th align="left">Source</th>
                  <th align="left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((j) => (
                  <tr key={j.id}>
                    <td>
                      {j.title}{" "}
                      {j._source === "local" && (
                        <span style={tagYou}>(You)</span>
                      )}
                    </td>
                    <td>{j.location}</td>
                    <td>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: j.status === "Open" ? "#eaffea" : "#f4f4f4",
                          border: "1px solid #ddd",
                          fontSize: 12,
                        }}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td align="right">{j.applicants}</td>
                    <td>{j.postedAt}</td>
                    <td style={{ color: "#666" }}>{j._source === "local" ? "Local" : "Demo"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <a
                          href={`/employer/listings/${j.id}`}
                          style={linkBtn}
                          title="View listing details"
                        >
                          View
                        </a>
                        <button
                          onClick={() => toggleStatus(j.id)}
                          style={outlineBtn}
                          title="Toggle open/closed"
                        >
                          {j.status === "Open" ? "Close" : "Reopen"}
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
  maxWidth: 1000,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const card = {
  width: "100%",
  maxWidth: 1000,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};

const filters = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: 12,
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

const linkBtn = {
  display: "inline-block",
  textDecoration: "none",
  background: "#111",
  color: "#fff",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 700,
  fontSize: 13,
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

const pillDark = {
  display: "inline-block",
  background: "#111",
  color: "#fff",
  borderRadius: 999,
  padding: "10px 14px",
  fontWeight: 600,
  textDecoration: "none",
};

const tagYou = {
  fontSize: 12,
  marginLeft: 6,
  color: "#0b5",
  background: "#eafff1",
  border: "1px solid #b9f1ce",
  padding: "2px 6px",
  borderRadius: 999,
};
