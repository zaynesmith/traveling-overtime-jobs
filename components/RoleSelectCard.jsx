import { useState } from "react";

const cardStyle = {
  maxWidth: 640,
  margin: "80px auto",
  padding: 32,
  borderRadius: 16,
  background: "#fff",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  textAlign: "center",
};

export function RoleSelectCard({ onChoose }) {
  const [pendingRole, setPendingRole] = useState(null);
  const [error, setError] = useState(null);

  const handleSelect = (role) => {
    if (!onChoose) return;

    setPendingRole(role);
    setError(null);

    Promise.resolve(onChoose(role))
      .catch((err) => {
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === "string") {
          setError(err);
        } else {
          setError("We couldn't save your workspace. Try again.");
        }
      })
      .finally(() => {
        setPendingRole(null);
      });
  };

  const employerBusy = pendingRole === "employer";
  const jobseekerBusy = pendingRole === "jobseeker";
  const isBusy = Boolean(pendingRole);

  return (
    <main className="container">
      <div className="card" style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>Choose your workspace</h1>
        <p style={{ color: "#475569", marginBottom: 24 }}>
          Pick the area you're here to access. We'll remember your choice and send you to the right dashboard.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            maxWidth: 320,
            margin: "0 auto",
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={() => handleSelect("employer")}
            disabled={isBusy}
          >
            {employerBusy ? "Saving…" : "Continue as Employer"}
          </button>
          <button
            type="button"
            className="pill-light"
            style={{ fontSize: 15 }}
            onClick={() => handleSelect("jobseeker")}
            disabled={isBusy}
          >
            {jobseekerBusy ? "Saving…" : "Continue as Job Seeker"}
          </button>
        </div>

        {error ? (
          <p
            role="alert"
            style={{
              marginTop: 16,
              color: "#b91c1c",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 14,
            }}
          >
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}

export default RoleSelectCard;
