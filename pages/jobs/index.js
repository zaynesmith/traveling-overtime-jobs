import Link from "next/link";
import JobSearchFilters, { filterPanelClasses } from "@/components/jobs/JobSearchFilters";
import { useJobSearch } from "@/lib/hooks/useJobSearch";
import { normalizeTrade } from "@/lib/trades";

const listingCardClasses =
  "w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-md p-6";

function formatCityState(job) {
  if (!job) return "";
  const parts = [job.city, job.state].filter(Boolean);
  return parts.join(", ");
}

export default function Jobs() {
  const {
    formFilters,
    activeFilters,
    handleChange,
    handleReset,
    handleSubmit,
    jobs,
    loading,
    error,
  } = useJobSearch();

  const hasDistanceData = jobs.some((job) => typeof job?.distance === "number");
  const parsedRadius = Number.parseFloat(activeFilters?.radius ?? "");
  const targetZip = activeFilters?.zip ? activeFilters.zip.toString().trim() : "";
  const radiusMessage =
    hasDistanceData &&
    Number.isFinite(parsedRadius) &&
    parsedRadius > 0 &&
    targetZip
      ? `Results within ${parsedRadius} miles of ${targetZip}`
      : null;

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

        <JobSearchFilters
          filters={formFilters}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onReset={handleReset}
        />

        <section className="mt-12 flex flex-col items-center gap-6">
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
            <>
              {radiusMessage ? (
                <p className="text-sm text-slate-500">{radiusMessage}</p>
              ) : null}
              {jobs.map((job) => {
                const cityState = formatCityState(job) || job.location || job.zip || "Location TBD";
                return (
                  <article key={job.id} className={listingCardClasses}>
                  <header className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold text-slate-900">{job.title}</h2>
                    <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
                      {normalizeTrade(job.trade) || "General"}
                    </p>
                    <p className="text-sm text-slate-600">{cityState}</p>
                  </header>

                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hourly Pay</dt>
                      <dd className="mt-1 text-sm text-slate-700">{job.hourly_pay || "Not specified"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Per Diem</dt>
                      <dd className="mt-1 text-sm text-slate-700">{job.per_diem || "Not specified"}</dd>
                    </div>
                  </dl>

                  {job.description ? (
                    <p className="mt-4 text-sm text-slate-500 line-clamp-3">{job.description}</p>
                  ) : null}

                  <div className="mt-6 flex justify-end">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-sm font-semibold text-sky-600 transition hover:text-sky-500"
                    >
                      See Details
                    </Link>
                  </div>
                </article>
              );
              })
            </>
          )}
        </section>
      </section>
    </main>
  );
}
