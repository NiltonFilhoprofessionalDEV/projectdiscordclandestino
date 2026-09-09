import { describe, expect, it } from "vitest";
import type { CommunitySummary } from "../../../shared/api.ts";
import type { CommunityId } from "../../../shared/community.ts";
import { canManageCommunity, isMemberShell } from "./roles.ts";

const summary = (role: CommunitySummary["role"]): CommunitySummary => ({
  id: "c1" as CommunityId,
  name: "Salas",
  slug: "salas",
  visibility: "public",
  role,
  avatarUrl: null,
  onlineCount: 0,
  activeRooms: [],
});

describe("canManageCommunity", () => {
  it("allows only owner and admin to see create controls", () => {
    expect(canManageCommunity("owner")).toBe(true);
    expect(canManageCommunity("admin")).toBe(true);
    expect(canManageCommunity("member")).toBe(false);
    expect(canManageCommunity(null)).toBe(false);
  });
});

describe("isMemberShell", () => {
  it("does not open a member shell for a public community without membership", () => {
    expect(isMemberShell(summary(null))).toBe(false);
    expect(isMemberShell(null)).toBe(false);
  });

  it("opens a member shell only when the user has a role", () => {
    expect(isMemberShell(summary("member"))).toBe(true);
    expect(isMemberShell(summary("admin"))).toBe(true);
  });
});
