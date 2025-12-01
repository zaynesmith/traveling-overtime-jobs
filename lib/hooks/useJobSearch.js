import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeStateCode } from "@/lib/constants/states";
import { normalizeTrade } from "@/lib/trades";

export const defaultJobFilters = {
  keyword: "",
  trade: "",
  zip: "",
  radius: "50",
  state: "",
};

export function useJobSearch({
  initialFilters = defaultJobFilters,
  initialJobs = [],
  initialPage = 1,
  pageSize = 15,
} = {}) {
  const getMergedFilters = useCallback(
    () => ({
      ...defaultJobFilters,
      ...(initialFilters || {}),
    }),
    [initialFilters],
  );

  const [formFilters, setFormFilters] = useState(getMergedFilters);
  const [activeFilters, setActiveFilters] = useState(getMergedFilters);
  const [jobs, setJobs] = useState(initialJobs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(() => (Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1));

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (activeFilters.keyword) params.set("keyword", activeFilters.keyword);
    if (activeFilters.trade) params.set("trade", activeFilters.trade);
    if (activeFilters.state) params.set("state", activeFilters.state);
    if (activeFilters.zip) {
      params.set("zip", activeFilters.zip);
      if (activeFilters.radius) params.set("radius", activeFilters.radius);
    }
    params.set("page", page.toString());
    params.set("pageSize", pageSize.toString());
    return params.toString();
  }, [activeFilters, page, pageSize]);

  useEffect(() => {
    let ignore = false;

    async function loadJobs() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/jobs/list${queryString ? `?${queryString}` : ""}`);
        if (!response.ok) {
          throw new Error("Unable to load jobs");
        }
        const data = await response.json();
        if (!ignore) {
          setJobs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setError(err.message || "Unable to load jobs");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      ignore = true;
    };
  }, [queryString]);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormFilters((current) => ({ ...current, [name]: value }));
  }, []);

  const handleReset = useCallback(() => {
    const resetFilters = getMergedFilters();
    setFormFilters(resetFilters);
    setActiveFilters(resetFilters);
    setPage(1);
  }, [getMergedFilters]);

  const applyFilters = useCallback(() => {
    const normalizedFilters = {
      ...formFilters,
      trade: normalizeTrade(formFilters.trade),
      state: normalizeStateCode(formFilters.state) || "",
    };
    setActiveFilters(normalizedFilters);
    setPage(1);
  }, [formFilters]);

  const handleSubmit = useCallback(
    (event) => {
      event?.preventDefault();
      applyFilters();
    },
    [applyFilters],
  );

  return {
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
    applyFilters,
    setFormFilters,
    setActiveFilters,
    setJobs,
    setPage,
  };
}
