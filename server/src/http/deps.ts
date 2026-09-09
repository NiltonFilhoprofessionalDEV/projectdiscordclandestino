import type { CommunityRepository } from "../repositories/communityRepository.ts";
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
  hasLiveKitCredentials: () => boolean;
  livekitUrl: string;
  allowRequest: (operation: string, key: string) => RateLimitResult;
};
