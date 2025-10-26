#!/usr/bin/env node
/**
 * This script performs read-only checks to ensure that the Supabase database
 * schema matches the expectations of the application code and that routing
 * logic aligns with stored user roles. It performs the following checks:
 *   1. Validates required columns, nullability, and key constraints for the
 *      user, employerprofile, and jobseekerprofile tables.
 *   2. Confirms foreign key alignment between profiles and users, and that
 *      stored roles only contain recognised values.
 *   3. Scans key authentication and registration pages to verify the routing
 *      destinations that are triggered after login or signup events.
 *
 * The script issues only SELECT queries and never mutates data.
 */

const fs = require("fs");
const path = require("path");
const process = require("process");
let PrismaClient;
try {
  ({ PrismaClient } = require("@prisma/client"));
} catch (error) {
  console.error(
    "@prisma/client is required to run this check. Install dependencies before executing the script."
  );
  process.exit(1);
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
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

loadEnvFile(path.resolve(process.cwd(), ".env.local"));

const connectionString =
  process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || "";

if (!connectionString) {
  console.error(
    "Database connection string not found. Set SUPABASE_DB_URL or DATABASE_URL."
  );
  process.exit(1);
}

process.env.DATABASE_URL = connectionString;

const expectedSchema = {
  user: {
    columns: {
      id: { type: "text", nullable: false },
      email: { type: "text", nullable: false, unique: true },
      passwordHash: { type: "text", nullable: false },
      role: { type: "text", nullable: false, defaultIncludes: "jobseeker" },
      created_at: { type: "timestamp without time zone", nullable: false },
      updated_at: { type: "timestamp without time zone", nullable: false },
    },
    unique: ["email"],
  },
  employerprofile: {
    columns: {
      id: { type: "text", nullable: false },
      companyName: { type: "text", nullable: false },
      firstName: { type: "text", nullable: false },
      lastName: { type: "text", nullable: false },
      phone: { type: "text", nullable: false },
      address1: { type: "text", nullable: false },
      address2: { type: "text", nullable: true },
      city: { type: "text", nullable: false },
      state: { type: "text", nullable: false },
      zip: { type: "text", nullable: false },
      officePhone: { type: "text", nullable: true },
      mobilePhone: { type: "text", nullable: true },
      website: { type: "text", nullable: true },
      timezone: { type: "text", nullable: true },
      location: { type: "text", nullable: true },
      notes: { type: "text", nullable: true },
      completedAt: { type: "timestamp without time zone", nullable: true },
      userId: { type: "text", nullable: false, unique: true },
    },
    unique: ["userId"],
    foreignKeys: [
      {
        column: "userId",
        foreignTable: "user",
        foreignColumn: "id",
      },
    ],
  },
  jobseekerprofile: {
    columns: {
      id: { type: "text", nullable: false },
      firstName: { type: "text", nullable: true },
      lastName: { type: "text", nullable: true },
      email: { type: "text", nullable: true },
      phone: { type: "text", nullable: true },
      address1: { type: "text", nullable: true },
      address2: { type: "text", nullable: true },
      city: { type: "text", nullable: true },
      state: { type: "text", nullable: true },
      zip: { type: "text", nullable: true },
      trade: { type: "text", nullable: true },
      resumeUrl: { type: "text", nullable: true },
      userId: { type: "text", nullable: false, unique: true },
    },
    unique: ["userId"],
    foreignKeys: [
      {
        column: "userId",
        foreignTable: "user",
        foreignColumn: "id",
      },
    ],
  },
};

const routingExpectations = [
  {
    file: "pages/employer/register.js",
    expectations: [
      {
        snippet: "router.push(\"/employer/dashboard\")",
        message:
          "Employer registration should navigate to the employer dashboard",
      },
      {
        snippet: "router.replace(\"/employer/dashboard\")",
        message:
          "Employers with active sessions should be redirected to their dashboard",
      },
      {
        snippet: "router.replace(\"/jobseeker/dashboard\")",
        message:
          "Employers should redirect jobseekers away from the employer registration form",
      },
    ],
  },
  {
    file: "pages/jobseeker/register.js",
    expectations: [
      {
        snippet: "router.push(\"/jobseeker/dashboard\")",
        message:
          "Jobseeker registration should navigate to the jobseeker dashboard",
      },
      {
        snippet: "router.replace(\"/jobseeker/dashboard\")",
        message:
          "Jobseekers with active sessions should be redirected to their dashboard",
      },
      {
        snippet: "router.replace(\"/employer/dashboard\")",
        message:
          "Jobseeker form should divert employers toward the employer dashboard",
      },
    ],
  },
  {
    file: "pages/employer/login.js",
    expectations: [
      {
        snippet: "router.push(\"/employer/dashboard\")",
        message: "Employer login success should land on employer dashboard",
      },
      {
        snippet: "router.replace(\"/jobseeker/dashboard\")",
        message:
          "Employer login should reroute jobseekers with active sessions",
      },
    ],
  },
  {
    file: "pages/jobseeker/login.js",
    expectations: [
      {
        snippet: "router.push(\"/jobseeker/dashboard\")",
        message: "Jobseeker login success should land on jobseeker dashboard",
      },
      {
        snippet: "router.replace(\"/employer/dashboard\")",
        message:
          "Jobseeker login should reroute employers with active sessions",
      },
    ],
  },
  {
    file: "lib/authOptions.js",
    expectations: [
      {
        snippet: "session.user.role = token.role",
        message:
          "Session callback must propagate the database role to the client session",
      },
      {
        snippet: "token.role = user.role",
        message:
          "JWT callback must persist the role so that routing can reference it",
      },
    ],
  },
];

async function fetchColumns(prisma, tableName) {
  return prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = ${tableName}
  `;
}

async function fetchUniqueColumns(prisma, tableName) {
  const rows = await prisma.$queryRaw`
    SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
     WHERE tc.constraint_type = 'UNIQUE'
       AND tc.table_schema = 'public'
       AND tc.table_name = ${tableName}
  `;
  return rows.map((row) => row.column_name);
}

async function fetchForeignKeys(prisma, tableName) {
  return prisma.$queryRaw`
    SELECT kcu.column_name,
           ccu.table_name AS foreign_table_name,
           ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
     WHERE tc.constraint_type = 'FOREIGN KEY'
       AND tc.table_schema = 'public'
       AND tc.table_name = ${tableName}
  `;
}

function compareSchema(tableName, actualColumns, expected) {
  const issues = [];
  if (!actualColumns.length) {
    issues.push(`Table \"${tableName}\" is missing in the database.`);
    return issues;
  }

  const columnMap = new Map(
    actualColumns.map((column) => [column.column_name, column])
  );

  for (const [columnName, definition] of Object.entries(expected.columns)) {
    const actual = columnMap.get(columnName);
    if (!actual) {
      issues.push(`Missing column ${tableName}.${columnName}`);
      continue;
    }

    if (definition.type && actual.data_type !== definition.type) {
      issues.push(
        `Column ${tableName}.${columnName} has type ${actual.data_type}, expected ${definition.type}`
      );
    }

    const isNullable = actual.is_nullable === "YES";
    if (definition.nullable === false && isNullable) {
      issues.push(`Column ${tableName}.${columnName} should be NOT NULL.`);
    }

    if (definition.nullable === true && !isNullable) {
      issues.push(`Column ${tableName}.${columnName} should allow NULL values.`);
    }

    if (definition.defaultIncludes) {
      const defaultValue = actual.column_default || "";
      if (!defaultValue.includes(definition.defaultIncludes)) {
        issues.push(
          `Column ${tableName}.${columnName} default does not include "${definition.defaultIncludes}". Found: ${defaultValue}`
        );
      }
    }
  }

  for (const columnName of Object.keys(expected.columns)) {
    if (!columnMap.has(columnName)) {
      issues.push(`Column ${tableName}.${columnName} is required but missing.`);
    }
  }

  return issues;
}

