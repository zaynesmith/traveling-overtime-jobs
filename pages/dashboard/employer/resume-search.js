import { useState } from "react";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import TRADES from "@/lib/trades";

const defaultFilters = {
  trade: "",
  zip: "",
  radius: "50",
  keyword: "",
};

function formatLastActive(value) {
  if (!value) return "No recent activity";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No recent activity";
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Active today";
  return `Active ${days} day${days === 1 ? "" : "s"} ago`;
}

export default function ResumeSearchPage() {
  const [filters, setFilters] = useState(defaultFilters);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.trade) params.set("trade", filters.trade);
      if (filters.zip) params.set("zip", filters.zip);
      if (filters.radius) params.set("radius", filters.radius);
      if (filters.keyword) params.set("keyword", filters.keyword);

      const response = await fetch(`/api/resumes/search?${params.toString()}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Resume search failed");
      }

      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Resume search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Resume Search</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Find your next traveling pro</h1>
          <p className="text-sm text-slate-600">
            Filter by trade, radius, and keywords to surface jobseekers ready for travel assignments.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700" htmlFor="trade">
                Trade
              </label>
              <select
                id="trade"
                name="trade"
                value={filters.trade}
                onChange={handleChange}
                className="mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              >
                <option value="">Any trade</option>
                {TRADES.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700" htmlFor="zip">
                ZIP
              </label>
              <input
                id="zip"
                name="zip"
                value={filters.zip}
                onChange={handleChange}
                placeholder="Search radius origin"
                className="mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700" htmlFor="radius">
                Distance
              </label>
              <select
                id="radius"
                name="radius"
                value={filters.radius}
                onChange={handleChange}
                className="mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              >
                {[25, 50, 100, 250, 500].map((distance) => (
                  <option key={distance} value={distance}>
                    Within {distance} miles
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700" htmlFor="keyword">
                Keyword
              </label>
              <input
                id="keyword"
                name="keyword"
                value={filters.keyword}
                onChange={handleChange}
                placeholder="Name, city, or trade"
                className="mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-sky-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Searching..." : "Search resumes"}
              </button>
            </div>
          </form>

          {error ? (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}

          <div className="mt-8 space-y-4">
            {results.length === 0 && !loading ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No resumes match your filters yet. Adjust the filters and try again.
              </div>
            ) : (
              results.map((resume) => (
                <article key={resume.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{resume.name || "Unnamed candidate"}</h2>
                      <p className="text-sm text-slate-600">{resume.trade || "Trade not specified"}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {formatLastActive(resume.lastActive)}
                    </span>
                  </div>
                  {resume.city || resume.state ? (
                    <p className="mt-2 text-sm text-slate-600">{[resume.city, resume.state].filter(Boolean).join(", ")}</p>
                  ) : null}
                  {resume.resumeUrl ? (
                    <a
                      href={resume.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-500"
                    >
                      View resume
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
                  ) : null}
                </article>
              ))
            )}
          </div>
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

  return { props: {} };
}
