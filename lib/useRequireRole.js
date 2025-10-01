"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import { ROLE_ROUTES } from "./roleRoutes";

/**
 * Enforces role without auto-assigning.
 * Returns UI-friendly status and an assignRole helper.
 *
 * status: "checking" | "needs-role" | "ready" | "forbidden" | "error"
 */
export function useRequireRole(requiredRole /* "employer" | "jobseeker" | undefined */) {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const currentRole = user?.publicMetadata?.role ?? undefined;

  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState(null);

  let status = "checking";
  if (!isLoaded) status = "checking";
  else if (!user) status = "error"; // page should require auth separately if needed
  else if (!currentRole) status = "needs-role";
  else if (requiredRole && currentRole !== requiredRole) status = "forbidden";
  else status = "ready";

  const assignRole = async (nextRole /* "employer" | "jobseeker" */) => {
    if (!user) return;
    if (!nextRole || !ROLE_ROUTES[nextRole]) {
      const invalidError = new Error("Unsupported role selection");
      setError(invalidError);
      throw invalidError;
    }
    try {
      setIsAssigning(true);
      setError(null);
      await user.update({
        publicMetadata: {
          ...user.publicMetadata,
          role: nextRole,
        },
      });
      const dest = ROLE_ROUTES[nextRole] || "/";
      await router.replace(dest);
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to update role");
      setError(err);
      throw err;
    } finally {
      setIsAssigning(false);
    }
  };

  return { status, currentRole, assignRole, isAssigning, error };
}
