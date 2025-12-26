import crypto from "crypto";
import { hash } from "bcryptjs";
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { token, password } = req.body || {};

  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Invalid or expired reset link." });
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const now = new Date();

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: {
        gt: now,
      },
    },
  });

  if (!resetToken) {
    return res.status(400).json({ error: "Invalid or expired reset link." });
  }

  const passwordHash = await hash(password, 12);

  const tokenConsumed = await prisma.$transaction(async (tx) => {
    const tokenUpdate = await tx.passwordResetToken.updateMany({
      where: { id: resetToken.id, usedAt: null },
      data: { usedAt: now },
    });

    if (tokenUpdate.count === 0) {
      return false;
    }

    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    return true;
  });

  if (!tokenConsumed) {
    return res.status(400).json({ error: "Invalid or expired reset link." });
  }

  return res.status(200).json({ message: "Password reset successful." });
}
