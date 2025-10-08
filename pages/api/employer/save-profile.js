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

  const existingProfileRecord = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
  });

  const existingProfile = existingProfileRecord
    ? decodeProfile(existingProfileRecord)
    : {};

  const incomingProfile = profile || {};

  const mergedProfile = {
    ...existingProfile,
    ...incomingProfile,
  };

  mergedProfile.completedAt =
    incomingProfile?.completedAt || existingProfile?.completedAt || new Date().toISOString();

  let employerProfileData;
  try {
    employerProfileData = encodeProfile(mergedProfile);
  } catch (error) {
    return res
      .status(400)
      .json({ error: error?.message || "Invalid employer profile payload." });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      role: "employer",
      employerProfile: {
        upsert: {
          update: employerProfileData,
          create: employerProfileData,
        },
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      employerProfile: {
        select: {
          companyName: true,
          firstName: true,
          lastName: true,
          website: true,
          phone: true,
          address1: true,
          address2: true,
          city: true,
          state: true,
          zip: true,
          mobilePhone: true,
          officePhone: true,
          location: true,
          timezone: true,
          notes: true,
          completedAt: true,
        },
      },
    },
  });

  return res.status(200).json({
    ...user,
    employerProfile: decodeProfile(user.employerProfile),
  });
}
