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
    const user = await clerkClient.users.getUser(userId);
    const existingPublicMetadata = user?.publicMetadata || {};
    const mergedMetadata = {
      ...existingPublicMetadata,
      ...publicMetadata,
    };

    const updatedUser = await clerkClient.users.updateUser(userId, {
      publicMetadata: mergedMetadata,
    });

    return res.status(200).json({ publicMetadata: updatedUser.publicMetadata });
  } catch (error) {
    console.error("Failed to update public metadata", error);
    return res.status(500).json({ error: "Unable to update public metadata." });
  }
}
