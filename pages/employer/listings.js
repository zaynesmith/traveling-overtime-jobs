// pages/employer/listings.js
import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from "@clerk/nextjs";
import { useRequireRole } from "../../lib/useRequireRole";

export default function EmployerListings() {
  const canView = useRequireRole("employer");

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer/listings" />
      </SignedOut>

      <SignedIn>
        {canView ? (
          <main style={wrap}>
          <header style={header}>
            <h1 style={{ margin: 0 }}>Manage Job Listings</h1>
            <UserButton afterSignOutUrl="/" />
          </header>

          <section style={list}>
            {DEMO_JOBS.map((job) => (
              <div key={job.id} style={card}>
                <h2 style={{ marginBottom: 4 }}>{job.title}</h2>
                <p style={{ margin: 0 }}>
                  <strong>Location:</strong> {job.location}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Pay:</strong> {job.payRate} &nbsp;|&nbsp;{" "}
                  <strong>Per Diem:</strong> {job.perDiem}
                </p>
                <p style={{ margin: "6px 0" }}>{job.description}</p>
                <small>Posted: {job.postedAt}</small>
              </div>
            ))}
          </section>
          </main>
        ) : null}
      </SignedIn>
    </>
  );
}

// Demo data (replace with real DB later)
const DEMO_JOBS = [
  {
    id: "job-001",
    title: "Journeyman Electrician",
    location: "Houston, TX",
    payRate: "$36/hr",
    perDiem: "$100/day",
    description: "Industrial electrical work at refinery. 6x10s schedule, PPE required.",
    postedAt: "2025-09-30",
  },
  {
    id: "job-002",
    title: "Electrical Foreman",
    location: "Corpus Christi, TX",
    payRate: "$45/hr",
    perDiem: "$120/day",
    description: "Supervise crews at petrochemical site. Long-term project.",
    postedAt: "2025-10-01",
  },
];

// Styles
const wrap = {
  minHeight: "100vh",
  padding: "40px 24px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 24,
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
};

const header = {
  width: "100%",
  maxWidth: 960,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const list = {
  width: "100%",
  maxWidth: 960,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const card = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};
