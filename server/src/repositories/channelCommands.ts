import type { Channel, CreateChannelInput, UpdateChannelInput, ApiResult } from "../../../shared/api.ts";
import type { ChannelId } from "../../../shared/community.ts";
import type { Database } from "../../../shared/database.types.ts";
import { canManage } from "./access.ts";
import type { DbClient } from "./client.ts";
import { fail, mapRepositoryError } from "./errors.ts";
import { mapChannel } from "./mappers.ts";

export async function loadChannel(
  client: DbClient,
  channelId: string,
): Promise<ApiResult<Channel>> {
  const { data, error } = await client
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .maybeSingle();
  if (error) {
    return mapRepositoryError(error);
  }
  if (!data) {
    return fail("NOT_FOUND", "Canal não encontrado.");
  }
  return { ok: true, data: mapChannel(data) };
}

export async function createChannel(
  client: DbClient,
  _userId: string,
  communityId: string,
  input: CreateChannelInput,
): Promise<ApiResult<Channel>> {
  const { data, error } = await client.rpc("create_channel", {
    community_id: communityId,
    name: input.name,
    type: input.type,
  });
  if (error || !data) {
    if (error?.code === "42501") {
      return fail("FORBIDDEN", "Sem permissão para criar canais.");
    }
    return mapRepositoryError(error);
  }
  return { ok: true, data: mapChannel(data) };
}

export async function updateChannel(
  client: DbClient,
  channelId: string,
  input: UpdateChannelInput,
): Promise<ApiResult<Channel>> {
  const existing = await loadChannel(client, channelId);
  if (!existing.ok) {
    return existing;
  }
  if (!(await canManage(client, existing.data.communityId))) {
    return fail("FORBIDDEN", "Sem permissão para alterar canais.");
  }
  const patch: Database["public"]["Tables"]["channels"]["Update"] = {};
  if (input.name !== undefined) {
    patch.name = input.name;
  }
  if (input.position !== undefined) {
    patch.position = input.position;
  }
  const { data, error } = await client
    .from("channels")
    .update(patch)
    .eq("id", channelId)
    .select("*")
    .maybeSingle();
  if (error) {
    return mapRepositoryError(error);
  }
  if (!data) {
    return fail("NOT_FOUND", "Canal não encontrado.");
  }
  return { ok: true, data: mapChannel(data) };
}

export async function deleteChannel(
  client: DbClient,
  channelId: string,
): Promise<ApiResult<{ id: ChannelId }>> {
  const existing = await loadChannel(client, channelId);
  if (!existing.ok) {
    return existing;
  }
  if (!(await canManage(client, existing.data.communityId))) {
    return fail("FORBIDDEN", "Sem permissão para remover canais.");
  }
  const { error } = await client.from("channels").delete().eq("id", channelId);
  if (error) {
    return mapRepositoryError(error);
  }
  return { ok: true, data: { id: existing.data.id } };
}
