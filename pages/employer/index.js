// pages/employer/index.js
import { SignedIn, SignedOut, RedirectToSignIn, UserButton, useUser } from "@clerk/nextjs";

export default function EmployerArea() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer" />
      </SignedOut>
    );
  }

  return (
    <SignedIn>
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Employer Area</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <section style={grid}>
          <a href="/employer/post" style={card}>+ Post a Job</a>
          <a href="/employer/listings" style={card}>Manage Listings</a>
          <a href="/employer/profile" style={card}>Company Profile</a>
        </section>

        <a href="/" style={link}>← Back to Home</a>
      </main>
    </SignedIn>
  );
}

/* styles */
const wrap = {
  minHeight: "100vh",
  padding: "40px 24px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 24,
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
};

const header = {
  width: "100%",
  maxWidth: 960,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const grid = {
  width: "100%",
  maxWidth: 960,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const card = {
  display: "block",
  textDecoration: "none",
  background: "#fff",
  color: "#111",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 20,
  fontWeight: 700,
  textAlign: "center",
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};

const link = { textDecoration: "none", color: "#111" };
