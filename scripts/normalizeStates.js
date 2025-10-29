import prisma from "../lib/prisma.js";
import { normalizeStateCode } from "../lib/constants/states.js";
import { validateZip } from "../lib/utils/validateZip.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function normalizeStatesForModel(modelKey) {
  const client = prisma[modelKey];
  if (!client) {
    console.warn(`Skipping unknown model: ${modelKey}`);
    return;
  }

  console.log(`\nNormalizing state values for ${modelKey}...`);
  const records = await client.findMany({
    select: { id: true, state: true, zip: true },
  });

  for (const record of records) {
    const updates = {};
    const currentState = record.state || null;
    const normalizedState = normalizeStateCode(currentState);

    if (normalizedState && normalizedState !== currentState) {
      updates.state = normalizedState;
    }

    const needsLookup = !updates.state && !normalizedState && record.zip;
    if (needsLookup) {
      try {
        const validation = await validateZip(record.zip, null, null);
        if (validation.valid) {
          const resolvedState = normalizeStateCode(validation.resolvedState);
          if (resolvedState) {
            updates.state = resolvedState;
          }
        }
      } catch (error) {
        console.warn(`Lookup failed for ${modelKey} ${record.id} (${record.zip}):`, error.message);
      }
      await sleep(1100);
    }

    if (Object.keys(updates).length) {
      await client.update({ where: { id: record.id }, data: updates });
      console.log(`✔ Updated ${modelKey} ${record.id}:`, updates);
    }
  }
}

(async () => {
  try {
    await normalizeStatesForModel("jobs");
    await normalizeStatesForModel("jobseekerProfile");
    await normalizeStatesForModel("employerProfile");
    console.log("\nState normalization complete.");
  } catch (error) {
    console.error("State normalization failed:", error);
  } finally {
    await prisma.$disconnect();
  }
})();
