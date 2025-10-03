import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { getOnboardingIntent, setOnboardingIntent } from "../lib/localOnboarding";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [role, setRole] = useState("jobseeker");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = getOnboardingIntent();
    if (stored === "employer" || stored === "jobseeker") {
      setRole(stored);
    }
  }, []);

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const changeRole = (value) => {
    setRole(value);
    setOnboardingIntent(value);
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password, role }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to create account.");
      }

      setOnboardingIntent(role);

      await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      const next = role === "employer" ? "/employer/register?onboarding=1" : "/jobs";
      router.push(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Create an account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <span className="block text-sm font-medium">I&apos;m creating an account as</span>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="role"
              value="jobseeker"
              checked={role === "jobseeker"}
              onChange={() => changeRole("jobseeker")}
            />
            Jobseeker
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="role"
              value="employer"
              checked={role === "employer"}
              onChange={() => changeRole("employer")}
            />
            Employer
          </label>
        </div>

        <label className="block text-sm">
          Email
          <input
            type="email"
            required
            className="mt-1 w-full border rounded-md p-2"
            value={form.email}
            onChange={updateField("email")}
          />
        </label>

        <label className="block text-sm">
          Password
          <input
            type="password"
            required
            minLength={8}
            className="mt-1 w-full border rounded-md p-2"
            value={form.password}
            onChange={updateField("password")}
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black text-white py-2"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </main>
  );
}
