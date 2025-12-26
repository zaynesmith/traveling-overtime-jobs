import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const GENERIC_MESSAGE = "If an account exists for that email, we sent a reset link.";

function normalizeRole(role) {
  return role === "employer" || role === "jobseeker" ? role : null;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const role = useMemo(() => normalizeRole(router.query.role), [router.query.role]);
  const loginHref = role === "employer" ? "/employer/login" : "/jobseeker/login";

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role,
        }),
      });
    } finally {
      setSubmitted(true);
      setLoading(false);
    }
  }

  return (
    <main className="form-page">
      <h1 className="form-heading">Forgot Password</h1>
      <form onSubmit={handleSubmit} className="form-stack">
        <label className="form-label">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            className="form-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button type="submit" className="form-button" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      {submitted ? <p className="form-footer-link">{GENERIC_MESSAGE}</p> : null}
      <p className="form-footer-link">
        <Link href={loginHref}>Back to login</Link>
      </p>
    </main>
  );
}
