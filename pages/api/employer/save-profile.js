import { getServerSession } from "next-auth/next";
import authOptions from "../../../lib/authOptions";
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const { profile } = req.body || {};
  if (!profile?.companyName) {
    return res.status(400).json({ error: "Company name is required." });
  }

  const employerProfile = {
    companyName: profile.companyName,
    website: profile.website || "",
    phone: profile.phone || "",
    location: profile.location || "",
    notes: profile.notes || "",
    completedAt: new Date().toISOString(),
  };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      role: "employer",
      employerProfile,
    },
  });

  return res.status(200).json({ success: true });
}
