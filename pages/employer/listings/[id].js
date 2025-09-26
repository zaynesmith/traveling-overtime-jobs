// pages/employer/listings/[id].js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
  UserButton,
} from "@clerk/nextjs";
import { useRouter } from "next/router";

// Demo data (mirror the IDs used in /employer/listings)
const DEMO_MY_LISTINGS = [
  {
    id: "acme-001",
    title: "Journeyman Electrician",
    company: "ACME Industrial",
    location: "Houston, TX",
    status: "Open",
    applicants: 12,
    postedAt: "2025-09-30",
    payRate: "$38/hr",
    perDiem: "$100/day",
    overtime: "6x10s",
    startDate: "2025-10-15",
    travelRequired: "Yes",
    description:
      "Industrial shutdown work. Pulling cable, terminations, MCC work. TWIC a plus. PPE required.",
  },
  {
    id: "acme-002",
    title: "Electrical Foreman",
    company: "ACME Industrial",
    location: "Corpus Christi, TX",
    status: "Open",
    applicants: 4,
    postedAt: "2025-10-02",
    payRate: "$44/hr",
    perDiem: "$120/day",
    overtime: "OT after 40",
    startDate: "2025-10-22",
    travelRequired: "Yes",
    description:
      "Lead small crew during outage. Read prints, coordinate with GC, oversee QA/QC.",
  },
  {
    id: "acme-003",
    title: "Industrial Instrument Tech",
    company: "ACME Industrial",
    location: "Baton Rouge, LA",
    status: "Closed",
    applicants: 23,
    postedAt: "2025-08-20",
    payRate: "$40/hr",
    perDiem: "$110/day",
    overtime: "5x10s",
    startDate: "2025-09-05",
    travelRequired: "No",
    description:
      "Calibrate transmitters, loop checks, troubleshoot PLC I/O. OSHA 10 required.",
  },
];

export default function ListingDetail() {
  const { user, isLoaded } = useUser();
  const role = user?.publicMetadata?.role;
  const router = useRouter();
  const { id } = router.query;

  if (!isLoaded) return null;

  // If not signed in, force sign-in and come back here
  if (!user) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl={`/employer/listings/${id || ""}`} />
      </SignedOut>
    );
  }

  // Require employer role
  if (role !== "employer") {
    return (
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Listing Detail</h1>
          <UserButton afterSignOutUrl="/" />
        </header>
        <section style={card}>
          <p>
            Employer access required. Your role is <strong>{role || "not set"}</strong>.
            Go to <a href="/dashboard">Dashboard</a> or <a href="/employer">Employer Area</a> to switch roles.
          </p>
        </section>
      </main>
    );
  }

  const job = DEMO_MY_LISTINGS.find((j) => j.id === String(id));

  if (!job) {
    return (
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Listing Detail</h1>
          <UserButton afterSignOutUrl="/" />
        </header>
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Not found</h2>
          <p>We couldn’t find a listing with id <code>{String(id)}</code>.</p>
          <a href="/employer/listings" style={pillLight}>← Back to Listings</a>
        </section>
      </main>
    );
  }

  return (
    <SignedIn>
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Listing Detail</h1>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <a href="/employer/listings" style={pillLight}>← Back</a>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>{job.title}</h2>
          <div style={{ color: "#666", marginBottom: 8 }}>
            {job.company} • {job.location}
          </div>

          <div style={tags}>
            <Tag>Status: {job.status}</Tag>
            <Tag>Applicants: {job.applicants}</Tag>
            <Tag>Posted: {job.postedAt}</Tag>
            <Tag>{job.payRate}</Tag>
            <Tag>{job.perDiem}</Tag>
            <Tag>{job.overtime}</Tag>
            <Tag>Start: {job.startDate}</Tag>
            <Tag>Travel: {job.travelRequired}</Tag>
          </div>

          <p style={{ marginTop: 16, lineHeight: 1.6 }}>{job.description}</p>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <a href="/employer/post" style={btnDark}>Post another job</a>
            <a href="/employer/listings" style={btnLight}>Manage listings</a>
          </div>
        </section>
      </main>
    </SignedIn>
  );
}

/* ---- tiny styles ---- */
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
