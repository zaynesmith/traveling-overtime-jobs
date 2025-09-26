// pages/jobseeker/profile.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
  UserButton,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function JobseekerProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const role = user?.publicMetadata?.role;

  // Local form state (prefill from Clerk metadata if available)
  const [homeLocation, setHomeLocation] = useState("");
  const [travelRadius, setTravelRadius] = useState("50"); // miles
  const [resumeUrl, setResumeUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const pm = user.publicMetadata || {};
    if (pm.homeLocation) setHomeLocation(String(pm.homeLocation));
    if (pm.travelRadius) setTravelRadius(String(pm.travelRadius));
    if (pm.resumeUrl) setResumeUrl(String(pm.resumeUrl));
  }, [isLoaded, user]);

  if (!isLoaded) return null;

  // If not signed in, force sign-in and come back
  if (!isSignedIn) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/jobseeker/profile" />
      </SignedOut>
    );
  }

  // If signed in but not jobseeker, hint how to switch
  if (role !== "jobseeker") {
    return (
      <main style={wrap}>
        <Header />
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Jobseeker access required</h2>
          <p>
            Your current role is <strong>{role || "not set"}</strong>. Go to your{" "}
            <a href="/dashboard">Dashboard</a> or{" "}
            <a href="/jobseeker">Jobseeker Area</a> to switch roles.
          </p>
        </section>
      </main>
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setSaved(false);
      await user.update({
        publicMetadata: {
          ...(user.publicMetadata || {}),
          role: "jobseeker",
          homeLocation: homeLocation.trim(),
          travelRadius: travelRadius.trim(),
          resumeUrl: resumeUrl.trim(),
        },
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
      alert("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SignedIn>
      <main style={wrap}>
        <Header />
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Jobseeker Profile</h2>
          <p style={{ marginTop: 4, color: "#555" }}>
            Save your home base, travel radius, and resume link so employers can find you.
          </p>

          <form onSubmit={handleSave} style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <label style={label}>Home Location</label>
              <input
                value={homeLocation}
                onChange={(e) => setHomeLocation(e.target.value)}
                placeholder="City, State (e.g., Tulsa, OK)"
                style={input}
              />
              <small style={{ color: "#666" }}>
                Used to compute distance to jobs (e.g., within your travel radius).
              </small>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label style={label}>Travel Radius (miles)</label>
              <select
                value={travelRadius}
                onChange={(e) => setTravelRadius(e.target.value)}
                style={input}
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
                <option value="500">500</option>
                <option value="Any">Any</option>
              </select>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label style={label}>Resume Link (URL)</label>
              <input
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder="Share a view-only link (Google Drive, Dropbox, etc.)"
                style={input}
                type="url"
              />
              <small style={{ color: "#666" }}>
                TIP: Upload a PDF to Google Drive, set to “Anyone with the link → Viewer”, then paste the link here.
              </small>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button type="submit" style={btnPrimary} disabled={saving}>
                {saving ? "Saving…" : "Save Profile"}
              </button>
              <a href="/jobseeker" style={pillLight}>Back to Jobseeker Area</a>
            </div>

            {saved && (
              <div style={callout}>
                ✅ Saved! Your profile is stored on your account.
              </div>
            )}
          </form>
        </section>
      </main>
    </SignedIn>
  );
}

/* ------- tiny UI helpers ------- */
function Header() {
  return (
    <header style={header}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Jobseeker Profile</h1>
      <UserButton afterSignOutUrl="/" />
    </header>
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

const callout = {
  marginTop: 10,
  background: "#f6fff6",
  border: "1px solid #bfe6bf",
  color: "#225c22",
  padding: "10px 12px",
  borderRadius: 10,
  fontSize: 14,
};
