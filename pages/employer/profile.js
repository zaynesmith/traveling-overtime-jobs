import { SignedIn, SignedOut, RedirectToSignIn, useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function EmployerProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
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
  if (!isSignedIn) return (<SignedOut><RedirectToSignIn redirectUrl="/employer/profile" /></SignedOut>);

  async function handleSave(e) {
    e.preventDefault();
    try {
      setSaving(true); setSaved(false);
      await user.update({
        publicMetadata: {
          ...(user.publicMetadata || {}),
          companyName: companyName.trim(),
          companyContactEmail: contactEmail.trim(),
          companyWebsite: website.trim(),
          companyPhone: phone.trim(),
        },
      });
      setSaved(true);
    } catch {
      alert("Could not save your company profile. Please try again.");
    } finally { setSaving(false); }
  }

  return (
    <SignedIn>
      <main className="container">
        <header className="max960" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h1 style={{ margin: 0 }}>Employer Profile</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <section className="card max960">
          <h2 style={{ marginTop: 0 }}>Company Profile</h2>
          <p style={{ color:"#555" }}>These values prefill the Post Job form.</p>

          <form onSubmit={handleSave} style={{ display:"grid", gap:12, marginTop:16 }}>
            <Field label="Company Name*">
              <input className="input" value={companyName} onChange={(e)=>setCompanyName(e.target.value)} placeholder="ACME Industrial" required />
            </Field>
            <Field label="Contact Email*">
              <input className="input" type="email" value={contactEmail} onChange={(e)=>setContactEmail(e.target.value)} placeholder="jobs@acme.com" required />
            </Field>
            <Field label="Company Website">
              <input className="input" type="url" value={website} onChange={(e)=>setWebsite(e.target.value)} placeholder="https://acmeindustrial.com" />
            </Field>
            <Field label="Phone">
              <input className="input" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </Field>

            <div style={{ display:"flex", gap:12, marginTop:8 }}>
              <button className="btn" disabled={saving}>{saving ? "Saving…" : "Save Company Profile"}</button>
              <a href="/employer" className="pill-light">Back to Employer Area</a>
            </div>
            {saved && <div style={{ marginTop:10, background:"#f6fff6", border:"1px solid #bfe6bf", color:"#225c22", padding:"10px 12px", borderRadius:10, fontSize:14 }}>✅ Saved to your account.</div>}
          </form>
        </section>
      </main>
    </SignedIn>
  );
}

function Field({ label, children }) {
  return (<div style={{ display:"grid", gap:6 }}><label style={{ fontSize:13, color:"#444" }}>{label}</label>{children}</div>);
}