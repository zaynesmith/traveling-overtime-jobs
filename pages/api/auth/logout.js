const LEGACY_COOKIE_DOMAIN = ".travelingovertimejobs.com";

function expireCookie(name, overrides = {}) {
  const parts = [
    `${name}=`,
    "Path=/",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
    ...Object.entries(overrides).map(([key, value]) => `${key}=${value}`),
  ];

  return parts.join("; ");
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const secure = process.env.NODE_ENV === "production";
  const cookies = [
    expireCookie("next-auth.session-token"),
    expireCookie("__Secure-next-auth.session-token", secure ? { Secure: true } : {}),
    expireCookie("next-auth.callback-url"),
    expireCookie("next-auth.csrf-token"),
    expireCookie("next-auth.session-token", { Domain: LEGACY_COOKIE_DOMAIN }),
    expireCookie("__Secure-next-auth.session-token", {
      Domain: LEGACY_COOKIE_DOMAIN,
      ...(secure ? { Secure: true } : {}),
    }),
    expireCookie("next-auth.callback-url", { Domain: LEGACY_COOKIE_DOMAIN }),
    expireCookie("next-auth.csrf-token", { Domain: LEGACY_COOKIE_DOMAIN }),
  ];

  res.setHeader("Set-Cookie", cookies);
  return res.status(200).json({ ok: true });
}
