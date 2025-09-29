// pages/sign-in/index.js
import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/router";

export default function SignInPage() {
  const { query } = useRouter();
  const role = (query.role === "employer" || query.role === "jobseeker")
    ? query.role
    : "jobseeker"; // default if missing

  // After sign-in, go directly to the correct area
  const redirectUrl = role === "employer" ? "/employer" : "/jobseeker";

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
      <SignIn path="/sign-in" routing="path" redirectUrl={redirectUrl} />
    </main>
  );
}
