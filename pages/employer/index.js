import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from "@clerk/nextjs";
import { useRequireRole } from "../../lib/useRequireRole";

export default function EmployerHome() {
  const canView = useRequireRole("employer");

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer" />
      </SignedOut>

      <SignedIn>
        {canView ? (
          <main className="container">
          <header className="max960" style={header}>
            <h1 style={{ margin: 0 }}>Employer Area</h1>
            <UserButton afterSignOutUrl="/" />
          </header>

          <section className="grid">
            <a href="/employer/post" className="card link-card">Post a Job</a>
            <a href="/employer/listings" className="card link-card">Manage Listings</a>
            <a href="/employer/profile" className="card link-card">Company Profile</a>
          </section>

          <a href="/employer" className="pill-light">← Back to Home</a>
          </main>
        ) : null}
      </SignedIn>
    </>
  );
}

const header = { display:"flex", justifyContent:"space-between", alignItems:"center" };
