// pages/index.js
import Link from "next/link";
import { useState } from "react";

const TABS = [
  {
    id: "search",
    label: "Search Jobs",
    headline: "Find your next traveling overtime job",
    description:
      "Browse industrial and skilled trades listings that include per diem, travel pay, and overtime details.",
    actionLabel: "Browse job postings",
    href: "/jobseeker/search",
    tips: [
      "Filter by trade, company, or location to quickly narrow results.",
      "Save jobs to review later once you sign in as a jobseeker.",
    ],
  },
  {
    id: "post",
    label: "Post Jobs",
    headline: "Share openings with qualified travelers",
    description:
      "Draft the core details for your listing. You’ll be asked to sign in or create an employer account to publish it.",
    actionLabel: "Create a job listing",
    href: "/post-job",
    tips: [
      "Outline shift schedules, travel expectations, and per diem up front.",
      "Have your company contact details ready so applicants can reach you quickly.",
    ],
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const active = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  return (
    <>
      <section className="hero" role="region" aria-label="Traveling Overtime Jobs hero">
        <span className="overlay" aria-hidden="true" />
        <h1 className="title">Traveling Overtime Jobs</h1>
        <p className="subtitle">
          Discover vetted opportunities that include travel pay and overtime, or share openings with teams ready to hit the
          road.
        </p>
        <div className="pill-group">
          <Link className="pill" href="/jobseeker/search">
            Search job postings
          </Link>
          <Link className="pill" href="/post-job">
            Post a job
          </Link>
          <Link className="pill" href="/sign-up">
            Create an account
          </Link>
        </div>
      </section>

      <main className="container" style={{ padding: "48px 16px" }}>
        <div className="max960" style={{ margin: "0 auto", display: "grid", gap: 32 }}>
          <div style={{ textAlign: "center", display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0 }}>Choose how you’d like to get started</h2>
            <p style={{ margin: 0, color: "#555" }}>
              Jump straight into the tools designed for jobseekers and employers in traveling skilled trades.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Home page shortcuts"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {TABS.map((tab) => {
              const selected = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid",
                    borderColor: selected ? "#0d6efd" : "#d0d5dd",
                    background: selected ? "rgba(13, 110, 253, 0.1)" : "white",
                    color: selected ? "#0d6efd" : "#111827",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <section
            role="tabpanel"
            aria-live="polite"
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: "24px",
              background: "#fff",
              boxShadow: "0 4px 20px rgba(15, 23, 42, 0.08)",
              display: "grid",
              gap: 16,
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <h2 style={{ margin: 0 }}>{active.headline}</h2>
              <p style={{ margin: 0, color: "#4b5563" }}>{active.description}</p>
            </div>

            <ul style={{ margin: 0, paddingLeft: 20, color: "#4b5563", display: "grid", gap: 6 }}>
              {active.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>

            <div>
              <Link href={active.href}>
                <button className="btn" style={{ minWidth: 200 }}>{active.actionLabel}</button>
              </Link>
            </div>
          </section>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              color: "#6b7280",
              fontSize: 14,
            }}
          >
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
              <strong style={{ display: "block", color: "#111827", marginBottom: 6 }}>
                Employer or jobseeker accounts
              </strong>
              Sign in with the appropriate role to unlock saved jobs, applications, and employer tools tailored to you.
            </div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
              <strong style={{ display: "block", color: "#111827", marginBottom: 6 }}>
                Need an account?
              </strong>
              Create one in minutes on the sign-up page. Employers can manage listings and jobseekers can track applications.
            </div>
          </div>
        </div>
      </main>
    </>
  );
}