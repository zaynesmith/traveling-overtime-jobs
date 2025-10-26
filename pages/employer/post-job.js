import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
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
    <label className="block text-sm" htmlFor={htmlFor}>
      <span className="font-semibold text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export default function PostJobPage({ jobId }) {
  const router = useRouter();
  const [form, setForm] = useState(blankJob);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadJob() {
      if (!jobId) return;
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) throw new Error("Unable to load job");
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
  }, [jobId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

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

      const endpoint = jobId ? `/api/jobs/${jobId}` : "/api/jobs/create";
      const method = jobId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to save job");

      setMessage({ type: "success", text: jobId ? "Job updated." : "Job posted." });
      const redirectId = jobId || data.id;
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

              <Field label="Trade" htmlFor="trade">
                <select
                  id="trade"
                  name="trade"
                  value={form.trade}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
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
                <input
                  id="state"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
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

  return {
    props: { jobId: context.query?.id || null },
  };
}
