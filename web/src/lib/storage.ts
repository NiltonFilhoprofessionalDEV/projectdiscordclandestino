const MIC_MUTED_KEY = "micMuted";
const VOICE_CHAT_OPEN_KEY = "voiceChatOpen";
const VOICE_ACTIVITY_KEY = "voiceActivityOn";

type FlagReader = Pick<Storage, "getItem">;
type FlagWriter = Pick<Storage, "setItem">;

export function readMicMuted(): boolean {
  return localStorage.getItem(MIC_MUTED_KEY) === "true";
}

export function writeMicMuted(muted: boolean): void {
  localStorage.setItem(MIC_MUTED_KEY, String(muted));
}

export function readVoiceActivityOn(storage: FlagReader = localStorage): boolean {
  const value = storage.getItem(VOICE_ACTIVITY_KEY);
  // Padrão: desligado — mute do usuário fica limpo; usuário liga o reconhecimento se quiser.
  return value === "true";
}

export function writeVoiceActivityOn(enabled: boolean, storage: FlagWriter = localStorage): void {
  storage.setItem(VOICE_ACTIVITY_KEY, String(enabled));
}

export function readVoiceChatOpen(storage: FlagReader = localStorage): boolean {
  return storage.getItem(VOICE_CHAT_OPEN_KEY) === "true";
}

export function writeVoiceChatOpen(open: boolean, storage: FlagWriter = localStorage): void {
  storage.setItem(VOICE_CHAT_OPEN_KEY, String(open));
}
