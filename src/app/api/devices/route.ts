import { cookies } from "next/headers";
import { SPOTIFY_PLAYER_URL } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("spotify_access_token")?.value;

  if (!accessToken) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const res = await fetch(`${SPOTIFY_PLAYER_URL}/devices`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json();
  return Response.json(data);
}
