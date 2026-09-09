import type {
  Community,
  CommunitySummary,
  VoiceAccess,
  ApiResult,
  CreateCommunityInput,
  UpdateCommunityInput,
} from "../../../shared/api.ts";
import type { ChannelId, CommunityId } from "../../../shared/community.ts";
import type { DbClient } from "./client.ts";
import { fail, mapRepositoryError } from "./errors.ts";
import { deriveCommunitySlug, mapCommunity } from "./mappers.ts";

export async function listCommunities(
  client: DbClient,
  userId: string,
): Promise<ApiResult<CommunitySummary[]>> {
  const [{ data: communities, error }, { data: memberships, error: membershipError }] =
    await Promise.all(
      [
        client.from("communities").select("id, name, slug, visibility, avatar_url").order("name"),
        client
          .from("community_members")
          .select("community_id, role")
          .eq("user_id", userId),
      ],
    );
  if (error) {
    return mapRepositoryError(error);
  }
  if (membershipError) {
    return mapRepositoryError(membershipError);
  }
  const roleByCommunity = new Map(
    (memberships ?? []).map((row) => [row.community_id, row.role]),
  );
  return {
    ok: true,
    data: (communities ?? []).map((row) => ({
      id: row.id as CommunityId,
      name: row.name,
      slug: row.slug,
      visibility: row.visibility,
      role: roleByCommunity.get(row.id) ?? null,
      avatarUrl: row.avatar_url ?? null,
      onlineCount: 0,
      activeRooms: [],
    })),
  };
}

export async function updateCommunity(
  client: DbClient,
  communityId: string,
  input: UpdateCommunityInput,
): Promise<ApiResult<Community>> {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.name !== undefined) {
    patch.name = input.name;
    patch.slug = deriveCommunitySlug(input.name);
  }
  if (input.visibility !== undefined) {
    patch.visibility = input.visibility;
  }
  if (input.avatarUrl !== undefined) {
    patch.avatar_url = input.avatarUrl;
  }
  const { data, error } = await client
    .from("communities")
    .update(patch)
    .eq("id", communityId)
    .select("*")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") {
      return fail("CONFLICT", "Já existe uma comunidade com esse nome.");
    }
    return mapRepositoryError(error);
  }
  if (!data) {
    return fail("FORBIDDEN", "Sem permissão para editar esta comunidade.");
  }
  return { ok: true, data: mapCommunity(data) };
}

export async function createCommunity(
  client: DbClient,
  input: CreateCommunityInput,
): Promise<ApiResult<Community>> {
  const { data, error } = await client.rpc("create_community", {
    name: input.name,
    slug: deriveCommunitySlug(input.name),
    visibility: input.visibility,
  });
  if (error || !data) {
    if (error?.code === "23505") {
      return fail("CONFLICT", "Já existe uma comunidade com esse nome.");
    }
    return mapRepositoryError(error);
  }
  return { ok: true, data: mapCommunity(data) };
}

export async function getCommunity(
  client: DbClient,
  communityId: string,
): Promise<ApiResult<Community>> {
  const { data, error } = await client
    .from("communities")
    .select("*")
    .eq("id", communityId)
    .maybeSingle();
  if (error) {
    return mapRepositoryError(error);
  }
  if (!data) {
    return fail("NOT_FOUND", "Comunidade não encontrada.");
  }
  return { ok: true, data: mapCommunity(data) };
}

export async function canJoinVoice(
  client: DbClient,
  userId: string,
  channelId: string,
): Promise<ApiResult<VoiceAccess>> {
  const { data: channel, error } = await client
    .from("channels")
    .select("id, community_id, type")
    .eq("id", channelId)
    .maybeSingle();
  if (error) {
    return mapRepositoryError(error);
  }
  if (!channel) {
    return fail("NOT_FOUND", "Canal não encontrado.");
  }
  if (channel.type !== "voice") {
    return fail("FORBIDDEN", "Canal de voz inválido.");
  }
  const { data: member } = await client
    .from("community_members")
    .select("user_id")
    .eq("community_id", channel.community_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!member) {
    return fail("NOT_FOUND", "Canal não encontrado.");
  }
  const { data: profile } = await client
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  return {
    ok: true,
    data: {
      communityId: channel.community_id as CommunityId,
      channelId: channel.id as ChannelId,
      displayName: profile?.display_name?.trim() || "Usuário",
    },
  };
}

export async function listMemberVoiceChannels(
  client: DbClient,
  userId: string,
  communityId: string,
): Promise<ApiResult<{ communityId: CommunityId; channelIds: ChannelId[] }>> {
  const { data: member, error: memberError } = await client
    .from("community_members")
    .select("user_id")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();
  if (memberError) {
    return mapRepositoryError(memberError);
  }
  if (!member) {
    return fail("FORBIDDEN", "Você não é membro desta comunidade.");
  }
  const { data: channels, error } = await client
    .from("channels")
    .select("id")
    .eq("community_id", communityId)
    .eq("type", "voice")
    .order("position", { ascending: true });
  if (error) {
    return mapRepositoryError(error);
  }
  return {
    ok: true,
    data: {
      communityId: communityId as CommunityId,
      channelIds: (channels ?? []).map((row) => row.id as ChannelId),
    },
  };
}
