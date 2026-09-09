import type { DbClient } from "./client.ts";

export async function canManage(
  client: DbClient,
  communityId: string,
): Promise<boolean> {
  const { data, error } = await client.rpc("can_manage_community", {
    target: communityId,
  });
  return !error && Boolean(data);
}
