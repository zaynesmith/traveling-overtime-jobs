import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

export default function middleware(req: NextRequest) {
  const { userId, sessionClaims } = getAuth(req);
  const url = req.nextUrl;
  const role = sessionClaims?.publicMetadata?.role;

  if (url.pathname.startsWith("/employer")) {
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in?intent=employer&redirect_url=/onboard", url));
    }
    if (role !== "employer") {
      return NextResponse.redirect(new URL("/unauthorized", url));
    }
  }

  if (url.pathname.startsWith("/jobseeker")) {
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in?intent=jobseeker&redirect_url=/onboard", url));
    }
    if (role !== "jobseeker") {
      return NextResponse.redirect(new URL("/unauthorized", url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/employer/:path*", "/jobseeker/:path*"],
};
