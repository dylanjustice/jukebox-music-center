import { cookies } from "next/headers";
import { COOKIE_ACCESS_TOKEN, SPOTIFY_PLAYER_URL } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;

  if (!accessToken) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const res = await fetch(`${SPOTIFY_PLAYER_URL}/queue`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    return Response.json({ error: "spotify_error" }, { status: res.status });
  }

  const data = await res.json();
  const next = data.queue?.[0];

  if (!next) {
    return Response.json({ next: null });
  }

  return Response.json({
    next: {
      name: next.name,
      artist: next.artists.map((a: { name: string }) => a.name).join(", "),
      albumArt: next.album.images[0]?.url ?? null,
    },
  });
}
