import { cookies } from "next/headers";
import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

async function spotifyRequest(
  accessToken: string,
  endpoint: string,
  method: string,
  body?: object,
) {
  return fetch(`https://api.spotify.com/v1/me/player${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("spotify_access_token")?.value;

  if (!accessToken) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  let res: Response;
  switch (action) {
    case "play":
      res = await spotifyRequest(accessToken, "/play", "PUT");
      break;
    case "pause":
      res = await spotifyRequest(accessToken, "/pause", "PUT");
      break;
    case "next":
      res = await spotifyRequest(accessToken, "/next", "POST");
      break;
    case "previous":
      res = await spotifyRequest(accessToken, "/previous", "POST");
      break;
    case "volume": {
      const pct = Math.min(100, Math.max(0, parseInt(body.value, 10)));
      res = await spotifyRequest(
        accessToken,
        `/volume?volume_percent=${pct}`,
        "PUT",
      );
      break;
    }
    default:
      return Response.json({ error: "unknown_action" }, { status: 400 });
  }

  if (res.status === 204 || res.ok) {
    return Response.json({ ok: true });
  }

  return Response.json({ error: "spotify_error" }, { status: res.status });
}
