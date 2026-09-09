export type AuthMode = "signin" | "signup";

export function publicAuthMessage(message: string, mode: AuthMode) {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("provider is not enabled") ||
    normalized.includes("unsupported provider")
  ) {
    return "Google não está configurado neste ambiente.";
  }
  if (normalized.includes("invalid login") || normalized.includes("invalid_credentials")) {
    return "E-mail ou senha inválidos.";
  }
  if (normalized.includes("already registered") || normalized.includes("user already")) {
    return "Este e-mail já está em uso.";
  }
  return mode === "signup"
    ? "Não foi possível criar a conta. Tente de novo."
    : "Não foi possível entrar. Tente de novo.";
}
