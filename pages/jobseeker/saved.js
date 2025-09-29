// pages/jobseeker/saved.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
} from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

/** Same demo jobs as Search so we can rebuild details for saved IDs */
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

export default function SavedJobs() {
  const [savedIds, setSavedIds] = useState([]);
  const [localJobs, setLocalJobs] = useState([]);

  // Load saved IDs and local employer jobs
  useEffect(() => {
    try {
      const raw = localStorage.getItem("savedJobs");
      setSavedIds(raw ? JSON.parse(raw) : []);
    } catch {
      setSavedIds([]);
    }

    try {
      const rawLocal = localStorage.getItem("myEmployerJobs");
      const parsed = rawLocal ? JSON.parse(rawLocal) : [];
      const normalized = parsed.map((j) => ({
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
      setLocalJobs(normalized);
    } catch {
      setLocalJobs([]);
    }
  }, []);

  // Build a quick lookup table of all known jobs
  const allById = useMemo(() => {
    const map = new Map();
    [...DEMO_JOBS, ...localJobs].forEach((j) => map.set(j.id, j));
    return map;
  }, [localJobs]);

  const savedJobs = useMemo(() => {
    // keep the saved order (most recently saved last)
    return savedIds
      .map((id) => allById.get(id))
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
      );
  }, [savedIds, allById]);

  function unsave(id) {
    setSavedIds((prev) => {
      const next = prev.filter((x) => x !== id);
      try {
        localStorage.setItem("savedJobs", JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/jobseeker/saved" />
      </SignedOut>

      <SignedIn>
        <main style={wrap}>
          <header style={header}>
            <h1 style={{ margin: 0 }}>Saved Jobs</h1>
            <UserButton afterSignOutUrl="/" />
          </header>

          <section style={card}>
            {savedJobs.length === 0 ? (
              <div style={{ color: "#666" }}>
                You haven’t saved any jobs yet.{" "}
                <a href="/jobseeker/search" style={link}>
                  Browse jobs
                </a>{" "}
                to get started.
              </div>
            ) : (
              <ul style={list}>
                {savedJobs.map((j) => (
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
                      <button onClick={() => unsave(j.id)} style={btnUnsave}>
                        Unsave
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </SignedIn>
    </>
  );
}

/* ---- tiny components & styles ---- */
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
const btnUnsave = {
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};
const link = { color: "#111", textDecoration: "underline" };