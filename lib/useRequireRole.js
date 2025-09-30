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
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const lastAttemptedRole = useRef();
  const currentRole = user?.publicMetadata?.role;

  useEffect(() => {
    if (!expectedRole) {
      return;
    }
    if (!isLoaded || !isSignedIn || !user) {
      return;
    }

    if (!currentRole && lastAttemptedRole.current !== expectedRole) {
      let active = true;

      lastAttemptedRole.current = expectedRole;
      setIsAssigningRole(true);

      user
        .update({
          publicMetadata: {
            ...(user.publicMetadata || {}),
            role: expectedRole,
          },
        })
        .catch((error) => {
          console.error("Failed to assign role", error);
          if (active) {
            lastAttemptedRole.current = undefined;
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
    }
  }, [expectedRole, isLoaded, isSignedIn, currentRole, router, user]);

  if (!expectedRole) {
    return true;
  }

  if (!isLoaded || !isSignedIn) {
    return false;
  }

  if (currentRole === expectedRole) {
    return true;
  }

  if (!currentRole && (isAssigningRole || lastAttemptedRole.current === expectedRole)) {
    return true;
  }

  return false;
}
