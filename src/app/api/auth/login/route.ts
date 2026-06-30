import { type NextRequest } from "next/server";
import {
  SPOTIFY_AUTH_URL,
  COOKIE_AUTH_STATE,
  COOKIE_REGISTER,
} from "@/lib/spotify";
import { readProfiles } from "@/lib/profiles";

const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-read-email",
].join(" ");

export function GET(request: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
  const { searchParams } = request.nextUrl;

  const profileId = searchParams.get("profile");
  const register = searchParams.get("register") === "true";

  let loginHint: string | null = null;
  if (profileId) {
    const profile = readProfiles().find((p) => p.id === profileId);
    loginHint = profile?.email ?? null;
  }

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
  });

  if (loginHint) params.set("login_hint", loginHint);

  const headers = new Headers();
  headers.set("Location", `${SPOTIFY_AUTH_URL}?${params.toString()}`);
  headers.append(
    "Set-Cookie",
    `${COOKIE_AUTH_STATE}=${state}; HttpOnly; Path=/; SameSite=Lax; Max-Age=600`
  );

  if (register) {
    headers.append(
      "Set-Cookie",
      `${COOKIE_REGISTER}=true; HttpOnly; Path=/; SameSite=Lax; Max-Age=600`
    );
  }

  return new Response(null, { status: 302, headers });
}
