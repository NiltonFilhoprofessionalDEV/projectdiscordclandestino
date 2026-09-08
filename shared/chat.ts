import type { ParseResult } from "./displayName.ts";

const MAX_LENGTH = 500;

export type ChatPayload = {
  type: "chat";
  text: string;
  displayName: string;
};

export function parseChatText(raw: string): ParseResult {
  const value = raw.replace(/\s+/g, " ").trim();

  if (!value) {
    return { ok: false, error: "Digite uma mensagem." };
  }

  if (value.length > MAX_LENGTH) {
    return {
      ok: false,
      error: "A mensagem pode ter no máximo 500 caracteres.",
    };
  }

  if (/[<>]/.test(value) || /[\u0000-\u001F\u007F]/.test(value)) {
    return {
      ok: false,
      error: "A mensagem não pode conter caracteres inválidos.",
    };
  }

  return { ok: true, value };
}

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

  const text = parseChatText(record.text);
  const name = record.displayName.replace(/\s+/g, " ").trim().slice(0, 32);

  if (!text.ok || !name) {
    return null;
  }

  return { type: "chat", text: text.value, displayName: name };
}
