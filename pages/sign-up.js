// pages/sign-up.js
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
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
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
    </main>
  );
}
