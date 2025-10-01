import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import {
  ForbiddenOrSwitchRole,
  LoadingCard,
} from "../../components/RoleGateFeedback";
import { RoleSelectCard } from "../../components/RoleSelectCard";
import { useRequireRole } from "../../lib/useRequireRole";
import { useRequireProfileCompletion } from "../../lib/useRequireProfileCompletion";

export default function JobseekerHome() {
  const { user } = useUser();
  const { status, error, assignRole, isAssigningRole } = useRequireRole(
    "jobseeker"
  );
  const { status: profileStatus } = useRequireProfileCompletion(
    status === "ready" ? "jobseeker" : null
  );

  return (
    <>
      <SignedOut><RedirectToSignIn redirectUrl="/jobseeker" /></SignedOut>

      <SignedIn>
        {status === "checking" ||
        profileStatus === "loading" ||
        profileStatus === "incomplete" ? (
          <LoadingCard role="jobseeker" />
        ) : status === "needs-role" ? (
          <RoleSelectCard onChoose={assignRole} />
        ) : status === "forbidden" ? (
          <ForbiddenOrSwitchRole
            expectedRole="jobseeker"
            currentRole={user?.publicMetadata?.role}
            onChoose={assignRole}
            isAssigning={isAssigningRole}
            error={error}
          />
        ) : status === "ready" ? (
          <main className="container">
            <header className="max960" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h1 style={{ margin: 0 }}>Jobseeker Area</h1>
              <UserButton afterSignOutUrl="/" />
            </header>

            <section className="grid">
              <a href="/jobseeker/search" className="card link-card">Search Jobs</a>
              <a href="/jobseeker/saved" className="card link-card">Saved Jobs</a>
              <a href="/jobseeker/applications" className="card link-card">My Applications</a>
              <a href="/jobseeker/profile" className="card link-card">My Profile</a>
            </section>

            <a href="/jobseeker" className="pill-light">← Back to Home</a>
          </main>
        ) : (
          <LoadingCard role="jobseeker" />
        )}
      </SignedIn>
    </>
  );
}
