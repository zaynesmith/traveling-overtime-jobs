import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import TRADES from "@/lib/trades";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zipCode: "",
  trade: "",
};

export default function JobseekerRegisterPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState(initialForm);
  const [resumeName, setResumeName] = useState("");
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

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0];
    setResumeName(file ? file.name : "");
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "jobseeker",
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          address1: form.address1,
          address2: form.address2,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          trade: form.trade,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to create jobseeker profile.");
      }

      const loginResult = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      if (loginResult?.error) {
        throw new Error("Account created, but sign in failed. Try logging in manually.");
      }

      router.push("/jobseeker/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="form-page">
      <h1 className="form-heading">Create Jobseeker Profile</h1>
      <form onSubmit={handleSubmit} className="form-stack">
        <label className="form-label">
          First Name
          <input
            className="form-input"
            value={form.firstName}
            onChange={updateField("firstName")}
          />
        </label>
        <label className="form-label">
          Last Name
          <input
            className="form-input"
            value={form.lastName}
            onChange={updateField("lastName")}
          />
        </label>
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
            minLength={8}
            autoComplete="new-password"
            className="form-input"
            value={form.password}
            onChange={updateField("password")}
          />
        </label>
        <label className="form-label">
          Address Line 1
          <input
            className="form-input"
            value={form.address1}
            onChange={updateField("address1")}
          />
        </label>
        <label className="form-label">
          Address Line 2
          <input
            className="form-input"
            value={form.address2}
            onChange={updateField("address2")}
          />
        </label>
        <label className="form-label">
          City
          <input
            className="form-input"
            value={form.city}
            onChange={updateField("city")}
          />
        </label>
        <label className="form-label">
          State
          <input
            className="form-input"
            value={form.state}
            onChange={updateField("state")}
          />
        </label>
        <label className="form-label">
          Zip Code
          <input
            className="form-input"
            value={form.zipCode}
            onChange={updateField("zipCode")}
          />
        </label>
        <label className="form-label">
          Trade/Craft
          <select
            required
            className="form-input"
            value={form.trade}
            onChange={updateField("trade")}
          >
            <option value="" disabled>
              Select your trade
            </option>
            {TRADES.map((trade) => (
              <option key={trade} value={trade}>
                {trade}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Resume (optional)
          <input type="file" className="form-input" onChange={handleResumeChange} />
          {resumeName ? <span className="form-hint">Selected: {resumeName}</span> : null}
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="form-button" disabled={loading}>
          {loading ? "Creating profile…" : "Create profile"}
        </button>
      </form>
      <p className="form-footer-link">
        Already have an account? <Link href="/jobseeker/login">Sign in</Link>
      </p>
    </main>
  );
}
