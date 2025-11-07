#!/usr/bin/env node
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function randomSuffix() {
  return Math.random().toString(36).slice(2, 7);
}

function deriveNameFromEmail(email, fallbackPrefix) {
  if (typeof email !== "string" || !email.includes("@")) {
    return `${fallbackPrefix} ${randomSuffix()}`;
  }

  const localPart = email.split("@")[0];
  const cleaned = localPart.replace(/[^a-zA-Z0-9]+/g, " ").trim();

  if (!cleaned) {
    return `${fallbackPrefix} ${randomSuffix()}`;
  }

  const formatted = cleaned
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
    .trim();

  return formatted || `${fallbackPrefix} ${randomSuffix()}`;
}

async function ensureEmployerProfile(user) {
  if (user.employerProfile) {
    return false;
  }

  const companyName = deriveNameFromEmail(user.email, "Employer");
  const contactName = deriveNameFromEmail(user.email, "Team").split(" ");
  const firstName = contactName[0] || "Hiring";
  const lastName = contactName.slice(1).join(" ") || "Manager";

  await prisma.employerProfile.create({
    data: {
      companyName,
      firstName,
      lastName,
      phone: null,
      address1: null,
      city: null,
      state: null,
      zip: null,
      mobilePhone: null,
      officePhone: null,
      subscription_status: "free",
      subscription_tier: "basic",
      isSubscribed: false,
      email: user.email,
      user: { connect: { id: user.id } },
    },
  });

  return true;
}

async function ensureJobseekerProfile(user) {
  if (user.jobseekerprofile) {
    return false;
  }

  const fullName = deriveNameFromEmail(user.email, "Jobseeker");
  const [firstName, ...rest] = fullName.split(" ");
  const lastName = rest.join(" ");

  await prisma.jobseekerProfile.create({
    data: {
      email: user.email,
      firstName: firstName || null,
      lastName: lastName || null,
      phone: null,
      address1: null,
      address2: null,
      city: null,
      state: null,
      zip: null,
      trade: null,
      resumeUrl: null,
      licensedStates: [],
      certFiles: [],
      hasJourneymanLicense: false,
      isSubscribed: false,
      user: { connect: { id: user.id } },
    },
  });

  return true;
}

async function main() {
  const users = await prisma.user.findMany({
    include: {
      employerProfile: true,
      jobseekerprofile: true,
    },
  });

  let createdEmployers = 0;
  let createdJobseekers = 0;

  for (const user of users) {
    try {
      if (user.role === "employer") {
        if (await ensureEmployerProfile(user)) {
          createdEmployers += 1;
        }
      } else if (user.role === "jobseeker") {
        if (await ensureJobseekerProfile(user)) {
          createdJobseekers += 1;
        }
      }
    } catch (error) {
      console.error(`Failed to repair profile for user ${user.id}`, error);
    }
  }

  console.log(
    `Profile repair complete. Employers created: ${createdEmployers}, Jobseekers created: ${createdJobseekers}`
  );
}

main()
  .catch((error) => {
    console.error("Unexpected error while repairing profiles", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
