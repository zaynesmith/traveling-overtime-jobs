import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from "@clerk/nextjs";
import { useRequireRole } from "../../lib/useRequireRole";

export default function JobseekerHome() {
  const canView = useRequireRole("jobseeker");

  return (
    <>
      <SignedOut><RedirectToSignIn redirectUrl="/jobseeker" /></SignedOut>

      <SignedIn>
        {canView ? (
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
        ) : null}
      </SignedIn>
    </>
  );
}
