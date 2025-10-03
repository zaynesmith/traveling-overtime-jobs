import { getServerSession } from "next-auth/next";
import authOptions from "../../../lib/authOptions";
import prisma from "../../../lib/prisma";
import { encodeProfile, decodeProfile } from "../../../lib/profileCodec";

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

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      role: "employer",
      employerProfile: encodeProfile(employerProfile),
    },
    select: { id: true, email: true, role: true, employerProfile: true },
  });

  return res.status(200).json({
    ...user,
    employerProfile: decodeProfile(user.employerProfile),
  });
}
