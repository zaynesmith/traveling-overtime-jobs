import { Prisma } from "@prisma/client";
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

function buildSqlFilters({ trade, stateFilter, zip, keyword, includeZip }) {
  const filters = [];

  if (trade) {
    filters.push(Prisma.sql`jsp.trade = ${trade.toString()}`);
  }

  if (stateFilter) {
    filters.push(Prisma.sql`jsp.state = ${stateFilter}`);
  }

  if (includeZip && zip) {
    filters.push(Prisma.sql`jsp.zip = ${zip.toString()}`);
  }

  if (keyword) {
    const keywordLike = `%${keyword}%`;
    filters.push(
      Prisma.sql`(jsp."firstName" ILIKE ${keywordLike}
        OR jsp."lastName" ILIKE ${keywordLike}
        OR jsp.city ILIKE ${keywordLike}
        OR jsp.trade ILIKE ${keywordLike})`,
    );
  }

  filters.push(Prisma.sql`jsp."resumeUrl" IS NOT NULL`);
  filters.push(Prisma.sql`jsp."resumeUrl" <> ''`);

  return filters;
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
    let totalCount = 0;
    let radiusFilterApplied = false;

    if (zip && distance && Number.isFinite(distance) && distance > 0) {
      const coordinates = await geocodeZip(zip);

      if (coordinates?.lat !== undefined && coordinates?.lon !== undefined) {
        radiusFilterApplied = true;
        const radiusMeters = distance * 1609.34;
        const radiusFilters = buildSqlFilters({
          trade,
          stateFilter,
          keyword,
          includeZip: false,
        });
        const radiusWhereSql = Prisma.sql`WHERE ${Prisma.join(
          radiusFilters,
          Prisma.sql` AND `,
        )}`;
        const paginationSql = pagination.shouldPaginate
          ? Prisma.sql`LIMIT ${pagination.take} OFFSET ${pagination.skip}`
          : Prisma.empty;

        resumes = await prisma.$queryRaw`
          WITH distance_candidates AS (
            SELECT jsp.id,
              earth_distance(
                ll_to_earth(jsp.lat, jsp.lon),
                ll_to_earth(${coordinates.lat}, ${coordinates.lon})
              ) AS distance
            FROM jobseekerprofile jsp
            WHERE jsp.lat IS NOT NULL
              AND jsp.lon IS NOT NULL
              AND earth_distance(
                ll_to_earth(jsp.lat, jsp.lon),
                ll_to_earth(${coordinates.lat}, ${coordinates.lon})
              ) <= ${radiusMeters}
          ),
          filtered AS (
            SELECT
              jsp.id,
              jsp."firstName",
              jsp."lastName",
              jsp.trade,
              jsp.city,
              jsp.state,
              jsp.phone,
              jsp."lastActive",
              jsp."resumeUrl",
              jsp."updated_at" AS "updatedAt",
              jsp."resume_updated_at" AS "resumeUpdatedAt",
              (distance_candidates.distance / 1609.34) AS distance,
              GREATEST(
                jsp."resume_updated_at",
                jsp."lastBump",
                jsp."last_bump"
              ) AS "resumeActivityAt",
              COUNT(*) OVER() AS total_count
            FROM jobseekerprofile jsp
            JOIN distance_candidates ON distance_candidates.id = jsp.id
            ${radiusWhereSql}
          )
          SELECT
            id,
            "firstName",
            "lastName",
            trade,
            city,
            state,
            phone,
            "lastActive",
            "resumeUrl",
            "updatedAt",
            "resumeUpdatedAt",
            distance,
            total_count
          FROM filtered
          ORDER BY "resumeActivityAt" DESC NULLS LAST,
            distance ASC,
            id ASC
          ${paginationSql}
        `;

        if (resumes.length) {
          totalCount = Number(resumes[0]?.total_count ?? 0);
        } else {
          const countResult = await prisma.$queryRaw`
            WITH distance_candidates AS (
              SELECT jsp.id
              FROM jobseekerprofile jsp
              WHERE jsp.lat IS NOT NULL
                AND jsp.lon IS NOT NULL
                AND earth_distance(
                  ll_to_earth(jsp.lat, jsp.lon),
                  ll_to_earth(${coordinates.lat}, ${coordinates.lon})
                ) <= ${radiusMeters}
            ),
            filtered AS (
              SELECT jsp.id
              FROM jobseekerprofile jsp
              JOIN distance_candidates ON distance_candidates.id = jsp.id
              ${radiusWhereSql}
            )
            SELECT COUNT(*)::int AS total_count
            FROM filtered
          `;
          totalCount = Number(countResult?.[0]?.total_count ?? 0);
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

      const fallbackFilters = buildSqlFilters({
        trade,
        stateFilter,
        zip,
        keyword,
        includeZip: Boolean(zip),
      });
      const fallbackWhereSql = Prisma.sql`WHERE ${Prisma.join(
        fallbackFilters,
        Prisma.sql` AND `,
      )}`;
      const paginationSql = pagination.shouldPaginate
        ? Prisma.sql`LIMIT ${pagination.take} OFFSET ${pagination.skip}`
        : Prisma.empty;

      const countResult = await prisma.$queryRaw`
        SELECT COUNT(*)::int AS total_count
        FROM jobseekerprofile jsp
        ${fallbackWhereSql}
      `;
      totalCount = Number(countResult?.[0]?.total_count ?? 0);

      resumes = await prisma.$queryRaw`
        SELECT
          jsp.id,
          jsp."firstName",
          jsp."lastName",
          jsp.trade,
          jsp.city,
          jsp.state,
          jsp.phone,
          jsp."lastActive",
          jsp."resumeUrl",
          jsp."updated_at" AS "updatedAt",
          jsp."resume_updated_at" AS "resumeUpdatedAt"
        FROM jobseekerprofile jsp
        ${fallbackWhereSql}
        ORDER BY GREATEST(
          jsp."resume_updated_at",
          jsp."lastBump",
          jsp."last_bump"
        ) DESC NULLS LAST,
        jsp.id ASC
        ${paginationSql}
      `;
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
        updatedAt: candidate.updatedAt ?? null,
        resumeUpdatedAt: candidate.resumeUpdatedAt ?? null,
        distance: candidate.distance ?? null,
      }));

    res.status(200).json({ candidates: normalized, totalCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Resume search failed" });
  }
}
