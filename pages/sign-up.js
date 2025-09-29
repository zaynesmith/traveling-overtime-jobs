import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/router";

export default function SignUpPage() {
  const { query } = useRouter();
  const role = query.role === "employer" ? "employer" : query.role === "jobseeker" ? "jobseeker" : "jobseeker";
  const destination = role === "employer" ? "/employer" : "/jobseeker";

  return (
    <main className="container">
      <div className="max960">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          afterSignInUrl={destination}
          afterSignUpUrl={destination}
        />
      </div>
    </main>
  );
}
