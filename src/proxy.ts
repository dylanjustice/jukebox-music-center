import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") || pathname === "/login") {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("spotify_access_token")?.value;
  const expiresAt = request.cookies.get("spotify_expires_at")?.value;

  const isAuthenticated =
    accessToken && expiresAt && Date.now() < parseInt(expiresAt, 10);

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/api/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
