import { describe, expect, it } from "vitest";
import type { CommunitySummary } from "../../../shared/api.ts";
import type { CommunityId } from "../../../shared/community.ts";
import { filterExploreCommunities, partitionExploreCommunities } from "./lists.ts";

function community(
  overrides: Partial<CommunitySummary> & Pick<CommunitySummary, "id" | "name">,
): CommunitySummary {
  return {
    slug: overrides.name.toLowerCase(),
    visibility: "public",
    role: null,
    avatarUrl: null,
    ...overrides,
  };
}

describe("partitionExploreCommunities", () => {
  it("lists joined communities first and hides private communities unless the user is a member", () => {
    const joinedPrivate = community({
      id: "1" as CommunityId,
      name: "Turma",
      visibility: "private",
      role: "owner",
    });
    const publicOpen = community({
      id: "2" as CommunityId,
      name: "Salas",
      visibility: "public",
      role: null,
    });
    const leakedPrivate = community({
      id: "3" as CommunityId,
      name: "Secreta",
      visibility: "private",
      role: null,
    });
    const joinedPublic = community({
      id: "4" as CommunityId,
      name: "Devs",
      visibility: "public",
      role: "member",
    });

    const partitioned = partitionExploreCommunities([
      publicOpen,
      leakedPrivate,
      joinedPublic,
      joinedPrivate,
    ]);

    expect(partitioned.joined.map((item) => item.name)).toEqual(["Devs", "Turma"]);
    expect(partitioned.discoverable.map((item) => item.name)).toEqual(["Salas"]);
  });
});

describe("filterExploreCommunities", () => {
  it("filters joined and discoverable lists by name without leaking private non-member communities", () => {
    const joined = community({
      id: "1" as CommunityId,
      name: "Turma Alpha",
      role: "admin",
    });
    const discoverable = community({
      id: "2" as CommunityId,
      name: "Salas",
    });
    const other = community({
      id: "3" as CommunityId,
      name: "Outro public",
    });

    const filtered = filterExploreCommunities([joined, discoverable, other], "sal");

    expect(filtered.joined).toEqual([]);
    expect(filtered.discoverable.map((item) => item.name)).toEqual(["Salas"]);
  });
});
