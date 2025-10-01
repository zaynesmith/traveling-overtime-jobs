import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { updatePublicMetadata } from "./clerkMetadata";

const ROLE_KEY = "role";

export function usePersistRole(role) {
  const { isLoaded, isSignedIn, user } = useUser();
  const lastRequestedRole = useRef();

  useEffect(() => {
    if (!role) {
      lastRequestedRole.current = undefined;
      return;
    }
    if (!isLoaded || !isSignedIn || !user) {
      return;
    }

    const currentRole = user.publicMetadata?.[ROLE_KEY];
    if (currentRole === role) {
      lastRequestedRole.current = role;
      return;
    }

    if (lastRequestedRole.current === role) {
      return;
    }

    let cancelled = false;
    lastRequestedRole.current = role;

    const persistRole = async () => {
      try {
        await updatePublicMetadata({
          [ROLE_KEY]: role,
        });

        if (cancelled) {
          return;
        }

        await user.reload();
      } catch (error) {
        console.error("Failed to persist role", error);
        if (!cancelled) {
          lastRequestedRole.current = undefined;
        }
      }
    };

    persistRole();

    return () => {
      cancelled = true;
    };
  }, [role, isLoaded, isSignedIn, user]);
}
