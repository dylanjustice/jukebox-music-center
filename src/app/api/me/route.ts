import { cookies } from "next/headers";
import { COOKIE_ACCESS_TOKEN, SPOTIFY_ME_URL } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;

  if (!accessToken) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const res = await fetch(SPOTIFY_ME_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    return Response.json({ error: "spotify_error" }, { status: res.status });
  }

  const data = await res.json();
  return Response.json({
    name: data.display_name ?? data.id,
    avatarUrl: data.images?.[0]?.url ?? null,
  });
}
