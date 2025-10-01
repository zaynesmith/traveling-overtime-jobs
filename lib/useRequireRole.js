import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import { updatePublicMetadata } from "./clerkMetadata";

export const ROLE_ROUTES = {
  jobseeker: "/jobseeker",
  employer: "/employer",
};

export function useRequireRole(expectedRole) {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [status, setStatus] = useState(expectedRole ? "checking" : "ready");
  const [error, setError] = useState(null);
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const currentRole = user?.publicMetadata?.role;

  useEffect(() => {
    if (!expectedRole) {
      const nextStatus = isLoaded ? "ready" : "checking";
      if (status !== nextStatus) {
        setStatus(nextStatus);
      }
      return;
    }

    if (!isLoaded) {
      if (status !== "checking") {
        setStatus("checking");
      }
      return;
    }

    if (!isSignedIn || !user) {
      if (status !== "unauthenticated") {
        setStatus("unauthenticated");
      }
      return;
    }

    if (!currentRole) {
      if (status !== "needs-role") {
        setStatus("needs-role");
      }
      return;
    }

    if (currentRole !== expectedRole) {
      const destination = ROLE_ROUTES[currentRole] || "/";
      if (router.asPath !== destination) {
        router.replace(destination);
      }
      if (status !== "forbidden") {
        setStatus("forbidden");
      }
      return;
    }

    if (status !== "ready") {
      setStatus("ready");
    }
  }, [
    currentRole,
    expectedRole,
    isLoaded,
    isSignedIn,
    router,
    status,
    user,
  ]);

  const assignRole = useCallback(
    async (nextRole) => {
      if (!user) {
        throw new Error("No active user session");
      }

      setIsAssigningRole(true);
      setError(null);

      try {
        await updatePublicMetadata({ role: nextRole });
        await user.reload();

        const destination = ROLE_ROUTES[nextRole] || "/";
        if (router.asPath !== destination) {
          router.replace(destination);
        }

        setStatus("checking");
      } catch (updateError) {
        console.error("Failed to assign role", updateError);
        setError(updateError);
        setStatus("needs-role");
        throw updateError;
      } finally {
        setIsAssigningRole(false);
      }
    },
    [router, user]
  );

  return {
    status,
    canView: status === "ready",
    error,
    assignRole,
    isAssigningRole,
  };
}
