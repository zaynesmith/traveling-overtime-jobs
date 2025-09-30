import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { usePersistRole } from "../../lib/usePersistRole";

const DEFAULT_ROLE = "jobseeker";

export default function SignUpPage() {
  const { query } = useRouter();
  const role = useMemo(() => {
    const queryRole = Array.isArray(query.role) ? query.role[0] : query.role;
    if (queryRole === "employer") return "employer";
    if (queryRole === "jobseeker") return "jobseeker";
    return DEFAULT_ROLE;
  }, [query.role]);

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
          signInUrl="/sign-in"
          afterSignInUrl={afterSignInDestination}
          afterSignUpUrl={afterSignUpDestination}
        />
      </div>
    </main>
  );
}
