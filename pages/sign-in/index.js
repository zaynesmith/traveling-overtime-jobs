import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/router";

export default function SignInPage() {
  const { query } = useRouter();
  const role = query.role === "employer" ? "employer" : query.role === "jobseeker" ? "jobseeker" : "jobseeker";
  const destination = role === "employer" ? "/employer" : "/jobseeker";

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
