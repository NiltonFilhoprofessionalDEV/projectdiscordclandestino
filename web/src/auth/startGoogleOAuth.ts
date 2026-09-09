import { supabase } from "../services/supabase.ts";
import { startGoogleSignIn as runGoogleSignIn } from "./googleOAuth.ts";

async function readAuthSettings(): Promise<unknown> {
  const url = import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, "");
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const response = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export async function startGoogleOAuth(): Promise<string | null> {
  try {
    return await runGoogleSignIn({
      readSettings: readAuthSettings,
      startOAuth: () =>
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/` },
        }),
    });
  } catch {
    return "Não foi possível entrar. Tente de novo.";
  }
}
