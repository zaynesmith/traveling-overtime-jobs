import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Allow Stripe webhook to bypass auth
  if (pathname.startsWith("/api/stripe/webhook")) {
    return NextResponse.next();
  }

  // existing middleware logic follows below...
  return NextResponse.next();
}
