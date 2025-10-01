// Forces the right post-auth destination based on ?intent=...
import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/router";

export default function SignInPage() {
  const { query } = useRouter();

  // If Clerk middleware sent us here from a protected page, it will include redirect_url.
  const redirectUrl =
    typeof query.redirect_url === "string" ? query.redirect_url : null;

  // Explicit intent from your buttons/links. Default to jobseeker if absent.
  const intent = (query.intent || "jobseeker").toString();

  // If redirect_url exists, prefer it. Otherwise choose by intent.
  const afterUrl =
    redirectUrl ||
    (intent === "employer"
      ? "/employer/register?onboarding=1"
      : "/jobs");

  return (
    <main className="auth-shell">
      <SignIn
        afterSignInUrl={afterUrl}
        signUpUrl={`/sign-up?intent=${intent}`}
      />
    </main>
  );
}