function compareUniqueConstraints(tableName, actualUniqueColumns, expected) {
  const issues = [];
  const uniqueSet = new Set(actualUniqueColumns);
  for (const column of expected.unique || []) {
    if (!uniqueSet.has(column)) {
      issues.push(
        `Unique constraint missing for ${tableName}.${column} (required for profile alignment).`
      );
    }
  }
  return issues;
}

function compareForeignKeys(tableName, actualForeignKeys, expected) {
  const issues = [];
  for (const fk of expected.foreignKeys || []) {
    const match = actualForeignKeys.find(
      (row) =>
        row.column_name === fk.column &&
        row.foreign_table_name === fk.foreignTable &&
        row.foreign_column_name === fk.foreignColumn
    );
    if (!match) {
      issues.push(
        `Foreign key missing for ${tableName}.${fk.column} -> ${fk.foreignTable}.${fk.foreignColumn}.`
      );
    }
  }
  return issues;
}

async function checkDataAlignment(prisma) {
  const issues = [];

  const roleRows = await prisma.$queryRaw`
    SELECT role, COUNT(*) FROM "user" GROUP BY role
  `;
  const allowedRoles = new Set(["employer", "jobseeker"]);
  for (const row of roleRows) {
    if (!allowedRoles.has(row.role)) {
      issues.push(
        `Unexpected role value "${row.role}" detected in user table. Only employer/jobseeker are supported.`
      );
    }
  }

  const [invalidEmployerRows] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS invalid_count
      FROM employerprofile ep
      LEFT JOIN "user" u ON u.id = ep."userId"
     WHERE u.role IS DISTINCT FROM 'employer'
  `;
  if (invalidEmployerRows?.invalid_count) {
    issues.push(
      `${invalidEmployerRows.invalid_count} employer profile(s) are linked to users without the employer role.`
    );
  }

  const [invalidJobseekerRows] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS invalid_count
      FROM jobseekerprofile jp
      LEFT JOIN "user" u ON u.id = jp."userId"
     WHERE u.role IS DISTINCT FROM 'jobseeker'
  `;
  if (invalidJobseekerRows?.invalid_count) {
    issues.push(
      `${invalidJobseekerRows.invalid_count} jobseeker profile(s) are linked to users without the jobseeker role.`
    );
  }

  return issues;
}

