import type { ApiResult } from "../../../shared/api.ts";
import type { ChannelId } from "../../../shared/community.ts";
import type { Database } from "../../../shared/database.types.ts";
import { supabase } from "../services/supabase.ts";
import { olderThanFilter, PAGE_SIZE, type MessageCursor } from "./cursor.ts";
import type { ChatMessage } from "./messages.ts";

export type MessageRecord = Database["public"]["Tables"]["messages"]["Row"];

const MESSAGE_COLUMNS = "id, channel_id, author_id, content, client_nonce, created_at, deleted_at";
const INTERNAL: ApiResult<never> = {
  ok: false,
  error: { code: "INTERNAL", message: "Não foi possível concluir a operação." },
};

export function isNonceConflict(error: { code?: string; message?: string } | null): boolean {
  if (!error) {
    return false;
  }
  return error.code === "23505" || /duplicate key|unique/i.test(error.message ?? "");
}

export function toChatMessage(
  row: MessageRecord,
  displayName: string,
  delivery: ChatMessage["delivery"] = "sent",
): ChatMessage {
  return {
    id: row.id,
    channelId: row.channel_id as ChannelId,
    authorId: row.author_id,
    displayName,
    content: row.content,
    createdAt: row.created_at,
    clientNonce: row.client_nonce,
    delivery,
  };
}

export async function fetchDisplayNames(
  authorIds: string[],
  cache: Map<string, string>,
): Promise<Map<string, string>> {
  const missing = [...new Set(authorIds)].filter((id) => !cache.has(id));
  if (missing.length === 0) {
    return cache;
  }
  const { data } = await supabase.from("profiles").select("id, display_name").in("id", missing);
  for (const row of data ?? []) {
    cache.set(row.id, row.display_name);
  }
  return cache;
}

export async function fetchMessagePage(channelId: ChannelId, cursor: MessageCursor | null) {
  let query = supabase
    .from("messages")
    .select(MESSAGE_COLUMNS)
    .eq("channel_id", channelId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE);
  if (cursor) {
    query = query.or(olderThanFilter(cursor));
  }
  const { data, error } = await query;
  if (error) {
    return { ok: false as const, error };
  }
  return { ok: true as const, data: (data ?? []) as MessageRecord[] };
}

export async function fetchMessageByNonce(authorId: string, clientNonce: string) {
  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_COLUMNS)
    .eq("author_id", authorId)
    .eq("client_nonce", clientNonce)
    .maybeSingle();
  if (error) {
    return { ok: false as const, error };
  }
  return { ok: true as const, data: data as MessageRecord | null };
}

export async function insertChannelMessage(input: {
  channelId: ChannelId;
  authorId: string;
  content: string;
  clientNonce: string;
}): Promise<ApiResult<MessageRecord>> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      channel_id: input.channelId,
      author_id: input.authorId,
      content: input.content,
      client_nonce: input.clientNonce,
    })
    .select(MESSAGE_COLUMNS)
    .single();
  if (isNonceConflict(error)) {
    const existing = await fetchMessageByNonce(input.authorId, input.clientNonce);
    if (existing.ok && existing.data) {
      return { ok: true, data: existing.data };
    }
    return INTERNAL;
  }
  if (error || !data) {
    return INTERNAL;
  }
  return { ok: true, data: data as MessageRecord };
}

export function subscribeMessageInserts(
  channelId: ChannelId,
  onInsert: (row: MessageRecord) => void,
) {
  const channel = supabase
    .channel(`messages:${channelId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
      (payload) => {
        onInsert(payload.new as MessageRecord);
      },
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
