import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { normalizeTrade } from "@/lib/trades";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
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
      return res.status(400).json({ error: "Employer profile not found" });
    }

    const {
      title,
      trade,
      description,
      city,
      state,
      zip,
      hourly_pay,
      per_diem,
      additional_requirements,
    } = req.body || {};

    if (!title || !trade || !description) {
      return res.status(400).json({ error: "Title, trade, and description are required." });
    }

    const combinedLocation = [city, state].filter(Boolean).join(", ");
    const normalizedTrade = normalizeTrade(trade);

    const job = await prisma.jobs.create({
      data: {
        title,
        trade: normalizedTrade,
        description,
        location: combinedLocation || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        hourly_pay: hourly_pay || null,
        per_diem: per_diem || null,
        additional_requirements: additional_requirements || null,
        employer_id: employerProfile.id,
      },
    });

    res.status(200).json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create job" });
  }
}
