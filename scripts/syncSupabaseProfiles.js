#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }
    const [key, ...rest] = line.split("=");
    if (!key || rest.length === 0) {
      continue;
    }
    const value = rest.join("=").trim();
    if (!(key in process.env) && value) {
      process.env[key] = value.replace(/^['"]|['"]$/g, "");
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env"));
loadEnvFile(path.resolve(process.cwd(), ".env.local"));

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable");
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  process.exit(1);
}

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

const prisma = new PrismaClient();
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fetchExistingUserIds(table) {
  const ids = new Set();
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("userId", { head: false })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Failed to read existing ${table} rows: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const row of data) {
      if (row.userId) {
        ids.add(row.userId);
      }
    }

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return ids;
}

function buildEmployerProfile(user) {
  const companyName = deriveNameFromEmail(user.email, "Employer");
  const contactName = deriveNameFromEmail(user.email, "Team").split(" ");
  const firstName = contactName[0] || "Hiring";
  const lastName = contactName.slice(1).join(" ") || "Manager";

  return {
    userId: user.id,
    email: user.email,
    companyName,
    firstName,
    lastName,
    phone: null,
    address1: null,
    address2: null,
    city: null,
    state: null,
    zip: null,
    mobilePhone: null,
    officePhone: null,
    website: null,
    notes: null,
    location: null,
    timezone: null,
    completedAt: null,
    subscription_status: "free",
    subscription_tier: "basic",
    isSubscribed: false,
  };
}

function buildJobseekerProfile(user) {
  const fullName = deriveNameFromEmail(user.email, "Jobseeker");
  const [firstName, ...rest] = fullName.split(" ");
  const lastName = rest.join(" ");

  return {
    userId: user.id,
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
    certifications: null,
    certFiles: [],
    hasJourneymanLicense: false,
    licensedStates: [],
    last_bump: null,
  };
}

async function upsertProfiles(table, rows) {
  if (rows.length === 0) {
    return 0;
  }

  const chunkSize = 500;
  let totalInserted = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict: "userId" });

    if (error) {
      throw new Error(`Failed to upsert into ${table}: ${error.message}`);
    }

    totalInserted += chunk.length;
  }

  return totalInserted;
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
  });

  const [employerIds, jobseekerIds] = await Promise.all([
    fetchExistingUserIds("employerprofile"),
    fetchExistingUserIds("jobseekerprofile"),
  ]);

  const employerRows = [];
  const jobseekerRows = [];

  for (const user of users) {
    if (user.role === "employer" && !employerIds.has(user.id)) {
      employerRows.push(buildEmployerProfile(user));
    } else if (user.role === "jobseeker" && !jobseekerIds.has(user.id)) {
      jobseekerRows.push(buildJobseekerProfile(user));
    }
  }

  const [employerCount, jobseekerCount] = await Promise.all([
    upsertProfiles("employerprofile", employerRows),
    upsertProfiles("jobseekerprofile", jobseekerRows),
  ]);

  console.log(
    `Synced ${employerCount} employer profiles, ${jobseekerCount} jobseeker profiles`
  );
}

main()
  .catch((error) => {
    console.error("Failed to sync Supabase profiles", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
