import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useMemo } from "react";

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

export default function SignInPage() {
  const { query, asPath } = useRouter();

  const intent = useMemo(() => {
    const directIntent = Array.isArray(query.intent)
      ? readIntent(query.intent[0])
      : readIntent(query.intent);
    if (directIntent) {
      return directIntent;
    }

    const searchIndex = asPath.indexOf("?");
    if (searchIndex === -1) {
      return undefined;
    }

    try {
      const params = new URLSearchParams(asPath.slice(searchIndex + 1));
      return readIntent(params.get("intent"));
    } catch (error) {
      console.error("Invalid intent parameter", error);
      return undefined;
    }
  }, [query.intent, asPath]);

  const sanitizedRedirect = sanitizeRedirect(query.redirect_url) || "/onboard";
  const destination = appendIntent(sanitizedRedirect, intent);
  const signUpUrlBase = intent
    ? `/sign-up?intent=${intent}`
    : "/sign-up";
  const signUpUrl = query.redirect_url
    ? `${signUpUrlBase}&redirect_url=${encodeURIComponent(sanitizedRedirect)}`
    : signUpUrlBase;

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
