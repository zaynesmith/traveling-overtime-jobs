import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from "@clerk/nextjs";

export default function SavedJobs() {
  return (
    <>
      <SignedOut><RedirectToSignIn redirectUrl="/jobseeker/saved" /></SignedOut>
      <SignedIn>
        <main className="container">
          <header className="max960" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <h1 style={{ margin: 0 }}>Saved Jobs</h1>
            <UserButton afterSignOutUrl="/" />
          </header>
          <section className="card max960">No saved jobs yet (demo).</section>
        </main>
      </SignedIn>
    </>
  );
}