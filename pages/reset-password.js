import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

function normalizeRole(role) {
  return role === "employer" || role === "jobseeker" ? role : null;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = useMemo(() => {
    if (!router.isReady) return null;
    const value = router.query.token;
    return typeof value === "string" ? value : null;
  }, [router.isReady, router.query.token]);

  const role = useMemo(() => normalizeRole(router.query.role), [router.query.role]);
  const loginHref = role === "employer" ? "/employer/login" : "/jobseeker/login";
  const forgotHref = role ? `/forgot-password?role=${role}` : "/forgot-password";

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset link is missing or invalid.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Unable to reset password.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="form-page">
      <h1 className="form-heading">Reset Password</h1>
      {!token ? (
        <>
          <p className="form-error">Reset link is missing or invalid.</p>
          <p className="form-footer-link">
            <Link href={forgotHref}>Back to forgot password</Link>
          </p>
        </>
      ) : success ? (
        <>
          <p className="form-footer-link">Your password has been reset.</p>
          <p className="form-footer-link">
            <Link href={loginHref}>Back to login</Link>
          </p>
        </>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="form-stack">
            <label className="form-label">
              New Password
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="form-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label className="form-label">
              Confirm Password
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="form-input"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button type="submit" className="form-button" disabled={loading}>
              {loading ? "Resetting…" : "Reset password"}
            </button>
          </form>
          <p className="form-footer-link">
            <Link href={loginHref}>Back to login</Link>
          </p>
        </>
      )}
    </main>
  );
}
