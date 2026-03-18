import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login"];
const COOKIE_NAME = "collab-cockpit-auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const password = process.env.APP_PASSWORD?.trim();
  if (!password) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value?.trim();
  if (cookie === password) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api/health).*)"],
};
