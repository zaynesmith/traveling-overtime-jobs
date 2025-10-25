import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";

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

    const { jobId } = req.body || {};
    if (!jobId) {
      return res.status(400).json({ error: "Job ID is required" });
    }

    const jobseekerProfile = await prisma.jobseekerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!jobseekerProfile) {
      return res.status(400).json({ error: "Jobseeker profile not found" });
    }

    const job = await prisma.jobs.findUnique({
      where: { id: jobId },
      select: { id: true, employer_id: true },
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const existingApplication = await prisma.applications.findFirst({
      where: {
        job_id: jobId,
        jobseeker_id: jobseekerProfile.id,
      },
    });

    if (existingApplication) {
      return res.status(409).json({ error: "You have already applied to this job." });
    }

    const application = await prisma.applications.create({
      data: {
        job_id: job.id,
        jobseeker_id: jobseekerProfile.id,
        applied_at: new Date(),
        status: "pending",
      },
      include: {
        jobs: true,
      },
    });

    res.status(201).json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to apply" });
  }
}
