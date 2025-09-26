// pages/dashboard/index.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
  useUser,
} from "@clerk/nextjs";

export default function Dashboard() {
  const { user } = useUser();

  return (
    <>
      {/* If not signed in, bounce to the sign-in page and come back here after */}
      <SignedOut>
        <RedirectToSignIn redirectUrl="/dashboard" />
      </SignedOut>

      {/* If signed in, show the dashboard */}
      <SignedIn>
        <main
          style={{
            minHeight: "100vh",
            padding: "40px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
          }}
        >
          <header
            style={{
              width: "100%",
              maxWidth: 960,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
              Dashboard
            </h1>
            <UserButton afterSignOutUrl="/" />
          </header>

          <section
            style={{
              width: "100%",
              maxWidth: 960,
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            }}
          >
            <p style={{ marginTop: 0, fontSize: 18 }}>
              Welcome{user?.firstName ? `, ${user.firstName}` : ""}! 🎉
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 12,
              }}
            >
              <a
                href="/employer"
                style={pillStyle}
              >
                Go to Employer Area
              </a>
              <a
                href="/jobseeker"
                style={pillStyle}
              >
                Go to Jobseeker Area
              </a>
            </div>
          </section>
        </main>
      </SignedIn>
    </>
  );
}

const pillStyle = {
  display: "inline-block",
  background: "#111",
  color: "#fff",
  borderRadius: 999,
  padding: "10px 14px",
  fontWeight: 600,
  textDecoration: "none",
};
