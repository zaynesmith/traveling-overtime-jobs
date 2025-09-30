import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";

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

    let active = true;
    lastRequestedRole.current = role;

    user
      .update({
        publicMetadata: {
          ...(user.publicMetadata || {}),
          [ROLE_KEY]: role,
        },
      })
      .catch((error) => {
        console.error("Failed to persist role", error);
        if (active) {
          lastRequestedRole.current = undefined;
        }
      });

    return () => {
      active = false;
    };
  }, [role, isLoaded, isSignedIn, user]);
}
