import { useCallback, useEffect, useRef, useState } from "react";
import type { CommunityId } from "../../../shared/community.ts";
import { createRequestGuard } from "../lib/requestGuard.ts";
import { fetchCommunityMembers, type CommunityMember } from "../services/api.ts";
import type { LoadStatus } from "./useCommunities.ts";

export function useMembers(communityId: CommunityId | null) {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const guard = useRef(createRequestGuard());

  const reload = useCallback(async () => {
    if (!communityId) {
      guard.current.next();
      setMembers([]);
      setStatus("idle");
      setError(null);
      return;
    }
    const ticket = guard.current.next();
    const result = await fetchCommunityMembers(communityId);
    if (!ticket.isCurrent()) {
      return;
    }
    if (!result.ok) {
      setStatus("error");
      setError(result.error.message);
      return;
    }
    setMembers(result.data);
    setError(null);
    setStatus("ready");
  }, [communityId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { members, status, error, retry: reload };
}