function checkRoutingExpectations(baseDir) {
  const issues = [];
  for (const entry of routingExpectations) {
    const filePath = path.join(baseDir, entry.file);
    if (!fs.existsSync(filePath)) {
      issues.push(`Routing file missing: ${entry.file}`);
      continue;
    }
    const contents = fs.readFileSync(filePath, "utf8");
    for (const expectation of entry.expectations) {
      if (!contents.includes(expectation.snippet)) {
        issues.push(`${entry.file}: ${expectation.message}`);
      }
    }
  }
  return issues;
}

async function main() {
  const prisma = new PrismaClient({
    log: process.env.DEBUG ? ["query"] : [],
  });
  const collectedIssues = [];

  try {
    for (const [tableName, expectation] of Object.entries(expectedSchema)) {
      const columns = await fetchColumns(prisma, tableName);
      const unique = await fetchUniqueColumns(prisma, tableName);
      const foreignKeys = await fetchForeignKeys(prisma, tableName);

      collectedIssues.push(
        ...compareSchema(tableName, columns, expectation),
        ...compareUniqueConstraints(tableName, unique, expectation),
        ...compareForeignKeys(tableName, foreignKeys, expectation)
      );
    }

    collectedIssues.push(...(await checkDataAlignment(prisma)));
  } catch (error) {
    console.error("Schema alignment check failed:", error.message);
    process.exit(1);
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.warn("Failed to close database connection", disconnectError.message);
    }
  }

  const codeIssues = checkRoutingExpectations(process.cwd());
  collectedIssues.push(...codeIssues);

  if (collectedIssues.length) {
    console.error("\nAlignment check detected the following issues:");
    for (const issue of collectedIssues) {
      console.error(` - ${issue}`);
    }
    process.exit(1);
  }

  console.log("Supabase schema and routing alignment checks passed.");
}

main();
