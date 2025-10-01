"use client";

import { useRequireRole } from "@/lib/useRequireRole";
import {
  RoleGateLoading,
  RoleGateDenied,
  RoleGateRolePicker,
} from "@/components/RoleGateFeedback";
import EmployerRegisterForm from "@/components/EmployerRegisterForm";

/**
 * Employer-only entry. If user has no role: show picker.
 * If jobseeker/other: show denied with guidance.
 * If ready: render the employer registration form.
 */
export default function EmployerRegisterPage() {
  const { status, assignRole, error, currentRole, isAssigning } = useRequireRole("employer");

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
        status={status}
        error={error}
        currentRole={currentRole}
      />
    );
  }

  // status === "ready"
  return <EmployerRegisterForm />;
}
