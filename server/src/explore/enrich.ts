import type { CommunitySummary } from "../../../shared/api.ts";
import { attachExplorePresence } from "../../../shared/exploreActivity.ts";
import type { AppDeps } from "../http/deps.ts";

export async function enrichListedCommunities(
  summaries: CommunitySummary[],
  deps: Pick<AppDeps, "listExploreActivity" | "listVoiceOccupants">,
): Promise<CommunitySummary[]> {
  if (summaries.length === 0) {
    return summaries;
  }

  let activity;
  try {
    activity = await deps.listExploreActivity(summaries.map((item) => item.id));
  } catch {
    return summaries;
  }
  if (!activity.ok) {
    return summaries;
  }

  const occupantsByChannel: Record<string, unknown[]> = {};
  const idsByCommunity = new Map<string, string[]>();
  for (const channel of activity.data.voiceChannels) {
    const list = idsByCommunity.get(channel.communityId) ?? [];
    list.push(channel.channelId);
    idsByCommunity.set(channel.communityId, list);
  }

  await Promise.all(
    [...idsByCommunity.entries()].map(async ([communityId, channelIds]) => {
      const found = await deps.listVoiceOccupants(communityId, channelIds);
      for (const [channelId, occupants] of Object.entries(found)) {
        occupantsByChannel[channelId] = occupants;
      }
    }),
  );

  return attachExplorePresence(
    summaries,
    activity.data.members,
    activity.data.voiceChannels,
    occupantsByChannel,
  );
}
