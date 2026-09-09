export function googleEnabledFromSettings(body: unknown): boolean {
  if (!body || typeof body !== "object") {
    return false;
  }
  const external = (body as { external?: unknown }).external;
  if (!external || typeof external !== "object") {
    return false;
  }
  return (external as { google?: unknown }).google === true;
}

export type GoogleSignInDeps = {
  readSettings: () => Promise<unknown>;
  startOAuth: () => Promise<{ error: { message: string } | null }>;
};

export async function startGoogleSignIn(
  deps: GoogleSignInDeps,
): Promise<string | null> {
  const settings = await deps.readSettings();
  if (!googleEnabledFromSettings(settings)) {
    return "Google não está configurado neste ambiente.";
  }
  const { error } = await deps.startOAuth();
  if (!error) {
    return null;
  }
  return googleAuthFailureMessage(error.message);
}

function googleAuthFailureMessage(message: string) {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("provider is not enabled") ||
    normalized.includes("unsupported provider")
  ) {
    return "Google não está configurado neste ambiente.";
  }
  return "Não foi possível entrar. Tente de novo.";
}
