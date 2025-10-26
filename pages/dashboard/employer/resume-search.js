import { useState } from "react";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import { TRADES } from "@/lib/trades";

export default function ResumeSearchPage() {
  const [filters, setFilters] = useState({ trade: "", zip: "", radius: "50", keyword: "" });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const params = new URLSearchParams();
      if (filters.trade) params.set("trade", filters.trade);
      if (filters.zip) params.set("zip", filters.zip);
      if (filters.radius) params.set("radius", filters.radius);
      if (filters.keyword) params.set("keyword", filters.keyword);

      const response = await fetch(`/api/resumes/search?${params.toString()}`);
      if (!response.ok) throw new Error("Unable to search resumes");
      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to search resumes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Resume Search</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Find traveling pros by trade</h1>
          <p className="max-w-2xl text-base text-slate-600">
            Filter by trade, location, and keywords to surface candidates ready for your assignments.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <form className="grid gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="text-sm font-semibold text-slate-700">
              Trade
              <select
                name="trade"
                value={filters.trade}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              >
                <option value="">Any trade</option>
                {TRADES.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              ZIP code
              <input
                name="zip"
                value={filters.zip}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Radius (miles)
              <input
                name="radius"
                value={filters.radius}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Keyword
              <input
                name="keyword"
                value={filters.keyword}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <div className="md:col-span-2 flex items-center justify-end gap-3">
              {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>
        </section>

        {results.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">{results.length} candidate{results.length === 1 ? "" : "s"} found</h2>
            <ul className="space-y-4">
              {results.map((candidate) => {
                const fullName = [candidate.firstName, candidate.lastName].filter(Boolean).join(" ") || "Unnamed candidate";
                const trade = candidate.trade || "Not provided";
                const locationParts = [candidate.city, candidate.state].filter(Boolean);
                const location = locationParts.length ? locationParts.join(", ") : "Not provided";
                const phone = candidate.phone || "Not provided";

                const lastActive = formatDate(candidate.lastActive) || "No recent activity";
                const resumeUpdatedRaw = formatDate(candidate.updatedAt);
                const resumeUpdated = resumeUpdatedRaw ? `Updated ${resumeUpdatedRaw}` : "Updated date: Not provided";

                return (
                  <li key={candidate.id} className="rounded-2xl bg-white p-5 shadow-lg">
                    <p className="text-base font-semibold text-slate-900">{fullName}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      <span className="font-semibold text-slate-700">Trade:</span> {trade}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      <span className="font-semibold text-slate-700">Location:</span> {location}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      <span className="font-semibold text-slate-700">Contact:</span> {phone}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      <span className="font-semibold text-slate-700">Last active:</span> {lastActive}
                    </p>
                    {candidate.resumeUrl ? (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <a
                          href={candidate.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600"
                        >
                          View resume
                          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </a>
                        <span className="text-xs text-slate-500">{resumeUpdated}</span>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
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
