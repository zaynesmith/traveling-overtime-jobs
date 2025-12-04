import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import CandidateCard from "@/components/employer/CandidateCard";
import StateSelect from "@/components/forms/StateSelect";
import { getStateNameFromCode } from "@/lib/constants/states";
import { TRADES } from "@/lib/trades";
import UpgradeGate from "@/components/employer/UpgradeGate";
import { getEmployerSubscriptionStatus } from "@/lib/employer/subscription";
import prisma from "@/lib/prisma";

export default function ResumeSearchPage({ employerId, initialSavedIds, isSubscribed }) {
  const router = useRouter();
  const PAGE_SIZE = 15;
  const [filters, setFilters] = useState({ trade: "", state: "", zip: "", radius: "50", keyword: "" });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedIds, setSavedIds] = useState(() => new Set(initialSavedIds || []));
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [saveError, setSaveError] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [page, setPage] = useState(1);

  const employerIdentifier = employerId || null;

  useEffect(() => {
    if (!router.isReady || !isSubscribed) return;

    const parsedPage = Number.parseInt(router.query?.page ?? "", 10);
    const nextPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    setPage(nextPage);
    setFilters((current) => ({
      ...current,
      trade: router.query?.trade?.toString() ?? current.trade,
      state: router.query?.state?.toString() ?? current.state,
      zip: router.query?.zip?.toString() ?? current.zip,
      radius: router.query?.radius?.toString() ?? current.radius,
      keyword: router.query?.keyword?.toString() ?? current.keyword,
    }));
  }, [isSubscribed, router.isReady]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const updateRoute = (filtersForQuery, targetPage) => {
    const params = new URLSearchParams();
    if (filtersForQuery.trade) params.set("trade", filtersForQuery.trade);
    if (filtersForQuery.state) params.set("state", filtersForQuery.state);
    if (filtersForQuery.zip) params.set("zip", filtersForQuery.zip);
    if (filtersForQuery.radius) params.set("radius", filtersForQuery.radius);
    if (filtersForQuery.keyword) params.set("keyword", filtersForQuery.keyword);
    params.set("page", targetPage.toString());
    params.set("pageSize", PAGE_SIZE.toString());

    const query = Object.fromEntries(params.entries());
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  };

  const performSearch = async (targetPage, filtersToUse) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setPage(targetPage);
    setAppliedFilters(filtersToUse);

    try {
      const params = new URLSearchParams();
      if (filtersToUse.trade) params.set("trade", filtersToUse.trade);
      if (filtersToUse.state) params.set("state", filtersToUse.state);
      if (filtersToUse.zip) params.set("zip", filtersToUse.zip);
      if (filtersToUse.radius) params.set("radius", filtersToUse.radius);
      if (filtersToUse.keyword) params.set("keyword", filtersToUse.keyword);
      params.set("page", targetPage.toString());
      params.set("pageSize", PAGE_SIZE.toString());

      const response = await fetch(`/api/resumes/search?${params.toString()}`);
      if (!response.ok) throw new Error("Unable to search resumes");
      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
      updateRoute(filtersToUse, targetPage);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to search resumes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const currentFilters = {
      trade: filters.trade,
      state: filters.state,
      zip: filters.zip,
      radius: filters.radius,
      keyword: filters.keyword,
    };

    await performSearch(1, currentFilters);
  };

  const handlePreviousPage = () => {
    if (!appliedFilters || page <= 1 || loading) return;
    performSearch(page - 1, appliedFilters);
  };

  const handleNextPage = () => {
    if (!appliedFilters || loading) return;
    performSearch(page + 1, appliedFilters);
  };

  const toggleSave = async (jobseekerId) => {
    if (!jobseekerId || pendingIds.has(jobseekerId)) return;

    const currentlySaved = savedIds.has(jobseekerId);
    const nextSaved = new Set(savedIds);
    if (currentlySaved) {
      nextSaved.delete(jobseekerId);
    } else {
      nextSaved.add(jobseekerId);
    }

    setSavedIds(nextSaved);
    setPendingIds((prev) => {
      const updated = new Set(prev);
      updated.add(jobseekerId);
      return updated;
    });
    setSaveError(null);

    try {
      const response = await fetch("/api/employer/save-candidate", {
        method: currentlySaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employer_id: employerIdentifier, jobseeker_id: jobseekerId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Unable to update saved candidate");
      }
    } catch (err) {
      setSavedIds((prev) => {
        const revert = new Set(prev);
        if (currentlySaved) {
          revert.add(jobseekerId);
        } else {
          revert.delete(jobseekerId);
        }
        return revert;
      });
      setSaveError(err.message || "Unable to update saved candidate");
    } finally {
      setPendingIds((prev) => {
        const updated = new Set(prev);
        updated.delete(jobseekerId);
        return updated;
      });
    }
  };

  const resultsWithDetails = useMemo(
    () =>
      results.map((candidate) => {
        const fullName = [candidate.firstName, candidate.lastName].filter(Boolean).join(" ") || "Unnamed candidate";
        const locationParts = [candidate.city, candidate.state].filter(Boolean);

        return {
          id: candidate.id,
          profileId: candidate.id,
          fullName,
          trade: candidate.trade,
          location: locationParts.length ? locationParts.join(", ") : null,
          phone: candidate.phone,
          lastActive: candidate.lastActive,
          resumeUpdated: candidate.updatedAt,
          resumeUrl: candidate.resumeUrl,
          distance: typeof candidate.distance === "number" ? candidate.distance : null,
        };
      }),
    [results]
  );

  const hasDistanceData = resultsWithDetails.some((candidate) => typeof candidate.distance === "number");
  const parsedRadius = Number.parseFloat(appliedFilters?.radius ?? "");
  const targetZip = appliedFilters?.zip ? appliedFilters.zip.toString().trim() : "";
  const selectedState = appliedFilters?.state ? appliedFilters.state.toString().trim() : "";
  const stateLabel = selectedState ? getStateNameFromCode(selectedState) || selectedState : "";
  const radiusMessage =
    hasDistanceData &&
    Number.isFinite(parsedRadius) &&
    parsedRadius > 0 &&
    targetZip
      ? `Results within ${parsedRadius} miles of ${targetZip}`
      : null;
  const stateMessage =
    !targetZip && stateLabel ? `Showing candidates in ${stateLabel}` : null;

  const canGoPrevious = Boolean(appliedFilters) && page > 1 && !loading;
  const canGoNext = Boolean(appliedFilters) && results.length === PAGE_SIZE && !loading;

  if (!isSubscribed) {
    return (
      <UpgradeGate
        eyebrow="Upgrade to unlock resume search"
        title="Unlock resume search"
        description="Resume search is available to subscribed employers. Upgrade to our Early Access plan to unlock unlimited resume searches, job postings, and full recruiting access."
        benefits={[
          "Unlimited resume searches",
          "Unlimited job postings",
          "Full recruiting access across the platform",
        ]}
        ctaLabel="Upgrade to unlock"
      />
    );
  }

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
              State
              <StateSelect
                name="state"
                value={filters.state}
                onChange={handleChange}
                includePlaceholder
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
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

        {saveError ? <p className="text-sm font-medium text-rose-600">{saveError}</p> : null}

        {resultsWithDetails.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {resultsWithDetails.length} candidate{resultsWithDetails.length === 1 ? "" : "s"} found
            </h2>
            {radiusMessage ? (
              <p className="text-sm text-slate-500">{radiusMessage}</p>
            ) : stateMessage ? (
              <p className="text-sm text-slate-500">{stateMessage}</p>
            ) : null}
            <ul className="space-y-4">
              {resultsWithDetails.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  isSaved={savedIds.has(candidate.id)}
                  isPending={pendingIds.has(candidate.id)}
                  onToggleSave={() => toggleSave(candidate.id)}
                  buttonLabels={{ saved: "Saved", unsaved: "Save Candidate", saving: "Saving...", removing: "Removing..." }}
                />
              ))}
            </ul>
            <div className="flex items-center justify-between">
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

  try {
    const [{ isSubscribed }, employerProfile] = await Promise.all([
      getEmployerSubscriptionStatus(session.user.id),
      prisma.employerProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      }),
    ]);

    if (!employerProfile) {
      return {
        redirect: {
          destination: "/dashboard/employer", // fallback dashboard
          permanent: false,
        },
      };
    }

    const saved = await prisma.saved_candidates.findMany({
      where: { employer_id: employerProfile.id },
      select: { jobseeker_id: true },
    });

    const initialSavedIds = saved
      .map((entry) => entry.jobseeker_id)
      .filter((value) => typeof value === "string");

    return {
      props: {
        employerId: employerProfile.id,
        initialSavedIds,
        isSubscribed,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        employerId: null,
        initialSavedIds: [],
        isSubscribed: false,
      },
    };
  }
}
