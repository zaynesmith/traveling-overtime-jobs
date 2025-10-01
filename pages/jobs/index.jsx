import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const DEMO_JOBS = [
  {
    id: "demo-001",
    title: "Journeyman Electrician",
    company: "ACME Industrial",
    location: "Houston, TX",
    trade: "Electrical",
    payRate: "$38/hr",
    perDiem: "$100/day",
    postedAt: "2025-09-30",
    description:
      "Industrial electrical work at refinery. 6x10s, PPE required. Travel + per diem.",
  },
  {
    id: "demo-002",
    title: "Electrical Foreman",
    company: "Gulf Process",
    location: "Corpus Christi, TX",
    trade: "Electrical",
    payRate: "$45/hr",
    perDiem: "$120/day",
    postedAt: "2025-10-02",
    description: "Oversee crews at petrochemical site. Long-term project.",
  },
  {
    id: "demo-003",
    title: "Millwright",
    company: "SteelCo",
    location: "Lake Charles, LA",
    trade: "Millwright",
    payRate: "$34/hr",
    perDiem: "$90/day",
    postedAt: "2025-09-25",
    description: "Install/align equipment. Shutdown schedule. Tools required.",
  },
];

function parsePayRate(value) {
  if (!value) return null;
  const match = value.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return null;
  const numeric = Number(match[1]);
  return Number.isFinite(numeric) ? numeric : null;
}

