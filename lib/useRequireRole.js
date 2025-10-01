import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";

export const ROLE_ROUTES = {
  jobseeker: "/jobseeker",
  employer: "/employer",
};

export function useRequireRole(expectedRole) {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [status, setStatus] = useState(
    expectedRole ? "checking" : "authorized"
  );
  const [error, setError] = useState(null);
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const currentRole = user?.publicMetadata?.role;

  useEffect(() => {
    if (!expectedRole) {
      setStatus("authorized");
      setError(null);
      return;
    }

    if (!isLoaded) {
      setStatus("checking");
      return;
    }

    if (!isSignedIn || !user) {
      setStatus("unauthorized");
      setError(null);
      return;
    }

    if (!currentRole) {
      if (status !== "needs-role") {
        setStatus("needs-role");
      }
      return;
    }

    if (currentRole === expectedRole) {
      setStatus("authorized");
      setError(null);
      return;
    }

    if (currentRole && currentRole !== expectedRole) {
      const destination = ROLE_ROUTES[currentRole] || "/";
      if (router.asPath !== destination) {
        router.replace(destination);
      }
      setStatus("unauthorized");
      setError(null);
    }
  }, [
    expectedRole,
    isLoaded,
    isSignedIn,
    currentRole,
    router,
    user,
    status,
  ]);

  const assignRole = useCallback(
    async (nextRole) => {
      if (!user) {
        throw new Error("No active user session");
      }

      setIsAssigningRole(true);
      setError(null);

      try {
        await user.update({
          publicMetadata: {
            ...(user.publicMetadata || {}),
            role: nextRole,
          },
        });

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
    canView: status === "authorized",
    error,
    assignRole,
    isAssigningRole,
  };
}
