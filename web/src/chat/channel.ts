import type { Channel } from "../../../shared/api.ts";
import type { ChannelId } from "../../../shared/community.ts";
import type { CenterSurface } from "../shell/selection.ts";

export function companionChatChannelId(
  surface: CenterSurface,
  activeTextChannelId: ChannelId | null,
  voiceChannel: Pick<Channel, "companionTextChannelId"> | null,
): ChannelId | null {
  if (surface === "text") {
    return activeTextChannelId;
  }
  if (surface === "voice") {
    return voiceChannel?.companionTextChannelId ?? null;
  }
  return null;
}
