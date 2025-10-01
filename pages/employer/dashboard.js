"use client";

import { useRequireRole } from "../../lib/useRequireRole";
import {
  RoleGateLoading,
  RoleGateDenied,
  RoleGateRolePicker,
} from "../../components/RoleGateFeedback";
import Link from "next/link";
import { ROLE_ROUTES } from "../../lib/roleRoutes";

export default function EmployerDashboardPage() {
  const { status, assignRole, currentRole, error, isAssigning } = useRequireRole(
    "employer"
  );

  if (status === "checking") {
    return <RoleGateLoading role="employer" />;
  }

  if (status === "needs-role") {
    return (
      <RoleGateRolePicker
        onSelectRole={assignRole}
        isAssigning={isAssigning}
        error={error}
      />
    );
  }

  if (status === "forbidden" || status === "error") {
    return (
      <RoleGateDenied
        expectedRole="employer"
        currentRole={currentRole}
        status={status}
        error={error}
        onRequestRole={() => assignRole("employer")}
        isAssigning={isAssigning}
      />
    );
  }

  return (
    <main className="container" style={{ padding: "48px 24px" }}>
      <div className="max960" style={{ display: "grid", gap: 24 }}>
        <header style={{ display: "grid", gap: 12 }}>
          <h1 style={{ margin: 0 }}>Employer dashboard</h1>
          <p style={{ margin: 0, color: "#475569" }}>
            Welcome back! Your job postings, applicants, and hiring tools will live here.
          </p>
        </header>

        <section className="card" style={{ padding: 24, display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Getting started</h2>
          <p style={{ margin: 0, color: "#475569" }}>
            Head to the employer onboarding flow to finish your company profile. Once complete,
            this dashboard will populate with shortcuts to post jobs and review applicants.
          </p>
          <Link className="btn" href="/employer/register?onboarding=1">
            Finish employer onboarding
          </Link>
          <Link className="pill-light" href={ROLE_ROUTES.employer}>
            Refresh dashboard
          </Link>
        </section>
      </div>
    </main>
  );
}
