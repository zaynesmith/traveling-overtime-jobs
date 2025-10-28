import { hash } from "bcryptjs";
import prisma from "../../../lib/prisma";
import { getSupabaseServiceClient } from "../../../lib/supabaseServer";
import { validateZip } from "@/lib/utils/geocode";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sanitize(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function sanitizeLicensedStates(input) {
  const rawStates = Array.isArray(input)
    ? input
    : typeof input === "string"
    ? input.split(",")
    : [];

  return rawStates.map((state) => sanitize(state)).filter(Boolean);
}

function sanitizeFileName(fileName) {
  if (typeof fileName !== "string") {
    return `resume-${Date.now()}`;
  }
  const trimmed = fileName.trim().replace(/[\\/]/g, "_");
  if (!trimmed) {
    return `resume-${Date.now()}`;
  }
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function uploadJobseekerResume(userId, resume) {
  if (!userId) {
    throw new Error("User ID is required for resume upload");
  }

  const base64String = typeof resume.base64 === "string" ? resume.base64 : "";
  const base64Data = base64String.includes(",") ? base64String.split(",").pop() : base64String;
  if (!base64Data) {
    throw new Error("Invalid resume payload");
  }

  const buffer = Buffer.from(base64Data, "base64");
  const fileName = sanitizeFileName(resume.fileName);
  const contentType = typeof resume.fileType === "string" && resume.fileType ? resume.fileType : "application/octet-stream";
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    console.warn("Supabase client unavailable during registration resume upload");
    return resume.base64;
  }

  const storage = supabase.storage.from("resumes");
  const filePath = `jobseekers/${userId}/${fileName}`;
  const { error: uploadError } = await storage.upload(filePath, buffer, { contentType, upsert: true });
  if (uploadError) {
    throw uploadError;
  }

  const { data: publicData, error: publicError } = storage.getPublicUrl(filePath);
  if (publicError) {
    throw publicError;
  }

  const publicUrl = publicData?.publicUrl;
  if (!publicUrl) {
    throw new Error("Unable to retrieve public resume URL");
  }

  return publicUrl;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      throw new HttpError(405, "Method Not Allowed");
    }

    const payload = req.body || {};
    const role = payload.role;
    const email = payload.email;
    const password = payload.password;

    const safeLogPayload = { ...payload };
    if (safeLogPayload.password) {
      safeLogPayload.password = "[REDACTED]";
    }
    if (safeLogPayload.resume?.base64) {
      safeLogPayload.resume = {
        ...safeLogPayload.resume,
        base64: `[${safeLogPayload.resume.base64.length}]`,
      };
    }
    console.log("Incoming registration payload", safeLogPayload);

    if (!email || !password || !role) {
      throw new HttpError(400, "Email, password, and role are required.");
    }

    if (role !== "employer" && role !== "jobseeker") {
      throw new HttpError(400, "Invalid role specified.");
    }

    const normalizedEmail = email.toLowerCase();

    if (role === "employer") {
      const requiredEmployerFields = {
        firstName: sanitize(payload.firstName),
        lastName: sanitize(payload.lastName),
        companyName: sanitize(payload.companyName),
        mobilePhone: sanitize(payload.mobilePhone ?? payload.mobilephone),
        email: sanitize(payload.email),
        addressLine1: sanitize(payload.addressLine1 ?? payload.address1),
        city: sanitize(payload.city),
        state: sanitize(payload.state),
        zip: sanitize(payload.zip ?? payload.zipCode),
      };

      for (const [field, value] of Object.entries(requiredEmployerFields)) {
        if (!value) {
          console.warn(`Missing required field during employer registration: ${field}`);
          throw new HttpError(400, `Missing required field: ${field}`);
        }
      }
    }

    if (role === "jobseeker") {
      const sanitizedCity = sanitize(payload.city);
      const sanitizedState = sanitize(payload.state);
      const sanitizedZip = sanitize(payload.zip ?? payload.zipCode);
      const zipValidation = await validateZip(sanitizedZip, sanitizedCity, sanitizedState);
      if (!zipValidation.valid) {
        const suggestionMessage = zipValidation.suggestion
          ? `That ZIP was unrecognized. Try using ${zipValidation.suggestion.zip} from ${
              [zipValidation.suggestion.city, zipValidation.suggestion.state].filter(Boolean).join(", ")
            } instead.`
          : "We couldn’t find that ZIP. Please double-check or enter one from your area.";
        res.status(400).json({
          error: suggestionMessage,
          message: suggestionMessage,
          code: zipValidation.suggestion ? "ZIP_SUGGESTION" : "ZIP_INVALID",
          suggestion: zipValidation.suggestion,
        });
        return;
      }
    }

    const employerProfile = role === "employer" ? buildEmployerProfile(payload) : null;
    if (role === "employer" && employerProfile instanceof Error) {
      throw new HttpError(400, employerProfile.message);
    }

    const jobseekerProfileData =
      role === "jobseeker" ? buildJobseekerProfile(payload, normalizedEmail) : null;
    if (role === "jobseeker" && jobseekerProfileData instanceof Error) {
      throw new HttpError(400, jobseekerProfileData.message);
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new HttpError(409, "An account already exists for that email.");
    }

    const passwordHash = await hash(password, 12);

    const createdUser = await prisma.$transaction(async (tx) => {
      const userCreateData =
        role === "jobseeker"
          ? {
              email: normalizedEmail,
              passwordHash,
              role: "jobseeker",
              jobseekerprofile: {
                create: jobseekerProfileData,
              },
            }
          : {
              email: normalizedEmail,
              passwordHash,
              role,
            };

      const createdUser = await tx.user.create({
        data: userCreateData,
      });

      if (role === "employer" && employerProfile && !(employerProfile instanceof Error)) {
        const rawId = createdUser.id;
        const userId = typeof rawId === "string" ? rawId.trim() : "";
        if (!userId) {
          console.error("User ID missing during employer registration", {
            createdUser,
          });
          throw new HttpError(400, "User ID missing during registration.");
        }

        console.log("Creating employer profile for user", userId);

        await tx.employerProfile.create({
          data: {
            ...employerProfile,
            userId,
          },
        });
      }

      return createdUser;
    });

    if (
      role === "jobseeker" &&
      createdUser?.id &&
      payload.resume?.base64 &&
      payload.resume?.fileName
    ) {
      try {
        const resumeUrl = await uploadJobseekerResume(createdUser.id, payload.resume);
        if (resumeUrl) {
          await prisma.jobseekerProfile.update({
            where: { userId: createdUser.id },
            data: { resumeUrl },
          });
        }
      } catch (error) {
        console.error("Failed to upload jobseeker resume during registration", error);
        await prisma.user
          .delete({ where: { id: createdUser.id } })
          .catch((cleanupError) => console.error("Failed to cleanup user after resume upload error", cleanupError));
        throw new HttpError(500, "Failed to upload resume. Your account was not created.");
      }
    }

    return res.status(201).json({ success: true });
  } catch (error) {
    const status = error instanceof HttpError || typeof error?.status === "number" ? error.status : 500;
    if (status >= 500) {
      console.error("Employer registration failure", error?.stack || error);
    } else {
      console.warn("Employer registration issue", error.message);
    }
    const message = error?.message || "An unexpected error occurred.";
    return res.status(status).json({ error: message });
  }
}

