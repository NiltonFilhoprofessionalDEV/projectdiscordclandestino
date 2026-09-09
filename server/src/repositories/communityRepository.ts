import type {
  Channel,
  Community,
  CommunityMembership,
  CommunitySummary,
  CreateChannelInput,
  CreateCommunityInput,
  CreateInviteInput,
  CreatedInvite,
  UpdateChannelInput,
  UpdateCommunityInput,
  VoiceAccess,
  ApiResult,
} from "../../../shared/api.ts";
import type { ChannelId, CommunityId } from "../../../shared/community.ts";
import { fail } from "./errors.ts";
import type { DbClient } from "./client.ts";
import {
  canJoinVoice as queryVoiceAccess,
  createCommunity as insertCommunity,
  getCommunity as loadCommunity,
  listCommunities as queryCommunities,
  listMemberVoiceChannels as queryMemberVoiceChannels,
  updateCommunity as patchCommunity,
} from "./communityQueries.ts";
import {
  createChannel as insertCommunityChannel,
  deleteChannel as removeChannel,
  updateChannel as patchChannel,
} from "./channelCommands.ts";
import {
  acceptInvite as acceptCommunityInvite,
  createInvite as insertInvite,
  revokeInvite as revokeCommunityInvite,
} from "./inviteCommands.ts";

export type CommunityRepository = {
  listCommunities(userId: string): Promise<ApiResult<CommunitySummary[]>>;
  createCommunity(
    userId: string,
    input: CreateCommunityInput,
  ): Promise<ApiResult<Community>>;
  getCommunity(
    userId: string,
    communityId: string,
  ): Promise<ApiResult<Community>>;
  updateCommunity(
    userId: string,
    communityId: string,
    input: UpdateCommunityInput,
  ): Promise<ApiResult<Community>>;
  createChannel(
    userId: string,
    communityId: string,
    input: CreateChannelInput,
  ): Promise<ApiResult<Channel>>;
  updateChannel(
    userId: string,
    channelId: string,
    input: UpdateChannelInput,
  ): Promise<ApiResult<Channel>>;
  deleteChannel(
    userId: string,
    channelId: string,
  ): Promise<ApiResult<{ id: ChannelId }>>;
  createInvite(
    userId: string,
    communityId: string,
    input: CreateInviteInput,
  ): Promise<ApiResult<CreatedInvite>>;
  revokeInvite(
    userId: string,
    inviteId: string,
  ): Promise<ApiResult<{ id: string }>>;
  acceptInvite(
    userId: string,
    rawToken: string,
  ): Promise<ApiResult<CommunityMembership>>;
  canJoinVoice(
    userId: string,
    channelId: string,
  ): Promise<ApiResult<VoiceAccess>>;
  listMemberVoiceChannels(
    userId: string,
    communityId: string,
  ): Promise<ApiResult<{ communityId: CommunityId; channelIds: ChannelId[] }>>;
};

export { deriveCommunitySlug } from "./mappers.ts";

function wrap<T>(op: string, run: () => Promise<ApiResult<T>>): Promise<ApiResult<T>> {
  return run().catch(() => {
    console.error("repository error", { op });
    return fail("INTERNAL", "Não foi possível concluir a operação.");
  });
}

export function createCommunityRepository(client: DbClient): CommunityRepository {
  return {
    listCommunities: (userId) =>
      wrap("listCommunities", () => queryCommunities(client, userId)),
    createCommunity: (_userId, input) =>
      wrap("createCommunity", () => insertCommunity(client, input)),
    getCommunity: (_userId, communityId) =>
      wrap("getCommunity", () => loadCommunity(client, communityId)),
    updateCommunity: (_userId, communityId, input) =>
      wrap("updateCommunity", () => patchCommunity(client, communityId, input)),
    createChannel: (userId, communityId, input) =>
      wrap("createChannel", () =>
        insertCommunityChannel(client, userId, communityId, input),
      ),
    updateChannel: (_userId, channelId, input) =>
      wrap("updateChannel", () => patchChannel(client, channelId, input)),
    deleteChannel: (_userId, channelId) =>
      wrap("deleteChannel", () => removeChannel(client, channelId)),
    createInvite: (userId, communityId, input) =>
      wrap("createInvite", () => insertInvite(client, userId, communityId, input)),
    revokeInvite: (_userId, inviteId) =>
      wrap("revokeInvite", () => revokeCommunityInvite(client, inviteId)),
    acceptInvite: (userId, rawToken) =>
      wrap("acceptInvite", () => acceptCommunityInvite(client, userId, rawToken)),
    canJoinVoice: (userId, channelId) =>
      wrap("canJoinVoice", () => queryVoiceAccess(client, userId, channelId)),
    listMemberVoiceChannels: (userId, communityId) =>
      wrap("listMemberVoiceChannels", () =>
        queryMemberVoiceChannels(client, userId, communityId),
      ),
  };
}
