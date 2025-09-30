import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

const INITIAL_FORM = {
  title: "",
  company: "",
  location: "",
  trade: "",
  payRate: "",
  perDiem: "",
  overtime: "",
  startDate: "",
  travelRequired: "Yes",
  contactEmail: "",
  description: "",
};

const DRAFT_STORAGE_KEY = "public-post-job-draft";

export default function PublicPostJob() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const hasHydratedDraft = useRef(false);

  useEffect(() => {
    if (hasHydratedDraft.current || typeof window === "undefined") {
      return;
    }

    try {
      const savedDraft = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        if (parsedDraft && typeof parsedDraft === "object") {
          setForm((prev) => ({ ...prev, ...parsedDraft }));
        }
      }
    } catch (error) {
      console.error("Failed to restore saved job draft", error);
    } finally {
      hasHydratedDraft.current = true;
    }
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!isLoaded) {
      return;
    }

    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
      }
    } catch (error) {
      console.error("Failed to save job draft", error);
    }

    if (!isSignedIn) {
      router.push({
        pathname: "/sign-in",
        query: { intent: "employer", redirect_url: "/onboard" },
      });
      return;
    }

    router.push("/employer/post");
  }

  return (
    <main className="container" style={{ padding: "48px 16px" }}>
      <div
        className="max960"
        style={{
          margin: "0 auto",
          display: "grid",
          gap: 24,
        }}
      >
        <header style={{ display: "grid", gap: 8 }}>
          <h1 style={{ margin: 0 }}>Post a Job</h1>
          <p style={{ margin: 0, color: "#4b5563" }}>
            Fill out the basic details for your listing. We’ll save everything once you sign in as an employer and finish
            publishing.
          </p>
        </header>

        <section
          className="card"
          style={{
            padding: 24,
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            background: "#fff",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.08)",
            display: "grid",
            gap: 20,
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <FieldRow>
              <TextField
                id="title"
                label="Job Title*"
                placeholder="Journeyman Electrician"
                value={form.title}
                onChange={(value) => updateField("title", value)}
                required
              />
              <TextField
                id="company"
                label="Company*"
                placeholder="ACME Industrial"
                value={form.company}
                onChange={(value) => updateField("company", value)}
                required
              />
            </FieldRow>

            <FieldRow>
              <TextField
                id="location"
                label="Location*"
                placeholder="City, State"
                value={form.location}
                onChange={(value) => updateField("location", value)}
                required
              />
              <TextField
                id="trade"
                label="Trade"
                placeholder="Electrical / Mechanical / Millwright…"
                value={form.trade}
                onChange={(value) => updateField("trade", value)}
              />
            </FieldRow>

            <FieldRow>
              <TextField
                id="payRate"
                label="Pay Rate"
                placeholder="$38/hr"
                value={form.payRate}
                onChange={(value) => updateField("payRate", value)}
              />
              <TextField
                id="perDiem"
                label="Per Diem"
                placeholder="$100/day"
                value={form.perDiem}
                onChange={(value) => updateField("perDiem", value)}
              />
            </FieldRow>

            <FieldRow>
              <TextField
                id="overtime"
                label="Overtime"
                placeholder="6x10s / OT after 40"
                value={form.overtime}
                onChange={(value) => updateField("overtime", value)}
              />
              <TextField
                id="startDate"
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={(value) => updateField("startDate", value)}
              />
            </FieldRow>

            <FieldRow>
              <SelectField
                id="travelRequired"
                label="Travel Required"
                value={form.travelRequired}
                onChange={(value) => updateField("travelRequired", value)}
                options={[
                  { label: "Yes", value: "Yes" },
                  { label: "No", value: "No" },
                ]}
              />
              <TextField
                id="contactEmail"
                label="Contact Email*"
                placeholder="jobs@acme.com"
                type="email"
                value={form.contactEmail}
                onChange={(value) => updateField("contactEmail", value)}
                required
              />
            </FieldRow>

            <div style={{ display: "grid", gap: 6 }}>
              <label htmlFor="description" style={{ fontSize: 13, color: "#374151" }}>
                Job Description*
              </label>
              <textarea
                id="description"
                className="input"
                rows={6}
                placeholder="Duties, schedule, duration, travel expectations, PPE, and any other key info."
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                required
              />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
              <button className="btn" type="submit" style={{ minWidth: 180 }}>
                Post Job
              </button>
              <LinkButton href="/employer">
                Cancel
              </LinkButton>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>* Required fields</p>
          </form>
        </section>

        <aside
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 24,
            background: "#f9fafb",
            color: "#4b5563",
            display: "grid",
            gap: 12,
          }}
        >
          <strong style={{ color: "#111827" }}>Why we ask you to sign in</strong>
          <p style={{ margin: 0 }}>
            Employer accounts make it easy to edit your posting later, manage interested candidates, and keep applicants up to
            date. Signing in also protects your company contact information.
          </p>
        </aside>
      </div>
    </main>
  );
}

function FieldRow({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      }}
    >
      {children}
    </div>
  );
}

function TextField({ id, label, value, onChange, placeholder, type = "text", required }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, color: "#374151" }}>
        {label}
      </label>
      <input
        id={id}
        className="input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

function SelectField({ id, label, value, onChange, options }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, color: "#374151" }}>
        {label}
      </label>
      <select
        id={id}
        className="input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function LinkButton({ href, children }) {
  return (
    <a
      href={href}
      className="pill-light"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 18px",
        borderRadius: 9999,
        textDecoration: "none",
        fontWeight: 600,
      }}
    >
      {children}
    </a>
  );
}
