import { useCallback, useEffect, useMemo, useState } from "react";

function formatTimestamp(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function StatusPill({ status }) {
  const normalized = String(status || "pending").toLowerCase();

  const tone = {
    pending: "bg-amber-100 text-amber-700",
    accepted: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
    cancelled: "bg-slate-200 text-slate-700",
    expired: "bg-slate-200 text-slate-700",
  }[normalized] || "bg-slate-200 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}>
      {normalized}
    </span>
  );
}

export default function TOTJEmploymentCard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/jobseeker/assignment-requests");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load assignment requests");
      }

      setRequests(Array.isArray(payload?.requests) ? payload.requests : []);
    } catch (err) {
      setError(err.message || "Unable to load assignment requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const hasPending = useMemo(
    () => requests.some((request) => String(request.status || "").toLowerCase() === "pending"),
    [requests],
  );

  async function handleDecision(requestId, decision) {
    setActingId(requestId);
    setError("");

    try {
      const response = await fetch("/api/jobseeker/assignment-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId, decision }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to update assignment request");
      }

      await loadRequests();
    } catch (err) {
      setError(err.message || "Unable to update assignment request");
    } finally {
      setActingId("");
    }
  }

  return (
    <article className="rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-slate-900/5">
      <div className="flex h-full flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">TOTJ Employment</h2>
          <p className="mt-1 text-sm text-slate-600">
            Phase II preview: review employer assignment requests and respond directly from your dashboard.
          </p>
        </div>

        {loading ? <p className="text-sm text-slate-600">Loading assignment requests...</p> : null}

        {!loading && error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

        {!loading && !error && requests.length === 0 ? (
          <p className="text-sm text-slate-600">No assignment requests yet.</p>
        ) : null}

        {!loading && !error && requests.length > 0 ? (
          <ul className="space-y-4">
            {requests.map((request) => {
              const status = String(request.status || "pending").toLowerCase();
              const disableActions = actingId === request.id || status !== "pending";

              return (
                <li key={request.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Employer: {request.employer_company_name || request.employer_id || "Unknown"}
                      </p>
                      <p className="text-xs text-slate-500">Job Order: {request.job_order_id || "—"}</p>
                    </div>
                    <StatusPill status={status} />
                  </div>

                  <dl className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-slate-800">Hourly Pay</dt>
                      <dd>{request.hourly_pay || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-800">Per Diem</dt>
                      <dd>{request.per_diem || "—"}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="font-semibold text-slate-800">Message</dt>
                      <dd className="whitespace-pre-wrap">{request.message || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-800">Sent At</dt>
                      <dd>{formatTimestamp(request.sent_at)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-800">Responded At</dt>
                      <dd>{formatTimestamp(request.responded_at)}</dd>
                    </div>
                  </dl>

                  {status === "pending" ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={disableActions}
                        onClick={() => handleDecision(request.id, "accept")}
                      >
                        {actingId === request.id ? "Working..." : "Accept"}
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={disableActions}
                        onClick={() => handleDecision(request.id, "decline")}
                      >
                        {actingId === request.id ? "Working..." : "Decline"}
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        {!loading && !error ? (
          <p className="text-xs text-slate-500">
            {hasPending
              ? "You have pending requests that require your response."
              : "No pending assignment requests at the moment."}
          </p>
        ) : null}
      </div>
    </article>
  );
}
