import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { normalizeTrade } from "@/lib/trades";

const defaultFilters = {
  keyword: "",
  trade: "",
  zip: "",
  radius: "50",
};

const filterPanelClasses =
  "bg-white border border-gray-200 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-6";

const listingCardClasses =
  "bg-white border border-gray-200 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-transform transform hover:-translate-y-0.5 p-6";

function formatJobLocation(job) {
  if (!job) return "";
  const cityState = [job.city, job.state].filter(Boolean).join(", ");
  const parts = [cityState, job.zip].filter(Boolean);
  if (parts.length) {
    return parts.join(" ");
  }
  return job.location || job.zip || "";
}

function formatCompensation(job) {
  if (!job) return "";
  const values = [];
  if (job.hourlyPay) values.push(job.hourlyPay);
  if (job.perDiem) values.push(`Per diem: ${job.perDiem}`);
  return values.join(" • ");
}

export default function Jobs() {
  const [formFilters, setFormFilters] = useState(defaultFilters);
  const [activeFilters, setActiveFilters] = useState(defaultFilters);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (activeFilters.keyword) params.set("keyword", activeFilters.keyword);
    if (activeFilters.trade) params.set("trade", activeFilters.trade);
    if (activeFilters.zip) {
      params.set("zip", activeFilters.zip);
      if (activeFilters.radius) params.set("radius", activeFilters.radius);
    }
    return params.toString();
  }, [activeFilters]);

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/jobs/list${queryString ? `?${queryString}` : ""}`);
        if (!response.ok) {
          throw new Error("Unable to load jobs");
        }
        const data = await response.json();
        setJobs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Unable to load jobs");
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [queryString]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormFilters((current) => ({ ...current, [name]: value }));
  };

  const handleReset = () => {
    setFormFilters(defaultFilters);
    setActiveFilters(defaultFilters);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedFilters = {
      ...formFilters,
      trade: normalizeTrade(formFilters.trade),
    };
    setActiveFilters(normalizedFilters);
  };

  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Find Traveling Overtime Jobs
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Browse the latest calls for traveling tradespeople across the country.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className={`${filterPanelClasses} grid gap-4 md:grid-cols-4 md:gap-6`}
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700">Keyword</label>
            <input
              type="text"
              name="keyword"
              value={formFilters.keyword}
              onChange={handleChange}
              placeholder="Job title, contractor, or keyword"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Trade</label>
            <input
              type="text"
              name="trade"
              value={formFilters.trade}
              onChange={handleChange}
              placeholder="e.g. Electrician"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">ZIP</label>
            <input
              type="text"
              name="zip"
              value={formFilters.zip}
              onChange={handleChange}
              placeholder="Near ZIP"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Radius (miles)</label>
            <input
              type="number"
              min="10"
              max="500"
              step="10"
              name="radius"
              value={formFilters.radius}
              onChange={handleChange}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div className="md:col-span-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Reset
            </button>
          </div>
        </form>

        <section className="mt-12 flex flex-col items-stretch gap-6">
          {loading ? (
            <div className={`${filterPanelClasses} text-center text-slate-600`}>Loading jobs…</div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-semibold text-rose-600 shadow-sm">
              {error}
            </div>
          ) : jobs.length === 0 ? (
            <div className={`${filterPanelClasses} text-center text-slate-600`}>
              No jobs found. Try adjusting your filters.
            </div>
          ) : (
            jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className={`${listingCardClasses} block`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">{job.title}</h2>
                  {formatCompensation(job) ? (
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">
                      {formatCompensation(job)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-sky-600">
                  {normalizeTrade(job.trade) || "General"}
                </p>
                <p className="mt-2 text-sm text-slate-600">{formatJobLocation(job) || "Location TBD"}</p>
                <p className="mt-3 text-sm text-slate-500 line-clamp-2">
                  {job.description || "No description provided."}
                </p>
              </Link>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
