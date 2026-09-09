import { parseDisplayName } from "../../../shared/displayName.ts";
import { supabase } from "../services/supabase.ts";
import { publicAuthMessage, type AuthMode } from "./authMessages.ts";

export type EmailAuthInput = {
  mode: AuthMode;
  email: string;
  password: string;
  displayName: string;
};

export type EmailAuthSuccess = {
  ok: true;
  notice: string | null;
};

export type EmailAuthFailure = {
  ok: false;
  error: string;
};

function parseEmail(raw: string) {
  const value = raw.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { ok: false as const, error: "Digite um e-mail válido." };
  }
  return { ok: true as const, value };
}

function parsePassword(raw: string) {
  if (raw.length < 6) {
    return { ok: false as const, error: "A senha deve ter pelo menos 6 caracteres." };
  }
  return { ok: true as const, value: raw };
}

export function validateEmailAuth(input: EmailAuthInput): EmailAuthFailure | {
  ok: true;
  email: string;
  password: string;
  displayName?: string;
} {
  const parsedEmail = parseEmail(input.email);
  if (!parsedEmail.ok) {
    return parsedEmail;
  }
  const parsedPassword = parsePassword(input.password);
  if (!parsedPassword.ok) {
    return parsedPassword;
  }
  if (input.mode === "signin") {
    return { ok: true, email: parsedEmail.value, password: parsedPassword.value };
  }
  const parsedName = parseDisplayName(input.displayName);
  if (!parsedName.ok) {
    return parsedName;
  }
  return {
    ok: true,
    email: parsedEmail.value,
    password: parsedPassword.value,
    displayName: parsedName.value,
  };
}

export async function submitEmailAuth(
  input: EmailAuthInput,
): Promise<EmailAuthSuccess | EmailAuthFailure> {
  const parsed = validateEmailAuth(input);
  if (!parsed.ok) {
    return parsed;
  }
  if (input.mode === "signup" && parsed.displayName) {
    const { data, error } = await supabase.auth.signUp({
      email: parsed.email,
      password: parsed.password,
      options: {
        data: { display_name: parsed.displayName },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      return { ok: false, error: publicAuthMessage(error.message, "signup") };
    }
    return {
      ok: true,
      notice: data.session ? null : "Conta criada. Verifique seu e-mail para entrar.",
    };
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.email,
    password: parsed.password,
  });
  if (error) {
    return { ok: false, error: publicAuthMessage(error.message, "signin") };
  }
  return { ok: true, notice: null };
}