export default function JobsIndex() {
  const router = useRouter();
  const [jobs, setJobs] = useState(DEMO_JOBS);
  const [formValues, setFormValues] = useState({
    q: "",
    location: "",
    trade: "",
    payMin: "",
  });

  useEffect(() => {
    const combined = [...DEMO_JOBS];

    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("myEmployerJobs");
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.forEach((job) => {
            combined.push({ ...job, postedHere: true });
          });
        }
      } catch {
        // ignore parsing errors for demo data
      }
    }

    combined.sort((a, b) => {
      const ad = new Date(a.postedAt || 0).getTime();
      const bd = new Date(b.postedAt || 0).getTime();
      return bd - ad;
    });

    setJobs(combined);
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    const next = {
      q: typeof router.query.q === "string" ? router.query.q : "",
      location:
        typeof router.query.location === "string" ? router.query.location : "",
      trade: typeof router.query.trade === "string" ? router.query.trade : "",
      payMin: typeof router.query.payMin === "string" ? router.query.payMin : "",
    };

    setFormValues(next);
  }, [
    router.isReady,
    router.query.q,
    router.query.location,
    router.query.trade,
    router.query.payMin,
  ]);

  const activeFilters = useMemo(
    () => ({
      q:
        typeof router.query.q === "string"
          ? router.query.q.trim().toLowerCase()
          : "",
      location:
        typeof router.query.location === "string"
          ? router.query.location.trim().toLowerCase()
          : "",
      trade:
        typeof router.query.trade === "string"
          ? router.query.trade.trim().toLowerCase()
          : "",
      payMin:
        typeof router.query.payMin === "string" && router.query.payMin.trim() !== ""
          ? Number(router.query.payMin)
          : NaN,
    }),
    [router.query.q, router.query.location, router.query.trade, router.query.payMin]
  );

  const results = useMemo(() => {
    return jobs.filter((job) => {
      if (activeFilters.q) {
        const haystack = [job.title, job.company, job.trade, job.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(activeFilters.q)) {
          return false;
        }
      }

      if (activeFilters.location) {
        const location = job.location?.toLowerCase() || "";
        if (!location.includes(activeFilters.location)) {
          return false;
        }
      }

      if (activeFilters.trade) {
        const trade = job.trade?.toLowerCase() || "";
        if (!trade.includes(activeFilters.trade)) {
          return false;
        }
      }

      if (!Number.isNaN(activeFilters.payMin) && activeFilters.payMin > 0) {
        const rate = parsePayRate(job.payRate);
        if (rate === null || rate < activeFilters.payMin) {
          return false;
        }
      }

      return true;
    });
  }, [activeFilters, jobs]);

  function handleSubmit(event) {
    event.preventDefault();
    router.push(
      {
        pathname: "/jobs",
        query: {
          ...(formValues.q ? { q: formValues.q } : {}),
          ...(formValues.location ? { location: formValues.location } : {}),
          ...(formValues.trade ? { trade: formValues.trade } : {}),
          ...(formValues.payMin ? { payMin: formValues.payMin } : {}),
        },
      },
      undefined,
      { shallow: true }
    );
  }

  return (
    <main className="container">
      <header className="max960" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Travel jobs directory</h1>
        <p style={{ margin: 0, color: "#4b5563" }}>
          Browse field and skilled trade openings. Filters sync with the URL so you can share or bookmark results.
        </p>
      </header>

      <section className="card max960" style={{ display: "grid", gap: 16, marginTop: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontWeight: 600, fontSize: 14 }}>Keyword</label>
            <input
              className="input"
              placeholder="Title, company, or keyword"
              value={formValues.q}
              onChange={(event) => setFormValues((prev) => ({ ...prev, q: event.target.value }))}
            />
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ fontWeight: 600, fontSize: 14 }}>Location</label>
              <input
                className="input"
                placeholder="City, State"
                value={formValues.location}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, location: event.target.value }))
                }
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ fontWeight: 600, fontSize: 14 }}>Trade</label>
              <input
                className="input"
                placeholder="Electrical, Millwright…"
                value={formValues.trade}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, trade: event.target.value }))
                }
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ fontWeight: 600, fontSize: 14 }}>Minimum pay ($/hr)</label>
              <input
                className="input"
                type="number"
                min="0"
                value={formValues.payMin}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, payMin: event.target.value }))
                }
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn" type="submit">
              Update results
            </button>
            <button
              type="button"
              className="pill-light"
              onClick={() => {
                setFormValues({ q: "", location: "", trade: "", payMin: "" });
                router.push({ pathname: "/jobs" }, undefined, { shallow: true });
              }}
            >
              Reset filters
            </button>
          </div>
        </form>
      </section>

      <section className="max960" style={{ display: "grid", gap: 16, marginTop: 32 }}>
        <h2 style={{ margin: 0 }}>
          {results.length} job{results.length === 1 ? "" : "s"} found
        </h2>

        {results.length === 0 ? (
          <div className="card" style={{ padding: 24, color: "#64748b" }}>
            No jobs match those filters yet. Try widening your search.
          </div>
        ) : (
          results.map((job) => (
            <article
              key={job.id}
              className="card"
              style={{ display: "grid", gap: 12, padding: 20 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0 }}>{job.title}</h3>
                  <p style={{ margin: "4px 0", color: "#475569" }}>
                    {job.company} • {job.location}
                    {job.trade ? ` • ${job.trade}` : ""}
                  </p>
                  {(job.payRate || job.perDiem) && (
                    <p style={{ margin: 0, color: "#334155" }}>
                      {job.payRate && (
                        <span>
                          <strong>Pay:</strong> {job.payRate}
                        </span>
                      )}
                      {job.payRate && job.perDiem ? " • " : ""}
                      {job.perDiem && (
                        <span>
                          <strong>Per diem:</strong> {job.perDiem}
                        </span>
                      )}
                    </p>
                  )}
                  {job.description && (
                    <p style={{ margin: "8px 0 0", color: "#475569" }}>{job.description}</p>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                  {job.postedHere ? (
                    <span
                      style={{
                        background: "#ecfdf5",
                        color: "#047857",
                        borderRadius: 9999,
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "6px 12px",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Posted here
                    </span>
                  ) : null}
                  {job.postedAt ? (
                    <small style={{ color: "#94a3b8" }}>Posted {job.postedAt}</small>
                  ) : null}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href={`/jobs/${job.id}`} className="btn" style={{ padding: "8px 16px", fontSize: 14 }}>
                  View details
                </Link>
                <Link href="/sign-in?intent=jobseeker" className="pill-light" style={{ fontSize: 14 }}>
                  Sign in to apply
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
