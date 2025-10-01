// pages/api/user/update-public-metadata.js
import { clerkClient, getAuth } from "@clerk/nextjs/server";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { publicMetadata } = req.body || {};
  if (!publicMetadata || typeof publicMetadata !== "object") {
    return res
      .status(400)
      .json({ error: "publicMetadata payload is required." });
  }

  try {
    // Optional: whitelist keys to keep metadata tidy
    const allowed = new Set(["role", "employerProfile", "jobseekerProfile"]);
    const safe = Object.fromEntries(
      Object.entries(publicMetadata).filter(([k]) => allowed.has(k))
    );

    // IMPORTANT: use updateUserMetadata (NOT updateUser) for metadata
    const updated = await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: safe, // merges into existing metadata
    });

    return res.status(200).json({ publicMetadata: updated.publicMetadata });
  } catch (error) {
    console.error("Failed to update public metadata", error);
    return res
      .status(500)
      .json({ error: error?.message || "Unable to update public metadata." });
  }
}
