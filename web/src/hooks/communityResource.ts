import type { Channel } from "../../../shared/api.ts";
import type { ChannelId } from "../../../shared/community.ts";
import type { LoadStatus } from "./useCommunities.ts";

export function beginCommunityResourceLoad(communityId: string | null) {
  if (!communityId) {
    return { items: [] as never[], status: "idle" as const, error: null };
  }
  return { items: [] as never[], status: "loading" as const, error: null };
}

export function nextActiveTextChannelId(
  status: LoadStatus,
  text: Channel[],
  activeId: ChannelId | null,
): ChannelId | null {
  if (status !== "ready") {
    return activeId;
  }
  if (activeId && text.some((channel) => channel.id === activeId)) {
    return activeId;
  }
  return text[0]?.id ?? null;
}
