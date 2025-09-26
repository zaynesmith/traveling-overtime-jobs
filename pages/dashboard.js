// pages/dashboard.js
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";

export default function Dashboard() {
  const { user } = useUser();

  return (
    <main style={{minHeight:'80vh', padding:'40px', fontFamily:'system-ui'}}>
      <SignedIn>
        <h1 style={{marginBottom:12}}>Dashboard</h1>
        <p style={{marginBottom:24}}>Welcome{user?.firstName ? `, ${user.firstName}` : ""}! You’re signed in.</p>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <UserButton afterSignOutUrl="/" />
          <a href="/" style={{textDecoration:'none'}}>← Back to Home</a>
        </div>
      </SignedIn>

      <SignedOut>
        <h1>Please sign in</h1>
        <p><a href="/sign-in">Go to Sign In</a></p>
      </SignedOut>
    </main>
  );
}
