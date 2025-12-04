const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function extractIp(req) {
  const header = req?.headers?.["x-forwarded-for"] || req?.headers?.["x-real-ip"];
  if (typeof header === "string" && header.length) {
    return header.split(",")[0].trim();
  }
  return null;
}

export async function verifyTurnstileToken(token, req) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!token || !secret) {
    return false;
  }

  const payload = { secret, response: token };
  const remoteIp = extractIp(req);
  if (remoteIp) {
    payload.remoteip = remoteIp;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return Boolean(data?.success);
  } catch (error) {
    console.error("Turnstile verification error", error);
    return false;
  }
}

export function requireHumanOrThrow(success, message) {
  if (!success) {
    const error = new Error(message || "Unable to verify you’re human. Please try again.");
    error.status = 400;
    throw error;
  }
}
