import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { normalizeStateCode } from "@/lib/constants/states";
import { normalizeTrade } from "@/lib/trades";
import { geocodeZip } from "@/lib/utils/geocode";
import { validateZip } from "@/lib/utils/validateZip";

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
      showFirstName,
      showEmail,
      showPhone,
    } = req.body || {};

    const trimmedCity = typeof city === "string" ? city.trim() : city;
    const trimmedState = typeof state === "string" ? state.trim() : state;
    const trimmedZip = typeof zip === "string" ? zip.trim() : zip;
    const normalizedState = normalizeStateCode(trimmedState) || null;

    if (!title || !trade || !description) {
      return res.status(400).json({ error: "Title, trade, and description are required." });
    }

    const zipValidation = await validateZip(trimmedZip, trimmedCity, normalizedState);
    if (!zipValidation.valid) {
      const suggestion = zipValidation.suggestedZip
        ? {
            zip: zipValidation.suggestedZip,
            city: zipValidation.suggestedCity || null,
            state: zipValidation.suggestedState || null,
          }
        : null;

      return res.status(400).json({
        error: "Invalid ZIP",
        suggestion,
      });
    }

    const finalZip = zipValidation.normalizedZip ?? (trimmedZip || null);
    const resolvedCity = zipValidation.resolvedCity || null;
    const resolvedState = normalizeStateCode(zipValidation.resolvedState) || null;
    const finalCity = trimmedCity || resolvedCity || null;
    const finalState = normalizedState || resolvedState || null;

    const combinedLocation = [finalCity, finalState].filter(Boolean).join(", ");
    const normalizedTrade = normalizeTrade(trade);

    const job = await prisma.jobs.create({
      data: {
        title,
        trade: normalizedTrade,
        description,
        location: combinedLocation || null,
        city: finalCity,
        state: finalState,
        zip: finalZip,
        hourly_pay: hourly_pay || null,
        per_diem: per_diem || null,
        additional_requirements: additional_requirements || null,
        employerprofile: { connect: { id: employerProfile.id } },
        showFirstName: Boolean(showFirstName),
        showEmail: Boolean(showEmail),
        showPhone: Boolean(showPhone),
      },
    });

    const geo = await geocodeZip(finalZip);
    if (geo) {
      await prisma.jobs.update({
        where: { id: job.id },
        data: { lat: geo.lat, lon: geo.lon },
      });
      job.lat = geo.lat;
      job.lon = geo.lon;
    }

    res.status(200).json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create job" });
  }
}
