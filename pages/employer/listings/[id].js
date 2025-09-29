// pages/employer/listings/[id].js
import { useRouter } from "next/router";
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function EmployerListingDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [job, setJob] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Load the job by ID from localStorage
  useEffect(() => {
    if (!id) return;
    try {
      const raw = localStorage.getItem("myEmployerJobs");
      const list = raw ? JSON.parse(raw) : [];
      const found = list.find((j) => j.id === id);
      if (!found) {
        setNotFound(true);
      } else {
        // ensure status exists
        setJob({ status: "Open", ...found, status: found.status || "Open" });
      }
    } catch {
      setNotFound(true);
    }
  }, [id]);

  function saveJob(updated) {
    try {
      const raw = localStorage.getItem("myEmployerJobs");
      const list = raw ? JSON.parse(raw) : [];
      const next = list.map((j) => (j.id === updated.id ? updated : j));
      localStorage.setItem("myEmployerJobs", JSON.stringify(next));
      setJob(updated);
    } catch (e) {
      console.error(e);
      alert("Could not save changes.");
    }
  }

  function handleDelete() {
    if (!confirm("Delete this job posting?")) return;
    try {
      const raw = localStorage.getItem("myEmployerJobs");
      const list = raw ? JSON.parse(raw) : [];
      const next = list.filter((j) => j.id !== id);
      localStorage.setItem("myEmployerJobs", JSON.stringify(next));
      router.push("/employer/listings");
    } catch (e) {
      console.error(e);
      alert("Could not delete this job.");
    }
  }

  if (notFound) {
    return (
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Listing Not Found</h1>
          <a href="/employer/listings" style={pillLight}>Back to Listings</a>
        </header>
        <section style={card}>
          We couldn't find a job with ID <code>{id}</code>.
        </section>
      </main>
    );
  }

  if (!job) return null;

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl={`/employer/listings/${id}`} />
      </SignedOut>

      <SignedIn>
        <main style={wrap}>
          <header style={header}>
            <h1 style={{ margin: 0 }}>Edit Listing</h1>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <a href="/employer/listings" style={pillLight}>Back to Listings</a>
              <UserButton afterSignOutUrl="/" />
            </div>
          </header>

          <section style={card}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (saving) return;
                setSaving(true);
                const form = new FormData(e.currentTarget);

                const updated = {
                  ...job,
                  title: String(form.get("title") || "").trim(),
                  company: String(form.get("company") || "").trim(),
                  trade: String(form.get("trade") || "").trim(),
                  location: String(form.get("location") || "").trim(),
                  payRate: String(form.get("payRate") || "").trim(),
                  perDiem: String(form.get("perDiem") || "").trim(),
                  overtime: String(form.get("overtime") || "").trim(),
                  startDate: String(form.get("startDate") || ""),
                  travelRequired: String(form.get("travelRequired") || "Yes"),
                  description: String(form.get("description") || "").trim(),
                  contactEmail: String(form.get("contactEmail") || "").trim(),
                };

                // basic required check
                if (!updated.title || !updated.company || !updated.location || !updated.description) {
                  alert("Please fill in title, company, location, and description.");
                  setSaving(false);
                  return;
                }

                saveJob(updated);
                setSaving(false);
                alert("Saved.");
              }}
              style={{ display: "grid", gap: 12 }}
            >
              <Row>
                <Input name="title" label="Job Title*" defaultValue={job.title} placeholder="Journeyman Electrician" />
                <Input name="company" label="Company*" defaultValue={job.company} placeholder="ACME Industrial" />
              </Row>

              <Row>
                <Input name="trade" label="Trade" defaultValue={job.trade || ""} placeholder="Electrical / Instrumentation / Welding / …" />
                <Input name="location" label="Location*" defaultValue={job.location} placeholder="City, State" />
              </Row>

              <Row>
                <Input name="payRate" label="Pay Rate" defaultValue={job.payRate || ""} placeholder="$38/hr" />
                <Input name="perDiem" label="Per Diem" defaultValue={job.perDiem || ""} placeholder="$100/day" />
              </Row>

              <Row>
                <Input name="overtime" label="Overtime" defaultValue={job.overtime || ""} placeholder="6x10s / OT after 40 / etc." />
                <Input name="startDate" type="date" label="Start Date" defaultValue={job.startDate || ""} />
              </Row>

              <Row>
                <Select
                  name="travelRequired"
                  label="Travel Required"
                  defaultValue={job.travelRequired || "Yes"}
                  options={["Yes", "No"]}
                />
                <Input name="contactEmail" type="email" label="Contact Email" defaultValue={job.contactEmail || ""} placeholder="jobs@company.com" />
              </Row>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={labelStyle}>Description*</label>
                <textarea
                  name="description"
                  defaultValue={job.description || ""}
                  rows={6}
                  placeholder="Duties, requirements, shift, duration, tools, PPE, etc."
                  style={textarea}
                />
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                <button type="submit" style={btnPrimary} disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...job, status: job.status === "Open" ? "Closed" : "Open" };
                    saveJob(updated);
                  }}
                  style={outlineBtn}
                >
                  {job.status === "Open" ? "Close Listing" : "Reopen Listing"}
                </button>

                <button type="button" onClick={handleDelete} style={dangerBtn}>
                  Delete Listing
                </button>

                <a href={`/jobseeker/search/${job.id}`} style={pillLight}>
                  View as Jobseeker
                </a>
              </div>
            </form>
          </section>
        </main>
      </SignedIn>
    </>
  );
}

/* ---------- tiny UI helpers ---------- */
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
function Input({ name, label, defaultValue, placeholder, type = "text" }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        style={input}
      />
    </div>
  );
}
function Select({ name, label, defaultValue, options = [] }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      <select name={name} defaultValue={defaultValue} style={input}>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

/* ---------- styles ---------- */
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
const outlineBtn = {
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};
const dangerBtn = {
  background: "#fff",
  color: "#b00020",
  border: "1px solid #f3c1c6",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};