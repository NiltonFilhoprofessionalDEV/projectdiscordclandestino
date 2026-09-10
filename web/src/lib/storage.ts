const MIC_MUTED_KEY = "micMuted";
const VOICE_CHAT_OPEN_KEY = "voiceChatOpen";
const VOICE_ACTIVITY_KEY = "voiceActivityOn";
const DEVICE_AUDIO_INPUT_KEY = "device.audioinput";
const DEVICE_VIDEO_INPUT_KEY = "device.videoinput";
const DEVICE_AUDIO_OUTPUT_KEY = "device.audiooutput";

type FlagReader = Pick<Storage, "getItem">;
type FlagWriter = Pick<Storage, "setItem">;

export type DevicePrefs = {
  audioinput?: string;
  videoinput?: string;
  audiooutput?: string;
};

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

function readOptional(storage: FlagReader, key: string): string | undefined {
  const value = storage.getItem(key)?.trim();
  return value ? value : undefined;
}

export function readDevicePrefs(storage: FlagReader = localStorage): DevicePrefs {
  return {
    audioinput: readOptional(storage, DEVICE_AUDIO_INPUT_KEY),
    videoinput: readOptional(storage, DEVICE_VIDEO_INPUT_KEY),
    audiooutput: readOptional(storage, DEVICE_AUDIO_OUTPUT_KEY),
  };
}

export function writeDevicePrefs(prefs: DevicePrefs, storage: FlagWriter = localStorage): void {
  if (prefs.audioinput) {
    storage.setItem(DEVICE_AUDIO_INPUT_KEY, prefs.audioinput);
  }
  if (prefs.videoinput) {
    storage.setItem(DEVICE_VIDEO_INPUT_KEY, prefs.videoinput);
  }
  if (prefs.audiooutput) {
    storage.setItem(DEVICE_AUDIO_OUTPUT_KEY, prefs.audiooutput);
  }
}
