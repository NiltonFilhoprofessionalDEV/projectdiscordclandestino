import type { ChannelId } from "../../../shared/community.ts";

export function needsVoiceSwitchConfirm(
  currentId: ChannelId | null,
  nextId: ChannelId,
): boolean {
  return currentId !== null && currentId !== nextId;
}

export function occupancyWithoutLocalElsewhere<T extends { identity: string }>(
  byChannel: Record<string, readonly T[]>,
  localUserId: string,
  activeVoiceChannelId: ChannelId | null,
): Record<string, T[]> {
  return Object.fromEntries(
    Object.entries(byChannel).map(([channelId, occupants]) => [
      channelId,
      occupants.filter(
        (occupant) =>
          occupant.identity !== localUserId || channelId === activeVoiceChannelId,
      ),
    ]),
  );
}
