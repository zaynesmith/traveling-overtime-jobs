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
  const { user, isLoaded } = useUser();
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const role = user?.publicMetadata?.role;

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

  // Prefill from Employer Profile (Clerk publicMetadata)
  useEffect(() => {
    if (!isLoaded || !user) return;
    const pm = user.publicMetadata || {};
    setForm((f) => ({
      ...f,
      company: pm.companyName ? String(pm.companyName) : f.company,
      contactEmail: pm.companyContactEmail
        ? String(pm.companyContactEmail)
        : (user.primaryEmailAddress?.emailAddress || f.contactEmail),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  if (!user) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer/post" />
      </SignedOut>
    );
  }

  // If signed in but not employer, show a quick message & link
  if (role !== "employer") {
    return (
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Post a Job</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Employer access required</h2>
          <p style={{ marginBottom: 16 }}>
            Your current role is{" "}
            <strong>{role ? String(role) : "not set"}</strong>. Switch to the
            Employer role from your <a href="/dashboard">Dashboard</a>, or use
            the <a href="/employer">Employer Area</a> to switch roles.
          </p>
          <a href="/employer" style={pillDark}>Go to Employer Area</a>
        </section>
      </main>
    );
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
            <Success />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // No database yet — just simulate submit
                setSaving(true);
                setTimeout(() => {
                  setSaving(false);
                  setSubmitted(true);
                }, 800);
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
                  placeholder="Electrical / Mechanical / Welding / ... "
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
                <button type="submit" style={btnPrimary} disabled={!canSubmit || saving}>
                  {saving ? "Posting…" : "Post Job"}
                </button>
                <a href="/employer" style={pillLight}>Cancel</a>
              </div>

              <p style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
                * Required fields
              </p>

              {/* Small helper: show where prefills came from */}
              <div style={hintBox}>
                Tip: Company Name and Contact Email prefill from your{" "}
                <a href="/employer/profile">Company Profile</a>. Update them there to change the defaults.
              </div>
            </form>
          )}
        </section>
      </main>
    </SignedIn>
  );
}

/* ---------- tiny UI helpers (inline styles & components) ---------- */

function Success() {
  return (
    <div style={{ textAlign: "center" }}>
      <h2 style={{ marginTop: 0 }}>Job submitted (demo)</h2>
      <p style={{ marginBottom: 16 }}>
        We haven’t connected a database yet. This confirms your form works.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <a href="/employer" style={pillDark}>Back to Employer Area</a>
        <a href="/employer/listings" style={pillLight}>Manage Listings</a>
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
          <option key={opt} value={opt}>{opt}</option>
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
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
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
