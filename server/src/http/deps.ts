import type { ApiResult } from "../../../shared/api.ts";
import type { CommunityRepository } from "../repositories/communityRepository.ts";
import type { ExploreActivity } from "../repositories/exploreActivity.ts";
import type { RateLimitResult } from "../rateLimit.ts";
import type { RequireUser } from "./auth.ts";
import type { VoiceRoomOccupant } from "../livekit.ts";

export type AppDeps = {
  requireUser: RequireUser;
  getRepository: (accessToken: string) => CommunityRepository;
  issueLiveKitToken: (
    identity: string,
    displayName: string,
    roomName: string,
  ) => Promise<string>;
  listVoiceOccupants: (
    communityId: string,
    channelIds: readonly string[],
  ) => Promise<Record<string, VoiceRoomOccupant[]>>;
  listExploreActivity: (
    communityIds: readonly string[],
  ) => Promise<ApiResult<ExploreActivity>>;
  hasLiveKitCredentials: () => boolean;
  livekitUrl: string;
  allowRequest: (operation: string, key: string) => RateLimitResult;
};
