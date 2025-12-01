import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/router";
import JobSearchFilters, { filterPanelClasses } from "@/components/jobs/JobSearchFilters";
import { getStateNameFromCode } from "@/lib/constants/states";
import { defaultJobFilters, useJobSearch } from "@/lib/hooks/useJobSearch";
import { normalizeTrade } from "@/lib/trades";

const listingCardClasses =
  "w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-md p-6";
const PAGE_SIZE = 15;

function formatCityState(job) {
  if (!job) return "";
  const parts = [job.city, job.state].filter(Boolean);
  return parts.join(", ");
}

export default function Jobs() {
  const router = useRouter();
  const {
    formFilters,
    activeFilters,
    handleChange,
    handleReset,
    handleSubmit,
    jobs,
    loading,
    error,
    page,
    pageSize,
    setPage,
    setFormFilters,
    setActiveFilters,
  } = useJobSearch({ pageSize: PAGE_SIZE });

  useEffect(() => {
    if (!router.isReady || router.pathname !== "/jobs") return;

    const parsedPage = Number.parseInt(router.query?.page ?? "", 10);
    const nextPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const queryFilters = {
      keyword: router.query?.keyword?.toString() ?? defaultJobFilters.keyword,
      trade: router.query?.trade?.toString() ?? defaultJobFilters.trade,
      state: router.query?.state?.toString() ?? defaultJobFilters.state,
      zip: router.query?.zip?.toString() ?? defaultJobFilters.zip,
      radius: router.query?.radius?.toString() ?? defaultJobFilters.radius,
    };

    setFormFilters(queryFilters);
    setActiveFilters(queryFilters);
    setPage(nextPage);
  }, [router.isReady]);

  useEffect(() => {
    if (!router.isReady || router.pathname !== "/jobs") return;

    const params = new URLSearchParams();
    if (activeFilters.keyword) params.set("keyword", activeFilters.keyword);
    if (activeFilters.trade) params.set("trade", activeFilters.trade);
    if (activeFilters.state) params.set("state", activeFilters.state);
    if (activeFilters.zip) {
      params.set("zip", activeFilters.zip);
      if (activeFilters.radius) params.set("radius", activeFilters.radius);
    }
    if (page > 1) params.set("page", page.toString());

    const query = Object.fromEntries(params.entries());
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [router.isReady, router.pathname, activeFilters, page]);

  const handlePreviousPage = () => setPage((current) => Math.max(1, current - 1));
  const handleNextPage = () => setPage((current) => current + 1);

  const canGoPrevious = page > 1 && !loading;
  const canGoNext = jobs.length === pageSize && !loading;

  const hasDistanceData = jobs.some((job) => typeof job?.distance === "number");
  const parsedRadius = Number.parseFloat(activeFilters?.radius ?? "");
  const targetZip = activeFilters?.zip ? activeFilters.zip.toString().trim() : "";
  const selectedState = activeFilters?.state ? activeFilters.state.toString().trim() : "";
  const stateLabel = selectedState ? getStateNameFromCode(selectedState) || selectedState : "";
  const radiusMessage =
    hasDistanceData &&
    Number.isFinite(parsedRadius) &&
    parsedRadius > 0 &&
    targetZip
      ? `Results within ${parsedRadius} miles of ${targetZip}`
      : null;
  const stateMessage =
    !targetZip && stateLabel ? `Showing jobs in ${stateLabel}` : null;

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
            <div className={`${filterPanelClasses} text-center text-slate-600`}>
              Loading jobs…
            </div>
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
              ) : stateMessage ? (
                <p className="text-sm text-slate-500">{stateMessage}</p>
              ) : null}

              {jobs.map((job) => {
                const cityState =
                  formatCityState(job) || job.location || job.zip || "Location TBD";

                return (
                  <article key={job.id} className={listingCardClasses}>
                    <header className="flex flex-col gap-2">
                      <h2 className="text-2xl font-bold text-slate-900">
                        {job.title}
                      </h2>
                      <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
                        {normalizeTrade(job.trade) || "General"}
                      </p>
                      <p className="text-sm text-slate-600">{cityState}</p>
                    </header>

                    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Hourly Pay
                        </dt>
                        <dd className="mt-1 text-sm text-slate-700">
                          {job.hourly_pay || "Not specified"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Per Diem
                        </dt>
                        <dd className="mt-1 text-sm text-slate-700">
                          {job.per_diem || "Not specified"}
                        </dd>
                      </div>
                    </dl>

                    {job.description ? (
                      <p className="mt-4 text-sm text-slate-500 line-clamp-3">
                        {job.description}
                      </p>
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
              })}
              <div className="flex w-full max-w-2xl justify-between">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={!canGoPrevious}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Previous page
                </button>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={!canGoNext}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next page
                </button>
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
