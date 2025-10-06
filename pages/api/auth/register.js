import { hash } from "bcryptjs";
import prisma from "../../../lib/prisma";

function sanitize(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const payload = req.body || {};
  const role = payload.role;
  const email = payload.email;
  const password = payload.password;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Email, password, and role are required." });
  }

  if (role !== "employer" && role !== "jobseeker") {
    return res.status(400).json({ error: "Invalid role specified." });
  }

  const normalizedEmail = email.toLowerCase();

  const employerProfile = role === "employer" ? buildEmployerProfile(payload) : null;
  if (role === "employer" && employerProfile instanceof Error) {
    return res.status(400).json({ error: employerProfile.message });
  }

  const jobseekerProfile = role === "jobseeker" ? buildJobseekerProfile(payload, normalizedEmail) : null;
  if (role === "jobseeker" && jobseekerProfile instanceof Error) {
    return res.status(400).json({ error: jobseekerProfile.message });
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return res.status(409).json({ error: "An account already exists for that email." });
  }

  const passwordHash = await hash(password, 12);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role,
          jobseekerProfile:
            jobseekerProfile && !(jobseekerProfile instanceof Error)
              ? { create: jobseekerProfile }
              : undefined,
        },
      });

      if (role === "employer" && employerProfile && !(employerProfile instanceof Error)) {
        const userId = typeof createdUser.id === "string" ? createdUser.id.trim() : "";
        if (!userId) {
          throw new Error("Unable to create employer profile: user ID is missing or invalid.");
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

    return res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    console.error("register error", error);
    return res.status(500).json({ error: "Unable to create account." });
  }
}

function buildEmployerProfile(payload) {
  const companyName = sanitize(payload.companyName);
  const firstName = sanitize(payload.firstName);
  const lastName = sanitize(payload.lastName);
  const email = sanitize(payload.email);
  const mobilePhone = sanitize(payload.mobilePhone ?? payload.mobilephone);
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
    officePhone: sanitize(payload.officePhone),
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

function buildJobseekerProfile(payload, email) {
  const trade = sanitize(payload.trade);
  if (!trade) {
    return new Error("Trade selection is required.");
  }

  return {
    firstName: sanitize(payload.firstName),
    lastName: sanitize(payload.lastName),
    email,
    address1: sanitize(payload.address1),
    address2: sanitize(payload.address2),
    city: sanitize(payload.city),
    state: sanitize(payload.state),
    zip: sanitize(payload.zipCode),
    trade,
  };
}
