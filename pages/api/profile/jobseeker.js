import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { getSupabaseServiceClient } from "@/lib/supabaseServer";
import { normalizeStateCode } from "@/lib/constants/states";
import { geocodeZip } from "@/lib/utils/geocode";
import { validateZip } from "@/lib/utils/validateZip";

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

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sanitizeStorageFileName(fileName = "") {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safeName.length ? safeName : `file-${Date.now()}`;
}

export default async function handler(req, res) {
  if (!['POST', 'PATCH'].includes(req.method)) {
    res.setHeader("Allow", ["POST", "PATCH"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id || session.user.role !== "jobseeker") {
      return res.status(403).json({ error: "Jobseeker authentication required" });
    }

    const { profile = {}, resume, newCertFiles } = req.body || {};

    const jobseekerProfile = await prisma.jobseekerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, certFiles: true, city: true, state: true, zip: true },
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
      "certifications",
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

    const supabase = getSupabaseServiceClient();

    const existingCertFiles = Array.isArray(jobseekerProfile.certFiles)
      ? jobseekerProfile.certFiles.filter((value) => typeof value === "string" && value.length)
      : [];

    let requestedCertFiles = existingCertFiles;
    if (Object.prototype.hasOwnProperty.call(profile, "certFiles")) {
      requestedCertFiles = Array.isArray(profile.certFiles)
        ? profile.certFiles
            .map((value) => normalizeString(value))
            .filter((value) => value !== null)
        : [];
    }

    const filesToRemove = existingCertFiles.filter((path) => !requestedCertFiles.includes(path));
    const uploadedCertFiles = [];

    const certUploads = Array.isArray(newCertFiles) ? newCertFiles : [];

    if (certUploads.length && !supabase) {
      return res.status(503).json({ error: "Storage service unavailable" });
    }

    for (const file of certUploads) {
      if (!file?.base64 || !file?.fileName) continue;
      const base64Data = file.base64.split(",").pop();
      if (!base64Data) continue;

      const buffer = Buffer.from(base64Data, "base64");
      const sanitizedFileName = sanitizeStorageFileName(file.fileName);
      const filePath = `certifications/${jobseekerProfile.id}/${Date.now()}-${sanitizedFileName}`;
      const contentType = file.fileType || "application/octet-stream";

      if (supabase) {
        const { error: uploadError } = await supabase.storage
          .from("certifications")
          .upload(filePath, buffer, { contentType, upsert: false });

        if (uploadError) {
          console.error(uploadError);
          return res.status(500).json({ error: "Failed to upload certification document" });
        }

        uploadedCertFiles.push(filePath);
      }
    }

    if (filesToRemove.length) {
      if (!supabase) {
        return res.status(503).json({ error: "Storage service unavailable" });
      }

      const { error: removeError } = await supabase.storage.from("certifications").remove(filesToRemove);
      if (removeError) {
        console.error(removeError);
      }
    }

    const combinedCertFiles = Array.from(new Set([...(requestedCertFiles || []), ...uploadedCertFiles]));
    if (requestedCertFiles !== existingCertFiles || uploadedCertFiles.length) {
      updateData.certFiles = combinedCertFiles;
    }

    if (resume?.base64 && resume?.fileName) {
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

    if (Object.prototype.hasOwnProperty.call(profile, "lastBump")) {
      updateData.lastBump = normalizeDate(profile.lastBump);
    }

    const hasCityUpdate = Object.prototype.hasOwnProperty.call(updateData, "city");
    const hasStateUpdate = Object.prototype.hasOwnProperty.call(updateData, "state");
    const hasZipUpdate = Object.prototype.hasOwnProperty.call(updateData, "zip");

    const requestedCity = hasCityUpdate ? updateData.city : jobseekerProfile.city;
    const requestedState = hasStateUpdate ? updateData.state : jobseekerProfile.state;
    const requestedZip = hasZipUpdate ? updateData.zip : jobseekerProfile.zip;

    const normalizedState = normalizeStateCode(requestedState) || null;
    const zipValidation = await validateZip(requestedZip, requestedCity, normalizedState);
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

    const normalizedZipValue = zipValidation.normalizedZip ?? (requestedZip || null);
    const resolvedCity = zipValidation.resolvedCity || null;
    const resolvedState = normalizeStateCode(zipValidation.resolvedState) || null;
    const currentCity = jobseekerProfile.city ?? null;
    const currentStateNormalized = normalizeStateCode(jobseekerProfile.state) || null;
    const currentState = currentStateNormalized || jobseekerProfile.state || null;
    const currentZip = jobseekerProfile.zip ?? null;

    const finalCity = hasCityUpdate
      ? requestedCity || resolvedCity || null
      : currentCity || resolvedCity || null;
    const finalState = hasStateUpdate
      ? normalizedState || resolvedState || null
      : currentState || resolvedState || null;
    const finalZip = hasZipUpdate
      ? normalizedZipValue
      : currentZip || normalizedZipValue;

    if (hasCityUpdate || finalCity !== currentCity) {
      updateData.city = finalCity;
    }
    if (hasStateUpdate || finalState !== jobseekerProfile.state) {
      updateData.state = finalState;
    }
    if (hasZipUpdate || finalZip !== currentZip) {
      updateData.zip = finalZip;
    }

    let updated = await prisma.jobseekerProfile.update({
      where: { id: jobseekerProfile.id },
      data: updateData,
    });

    const geo = await geocodeZip(updated?.zip);
    if (geo) {
      updated = await prisma.jobseekerProfile.update({
        where: { id: jobseekerProfile.id },
        data: { lat: geo.lat, lon: geo.lon },
      });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update profile" });
  }
}
