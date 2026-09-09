import { describe, expect, it } from "vitest";
import { canManageCommunity } from "./roles.ts";

describe("canManageCommunity", () => {
  it("allows only owner and admin to see create controls", () => {
    expect(canManageCommunity("owner")).toBe(true);
    expect(canManageCommunity("admin")).toBe(true);
    expect(canManageCommunity("member")).toBe(false);
    expect(canManageCommunity(null)).toBe(false);
  });
});
