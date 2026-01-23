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
        const radiusKeywordLike = keyword ? `%${keyword}%` : null;
        const radiusWhereClauses = [
          Prisma.sql`jsp."resumeUrl" IS NOT NULL`,
          Prisma.sql`jsp."resumeUrl" <> ''`,
        ];

        if (trade) {
          radiusWhereClauses.push(Prisma.sql`jsp.trade = ${trade.toString()}`);
        }

        if (stateFilter) {
          radiusWhereClauses.push(Prisma.sql`jsp.state = ${stateFilter}`);
        }

        if (keyword) {
          radiusWhereClauses.push(
            Prisma.sql`(jsp."firstName" ILIKE ${radiusKeywordLike}
              OR jsp."lastName" ILIKE ${radiusKeywordLike}
              OR jsp.city ILIKE ${radiusKeywordLike}
              OR jsp.trade ILIKE ${radiusKeywordLike})`,
          );
        }
        const radiusWhereSql =
          radiusWhereClauses.length > 0
            ? Prisma.sql`WHERE ${Prisma.join(radiusWhereClauses, Prisma.sql` AND `)}`
            : Prisma.empty;
        const paginationSql = pagination.shouldPaginate
          ? Prisma.sql`LIMIT ${pagination.take} OFFSET ${pagination.skip}`
          : Prisma.empty;

        try {
          const radiusResultsQuery = Prisma.sql`
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
          resumes = await prisma.$queryRaw(radiusResultsQuery);
        } catch (error) {
          console.error(
            "resume search radius query failed",
            error?.meta?.message || error?.message,
          );
          throw error;
        }

        if (resumes.length) {
          totalCount = Number(resumes[0]?.total_count ?? 0);
        } else {
          try {
            const radiusCountQuery = Prisma.sql`
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
            const countResult = await prisma.$queryRaw(radiusCountQuery);
            totalCount = Number(countResult?.[0]?.total_count ?? 0);
          } catch (error) {
            console.error(
              "resume search radius count query failed",
              error?.meta?.message || error?.message,
            );
            throw error;
          }
        }
      }
    }

    if (!resumes.length && !radiusFilterApplied) {
      const fallbackKeywordLike = keyword ? `%${keyword}%` : null;
      const paginationSql = pagination.shouldPaginate
        ? Prisma.sql`LIMIT ${pagination.take} OFFSET ${pagination.skip}`
        : Prisma.empty;

      try {
        const fallbackCountQuery = Prisma.sql`
          SELECT COUNT(*)::int AS total_count
          FROM jobseekerprofile jsp
          WHERE jsp."resumeUrl" IS NOT NULL
            AND jsp."resumeUrl" <> ''
            ${trade ? Prisma.sql`AND jsp.trade = ${trade.toString()}` : Prisma.empty}
            ${stateFilter ? Prisma.sql`AND jsp.state = ${stateFilter}` : Prisma.empty}
            ${zip ? Prisma.sql`AND jsp.zip = ${zip.toString()}` : Prisma.empty}
            ${keyword ? Prisma.sql`AND (
              jsp."firstName" ILIKE ${fallbackKeywordLike}
              OR jsp."lastName" ILIKE ${fallbackKeywordLike}
              OR jsp.city ILIKE ${fallbackKeywordLike}
              OR jsp.trade ILIKE ${fallbackKeywordLike}
            )` : Prisma.empty}
        `;
        const countResult = await prisma.$queryRaw(fallbackCountQuery);
        totalCount = Number(countResult?.[0]?.total_count ?? 0);
      } catch (error) {
        console.error(
          "resume search fallback count query failed",
          error?.meta?.message || error?.message,
        );
        throw error;
      }

      try {
        const fallbackResultsQuery = Prisma.sql`
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
          WHERE jsp."resumeUrl" IS NOT NULL
            AND jsp."resumeUrl" <> ''
            ${trade ? Prisma.sql`AND jsp.trade = ${trade.toString()}` : Prisma.empty}
            ${stateFilter ? Prisma.sql`AND jsp.state = ${stateFilter}` : Prisma.empty}
            ${zip ? Prisma.sql`AND jsp.zip = ${zip.toString()}` : Prisma.empty}
            ${keyword ? Prisma.sql`AND (
              jsp."firstName" ILIKE ${fallbackKeywordLike}
              OR jsp."lastName" ILIKE ${fallbackKeywordLike}
              OR jsp.city ILIKE ${fallbackKeywordLike}
              OR jsp.trade ILIKE ${fallbackKeywordLike}
            )` : Prisma.empty}
          ORDER BY GREATEST(
            jsp."resume_updated_at",
            jsp."lastBump",
            jsp."last_bump"
          ) DESC NULLS LAST,
          jsp.id ASC
          ${paginationSql}
        `;
        resumes = await prisma.$queryRaw(fallbackResultsQuery);
      } catch (error) {
        console.error(
          "resume search fallback query failed",
          error?.meta?.message || error?.message,
        );
        throw error;
      }
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
