export async function geocodeZip(zip) {
  if (!zip) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=United States&format=json&limit=1`,
      { headers: { "User-Agent": "TravelingOvertimeJobs/1.0" } },
    );
    const [data] = await res.json();
    if (!data) return null;
    return { lat: parseFloat(data.lat), lon: parseFloat(data.lon) };
  } catch (err) {
    console.error("Geocode error for ZIP:", zip, err);
    return null;
  }
}
