import type { Channel } from "../../../shared/api.ts";

export type CenterSurface = "explore" | "text" | "voice";

export function centerSurfaceLabel(input: {
  surface: CenterSurface;
  textChannel: Channel | undefined;
  voiceChannel: Channel | undefined;
}): string {
  if (input.surface === "explore") {
    return "Explore";
  }
  if (input.surface === "text") {
    return input.textChannel ? `#${input.textChannel.name}` : "Texto";
  }
  return input.voiceChannel?.name ?? "Voz";
}
