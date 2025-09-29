// pages/jobseeker/profile.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function JobseekerProfile() {
  const { isLoaded, isSignedIn, user } = useUser();

  const [fullName, setFullName] = useState("");
  const [homeLocation, setHomeLocation] = useState(""); // City, ST
  const [primaryTrade, setPrimaryTrade] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [travel, setTravel] = useState("Yes");
  const [desiredPay, setDesiredPay] = useState("");
  const [resumeUrl, setResumeUrl] = useState(""); // link to PDF or Google Drive
  const [about, setAbout] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // Local storage key (per user if available)
  const lsKey =
    typeof window !== "undefined"
      ? `jobseekerProfile_${user?.id || "anon"}`
      : "jobseekerProfile_anon";

  // Load existing profile from Clerk unsafeMetadata or localStorage
  useEffect(() => {
    if (!isLoaded) return;

    // 1) Try Clerk (unsafeMetadata is client-writable)
    const um = (user?.unsafeMetadata || {});
    const fromClerk = {
      fullName: um.fullName || "",
      homeLocation: um.homeLocation || "",
      primaryTrade: um.primaryTrade || "",
      yearsExp: um.yearsExp || "",
      travel: um.travel || "Yes",
      desiredPay: um.desiredPay || "",
      resumeUrl: um.resumeUrl || "",
      about: um.about || "",
    };

    // 2) Try localStorage (fallback)
    let fromLocal = {};
    try {
      const raw = localStorage.getItem(lsKey);
      fromLocal = raw ? JSON.parse(raw) : {};
    } catch {
      fromLocal = {};
    }

    const merged = { ...fromClerk, ...fromLocal };

    setFullName(merged.fullName || user?.fullName || "");
    setHomeLocation(merged.homeLocation || "");
    setPrimaryTrade(merged.primaryTrade || "");
    setYearsExp(merged.yearsExp || "");
    setTravel(merged.travel || "Yes");
    setDesiredPay(merged.desiredPay || "");
    setResumeUrl(merged.resumeUrl || "");
    setAbout(merged.about || "");
  }, [isLoaded, user]); // eslint-disable-line

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
    setSaving(true);
    setSavedMsg("");

    const payload = {
      fullName: fullName.trim(),
      homeLocation: homeLocation.trim(),
      primaryTrade: primaryTrade.trim(),
      yearsExp: yearsExp.trim(),
      travel,
      desiredPay: desiredPay.trim(),
      resumeUrl: resumeUrl.trim(),
      about: about.trim(),
    };

    // Save to localStorage so it's instant & resilient
    try {
      localStorage.setItem(lsKey, JSON.stringify(payload));
    } catch {}

    // Best-effort: also save to Clerk unsafeMetadata so it follows the user across devices
    try {
      await user.setUnsafeMetadata({
        ...(user.unsafeMetadata || {}),
        ...payload,
      });
      setSavedMsg("Saved to your account.");
    } catch (err) {
      console.error("Clerk unsafeMetadata save failed (using local only):", err);
      setSavedMsg("Saved locally on this device.");
    } finally {
      setSaving(false);
    }
  }

  // Optional lightweight file “upload”: stores a small PDF as base64 in localStorage and sets resumeUrl to a blob link.
  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/pdf|text|msword|officedocument/.test(file.type) && !file.name.endsWith(".pdf")) {
      alert("Please select a PDF or document file.");
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      alert("File too large for local storage demo (2.5 MB max). Please host it elsewhere and paste a link.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const base64 = String(reader.result || "");
        const obj = {
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: base64,
          uploadedAt: new Date().toISOString(),
        };
        localStorage.setItem(`${lsKey}_resumeFile`, JSON.stringify(obj));
        setResumeUrl("(Local upload)"); // just a marker; employers can’t fetch localStorage
        setSavedMsg("Résumé stored locally. Consider also pasting a shareable link.");
      } catch (err) {
        console.error(err);
        alert("Could not store file locally. Paste a public link instead.");
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <SignedIn>
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>My Profile</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <section style={card}>
          <form onSubmit={handleSave} style={{ display: "grid", gap: 12 }}>
            <Row>
              <Input label="Full Name*" value={fullName} onChange={setFullName} placeholder="Jane Doe" required />
              <Input label="Home Location (City, ST)*" value={homeLocation} onChange={setHomeLocation} placeholder="Houston, TX" required />
            </Row>

            <Row>
              <Input label="Primary Trade*" value={primaryTrade} onChange={setPrimaryTrade} placeholder="Electrical / Welding / Instrumentation / Millwright…" required />
              <Input label="Years Experience" value={yearsExp} onChange={setYearsExp} placeholder="5+" />
            </Row>

            <Row>
              <Select
                label="Willing to Travel"
                value={travel}
                onChange={setTravel}
                options={["Yes", "No", "Occasionally"]}
              />
              <Input label="Desired Pay" value={desiredPay} onChange={setDesiredPay} placeholder="$38/hr" />
            </Row>

            <Input
              label="Résumé Link (PDF/Drive/Dropbox)"
              value={resumeUrl}
              onChange={setResumeUrl}
              placeholder="https://…/my_resume.pdf"
            />

            <div style={{ display: "grid", gap: 6 }}>
              <label style={label}>Or Upload a Small Résumé (demo)</label>
              <input type="file" accept=".pdf,.doc,.docx,.txt,application/pdf" onChange={handleFile} />
              <small style={{ color: "#666" }}>
                For demo only: stored in your browser. Max 2.5 MB. For real use, paste a public link above.
              </small>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label style={label}>About Me</label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={5}
                placeholder="Short summary of your skills, certifications, travel readiness, etc."
                style={textarea}
              />
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
              <button type="submit" style={btnPrimary} disabled={saving}>
                {saving ? "Saving…" : "Save Profile"}
              </button>
              <a href="/jobseeker" style={pillLight}>Back to Jobseeker Dashboard</a>
            </div>

            {savedMsg && (
              <div style={callout}>✅ {savedMsg}</div>
            )}
          </form>
        </section>
      </main>
    </SignedIn>
  );
}

/* ---- small UI helpers ---- */
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
function Input({ label, value, onChange, placeholder = "", required = false }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={input}
        required={required}
      />
    </div>
  );
}
function Select({ label, value, onChange, options = [] }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={input}>
        {options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
      </select>
    </div>
  );
}

/* ---- styles ---- */
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
  padding: 20,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
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
  marginTop: 8,
  background: "#f6fff6",
  border: "1px solid #bfe6bf",
  color: "#225c22",
  padding: "10px 12px",
  borderRadius: 10,
  fontSize: 14,
};