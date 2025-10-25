import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { normalizeTrade } from "@/lib/trades";

async function getEmployerProfile(userId) {
  if (!userId) return null;
  return prisma.employerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
}

async function getJobForEmployer(jobId, employerId) {
  if (!jobId || !employerId) return null;
  return prisma.jobs.findFirst({
    where: { id: jobId, employer_id: employerId },
  });
}

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id || session.user.role !== "employer") {
    res.status(403).json({ error: "Employer authentication required" });
    return;
  }

  const employerProfile = await getEmployerProfile(session.user.id);
  if (!employerProfile) {
    res.status(400).json({ error: "Employer profile not found" });
    return;
  }

  if (method === "GET") {
    try {
      const job = await prisma.jobs.findFirst({
        where: { id, employer_id: employerProfile.id },
        include: {
          applications: {
            include: {
              jobseekerprofile: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
      });

      if (!job) {
        res.status(404).json({ error: "Job not found" });
        return;
      }

      res.status(200).json(job);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to load job" });
    }
    return;
  }

  if (method === "PUT") {
    try {
      const existing = await getJobForEmployer(id, employerProfile.id);
      if (!existing) {
        res.status(404).json({ error: "Job not found" });
        return;
      }

      const {
        title,
        description,
        city,
        state,
        zip,
        hourlyPay,
        perDiem,
        additionalRequirements,
        trade,
      } = req.body || {};

      const updateData = {};
      if (typeof title === "string" && title.trim()) updateData.title = title.trim();
      if (typeof description === "string") updateData.description = description;
      if (typeof city === "string") updateData.city = city;
      if (typeof state === "string") updateData.state = state;
      if (typeof zip === "string") updateData.zip = zip;
      if (typeof hourlyPay === "string") updateData.hourlyPay = hourlyPay;
      if (typeof perDiem === "string") updateData.perDiem = perDiem;
      if (typeof additionalRequirements === "string") updateData.additionalRequirements = additionalRequirements;
      if (typeof trade === "string" && trade.trim()) updateData.trade = normalizeTrade(trade.trim());

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ error: "No valid fields provided" });
        return;
      }

      if ("city" in updateData || "state" in updateData) {
        const nextCity = "city" in updateData ? updateData.city : existing.city;
        const nextState = "state" in updateData ? updateData.state : existing.state;
        const combinedLocation = [nextCity, nextState].filter(Boolean).join(", ");
        updateData.location = combinedLocation || null;
      }

      const updated = await prisma.jobs.update({
        where: { id: existing.id },
        data: updateData,
      });

      res.status(200).json({
        id: updated.id,
        title: updated.title,
        description: updated.description,
        city: updated.city,
        state: updated.state,
        zip: updated.zip,
        hourlyPay: updated.hourlyPay,
        perDiem: updated.perDiem,
        trade: updated.trade,
        location: updated.location,
        additionalRequirements: updated.additionalRequirements,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to update job" });
    }
    return;
  }

  if (method === "DELETE") {
    try {
      const existing = await getJobForEmployer(id, employerProfile.id);
      if (!existing) {
        res.status(404).json({ error: "Job not found" });
        return;
      }

      await prisma.jobs.delete({ where: { id: existing.id } });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to delete job" });
    }
    return;
  }

  res.setHeader("Allow", "GET,PUT,DELETE");
  res.status(405).json({ error: "Method Not Allowed" });
}
