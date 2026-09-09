import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import type { ApiResult } from "../../../shared/api.ts";
import type { ChannelId } from "../../../shared/community.ts";
import { parseMessageText } from "../../../shared/community.ts";
import type { Profile } from "../auth/types.ts";
import { useAuth } from "../auth/useAuth.ts";
import { createRequestGuard } from "../lib/requestGuard.ts";
import { hasMorePages, oldestCursor } from "../chat/cursor.ts";
import {
  optimisticId,
  reverseNewestFirst,
  upsertMessages,
  type ChatMessage,
} from "../chat/messages.ts";
import {
  fetchDisplayNames,
  fetchMessagePage,
  insertChannelMessage,
  subscribeMessageInserts,
  toChatMessage,
  type MessageRecord,
} from "../chat/query.ts";

export type { ChatMessage };
export type ChatStatus = "idle" | "loading" | "ready" | "error";

const UNAUTHENTICATED: ApiResult<never> = {
  ok: false,
  error: { code: "UNAUTHENTICATED", message: "Entre para enviar mensagens." },
};
const NO_CHANNEL: ApiResult<never> = {
  ok: false,
  error: { code: "VALIDATION", message: "Selecione um canal." },
};
const MISSING_MESSAGE: ApiResult<never> = {
  ok: false,
  error: { code: "NOT_FOUND", message: "Mensagem não encontrada." },
};

type MessageSetter = (update: (current: ChatMessage[]) => ChatMessage[]) => void;

async function bootstrapChannel(
  channelId: ChannelId,
  names: Map<string, string>,
  isCurrent: () => boolean,
  setMessages: MessageSetter,
  setHasMore: (value: boolean) => void,
  setStatus: (value: ChatStatus) => void,
) {
  setMessages(() => []);
  setHasMore(false);
  setStatus("loading");
  const page = await fetchMessagePage(channelId, null);
  if (!isCurrent()) {
    return;
  }
  if (!page.ok) {
    setStatus("error");
    return;
  }
  await fetchDisplayNames(page.data.map((row) => row.author_id), names);
  if (!isCurrent()) {
    return;
  }
  const mapped = reverseNewestFirst(page.data).map((row) =>
    toChatMessage(row, names.get(row.author_id) ?? "Usuário"),
  );
  setMessages((current) => upsertMessages(current, mapped));
  setHasMore(hasMorePages(page.data.length));
  setStatus("ready");
}

function applyRealtimeInsert(
  row: MessageRecord,
  names: Map<string, string>,
  isCurrent: () => boolean,
  setMessages: MessageSetter,
) {
  if (row.deleted_at) {
    return;
  }
  void fetchDisplayNames([row.author_id], names).then(() => {
    if (!isCurrent()) {
      return;
    }
    setMessages((current) =>
      upsertMessages(current, [toChatMessage(row, names.get(row.author_id) ?? "Usuário")]),
    );
  });
}

async function loadOlderMessages(
  channelId: ChannelId,
  messages: ChatMessage[],
  names: Map<string, string>,
  stillOnChannel: () => boolean,
  setMessages: MessageSetter,
  setHasMore: (value: boolean) => void,
  setStatus: (value: ChatStatus) => void,
) {
  const cursor = oldestCursor(messages);
  if (!cursor) {
    return;
  }
  const page = await fetchMessagePage(channelId, cursor);
  if (!stillOnChannel()) {
    return;
  }
  if (!page.ok) {
    setStatus("error");
    return;
  }
  await fetchDisplayNames(page.data.map((row) => row.author_id), names);
  if (!stillOnChannel()) {
    return;
  }
  const mapped = page.data.map((row) => toChatMessage(row, names.get(row.author_id) ?? "Usuário"));
  setMessages((current) => upsertMessages(current, mapped));
  setHasMore(hasMorePages(page.data.length));
}

async function persistOptimistic(optimistic: ChatMessage, setMessages: MessageSetter) {
  const result = await insertChannelMessage({
    channelId: optimistic.channelId,
    authorId: optimistic.authorId,
    content: optimistic.content,
    clientNonce: optimistic.clientNonce,
  });
  if (!result.ok) {
    setMessages((current) => upsertMessages(current, [{ ...optimistic, delivery: "failed" }]));
    return result;
  }
  setMessages((current) =>
    upsertMessages(current, [toChatMessage(result.data, optimistic.displayName)]),
  );
  return { ok: true as const, data: undefined };
}

