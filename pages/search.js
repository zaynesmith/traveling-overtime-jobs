// pages/search.js
import { useMemo, useState } from "react";

// --- Demo jobs (no database yet) ---
const DEMO_JOBS = [
  {
    id: "1",
    title: "Journeyman Electrician",
    company: "ACME Industrial",
    trade: "Electrical",
    location: "Houston, TX",
    payRate: "$38/hr",
    perDiem: "$100/day",
    overtime: "6x10s",
    startDate: "2025-10-15",
    travelRequired: "Yes",
    description:
      "Industrial shutdown work. Tasks include pulling cable, terminations, MCC work. TWIC a plus.",
  },
  {
    id: "2",
    title: "Pipe Welder (TIG)",
    company: "Gulf Fabrication",
    trade: "Welding",
    location: "Lake Charles, LA",
    payRate: "$42/hr",
    perDiem: "$120/day",
    overtime: "OT after 40",
    startDate: "2025-10-20",
    travelRequired: "Yes",
    description:
      "Stainless TIG on schedule 10/40. Must pass x-ray. Bring hood & hand tools.",
  },
  {
    id: "3",
    title: "Millwright",
    company: "North Plant Services",
    trade: "Mechanical",
    location: "Toledo, OH",
    payRate: "$36/hr",
    perDiem: "$90/day",
    overtime: "5x10s",
    startDate: "2025-11-01",
    travelRequired: "No",
    description:
      "Conveyor install, gearbox alignment, laser-leveling. OSHA 10 required.",
  },
];

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [trade, setTrade] = useState("All");
  const [travel, setTravel] = useState("Any");
  const [sort, setSort] = useState("soonest");

  const results = useMemo(() => {
    let list = [...DEMO_JOBS];

    const kw = q.trim().toLowerCase();
    if (kw) {
      list = list.filter((j) =>
        [j.title, j.company, j.location, j.description]
          .join(" ")
          .toLowerCase()
          .includes(kw)
      );
    }

    if (trade !== "All") {
      list = list.filter((j) => j.trade.toLowerCase() === trade.toLowerCase());
    }

    if (travel !== "Any") {
      list = list.filter((j) => j.travelRequired === travel);
    }

    if (sort === "soonest") {
      list.sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    } else if (sort === "paydesc") {
      const rate = (s) => parseFloat((s || "").replace(/[^0-9.]/g, "")) || 0;
      list.sort((a, b) => rate(b.payRate) - rate(a.payRate));
    }

    return list;
  }, [q, trade, travel, sort]);

  function saveJob(job) {
    if (typeof window === "undefined") return;
    try {
      const key = "savedJobs";
      const raw = window.localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      // avoid duplicates by id
      if (!arr.find((j) => j.id === job.id)) {
        arr.push(job);
        window.localStorage.setItem(key, JSON.stringify(arr));
        alert(`Saved: ${job.title}`);
      } else {
        alert("Already saved.");
      }
    } catch {
      alert("Could not save this job in your browser.");
    }
  }

  return (
    <main style={wrap}>
      <h1 style={{ margin: "0 0 12px" }}>Search Jobs</h1>
      <p style={{ margin: "0 0 24px", color: "#555" }}>
        Demo data for now — filters work client-side. Click <strong>View</strong> to open a job, <strong>Apply</strong> to apply, or <strong>Save</strong> to keep it in your browser (we’ll add a Saved page next).
      </p>

      {/* Controls */}
      <section style={controls}>
        <input
          placeholder="Search title, company, location…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={input}
        />

        <select value={trade} onChange={(e) => setTrade(e.target.value)} style={input}>
          <option>All</option>
          <option>Electrical</option>
          <option>Welding</option>
          <option>Mechanical</option>
        </select>

        <select value={travel} onChange={(e) => setTravel(e.target.value)} style={input}>
          <option value="Any">Any Travel</option>
          <option value="Yes">Travel Required</option>
          <option value="No">No Travel</option>
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)} style={input}>
          <option value="soonest">Start Date (Soonest)</option>
          <option value="paydesc">Pay Rate (High → Low)</option>
        </select>
      </section>

      {/* Results */}
      <section style={grid}>
        {results.length === 0 ? (
          <div style={emptyCard}>No jobs match your filters.</div>
        ) : (
          results.map((j) => <JobCard key={j.id} job={j} onSave={saveJob} />)
        )}
      </section>
    </main>
  );
}

function JobCard({ job, onSave }) {
  return (
    <article style={card}>
      <header style={{ marginBottom: 8 }}>
        <h3 style={{ margin: "0 0 6px" }}>{job.title}</h3>
        <div style={{ color: "#666", fontSize: 14 }}>
          {job.company} • {job.trade} • {job.location}
        </div>
      </header>

      <p style={{ margin: "8px 0 12px", color: "#333" }}>{job.description}</p>

      <div style={tags}>
        <Tag>{job.payRate}</Tag>
        <Tag>{job.perDiem}</Tag>
        <Tag>{job.overtime}</Tag>
        <Tag>Start: {job.startDate}</Tag>
        <Tag>Travel: {job.travelRequired}</Tag>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <a href={`/jobs/${job.id}`} style={btnDark}>View</a>
        <a href={`/jobs/${job.id}/apply`} style={btnLight}>Apply</a>
        <button onClick={() => onSave(job)} style={btnOutline}>Save</button>
      </div>
    </article>
  );
}

/* ------------- tiny inline styles ------------- */
const wrap = {
  maxWidth: 1000,
  margin: "32px auto",
  padding: "0 16px",
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
};

const controls = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr",
  gap: 12,
  marginBottom: 20,
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

const tags = { display: "flex", flexWrap: "wrap", gap: 8 };
const Tag = ({ children }) => (
  <span
    style={{
      display: "inline-block",
      padding: "6px 10px",
      borderRadius: 999,
      background: "#f2f2f2",
      border: "1px solid #e6e6e6",
      fontSize: 12,
    }}
  >
    {children}
  </span>
);

const input = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
};

const btnDark = {
  display: "inline-block",
  background: "#111",
  color: "#fff",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
  textDecoration: "none",
};

const btnLight = {
  display: "inline-block",
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
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
