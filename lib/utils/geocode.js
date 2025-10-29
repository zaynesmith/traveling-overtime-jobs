const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "TravelingOvertimeJobs/1.0";

function normalizeInput(value) {
  if (value == null) return "";
  return `${value}`.trim();
}

async function fetchNominatim(params) {
  const url = new URL(NOMINATIM_BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Nominatim request failed with status ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function geocodeZip(zip) {
  const normalizedZip = normalizeInput(zip);
  if (!normalizedZip) return null;

  try {
    const results = await fetchNominatim({
      postalcode: normalizedZip,
      country: "United States",
      format: "json",
      limit: "1",
    });

    const [data] = results;
    if (!data) return null;

    const lat = Number.parseFloat(data.lat);
    const lon = Number.parseFloat(data.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }

    return { lat, lon };
  } catch (err) {
    console.error("Geocode error for ZIP:", normalizedZip, err);
    return null;
  }
}
