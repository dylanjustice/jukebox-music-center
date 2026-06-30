import { type NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  SPOTIFY_TOKEN_URL,
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  COOKIE_EXPIRES_AT,
  COOKIE_AUTH_STATE,
} from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return Response.redirect(new URL("/api/auth/login", request.url));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(COOKIE_AUTH_STATE)?.value;

  if (!savedState || savedState !== state) {
    return Response.redirect(new URL("/api/auth/login", request.url));
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;

  const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    return Response.redirect(new URL("/api/auth/login", request.url));
  }

  const tokens = await tokenResponse.json();
  const expiresAt = Date.now() + tokens.expires_in * 1000;

  const cookieOpts = "HttpOnly; Path=/; SameSite=Lax";
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `${COOKIE_ACCESS_TOKEN}=${tokens.access_token}; ${cookieOpts}; Max-Age=${tokens.expires_in}`,
  );
  headers.append(
    "Set-Cookie",
    `${COOKIE_REFRESH_TOKEN}=${tokens.refresh_token}; ${cookieOpts}; Max-Age=${60 * 60 * 24 * 30}`,
  );
  headers.append(
    "Set-Cookie",
    `${COOKIE_EXPIRES_AT}=${expiresAt}; ${cookieOpts}; Max-Age=${tokens.expires_in}`,
  );
  headers.append(
    "Set-Cookie",
    `${COOKIE_AUTH_STATE}=; HttpOnly; Path=/; Max-Age=0`,
  );
  headers.set("Location", "/kiosk");

  return new Response(null, { status: 302, headers });
}
