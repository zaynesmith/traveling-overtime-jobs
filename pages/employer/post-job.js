import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import StateSelect from "@/components/forms/StateSelect";
import { formatZipSuggestionLocation, formatZipSuggestionMessage } from "@/lib/utils/zipMessages";
import { TRADES } from "@/lib/trades";
import UpgradeGate from "@/components/employer/UpgradeGate";
import { getEmployerSubscriptionStatus } from "@/lib/employer/subscription";
import prisma from "@/lib/prisma";

const blankJob = {
  title: "",
  trades: [],
  description: "",
  city: "",
  state: "",
  zip: "",
  hourly_pay: "",
  per_diem: "",
  additional_requirements: "",
  showFirstName: false,
  showEmail: false,
  showPhone: false,
};

function Field({ label, htmlFor, children }) {
  return (
    <label className="block text-sm" htmlFor={htmlFor}>
      <span className="font-semibold text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export default function PostJobPage({ jobId, contactDetails, isSubscribed }) {
  const router = useRouter();
  const [form, setForm] = useState(blankJob);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [zipFeedback, setZipFeedback] = useState(null);

  const safeContactDetails = {
    firstName: contactDetails?.firstName || "",
    email: contactDetails?.email || "",
    phone: contactDetails?.phone || "",
  };

  const contactPreviewItems = [
    {
      key: "firstName",
      label: "First Name",
      value: safeContactDetails.firstName,
      shareToggle: Boolean(form.showFirstName),
    },
    {
      key: "email",
      label: "Email",
      value: safeContactDetails.email,
      shareToggle: Boolean(form.showEmail),
    },
    {
      key: "phone",
      label: "Mobile Phone",
      value: safeContactDetails.phone,
      shareToggle: Boolean(form.showPhone),
    },
  ];

  useEffect(() => {
    let ignore = false;
    async function loadJob() {
      if (!isSubscribed) return;
      if (!jobId) return;
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) throw new Error("Unable to load job");
        const data = await response.json();
        if (!ignore && data) {
          setForm({
            ...blankJob,
            title: data.title || "",
            trades:
              Array.isArray(data.trades) && data.trades.length
                ? data.trades
                : data.trade
                ? [data.trade]
                : [],
            description: data.description || "",
            city: data.city || "",
            state: data.state || "",
            zip: data.zip || "",
            hourly_pay: data.hourly_pay || "",
            per_diem: data.per_diem || "",
            additional_requirements: data.additional_requirements || "",
            showFirstName: Boolean(data.showFirstName),
            showEmail: Boolean(data.showEmail),
            showPhone: Boolean(data.showPhone),
          });
          setZipFeedback(null);
        }
      } catch (error) {
        console.error(error);
        setMessage({ type: "error", text: "We couldn\'t load that job. Try again." });
      }
    }

    loadJob();
    return () => {
      ignore = true;
    };
  }, [isSubscribed, jobId]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (name === "zip" || name === "city" || name === "state") {
      setZipFeedback(null);
    }
    if (name === "trades") {
      const selectedTrades = Array.from(event.target.selectedOptions)
        .map((option) => option.value)
        .filter(Boolean);
      setForm((current) => ({
        ...current,
        trades: selectedTrades,
      }));
      return;
    }
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const applyZipSuggestion = (suggestion) => {
    if (!suggestion?.zip) return;
    setForm((current) => ({ ...current, zip: suggestion.zip }));
    setZipFeedback(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setZipFeedback(null);

    try {
      const payload = {
        title: form.title.trim(),
        trade: form.trades[0] || null,
        trades: form.trades,
        description: form.description,
        city: form.city,
        state: form.state,
        zip: form.zip,
        hourly_pay: form.hourly_pay,
        per_diem: form.per_diem,
        additional_requirements: form.additional_requirements,
        showFirstName: form.showFirstName,
        showEmail: form.showEmail,
        showPhone: form.showPhone,
      };

      const endpoint = jobId ? `/api/jobs/${jobId}` : "/api/jobs/create";
      const method = jobId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (parseError) {
        data = null;
      }

      if (!response.ok) {
        if (data?.error === "Invalid ZIP") {
          const suggestion = data?.suggestion || null;
          const messageText =
            data?.message || formatZipSuggestionMessage(suggestion);
          setZipFeedback({
            type: suggestion ? "suggestion" : "error",
            message: messageText,
            suggestion,
          });
          return;
        }

        const errorMessage = data?.error || "Unable to save job";
        throw new Error(errorMessage);
      }

      const responseData = data || {};

      setMessage({ type: "success", text: jobId ? "Job updated." : "Job posted." });
      const redirectId = jobId || responseData.id;
      setTimeout(() => {
        router.push({
          pathname: "/dashboard/employer/posted-jobs",
          query: redirectId ? { highlight: redirectId } : {},
        });
      }, 600);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Unable to save job" });
    } finally {
      setLoading(false);
    }
  };

  const zipSuggestionLocation = formatZipSuggestionLocation(zipFeedback?.suggestion);

  if (!isSubscribed) {
    return (
      <UpgradeGate
        title="Upgrade to unlock this feature"
        description="Posting jobs is available to subscribed employers. Upgrade to our Early Access plan to unlock unlimited job postings, resume searches, and full recruiting access across the platform."
        benefits={[
          "Unlimited job postings",
          "Unlimited resume searches",
          "Full recruiting access across the platform",
        ]}
        ctaLabel="Upgrade to unlock"
      />
    );
  }

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
            {jobId ? "Edit Job" : "Post a Job"}
          </p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            {jobId ? "Update your listing" : "Share a new assignment"}
          </h1>
          <p className="max-w-2xl text-base text-slate-600">
            Fill out the essentials and we&apos;ll take you straight to your postings to review applicants.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Job Title" htmlFor="title">
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="Trade" htmlFor="trades">
                <select
                  id="trades"
                  name="trades"
                  multiple
                  value={form.trades}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                >
                  {TRADES.map((trade) => (
                    <option key={trade} value={trade}>
                      {trade}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Hourly Pay" htmlFor="hourly_pay">
                <input
                  id="hourly_pay"
                  name="hourly_pay"
                  value={form.hourly_pay}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="Per Diem" htmlFor="per_diem">
                <input
                  id="per_diem"
                  name="per_diem"
                  value={form.per_diem}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="City" htmlFor="city">
                <input
                  id="city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="State" htmlFor="state">
                <StateSelect
                  id="state"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  includePlaceholder
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="ZIP" htmlFor="zip">
                <input
                  id="zip"
                  name="zip"
                  value={form.zip}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </Field>
            </div>

            <Field label="Description" htmlFor="description">
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={6}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </Field>

            <Field label="Additional Requirements" htmlFor="additional_requirements">
              <textarea
                id="additional_requirements"
                name="additional_requirements"
                value={form.additional_requirements}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </Field>

            <div>
              <p className="text-sm font-semibold text-slate-700">
                Share your contact info with jobseekers?
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                  <input
                    type="checkbox"
                    name="showFirstName"
                    checked={form.showFirstName}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>First Name</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                  <input
                    type="checkbox"
                    name="showEmail"
                    checked={form.showEmail}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Email</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                  <input
                    type="checkbox"
                    name="showPhone"
                    checked={form.showPhone}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Mobile Phone</span>
                </label>
              </div>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900">Contact Details</h3>
              <dl className="mt-4 space-y-4 text-sm">
                {contactPreviewItems.map((item) => (
                  <div key={item.key}>
                    <dt className="font-semibold text-slate-700">{item.label}</dt>
                    <dd className="mt-1 text-slate-600">{item.value || "Not provided"}</dd>
                    <p
                      className={`mt-1 text-xs ${
                        item.shareToggle
                          ? item.value
                            ? "text-emerald-600"
                            : "text-amber-600"
                          : "text-slate-400"
                      }`}
                    >
                      {item.shareToggle
                        ? item.value
                          ? "Visible to jobseekers"
                          : "Visible once added to your profile"
                        : "Hidden from jobseekers"}
                    </p>
                  </div>
                ))}
              </dl>
            </section>

            {zipFeedback?.type === "suggestion" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <p>
                  That ZIP was unrecognized. Try using{' '}
                  <button
                    type="button"
                    onClick={() => applyZipSuggestion(zipFeedback.suggestion)}
                    className="font-semibold text-sky-700 underline"
                  >
                    {zipFeedback.suggestion?.zip}
                  </button>{' '}
                  {zipSuggestionLocation ? `from ${zipSuggestionLocation} ` : ""}
                  instead.
                </p>
              </div>
            ) : null}

            {zipFeedback?.type === "error" ? (
              <div className="rounded-xl bg-rose-100 px-4 py-3 text-sm font-medium text-rose-700">
                {zipFeedback.message}
              </div>
            ) : null}

            {message ? (
              <p
                className={
                  message.type === "error"
                    ? "rounded-xl bg-rose-100 px-4 py-3 text-sm font-medium text-rose-700"
                    : "rounded-xl bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-700"
                }
              >
                {message.text}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard/employer")}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving..." : jobId ? "Save changes" : "Post job"}
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
        destination: "/employer/login",
        permanent: false,
      },
    };
  }

  if (session.user?.role !== "employer") {
    const destination = session.user?.role === "jobseeker" ? "/dashboard/jobseeker" : "/";
    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  const { isSubscribed } = await getEmployerSubscriptionStatus(session.user.id);

  const employerProfile = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      firstName: true,
      mobilePhone: true,
      phone: true,
      officePhone: true,
      user: { select: { email: true } },
    },
  });

  const contactDetails = {
    firstName: employerProfile?.firstName || "",
    email: employerProfile?.user?.email || "",
    phone:
      employerProfile?.mobilePhone ||
      employerProfile?.phone ||
      employerProfile?.officePhone ||
      "",
  };

  return {
    props: {
      jobId: context.query?.id || null,
      contactDetails,
      isSubscribed,
    },
  };
}
