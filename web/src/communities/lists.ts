import type { CommunitySummary } from "../../../shared/api.ts";

export function partitionExploreCommunities(communities: CommunitySummary[]) {
  const joined = communities
    .filter((item) => item.role !== null)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const discoverable = communities
    .filter((item) => item.visibility === "public" && item.role === null)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return { joined, discoverable };
}

export function filterExploreCommunities(communities: CommunitySummary[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const partitioned = partitionExploreCommunities(communities);
  if (!normalized) {
    return partitioned;
  }
  const matches = (item: CommunitySummary) =>
    item.name.toLocaleLowerCase("pt-BR").includes(normalized);
  return {
    joined: partitioned.joined.filter(matches),
    discoverable: partitioned.discoverable.filter(matches),
  };
}
