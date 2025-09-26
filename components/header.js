// components/Header.js
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header style={wrap}>
      <Link href="/" style={brand}>Traveling Overtime Jobs</Link>

      <nav style={nav}>
        <Link href="/search" style={link}>Search Jobs</Link>
        <Link href="/saved" style={link}>Saved</Link>
        <Link href="/employer/post" style={link}>Post Job</Link>
        <Link href="/employer/listings" style={link}>Manage Listings</Link>
        <Link href="/jobseeker/profile" style={link}>My Profile</Link>

        <SignedOut>
          <Link href="/sign-in" style={btnLight}>Sign In</Link>
          <Link href="/sign-up" style={btnDark}>Sign Up</Link>
        </SignedOut>

        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </nav>
    </header>
  );
}

const wrap = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 16px",
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "saturate(180%) blur(8px)",
  borderBottom: "1px solid #eee",
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
};

const brand = {
  fontWeight: 800,
  color: "#111",
  textDecoration: "none",
};

const nav = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

const link = {
  color: "#111",
  textDecoration: "none",
  padding: "6px 8px",
  borderRadius: 8,
};

const btnLight = {
  textDecoration: "none",
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 700,
};

const btnDark = {
  textDecoration: "none",
  background: "#111",
  color: "#fff",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 700,
};
