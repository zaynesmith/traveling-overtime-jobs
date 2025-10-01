import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useMemo, useCallback } from "react";
import { usePersistRole } from "../../lib/usePersistRole";
import { getRoleHomeHref } from "../../lib/getRoleHomeHref";
import { ROLE_ROUTES } from "../../lib/roleRoutes";

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
  const router = useRouter();
  const { query, isReady } = router;
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
    role === "employer"
      ? "/employer/register?onboarding=1"
      : ROLE_ROUTES.jobseeker;
  const afterSignInDestination = getRoleHomeHref(role);

  usePersistRole(role);

  const setRole = useCallback(
    (nextRole) => {
      if (!isReady) return;
      if (!nextRole || nextRole === role) return;

      const nextQuery = { ...query, intent: nextRole };
      delete nextQuery.role;

      router.replace(
        { pathname: "/sign-up", query: nextQuery },
        undefined,
        { shallow: true }
      );
    },
    [isReady, query, role, router]
  );

  const introCopy =
    role === "employer"
      ? "Create an employer account to publish listings, manage applicants, and access the hiring workspace."
      : "Create a jobseeker account to save jobs, track demo applications, and showcase your resume to employers.";

  return (
    <main className="container">
      <div className="max960">
        <section
          className="card"
          style={{
            display: "grid",
            gap: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className={role === "jobseeker" ? "btn" : "pill-light"}
              onClick={() => setRole("jobseeker")}
              aria-pressed={role === "jobseeker"}
            >
              Sign up as jobseeker
            </button>
            <button
              type="button"
              className={role === "employer" ? "btn" : "pill-light"}
              onClick={() => setRole("employer")}
              aria-pressed={role === "employer"}
            >
              Sign up as employer
            </button>
          </div>

          <p style={{ margin: 0, color: "#475569" }}>{introCopy}</p>
        </section>
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
