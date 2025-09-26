// pages/jobs/[id].js
import { useRouter } from "next/router";

// Demo jobs (same shape as /search, duplicated here so this file works alone)
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

export default function JobDetail() {
  const router = useRouter();
  const { id } = router.query;
  const job = DEMO_JOBS.find((j) => j.id === String(id));

  if (!job) {
    return (
      <main style={wrap}>
        <section style={card}>
          <h1 style={{ marginTop: 0 }}>Job Not Found</h1>
          <p>We couldn’t find that job.</p>
          <a href="/search" style={btnDark}>← Back to Search</a>
        </section>
      </main>
    );
  }

  return (
    <main style={wrap}>
      <section style={card}>
        <h1 style={{ marginTop: 0 }}>{job.title}</h1>
        <div style={{ color: "#666", marginBottom: 12 }}>
          {job.company} • {job.trade} • {job.location}
        </div>

        <div style={tags}>
          <Tag>{job.payRate}</Tag>
          <Tag>{job.perDiem}</Tag>
          <Tag>{job.overtime}</Tag>
          <Tag>Start: {job.startDate}</Tag>
          <Tag>Travel: {job.travelRequired}</Tag>
        </div>

        <p style={{ marginTop: 16, lineHeight: 1.6 }}>{job.description}</p>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {/* UPDATED LINK: go to the real apply page */}
          <a href={`/jobs/${job.id}/apply`} style={btnDark}>Apply</a>
          <a href="/sign-in" style={btnLight}>Save</a>
          <a href="/search" style={linkBtn}>Back to Search</a>
        </div>
      </section>
    </main>
  );
}

/* tiny styles */
const wrap = {
  maxWidth: 900,
  margin: "32px auto",
  padding: "0 16px",
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
};
const card = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
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
const linkBtn = {
  textDecoration: "none",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
  background: "#fff",
};
