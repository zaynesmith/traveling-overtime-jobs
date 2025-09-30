import Link from "next/link";
import { useRouter } from "next/router";
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
} from "@clerk/nextjs";
import { RoleGateDenied, RoleGateLoading } from "../../../components/RoleGateFeedback";
import { useRequireRole } from "../../../lib/useRequireRole";
import { useRequireProfileCompletion } from "../../../lib/useRequireProfileCompletion";
import { employerJobs } from "../../../lib/demoEmployerData";

export default function EmployerJobDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const { status, canView, error } = useRequireRole("employer");
  const { status: profileStatus } = useRequireProfileCompletion(
    status === "authorized" ? "employer" : null
  );

  const job = typeof id === "string" ? employerJobs.find((item) => item.id === id) : undefined;
  const redirectUrl = typeof id === "string" ? `/employer/listings/${id}` : "/employer/listings";

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl={redirectUrl} />
      </SignedOut>

      <SignedIn>
        {status === "checking" || profileStatus === "loading" || profileStatus === "incomplete" ? (
          <RoleGateLoading role="employer" />
        ) : canView ? (
          <main className="container" style={{ padding: "40px 24px" }}>
            <div className="max960" style={{ display: "grid", gap: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
                    Job overview
                  </p>
                  <h1 style={{ margin: "6px 0 0" }}>{job?.title ?? "Posting not found"}</h1>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <Link href="/employer/listings" className="pill-light">
                    ← Back to listings
                  </Link>
                  <Link href="/employer" className="pill-light">
                    Employer dashboard
                  </Link>
                </div>
              </div>

              {job ? (
                <div className="card" style={{ display: "grid", gap: 16, padding: 24 }}>
                  <div>
                    <p style={{ margin: 0, color: "#475569" }}>{job.location}</p>
                    <p style={{ margin: "4px 0", color: "#334155" }}>
                      {job.payRate} • {job.perDiem}
                    </p>
                    <p style={{ margin: 0, color: "#475569" }}>{job.description}</p>
                    <small style={{ color: "#64748b" }}>Posted {job.postedAt}</small>
                  </div>

                  <div>
                    <h2 style={{ margin: "0 0 12px" }}>Applicants</h2>
                    {job.applicants.length === 0 ? (
                      <p style={{ margin: 0, color: "#64748b" }}>
                        No applicants yet. Share this posting to start receiving candidates.
                      </p>
                    ) : (
                      <div style={{ display: "grid", gap: 12 }}>
                        {job.applicants.map((applicant) => (
                          <ApplicantCard key={applicant.id} applicant={applicant} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: 24 }}>
                  <p style={{ margin: 0, color: "#475569" }}>
                    We couldn't find that posting. It may have been archived. Use the links above to return to your employer area.
                  </p>
                </div>
              )}
            </div>
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

function ApplicantCard({ applicant }) {
  return (
    <article
      className="card"
      style={{
        border: "1px solid rgba(15, 23, 42, 0.08)",
        borderRadius: 12,
        padding: "16px 20px",
        display: "grid",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>{applicant.name}</h3>
          <p style={{ margin: 0, color: "#475569" }}>{applicant.trade}</p>
        </div>
        <span
          style={{
            alignSelf: "flex-start",
            background: "#fef3c7",
            color: "#92400e",
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 12px",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {applicant.status}
        </span>
      </div>
      <p style={{ margin: 0, color: "#334155" }}>
        {applicant.yearsExperience} years experience
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
        <button className="btn" style={{ padding: "6px 14px", fontSize: 14 }}>View resume</button>
        <button className="pill-light" style={{ padding: "6px 14px", fontSize: 14 }}>
          Message candidate
        </button>
      </div>
    </article>
  );
}
