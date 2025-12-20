import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import prisma from "../../../lib/prisma";
import { getSupabaseServiceClient } from "../../../lib/supabaseServer";
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

  return rawStates
    .map((state) => sanitize(state))
    .map((state) => {
      if (!state) return null;
      return normalizeStateCode(state) || state;
    })
    .filter(Boolean);
}

function sanitizeCertificationIds(input) {
  const rawList = Array.isArray(input)
    ? input
    : input === undefined || input === null
    ? []
    : [input];

  const normalized = rawList
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return Array.from(new Set(normalized));
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

function pruneUndefined(input) {
  return Object.fromEntries(
    Object.entries(input || {}).filter(([, value]) => value !== undefined)
  );
}

async function syncSupabaseProfile(supabase, table, payload) {
  if (!supabase) return;
  const cleanPayload = pruneUndefined(payload);
  if (!cleanPayload.userId) {
    throw new Error(`Supabase ${table} payload missing userId`);
  }

  const { error } = await supabase.from(table).upsert(cleanPayload, {
    onConflict: "userId",
  });

  if (error) {
    throw error;
  }
}

async function cleanupUserRecords(userId, supabase) {
  if (!userId) return;

  await prisma.user.delete({ where: { id: userId } }).catch((error) => {
    if (error?.code !== "P2025") {
      console.error("Failed to remove Prisma user during cleanup", error);
    }
  });

  if (supabase?.auth?.admin) {
    await supabase.auth.admin.deleteUser(userId).catch((error) => {
      console.error("Failed to remove Supabase auth user during cleanup", error);
    });
  }
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
    let certificationIds = [];

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
      certificationIds = sanitizeCertificationIds(payload.certificationIds);
      const normalizedState = normalizeStateCode(sanitizedState) || null;
      const zipValidation = await validateZip(sanitizedZip, sanitizedCity, normalizedState);
      if (!zipValidation.valid) {
        const suggestion = zipValidation.suggestedZip
          ? {
              zip: zipValidation.suggestedZip,
              city: zipValidation.suggestedCity || null,
              state: zipValidation.suggestedState || null,
            }
          : null;
        res.status(400).json({
          error: "Invalid ZIP",
          suggestion,
        });
        return;
      }

      const validatedZip = zipValidation.normalizedZip ?? sanitizedZip;
      const resolvedCity = zipValidation.resolvedCity || null;
      const resolvedState = normalizeStateCode(zipValidation.resolvedState) || null;

      payload.city = sanitizedCity || resolvedCity || null;
      payload.state = normalizedState || resolvedState || sanitizedState || null;
      payload.zip = validatedZip;
      payload.zipCode = validatedZip;
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new HttpError(409, "An account already exists for that email.");
    }

    const supabase = getSupabaseServiceClient();
    let supabaseUserId = null;

    if (supabase) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (signUpError) {
        const conflictMessage = typeof signUpError.message === "string" ? signUpError.message.toLowerCase() : "";
        if (conflictMessage.includes("registered")) {
          throw new HttpError(409, "An account already exists for that email.");
        }

        const statusCode = typeof signUpError.status === "number" ? signUpError.status : 500;
        throw new HttpError(statusCode, signUpError.message || "Failed to create authentication user.");
      }

      const authUser = signUpData?.user || null;
      supabaseUserId = authUser?.id || null;

    }

    const passwordHash = await hash(password, 12);

    const {
      user: createdUser,
      employerProfile: createdEmployerProfile,
      jobseekerProfile: createdJobseekerProfile,
    } = await (async () => {
      if (role === "employer") {
        const employerProfile = buildEmployerProfile(payload);
        if (employerProfile instanceof Error) {
          throw new HttpError(400, employerProfile.message);
        }

        return registerEmployer({
          employerProfile,
          normalizedEmail,
          passwordHash,
          supabaseUserId,
        });
      }

      const jobseekerProfileData = buildJobseekerProfile(payload, normalizedEmail);
      if (jobseekerProfileData instanceof Error) {
        throw new HttpError(400, jobseekerProfileData.message);
      }

      return registerJobseeker({
        jobseekerProfileData,
        normalizedEmail,
        passwordHash,
        supabaseUserId,
        certificationIds,
      });
    })();

    if (supabase && createdUser?.id) {
      try {
        if (role === "employer" && createdEmployerProfile) {
          await syncSupabaseProfile(supabase, "employerprofile", {
            id: createdEmployerProfile.id,
            userId: createdEmployerProfile.userId,
            companyName: createdEmployerProfile.companyName,
            firstName: createdEmployerProfile.firstName,
            lastName: createdEmployerProfile.lastName,
            phone: createdEmployerProfile.phone,
            mobilePhone: createdEmployerProfile.mobilePhone,
            officePhone: createdEmployerProfile.officePhone,
            address1: createdEmployerProfile.address1,
            address2: createdEmployerProfile.address2,
            city: createdEmployerProfile.city,
            state: createdEmployerProfile.state,
            zip: createdEmployerProfile.zip,
            website: createdEmployerProfile.website,
            timezone: createdEmployerProfile.timezone,
            location: createdEmployerProfile.location,
            notes: createdEmployerProfile.notes,
            email: createdEmployerProfile.email,
            subscription_status: createdEmployerProfile.subscription_status,
            subscription_tier: createdEmployerProfile.subscription_tier,
            plan: createdEmployerProfile.plan,
            isSubscribed: createdEmployerProfile.isSubscribed,
          });
        }

        if (role === "jobseeker" && createdJobseekerProfile) {
          await syncSupabaseProfile(supabase, "jobseekerprofile", {
            id: createdJobseekerProfile.id,
            userId: createdJobseekerProfile.userId,
            firstName: createdJobseekerProfile.firstName,
            lastName: createdJobseekerProfile.lastName,
            email: createdJobseekerProfile.email,
            phone: createdJobseekerProfile.phone,
            address1: createdJobseekerProfile.address1,
            address2: createdJobseekerProfile.address2,
            city: createdJobseekerProfile.city,
            state: createdJobseekerProfile.state,
            zip: createdJobseekerProfile.zip,
            trade: createdJobseekerProfile.trade,
            resumeUrl: createdJobseekerProfile.resumeUrl,
            licensedStates: createdJobseekerProfile.licensedStates,
            certFiles: createdJobseekerProfile.certFiles,
            hasJourneymanLicense: createdJobseekerProfile.hasJourneymanLicense,
            isSubscribed: createdJobseekerProfile.isSubscribed,
          });
        }
      } catch (syncError) {
        console.error("Failed to synchronize profile with Supabase", syncError);
        await cleanupUserRecords(createdUser.id, supabase);
        throw new HttpError(500, "Failed to finalize registration. Please try again.");
      }
    }

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
        await cleanupUserRecords(createdUser.id, supabase);
        throw new HttpError(500, "Failed to upload resume. Your account was not created.");
      }
    }

    return res.status(201).json({ success: true });
  } catch (error) {
    const status = error instanceof HttpError || typeof error?.status === "number" ? error.status : 500;
    if (status >= 500) {
      console.error("Registration failure", error?.stack || error);
    } else {
      console.warn("Registration issue", error.message);
    }
    const message = error?.message || "An unexpected error occurred.";
    return res.status(status).json({ error: message });
  }
}

