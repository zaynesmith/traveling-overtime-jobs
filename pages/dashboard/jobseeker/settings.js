import { useMemo, useState } from "react";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import StateSelect from "@/components/forms/StateSelect";
import { formatZipSuggestionLocation, formatZipSuggestionMessage } from "@/lib/utils/zipMessages";

function formatDateDisplay(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function JobseekerSettingsPage({ preferences, profile }) {
  const [form, setForm] = useState(preferences);
  const [profileForm, setProfileForm] = useState(profile);
  const [message, setMessage] = useState(null);
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [bumpState, setBumpState] = useState({ status: null, message: null });
  const [bumping, setBumping] = useState(false);
  const [zipFeedback, setZipFeedback] = useState(null);

  const handleChange = (event) => {
    const { name, checked } = event.target;
    setForm((current) => ({ ...current, [name]: checked }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage("Settings saved (demo)");
  };

  const handleProfileInputChange = (event) => {
    const { name, value } = event.target;
    if (name === "zip" || name === "city" || name === "state") {
      setZipFeedback(null);
    }
    setProfileForm((current) => ({ ...current, [name]: value }));
  };

  const applyZipSuggestion = (suggestion) => {
    if (!suggestion?.zip) return;
    setProfileForm((current) => ({ ...current, zip: suggestion.zip }));
    setZipFeedback(null);
  };

  const handleCertFileRemove = (path) => {
    setProfileForm((current) => ({
      ...current,
      certFiles: current.certFiles.filter((item) => item !== path),
    }));
  };

  const handleCertFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setPendingUploads((current) => [...current, ...files]);
    event.target.value = "";
  };

  const pendingUploadNames = useMemo(() => pendingUploads.map((file) => file.name), [pendingUploads]);

  const handleViewDocument = async (path) => {
    if (!profileForm.id) return;

    try {
      setProfileMessage(null);
      setProfileError(null);

      const params = new URLSearchParams({ profileId: profileForm.id, path });
      const response = await fetch(`/api/profile/certifications?${params.toString()}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Unable to open document");
      }

      const data = await response.json();
      if (data?.url && typeof window !== "undefined") {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        throw new Error("Unable to open document");
      }
    } catch (error) {
      console.error(error);
      setProfileError(error.message || "Unable to open document");
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileMessage(null);
    setProfileError(null);
    setZipFeedback(null);
    setSavingProfile(true);

    try {
      const uploadsPayload = await Promise.all(
        pendingUploads.map(async (file) => ({
          fileName: file.name,
          fileType: file.type,
          base64: await readFileAsDataUrl(file),
        }))
      );

      const response = await fetch("/api/profile/jobseeker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            phone: profileForm.phone,
            city: profileForm.city,
            state: profileForm.state,
            zip: profileForm.zip,
            certifications: profileForm.certifications,
            certFiles: profileForm.certFiles,
          },
          newCertFiles: uploadsPayload,
        }),
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch (parseError) {
        payload = null;
      }

      if (!response.ok) {
        if (payload?.error === "Invalid ZIP") {
          const suggestion = payload?.suggestion || null;
          const messageText =
            payload?.message || formatZipSuggestionMessage(suggestion);
          setZipFeedback({
            type: suggestion ? "suggestion" : "error",
            message: messageText,
            suggestion,
          });
          if (!suggestion) {
            setProfileError(messageText);
          }
          return;
        }

        throw new Error(payload?.error || "Unable to update profile information");
      }

      const data = payload || {};

      setProfileForm((current) => ({
        ...current,
        certFiles: Array.isArray(data.certFiles) ? data.certFiles : current.certFiles,
      }));
      setPendingUploads([]);
      setProfileMessage("Profile information updated.");
    } catch (error) {
      console.error(error);
      setProfileError(error.message || "Unable to update profile information");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResumeBump = async () => {
    setBumping(true);
    setBumpState({ status: null, message: null });

    try {
      const response = await fetch("/api/profile/bump", { method: "POST" });

      if (response.status === 429) {
        const payload = await response.json().catch(() => ({}));
        const formattedDate = formatDateDisplay(payload?.nextEligibleDate);
        setBumpState({
          status: "info",
          message: formattedDate
            ? `You can bump your resume again on ${formattedDate}.`
            : "You can bump your resume again once the 7-day cooldown ends.",
        });
        return;
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Unable to bump resume");
      }

      const payload = await response.json();
      const bumpDate = payload?.lastBump || payload?.lastActive || new Date().toISOString();

      setProfileForm((current) => ({ ...current, lastBump: bumpDate }));
      setBumpState({ status: "success", message: "Resume bumped successfully." });
    } catch (error) {
      console.error(error);
      setBumpState({ status: "error", message: error.message || "Unable to bump resume" });
    } finally {
      setBumping(false);
    }
  };

  const zipSuggestionLocation = formatZipSuggestionLocation(zipFeedback?.suggestion);

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Settings</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Fine-tune your account</h1>
          <p className="max-w-2xl text-base text-slate-600">
            Control alerts, privacy, and visibility preferences from one easy panel.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <header className="mb-6 space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
            <p className="text-sm text-slate-600">
              Keep your contact details and certifications current so employers can verify your credentials quickly.
            </p>
          </header>

          <form className="space-y-6" onSubmit={handleProfileSubmit}>
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Phone number
                <input
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileInputChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                City
                <input
                  name="city"
                  value={profileForm.city}
                  onChange={handleProfileInputChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                State
                <StateSelect
                  name="state"
                  value={profileForm.state}
                  onChange={handleProfileInputChange}
                  includePlaceholder
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                ZIP code
                <input
                  name="zip"
                  value={profileForm.zip}
                  onChange={handleProfileInputChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
                {zipFeedback?.type === "suggestion" ? (
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    That ZIP was unrecognized. Try using{' '}
                    <button
                      type="button"
                      onClick={() => applyZipSuggestion(zipFeedback.suggestion)}
                      className="font-semibold text-sky-700 underline"
                    >
                      {zipFeedback.suggestion?.zip}
                    </button>
                    {zipSuggestionLocation ? ` from ${zipSuggestionLocation}` : ''}
                    {' '}instead.
                  </p>
                ) : null}
                {zipFeedback?.type === "error" ? (
                  <p className="mt-2 rounded-lg bg-rose-100 px-3 py-2 text-xs font-medium text-rose-700">
                    {zipFeedback.message}
                  </p>
                ) : null}
              </label>
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              Certifications / Licenses
              <textarea
                name="certifications"
                value={profileForm.certifications}
                onChange={handleProfileInputChange}
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">Supporting documents</p>
                <p className="mt-1 text-xs text-slate-500">Upload certifications, licenses, or other proof of qualifications.</p>
              </div>

              {profileForm.certFiles.length ? (
                <ul className="space-y-2 text-sm text-slate-700">
                  {profileForm.certFiles.map((path) => {
                    const fileName = path.split("/").pop();
                    return (
                      <li key={path} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                        <span className="truncate" title={fileName}>
                          {fileName || path}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleViewDocument(path)}
                            className="text-xs font-semibold text-sky-600 hover:text-sky-500"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCertFileRemove(path)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-500"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No supporting documents uploaded yet.</p>
              )}

              {pendingUploadNames.length ? (
                <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
                  <p className="font-semibold">Ready to upload</p>
                  <ul className="mt-1 list-disc pl-5">
                    {pendingUploadNames.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <input
                type="file"
                accept="application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                multiple
                onChange={handleCertFileSelect}
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-sky-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-sky-500"
              />
            </div>

            {profileError ? <p className="text-sm font-medium text-rose-600">{profileError}</p> : null}
            {profileMessage ? <p className="text-sm font-medium text-emerald-600">{profileMessage}</p> : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResumeBump}
                disabled={bumping}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {bumping ? "Bumping..." : "Bump Resume"}
              </button>

              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingProfile ? "Saving..." : "Save profile details"}
              </button>
            </div>

            {bumpState.message ? (
              <p
                className={`text-sm font-medium ${
                  bumpState.status === "success"
                    ? "text-emerald-600"
                    : bumpState.status === "info"
                    ? "text-slate-600"
                    : "text-rose-600"
                }`}
              >
                {bumpState.message}
              </p>
            ) : null}
          </form>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-slate-900">Job alerts</legend>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" name="emailAlerts" checked={form.emailAlerts} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                Email me new jobs that match my trade
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" name="smsAlerts" checked={form.smsAlerts} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                Send SMS alerts for urgent openings
              </label>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-slate-900">Privacy</legend>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" name="showProfile" checked={form.showProfile} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                Allow employers to view my full profile
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" name="shareResume" checked={form.shareResume} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                Share my resume with saved employers
              </label>
            </fieldset>

            {message ? <p className="text-sm font-medium text-emerald-600">{message}</p> : null}

            <div className="flex justify-end gap-3">
              <button type="submit" className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500">
                Save preferences
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

    const jobseekerProfile = await prisma.jobseekerProfile.findUnique({
      where: { userId: session.user.id },
    });

    const profilePayload = {
      id: jobseekerProfile?.id || null,
      phone: jobseekerProfile?.phone || "",
      city: jobseekerProfile?.city || "",
      state: jobseekerProfile?.state || "",
      zip: jobseekerProfile?.zip || "",
      certifications: jobseekerProfile?.certifications || "",
      certFiles: Array.isArray(jobseekerProfile?.certFiles) ? jobseekerProfile.certFiles : [],
      lastBump: jobseekerProfile?.lastBump ? jobseekerProfile.lastBump.toISOString() : null,
    };

    return {
      props: {
        preferences: {
          emailAlerts: true,
          smsAlerts: false,
          showProfile: true,
          shareResume: true,
        },
        profile: profilePayload,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        preferences: {
          emailAlerts: true,
          smsAlerts: false,
          showProfile: true,
          shareResume: true,
        },
        profile: {
          id: null,
          phone: "",
          city: "",
          state: "",
          zip: "",
          certifications: "",
          certFiles: [],
          lastBump: null,
        },
      },
    };
  }
}
