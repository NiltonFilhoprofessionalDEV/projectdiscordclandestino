import type { CommunitySummary } from "../../../shared/api.ts";
import type { CommunityRole } from "../../../shared/community.ts";

export function canManageCommunity(role: CommunityRole | null): boolean {
  return role === "owner" || role === "admin";
}

export function isMemberShell(community: CommunitySummary | null): boolean {
  return community?.role != null;
}
