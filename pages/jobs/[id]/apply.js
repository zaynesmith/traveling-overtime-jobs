// pages/jobs/[id]/apply.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
  UserButton,
} from "@clerk/nextjs";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";

// Same demo jobs list used elsewhere
const DEMO_JOBS = [
  { id: "j-1001", title: "Journeyman Electrician", company: "ACME Industrial", location: "Houston, TX" },
  { id: "j-1002", title: "Industrial Millwright",  company: "RiverWorks",      location: "Mobile, AL" },
  { id: "j-1003", title: "Pipe Welder (TIG)",       company: "GulfFab",         location: "Corpus Christi, TX" },
  { id: "j-1004", title: "Controls Tech",           company: "NorthBay Energy", location: "Baton Rouge, LA" },
];

export default function ApplyPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isLoaded, isSignedIn, user } = useUser();

  const listing = useMemo(() => DEMO_JOBS.find(j => j.id === String(id)), [id]);

  // Prefill from Clerk publicMetadata (set via /jobseeker/profile)
  const pm = (user?.publicMetadata || {});
  const guessedName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username || "";

  const [fullName, setFullName]   = useState(guessedName);
  const [email, setEmail]         = useState(user?.primaryEmailAddress?.emailAddress || "");
  const [phone, setPhone]         = useState(pm.phone || pm.jobseekerContactEmail || "");
  const [resumeUrl, setResumeUrl] = useState(pm.resumeUrl || pm.jobseekerResumeUrl || "");
  const [message, setMessage]     = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    // Keep fields synced if user loads later
    setFullName((v) => v || guessedName);
    setEmail((v) => v || user?.primaryEmailAddress?.emailAddress || "");
    if (pm.phone && !phone) setPhone(pm.phone);
    if (pm.jobseekerContactEmail && !phone) setPhone(pm.jobseekerContactEmail);
    if (pm.resumeUrl && !resumeUrl) setResumeUrl(pm.resumeUrl);
    if (pm.jobseekerResumeUrl && !resumeUrl) setResumeUrl(pm.jobseekerResumeUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl={`/jobs/${id || ""}/apply`} />
      </SignedOut>
    );
  }

  if (!listing) {
    return (
      <SignedIn>
        <main style={wrap}>
          <header style={header}>
            <h1 style={{ margin: 0 }}>Apply</h1>
            <UserButton afterSignOutUrl="/" />
          </header>
          <section style={card}>
            <p>We couldn’t find that job.</p>
            <a href="/jobseeker/search" style={pillLight}>← Back to Search</a>
          </section>
        </main>
      </SignedIn>
    );
  }

  function saveApplicationLocally(app) {
    try {
      const key = "myApplications";
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(app);
      localStorage.setItem(key, JSON.stringify(arr));
    } catch {}
  }

  function handleSubmit(e) {
    e.preventDefault();

    // In a future step we’ll POST to an API/database.
    // For now, keep a local record so the My Applications page shows it.
    const app = {
      id: `app-${Date.now()}`,
      jobId: listing.id,
      jobTitle: listing.title,
      company: listing.company,
      location: listing.location,
      applicant: {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        resumeUrl: resumeUrl.trim(),
        message: message.trim(),
      },
      submittedAt: new Date().toISOString(),
    };

    saveApplicationLocally(app);
    setSubmitted(true);
    // optional: also add to saved applications feed later
  }

  if (submitted) {
    return (
      <SignedIn>
        <main style={wrap}>
          <header style={header}>
            <h1 style={{ margin: 0 }}>Application Submitted</h1>
            <UserButton afterSignOutUrl="/" />
          </header>
          <section style={card}>
            <p>
              You applied to <strong>{listing.title}</strong> at{" "}
              <strong>{listing.company}</strong>.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a href="/applications" style={btnDark}>View My Applications</a>
              <a href={`/jobs/${listing.id}`} style={pillLight}>Back to Job</a>
              <a href="/jobseeker/search" style={pillLight}>Back to Search</a>
            </div>
          </section>
        </main>
      </SignedIn>
    );
  }

  return (
    <SignedIn>
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Apply: {listing.title}</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <section style={card}>
          <div style={{ marginBottom: 10, color: "#555" }}>
            {listing.company} • {listing.location}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <Row>
              <Field label="Full Name">
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={input} required />
              </Field>
              <Field label="Email">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} required />
              </Field>
            </Row>

            <Row>
              <Field label="Phone">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} style={input} />
              </Field>
              <Field label="Resume URL">
                <input
                  type="url"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="Google Drive/Dropbox link"
                  style={input}
                  required
                />
              </Field>
            </Row>

            <Field label="Message to Employer (optional)">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Brief note about your availability, certifications, travel, etc."
                rows={5}
                style={textarea}
              />
            </Field>

            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button type="submit" style={btnDark}>Submit Application</button>
              <a href={`/jobs/${listing.id}`} style={pillLight}>Cancel</a>
            </div>

            <small style={{ color: "#666" }}>
              Tip: Update your profile at <a href="/jobseeker/profile">Jobseeker Profile</a> to prefill phone & resume next time.
            </small>
          </form>
        </section>
      </main>
    </SignedIn>
  );
}

/* tiny components & styles */
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
      <label style={{ fontSize: 13, color: "#444", fontWeight: 600 }}>{label}</label>
      {children}
    </div>
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
  padding: 20,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
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
  background: "#111",
  color: "#fff",
  border: "1px solid #111",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};
