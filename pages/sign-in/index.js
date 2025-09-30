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

function readRole(rawRole) {
  if (rawRole === "employer") return "employer";
  if (rawRole === "jobseeker") return "jobseeker";
  return undefined;
}

export default function SignInPage() {
  const { query, asPath } = useRouter();

  const roleFromQuery = useMemo(() => {
    const directRole = Array.isArray(query.role)
      ? readRole(query.role[0])
      : readRole(query.role);
    if (directRole) {
      return directRole;
    }

    const searchIndex = asPath.indexOf("?");
    if (searchIndex === -1) {
      return undefined;
    }

    try {
      const params = new URLSearchParams(asPath.slice(searchIndex + 1));
      return readRole(params.get("role"));
    } catch (error) {
      console.error("Invalid role parameter", error);
      return undefined;
    }
  }, [query.role, asPath]);

  const fallbackRole = roleFromQuery ?? "jobseeker";
  const fallbackDestination =
    fallbackRole === "employer" ? "/employer" : "/jobseeker";
  const destination = sanitizeRedirect(query.redirect_url) || fallbackDestination;
  const signUpUrl = roleFromQuery
    ? `/sign-up?role=${roleFromQuery}`
    : "/sign-up";

  usePersistRole(roleFromQuery);

  return (
    <main className="container">
      <div className="max960">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl={signUpUrl}
          afterSignInUrl={destination}
          afterSignUpUrl={destination}
        />
      </div>
    </main>
  );
}
