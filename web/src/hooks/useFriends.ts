import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../services/supabase.ts";

export type FriendEntry = {
  friendshipId: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  presence: "offline" | "online" | "in_voice";
  activity: string | null;
  direction: "incoming" | "outgoing" | "accepted";
};

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
};

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  presence: string | null;
  activity: string | null;
  last_seen_at: string | null;
};

const STALE_MS = 120_000;

function mapPresence(
  value: string | null | undefined,
  lastSeenAt: string | null | undefined,
): FriendEntry["presence"] {
  if (value !== "online" && value !== "in_voice") {
    return "offline";
  }
  if (!lastSeenAt) {
    return value;
  }
  const age = Date.now() - new Date(lastSeenAt).getTime();
  if (Number.isNaN(age) || age > STALE_MS) {
    return "offline";
  }
  return value;
}

async function pushMyPresence(
  presence: FriendEntry["presence"],
  activity: string | null,
): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return false;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      presence,
      activity,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.user.id);

  if (!updateError) {
    return true;
  }

  const { error: rpcError } = await supabase.rpc("set_my_presence", {
    next_presence: presence,
    next_activity: activity,
  });
  return !rpcError;
}

export function useFriends(userId: string | null, voiceActivity: string | null) {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incoming, setIncoming] = useState<FriendEntry[]>([]);
  const [outgoing, setOutgoing] = useState<FriendEntry[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const friendIdsRef = useRef<string[]>([]);

  const reload = useCallback(async () => {
    if (!userId) {
      setFriends([]);
      setIncoming([]);
      setOutgoing([]);
      setStatus("idle");
      friendIdsRef.current = [];
      return;
    }
    setStatus((current) => (current === "ready" ? "ready" : "loading"));
    const { data, error: queryError } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    if (!mounted.current) {
      return;
    }
    if (queryError) {
      setStatus("error");
      setError("Não foi possível carregar amigos.");
      return;
    }
    const rows = (data ?? []) as FriendshipRow[];
    const otherIds = [
      ...new Set(
        rows.map((row) => (row.requester_id === userId ? row.addressee_id : row.requester_id)),
      ),
    ];
    friendIdsRef.current = otherIds;
    const profilesById = new Map<string, ProfileRow>();
    if (otherIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, presence, activity, last_seen_at")
        .in("id", otherIds);
      for (const profile of (profiles ?? []) as ProfileRow[]) {
        profilesById.set(profile.id, profile);
      }
    }
    const nextFriends: FriendEntry[] = [];
    const nextIncoming: FriendEntry[] = [];
    const nextOutgoing: FriendEntry[] = [];
    for (const row of rows) {
      const mine = row.requester_id === userId;
      const otherId = mine ? row.addressee_id : row.requester_id;
      const profile = profilesById.get(otherId);
      const entry: FriendEntry = {
        friendshipId: row.id,
        userId: otherId,
        displayName: profile?.display_name?.trim() || "Usuário",
        avatarUrl: profile?.avatar_url ?? null,
        presence: mapPresence(profile?.presence, profile?.last_seen_at),
        activity: profile?.activity ?? null,
        direction: row.status === "accepted" ? "accepted" : mine ? "outgoing" : "incoming",
      };
      if (row.status === "accepted") {
        nextFriends.push(entry);
      } else if (!mine) {
        nextIncoming.push(entry);
      } else {
        nextOutgoing.push(entry);
      }
    }
    nextFriends.sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"));
    setFriends(nextFriends);
    setIncoming(nextIncoming);
    setOutgoing(nextOutgoing);
    setError(null);
    setStatus("ready");
  }, [userId]);

  useEffect(() => {
    mounted.current = true;
    void reload();
    const timer = window.setInterval(() => void reload(), 12000);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
    };
  }, [reload]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    const channel = supabase
      .channel(`friends-presence:${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          const row = payload.new as ProfileRow;
          if (!friendIdsRef.current.includes(row.id)) {
            return;
          }
          setFriends((current) =>
            current.map((entry) =>
              entry.userId === row.id
                ? {
                    ...entry,
                    displayName: row.display_name?.trim() || entry.displayName,
                    avatarUrl: row.avatar_url,
                    presence: mapPresence(row.presence, row.last_seen_at),
                    activity: row.activity,
                  }
                : entry,
            ),
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    let cancelled = false;
    const presence: FriendEntry["presence"] = voiceActivity ? "in_voice" : "online";

    const beat = () => {
      if (!cancelled) {
        void pushMyPresence(presence, voiceActivity);
      }
    };
    beat();
    const heartbeat = window.setInterval(beat, 8000);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        beat();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", beat);

    return () => {
      cancelled = true;
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", beat);
    };
  }, [userId, voiceActivity]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    const goOffline = () => {
      void pushMyPresence("offline", null);
    };
    window.addEventListener("pagehide", goOffline);
    window.addEventListener("beforeunload", goOffline);
    return () => {
      window.removeEventListener("pagehide", goOffline);
      window.removeEventListener("beforeunload", goOffline);
      // Não marcar offline no cleanup do React — remounts derrubavam a presença.
    };
  }, [userId]);

  const requestByEmail = useCallback(
    async (email: string) => {
      const value = email.trim();
      if (!value.includes("@")) {
        return "Digite um e-mail válido.";
      }
      const { error: rpcError } = await supabase.rpc("request_friend_by_email", {
        friend_email: value,
      });
      if (rpcError) {
        return rpcError.message.toLowerCase().includes("não encontrado") ||
          rpcError.message.toLowerCase().includes("not found")
          ? "Usuário não encontrado."
          : "Não foi possível enviar o pedido.";
      }
      await reload();
      return null;
    },
    [reload],
  );

  const requestByUserId = useCallback(
    async (targetUserId: string) => {
      const value = targetUserId.trim();
      if (!value) {
        return "Usuário não encontrado.";
      }
      const { error: rpcError } = await supabase.rpc("request_friend_by_id", {
        friend_user: value,
      });
      if (rpcError) {
        const message = rpcError.message.toLowerCase();
        if (message.includes("já são amigos") || message.includes("already")) {
          return "Vocês já são amigos.";
        }
        if (message.includes("já recebido")) {
          return "Esse usuário já te enviou um pedido.";
        }
        if (message.includes("si mesmo") || message.includes("yourself")) {
          return "Você não pode adicionar a si mesmo.";
        }
        if (message.includes("não encontrado") || message.includes("not found")) {
          return "Usuário não encontrado.";
        }
        if (
          message.includes("could not find the function") ||
          message.includes("schema cache") ||
          rpcError.code === "PGRST202"
        ) {
          return "Pedido de amizade indisponível no servidor. Tente de novo em instantes.";
        }
        return "Não foi possível enviar o pedido.";
      }
      await reload();
      return null;
    },
    [reload],
  );

  const accept = useCallback(
    async (friendshipId: string) => {
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
      await reload();
    },
    [reload],
  );

  const remove = useCallback(
    async (friendshipId: string) => {
      const { error: deleteError } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);
      if (deleteError) {
        return "Não foi possível remover esta amizade.";
      }
      await reload();
      return null;
    },
    [reload],
  );

  const inviteToCommunity = useCallback(async (friendUserId: string, communityId: string) => {
    const { error: rpcError } = await supabase.rpc("invite_friend_to_community", {
      target_community: communityId,
      friend_user: friendUserId,
    });
    if (rpcError) {
      const message = rpcError.message.toLowerCase();
      if (message.includes("permissão") || message.includes("permission")) {
        return "Sem permissão para convidar nesta comunidade.";
      }
      if (message.includes("amigos") || message.includes("friend")) {
        return "Só é possível convidar amigos aceitos.";
      }
      return "Não foi possível convidar o amigo.";
    }
    return null;
  }, []);

  return {
    friends,
    incoming,
    outgoing,
    status,
    error,
    requestByEmail,
    requestByUserId,
    accept,
    remove,
    inviteToCommunity,
    retry: reload,
  };
}
