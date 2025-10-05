import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";

export default function JobseekerLoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState({ email: "", password: "" });
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

    const result = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    router.push("/jobseeker/dashboard");
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
        <button type="submit" className="form-button" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="form-footer-link">
        New here? <Link href="/jobseeker/register">Create a Jobseeker Profile</Link>
      </p>
    </main>
  );
}
