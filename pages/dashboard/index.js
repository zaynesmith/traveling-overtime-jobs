// pages/dashboard.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
  UserButton,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const role = user?.publicMetadata?.role; // "employer" | "jobseeker" | undefined
  const [saving, setSaving] = useState(false);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [appsCount, setAppsCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
        setSavedJobsCount(saved.length);
      } catch {}
      try {
        const apps = JSON.parse(localStorage.getItem("myApplications") || "[]");
        setAppsCount(apps.length);
      } catch {}
    }
  }, []);

  if (!isLoaded) return null;

  // not signed in → send to sign-in and come back
  if (!isSignedIn) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/dashboard" />
      </SignedOut>
    );
  }

  async function setRole(nextRole) {
    if (!user) return;
    try {
      setSaving(true);
      await user.update({
        publicMetadata: { ...(user.publicMetadata || {}), role: nextRole },
      });
      // Refresh to reflect new role-specific shortcuts
      if (typeof window !== "undefined") window.location.reload();
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
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Dashboard</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        {/* Role picker */}
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Your Role</h2>
          <p style={{ margin: "6px 0 12px", color: "#555" }}>
            Current: <strong>{role || "not set"}</strong>
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setRole("jobseeker")}
              disabled={saving || role === "jobseeker"}
              style={roleBtn(role === "jobseeker")}
            >
              {role === "jobseeker" ? "✓ Jobseeker" : "Set as Jobseeker"}
            </button>
            <button
              onClick={() => setRole("employer")}
              disabled={saving || role === "employer"}
              style={roleBtn(role === "employer")}
            >
              {role === "employer" ? "✓ Employer" : "Set as Employer"}
            </button>
          </div>
        </section>

        {/* Jobseeker shortcuts */}
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Jobseeker</h2>
          <div style={row}>
            <a href="/search" style={pillDark}>🔎 Search Jobs</a>
            <a href="/saved" style={pillLight}>⭐ Saved ({savedJobsCount})</a>
            <a href="/applications" style={pillLight}>📄 My Applications ({appsCount})</a>
            <a href="/jobseeker/profile" style={pillLight}>🧭 My Profile</a>
          </div>
          <small style={{ color: "#666" }}>
            Tip: Set your <em>Jobseeker</em> role to access jobseeker-only pages like Apply.
          </small>
        </section>

        {/* Employer shortcuts */}
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Employer</h2>
          <div style={row}>
            <a href="/employer/post" style={pillDark}>➕ Post a Job</a>
            <a href="/employer/listings" style={pillLight}>📋 Manage Listings</a>
            <a href="/employer/profile" style={pillLight}>🏢 Company Profile</a>
            <a href="/employer" style={pillLight}>📂 Employer Area</a>
          </div>
          <small style={{ color: "#666" }}>
            Tip: Set your <em>Employer</em> role to access employer-only pages.
          </small>
        </section>
      </main>
    </SignedIn>
  );
}

/* ---------- tiny styles ---------- */
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

const row = { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 };

const pillDark = {
  display: "inline-block",
  background: "#111",
  color: "#fff",
  borderRadius: 999,
  padding: "10px 14px",
  fontWeight: 700,
  textDecoration: "none",
};

const pillLight = {
  display: "inline-block",
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 999,
  padding: "10px 14px",
  fontWeight: 700,
  textDecoration: "none",
};

const roleBtn = (active) => ({
  background: active ? "#111" : "#fff",
  color: active ? "#fff" : "#111",
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: active ? "default" : "pointer",
});
