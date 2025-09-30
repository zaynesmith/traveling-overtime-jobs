import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useMemo } from "react";

const DEFAULT_INTENT = "jobseeker";

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

function readIntent(rawIntent) {
  if (rawIntent === "employer") return "employer";
  if (rawIntent === "jobseeker") return "jobseeker";
  return undefined;
}

function appendIntent(path, intent) {
  if (!intent) {
    return path;
  }

  try {
    const url = new URL(path, "http://localhost");
    if (!url.searchParams.has("intent")) {
      url.searchParams.set("intent", intent);
    }
    const query = url.searchParams.toString();
    const hash = url.hash ?? "";
    return `${url.pathname}${query ? `?${query}` : ""}${hash}`;
  } catch (error) {
    console.error("Invalid redirect path when appending intent", error);
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}intent=${intent}`;
  }
}

export default function SignUpPage() {
  const { query } = useRouter();
  const intent = useMemo(() => {
    const fromQuery = Array.isArray(query.intent) ? query.intent[0] : query.intent;
    return readIntent(fromQuery) ?? DEFAULT_INTENT;
  }, [query.intent]);

  const sanitizedRedirect = sanitizeRedirect(query.redirect_url) || "/onboard";
  const destination = appendIntent(sanitizedRedirect, intent);
  const signInUrlBase = intent
    ? `/sign-in?intent=${intent}`
    : "/sign-in";
  const signInUrl = query.redirect_url
    ? `${signInUrlBase}&redirect_url=${encodeURIComponent(sanitizedRedirect)}`
    : signInUrlBase;

  return (
    <main className="container">
      <div className="max960">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl={signInUrl}
          afterSignInUrl={destination}
          afterSignUpUrl={destination}
        />
      </div>
    </main>
  );
}
