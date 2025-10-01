import Link from "next/link";
import {
  RedirectToSignIn,
  SignedIn,
  SignedOut,
  useUser,
} from "@clerk/nextjs";

import {
  ForbiddenOrSwitchRole,
  LoadingCard,
} from "../../components/RoleGateFeedback";
import { RoleSelectCard } from "../../components/RoleSelectCard";
import { useRequireRole } from "../../lib/useRequireRole";

export default function EmployerStart() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { status, error, assignRole, isAssigningRole } = useRequireRole("employer");

  if (!isLoaded) {
    return <LoadingCard role="employer" />;
  }

  if (!isSignedIn) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer/start" />
      </SignedOut>
    );
  }

  if (status === "checking") {
    return <LoadingCard role="employer" />;
  }

  if (status === "needs-role") {
    return <RoleSelectCard onChoose={assignRole} />;
  }

  if (status === "forbidden") {
    return (
      <ForbiddenOrSwitchRole
        expectedRole="employer"
        currentRole={user?.publicMetadata?.role}
        onChoose={assignRole}
        isAssigning={isAssigningRole}
        error={error}
      />
    );
  }

  if (status !== "ready") {
    return <LoadingCard role="employer" />;
  }

  return (
    <SignedIn>
      <main className="container" style={{ paddingBottom: 56 }}>
        <section className="max960 card" style={{ marginTop: 48, display: "grid", gap: 16 }}>
          <h1 style={{ margin: 0 }}>Hire workers on Traveling Overtime Jobs</h1>
          <p style={{ margin: 0, color: "#475569" }}>
            Finish your employer profile and you can publish listings, track applicants, and search the resume database. Use the
            actions below to get started.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/employer/profile?onboarding=1" className="btn">
              Complete company profile
            </Link>
            <Link href="/employer/post" className="pill-light">
              Draft a job listing
            </Link>
            <Link href="/employer/talent" className="pill-light">
              Browse talent
            </Link>
          </div>
        </section>
      </main>
    </SignedIn>
  );
}
