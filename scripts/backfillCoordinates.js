#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const process = require("process");
const { createClient } = require("@supabase/supabase-js");
const { geocodeZip } = require("../lib/utils/geocode");

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

loadEnvFile(path.resolve(process.cwd(), ".env"));
loadEnvFile(path.resolve(process.cwd(), ".env.local"));

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Supabase URL or Service Role Key missing. Aborting.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
  },
});

const coordinateCache = new Map();

async function updateCoordinates({ table, idColumn, zipColumn, label }) {
  console.log(`\nFetching ${label} records missing coordinates...`);

  const { data, error } = await supabase
    .from(table)
    .select(`${idColumn}, ${zipColumn}, lat, lon`)
    .or("lat.is.null,lon.is.null")
    .not(zipColumn, "is", null);

  if (error) {
    throw new Error(`Failed to query ${table}: ${error.message || error}`);
  }

  const rows = Array.isArray(data) ? data : [];

  if (!rows.length) {
    console.log(`No ${label.toLowerCase()} entries require backfilling.`);
    return;
  }

  for (const row of rows) {
    const id = row[idColumn];
    const rawZip = row[zipColumn];
    const trimmedZip = rawZip ? `${rawZip}`.trim() : "";

    if (!trimmedZip) {
      console.log(`${label} ${id}: missing ZIP, skipping.`);
      continue;
    }

    let coordinates = coordinateCache.get(trimmedZip);
    if (!coordinates) {
      console.log(`${label} ${id}: geocoding ZIP ${trimmedZip}...`);
      coordinates = await geocodeZip(trimmedZip);

      if (coordinates) {
        coordinateCache.set(trimmedZip, coordinates);
      }
    } else {
      console.log(`${label} ${id}: reusing cached coordinates for ZIP ${trimmedZip}.`);
    }

    if (!coordinates) {
      console.log(`${label} ${id}: no coordinates returned.`);
      continue;
    }

    const { error: updateError } = await supabase
      .from(table)
      .update({ lat: coordinates.lat, lon: coordinates.lon })
      .eq(idColumn, id)
      .limit(1);

    if (updateError) {
      console.error(`${label} ${id}: failed to update coordinates.`, updateError);
    } else {
      console.log(
        `${label} ${id}: updated to lat ${coordinates.lat}, lon ${coordinates.lon}.`,
      );
    }
  }
}

(async () => {
  try {
    await updateCoordinates({
      table: "jobs",
      idColumn: "id",
      zipColumn: "zip",
      label: "Job",
    });

    await updateCoordinates({
      table: "jobseekerprofile",
      idColumn: "id",
      zipColumn: "zip",
      label: "Jobseeker",
    });

    console.log("\nBackfill complete.");
    process.exit(0);
  } catch (error) {
    console.error("Backfill failed:", error);
    process.exit(1);
  }
})();
