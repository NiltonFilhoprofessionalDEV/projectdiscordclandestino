const DISPLAY_NAME_KEY = "displayName";
const MIC_MUTED_KEY = "micMuted";

export function readDisplayName(): string | null {
  const value = localStorage.getItem(DISPLAY_NAME_KEY);
  return value && value.trim() ? value : null;
}

export function writeDisplayName(name: string): void {
  localStorage.setItem(DISPLAY_NAME_KEY, name);
}

export function readMicMuted(): boolean {
  return localStorage.getItem(MIC_MUTED_KEY) === "true";
}

export function writeMicMuted(muted: boolean): void {
  localStorage.setItem(MIC_MUTED_KEY, String(muted));
}
