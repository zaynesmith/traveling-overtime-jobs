import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { getSupabaseServiceClient } from "@/lib/supabaseServer";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

function normalizeString(value) {
  if (value == null) return null;
  const trimmed = `${value}`.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeLicensedStatesInput(value) {
  const rawStates = Array.isArray(value)
    ? value
    : typeof value === "string"
    ? value.split(",")
    : [];

  return rawStates
    .map((state) => normalizeString(state))
    .filter((state) => state !== null);
}

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

    const { profile = {}, resume } = req.body || {};

    const jobseekerProfile = await prisma.jobseekerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!jobseekerProfile) {
      return res.status(404).json({ error: "Jobseeker profile not found" });
    }

    const updateData = {};
    const keys = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "trade",
      "address1",
      "address2",
      "city",
      "state",
      "zip",
    ];

    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(profile, key)) {
        updateData[key] = normalizeString(profile[key]);
      }
    }

    if (Object.prototype.hasOwnProperty.call(profile, "hasJourneymanLicense")) {
      updateData.hasJourneymanLicense =
        profile.hasJourneymanLicense === true ||
        profile.hasJourneymanLicense === "yes" ||
        profile.hasJourneymanLicense === 1;
    }

    if (Object.prototype.hasOwnProperty.call(profile, "licensedStates")) {
      updateData.licensedStates = normalizeLicensedStatesInput(profile.licensedStates);
    }

    if (resume?.base64 && resume?.fileName) {
      const supabase = getSupabaseServiceClient();
      const base64Data = resume.base64.split(",").pop();
      if (base64Data) {
        const buffer = Buffer.from(base64Data, "base64");
        const filePath = `jobseeker-resumes/${jobseekerProfile.id}-${Date.now()}-${resume.fileName}`;
        const contentType = resume.fileType || "application/octet-stream";
        if (supabase) {
          const { error: uploadError } = await supabase.storage
            .from("resumes")
            .upload(filePath, buffer, { contentType, upsert: true });
          if (uploadError) {
            console.error(uploadError);
            return res.status(500).json({ error: "Failed to upload resume" });
          }
          const { data: publicData } = supabase.storage.from("resumes").getPublicUrl(filePath);
          updateData.resumeUrl = publicData?.publicUrl || null;
        } else {
          updateData.resumeUrl = resume.base64;
        }
      }
    } else if (profile.resumeUrl !== undefined) {
      updateData.resumeUrl = normalizeString(profile.resumeUrl);
    }

    const updated = await prisma.jobseekerProfile.update({
      where: { id: jobseekerProfile.id },
      data: updateData,
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update profile" });
  }
}
