"use client";

import { useRouter } from "next/router";

export default function Jobs() {
  const { query } = useRouter();
  const q = (query.q || "").toString();
  const location = (query.location || "").toString();
  const trade = (query.trade || "").toString();
  const payMin = (query.payMin || "").toString();

  // TODO: call /api/jobs/search with q/location/trade, render results
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Jobs</h1>
      <p className="text-sm text-gray-600 mb-6">
        Query: <b>{q}</b> • Location: <b>{location}</b> • Trade: <b>{trade}</b> • Minimum pay: <b>{payMin}</b>
      </p>
      {/* results list here */}
      <div className="rounded border p-4">Job results appear here…</div>
    </main>
  );
}
