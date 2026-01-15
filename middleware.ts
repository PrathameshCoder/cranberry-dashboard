// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect dashboard (and nested routes if you add later)
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (!isDashboardRoute) {
    return NextResponse.next();
  }

  const session = req.cookies.get("orchid_session")?.value;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// This tells Next.js which routes should run through the middleware
export const config = {
  matcher: ["/dashboard/:path*"],
};
