import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { RoleGateDenied, RoleGateLoading } from "../../components/RoleGateFeedback";
import { useRequireRole } from "../../lib/useRequireRole";

export default function EmployerHome() {
  const { user } = useUser();
  const { status, canView, error } = useRequireRole("employer");

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer" />
      </SignedOut>

      <SignedIn>
        {status === "checking" ? (
          <RoleGateLoading role="employer" />
        ) : canView ? (
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

          <a href="/" className="pill-light">← Back to Home</a>
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

const header = { display:"flex", justifyContent:"space-between", alignItems:"center" };
