import coverArena from "../../assets/community/cover-arena.png";
import coverNeon from "../../assets/community/cover-neon.png";
import coverSetup from "../../assets/community/cover-setup.png";

const COVERS = [coverSetup, coverArena, coverNeon] as const;

/** Prefer the community's own image; fall back to a stable default cover. */
export function communityCoverFor(id: string, avatarUrl?: string | null): string {
  if (avatarUrl) {
    return avatarUrl;
  }
  let hash = 0;
  for (const char of id) {
    hash = (hash + char.charCodeAt(0)) % COVERS.length;
  }
  return COVERS[hash] ?? COVERS[0];
}
