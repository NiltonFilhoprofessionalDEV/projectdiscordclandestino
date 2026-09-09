import { parseMessageText } from "./community.ts";

export { parseMessageText };
export const parseChatText = parseMessageText;

export type ChatPayload = {
  type: "chat";
  text: string;
  displayName: string;
};

export function parseChatPayload(data: unknown): ChatPayload | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  if (record.type !== "chat") {
    return null;
  }

  if (typeof record.text !== "string" || typeof record.displayName !== "string") {
    return null;
  }

  const text = parseMessageText(record.text);
  const name = record.displayName.replace(/\s+/g, " ").trim().slice(0, 32);

  if (!text.ok || !name) {
    return null;
  }

  return { type: "chat", text: text.value, displayName: name };
}
