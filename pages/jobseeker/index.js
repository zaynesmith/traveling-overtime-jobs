// pages/jobseeker/index.js
import { SignedIn, SignedOut, RedirectToSignIn, UserButton, useUser } from "@clerk/nextjs";

export default function JobseekerHub() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/jobseeker" />
      </SignedOut>
    );
  }

  return (
    <SignedIn>
      <main style={wrap}>
        <header style={header}>
          <h1 style={{ margin: 0 }}>Jobseeker Area</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <section style={card}>
          <p style={{ marginTop: 0, color: "#555" }}>
            Manage your profile and start searching for traveling overtime jobs.
          </p>
          <div style={grid}>
            <a href="/jobseeker/profile" style={tile}>
              <strong>Profile</strong>
              <span>Update contact, skills, travel prefs</span>
            </a>
            <a href="/jobseeker/search" style={tile}>
              <strong>Search Jobs</strong>
              <span>Filter by trade, location, pay</span>
            </a>
          </div>
        </section>
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
  gap: 16,
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
};
const header = {
  width: "100%",
  maxWidth: 1000,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const card = {
  width: "100%",
  maxWidth: 1000,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};
const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};
const tile = {
  display: "grid",
  gap: 6,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "16px 18px",
  color: "#111",
  textDecoration: "none",
};
