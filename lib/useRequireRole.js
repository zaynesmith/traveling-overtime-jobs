import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";

const ROLE_ROUTES = {
  jobseeker: "/jobseeker/dashboard",
  employer: "/employer/dashboard",
};

export function useRequireRole(expectedRole) {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [status, setStatus] = useState(expectedRole ? "checking" : "authorized");
  const [error, setError] = useState(null);

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

    const currentRole = user.publicMetadata?.role;

    if (currentRole === expectedRole) {
      setStatus("authorized");
      setError(null);
      return;
    }

    if (!currentRole) {
      setStatus("unauthorized");
      setError(null);
      return;
    }

    if (currentRole !== expectedRole) {
      const destination = ROLE_ROUTES[currentRole] || "/";
      if (router.asPath !== destination) {
        router.replace(destination);
      }
      setStatus("unauthorized");
      setError(null);
    }
  }, [expectedRole, isLoaded, isSignedIn, user, router]);

  return {
    status,
    canView: status === "authorized",
    error,
  };
}
