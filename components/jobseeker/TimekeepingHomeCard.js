import { useEffect, useMemo, useState } from "react";
import { captureCurrentLocation, LOCATION_CAPTURE_STATUS } from "@/lib/utils/locationCapture";

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

function humanizeTimekeepingError(message, code) {
  if (code === "INVALID_CLOCK_CODE") {
    return "Invalid 4-digit code. Verify today’s code with your employer and try again.";
  }
  if (code === "EXPIRED_CLOCK_CODE") {
    return "That code is expired/inactive. Ask your employer for today’s active code.";
  }

  const normalized = String(message || "").toLowerCase();
  if (normalized.includes("4-digit")) return "Enter a numeric 4-digit code (example: 0428).";
  return message || "Punch action failed";
}

function parseGeofenceUiState(payload) {
  const geofence = payload?.geofence || null;
  const enforcement = String(geofence?.enforcement || geofence?.mode || "").toLowerCase();
  const inside = geofence?.inside === true;
  const outside = geofence?.inside === false || geofence?.status === "outside";
  const overrideRequested = geofence?.canRequestOverride === true;

  if (inside) return { type: "success", message: "Clocked in successfully" };
  if (!outside) return null;

  if (enforcement === "hard") {
    if (overrideRequested) return { type: "warning", message: "Request override" };
    return { type: "error", message: "You must be at the jobsite to clock in." };
  }

  return { type: "warning", message: "You're outside the jobsite. Continue?" };
}

export default function TimekeepingHomeCard() {
  const [loading, setLoading] = useState(true);
  const [submittingAction, setSubmittingAction] = useState("");
  const [data, setData] = useState({ assignments: [], selectedAssignmentId: null, status: null });
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [warning, setWarning] = useState("");
  const [clockCode, setClockCode] = useState("");
  const [locationStatus, setLocationStatus] = useState("");

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

  async function handlePunchAction(action, assignmentOverrideId) {
    setError("");
    setToast("");
    setWarning("");

    if (needsCodeFor(action) && !/^\d{4}$/.test(clockCode.trim())) {
      setError("Enter the required 4-digit daily code before punching.");
      return;
    }

    setSubmittingAction(action);

    try {
      setLocationStatus("Getting your location...");
      const location = await captureCurrentLocation();
      setLocationStatus("");
      if (location.status === LOCATION_CAPTURE_STATUS.PERMISSION_DENIED) {
        setError("Location permission required");
      }

      if (location.status === LOCATION_CAPTURE_STATUS.TIMEOUT) {
        setWarning("Location timeout. Please retry.");
      }

      const response = await fetch("/api/jobseeker/timekeeping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: assignmentOverrideId || data.selectedAssignmentId,
          action,
          clockCode: needsCodeFor(action) ? clockCode.trim() : "",
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
          accuracy: location?.accuracy ?? null,
          locationStatus: location?.status || LOCATION_CAPTURE_STATUS.UNAVAILABLE,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(humanizeTimekeepingError(payload?.error, payload?.code));
      }

      const geofenceUiState = parseGeofenceUiState(payload);
      if (geofenceUiState?.type === "error") setError(geofenceUiState.message);
      if (geofenceUiState?.type === "warning") setWarning(geofenceUiState.message);

      const successMessage = action === "clock_in" ? "Clocked in successfully" : `${actionLabel(action)} saved.`;
      setToast(geofenceUiState?.message || successMessage);
      setClockCode("");
      await load(assignmentOverrideId || data.selectedAssignmentId);
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
      {locationStatus ? <p className="mt-4 text-sm text-slate-600">{locationStatus}</p> : null}
      {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {warning ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">{warning}</p> : null}
      {toast ? <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{toast}</p> : null}

      {!loading && !data.assignments.length ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">No eligible assignment</p>
          <p className="mt-1">
            You do not have an active or accepted assignment yet, so punch controls are unavailable right now.
          </p>
        </div>
      ) : null}

      {!loading && data.assignments.length ? (
        <div className="mt-4 space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Accepted/active assignments</p>
            <ul className="mt-3 space-y-3">
              {data.assignments.map((assignment) => (
                <li key={assignment.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {(assignment.projectName ? `${assignment.projectName} · ` : "") + assignment.jobName}
                  </p>
                  <p className="text-xs text-slate-600">
                    {assignment.city}, {assignment.state}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={submittingAction.length > 0}
                      onClick={() => handlePunchAction("clock_in", assignment.id)}
                      className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
                    >
                      Clock In
                    </button>
                    <button
                      type="button"
                      disabled={submittingAction.length > 0}
                      onClick={() => handlePunchAction("clock_out", assignment.id)}
                      className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
                    >
                      Clock Out
                    </button>
                    <button
                      type="button"
                      disabled={submittingAction.length > 0}
                      onClick={() => load(assignment.id)}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 disabled:opacity-50"
                    >
                      View
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

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
                pattern="[0-9]{4}"
                autoComplete="one-time-code"
                maxLength={4}
                value={clockCode}
                onChange={(event) => setClockCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-lg tracking-[0.4em]"
                placeholder="0000"
              />
              <p className="mt-2 text-xs text-slate-500">
                Numeric 4-digit code required for: {requiredClockCodes.map(actionLabel).join(", ")}.
              </p>
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