export function buildEmployerProfile(payload) {
  const companyName = sanitize(payload.companyName);
  const firstName = sanitize(payload.firstName);
  const lastName = sanitize(payload.lastName);
  const email = sanitize(payload.email);
  const mobilePhone = sanitize(payload.mobilePhone ?? payload.mobilephone);
  const officePhone = sanitize(payload.officePhone ?? payload.officephone);
  const address1 = sanitize(payload.addressLine1 ?? payload.address1);
  const city = sanitize(payload.city);
  const state = sanitize(payload.state);
  const zip = sanitize(payload.zip ?? payload.zipCode);

  if (!companyName) {
    return new Error("Company name is required.");
  }

  if (!firstName) {
    return new Error("First name is required.");
  }

  if (!lastName) {
    return new Error("Last name is required.");
  }

  if (!email) {
    return new Error("Email is required.");
  }

  if (!mobilePhone) {
    return new Error("Mobile phone is required.");
  }

  if (!address1) {
    return new Error("Address line 1 is required.");
  }

  if (!city) {
    return new Error("City is required.");
  }

  if (!state) {
    return new Error("State is required.");
  }

  if (!zip) {
    return new Error("Zip code is required.");
  }

  const profile = {
    companyName,
    firstName,
    lastName,
    phone: sanitize(payload.phone) || mobilePhone,
    address1,
    city,
    state,
    zip,
    mobilePhone,
  };

  const optionalFields = {
    address2: sanitize(payload.addressLine2 ?? payload.address2),
    officePhone,
    website: sanitize(payload.website),
    timezone: sanitize(payload.timezone),
    location: sanitize(payload.location),
    notes: sanitize(payload.notes),
  };

  for (const [key, value] of Object.entries(optionalFields)) {
    if (value) {
      profile[key] = value;
    }
  }

  return profile;
}

export function buildJobseekerProfile(payload, email) {
  const trade = sanitize(payload.trade);
  if (!trade) {
    return new Error("Trade selection is required.");
  }

  const mobilePhone = sanitize(payload.mobilePhone ?? payload.mobilephone ?? payload.phone);
  if (!mobilePhone) {
    return new Error("Mobile phone is required.");
  }

  const hasJourneymanLicense =
    payload.hasJourneymanLicense === true ||
    payload.hasJourneymanLicense === "yes" ||
    payload.hasJourneymanLicense === 1;

  const licensedStates = sanitizeLicensedStates(payload.licensedStates);

  if (hasJourneymanLicense && licensedStates.length === 0) {
    return new Error("At least one licensed state must be provided.");
  }

  const firstName = sanitize(payload.firstName);
  const lastName = sanitize(payload.lastName);
  const address1 = sanitize(payload.address1);
  const address2 = sanitize(payload.address2);
  const city = sanitize(payload.city);
  const state = sanitize(payload.state);
  const zip = sanitize(payload.zip ?? payload.zipCode);
  const resumeUrl = sanitize(payload.resumeUrl ?? payload.resumeURL);

  const profile = {
    email,
    phone: mobilePhone,
    address1,
    address2,
    city,
    state,
    zip,
    trade,
    hasJourneymanLicense,
    licensedStates,
  };

  const optionalFields = {
    firstName,
    lastName,
    resumeUrl,
  };

  for (const [key, value] of Object.entries(optionalFields)) {
    if (value !== null && value !== undefined) {
      profile[key] = value;
    }
  }

  return profile;
}
