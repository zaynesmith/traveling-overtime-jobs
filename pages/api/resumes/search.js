import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import { getZipsWithinRadius } from "@/lib/zipDistance";
import prisma from "@/lib/prisma";

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
    const nearbyZips = getZipsWithinRadius(zip, parseInt(radius, 10) || 50);

    const resumes = await prisma.jobseekerProfile.findMany({
      where: {
        trade: trade ? trade.toString() : undefined,
        zip: nearbyZips.length ? { in: nearbyZips } : undefined,
        OR: keyword
          ? [
              { firstName: { contains: keyword, mode: "insensitive" } },
              { lastName: { contains: keyword, mode: "insensitive" } },
              { city: { contains: keyword, mode: "insensitive" } },
              { trade: { contains: keyword, mode: "insensitive" } },
            ]
          : undefined,
      },
      orderBy: { lastActive: "desc" },
    });

    res.status(200).json(resumes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Resume search failed" });
  }
}
