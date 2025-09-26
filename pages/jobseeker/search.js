// pages/jobseeker/search.js
import { SignedIn, SignedOut, RedirectToSignIn, useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

// Demo jobs (temporary until we add a database)
const DEMO_JOBS = [
  { id: "j-1001", title: "Journeyman Electrician", company: "ACME Industrial", trade: "Electrical", location: "Houston, TX", pay: "$38/hr", perDiem: "$100/day", overtime: "6x10s", travel: "Yes" },
  { id: "j-1002", title: "Industrial Millwright",  company: "RiverWorks",       trade: "Mechanical", location: "Mobile, AL",   pay: "$36/hr", perDiem: "$90/day",  overtime: "OT after 40", travel: "Yes" },
  { id: "j-1003", title: "Pipe Welder (TIG)",       company: "GulfFab",          trade: "Welding",    location: "Corpus Christi, TX", pay: "$40/hr", perDiem: "$120/day", overtime: "5x10s",    travel: "Yes" },
  { id: "j-1004", title: "Controls Tech",           company: "NorthBay Energy",  trade: "Electrical", location: "Baton Rouge, LA",   pay: "$42/hr", perDiem: "$110/day", overtime: "6x12s",   travel: "No" },
];

export default function JobseekerSearch() {
  const { isLoaded, isSignedIn } = useUser();

  // Filters
  const [q, setQ] = useState("");
  const [trade, setTrade] = useState("All");
  const [travel, setTravel] = useState("All");

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, []);

  const results = useMemo(() => {
    let out = [...DEMO_JOBS];

    const kw = q.trim().toLowerCase();
    if (kw) {
      out = out.filter(j =>
        [j.title, j.company, j.location, j.trade].join(" ").toLowerCase().includes(kw)
      );
    }
    if (trade !== "All") out = out.filter(j => j.trade === trade);
    if (travel !== "All") out = out.filter(j => j.travel === travel);
    return out;
  }, [q, trade, travel]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/jobseeker/search" />
      </SignedOut>
    );
  }

  return (
    <SignedIn>
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Search Jobs</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        {/* Filters */}
        <section style={card}>
          <div style={filters}>
            <input
              placeholder="Search by title, company, location…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={input}
            />
            <select value={trade} onChange={(e) => setTrade(e.target.value)} style={input}>
              <option>All</option>
              <option>Electrical</option>
              <option>Mechanical</option>
              <option>Welding</option>
            </select>
            <select value={travel} onChange={(e) => setTravel(e.target.value)} style={input}>
              <option>All</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
        </section>

        {/* Results */}
        <section style={card}>
          {results.length === 0 ? (
            <div style={{ color: "#666" }}>No matching jobs yet.</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
              {results.map((j) => (
                <li key={j.id} style={jobRow}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{j.title}</div>
                    <div style={{ color: "#555" }}>
                      {j.company} • {j.location}
                    </div>
                    <div style={{ color: "#666", fontSize: 13 }}>
                      {j.trade} • Pay {j.pay} • Per Diem {j.perDiem} • OT {j.overtime} • Travel {j.travel}
                    </div>
                  </div>
                  <a href={`/employer/listings/${j.id}`} style={pillDark}>View</a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </SignedIn>
  );
}

/* styles */
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
  gridTemplateColumns: "2fr 1fr 1fr",
  gap: 12,
  marginBottom: 4,
};
const input = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
};
const jobRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 12,
  border: "1px solid #eee",
  borderRadius: 10,
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

