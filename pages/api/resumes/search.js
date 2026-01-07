import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { normalizeStateCode } from "@/lib/constants/states";
import { geocodeZip } from "@/lib/utils/geocode";

function parsePagination(query = {}) {
  const rawPage = Number.parseInt(query.page, 10);
  const rawPageSize = Number.parseInt(query.pageSize ?? query.perPage, 10);
  const shouldPaginate = Number.isFinite(rawPage) || Number.isFinite(rawPageSize);

  if (!shouldPaginate) {
    return { shouldPaginate: false, page: 1, pageSize: null, skip: 0, take: undefined };
  }

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSizeCandidate = Number.isFinite(rawPageSize) && rawPageSize > 0 ? rawPageSize : 25;
  const pageSize = Math.min(Math.max(pageSizeCandidate, 1), 100);

  return {
    shouldPaginate: true,
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
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

    const { trade, zip, radius, keyword, state } = req.query;
    const parsedRadius = radius !== undefined ? Number.parseFloat(radius) : undefined;
    const distance = Number.isFinite(parsedRadius) ? Math.min(Math.max(parsedRadius, 0), 500) : undefined;
    const stateFilter = normalizeStateCode(state) || undefined;
    const pagination = parsePagination(req.query);

    let resumes = [];
    let radiusFilterApplied = false;

    if (zip && distance && Number.isFinite(distance) && distance > 0) {
      const coordinates = await geocodeZip(zip);

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
              state: stateFilter,
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
            select: {
              id: true,
              firstName: true,
              lastName: true,
              trade: true,
              city: true,
              state: true,
              phone: true,
              lastActive: true,
              resumeUrl: true,
              updatedAt: true,
              resumeUpdatedAt: true,
            },
          });

          const candidatesById = new Map(filteredCandidates.map((candidate) => [candidate.id, candidate]));
          const orderedResumes = candidateIds
            .map((id) => {
              const candidate = candidatesById.get(id);
              if (!candidate) return null;
              return { ...candidate, distance: distanceById.get(id) ?? null };
            })
            .filter(Boolean);

          if (pagination.shouldPaginate) {
            resumes = orderedResumes.slice(pagination.skip, pagination.skip + pagination.take);
          } else {
            resumes = orderedResumes;
          }
        }
      }
    }

    if (!resumes.length && !radiusFilterApplied) {
      const fallbackWhere = {
        trade: trade ? trade.toString() : undefined,
        state: stateFilter,
        ...(zip ? { zip: zip.toString() } : {}),
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
      };

      const queryOptions = {
        where: fallbackWhere,
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          trade: true,
          city: true,
          state: true,
          phone: true,
          lastActive: true,
          resumeUrl: true,
          updatedAt: true,
          resumeUpdatedAt: true,
        },
      };

      if (pagination.shouldPaginate) {
        queryOptions.skip = pagination.skip;
        queryOptions.take = pagination.take;
      }

      resumes = await prisma.jobseekerProfile.findMany(queryOptions);
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
        resumeUpdatedAt: candidate.resumeUpdatedAt ?? candidate.resume_updated_at ?? null,
        distance: candidate.distance ?? null,
      }));

    res.status(200).json(normalized);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Resume search failed" });
  }
}
