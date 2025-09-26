// pages/dashboard/index.js
import { SignedIn, SignedOut, RedirectToSignIn, useUser, UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [saving, setSaving] = useState(false);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/dashboard" />
      </SignedOut>
    );
  }

  // IMPORTANT: read role from unsafeMetadata (client-writable)
  const role = user?.unsafeMetadata?.role || "not set";

  async function setRole(next) {
    try {
      setSaving(true);
      // write to unsafeMetadata (allowed from the client)
      await user.update({
        unsafeMetadata: {
          ...(user.unsafeMetadata || {}),
          role: next,
        },
      });
      // no alert popup; just refresh the UI by reloading the page data
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Could not update role. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SignedIn>
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Your Role</h2>
          <p style={{ marginBottom: 12 }}>Current: <strong>{String(role)}</strong></p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setRole("jobseeker")} style={btn} disabled={saving}>
              Set as Jobseeker
            </button>
            <button onClick={() => setRole("employer")} style={btn} disabled={saving}>
              Set as Employer
            </button>
          </div>
        </section>

        <section style={grid}>
          <Card title="Jobseeker">
            <a href="/jobs/search" style={pill}>Search Jobs</a>
            <a href="/jobseeker/saved" style={pill}>Saved</a>
            <a href="/jobseeker/applications" style={pill}>My Applications</a>
            <a href="/jobseeker/profile" style={pill}>My Profile</a>
          </Card>

          <Card title="Employer">
            <a href="/employer/post" style={pillDark}>+ Post a Job</a>
            <a href="/employer/listings" style={pill}>Manage Listings</a>
            <a href="/employer/profile" style={pill}>Company Profile</a>
            <a href="/employer" style={pill}>Employer Area</a>
          </Card>
        </section>
      </main>
    </SignedIn>
  );
}

/* --- tiny components & styles --- */
function Card({ title, children }) {
  return (
    <div style={card}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>{children}</div>
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
  maxWidth: 1000,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const grid = {
  width: "100%",
  maxWidth: 1000,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};

const card = {
  width: "100%",
  maxWidth: 1000,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};

const pill = {
  display: "inline-block",
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 999,
  padding: "10px 14px",
  fontWeight: 600,
  textDecoration: "none",
};

const pillDark = {
  ...pill,
  background: "#111",
  color: "#fff",
  border: "1px solid #111",
};

const btn = {
  background: "#111",
  color: "#fff",
  border: "1px solid #111",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};
