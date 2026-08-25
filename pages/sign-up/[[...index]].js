import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="container">
      <div className="max960">
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
      </div>
    </main>
  );
}
