import type { Channel } from "../../../shared/api.ts";

export function groupChannels(channels: Channel[]) {
  const sorted = channels
    .slice()
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, "pt-BR"));
  return {
    text: sorted.filter((item) => item.type === "text"),
    voice: sorted.filter((item) => item.type === "voice"),
  };
}
