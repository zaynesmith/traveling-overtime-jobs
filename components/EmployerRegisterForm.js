"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { ROLE_ROUTES } from "@/lib/roleRoutes";

/**
 * Minimal employer registration form.
 * Stores company profile in Clerk publicMetadata.employerProfile
 * and ensures role = "employer", then routes to dashboard.
 */
export default function EmployerRegisterForm() {
  const { user } = useUser();
  const router = useRouter();

  const [form, setForm] = useState({
    companyName: "",
    website: "",
    phone: "",
    location: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSaving(true);
      setErr(null);

      const employerProfile = {
        ...((user.publicMetadata?.employerProfile ?? {}) || {}),
        ...form,
        updatedAt: new Date().toISOString(),
      };

      await user.update({
        publicMetadata: {
          ...user.publicMetadata,
          role: "employer",
          employerProfile,
        },
      });

      await router.replace(ROLE_ROUTES.employer);
    } catch (error) {
      setErr(error?.message || "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-xl mx-auto p-6 rounded-xl border">
      <h1 className="text-2xl font-semibold mb-4">Employer Registration</h1>

      <label className="block mb-3">
        <span className="text-sm">Company name</span>
        <input
          className="mt-1 w-full border rounded-md p-2"
          name="companyName"
          value={form.companyName}
          onChange={onChange}
          required
        />
      </label>

      <label className="block mb-3">
        <span className="text-sm">Company website</span>
        <input
          className="mt-1 w-full border rounded-md p-2"
          name="website"
          value={form.website}
          onChange={onChange}
          placeholder="https://"
        />
      </label>

      <label className="block mb-3">
        <span className="text-sm">Phone</span>
        <input
          className="mt-1 w-full border rounded-md p-2"
          name="phone"
          value={form.phone}
          onChange={onChange}
        />
      </label>

      <label className="block mb-4">
        <span className="text-sm">Location</span>
        <input
          className="mt-1 w-full border rounded-md p-2"
          name="location"
          value={form.location}
          onChange={onChange}
          placeholder="City, ST"
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded-lg border bg-black text-white"
      >
        {saving ? "Saving…" : "Create employer account"}
      </button>

      {err ? <p className="mt-3 text-red-600 text-sm">{err}</p> : null}
    </form>
  );
}
