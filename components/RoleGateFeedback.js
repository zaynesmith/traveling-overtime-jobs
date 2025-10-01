"use client";

import { useMemo } from "react";

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

const roleDestinations = {
  employer: "/employer",
  jobseeker: "/jobseeker",
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

export function RoleGateRolePicker({ onSelectRole, isAssigning, error }) {
  const handleSelect = (role) => {
    if (!onSelectRole) {
      return;
    }

    Promise.resolve(onSelectRole(role)).catch(() => {
      // The hook handles error state; suppress unhandled rejections in the UI.
    });
  };

  return (
    <main className="container">
      <div className="card" style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>Choose your workspace</h1>
        <p style={{ color: "#475569", marginBottom: 24 }}>
          Pick the area you're here to access. We'll remember your choice and
          send you to the right dashboard.
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
            disabled={isAssigning}
          >
            {isAssigning ? "Saving choice…" : "Continue as Employer"}
          </button>
          <button
            type="button"
            className="pill-light"
            style={{ fontSize: 15 }}
            onClick={() => handleSelect("jobseeker")}
            disabled={isAssigning}
          >
            {isAssigning ? "Saving choice…" : "Continue as Job Seeker"}
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
      </div>
    </main>
  );
}
