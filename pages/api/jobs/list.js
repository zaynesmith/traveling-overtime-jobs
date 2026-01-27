import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { normalizeStateCode } from "@/lib/constants/states";
import { getTradeSynonyms, normalizeTrade } from "@/lib/trades";
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
    const { trade, zip, radius, keyword, q, location, employer, state } = req.query;

    const searchTerm = (keyword || q || "").toString().trim();
    const zipCode = (zip || location || "").toString().trim();
    const parsedRadius = radius !== undefined ? Number.parseFloat(radius) : undefined;
    const distance = Number.isFinite(parsedRadius) ? Math.min(Math.max(parsedRadius, 0), 500) : undefined;
    const normalizedTradeFilter = trade
      ? normalizeTrade(trade.toString())
      : undefined;
    const stateFilter = normalizeStateCode(state) || undefined;
    const pagination = parsePagination(req.query);

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

    if (stateFilter) {
      filters.state = stateFilter;
    }

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
      const coordinates = await geocodeZip(zipCode);

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

          const queryOptions = {
            where: {
              ...filters,
              id: { in: jobIds },
            },
            include: {
              employerprofile: {
                select: { companyName: true, city: true, state: true },
              },
            },
            orderBy: { posted_at: "desc" },
          };

          if (pagination.shouldPaginate) {
            queryOptions.skip = pagination.skip;
            queryOptions.take = pagination.take;
          }

          const filteredJobs = await prisma.jobs.findMany(queryOptions);
          jobs = filteredJobs.map((job) => ({
            ...job,
            distance: distanceById.get(job.id) ?? null,
          }));
        }
      }
    }

    if (!jobs.length && !radiusFilterApplied) {
      const fallbackWhere = {
        ...filters,
        ...(zipCode ? { zip: zipCode } : {}),
      };

      const queryOptions = {
        where: fallbackWhere,
        orderBy: { posted_at: "desc" },
        include: {
          employerprofile: {
            select: { companyName: true, city: true, state: true },
          },
        },
      };

      if (pagination.shouldPaginate) {
        queryOptions.skip = pagination.skip;
        queryOptions.take = pagination.take;
      }

      jobs = await prisma.jobs.findMany(queryOptions);
    }

    const normalizedJobs = jobs.map((job) => ({
      ...job,
      is_admin_seeded: job.is_admin_seeded ?? false,
      trade: normalizeTrade(job.trade),
    }));

    res.status(200).json(normalizedJobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load jobs" });
  }
}
