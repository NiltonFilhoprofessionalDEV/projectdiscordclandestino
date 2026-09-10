import type { Room } from "livekit-client";
import {
  readDevicePrefs,
  writeDevicePrefs,
  type DevicePrefs,
} from "../lib/storage.ts";

export type DeviceKind = keyof DevicePrefs;

export async function listMediaDevices(): Promise<{
  audioinput: MediaDeviceInfo[];
  videoinput: MediaDeviceInfo[];
  audiooutput: MediaDeviceInfo[];
}> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return {
    audioinput: devices.filter((device) => device.kind === "audioinput"),
    videoinput: devices.filter((device) => device.kind === "videoinput"),
    audiooutput: devices.filter((device) => device.kind === "audiooutput"),
  };
}

export function activeOrSavedDeviceId(
  room: Room,
  kind: DeviceKind,
  saved: DevicePrefs,
): string {
  try {
    const active = room.getActiveDevice(kind);
    if (active) {
      return active;
    }
  } catch {
    // Some browsers throw before a track exists.
  }
  return saved[kind] ?? "";
}

/** Apply persisted device choices to the LiveKit room (best-effort). */
export async function applySavedDevices(room: Room): Promise<void> {
  const prefs = readDevicePrefs();
  const tasks: Array<Promise<unknown>> = [];
  if (prefs.audioinput) {
    tasks.push(room.switchActiveDevice("audioinput", prefs.audioinput));
  }
  if (prefs.videoinput) {
    tasks.push(room.switchActiveDevice("videoinput", prefs.videoinput));
  }
  if (prefs.audiooutput) {
    tasks.push(room.switchActiveDevice("audiooutput", prefs.audiooutput));
  }
  await Promise.allSettled(tasks);
}

export function saveDeviceSelection(next: DevicePrefs): void {
  writeDevicePrefs(next);
}
