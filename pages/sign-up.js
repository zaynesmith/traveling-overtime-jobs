// pages/sign-up.js
import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/router";

export default function SignUpPage() {
  const router = useRouter();
  const role = (router.query.role || "jobseeker") + "";
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
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl={`/sign-in?role=${role}`}
        afterSignUpUrl={afterUrl}
      />
    </main>
  );
}
