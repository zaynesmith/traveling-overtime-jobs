import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { usePersistRole } from "../lib/usePersistRole";

const DEFAULT_ROLE = "jobseeker";

export default function SignUpPage() {
  const { query } = useRouter();
  const role = useMemo(() => {
    if (query.role === "employer") return "employer";
    if (query.role === "jobseeker") return "jobseeker";
    return DEFAULT_ROLE;
  }, [query.role]);

  const destination = role === "employer" ? "/employer" : "/jobseeker";

  usePersistRole(role);

  return (
    <main className="container">
      <div className="max960">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          afterSignInUrl={destination}
          afterSignUpUrl={destination}
        />
      </div>
    </main>
  );
}
