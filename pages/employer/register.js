// pages/employer/register.js
"use client";

import { useEffect, useRef } from "react";
import { useRequireRole } from "../../lib/useRequireRole";
import { getOnboardingIntent } from "../../lib/localOnboarding";
import {
  RoleGateLoading,
  RoleGateDenied,
  RoleGateRolePicker,
} from "../../components/RoleGateFeedback";
import EmployerRegisterForm from "../../components/EmployerRegisterForm";

export default function EmployerRegisterPage() {
  const { status, assignRole, error, currentRole, isAssigning } =
    useRequireRole("employer");

  // If the user intended "employer" (saved in localStorage), auto-assign once
  const triedAuto = useRef(false);
  useEffect(() => {
    if (status !== "needs-role") return;
    if (triedAuto.current) return;
    if (getOnboardingIntent() === "employer") {
      triedAuto.current = true;
      assignRole("employer").catch(() => {
        // If it fails, the picker below remains available
      });
    }
  }, [status, assignRole]);

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
