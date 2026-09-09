import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Channel, CreateChannelInput } from "../../../shared/api.ts";
import type { CommunityId } from "../../../shared/community.ts";
import { groupChannels } from "../channels/groups.ts";
import { createRequestGuard } from "../lib/requestGuard.ts";
import { createChannel, fetchCommunityChannels } from "../services/api.ts";
import type { LoadStatus } from "./useCommunities.ts";

export function useChannels(communityId: CommunityId | null) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const guard = useRef(createRequestGuard());

  const reload = useCallback(async () => {
    if (!communityId) {
      guard.current.next();
      setChannels([]);
      setStatus("idle");
      setError(null);
      return;
    }
    const ticket = guard.current.next();
    setStatus((current) => (current === "ready" ? "ready" : "loading"));
    const result = await fetchCommunityChannels(communityId);
    if (!ticket.isCurrent()) {
      return;
    }
    if (!result.ok) {
      setStatus("error");
      setError(result.error.message);
      return;
    }
    setChannels(result.data);
    setError(null);
    setStatus("ready");
  }, [communityId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const grouped = useMemo(() => groupChannels(channels), [channels]);

  const create = useCallback(
    async (input: CreateChannelInput) => {
      if (!communityId) {
        return {
          ok: false as const,
          error: { code: "VALIDATION" as const, message: "Selecione uma comunidade." },
        };
      }
      const result = await createChannel(communityId, input);
      if (result.ok) {
        await reload();
      }
      return result;
    },
    [communityId, reload],
  );

  return { ...grouped, status, error, create, retry: reload };
}
