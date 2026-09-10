import { describe, expect, it } from "vitest";
import {
  readDevicePrefs,
  readVoiceChatOpen,
  writeDevicePrefs,
  writeVoiceChatOpen,
} from "./storage.ts";

function memoryStorage(initial: Record<string, string> = {}): Pick<Storage, "getItem" | "setItem"> {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe("voiceChatOpen", () => {
  it("defaults to closed when the key is missing", () => {
    expect(readVoiceChatOpen(memoryStorage())).toBe(false);
  });

  it("persists the expanded choice as true", () => {
    const storage = memoryStorage();
    writeVoiceChatOpen(true, storage);
    expect(readVoiceChatOpen(storage)).toBe(true);
  });

  it("persists the collapsed choice as false", () => {
    const storage = memoryStorage({ voiceChatOpen: "true" });
    writeVoiceChatOpen(false, storage);
    expect(readVoiceChatOpen(storage)).toBe(false);
  });
});

describe("devicePrefs", () => {
  it("reads saved microphone and camera ids", () => {
    const storage = memoryStorage({
      "device.audioinput": "mic-1",
      "device.videoinput": "cam-2",
    });
    expect(readDevicePrefs(storage)).toEqual({
      audioinput: "mic-1",
      videoinput: "cam-2",
      audiooutput: undefined,
    });
  });

  it("writes device preferences", () => {
    const storage = memoryStorage();
    writeDevicePrefs(
      { audioinput: "mic-9", videoinput: "cam-9", audiooutput: "spk-9" },
      storage,
    );
    expect(readDevicePrefs(storage)).toEqual({
      audioinput: "mic-9",
      videoinput: "cam-9",
      audiooutput: "spk-9",
    });
  });
});
