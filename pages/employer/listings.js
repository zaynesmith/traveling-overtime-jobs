// pages/employer/listings.js
import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
} from "@clerk/nextjs";
import {
  RoleGateDenied,
  RoleGateLoading,
  RoleGateRolePicker,
} from "../../components/RoleGateFeedback";
import { useRequireRole } from "../../lib/useRequireRole";
import { useRequireProfileCompletion } from "../../lib/useRequireProfileCompletion";
import { employerJobs } from "../../lib/demoEmployerData";

export default function EmployerListings() {
  const { user } = useUser();
  const {
    status,
    canView,
    error,
    assignRole,
    isAssigningRole,
  } = useRequireRole("employer");
  const { status: profileStatus } = useRequireProfileCompletion(
    status === "authorized" ? "employer" : null
  );

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer/listings" />
      </SignedOut>

      <SignedIn>
        {status === "needs-role" ? (
          <RoleGateRolePicker
            onSelectRole={assignRole}
            isAssigning={isAssigningRole}
            error={error}
          />
        ) : status === "checking" ||
          profileStatus === "loading" ||
          profileStatus === "incomplete" ? (
          <RoleGateLoading role="employer" />
        ) : canView ? (
          <main style={wrap}>
            <header style={header}>
              <div>
                <h1 style={{ margin: 0 }}>Manage job postings</h1>
                <p style={{ margin: "6px 0 0", color: "#475569" }}>
                  Monitor every opening you've published and review incoming applicants.
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/employer" className="pill-light">
                  ← Back to dashboard
                </Link>
                <Link href="/employer/post" className="btn" style={{ padding: "8px 16px", fontSize: 14 }}>
                  Post new job
                </Link>
              </div>
            </header>

            <section style={list}>
              {employerJobs.map((job) => (
                <article key={job.id} style={card}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <h2 style={{ margin: 0 }}>{job.title}</h2>
                        <p style={{ margin: 0, color: "#475569" }}>{job.location}</p>
                      </div>
                      <StatusPill>{job.applicants.length} applicant{job.applicants.length === 1 ? "" : "s"}</StatusPill>
                    </div>
                    <p style={{ margin: 0, color: "#334155" }}>
                      {job.payRate} • {job.perDiem}
                    </p>
                    <p style={{ margin: 0, color: "#475569" }}>{job.description}</p>
                    <small style={{ color: "#64748b" }}>Posted {job.postedAt}</small>
                  </div>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
                    <Link href={`/employer/listings/${job.id}`} className="btn" style={{ padding: "8px 16px", fontSize: 14 }}>
                      Review applicants
                    </Link>
                    <Link href="/employer/post" className="pill-light" style={{ fontSize: 14 }}>
                      Duplicate posting
                    </Link>
                  </div>
                </article>
              ))}
            </section>
          </main>
        ) : (
          <RoleGateDenied
            expectedRole="employer"
            status={status}
            error={error}
            currentRole={user?.publicMetadata?.role}
          />
        )}
      </SignedIn>
    </>
  );
}

const wrap = {
  minHeight: "100vh",
  padding: "40px 24px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 24,
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
};

const header = {
  width: "100%",
  maxWidth: 960,
  display: "grid",
  gap: 16,
};

const list = {
  width: "100%",
  maxWidth: 960,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const card = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

function StatusPill({ children }) {
  return (
    <span
      style={{
        alignSelf: "flex-start",
        background: "#eff6ff",
        color: "#1d4ed8",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        padding: "6px 12px",
        letterSpacing: 0.5,
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}
