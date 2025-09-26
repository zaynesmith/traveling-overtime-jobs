// pages/jobseeker/index.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { useState } from "react";

export default function JobseekerArea() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [saving, setSaving] = useState(false);

  if (!isLoaded) return null;

  const role = user?.publicMetadata?.role; // "jobseeker" | "employer" | undefined

  async function setRoleToJobseeker() {
    if (!isSignedIn || !user) return;
    try {
      setSaving(true);
      await user.update({
        publicMetadata: { ...(user.publicMetadata || {}), role: "jobseeker" },
      });
      // reload to reflect new role
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
        <RedirectToSignIn redirectUrl="/jobseeker" />
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
              Jobseeker Area
            </h1>
            <UserButton afterSignOutUrl="/" />
          </header>

          {role !== "jobseeker" ? (
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
              <h2 style={{ marginTop: 0 }}>Jobseeker access required</h2>
              <p style={{ marginBottom: 16 }}>
                Your current role is{" "}
                <strong>{role ? String(role) : "not set"}</strong>.{" "}
                Click the button below to switch to <strong>jobseeker</strong>.
              </p>
              <button
                onClick={setRoleToJobseeker}
                disabled={saving}
                style={{
                  background: "#111",
                  color: "#fff",
                  border: "1px solid #111",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {saving ? "Saving…" : "Switch to Jobseeker"}
              </button>

              <p style={{ marginTop: 16 }}>
                Or go to the{" "}
                <a href="/employer" style={{ textDecoration: "none" }}>
                  Employer Area
                </a>
                .
              </p>
            </section>
          ) : (
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
                Welcome, <strong>Jobseeker</strong>! 🎉
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  marginTop: 12,
                }}
              >
                <a href="/search" style={pill}>
                  Search Jobs
                </a>
                <a href="/dashboard" style={pill}>
                  Back to Dashboard
                </a>
              </div>
            </section>
          )}
        </main>
      </SignedIn>
    </>
  );
}

const pill = {
  display: "inline-block",
  background: "#111",
  color: "#fff",
  borderRadius: 999,
  padding: "10px 14px",
  fontWeight: 600,
  textDecoration: "none",
};
