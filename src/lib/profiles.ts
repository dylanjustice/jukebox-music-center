import fs from "fs";
import path from "path";

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

const PROFILES_PATH = path.join(process.cwd(), "data", "profiles.json");

export function readProfiles(): Profile[] {
  try {
    if (!fs.existsSync(PROFILES_PATH)) return [];
    return JSON.parse(fs.readFileSync(PROFILES_PATH, "utf-8"));
  } catch {
    return [];
  }
}

export function upsertProfile(profile: Profile): void {
  const dir = path.dirname(PROFILES_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const profiles = readProfiles();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2));
}
