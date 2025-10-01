"use client";

import { useState, useMemo } from "react";
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

  const currentRole = useMemo(() => {
    return (user?.publicMetadata?.role ?? undefined);
  }, [user?.publicMetadata?.role]);

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
      setError(e);
      throw e;
    } finally {
      setIsAssigning(false);
    }
  };

  return { status, currentRole, assignRole, isAssigning, error };
}
