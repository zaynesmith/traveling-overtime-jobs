export const filterPanelClasses =
  "bg-white border border-gray-200 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-6";

export default function JobSearchFilters({ filters, onChange, onSubmit, onReset, className = "" }) {
  return (
    <form onSubmit={onSubmit} className={`${filterPanelClasses} grid gap-4 md:grid-cols-4 md:gap-6 ${className}`}>
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-slate-700">Keyword</label>
        <input
          type="text"
          name="keyword"
          value={filters.keyword}
          onChange={onChange}
          placeholder="Job title, contractor, or keyword"
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700">Trade</label>
        <input
          type="text"
          name="trade"
          value={filters.trade}
          onChange={onChange}
          placeholder="e.g. Electrician"
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700">ZIP</label>
        <input
          type="text"
          name="zip"
          value={filters.zip}
          onChange={onChange}
          placeholder="Near ZIP"
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700">Radius (miles)</label>
        <input
          type="number"
          min="10"
          max="500"
          step="10"
          name="radius"
          value={filters.radius}
          onChange={onChange}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      </div>
      <div className="md:col-span-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
        >
          Search
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
