// components/Header.js
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header style={wrap}>
      <a href="/" style={brand}>Traveling Overtime Jobs</a>

      <nav style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <a href="/jobseeker" style={navLink}>Jobseeker</a>
        <a href="/employer" style={navLink}>Employer</a>

        <SignedOut>
          <a href="/sign-in?role=jobseeker" style={navBtn}>Sign in</a>
          <a href="/sign-up" style={navBtnOutline}>Sign up</a>
        </SignedOut>

        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </nav>
    </header>
  );
}

const wrap = { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px", borderBottom:"1px solid #eee", position:"sticky", top:0, background:"#fff", zIndex:10 };
const brand = { fontWeight:800, textDecoration:"none", color:"#111" };
const navLink = { textDecoration:"none", color:"#111", padding:"8px 10px", borderRadius:8, border:"1px solid #eee" };
const navBtn = { textDecoration:"none", color:"#fff", background:"#111", padding:"8px 12px", borderRadius:8, fontWeight:700, border:"1px solid #111" };
const navBtnOutline = { textDecoration:"none", color:"#111", background:"#fff", padding:"8px 12px", borderRadius:8, fontWeight:700, border:"1px solid #ddd" };