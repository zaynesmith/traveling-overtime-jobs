// pages/jobseeker/index.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
} from "@clerk/nextjs";

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
            <a href="/jobseeker/search" style={cardLink}>
              <h2 style={{ marginTop: 0 }}>Search Jobs</h2>
              <p>Browse and filter jobs by trade, location, or pay.</p>
            </a>

            <a href="/jobseeker/saved" style={cardLink}>
              <h2 style={{ marginTop: 0 }}>Saved Jobs</h2>
              <p>Quick access to jobs you’ve starred for later.</p>
            </a>

            <a href="/jobseeker/applications" style={cardLink}>
              <h2 style={{ marginTop: 0 }}>My Applications</h2>
              <p>Track jobs you’ve applied for.</p>
            </a>

            <a href="/jobseeker/profile" style={cardLink}>
              <h2 style={{ marginTop: 0 }}>My Profile</h2>
              <p>Upload your resume, update contact info, and manage settings.</p>
            </a>
          </section>
        </main>
      </SignedIn>
    </>
  );
}

/* ------------ styles ------------ */
const wrap = {
  minHeight: "100vh",
  padding: "40px 24px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 20,
  fontFamily:
    "system-ui,-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
};

const header = {
  width: "100%",
  maxWidth: 1000,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const grid = {
  width: "100%",
  maxWidth: 1000,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const card = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};

const cardLink = {
  ...card,
  display: "block",
  textDecoration: "none",
  color: "#111",
};