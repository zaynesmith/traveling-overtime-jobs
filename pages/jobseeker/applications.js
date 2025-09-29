import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from "@clerk/nextjs";

export default function Applications() {
  return (
    <>
      <SignedOut><RedirectToSignIn redirectUrl="/jobseeker/applications" /></SignedOut>
      <SignedIn>
        <main className="container">
          <header className="max960" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <h1 style={{ margin: 0 }}>My Applications</h1>
            <UserButton afterSignOutUrl="/" />
          </header>
          <section className="card max960">No applications yet (demo).</section>
        </main>
      </SignedIn>
    </>
  );
}