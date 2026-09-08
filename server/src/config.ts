function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

export const PORT = Number(env("PORT") || 8787);
export const APP_ORIGIN = env("APP_ORIGIN") || "http://localhost:5173";
export const LIVEKIT_URL = env("LIVEKIT_URL");
export const LIVEKIT_API_KEY = env("LIVEKIT_API_KEY");
export const LIVEKIT_API_SECRET = env("LIVEKIT_API_SECRET");

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
