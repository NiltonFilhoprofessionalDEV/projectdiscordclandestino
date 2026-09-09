import type {
  ChannelId,
  ChannelType,
  CommunityId,
  CommunityRole,
} from "./community.ts";

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ApiErrorCode; message: string } };

export type CommunityVisibility = "public" | "private";

export type CreateCommunityInput = {
  name: string;
  visibility: CommunityVisibility;
};

export type CreateChannelInput = {
  name: string;
  type: ChannelType;
};

export type UpdateChannelInput = {
  name?: string;
  position?: number;
};

export type CreateInviteInput = {
  expiresAt?: string | null;
  maxUses?: number | null;
};

export type AcceptInviteInput = {
  token: string;
};

export type LiveKitTokenInput = {
  channelId: ChannelId;
};

export type LiveKitTokenResponse = {
  token: string;
  url: string;
  roomName: string;
};

export type CommunitySummary = {
  id: CommunityId;
  name: string;
  slug: string;
  visibility: CommunityVisibility;
  role: CommunityRole | null;
};

export type Community = {
  id: CommunityId;
  ownerId: string;
  name: string;
  slug: string;
  visibility: CommunityVisibility;
  createdAt: string;
};

export type Channel = {
  id: ChannelId;
  communityId: CommunityId;
  name: string;
  type: ChannelType;
  position: number;
  companionTextChannelId: ChannelId | null;
};

export type CommunityMembership = {
  communityId: CommunityId;
  userId: string;
  role: CommunityRole;
};

export type CreatedInvite = {
  id: string;
  token: string;
  expiresAt: string | null;
  maxUses: number | null;
};

export type VoiceAccess = {
  communityId: CommunityId;
  channelId: ChannelId;
  displayName: string;
};
