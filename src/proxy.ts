import { type NextRequest, NextResponse } from "next/server";
import { COOKIE_ACCESS_TOKEN, COOKIE_EXPIRES_AT } from "@/lib/spotify";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") || pathname === "/profiles") {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(COOKIE_ACCESS_TOKEN)?.value;
  const expiresAt = request.cookies.get(COOKIE_EXPIRES_AT)?.value;

  const isAuthenticated =
    accessToken && expiresAt && Date.now() < parseInt(expiresAt, 10);

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/profiles", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
