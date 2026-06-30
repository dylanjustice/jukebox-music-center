import { readProfiles } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export function GET() {
  const profiles = readProfiles().map(({ id, name, avatarUrl }) => ({
    id,
    name,
    avatarUrl,
  }));
  return Response.json(profiles);
}
