const MIC_MUTED_KEY = "micMuted";

export function readMicMuted(): boolean {
  return localStorage.getItem(MIC_MUTED_KEY) === "true";
}

export function writeMicMuted(muted: boolean): void {
  localStorage.setItem(MIC_MUTED_KEY, String(muted));
}
