import { useEffect, useRef, useState } from "react";
import type { CommunityId } from "../../../shared/community.ts";
import { takePendingInvite } from "../invites/path.ts";
import { acceptInvite } from "../services/api.ts";

type UseAcceptInviteResult = {
  status: "idle" | "accepting" | "done" | "error";
  message: string | null;
  communityId: CommunityId | null;
};

export function useAcceptPendingInvite(
  onJoined: (communityId: CommunityId) => void,
): UseAcceptInviteResult {
  const [status, setStatus] = useState<UseAcceptInviteResult["status"]>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [communityId, setCommunityId] = useState<CommunityId | null>(null);
  const onJoinedRef = useRef(onJoined);
  onJoinedRef.current = onJoined;

  useEffect(() => {
    const token = takePendingInvite();
    if (!token) {
      return;
    }
    let cancelled = false;
    setStatus("accepting");
    void acceptInvite(token).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setStatus("error");
        setMessage(result.error.message);
        return;
      }
      setCommunityId(result.data.communityId);
      setStatus("done");
      setMessage("Você entrou na comunidade.");
      onJoinedRef.current(result.data.communityId);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, message, communityId };
}
