// pages/sign-up.js
import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/router";

export default function SignUpPage() {
  const router = useRouter();
  const role = (router.query.role || "").toString();
  const nextUrl = role === "employer" ? "/employer" : role === "jobseeker" ? "/jobseeker" : "/";

  return (
    <div style={{minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px"}}>
      <SignUp
        appearance={{ elements: { rootBox: { width: "100%" } } }}
        routing="path"
        path="/sign-up"
        signInUrl={`/sign-in?role=${encodeURIComponent(role)}`}
        afterSignUpUrl={nextUrl}
        redirectUrl={nextUrl}
      />
    </div>
  );
}
