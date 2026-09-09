import type { Channel, Community } from "../../../shared/api.ts";
import type { ChannelId, CommunityId } from "../../../shared/community.ts";
import type { Database } from "../../../shared/database.types.ts";

type CommunityRow = Database["public"]["Tables"]["communities"]["Row"];
type ChannelRow = Database["public"]["Tables"]["channels"]["Row"];

export function deriveCommunitySlug(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "comunidade";
}

export function mapCommunity(row: CommunityRow): Community {
  return {
    id: row.id as CommunityId,
    ownerId: row.owner_id,
    name: row.name,
    slug: row.slug,
    visibility: row.visibility,
    createdAt: row.created_at,
  };
}

export function mapChannel(row: ChannelRow): Channel {
  return {
    id: row.id as ChannelId,
    communityId: row.community_id as CommunityId,
    name: row.name,
    type: row.type,
    position: row.position,
    companionTextChannelId: row.companion_text_channel_id as ChannelId | null,
  };
}
