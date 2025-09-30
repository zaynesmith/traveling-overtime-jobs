import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { RoleGateDenied, RoleGateLoading } from "../../components/RoleGateFeedback";
import { useRequireRole } from "../../lib/useRequireRole";

export default function JobseekerHome() {
  const { user } = useUser();
  const { status, canView, error } = useRequireRole("jobseeker");

  return (
    <>
      <SignedOut><RedirectToSignIn redirectUrl="/jobseeker" /></SignedOut>

      <SignedIn>
        {status === "checking" ? (
          <RoleGateLoading role="jobseeker" />
        ) : canView ? (
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

            <a href="/" className="pill-light">← Back to Home</a>
          </main>
        ) : (
          <RoleGateDenied
            expectedRole="jobseeker"
            status={status}
            error={error}
            currentRole={user?.publicMetadata?.role}
          />
        )}
      </SignedIn>
    </>
  );
}
