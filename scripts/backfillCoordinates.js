import { createClient } from "@supabase/supabase-js";
import { geocodeZip } from "../lib/utils/geocode.js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function updateTable(table) {
  console.log(`\nChecking ${table}...`);
  const { data, error } = await supabase
    .from(table)
    .select("id, zip")
    .is("lat", null)
    .not("zip", "is", null);
  if (error) throw error;

  for (const row of data) {
    const geo = await geocodeZip(row.zip);
    if (geo) {
      await supabase
        .from(table)
        .update({ lat: geo.lat, lon: geo.lon })
        .eq("id", row.id);
      console.log(`✅ Updated ${table} row ${row.id} (${row.zip})`);
    } else {
      console.warn(`⚠️ Failed to geocode ZIP: ${row.zip}`);
    }
    await delay(1000);
  }
}

(async () => {
  try {
    await updateTable("jobs");
    await updateTable("jobseekerprofile");
    console.log("🎉 Backfill complete!");
  } catch (e) {
    console.error("❌ Error:", e);
  }
})();
