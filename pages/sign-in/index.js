import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/router";

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
  const role = query.role === "employer" ? "employer" : query.role === "jobseeker" ? "jobseeker" : "jobseeker";
  const fallbackDestination = role === "employer" ? "/employer" : "/jobseeker";
  const destination = sanitizeRedirect(query.redirect_url) || fallbackDestination;

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
