import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
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

    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!employerProfile) {
      return res.status(404).json({ error: "Employer profile not found" });
    }

    const jobs = await prisma.jobs.findMany({
      where: { employer_id: employerProfile.id },
      orderBy: { posted_at: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        trade: true,
        location: true,
        city: true,
        state: true,
        zip: true,
        hourly_pay: true,
        per_diem: true,
        additional_requirements: true,
        posted_at: true,
        applications: {
          orderBy: { applied_at: "desc" },
          select: {
            id: true,
            status: true,
            applied_at: true,
            viewed_at: true,
            jobseekerprofile: {
              select: {
                firstName: true,
                lastName: true,
                trade: true,
                city: true,
                state: true,
                resumeUrl: true,
              },
            },
          },
        },
      },
    });

    const payload = jobs.map((job) => ({
      ...job,
      totalApplicants: job.applications.filter((application) => application.jobseekerprofile).length,
      newApplicantsCount: job.applications.filter(
        (application) => application.jobseekerprofile && !application.viewed_at,
      ).length,
      applications: job.applications.map((application) => ({
        id: application.id,
        status: application.status,
        applied_at: application.applied_at,
        viewed_at: application.viewed_at,
        jobseeker: application.jobseekerprofile
          ? {
              firstName: application.jobseekerprofile.firstName || "",
              lastName: application.jobseekerprofile.lastName || "",
              trade: application.jobseekerprofile.trade || "",
              city: application.jobseekerprofile.city || "",
              state: application.jobseekerprofile.state || "",
              resumeUrl: application.jobseekerprofile.resumeUrl || "",
            }
          : null,
      })),
    }));

    return res.status(200).json(payload);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to load employer applications" });
  }
}
