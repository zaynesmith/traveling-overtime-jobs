// pages/employer/profile.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
  UserButton,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function EmployerProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const role = user?.publicMetadata?.role;

  // local state (prefill from Clerk metadata if available)
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const pm = user.publicMetadata || {};
    if (pm.companyName) setCompanyName(String(pm.companyName));
    if (pm.companyContactEmail) setContactEmail(String(pm.companyContactEmail));
    if (pm.companyWebsite) setWebsite(String(pm.companyWebsite));
    if (pm.companyPhone) setPhone(String(pm.companyPhone));
  }, [isLoaded, user]);

  if (!isLoaded) return null;

  // force sign-in if needed
  if (!isSignedIn) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer/profile" />
      </SignedOut>
    );
  }

  // require employer role
  if (role !== "employer") {
    return (
      <main style={wrap}>
        <Header />
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Employer access required</h2>
          <p>
            Your current role is <strong>{role || "not set"}</strong>. Switch to
            the Employer role from your <a href="/dashboard">Dashboard</a> or the{" "}
            <a href="/employer">Employer Area</a>.
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
          role: "employer",
          companyName: companyName.trim(),
          companyContactEmail: contactEmail.trim(),
          companyWebsite: website.trim(),
          companyPhone: phone.trim(),
        },
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
      alert("Could not save your company profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SignedIn>
      <main style={wrap}>
        <Header />
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Company Profile</h2>
          <p style={{ marginTop: 4, color: "#555" }}>
            Save company details so they prefill when posting jobs.
          </p>

          <form onSubmit={handleSave} style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <Field label="Company Name*">
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ACME Industrial"
                style={input}
                required
              />
            </Field>

            <Field label="Contact Email*">
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="jobs@acme.com"
                style={input}
                required
              />
            </Field>

            <Field label="Company Website">
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://acmeindustrial.com"
                style={input}
              />
            </Field>

            <Field label="Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                style={input}
              />
            </Field>

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button type="submit" style={btnPrimary} disabled={saving}>
                {saving ? "Saving…" : "Save Company Profile"}
              </button>
              <a href="/employer" style={pillLight}>Back to Employer Area</a>
            </div>

            {saved && (
              <div style={callout}>
                ✅ Saved! Your company profile is stored on your account.
              </div>
            )}
          </form>
        </section>
      </main>
    </SignedIn>
  );
}

/* --- tiny UI helpers --- */
function Header() {
  return (
    <header style={header}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Employer Profile</h1>
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
