import { formatReadableDate } from "@/lib/formatDate";

export default function CandidateCard({
  candidate,
  isSaved = false,
  isPending = false,
  onToggleSave,
  buttonLabels = {},
}) {
  const {
    fullName,
    trade,
    location,
    phone,
    lastActive,
    resumeUpdated,
    resumeUrl,
    savedAt,
  } = candidate;

  const displayName = fullName || "Unnamed candidate";
  const displayTrade = trade || "Not provided";
  const displayLocation = location || "Not provided";
  const displayPhone = phone || "Not shared";

  const formattedLastActive = formatReadableDate(lastActive) || "No recent activity";
  const formattedResumeUpdated = formatReadableDate(resumeUpdated);
  const formattedSavedAt = formatReadableDate(savedAt);

  const {
    unsaved = "Save Candidate",
    saved = "Saved",
    saving = "Saving...",
    removing = "Removing...",
  } = buttonLabels;

  const actionLabel = isPending
    ? isSaved
      ? saving
      : removing
    : isSaved
      ? saved
      : unsaved;

  return (
    <li className="rounded-2xl bg-white p-5 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-slate-900">{displayName}</p>
          <p className="mt-1 text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Trade:</span> {displayTrade}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Location:</span> {displayLocation}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Phone:</span> {displayPhone}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Last Active:</span> {formattedLastActive}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Resume Updated:</span> {formattedResumeUpdated || "Not provided"}
          </p>
        </div>
        {onToggleSave ? (
          <button
            type="button"
            onClick={onToggleSave}
            disabled={isPending}
            aria-pressed={isSaved}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-70 ${
              isSaved
                ? "border-amber-400 bg-amber-400 text-amber-900"
                : "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
            }`}
          >
            <span aria-hidden="true">⭐</span>
            {actionLabel}
          </button>
        ) : null}
      </div>
      {resumeUrl ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <a
            href={resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600"
          >
            View resume
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          {formattedResumeUpdated ? (
            <span className="text-xs text-slate-500">Updated {formattedResumeUpdated}</span>
          ) : (
            <span className="text-xs text-slate-500">Updated date: Not provided</span>
          )}
        </div>
      ) : null}
      {formattedSavedAt ? (
        <p className="mt-3 text-xs text-slate-500">Saved on {formattedSavedAt}</p>
      ) : null}
    </li>
  );
}
