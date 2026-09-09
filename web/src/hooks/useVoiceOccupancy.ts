import { useCallback, useEffect, useRef, useState } from "react";
import type { ChannelId, CommunityId } from "../../../shared/community.ts";
import { fetchVoiceOccupancy, type VoiceOccupant } from "../services/api.ts";

const POLL_MS = 6000;

export type VoiceOccupancyMap = Record<string, VoiceOccupant[]>;

export function useVoiceOccupancy(
  communityId: CommunityId | null,
  enabled: boolean,
) {
  const [byChannel, setByChannel] = useState<VoiceOccupancyMap>({});
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    if (!communityId || !enabled) {
      setByChannel({});
      return;
    }
    const result = await fetchVoiceOccupancy(communityId);
    if (!mounted.current) {
      return;
    }
    if (!result.ok) {
      return;
    }
    const next: VoiceOccupancyMap = {};
    for (const channel of result.data.channels) {
      next[channel.channelId] = channel.occupants;
    }
    setByChannel(next);
  }, [communityId, enabled]);

  useEffect(() => {
    mounted.current = true;
    void reload();
    if (!communityId || !enabled) {
      return () => {
        mounted.current = false;
      };
    }
    const timer = window.setInterval(() => void reload(), POLL_MS);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
    };
  }, [communityId, enabled, reload]);

  return {
    occupantsFor(channelId: ChannelId): VoiceOccupant[] {
      return byChannel[channelId] ?? [];
    },
    byChannel,
    reload,
  };
}
