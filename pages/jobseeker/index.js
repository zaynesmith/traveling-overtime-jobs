// pages/jobseeker/index.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
  UserButton,
} from "@clerk/nextjs";

export default function JobseekerArea() {
  const { isLoaded, isSignedIn, user } = useUser();
  const role = user?.publicMetadata?.role;

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/jobseeker" />
      </SignedOut>
    );
  }

  // If someone with employer role lands here, give a nudge
  if (role && role !== "jobseeker") {
    return (
      <SignedIn>
        <main style={wrap}>
          <Header />
          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Jobseeker Area</h2>
            <p>
              Your current role is <strong>{String(role)}</strong>. You can still
              browse here, but to personalize things switch to the Jobseeker role
              from your <a href="/dashboard">Dashboard</a>.
            </p>
          </section>
          <NavGrid />
          <a href="/" style={link}>← Back to Home</a>
        </main>
      </SignedIn>
    );
  }

  // Normal jobseeker view
  return (
    <SignedIn>
      <main style={wrap}>
        <Header />
        <NavGrid />
        <a href="/" style={link}>← Back to Home</a>
      </main>
    </SignedIn>
  );
}

function Header() {
  return (
    <header style={header}>
      <h1 style={{ margin: 0 }}>Jobseeker Area</h1>
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}

function NavGrid() {
  return (
    <section style={grid}>
      <a href="/jobseeker/profile" style={card}>Profile</a>
      <a href="/jobseeker/saved" style={card}>Saved Jobs</a>
      <a href="/jobseeker/applications" style={card}>Applications</a>
    </section>
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
