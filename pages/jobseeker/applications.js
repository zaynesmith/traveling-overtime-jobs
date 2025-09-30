// pages/jobseeker/applications.js
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
} from "@clerk/nextjs";
import { useRequireRole } from "../../lib/useRequireRole";
import { useEffect, useState } from "react";

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const canView = useRequireRole("jobseeker");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("applications");
      setApps(raw ? JSON.parse(raw) : []);
    } catch {
      setApps([]);
    }
  }, []);

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/jobseeker/applications" />
      </SignedOut>

      <SignedIn>
        {canView ? (
          <main style={wrap}>
            <header style={header}>
              <h1 style={{ margin: 0 }}>My Applications</h1>
              <UserButton afterSignOutUrl="/" />
            </header>

            <section style={card}>
              {apps.length === 0 ? (
                <div style={{ color: "#666" }}>
                  You haven’t applied to any jobs yet.
                </div>
              ) : (
                <table style={table}>
                  <thead>
                    <tr>
                      <th align="left">Title</th>
                      <th align="left">Company</th>
                      <th align="left">Location</th>
                      <th align="left">Status</th>
                      <th align="left">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((a) => (
                      <tr key={a.id}>
                        <td>{a.title}</td>
                        <td>{a.company}</td>
                        <td>{a.location}</td>
                        <td>
                          <span style={badge}>{a.status}</span>
                        </td>
                        <td>{new Date(a.submittedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </main>
        ) : null}
      </SignedIn>
    </>
  );
}

/* --- styles --- */
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
  maxWidth: 960,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const card = {
  width: "100%",
  maxWidth: 960,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
};

const badge = {
  padding: "2px 8px",
  borderRadius: 999,
  background: "#f1f5ff",
  border: "1px solid #d5defa",
  fontSize: 12,
};
