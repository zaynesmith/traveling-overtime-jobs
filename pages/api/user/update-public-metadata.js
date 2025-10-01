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
    // (Optional) whitelist allowed keys to keep metadata tidy
    const allowed = new Set(["role", "employerProfile", "jobseekerProfile"]);
    const safe = Object.fromEntries(
      Object.entries(publicMetadata).filter(([k]) => allowed.has(k))
    );

    // IMPORTANT: use updateUserMetadata (NOT updateUser)
    // This will merge the provided keys into existing publicMetadata.
    const updated = await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: safe,
    });

    return res.status(200).json({ publicMetadata: updated.publicMetadata });
  } catch (error) {
    console.error("Failed to update public metadata", error);
    return res
      .status(500)
      .json({ error: error?.message || "Unable to update public metadata." });
  }
}
