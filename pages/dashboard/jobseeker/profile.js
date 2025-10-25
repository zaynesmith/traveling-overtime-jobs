import { useState } from "react";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

const profileFields = [
  { name: "firstName", label: "First Name" },
  { name: "lastName", label: "Last Name" },
  { name: "email", label: "Email" },
  { name: "trade", label: "Primary Trade" },
  { name: "address1", label: "Address Line 1" },
  { name: "address2", label: "Address Line 2" },
  { name: "city", label: "City" },
  { name: "state", label: "State" },
  { name: "zip", label: "ZIP" },
];

export default function JobseekerProfilePage({ initialProfile }) {
  const [profile, setProfile] = useState(() => ({
    ...initialProfile,
    resumeUrl: initialProfile?.resumeUrl || initialProfile?.resumeurl || initialProfile?.resumeURL || "",
  }));
  const [resumeFile, setResumeFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setResumeFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setResumeFile({
        fileName: file.name,
        fileType: file.type,
        base64: reader.result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/profile/jobseeker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, resume: resumeFile }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to save profile");
      }

      setProfile((current) => {
        const next = { ...current, ...payload };
        if (payload?.resumeUrl || payload?.resumeurl || payload?.resumeURL) {
          next.resumeUrl = payload.resumeUrl || payload.resumeurl || payload.resumeURL;
        }
        return next;
      });
      setResumeFile(null);
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to save profile" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Profile</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Share your experience</h1>
          <p className="text-sm text-slate-600">
            Keep contact details and trade information up to date so employers can reach you quickly.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {profileFields.map((field) => (
                <div key={field.name}>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    value={profile[field.name] || ""}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="resume">
                Resume File
              </label>
              <input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeChange}
                className="mt-1 w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
              {resumeFile ? (
                <p className="mt-2 text-xs text-slate-500">Selected: {resumeFile.fileName}</p>
              ) : profile.resumeUrl ? (
                <a
                  href={profile.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-sky-600 hover:text-sky-500"
                >
                  View current resume
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M7 17l9-9M7 7h10v10" />
                  </svg>
                </a>
              ) : (
                <p className="mt-2 text-xs text-slate-500">No resume uploaded yet.</p>
              )}
            </div>

            {message ? (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  message.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {message.text}
              </div>
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-sky-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/jobseeker/login",
        permanent: false,
      },
    };
  }

  if (session.user?.role !== "jobseeker") {
    const destination = session.user?.role === "employer" ? "/dashboard/employer" : "/";
    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  try {
    const { default: prisma } = await import("@/lib/prisma");
    const profile = await prisma.jobseekerProfile.findUnique({
      where: { userId: session.user.id },
    });

    return {
      props: {
        initialProfile: JSON.parse(JSON.stringify(profile || {})),
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        initialProfile: {},
      },
    };
  }
}
