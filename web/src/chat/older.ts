import type { ChannelId } from "../../../shared/community.ts";
import { hasMorePages, oldestCursor } from "./cursor.ts";
import type { ChatMessage } from "./messages.ts";
import { upsertMessages } from "./messages.ts";
import type { MessageSetter } from "./persist.ts";
import { toChatMessage, type AuthorCache, type MessageRecord } from "./query.ts";

type ChatStatus = "idle" | "loading" | "ready" | "error";

type FetchPage = (
  channelId: ChannelId,
  cursor: { createdAt: string; id: string } | null,
) => Promise<{ ok: true; data: MessageRecord[] } | { ok: false; error: { message?: string } }>;

export async function loadOlderMessages(input: {
  channelId: ChannelId;
  messages: ChatMessage[];
  stillOnChannel: () => boolean;
  setMessages: MessageSetter;
  setHasMore: (value: boolean) => void;
  setStatus?: (value: ChatStatus) => void;
  setOlderError: (value: string | null) => void;
  fetchPage: FetchPage;
  resolveNames: (authorIds: string[]) => Promise<AuthorCache>;
}) {
  const cursor = oldestCursor(input.messages);
  if (!cursor) {
    return;
  }
  input.setOlderError(null);
  const page = await input.fetchPage(input.channelId, cursor);
  if (!input.stillOnChannel()) {
    return;
  }
  if (!page.ok) {
    input.setOlderError("Não foi possível carregar mensagens anteriores.");
    return;
  }
  const names = await input.resolveNames(page.data.map((row) => row.author_id));
  if (!input.stillOnChannel()) {
    return;
  }
  const mapped = page.data.map((row) => {
    const author = names.get(row.author_id);
    return toChatMessage(row, {
      displayName: author?.displayName ?? "Usuário",
      avatarUrl: author?.avatarUrl ?? null,
    });
  });
  input.setMessages((current) => upsertMessages(current, mapped));
  input.setHasMore(hasMorePages(page.data.length));
}
