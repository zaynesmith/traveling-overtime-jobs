// pages/sign-in/index.js
import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/router";

export default function SignInPage() {
  const router = useRouter();
  const role = (router.query.role || "jobseeker") + "";

  // Where to land after sign-in (no role setting, just route-based)
  const afterUrl = role === "employer" ? "/employer" : "/jobseeker";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl={`/sign-up?role=${role}`}
        afterSignInUrl={afterUrl}
      />
    </main>
  );
}
