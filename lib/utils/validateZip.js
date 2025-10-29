import { getStateNameFromCode, normalizeStateCode } from "../constants/states.js";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "TravelingOvertimeJobs/1.0";

function normalizeInput(value) {
  if (value == null) return "";
  return `${value}`.trim();
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

async function lookupByZip(zip) {
  const results = await fetchNominatim({
    postalcode: zip,
    country: "United States",
    format: "json",
    limit: "1",
    addressdetails: "1",
  });
  const [match] = results;
  return match || null;
}

async function lookupByCityState(city, stateCodeOrName) {
  const params = {
    country: "United States",
    format: "json",
    limit: "1",
    addressdetails: "1",
  };

  const normalizedCity = normalizeInput(city);
  const normalizedState = normalizeInput(stateCodeOrName);

  if (normalizedCity && normalizedState) {
    params.q = `${normalizedCity}, ${normalizedState}`;
  } else if (normalizedCity) {
    params.q = normalizedCity;
  } else if (normalizedState) {
    params.q = normalizedState;
  } else {
    return null;
  }

  const [match] = await fetchNominatim(params);
  return match || null;
}

export async function validateZip(zip, city, state) {
  const normalizedZip = normalizeInput(zip);
  const normalizedCity = normalizeInput(city);
  const normalizedStateInput = normalizeInput(state);
  const normalizedStateCode = normalizeStateCode(normalizedStateInput);

  if (!normalizedZip) {
    return {
      valid: true,
      normalizedZip: null,
      resolvedCity: normalizedCity || null,
      resolvedState: normalizedStateCode || null,
    };
  }

  try {
    const match = await lookupByZip(normalizedZip);
    if (match) {
      const postcode = extractPostcode(match.address?.postcode) || normalizedZip;
      const resolvedCity = resolveAddressCity(match.address) || normalizedCity || null;
      const resolvedStateRaw =
        match.address?.state || match.address?.state_code || normalizedStateInput || null;
      const resolvedState = normalizeStateCode(resolvedStateRaw) || normalizedStateCode || null;

      return {
        valid: true,
        normalizedZip: postcode,
        resolvedCity,
        resolvedState,
      };
    }
  } catch (error) {
    console.error("ZIP validation lookup failed:", normalizedZip, error);
    return {
      valid: true,
      lookupFailed: true,
      normalizedZip,
      resolvedCity: normalizedCity || null,
      resolvedState: normalizedStateCode || null,
    };
  }

  const stateQuery =
    getStateNameFromCode(normalizedStateCode) || normalizedStateInput || normalizedStateCode || "";

  if (normalizedCity || stateQuery) {
    try {
      const suggestion = await lookupByCityState(normalizedCity, stateQuery);
      const suggestionZip = extractPostcode(suggestion?.address?.postcode);
      if (suggestionZip) {
        const suggestionCity = resolveAddressCity(suggestion?.address) || normalizedCity || null;
        const suggestionStateRaw =
          suggestion?.address?.state || suggestion?.address?.state_code || stateQuery || null;
        const suggestionState = normalizeStateCode(suggestionStateRaw) || null;
        return {
          valid: false,
          suggestedZip: suggestionZip,
          suggestedCity,
          suggestedState,
        };
      }
    } catch (error) {
      console.error("ZIP suggestion lookup failed:", { city: normalizedCity, state: stateQuery }, error);
    }
  }

  return {
    valid: false,
    suggestedZip: null,
    suggestedCity: null,
    suggestedState: null,
  };
}
