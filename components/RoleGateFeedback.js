import Link from "next/link";
import { useMemo } from "react";

import { ROLE_ROUTES } from "../lib/roleRoutes";

const roleNames = {
  employer: "employer",
  jobseeker: "jobseeker",
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

function Card({ heading, message, children }) {
  return (
    <main className="container">
      <div className="card" style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>{heading}</h1>
        <p style={{ color: "#475569" }}>{message}</p>
        {children}
      </div>
    </main>
  );
}

export function RoleGateLoading({ role }) {
  const readableRole = roleNames[role] || "account";

  return (
    <Card
      heading="Checking access…"
      message={`Hang tight while we confirm your ${readableRole} access.`}
    />
  );
}

export const LoadingCard = RoleGateLoading;

export function RoleGateDenied({
  expectedRole,
  currentRole,
  status = "forbidden",
  error,
  onRequestRole,
  isAssigning,
}) {
  const readableExpected = roleNames[expectedRole] || "requested";
  const readableCurrent = currentRole ? roleNames[currentRole] : undefined;

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

  return (
    <Card heading={heading} message={message}>
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
          marginTop: 20,
        }}
      >
        {onRequestRole ? (
          <button className="btn" onClick={onRequestRole} disabled={isAssigning}>
            {isAssigning ? "Switching…" : `Switch to ${readableExpected}`}
          </button>
        ) : null}
        <Link className="pill-light" href={fallbackHref}>
          {fallbackLabel}
        </Link>
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

      {status === "error" ? (
        <p style={{ marginTop: 12, color: "#475569", fontSize: 14 }}>
          Try signing out and back in. If the problem continues, contact support.
        </p>
      ) : null}
    </Card>
  );
}

export function RoleGateRolePicker({ onSelectRole, isAssigning, error }) {
  const handleChoose = (role) => {
    if (!onSelectRole) return;
    Promise.resolve(onSelectRole(role)).catch(() => {
      // Swallow errors here; hook exposes them via `error` prop.
    });
  };

  return (
    <Card
      heading="Choose how you want to continue"
      message="Pick the workspace that matches what you need to do right now."
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
          marginTop: 20,
        }}
      >
        <button
          type="button"
          className="btn"
          onClick={() => handleChoose("jobseeker")}
          disabled={isAssigning}
        >
          {isAssigning ? "Assigning…" : "Continue as jobseeker"}
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={() => handleChoose("employer")}
          disabled={isAssigning}
        >
          {isAssigning ? "Assigning…" : "Continue as employer"}
        </button>
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
    </Card>
  );
}

export function ForbiddenOrSwitchRole({
  expectedRole,
  currentRole,
  onChoose,
  isAssigning,
  error,
}) {
  const handleRequestRole = () => {
    if (!onChoose) return;
    Promise.resolve(onChoose(expectedRole)).catch(() => {
      // handled by parent
    });
  };

  return (
    <RoleGateDenied
      expectedRole={expectedRole}
      currentRole={currentRole}
      status="forbidden"
      error={error}
      onRequestRole={handleRequestRole}
      isAssigning={isAssigning}
    />
  );
}
