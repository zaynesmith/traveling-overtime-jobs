import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeTrade } from "@/lib/trades";

export const defaultJobFilters = {
  keyword: "",
  trade: "",
  zip: "",
  radius: "50",
};

export function useJobSearch({ initialFilters = defaultJobFilters, initialJobs = [] } = {}) {
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
  }, [getMergedFilters]);

  const applyFilters = useCallback(() => {
    const normalizedFilters = {
      ...formFilters,
      trade: normalizeTrade(formFilters.trade),
    };
    setActiveFilters(normalizedFilters);
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
    handleChange,
    handleReset,
    handleSubmit,
    jobs,
    loading,
    error,
    applyFilters,
    setFormFilters,
    setActiveFilters,
    setJobs,
  };
}
