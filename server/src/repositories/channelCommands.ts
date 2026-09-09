import type { Channel, CreateChannelInput, UpdateChannelInput, ApiResult } from "../../../shared/api.ts";
import type { ChannelId } from "../../../shared/community.ts";
import type { Database } from "../../../shared/database.types.ts";
import { canManage } from "./access.ts";
import type { DbClient } from "./client.ts";
import { fail, mapRepositoryError } from "./errors.ts";
import { mapChannel } from "./mappers.ts";

async function nextPosition(
  client: DbClient,
  communityId: string,
  type: "text" | "voice",
): Promise<number> {
  const { data } = await client
    .from("channels")
    .select("position")
    .eq("community_id", communityId)
    .eq("type", type)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.position ?? -1) + 1;
}

async function insertChannel(
  client: DbClient,
  values: Database["public"]["Tables"]["channels"]["Insert"],
): Promise<ApiResult<Channel>> {
  const { data, error } = await client
    .from("channels")
    .insert(values)
    .select("*")
    .single();
  if (error || !data) {
    return mapRepositoryError(error);
  }
  return { ok: true, data: mapChannel(data) };
}

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

async function insertTextChannel(
  client: DbClient,
  userId: string,
  communityId: string,
  name: string,
): Promise<ApiResult<Channel>> {
  return insertChannel(client, {
    community_id: communityId,
    name,
    type: "text",
    position: await nextPosition(client, communityId, "text"),
    created_by: userId,
  });
}

async function insertVoiceChannel(
  client: DbClient,
  userId: string,
  communityId: string,
  name: string,
): Promise<ApiResult<Channel>> {
  const companion = await insertChannel(client, {
    community_id: communityId,
    name: `chat-${name}`.slice(0, 48),
    type: "text",
    position: await nextPosition(client, communityId, "text"),
    created_by: userId,
  });
  if (!companion.ok) {
    return companion;
  }
  return insertChannel(client, {
    community_id: communityId,
    name,
    type: "voice",
    position: await nextPosition(client, communityId, "voice"),
    created_by: userId,
    companion_text_channel_id: companion.data.id,
  });
}

export async function createChannel(
  client: DbClient,
  userId: string,
  communityId: string,
  input: CreateChannelInput,
): Promise<ApiResult<Channel>> {
  if (!(await canManage(client, communityId))) {
    return fail("FORBIDDEN", "Sem permissão para criar canais.");
  }
  if (input.type === "voice") {
    return insertVoiceChannel(client, userId, communityId, input.name);
  }
  return insertTextChannel(client, userId, communityId, input.name);
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