async function registerEmployer({ employerProfile, normalizedEmail, passwordHash, supabaseUserId }) {
  return prisma.$transaction(async (tx) => {
    const userCreateData = {
      email: normalizedEmail,
      passwordHash,
      role: "employer",
    };

    if (supabaseUserId) {
      userCreateData.id = supabaseUserId;
    }

    const newUser = await tx.user.create({
      data: userCreateData,
    });

    const rawId = newUser.id;
    const userId = typeof rawId === "string" ? rawId.trim() : "";
    if (!userId) {
      console.error("User ID missing during employer registration", { newUser });
      throw new HttpError(400, "User ID missing during registration.");
    }

    console.log("Creating employer profile for user", userId);

    const employerCreateFields = pruneUndefined({
      ...employerProfile,
      plan: null,
      issubscribed: false,
      subscription_tier: null,
      subscription_status: "inactive",
      email: employerProfile.email ?? normalizedEmail,
    });

    const createData = {
      ...employerCreateFields,
      user: { connect: { id: userId } },
    };

    const updateData = pruneUndefined({
      ...employerProfile,
      email: employerProfile.email ?? normalizedEmail,
    });

    const employerProfileRecord = await tx.employerProfile.upsert({
      where: { userId },
      update: updateData,
      create: createData,
    });

    return {
      user: newUser,
      employerProfile: employerProfileRecord,
      jobseekerProfile: null,
    };
  });
}

async function registerJobseeker({
  jobseekerProfileData,
  normalizedEmail,
  passwordHash,
  supabaseUserId,
  certificationIds = [],
}) {
  return prisma.$transaction(async (tx) => {
    const userCreateData = {
      email: normalizedEmail,
      passwordHash,
      role: "jobseeker",
    };

    if (supabaseUserId) {
      userCreateData.id = supabaseUserId;
    }

    const newUser = await tx.user.create({
      data: userCreateData,
    });

    const userId = newUser.id;
    const geo = await geocodeZip(jobseekerProfileData.zip);
    const jobseekerCreateFields = pruneUndefined({
      ...jobseekerProfileData,
      email: jobseekerProfileData.email ?? normalizedEmail,
      licensedStates: jobseekerProfileData.licensedStates ?? [],
      certFiles: jobseekerProfileData.certFiles ?? [],
      hasJourneymanLicense: Boolean(jobseekerProfileData.hasJourneymanLicense),
      ...(geo ? { lat: geo.lat, lon: geo.lon } : {}),
    });

    const createData = {
      ...jobseekerCreateFields,
      user: { connect: { id: userId } },
    };

    const updateData = pruneUndefined({
      ...jobseekerProfileData,
      email: jobseekerProfileData.email ?? normalizedEmail,
      ...(geo ? { lat: geo.lat, lon: geo.lon } : {}),
    });

    const jobseekerProfileRecord = await tx.jobseekerProfile.upsert({
      where: { userId },
      update: updateData,
      create: createData,
    });

    if (Array.isArray(certificationIds) && certificationIds.length > 0) {
      const insertValues = certificationIds.map((certId) =>
        Prisma.sql`(${jobseekerProfileRecord.id}::uuid, ${certId}::uuid)`
      );

      await tx.$executeRaw`
        INSERT INTO public.jobseekerprofile_certifications (jobseekerprofile_id, certification_id)
        VALUES ${Prisma.join(insertValues)}
        ON CONFLICT DO NOTHING;
      `;
    }

    return {
      user: newUser,
      employerProfile: null,
      jobseekerProfile: jobseekerProfileRecord,
    };
  });
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
  const stateInput = sanitize(payload.state);
  const state = stateInput ? normalizeStateCode(stateInput) || stateInput : null;
  const zip = sanitize(payload.zip ?? payload.zipCode);
  const resumeUrl = sanitize(payload.resumeUrl ?? payload.resumeURL);
  const emailJobAlertsInput = payload.email_job_alerts;
  const emailJobAlerts =
    emailJobAlertsInput === undefined
      ? true
      : emailJobAlertsInput === true || emailJobAlertsInput === "true" || emailJobAlertsInput === 1;

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
    email_job_alerts: emailJobAlerts,
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
