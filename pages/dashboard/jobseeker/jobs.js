import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import { normalizeTrade } from "@/lib/trades";

const defaultJobFilters = {
  keyword: "",
  trade: "",
  zip: "",
  radius: "50",
};

function formatJobLocation(job) {
  if (!job) return "";
  const cityState = [job.city, job.state].filter(Boolean).join(", ");
  return cityState || job.location || job.zip || "";
}

export default function JobSearchPage() {
  const [filters, setFilters] = useState(defaultJobFilters);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.keyword) params.set("keyword", filters.keyword);
    if (filters.trade) params.set("trade", filters.trade);
    if (filters.zip) {
      params.set("zip", filters.zip);
      if (filters.radius) params.set("radius", filters.radius);
    }
    return params.toString();
  }, [filters]);

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/jobs/list${queryString ? `?${queryString}` : ""}`);
        if (!response.ok) throw new Error("Unable to load jobs");
        const data = await response.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Unable to load jobs");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [queryString]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleApply = async (jobId) => {
    setToast(null);
    try {
      const response = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to apply");
      }
      setToast({ type: "success", text: "Application submitted!" });
    } catch (err) {
      setToast({ type: "error", text: err.message || "Unable to apply" });
    }
  };

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Job Search</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Find your next assignment</h1>
          <p className="text-sm text-slate-600">
            Filter by trade, keywords, and distance to discover the latest travel opportunities.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg space-y-6">
          <form className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="keyword">
                Keyword
              </label>
              <input
                id="keyword"
                name="keyword"
                value={filters.keyword}
                onChange={handleChange}
                placeholder="Job title or contractor"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="trade">
                Trade
              </label>
              <input
                id="trade"
                name="trade"
                value={filters.trade}
                onChange={handleChange}
                placeholder="e.g. Millwright"
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
                value={filters.zip}
                onChange={handleChange}
                placeholder="Near ZIP"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="radius">
                Radius (miles)
              </label>
              <input
                id="radius"
                type="number"
                name="radius"
                min="10"
                max="500"
                step="10"
                value={filters.radius}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </form>

          {toast ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                toast.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {toast.text}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Searching...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">{error}</div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No matching jobs yet. Adjust your filters and try again.
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((job) => (
                <article key={job.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-xl font-semibold text-slate-900">{job.title}</h2>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      {normalizeTrade(job.trade) || "General"}
                    </p>
                    <p className="text-sm text-slate-600">{formatJobLocation(job) || "Location TBD"}</p>
                  </div>

                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hourly Pay</dt>
                      <dd className="mt-1 text-sm text-slate-700">{job.hourlyPay || "Not specified"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Per Diem</dt>
                      <dd className="mt-1 text-sm text-slate-700">{job.perDiem || "Not specified"}</dd>
                    </div>
                  </dl>

                  {job.description ? (
                    <p className="mt-4 text-sm text-slate-500 line-clamp-3">{job.description}</p>
                  ) : null}

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <Link className="text-sm font-semibold text-sky-600 hover:text-sky-500" href={`/jobs/${job.id}`}>
                      See Details
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleApply(job.id)}
                      className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
                    >
                      Apply
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
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

  return { props: {} };
}
