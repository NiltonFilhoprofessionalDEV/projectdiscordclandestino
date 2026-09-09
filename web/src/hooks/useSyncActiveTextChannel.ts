import { useEffect } from "react";
import type { Channel } from "../../../shared/api.ts";
import type { ChannelId } from "../../../shared/community.ts";
import { nextActiveTextChannelId } from "./communityResource.ts";
import type { LoadStatus } from "./useCommunities.ts";

export function useSyncActiveTextChannel(
  status: LoadStatus,
  text: Channel[],
  activeId: ChannelId | null,
  setId: (id: ChannelId | null) => void,
) {
  useEffect(() => {
    const next = nextActiveTextChannelId(status, text, activeId);
    if (next !== activeId) {
      setId(next);
    }
  }, [status, text, activeId, setId]);
}
