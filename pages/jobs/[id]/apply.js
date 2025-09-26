// pages/jobs/[id]/apply.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
  UserButton,
} from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

// Minimal demo job lookup (ids 1..3 like the rest of the site)
const DEMO_JOBS = [
  { id: "1", title: "Journeyman Electrician", company: "ACME Industrial", location: "Houston, TX" },
  { id: "2", title: "Pipe Welder (TIG)", company: "Gulf Fabrication", location: "Lake Charles, LA" },
  { id: "3", title: "Millwright", company: "North Plant Services", location: "Toledo, OH" },
];

export default function ApplyToJob() {
  const router = useRouter();
  const { id } = router.query;

  const { user, isLoaded, isSignedIn } = useUser();
  const role = user?.publicMetadata?.role;

  const job = useMemo(
    () => DEMO_JOBS.find((j) => j.id === String(id)),
    [id]
  );

  // Local state (prefill from Clerk if available)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    setFullName([user.firstName, user.lastName].filter(Boolean).join(" "));
    if (user.primaryEmailAddress?.emailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress);
    }
    const pm = user.publicMetadata || {};
    if (pm.resumeUrl) setResumeUrl(String(pm.resumeUrl));
    if (pm.phone) setPhone(String(pm.phone));
  }, [isLoaded, user]);

  if (!isLoaded) return null;

  // Force sign-in and return to this apply page
  if (!isSignedIn) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl={`/jobs/${id || ""}/apply`} />
      </SignedOut>
    );
  }

  // Require jobseeker role to apply
  if (role !== "jobseeker") {
    return (
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Apply to Job</h1>
          <UserButton afterSignOutUrl="/" />
        </header>
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Jobseeker access required</h2>
          <p>
            Your current role is <strong>{role || "not set"}</strong>. Switch to the Jobseeker role
            from your <a href="/dashboard">Dashboard</a> or the{" "}
            <a href="/jobseeker">Jobseeker Area</a>, then return here.
          </p>
          <p>
            <a href={`/jobs/${id}`} style={pillLight}>← Back to Job</a>
          </p>
        </section>
      </main>
    );
  }

  if (!job) {
    return (
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Apply to Job</h1>
          <UserButton afterSignOutUrl="/" />
        </header>
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Job not found</h2>
          <p>We couldn’t find that job.</p>
          <a href="/search" style={pillLight}>← Back to Search</a>
        </section>
      </main>
    );
  }

  return (
    <SignedIn>
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Apply to: {job.title}</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <section style={card}>
          {submitted ? (
            <Success id={String(id)} />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // No backend yet—simulate submission
                setSaving(true);
                setTimeout(() => {
                  setSaving(false);
                  setSubmitted(true);
                }, 800);
              }}
              style={{ display: "grid", gap: 12 }}
            >
              <div style={{ color: "#666", marginBottom: 6 }}>
                {job.company} • {job.location}
              </div>

              <Field label="Full Name">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={input}
                  required
                />
              </Field>

              <Row>
                <Field label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={input}
                    required
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(optional)"
                    style={input}
                  />
                </Field>
              </Row>

              <Field label="Resume Link (URL)">
                <input
                  type="url"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="Paste a view-only link (Drive/Dropbox/etc.)"
                  style={input}
                  required
                />
                <small style={{ color: "#666" }}>
                  Tip: Upload a PDF to Google Drive, set “Anyone with the link → Viewer”, then paste the link here.
                </small>
              </Field>

              <Field label="Message to Employer">
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Brief note, availability, relevant experience…"
                  style={textarea}
                />
              </Field>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="submit" style={btnPrimary} disabled={saving}>
                  {saving ? "Submitting…" : "Submit Application"}
                </button>
                <a href={`/jobs/${id}`} style={pillLight}>Cancel</a>
              </div>
            </form>
          )}
        </section>
      </main>
    </SignedIn>
  );
}

/* ---------- tiny UI helpers ---------- */
function Success({ id }) {
  return (
    <div style={{ textAlign: "center" }}>
      <h2 style={{ marginTop: 0 }}>Application submitted (demo)</h2>
      <p style={{ marginBottom: 16 }}>
        We haven’t connected a database or emails yet. This confirms the apply flow works.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <a href={`/jobs/${id}`} style={pillDark}>← Back to Job</a>
        <a href="/search" style={pillLight}>Go to Search</a>
      </div>
    </div>
  );
}

function Row({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {children}
      <style jsx>{`
        @media (max-width: 720px) {
          div { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

/* --- styles --- */
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
  maxWidth: 900,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const card = {
  width: "100%",
  maxWidth: 900,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 24,
  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
};

const input = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
};

const textarea = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  resize: "vertical",
};

const labelStyle = { fontSize: 13, color: "#444" };

const btnPrimary = {
  background: "#111",
  color: "#fff",
  border: "1px solid #111",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
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
