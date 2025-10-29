import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import StateSelect from "@/components/forms/StateSelect";

const initialForm = {
  firstName: "",
  lastName: "",
  companyName: "",
  mobilePhone: "",
  officePhone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zip: "",
  website: "",
  timezone: "",
  email: "",
  password: "",
};

export default function EmployerRegisterPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user?.role) return;
    if (session.user.role === "employer") {
      router.replace("/employer/dashboard");
    } else {
      router.replace("/jobseeker/dashboard");
    }
  }, [router, session]);

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
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
          role: "employer",
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          companyName: form.companyName,
          mobilePhone: form.mobilePhone,
          officePhone: form.officePhone,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          state: form.state,
          zip: form.zip,
          website: form.website,
          timezone: form.timezone,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to create employer profile.");
      }

      const loginResult = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      if (loginResult?.error) {
        throw new Error("Account created, but sign in failed. Try logging in manually.");
      }

      router.push("/employer/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="form-page">
      <h1 className="form-heading">Create Employer Profile</h1>
      <form onSubmit={handleSubmit} className="form-stack">
        <label className="form-label">
          First Name
          <input
            required
            className="form-input"
            value={form.firstName}
            onChange={updateField("firstName")}
          />
        </label>
        <label className="form-label">
          Last Name
          <input
            required
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
          Company Name
          <input
            required
            className="form-input"
            value={form.companyName}
            onChange={updateField("companyName")}
          />
        </label>
        <label className="form-label">
          Mobile Phone
          <input
            type="tel"
            required
            className="form-input"
            value={form.mobilePhone}
            onChange={updateField("mobilePhone")}
          />
        </label>
        <label className="form-label">
          Office Phone (optional)
          <input
            type="tel"
            className="form-input"
            value={form.officePhone}
            onChange={updateField("officePhone")}
          />
        </label>
        <label className="form-label">
          Address Line 1
          <input
            required
            className="form-input"
            value={form.addressLine1}
            onChange={updateField("addressLine1")}
          />
        </label>
        <label className="form-label">
          Address Line 2
          <input
            className="form-input"
            value={form.addressLine2}
            onChange={updateField("addressLine2")}
          />
        </label>
        <label className="form-label">
          City
          <input
            required
            className="form-input"
            value={form.city}
            onChange={updateField("city")}
          />
        </label>
        <label className="form-label">
          State
          <StateSelect
            required
            value={form.state}
            onChange={updateField("state")}
          />
        </label>
        <label className="form-label">
          Zip Code
          <input
            required
            className="form-input"
            value={form.zip}
            onChange={updateField("zip")}
          />
        </label>
        <label className="form-label">
          Website
          <input
            className="form-input"
            value={form.website}
            onChange={updateField("website")}
          />
        </label>
        <label className="form-label">
          Timezone
          <input
            className="form-input"
            value={form.timezone}
            onChange={updateField("timezone")}
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="form-button" disabled={loading}>
          {loading ? "Creating profile…" : "Create profile"}
        </button>
      </form>
      <p className="form-footer-link">
        Already have an account? <Link href="/employer/login">Sign in</Link>
      </p>
    </main>
  );
}
