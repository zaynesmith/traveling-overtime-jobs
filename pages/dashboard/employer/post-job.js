import { useState } from "react";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import TRADES, { normalizeTrade } from "@/lib/trades";

const defaultJobForm = {
  title: "",
  trade: "",
  description: "",
  city: "",
  state: "",
  zip: "",
  hourlyPay: "",
  perDiem: "",
  additionalRequirements: "",
};

export default function PostJobPage({ prefillTrade }) {
  const router = useRouter();
  const [jobForm, setJobForm] = useState({ ...defaultJobForm, trade: prefillTrade || "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setJobForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobForm),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to create job");
      }

      setMessage({ type: "success", text: "Job posted successfully. Redirecting to your listings..." });
      setTimeout(() => {
        router.push(`/dashboard/employer/posted-jobs?created=${payload.id}`);
      }, 600);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Unable to create job" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Post a Job</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Share a new assignment</h1>
          <p className="text-sm text-slate-600">
            Provide enough detail so traveling professionals understand the scope, schedule, and compensation for your role.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="title">
                  Job Title
                </label>
                <input
                  id="title"
                  name="title"
                  value={jobForm.title}
                  onChange={handleChange}
                  placeholder="Traveling Electrical Foreman"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="trade">
                  Trade
                </label>
                <select
                  id="trade"
                  name="trade"
                  value={jobForm.trade}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  required
                >
                  <option value="">Select a trade</option>
                  {TRADES.map((trade) => (
                    <option key={trade} value={trade}>
                      {trade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="hourlyPay">
                  Hourly Pay
                </label>
                <input
                  id="hourlyPay"
                  name="hourlyPay"
                  value={jobForm.hourlyPay}
                  onChange={handleChange}
                  placeholder="$38/hr"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="perDiem">
                  Per Diem
                </label>
                <input
                  id="perDiem"
                  name="perDiem"
                  value={jobForm.perDiem}
                  onChange={handleChange}
                  placeholder="$110/day"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  value={jobForm.city}
                  onChange={handleChange}
                  placeholder="Denver"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="state">
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  value={jobForm.state}
                  onChange={handleChange}
                  placeholder="CO"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="zip">
                  ZIP
                </label>
                <input
                  id="zip"
                  name="zip"
                  value={jobForm.zip}
                  onChange={handleChange}
                  placeholder="80202"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={jobForm.description}
                onChange={handleChange}
                rows={6}
                placeholder="Outline scope, schedule expectations, travel requirements, and overtime opportunities."
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="additionalRequirements">
                Additional Requirements
              </label>
              <textarea
                id="additionalRequirements"
                name="additionalRequirements"
                value={jobForm.additionalRequirements}
                onChange={handleChange}
                rows={4}
                placeholder="Certifications, tools, schedule details, etc."
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
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

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard/employer")}
                className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-sky-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Posting..." : "Post Job"}
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

  const prefillTrade = context.query?.trade ? normalizeTrade(context.query.trade) : "";

  return {
    props: {
      prefillTrade: prefillTrade || "",
    },
  };
}
