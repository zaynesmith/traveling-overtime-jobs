import { SignedIn, SignedOut, RedirectToSignIn, useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

const DRAFT_STORAGE_KEY = "public-post-job-draft";

export default function PostJob() {
  const { user, isLoaded } = useUser();
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    title: "",
    company: "",
    trade: "",
    location: "",
    payRate: "",
    perDiem: "",
    overtime: "",
    startDate: "",
    travelRequired: "Yes",
    description: "",
    contactEmail: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedDraft = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        if (parsedDraft && typeof parsedDraft === "object") {
          setForm((f) => ({ ...f, ...parsedDraft }));
        }
        window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to restore saved employer draft", error);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const pm = user.publicMetadata || {};
    setForm((f) => ({
      ...f,
      company: pm.companyName ? String(pm.companyName) : f.company,
      contactEmail:
        pm.companyContactEmail
          ? String(pm.companyContactEmail)
          : (user.primaryEmailAddress?.emailAddress || f.contactEmail),
    }));
  }, [isLoaded, user]);

  const canSubmit = useMemo(() => {
    return (
      form.title.trim() &&
      form.company.trim() &&
      form.location.trim() &&
      form.description.trim() &&
      form.contactEmail.trim()
    );
  }, [form]);

  useEffect(() => { if (typeof window !== "undefined") window.scrollTo(0, 0); }, []);

  if (!isLoaded) return null;

  if (!user) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer/post" />
      </SignedOut>
    );
  }

  return (
    <SignedIn>
      <main className="container">
        <header className="max960" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h1 style={{ margin: 0 }}>Post a Job</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <section className="card max960">
          {submitted ? (
            <Success />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSaving(true);
                setTimeout(() => { setSaving(false); setSubmitted(true); }, 800);
              }}
              style={{ display: "grid", gap: 12 }}
            >
              <Row>
                <Input label="Job Title*" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Journeyman Electrician" />
                <Input label="Company*" value={form.company} onChange={(v) => setForm({ ...form, company: v })} placeholder="ACME Industrial" />
              </Row>

              <Row>
                <Input label="Trade" value={form.trade} onChange={(v) => setForm({ ...form, trade: v })} placeholder="Electrical / Mechanical…" />
                <Input label="Location*" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="City, State" />
              </Row>

              <Row>
                <Input label="Pay Rate" value={form.payRate} onChange={(v) => setForm({ ...form, payRate: v })} placeholder="$38/hr" />
                <Input label="Per Diem" value={form.perDiem} onChange={(v) => setForm({ ...form, perDiem: v })} placeholder="$100/day" />
              </Row>

              <Row>
                <Input label="Overtime" value={form.overtime} onChange={(v) => setForm({ ...form, overtime: v })} placeholder="6x10s / OT after 40" />
                <Input label="Start Date" type="date" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
              </Row>

              <Row>
                <Select label="Travel Required" value={form.travelRequired} onChange={(v) => setForm({ ...form, travelRequired: v })} options={["Yes","No"]} />
                <Input label="Contact Email*" type="email" value={form.contactEmail} onChange={(v) => setForm({ ...form, contactEmail: v })} placeholder="jobs@acme.com" />
              </Row>

              <div style={{ display:"grid", gap:6 }}>
                <label style={{ fontSize:13, color:"#444" }}>Description*</label>
                <textarea rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="Duties, requirements, shift, duration, tools, PPE, etc." />
              </div>

              <div style={{ display:"flex", gap:12, marginTop:8 }}>
                <button className="btn" disabled={!canSubmit || saving}>{saving ? "Posting…" : "Post Job"}</button>
                <a href="/employer" className="pill-light">Cancel</a>
              </div>
              <p style={{ marginTop:6, fontSize:12, color:"#666" }}>* Required fields</p>
            </form>
          )}
        </section>
      </main>
    </SignedIn>
  );
}

function Success() {
  return (
    <div style={{ textAlign:"center" }}>
      <h2 style={{ marginTop:0 }}>Job submitted (demo)</h2>
      <p style={{ marginBottom:16 }}>No database yet — this confirms the form works.</p>
      <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
        <a href="/employer" className="pill-light">Back to Employer Area</a>
        <a href="/employer/listings" className="pill-light">Manage Listings</a>
      </div>
    </div>
  );
}
function Row({ children }) { return <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>{children}<style jsx>{`@media (max-width: 720px){div{grid-template-columns:1fr}}`}</style></div>; }
function Input({ label, value, onChange, placeholder, type="text" }) { return (<div style={{ display:"grid", gap:6 }}><label style={{ fontSize:13, color:"#444" }}>{label}</label><input className="input" type={type} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} /></div>); }
function Select({ label, value, onChange, options }) { return (<div style={{ display:"grid", gap:6 }}><label style={{ fontSize:13, color:"#444" }}>{label}</label><select className="input" value={value} onChange={(e)=>onChange(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></div>); }