import Busboy from "busboy";
import { getSupabaseServiceClient } from "../../../lib/supabaseServer";
import sanitizeFileName from "@/lib/utils/sanitizeFileName";

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

const parseMultipart = (req) =>
  new Promise((resolve, reject) => {
    const fields = {};
    let file = null;
    let fileBuffer = null;
    let fileSizeExceeded = false;

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: MAX_FILE_SIZE_BYTES,
      },
    });

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("file", (name, stream, info) => {
      if (name !== "resume") {
        stream.resume();
        return;
      }

      const chunks = [];
      file = {
        originalFilename: info.filename,
        mimetype: info.mimeType,
      };

      stream.on("data", (data) => {
        chunks.push(data);
      });

      stream.on("limit", () => {
        fileSizeExceeded = true;
        stream.resume();
      });

      stream.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on("error", (error) => {
      reject(error);
    });

    busboy.on("finish", () => {
      if (fileSizeExceeded) {
        reject(Object.assign(new Error("File too large"), { code: "LIMIT_FILE_SIZE" }));
        return;
      }
      resolve({ fields, file, fileBuffer });
    });

    req.pipe(busboy);
  });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { fields, file, fileBuffer } = await parseMultipart(req);

    if (!file || !fileBuffer) {
      return res.status(400).json({ error: "Resume file is required." });
    }

    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      return res.status(413).json({ error: "Resume file exceeds the 15MB limit." });
    }

    const ownerId =
      typeof fields.userId === "string"
        ? fields.userId
        : typeof fields.tempId === "string"
        ? fields.tempId
        : null;

    if (!ownerId) {
      return res.status(400).json({ error: "A userId or tempId is required for resume upload." });
    }

    const fileName = sanitizeFileName(file.originalFilename || "resume");
    const contentType = file.mimetype || "application/octet-stream";
    const filePath = `jobseekers/${ownerId}/${fileName}`;

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: "Resume upload is currently unavailable." });
    }

    const storage = supabase.storage.from("resumes");
    const { error: uploadError } = await storage.upload(filePath, fileBuffer, {
      contentType,
      upsert: true,
    });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicData, error: publicError } = storage.getPublicUrl(filePath);
    if (publicError) {
      throw publicError;
    }

    const resumeUrl = publicData?.publicUrl;
    if (!resumeUrl) {
      return res.status(500).json({ error: "Unable to retrieve public resume URL." });
    }

    return res.status(200).json({ resumeUrl, filePath });
  } catch (error) {
    if (error?.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Resume file exceeds the 15MB limit." });
    }
    console.error("Failed to upload resume", error);
    return res.status(500).json({ error: "Failed to upload resume." });
  }
}
