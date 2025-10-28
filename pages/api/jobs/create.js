import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { normalizeTrade } from "@/lib/trades";
import { geocodeZip, validateZip } from "@/lib/utils/geocode";

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

    if (!title || !trade || !description) {
      return res.status(400).json({ error: "Title, trade, and description are required." });
    }

    const zipValidation = await validateZip(trimmedZip, trimmedCity, trimmedState);
    if (!zipValidation.valid) {
      const suggestionMessage = zipValidation.suggestion
        ? `That ZIP was unrecognized. Try using ${zipValidation.suggestion.zip} from ${
            [zipValidation.suggestion.city, zipValidation.suggestion.state].filter(Boolean).join(", ")
          } instead.`
        : "We couldn’t find that ZIP. Please double-check or enter one from your area.";
      return res.status(400).json({
        error: suggestionMessage,
        message: suggestionMessage,
        code: zipValidation.suggestion ? "ZIP_SUGGESTION" : "ZIP_INVALID",
        suggestion: zipValidation.suggestion,
      });
    }

    const combinedLocation = [trimmedCity, trimmedState].filter(Boolean).join(", ");
    const normalizedTrade = normalizeTrade(trade);

    const job = await prisma.jobs.create({
      data: {
        title,
        trade: normalizedTrade,
        description,
        location: combinedLocation || null,
        city: trimmedCity || null,
        state: trimmedState || null,
        zip: trimmedZip || null,
        hourly_pay: hourly_pay || null,
        per_diem: per_diem || null,
        additional_requirements: additional_requirements || null,
        employer_id: employerProfile.id,
        showFirstName: Boolean(showFirstName),
        showEmail: Boolean(showEmail),
        showPhone: Boolean(showPhone),
      },
    });

    const geo = await geocodeZip(trimmedZip);
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
