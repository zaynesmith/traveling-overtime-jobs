// pages/dashboard/index.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { useState } from "react";

export default function Dashboard() {
  const { user, isSignedIn } = useUser();
  const [saving, setSaving] = useState(false);
  const role = user?.publicMetadata?.role; // "employer" | "jobseeker" | undefined

  async function setRole(newRole) {
    if (!isSignedIn || !user) return;
    try {
      setSaving(true);
      await user.update({
        publicMetadata: { ...(user.publicMetadata || {}), role: newRole },
      });
      // send them to the right area
      window.location.href = newRole === "employer" ? "/employer" : "/jobseeker";
    } catch (e) {
      console.error(e);
      alert("Could not save role. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* If not signed in, send to sign-in and return here after */}
      <SignedOut>
        <RedirectToSignIn redirectUrl="/dashboard" />
      </SignedOut>

      {/* Signed-in dashboard */}
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
              Dashboard
            </h1>
            <UserButton afterSignOutUrl="/" />
          </header>

          <section
            style={{
              width: "100%",
              maxWidth: 960,
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            }}
          >
            <p style={{ marginTop: 0, fontSize: 18 }}>
              Welcome{user?.firstName ? `, ${user.firstName}` : ""}! 🎉
            </p>

            {/* If role already chosen, show a quick link to their area */}
            {role ? (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={role === "employer" ? "/employer" : "/jobseeker"}
                  style={pill}
                >
                  Go to {role === "employer" ? "Employer" : "Jobseeker"} Area
                </a>
                <button
                  onClick={() => setRole(role === "employer" ? "jobseeker" : "employer")}
                  style={outlineBtn}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Switch Role"}
                </button>
              </div>
            ) : (
              // If no role yet, let them choose once
              <div>
                <p style={{ marginBottom: 12 }}>Choose how you’ll use the site:</p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setRole("employer")}
                    style={primaryBtn}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "I’m an Employer"}
                  </button>
                  <button
                    onClick={() => setRole("jobseeker")}
                    style={secondaryBtn}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "I’m a Jobseeker"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </SignedIn>
    </>
  );
}

/* tiny inline styles to keep this step self-contained */
const pill = {
  display: "inline-block",
  background: "#111",
  color: "#fff",
  borderRadius: 999,
  padding: "10px 14px",
  fontWeight: 600,
  textDecoration: "none",
};

const outlineBtn = {
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 600,
  cursor: "pointer",
};

const primaryBtn = {
  background: "#111",
  color: "#fff",
  border: "1px solid #111",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtn = {
  background: "#fff",
  color: "#111",
  border: "1px solid #111",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

