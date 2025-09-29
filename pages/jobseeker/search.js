// pages/jobseeker/search.js
import { SignedIn, SignedOut, useUser, SignInButton } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

/** Demo jobs so the page isn't empty */
const DEMO_JOBS = [
  {
    id: "demo-001",
    title: "Journeyman Electrician",
    company: "ACME Industrial",
    trade: "Electrical",
    location: "Houston, TX",
    payRate: "$38/hr",
    perDiem: "$100/day",
    overtime: "6x10s",
    travelRequired: "Yes",
    startDate: "2025-10-21",
    description:
      "Industrial shutdown — cable pulls, terminations, MCC work. OSHA10 preferred. Bring hand tools & PPE.",
    postedAt: "2025-10-01",
    _source: "demo",
  },
  {
    id: "demo-002",
    title: "Industrial Instrument Tech",
    company: "Gulf Process",
    trade: "Instrumentation",
    location: "Baton Rouge, LA",
    payRate: "$42/hr",
    perDiem: "$120/day",
    overtime: "OT after 40",
    travelRequired: "Yes",
    startDate: "2025-11-05",
    description:
      "Loop checks, calibrations, transmitters, DCS work. NCCER a plus. Per diem available.",
    postedAt: "2025-09-25",
    _source: "demo",
  },
];

export default function JobseekerSearch() {
  const { isLoaded, isSignedIn } = useUser();
  const [allJobs, setAllJobs] = useState([]);
  const [saved, setSaved] = useState([]);
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [trade, setTrade] = useState("");

  // Load posted jobs (from employer flow) + saved jobs
  useEffect(() => {
    // Load employer-posted jobs from localStorage
    let localEmployerJobs = [];
    try {
      const raw = localStorage.getItem("myEmployerJobs");
      localEmployerJobs = raw ? JSON.parse(raw) : [];
    } catch {
      localEmployerJobs = [];
    }

    // Normalize and tag as "local"
    const normalizedLocal = (localEmployerJobs || []).map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      trade: j.trade || "General",
      location: j.location,
      payRate: j.payRate || "",
      perDiem: j.perDiem || "",
      overtime: j.overtime || "",
      travelRequired: j.travelRequired || "Yes",
      startDate: j.startDate || "",
      description: j.description || "",
      postedAt: j.postedAt || new Date().toISOString().slice(0, 10),
      _source: "local",
    }));

    // Merge demo + local (newest first)
    const merged = [...DEMO_JOBS, ...normalizedLocal].sort(
      (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    );
    setAllJobs(merged);

    // Load saved jobs
    try {
      const rawSaved = localStorage.getItem("savedJobs");
      setSaved(rawSaved ? JSON.parse(rawSaved) : []);
    } catch {
      setSaved([]);
    }
  }, []);

  // Filters
  const filtered = useMemo(() => {
    let list = [...allJobs];

    const kw = q.trim().toLowerCase();
    if (kw) {
      list = list.filter((j) =>
        [j.title, j.company, j.trade, j.location, j.description]
          .join(" ")
          .toLowerCase()
          .includes(kw)
      );
    }
    if (location.trim()) {
      const l = location.trim().toLowerCase();
      list = list.filter((j) => j.location.toLowerCase().includes(l));
    }
    if (trade.trim()) {
      const t = trade.trim().toLowerCase();
      list = list.filter((j) => (j.trade || "").toLowerCase().includes(t));
    }
    return list;
  }, [allJobs, q, location, trade]);

  // Helpers: save/unsave
  function isSaved(id) {
    return saved.includes(id);
  }
  function toggleSave(id) {
    setSaved((prev) => {
      let next;
      if (prev.includes(id)) next = prev.filter((x) => x !== id);
      else next = [...prev, id];
      try {
        localStorage.setItem("savedJobs", JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  return (
    <main style={wrap}>
      <header style={header}>
        <h1 style={{ margin: 0 }}>Search Jobs</h1>
      </header>

      {/* Filters */}
      <section style={{ ...card, marginBottom: 12 }}>
        <div style={filters}>
          <input
            style={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Keyword (title, company, trade)…"
          />
          <input
            style={input}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (City, State)"
          />
          <input
            style={input}
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            placeholder="Trade (Electrical, Welding, Instrumentation…)"
          />
        </div>
      </section>

      {/* Results */}
      <section style={card}>
        {filtered.length === 0 ? (
          <div style={{ color: "#666" }}>No jobs match those filters.</div>
        ) : (
          <ul style={list}>
            {filtered.map((j) => (
              <li key={j.id} style={row}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <strong>{j.title}</strong>
                    <span style={{ color: "#555" }}>• {j.company}</span>
                    <SourceTag source={j._source} />
                  </div>
                  <div style={{ color: "#555", marginTop: 4 }}>
                    {j.location} {j.payRate ? `• ${j.payRate}` : ""}{" "}
                    {j.perDiem ? `• ${j.perDiem}` : ""}{" "}
                    {j.overtime ? `• ${j.overtime}` : ""}{" "}
                    {j.travelRequired ? `• Travel: ${j.travelRequired}` : ""}
                  </div>
                  {j.description && (
                    <p style={{ margin: "8px 0 0 0", color: "#333" }}>
                      {j.description}
                    </p>
                  )}
                </div>

                <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                  <a href={`/employer/listings/${j.id}`} style={linkBtn}>
                    View
                  </a>

                  {/* Save/Unsave — require sign-in for saving */}
                  <SignedIn>
                    <button
                      onClick={() => toggleSave(j.id)}
                      style={isSaved(j.id) ? btnSaved : btnSave}
                      aria-label={isSaved(j.id) ? "Unsave job" : "Save job"}
                    >
                      {isSaved(j.id) ? "Saved" : "Save"}
                    </button>
                  </SignedIn>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button style={btnSave}>Save</button>
                    </SignInButton>
                  </SignedOut>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

/* ------ tiny components & styles ------ */
function SourceTag({ source }) {
  const label = source === "local" ? "Posted here" : "Demo";
  const style = {
    fontSize: 12,
    padding: "2px 6px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: source === "local" ? "#effdf3" : "#f8fafc",
    color: source === "local" ? "#0a5" : "#334155",
  };
  return <span style={style}>{label}</span>;
}

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
  gridTemplateColumns: "2fr 1fr 1fr",
  gap: 8,
};
const input = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
};

const list = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "grid",
  gap: 12,
};

const row = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 12,
  alignItems: "start",
  borderBottom: "1px solid #eee",
  paddingBottom: 12,
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
  textAlign: "center",
};

const btnSave = {
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

const btnSaved = {
  ...btnSave,
  background: "#eefdf3",
  borderColor: "#bfead1",
  color: "#0a5",
};