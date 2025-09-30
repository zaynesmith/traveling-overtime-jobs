import { useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";

const ROLE_ROUTES = {
  jobseeker: "/jobseeker",
  employer: "/employer",
};

export function useRequireRole(expectedRole) {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const currentRole = user?.publicMetadata?.role;

  const isAuthorized =
    Boolean(expectedRole) && isLoaded && isSignedIn && currentRole === expectedRole;

  useEffect(() => {
    if (!expectedRole) {
      return;
    }
    if (!isLoaded || !isSignedIn) {
      return;
    }

    if (!currentRole) {
      router.replace("/");
      return;
    }

    if (currentRole !== expectedRole) {
      const destination = ROLE_ROUTES[currentRole] || "/";
      router.replace(destination);
    }
  }, [expectedRole, isLoaded, isSignedIn, currentRole, router]);

  return isAuthorized;
}
