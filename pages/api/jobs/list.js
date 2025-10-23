import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { getZipsWithinRadius } from "@/lib/zipDistance";

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
    const distance = radius ? parseInt(radius, 10) : undefined;

    let nearbyZips = [];
    if (zipCode && distance) {
      nearbyZips = getZipsWithinRadius(zipCode, distance);
    }

    const filters = {
      trade: trade ? trade.toString() : undefined,
      zip: nearbyZips.length ? { in: nearbyZips } : zipCode ? zipCode : undefined,
      OR: searchTerm
        ? [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
            { trade: { contains: searchTerm, mode: "insensitive" } },
            { location: { contains: searchTerm, mode: "insensitive" } },
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

    const jobs = await prisma.jobs.findMany({
      where: filters,
      orderBy: { posted_at: "desc" },
      include: {
        employerprofile: {
          select: { companyName: true, city: true, state: true },
        },
      },
    });

    res.status(200).json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load jobs" });
  }
}
