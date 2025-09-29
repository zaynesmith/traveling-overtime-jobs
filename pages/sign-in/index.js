import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/router";

export default function SignInPage() {
  const { query } = useRouter();
  const role = (query.role === "employer" || query.role === "jobseeker") ? query.role : "jobseeker";
  const redirectUrl = role === "employer" ? "/employer" : "/jobseeker";

  return (
    <main className="container">
      <div className="max960">
        <SignIn path="/sign-in" routing="path" redirectUrl={redirectUrl} />
      </div>
    </main>
  );
}