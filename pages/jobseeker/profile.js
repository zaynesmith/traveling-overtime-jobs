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
  const [resumeUrl, setResumeUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [primarySkill, setPrimarySkill] = useState("");
  const [experience, setExperience] = useState("");
  const [travel, setTravel] = useState("Yes");
  const [payType, setPayType] = useState("Hourly");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const pm = user.publicMetadata || {};
    if (pm.resumeUrl) setResumeUrl(String(pm.resumeUrl));
    if (pm.phone) setPhone(String(pm.phone));
    if (pm.primarySkill) setPrimarySkill(String(pm.primarySkill));
    if (pm.experience) setExperience(String(pm.experience));
    if (pm.travel) setTravel(String(pm.travel));
    if (pm.payType) setPayType(String(pm.payType));
    if (pm.bio) setBio(String(pm.bio));
  }, [isLoaded, user]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/jobseeker/profile" />
      </SignedOut>
    );
  }

  async function saveProfile(e) {
    e.preventDefault();
    if (!user) return;
    try {
      setSaving(true);
      setSaved(false);
      await user.update({
        publicMetadata: {
          ...(user.publicMetadata || {}),
          role: "jobseeker",
          resumeUrl: resumeUrl.trim(),
          phone: phone.trim(),
          primarySkill,
          experience,
          travel,
          payType,
          bio,
        },
      });
      setSaved(true);
      alert("Profile saved!");
    } catch (err) {
      console.error(err);
      alert("Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  const email = user?.primaryEmailAddress?.emailAddress || "";
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "";

  return (
    <SignedIn>
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>My Jobseeker Profile</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <form onSubmit={saveProfile} style={card}>
          <div style={{ color: "#666", marginBottom: 8 }}>
            Signed in as <strong>{email}</strong>
          </div>

          <Row>
            <Field label="Full Name">
              <input defaultValue={fullName} style={input} disabled />
            </Field>
            <Field label="Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 555-5555"
                style={input}
              />
            </Field>
          </Row>

          <Row>
            <Field label="Primary Skill">
              <select
                value={primarySkill}
                onChange={(e) => setPrimarySkill(e.target.value)}
                style={input}
              >
                <option value="">Select…</option>
                <option>Electrician</option>
                <option>HVAC</option>
                <option>Plumber</option>
                <option>Welder</option>
                <option>Millwright</option>
                <option>General Labor</option>
                <option>Other</option>
              </select>
            </Field>

            <Field label="Years of Experience">
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                style={input}
              >
                <option value="">Select…</option>
                <option>0–1</option>
                <option>2–3</option>
                <option>4–6</option>
                <option>7–10</option>
                <option>10+</option>
              </select>
            </Field>
          </Row>

          <Row>
            <Field label="Willing to Travel?">
              <select
                value={travel}
                onChange={(e) => setTravel(e.target.value)}
                style={input}
              >
                <option>Yes</option>
                <option>No</option>
                <option>Maybe</option>
              </select>
            </Field>

            <Field label="Preferred Pay Type">
              <select
                value={payType}
                onChange={(e) => setPayType(e.target.value)}
                style={input}
              >
                <option>Hourly</option>
                <option>Salary</option>
                <option>1099</option>
              </select>
            </Field>
          </Row>

          <Field label="Resume Link (URL)">
            <input
              type="url"
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              placeholder="Paste Google Drive/Dropbox share link"
              style={input}
              required
            />
            <small style={{ color: "#666" }}>
              Tip: upload a PDF to Google Drive, set “Anyone with the link → Viewer”, then paste the link.
            </small>
          </Field>

          <Field label="Summary / Bio">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="2–4 sentences about your skills, certifications, and where you can travel."
              rows={5}
              style={textarea}
            />
          </Field>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" style={btnDark} disabled={saving}>
              {saving ? "Saving…" : "Save Profile"}
            </button>
            <a href="/dashboard" style={btnLight}>Back to Dashboard</a>
          </div>

          {saved && (
            <div style={callout}>✅ Saved! Your profile is stored on your account.</div>
          )}
        </form>
      </main>
    </SignedIn>
  );
}

/* --- mini components & styles --- */
function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={{ fontSize: 13, color: "#444", fontWeight: 600 }}>{label}</label>
      {children}
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
  maxWidth: 900,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const card = {
  width: "100%",
  maxWidth: 900,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  display: "grid",
  gap: 14,
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

const btnDark = {
  background: "#111",
  color: "#fff",
  border: "1px solid #111",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const btnLight = {
  display: "inline-block",
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
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
