import { useEffect, useMemo, useState } from "react";

function formatTimestamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function formatDuration(totalMinutes) {
  const minutes = Number(totalMinutes || 0);
  if (!minutes) return "0m";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hrs) return `${mins}m`;
  if (!mins) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

function actionLabel(action) {
  switch (action) {
    case "clock_in":
      return "Clock In";
    case "clock_out":
      return "Clock Out";
    case "break_start":
      return "Break Start";
    case "break_end":
      return "Break End";
    case "lunch_start":
      return "Lunch Start";
    case "lunch_end":
      return "Lunch End";
    default:
      return action;
  }
}

function statusTone(status) {
  if (status?.locked) return "bg-amber-50 text-amber-800 ring-amber-200";
  if (status?.onBreak || status?.onLunch) return "bg-indigo-50 text-indigo-800 ring-indigo-200";
  if (status?.isClockedIn) return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

async function getCurrentLocation() {
  if (typeof window === "undefined" || !window.navigator?.geolocation) return null;

  return new Promise((resolve) => {
    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords?.latitude ?? null,
          longitude: position.coords?.longitude ?? null,
        });
      },
      () => resolve(null),
      {
        maximumAge: 60_000,
        timeout: 5000,
      },
    );
  });
}

export default function TimekeepingHomeCard() {
  const [loading, setLoading] = useState(true);
  const [submittingAction, setSubmittingAction] = useState("");
  const [data, setData] = useState({ assignments: [], selectedAssignmentId: null, status: null });
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [clockCode, setClockCode] = useState("");

  const selectedAssignment = useMemo(
    () => data.assignments.find((assignment) => assignment.id === data.selectedAssignmentId) || null,
    [data.assignments, data.selectedAssignmentId],
  );

  async function load(assignmentId) {
    setLoading(true);
    setError("");

    try {
      const qs = assignmentId ? `?assignmentId=${encodeURIComponent(assignmentId)}` : "";
      const response = await fetch(`/api/jobseeker/timekeeping${qs}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load timekeeping");
      }

      setData({
        assignments: payload.assignments || [],
        selectedAssignmentId: payload.selectedAssignmentId || null,
        status: payload.status || null,
      });
    } catch (err) {
      setError(err.message || "Unable to load timekeeping");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const requiredClockCodes = data.status?.requiredClockCodes || [];
  const needsCodeFor = (action) => requiredClockCodes.includes(action);

  async function handlePunchAction(action) {
    setError("");
    setToast("");

    if (needsCodeFor(action) && !/^\d{4}$/.test(clockCode.trim())) {
      setError("Enter the required 4-digit daily code before punching.");
      return;
    }

    setSubmittingAction(action);

    try {
      const location = await getCurrentLocation();
      const response = await fetch("/api/jobseeker/timekeeping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: data.selectedAssignmentId,
          action,
          clockCode: needsCodeFor(action) ? clockCode.trim() : "",
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Punch action failed");
      }

      setToast(`${actionLabel(action)} saved.`);
      setClockCode("");
      await load(data.selectedAssignmentId);
    } catch (err) {
      setError(err.message || "Punch action failed");
    } finally {
      setSubmittingAction("");
    }
  }

  return (
    <article className="rounded-3xl bg-white/95 p-4 shadow-xl ring-1 ring-slate-900/5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Timekeeping</h2>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mobile-first punch controls</p>
      </div>

      {loading ? <p className="mt-4 text-sm text-slate-600">Loading timekeeping...</p> : null}
      {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {toast ? <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{toast}</p> : null}

      {!loading && !data.assignments.length ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">No active assignment</p>
          <p className="mt-1">You do not have an active assignment yet, so punch controls are unavailable right now.</p>
        </div>
      ) : null}

      {!loading && data.assignments.length ? (
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="timekeeping-assignment-picker">
              Active assignment
            </label>
            <select
              id="timekeeping-assignment-picker"
              value={data.selectedAssignmentId || ""}
              onChange={(event) => load(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-900 shadow-sm"
            >
              {data.assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {(assignment.projectName ? `${assignment.projectName} · ` : "") +
                    `${assignment.jobName} · ${assignment.city}, ${assignment.state} · ${assignment.status}`}
                </option>
              ))}
            </select>
          </div>

          <section className={`rounded-2xl p-4 ring-1 ${statusTone(data.status)}`}>
            <p className="text-xs font-semibold uppercase tracking-wide">Current status</p>
            <p className="mt-2 text-lg font-bold">
              {data.status?.isClockedIn ? "Clocked In" : "Clocked Out"}
              {data.status?.onBreak ? " • On Break" : ""}
              {data.status?.onLunch ? " • On Lunch" : ""}
            </p>
            <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold">Assignment</dt>
                <dd>{selectedAssignment ? `${selectedAssignment.jobName}` : "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold">Last punch</dt>
                <dd>
                  {data.status?.lastPunchType ? `${actionLabel(data.status.lastPunchType)} · ${formatTimestamp(data.status.lastPunchTimestamp)}` : "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Today summary</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-700">
              <div>
                <dt className="font-semibold text-slate-900">First In</dt>
                <dd>{formatTimestamp(data.status?.todaySummary?.firstIn)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Last Out</dt>
                <dd>{formatTimestamp(data.status?.todaySummary?.lastOut)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Worked Today</dt>
                <dd>{formatDuration(data.status?.todaySummary?.totalWorkedMinutes)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Open Shift</dt>
                <dd>{data.status?.todaySummary?.openShift ? "Yes" : "No"}</dd>
              </div>
            </dl>
            {data.status?.todaySummary?.hasException ? (
              <p className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                Exception flagged ({data.status?.todaySummary?.openExceptionCount || 0})
              </p>
            ) : null}
          </section>

          {data.status?.locked ? (
            <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">{data.status?.lockMessage}</div>
          ) : null}

          {requiredClockCodes.length ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-600" htmlFor="clock-code-input">
                Daily 4-digit code
              </label>
              <input
                id="clock-code-input"
                inputMode="numeric"
                maxLength={4}
                value={clockCode}
                onChange={(event) => setClockCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-lg tracking-[0.4em]"
                placeholder="0000"
              />
              <p className="mt-2 text-xs text-slate-500">Required for: {requiredClockCodes.map(actionLabel).join(", ")}.</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(data.status?.allowedActions || []).map((action) => {
              const danger = ["clock_out"].includes(action);
              const disabled = data.status?.locked || submittingAction.length > 0;

              return (
                <button
                  key={action}
                  type="button"
                  disabled={disabled}
                  onClick={() => handlePunchAction(action)}
                  className={`w-full rounded-2xl px-4 py-4 text-base font-bold text-white shadow-lg transition ${
                    danger
                      ? "bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300"
                      : "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300"
                  }`}
                >
                  {submittingAction === action ? "Saving..." : actionLabel(action)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}
