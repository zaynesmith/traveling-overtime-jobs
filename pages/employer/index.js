// pages/employer/index.js
import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from "@clerk/nextjs";

export default function EmployerHome() {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer" />
      </SignedOut>

      <SignedIn>
        <main style={wrap}>
          <header style={header}>
            <h1 style={{ margin: 0 }}>Employer Dashboard</h1>
            <UserButton afterSignOutUrl="/" />
          </header>

          <section style={grid}>
            <a href="/employer/post" style={{ ...card, textDecoration: "none", color: "#111" }}>
              <h2 style={{ marginTop: 0 }}>Post a Job</h2>
              <p>Create a new job with pay, per diem, start date, and details.</p>
            </a>

            <a href="/employer/listings" style={{ ...card, textDecoration: "none", color: "#111" }}>
              <h2 style={{ marginTop: 0 }}>Manage Listings</h2>
              <p>View, edit, open/close, and track applicants (demo for now).</p>
            </a>

            <a href="/employer/profile" style={{ ...card, textDecoration: "none", color: "#111" }}>
              <h2 style={{ marginTop: 0 }}>Company Profile</h2>
              <p>Save company name, contact email, website, and phone.</p>
            </a>

            <a href="/" style={{ ...card, textDecoration: "none", color: "#111" }}>
              <h2 style={{ marginTop: 0 }}>Back to Home</h2>
              <p>Return to the main site.</p>
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
