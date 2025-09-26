// pages/employer/index.js
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export default function EmployerHome() {
  return (
    <>
      <SignedIn>
        <div style={{padding: 24}}>
          <h1>Employer Dashboard</h1>
          <p>Welcome! You’re signed in as an employer.</p>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer" />
      </SignedOut>
    </>
  );
}
