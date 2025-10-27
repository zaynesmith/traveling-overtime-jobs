import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";

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
    if (!session?.user?.id || session.user.role !== "employer") {
      return res.status(403).json({ error: "Employer authentication required" });
    }

    const { trade, zip, radius, keyword } = req.query;
    const parsedRadius = radius !== undefined ? Number.parseFloat(radius) : undefined;
    const distance = Number.isFinite(parsedRadius) ? Math.min(Math.max(parsedRadius, 0), 500) : undefined;

    let resumes = [];
    let radiusFilterApplied = false;

    if (zip && distance && Number.isFinite(distance) && distance > 0) {
      const coordinates = await fetchZipCoordinates(zip);

      if (coordinates?.lat !== undefined && coordinates?.lon !== undefined) {
        radiusFilterApplied = true;
        const radiusMeters = distance * 1609.34;
        const candidatesWithinRadius = await prisma.$queryRaw`
          SELECT jsp.id,
            earth_distance(ll_to_earth(jsp.lat, jsp.lon), ll_to_earth(${coordinates.lat}, ${coordinates.lon})) AS distance
          FROM jobseekerprofile jsp
          WHERE jsp.lat IS NOT NULL
            AND jsp.lon IS NOT NULL
            AND earth_distance(ll_to_earth(jsp.lat, jsp.lon), ll_to_earth(${coordinates.lat}, ${coordinates.lon})) <= ${radiusMeters}
          ORDER BY distance ASC
        `;

        const candidateIds = candidatesWithinRadius.map((record) => record?.id).filter(Boolean);

        if (candidateIds.length) {
          const distanceById = new Map(
            candidatesWithinRadius
              .filter((record) => record?.id)
              .map((record) => {
                const numericDistance = Number(record.distance);
                const miles = Number.isFinite(numericDistance)
                  ? numericDistance / 1609.34
                  : null;
                return [record.id, miles];
              }),
          );

          const filteredCandidates = await prisma.jobseekerProfile.findMany({
            where: {
              trade: trade ? trade.toString() : undefined,
              OR: keyword
                ? [
                    { firstName: { contains: keyword, mode: "insensitive" } },
                    { lastName: { contains: keyword, mode: "insensitive" } },
                    { city: { contains: keyword, mode: "insensitive" } },
                    { trade: { contains: keyword, mode: "insensitive" } },
                  ]
                : undefined,
              resumeUrl: {
                not: null,
              },
              NOT: {
                resumeUrl: { equals: "" },
              },
              id: { in: candidateIds },
            },
          });

          const candidatesById = new Map(filteredCandidates.map((candidate) => [candidate.id, candidate]));
          resumes = candidateIds
            .map((id) => {
              const candidate = candidatesById.get(id);
              if (!candidate) return null;
              return { ...candidate, distance: distanceById.get(id) ?? null };
            })
            .filter(Boolean);
        }
      }
    }

    if (!resumes.length && !radiusFilterApplied) {
      resumes = await prisma.jobseekerProfile.findMany({
        where: {
          trade: trade ? trade.toString() : undefined,
          zip: zip ? zip.toString() : undefined,
          OR: keyword
            ? [
                { firstName: { contains: keyword, mode: "insensitive" } },
                { lastName: { contains: keyword, mode: "insensitive" } },
                { city: { contains: keyword, mode: "insensitive" } },
                { trade: { contains: keyword, mode: "insensitive" } },
              ]
            : undefined,
          resumeUrl: {
            not: null,
          },
          NOT: {
            resumeUrl: { equals: "" },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    }

    const normalized = resumes
      .filter((candidate) => Boolean(candidate?.resumeUrl))
      .map((candidate) => ({
        id: candidate.id,
        firstName: candidate.firstName ?? null,
        lastName: candidate.lastName ?? null,
        trade: candidate.trade ?? null,
        city: candidate.city ?? null,
        state: candidate.state ?? null,
        phone: candidate.phone ?? null,
        lastActive: candidate.lastActive ?? null,
        resumeUrl: candidate.resumeUrl,
        updatedAt: candidate.updated_at ?? candidate.updatedAt ?? null,
        distance: candidate.distance ?? null,
      }));

    res.status(200).json(normalized);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Resume search failed" });
  }
}
