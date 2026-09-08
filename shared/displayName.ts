export type ParseResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

const MIN_LENGTH = 2;
const MAX_LENGTH = 32;

export function parseDisplayName(raw: string): ParseResult {
  const value = raw.replace(/\s+/g, " ").trim();

  if (value.length < MIN_LENGTH) {
    return {
      ok: false,
      error: "Digite um nome com pelo menos 2 caracteres.",
    };
  }

  if (value.length > MAX_LENGTH) {
    return {
      ok: false,
      error: "O nome pode ter no máximo 32 caracteres.",
    };
  }

  if (/[<>]/.test(value) || /[\u0000-\u001F\u007F]/.test(value)) {
    return {
      ok: false,
      error: "O nome não pode conter caracteres inválidos.",
    };
  }

  return { ok: true, value };
}

export function slugFromName(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  return slug || "user";
}

export function randomSuffix(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => (byte % 36).toString(36)).join("");
}

export function makeParticipantIdentity(displayName: string): string {
  return `${slugFromName(displayName)}-${randomSuffix()}`;
}
