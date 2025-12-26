import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import TurnstileWidget from "@/components/TurnstileWidget";

export default function JobseekerLoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState({ email: "", password: "" });
  const turnstileRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user?.role) return;
    if (session.user.role === "jobseeker") {
      router.replace("/jobseeker/dashboard");
    } else {
      router.replace("/employer/dashboard");
    }
  }, [router, session]);

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const turnstileToken = await turnstileRef.current?.execute();
    if (!turnstileToken) {
      setError("Unable to verify you’re human. Please try again.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
      turnstileToken,
    });

    if (result?.error) {
      const message = result.error.includes("verify you’re human")
        ? "Unable to verify you’re human. Please try again."
        : "Invalid email or password.";
      setError(message);
      setLoading(false);
      turnstileRef.current?.reset?.();
      return;
    }

    router.push("/jobseeker/dashboard");
    turnstileRef.current?.reset?.();
  }

  return (
    <main className="form-page">
      <h1 className="form-heading">Jobseeker Login</h1>
      <form onSubmit={handleSubmit} className="form-stack">
        <label className="form-label">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            className="form-input"
            value={form.email}
            onChange={updateField("email")}
          />
        </label>
        <label className="form-label">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            className="form-input"
            value={form.password}
            onChange={updateField("password")}
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <TurnstileWidget ref={turnstileRef} siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
        <button type="submit" className="form-button" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="form-footer-link">
        New here? <Link href="/jobseeker/register">Create a Jobseeker Profile</Link>
      </p>
      <p className="form-footer-link">
        <Link href="/forgot-password?role=jobseeker">Forgot password?</Link>
      </p>
    </main>
  );
}
