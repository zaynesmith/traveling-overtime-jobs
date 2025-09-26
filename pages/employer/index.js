// pages/employer/index.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { useState } from "react";

export default function EmployerArea() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [saving, setSaving] = useState(false);

  if (!isLoaded) return null;

  const role = user?.publicMetadata?.role; // "employer" | "jobseeker" | undefined

  async function setRoleToEmployer() {
    if (!isSignedIn || !user) return;
    try {
      setSaving(true);
      await user.update({
        publicMetadata: { ...(user.publicMetadata || {}), role: "employer" },
      });
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Could not update role. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* If not signed in, send to sign-in and come back here after */}
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer" />
      </SignedOut>

      <SignedIn>
        <main
          style={{
            minHeight: "100vh",
            padding: "40px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            fontFamily:
              "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
          }}
        >
          <header
            style={{
              width: "100%",
              maxWidth: 960,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
              Employer Area
            </h1>
            <UserButton afterSignOutUrl="/" />
          </header>

          {/* If you are NOT an employer yet, show a quick switch */}
          {role !== "employer" ? (
            <section style={card}>
              <h2 style={{ marginTop: 0 }}>Employer access required</h2>
              <p style={{ marginBottom: 16 }}>
                Your current role is{" "}
                <strong>{role ? String(role) : "not set"}</strong>. Click below
                to switch to <strong>employer</strong>.
              </p>
              <button
                onClick={setRoleToEmployer}
                disabled={saving}
                style={btnPrimary}
              >
                {saving ? "Saving…" : "Switch to Employer"}
              </button>

              <p style={{ marginTop: 16 }}>
                Or visit the{" "}
                <a href="/jobseeker" style={{ textDecoration: "none" }}>
                  Jobseeker Area
                </a>
                .
              </p>
            </section>
          ) : (
            // If role IS employer, show the employer dashboard shell + quick links
            <section style={card}>
              <p style={{ marginTop: 0, fontSize: 18 }}>
                Welcome, <strong>Employer</strong>! 🎉
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  marginTop: 12,
                }}
              >
                <a href="/employer/post" style={pill}>
                  ➕ Post a Job
                </a>
                <a href="/employer/listings" style={pill}>
                  📋 Manage Listings
                </a>
                <a href="/employer/profile" style={pill}>
                  🏢 Company Profile
                </a>
                <a href="/dashboard" style={pillLight}>
                  ← Back to Dashboard
                </a>
              </div>
            </section>
          )}
        </main>
      </SignedIn>
    </>
  );
}

/* --- tiny styles --- */
const card = {
  width: "100%",
  maxWidth: 960,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 24,
  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
};

const pill = {
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

const btnPrimary = {
  background: "#111",
  color: "#fff",
  border: "1px solid #111",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};
