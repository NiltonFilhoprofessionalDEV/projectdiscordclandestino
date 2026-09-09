import type { ChatMessage } from "./messages.ts";

export function seenIdsFrom(messages: readonly ChatMessage[]): Set<string> {
  return new Set(messages.map((message) => message.id));
}

export function countUnseen(
  messages: readonly ChatMessage[],
  seenIds: ReadonlySet<string>,
  closed: boolean,
  viewerId?: string | null,
): number {
  if (!closed) {
    return 0;
  }
  return messages.filter(
    (message) =>
      message.delivery === "sent" &&
      !seenIds.has(message.id) &&
      (!viewerId || message.authorId !== viewerId),
  ).length;
}
