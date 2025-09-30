"use client";

import { useMemo } from "react";

const roleNames = {
  employer: "employer",
  jobseeker: "jobseeker",
};

const roleDestinations = {
  employer: "/employer/dashboard",
  jobseeker: "/jobseeker/dashboard",
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

export function RoleGateLoading({ role }) {
  const readableRole = roleNames[role] || "account";

  return (
    <main className="container">
      <div className="card" style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>Checking access…</h1>
        <p style={{ color: "#475569", marginBottom: 0 }}>
          Hang tight while we confirm your {readableRole} access.
        </p>
      </div>
    </main>
  );
}

export function RoleGateDenied({
  expectedRole,
  status,
  error,
  currentRole,
}) {
  const readableExpected = roleNames[expectedRole] || "requested";
  const readableCurrent = currentRole && roleNames[currentRole];

  const { heading, message } = useMemo(() => {
    if (status === "error") {
      return {
        heading: "We hit a snag",
        message:
          "We couldn't confirm your access right now. Please refresh the page or try again in a moment.",
      };
    }

    if (readableCurrent && readableCurrent !== readableExpected) {
      return {
        heading: `You're signed in as a ${readableCurrent}`,
        message: `This area is reserved for ${readableExpected}s. We just sent you to the right dashboard, but you can use the links below if the page doesn't update.`,
      };
    }

    return {
      heading: "We couldn't confirm your access",
      message:
        "It looks like your onboarding isn't finished yet. Complete your sign-up or reach out to our support team for help.",
    };
  }, [status, readableCurrent, readableExpected]);

  const fallbackHref = useMemo(() => {
    if (currentRole && roleDestinations[currentRole]) {
      return roleDestinations[currentRole];
    }
    return "/";
  }, [currentRole]);

  const fallbackLabel = useMemo(() => {
    if (currentRole && roleDestinations[currentRole]) {
      return `Go to ${roleNames[currentRole]} area`;
    }
    return "Back to home";
  }, [currentRole]);

  const handleRetry = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <main className="container">
      <div className="card" style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>{heading}</h1>
        <p style={{ color: "#475569" }}>{message}</p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          {status === "error" && (
            <button className="btn" onClick={handleRetry}>
              Try again
            </button>
          )}
          <a className="pill-light" href={fallbackHref}>
            {fallbackLabel}
          </a>
        </div>

        {status === "error" && error?.message ? (
          <details style={{ marginTop: 16, textAlign: "left" }}>
            <summary style={{ cursor: "pointer" }}>Technical details</summary>
            <pre
              style={{
                marginTop: 8,
                fontSize: 12,
                background: "#f8fafc",
                borderRadius: 8,
                padding: 12,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {error.message}
            </pre>
          </details>
        ) : null}
      </div>
    </main>
  );
}
