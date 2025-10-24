import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const defaultFilters = {
  keyword: "",
  trade: "",
  zip: "",
  radius: "50",
};

const cardContainerClasses =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-300/70 transition";

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
    setActiveFilters(formFilters);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-white py-12 px-4 sm:px-8 lg:px-12">
      <section className="mx-auto max-w-5xl">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Find Traveling Overtime Jobs</h1>
          <p className="mt-2 text-base text-slate-600">
            Browse the latest calls for traveling tradespeople across the country.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className={`${cardContainerClasses} grid gap-4 md:grid-cols-4`}
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700">Keyword</label>
            <input
              type="text"
              name="keyword"
              value={formFilters.keyword}
              onChange={handleChange}
              placeholder="Job title, contractor, or keyword"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
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
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
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
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
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
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
          </div>
          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-400"
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

        <section className="mt-12 space-y-5">
          {loading ? (
            <div className={`${cardContainerClasses} text-center text-slate-500`}>Loading jobs…</div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-semibold text-rose-600 shadow-sm">
              {error}
            </div>
          ) : jobs.length === 0 ? (
            <div className={`${cardContainerClasses} text-center text-slate-600`}>
              No jobs found. Try adjusting your filters.
            </div>
          ) : (
            jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className={`${cardContainerClasses} block hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-amber-200/60`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">{job.title}</h2>
                  {job.payrate ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                      {job.payrate}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
                  {job.trade || "General"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {job.location || job.zip
                    ? `${job.location || ""}${job.location && job.zip ? " • " : ""}${job.zip || ""}`
                    : "Location TBD"}
                </p>
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
