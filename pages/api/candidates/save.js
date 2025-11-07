import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";

async function requireEmployer(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id || session.user.role !== "employer") {
    throw new Error("FORBIDDEN");
  }

  const employerProfile = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, subscription_status: true, subscription_tier: true },
  });

  if (!employerProfile) {
    throw new Error("PROFILE_MISSING");
  }

  return employerProfile;
}

export default async function handler(req, res) {
  try {
    const employerProfile = await requireEmployer(req, res);

    if (req.method === "GET") {
      const saved = await prisma.saved_candidates.findMany({
        where: { employer_id: employerProfile.id },
        orderBy: { saved_at: "desc" },
        include: {
          jobseekerprofile: true,
        },
      });

      return res.status(200).json({
        saved,
        subscription: {
          status: employerProfile.subscription_status || "free",
          tier: employerProfile.subscription_tier || "basic",
        },
      });
    }

    if (req.method === "POST") {
      const { jobseekerId } = req.body || {};
      if (!jobseekerId) {
        return res.status(400).json({ error: "Jobseeker ID is required" });
      }

      const jobseeker = await prisma.jobseekerProfile.findUnique({
        where: { id: jobseekerId },
        select: { id: true },
      });

      if (!jobseeker) {
        return res.status(404).json({ error: "Jobseeker not found" });
      }

      const existing = await prisma.saved_candidates.findFirst({
        where: { employer_id: employerProfile.id, jobseeker_id: jobseekerId },
      });

      if (existing) {
        return res.status(200).json(existing);
      }

      const savedCandidate = await prisma.saved_candidates.create({
        data: {
          employerprofile: { connect: { id: employerProfile.id } },
          jobseekerprofile: { connect: { id: jobseekerId } },
        },
      });

      return res.status(200).json(savedCandidate);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ error: "Employer authentication required" });
    }
    if (error.message === "PROFILE_MISSING") {
      return res.status(404).json({ error: "Employer profile not found" });
    }
    console.error(error);
    return res.status(500).json({ error: "Failed to process saved candidates" });
  }
}
