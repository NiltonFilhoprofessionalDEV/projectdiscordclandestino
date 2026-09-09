import type { CommunityRepository } from "../repositories/communityRepository.ts";
import type { RateLimitResult } from "../rateLimit.ts";
import type { RequireUser } from "./auth.ts";

export type AppDeps = {
  requireUser: RequireUser;
  getRepository: (accessToken: string) => CommunityRepository;
  issueLiveKitToken: (
    identity: string,
    displayName: string,
    roomName: string,
  ) => Promise<string>;
  hasLiveKitCredentials: () => boolean;
  livekitUrl: string;
  allowRequest: (operation: string, key: string) => RateLimitResult;
};
