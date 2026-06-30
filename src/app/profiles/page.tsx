import { readProfiles } from "@/lib/profiles";
import ProfilePicker from "./ProfilePicker";

export const dynamic = "force-dynamic";

export default function ProfilesPage() {
  const profiles = readProfiles().map(({ id, name, avatarUrl }) => ({
    id,
    name,
    avatarUrl,
  }));
  return <ProfilePicker profiles={profiles} />;
}
