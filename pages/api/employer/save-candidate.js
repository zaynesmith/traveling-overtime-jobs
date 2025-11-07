import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id || session.user.role !== "employer") {
      return res.status(403).json({ error: "Employer authentication required" });
    }

    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!employerProfile) {
      return res.status(404).json({ error: "Employer profile not found" });
    }

    if (req.method === "GET") {
      const saved = await prisma.saved_candidates.findMany({
        where: { employer_id: employerProfile.id },
        select: { jobseeker_id: true },
        orderBy: { saved_at: "desc" },
      });

      const jobseekerIds = saved
        .map((entry) => entry.jobseeker_id)
        .filter((value) => typeof value === "string");

      return res.status(200).json({ success: true, jobseekerIds });
    }

    const { employer_id: employerIdFromBody, jobseeker_id: jobseekerId } = req.body || {};

    if (!jobseekerId || typeof jobseekerId !== "string") {
      return res.status(400).json({ error: "jobseeker_id is required" });
    }

    if (employerIdFromBody && employerIdFromBody !== employerProfile.id) {
      return res.status(403).json({ error: "Employer mismatch" });
    }

    if (req.method === "POST") {
      const existing = await prisma.saved_candidates.findFirst({
        where: { employer_id: employerProfile.id, jobseeker_id: jobseekerId },
      });

      if (existing) {
        return res.status(200).json({ success: true });
      }

      await prisma.saved_candidates.create({
        data: {
          employerprofile: { connect: { id: employerProfile.id } },
          jobseekerprofile: { connect: { id: jobseekerId } },
        },
      });

      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      await prisma.saved_candidates.deleteMany({
        where: { employer_id: employerProfile.id, jobseeker_id: jobseekerId },
      });

      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update saved candidates" });
  }
}
