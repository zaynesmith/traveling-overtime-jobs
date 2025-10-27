import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id || session.user.role !== "jobseeker") {
      return res.status(403).json({ error: "Jobseeker authentication required" });
    }

    const profile = await prisma.jobseekerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, lastBump: true },
    });

    if (!profile) {
      return res.status(404).json({ error: "Jobseeker profile not found" });
    }

    const lastBump = profile.lastBump ? new Date(profile.lastBump).getTime() : 0;
    const now = Date.now();

    if (lastBump && now - lastBump < SEVEN_DAYS_MS) {
      const remaining = SEVEN_DAYS_MS - (now - lastBump);
      const nextEligibleDate = new Date(lastBump + SEVEN_DAYS_MS);
      return res.status(429).json({
        error: "Resume bump is limited to once every 7 days.",
        retryAfter: Math.ceil(remaining / (24 * 60 * 60 * 1000)),
        nextEligibleDate: nextEligibleDate.toISOString(),
      });
    }

    const nowDate = new Date();
    const updated = await prisma.jobseekerProfile.update({
      where: { id: profile.id },
      data: { lastBump: nowDate, lastActive: nowDate },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to bump resume" });
  }
}
