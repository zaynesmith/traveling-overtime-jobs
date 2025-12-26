import crypto from "crypto";
import prisma from "../../../lib/prisma";
import { sendEmail } from "../../../lib/email/sendgrid";

const GENERIC_MESSAGE = "If an account exists for that email, we sent a reset link.";

function normalizeRole(role) {
  return role === "employer" || role === "jobseeker" ? role : null;
}

function buildResetUrl(req, token, role) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (!baseUrl) {
    console.warn("APP_URL not configured");
    return null;
  }
  const resetUrl = new URL("/reset-password", baseUrl);
  resetUrl.searchParams.set("token", token);
  if (role) {
    resetUrl.searchParams.set("role", role);
  }
  return resetUrl.toString();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { email, role } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedRole = normalizeRole(role);

  if (!normalizedEmail) {
    return res.status(200).json({ message: GENERIC_MESSAGE });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const resetUrl = buildResetUrl(req, rawToken, normalizedRole);
      if (!resetUrl) {
        return res.status(200).json({ message: GENERIC_MESSAGE });
      }
      const subject = "Reset your Traveling Overtime Jobs password";
      const text = `We received a request to reset your Traveling Overtime Jobs password.\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.`;
      const html = `
        <p>We received a request to reset your Traveling Overtime Jobs password.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 1 hour.</p>
      `;

      await sendEmail({
        to: user.email,
        subject,
        text,
        html,
      });
    }
  } catch (error) {
    console.error("Forgot password request failed.");
  }

  return res.status(200).json({ message: GENERIC_MESSAGE });
}
