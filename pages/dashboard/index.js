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
  const currentRole = (user?.publicMetadata?.role || "").toString();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/dashboard" />
      </SignedOut>
    );
  }

  async function go(role) {
    // 1) store locally so the UI can still work even if Clerk update fails
    try {
      localStorage.setItem("role", role);
    } catch {}

    // 2) try to persist to Clerk (best-effort, no blocking popups)
    try {
      await user.update({
        publicMetadata: {
          ...(user.publicMetadata || {}),
          role,
        },
      });
    } catch (err) {
      // log but don’t block
      console.error("Could not update role in Clerk (continuing anyway):", err);
    }

    // 3) go to the correct area either way
    window.location.href = role === "employer" ? "/employer" : "/jobseeker";
  }

  return (
    <SignedIn>
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <section style={grid}>
          <Card
            title="Employer"
            desc="Post jobs, manage listings, and update your company profile."
            actions={
              <>
                <a href="/employer" style={pillDark}>Open Employer Area</a>
                <button onClick={() => go("employer")} style={btnLight}>
                  Set Role & Go
                </button>
              </>
            }
            current={currentRole === "employer"}
          />

          <Card
            title="Jobseeker"
            desc="Search jobs and manage your profile and applications."
            actions={
              <>
                <a href="/jobseeker" style={pillDark}>Open Jobseeker Area</a>
                <button onClick={() => go("jobseeker")} style={btnLight}>
                  Set Role & Go
                </button>
              </>
            }
            current={currentRole === "jobseeker"}
          />
        </section>
      </main>
    </SignedIn>
  );
}

/* ---------- tiny UI helpers ---------- */
function Card({ title, desc, actions, current }) {
  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {current && <span style={badge}>current</span>}
      </div>
      <p style={{ marginTop: 8, color: "#555" }}>{desc}</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>{actions}</div>
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  padding: "40px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
  alignItems: "center",
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
};
const header = {
  width: "100%",
  maxWidth: 960,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const grid = {
  width: "100%",
  maxWidth: 960,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};
const card = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};
const badge = {
  fontSize: 12,
  padding: "2px 8px",
  borderRadius: 999,
  background: "#eef6ff",
  border: "1px solid #cde3ff",
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
const btnLight = {
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 999,
  padding: "10px 14px",
  fontWeight: 600,
  cursor: "pointer",
};
