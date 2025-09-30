import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";

const ROLE_ROUTES = {
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
  const lastAttemptedRole = useRef();
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

    if (currentRole === expectedRole) {
      setStatus("authorized");
      setError(null);
      return;
    }

    if (!currentRole) {
      if (isAssigningRole) {
        if (status !== "authorized" && status !== "error") {
          setStatus("checking");
        }
        return;
      }

      if (lastAttemptedRole.current === expectedRole) {
        if (status !== "authorized" && status !== "error") {
          setStatus("checking");
        }
        return;
      }

      let active = true;
      lastAttemptedRole.current = expectedRole;
      setIsAssigningRole(true);
      setStatus("checking");
      setError(null);

      user
        .update({
          publicMetadata: {
            ...(user.publicMetadata || {}),
            role: expectedRole,
          },
        })
        .then(() => {
          if (active) {
            setStatus("authorized");
            setError(null);
          }
        })
        .catch((updateError) => {
          console.error("Failed to assign role", updateError);
          if (active) {
            lastAttemptedRole.current = undefined;
            setError(updateError);
            setStatus("error");
          }
        })
        .finally(() => {
          if (active) {
            setIsAssigningRole(false);
          }
        });

      return () => {
        active = false;
      };
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
    isAssigningRole,
    status,
  ]);

  return {
    status,
    canView: status === "authorized",
    error,
  };
}
