import type {
  CommunityMembership,
  CreateInviteInput,
  CreatedInvite,
  ApiResult,
} from "../../../shared/api.ts";
import type { CommunityId } from "../../../shared/community.ts";
import { generateInviteToken, hashInviteToken } from "../invites/token.ts";
import { canManage } from "./access.ts";
import type { DbClient } from "./client.ts";
import { fail, mapRepositoryError } from "./errors.ts";

export async function createInvite(
  client: DbClient,
  userId: string,
  communityId: string,
  input: CreateInviteInput,
): Promise<ApiResult<CreatedInvite>> {
  if (!(await canManage(client, communityId))) {
    return fail("FORBIDDEN", "Sem permissão para criar convites.");
  }
  const { raw, hash } = generateInviteToken();
  const { data, error } = await client
    .from("invites")
    .insert({
      community_id: communityId,
      created_by: userId,
      token_hash: hash,
      expires_at: input.expiresAt ?? null,
      max_uses: input.maxUses ?? null,
    })
    .select("id, expires_at, max_uses")
    .single();
  if (error || !data) {
    return mapRepositoryError(error);
  }
  return {
    ok: true,
    data: {
      id: data.id,
      token: raw,
      expiresAt: data.expires_at,
      maxUses: data.max_uses,
    },
  };
}

export async function revokeInvite(
  client: DbClient,
  inviteId: string,
): Promise<ApiResult<{ id: string }>> {
  const { data, error } = await client
    .from("invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();
  if (error) {
    return mapRepositoryError(error);
  }
  if (!data) {
    return fail("NOT_FOUND", "Convite não encontrado.");
  }
  return { ok: true, data: { id: data.id } };
}

export async function acceptInvite(
  client: DbClient,
  userId: string,
  rawToken: string,
): Promise<ApiResult<CommunityMembership>> {
  const { data, error } = await client.rpc("accept_invite", {
    invite_token_hash: hashInviteToken(rawToken),
  });
  if (error || !data) {
    return mapRepositoryError(error);
  }
  const { data: membership, error: membershipError } = await client
    .from("community_members")
    .select("community_id, user_id, role")
    .eq("community_id", data)
    .eq("user_id", userId)
    .maybeSingle();
  if (membershipError || !membership) {
    return mapRepositoryError(membershipError);
  }
  return {
    ok: true,
    data: {
      communityId: membership.community_id as CommunityId,
      userId: membership.user_id,
      role: membership.role,
    },
  };
}
