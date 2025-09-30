import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { usePersistRole } from "../../lib/usePersistRole";

const DEFAULT_ROLE = "jobseeker";

function readRole(rawRole) {
  if (rawRole === "employer") return "employer";
  if (rawRole === "jobseeker") return "jobseeker";
  return undefined;
}

function getFirst(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SignUpPage() {
  const { query } = useRouter();
  const role = useMemo(() => {
    const intentRole = readRole(getFirst(query.intent));
    if (intentRole) {
      return intentRole;
    }

    const legacyRole = readRole(getFirst(query.role));
    if (legacyRole) {
      return legacyRole;
    }

    return DEFAULT_ROLE;
  }, [query.intent, query.role]);

  const afterSignUpDestination =
    role === "employer" ? "/employer/profile" : "/jobseeker";
  const afterSignInDestination =
    role === "employer" ? "/employer" : "/jobseeker";

  usePersistRole(role);

  return (
    <main className="container">
      <div className="max960">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl={role ? `/sign-in?intent=${role}` : "/sign-in"}
          afterSignInUrl={afterSignInDestination}
          afterSignUpUrl={afterSignUpDestination}
        />
      </div>
    </main>
  );
}
