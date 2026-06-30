import { type NextRequest } from "next/server";
import { SPOTIFY_AUTH_URL } from "@/lib/spotify";

const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
].join(" ");

export function GET(request: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
  });

  const response = Response.redirect(
    `${SPOTIFY_AUTH_URL}?${params.toString()}`,
    302,
  );

  const headers = new Headers(response.headers);
  headers.set(
    "Set-Cookie",
    `spotify_auth_state=${state}; HttpOnly; Path=/; SameSite=Lax; Max-Age=600`,
  );

  return new Response(null, { status: 302, headers });
}
