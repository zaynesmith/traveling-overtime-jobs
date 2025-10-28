const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "TravelingOvertimeJobs/1.0";

function normalizeInput(value) {
  if (value == null) return "";
  const trimmed = `${value}`.trim();
  return trimmed;
}

function extractPostcode(raw) {
  if (!raw) return null;
  const value = `${raw}`.split(/[;,]/)[0].trim();
  return value || null;
}

function resolveAddressCity(address = {}) {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.municipality ||
    address.county ||
    null
  );
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
    return { lat: parseFloat(data.lat), lon: parseFloat(data.lon) };
  } catch (err) {
    console.error("Geocode error for ZIP:", normalizedZip, err);
    return null;
  }
}

export async function validateZip(zip, city, state) {
  const normalizedZip = normalizeInput(zip);
  const normalizedCity = normalizeInput(city);
  const normalizedState = normalizeInput(state);

  if (!normalizedZip) {
    return { valid: true };
  }

  try {
    const results = await fetchNominatim({
      postalcode: normalizedZip,
      country: "United States",
      format: "json",
      limit: "1",
      addressdetails: "1",
    });

    const [match] = results;
    if (match) {
      const postcode = extractPostcode(match.address?.postcode) || normalizedZip;
      return { valid: true, normalizedZip: postcode };
    }
  } catch (error) {
    console.error("ZIP validation lookup failed:", normalizedZip, error);
    return { valid: true, lookupFailed: true };
  }

  if (normalizedCity && normalizedState) {
    try {
      const suggestionResults = await fetchNominatim({
        city: normalizedCity,
        state: normalizedState,
        country: "United States",
        format: "json",
        limit: "1",
        addressdetails: "1",
      });

      const [suggestion] = suggestionResults;
      const suggestionZip = extractPostcode(suggestion?.address?.postcode);
      if (suggestionZip) {
        return {
          valid: false,
          suggestion: {
            zip: suggestionZip,
            city: resolveAddressCity(suggestion.address) || normalizedCity,
            state: suggestion.address?.state || normalizedState,
          },
        };
      }
    } catch (error) {
      console.error(
        "ZIP suggestion lookup failed:",
        { city: normalizedCity, state: normalizedState },
        error,
      );
    }
  }

  return { valid: false, suggestion: null };
}
