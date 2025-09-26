// pages/employer/listings/[id].js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
  UserButton,
} from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

// Demo seed data (fallback)
const DEMO_MY_LISTINGS = [
  {
    id: "acme-001",
    title: "Journeyman Electrician",
    company: "ACME Industrial",
    location: "Houston, TX",
    status: "Open",
    applicants: 12,
    postedAt: "2025-09-30",
    description:
      "Industrial shutdown — cable pulls, terminations, MCC work. OSHA10 preferred. Bring hand tools & PPE.",
  },
  {
    id: "acme-002",
    title: "Electrical Foreman",
    company: "ACME Industrial",
    location: "Corpus Christi, TX",
    status: "Open",
    applicants: 4,
    postedAt: "2025-10-02",
    description:
      "Lead crew of 6–10 on industrial install. Reading prints, task planning, QA checks, toolbox talks.",
  },
  {
    id: "acme-003",
    title: "Industrial Instrument Tech",
    company: "ACME Industrial",
    location: "Baton Rouge, LA",
    status: "Closed",
    applicants: 23,
    postedAt: "2025-08-20",
    description:
      "Loop checks, calibrations, transmitters, DCS work. NCCER a plus. Per diem available.",
  },
];

// Demo applicants (static)
const DEMO_APPLICANTS = [
  {
    id: "app-1001",
    fullName: "Alex Johnson",
    email: "alex.j@example.com",
    phone: "(281) 555-0134",
    resumeUrl: "https://example.com/resume/alex-j.pdf",
    note: "10 years industrial; available to travel.",
    submittedAt: "2025-10-04T14:35:00Z",
    jobId: "acme-001",
  },
  {
    id: "app-1002",
    fullName: "Maria Lopez",
    email: "maria.l@example.com",
    phone: "(361) 555-4422",
    resumeUrl: "https://example.com/resume/maria-l.pdf",
    note: "Licensed JM; TWIC; seeking 6x10s.",
    submittedAt: "2025-10-05T09:02:00Z",
    jobId: "acme-001",
  },
  {
    id: "app-2001",
    fullName: "Chris Nguyen",
    email: "chris.n@example.com",
    phone: "(225) 555-9911",
    resumeUrl: "https://example.com/resume/chris-n.pdf",
    note: "5 yrs instrumentation, strong calibrations background.",
    submittedAt: "2025-09-01T18:10:00Z",
    jobId: "acme-003",
  },
];

export default function ListingDetail() {
  const { user, isLoaded } = useUser();
  const role = user?.publicMetadata?.role;
  const router = useRouter();
  const { id } = router.query;

  const [localJobs, setLocalJobs] = useState([]);

  // Load local jobs once on mount (client-side only)
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("myEmployerJobs") : null;
      setLocalJobs(raw ? JSON.parse(raw) : []);
    } catch {
      setLocalJobs([]);
    }
  }, []);

  const listing = useMemo(() => {
    const lid = String(id || "");
    const fromLocal = (localJobs || []).find((j) => j.id === lid);
    if (fromLocal) return { ...fromLocal, _source: "local" };
    const fromDemo = DEMO_MY_LISTINGS.find((j) => j.id === lid);
    return fromDemo ? { ...fromDemo, _source: "demo" } : null;
  }, [id, localJobs]);

  if (!isLoaded) return null;

  // Not signed in → sign in and return here
  if (!user) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl={`/employer/listings/${id || ""}`} />
      </SignedOut>
    );
  }

  // Must be employer
  if (role !== "employer") {
    return (
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Listing</h1>
          <UserButton afterSignOutUrl="/" />
        </header>
        <section style={card}>
          <p>
            Employer access required. Your role is <strong>{role || "not set"}</strong>.
            Switch roles from your <a href="/dashboard">Dashboard</a>.
          </p>
        </section>
      </main>
    );
  }

  if (!listing) {
    return (
      <SignedIn>
        <main style={wrap}>
          <header style={header}>
            <h1 style={{ margin: 0 }}>Listing</h1>
            <UserButton afterSignOutUrl="/" />
          </header>
          <section style={card}>
            <p>We couldn’t find that listing.</p>
            <a href="/employer/listings" style={pillLight}>← Back to Listings</a>
          </section>
        </main>
      </SignedIn>
    );
  }

  // For demo applicants, only attach those whose jobId matches demo IDs.
  const applicants =
    listing._source === "demo"
      ? DEMO_APPLICANTS.filter((a) => a.jobId === listing.id)
      : [];

  function toggleStatus() {
    if (listing._source !== "local") return alert("Demo listing — status not persisted.");
    try {
      const next = (localJobs || []).map((j) =>
        j.id === listing.id ? { ...j, status: j.status === "Open" ? "Closed" : "Open" } : j
      );
      localStorage.setItem("myEmployerJobs", JSON.stringify(next));
      setLocalJobs(next);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <SignedIn>
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>{listing.title}</h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a href="/employer/listings" style={pillLight}>← Back</a>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Listing summary */}
        <section style={card}>
          <div style={{ color: "#666", marginBottom: 6 }}>
            {listing.company} • {listing.location}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <Badge>{listing.status}</Badge>
            <Badge>Posted: {listing.postedAt || "—"}</Badge>
            <Badge>Source: {listing._source === "local" ? "Local (You)" : "Demo"}</Badge>
          </div>
          {listing.description && <p style={{ margin: 0 }}>{listing.description}</p>}
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={btnOutline} onClick={toggleStatus}>
              {listing.status === "Open" ? "Close Listing" : "Reopen Listing"}
            </button>
          </div>
        </section>

        {/* Applicants table */}
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Applicants ({applicants.length})</h2>
          {applicants.length === 0 ? (
            <div style={{ color: "#666" }}>
              {listing._source === "demo"
                ? "No applicants in this demo set."
                : "This locally saved listing doesn’t have applicants yet."}
            </div>
          ) : (
            <table style={table}>
              <thead>
                <tr>
                  <th align="left">Applicant</th>
                  <th align="left">Contact</th>
                  <th align="left">Submitted</th>
                  <th align="left">Resume</th>
                  <th align="left">Note</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.fullName}</strong></td>
                    <td>
                      <div>{a.email}</div>
                      {a.phone && <div style={{ color: "#666" }}>{a.phone}</div>}
                    </td>
                    <td>{new Date(a.submittedAt).toLocaleString()}</td>
                    <td>
                      <a href={a.resumeUrl} target="_blank" rel="noreferrer" style={link}>
                        Open
                      </a>
                    </td>
                    <td style={{ maxWidth: 280 }}>{a.note}</td>
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

/* ---- tiny styles ---- */
function Badge({ children }) {
  return (
    <span style={{
      display: "inline-block",
      fontSize: 12,
      padding: "4px 8px",
      borderRadius: 999,
      border: "1px solid #e5e7eb",
      background: "#f8fafc",
    }}>
      {children}
    </span>
  );
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
const btnOutline = {
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 700,
  cursor: "pointer",
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
const table = {
  width: "100%",
  borderCollapse: "collapse",
};
const link = { color: "#111", textDecoration: "underline" };
