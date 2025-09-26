// components/Nav.js
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Nav() {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 10,
      backdropFilter: "saturate(180%) blur(6px)",
      background: "rgba(255,255,255,0.75)",
      borderBottom: "1px solid #eee"
    }}>
      <nav style={{
        maxWidth: 1100, margin: "0 auto",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "10px 16px"
      }}>
        <Link href="/" style={{ fontWeight: 800, textDecoration: "none", color: "#111" }}>
          Traveling Overtime Jobs
        </Link>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/search" className="pill">Search Jobs</Link>
          <Link href="/post" className="pill">Post Jobs</Link>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className="pill">Employer Login</Link>
            <Link href="/sign-up" className="pill">Jobseeker Login</Link>
          </SignedOut>
        </div>
      </nav>
    </header>
  );
}
