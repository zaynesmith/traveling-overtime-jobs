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

export default function EmployerHome() {
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
        <RedirectToSignIn redirectUrl="/employer" />
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
          <main className="container" style={{ paddingBottom: 56 }}>
            <section className="max960" style={{ display: "grid", gap: 24 }}>
              <div style={{ display: "grid", gap: 12 }}>
                <h1 style={{ margin: 0 }}>Employer Dashboard</h1>
                <p style={{ margin: 0, color: "#475569" }}>
                  Manage your openings, review applicants, and source new talent
                  without leaving the employer workspace.
                </p>
              </div>

              <div
                className="grid"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
              >
                <QuickAction href="/employer/post" title="Post a Job" description="Create and publish a new opening in minutes." />
                <QuickAction href="/employer/listings" title="Manage Jobs" description="Track every job you've posted and view applicants." />
                <QuickAction href="/employer/talent" title="Talent Search" description="Search the resume database for qualified candidates." />
                <QuickAction href="/employer/profile" title="Company Profile" description="Update your hiring details and contact preferences." />
              </div>
            </section>

            <section className="max960 card" style={{ marginTop: 32 }}>
              <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0 }}>Your active jobs</h2>
                  <p style={{ margin: "6px 0 0", color: "#475569" }}>
                    Review performance at a glance and drill into applicants for each posting.
                  </p>
                </div>
                <Link href="/employer/listings" className="pill-light">
                  Manage jobs
                </Link>
              </header>

              <div style={{ marginTop: 20, display: "grid", gap: 16 }}>
                {employerJobs.map((job) => (
                  <article
                    key={job.id}
                    style={{
                      border: "1px solid rgba(15, 23, 42, 0.08)",
                      borderRadius: 12,
                      padding: "16px 20px",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <h3 style={{ margin: 0 }}>{job.title}</h3>
                        <p style={{ margin: "4px 0", color: "#475569" }}>
                          {job.location} • {job.payRate} • {job.perDiem}
                        </p>
                      </div>
                      <Badge>{job.applicants.length} applicant{job.applicants.length === 1 ? "" : "s"}</Badge>
                    </div>

                    <p style={{ margin: "4px 0 12px", color: "#334155" }}>{job.description}</p>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <Link href={`/employer/listings/${job.id}`} className="btn" style={{ padding: "8px 16px", fontSize: 14 }}>
                        View applicants
                      </Link>
                      <Link href="/employer/post" className="pill-light" style={{ fontSize: 14 }}>
                        Post another job
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
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

function QuickAction({ href, title, description }) {
  return (
    <Link
      href={href}
      className="card link-card"
      style={{ display: "grid", gap: 8, textDecoration: "none" }}
    >
      <span style={{ fontWeight: 600, fontSize: 17 }}>{title}</span>
      <span style={{ color: "#475569", fontSize: 14 }}>{description}</span>
    </Link>
  );
}

function Badge({ children }) {
  return (
    <span
      style={{
        alignSelf: "flex-start",
        background: "#ecfdf5",
        color: "#047857",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        padding: "6px 12px",
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {children}
    </span>
  );
}
