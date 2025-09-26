// pages/dashboard/index.js
import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from "@clerk/nextjs";

export default function Dashboard() {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/dashboard" />
      </SignedOut>

      <SignedIn>
        <main style={wrap}>
          <header style={header}>
            <h1 style={{ margin: 0 }}>Dashboard</h1>
            <UserButton afterSignOutUrl="/" />
          </header>

          {/* Two separate areas — no role setting, no metadata writes */}
          <section style={grid}>
            <div style={card}>
              <h2 style={{ marginTop: 0 }}>Jobseeker</h2>
              <p>Find and manage your applications.</p>
              <div style={row}>
                <a href="/jobseeker" style={pillDark}>Open Jobseeker Area</a>
                <a href="/jobseeker/profile" style={pillLight}>My Profile</a>
                <a href="/jobseeker/applications" style={pillLight}>My Applications</a>
                <a href="/jobseeker/saved" style={pillLight}>Saved Jobs</a>
              </div>
            </div>

            <div style={card}>
              <h2 style={{ marginTop: 0 }}>Employer</h2>
              <p>Post jobs and manage your listings.</p>
              <div style={row}>
                <a href="/employer" style={pillDark}>Open Employer Area</a>
                <a href="/employer/post" style={pillLight}>Post a Job</a>
                <a href="/employer/listings" style={pillLight}>Manage Listings</a>
                <a href="/employer/profile" style={pillLight}>Company Profile</a>
              </div>
            </div>
          </section>
        </main>
      </SignedIn>
    </>
  );
}

/* ---- styles ---- */
const wrap = {
  minHeight: "100vh",
  padding: "40px 24px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 20,
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
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
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};
const card = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};
const row = { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 };

const pillDark = {
  display: "inline-block",
  background: "#111",
  color: "#fff",
  borderRadius: 999,
  padding: "10px 14px",
  fontWeight: 700,
  textDecoration: "none",
};
const pillLight = {
  display: "inline-block",
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 999,
  padding: "10px 14px",
  fontWeight: 700,
  textDecoration: "none",
};
