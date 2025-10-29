import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import StateSelect from "@/components/forms/StateSelect";
import { TRADES } from "@/lib/trades";

const blankJob = {
  title: "",
  trade: "",
  description: "",
  city: "",
  state: "",
  zip: "",
  hourly_pay: "",
  per_diem: "",
  additional_requirements: "",
};

function Field({ label, htmlFor, children }) {
  return (
    <label className="block text-left text-sm" htmlFor={htmlFor}>
      <span className="font-semibold text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export default function EmployerEditJobPage({ jobId }) {
  const router = useRouter();
  const [form, setForm] = useState(blankJob);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadJob() {
      if (!jobId) {
        setFetching(false);
        setStatus({ type: "error", message: "We couldn\'t find that job." });
        return;
      }
      setFetching(true);
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || "Unable to load job details");
        }
        const data = await response.json();
        if (!ignore && data) {
          setForm({
            title: data.title || "",
            trade: data.trade || "",
            description: data.description || "",
            city: data.city || "",
            state: data.state || "",
            zip: data.zip || "",
            hourly_pay: data.hourly_pay || "",
            per_diem: data.per_diem || "",
            additional_requirements: data.additional_requirements || "",
          });
          setStatus(null);
        }
      } catch (error) {
        if (!ignore) {
          setStatus({
            type: "error",
            message: error.message || "We couldn\'t load that job. Try again.",
          });
        }
      } finally {
        if (!ignore) {
          setFetching(false);
        }
      }
    }

    loadJob();
    return () => {
      ignore = true;
    };
  }, [jobId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!jobId) return;
    setLoading(true);
    setStatus(null);

    try {
      const payload = {
        title: form.title.trim(),
        trade: form.trade,
        description: form.description,
        city: form.city,
        state: form.state,
        zip: form.zip,
        hourly_pay: form.hourly_pay,
        per_diem: form.per_diem,
        additional_requirements: form.additional_requirements,
      };

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Unable to save changes");
      }

      router.push({
        pathname: "/dashboard/employer/posted-jobs",
        query: { success: "updated" },
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Unable to save changes",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <div className="mx-auto mt-10 mb-16 max-w-3xl px-4 sm:px-6 lg:px-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-10 rounded-3xl border border-gray-100 bg-white p-10 shadow-2xl"
        >
          <header className="text-center">
            <h1 className="text-4xl font-bold text-slate-900">Edit Job Details</h1>
            <p className="mt-3 text-sm text-slate-600">
              Update the listing information below, then save your changes.
            </p>
          </header>

          {fetching ? (
            <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
              Loading job details…
            </p>
          ) : null}

          {status?.type === "error" ? (
            <p className="rounded-xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700">
              {status.message}
            </p>
          ) : null}

          <section className="space-y-6">
            <Field label="Job Title" htmlFor="title">
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                disabled={fetching || loading}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </Field>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Trade" htmlFor="trade">
                <select
                  id="trade"
                  name="trade"
                  value={form.trade}
                  onChange={handleChange}
                  disabled={fetching || loading}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Select trade</option>
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
                  disabled={fetching || loading}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Per Diem" htmlFor="per_diem">
                <input
                  id="per_diem"
                  name="per_diem"
                  value={form.per_diem}
                  onChange={handleChange}
                  disabled={fetching || loading}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </Field>

              <Field label="ZIP" htmlFor="zip">
                <input
                  id="zip"
                  name="zip"
                  value={form.zip}
                  onChange={handleChange}
                  disabled={fetching || loading}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="City" htmlFor="city">
                <input
                  id="city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  disabled={fetching || loading}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </Field>

              <Field label="State" htmlFor="state">
                <StateSelect
                  id="state"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  includePlaceholder
                  disabled={fetching || loading}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </Field>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-left">
              <h2 className="text-xl font-semibold text-slate-900">Description</h2>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={6}
                disabled={fetching || loading}
                className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-left">
              <h2 className="text-xl font-semibold text-slate-900">Additional Requirements</h2>
              <textarea
                id="additional_requirements"
                name="additional_requirements"
                value={form.additional_requirements}
                onChange={handleChange}
                rows={4}
                disabled={fetching || loading}
                className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </section>

          <footer className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/employer/posted-jobs")}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || fetching}
              className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </footer>
        </form>
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
    const destination =
      session.user?.role === "jobseeker" ? "/dashboard/jobseeker" : "/";

    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  return {
    props: { jobId: context.params?.id || null },
  };
}
