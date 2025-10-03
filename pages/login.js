import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { getOnboardingIntent, setOnboardingIntent } from "../lib/localOnboarding";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [intent, setIntent] = useState("jobseeker");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const stored = getOnboardingIntent();
    if (stored === "employer" || stored === "jobseeker") {
      setIntent(stored);
    }
  }, []);

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const changeIntent = (value) => {
    setIntent(value);
    setOnboardingIntent(value);
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // TODO: add rate limiting for login attempts on the credentials endpoint.
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

    const destination = intent === "employer" ? "/employer/register?onboarding=1" : "/jobs";
    router.push(destination);
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Log in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <span className="block text-sm font-medium">I&apos;m signing in as</span>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="intent"
              value="jobseeker"
              checked={intent === "jobseeker"}
              onChange={() => changeIntent("jobseeker")}
            />
            Jobseeker
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="intent"
              value="employer"
              checked={intent === "employer"}
              onChange={() => changeIntent("employer")}
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
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
