"use client";

// components/Nav.js
import Link from "next/link";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { getRoleHomeHref } from "../lib/getRoleHomeHref";

export default function Nav() {
  const { user } = useUser();
  const role = user?.publicMetadata?.role;
  const brandHref = getRoleHomeHref(role);

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
        <Link href={brandHref} style={{ fontWeight: 800, textDecoration: "none", color: "#111" }}>
          Traveling Overtime Jobs
        </Link>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/search" className="pill">Search Jobs</Link>
          <Link href="/post" className="pill">Post Jobs</Link>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in?intent=employer&redirect_url=/onboard" className="pill">
              Employer Login
            </Link>
            <Link href="/sign-in?intent=jobseeker&redirect_url=/onboard" className="pill">
              Jobseeker Login
            </Link>
          </SignedOut>
        </div>
      </nav>
    </header>
  );
}
