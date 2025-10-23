import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const defaultFilters = {
  keyword: "",
  trade: "",
  zip: "",
  radius: "50",
};

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
    <main className="min-h-screen bg-slate-900 py-12 px-4 sm:px-8 lg:px-12">
      <section className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-wide">Find Traveling Overtime Jobs</h1>
          <p className="mt-2 text-slate-300">
            Browse the latest calls for traveling tradespeople across the country.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-lg bg-slate-800 p-6 shadow-lg border border-slate-700 md:grid-cols-4"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-200">Keyword</label>
            <input
              type="text"
              name="keyword"
              value={formFilters.keyword}
              onChange={handleChange}
              placeholder="Job title, contractor, or keyword"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-200">Trade</label>
            <input
              type="text"
              name="trade"
              value={formFilters.trade}
              onChange={handleChange}
              placeholder="e.g. Electrician"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-200">ZIP</label>
            <input
              type="text"
              name="zip"
              value={formFilters.zip}
              onChange={handleChange}
              placeholder="Near ZIP"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-200">Radius (miles)</label>
            <input
              type="number"
              min="10"
              max="500"
              step="10"
              name="radius"
              value={formFilters.radius}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="flex-1 rounded-md bg-amber-500 py-2 text-center font-semibold text-slate-900 hover:bg-amber-400 transition"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
            >
              Reset
            </button>
          </div>
        </form>

        <section className="mt-10 space-y-4">
          {loading ? (
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-center text-slate-200">
              Loading jobs…
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500 bg-red-900/30 p-6 text-center text-red-200">
              {error}
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-center text-slate-300">
              No jobs found. Try adjusting your filters.
            </div>
          ) : (
            jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block rounded-lg border border-slate-700 bg-slate-800 p-6 shadow hover:border-amber-400 hover:shadow-amber-500/20 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-semibold text-white">{job.title}</h2>
                  {job.payrate ? (
                    <span className="rounded bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-300">
                      {job.payrate}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm uppercase tracking-wide text-amber-400">{job.trade || "General"}</p>
                <p className="mt-1 text-slate-300">
                  {job.location || job.zip ? `${job.location || ""}${job.location && job.zip ? " • " : ""}${job.zip || ""}` : "Location TBD"}
                </p>
                <p className="mt-3 text-sm text-slate-400 line-clamp-2">
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
