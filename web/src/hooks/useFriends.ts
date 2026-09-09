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
};

function mapPresence(value: string | null | undefined): FriendEntry["presence"] {
  if (value === "online" || value === "in_voice") {
    return value;
  }
  return "offline";
}

export function useFriends(userId: string | null, voiceActivity: string | null) {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incoming, setIncoming] = useState<FriendEntry[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setFriends([]);
      setIncoming([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
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
    const profilesById = new Map<string, ProfileRow>();
    if (otherIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, presence, activity")
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
        presence: mapPresence(profile?.presence),
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
    const timer = window.setInterval(() => void reload(), 15000);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
    };
  }, [reload]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    const presence = voiceActivity ? "in_voice" : "online";
    void supabase.rpc("set_my_presence", {
      next_presence: presence,
      next_activity: voiceActivity,
    });
    const heartbeat = window.setInterval(() => {
      void supabase.rpc("set_my_presence", {
        next_presence: presence,
        next_activity: voiceActivity,
      });
    }, 20000);
    return () => {
      window.clearInterval(heartbeat);
      void supabase.rpc("set_my_presence", {
        next_presence: "offline",
        next_activity: null,
      });
    };
  }, [userId, voiceActivity]);

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