async function sendChatMessage(input: {
  channelId: ChannelId | null;
  userId: string | undefined;
  displayName: string;
  names: Map<string, string>;
  setMessages: MessageSetter;
  text: string;
}): Promise<ApiResult<void>> {
  if (!input.userId) {
    return UNAUTHENTICATED;
  }
  if (!input.channelId) {
    return NO_CHANNEL;
  }
  const parsed = parseMessageText(input.text);
  if (!parsed.ok) {
    return { ok: false, error: { code: "VALIDATION", message: parsed.error } };
  }
  const clientNonce = crypto.randomUUID();
  const optimistic: ChatMessage = {
    id: optimisticId(clientNonce),
    channelId: input.channelId,
    authorId: input.userId,
    displayName: input.displayName,
    content: parsed.value,
    createdAt: new Date().toISOString(),
    clientNonce,
    delivery: "sending",
  };
  input.names.set(input.userId, input.displayName);
  input.setMessages((current) => upsertMessages(current, [optimistic]));
  return persistOptimistic(optimistic, input.setMessages);
}

async function retryChatMessage(input: {
  clientNonce: string;
  messages: ChatMessage[];
  userId: string | undefined;
  setMessages: MessageSetter;
}): Promise<ApiResult<void>> {
  const existing = input.messages.find((message) => message.clientNonce === input.clientNonce);
  if (!existing) {
    return MISSING_MESSAGE;
  }
  if (!input.userId) {
    return UNAUTHENTICATED;
  }
  const optimistic = { ...existing, delivery: "sending" as const };
  input.setMessages((current) => upsertMessages(current, [optimistic]));
  return persistOptimistic(optimistic, input.setMessages);
}

function useChatSubscription(
  channelId: ChannelId | null,
  user: { id: string } | null,
  profile: Profile | null,
  names: MutableRefObject<Map<string, string>>,
  setMessages: MessageSetter,
  setHasMore: (value: boolean) => void,
  setStatus: (value: ChatStatus) => void,
) {
  const guard = useRef(createRequestGuard());
  useEffect(() => {
    const ticket = guard.current.next();
    names.current = new Map();
    if (user && profile) {
      names.current.set(user.id, profile.display_name);
    }
    if (!channelId) {
      setMessages(() => []);
      setHasMore(false);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    const isCurrent = () => !cancelled && ticket.isCurrent();
    void bootstrapChannel(channelId, names.current, isCurrent, setMessages, setHasMore, setStatus);
    const unsubscribe = subscribeMessageInserts(channelId, (row) => {
      applyRealtimeInsert(row, names.current, isCurrent, setMessages);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [channelId, names, profile, setHasMore, setMessages, setStatus, user]);
}

function useChatState(channelId: ChannelId | null, user: { id: string } | null, profile: Profile | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [hasMore, setHasMore] = useState(false);
  const names = useRef(new Map<string, string>());
  const messagesRef = useRef(messages);
  const channelRef = useRef(channelId);
  messagesRef.current = messages;
  channelRef.current = channelId;
  useChatSubscription(channelId, user, profile, names, setMessages, setHasMore, setStatus);

  const loadOlder = useCallback(async () => {
    if (!channelId) {
      return;
    }
    await loadOlderMessages(
      channelId,
      messagesRef.current,
      names.current,
      () => channelRef.current === channelId,
      setMessages,
      setHasMore,
      setStatus,
    );
  }, [channelId]);

  return { messages, status, hasMore, loadOlder, setMessages, names, messagesRef };
}

export function useChat(channelId: ChannelId | null) {
  const { user, profile } = useAuth();
  const state = useChatState(channelId, user, profile);
  const send = useCallback(
    (text: string) =>
      sendChatMessage({
        channelId,
        userId: user?.id,
        displayName: profile?.display_name ?? "Usuário",
        names: state.names.current,
        setMessages: state.setMessages,
        text,
      }),
    [channelId, profile?.display_name, state.names, state.setMessages, user?.id],
  );
  const retry = useCallback(
    (clientNonce: string) =>
      retryChatMessage({
        clientNonce,
        messages: state.messagesRef.current,
        userId: user?.id,
        setMessages: state.setMessages,
      }),
    [state.messagesRef, state.setMessages, user?.id],
  );
  return {
    messages: state.messages,
    status: state.status,
    hasMore: state.hasMore,
    loadOlder: state.loadOlder,
    send,
    retry,
  };
}
