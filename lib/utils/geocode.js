const RATE_LIMIT_INTERVAL_MS = 1000;
let lastGeocodeRequestTime = 0;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeZip(zip) {
  if (!zip) return null;

  const trimmedZip = `${zip}`.trim();
  if (!trimmedZip) return null;

  const elapsed = Date.now() - lastGeocodeRequestTime;
  if (elapsed < RATE_LIMIT_INTERVAL_MS) {
    await wait(RATE_LIMIT_INTERVAL_MS - elapsed);
  }

  const requestStart = Date.now();
  lastGeocodeRequestTime = requestStart;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(
        trimmedZip,
      )}&country=United States&format=json&limit=1`,
      { headers: { "User-Agent": "TravelingOvertimeJobs/1.0" } },
    );

    if (!res.ok) {
      console.error(
        "Geocode request failed",
        trimmedZip,
        `${res.status} ${res.statusText}`,
      );
      return null;
    }

    const [data] = await res.json();
    if (!data) return null;

    const lat = Number.parseFloat(data.lat);
    const lon = Number.parseFloat(data.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }

    return { lat, lon };
  } catch (err) {
    console.error("Geocode error for ZIP", trimmedZip, err);
    return null;
  } finally {
    lastGeocodeRequestTime = Math.max(requestStart, Date.now());
  }
}

module.exports = { geocodeZip };
