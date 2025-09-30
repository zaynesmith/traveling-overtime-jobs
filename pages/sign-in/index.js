import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { usePersistRole } from "../../lib/usePersistRole";

function sanitizeRedirect(path) {
  if (typeof path !== "string" || !path.startsWith("/")) {
    return undefined;
  }

  try {
    const url = new URL(path, "http://localhost");
    return url.pathname + url.search + url.hash;
  } catch (error) {
    console.error("Invalid redirect path", error);
    return undefined;
  }
}

export default function SignInPage() {
  const { query } = useRouter();

  const roleFromQuery = useMemo(() => {
    if (query.role === "employer") return "employer";
    if (query.role === "jobseeker") return "jobseeker";
    return undefined;
  }, [query.role]);

  const fallbackRole = roleFromQuery ?? "jobseeker";
  const fallbackDestination =
    fallbackRole === "employer" ? "/employer" : "/jobseeker";
  const destination = sanitizeRedirect(query.redirect_url) || fallbackDestination;

  usePersistRole(roleFromQuery);

  return (
    <main className="container">
      <div className="max960">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          afterSignInUrl={destination}
          afterSignUpUrl={destination}
        />
      </div>
    </main>
  );
}
