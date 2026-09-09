function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

export const PORT = Number(env("PORT") || 8787);
export const APP_ORIGIN = env("APP_ORIGIN") || "http://localhost:5173";
export const LIVEKIT_URL = env("LIVEKIT_URL");
export const LIVEKIT_API_KEY = env("LIVEKIT_API_KEY");
export const LIVEKIT_API_SECRET = env("LIVEKIT_API_SECRET");
export const SUPABASE_URL = env("SUPABASE_URL");
export const SUPABASE_SECRET_KEY = env("SUPABASE_SECRET_KEY");
export const SUPABASE_PUBLISHABLE_KEY =
  env("SUPABASE_PUBLISHABLE_KEY") || env("SUPABASE_ANON_KEY");

export function corsOrigins(): string[] {
  const configured = APP_ORIGIN.split(",").map((item) => item.trim()).filter(Boolean);
  const extra = ["http://localhost:5173", "http://127.0.0.1:5173"];
  return [...new Set([...configured, ...extra])];
}

export function resolveCorsOrigin(origin: string | undefined): string {
  const allowed = corsOrigins();
  if (!origin) {
    return allowed[0];
  }
  if (allowed.includes(origin) || origin.endsWith(".vercel.app")) {
    return origin;
  }
  return allowed[0];
}

const PLACEHOLDER_SECRET = /^[•*x]+$/i;

export function hasLiveKitCredentials(): boolean {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return false;
  }
  if (PLACEHOLDER_SECRET.test(LIVEKIT_API_SECRET)) {
    return false;
  }
  if (LIVEKIT_URL.includes("your-project")) {
    return false;
  }
  return true;
}

export function livekitHttpHost(wsUrl: string): string {
  return wsUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
}
