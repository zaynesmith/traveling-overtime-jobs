import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { getTradeSynonyms, normalizeTrade } from "@/lib/trades";

async function fetchZipCoordinates(zip) {
  if (!zip) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&country=United States&format=json&limit=1`,
      {
        headers: { "User-Agent": "TravelingOvertimeJobs/1.0" },
      },
    );

    if (!response.ok) {
      return null;
    }

    const results = await response.json();
    const [match] = Array.isArray(results) ? results : [];

    const lat = match?.lat ? Number.parseFloat(match.lat) : null;
    const lon = match?.lon ? Number.parseFloat(match.lon) : null;

    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { lat, lon };
    }

    return null;
  } catch (error) {
    console.error("Failed to geocode ZIP", zip, error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const { trade, zip, radius, keyword, q, location, employer } = req.query;

    const searchTerm = (keyword || q || "").toString().trim();
    const zipCode = (zip || location || "").toString().trim();
    const parsedRadius = radius !== undefined ? Number.parseFloat(radius) : undefined;
    const distance = Number.isFinite(parsedRadius) ? Math.min(Math.max(parsedRadius, 0), 500) : undefined;
    const normalizedTradeFilter = trade
      ? normalizeTrade(trade.toString())
      : undefined;

    const filters = {
      trade: normalizedTradeFilter
        ? { in: getTradeSynonyms(normalizedTradeFilter) }
        : undefined,
      OR: searchTerm
        ? [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
            { trade: { contains: searchTerm, mode: "insensitive" } },
            { location: { contains: searchTerm, mode: "insensitive" } },
            { city: { contains: searchTerm, mode: "insensitive" } },
            { state: { contains: searchTerm, mode: "insensitive" } },
            {
              additional_requirements: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          ]
        : undefined,
    };

    if (employer === "mine") {
      if (!session?.user?.id) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const employerProfile = await prisma.employerProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      if (!employerProfile) {
        return res.status(403).json({ error: "Employer profile not found" });
      }

      filters.employer_id = employerProfile.id;
    }

    let jobs = [];
    let radiusFilterApplied = false;
    const shouldApplyRadiusFilter = Boolean(
      zipCode && distance && Number.isFinite(distance) && distance > 0,
    );

    if (shouldApplyRadiusFilter) {
      const coordinates = await fetchZipCoordinates(zipCode);

      if (coordinates?.lat !== undefined && coordinates?.lon !== undefined) {
        radiusFilterApplied = true;
        const radiusMeters = distance * 1609.34;
        const jobsWithinRadius = await prisma.$queryRaw`
          SELECT j.id,
            earth_distance(ll_to_earth(j.lat, j.lon), ll_to_earth(${coordinates.lat}, ${coordinates.lon})) AS distance
          FROM jobs j
          WHERE j.lat IS NOT NULL
            AND j.lon IS NOT NULL
            AND earth_distance(ll_to_earth(j.lat, j.lon), ll_to_earth(${coordinates.lat}, ${coordinates.lon})) <= ${radiusMeters}
          ORDER BY distance ASC
        `;

        const jobIds = jobsWithinRadius.map((record) => record?.id).filter(Boolean);

        if (jobIds.length) {
          const distanceById = new Map(
            jobsWithinRadius
              .filter((record) => record?.id)
              .map((record) => {
                const numericDistance = Number(record.distance);
                const miles = Number.isFinite(numericDistance)
                  ? numericDistance / 1609.34
                  : null;
                return [record.id, miles];
              }),
          );

          const filteredJobs = await prisma.jobs.findMany({
            where: {
              ...filters,
              zip: undefined,
              id: { in: jobIds },
            },
            include: {
              employerprofile: {
                select: { companyName: true, city: true, state: true },
              },
            },
          });

          const jobsById = new Map(filteredJobs.map((job) => [job.id, job]));
          jobs = jobIds
            .map((id) => {
              const job = jobsById.get(id);
              if (!job) return null;
              return { ...job, distance: distanceById.get(id) ?? null };
            })
            .filter(Boolean);
        }
      }
    }

    if (!jobs.length && !radiusFilterApplied) {
      jobs = await prisma.jobs.findMany({
        where: {
          ...filters,
          zip: zipCode || undefined,
        },
        orderBy: { posted_at: "desc" },
        include: {
          employerprofile: {
            select: { companyName: true, city: true, state: true },
          },
        },
      });
    }

    const normalizedJobs = jobs.map((job) => ({
      ...job,
      trade: normalizeTrade(job.trade),
    }));

    res.status(200).json(normalizedJobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load jobs" });
  }
}
