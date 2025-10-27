import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { getSupabaseServiceClient } from "@/lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(403).json({ error: "Authentication required" });
    }

    const rawProfileId = Array.isArray(req.query?.profileId) ? req.query.profileId[0] : req.query?.profileId;
    const rawPath = Array.isArray(req.query?.path) ? req.query.path[0] : req.query?.path;

    if (!rawProfileId || !rawPath) {
      return res.status(400).json({ error: "profileId and path are required" });
    }

    const jobseekerProfile = await prisma.jobseekerProfile.findUnique({
      where: { id: rawProfileId.toString() },
      select: { id: true, userId: true, certFiles: true },
    });

    if (!jobseekerProfile) {
      return res.status(404).json({ error: "Jobseeker profile not found" });
    }

    const certFiles = Array.isArray(jobseekerProfile.certFiles) ? jobseekerProfile.certFiles : [];
    if (!certFiles.includes(rawPath)) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (session.user.role === "jobseeker") {
      if (jobseekerProfile.userId !== session.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else if (session.user.role !== "employer") {
      return res.status(403).json({ error: "Access denied" });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return res.status(503).json({ error: "Storage service unavailable" });
    }

    const { data, error } = await supabase.storage.from("certifications").createSignedUrl(rawPath.toString(), 60 * 60);
    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to generate document link" });
    }

    if (!data?.signedUrl) {
      return res.status(500).json({ error: "Unable to generate document link" });
    }

    return res.status(200).json({ url: data.signedUrl });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to load certification document" });
  }
}
