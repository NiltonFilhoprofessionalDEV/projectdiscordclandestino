import type { CommunityRole } from "../../../shared/community.ts";

export function canManageCommunity(role: CommunityRole | null): boolean {
  return role === "owner" || role === "admin";
}
