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
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role,
        employerProfile: employerProfile && !(employerProfile instanceof Error) ? { create: employerProfile } : undefined,
        jobseekerProfile: jobseekerProfile && !(jobseekerProfile instanceof Error) ? { create: jobseekerProfile } : undefined,
      },
    });

    return res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    console.error("register error", error);
    return res.status(500).json({ error: "Unable to create account." });
  }
}

function buildEmployerProfile(payload) {
  const companyName = sanitize(payload.companyName);
  if (!companyName) {
    return new Error("Company name is required.");
  }

  return {
    companyName,
    officePhone: sanitize(payload.officePhone),
    mobilePhone: sanitize(payload.mobilePhone),
    address1: sanitize(payload.address1),
    address2: sanitize(payload.address2),
    city: sanitize(payload.city),
    state: sanitize(payload.state),
    zip: sanitize(payload.zipCode),
    website: sanitize(payload.website),
    timezone: sanitize(payload.timezone),
  };
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
