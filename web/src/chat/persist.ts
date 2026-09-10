import type { ApiResult } from "../../../shared/api.ts";
import type { ChannelId } from "../../../shared/community.ts";
import type { ChatMessage } from "./messages.ts";
import { upsertMessages } from "./messages.ts";
import { toChatMessage, type MessageRecord } from "./query.ts";

export type MessageSetter = (update: (current: ChatMessage[]) => ChatMessage[]) => void;

type InsertMessage = (input: {
  channelId: ChannelId;
  authorId: string;
  content: string;
  clientNonce: string;
}) => Promise<ApiResult<MessageRecord>>;

export async function persistOptimistic(
  optimistic: ChatMessage,
  setMessages: MessageSetter,
  isCurrent: () => boolean,
  insert: InsertMessage,
): Promise<ApiResult<void>> {
  const result = await insert({
    channelId: optimistic.channelId,
    authorId: optimistic.authorId,
    content: optimistic.content,
    clientNonce: optimistic.clientNonce,
  });
  if (!isCurrent()) {
    return result.ok ? { ok: true, data: undefined } : result;
  }
  if (!result.ok) {
    setMessages((current) => upsertMessages(current, [{ ...optimistic, delivery: "failed" }]));
    return result;
  }
  setMessages((current) =>
    upsertMessages(current, [
      toChatMessage(result.data, {
        displayName: optimistic.displayName,
        avatarUrl: optimistic.avatarUrl,
      }),
    ]),
  );
  return { ok: true, data: undefined };
}
