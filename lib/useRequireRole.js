"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import { ROLE_ROUTES } from "./roleRoutes";

/**
 * Role guard without auto-assigning.
 * status: "checking" | "needs-role" | "ready" | "forbidden" | "error"
 */
export function useRequireRole(requiredRole /* "employer" | "jobseeker" | undefined */) {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const currentRole = user?.publicMetadata?.role ?? undefined;

  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState(null);

  let status = "checking";
  if (!isLoaded) {
    status = "checking";
  } else if (!user) {
    // Page should also be behind Clerk auth, but we surface it cleanly here.
    status = "error";
  } else if (!currentRole) {
    status = "needs-role";
  } else if (requiredRole && currentRole !== requiredRole) {
    status = "forbidden";
  } else {
    status = "ready";
  }

  /**
   * Server-side role assignment via our API.
   * IMPORTANT: Do NOT write publicMetadata from the client.
   */
  const assignRole = async (nextRole /* "employer" | "jobseeker" */) => {
    if (!nextRole || !ROLE_ROUTES[nextRole]) {
      const invalid = new Error("Unsupported role selection");
      setError(invalid);
      throw invalid;
    }

    setIsAssigning(true);
    setError(null);
    try {
      const res = await fetch("/api/user/update-public-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicMetadata: { role: nextRole } }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Role assignment failed");
      }

      const dest = ROLE_ROUTES[nextRole] || "/";
      await router.replace(dest);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to assign role"));
      throw e;
    } finally {
      setIsAssigning(false);
    }
  };

  return { status, currentRole, assignRole, isAssigning, error };
}
