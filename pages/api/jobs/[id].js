import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (session.user?.role !== "employer") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const jobId = req.query.id;

  if (!jobId || typeof jobId !== "string") {
    res.status(400).json({ error: "Job id is required" });
    return;
  }

  const { default: prisma } = await import("@/lib/prisma");

  const job = await prisma.jobs.findUnique({
    where: { id: jobId },
    include: {
      employerprofile: { select: { userId: true } },
    },
  });

  if (!job || job.employerprofile?.userId !== session.user.id) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({
      id: job.id,
      title: job.title,
      trade: job.trade,
      description: job.description,
      city: job.city,
      state: job.state,
      zip: job.zip,
      hourly_pay: job.hourly_pay,
      per_diem: job.per_diem,
      additional_requirements: job.additional_requirements,
      posted_at: job.posted_at,
      showFirstName: job.showFirstName,
      showEmail: job.showEmail,
      showPhone: job.showPhone,
    });
    return;
  }

  if (req.method === "PATCH") {
    const payload = req.body || {};
    try {
      const updated = await prisma.jobs.update({
        where: { id: jobId },
        data: {
          title: payload.title ?? job.title,
          trade: payload.trade ?? job.trade,
          description: payload.description ?? job.description,
          city: payload.city ?? job.city,
          state: payload.state ?? job.state,
          zip: payload.zip ?? job.zip,
          hourly_pay: payload.hourly_pay ?? job.hourly_pay,
          per_diem: payload.per_diem ?? job.per_diem,
          additional_requirements:
            payload.additional_requirements ?? job.additional_requirements,
          showFirstName:
            typeof payload.showFirstName === "boolean"
              ? payload.showFirstName
              : job.showFirstName,
          showEmail:
            typeof payload.showEmail === "boolean"
              ? payload.showEmail
              : job.showEmail,
          showPhone:
            typeof payload.showPhone === "boolean"
              ? payload.showPhone
              : job.showPhone,
        },
      });

      res.status(200).json({ id: updated.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to update job" });
    }
    return;
  }

  if (req.method === "DELETE") {
    try {
      await prisma.applications.deleteMany({ where: { job_id: jobId } });
      await prisma.jobs.delete({ where: { id: jobId } });
      res.status(204).end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to delete job" });
    }
    return;
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
  res.status(405).json({ error: "Method not allowed" });
}
