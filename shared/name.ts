export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 32;

const FORBIDDEN = /[<>\\/`]/;

export type NameValidation =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function validateDisplayName(raw: unknown): NameValidation {
  if (typeof raw !== "string") {
    return { ok: false, error: "Informe um nome." };
  }

  const value = raw.replace(/\s+/g, " ").trim();

  if (value.length < DISPLAY_NAME_MIN) {
    return { ok: false, error: "O nome precisa ter pelo menos 2 caracteres." };
  }

  if (value.length > DISPLAY_NAME_MAX) {
    return { ok: false, error: "O nome pode ter no máximo 32 caracteres." };
  }

  if (FORBIDDEN.test(value) || /[\u0000-\u001F\u007F]/.test(value)) {
    return { ok: false, error: "O nome contém caracteres não permitidos." };
  }

  return { ok: true, value };
}

export function slugIdentity(displayName: string, suffix: string): string {
  const slug = displayName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);

  return `${slug || "pessoa"}-${suffix}`;
}
