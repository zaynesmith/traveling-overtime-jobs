// pages/jobs/[id]/index.js
import { SignedIn, SignedOut, RedirectToSignIn, useUser, UserButton } from "@clerk/nextjs";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";

// Same demo jobs used elsewhere for now
const DEMO_JOBS = [
  { id: "j-1001", title: "Journeyman Electrician", company: "ACME Industrial", trade: "Electrical", location: "Houston, TX", pay: "$38/hr", perDiem: "$100/day", overtime: "6x10s", travel: "Yes",
    description: "Industrial shutdown — cable pulls, terminations, MCC work. OSHA10 preferred. Bring hand tools & PPE." },
  { id: "j-1002", title: "Industrial Millwright",  company: "RiverWorks",       trade: "Mechanical", location: "Mobile, AL",   pay: "$36/hr", perDiem: "$90/day",  overtime: "OT after 40", travel: "Yes",
    description: "Install/align rotating equipment, conveyor work, rigging. Reading prints; tools provided on site." },
  { id: "j-1003", title: "Pipe Welder (TIG)",       company: "GulfFab",          trade: "Welding",    location: "Corpus Christi, TX", pay: "$40/hr", perDiem: "$120/day", overtime: "5x10s",    travel: "Yes",
    description: "TIG on stainless & carbon, x-ray quality. TWIC a plus. Per diem available for travelers." },
  { id: "j-1004", title: "Controls Tech",           company: "NorthBay Energy",  trade: "Electrical", location: "Baton Rouge, LA",   pay: "$42/hr", perDiem: "$110/day", overtime: "6x12s",   travel: "No",
    description: "PLC troubleshooting, VFDs, instrumentation support. Day shift; occasional OT." },
];

export default function JobDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isLoaded, isSignedIn } = useUser();
  const [savedNow, setSavedNow] = useState(false);

  const job = useMemo(() => DEMO_JOBS.find(j => j.id === String(id)), [id]);

  if (!job) {
    return (
      <main style={wrap}>
        <header style={headerBare}>
          <h1 style={{ margin: 0 }}>Job</h1>
        </header>
        <section style={card}>
          <p>We couldn’t find that job.</p>
          <a href="/jobseeker/search" style={pillLight}>← Back to Search</a>
        </section>
      </main>
    );
  }

  function saveJob() {
    try {
      const key = "savedJobs";
      const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      const arr = raw ? JSON.parse(raw) : [];
      if (!arr.find((x) => x.id === job.id)) {
        arr.push({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          trade: job.trade,
          pay: job.pay,
          perDiem: job.perDiem,
          overtime: job.overtime,
          travel: job.travel,
          savedAt: new Date().toISOString(),
        });
        if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(arr));
      }
      setSavedNow(true);
    } catch {}
  }

  return (
    <main style={wrap}>
      <header style={header}>
        <h1 style={{ margin: 0 }}>{job.title}</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a href="/jobseeker/search" style={pillLight}>← Back to Search</a>
          <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
        </div>
      </header>

      <section style={card}>
        <div style={{ color: "#666", marginBottom: 6 }}>
          {job.company} • {job.location}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <Badge>{job.trade}</Badge>
          <Badge>Pay {job.pay}</Badge>
          <Badge>Per Diem {job.perDiem}</Badge>
          <Badge>OT {job.overtime}</Badge>
          <Badge>Travel {job.travel}</Badge>
        </div>

        <p style={{ marginTop: 0 }}>{job.description}</p>

        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <a href={`/jobs/${job.id}/apply`} style={btnDark}>Apply</a>
          <button onClick={saveJob} style={btnOutline}>
            {savedNow ? "Saved ✓" : "Save"}
          </button>
        </div>
      </section>

      {/* Signed-out users get a nudge to sign in before applying */}
      <SignedOut>
        <section style={card}>
          <p>You’re not signed in. You can browse jobs, but you’ll need an account to apply.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="/sign-in" style={btnLight}>Sign In</a>
            <a href="/sign-up" style={btnDark}>Create Account</a>
          </div>
        </section>
      </SignedOut>
    </main>
  );
}

/* tiny UI helpers */
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
const headerBare = { ...header, maxWidth: 700 };
const card = {
  width: "100%",
  maxWidth: 1000,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
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
const btnDark = {
  display: "inline-block",
  background: "#111",
  color: "#fff",
  borderRadius: 8,
  padding: "10px 14px",
  fontWeight: 700,
  textDecoration: "none",
};
const btnOutline = {
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};
