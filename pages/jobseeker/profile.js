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
  const { isLoaded, isSignedIn, user } = useUser();
  const role = user?.publicMetadata?.role;

  // local form state (prefill from Clerk publicMetadata if present)
  const [contactEmail, setContactEmail] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [skills, setSkills] = useState("");
  const [preferredTrades, setPreferredTrades] = useState("");
  const [preferredLocations, setPreferredLocations] = useState("");
  const [willingToTravel, setWillingToTravel] = useState("Yes");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const pm = user.publicMetadata || {};
    setContactEmail(
      (pm.jobseekerContactEmail as string) ||
        user.primaryEmailAddress?.emailAddress ||
        ""
    );
    setResumeUrl((pm.jobseekerResumeUrl as string) || "");
    setSkills((pm.jobseekerSkills as string) || "");
    setPreferredTrades((pm.jobseekerPreferredTrades as string) || "");
    setPreferredLocations((pm.jobseekerPreferredLocations as string) || "");
    setWillingToTravel((pm.jobseekerWillingToTravel as string) || "Yes");
  }, [isLoaded, user]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/jobseeker/profile" />
      </SignedOut>
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
          jobseekerContactEmail: contactEmail.trim(),
          jobseekerResumeUrl: resumeUrl.trim(),
          jobseekerSkills: skills.trim(),
          jobseekerPreferredTrades: preferredTrades.trim(),
          jobseekerPreferredLocations: preferredLocations.trim(),
          jobseekerWillingToTravel: willingToTravel,
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
          <p style={{ color: "#555", marginTop: 4 }}>
            Save details so they prefill when applying and improve matching.
          </p>

          <form onSubmit={handleSave} style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <Field label="Contact Email*">
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="you@example.com"
                style={input}
                required
              />
            </Field>

            <Field label="Resume URL">
              <input
                type="url"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder="Link to Google Drive / Dropbox / PDF"
                style={input}
              />
            </Field>

            <Field label="Skills (comma-separated)">
              <input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Journeyman, conduit bending, MCC, etc."
                style={input}
              />
            </Field>

            <Field label="Preferred Trades">
              <input
                value={preferredTrades}
                onChange={(e) => setPreferredTrades(e.target.value)}
                placeholder="Electrical, Mechanical, Welding…"
                style={input}
              />
            </Field>

            <Field label="Preferred Locations">
              <input
                value={preferredLocations}
                onChange={(e) => setPreferredLocations(e.target.value)}
                placeholder="TX, OK, LA"
                style={input}
              />
            </Field>

            <Field label="Willing to Travel">
              <select
                value={willingToTravel}
                onChange={(e) => setWillingToTravel(e.target.value)}
                style={input}
              >
                <option>Yes</option>
                <option>No</option>
              </select>
            </Field>

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button type="submit" style={btnPrimary} disabled={saving}>
                {saving ? "Saving…" : "Save Profile"}
              </button>
              <a href="/jobseeker" style={pillLight}>Back to Jobseeker Area</a>
            </div>

            {saved && (
              <div style={callout}>✅ Saved! Your profile is stored on your account.</div>
            )}
          </form>
        </section>
      </main>
    </SignedIn>
  );
}

/* helpers */
function Header() {
  return (
    <header style={header}>
      <h1 style={{ margin: 0 }}>Jobseeker Profile</h1>
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}
function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

/* styles */
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
const labelStyle = { fontSize: 13, color: "#444" };
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
