import { cookies } from "next/headers";
import {
  SPOTIFY_TOKEN_URL,
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  COOKIE_EXPIRES_AT,
} from "@/lib/spotify";

export async function GET() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(COOKIE_REFRESH_TOKEN)?.value;

  if (!refreshToken) {
    return Response.json({ error: "no_refresh_token" }, { status: 401 });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!tokenResponse.ok) {
    return Response.json({ error: "refresh_failed" }, { status: 401 });
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
    `${COOKIE_EXPIRES_AT}=${expiresAt}; ${cookieOpts}; Max-Age=${tokens.expires_in}`,
  );

  if (tokens.refresh_token) {
    headers.append(
      "Set-Cookie",
      `${COOKIE_REFRESH_TOKEN}=${tokens.refresh_token}; ${cookieOpts}; Max-Age=${60 * 60 * 24 * 30}`,
    );
  }

  return Response.json({ ok: true, expiresAt }, { headers });
}
