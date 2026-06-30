import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("spotify_access_token")?.value;

  if (!accessToken) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const response = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (response.status === 204) {
    return Response.json({ isPlaying: false, track: null });
  }

  if (!response.ok) {
    return Response.json(
      { error: "spotify_error" },
      { status: response.status },
    );
  }

  const data = await response.json();

  if (!data.item) {
    return Response.json({ isPlaying: false, track: null });
  }

  const track = {
    id: data.item.id,
    name: data.item.name,
    artist: data.item.artists.map((a: { name: string }) => a.name).join(", "),
    album: data.item.album.name,
    albumArt: data.item.album.images[0]?.url ?? null,
    isPlaying: data.is_playing,
    volumePercent: data.device?.volume_percent ?? null,
    durationMs: data.item.duration_ms,
    progressMs: data.progress_ms,
  };

  return Response.json(track);
}
