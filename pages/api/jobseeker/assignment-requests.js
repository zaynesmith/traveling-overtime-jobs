import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";

const PHASE_II_EMAIL = "zayne.smith18@gmail.com";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isPhaseTwoUser(session) {
  return String(session?.user?.email || "").toLowerCase() === PHASE_II_EMAIL;
}

async function getJobseekerProfileId(userId) {
  const profile = await prisma.jobseekerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  return profile?.id || null;
}

async function handleGet(req, res, session) {
  if (!isPhaseTwoUser(session)) {
    return res.status(404).json({ error: "Not found" });
  }

  const jobseekerProfileId = await getJobseekerProfileId(session.user.id);

  if (!jobseekerProfileId) {
    return res.status(200).json({ requests: [], message: "No jobseeker profile found" });
  }

  const requests = await prisma.$queryRaw(
    Prisma.sql`
      SELECT
        ar.id,
        ar.employer_id,
        ar.job_order_id,
        ar.hourly_pay,
        ar.per_diem,
        ar.message,
        ar.status,
        ar.sent_at,
        ar.responded_at,
        ep."companyName" AS employer_company_name
      FROM public.assignment_requests ar
      LEFT JOIN public.employerprofile ep ON ep.id = ar.employer_id
      WHERE ar.jobseeker_id = ${jobseekerProfileId}::uuid
      ORDER BY ar.sent_at DESC NULLS LAST, ar.created_at DESC NULLS LAST
    `,
  );

  return res.status(200).json({ requests });
}

async function handlePost(req, res, session) {
  if (!isPhaseTwoUser(session)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { requestId, decision } = req.body || {};
  if (!requestId || !["accept", "decline"].includes(decision)) {
    return res.status(400).json({ error: "Invalid request" });
  }

  if (!isUuid(requestId)) {
    return res.status(400).json({ error: "Invalid requestId" });
  }

  const jobseekerProfileId = await getJobseekerProfileId(session.user.id);
  if (!jobseekerProfileId) {
    return res.status(404).json({ error: "Jobseeker profile not found" });
  }

  const statusToSet = decision === "accept" ? "accepted" : "rejected";

  const updateResult = await prisma.$queryRaw(
    Prisma.sql`
      UPDATE public.assignment_requests
      SET status = ${statusToSet}, responded_at = NOW(), updated_at = NOW()
      WHERE id = ${requestId}::uuid
        AND jobseeker_id = ${jobseekerProfileId}::uuid
        AND status = 'pending'
      RETURNING id, status, responded_at
    `,
  );

  if (!Array.isArray(updateResult) || updateResult.length === 0) {
    return res.status(409).json({ error: "This assignment request is no longer pending" });
  }

  return res.status(200).json({ request: updateResult[0] });
}

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id || session.user.role !== "jobseeker") {
      return res.status(403).json({ error: "Jobseeker authentication required" });
    }

    if (req.method === "GET") {
      return await handleGet(req, res, session);
    }

    return await handlePost(req, res, session);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to process assignment requests" });
  }
}
