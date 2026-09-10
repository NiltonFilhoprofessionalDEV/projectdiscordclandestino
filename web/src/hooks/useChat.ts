import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import type { ApiResult } from "../../../shared/api.ts";
import type { ChannelId } from "../../../shared/community.ts";
import { parseMessageText } from "../../../shared/community.ts";
import type { Profile } from "../auth/types.ts";
import { useAuth } from "../auth/useAuth.ts";
import { createRequestGuard } from "../lib/requestGuard.ts";
import { hasMorePages } from "../chat/cursor.ts";
import {
  optimisticId,
  reverseNewestFirst,
  upsertMessages,
  type ChatMessage,
} from "../chat/messages.ts";
import { loadOlderMessages } from "../chat/older.ts";
import { persistOptimistic, type MessageSetter } from "../chat/persist.ts";
import {
  fetchAuthorProfiles,
  fetchMessagePage,
  insertChannelMessage,
  subscribeMessageInserts,
  toChatMessage,
  type AuthorCache,
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

function authorFromCache(cache: AuthorCache, authorId: string) {
  const author = cache.get(authorId);
  return {
    displayName: author?.displayName ?? "Usuário",
    avatarUrl: author?.avatarUrl ?? null,
  };
}

async function bootstrapChannel(
  channelId: ChannelId,
  authors: AuthorCache,
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
  await fetchAuthorProfiles(
    page.data.map((row) => row.author_id),
    authors,
  );
  if (!isCurrent()) {
    return;
  }
  const mapped = reverseNewestFirst(page.data).map((row) =>
    toChatMessage(row, authorFromCache(authors, row.author_id)),
  );
  setMessages((current) => upsertMessages(current, mapped));
  setHasMore(hasMorePages(page.data.length));
  setStatus("ready");
}

function applyRealtimeInsert(
  row: MessageRecord,
  authors: AuthorCache,
  isCurrent: () => boolean,
  setMessages: MessageSetter,
) {
  if (row.deleted_at) {
    return;
  }
  void fetchAuthorProfiles([row.author_id], authors).then(() => {
    if (!isCurrent()) {
      return;
    }
    setMessages((current) =>
      upsertMessages(current, [toChatMessage(row, authorFromCache(authors, row.author_id))]),
    );
  });
}

async function sendChatMessage(input: {
  channelId: ChannelId | null;
  userId: string | undefined;
  displayName: string;
  avatarUrl: string | null;
  authors: AuthorCache;
  setMessages: MessageSetter;
  isCurrent: () => boolean;
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
    avatarUrl: input.avatarUrl,
    content: parsed.value,
    createdAt: new Date().toISOString(),
    clientNonce,
    delivery: "sending",
  };
  input.authors.set(input.userId, {
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
  });
  input.setMessages((current) => upsertMessages(current, [optimistic]));
  return persistOptimistic(optimistic, input.setMessages, input.isCurrent, insertChannelMessage);
}

async function retryChatMessage(input: {
  clientNonce: string;
  messages: ChatMessage[];
  userId: string | undefined;
  setMessages: MessageSetter;
  isCurrent: () => boolean;
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
  return persistOptimistic(optimistic, input.setMessages, input.isCurrent, insertChannelMessage);
}

function useChatSubscription(
  channelId: ChannelId | null,
  user: { id: string } | null,
  profile: Profile | null,
  authors: MutableRefObject<AuthorCache>,
  setMessages: MessageSetter,
  setHasMore: (value: boolean) => void,
  setStatus: (value: ChatStatus) => void,
  setOlderError: (value: string | null) => void,
) {
  const guard = useRef(createRequestGuard());
  useEffect(() => {
    const ticket = guard.current.next();
    authors.current = new Map();
    setOlderError(null);
    if (user && profile) {
      authors.current.set(user.id, {
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
      });
    }
    if (!channelId) {
      setMessages(() => []);
      setHasMore(false);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    const isCurrent = () => !cancelled && ticket.isCurrent();
    void bootstrapChannel(channelId, authors.current, isCurrent, setMessages, setHasMore, setStatus);
    const unsubscribe = subscribeMessageInserts(channelId, (row) => {
      applyRealtimeInsert(row, authors.current, isCurrent, setMessages);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [channelId, authors, profile, setHasMore, setMessages, setOlderError, setStatus, user]);
}

function useChatState(
  channelId: ChannelId | null,
  user: { id: string } | null,
  profile: Profile | null,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [hasMore, setHasMore] = useState(false);
  const [olderError, setOlderError] = useState<string | null>(null);
  const authors = useRef<AuthorCache>(new Map());
  const messagesRef = useRef(messages);
  const channelRef = useRef(channelId);
  messagesRef.current = messages;
  channelRef.current = channelId;
  useChatSubscription(
    channelId,
    user,
    profile,
    authors,
    setMessages,
    setHasMore,
    setStatus,
    setOlderError,
  );

  const loadOlder = useCallback(async () => {
    if (!channelId) {
      return;
    }
    await loadOlderMessages({
      channelId,
      messages: messagesRef.current,
      stillOnChannel: () => channelRef.current === channelId,
      setMessages,
      setHasMore,
      setOlderError,
      fetchPage: fetchMessagePage,
      resolveNames: (authorIds) => fetchAuthorProfiles(authorIds, authors.current),
    });
  }, [channelId]);

  return {
    messages,
    status,
    hasMore,
    olderError,
    loadOlder,
    setMessages,
    authors,
    messagesRef,
    channelRef,
  };
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
        avatarUrl: profile?.avatar_url ?? null,
        authors: state.authors.current,
        setMessages: state.setMessages,
        isCurrent: () => state.channelRef.current === channelId,
        text,
      }),
    [
      channelId,
      profile?.avatar_url,
      profile?.display_name,
      state.authors,
      state.channelRef,
      state.setMessages,
      user?.id,
    ],
  );
  const retry = useCallback(
    (clientNonce: string) => {
      const existing = state.messagesRef.current.find((message) => message.clientNonce === clientNonce);
      return retryChatMessage({
        clientNonce,
        messages: state.messagesRef.current,
        userId: user?.id,
        setMessages: state.setMessages,
        isCurrent: () => existing != null && state.channelRef.current === existing.channelId,
      });
    },
    [state.channelRef, state.messagesRef, state.setMessages, user?.id],
  );
  return {
    messages: state.messages,
    status: state.status,
    hasMore: state.hasMore,
    olderError: state.olderError,
    loadOlder: state.loadOlder,
    send,
    retry,
  };
}
