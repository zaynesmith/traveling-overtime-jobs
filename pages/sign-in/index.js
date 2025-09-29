import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/router";

export default function SignInPage() {
  const { query } = useRouter();
  const roleParam = Array.isArray(query.role) ? query.role[0] : query.role;
  const role = roleParam === "employer" || roleParam === "jobseeker" ? roleParam : "jobseeker";

  const redirectUrlParam = Array.isArray(query.redirect_url)
    ? query.redirect_url[0]
    : query.redirect_url;
  const decodedRedirectUrl =
    typeof redirectUrlParam === "string" ? decodeURIComponent(redirectUrlParam) : undefined;

  const redirectUrl = decodedRedirectUrl || (role === "employer" ? "/employer" : "/jobseeker");

  return (
    <main className="container">
      <div className="max960">
        <SignIn path="/sign-in" routing="path" redirectUrl={redirectUrl} />
      </div>
    </main>
  );
}