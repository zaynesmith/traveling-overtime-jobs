// Same idea for sign-up: after creating the account, send employers to register.
import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/router";

export default function SignUpPage() {
  const { query } = useRouter();

  const redirectUrl =
    typeof query.redirect_url === "string" ? query.redirect_url : null;

  const intent = (query.intent || "jobseeker").toString();

  const afterUrl =
    redirectUrl ||
    (intent === "employer"
      ? "/employer/register?onboarding=1"
      : "/jobs");

  return (
    <main className="auth-shell">
      <SignUp
        afterSignUpUrl={afterUrl}
        signInUrl={`/sign-in?intent=${intent}`}
      />
    </main>
  );
}

