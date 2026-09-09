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

const STALE_MS = 60_000;

function mapPresence(
  value: string | null | undefined,
  lastSeenAt: string | null | undefined,
): FriendEntry["presence"] {
  if (value !== "online" && value !== "in_voice") {
    return "offline";
  }
  if (!lastSeenAt) {
    return "offline";
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
  const { error: rpcError } = await supabase.rpc("set_my_presence", {
    next_presence: presence,
    next_activity: activity,
  });
  if (!rpcError) {
    return true;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      presence,
      activity,
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  return !updateError;
}

export function useFriends(userId: string | null, voiceActivity: string | null) {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incoming, setIncoming] = useState<FriendEntry[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const friendIdsRef = useRef<string[]>([]);

  const reload = useCallback(async () => {
    if (!userId) {
      setFriends([]);
      setIncoming([]);
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
      }
    }
    nextFriends.sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"));
    setFriends(nextFriends);
    setIncoming(nextIncoming);
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
    const heartbeat = window.setInterval(beat, 15000);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        beat();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisible);
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
    return () => {
      window.removeEventListener("pagehide", goOffline);
      goOffline();
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

  const accept = useCallback(
    async (friendshipId: string) => {
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
      await reload();
    },
    [reload],
  );

  return { friends, incoming, status, error, requestByEmail, accept, retry: reload };
}
