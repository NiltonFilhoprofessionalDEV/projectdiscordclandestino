import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CommunitySummary,
  CreateCommunityInput,
  UpdateCommunityInput,
} from "../../../shared/api.ts";
import type { CommunityId } from "../../../shared/community.ts";
import { createRequestGuard } from "../lib/requestGuard.ts";
import { createCommunity, fetchCommunities, updateCommunity } from "../services/api.ts";

export type LoadStatus = "idle" | "loading" | "ready" | "error";

export function useCommunities(accessToken: string | null) {
  const [communities, setCommunities] = useState<CommunitySummary[]>([]);
  const [selectedId, setSelectedId] = useState<CommunityId | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const guard = useRef(createRequestGuard());

  const reload = useCallback(async () => {
    if (!accessToken) {
      return {
        ok: false as const,
        error: { code: "UNAUTHENTICATED" as const, message: "Sessão inválida ou expirada." },
      };
    }
    const ticket = guard.current.next();
    setStatus((current) => (current === "ready" ? "ready" : "loading"));
    const result = await fetchCommunities();
    if (!ticket.isCurrent()) {
      return result;
    }
    if (!result.ok) {
      setStatus("error");
      setError(result.error.message);
      return result;
    }
    setCommunities(result.data);
    setError(null);
    setStatus("ready");
    return result;
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      setCommunities([]);
      setStatus("idle");
      setError(null);
      return;
    }
    void reload();
  }, [accessToken, reload]);

  const select = useCallback((id: CommunityId | null) => {
    setSelectedId(id);
  }, []);

  const create = useCallback(
    async (input: CreateCommunityInput) => {
      const result = await createCommunity(input);
      if (result.ok) {
        setSelectedId(result.data.id);
        await reload();
      }
      return result;
    },
    [reload],
  );

  const update = useCallback(
    async (communityId: CommunityId, input: UpdateCommunityInput) => {
      const result = await updateCommunity(communityId, input);
      if (result.ok) {
        await reload();
      }
      return result;
    },
    [reload],
  );

  return { communities, selectedId, select, create, update, status, error, retry: reload };
}
