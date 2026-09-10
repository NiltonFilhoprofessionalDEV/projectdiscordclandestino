import type { ChannelId } from "../../../shared/community.ts";

export type MessageDelivery = "sending" | "sent" | "failed";

export type ChatMessage = {
  id: string;
  channelId: ChannelId;
  authorId: string;
  displayName: string;
  avatarUrl: string | null;
  content: string;
  createdAt: string;
  clientNonce: string;
  delivery: MessageDelivery;
};

export function reverseNewestFirst<T>(rows: T[]): T[] {
  return rows.slice().reverse();
}

export function optimisticId(clientNonce: string): string {
  return `optimistic:${clientNonce}`;
}

export function lastFailedNonce(messages: readonly ChatMessage[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.delivery === "failed") {
      return message.clientNonce;
    }
  }
  return null;
}

function nonceKey(message: ChatMessage): string {
  return `${message.authorId}:${message.clientNonce}`;
}

function preferDelivery(previous: MessageDelivery | undefined, next: MessageDelivery): MessageDelivery {
  if (previous === "sent") {
    return "sent";
  }
  return next;
}

function compareMessages(left: ChatMessage, right: ChatMessage): number {
  if (left.createdAt !== right.createdAt) {
    return left.createdAt < right.createdAt ? -1 : 1;
  }
  return left.id < right.id ? -1 : 1;
}

export function upsertMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  const idByNonce = new Map<string, string>();
  for (const message of current) {
    byId.set(message.id, message);
    idByNonce.set(nonceKey(message), message.id);
  }
  for (const message of incoming) {
    const key = nonceKey(message);
    const previousId = idByNonce.get(key);
    if (previousId && previousId !== message.id) {
      byId.delete(previousId);
    }
    const previous = byId.get(message.id);
    byId.set(message.id, {
      ...previous,
      ...message,
      avatarUrl: message.avatarUrl ?? previous?.avatarUrl ?? null,
      delivery: preferDelivery(previous?.delivery, message.delivery),
    });
    idByNonce.set(key, message.id);
  }
  return [...byId.values()].sort(compareMessages);
}
