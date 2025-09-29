// pages/employer/post.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
  UserButton,
} from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

export default function PostJob() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newJobId, setNewJobId] = useState("");

  // Simple form state
  const [form, setForm] = useState({
    title: "",
    company: "",
    trade: "",
    location: "",
    payRate: "",
    perDiem: "",
    overtime: "",
    startDate: "",
    travelRequired: "Yes",
    description: "",
    contactEmail: "",
  });

  // Prefill from Employer Profile (Clerk public/unsafe metadata)
  useEffect(() => {
    if (!isLoaded || !user) return;
    const pm = user.publicMetadata || {};
    const um = user.unsafeMetadata || {};
    setForm((f) => ({
      ...f,
      company: pm.companyName
        ? String(pm.companyName)
        : (um.companyName ? String(um.companyName) : f.company),
      contactEmail:
        pm.companyContactEmail
          ? String(pm.companyContactEmail)
          : (um.companyContactEmail
              ? String(um.companyContactEmail)
              : (user.primaryEmailAddress?.emailAddress || f.contactEmail)),
    }));
  }, [isLoaded, user]);

  // Disable submit until minimal fields are filled
  const canSubmit = useMemo(() => {
    return (
      form.title.trim() &&
      form.company.trim() &&
      form.location.trim() &&
      form.description.trim() &&
      form.contactEmail.trim()
    );
  }, [form]);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, []);

  if (!isLoaded) return null;

  // If not signed in, bounce to sign-in and return here afterward
  if (!isSignedIn) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer/post" />
      </SignedOut>
    );
  }

  function persistJobToLocalStorage(job) {
    try {
      const raw = localStorage.getItem("myEmployerJobs");
      const list = raw ? JSON.parse(raw) : [];
      const next = [job, ...list]; // newest first
      localStorage.setItem("myEmployerJobs", JSON.stringify(next));
    } catch (e) {
      console.error("localStorage save failed:", e);
      alert("Could not save the job locally (demo).");
    }
  }

  // Employer view
  return (
    <SignedIn>
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Post a Job</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <section style={card}>
          {submitted ? (
            <Success id={newJobId} />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!canSubmit || saving) return;

                setSaving(true);

                // Build a job object to persist (demo: localStorage only)
                const id = "job-" + Date.now();
                const job = {
                  id,
                  title: form.title.trim(),
                  company: form.company.trim(),
                  trade: form.trade.trim(),
                  location: form.location.trim(),
                  payRate: form.payRate.trim(),
                  perDiem: form.perDiem.trim(),
                  overtime: form.overtime.trim(),
                  startDate: form.startDate,
                  travelRequired: form.travelRequired,
                  description: form.description.trim(),
                  contactEmail: form.contactEmail.trim(),
                  postedAt: new Date().toISOString().slice(0, 10),
                };

                // Persist to localStorage so jobseeker/search can read it
                persistJobToLocalStorage(job);

                // Simulate processing, then show success
                setTimeout(() => {
                  setNewJobId(id);
                  setSaving(false);
                  setSubmitted(true);
                  // Clear the form
                  setForm({
                    title: "",
                    company: job.company,
                    trade: "",
                    location: "",
                    payRate: "",
                    perDiem: "",
                    overtime: "",
                    startDate: "",
                    travelRequired: "Yes",
                    description: "",
                    contactEmail: job.contactEmail,
                  });
                }, 400);
              }}
              style={{ display: "grid", gap: 12 }}
            >
              <Row>
                <Input
                  label="Job Title*"
                  value={form.title}
                  onChange={(v) => setForm({ ...form, title: v })}
                  placeholder="Journeyman Electrician"
                />
                <Input
                  label="Company*"
                  value={form.company}
                  onChange={(v) => setForm({ ...form, company: v })}
                  placeholder="ACME Industrial"
                />
              </Row>

              <Row>
                <Input
                  label="Trade"
                  value={form.trade}
                  onChange={(v) => setForm({ ...form, trade: v })}
                  placeholder="Electrical / Mechanical / Welding / …"
                />
                <Input
                  label="Location*"
                  value={form.location}
                  onChange={(v) => setForm({ ...form, location: v })}
                  placeholder="City, State"
                />
              </Row>

              <Row>
                <Input
                  label="Pay Rate"
                  value={form.payRate}
                  onChange={(v) => setForm({ ...form, payRate: v })}
                  placeholder="$38/hr"
                />
                <Input
                  label="Per Diem"
                  value={form.perDiem}
                  onChange={(v) => setForm({ ...form, perDiem: v })}
                  placeholder="$100/day"
                />
              </Row>

              <Row>
                <Input
                  label="Overtime"
                  value={form.overtime}
                  onChange={(v) => setForm({ ...form, overtime: v })}
                  placeholder="OT after 40 / 6x10s / etc."
                />
                <Input
                  label="Start Date"
                  type="date"
                  value={form.startDate}
                  onChange={(v) => setForm({ ...form, startDate: v })}
                />
              </Row>

              <Row>
                <Select
                  label="Travel Required"
                  value={form.travelRequired}
                  onChange={(v) => setForm({ ...form, travelRequired: v })}
                  options={["Yes", "No"]}
                />
                <Input
                  label="Contact Email*"
                  type="email"
                  value={form.contactEmail}
                  onChange={(v) => setForm({ ...form, contactEmail: v })}
                  placeholder="jobs@acme.com"
                />
              </Row>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={label}>Description*</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Duties, requirements, shift, duration, tools, PPE, etc."
                  rows={6}
                  style={textarea}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  type="submit"
                  style={btnPrimary}
                  disabled={!canSubmit || saving}
                >
                  {saving ? "Posting…" : "Post Job"}
                </button>
                <a href="/employer" style={pillLight}>
                  Cancel
                </a>
              </div>

              <p style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
                * Required fields
              </p>

              <div style={hintBox}>
                Tip: Company Name and Contact Email prefill from your{" "}
                <a href="/employer/profile">Company Profile</a>.
              </div>
            </form>
          )}
        </section>
      </main>
    </SignedIn>
  );
}

/* ---------- success view ---------- */
function Success({ id }) {
  return (
    <div style={{ textAlign: "center" }}>
      <h2 style={{ marginTop: 0 }}>Job posted (demo)</h2>
      <p style={{ marginBottom: 16 }}>
        Your job is saved in this browser. It will appear in{" "}
        <a href="/jobseeker/search">Jobseeker Search</a> with a “Posted here”
        tag. (We can replace this with a real database later.)
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <a href="/employer/listings" style={pillDark}>
          Manage Listings
        </a>
        <a href="/employer/post" style={pillLight}>
          Post Another
        </a>
        {id ? (
          <a href={`/jobseeker/search/${id}`} style={pillLight}>
            View Job
          </a>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- tiny UI helpers (inline styles & components) ---------- */
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
function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={input}
      />
    </div>
  );
}
function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={input}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  padding: "40px 24px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 24,
  fontFamily:
    "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
};

const header = {
  width: "100%",
  maxWidth: 960,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const card = {
  width: "100%",
  maxWidth: 960,
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
const label = { fontSize: 13, color: "#444" };

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

const hintBox = {
  marginTop: 8,
  background: "#f9fafb",
  border: "1px solid #eee",
  color: "#333",
  padding: "10px 12px",
  borderRadius: 10,
  fontSize: 13,
};