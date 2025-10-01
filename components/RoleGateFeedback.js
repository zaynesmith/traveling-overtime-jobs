import { useMemo } from "react";
import { ROLE_ROUTES } from "../lib/useRequireRole";

const roleNames = {
  employer: "employer",
  jobseeker: "jobseeker",
};

const loadingCopy = {
  employer: {
    heading: "Setting up your employer workspace…",
    message:
      "We're routing you to your company profile so you can finish onboarding and access the employer dashboard.",
  },
  jobseeker: {
    heading: "Checking access…",
    message: "Hang tight while we confirm your jobseeker access.",
  },
};

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

export function LoadingCard({ role }) {
  const readableRole = roleNames[role] || "account";
  const copy = loadingCopy[role] || {
    heading: "Checking access…",
    message: `Hang tight while we confirm your ${readableRole} access.`,
  };

  return (
    <main className="container">
      <div className="card" style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>{copy.heading}</h1>
        <p style={{ color: "#475569", marginBottom: 0 }}>{copy.message}</p>
      </div>
    </main>
  );
}

export const RoleGateLoading = LoadingCard;

export function ForbiddenOrSwitchRole({
  expectedRole,
  currentRole,
  onChoose,
  isAssigning,
  error,
}) {
  const readableExpected = roleNames[expectedRole] || "requested";
  const readableCurrent = currentRole && roleNames[currentRole];

  const heading = readableCurrent
    ? `You're signed in as a ${readableCurrent}`
    : "Switch workspaces to continue";

  const message = readableCurrent
    ? `The ${readableExpected} tools live in a different workspace. Switch roles to continue or head back to your ${readableCurrent} dashboard.`
    : `This area is reserved for ${readableExpected}s. Choose the correct workspace to continue.`;

  const fallbackHref = useMemo(() => {
    if (currentRole && ROLE_ROUTES[currentRole]) {
      return ROLE_ROUTES[currentRole];
    }
    return "/";
  }, [currentRole]);

  const fallbackLabel = readableCurrent
    ? `Go to ${readableCurrent} workspace`
    : "Back to home";

  const handleSwitch = () => {
    if (!onChoose) return;
    Promise.resolve(onChoose(expectedRole)).catch(() => {
      // The hook handles error state; suppress unhandled rejections.
    });
  };

  return (
    <main className="container">
      <div className="card" style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>{heading}</h1>
        <p style={{ color: "#475569" }}>{message}</p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn" onClick={handleSwitch} disabled={isAssigning}>
            {isAssigning ? "Switching…" : `Switch to ${readableExpected}`}
          </button>
          <a className="pill-light" href={fallbackHref}>
            {fallbackLabel}
          </a>
        </div>

        {error?.message ? (
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
            {error.message}
          </p>
        ) : null}
      </div>
    </main>
  );
}
