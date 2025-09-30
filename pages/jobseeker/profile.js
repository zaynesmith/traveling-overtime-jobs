import { SignedIn, SignedOut, RedirectToSignIn, useUser, UserButton } from "@clerk/nextjs";
import { useRequireRole } from "../../lib/useRequireRole";
import { useEffect, useState } from "react";

export default function JobseekerProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const hasJobseekerRole = useRequireRole("jobseeker");
  const [fullName, setFullName] = useState("");
  const [trade, setTrade] = useState("");
  const [zip, setZip] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const pm = user.publicMetadata || {};
    if (user.fullName) setFullName(user.fullName);
    if (pm.trade) setTrade(String(pm.trade));
    if (pm.zip) setZip(String(pm.zip));
    if (pm.resumeUrl) setResumeUrl(String(pm.resumeUrl));
  }, [isLoaded, user]);

  if (!isLoaded) return null;
  if (!isSignedIn) return (<SignedOut><RedirectToSignIn redirectUrl="/jobseeker/profile" /></SignedOut>);
  if (!hasJobseekerRole) return null;

  async function handleSave(e) {
    e.preventDefault();
    try {
      setSaving(true); setSaved(false);
      await user.update({
        publicMetadata: {
          ...(user.publicMetadata || {}),
          trade: trade.trim(),
          zip: zip.trim(),
          resumeUrl: resumeUrl.trim(),
        },
      });
      if (fullName && fullName !== user.fullName) {
        await user.update({ firstName: fullName.split(" ")[0] || user.firstName, lastName: fullName.split(" ").slice(1).join(" ") || user.lastName });
      }
      setSaved(true);
    } catch {
      alert("Could not save profile. Please try again.");
    } finally { setSaving(false); }
  }

  return (
    <SignedIn>
      <main className="container">
        <header className="max960" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h1 style={{ margin: 0 }}>My Profile</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <section className="card max960">
          <form onSubmit={handleSave} style={{ display:"grid", gap:12 }}>
            <Field label="Full Name"><input className="input" value={fullName} onChange={(e)=>setFullName(e.target.value)} placeholder="Jane Electrician" /></Field>
            <Field label="Trade"><input className="input" value={trade} onChange={(e)=>setTrade(e.target.value)} placeholder="Electrician / Millwright / Welder…" /></Field>
            <Field label="ZIP"><input className="input" value={zip} onChange={(e)=>setZip(e.target.value)} placeholder="77001" /></Field>
            <Field label="Resume URL (link)"><input className="input" value={resumeUrl} onChange={(e)=>setResumeUrl(e.target.value)} placeholder="https://..." /></Field>
            <div style={{ display:"flex", gap:12, marginTop:8 }}>
              <button className="btn" disabled={saving}>{saving ? "Saving…" : "Save Profile"}</button>
              <a href="/jobseeker" className="pill-light">Back to Jobseeker Area</a>
            </div>
            {saved && <div style={{ marginTop:10, background:"#f6fff6", border:"1px solid #bfe6bf", color:"#225c22", padding:"10px 12px", borderRadius:10, fontSize:14 }}>✅ Saved to your account.</div>}
          </form>
        </section>
      </main>
    </SignedIn>
  );
}

function Field({ label, children }) { return (<div style={{ display:"grid", gap:6 }}><label style={{ fontSize:13, color:"#444" }}>{label}</label>{children}</div>); }
