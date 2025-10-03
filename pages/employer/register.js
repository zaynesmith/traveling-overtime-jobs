import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import authOptions from "../../lib/authOptions";
import {
  clearEmployerDraft,
  loadEmployerDraft,
  saveEmployerDraft,
  setOnboardingIntent,
} from "../../lib/localOnboarding";

export default function EmployerRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "",
    website: "",
    phone: "",
    location: "",
    notes: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOnboardingIntent("employer");
    const draft = loadEmployerDraft();
    if (draft) {
      setForm((prev) => ({ ...prev, ...draft }));
    }
  }, []);

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      saveEmployerDraft(next);
      return next;
    });
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/employer/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: form }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to save employer profile.");
      }

      clearEmployerDraft();
      router.push("/employer/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Employer onboarding</h1>
      <p className="text-sm text-gray-600 mb-6">
        Tell us a bit about your company so we can tailor your dashboard for hiring traveling crews.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          Company name
          <input
            required
            className="mt-1 w-full border rounded-md p-2"
            value={form.companyName}
            onChange={updateField("companyName")}
          />
        </label>
        <label className="block text-sm">
          Website
          <input
            className="mt-1 w-full border rounded-md p-2"
            value={form.website}
            onChange={updateField("website")}
            placeholder="https://"
          />
        </label>
        <label className="block text-sm">
          Phone
          <input
            className="mt-1 w-full border rounded-md p-2"
            value={form.phone}
            onChange={updateField("phone")}
            placeholder="(555) 555-5555"
          />
        </label>
        <label className="block text-sm">
          Location
          <input
            className="mt-1 w-full border rounded-md p-2"
            value={form.location}
            onChange={updateField("location")}
            placeholder="City, ST"
          />
        </label>
        <label className="block text-sm">
          Notes for our team
          <textarea
            rows={4}
            className="mt-1 w-full border rounded-md p-2"
            value={form.notes}
            onChange={updateField("notes")}
            placeholder="Share project details, travel expectations, or overtime requirements."
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button type="submit" disabled={loading} className="rounded-md bg-black text-white px-4 py-2">
          {loading ? "Saving…" : "Save and continue"}
        </button>
      </form>
    </main>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
