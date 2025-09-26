// pages/jobseeker/index.js
import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from "@clerk/nextjs";

export default function JobseekerHome() {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/jobseeker" />
      </SignedOut>

      <SignedIn>
        <main style={wrap}>
          <header style={header}>
            <h1 style={{ margin: 0 }}>Jobseeker Dashboard</h1>
            <UserButton afterSignOutUrl="/" />
          </header>

          <section style={grid}>
            <a href="/search" style={{ ...card, textDecoration: "none", color: "#111" }}>
              <h2 style={{ marginTop: 0 }}>Search Jobs</h2>
              <p>Find traveling overtime jobs by trade, pay, location, and more.</p>
            </a>

            <a href="/jobseeker/saved" style={{ ...card, textDecoration: "none", color: "#111" }}>
              <h2 style={{ marginTop: 0 }}>Saved Jobs</h2>
              <p>Quick access to the jobs you’ve saved (demo for now).</p>
            </a>

            <a href="/jobseeker/applications" style={{ ...card, textDecoration: "none", color: "#111" }}>
              <h2 style={{ marginTop: 0 }}>My Applications</h2>
              <p>Track the jobs you’ve applied to (demo for now).</p>
            </a>

            <a href="/jobseeker/profile" style={{ ...card, textDecoration: "none", color: "#111" }}>
              <h2 style={{ marginTop: 0 }}>My Profile</h2>
              <p>Basic info and résumé upload (we’ll wire this up next).</p>
            </a>
          </section>
        </main>
      </SignedIn>
    </>
  );
}

/* styles */
const wrap = { minHeight:"100vh", padding:"40px 24px", display:"flex", flexDirection:"column", alignItems:"center", gap:20, fontFamily:"system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial" };
const header = { width:"100%", maxWidth:1000, display:"flex", justifyContent:"space-between", alignItems:"center" };
const grid = { width:"100%", maxWidth:1000, display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 };
const card = { background:"#fff", border:"1px solid rgba(0,0,0,0.08)", borderRadius:12, padding:20, boxShadow:"0 6px 18px rgba(0,0,0,0.06)" };
