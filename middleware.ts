import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "orchid_session";
const FORCE_COOKIE = "orchid_force_pw_change";

// Public paths that should never require auth
const PUBLIC_PATHS = ["/login"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Always allow Next internals & static files
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/assets") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$/)
  ) {
    return NextResponse.next();
  }

  // Always allow API routes (they do their own auth)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const force = req.cookies.get(FORCE_COOKIE)?.value === "1";
  const isChangePwPage = pathname.startsWith("/account/change-password");

  // ✅ If logged in and forced to change password, only allow change password page
  if (token && force && !isChangePwPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/account/change-password";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // ✅ Allow public pages if not logged in
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isPublic) {
    // ✅ If already logged in, don't stay on /login — go to next or dashboard
    if (token) {
      const next = req.nextUrl.searchParams.get("next");
      if (next && next.startsWith("/")) {
        // Support next containing querystring (e.g. /dashboard?year=2026)
        return NextResponse.redirect(new URL(next, req.url));
      }

      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ✅ Require session cookie for everything else
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    // include full path + query in next param
    url.searchParams.set("next", pathname + (search || ""));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
