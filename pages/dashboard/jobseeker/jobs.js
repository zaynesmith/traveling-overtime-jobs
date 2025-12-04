import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import JobSearchFilters, { filterPanelClasses } from "@/components/jobs/JobSearchFilters";
import { useJobSearch } from "@/lib/hooks/useJobSearch";
import authOptions from "@/lib/authOptions";
import { normalizeTrade } from "@/lib/trades";

function JobCard({ job }) {
  const location = [job.city, job.state].filter(Boolean).join(", ") || job.location || job.zip || "";
  const trade = normalizeTrade(job.trade) || "General";

  return (
    <li className="rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{job.title}</h2>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{trade}</p>
          {location ? <p className="text-sm text-slate-600">{location}</p> : null}
        </div>
        {job.hourly_pay || job.per_diem ? (
          <p className="text-sm text-slate-600">
            {job.hourly_pay ? `Pay: ${job.hourly_pay}` : null}
            {job.hourly_pay && job.per_diem ? " • " : ""}
            {job.per_diem ? `Per diem: ${job.per_diem}` : null}
          </p>
        ) : null}
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600"
        >
          View details
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </li>
  );
}

const PAGE_SIZE = 15;

export default function JobseekerJobsPage({ jobs: initialJobs, initialFilters, initialPage }) {
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
  } = useJobSearch({
    initialJobs,
    initialFilters,
    initialPage,
    pageSize: PAGE_SIZE,
  });

  useEffect(() => {
    if (!router.isReady || router.pathname !== "/dashboard/jobseeker/jobs") return;

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
  const radiusMessage =
    hasDistanceData &&
    Number.isFinite(parsedRadius) &&
    parsedRadius > 0 &&
    targetZip
      ? `Results within ${parsedRadius} miles of ${targetZip}`
      : null;

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Job Search</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Explore the latest opportunities</h1>
          <p className="max-w-2xl text-base text-slate-600">
            Discover new assignments tailored to your trade and preferred locations.
          </p>
        </header>

        <JobSearchFilters
          filters={formFilters}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onReset={handleReset}
        />

        <section className="flex flex-col gap-6">
          {loading ? (
            <div className={`${filterPanelClasses} text-center text-slate-600`}>Loading jobs…</div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-semibold text-rose-600 shadow-sm">
                {error}
              </div>
            ) : jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-lg">
              <p className="text-lg font-semibold text-slate-900">No jobs posted yet.</p>
              <p className="mt-2 text-sm text-slate-600">Check back soon for fresh travel assignments.</p>
            </div>
          ) : (
            <>
              {radiusMessage ? (
                <p className="text-sm text-slate-500">{radiusMessage}</p>
              ) : null}
              <ul className="grid gap-6 md:grid-cols-2">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </ul>
              <div className="mt-6 flex items-center justify-between">
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

  const { keyword = "", trade = "", state = "", zip = "", radius = "50" } = context.query || {};
  const pageParam = Number.parseInt(context.query?.page ?? "", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const initialFilters = {
    keyword: keyword.toString(),
    trade: trade.toString(),
    state: state.toString(),
    zip: zip.toString(),
    radius: radius.toString(),
  };

  try {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword.toString());
    if (trade) params.set("trade", trade.toString());
    if (state) params.set("state", state.toString());
    if (zip) params.set("zip", zip.toString());
    if (radius) params.set("radius", radius.toString());
    params.set("page", page.toString());
    params.set("pageSize", PAGE_SIZE.toString());

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      (context.req?.headers?.host ? `http://${context.req.headers.host}` : "");
    const apiUrl = `${baseUrl.replace(/\/$/, "")}/api/jobs/list?${params.toString()}`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error("Failed to load jobs");
    }

    const data = await response.json();
    const formatted = Array.isArray(data)
      ? data.map((job) => ({
          id: job.id,
          title: job.title,
          trade: job.trade,
          city: job.city,
          state: job.state,
          location: job.location,
          zip: job.zip,
          hourly_pay: job.hourly_pay,
          per_diem: job.per_diem,
          distance: job.distance ?? null,
        }))
      : [];

    return {
      props: { jobs: formatted, initialFilters, initialPage: page },
    };
  } catch (error) {
    console.error(error);
    return {
      props: { jobs: [], initialFilters, initialPage: page },
    };
  }
}
