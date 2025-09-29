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
            <h1 style={{ margin: 0 }}>Employer Area</h1>
            <UserButton afterSignOutUrl="/" />
          </header>

          <section style={grid}>
            <a href="/employer/post" style={card}>Post a Job</a>
            <a href="/employer/listings" style={card}>Manage Listings</a>
            <a href="/employer/profile" style={card}>Company Profile</a>
          </section>

          <a href="/" style={{ textDecoration: "none", color: "#111" }}>← Back to Home</a>
        </main>
      </SignedIn>
    </>
  );
}

const wrap = { minHeight:"100vh", padding:"40px 24px", display:"flex", flexDirection:"column", alignItems:"center", gap:24, fontFamily:"system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial" };
const header = { width:"100%", maxWidth:960, display:"f lex", justifyContent:"space-between", alignItems:"center" };
const grid = { width:"100%", maxWidth:960, display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:16 };
const card = { display:"block", textDecoration:"none", background:"#fff", color:"#111", border:"1px solid rgba(0,0,0,0.08)", borderRadius:12, padding:20, fontWeight:700, textAlign:"center", boxShadow:"0 6px 18px rgba(0,0,0,0.06)" };
